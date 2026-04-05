const express = require('express');
const router = express.Router();
const db = require('../config/db');

// ✅ CREATE BOOKING
router.post('/bookings', async (req, res) => {
  try {
    const {
      station_id,
      slot_date,
      start_time,
      end_time,
      name,
      email,
      phone,
      vehicle_number,
    } = req.body;

    // 🔴 validation
    if (!station_id || !slot_date || !start_time || !end_time || !name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const token = 'EV' + Math.floor(100000 + Math.random() * 900000);

    // ✅ insert into DB
    await db.query(
      `INSERT INTO bookings 
      (station_id, slot_date, start_time, end_time, name, email, phone, vehicle_number, token) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [station_id, slot_date, start_time, end_time, name, email, phone, vehicle_number, token]
    );

    res.json({
      success: true,
      message: 'Booking successful',
      token,
    });

  } catch (error) {
    console.error('Booking Error:', error);
    res.status(500).json({
      success: false,
      message: 'Booking failed',
    });
  }
});

module.exports = router;