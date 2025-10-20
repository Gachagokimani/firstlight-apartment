// routes/posts.js
import express from 'express';
import pool from '../database.js';

const router = express.Router();

// 1. GET ALL POSTS - Like getting all menu items
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT posts.*, users.name as author_name 
      FROM posts 
      JOIN users ON posts.user_id = users.id
    `);
    res.json(result.rows); // Returns all posts with author info
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// 2. GET SINGLE POST - Like getting details of one menu item
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT posts.*, users.name as author_name 
      FROM posts 
      JOIN users ON posts.user_id = users.id 
      WHERE posts.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// 3. CREATE POST - Like adding a new menu item
router.post('/', async (req, res) => {
  try {
    const { title, content, user_id } = req.body;
    const result = await pool.query(
      'INSERT INTO posts (title, content, user_id) VALUES ($1, $2, $3) RETURNING *',
      [title, content, user_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// 4. UPDATE POST - Like updating a menu item
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const result = await pool.query(
      'UPDATE posts SET title = $1, content = $2 WHERE id = $3 RETURNING *',
      [title, content, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update post' });
  }
});

// 5. DELETE POST - Like removing a menu item
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM posts WHERE id = $1', [id]);
    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

export default router;