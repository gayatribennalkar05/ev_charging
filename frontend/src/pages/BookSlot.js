import React, { useState } from "react";

const BookingForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [vehicle, setVehicle] = useState("");

  const handleBooking = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: name,
          email: email,
          mobile: mobile,
          vehicle_number: vehicle,
          station: "Tech Park",
          slot_time: "9PM-10PM",
        }),
      });

      const data = await response.json();

      console.log(data);

      if (data.success) {
        alert("✅ Booking Successful");
      } else {
        alert("❌ Booking Failed");
      }
    } catch (error) {
      console.error(error);
      alert("❌ Server Error");
    }
  };

  return (
    <div>
      <h2>Book Charging Slot</h2>

      <input
        type="text"
        placeholder="Full Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="text"
        placeholder="Mobile"
        value={mobile}
        onChange={(e) => setMobile(e.target.value)}
      />

      <input
        type="text"
        placeholder="Vehicle Number"
        value={vehicle}
        onChange={(e) => setVehicle(e.target.value)}
      />

      <button onClick={handleBooking}>
        Confirm Booking
      </button>
    </div>
  );
};

export default BookingForm;