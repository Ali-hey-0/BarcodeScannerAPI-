// routes/docRoutes.js
const express = require("express");
const router = express.Router();
const path = require("path");

// Route to download the existing PDF
router.get("/download", (req, res) => {
	try {
		// Path to your existing PDF file
		const filePath = path.join(__dirname, "../readme-pdf-styled.pdf");

		// Set headers for PDF download
		res.setHeader("Content-Type", "application/pdf");
		res.setHeader(
			"Content-Disposition",
			"attachment; filename=documentation.pdf"
		);

		// Send the file
		res.download(filePath, "documentation.pdf", (err) => {
			if (err) {
				console.error("Error downloading file:", err);
				res.status(500).send("Error downloading documentation");
			}
		});
	} catch (error) {
		console.error("Error serving PDF:", error);
		res.status(500).send("Error accessing documentation");
	}
});

module.exports = router;
