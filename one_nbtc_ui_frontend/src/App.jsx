import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const [backendHealth, setBackendHealth] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)

  const checkBackendHealth = async () => {
    try {
      const response = await axios.get('/api/health')
      setBackendHealth(response.data)
    } catch (error) {
      setBackendHealth({ status: 'ERROR', error: error.message })
    }
  }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await axios.get('/api/users')
      setUsers(response.data.data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkBackendHealth()
  }, [])

  return (
    <div className="app">
      <header className="app-header">
        <h1>ONE NBTC</h1>
      </header>

      <main className="app-main">
        <section className="health-section">
          <h2>Backend Health Status</h2>
          {backendHealth ? (
            <div className={`health-status ${backendHealth.status === 'OK' ? 'healthy' : 'error'}`}>
              <strong>Status:</strong> {backendHealth.status}
              <br />
              <strong>Service:</strong> {backendHealth.service}
              <br />
              <strong>Timestamp:</strong> {backendHealth.timestamp}
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

      <footer className="app-footer">
        <p>one_nbtc_ui Project &copy; 2024</p>
      </footer>
    </div>
  )
}

export default App