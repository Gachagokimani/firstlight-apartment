import { useNavigate } from 'react-router-dom';
import './styles.css';

const LoginForm = () => {
  const navigate = useNavigate();

  return (
    <div className="login-container">
      <div className="login-background"></div>
      <nav className="login-nav">
        <button className="back-btn" onClick={() => navigate('/')}>
          Back to Home
        </button>
      </nav>
      <div className="login-form-wrapper">
        <form>
          <input
            type="email"
            className="login-input"
            placeholder="Email"
            required
          />
          <input
            type="password"
            className="login-input"
            placeholder="Password"
            required
          />
          <button type="submit" className="login-button">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm; 