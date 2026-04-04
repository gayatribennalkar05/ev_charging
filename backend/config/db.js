const mysql = require('mysql2');
require('dotenv').config();

// Create connection pool for better performance
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',   // XAMPP default: empty password
  database: process.env.DB_NAME || 'ev_charging',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Test connection on startup
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ MySQL Connection Failed:', err.message);
    console.error('   Make sure XAMPP MySQL is running on port 3306');
    console.error('   and the database "ev_charging" exists.');
  } else {
    console.log('✅ MySQL Connected successfully via XAMPP!');
    connection.release();
  }
});

// Export promise-based pool for async/await
module.exports = pool.promise();
