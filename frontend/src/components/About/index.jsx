import './styles.css';

const About = () => {
  return (
    <div className="about-container">
      <div className="about-background"></div>
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
      </div>
    </div>
  );
};

export default About; 