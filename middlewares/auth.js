const jwt = require("jsonwebtoken");
const User = require("../models/User");
const rateLimit = require("express-rate-limit");

// Rate limiters
const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 5,
	message: "Too many login attempts, please try again after 15 minutes",
});

const apiLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 30,
});

// Protect middleware
const protect = async (req, res, next) => {
	try {
		let token = req.header("Authorization")?.split(" ")[1];

		if (!token) {
			return res.status(401).json({
				success: false,
				msg: "Unauthorized, no token",
			});
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET);

		const user = await User.findById(decoded.id).select("-password").lean();

		if (!user) {
			return res.status(401).json({
				success: false,
				msg: "User not found",
			});
		}

		req.user = user;
		next();
	} catch (error) {
		console.error("Auth error:", error);
		return res.status(401).json({
			success: false,
			msg: "Unauthorized, token failed",
		});
	}
};

// Admin check middleware
const isAdmin = (req, res, next) => {
	if (!req.user || !req.user.isAdmin) {
		return res.status(403).json({
			success: false,
			msg: "Not authorized as admin",
		});
	}
	next();
};

module.exports = { protect, isAdmin, loginLimiter, apiLimiter };
