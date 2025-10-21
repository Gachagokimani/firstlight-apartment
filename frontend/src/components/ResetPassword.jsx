// frontend/src/components/ResetPassword.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './LoginForm/LoginForm.css';

const ResetPassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Get email and verification status from navigation state
  const { email, verified, message } = location.state || {};

  useEffect(() => {
    // Redirect if no email or not verified
    if (!email || !verified) {
      console.log('❌ Missing email or verification:', { email, verified });
      navigate('/forgot-password');
      return;
    }

    console.log('✅ Reset password page loaded for:', email);
    if (message) {
      setSuccess(message);
    }
  }, [email, verified, message, navigate]);

  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
      requirements: {
        minLength: password.length >= minLength,
        hasUpperCase,
        hasLowerCase,
        hasNumbers,
        hasSpecialChar
      }
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password strength
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      setError('Password does not meet requirements');
      setLoading(false);
      return;
    }

    try {
      console.log('🔐 Resetting password for:', email);

      const response = await fetch('http://localhost:5000/api/auth/set-new-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          newPassword,
          // Note: We don't need OTP here since we already verified it
          // The backend should handle this differently - we might need to adjust the backend
        }),
      });

      const data = await response.json();
      console.log('📥 Reset password response:', data);

      if (response.ok) {
        setSuccess('Password reset successfully! Redirecting to login...');
        
        // Redirect to login after success
        setTimeout(() => {
          navigate('/login', {
            state: {
              message: 'Password reset successfully! You can now login with your new password.',
              email: email
            }
          });
        }, 3000);
      } else {
        setError(data.error || 'Failed to reset password');
      }
    } catch (err) {
      console.error('❌ Reset password error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const passwordValidation = validatePassword(newPassword);

  if (!email || !verified) {
    return (
      <div className="login-form-container">
        <div className="error-message">
          Invalid access. Please restart the password reset process.
        </div>
        <button
          type="button"
          onClick={() => navigate('/forgot-password')}
          className="home-return-button"
        >
          ← Back to Forgot Password
        </button>
      </div>
    );
  }

  return (
    <div className="login-form-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Reset Your Password</h2>
        <p className="reset-instructions">
          Create a new password for your account: <strong>{email}</strong>
        </p>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <div className="form-group">
          <label htmlFor="newPassword">New Password</label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            placeholder="Enter new password"
            disabled={loading}
            minLength="8"
          />
          
          {/* Password strength indicator */}
          {newPassword && (
            <div className="password-requirements">
              <h4>Password Requirements:</h4>
              <ul>
                <li className={passwordValidation.requirements.minLength ? 'valid' : 'invalid'}>
                  At least 8 characters
                </li>
                <li className={passwordValidation.requirements.hasUpperCase ? 'valid' : 'invalid'}>
                  One uppercase letter
                </li>
                <li className={passwordValidation.requirements.hasLowerCase ? 'valid' : 'invalid'}>
                  One lowercase letter
                </li>
                <li className={passwordValidation.requirements.hasNumbers ? 'valid' : 'invalid'}>
                  One number
                </li>
                <li className={passwordValidation.requirements.hasSpecialChar ? 'valid' : 'invalid'}>
                  One special character
                </li>
              </ul>
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm New Password</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Confirm new password"
            disabled={loading}
            minLength="8"
          />
          
          {confirmPassword && newPassword !== confirmPassword && (
            <div className="error-text">Passwords do not match</div>
          )}
          
          {confirmPassword && newPassword === confirmPassword && newPassword && (
            <div className="success-text">Passwords match</div>
          )}
        </div>

        <button 
          type="submit" 
          className="login-button"
          disabled={loading || !newPassword || !confirmPassword || newPassword !== confirmPassword || !passwordValidation.isValid}
        >
          {loading ? 'Resetting Password...' : 'Reset Password'}
        </button>

        <div className="switch-auth">
          <p>Remember your password? 
            <button 
              type="button" 
              onClick={() => navigate('/login')}
              className="link-button"
              style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer' }}
              disabled={loading}
            >
              Login here
            </button>
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="home-return-button"
          disabled={loading}
        >
          ← Return to Home
        </button>
      </form>
    </div>
  );
};

export default ResetPassword;