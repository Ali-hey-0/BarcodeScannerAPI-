// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const { protect, isAdmin } = require("../middlewares/auth");
// Import and destructure userController methods
const {
	getAllUsers,
	createUser,
	loginUser,
	updateUser,
	deleteUser,
} = require("../controllers/userController");

// Public routes
router.post("/login", loginUser);

// Protected routes
router.post("/", createUser);
router.get("/",  getAllUsers);
router.put("/:id",  updateUser);
router.delete("/:id", deleteUser);

module.exports = router;
