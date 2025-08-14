const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const authCustomerRoutes = require("./routes/authCustomer");
const authAgentRoutes = require("./routes/authAgent");
const agentRoomsRoutes = require("./routes/agentRooms");

const handleIdentify = require("./socketHandlers/identify");
const handleJoinRoom = require("./socketHandlers/joinRoom");
const handleJoinAgentRoom = require("./socketHandlers/joinAgentRoom");
const handleLoadHistory = require("./socketHandlers/loadHistory");
const handleSendMessage = require("./socketHandlers/sendMessage");
const handleDisconnect = require("./socketHandlers/disconnect");

const app = express();
const server = http.createServer(app);

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

  // Attach all socket event handlers here
  handleIdentify(socket);
  handleJoinRoom(socket);
  handleJoinAgentRoom(socket);
  handleLoadHistory(socket);
  handleSendMessage(io, socket);
  handleDisconnect(socket);
});

const PORT = 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
