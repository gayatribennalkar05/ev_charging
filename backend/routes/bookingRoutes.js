const express = require("express");
const router = express.Router();
const db = require("../config/db");

// ✅ POST booking
router.post("/", (req, res) => {
  const { full_name, email, mobile, vehicle_number, station, slot_time } = req.body;

  // Validation
  if (!full_name || !email || !mobile || !vehicle_number) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  const sql = `
    INSERT INTO bookings 
    (full_name, email, mobile, vehicle_number, station, slot_time)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [full_name, email, mobile, vehicle_number, station, slot_time],
    (err, result) => {
      if (err) {
        console.error("❌ DB Error:", err);
        return res.status(500).json({
          success: false,
          message: "Database error",
        });
      }

      res.json({
        success: true,
        message: "✅ Booking successful",
        booking_id: result.insertId,
      });
    }
  );
});

module.exports = router;