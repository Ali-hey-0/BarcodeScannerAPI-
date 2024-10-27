// tests/dbHandler.js
const mongoose = require("mongoose");

module.exports = {
	connect: async () => {
		try {
			await mongoose.connect(process.env.MONGO_URI);
		} catch (err) {
			console.error("MongoDB connection error:", err);
			process.exit(1);
		}
	},

	closeDatabase: async () => {
		try {
			await mongoose.connection.dropDatabase();
			await mongoose.connection.close();
		} catch (err) {
			console.error("Error closing database:", err);
			process.exit(1);
		}
	},

	clearDatabase: async () => {
		if (mongoose.connection.readyState === 0) return;

		const collections = mongoose.connection.collections;
		for (const key in collections) {
			await collections[key].deleteMany();
		}
	},
};
