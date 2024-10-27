// models/User.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const UserSchema = new mongoose.Schema(
	{
		username: {
			type: String,
			required: [true, "Username is required"],
			unique: true,
			trim: true,
			minlength: [4, "Username must be at least 4 characters"],
			maxlength: [30, "Username cannot exceed 30 characters"],
		},
		password: {
			type: String,
			required: [true, "Password is required"],
			minlength: [8, "Password must be at least 8 characters"],
			select: false, // Don't return password in queries
		},
		isAdmin: {
			type: Boolean,
			default: false,
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		loginAttempts: {
			type: Number,
			default: 0,
		},
		lockUntil: {
			type: Date,
		},
		lastLogin: {
			type: Date,
		},
		passwordChangedAt: {
			type: Date,
		},
		deviceId: {
			type: String,
		},
		licenseKey: {
			type: String,
		},
		refreshToken: String,
		refreshTokenExpiresAt: Date,
	},
	{
		timestamps: true,
	}
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
	if (!this.isModified("password")) return next();

	try {
		const salt = await bcrypt.genSalt(12); // Increased from 10 to 12 rounds
		this.password = await bcrypt.hash(this.password, salt);

		if (this.isModified("password") && !this.isNew) {
			this.passwordChangedAt = Date.now();
		}

		next();
	} catch (error) {
		next(error);
	}
});

// Compare password method
UserSchema.methods.matchPassword = async function (enteredPassword) {
	try {
		return await bcrypt.compare(enteredPassword, this.password);
	} catch (error) {
		throw new Error("Password comparison failed");
	}
};

// Increment login attempts
UserSchema.methods.incrementLoginAttempts = async function () {
	// Lock account if more than 5 failed attempts
	if (this.loginAttempts + 1 >= 5) {
		this.lockUntil = Date.now() + 15 * 60 * 1000; // Lock for 15 minutes
	}

	this.loginAttempts += 1;
	return this.save();
};

// Reset login attempts
UserSchema.methods.resetLoginAttempts = async function () {
	this.loginAttempts = 0;
	this.lockUntil = undefined;
	this.lastLogin = Date.now();
	return this.save();
};

// Generate refresh token
UserSchema.methods.generateRefreshToken = function () {
	const refreshToken = crypto.randomBytes(40).toString("hex");
	this.refreshToken = crypto
		.createHash("sha256")
		.update(refreshToken)
		.digest("hex");

	this.refreshTokenExpiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

	return refreshToken;
};

module.exports = mongoose.model("User", UserSchema);
