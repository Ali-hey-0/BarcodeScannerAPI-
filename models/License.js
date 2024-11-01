const mongoose = require("mongoose");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const LICENSE_TIERS = {
	TRIAL: {
		duration: 30, // days
		scanLimit: 100,
		features: ["basic_scan", "history"],
	},
	BASIC: {
		duration: 180, // 6 months
		scanLimit: 1000,
		features: ["basic_scan", "history", "export"],
	},
	PREMIUM: {
		duration: 365, // 1 year
		scanLimit: 10000,
		features: ["basic_scan", "history", "export", "bulk_scan", "analytics"],
	},
	ENTERPRISE: {
		duration: 365,
		scanLimit: Infinity,
		features: [
			"basic_scan",
			"history",
			"export",
			"bulk_scan",
			"analytics",
			"api_access",
			"priority_support",
		],
	},
};

const LicenseSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
		licenseKey: {
			type: String,
			unique: true,
			required: true,
			index: true,
		},
		tier: {
			type: String,
			enum: Object.keys(LICENSE_TIERS),
			required: true,
		},
		status: {
			type: String,
			enum: ["ACTIVE", "EXPIRED", "REVOKED", "SUSPENDED"],
			default: "ACTIVE",
			index: true,
		},
		startDate: {
			type: Date,
			required: true,
			default: Date.now,
		},
		endDate: {
			type: Date,
			required: true,
			index: true,
		},
		features: [
			{
				type: String,
				enum: [
					"basic_scan",
					"history",
					"export",
					"bulk_scan",
					"analytics",
					"api_access",
					"priority_support",
				],
			},
		],
		deviceInfo: {
			deviceId: {
				type: String,
				required: true,
			},
			deviceHash: String,
			fingerprint: String,
			lastUsed: Date,
			platform: String,
			model: String,
			version: String,
			ipHistory: [
				{
					ip: String,
					timestamp: Date,
				},
			],
		},
		usage: {
			scanCount: {
				type: Number,
				default: 0,
			},
			scanLimit: Number,
			lastScanTime: Date,
			activations: {
				type: Number,
				default: 0,
				max: 3, // Allow maximum 3 activations for device changes
			},
		},
		security: {
			mainHash: String, // Primary security hash
			backupHash: String, // Backup hash for verification
			lastVerified: Date,
			verificationToken: String,
			suspiciousActivities: [
				{
					type: String,
					timestamp: Date,
					details: String,
				},
			],
		},
		metadata: {
			purchaseId: String,
			transactionId: String,
			paymentMethod: String,
			customerEmail: String,
		},
	},
	{
		timestamps: true,
	}
);

// Compound indexes for performance
LicenseSchema.index({ status: 1, endDate: 1 });
LicenseSchema.index({ licenseKey: 1, "deviceInfo.deviceHash": 1 });
LicenseSchema.index({ "security.mainHash": 1, status: 1 });

// Generate cryptographically secure license key
LicenseSchema.statics.generateLicenseKey = async function () {
	const buffer = crypto.randomBytes(32);
	const timestamp = Date.now().toString(36);
	const randomStr = crypto.randomBytes(8).toString("hex");
	const hash = await bcrypt.hash(buffer.toString("hex"), 4);
	return `${timestamp}-${randomStr}-${hash.slice(-12)}`.toUpperCase();
};

// Generate device fingerprint
LicenseSchema.methods.generateDeviceFingerprint = function (deviceInfo) {
	const data = `${deviceInfo.deviceId}${deviceInfo.platform}${deviceInfo.model}${deviceInfo.version}`;
	const salt = crypto.randomBytes(16).toString("hex");
	return {
		fingerprint: crypto
			.pbkdf2Sync(data, salt, 100000, 64, "sha512")
			.toString("hex"),
		salt,
	};
};

// Generate security hashes
LicenseSchema.methods.generateSecurityHashes = function () {
	const mainData = `${this.licenseKey}${this.userId}${this.tier}${this.startDate}${this.endDate}`;
	const backupData = `${this.deviceInfo.deviceHash}${this.security.verificationToken}${this.createdAt}`;

	return {
		mainHash: crypto.createHash("sha512").update(mainData).digest("hex"),
		backupHash: crypto
			.createHash("sha512")
			.update(backupData)
			.digest("hex"),
	};
};

// Verify license integrity
LicenseSchema.methods.verifyIntegrity = function () {
	const { mainHash, backupHash } = this.generateSecurityHashes();
	const mainValid = crypto.timingSafeEqual(
		Buffer.from(this.security.mainHash),
		Buffer.from(mainHash)
	);
	const backupValid = crypto.timingSafeEqual(
		Buffer.from(this.security.backupHash),
		Buffer.from(backupHash)
	);
	return mainValid && backupValid;
};

// Check if license is valid and not expired
LicenseSchema.methods.isValid = function () {
	return (
		this.status === "ACTIVE" &&
		this.endDate > new Date() &&
		this.verifyIntegrity() &&
		this.usage.scanCount < this.usage.scanLimit
	);
};

// Get remaining scans
LicenseSchema.methods.getRemainingScans = function () {
	return Math.max(0, this.usage.scanLimit - this.usage.scanCount);
};

// Pre-save middleware
LicenseSchema.pre("save", async function (next) {
	if (this.isNew) {
		// Set tier-specific limits and features
		const tierConfig = LICENSE_TIERS[this.tier];
		this.features = tierConfig.features;
		this.usage.scanLimit = tierConfig.scanLimit;

		// Generate security tokens
		const { mainHash, backupHash } = this.generateSecurityHashes();
		this.security.mainHash = mainHash;
		this.security.backupHash = backupHash;
		this.security.verificationToken = crypto
			.randomBytes(32)
			.toString("hex");
	}
	next();
});

module.exports = {
	License: mongoose.model("License", LicenseSchema),
	LICENSE_TIERS,
};
