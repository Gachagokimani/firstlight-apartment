import express from 'express';
import pool from '../database.js';

const router = express.Router(); // Changed from userRouter to router

// Example route: Fetch all users
router.get('/users', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Example route: Add a new user
router.post('/users', async (req, res) => {
  const { name, email } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *',
      [name, email]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error adding user:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; // Now this matches the router we created above