import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="nav-brand">
          <span className="bolt">⚡</span>
          <span>EV<span>Charge</span></span>
        </Link>
        <div className="nav-links">
          <Link to="/" className={isActive('/')}>Home</Link>
          <Link to="/book" className={isActive('/book')}>Book Slot</Link>
          <Link to="/my-booking" className={isActive('/my-booking')}>My Booking</Link>
        </div>
      </div>
    </nav>
  );
}
