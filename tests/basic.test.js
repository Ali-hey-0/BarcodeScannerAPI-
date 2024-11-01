// tests/basic.test.js
const dbHandler = require("./dbHandler");
const User = require("../models/User");

describe("Basic Test Setup", () => {
	beforeAll(async () => {
		await dbHandler.connect();
	});

	afterAll(async () => {
		await dbHandler.closeDatabase();
	});

	afterEach(async () => {
		await dbHandler.clearDatabase();
	});

	it("should connect to test database", async () => {
		const testUser = await User.create({
			username: "testuser",
			password: "Test123!@#",
		});
		expect(testUser).toBeDefined();
		expect(testUser.username).toBe("testuser");
	});
});
