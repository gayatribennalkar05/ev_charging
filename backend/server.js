const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { securityHeaders } = require('./middleware/security');
const stationRoutes = require('./routes/stationRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── CORS ─────────────────────────────────────
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// ─── Middleware ───────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(securityHeaders);

// ─── Health Check ─────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'EV Charging API is running!',
    time: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ─── Routes ───────────────────────────────────
app.use('/api', stationRoutes);
app.use('/api', bookingRoutes);

// ─── 404 Handler ─────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ─── Global Error Handler ─────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ─── Start Server ─────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('🔋 ================================');
  console.log(`⚡  EV Charging API running on port ${PORT}`);
  console.log(`🌐  http://localhost:${PORT}/api/health`);
  console.log('🔋 ================================');
  console.log('');
});

module.exports = app;
