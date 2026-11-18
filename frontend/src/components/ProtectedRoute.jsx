import { Navigate, useLocation } from "react-router-dom";
import { getSessionUser } from "../auth/session.js";
import { bookingAuthLink } from "../booking/bookingNavigation.js";

export default function ProtectedRoute({ allowedRoles, children }) {
  const token = localStorage.getItem("token");
  const user = getSessionUser();
  const location = useLocation();
  const role = user?.role?.toLowerCase();

  if (!token || !user) {
    const login = /^\/booking\/\d+$/.test(location.pathname)
      ? bookingAuthLink("/login", location.pathname + location.search) : "/login";
    return <Navigate to={login} replace />;
  }

  if (!allowedRoles.map((r) => r.toLowerCase()).includes(role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
