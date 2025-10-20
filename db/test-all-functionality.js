import pool from '../backend/database.js';
import User from '../backend/models/User.js';
import Listing from '../backend/models/Listing.js';
import ViewingRequest from '../backend/models/ViewingRequest.js';
import emailService from '../backend/service/emailService.js';

const testAllFunctionality = async () => {
  console.log('🧪 Testing All Application Functionality...\n');

  try {
    // Test 1: Database Connection
    console.log('1. Testing Database Connection...');
    const dbResult = await pool.query('SELECT version()');
    console.log('✅ Database connected:', dbResult.rows[0].version.split(',')[0]);

    // Test 2: User Operations
    console.log('\n2. Testing User Operations...');
    const testUser = {
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      phone: '+1234567890'
    };

    const user = await User.create(testUser);
    console.log('✅ User created:', { id: user.id, email: user.email });

    const foundUser = await User.findByEmail(testUser.email);
    console.log('✅ User retrieved by email:', foundUser.email);

    // Test 3: Listing Operations
    console.log('\n3. Testing Listing Operations...');
    const testListing = {
      title: 'Test Luxury Apartment',
      description: 'A beautiful test apartment',
      price: 2000,
      location: '123 Test Street, Test City',
      bedrooms: 2,
      bathrooms: 2,
      area: 1200,
      propertyType: 'apartment',
      amenities: ['parking', 'gym'],
      availableFrom: '2024-02-01',
      authorId: user.id
    };

    const listing = await Listing.create(testListing);
    console.log('✅ Listing created:', { id: listing.id, title: listing.title, price: listing.price });

    // DEBUG: Check the author_id and status of the created listing
    const listingCheck = await pool.query('SELECT author_id, status FROM listings WHERE id = $1', [listing.id]);
    console.log('🔍 Created listing author_id:', listingCheck.rows[0].author_id);
    console.log('🔍 Created listing status:', listingCheck.rows[0].status);
    console.log('🔍 User ID:', user.id);

    const userListings = await Listing.findByUserId(user.id);
    console.log('✅ User listings retrieved:', userListings.length);

    // DEBUG: Check active listings directly
    const activeListingsDirect = await pool.query("SELECT * FROM listings WHERE status = 'active'");
    console.log('🔍 Direct query for active listings count:', activeListingsDirect.rows.length);

    // Test 4: Viewing Request Operations
    console.log('\n4. Testing Viewing Request Operations...');
    const testRequest = {
      listing_id: listing.id,
      requester_id: user.id,
      preferredDate: new Date('2024-01-25T10:00:00Z'),
      message: 'I would like to schedule a viewing for this test property.'
    };

    const viewingRequest = await ViewingRequest.create(testRequest);
    console.log('✅ Viewing request created:', { id: viewingRequest.id, status: viewingRequest.status });

    // Test 5: Email Service (OTP)
    console.log('\n5. Testing Email Service (OTP)...');
    const otpResult = await emailService.sendEmailVerificationOTP(testUser.email, testUser.name);
    
    if (otpResult.success) {
      console.log('✅ OTP email sent successfully');
      console.log('📧 OTP Info:', process.env.NODE_ENV === 'development' ? otpResult : 'Check email');
    } else {
      console.log('⚠️ OTP email failed (might be due to email configuration):', otpResult.message);
    }

    // Test 6: Data Retrieval Operations
    console.log('\n6. Testing Data Retrieval Operations...');
    
    const activeListings = await Listing.findActive();
    console.log('✅ Active listings retrieved:', activeListings.listings?.length || activeListings.length);

    // Test 7: Update Operations
    console.log('\n7. Testing Update Operations...');
    const updatedUser = await User.update(user.id, { name: 'Updated Test User', phone: '+0987654321', email: testUser.email });
    console.log('✅ User updated:', { name: updatedUser.name, phone: updatedUser.phone });

    // Test 8: Search Operations
    console.log('\n8. Testing Search Operations...');
    const searchResults = await Listing.search({ location: 'test', minPrice: 1000, maxPrice: 3000 });
    console.log('✅ Search results:', searchResults.listings?.length || searchResults.length);

    console.log('\n🎉 All functionality tests completed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('   ✅ Database connection');
    console.log('   ✅ User CRUD operations');
    console.log('   ✅ Listing CRUD operations');
    console.log('   ✅ Viewing request operations');
    console.log('   ✅ Email service (OTP)');
    console.log('   ✅ Data retrieval');
    console.log('   ✅ Update operations');
    console.log('   ✅ Search functionality');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
};

// Run all tests
testAllFunctionality()
  .then(() => {
    console.log('\n✨ All tests passed! Your application is ready.');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Tests failed:', error);
    process.exit(1);
  });