const express = require("express");
const router = express.Router();
const LicenseController = require("../controllers/licenseController");
const { protect, isAdmin } = require("../middlewares/auth");
const { rateLimiter } = require("../middlewares/securityMiddleware");

// Create new license (protected, rate limited)
router.post(
	"/create",
	protect,
	rateLimiter(5, 60 * 60 * 1000), // 5 requests per hour
	(req, res) => LicenseController.createLicense(req, res)
);

// Trial license endpoint
router.post(
	"/trial",
	protect,
	rateLimiter(1, 24 * 60 * 60 * 1000), // 1 request per 24 hours
	(req, res) => LicenseController.createLicense(req, res)
);

// Verify license
router.post(
	"/verify",
	rateLimiter(60, 60 * 1000), // 60 requests per minute
	(req, res) => LicenseController.verifyLicense(req, res)
);

// Admin routes
router.get("/list", protect, isAdmin, (req, res) =>
	LicenseController.getAllLicenses(req, res)
);

router.put("/revoke/:licenseKey", protect, isAdmin, (req, res) =>
	LicenseController.revokeLicense(req, res)
);

module.exports = router;
