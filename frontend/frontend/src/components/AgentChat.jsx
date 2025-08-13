import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import { useAuth } from "../components/AuthContext";
import axios from "axios";
import "./AgentChat.css";

const socket = io(import.meta.env.VITE_SOCKET_SERVER, {
  transports: ["websocket"],
});

function AgentChat({ roomId }) {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const chatBoxRef = useRef();

  useEffect(() => {
    if (!user || !roomId) return;

    socket.emit("identify", user.userId);
    socket.emit("join_room", roomId); // ✅ Ensure agent joins room immediately

    let isMounted = true;

    // Load existing history
    axios
      .get(`/api/agent/rooms/${roomId}/messages`)
      .then((res) => {
        if (isMounted) setChat(res.data || []);
      })
      .catch(console.error);

    const handleReceive = (data) => {
      if (String(data.room_id) === String(roomId)) {
        setChat((prev) => [...prev, data]);
      }
    };

    socket.on("receiveMessage", handleReceive);

    return () => {
      isMounted = false;
      socket.off("receiveMessage", handleReceive);
      socket.emit("leave_room", roomId);
    };
  }, [user, roomId]);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chat]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !user) return;

    const conversationId = chat.length > 0 ? chat[0].conversation_id : null;

    const newMsg = {
      sender_id: user.userId,
      message: message.trim(),
      room_id: Number(roomId),
      conversation_id: conversationId,
    };

    // ✅ Append immediately on agent side
    setChat((prev) => [...prev, newMsg]);

    // ✅ Send to server
    socket.emit("send_message", newMsg);

    setMessage("");
  };

  return (
    <div className="chat-container">
      <h3>
        {user?.username || "Agent"} <span className="role">Agent</span>
      </h3>
      <div className="chat-box" ref={chatBoxRef}>
        {chat.map((msg, idx) => (
          <div
            key={idx}
            className={`chat-message ${
              String(msg.sender_id) === String(user.userId)
                ? "from-me"
                : "from-others"
            }`}
          >
            {msg.message}
          </div>
        ))}
      </div>
      <form className="chat-form" onSubmit={sendMessage}>
        <input
          className="chat-input"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit" className="chat-send">
          Send
        </button>
      </form>
    </div>
  );
}

export default AgentChat;
