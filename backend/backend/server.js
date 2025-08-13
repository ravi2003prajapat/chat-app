const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");
const db = require("./db");

const app = express();
const server = http.createServer(app);

const authCustomerRoutes = require("./routes/authCustomer");
const authAgentRoutes = require("./routes/authAgent");
const agentRoomsRoutes = require("./routes/agentRooms");

app.use(cors());
app.use(express.json());
app.use("/api/customer/auth", authCustomerRoutes);
app.use("/api/agent/auth", authAgentRoutes);
app.use("/api/agent/rooms", agentRoomsRoutes);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`⚡ Connected: ${socket.id}`);

  socket.on("identify", (providedUserId) => {
    socket.userId = providedUserId || uuidv4();
    console.log(`👤 User identified: ${socket.userId}`);
    checkAndInsertUser(socket.userId);
  });

  socket.on("join_room", (roomId) => {
    if (socket.currentRoom) socket.leave(socket.currentRoom);
    socket.join(roomId);
    socket.currentRoom = roomId;
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on("joinAgentRoom", (agentId) => {
    socket.join(`agent_${agentId}`);
    console.log(`Agent ${agentId} joined agent room`);
  });

  // --- Load chat history ---
  socket.on("loadHistory", (roomId) => {
    const sql = `
      SELECT m.id, m.message, m.sender_id, m.conversation_id, r.id AS room_id, m.created_at
      FROM messages m
      JOIN conversation c ON m.conversation_id = c.id
      JOIN room r ON c.room_id = r.id
      WHERE r.id = ?
      ORDER BY m.created_at ASC
    `;
    db.query(sql, [roomId], (err, results) => {
      if (err) {
        console.error("DB error (load history):", err);
        return;
      }
      socket.emit("history", results);
    });
  });

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

          socket.join(roomId);
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
          socket
            .to(`agent_${agent.id}`)
            .emit("newRoom", {
              roomId,
              type: "support",
              status: "open",
              createdAt: new Date(),
            });
        });
      });
    }
  });

  socket.on("disconnect", () => {
    console.log(`Disconnected: ${socket.id}`);
  });
});

function checkAndInsertUser(userId) {
  const email = `user_${userId}@example.com`;

  db.query("SELECT * FROM users WHERE id = ?", [userId], (err, results) => {
    if (err) return console.error("DB error (check user):", err);

    db.query(
      "INSERT IGNORE INTO users (id, username, email) VALUES (?,?,?)",
      [userId, "New User", email],
      (err) => {
        if (err) console.error("DB error (insert user):", err);
      }
    );
  });
}

const PORT = 5000;
server.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);
