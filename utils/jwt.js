// middlewares/auth.js
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const mongoose = require("mongoose");
const User = require("../models/User");

// Rate limiter for login attempts
const loginLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 5, // 5 attempts per window
	message: "Too many login attempts, please try again after 15 minutes",
});

// Rate limiter for other protected routes
const apiLimiter = rateLimit({
	windowMs: 60 * 1000, // 1 minute
	max: 30, // 30 requests per minute
});

const protect = async (req, res, next) => {
	try {
		let token;

		if (
			req.headers.authorization &&
			req.headers.authorization.startsWith("Bearer")
		) {
			try {
				// Get token from header
				token = req.headers.authorization.split(" ")[1];

				// Verify token
				const decoded = jwt.verify(token, process.env.JWT_SECRET);

				// Get user from token
				const user = await User.findById(decoded.id)
					.select("-password")
					.lean(); // Use lean() for better performance

				if (!user) {
					return res.status(401).json({
						success: false,
						message: "User not found",
					});
				}

				if (!user.isActive) {
					return res.status(401).json({
						success: false,
						message: "User account is deactivated",
					});
				}

				// Check if token was issued before password change
				if (
					user.passwordChangedAt &&
					decoded.iat < user.passwordChangedAt.getTime() / 1000
				) {
					return res.status(401).json({
						success: false,
						message:
							"Password was changed recently. Please login again",
					});
				}

				req.user = user;
				next();
			} catch (error) {
				console.error("Token verification error:", error);
				return res.status(401).json({
					success: false,
					message: "Not authorized, invalid token",
				});
			}
		} else {
			return res.status(401).json({
				success: false,
				message: "Not authorized, no token",
			});
		}
	} catch (error) {
		console.error("Auth middleware error:", error);
		return res.status(500).json({
			success: false,
			message: "Authentication error",
		});
	}
};

const isAdmin = (req, res, next) => {
	if (!req.user || !req.user.isAdmin) {
		return res.status(403).json({
			success: false,
			message: "Not authorized as admin",
		});
	}
	next();
};

module.exports = { protect, isAdmin, loginLimiter, apiLimiter };
