const express = require('express');
const { getConnection } = require('../config/database');
const router = express.Router();

// GET all employees
router.get('/', async (req, res) => {
  try {
    const connection = await getConnection();
    const [rows] = await connection.execute('SELECT * FROM employees');
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET employee by ID
router.get('/:id', async (req, res) => {
  try {
    const connection = await getConnection();
    const [rows] = await connection.execute('SELECT * FROM employees WHERE id = ?', [req.params.id]);
    await connection.end();
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;