const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const createBooking = async (req, res) => {
  try {
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

    // Generate unique booking token
    const bookingToken = uuidv4().slice(0, 8).toUpperCase();

    // ✅ FIXED QUERY (removed slot_id & user_ip)
    const query = `
      INSERT INTO bookings 
      (booking_token, station_id, user_name, user_email, user_phone, vehicle_number, slot_date, start_time, end_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.execute(query, [
      bookingToken,
      station_id,
      name,
      email,
      phone,
      vehicle_number,
      slot_date,
      start_time,
      end_time
    ]);

    res.status(201).json({
      success: true,
      message: 'Booking successful!',
      token: bookingToken
    });

  } catch (error) {
    console.error('createBooking error:', error);
    res.status(500).json({
      success: false,
      message: 'Booking failed. Please try again.'
    });
  }
};

module.exports = { createBooking };