// frontend/src/components/PostManager.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaHome, FaCalendarAlt, FaEye, FaEdit, FaTrash, FaTimes,
  FaPlus, FaImage, FaMapMarkerAlt, FaBed, FaBath, FaRulerCombined,
  FaDollarSign, FaEnvelope, FaPhone, FaCalendar, FaUser,
  FaCheckCircle, FaTimesCircle, FaExclamationTriangle,
  FaChartLine, FaBuilding, FaSync
} from 'react-icons/fa';
import { 
  IoIosStats, IoIosList, IoIosNotifications, IoIosSettings
} from 'react-icons/io';
import { MdApartment, MdHouse, MdCabin, MdVilla } from 'react-icons/md';
import './PostManager.css';

// Constants
const API_BASE = 'http://localhost:5000/api/auth';
const MAX_RETRIES = 2;
const REQUEST_TIMEOUT = 10000;

// Custom hook for API calls
const useApi = () => {
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }, []);

  const fetchWithRetry = async (url, options = {}, retryCount = 0) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
      
      const response = await fetch(url, {
        ...options,
        headers: { ...getAuthHeaders(), ...options.headers },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}`);
        error.status = response.status;
        
        if (error.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        
        if (error.status >= 400 && error.status < 500) {
          throw error;
        }
        
        if (retryCount < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return fetchWithRetry(url, options, retryCount + 1);
        }
        throw error;
      }

      return response;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your connection.');
      }
      throw error;
    }
  };

  return { fetchWithRetry, getAuthHeaders };
};

// Safe JSON parser
const safeJsonParse = (text) => {
  if (!text || typeof text !== 'string') {
    return null;
  }
  
  if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
    throw new Error('Authentication required. Please log in again.');
  }
  
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('JSON parse error:', error);
    throw new Error('Invalid response from server.');
  }
};

// Sub-components
const StatsOverview = ({ userStats }) => (
  <div className="stats-overview">
    <div className="stat-card">
      <div className="stat-icon total"><FaBuilding /></div>
      <div className="stat-info">
        <h3>{userStats.totalListings || 0}</h3>
        <p>Total Listings</p>
      </div>
    </div>
    <div className="stat-card">
      <div className="stat-icon active"><FaCheckCircle /></div>
      <div className="stat-info">
        <h3>{userStats.activeListings || 0}</h3>
        <p>Active Listings</p>
      </div>
    </div>
    <div className="stat-card">
      <div className="stat-icon pending"><IoIosNotifications /></div>
      <div className="stat-info">
        <h3>{userStats.pendingRequests || 0}</h3>
        <p>Pending Requests</p>
      </div>
    </div>
    <div className="stat-card">
      <div className="stat-icon views"><FaEye /></div>
      <div className="stat-info">
        <h3>{userStats.totalViews || 0}</h3>
        <p>Total Views</p>
      </div>
    </div>
  </div>
);

const LoadingSpinner = () => (
  <div className="loading-spinner">
    <FaSync className="spinner-icon" />
    <p>Loading...</p>
  </div>
);

const ErrorMessage = ({ message, onRetry }) => (
  <div className="error-message">
    <FaExclamationTriangle className="error-icon" />
    <div className="error-content">
      <h4>Something went wrong</h4>
      <p>{message}</p>
      {onRetry && (
        <button className="retry-btn" onClick={onRetry}>
          <FaSync /> Try Again
        </button>
      )}
    </div>
  </div>
);

const PostManager = ({ user }) => {
  const [listings, setListings] = useState([]);
  const [viewingRequests, setViewingRequests] = useState([]);
  const [userStats, setUserStats] = useState({
    totalListings: 0,
    activeListings: 0,
    pendingRequests: 0,
    totalViews: 0
  });
  const [showForm, setShowForm] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('my-listings');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(true);

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

  const { fetchWithRetry } = useApi();
  const navigate = useNavigate();

  // Authentication check - only run once on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!user || !token) {
        console.log('No user or token, redirecting to login');
        navigate('/login');
        return;
      }

      // Verify token is still valid
      try {
        const response = await fetch(`${API_BASE}/verify-token`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
          throw new Error('Token invalid');
        }
        
        console.log('Token valid, proceeding with data load');
        setIsAuthenticated(true);
        await fetchAllData();
      } catch (error) {
        console.log('Token validation failed:', error);
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        navigate('/login');
      }
    };

    checkAuth();
  }, []); // Empty dependency array - run only once on mount

  // Single fetch function - no dependencies to avoid re-renders
  const fetchAllData = useCallback(async () => {
    if (!user?.id) return;
    
    console.log('Starting data fetch...');
    setIsRefreshing(true);
    setError(null);
    
    try {
      // Fetch all data sequentially to avoid race conditions
      await fetchUserListings();
      await fetchViewingRequests();
      await fetchUserStats();
      console.log('Data fetch completed successfully');
    } catch (error) {
      console.error('Error in fetchAllData:', error);
      // Don't set error state for auth issues - we'll redirect instead
      if (!error.message.includes('Authentication')) {
        setError('Failed to load data. Please try again.');
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [user?.id]);

  // Individual fetch functions - defined with useCallback to prevent recreation
  const fetchUserListings = useCallback(async () => {
    try {
      console.log('Fetching user listings...');
      const response = await fetchWithRetry(`${API_BASE}/listings/user/${user.id}`);
      const text = await response.text();
      
      if (!text) {
        setListings([]);
        return;
      }

      const data = safeJsonParse(text);
      setListings(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching listings:', error);
      if (error.message.includes('Authentication')) {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        navigate('/login');
        return;
      }
      setListings([]);
      throw error;
    }
  }, [user?.id, fetchWithRetry, navigate]);

  const fetchViewingRequests = useCallback(async () => {
    try {
      console.log('Fetching viewing requests...');
      const response = await fetchWithRetry(
        `${API_BASE}/listings/viewing-requests/owner/${user.id}`
      );
      const text = await response.text();
      const data = safeJsonParse(text);
      setViewingRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching viewing requests:', error);
      setViewingRequests([]);
      throw error;
    }
  }, [user?.id, fetchWithRetry]);

  const fetchUserStats = useCallback(async () => {
    try {
      console.log('Fetching user stats...');
      const response = await fetchWithRetry(`${API_BASE}/users/${user.id}/stats`);
      const text = await response.text();
      const stats = safeJsonParse(text);
      
      if (stats && typeof stats === 'object') {
        setUserStats(stats);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
      // Don't throw error for stats - it's not critical
    }
  }, [user?.id, fetchWithRetry]);

  // Form validation
  const validateForm = useCallback(() => {
    const required = ['title', 'description', 'price', 'location', 'bedrooms', 'bathrooms', 'area'];
    const missing = required.filter(field => !formData[field]?.toString().trim());
    
    if (missing.length > 0) {
      setMessage(`Please fill in: ${missing.join(', ')}`);
      return false;
    }

    if (isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      setMessage('Please enter a valid price');
      return false;
    }

    if (isNaN(formData.bedrooms) || parseInt(formData.bedrooms) < 0) {
      setMessage('Please enter valid bedrooms');
      return false;
    }

    if (isNaN(formData.bathrooms) || parseFloat(formData.bathrooms) < 0) {
      setMessage('Please enter valid bathrooms');
      return false;
    }

    if (isNaN(formData.area) || parseInt(formData.area) <= 0) {
      setMessage('Please enter valid area');
      return false;
    }

    return true;
  }, [formData]);

  // Form handlers
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleAmenityChange = useCallback((amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  }, []);

  const handleImageUpload = useCallback(async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setLoading(true);
    
    try {
      const uploadedImages = [];
      
      for (const file of files) {
        const uploadFormData = new FormData();
        uploadFormData.append('image', file);
        
        const response = await fetch(`${API_BASE}/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: uploadFormData
        });
        
        if (response.ok) {
          const text = await response.text();
          const data = safeJsonParse(text);
          if (data?.imageUrl) {
            uploadedImages.push(data.imageUrl);
          }
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
  }, []);

  const removeImage = useCallback((index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  }, []);

  // Submit listing
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setMessage('');
    setError(null);

    try {
      const url = editingListing 
        ? `${API_BASE}/listings/${editingListing.id}`
        : `${API_BASE}/listings`;
      
      const method = editingListing ? 'PUT' : 'POST';

      const submissionData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        location: formData.location.trim(),
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseFloat(formData.bathrooms),
        area: parseInt(formData.area),
        propertyType: formData.propertyType,
        amenities: formData.amenities,
        availableFrom: formData.availableFrom ? new Date(formData.availableFrom).toISOString() : null,
        contactEmail: formData.contactEmail || user?.email || '',
        contactPhone: formData.contactPhone || user?.phone || '',
        images: formData.images,
        authorId: user.id,
        status: formData.status
      };

      const response = await fetchWithRetry(url, {
        method,
        body: JSON.stringify(submissionData)
      });

      const text = await response.text();
      safeJsonParse(text); // Validate response

      setMessage(editingListing ? 'Listing updated!' : 'Listing created!');
      setShowForm(false);
      setEditingListing(null);
      resetForm();
      await fetchAllData();
      
    } catch (error) {
      console.error('Submit error:', error);
      if (error.message.includes('Authentication')) {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        navigate('/login');
        return;
      }
      setError(error.message || 'Failed to save listing.');
    } finally {
      setLoading(false);
    }
  }, [formData, editingListing, user, validateForm, fetchWithRetry, fetchAllData, navigate]);

  const resetForm = useCallback(() => {
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
  }, [user]);

  const handleEdit = useCallback((listing) => {
    setEditingListing(listing);
    setShowForm(true);
    setFormData({
      title: listing.title || '',
      description: listing.description || '',
      price: listing.price?.toString() || '',
      location: listing.location || '',
      bedrooms: listing.bedrooms?.toString() || '',
      bathrooms: listing.bathrooms?.toString() || '',
      area: listing.area?.toString() || '',
      propertyType: listing.property_type || listing.propertyType || 'apartment',
      amenities: listing.amenities || [],
      availableFrom: listing.available_from ? listing.available_from.split('T')[0] : '',
      contactEmail: listing.contact_email || listing.contactEmail || user?.email || '',
      contactPhone: listing.contact_phone || listing.contactPhone || user?.phone || '',
      images: listing.images || [],
      status: listing.status || 'active'
    });
  }, [user]);

  const handleDelete = useCallback(async (listingId) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;

    try {
      await fetchWithRetry(`${API_BASE}/listings/${listingId}`, {
        method: 'DELETE'
      });

      setMessage('Listing deleted!');
      await fetchAllData();
    } catch (error) {
      console.error('Delete error:', error);
      if (error.message.includes('Authentication')) {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        navigate('/login');
        return;
      }
      setError('Error deleting listing.');
    }
  }, [fetchWithRetry, fetchAllData, navigate]);

  const handleStatusChange = useCallback(async (listingId, newStatus) => {
    try {
      await fetchWithRetry(`${API_BASE}/listings/${listingId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });

      setMessage(`Status updated to ${newStatus}`);
      await fetchAllData();
    } catch (error) {
      console.error('Status change error:', error);
      if (error.message.includes('Authentication')) {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        navigate('/login');
        return;
      }
      setError('Error updating status.');
    }
  }, [fetchWithRetry, fetchAllData, navigate]);

  const handleViewingResponse = useCallback(async (requestId, status) => {
    try {
      await fetchWithRetry(`${API_BASE}/listings/viewing-requests/${requestId}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          status,
          respondedBy: user.id 
        })
      });

      setMessage(`Request ${status}`);
      await fetchAllData();
    } catch (error) {
      console.error('Viewing response error:', error);
      if (error.message.includes('Authentication')) {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        navigate('/login');
        return;
      }
      setError('Error updating request.');
    }
  }, [user?.id, fetchWithRetry, fetchAllData, navigate]);

  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditingListing(null);
    resetForm();
    setError(null);
    setMessage('');
  }, [resetForm]);

  const clearMessages = useCallback(() => {
    setError(null);
    setMessage('');
  }, []);

  // Don't render anything if not authenticated
  if (!isAuthenticated) {
    return <LoadingSpinner />;
  }

  const pendingRequestsCount = viewingRequests.filter(req => req.status === 'pending').length;

  // Main content render
  const renderContent = () => {
    if (error && listings.length === 0 && viewingRequests.length === 0) {
      return <ErrorMessage message={error} onRetry={fetchAllData} />;
    }

    if (isRefreshing && listings.length === 0) {
      return <LoadingSpinner />;
    }

    return (
      <>
        <StatsOverview userStats={userStats} />

        <div className="tabs-container">
          <div className="tabs-header">
            <button 
              className={`tab-btn ${activeTab === 'my-listings' ? 'active' : ''}`}
              onClick={() => setActiveTab('my-listings')}
            >
              <IoIosList /> My Listings ({listings.length})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'viewing-requests' ? 'active' : ''}`}
              onClick={() => setActiveTab('viewing-requests')}
            >
              <IoIosNotifications /> Viewing Requests ({pendingRequestsCount})
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'my-listings' && (
              <div className="listings-section">
                <div className="section-header">
                  <h2>My Rental Listings</h2>
                  <button 
                    className="btn-primary"
                    onClick={() => setShowForm(true)}
                    disabled={loading}
                  >
                    <FaPlus /> Add New Listing
                  </button>
                </div>
                
                {listings.length === 0 ? (
                  <div className="empty-state">
                    <FaBuilding className="empty-icon" />
                    <h3>No Listings Yet</h3>
                    <p>Create your first rental listing to get started</p>
                    <button 
                      className="btn-primary"
                      onClick={() => setShowForm(true)}
                    >
                      <FaPlus /> Create First Listing
                    </button>
                  </div>
                ) : (
                  <div className="listings-grid">
                    {listings.map((listing) => (
                      <div key={listing.id} className="listing-card">
                        <div className="listing-image">
                          {listing.images?.[0] ? (
                            <img src={listing.images[0]} alt={listing.title} />
                          ) : (
                            <div className="no-image">No Image</div>
                          )}
                          <div className="listing-status">
                            <span className={`status-badge ${listing.status}`}>
                              {listing.status}
                            </span>
                          </div>
                        </div>
                        
                        <div className="listing-content">
                          <h3>{listing.title}</h3>
                          <p className="listing-location">
                            <FaMapMarkerAlt /> {listing.location}
                          </p>
                          
                          <div className="listing-features">
                            <span><FaBed /> {listing.bedrooms} bed</span>
                            <span><FaBath /> {listing.bathrooms} bath</span>
                            <span><FaRulerCombined /> {listing.area} sq ft</span>
                          </div>
                          
                          <div className="listing-price">
                            <FaDollarSign /> {listing.price}/month
                          </div>
                          
                          <div className="listing-actions">
                            <button 
                              className="btn-icon"
                              onClick={() => handleEdit(listing)}
                              title="Edit"
                            >
                              <FaEdit />
                            </button>
                            <button 
                              className="btn-icon"
                              onClick={() => handleStatusChange(
                                listing.id, 
                                listing.status === 'active' ? 'inactive' : 'active'
                              )}
                              title={listing.status === 'active' ? 'Deactivate' : 'Activate'}
                            >
                              {listing.status === 'active' ? <FaTimesCircle /> : <FaCheckCircle />}
                            </button>
                            <button 
                              className="btn-icon danger"
                              onClick={() => handleDelete(listing.id)}
                              title="Delete"
                            >
                              <FaTrash />
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
              <div className="requests-section">
                <h2>Viewing Requests</h2>
                {viewingRequests.length === 0 ? (
                  <div className="empty-state">
                    <FaEye className="empty-icon" />
                    <h3>No Viewing Requests</h3>
                    <p>You don't have any viewing requests yet</p>
                  </div>
                ) : (
                  <div className="requests-list">
                    {viewingRequests.map((request) => (
                      <div key={request.id} className="request-card">
                        <div className="request-header">
                          <h4>Request for: {request.listing?.title}</h4>
                          <span className={`status-badge ${request.status}`}>
                            {request.status}
                          </span>
                        </div>
                        <div className="request-details">
                          <p><FaUser /> {request.requester?.name || 'Unknown User'}</p>
                          <p><FaEnvelope /> {request.requester?.email}</p>
                          <p><FaPhone /> {request.contactPhone || 'Not provided'}</p>
                          <p><FaCalendar /> {new Date(request.preferredDate).toLocaleDateString()}</p>
                          <p>{request.message}</p>
                        </div>
                        {request.status === 'pending' && (
                          <div className="request-actions">
                            <button 
                              className="btn-success"
                              onClick={() => handleViewingResponse(request.id, 'approved')}
                            >
                              <FaCheckCircle /> Approve
                            </button>
                            <button 
                              className="btn-danger"
                              onClick={() => handleViewingResponse(request.id, 'rejected')}
                            >
                              <FaTimesCircle /> Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="post-manager">
      <div className="post-manager-header">
        <div className="header-content">
          <h1>
            <FaHome /> Property Manager
          </h1>
          <div className="header-actions">
            <button 
              className="btn-secondary"
              onClick={fetchAllData}
              disabled={isRefreshing}
            >
              <FaSync className={isRefreshing ? 'spinning' : ''} /> Refresh
            </button>
          </div>
        </div>
        
        {(message || error) && (
          <div className={`message ${error ? 'error' : 'success'}`}>
            {error ? <FaTimesCircle /> : <FaCheckCircle />}
            <span>{error || message}</span>
            <button onClick={clearMessages}>
              <FaTimes />
            </button>
          </div>
        )}
      </div>

      <div className="post-manager-content">
        {renderContent()}
      </div>

      {/* Listing Form Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingListing ? 'Edit Listing' : 'Create New Listing'}</h2>
              <button className="close-btn" onClick={closeForm}>
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
                  />
                </div>
                
                <div className="form-group">
                  <label>Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Price per Month ($) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    required
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
                  />
                </div>
                
                <div className="form-group">
                  <label>Bedrooms *</label>
                  <input
                    type="number"
                    name="bedrooms"
                    value={formData.bedrooms}
                    onChange={handleInputChange}
                    min="0"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Bathrooms *</label>
                  <input
                    type="number"
                    name="bathrooms"
                    value={formData.bathrooms}
                    onChange={handleInputChange}
                    min="0"
                    step="0.5"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Area (sq ft) *</label>
                  <input
                    type="number"
                    name="area"
                    value={formData.area}
                    onChange={handleInputChange}
                    min="0"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Property Type</label>
                  <select
                    name="propertyType"
                    value={formData.propertyType}
                    onChange={handleInputChange}
                  >
                    <option value="apartment">Apartment</option>
                    <option value="house">House</option>
                    <option value="condo">Condo</option>
                    <option value="studio">Studio</option>
                    <option value="townhouse">Townhouse</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Available From</label>
                  <input
                    type="date"
                    name="availableFrom"
                    value={formData.availableFrom}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="form-group">
                  <label>Contact Email</label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="form-group">
                  <label>Contact Phone</label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="form-section">
                <label>Amenities</label>
                <div className="amenities-grid">
                  {['wifi', 'parking', 'pool', 'gym', 'laundry', 'ac', 'heating', 'furnished'].map(amenity => (
                    <label key={amenity} className="amenity-checkbox">
                      <input
                        type="checkbox"
                        checked={formData.amenities.includes(amenity)}
                        onChange={() => handleAmenityChange(amenity)}
                      />
                      <span>{amenity.charAt(0).toUpperCase() + amenity.slice(1)}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="form-section">
                <label>Images</label>
                <div className="image-upload">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                  />
                  <FaImage /> Upload Images
                </div>
                {formData.images.length > 0 && (
                  <div className="image-preview">
                    {formData.images.map((image, index) => (
                      <div key={index} className="preview-item">
                        <img src={image} alt={`Preview ${index}`} />
                        <button type="button" onClick={() => removeImage(index)}>
                          <FaTimes />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={closeForm}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : (editingListing ? 'Update Listing' : 'Create Listing')}
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