module.exports = function requireManager(req, res, next) {
  // `auth` middleware should set req.user = { id, role }
  if (!req.user || req.user.role !== "manager") {
    return res.status(403).json({ message: "Access denied. Manager role required." });
  }

  return next();
};

