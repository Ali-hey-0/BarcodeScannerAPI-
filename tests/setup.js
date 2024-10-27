// tests/setup.js
const dotenv = require("dotenv");
const path = require("path");

// Load test environment variables
dotenv.config({
	path: path.join(__dirname, "../.env.test"),
});

// Suppress console logs during tests
global.console = {
	log: jest.fn(),
	error: jest.fn(),
	warn: jest.fn(),
	info: jest.fn(),
};
