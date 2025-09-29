const express = require("express");
const router = express.Router();
const { login, getCurrentUser } = require("../controllers/userController");
const { authenticate } = require("../middleware/authMiddleware");

// Auth
router.post("/login", login);

// Current user context
router.get("/me", authenticate, getCurrentUser);

module.exports = router;
