import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [userId, setUserId] = useState(null);
  const [code, setCode] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post('/api/auth/login', {
        username,
        password
      });

      if (response.data.requires2FA) {
        setRequires2FA(true);
        setUserId(response.data.userId);
      } else {
        onLogin(response.data.user);
      }
    } catch (error) {
      alert('Login failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const verify2FA = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post('/api/auth/verify-2fa', {
        userId,
        code
      });
      
      onLogin(response.data.user);
    } catch (error) {
      alert('2FA verification failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (requires2FA) {
    return (
      <div className="login-container">
        <h2>Two-Factor Authentication</h2>
        <form onSubmit={verify2FA}>
          <input
            type="text"
            placeholder="Enter 6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="login-container">
      <h2>Login to ONE NBTC</h2>
      <form onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default Login;