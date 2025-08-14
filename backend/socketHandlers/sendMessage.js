const db = require("../db");

function handleSendMessage(io, socket) {
  socket.on("send_message", (data) => {
    const { message, sender_id, room_id } = data;

    if (!room_id) {
      // Customer sending: find or create room by created_by = sender_id
      const findRoomSQL = `
        SELECT r.id AS room_id, c.id AS conversation_id
        FROM room r
        LEFT JOIN conversation c ON r.id = c.room_id
        WHERE r.created_by = ?
        ORDER BY r.created_at DESC
        LIMIT 1
      `;
      return db.query(findRoomSQL, [sender_id], (err, results) => {
        if (err) return console.error("DB error (find room):", err);

        if (results.length > 0 && results[0].conversation_id) {
          handleMessage(results[0].room_id, results[0].conversation_id);
        } else if (results.length > 0) {
          createConversation(results[0].room_id, (convId) =>
            handleMessage(results[0].room_id, convId)
          );
        } else {
          createRoom(sender_id, (newRoomId) => {
            createConversation(newRoomId, (convId) => {
              addCustomerToRoom(newRoomId, sender_id, () =>
                handleMessage(newRoomId, convId)
              );
            });
          });
        }
      });
    } else {
      // Agent sending: have room_id
      db.query(
        `SELECT id FROM conversation WHERE room_id = ? LIMIT 1`,
        [room_id],
        (err, results) => {
          if (err) return console.error("DB error (find conv):", err);

          if (results.length > 0) {
            handleMessage(room_id, results[0].id);
          } else {
            createConversation(room_id, (convId) =>
              handleMessage(room_id, convId)
            );
          }
        }
      );
    }

    function handleMessage(roomId, conversationId) {
      // Join the room before inserting and emitting message
      socket.join(roomId);

      const insertMsgSQL = `
    INSERT INTO messages (message, sender_id, conversation_id)
    VALUES (?, ?, ?)
  `;
      db.query(
        insertMsgSQL,
        [message, sender_id, conversationId],
        (err, result) => {
          if (err) return console.error("DB error (insert msg):", err);

          const newMsg = {
            id: result.insertId,
            message,
            sender_id,
            conversation_id: conversationId,
            room_id: roomId,
            created_at: new Date(),
          };

          // Emit message to all sockets in the room (including sender)
          io.to(roomId.toString()).emit("receiveMessage", newMsg);

          // Notify sender with ack callback
          if (socket && typeof data.callback === "function") {
            data.callback(newMsg);
          }

          if (!data.room_id) {
            socket.emit("joinedRoom", roomId.toString());
            notifyAgentsAboutNewRoom(roomId);
          }
        }
      );
    }

    function createRoom(createdBy, cb) {
      db.query(
        `INSERT INTO room (type, status, created_by) VALUES ('support','open',?)`,
        [createdBy],
        (err, result) => {
          if (err) return console.error("DB error (create room):", err);
          cb(result.insertId);
        }
      );
    }

    function createConversation(roomId, cb) {
      db.query(
        `INSERT INTO conversation (room_id) VALUES (?)`,
        [roomId],
        (err, res) => {
          if (err) return console.error("DB error (create conv):", err);
          cb(res.insertId);
        }
      );
    }

    function addCustomerToRoom(roomId, userId, cb) {
      db.query(
        `INSERT INTO room_participants (room_id, user_id) VALUES (?,?)`,
        [roomId, userId],
        (err) => {
          if (err) console.error("DB error (add participant):", err);
          cb();
        }
      );
    }

    function notifyAgentsAboutNewRoom(roomId) {
      db.query(`SELECT id FROM users WHERE role='agent'`, (err, agents) => {
        if (err) return console.error("DB error (get agents):", err);
        agents.forEach((agent) => {
          socket.to(`agent_${agent.id}`).emit("newRoom", {
            roomId,
            type: "support",
            status: "open",
            createdAt: new Date(),
          });
        });
      });
    }
  });
}

module.exports = handleSendMessage;
