import pool from '../database.js';
import bcrypt from 'bcryptjs';

const seedTestData = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    console.log('🌱 Seeding test data...');

    // Create test users
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const users = await client.query(`
      INSERT INTO users (name, email, password, phone, role, is_verified) 
      VALUES 
        ('John Landlord', 'john.landlord@test.com', $1, '+1234567890', 'landlord', true),
        ('Sarah Tenant', 'sarah.tenant@test.com', $1, '+1234567891', 'tenant', true),
        ('Mike Property', 'mike.property@test.com', $1, '+1234567892', 'landlord', true)
      RETURNING id, name, email, role
    `, [hashedPassword]);
    
    console.log('✅ Created test users');

    // Create test listings
    const listings = await client.query(`
      INSERT INTO listings (
        title, description, price, location, bedrooms, bathrooms, area,
        property_type, amenities, available_from, author_id
      ) 
      VALUES 
        (
          'Beautiful 2-Bedroom Apartment', 
          'Spacious apartment in the city center with great views', 
          1500, '123 Main St, New York, NY', 2, 1.5, 1200,
          'apartment', '{"parking", "laundry", "furnished"}', '2024-02-01', $1
        ),
        (
          'Modern Studio Downtown', 
          'Cozy studio apartment in downtown area', 
          1200, '456 Downtown Ave, New York, NY', 1, 1, 800,
          'studio', '{"gym", "elevator", "security"}', '2024-01-15', $2
        ),
        (
          'Luxury Condo with Pool', 
          'Luxurious condo with swimming pool and gym access', 
          2500, '789 Luxury Ln, New York, NY', 3, 2, 1800,
          'condo', '{"pool", "gym", "parking", "security"}', '2024-03-01', $1
        )
      RETURNING id, title, price
    `, [users.rows[0].id, users.rows[2].id]);
    
    console.log('✅ Created test listings');

    // Create test viewing requests
    await client.query(`
      INSERT INTO viewing_requests (
        listing_id, requester_id, preferred_date, message, status
      )
      VALUES 
        ($1, $2, '2024-01-20 14:00:00', 'I would like to view this property. Please let me know if available.', 'pending'),
        ($3, $2, '2024-01-25 10:00:00', 'Interested in scheduling a viewing for this studio.', 'approved')
    `, [listings.rows[0].id, users.rows[1].id, listings.rows[1].id]);
    
    console.log('✅ Created test viewing requests');

    // Create test OTPs
    await client.query(`
      INSERT INTO otps (email, otp, type, expires_at)
      VALUES 
        ('sarah.tenant@test.com', '123456', 'email_verification', NOW() + INTERVAL '10 minutes'),
        ('john.landlord@test.com', '654321', 'password_reset', NOW() + INTERVAL '10 minutes')
    `);
    
    console.log('✅ Created test OTPs');

    await client.query('COMMIT');
    console.log('🎉 Test data seeded successfully!');
    
    // Display created data
    console.log('\n📊 Created Test Data Summary:');
    console.log('👥 Users:', users.rows.length);
    console.log('🏠 Listings:', listings.rows.length);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding test data:', error);
    throw error;
  } finally {
    client.release();
  }
};

seedTestData()
  .then(() => {
    console.log('\n✨ Test data setup completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Test data setup failed:', error);
    process.exit(1);
  });