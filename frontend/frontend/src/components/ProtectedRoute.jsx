// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export function ProtectedRoute({ children, role }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to={`/${role}-login`} replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to={`/${user.role}-login`} replace />;
  }

  return children;
}
