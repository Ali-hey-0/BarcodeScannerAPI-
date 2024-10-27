const express = require("express");
const { protect, isAdmin } = require("../middlewares/auth");
const productController = require("../controllers/productController");

const router = express.Router();

// Routes for CRUD actions on products
router.post("/", protect, isAdmin, productController.createProduct);
router.get("/",  productController.getAllProducts);
router.get("/:id", productController.getProduct);
router.put("/:id", protect, isAdmin, productController.updateProduct);
router.delete("/:id", protect, isAdmin, productController.deleteProduct);

module.exports = router;
