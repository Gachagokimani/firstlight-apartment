import PropTypes from 'prop-types';
import './styles.css';

const PrimeLocationCard = ({ variant, title, description, price }) => {
  const getImagePath = (variant) => {
    const images = {
      'variant-1': '/src/images/apartment1.jpg',
      'variant-2': '/src/images/apartment2.jpg',
      'variant-3': '/src/images/apartment3.jpg',
      'variant-4': '/src/images/apartment4.jpg',
      'variant-5': '/src/images/apartment5.jpg',
      'variant-6': '/src/images/apartment6.jpg'
    };
    return images[variant] || images['variant-1'];
  };

  return (
    <div className={`location-card ${variant}`}>
      <div className="card-inner">
        <div className="card-front">
          <div className="card-image">
            <img 
              src={getImagePath(variant)} 
              alt={title}
              onError={(e) => {
                console.log('Image failed to load:', e.target.src);
                e.target.style.display = 'none';
              }}
            />
            <div className="price-tag">{price}</div>
          </div>
          <div className="card-body">
            <h5 className="card-title">{title}</h5>
            <p className="card-text">{description}</p>
          </div>
        </div>
        <div className="card-back">
          <h5 className="card-title">Property Details</h5>
          <p className="card-text">{description}</p>
          <p className="price-text">{price}</p>
          <div className="action-buttons">
            <button className="btn-primary">Schedule Viewing</button>
            <button className="btn-secondary">Contact Agent</button>
          </div>
        </div>
      </div>
    </div>
  );
};

PrimeLocationCard.propTypes = {
  variant: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  price: PropTypes.string.isRequired
};

export default PrimeLocationCard;