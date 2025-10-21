// frontend/src/components/OTPVerification.jsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './OTPVerification.css';

const OTPVerification = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timer, setTimer] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();

  // Get email and type from navigation state
  const { email, type = 'email_verification' } = location.state || {};

  useEffect(() => {
    if (!email) {
      navigate('/');
      return;
    }

    // Start countdown timer
    const countdown = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(countdown);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [email, navigate]);

  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return; // Only allow numbers

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').slice(0, 6);
    if (/^\d+$/.test(pasteData)) {
      const newOtp = pasteData.split('').slice(0, 6);
      setOtp([...newOtp, ...Array(6 - newOtp.length).fill('')]);
      
      // Focus the last filled input
      const lastFilledIndex = newOtp.length - 1;
      if (lastFilledIndex >= 0 && lastFilledIndex < 6) {
        inputRefs.current[lastFilledIndex].focus();
      }
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const otpString = otp.join('');

    if (otpString.length !== 6) {
      setError('Please enter all 6 digits');
      setLoading(false);
      return;
    }

    try {
      console.log('🔍 Verifying OTP for:', email, 'Type:', type); // Debug log

      // Use the correct endpoint based on type
      let endpoint;
      let requestBody;

      if (type === 'password_reset') {
        endpoint = 'http://localhost:5000/api/auth/verify-password-reset-otp';
        requestBody = { email, otp: otpString,};
        console.log('📤 Calling password reset endpoint'); // Debug log
      } else {
        endpoint = 'http://localhost:5000/api/auth/verify-email-otp';
        requestBody = { email, otp: otpString, type };
        console.log('📤 Calling email verification endpoint'); // Debug log
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('📥 Response:', data); // Debug log

      if (response.ok) {
        setSuccess(data.message || 'Verification successful!');
        
        // Redirect based on OTP type
        setTimeout(() => {
          if (type === 'email_verification') {
            navigate('/login', { 
              state: { 
                message: 'Email verified successfully! You can now login.',
                email: email
              }
            });
          } else if (type === 'password_reset') {
            navigate('/reset-password', { 
              state: { 
                email: email, 
                verified: true,
                message: 'OTP verified. You can now reset your password.'
              }
            });
          } else {
            // Default redirect
            navigate('/login');
          }
        }, 2000);
      } else {
        setError(data.error || 'Invalid OTP. Please try again.');
      }
    } catch (err) {
      console.error('❌ Network error:', err); // Debug log
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          type: type
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('New OTP sent to your email!');
        setOtp(['', '', '', '', '', '']);
        setTimer(300);
        setCanResend(false);
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      } else {
        setError(data.error || 'Failed to resend OTP. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getVerificationTitle = () => {
    switch (type) {
      case 'email_verification':
        return 'Verify Your Email';
      case 'password_reset':
        return 'Verify Password Reset';
      default:
        return 'Verify Your Account';
    }
  };

  const getInstructions = () => {
    switch (type) {
      case 'email_verification':
        return `We've sent a 6-digit verification code to`;
      case 'password_reset':
        return `We've sent a 6-digit password reset code to`;
      default:
        return `We've sent a 6-digit verification code to`;
    }
  };

  if (!email) {
    return (
      <div className="otp-verification-container">
        <div className="error-message">
          No email provided. Please try again.
        </div>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="home-return-button"
        >
          ← Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="otp-verification-container">
      <form onSubmit={handleVerify} className="otp-verification-form">
        <h2>{getVerificationTitle()}</h2>
        <p className="otp-instructions">
          {getInstructions()}<br />
          <strong>{email}</strong>
        </p>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="otp-inputs-container">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={el => inputRefs.current[index] = el}
              type="text"
              inputMode="numeric"
              maxLength="1"
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={index === 0 ? handlePaste : undefined}
              className="otp-input"
              autoFocus={index === 0}
            />
          ))}
        </div>

        <div className="timer-section">
          <p>Code expires in: <span className="timer">{formatTime(timer)}</span></p>
        </div>

        <button 
          type="submit" 
          className="verify-button"
          disabled={loading || otp.join('').length !== 6}
        >
          {loading ? 'Verifying...' : `Verify ${type === 'password_reset' ? 'Reset' : 'Email'}`}
        </button>

        <div className="resend-section">
          <p>
            Didn't receive the code?{' '}
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={!canResend || loading}
              className="resend-button"
            >
              {loading ? 'Sending...' : 'Resend OTP'}
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

export default OTPVerification;