const express = require("express");
const router = express.Router();
const agentRoomsController = require("../controllers/agentRoomsController");

// Routes
router.get("/", agentRoomsController.getRooms);
router.get("/:roomId/messages", agentRoomsController.getMessages);

module.exports = router;
