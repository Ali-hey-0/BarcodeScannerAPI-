const express = require("express");
const { protect, isAdmin } = require("../middlewares/auth");
const userController = require("../controllers/userController");

const router = express.Router();

// Routes for CRUD actions on users

router.get("/", protect, isAdmin, userController.getAllUsers);
router.get("/:id", protect, isAdmin, userController.getUser);
router.post("/", protect, userController.createUser);
router.post("/login", userController.loginUser);
router.put("/:id", protect, isAdmin, userController.updateUser);
router.delete("/:id", protect, isAdmin, userController.deleteUser);

module.exports = router;
