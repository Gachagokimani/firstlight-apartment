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

  const handleAboutClick = () => {
    navigate('/about');
  };

  return (
    <div className="landing-container">
      <div className="landing-background"></div>
      <nav className="landing-nav">
        <div className="logo">FIRSTLIGHT APARTMENT</div>
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
          <button className="cta-button secondary" onClick={handleAboutClick}>
            About Us
          </button>
        </div>
        <div className="prime-locations">
          {Array.from({ length: 10 }).map((_, index) => (
            <PrimeLocationCard
              key={index}
              variant={`variant-${(index % 6) + 1}`}
              title={`Prime Location ${index + 1}`}
              description={`Description of prime location ${index + 1}.`}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default LandingPage; 