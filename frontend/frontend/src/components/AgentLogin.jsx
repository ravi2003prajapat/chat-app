// src/components/AgentLogin.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import axios from "axios";
import "./AgentLogin.css";

export default function AgentLogin() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post("/api/agent/auth/login", {
        email,
        password,
      });

      // Assuming backend responds with { userId, role }
      login({ userId: res.data.userId, role: res.data.role });
      navigate("/agent", { replace: true });
    } catch (err) {
      console.error("Login failed:", err);
      alert("Login failed. Please check your credentials.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="agent-login-container">
      <h2>Agent Login</h2>
      <input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        placeholder="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button type="submit">Login</button>
    </form>
  );
}
