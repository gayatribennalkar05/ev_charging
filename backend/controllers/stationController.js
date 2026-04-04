const db = require('../config/db');

// ─── Get all active stations ──────────────────
const getStations = async (req, res) => {
  try {
    const [stations] = await db.execute(
      `SELECT id, name, location, total_slots, charger_type, power_kw, price_per_hour
       FROM stations
       WHERE is_active = 1
       ORDER BY name ASC`
    );
    res.json({ success: true, data: stations });
  } catch (err) {
    console.error('getStations error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch stations.' });
  }
};

// ─── Get available slots for a station & date ─
const getSlots = async (req, res) => {
  const { station_id, date } = req.query;

  if (!station_id || !date) {
    return res.status(400).json({ success: false, message: 'station_id and date are required.' });
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ success: false, message: 'Invalid date format. Use YYYY-MM-DD.' });
  }

  // Prevent querying past dates
  const today = new Date().toISOString().split('T')[0];
  if (date < today) {
    return res.status(400).json({ success: false, message: 'Cannot view slots for past dates.' });
  }

  try {
    const [slots] = await db.execute(
      `SELECT 
         ts.id,
         ts.start_time,
         ts.end_time,
         ts.is_booked,
         ts.slot_date,
         s.name AS station_name,
         s.price_per_hour
       FROM time_slots ts
       JOIN stations s ON s.id = ts.station_id
       WHERE ts.station_id = ? AND ts.slot_date = ?
       ORDER BY ts.start_time ASC`,
      [station_id, date]
    );

    // If no slots exist yet for this date, generate them on-the-fly
    if (slots.length === 0) {
      await generateSlotsForDate(station_id, date);
      const [newSlots] = await db.execute(
        `SELECT id, start_time, end_time, is_booked, slot_date
         FROM time_slots
         WHERE station_id = ? AND slot_date = ?
         ORDER BY start_time ASC`,
        [station_id, date]
      );
      return res.json({ success: true, data: newSlots });
    }

    res.json({ success: true, data: slots });
  } catch (err) {
    console.error('getSlots error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch slots.' });
  }
};

// Helper: generate hourly slots for a station+date
const generateSlotsForDate = async (stationId, date) => {
  const times = [
    ['06:00:00', '07:00:00'], ['07:00:00', '08:00:00'], ['08:00:00', '09:00:00'],
    ['09:00:00', '10:00:00'], ['10:00:00', '11:00:00'], ['11:00:00', '12:00:00'],
    ['12:00:00', '13:00:00'], ['13:00:00', '14:00:00'], ['14:00:00', '15:00:00'],
    ['15:00:00', '16:00:00'], ['16:00:00', '17:00:00'], ['17:00:00', '18:00:00'],
    ['18:00:00', '19:00:00'], ['19:00:00', '20:00:00'], ['20:00:00', '21:00:00'],
    ['21:00:00', '22:00:00'],
  ];

  const values = times.map(([s, e]) => [stationId, date, s, e]);
  await db.query(
    `INSERT IGNORE INTO time_slots (station_id, slot_date, start_time, end_time) VALUES ?`,
    [values]
  );
};

module.exports = { getStations, getSlots };
