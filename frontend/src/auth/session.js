export function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function saveSession(token, user) {
  localStorage.setItem("user", JSON.stringify(user));
  localStorage.setItem("token", token);
}

export function getSessionUser() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return typeof user?.role === "string" ? user : null;
  } catch {
    return null;
  }
}

export function dashboardPath(role) {
  if (role === "admin") return "/admin-dashboard";
  if (role === "staff") return "/staff-dashboard";
  return role ? "/customer-dashboard" : "/login";
}
