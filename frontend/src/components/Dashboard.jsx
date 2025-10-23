// frontend/src/components/Dashboard.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
// 1. Import Icons
import { FaUser, FaFileAlt, FaSearch, FaHome, FaSignOutAlt } from 'react-icons/fa';
import { IoIosHome } from 'react-icons/io';
import UserProfile from './UserProfile.jsx';
import PostManager from './postManager.jsx';
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
              {/* Optional: You can add an icon here too, e.g., FaHandWave */}
              <h2>Welcome back, {user?.name}! </h2>
              <p>Manage your account and content from your dashboard.</p>
            </div>
            
            <div className="dashboard-cards">
              {/* Profile Card */}
              <div className="dashboard-card">
                <div className="card-icon"><FaUser /></div>
                <h3>Profile</h3>
                <p>Update your personal information and preferences</p>
                <button 
                  onClick={() => setActiveTab('profile')}
                  className="card-button"
                >
                  Manage Profile
                </button>
              </div>
              
              {/* Posts Card */}
              <div className="dashboard-card">
                <div className="card-icon"><FaFileAlt /></div>
                <h3>Posts</h3>
                <p>Create and manage your blog posts and content</p>
                <button 
                  onClick={() => setActiveTab('posts')}
                  className="card-button"
                >
                  Manage Posts
                </button>
              </div>
              
              {/* Search Homes Card */}
              <div className="dashboard-card">
                <div className="card-icon"><FaSearch /></div>
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
          <h1><FaHome /> FirstLight Apartment Dashboard</h1> {/* Added icon to header */}
          <div className="user-actions">
            <span className="welcome-text">Welcome, {user?.name}!</span>
            <button onClick={onLogout} className="logout-btn">
              <FaSignOutAlt /> Logout {/* Added icon to logout button */}
            </button>
          </div>
        </div>
        
        <nav className="dashboard-nav">
          <button 
            className={`nav-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <IoIosHome /> Overview {/* Added icon to nav button */}
          </button>
          {/* ... other nav buttons ... */}
        </nav>
      </header>
      <main className="dashboard-main">
        {renderContent()}
      </main>
    </div>
  );
};

export default Dashboard;