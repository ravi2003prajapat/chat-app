import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import axios from "axios";
import { io } from "socket.io-client";
import "./RoomsList.css";

let socket;

export default function RoomsList({ onRoomSelect }) {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newRoomData, setNewRoomData] = useState({
    roomId: "",
    type: "private",
  });

  useEffect(() => {
    if (!user) return;

    // Fetch current rooms for agent
    axios
      .get(`/api/agent/rooms?agent_id=${user.userId}`)
      .then((res) => setRooms(res.data))
      .catch(console.error);

    // Connect socket
    socket = io("http://localhost:5000");

    // Join agent room for updates
    socket.emit("joinAgentRoom", user.userId);

    // Listen for real-time newRoom event
    socket.on("newRoom", (room) => {
      setRooms((prevRooms) => {
        const exists = prevRooms.some(
          (r) => r.id === room.roomId || r.room_id === room.roomId
        );
        if (!exists) {
          return [
            ...prevRooms,
            {
              id: room.roomId,
              type: room.type,
              created_at: room.createdAt,
              status: room.status,
            },
          ];
        }
        return prevRooms;
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  // Handle create room form submit
  const handleCreateRoom = async () => {
    try {
      const res = await axios.post("/api/agent/create-room", {
        id: newRoomData.roomId,
        type: newRoomData.type,
        created_by: user.userId,
      });

      const createdRoom = res.data;

      setRooms((prevRooms) => [
        ...prevRooms,
        {
          id: createdRoom.id,
          type: createdRoom.type,
          created_at: createdRoom.created_at,
          status: createdRoom.status,
        },
      ]);

      setShowModal(false);
      setNewRoomData({ roomId: "", type: "private" });
    } catch (err) {
      console.error("Error creating room:", err);
    }
  };

  return (
    <div className="rooms-container">
      <h2 className="rooms-title">Rooms</h2>
      {rooms.length === 0 ? (
        <p className="no-rooms">No active chats yet</p>
      ) : (
        <div className="room-list">
          {rooms.map((room) => (
            <div
              key={room.id || room.room_id}
              className="room-card"
              onClick={() => onRoomSelect(room.id || room.room_id)}
            >
              <h3>Room #{room.id || room.room_id}</h3>
              <p>
                <strong>Type:</strong> {room.type}
              </p>
              <p>
                <strong>Created:</strong>{" "}
                {new Date(room.created_at || room.createdAt).toLocaleString()}
              </p>
              <p>
                <strong>Status:</strong> {room.status}
              </p>
            </div>
          ))}

          {/* Create Room Card */}
          <div
            className="room-card create-room-card"
            onClick={() => setShowModal(true)}
          >
            <h3>➕ Create New Room</h3>
          </div>
        </div>
      )}

      {/* Modal for Creating Room */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Create Room</h2>
            <input
              type="text"
              placeholder="Room ID"
              value={newRoomData.roomId}
              onChange={(e) =>
                setNewRoomData({ ...newRoomData, roomId: e.target.value })
              }
            />
            <select
              value={newRoomData.type}
              onChange={(e) =>
                setNewRoomData({ ...newRoomData, type: e.target.value })
              }
            >
              <option value="private">Private</option>
              <option value="support">Support</option>
              <option value="group">Group</option>
            </select>
            <div className="modal-buttons">
              <button onClick={handleCreateRoom}>Create</button>
              <button onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
