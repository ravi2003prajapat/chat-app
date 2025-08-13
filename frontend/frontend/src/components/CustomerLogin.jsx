// src/components/CustomerLogin.jsx
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import "./CustomerLogin.css";

export default function CustomerLogin() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        "http://localhost:5000/api/customer/auth/login",
        {
          email,
          password,
        }
      );

      // Assuming backend responds with { userId, role }
      login({ userId: res.data.userId, role: res.data.role });
      navigate("/customer", { replace: true });
    } catch (err) {
      console.error("Login failed:", err);
      alert("Login failed. Please check your credentials.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="customer-login-container">
      <h2>Customer Login</h2>
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
        autoComplete="current-password" // Adds the recommended attribute
      />

      <button type="submit">Login</button>
    </form>
  );
}
