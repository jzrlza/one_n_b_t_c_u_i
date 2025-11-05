import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in (from localStorage)
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // Protected Route component
  const ProtectedRoute = ({ children }) => {
    return user ? children : <Navigate to="/login" />;
  };

  // Public Route component (redirect to home if already logged in)
  const PublicRoute = ({ children }) => {
    return !user ? children : <Navigate to="/" />;
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <div className="app">
        <Routes>
          {/* Public route - login */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login onLogin={handleLogin} />
              </PublicRoute>
            } 
          />
          
          {/* Protected route - home */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Home user={user} onLogout={handleLogout} />
              </ProtectedRoute>
            } 
          />
          
          {/* Catch all route - redirect to home if logged in, else login */}
          <Route 
            path="*" 
            element={<Navigate to={user ? "/" : "/login"} />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;