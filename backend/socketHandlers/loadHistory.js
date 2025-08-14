const db = require("../db");

function handleLoadHistory(socket) {
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
}

module.exports = handleLoadHistory;
