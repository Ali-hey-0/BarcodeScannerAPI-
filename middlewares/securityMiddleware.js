// middlewares/securityMiddleware.js
const { UAParser } = require("ua-parser-js");
const AuditLog = require("../models/AuditLog");

const securityMiddleware = {
	// Device detection middleware
	detectDevice: (req, res, next) => {
		const parser = new UAParser(req.headers["user-agent"]);
		req.deviceInfo = {
			browser: parser.getBrowser(),
			os: parser.getOS(),
			device: parser.getDevice(),
		};
		next();
	},

	// Rate limiting for specific routes
	rateLimiter: (limit = 100, windowMs = 15 * 60 * 1000) => {
		const requests = new Map();

		return (req, res, next) => {
			const ip = req.ip || req.connection.remoteAddress;
			const now = Date.now();

			if (!requests.has(ip)) {
				requests.set(ip, []);
			}

			const userRequests = requests
				.get(ip)
				.filter((time) => now - time < windowMs);

			if (userRequests.length >= limit) {
				return res.status(429).json({
					success: false,
					message: "Too many requests, please try again later",
				});
			}

			userRequests.push(now);
			requests.set(ip, userRequests);
			next();
		};
	},

	// Audit logging middleware
	auditLog: async (req, res, next) => {
		const oldJson = res.json;
		res.json = async function (data) {
			try {
				await new AuditLog({
					user: req.user?._id,
					action: getActionType(req.method),
					resourceType: getResourceType(req.baseUrl),
					resourceId: req.params.id,
					details: `${req.method} ${req.originalUrl}`,
					ipAddress: req.ip || req.connection.remoteAddress,
					userAgent: req.headers["user-agent"],
					status: res.statusCode >= 400 ? "FAILURE" : "SUCCESS",
				}).save();
			} catch (error) {
				console.error("Audit logging failed:", error);
			}
			oldJson.call(this, data);
		};
		next();
	},

	// Input validation middleware
	validateInput: (req, res, next) => {
		const sanitize = (input) => {
			if (typeof input === "string") {
				// Remove potentially dangerous characters
				return input.replace(/[<>{}()"`';]/g, "");
			}
			return input;
		};

		if (req.body) {
			Object.keys(req.body).forEach((key) => {
				req.body[key] = sanitize(req.body[key]);
			});
		}

		if (req.query) {
			Object.keys(req.query).forEach((key) => {
				req.query[key] = sanitize(req.query[key]);
			});
		}

		next();
	},
};

// Helper functions
function getActionType(method) {
	switch (method) {
		case "POST":
			return "CREATE";
		case "GET":
			return "READ";
		case "PUT":
		case "PATCH":
			return "UPDATE";
		case "DELETE":
			return "DELETE";
		default:
			return "READ";
	}
}

function getResourceType(url) {
	if (url.includes("users")) return "USER";
	if (url.includes("products")) return "PRODUCT";
	if (url.includes("license")) return "LICENSE";
	return "SYSTEM";
}

module.exports = securityMiddleware;
