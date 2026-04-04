// =============================================
// Custom Security Middleware (No external auth)
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
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000; // 15 min
  const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100;

  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, { count: 1, windowStart: now });
    return next();
  }

  const record = requestCounts.get(ip);

  if (now - record.windowStart > windowMs) {
    // Reset window
    requestCounts.set(ip, { count: 1, windowStart: now });
    return next();
  }

  record.count++;

  if (record.count > maxRequests) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please wait 15 minutes and try again.',
      retryAfter: Math.ceil((windowMs - (now - record.windowStart)) / 1000),
    });
  }

  next();
};

// ─── Max bookings per IP per day ─────────────
const checkIPBookingLimit = async (req, res, next) => {
  const ip = getClientIP(req);
  const maxPerDay = parseInt(process.env.MAX_BOOKINGS_PER_IP_PER_DAY) || 3;

  try {
    const today = new Date().toISOString().split('T')[0];
    const [rows] = await db.execute(
      `SELECT COUNT(*) AS booking_count 
       FROM bookings 
       WHERE user_ip = ? AND slot_date = ? AND status = 'confirmed'`,
      [ip, today]
    );

    if (rows[0].booking_count >= maxPerDay) {
      return res.status(429).json({
        success: false,
        message: `You can only make ${maxPerDay} bookings per day. Try again tomorrow.`,
      });
    }

    req.clientIP = ip;
    next();
  } catch (err) {
    console.error('IP limit check error:', err);
    next(); // Don't block on DB error
  }
};

// ─── Input sanitizer ─────────────────────────
const sanitize = (value) => {
  if (typeof value !== 'string') return value;
  return value
    .replace(/[<>'"`;\\]/g, '')   // Remove dangerous chars
    .trim()
    .substring(0, 500);           // Limit length
};

// ─── Booking validation middleware ───────────
const validateBooking = (req, res, next) => {
  const { station_id, slot_id, user_name, user_email, user_phone, vehicle_number, slot_date } = req.body;

  const errors = [];

  // Required fields
  if (!station_id || isNaN(parseInt(station_id))) errors.push('Valid station is required.');
  if (!slot_id || isNaN(parseInt(slot_id))) errors.push('Valid time slot is required.');
  if (!user_name || user_name.trim().length < 2) errors.push('Name must be at least 2 characters.');
  if (!user_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user_email)) errors.push('Valid email is required.');
  if (!user_phone || !/^[6-9]\d{9}$/.test(user_phone.replace(/\s/g, ''))) errors.push('Valid 10-digit Indian phone number required.');
  if (!vehicle_number || vehicle_number.trim().length < 4) errors.push('Vehicle number is required.');
  if (!slot_date) errors.push('Date is required.');

  // Date validation - no past dates
  if (slot_date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookDate = new Date(slot_date);
    if (bookDate < today) {
      errors.push('Cannot book slots for past dates.');
    }
    // No more than 14 days in advance
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 14);
    if (bookDate > maxDate) {
      errors.push('Cannot book slots more than 14 days in advance.');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors.join(' '), errors });
  }

  // Sanitize inputs
  req.body.user_name = sanitize(user_name);
  req.body.user_email = sanitize(user_email).toLowerCase();
  req.body.user_phone = sanitize(user_phone);
  req.body.vehicle_number = sanitize(vehicle_number).toUpperCase();

  next();
};

// ─── Token validation middleware ──────────────
const validateToken = (req, res, next) => {
  const token = req.params.token || req.body.token;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ success: false, message: 'Booking token is required.' });
  }

  // Token should be alphanumeric + hyphens, 30-70 chars
  if (!/^[a-zA-Z0-9-_]{20,70}$/.test(token)) {
    return res.status(400).json({ success: false, message: 'Invalid token format.' });
  }

  next();
};

// ─── Security headers ─────────────────────────
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
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
