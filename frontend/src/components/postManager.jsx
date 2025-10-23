// frontend/src/components/PostManager.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaHome, 
  FaCalendarAlt, 
  FaEye, 
  FaEdit, 
  FaTrash, 
  FaTimes,
  FaPlus,
  FaImage,
  FaMapMarkerAlt,
  FaBed,
  FaBath,
  FaRulerCombined,
  FaDollarSign,
  FaEnvelope,
  FaPhone,
  FaCalendar,
  FaUser,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle
} from 'react-icons/fa';
import { 
  IoIosStats,
  IoIosList,
  IoIosNotifications
} from 'react-icons/io';
import './PostManager.css';

const PostManager = ({ user }) => {
  const [listings, setListings] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [viewingRequests, setViewingRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('my-listings');
  const [userStats, setUserStats] = useState({
    totalListings: 0,
    activeListings: 0,
    pendingRequests: 0,
    totalViews: 0
  });
  const [dbSetupInProgress, setDbSetupInProgress] = useState(false);

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    propertyType: 'apartment',
    amenities: [],
    availableFrom: '',
    contactEmail: '',
    contactPhone: '',
    images: [],
    status: 'active'
  });

  // Redirect if no user
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchUserListings();
    fetchViewingRequests();
    fetchUserStats();
  }, [user, navigate]);

  // API base URL
  const API_BASE = 'http://localhost:5000/api/auth';

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  // Fetch user listings
  const fetchUserListings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/listings/user/${user.id}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        setMessage(errorData.error || 'Failed to load listings');
        setListings([]);
        return;
      }

      const data = await response.json();
      setListings(data || []);
      
    } catch (error) {
      console.error('Error fetching listings:', error);
      setMessage('Unable to connect to server. Please check your connection.');
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch viewing requests
  const fetchViewingRequests = async () => {
    try {
      const response = await fetch(`${API_BASE}/listings/viewing-requests/owner/${user.id}`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        setViewingRequests([]);
        return;
      }

      const data = await response.json();
      setViewingRequests(data || []);
    } catch (error) {
      console.error('Error fetching viewing requests:', error);
      setViewingRequests([]);
    }
  };

  // Fetch user stats
  const fetchUserStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/users/${user.id}/stats`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        // Calculate stats from existing data as fallback
        const calculatedStats = {
          totalListings: listings.length,
          activeListings: listings.filter(l => l.status === 'active').length,
          pendingRequests: viewingRequests.filter(r => r.status === 'pending').length,
          totalViews: 0
        };
        setUserStats(calculatedStats);
        return;
      }

      const stats = await response.json();
      setUserStats(stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      // Fallback to calculated stats
      const calculatedStats = {
        totalListings: listings.length,
        activeListings: listings.filter(l => l.status === 'active').length,
        pendingRequests: viewingRequests.filter(r => r.status === 'pending').length,
        totalViews: 0
      };
      setUserStats(calculatedStats);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAmenityChange = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    setLoading(true);
    
    try {
      const uploadedImages = [];
      
      for (const file of files) {
        const uploadFormData = new FormData();
        uploadFormData.append('image', file);
        
        const response = await fetch(`${API_BASE}/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: uploadFormData
        });
        
        if (response.ok) {
          const data = await response.json();
          uploadedImages.push(data.imageUrl);
        } else {
          console.error('Image upload failed:', response.status);
        }
      }
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedImages]
      }));
    } catch (error) {
      console.error('Error uploading images:', error);
      setMessage('Error uploading images');
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Submit listing
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const url = editingListing 
        ? `${API_BASE}/listings/${editingListing.id}`
        : `${API_BASE}/listings`;
      
      const method = editingListing ? 'PUT' : 'POST';

      const submissionData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        location: formData.location,
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseFloat(formData.bathrooms),
        area: parseInt(formData.area),
        propertyType: formData.propertyType,
        amenities: formData.amenities,
        availableFrom: new Date(formData.availableFrom).toISOString(),
        contactEmail: formData.contactEmail || user.email,
        contactPhone: formData.contactPhone || user.phone || '',
        images: formData.images,
        authorId: user.id,
        status: formData.status
      };

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(submissionData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status}. ${errorText}`);
      }

      const data = await response.json();

      setMessage(editingListing ? 'Listing updated successfully!' : 'Listing created successfully!');
      setShowForm(false);
      setEditingListing(null);
      resetForm();
      setDbSetupInProgress(false);
      
      // Refresh all data
      await Promise.all([
        fetchUserListings(),
        fetchUserStats(),
        fetchViewingRequests()
      ]);
      
    } catch (error) {
      console.error('Submit error:', error);
      setMessage(error.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price: '',
      location: '',
      bedrooms: '',
      bathrooms: '',
      area: '',
      propertyType: 'apartment',
      amenities: [],
      availableFrom: '',
      contactEmail: user?.email || '',
      contactPhone: user?.phone || '',
      images: [],
      status: 'active'
    });
  };

  const handleEdit = (listing) => {
    setEditingListing(listing);
    setFormData({
      title: listing.title,
      description: listing.description,
      price: listing.price.toString(),
      location: listing.location,
      bedrooms: listing.bedrooms.toString(),
      bathrooms: listing.bathrooms.toString(),
      area: listing.area.toString(),
      propertyType: listing.property_type || listing.propertyType,
      amenities: listing.amenities || [],
      availableFrom: listing.available_from ? listing.available_from.split('T')[0] : '',
      contactEmail: listing.contact_email || listing.contactEmail || user?.email || '',
      contactPhone: listing.contact_phone || listing.contactPhone || user?.phone || '',
      images: listing.images || [],
      status: listing.status || 'active'
    });
    setShowForm(true);
  };

  const handleDelete = async (listingId) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;

    try {
      const response = await fetch(`${API_BASE}/listings/${listingId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        setMessage('Listing deleted successfully!');
        await Promise.all([
          fetchUserListings(),
          fetchUserStats()
        ]);
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || 'Error deleting listing');
      }
    } catch (error) {
      console.error('Delete error:', error);
      setMessage('Error deleting listing');
    }
  };

  const handleStatusChange = async (listingId, newStatus) => {
    try {
      const response = await fetch(`${API_BASE}/listings/${listingId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setMessage(`Listing status updated to ${newStatus}`);
        fetchUserListings();
        fetchUserStats();
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || 'Error updating listing status');
      }
    } catch (error) {
      console.error('Status change error:', error);
      setMessage('Error updating listing status');
    }
  };

  const handleViewingResponse = async (requestId, status) => {
    try {
      const response = await fetch(`${API_BASE}/listings/viewing-requests/${requestId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ 
          status,
          respondedBy: user.id 
        })
      });

      if (response.ok) {
        setMessage(`Viewing request ${status}`);
        fetchViewingRequests();
        fetchUserStats();
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || 'Error updating viewing request');
      }
    } catch (error) {
      console.error('Viewing response error:', error);
      setMessage('Error updating viewing request');
    }
  };

  // Stats Overview Component
  const StatsOverview = () => (
    <div className="stats-overview">
      <div className="stat-card">
        <div className="stat-icon"><FaHome /></div>
        <div className="stat-info">
          <h3>{userStats.totalListings}</h3>
          <p>Total Listings</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon"><FaCheckCircle /></div>
        <div className="stat-info">
          <h3>{userStats.activeListings}</h3>
          <p>Active Listings</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon"><IoIosNotifications /></div>
        <div className="stat-info">
          <h3>{userStats.pendingRequests}</h3>
          <p>Pending Requests</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon"><FaEye /></div>
        <div className="stat-info">
          <h3>{userStats.totalViews}</h3>
          <p>Total Views</p>
        </div>
      </div>
    </div>
  );

  // Database Setup Message Component
  const DatabaseSetupMessage = () => (
    <div className="db-setup-message">
      <div className="db-setup-content">
        <FaExclamationTriangle className="db-setup-icon" />
        <div className="db-setup-text">
          <h4>Database Setup Required</h4>
          <p>Your rental listings database is being set up. This might take a moment.</p>
          <p className="db-setup-hint">
            <strong>Tip:</strong> Try creating your first listing to initialize the system.
          </p>
        </div>
      </div>
    </div>
  );

  const pendingRequestsCount = viewingRequests.filter(req => req.status === 'pending').length;

  return (
    <div className="post-manager">
      <div className="post-manager-header">
        <h2><IoIosStats /> Manage Your Rental Listings</h2>
        <p>Welcome back, {user.name}! Manage your properties and connect with potential tenants.</p>
      </div>

      {dbSetupInProgress && <DatabaseSetupMessage />}

      {message && (
        <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="post-manager-tabs">
        <button 
          className={`tab-button ${activeTab === 'my-listings' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-listings')}
        >
          <IoIosList /> My Listings ({listings.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'viewing-requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('viewing-requests')}
        >
          <IoIosNotifications /> Viewing Requests ({pendingRequestsCount})
        </button>
      </div>

      <div className="post-manager-content">
        {activeTab === 'my-listings' && (
          <div className="listings-section">
            <div className="section-header">
              <h3><IoIosList /> My Rental Listings</h3>
              <button 
                className="create-listing-button"
                onClick={() => setShowForm(true)}
                disabled={loading}
              >
                <FaPlus /> Create New Listing
              </button>
            </div>

            <StatsOverview />

            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Loading your listings...</p>
              </div>
            ) : listings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><FaHome /></div>
                <h4>No listings yet</h4>
                <p>Create your first rental listing to get started!</p>
                {dbSetupInProgress ? (
                  <div className="db-setup-notice">
                    <p className="db-notice-text">
                      <FaExclamationTriangle /> Database initialization in progress...
                    </p>
                  </div>
                ) : (
                  <button 
                    className="create-listing-button"
                    onClick={() => setShowForm(true)}
                  >
                    <FaPlus /> Create Your First Listing
                  </button>
                )}
              </div>
            ) : (
              <div className="listings-grid">
                {listings.map(listing => (
                  <div key={listing.id} className="listing-card">
                    <div className="listing-images">
                      {listing.images && listing.images.length > 0 ? (
                        <img src={listing.images[0]} alt={listing.title} />
                      ) : (
                        <div className="no-image"><FaImage /></div>
                      )}
                      <div className="listing-status">
                        <span className={`status-badge ${listing.status || 'active'}`}>
                          {listing.status || 'Active'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="listing-details">
                      <h4>{listing.title}</h4>
                      <p className="listing-location"><FaMapMarkerAlt /> {listing.location}</p>
                      <div className="listing-specs">
                        <span><FaBed /> {listing.bedrooms} bed</span>
                        <span><FaBath /> {listing.bathrooms} bath</span>
                        <span><FaRulerCombined /> {listing.area} sq ft</span>
                      </div>
                      <p className="listing-price"><FaDollarSign />{listing.price}/month</p>
                      <p className="listing-description">{listing.description}</p>
                      
                      <div className="listing-meta">
                        <span>Created: {new Date(listing.created_at).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="listing-actions">
                        <select 
                          value={listing.status || 'active'} 
                          onChange={(e) => handleStatusChange(listing.id, e.target.value)}
                          className="status-select"
                        >
                          <option value="active">Active</option>
                          <option value="pending">Pending</option>
                          <option value="rented">Rented</option>
                          <option value="inactive">Inactive</option>
                        </select>
                        
                        <button 
                          className="edit-button"
                          onClick={() => handleEdit(listing)}
                        >
                          <FaEdit /> Edit
                        </button>
                        <button 
                          className="delete-button"
                          onClick={() => handleDelete(listing.id)}
                        >
                          <FaTrash /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === 'viewing-requests' && (
          <div className="viewing-requests-section">
            <h3><FaCalendarAlt /> Viewing Requests</h3>
            
            {viewingRequests.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><FaCalendarAlt /></div>
                <h4>No viewing requests</h4>
                <p>You'll see viewing requests from interested tenants here.</p>
                {dbSetupInProgress && (
                  <div className="db-setup-notice">
                    <p className="db-notice-text">
                      <FaExclamationTriangle /> Database setup may affect viewing requests
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="requests-list">
                {viewingRequests.map(request => (
                  <div key={request.id} className="request-card">
                    <div className="request-header">
                      <h4>{request.title || 'Unknown Listing'}</h4>
                      <span className={`status-badge ${request.status}`}>
                        {request.status}
                      </span>
                    </div>
                    
                    <div className="request-details">
                      <p><strong><FaUser /> From:</strong> {request.requester_name} ({request.requester_email})</p>
                      <p><strong><FaPhone /> Phone:</strong> {request.requester_phone || 'Not provided'}</p>
                      <p><strong><FaCalendarAlt /> Preferred Date:</strong> {new Date(request.preferred_date).toLocaleDateString()}</p>
                      <p><strong>Message:</strong> {request.message}</p>
                      <p><strong>Submitted:</strong> {new Date(request.requested_at).toLocaleDateString()}</p>
                    </div>

                    {request.status === 'pending' && (
                      <div className="request-actions">
                        <button 
                          className="approve-button"
                          onClick={() => handleViewingResponse(request.id, 'approved')}
                        >
                          <FaCheckCircle /> Approve
                        </button>
                        <button 
                          className="decline-button"
                          onClick={() => handleViewingResponse(request.id, 'declined')}
                        >
                          <FaTimesCircle /> Decline
                        </button>
                      </div>
                    )}
                    
                    {request.status === 'approved' && (
                      <div className="request-approved">
                        <p><FaCheckCircle /> You approved this request</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showForm && (
        <div className="listing-form-overlay">
          <div className="listing-form-container">
            <div className="form-header">
              <h2>{editingListing ? 'Edit Listing' : 'Create New Listing'}</h2>
              <button 
                className="close-button"
                onClick={() => {
                  setShowForm(false);
                  setEditingListing(null);
                  resetForm();
                }}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="listing-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Beautiful 2-Bedroom Apartment"
                  />
                </div>

                <div className="form-group">
                  <label>Property Type *</label>
                  <select
                    name="propertyType"
                    value={formData.propertyType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="apartment">Apartment</option>
                    <option value="house">House</option>
                    <option value="condo">Condo</option>
                    <option value="studio">Studio</option>
                    <option value="townhouse">Townhouse</option>
                  </select>
                </div>

                <div className="form-group">
                  <label><FaDollarSign /> Price ($) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    placeholder="Monthly rent"
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label><FaMapMarkerAlt /> Location *</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    required
                    placeholder="Full address"
                  />
                </div>

                <div className="form-group">
                  <label><FaBed /> Bedrooms *</label>
                  <input
                    type="number"
                    name="bedrooms"
                    value={formData.bedrooms}
                    onChange={handleInputChange}
                    required
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label><FaBath /> Bathrooms *</label>
                  <input
                    type="number"
                    name="bathrooms"
                    value={formData.bathrooms}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.5"
                  />
                </div>

                <div className="form-group">
                  <label><FaRulerCombined /> Area (sq ft) *</label>
                  <input
                    type="number"
                    name="area"
                    value={formData.area}
                    onChange={handleInputChange}
                    required
                    placeholder="Square footage"
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label><FaCalendar /> Available From *</label>
                  <input
                    type="date"
                    name="availableFrom"
                    value={formData.availableFrom}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label><FaEnvelope /> Contact Email</label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    placeholder={user?.email || "Your email"}
                  />
                </div>

                <div className="form-group">
                  <label><FaPhone /> Contact Phone</label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                    placeholder={user?.phone || "Your phone number"}
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label>Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows="4"
                  placeholder="Describe the property, neighborhood, and key features..."
                />
              </div>

              <div className="form-group full-width">
                <label>Amenities</label>
                <div className="amenities-grid">
                  {['parking', 'laundry', 'furnished', 'pet-friendly', 'gym', 'pool', 'balcony', 'garden', 'security', 'elevator', 'air-conditioning', 'heating'].map(amenity => (
                    <label key={amenity} className="amenity-checkbox">
                      <input
                        type="checkbox"
                        checked={formData.amenities.includes(amenity)}
                        onChange={() => handleAmenityChange(amenity)}
                      />
                      <span>{amenity.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group full-width">
                <label><FaImage /> Images</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={loading}
                />
                <div className="image-preview">
                  {formData.images.map((image, index) => (
                    <div key={index} className="preview-image">
                      <img src={image} alt={`Preview ${index + 1}`} />
                      <button 
                        type="button" 
                        className="remove-image"
                        onClick={() => removeImage(index)}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {dbSetupInProgress && (
                <div className="db-setup-notice-form">
                  <p><FaExclamationTriangle /> Database setup detected. First-time creation may take a moment.</p>
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingListing(null);
                    resetForm();
                  }}
                  disabled={loading}
                >
                  <FaTimes /> Cancel
                </button>
                <button
                  type="submit"
                  className="submit-button"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : (editingListing ? <><FaEdit /> Update Listing</> : <><FaPlus /> Create Listing</>)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostManager;