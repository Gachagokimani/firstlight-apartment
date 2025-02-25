import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import React from 'react';
import ScrollToTopButton from './components/ScrollToTopButton';

// Lazy load components
const LandingPage = lazy(() => import("./components/LandingPage"));
const LoginForm = lazy(() => import("./components/LoginForm"));
const SearchHomes = lazy(() => import("./components/SearchHomes/HomeListing"));
const About = lazy(() => import("./components/About"));
const UserList = lazy(() => import("./components/UserList"));

function App() {
  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <Router>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Navigate to="/LandingPage" />} />
          <Route path="/LandingPage" element={<LandingPage />} />
          <Route path="/LoginForm" element={<LoginForm />} />
          <Route path="/SearchHomes" element={<SearchHomes />} />
          <Route path="/About" element={<About />} />
          <Route path="/search" element={<SearchHomes />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/users" element={<UserList />} />
        </Routes>
      </Suspense>
      <ScrollToTopButton />
    </Router>
  );
}

export default App;
