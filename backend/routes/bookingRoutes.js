const express = require('express');
const router = express.Router();
const { createBooking, getBooking, cancelBooking } = require('../controllers/bookingController');
const { rateLimiter, checkIPBookingLimit, validateBooking, validateToken } = require('../middleware/security');

// Book a slot
router.post('/bookings', rateLimiter, checkIPBookingLimit, validateBooking, createBooking);

// Get booking by token
router.get('/bookings/:token', rateLimiter, validateToken, getBooking);

// Cancel booking by token
router.delete('/bookings/:token', rateLimiter, validateToken, cancelBooking);

module.exports = router;
