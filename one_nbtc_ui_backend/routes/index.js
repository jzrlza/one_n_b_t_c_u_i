const express = require('express');
const router = express.Router();

// Health check route
router.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'backend' });
});

// Main API route
router.get('/', (req, res) => {
  res.json({ 
    message: 'one_nbtc_ui API', 
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      employees: '/api/employees',
      health: '/api/health'
    }
  });
});

module.exports = router;