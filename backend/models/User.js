// backend/models/User.js
import pool from '../database.js';
import bcrypt from 'bcryptjs';
class User {
  // Create new user
  static async create(userData) {
    const { name, email, password, phone, role } = userData;
    
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const query = `
      INSERT INTO users (name, email, password, phone, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, email, phone, role, avatar, is_verified, created_at
    `;
    
    const values = [name, email, hashedPassword, phone, role || 'tenant'];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Find user by email
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  // Find user by ID
  static async findById(id) {
    const query = 'SELECT id, name, email, phone, role, avatar, is_verified, preferences, stats, created_at FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Update user
  static async update(id, updateData) {
    const { name, email, phone, avatar, preferences } = updateData;
    
    const query = `
      UPDATE users 
      SET name = $1, email = $2, phone = $3, avatar = $4, preferences = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING id, name, email, phone, role, avatar, is_verified, preferences, stats, created_at
    `;
    
    const values = [name, email, phone, avatar, JSON.stringify(preferences), id];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Update user stats
  static async updateStats(userId, stats) {
    const query = `
      UPDATE users 
      SET stats = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING stats
    `;
    
    const values = [JSON.stringify(stats), userId];
    const result = await pool.query(query, values);
    return result.rows[0];
  }
  stat
  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
  static async changePassword(userId, newPassword) {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const query = `
      UPDATE users 
      SET password = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;
  }// Get user with listings count
  static async getUserWithStats(userId) {
    const query = `
      SELECT 
        u.*,
        COUNT(l.id) as total_listings,
        COUNT(CASE WHEN l.status = 'active' THEN 1 END) as active_listings
      FROM users u
      LEFT JOIN listings l ON u.id = l.author_id
      WHERE u.id = $1
      GROUP BY u.id
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }
}

export default User;