const getClientIP = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    '127.0.0.1'
  );
};

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
    return res.status(429).json({ success: false, message: 'Too many requests. Wait 15 minutes.' });
  }
  next();
};

const checkIPBookingLimit = async (req, res, next) => {
  const ip = getClientIP(req);
  const maxPerDay = parseInt(process.env.MAX_BOOKINGS_PER_IP_PER_DAY) || 3;
  try {
    const db = require('../config/db');
    const today = new Date().toISOString().split('T')[0];
    const [rows] = await db.execute(
      `SELECT COUNT(*) AS cnt FROM bookings WHERE user_ip = ? AND slot_date = ? AND status = 'confirmed'`,
      [ip, today]
    );
    if (rows[0].cnt >= maxPerDay) {
      return res.status(429).json({ success: false, message: `Max ${maxPerDay} bookings per day reached.` });
    }
    req.clientIP = ip;
    next();
  } catch (err) {
    console.error('IP limit check error:', err);
    next();
  }
};

const sanitize = (value) => {
  if (typeof value !== 'string') return value;
  return value.replace(/[<>'"`;\\]/g, '').trim().substring(0, 500);
};

const validateBooking = (req, res, next) => {
  const { station_id, slot_id, user_name, user_email, user_phone, vehicle_number, slot_date } = req.body;
  const errors = [];

  if (!station_id || isNaN(parseInt(station_id))) errors.push('Valid station is required.');
  if (!slot_id || isNaN(parseInt(slot_id)))       errors.push('Valid time slot is required.');
  if (!user_name || user_name.trim().length < 2)  errors.push('Name must be at least 2 characters.');
  if (!user_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user_email)) errors.push('Valid email is required.');
  if (!user_phone || !/^[6-9]\d{9}$/.test(user_phone.replace(/\s/g, ''))) errors.push('Valid 10-digit phone required.');
  if (!vehicle_number || vehicle_number.trim().length < 4) errors.push('Vehicle number is required.');
  if (!slot_date) errors.push('Date is required.');

  if (slot_date) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const bookDate = new Date(slot_date);
    if (bookDate < today) errors.push('Cannot book past dates.');
    const maxDate = new Date(); maxDate.setDate(maxDate.getDate() + 14);
    if (bookDate > maxDate) errors.push('Cannot book more than 14 days in advance.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors.join(' '), errors });
  }

  req.body.user_name       = sanitize(user_name);
  req.body.user_email      = sanitize(user_email).toLowerCase();
  req.body.user_phone      = sanitize(user_phone);
  req.body.vehicle_number  = sanitize(vehicle_number).toUpperCase();
  next();
};

const validateToken = (req, res, next) => {
  const token = req.params.token || req.body.token;
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ success: false, message: 'Booking token is required.' });
  }
  if (!/^[a-zA-Z0-9\-_]{20,70}$/.test(token)) {
    return res.status(400).json({ success: false, message: 'Invalid token format.' });
  }
  next();
};

const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
};

module.exports = { rateLimiter, checkIPBookingLimit, validateBooking, validateToken, securityHeaders, getClientIP };