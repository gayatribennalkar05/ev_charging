import axios from 'axios';

// Use deployed backend URL
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL + '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Stations & Slots ─────────────────────────
export const fetchStations = () => API.get('/stations');

export const fetchSlots = (stationId, date) =>
  API.get('/slots', { params: { station_id: stationId, date } });

// ─── Bookings ─────────────────────────────────
export const createBooking = (data) => API.post('/bookings', data);

export const getBookingByToken = (token) => API.get(`/bookings/${token}`);

export const cancelBooking = (token) => API.delete(`/bookings/${token}`);

export default API;