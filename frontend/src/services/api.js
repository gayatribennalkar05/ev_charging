export const createBooking = (data) => {
  console.log("Booking Data Sent:", data); // DEBUG

  return API.post('/bookings', {
    station_id: data.stationId,      // ✅ IMPORTANT
    slot_date: data.date,            // ✅ IMPORTANT
    start_time: data.startTime,      // ✅ IMPORTANT
    end_time: data.endTime,          // ✅ IMPORTANT
    name: data.name,
    email: data.email,
    phone: data.mobile,
    vehicle_number: data.vehicleNumber,
  });
};