import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchStations } from '../services/api';

export default function Home() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStations()
      .then(r => setStations(r.data.data || []))
      .catch(() => setError('Could not load stations. Make sure the backend is running on port 5000.'))
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div>
      {/* Hero */}
      <div className="hero">
        <div className="container">
          <h1>⚡ EV Charging<br /><span>Slot Booking</span></h1>
          <p>Book your EV charging slot in seconds. No account needed — just book, charge, and go!</p>
          <Link to="/book" className="btn btn-primary btn-lg">
            🔋 Book a Slot Now
          </Link>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="num">{stations.length || 5}</div>
              <div className="lbl">Stations</div>
            </div>
            <div className="hero-stat">
              <div className="num">16</div>
              <div className="lbl">Daily Slots</div>
            </div>
            <div className="hero-stat">
              <div className="num">100%</div>
              <div className="lbl">Secure</div>
            </div>
          </div>
        </div>
      </div>

      {/* Info boxes */}
      <div className="container">
        <div className="info-grid">
          <div className="info-box">
            <div className="info-icon">🔋</div>
            <div className="info-value">AC & DC</div>
            <div className="info-label">Charger Types</div>
          </div>
          <div className="info-box">
            <div className="info-icon">🔐</div>
            <div className="info-value">Token</div>
            <div className="info-label">Based Security</div>
          </div>
          <div className="info-box">
            <div className="info-icon">⚡</div>
            <div className="info-value">22–62 kW</div>
            <div className="info-label">Charging Power</div>
          </div>
          <div className="info-box">
            <div className="info-icon">📅</div>
            <div className="info-value">14 Days</div>
            <div className="info-label">Advance Booking</div>
          </div>
        </div>

        {/* Stations */}
        <div className="mb-4">
          <div className="d-flex align-center gap-2 mb-2">
            <h2 className="page-title mb-0">Charging Stations</h2>
            <span className="text-muted" style={{ fontSize: '.9rem' }}>— {today}</span>
          </div>

          {loading && (
            <div className="loading-wrap">
              <div className="spinner" />
              <div className="loading-text">Loading stations...</div>
            </div>
          )}

          {error && (
            <div className="alert alert-error">
              <span className="alert-icon">⚠️</span>
              {error}
            </div>
          )}

          {!loading && !error && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {stations.map(s => (
                <div key={s.id} className="station-card">
                  <div className="station-name">🏢 {s.name}</div>
                  <div className="station-location">📍 {s.location}</div>
                  <div className="station-meta">
                    <span className="station-tag">⚡ {s.charger_type}</span>
                    <span className="station-tag">🔌 {s.power_kw} kW</span>
                    <span className="station-tag">💰 ₹{s.price_per_hour}/hr</span>
                    <span className="station-tag badge-green">✅ Active</span>
                  </div>
                  <div className="mt-2">
                    <Link to={`/book?station=${s.id}`} className="btn btn-primary btn-sm btn-full">
                      Book This Station
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="card mb-4">
          <div className="card-header"><div className="card-title">How It Works</div></div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
              {[
                { icon: '🏢', step: '1', title: 'Pick Station', desc: 'Choose from our EV charging stations across the city.' },
                { icon: '📅', step: '2', title: 'Select Slot', desc: 'Pick a date and available time slot that works for you.' },
                { icon: '📝', step: '3', title: 'Enter Details', desc: 'Fill in your name, email, phone and vehicle number.' },
                { icon: '🎫', step: '4', title: 'Get Token', desc: 'Receive a unique booking token. Save it to manage your booking.' },
              ].map(item => (
                <div key={item.step} style={{ textAlign: 'center', padding: '12px' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{item.icon}</div>
                  <div style={{ fontWeight: '700', fontSize: '.9rem', marginBottom: '4px' }}>{item.title}</div>
                  <div style={{ fontSize: '.82rem', color: 'var(--text-muted)' }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
