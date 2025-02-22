import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import './styles.css';

const SearchBar = ({ onSearch, placeholder = "Search for homes..." }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isActive, setIsActive] = useState(false);

  // Debounce search for better performance
  const debounceSearch = useCallback(
    (value) => {
      const timeoutId = setTimeout(() => {
        onSearch(value);
      }, 300);
      return () => clearTimeout(timeoutId);
    },
    [onSearch]
  );

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    debounceSearch(value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  const handleFocus = () => setIsActive(true);
  const handleBlur = () => setIsActive(false);

  return (
    <div className="search-bar-container">
      <form onSubmit={handleSubmit} className={`search-form ${isActive ? 'active' : ''}`}>
        <div className="search-input-group">
          <input
            type="text"
            className="search-input"
            placeholder={placeholder}
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            aria-label="Search"
          />
          <button 
            type="submit" 
            className="search-button"
            aria-label="Submit search"
          >
            <svg 
              viewBox="0 0 24 24" 
              width="24" 
              height="24" 
              stroke="currentColor" 
              strokeWidth="2" 
              fill="none" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
        </div>
        {searchTerm && (
          <button
            type="button"
            className="clear-button"
            onClick={() => {
              setSearchTerm('');
              onSearch('');
            }}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </form>
    </div>
  );
};

SearchBar.propTypes = {
  onSearch: PropTypes.func.isRequired,
  placeholder: PropTypes.string
};

export default SearchBar;