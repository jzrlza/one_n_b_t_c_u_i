const express = require('express');
const cors = require('cors');
const { getConnection } = require('./config/database');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'backend' });
});

// Get users
app.get('/api/users', async (req, res) => {
  try {
    const connection = await getConnection();
    const [rows] = await connection.execute('SELECT * FROM users');
    await connection.end();
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});