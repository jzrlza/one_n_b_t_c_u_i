const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Import routes
const indexRoutes = require('./routes/index');
const usersRoutes = require('./routes/users');
const employeesRoutes = require('./routes/employees');
const authRoutes = require('./routes/auth'); // Add this line

// Use routes
app.use('/api', indexRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/auth', authRoutes); // Add this line

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});