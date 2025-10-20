// backend/models/Listing.js
import pool from '../database.js';

class Listing {
  // Create new listing
  static async create(listingData) {
    const {
      title, description, price, location, bedrooms, bathrooms, area,
      propertyType, amenities, availableFrom, contactEmail, contactPhone,
      images, authorId
    } = listingData;

    const query = `
      INSERT INTO listings (
        title, description, price, location, bedrooms, bathrooms, area,
        property_type, amenities, available_from, contact_email, contact_phone,
        images, author_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    const values = [
      title, description, price, location, bedrooms, bathrooms, area,
      propertyType, amenities, availableFrom, contactEmail, contactPhone,
      images, authorId
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Find listing by ID
  static async findById(id) {
    const query = `
      SELECT l.*, u.name as author_name, u.email as author_email, u.phone as author_phone
      FROM listings l
      JOIN users u ON l.author_id = u.id
      WHERE l.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Find listings by user ID
  static async findByUserId(userId) {
    const query = `
      SELECT l.*, u.name as author_name, u.email as author_email, u.phone as author_phone
      FROM listings l
      JOIN users u ON l.author_id = u.id
      WHERE l.author_id = $1
      ORDER BY l.created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  // Find active listings
  static async findActive() {
    const query = `
      SELECT l.*, u.name as author_name, u.email as author_email, u.phone as author_phone
      FROM listings l
      JOIN users u ON l.author_id = u.id
      WHERE l.status = 'active'
      ORDER BY l.created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // Update listing
  static async update(id, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateData).forEach(key => {
      fields.push(`${key} = $${paramCount}`);
      values.push(updateData[key]);
      paramCount++;
    });

    values.push(id);
    
    const query = `
      UPDATE listings 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Delete listing
  static async delete(id) {
    const query = 'DELETE FROM listings WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Increment view count
  static async incrementViewCount(id) {
    const query = `
      UPDATE listings 
      SET view_count = view_count + 1, 
          metadata = jsonb_set(
            COALESCE(metadata, '{}'::jsonb), 
            '{lastViewed}', 
            to_jsonb(CURRENT_TIMESTAMP)
          )
      WHERE id = $1
      RETURNING view_count
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Search listings
  static async search(filters) {
    const { location, minPrice, maxPrice, bedrooms, propertyType } = filters;
    let query = `
      SELECT l.*, u.name as author_name, u.email as author_email, u.phone as author_phone
      FROM listings l
      JOIN users u ON l.author_id = u.id
      WHERE l.status = 'active'
    `;
    
    const values = [];
    let paramCount = 1;

    if (location) {
      query += ` AND l.location ILIKE $${paramCount}`;
      values.push(`%${location}%`);
      paramCount++;
    }

    if (minPrice) {
      query += ` AND l.price >= $${paramCount}`;
      values.push(minPrice);
      paramCount++;
    }

    if (maxPrice) {
      query += ` AND l.price <= $${paramCount}`;
      values.push(maxPrice);
      paramCount++;
    }

    if (bedrooms) {
      query += ` AND l.bedrooms = $${paramCount}`;
      values.push(bedrooms);
      paramCount++;
    }

    if (propertyType) {
      query += ` AND l.property_type = $${paramCount}`;
      values.push(propertyType);
      paramCount++;
    }

    query += ' ORDER BY l.created_at DESC';

    const result = await pool.query(query, values);
    return result.rows;
  }
}

export default Listing;