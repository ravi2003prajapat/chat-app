import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import CustomerChat from "./components/CustomerChat";
import AgentChat from "./components/AgentChat";
import AgentPanel from "./components/AgentPanel"; // Import here
import { AuthProvider } from "./components/AuthContext";
import CustomerLogin from "./components/CustomerLogin";
import AgentLogin from "./components/AgentLogin";
import { ProtectedRoute } from "./components/ProtectedRoute";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/customer-login" replace />} />
          <Route path="/customer-login" element={<CustomerLogin />} />
          <Route path="/agent-login" element={<AgentLogin />} />

          <Route
            path="/customer"
            element={
              <ProtectedRoute role="customer">
                <CustomerChat />
              </ProtectedRoute>
            }
          />

          <Route
            path="/agent"
            element={
              <ProtectedRoute role="agent">
                <AgentPanel /> {/* Use two-pane layout here */}
              </ProtectedRoute>
            }
          />

          {/* Legacy or fallback route:
          <Route
            path="/agent/:roomId"
            element={
              <ProtectedRoute role="agent">
                <AgentChat />
              </ProtectedRoute>
            }
          />
          */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
