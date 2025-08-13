import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import { useAuth } from "../components/AuthContext";
import "./CustomerChat.css";

const socket = io(import.meta.env.VITE_SOCKET_SERVER, {
  transports: ["websocket"],
});

function CustomerChat() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [roomId, setRoomId] = useState(null);
  const chatBoxRef = useRef();

  useEffect(() => {
    if (!user) return;

    socket.emit("identify", user.userId);

    // Listen for room assigned by server
    socket.on("joinedRoom", (newRoomId) => {
      setRoomId(newRoomId);
      socket.emit("join_room", newRoomId);
    });

    // Listen for incoming messages
    const handleReceive = (data) => {
      if (!data.room_id) return;
      if (!roomId || Number(data.room_id) === Number(roomId)) {
        setChat((prev) => [...prev, data]);
      }
    };
    socket.on("receiveMessage", handleReceive);

    return () => {
      socket.off("joinedRoom");
      socket.off("receiveMessage", handleReceive);
    };
  }, [user, roomId]);

  // Auto-scroll
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chat]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim() || !user) return;

    socket.emit(
        "send_message",
        {
            sender_id: user.userId,
            message: message.trim(),
            room_id: roomId ? Number(roomId) : null,
        },
        (savedMessage) => {
            // Always update chat immediately from server callback
            if (savedMessage) {
                setRoomId(savedMessage.room_id); // set roomId if first message
                setChat((prev) => [...prev, savedMessage]);
            }
        }
    );

    setMessage("");
};


  if (!user) return <div>Loading...</div>;

  return (
    <div className="chat-container">
      <h3>
        {user.username} <span className="role">Customer</span>
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

export default CustomerChat;
