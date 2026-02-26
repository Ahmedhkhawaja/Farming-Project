// middleware/allowStaffOrManager.js
module.exports = function (req, res, next) {
  // req.user should be set by auth middleware
  if (!req.user) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  if (req.user.role !== "manager" && req.user.role !== "staff") {
    return res
      .status(403)
      .json({ message: "Access denied. Manager or Staff only." });
  }

  next();
};
