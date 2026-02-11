const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const stockRoutes = require("./routes/stocks");
const productRoutes = require("./routes/products");
// In your main server.js/app.js
const reportRoutes = require("./routes/reports");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection (Mongoose queues operations until connected - works for serverless)
const isVercel = process.env.VERCEL === "1";

mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/grocery-sales")
  .then(() => {
    console.log("✅ MongoDB connected successfully");
    console.log(`📁 Database: ${mongoose.connection.db.databaseName}`);
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    if (!isVercel) process.exit(1);
  });

// Health check endpoint
app.get("/api/health", (req, res) => {
  const dbStatus =
    mongoose.connection.readyState === 1 ? "connected" : "disconnected";
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    database: dbStatus,
    memoryUsage: process.memoryUsage(),
  });
});

// Debug endpoint to list all routes
app.get("/api/debug/routes", (req, res) => {
  const routes = [];

  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // Routes registered directly on the app
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods),
      });
    } else if (middleware.name === "router") {
      // Routes registered via router
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          routes.push({
            path: handler.route.path,
            methods: Object.keys(handler.route.methods),
          });
        }
      });
    }
  });

  res.json({ routes });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/stocks", stockRoutes);
app.use("/api", productRoutes); // Mount at /api, not /api/products
app.use("/api/reports", reportRoutes);

// Basic route for testing
app.get("/", (req, res) => {
  res.json({
    message: "Grocery Sales API is running",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      health: "/api/health",
      products: "/api/products",
      productTypes: "/api/product-types",
      stocks: "/api/stocks",
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    requestedUrl: req.originalUrl,
    availableEndpoints: [
      "GET /api/health",
      "POST /api/auth/login",
      "GET /api/products",
      "GET /api/stocks",
    ],
  });
});

const PORT = process.env.PORT || 5000;

// Only start HTTP server when running locally (not on Vercel serverless)
if (!isVercel) {
  mongoose.connection.once("open", () => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📊 Available endpoints:`);
      console.log(`   - http://localhost:${PORT}/api/auth`);
      console.log(`   - http://localhost:${PORT}/api/products`);
      console.log(`   - http://localhost:${PORT}/api/stocks`);
    });
  });

  mongoose.connection.on("error", (err) => {
    console.error("❌ MongoDB connection error:", err);
  });

  process.on("SIGINT", async () => {
    await mongoose.connection.close();
    console.log(" MongoDB connection closed");
    process.exit(0);
  });
}

module.exports = app;
