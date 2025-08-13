const express = require("express");
const router = express.Router();
const db = require("../db");

// POST /api/agent/create-room
router.post("/", (req, res) => {
  const { id, type, created_by } = req.body;

  if (!id || !type || !created_by) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const sql = `
    INSERT INTO room (id, type, created_by, status, created_at)
    VALUES (?, ?, ?, 'active', NOW())
  `;

  db.query(sql, [id, type, created_by], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    // Add the creator as a participant
    const participantSQL = `
      INSERT INTO room_participants (room_id, user_id)
      VALUES (?, ?)
    `;
    db.query(participantSQL, [id, created_by], (err2) => {
      if (err2) console.error("Error adding participant:", err2);

      res.json({
        id,
        type,
        created_by,
        status: "active",
        created_at: new Date(),
      });
    });
  });
});

module.exports = router;
