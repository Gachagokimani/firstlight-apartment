import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PrimeLocationCard from '../PrimeLocationCard/index';
import SearchBar from './SearchBar';

const HomeListings = () => {
  const navigate = useNavigate();
  const initialListings = [
    {
      id: 1,
      title: 'Luxury Penthouse Suite',
      description: 'Panoramic city views, modern amenities, and exclusive rooftop access.',
      variant: 'variant-1', // apartment1.jpg
      price: 'KES 250,000/month'
    },
    {
      id: 2,
      title: 'Garden Villa Retreat',
      description: 'Serene garden setting with private pool and outdoor entertainment area.',
      variant: 'variant-2', // apartment2.jpg
      price: 'KES 320,000/month'
    },
    {
      id: 3,
      title: 'Urban Loft Space',
      description: 'Industrial chic design with high ceilings and exposed brick walls.',
      variant: 'variant-3', // apartment3.jpg
      price: 'KES 180,000/month'
    },
    {
      id: 4,
      title: 'Riverside Apartment',
      description: 'Waterfront living with modern finishes and spectacular sunset views.',
      variant: 'variant-4', // apartment4.jpg
      price: 'KES 280,000/month'
    },
    {
      id: 5,
      title: 'Smart Home Complex',
      description: 'Fully automated living space with cutting-edge technology.',
      variant: 'variant-5', // apartment5.jpg
      price: 'KES 210,000/month'
    },
    {
      id: 6,
      title: 'Eco-Friendly Haven',
      description: 'Sustainable living with solar power and green spaces.',
      variant: 'variant-6', // apartment6.jpg
      price: 'KES 230,000/month'
    }
  ];

  const [listings] = useState(initialListings);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredListings = listings.filter((listing) =>
    listing.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="search-container">
      <div className="search-background"></div>
      <div className="search-content">
        <div className="search-header">
          <button 
            className="back-home-btn"
            onClick={() => navigate('/')}
          >
            Back Home
          </button>
          <h1>Find Your Dream Home</h1>
        </div>
        <SearchBar 
          onSearch={setSearchTerm}
          placeholder="Search by location, property type, or features..."
        />
        <div className="listings-grid">
          {filteredListings.length > 0 ? (
            filteredListings.map((listing) => (
              <div key={listing.id} className="grid-item">
                <PrimeLocationCard
                  variant={listing.variant}
                  title={listing.title}
                  description={listing.description}
                />
              </div>
            ))
          ) : (
            <p>No listings found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeListings;