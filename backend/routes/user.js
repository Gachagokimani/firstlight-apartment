// routes/users.js
import express from 'express';
import pool from '../database.js';

const router = express.Router();

// 1. GET ALL USERS - Like getting a customer list
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email FROM users');
    res.json(result.rows); // Returns: [{id: 1, name: 'John', email: 'john@email.com'}, ...]
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// 2. GET SINGLE USER - Like looking up a specific customer
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]); // Returns: {id: 1, name: 'John', email: 'john@email.com'}
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// 3. CREATE USER - Like adding a new customer to the system
router.post('/', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const result = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
      [name, email, password]
    );
    res.status(201).json(result.rows[0]); // Returns the created user
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// 4. UPDATE USER - Like updating customer information
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;
    const result = await pool.query(
      'UPDATE users SET name = $1, email = $2 WHERE id = $3 RETURNING *',
      [name, email, id]
    );
    res.json(result.rows[0]); // Returns updated user
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// 5. DELETE USER - Like removing a customer account
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;