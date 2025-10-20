import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './SignupForm.css';

const SignupForm = ({ onSignup }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate(); // Added for navigation

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onSignup(data.user);
      } else {
        setError(data.error || 'Signup failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReturnHome = () => {
    navigate('/'); // Use React Router navigation
  };

  return (
    <div className="signup-form-container">
      <form onSubmit={handleSubmit} className="signup-form">
        <h2>Create Your Account</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label htmlFor="name">Full Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Enter your full name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="Enter your email"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength="6"
            placeholder="Create a password (min. 6 characters)"
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            minLength="6"
            placeholder="Confirm your password"
          />
        </div>

        <button 
          type="submit" 
          className="signup-button"
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>

        <div className="switch-auth">
          <p>Already have an account? 
            <Link to="/login" className="link-button">
              Login
            </Link>
          </p>
        </div>

        {/* Fixed Home Button with proper hover effects */}
        <button
          type="button"
          onClick={handleReturnHome}
          className="home-return-button"
          style={{
            display: 'block',
            width: '100%',
            padding: '0.75rem',
            marginTop: '1rem',
            backgroundColor: 'transparent',
            color: '#f093fb',
            border: '2px solid #f093fb',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            textAlign: 'center'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#f093fb';
            e.target.style.color = 'white';
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 4px 15px rgba(240, 147, 251, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.color = '#f093fb';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
          onMouseDown={(e) => {
            e.target.style.transform = 'translateY(0)';
          }}
          onMouseUp={(e) => {
            e.target.style.transform = 'translateY(-2px)';
          }}
        >
          ← Return to Home
        </button>
      </form>
    </div>
  );
};

export default SignupForm;