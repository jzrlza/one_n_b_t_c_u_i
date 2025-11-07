const express = require('express');
const { getConnection } = require('../config/database');
const router = express.Router();

// GET all registers with employee names
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const connection = await getConnection();
    
    const offset = (page - 1) * limit;
    
    const query = `
      SELECT 
        r.*,
        e.emp_name
      FROM register r
      LEFT JOIN employee e ON r.emp_id = e.id
      ORDER BY r.sys_datetime DESC
      LIMIT ? OFFSET ?
    `;
    
    const [rows] = await connection.execute(query, [limit.toString(), offset.toString()]);
    
    // Get total count
    const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM register');
    
    await connection.end();
    
    res.json({
      registers: rows,
      total: countResult[0].total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(countResult[0].total / limit)
    });
  } catch (error) {
    console.log('Database error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// DELETE register
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await getConnection();
    
    await connection.execute(
      'DELETE FROM register WHERE id = ?',
      [id]
    );
    
    await connection.end();
    res.json({ success: true });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;