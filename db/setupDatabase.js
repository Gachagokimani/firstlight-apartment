import pool from '../backend/database.js';
import dotenv from 'dotenv';

dotenv.config();

const createTables = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        role VARCHAR(20) DEFAULT 'tenant',
        avatar TEXT,
        is_verified BOOLEAN DEFAULT FALSE,
        preferences JSONB DEFAULT '{}',
        stats JSONB DEFAULT '{"totalListings": 0, "activeListings": 0, "totalViews": 0, "respondedRequests": 0}',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create listings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS listings (
        id SERIAL PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
        location TEXT NOT NULL,
        coordinates JSONB,
        bedrooms INTEGER NOT NULL CHECK (bedrooms >= 0),
        bathrooms DECIMAL(3,1) NOT NULL CHECK (bathrooms >= 0),
        area INTEGER NOT NULL CHECK (area >= 0),
        property_type VARCHAR(50) NOT NULL,
        amenities TEXT[],
        available_from DATE NOT NULL,
        contact_email VARCHAR(255),
        contact_phone VARCHAR(20),
        images TEXT[],
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'pending', 'rented', 'inactive')),
        author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        view_count INTEGER DEFAULT 0 CHECK (view_count >= 0),
        featured BOOLEAN DEFAULT FALSE,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create viewing_requests table (FIXED - removed the constraint with WHERE)
    await client.query(`
      CREATE TABLE IF NOT EXISTS viewing_requests (
        id SERIAL PRIMARY KEY,
        listing_id INTEGER REFERENCES listings(id) ON DELETE CASCADE,
        requester_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        preferred_date TIMESTAMPTZ NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'cancelled')),
        landlord_message TEXT,
        responded_by INTEGER REFERENCES users(id),
        responded_at TIMESTAMPTZ,
        scheduled_date TIMESTAMPTZ,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create otps table
    await client.query(`
      CREATE TABLE IF NOT EXISTS otps (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        otp VARCHAR(10) NOT NULL,
        type VARCHAR(50) NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        used_at TIMESTAMPTZ,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create partial unique index for viewing_requests (ADD THIS)
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS unique_pending_request 
      ON viewing_requests (listing_id, requester_id) 
      WHERE status = 'pending';
    `);

    // Create other indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_listings_author_id ON listings(author_id);
      CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
      CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price);
      CREATE INDEX IF NOT EXISTS idx_listings_location ON listings(location);
      CREATE INDEX IF NOT EXISTS idx_viewing_requests_listing_id ON viewing_requests(listing_id);
      CREATE INDEX IF NOT EXISTS idx_viewing_requests_requester_id ON viewing_requests(requester_id);
      CREATE INDEX IF NOT EXISTS idx_viewing_requests_status ON viewing_requests(status);
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_otps_email ON otps(email);
      CREATE INDEX IF NOT EXISTS idx_otps_email_type ON otps(email, type);
      CREATE INDEX IF NOT EXISTS idx_otps_expires_at ON otps(expires_at);
      CREATE INDEX IF NOT EXISTS idx_otps_created_at ON otps(created_at);
    `);

    await client.query('COMMIT');
    console.log('✅ Database tables created successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating database tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Run the setup
createTables().then(() => {
  console.log('Database setup completed.');
  process.exit(0);
}).catch(error => {
  console.error('Database setup failed:', error);
  process.exit(1);
});