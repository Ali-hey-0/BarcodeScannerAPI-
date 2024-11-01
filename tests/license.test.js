// tests/license.test.js
const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");
const { generateTestToken, createTestUser } = require("./mocks");
const User = require("../models/User");
const License = require("../models/License");
const dbHandler = require("./dbHandler");

describe("License System Tests", () => {
	let testUser;
	let authToken;

	beforeAll(async () => {
		await dbHandler.connect();
	});

	afterAll(async () => {
		await dbHandler.closeDatabase();
	});

	beforeEach(async () => {
		await dbHandler.clearDatabase();
		testUser = await createTestUser(User);
		authToken = generateTestToken(testUser._id);
	});

	describe("Trial License Tests", () => {
		test("should create trial license for new user", async () => {
			const response = await request(app)
				.post("/api/license/trial")
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					deviceInfo: {
						device_id: "test-device-123",
						model: "Test Model",
						platform: "Android",
					},
				});

			expect(response.status).toBe(201);
			expect(response.body.success).toBe(true);
			expect(response.body.license).toHaveProperty("key");
			expect(response.body.license).toHaveProperty("validUntil");
			expect(response.body.license.type).toBe("TRIAL");
		});

		test("should prevent multiple trial licenses for same user", async () => {
			// Create first license
			await request(app)
				.post("/api/license/trial")
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					deviceInfo: { device_id: "test-device-123" },
				});

			// Try to create second license
			const response = await request(app)
				.post("/api/license/trial")
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					deviceInfo: { device_id: "test-device-123" },
				});

			expect(response.status).toBe(400);
			expect(response.body.success).toBe(false);
			expect(response.body.message).toMatch(/already has.*license/i);
		});

		test("should require authentication", async () => {
			const response = await request(app)
				.post("/api/license/trial")
				.send({
					deviceInfo: { device_id: "test-device-123" },
				});

			expect(response.status).toBe(401);
		});

		
	});

	describe("License Verification Tests", () => {
		let licenseKey;

		beforeEach(async () => {
			const response = await request(app)
				.post("/api/license/trial")
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					deviceInfo: { device_id: "test-device-123" },
				});

			licenseKey = response.body.license.key;
		});

		test("should verify valid license", async () => {
			const response = await request(app)
				.post("/api/license/verify")
				.send({
					license: { key: licenseKey },
					deviceInfo: { device_id: "test-device-123" },
				});

			expect(response.status).toBe(200);
			expect(response.body.success).toBe(true);
			expect(response.body.license).toHaveProperty("key");
			expect(response.body.license).toHaveProperty("validUntil");
		});

		test("should reject invalid license key", async () => {
			const response = await request(app)
				.post("/api/license/verify")
				.send({
					license: { key: "invalid-key" },
					deviceInfo: { device_id: "test-device-123" },
				});

			expect(response.status).toBe(404);
			expect(response.body.success).toBe(false);
		});

		test("should reject different device", async () => {
			const response = await request(app)
				.post("/api/license/verify")
				.send({
					license: { key: licenseKey },
					deviceInfo: { device_id: "different-device" },
				});

			expect(response.status).toBe(403);
			expect(response.body.success).toBe(false);
		});

		test("should handle expired license", async () => {
			// Manually expire the license
			await License.findOneAndUpdate(
				{ licenseKey },
				{
					endDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
				}
			);

			const response = await request(app)
				.post("/api/license/verify")
				.send({
					license: { key: licenseKey },
					deviceInfo: { device_id: "test-device-123" },
				});

			expect(response.status).toBe(403);
			expect(response.body.success).toBe(false);
			expect(response.body.message).toMatch(/expired/i);
		});
	});

	describe("License Data Validation", () => {
		test("should validate trial license duration", async () => {
			const response = await request(app)
				.post("/api/license/trial")
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					deviceInfo: { device_id: "test-device-123" },
				});

			const license = await License.findOne({
				licenseKey: response.body.license.key,
			});
			const durationInDays = Math.round(
				(license.endDate - license.startDate) / (1000 * 60 * 60 * 24)
			);

			expect(durationInDays).toBe(30);
		});

		test("should store device information", async () => {
			const deviceInfo = {
				device_id: "test-device-123",
				model: "Test Model",
				platform: "Android",
				version: "12.0",
			};

			const response = await request(app)
				.post("/api/license/trial")
				.set("Authorization", `Bearer ${authToken}`)
				.send({ deviceInfo });

			const license = await License.findOne({
				licenseKey: response.body.license.key,
			});
			expect(license.deviceInfo).toEqual(deviceInfo);
		});
	});
});
