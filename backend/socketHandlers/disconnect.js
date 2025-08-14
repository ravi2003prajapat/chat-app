function handleDisconnect(socket) {
  socket.on("disconnect", () => {
    console.log(`Disconnected: ${socket.id}`);
  });
}

module.exports = handleDisconnect;
