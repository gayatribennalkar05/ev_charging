
# ⚡ EV Charging Slot Booking System

A full-stack web application for booking EV charging slots.
**Stack:** React.js · Node.js + Express · MySQL (XAMPP)

---

## 📁 Project Structure

```
ev-charging/
├── database/
│   └── schema.sql              ← Import this into phpMyAdmin
├── backend/
│   ├── server.js               ← Express entry point (port 5000)
│   ├── .env                    ← DB config (edit if needed)
│   ├── package.json
│   ├── config/
│   │   └── db.js               ← MySQL connection pool
│   ├── middleware/
│   │   └── security.js         ← Rate limiting, validation, IP limiting
│   ├── controllers/
│   │   ├── stationController.js
│   │   └── bookingController.js
│   └── routes/
│       ├── stationRoutes.js
│       └── bookingRoutes.js
└── frontend/
    ├── package.json            ← Has "proxy": "http://localhost:5000"
    ├── public/
    │   └── index.html
    └── src/
        ├── index.js
        ├── index.css
        ├── App.js
        ├── components/
        │   └── Navbar.js
        ├── pages/
        │   ├── Home.js
        │   ├── BookSlot.js
        │   └── MyBooking.js
        └── services/
            └── api.js
```

---

## 🚀 How to Run (XAMPP)

### Prerequisites
- [XAMPP](https://www.apachefriends.org/) installed
- [Node.js](https://nodejs.org/) v16 or higher installed

---

### STEP 1 — Start XAMPP Services

1. Open **XAMPP Control Panel**
2. Click **Start** next to **Apache**
3. Click **Start** next to **MySQL**
4. Both should show green ✅

---

### STEP 2 — Set Up the Database

1. Open your browser → go to: `http://localhost/phpmyadmin`
2. In the left sidebar, click **New**
3. Enter database name: `ev_charging` → click **Create**
4. Click on `ev_charging` in the sidebar
5. Click the **Import** tab at the top
6. Click **Choose File** → select `database/schema.sql`
7. Click **Go** at the bottom
8. You should see: ✅ **"Database setup complete!"**

---

### STEP 3 — Configure Backend (if needed)

Open `backend/.env`:

```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=          ← Leave empty for XAMPP default
DB_NAME=ev_charging
PORT=5000
```

> **Note:** XAMPP's default MySQL user is `root` with **no password**. If you set a password in phpMyAdmin, enter it here.

---

### STEP 4 — Install & Run Backend

Open a terminal (Command Prompt / PowerShell):

```bash
cd path\to\ev-charging\backend
npm install
npm run dev
```

✅ You should see:
```
✅ MySQL Connected successfully via XAMPP!
⚡  EV Charging API running on port 5000
🌐  http://localhost:5000/api/health
```

Test it: open `http://localhost:5000/api/health` in browser — you should see JSON with `"success": true`.

---

### STEP 5 — Install & Run Frontend

Open a **NEW terminal window**:

```bash
cd path\to\ev-charging\frontend
npm install
npm start
```

✅ Browser opens automatically at `http://localhost:3000`

---

## 🔑 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Check if backend is running |
| GET | `/api/stations` | Get all active stations |
| GET | `/api/slots?station_id=1&date=2026-04-04` | Get slots for station+date |
| POST | `/api/bookings` | Create a booking |
| GET | `/api/bookings/:token` | Get booking by token |
| DELETE | `/api/bookings/:token` | Cancel booking by token |

### POST /api/bookings — Request Body
```json
{
  "station_id": 1,
  "slot_id": 5,
  "slot_date": "2026-04-05",
  "user_name": "Rajesh Kumar",
  "user_email": "rajesh@email.com",
  "user_phone": "9876543210",
  "vehicle_number": "KA01AB1234"
}
```

---

## 🔐 Security Features (Custom, No Login)

- **Unique booking tokens** — Format: `EVC-{timestamp}-{random}-S{stationId}`
- **Double-booking prevention** — MySQL row-level locking (`FOR UPDATE`)
- **IP-based booking limit** — Max 3 bookings per IP per day
- **Custom rate limiting** — 100 requests per 15 minutes per IP (in-memory)
- **Past date blocking** — Cannot book or cancel past slots
- **Input validation** — Name, email, phone (Indian format), vehicle number
- **Input sanitization** — Strips `<>'";\`` characters
- **Security headers** — X-Content-Type-Options, X-Frame-Options, XSS protection

---

## 🗄️ Database Tables

| Table | Purpose |
|-------|---------|
| `stations` | EV charging stations |
| `time_slots` | Hourly slots per station per date |
| `bookings` | Booking records with token & IP |
| `ip_requests` | For rate limit tracking |

---

## ❌ Troubleshooting

### "Network Error" / "Failed to load stations"
→ Backend is not running. Run `npm run dev` in the `backend/` folder first.

### "ER_ACCESS_DENIED_ERROR"
→ Wrong MySQL credentials. Check `backend/.env` — for XAMPP, `DB_PASSWORD` should be empty.

### "ER_BAD_DB_ERROR: Unknown database 'ev_charging'"
→ Database not created yet. Follow Step 2.

### Port 5000 already in use
→ Change `PORT=5001` in `backend/.env` and update `"proxy"` in `frontend/package.json` to `http://localhost:5001`.

### npm vulnerabilities warning
→ Safe to ignore for development. These are warnings, not errors. Run `npm audit fix` optionally.

---

## 📦 Pre-seeded Stations

1. Green Valley EV Hub — MG Road, Bangalore (22kW AC, ₹45/hr)
2. Tech Park Charging Point — Whitefield, Bangalore (50kW DC, ₹80/hr)
3. Central Mall EV Station — Koramangala, Bangalore (22kW AC, ₹40/hr)
4. Airport EV Centre — Hebbal, Bangalore (62kW DC, ₹95/hr)
5. Eco Park Charger — Indiranagar, Bangalore (22kW AC, ₹50/hr)

Each station gets **16 hourly slots per day** (6 AM – 10 PM), for **14 days** ahead.
