const db = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { getClientIP } = require('../middleware/security');

const generateToken = (stationId) => {
  const uuid = uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase();
  const ts = Date.now().toString(36).toUpperCase();
  return `EVC-${ts}-${uuid}-S${stationId}`;
};

const createBooking = async (req, res) => {
  const { station_id, slot_id, user_name, user_email, user_phone, vehicle_number, slot_date } = req.body;
  const userIP = req.clientIP || getClientIP(req);
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [slots] = await connection.execute(
      `SELECT id, is_booked, slot_date, start_time, end_time FROM time_slots
       WHERE id = ? AND station_id = ? AND slot_date = ? FOR UPDATE`,
      [slot_id, station_id, slot_date]
    );

    if (slots.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Slot not found.' });
    }
    if (slots[0].is_booked === 1) {
      await connection.rollback();
      return res.status(409).json({ success: false, message: 'Slot just taken. Please pick another.' });
    }
    if (new Date(`${slots[0].slot_date}T${slots[0].start_time}`) < new Date()) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Cannot book a past slot.' });
    }

    const bookingToken = generateToken(station_id);

    await connection.execute(`UPDATE time_slots SET is_booked = 1 WHERE id = ?`, [slot_id]);
    await connection.execute(
      `INSERT INTO bookings
       (booking_token, slot_id, station_id, user_name, user_email, user_phone, vehicle_number, user_ip, slot_date, start_time, end_time)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [bookingToken, slot_id, station_id, user_name, user_email, user_phone,
       vehicle_number, userIP, slots[0].slot_date, slots[0].start_time, slots[0].end_time]
    );

    await connection.commit();

    const [stationRows] = await db.execute(
      `SELECT name, location, price_per_hour FROM stations WHERE id = ?`, [station_id]
    );

    res.status(201).json({
      success: true,
      message: 'Booking confirmed!',
      data: {
        booking_token:    bookingToken,
        user_name, user_email, user_phone, vehicle_number,
        station_name:     stationRows[0]?.name || '',
        station_location: stationRows[0]?.location || '',
        slot_date:        slots[0].slot_date,
        start_time:       slots[0].start_time,
        end_time:         slots[0].end_time,
        price_per_hour:   stationRows[0]?.price_per_hour || 0,
      },
    });
  } catch (err) {
    await connection.rollback();
    console.error('createBooking error:', err);
    res.status(500).json({ success: false, message: 'Booking failed. Please try again.' });
  } finally {
    connection.release();
  }
};

const getBooking = async (req, res) => {
  const { token } = req.params;
  try {
    const [rows] = await db.execute(
      `SELECT b.booking_token, b.user_name, b.user_email, b.user_phone,
              b.vehicle_number, b.slot_date, b.start_time, b.end_time,
              b.status, b.booked_at, b.cancelled_at,
              s.name AS station_name, s.location AS station_location,
              s.charger_type, s.power_kw, s.price_per_hour
       FROM bookings b
       JOIN stations s ON s.id = b.station_id
       WHERE b.booking_token = ?`,
      [token]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No booking found with this token.' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('getBooking error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch booking.' });
  }
};

const cancelBooking = async (req, res) => {
  const { token } = req.params;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute(
      `SELECT id, slot_id, status, slot_date, start_time FROM bookings WHERE booking_token = ? FOR UPDATE`,
      [token]
    );
    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }
    if (rows[0].status === 'cancelled') {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Already cancelled.' });
    }
    if (new Date(`${rows[0].slot_date}T${rows[0].start_time}`) < new Date()) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'Cannot cancel a past booking.' });
    }

    await connection.execute(
      `UPDATE bookings SET status = 'cancelled', cancelled_at = NOW() WHERE booking_token = ?`, [token]
    );
    await connection.execute(
      `UPDATE time_slots SET is_booked = 0 WHERE id = ?`, [rows[0].slot_id]
    );

    await connection.commit();
    res.json({ success: true, message: 'Booking cancelled. Slot is now free.' });
  } catch (err) {
    await connection.rollback();
    console.error('cancelBooking error:', err);
    res.status(500).json({ success: false, message: 'Cancellation failed. Try again.' });
  } finally {
    connection.release();
  }
};

module.exports = { createBooking, getBooking, cancelBooking };