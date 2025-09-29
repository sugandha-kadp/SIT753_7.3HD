const jwt = require("jsonwebtoken");
const User = require("../models/user");

const tokenPayload = (user) => ({
  id: user._id,
  role: user.role,
  name: user.name,
});

const generateToken = (user) =>
  jwt.sign(tokenPayload(user), process.env.JWT_SECRET, {
    expiresIn: "8h",
  });

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (user.active === false) {
      return res.status(403).json({ message: "Account is inactive" });
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Login failed" });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to load user" });
  }
};
