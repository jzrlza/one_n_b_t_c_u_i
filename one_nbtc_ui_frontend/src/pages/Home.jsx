import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

const Home = ({ user, onLogout }) => {
  const [backendHealth, setBackendHealth] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const checkBackendHealth = async () => {
    try {
      const response = await axios.get('/api/health');
      setBackendHealth(response.data);
    } catch (error) {
      setBackendHealth({ status: 'ERROR', error: error.message });
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/users');
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  useEffect(() => {
    checkBackendHealth();
  }, []);

  return (
    <div className="app">
      <Navbar user={user} onLogout={handleLogout} />
      
      <main className="app-main">
        <section className="health-section">
          <h2>Backend Health Status</h2>
          {backendHealth ? (
            <div className={`health-status ${backendHealth.status === 'OK' ? 'healthy' : 'error'}`}>
              <strong>Status:</strong> {backendHealth.status}
              <br />
              <strong>Service:</strong> {backendHealth.service}
            </div>
          ) : (
            <p>Checking backend health...</p>
          )}
          <button onClick={checkBackendHealth} className="refresh-btn">
            Refresh Health
          </button>
        </section>

        <section className="users-section">
          <h2>Users Data</h2>
          <button onClick={fetchUsers} disabled={loading} className="fetch-btn">
            {loading ? 'Loading...' : 'Fetch Users'}
          </button>
          
          {users.length > 0 ? (
            <div className="users-list">
              <h3>Users ({users.length})</h3>
              <div className="users-grid">
                {users.map((user, index) => (
                  <div key={index} className="user-card">
                    <h4>User {index + 1}</h4>
                    <pre>{JSON.stringify(user, null, 2)}</pre>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p>No users data available. Click "Fetch Users" to load data.</p>
          )}
        </section>
      </main>
    </div>
  );
};

export default Home;