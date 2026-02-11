const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Register new user
exports.register = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Check if user exists
    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user
    user = new User({
      username,
      password,
      role: role || "staff",
    });

    await user.save();

    // Create JWT token
    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: { id: user.id, username: user.username, role: user.role },
        });
      },
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Create JWT token
    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: { id: user.id, username: user.username, role: user.role },
        });
      },
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};
