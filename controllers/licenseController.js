const { License, LICENSE_TIERS } = require("../models/License");
const User = require("../models/User");
const crypto = require("crypto");
const redis = require("redis");
const { promisify } = require("util");
const rateLimit = require("express-rate-limit");
const { createHash } = require("crypto");

// Create Redis client with error handling
const redisClient = redis.createClient({
	url: process.env.REDIS_URL,
	retry_strategy: function (options) {
		if (options.total_retry_time > 1000 * 60 * 60) {
			return new Error("Retry time exhausted");
		}
		if (options.attempt > 10) {
			return undefined;
		}
		return Math.min(options.attempt * 100, 3000);
	},
});

const getAsync = promisify(redisClient.get).bind(redisClient);
const setAsync = promisify(redisClient.set).bind(redisClient);
const delAsync = promisify(redisClient.del).bind(redisClient);

class LicenseController {
	// Create new license
	static async createLicense(req, res) {
		try {
			const { deviceInfo, tier = "TRIAL" } = req.body;
			const userId = req.user._id;

			// Check existing license in cache first
			const cachedLicense = await getAsync(`user_license:${userId}`);
			if (cachedLicense) {
				return res.status(400).json({
					success: false,
					message: "User already has an active license",
				});
			}

			// Check database if not in cache
			const existingLicense = await License.findOne({
				userId,
				status: "ACTIVE",
				endDate: { $gt: new Date() },
			})
				.select("licenseKey endDate tier")
				.lean();

			if (existingLicense) {
				// Cache the found license
				await setAsync(
					`user_license:${userId}`,
					JSON.stringify(existingLicense),
					"EX",
					3600
				);
				return res.status(400).json({
					success: false,
					message: "User already has an active license",
					license: existingLicense,
				});
			}

			// Generate license key and security tokens
			const licenseKey = await License.generateLicenseKey();
			const tierConfig = LICENSE_TIERS[tier];

			// Calculate end date based on tier
			const endDate = new Date();
			endDate.setDate(endDate.getDate() + tierConfig.duration);

			// Create new license
			const license = new License({
				userId,
				licenseKey,
				tier,
				startDate: new Date(),
				endDate,
				deviceInfo: {
					...deviceInfo,
					ipHistory: [
						{
							ip: req.ip,
							timestamp: new Date(),
						},
					],
				},
				usage: {
					scanLimit: tierConfig.scanLimit,
				},
			});

			// Generate device fingerprint
			const { fingerprint, salt } =
				license.generateDeviceFingerprint(deviceInfo);
			license.deviceInfo.fingerprint = fingerprint;

			await license.save();

			// Update user
			await User.findByIdAndUpdate(userId, {
				$set: {
					licenseKey,
					deviceId: deviceInfo.deviceId,
					tier,
				},
			});

			// Cache the new license
			await setAsync(
				`license:${licenseKey}`,
				JSON.stringify({
					isValid: true,
					fingerprint,
					tier,
					expiry: endDate,
				}),
				"EX",
				3600 * 24 // 24 hours cache
			);

			return res.status(201).json({
				success: true,
				license: {
					key: licenseKey,
					tier,
					validUntil: endDate,
					features: tierConfig.features,
					scanLimit: tierConfig.scanLimit,
				},
			});
		} catch (error) {
			console.error("License creation error:", error);
			return res.status(500).json({
				success: false,
				message: "Error creating license",
			});
		}
	}

	// Verify and validate license
	static async verifyLicense(req, res) {
		try {
			const {
				license: { key },
				deviceInfo,
			} = req.body;
			const clientIp = req.ip;

			// Check cache first
			const cachedLicense = await getAsync(`license:${key}`);
			if (cachedLicense) {
				const cached = JSON.parse(cachedLicense);
				if (!cached.isValid) {
					return res.status(403).json({
						success: false,
						message: "License invalid",
					});
				}

				// Verify device fingerprint
				const license = new License();
				const { fingerprint } =
					license.generateDeviceFingerprint(deviceInfo);
				if (fingerprint !== cached.fingerprint) {
					// Log suspicious activity
					await License.findOneAndUpdate(
						{ licenseKey: key },
						{
							$push: {
								"security.suspiciousActivities": {
									type: "DEVICE_MISMATCH",
									timestamp: new Date(),
									details: `Attempt from IP: ${clientIp}`,
								},
							},
						}
					);

					return res.status(403).json({
						success: false,
						message: "Invalid device",
					});
				}

				return res.status(200).json({
					success: true,
					license: {
						tier: cached.tier,
						validUntil: cached.expiry,
						features: LICENSE_TIERS[cached.tier].features,
					},
				});
			}

			// If not in cache, check database
			const license = await License.findOne({ licenseKey: key });
			if (!license || !license.isValid()) {
				// Cache negative result
				await setAsync(
					`license:${key}`,
					JSON.stringify({ isValid: false }),
					"EX",
					3600
				);

				return res.status(403).json({
					success: false,
					message: "License invalid or expired",
				});
			}

			// Update usage statistics
			const updatedLicense = await License.findOneAndUpdate(
				{ licenseKey: key },
				{
					$inc: { "usage.scanCount": 1 },
					$set: {
						"usage.lastScanTime": new Date(),
						"deviceInfo.lastUsed": new Date(),
					},
					$push: {
						"deviceInfo.ipHistory": {
							ip: clientIp,
							timestamp: new Date(),
						},
					},
				},
				{ new: true }
			);

			// Cache the valid result
			await setAsync(
				`license:${key}`,
				JSON.stringify({
					isValid: true,
					fingerprint: license.deviceInfo.fingerprint,
					tier: license.tier,
					expiry: license.endDate,
				}),
				"EX",
				3600
			);

			return res.status(200).json({
				success: true,
				license: {
					tier: license.tier,
					validUntil: license.endDate,
					features: license.features,
					remainingScans: updatedLicense.getRemainingScans(),
				},
			});
		} catch (error) {
			console.error("License verification error:", error);
			return res.status(500).json({
				success: false,
				message: "Error verifying license",
			});
		}
	}
}







module.exports = LicenseController;
