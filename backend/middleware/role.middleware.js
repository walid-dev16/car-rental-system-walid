/* Role-based access control middleware */
module.exports = function allowRoles(...allowedRoles) {
  return (req, res, next) => {
    /* Ensure authenticated user data is available */
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: "Not authorized - User role missing" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden - Role not permitted for this action" });
    }
    next();
  };
};