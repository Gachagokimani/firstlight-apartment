// frontend/src/components/PostManager.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PostManager.css';

const PostManager = ({ user, onProfileUpdate }) => {
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

  const navigate = useNavigate();

  // Form state - aligned with backend post structure
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

  // Fetch user's listings with user tracking
  const fetchUserListings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/posts/user/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setListings(data.posts || data);
        
        // Update user stats in local storage for consistency
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
          if (onProfileUpdate) {
            onProfileUpdate(data.user);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
      setMessage('Error loading your listings');
    }
  };

  // Fetch viewing requests with user context
  const fetchViewingRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/posts/viewing-requests/owner/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setViewingRequests(data.requests || data);
      }
    } catch (error) {
      console.error('Error fetching viewing requests:', error);
    }
  };

  // Fetch user statistics for dashboard
  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/users/${user.id}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const stats = await response.json();
        setUserStats(stats);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
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
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await fetch('http://localhost:5000/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });
        
        if (response.ok) {
          const data = await response.json();
          uploadedImages.push(data.imageUrl);
        }
      }
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedImages]
      }));
    } catch (error) {
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

  // Submit listing - aligned with posts.js backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const url = editingListing 
        ? `http://localhost:5000/api/posts/${editingListing.id}`
        : 'http://localhost:5000/api/posts';
      
      const method = editingListing ? 'PUT' : 'POST';

      const submissionData = {
        ...formData,
        authorId: user.id,
        price: parseFloat(formData.price),
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseFloat(formData.bathrooms),
        area: parseInt(formData.area),
        availableFrom: new Date(formData.availableFrom).toISOString(),
        // Ensure contact info falls back to user profile
        contactEmail: formData.contactEmail || user.email,
        contactPhone: formData.contactPhone || user.phone || ''
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submissionData)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(editingListing ? 'Listing updated successfully!' : 'Listing created successfully!');
        setShowForm(false);
        setEditingListing(null);
        resetForm();
        
        // Refresh all data
        await Promise.all([
          fetchUserListings(),
          fetchUserStats(),
          fetchViewingRequests()
        ]);
        
        // Update user profile if needed
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
          if (onProfileUpdate) {
            onProfileUpdate(data.user);
          }
        }
      } else {
        setMessage(data.error || 'Something went wrong');
      }
    } catch (error) {
      setMessage('Network error. Please try again.');
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
      propertyType: listing.propertyType,
      amenities: listing.amenities || [],
      availableFrom: listing.availableFrom ? listing.availableFrom.split('T')[0] : '',
      contactEmail: listing.contactEmail || user?.email || '',
      contactPhone: listing.contactPhone || user?.phone || '',
      images: listing.images || [],
      status: listing.status || 'active'
    });
    setShowForm(true);
  };

  const handleDelete = async (listingId) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/posts/${listingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setMessage('Listing deleted successfully!');
        await Promise.all([
          fetchUserListings(),
          fetchUserStats()
        ]);
      } else {
        setMessage('Error deleting listing');
      }
    } catch (error) {
      setMessage('Error deleting listing');
    }
  };

  const handleStatusChange = async (listingId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/posts/${listingId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setMessage(`Listing ${newStatus}`);
        fetchUserListings();
        fetchUserStats();
      }
    } catch (error) {
      setMessage('Error updating listing status');
    }
  };

  const handleViewingResponse = async (requestId, status) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/posts/viewing-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status,
          respondedBy: user.id 
        })
      });

      if (response.ok) {
        setMessage(`Viewing request ${status}`);
        fetchViewingRequests();
        fetchUserStats();
      }
    } catch (error) {
      setMessage('Error updating viewing request');
    }
  };

  // Stats Overview Component
  const StatsOverview = () => (
    <div className="stats-overview">
      <div className="stat-card">
        <div className="stat-icon">🏠</div>
        <div className="stat-info">
          <h3>{userStats.totalListings}</h3>
          <p>Total Listings</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">✅</div>
        <div className="stat-info">
          <h3>{userStats.activeListings}</h3>
          <p>Active Listings</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">📅</div>
        <div className="stat-info">
          <h3>{userStats.pendingRequests}</h3>
          <p>Pending Requests</p>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">👁️</div>
        <div className="stat-info">
          <h3>{userStats.totalViews}</h3>
          <p>Total Views</p>
        </div>
      </div>
    </div>
  );

  const renderListingForm = () => (
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
            ×
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
              <label>Price ($) *</label>
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
              <label>Location *</label>
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
              <label>Bedrooms *</label>
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
              <label>Bathrooms *</label>
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
              <label>Area (sq ft) *</label>
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
              <label>Available From *</label>
              <input
                type="date"
                name="availableFrom"
                value={formData.availableFrom}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Contact Email</label>
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleInputChange}
                placeholder={user?.email || "Your email"}
              />
            </div>

            <div className="form-group">
              <label>Contact Phone</label>
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
            <label>Images</label>
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
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

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
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={loading}
            >
              {loading ? 'Saving...' : (editingListing ? 'Update Listing' : 'Create Listing')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderMyListings = () => (
    <div className="listings-section">
      <div className="section-header">
        <h3>My Rental Listings</h3>
        <button 
          className="create-listing-button"
          onClick={() => setShowForm(true)}
        >
          + Create New Listing
        </button>
      </div>

      <StatsOverview />

      {listings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏠</div>
          <h4>No listings yet</h4>
          <p>Create your first rental listing to get started!</p>
          <button 
            className="create-listing-button"
            onClick={() => setShowForm(true)}
          >
            Create Your First Listing
          </button>
        </div>
      ) : (
        <div className="listings-grid">
          {listings.map(listing => (
            <div key={listing.id} className="listing-card">
              <div className="listing-images">
                {listing.images && listing.images.length > 0 ? (
                  <img src={listing.images[0]} alt={listing.title} />
                ) : (
                  <div className="no-image">No Image</div>
                )}
                <div className="listing-status">
                  <span className={`status-badge ${listing.status || 'active'}`}>
                    {listing.status || 'Active'}
                  </span>
                </div>
                <div className="listing-views">
                  👁️ {listing.viewCount || 0} views
                </div>
              </div>
              
              <div className="listing-details">
                <h4>{listing.title}</h4>
                <p className="listing-location">📍 {listing.location}</p>
                <div className="listing-specs">
                  <span>🛏️ {listing.bedrooms} bed</span>
                  <span>🚿 {listing.bathrooms} bath</span>
                  <span>📏 {listing.area} sq ft</span>
                </div>
                <p className="listing-price">${listing.price}/month</p>
                <p className="listing-description">{listing.description}</p>
                
                <div className="listing-meta">
                  <span>Created: {new Date(listing.createdAt).toLocaleDateString()}</span>
                  {listing.updatedAt && listing.updatedAt !== listing.createdAt && (
                    <span>Updated: {new Date(listing.updatedAt).toLocaleDateString()}</span>
                  )}
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
                    Edit
                  </button>
                  <button 
                    className="delete-button"
                    onClick={() => handleDelete(listing.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderViewingRequests = () => (
    <div className="viewing-requests-section">
      <h3>Viewing Requests</h3>
      
      {viewingRequests.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <h4>No viewing requests</h4>
          <p>You'll see viewing requests from interested tenants here.</p>
        </div>
      ) : (
        <div className="requests-list">
          {viewingRequests.map(request => (
            <div key={request.id} className="request-card">
              <div className="request-header">
                <h4>{request.listing?.title}</h4>
                <span className={`status-badge ${request.status}`}>
                  {request.status}
                </span>
              </div>
              
              <div className="request-details">
                <p><strong>From:</strong> {request.requester?.name} ({request.requester?.email})</p>
                <p><strong>Phone:</strong> {request.requester?.phone || 'Not provided'}</p>
                <p><strong>Preferred Date:</strong> {new Date(request.preferredDate).toLocaleDateString()}</p>
                <p><strong>Message:</strong> {request.message}</p>
                <p><strong>Submitted:</strong> {new Date(request.createdAt).toLocaleDateString()}</p>
              </div>

              {request.status === 'pending' && (
                <div className="request-actions">
                  <button 
                    className="approve-button"
                    onClick={() => handleViewingResponse(request.id, 'approved')}
                  >
                    Approve
                  </button>
                  <button 
                    className="decline-button"
                    onClick={() => handleViewingResponse(request.id, 'declined')}
                  >
                    Decline
                  </button>
                </div>
              )}
              
              {request.status === 'approved' && (
                <div className="request-approved">
                  <p>✅ You approved this request on {new Date(request.updatedAt).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (!user) {
    return (
      <div className="post-manager">
        <div className="not-authorized">
          <h2>Please log in to manage your listings</h2>
          <button onClick={() => navigate('/login')} className="login-redirect-button">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="post-manager">
      <div className="post-manager-header">
        <h2>Manage Your Rental Listings</h2>
        <p>Welcome back, {user.name}! Manage your properties and connect with potential tenants.</p>
      </div>

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
          My Listings ({listings.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'viewing-requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('viewing-requests')}
        >
          Viewing Requests ({viewingRequests.filter(req => req.status === 'pending').length})
        </button>
      </div>

      <div className="post-manager-content">
        {activeTab === 'my-listings' && renderMyListings()}
        {activeTab === 'viewing-requests' && renderViewingRequests()}
      </div>

      {showForm && renderListingForm()}
    </div>
  );
};

export default PostManager;