const db = require("../db");

// Get rooms for the agent or all active rooms
const getRooms = (req, res) => {
  const agentId = req.query.agent_id;

  let sql;
  let params = [];

  if (agentId) {
    // Filter rooms joined by this agent
    sql = `
      SELECT r.id, r.type, r.created_by, r.created_at, r.status
      FROM room r
      JOIN room_participants rp ON r.id = rp.room_id
      WHERE rp.user_id = ? AND r.status IN ('active', 'open')
      ORDER BY r.created_at DESC
    `;
    params = [agentId];
  } else {
    // Fallback: all open/active rooms
    sql = `
      SELECT id, type, created_by, created_at, status
      FROM room
      WHERE status IN ('active', 'open')
      ORDER BY created_at DESC
    `;
  }

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// Get all messages from a specific room
const getMessages = (req, res) => {
  const roomId = req.params.roomId;

  const sql = `
    SELECT m.id, m.message, m.created_at, m.sender_id
    FROM messages m
    JOIN conversation c ON m.conversation_id = c.id
    WHERE c.room_id = ?
    ORDER BY m.created_at ASC
  `;

  db.query(sql, [roomId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

module.exports = {
  getRooms,
  getMessages,
};
