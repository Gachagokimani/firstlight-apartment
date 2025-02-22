import { useNavigate } from 'react-router-dom';
import PrimeLocationCard from '../PrimeLocationCard';
import './styles.css';

const LandingPage = () => {
  const navigate = useNavigate();

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleSearchClick = () => {
    navigate('/search');
  };

  return (
    <div className="landing-container">
      <div className="landing-background"></div>
      <nav className="landing-nav">
        <div className="logo" onClick={() => navigate('/')}>FIRSTLIGHT APARTMENT</div>
        <div className="nav-links">
          <button className="nav-btn" onClick={handleSearchClick}>
            Search Homes
          </button>
          <button className="nav-login-btn" onClick={handleLoginClick}>
            Login
          </button>
        </div>
      </nav>
      
      <main className="hero-section">
        <h1 className="hero-title">Welcome to <span className="highlight">FIRSTLIGHT APARTMENT</span></h1>
        <p className="hero-subtitle">Find Your Perfect Home in Prime Locations</p>
        <div className="cta-buttons">
          <button className="cta-button primary" onClick={handleSearchClick}>
            Browse Listings
          </button>
          <button className="cta-button secondary" onClick={() => navigate('/about')}>
            About Us
          </button>
        </div>
        <div className="prime-locations">
          <PrimeLocationCard
            variant="variant-1"
            title="Prime Location 1"
            description="Desire apartment prime location 1."
          />
          <PrimeLocationCard
            variant="variant-2"
            title="Prime Location 2"
            description="Description of prime location 2."
          />
        </div>
      </main>
    </div>
  );
};

export default LandingPage; 