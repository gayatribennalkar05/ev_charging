import axios from 'axios';

// ✅ Use deployed backend URL
const API = axios.create({
  baseURL: 'https://ev-charging-smrf.onrender.com/api',
  headers: { 'Content-Type': 'application/json' },
});

// ─── Stations ─────────────────────────
export const fetchStations = () => API.get('/stations');

// ─── Slots ────────────────────────────
export const fetchSlots = (stationId, date) =>
  API.get('/slots', {
    params: { station_id: stationId, date },
  });

// ─── ✅ BOOKING FIX (VERY IMPORTANT) ───
export const createBooking = (data) => {
  return API.post('/bookings', {
    station_id: data.stationId,
    slot_date: data.date,
    start_time: data.startTime,
    end_time: data.endTime,
    name: data.name,
    email: data.email,
    phone: data.mobile,
    vehicle_number: data.vehicleNumber,
  });
};

export default API;