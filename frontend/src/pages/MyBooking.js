import React, { useState } from 'react';
import { getBookingByToken, cancelBooking } from '../services/api';

function formatTime(t) {
  if (!t) return '';
  const [h, m] = t.split(':');
  const hr = parseInt(h);
  return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
}

export default function MyBooking() {
  const [token, setToken] = useState('');
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cancelConfirm, setCancelConfirm] = useState(false);

  const handleSearch = async () => {
    if (!token.trim()) { setError('Please enter your booking token.'); return; }
    setLoading(true); setError(''); setBooking(null); setSuccess('');
    try {
      const res = await getBookingByToken(token.trim());
      setBooking(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Booking not found. Check your token and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    setCancelLoading(true); setError('');
    try {
      await cancelBooking(token.trim());
      setSuccess('Booking cancelled successfully. The slot is now available for others.');
      setBooking(prev => ({ ...prev, status: 'cancelled' }));
      setCancelConfirm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Cancellation failed. Please try again.');
    } finally {
      setCancelLoading(false);
    }
  };

  const isUpcoming = booking && new Date(`${booking.slot_date}T${booking.start_time}`) > new Date();

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: '600px' }}>
        <h1 className="page-title">My Booking</h1>
        <p className="page-subtitle">Enter your booking token to view or cancel your reservation.</p>

        {/* Token input */}
        <div className="card mb-3">
          <div className="card-header"><div className="card-title">🎫 Find Your Booking</div></div>
          <div className="card-body">
            <div className="form-group mb-2">
              <label className="form-label">Booking Token</label>
              <input
                className="form-input"
                placeholder="EVC-xxxxx-xxxxx-Sx"
                value={token}
                onChange={e => setToken(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                style={{ fontFamily: "'JetBrains Mono', monospace", letterSpacing: '.04em' }}
              />
              <div className="form-hint">This was shown after your booking was confirmed.</div>
            </div>
            <button className="btn btn-blue btn-full" onClick={handleSearch} disabled={loading}>
              {loading ? '⏳ Searching...' : '🔍 Find Booking'}
            </button>
          </div>
        </div>

        {error && <div className="alert alert-error mb-3"><span className="alert-icon">⚠️</span>{error}</div>}
        {success && <div className="alert alert-success mb-3"><span className="alert-icon">✅</span>{success}</div>}

        {/* Booking details */}
        {booking && (
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="card-title">Booking Details</div>
                <span className={`badge ${booking.status === 'confirmed' ? 'badge-green' : 'badge-red'}`}>
                  {booking.status === 'confirmed' ? '✅ Confirmed' : '❌ Cancelled'}
                </span>
              </div>
            </div>
            <div className="card-body">
              <table className="detail-table mb-3">
                <tbody>
                  <tr><td>Station</td><td>{booking.station_name}</td></tr>
                  <tr><td>Location</td><td>{booking.station_location}</td></tr>
                  <tr><td>Charger</td><td>{booking.charger_type} · {booking.power_kw} kW</td></tr>
                  <tr><td>Date</td><td>{booking.slot_date}</td></tr>
                  <tr><td>Time</td><td>{formatTime(booking.start_time)} – {formatTime(booking.end_time)}</td></tr>
                  <tr><td>Name</td><td>{booking.user_name}</td></tr>
                  <tr><td>Email</td><td>{booking.user_email}</td></tr>
                  <tr><td>Phone</td><td>{booking.user_phone}</td></tr>
                  <tr><td>Vehicle</td><td>{booking.vehicle_number}</td></tr>
                  <tr><td>Rate</td><td>₹{booking.price_per_hour}/hour</td></tr>
                  <tr><td>Booked At</td><td>{new Date(booking.booked_at).toLocaleString('en-IN')}</td></tr>
                  {booking.cancelled_at && (
                    <tr><td>Cancelled At</td><td>{new Date(booking.cancelled_at).toLocaleString('en-IN')}</td></tr>
                  )}
                </tbody>
              </table>

              {/* Cancel section */}
              {booking.status === 'confirmed' && isUpcoming && (
                <div>
                  {!cancelConfirm ? (
                    <button className="btn btn-danger btn-full" onClick={() => setCancelConfirm(true)}>
                      ❌ Cancel This Booking
                    </button>
                  ) : (
                    <div className="alert alert-error">
                      <div style={{ width: '100%' }}>
                        <div style={{ fontWeight: '700', marginBottom: '8px' }}>Are you sure you want to cancel?</div>
                        <div style={{ fontSize: '.85rem', marginBottom: '12px' }}>This action cannot be undone. The slot will be freed for others.</div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button className="btn btn-danger btn-sm" onClick={handleCancel} disabled={cancelLoading}>
                            {cancelLoading ? 'Cancelling...' : 'Yes, Cancel'}
                          </button>
                          <button className="btn btn-secondary btn-sm" onClick={() => setCancelConfirm(false)}>
                            Keep Booking
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {booking.status === 'confirmed' && !isUpcoming && (
                <div className="alert alert-warning">
                  <span className="alert-icon">⏰</span>
                  This booking time has already passed and cannot be cancelled.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
