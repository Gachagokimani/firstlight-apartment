import { useNavigate } from 'react-router-dom';
import './styles.css';

const About = () => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    navigate('/');
  };

  return (
    <div className="about-container">
      <div className="about-background"></div>
      <nav className="about-nav">
        <button className="back-btn" onClick={handleBackClick}>
          Back to Home
        </button>
      </nav>
      <div className="about-content">
        <h1>About FIRSTLIGHT APARTMENT</h1>
        <p>Your trusted partner in finding the perfect home.</p>
        <div className="about-features">
          <div className="feature">
            <h3>Prime Locations</h3>
            <p>Properties in the most sought-after neighborhoods</p>
          </div>
          <div className="feature">
            <h3>Quality Assurance</h3>
            <p>All properties meet our high standards</p>
          </div>
        </div>
        <div className="social-media-links">
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">Facebook</a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">Twitter</a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a>
        </div>
        <div className="contact-form">
          <h3>Contact Us</h3>
          <form>
            <input type="text" placeholder="Your Name" required />
            <input type="email" placeholder="Your Email" required />
            <textarea placeholder="Your Message" required></textarea>
            <button type="submit">Send Message</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default About; 