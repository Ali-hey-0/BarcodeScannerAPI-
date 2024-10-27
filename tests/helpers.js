// tests/helpers.js
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const helpers = {
	// Create test user
	createTestUser: async (isAdmin = false) => {
		return await User.create({
			username: `testuser_${Date.now()}`,
			password: "Test123!@#",
			isAdmin,
		});
	},

	// Generate test token
	generateToken: (user) => {
		return jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
			expiresIn: "1d",
		});
	},

	// Clean up database
	cleanDb: async () => {
		const collections = mongoose.connection.collections;
		for (const key in collections) {
			await collections[key].deleteMany();
		}
	},
};

module.exports = helpers;
