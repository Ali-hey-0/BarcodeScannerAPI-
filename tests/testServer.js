// tests/testServer.js
const express = require("express");
const {
	validateInput,
	rateLimiter,
} = require("../middlewares/securityMiddleware");
const { protect, isAdmin } = require("../middlewares/auth");
const userRoutes = require("../routes/userRoutes");
const productRoutes = require("../routes/productRoutes");

function createServer() {
	const app = express();

	// Body parser middleware
	app.use(
		express.json({
			verify: (req, res, buf) => {
				try {
					JSON.parse(buf);
				} catch (e) {
					res.status(400).json({ message: "Invalid JSON" });
					throw new Error("Invalid JSON");
				}
			},
		})
	);

	app.use(validateInput);

	// Rate limiting
	app.use("/api/users/login", rateLimiter(5, 15 * 60 * 1000));

	// Routes
	app.use("/api/users", userRoutes);
	app.use("/api/products", productRoutes);

	// Error handler
	app.use((err, req, res, next) => {
		console.error(err.stack);

		if (err.name === "ValidationError") {
			return res.status(400).json({
				message: err.message,
			});
		}

		if (err.code === 11000) {
			return res.status(400).json({
				message: "Duplicate field value entered",
			});
		}

		res.status(500).json({
			message: "Server Error",
		});
	});

	return app;
}

module.exports = createServer;
