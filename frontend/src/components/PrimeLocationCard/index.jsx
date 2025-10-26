import PropTypes from 'prop-types';
import { useState, useEffect } from 'react';
import { 
  FaMapMarkerAlt, 
  FaBed, 
  FaBath, 
  FaRulerCombined, 
  FaHome,
  FaCalendar,
  FaEnvelope,
  FaPhone,
  FaImage,
  FaStar,
  FaCheckCircle,
  FaClock,
  FaSwimmingPool,
  FaCar,
  FaPaw,
  FaWifi,
  FaSnowflake,
  FaFire,
  FaDumbbell,
  FaTv,
  FaWind
} from 'react-icons/fa';
import { IoIosResize, IoIosPhotos } from 'react-icons/io';
import { GiWindow } from 'react-icons/gi';
import './styles.css';

const PrimeLocationCard = ({ listing }) => {
  const [imageError, setImageError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  // Intersection Observer for scroll animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const cardElement = document.querySelector(`.location-card[data-id="${listing?.id}"]`);
    if (cardElement) {
      observer.observe(cardElement);
    }

    return () => {
      if (cardElement) {
        observer.unobserve(cardElement);
      }
    };
  }, [listing?.id]);

  // Use the first image from the listing, or fallback to variant-based images
  const getImagePath = () => {
    if (listing?.images && listing.images.length > 0) {
      return listing.images[0];
    }
    
    const variantImages = {
      'variant-1': '/src/images/apartment1.jpg',
      'variant-2': '/src/images/apartment2.jpg',
      'variant-3': '/src/images/apartment3.jpg',
      'variant-4': '/src/images/apartment4.jpg',
      'variant-5': '/src/images/apartment5.jpg',
      'variant-6': '/src/images/apartment6.jpg'
    };
    
    const variant = `variant-${(listing?.id % 6) + 1}`;
    return variantImages[variant] || variantImages['variant-1'];
  };

  // Format price as currency
  const formatPrice = (price) => {
    if (!price) return '$0/month';
    return `$${price.toLocaleString()}/month`;
  };

  // Handle image loading errors
  const handleImageError = (e) => {
    console.log('Image failed to load:', e.target.src);
    setImageError(true);
    e.target.style.display = 'none';
  };

  // Get property details for the back of the card
  const getPropertyDetails = () => {
    if (!listing) return '';
    
    const details = [];
    if (listing.bedrooms) details.push(`${listing.bedrooms} bed`);
    if (listing.bathrooms) details.push(`${listing.bathrooms} bath`);
    if (listing.area) details.push(`${listing.area} sq ft`);
    
    return details.join(' • ');
  };

  // Get amenity icon
  const getAmenityIcon = (amenity) => {
    const amenityIcons = {
      'parking': <FaCar />,
      'pool': <FaSwimmingPool />,
      'gym': <FaDumbbell />,
      'pet-friendly': <FaPaw />,
      'wifi': <FaWifi />,
      'air-conditioning': <FaSnowflake />,
      'heating': <FaFire />,
      'furnished': <FaHome />,
      'laundry': <GiWindow />,
      'balcony': <FaWind />,
      'garden': <FaHome />,
      'security': <FaCheckCircle />,
      'elevator': <IoIosResize />
    };
    
    return amenityIcons[amenity] || <FaStar />;
  };

  // Handle schedule viewing
  const handleScheduleViewing = () => {
    console.log('Schedule viewing for:', listing?.id);
    alert(`Schedule viewing for ${listing?.title}`);
  };

  // Handle contact agent
  const handleContactAgent = () => {
    const email = listing?.contact_email;
    const phone = listing?.contact_phone;
    
    if (email) {
      window.location.href = `mailto:${email}?subject=Inquiry about ${listing?.title}`;
    } else if (phone) {
      window.location.href = `tel:${phone}`;
    } else {
      alert('Contact information not available');
    }
  };

  // If no listing is provided, return null or a loading state
  if (!listing) {
    return (
      <div className={`location-card loading ${isVisible ? 'visible' : ''}`}>
        <div className="card-inner">
          <div className="card-front">
            <div className="card-image">
              <div className="image-placeholder">
                <FaImage className="placeholder-icon" />
                <span>Loading...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`location-card ${isVisible ? 'visible' : ''}`}
      data-id={listing.id}
    >
      <div className="card-inner">
        <div className="card-front">
          <div className="card-image">
            <img 
              src={getImagePath()} 
              alt={listing.title}
              onError={handleImageError}
            />
            {imageError && (
              <div className="image-placeholder">
                <FaImage className="placeholder-icon" />
                <span>No Image Available</span>
              </div>
            )}
            <div className="price-tag">
              <FaHome className="price-icon" />
              {formatPrice(listing.price)}
            </div>
            {listing.status && (
              <div className={`status-badge ${listing.status}`}>
                {listing.status === 'active' && <FaCheckCircle className="status-icon" />}
                {listing.status === 'pending' && <FaClock className="status-icon" />}
                {listing.status === 'rented' && <FaCheckCircle className="status-icon" />}
                {listing.status}
              </div>
            )}
          </div>
          <div className="card-body">
            <h5 className="card-title">{listing.title}</h5>
            <p className="card-location">
              <FaMapMarkerAlt className="location-icon" />
              {listing.location}
            </p>
            <p className="card-text">{listing.description}</p>
            <div className="property-specs">
              {getPropertyDetails()}
            </div>
            {listing.amenities && listing.amenities.length > 0 && (
              <div className="amenities-preview">
                <div className="amenities-icons">
                  {listing.amenities.slice(0, 4).map((amenity, index) => (
                    <span key={index} className="amenity-icon" title={amenity}>
                      {getAmenityIcon(amenity)}
                    </span>
                  ))}
                  {listing.amenities.length > 4 && (
                    <span className="amenity-more">+{listing.amenities.length - 4}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="card-back">
          <div className="card-back-content">
            <h5 className="card-title">Property Details</h5>
            <p className="card-location">
              <FaMapMarkerAlt className="location-icon" />
              {listing.location}
            </p>
            <p className="card-text">{listing.description}</p>
            
            <div className="property-details">
              <div className="detail-item">
                <FaBed className="detail-icon" />
                <div className="detail-info">
                  <strong>Bedrooms</strong>
                  <span>{listing.bedrooms || 'N/A'}</span>
                </div>
              </div>
              <div className="detail-item">
                <FaBath className="detail-icon" />
                <div className="detail-info">
                  <strong>Bathrooms</strong>
                  <span>{listing.bathrooms || 'N/A'}</span>
                </div>
              </div>
              <div className="detail-item">
                <FaRulerCombined className="detail-icon" />
                <div className="detail-info">
                  <strong>Area</strong>
                  <span>{listing.area ? `${listing.area} sq ft` : 'N/A'}</span>
                </div>
              </div>
              <div className="detail-item">
                <FaHome className="detail-icon" />
                <div className="detail-info">
                  <strong>Type</strong>
                  <span>{listing.property_type || 'N/A'}</span>
                </div>
              </div>
            </div>
            
            {listing.amenities && listing.amenities.length > 0 && (
              <div className="amenities-section">
                <h6>Amenities</h6>
                <div className="amenities-grid">
                  {listing.amenities.map((amenity, index) => (
                    <div key={index} className="amenity-item">
                      {getAmenityIcon(amenity)}
                      <span>{amenity.replace('-', ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="price-section">
              <div className="price-text">{formatPrice(listing.price)}</div>
              <div className="availability">
                <FaCalendar className="availability-icon" />
                Available from: {listing.available_from ? new Date(listing.available_from).toLocaleDateString() : 'Now'}
              </div>
            </div>
            
            <div className="action-buttons">
              <button 
                className="btn-primary" 
                onClick={handleScheduleViewing}
              >
                <FaCalendar className="btn-icon" />
                Schedule Viewing
              </button>
              <button 
                className="btn-secondary" 
                onClick={handleContactAgent}
              >
                {listing.contact_phone ? <FaPhone className="btn-icon" /> : <FaEnvelope className="btn-icon" />}
                Contact Agent
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

PrimeLocationCard.propTypes = {
  listing: PropTypes.shape({
    id: PropTypes.number,
    title: PropTypes.string,
    description: PropTypes.string,
    price: PropTypes.number,
    location: PropTypes.string,
    bedrooms: PropTypes.number,
    bathrooms: PropTypes.number,
    area: PropTypes.number,
    property_type: PropTypes.string,
    amenities: PropTypes.arrayOf(PropTypes.string),
    images: PropTypes.arrayOf(PropTypes.string),
    contact_email: PropTypes.string,
    contact_phone: PropTypes.string,
    status: PropTypes.string,
    available_from: PropTypes.string,
    created_at: PropTypes.string,
    updated_at: PropTypes.string
  })
};

export default PrimeLocationCard;