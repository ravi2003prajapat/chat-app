function handleJoinAgentRoom(socket) {
  socket.on("joinAgentRoom", (agentId) => {
    socket.join(`agent_${agentId}`);
    console.log(`Agent ${agentId} joined agent room`);
  });
}

module.exports = handleJoinAgentRoom;
