require("dotenv").config(); // Ensure this is at the very top
const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const userRoutes = require("./routes/userRoutes");
const docRoutes = require("./routes/docRoutes");
const productRoutes = require("./routes/productRoutes");
const connectDB = require('./config/db'); // Your DB connection script
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const {detectDevice,rateLimiter,auditLog,validateInput,} = require("./middlewares/securityMiddleware");




connectDB(); // Connect to database






//requierd

const app = express();
// Security middlewares
app.use(helmet());
app.use(mongoSanitize());
app.use(express.json({ limit: '10kb' })); // Limit JSON body size
const PORT = process.env.PORT || 5000;


// Apply security middleware
app.use(detectDevice);
app.use(validateInput);
app.use(auditLog);



// Routes

app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/docs", docRoutes);



// Apply rate limiting to specific routes
app.use('/api/users/login', rateLimiter(5, 15 * 60 * 1000)); // 5 attempts per 15 minutes
app.use('/api/products', rateLimiter(100, 60 * 1000)); // 100 requests per minute




// Additional security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    next();
});





// Error handling middleware

app.use((err, req, res, next) => {
	console.log(err.stack);
	res.status(500).json({ msg: "server error" });
});




// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    // Log error
    new AuditLog({
        action: 'ERROR',
        resourceType: 'SYSTEM',
        details: err.message,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'FAILURE'
    }).save().catch(console.error);

    res.status(500).json({ 
        success: false, 
        message: 'An unexpected error occurred' 
    });
});




//starting the server

app.listen(PORT, () => console.log(`server running on port ${PORT}`));
