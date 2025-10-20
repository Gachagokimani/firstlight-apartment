// backend/models/ViewingRequest.js
import pool from '../database.js';

class ViewingRequest {
  // Create new viewing request
  static async create(requestData) {
    const { listingId, requesterId, preferredDate, message } = requestData;
    
    const query = `
      INSERT INTO viewing_requests (listing_id, requester_id, preferred_date, message)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    
    const values = [listingId, requesterId, preferredDate, message];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Find by ID with populated data
  static async findById(id) {
    const query = `
      SELECT 
        vr.*,
        l.title as listing_title, l.location as listing_location, l.price as listing_price,
        l.author_id as landlord_id,
        landlord.name as landlord_name, landlord.email as landlord_email, landlord.phone as landlord_phone,
        requester.name as requester_name, requester.email as requester_email, requester.phone as requester_phone
      FROM viewing_requests vr
      JOIN listings l ON vr.listing_id = l.id
      JOIN users landlord ON l.author_id = landlord.id
      JOIN users requester ON vr.requester_id = requester.id
      WHERE vr.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Find by owner ID
  static async findByOwnerId(ownerId) {
    const query = `
      SELECT 
        vr.*,
        l.title as listing_title, l.location as listing_location, l.price as listing_price,
        requester.name as requester_name, requester.email as requester_email, requester.phone as requester_phone,
        responded_by_user.name as responded_by_name
      FROM viewing_requests vr
      JOIN listings l ON vr.listing_id = l.id
      JOIN users requester ON vr.requester_id = requester.id
      LEFT JOIN users responded_by_user ON vr.responded_by = responded_by_user.id
      WHERE l.author_id = $1
      ORDER BY vr.created_at DESC
    `;
    
    const result = await pool.query(query, [ownerId]);
    return result.rows;
  }

  // Find by requester ID
  static async findByRequesterId(requesterId) {
    const query = `
      SELECT 
        vr.*,
        l.title as listing_title, l.location as listing_location, l.price as listing_price,
        landlord.name as landlord_name, landlord.email as landlord_email, landlord.phone as landlord_phone
      FROM viewing_requests vr
      JOIN listings l ON vr.listing_id = l.id
      JOIN users landlord ON l.author_id = landlord.id
      WHERE vr.requester_id = $1
      ORDER BY vr.created_at DESC
    `;
    
    const result = await pool.query(query, [requesterId]);
    return result.rows;
  }

  // Update viewing request
  static async update(id, updateData) {
    const { status, landlordMessage, respondedBy, scheduledDate, notes } = updateData;
    
    const query = `
      UPDATE viewing_requests 
      SET status = $1, landlord_message = $2, responded_by = $3, 
          responded_at = CURRENT_TIMESTAMP, scheduled_date = $4, notes = $5,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `;
    
    const values = [status, landlordMessage, respondedBy, scheduledDate, notes, id];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Get pending requests count for owner
  static async getPendingCount(ownerId) {
    const query = `
      SELECT COUNT(*) as pending_count
      FROM viewing_requests vr
      JOIN listings l ON vr.listing_id = l.id
      WHERE l.author_id = $1 AND vr.status = 'pending'
    `;
    
    const result = await pool.query(query, [ownerId]);
    return parseInt(result.rows[0].pending_count);
  }

  // Check if user has pending request for listing
  static async hasPendingRequest(requesterId, listingId) {
    const query = `
      SELECT COUNT(*) as count
      FROM viewing_requests 
      WHERE requester_id = $1 AND listing_id = $2 AND status = 'pending'
    `;
    
    const result = await pool.query(query, [requesterId, listingId]);
    return parseInt(result.rows[0].count) > 0;
  }
}

export default ViewingRequest;