require("dotenv").config();

const express = require('express');
const cors = require('cors');

const { securityHeaders } = require('./middleware/security');
const stationRoutes = require('./routes/stationRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── ✅ CORS FIX (IMPORTANT) ─────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Middleware ─────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(securityHeaders);

// ─── Health Check ───────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'EV Charging API is running!',
    time: new Date().toISOString(),
  });
});

// ─── ✅ ROUTES (VERY IMPORTANT) ──────────────
app.use('/api', stationRoutes);
app.use('/api', bookingRoutes);

// ─── 404 Handler ────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found.`,
  });
});

// ─── Error Handler ──────────────────────────
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});

// ─── Start Server ───────────────────────────
app.listen(PORT, () => {
  console.log('🔋 ================================');
  console.log(`⚡ Server running on port ${PORT}`);
  console.log(`🌐 http://localhost:${PORT}/api/health`);
  console.log('🔋 ================================');
});

module.exports = app;