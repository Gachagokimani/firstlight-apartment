// frontend/src/components/ForgotPassword.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginForm/LoginForm.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/send-password-reset-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Password reset OTP sent to your email!');
        // Redirect to OTP verification
        setTimeout(() => {
          navigate('/verify-otp', {
            state: {
              email,
              type: 'password_reset'  // Fixed: changed from 'passwordReset'
            }
          });
        }, 2000);
      } else {
        setError(data.error || 'Failed to send reset OTP');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-form-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Reset Your Password</h2>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email address"
          />
        </div>

        <button 
          type="submit" 
          className="login-button"
          disabled={loading}
        >
          {loading ? 'Sending OTP...' : 'Send Reset OTP'}
        </button>

        <div className="switch-auth">
          <p>Remember your password? 
            <button 
              type="button" 
              onClick={() => navigate('/login')}
              className="link-button"
              style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer' }}
            >
              Login here
            </button>
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="home-return-button"
        >
          ← Return to Home
        </button>
      </form>
    </div>
  );
};

export default ForgotPassword;