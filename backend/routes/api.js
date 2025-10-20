import express from 'express';
import pool from '../database.js';
import dotenv from 'dotenv';
import User from '../models/User.js'; // Import User model
import jwt from 'jsonwebtoken';

dotenv.config();
const router = express.Router();

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

// Add a new user (registration)
router.post('/users', async (req, res) => {
  const { name, email, password, phone, role } = req.body;
  try {
    const user = await User.create({ name, email, password, phone, role });
    res.status(201).json(user);
  } catch (err) {
    console.error('Error adding user:', err);
    res.status(500).json({ error: err.message });
  }
});

// User login
router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await User.verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your_fallback_secret',
      { expiresIn: '24h' }
    );

    // Return token and user data (without password)
    const { password: _, ...userWithoutPassword } = user;
    res.json({
      token,
      user: userWithoutPassword
    });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;