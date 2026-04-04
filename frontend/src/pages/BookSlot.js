import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fetchStations, fetchSlots, createBooking } from '../services/api';

const STEPS = ['Select Slot', 'Your Details', 'Confirmation'];

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h);
  return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
}

function getNext7Days() {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const value = d.toISOString().split('T')[0];
    const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    days.push({ value, label });
  }
  return days;
}

export default function BookSlot() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [stations, setStations] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedStation, setSelectedStation] = useState(searchParams.get('station') || '');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [form, setForm] = useState({ user_name: '', user_email: '', user_phone: '', vehicle_number: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [stationsLoading, setStationsLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [booking, setBooking] = useState(null);
  const [copied, setCopied] = useState(false);

  const days = getNext7Days();

  // Load stations
  useEffect(() => {
    fetchStations()
      .then(r => setStations(r.data.data || []))
      .catch(() => setApiError('Cannot connect to backend. Make sure it is running on port 5000.'))
      .finally(() => setStationsLoading(false));
  }, []);

  // Load slots when station or date changes
  useEffect(() => {
    if (!selectedStation || !selectedDate) return;
    setSlotsLoading(true);
    setSelectedSlot(null);
    fetchSlots(selectedStation, selectedDate)
      .then(r => setSlots(r.data.data || []))
      .catch(() => setApiError('Failed to load slots.'))
      .finally(() => setSlotsLoading(false));
  }, [selectedStation, selectedDate]);

  const validate = () => {
    const e = {};
    if (!form.user_name.trim() || form.user_name.trim().length < 2) e.user_name = 'Name must be at least 2 characters.';
    if (!form.user_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.user_email)) e.user_email = 'Enter a valid email.';
    if (!form.user_phone || !/^[6-9]\d{9}$/.test(form.user_phone)) e.user_phone = 'Enter a valid 10-digit mobile number.';
    if (!form.vehicle_number.trim() || form.vehicle_number.trim().length < 4) e.vehicle_number = 'Enter a valid vehicle number.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setApiError('');
    try {
      const res = await createBooking({
        station_id: parseInt(selectedStation),
        slot_id: selectedSlot.id,
        slot_date: selectedDate,
        ...form,
        vehicle_number: form.vehicle_number.toUpperCase(),
      });
      setBooking(res.data.data);
      setStep(3);
    } catch (err) {
      setApiError(err.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToken = () => {
    navigator.clipboard.writeText(booking.booking_token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const stationInfo = stations.find(s => String(s.id) === String(selectedStation));

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: '720px' }}>
        <h1 className="page-title">Book a Charging Slot</h1>
        <p className="page-subtitle">Follow the steps below to reserve your EV charging time.</p>

        {/* Steps */}
        <div className="steps mb-4">
          {STEPS.map((label, i) => (
            <React.Fragment key={label}>
              <div className={`step ${step === i + 1 ? 'active' : step > i + 1 ? 'done' : ''}`}>
                <div className="step-num">{step > i + 1 ? '✓' : i + 1}</div>
                <div className="step-label">{label}</div>
              </div>
              {i < STEPS.length - 1 && <div className={`step-line ${step > i + 1 ? 'done' : ''}`} />}
            </React.Fragment>
          ))}
        </div>

        {apiError && (
          <div className="alert alert-error mb-3">
            <span className="alert-icon">⚠️</span>
            {apiError}
          </div>
        )}

        {/* STEP 1: Select Slot */}
        {step === 1 && (
          <div>
            {/* Station select */}
            <div className="card mb-3">
              <div className="card-header"><div className="card-title">1. Choose a Station</div></div>
              <div className="card-body">
                {stationsLoading ? (
                  <div className="loading-wrap"><div className="spinner" /><div className="loading-text">Loading...</div></div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                    {stations.map(s => (
                      <div
                        key={s.id}
                        className={`station-card ${String(selectedStation) === String(s.id) ? 'selected' : ''}`}
                        onClick={() => setSelectedStation(String(s.id))}
                      >
                        <div className="station-name">{String(selectedStation) === String(s.id) ? '✅ ' : '🏢 '}{s.name}</div>
                        <div className="station-location">📍 {s.location}</div>
                        <div className="station-meta">
                          <span className="station-tag">⚡ {s.charger_type}</span>
                          <span className="station-tag">💰 ₹{s.price_per_hour}/hr</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Date select */}
            {selectedStation && (
              <div className="card mb-3">
                <div className="card-header"><div className="card-title">2. Select Date</div></div>
                <div className="card-body">
                  <div className="date-tabs">
                    {days.map(d => (
                      <button
                        key={d.value}
                        className={`date-tab ${selectedDate === d.value ? 'active' : ''}`}
                        onClick={() => setSelectedDate(d.value)}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Slot select */}
            {selectedStation && selectedDate && (
              <div className="card mb-3">
                <div className="card-header">
                  <div className="card-title">3. Pick a Time Slot</div>
                  <div className="card-subtitle">
                    {slots.filter(s => !s.is_booked).length} available slots for {stationInfo?.name}
                  </div>
                </div>
                <div className="card-body">
                  {slotsLoading ? (
                    <div className="loading-wrap"><div className="spinner" /></div>
                  ) : slots.length === 0 ? (
                    <div className="alert alert-info"><span className="alert-icon">ℹ️</span>No slots available for this date.</div>
                  ) : (
                    <div className="slots-grid">
                      {slots.map(slot => (
                        <button
                          key={slot.id}
                          className={`slot-btn ${slot.is_booked ? 'booked' : ''} ${selectedSlot?.id === slot.id ? 'selected' : ''}`}
                          onClick={() => !slot.is_booked && setSelectedSlot(slot)}
                          disabled={slot.is_booked}
                        >
                          <div className="slot-time">{formatTime(slot.start_time)}</div>
                          <div className="slot-status">{slot.is_booked ? '🔴 Booked' : selectedSlot?.id === slot.id ? '✅ Selected' : '🟢 Free'}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedSlot && (
              <div className="alert alert-success mb-3">
                <span className="alert-icon">✅</span>
                <div>
                  <strong>Selected:</strong> {stationInfo?.name} · {selectedDate} · {formatTime(selectedSlot.start_time)} – {formatTime(selectedSlot.end_time)}
                </div>
              </div>
            )}

            <button
              className="btn btn-primary btn-lg btn-full"
              disabled={!selectedSlot}
              onClick={() => { setApiError(''); setStep(2); }}
            >
              Continue to Your Details →
            </button>
          </div>
        )}

        {/* STEP 2: User Details */}
        {step === 2 && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">Your Details</div>
              <div className="card-subtitle">
                {stationInfo?.name} · {selectedDate} · {formatTime(selectedSlot?.start_time)} – {formatTime(selectedSlot?.end_time)}
              </div>
            </div>
            <div className="card-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Full Name <span>*</span></label>
                  <input
                    className={`form-input ${errors.user_name ? 'error' : ''}`}
                    placeholder="Rajesh Kumar"
                    value={form.user_name}
                    onChange={e => setForm({ ...form, user_name: e.target.value })}
                  />
                  {errors.user_name && <div className="form-error">{errors.user_name}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Email <span>*</span></label>
                  <input
                    className={`form-input ${errors.user_email ? 'error' : ''}`}
                    type="email" placeholder="rajesh@email.com"
                    value={form.user_email}
                    onChange={e => setForm({ ...form, user_email: e.target.value })}
                  />
                  {errors.user_email && <div className="form-error">{errors.user_email}</div>}
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile Number <span>*</span></label>
                  <input
                    className={`form-input ${errors.user_phone ? 'error' : ''}`}
                    placeholder="9876543210"
                    value={form.user_phone}
                    onChange={e => setForm({ ...form, user_phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                  />
                  {errors.user_phone && <div className="form-error">{errors.user_phone}</div>}
                  <div className="form-hint">10-digit Indian mobile number</div>
                </div>
                <div className="form-group">
                  <label className="form-label">Vehicle Number <span>*</span></label>
                  <input
                    className={`form-input ${errors.vehicle_number ? 'error' : ''}`}
                    placeholder="KA01AB1234"
                    value={form.vehicle_number}
                    onChange={e => setForm({ ...form, vehicle_number: e.target.value.toUpperCase() })}
                  />
                  {errors.vehicle_number && <div className="form-error">{errors.vehicle_number}</div>}
                </div>
              </div>

              <div className="alert alert-info mb-3">
                <span className="alert-icon">💡</span>
                No account needed. You'll receive a <strong>booking token</strong> to manage your reservation.
              </div>

              {apiError && <div className="alert alert-error mb-3"><span className="alert-icon">⚠️</span>{apiError}</div>}

              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-secondary" onClick={() => setStep(1)}>← Back</button>
                <button className="btn btn-primary btn-lg flex-1" onClick={handleSubmit} disabled={loading}>
                  {loading ? '⏳ Booking...' : '✅ Confirm Booking'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Confirmation */}
        {step === 3 && booking && (
          <div>
            <div className="token-card mb-3">
              <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎉</div>
              <h2 style={{ fontWeight: '800', marginBottom: '8px' }}>Booking Confirmed!</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>Save your booking token — you need it to view or cancel.</p>
              <div className="token-display" onClick={copyToken} title="Click to copy">
                {booking.booking_token}
              </div>
              <p style={{ fontSize: '.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                {copied ? '✅ Copied!' : '👆 Click to copy'}
              </p>
            </div>

            <div className="card mb-3">
              <div className="card-header"><div className="card-title">Booking Details</div></div>
              <div className="card-body">
                <table className="detail-table">
                  <tbody>
                    <tr><td>Station</td><td>{booking.station_name}</td></tr>
                    <tr><td>Location</td><td>{booking.station_location}</td></tr>
                    <tr><td>Date</td><td>{booking.slot_date}</td></tr>
                    <tr><td>Time</td><td>{formatTime(booking.start_time)} – {formatTime(booking.end_time)}</td></tr>
                    <tr><td>Name</td><td>{booking.user_name}</td></tr>
                    <tr><td>Vehicle</td><td>{booking.vehicle_number}</td></tr>
                    <tr><td>Rate</td><td>₹{booking.price_per_hour}/hour</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-secondary flex-1" onClick={() => navigate('/my-booking')}>
                View Booking
              </button>
              <button className="btn btn-primary flex-1" onClick={() => { setStep(1); setBooking(null); setSelectedSlot(null); setForm({ user_name:'', user_email:'', user_phone:'', vehicle_number:'' }); }}>
                Book Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
