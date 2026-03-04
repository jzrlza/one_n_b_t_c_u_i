const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const logDir = process.env.LOG_PATH || path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// ========== SIMPLE CORS CONFIG ==========
const allowedOrigins = [];

// Add FRONTEND_URL if exists
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

// Add AD_API_URL if exists  
if (process.env.AD_API_URL) {
  allowedOrigins.push(process.env.AD_API_URL);
}

console.log('✅ Allowed CORS origins:', allowedOrigins);

// Configure CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like server-to-server or curl)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '100mb' })); //extend
app.use(express.urlencoded({ limit: '100mb', extended: true }));


// Import routes
const indexRoutes = require('./routes/index');
const usersRoutes = require('./routes/users');
const employeesRoutes = require('./routes/employees');
const authRoutes = require('./routes/auth'); // Add this line
const registersRoutes = require('./routes/registers');

// Use routes
app.use('/api', indexRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/auth', authRoutes); // Add this line
app.use('/api/registers', registersRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend running on port ${PORT}`);
});