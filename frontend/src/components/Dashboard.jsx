// frontend/src/components/Dashboard.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import UserProfile from './UserProfile';
import PostManager from './PostManager';
import './Dashboard.css';

const Dashboard = ({ user, onLogout, onProfileUpdate }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <UserProfile user={user} onUpdate={onProfileUpdate} />;
      case 'posts':
        return <PostManager user={user} />;
      case 'overview':
      default:
        return (
          <div className="overview-content">
            <div className="welcome-section">
              <h2>Welcome back, {user?.name}! 👋</h2>
              <p>Manage your account and content from your dashboard.</p>
            </div>
            
            <div className="dashboard-cards">
              <div className="dashboard-card">
                <div className="card-icon">👤</div>
                <h3>Profile</h3>
                <p>Update your personal information and preferences</p>
                <button 
                  onClick={() => setActiveTab('profile')}
                  className="card-button"
                >
                  Manage Profile
                </button>
              </div>
              
              <div className="dashboard-card">
                <div className="card-icon">📝</div>
                <h3>Posts</h3>
                <p>Create and manage your blog posts and content</p>
                <button 
                  onClick={() => setActiveTab('posts')}
                  className="card-button"
                >
                  Manage Posts
                </button>
              </div>
              
              <div className="dashboard-card">
                <div className="card-icon">🔍</div>
                <h3>Search Homes</h3>
                <p>Browse available properties in your area</p>
                <Link to="/search-homes" className="card-button">
                  Find Homes
                </Link>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>FirstLight Apartment Dashboard</h1>
          <div className="user-actions">
            <span className="welcome-text">Welcome, {user?.name}!</span>
            <button onClick={onLogout} className="logout-btn">
              Logout
            </button>
          </div>
        </div>
        
        <nav className="dashboard-nav">
          <button 
            className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button 
            className={`nav-btn ${activeTab === 'posts' ? 'active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            My Posts
          </button>
          <Link to="/search-homes" className="nav-btn">
            Search Homes
          </Link>
        </nav>
      </header>

      <main className="dashboard-main">
        {renderContent()}
      </main>
    </div>
  );
};

export default Dashboard;