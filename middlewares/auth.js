const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Protect route - ensures the user is authenticated
exports.protect = (req, res, next) => {
	const token = req.header("Authorization")?.split(" ")[1];

	if (!token) {
		return res.status(401).json({ msg: "Unauthorized, no token" });
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET); // Ensure you have your secret set
		req.user = decoded; // You can access user info with req.user in your routes
		next();
	} catch (error) {
		return res.status(401).json({ msg: "Unauthorized, token failed" });
	}
};

// Check if the user is an admin
exports.isAdmin = (req, res, next) => {
	if (req.user || req.user.isAdmin) {
		next(); // User is admin, continue to the next middleware
	} else {
		return res.status(403).json({ msg: "Forbidden, not an admin" }); // User is not admin
	}
};
