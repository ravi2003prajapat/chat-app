import React, { useState } from "react";
import RoomsList from "./RoomsList";
import AgentChat from "./AgentChat";
import "./AgentPanel.css";

export default function AgentPanel() {
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  console.log("selectedRoomId", selectedRoomId);
  
  return (
    <div className="dual-chat-container">
      <div className="rooms-pane">
        <RoomsList onRoomSelect={(roomId) => setSelectedRoomId(roomId)} />
      </div>
      <div className="chat-pane">
        {selectedRoomId ? (
          <AgentChat roomId={selectedRoomId} />
        ) : (
          <div style={{ color: "#999", padding: "20px" }}>
            Select a room to start chatting
          </div>
        )}
      </div>
    </div>
  );
}
