// tests/security.test.js
const request = require("supertest");
const dbHandler = require("./dbHandler");
const createServer = require("./testServer");
const User = require("../models/User");
const Product = require("../models/Product");
const jwt = require("jsonwebtoken");

const app = createServer();

describe("Security Features", () => {
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

		// Create test user
		testUser = await User.create({
			username: "testadmin",
			password: "Test123!@#",
			isAdmin: true,
		});

		authToken = jwt.sign({ id: testUser._id }, process.env.JWT_SECRET);
	});

	describe("Security Middleware", () => {
		test("rate limiter should work", async () => {
			const attempts = [];
			for (let i = 0; i < 6; i++) {
				attempts.push(
					request(app).post("/api/users/login").send({
						username: "test",
						password: "test",
					})
				);
			}

			const responses = await Promise.all(attempts);
			const lastResponse = responses[responses.length - 1];
			expect(lastResponse.status).toBe(429);
		});
	});

	describe("Authentication", () => {
		test("should reject expired tokens", async () => {
			const expiredToken = jwt.sign(
				{ id: testUser._id },
				process.env.JWT_SECRET,
				{ expiresIn: "0s" }
			);

			const response = await request(app)
				.post("/api/products")
				.set("Authorization", `Bearer ${expiredToken}`)
				.send({
					name: "Test Product",
					description: "Test",
					price: 100,
					barcode: "123456",
				});

			expect(response.status).toBe(401);
		});

		test("should handle malformed tokens", async () => {
			const response = await request(app)
				.post("/api/products")
				.set("Authorization", "Bearer malformed.token.here")
				.send({
					name: "Test Product",
					description: "Test",
					price: 100,
					barcode: "123456",
				});

			expect(response.status).toBe(401);
		});
	});

	describe("Error Handling", () => {
		test("should handle invalid JSON", async () => {
			const response = await request(app)
				.post("/api/products")
				.set("Authorization", `Bearer ${authToken}`)
				.set("Content-Type", "application/json")
				.send('{"invalid json":');

			expect(response.status).toBe(400);
		});

		test("should validate price as number", async () => {
			const response = await request(app)
				.post("/api/products")
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					name: "Test Product",
					description: "Test",
					price: "not a number",
					barcode: "123456",
				});

			expect(response.status).toBe(400);
		});
	});
});
