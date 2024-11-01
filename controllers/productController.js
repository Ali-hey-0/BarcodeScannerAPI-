const Products = require("../models/Product");

// Create new product
exports.createProduct = async (req, res) => {
	const { name, description, price, barcode } = req.body;
	try {
		const product = new Products({ name, description, price, barcode });
		await product.save();
		res.status(201).json(product);
	} catch (err) {
		res.status(400).json({
			msg: "Error creating product",
			error: err.message,
		});
	}
};

// Get all products
exports.getAllProducts = async (req, res) => {
	try {
		const products = await Products.find();
		res.json(products);
	} catch (err) {
		res.status(500).json({
			msg: "Error fetching products",
			error: err.message,
		});
	}
};

// Get single product
exports.getProduct = async (req, res) => {
	try {
		const product = await Products.findById(req.params.id);
		if (!product) return res.status(404).json({ msg: "Product not found" });
		res.json(product);
	} catch (err) {
		res.status(500).json({
			msg: "Error fetching product",
			error: err.message,
		});
	}
};

// Update product
exports.updateProduct = async (req, res) => {
	try {
		const updatedProduct = await Products.findByIdAndUpdate(
			req.params.id,
			req.body,
			{ new: true }
		);
		if (!updatedProduct)
			return res.status(404).json({ msg: "Product not found" });
		res.json(updatedProduct);
	} catch (err) {
		res.status(500).json({
			msg: "Error updating product",
			error: err.message,
		});
	}
};

// Delete product
exports.deleteProduct = async (req, res) => {
	try {
		const product = await Products.findByIdAndDelete(req.params.id);
		if (!product) return res.status(404).json({ msg: "Product not found" });
		res.json({ msg: "Product deleted" });
	} catch (err) {
		res.status(500).json({
			msg: "Error deleting product",
			error: err.message,
		});
	}
};
