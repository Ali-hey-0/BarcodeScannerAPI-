// models/AuditLog.js
const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: false, // Allow logging for non-authenticated actions
		},
		action: {
			type: String,
			required: true,
			enum: [
				"CREATE",
				"READ",
				"UPDATE",
				"DELETE",
				"LOGIN",
				"LOGOUT",
				"FAILED_LOGIN",
				"LICENSE_CHECK",
			],
		},
		resourceType: {
			type: String,
			required: true,
			enum: ["USER", "PRODUCT", "LICENSE", "SYSTEM"],
		},
		resourceId: {
			type: mongoose.Schema.Types.ObjectId,
			required: false,
		},
		details: {
			type: String,
			required: false,
		},
		ipAddress: String,
		userAgent: String,
		status: {
			type: String,
			enum: ["SUCCESS", "FAILURE", "WARNING"],
			default: "SUCCESS",
		},
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model("AuditLog", AuditLogSchema);
