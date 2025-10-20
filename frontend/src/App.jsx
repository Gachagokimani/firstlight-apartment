// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy, useEffect, useState } from "react";
import React from 'react';
import ScrollToTopButton from './components/ScrollToTopButton';
import './App.css';

// Lazy load components
const LandingPage = lazy(() => import("./components/LandingPage/index.jsx"));
const LoginForm = lazy(() => import("./components/LoginForm/index.jsx"));
const SignupForm = lazy(() => import("./components/signup/signup.jsx"));
const SearchHomes = lazy(() => import("./components/SearchHomes/HomeListing"));
const About = lazy(() => import("./components/About/index.jsx"));
const UserList = lazy(() => import("./components/UserList"));
const UserProfile = lazy(() => import("./components/UserProfile"));
const PostManager = lazy(() => import("./components/PostManager"));
const Dashboard = lazy(() => import("./components/Dashboard"));

// Loading component
const LoadingSpinner = () => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
    <p>Loading...</p>
  </div>
);

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on app start
  useEffect(() => {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (user && token) {
      setCurrentUser(JSON.parse(user));
    }
    setLoading(false);
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
  };

  const handleSignup = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setCurrentUser(null);
  };

  const handleProfileUpdate = (updatedUser) => {
    setCurrentUser(updatedUser);
  };

  // Protected Route component
  const ProtectedRoute = ({ children }) => {
    return currentUser ? children : <Navigate to="/login" />;
  };

  // Public Route component (redirect to dashboard if already logged in)
  const PublicRoute = ({ children }) => {
    return !currentUser ? children : <Navigate to="/dashboard" />;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Router>
      <div className="app">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/" 
              element={
                <PublicRoute>
                  <LandingPage />
                </PublicRoute>
              } 
            />
            <Route 
              path="/landing" 
              element={
                <PublicRoute>
                  <LandingPage />
                </PublicRoute>
              } 
            />
            <Route 
              path="/login" 
              element={
                <PublicRoute>
                  <LoginForm onLogin={handleLogin} />
                </PublicRoute>
              } 
            />
            <Route 
              path="/signup" 
              element={
                <PublicRoute>
                  <SignupForm onSignup={handleSignup} />
                </PublicRoute>
              } 
            />
            <Route path="/search" element={<SearchHomes />} />
            <Route path="/about" element={<About />} />
            <Route path="/users" element={<UserList />} />

            {/* Protected Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard 
                    user={currentUser} 
                    onLogout={handleLogout}
                    onProfileUpdate={handleProfileUpdate}
                  />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <UserProfile 
                    user={currentUser} 
                    onUpdate={handleProfileUpdate} 
                  />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/posts" 
              element={
                <ProtectedRoute>
                  <PostManager user={currentUser} />
                </ProtectedRoute>
              } 
            />

            {/* Fallback route */}
            <Route path="*" element={<Navigate to={currentUser ?  "/dashboard" : "/landing"} />} />
          </Routes>
        </Suspense>
        <ScrollToTopButton />
      </div>
    </Router>
  );
}

export default App;