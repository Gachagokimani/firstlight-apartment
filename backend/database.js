const { Pool } = require('pg');

// Create a new Pool instance to manage database connections
const pool = new Pool({
  user: 'your_db_user',       // Replace with your PostgreSQL username
  host: 'localhost',         // Replace with your database host
  database: 'your_db_name',  // Replace with your database name
  password: 'your_db_pass',  // Replace with your database password
  port: 5432,                // Default PostgreSQL port
});

// Test the database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Database connected successfully:', res.rows[0].now);
  }
});

module.exports = pool; 