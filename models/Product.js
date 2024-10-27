// models/Product.js
const mongoose = require("mongoose");
const crypto = require("crypto");

const ProductSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, "Product name is required"],
			trim: true,
			maxlength: [100, "Name cannot exceed 100 characters"],
		},
		description: {
			type: String,
			required: [true, "Description is required"],
			maxlength: [500, "Description cannot exceed 500 characters"],
		},
		price: {
			type: Number,
			required: [true, "Price is required"],
			min: [0, "Price cannot be negative"],
		},
		barcode: {
			type: String,
			required: [true, "Barcode is required"],
			unique: true,
			validate: {
				validator: function (v) {
					// Add barcode validation regex based on your format
					return /^[A-Za-z0-9-]+$/.test(v);
				},
				message: "Invalid barcode format",
			},
		},
		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		lastModifiedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
		isActive: {
			type: Boolean,
			default: true,
		},
		scanCount: {
			type: Number,
			default: 0,
		},
		lastScanned: {
			type: Date,
		},
		hash: {
			type: String,
		},
	},
	{
		timestamps: true,
	}
);

// Generate hash for data integrity
ProductSchema.pre("save", function (next) {
	const dataToHash = `${this.name}${this.description}${this.price}${this.barcode}`;
	this.hash = crypto.createHash("sha256").update(dataToHash).digest("hex");
	next();
});

// Index for faster barcode lookups
ProductSchema.index({ barcode: 1 });

// Index for text search
ProductSchema.index({
	name: "text",
	description: "text",
});

module.exports = mongoose.model("Product", ProductSchema);
