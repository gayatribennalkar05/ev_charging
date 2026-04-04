import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import BookSlot from './pages/BookSlot';
import MyBooking from './pages/MyBooking';

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        ⚡ EVCharge · EV Charging Slot Booking System · Built with React + Node.js + MySQL (XAMPP)
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/book" element={<BookSlot />} />
        <Route path="/my-booking" element={<MyBooking />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}
