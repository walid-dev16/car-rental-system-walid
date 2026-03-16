import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ allowedRoles, children }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const role = user?.role?.toLowerCase();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.map((r) => r.toLowerCase()).includes(role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}