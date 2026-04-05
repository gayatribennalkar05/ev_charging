const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// DB
const db = require("./config/db");

// Routes
const bookingRoutes = require("./routes/bookingRoutes");

// ✅ MAIN ROUTE FIX
app.use("/api/bookings", bookingRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("✅ Server running...");
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});