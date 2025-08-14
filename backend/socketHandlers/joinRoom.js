function handleJoinRoom(socket) {
  socket.on("join_room", (roomId) => {
    if (socket.currentRoom) socket.leave(socket.currentRoom);
    socket.join(roomId);
    socket.currentRoom = roomId;
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });
}

module.exports = handleJoinRoom;
