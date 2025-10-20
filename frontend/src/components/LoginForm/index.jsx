// frontend/src/components/LoginForm.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './LoginForm.css';

const LoginForm = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

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

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLogin(data.user);
      } else {
        setError(data.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReturnHome = () => {
    navigate('/');
  };

  return (
    <div className="login-form-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Login to Your Account</h2>
        
        {error && <div className="error-message">{error}</div>}
        
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
            placeholder="Enter your password"
          />
        </div>

        <button 
          type="submit" 
          className="login-button"
          disabled={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

        <div className="switch-auth">
          <p>Don't have an account? 
            <Link to="/signup" className="link-button">
              Sign up
            </Link>
          </p>
        </div>

        {/* Consistent Home Button */}
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
            color: '#667eea',
            border: '2px solid #667eea',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            textAlign: 'center'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#667eea';
            e.target.style.color = 'white';
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'transparent';
            e.target.style.color = '#667eea';
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

export default LoginForm;