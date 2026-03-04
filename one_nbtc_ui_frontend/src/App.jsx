import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import EmployeeList from './pages/EmployeeList';
import EmployeeInput from './pages/EmployeeInput';
import AttendRegisterList from './pages/AttendRegisterList';
import AttendeeInput from './pages/AttendeeInput';
import UsernameList from './pages/UsernameList';
import UsernameInput from './pages/UsernameInput';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in (from localStorage)
    const savedUser = sessionStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData, tokenData) => {
    setUser(userData);
    sessionStorage.setItem('user', JSON.stringify(userData));
    sessionStorage.setItem('token', JSON.stringify(tokenData));
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
  };

  // Protected Route component (for admin-only pages)
  const ProtectedRoute = ({ children }) => {
    return user ? children : <Navigate to="/login" />;
  };

  const SuperProtectedRoute = ({ children }) => {
    return user ? (parseInt(user.type) === 1 ? children : <Navigate to="/employee" />) : <Navigate to="/login" />;
  };

  // Public Route component (redirect to home if already logged in)
  const PublicRoute = ({ children }) => {
    return !user ? children : <Navigate to="/employee" />;
  };

  // Unprotected Route (always accessible)
  const UnprotectedRoute = ({ children }) => {
    return children; // Always render children regardless of auth status
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <div className="app">
        <Routes>
          {/* Home page - accessible to everyone */}
          <Route 
            path="/" 
            element={
              <UnprotectedRoute>
                <Home user={user} onLogout={handleLogout} />
              </UnprotectedRoute>
            } 
          />

          {/* Public route - login (redirects to employee if already logged in) */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login onLogin={handleLogin} />
              </PublicRoute>
            } 
          />

          {/* Protected routes (admin-only) */}
          <Route 
            path="/employee" 
            element={
              <ProtectedRoute>
                <EmployeeList user={user} onLogout={handleLogout} />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/employee/edit/:id?" 
            element={
              <ProtectedRoute>
                <EmployeeInput user={user} onLogout={handleLogout} />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/attendance" 
            element={
              <ProtectedRoute>
                <AttendRegisterList user={user} onLogout={handleLogout} />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/attendance/edit/:id?" 
            element={
              <ProtectedRoute>
                <AttendeeInput user={user} onLogout={handleLogout} />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/username" 
            element={
              <SuperProtectedRoute>
                <UsernameList user={user} onLogout={handleLogout} />
              </SuperProtectedRoute>
            } 
          />

          <Route 
            path="/username/edit/:id?" 
            element={
              <SuperProtectedRoute>
                <UsernameInput user={user} onLogout={handleLogout} />
              </SuperProtectedRoute>
            } 
          />
          
          {/* Catch all route - redirect to home (accessible to all) */}
          <Route 
            path="*" 
            element={<Navigate to="/" />} 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;