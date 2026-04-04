// =============================================
// Custom Security Middleware (FIXED VERSION)
// =============================================

const db = require('../config/db');

// ─── Get real client IP ──────────────────────
const getClientIP = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    '127.0.0.1'
  );
};

// ─── In-memory rate limiter ───────────────────
const requestCounts = new Map();

const rateLimiter = (req, res, next) => {
  const ip = getClientIP(req);
  const now = Date.now();
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000;
  const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;

  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, { count: 1, windowStart: now });
    return next();
  }

  const record = requestCounts.get(ip);

  if (now - record.windowStart > windowMs) {
    requestCounts.set(ip, { count: 1, windowStart: now });
    return next();
  }

  record.count++;

  if (record.count > maxRequests) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Try again later.',
    });
  }

  next();
};

// ─── DISABLED IP LIMIT (FIXED) ───────────────
const checkIPBookingLimit = async (req, res, next) => {
  // ❌ Removed DB check (no user_ip column)
  next();
};

// ─── Booking validation middleware ───────────
const validateBooking = (req, res, next) => {
  const {
    station_id,
    slot_date,
    start_time,
    end_time,
    name,
    email,
    phone,
    vehicle_number
  } = req.body;

  const errors = [];

  if (!station_id) errors.push('Station required');
  if (!slot_date) errors.push('Date required');
  if (!start_time) errors.push('Start time required');
  if (!end_time) errors.push('End time required');
  if (!name) errors.push('Name required');
  if (!email) errors.push('Email required');
  if (!phone) errors.push('Phone required');
  if (!vehicle_number) errors.push('Vehicle number required');

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors.join(', ')
    });
  }

  next();
};

// ─── Token validation middleware ──────────────
const validateToken = (req, res, next) => {
  const token = req.params.token || req.body.token;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Booking token required'
    });
  }

  next();
};

// ─── Security headers ─────────────────────────
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
};

module.exports = {
  rateLimiter,
  checkIPBookingLimit,
  validateBooking,
  validateToken,
  securityHeaders,
  getClientIP,
};