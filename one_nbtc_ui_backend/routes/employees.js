const express = require('express');
const { getConnection } = require('../config/database');
const router = express.Router();

// GET all employees with position and department names
router.get('/', async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const connection = await getConnection();
    
    let whereClause = '\n';
    let queryParams = [];
    
    if (search) {
      whereClause = `WHERE e.emp_name LIKE ?`;
      queryParams.push(`%${search}%`);
    }
    
    const offset = (page - 1) * limit;
    
    // Get employees with pagination
    const employeeQuery = `
      SELECT 
        e.id,
        e.emp_name,
        p.position_name,
        d.dept_name,
        division.div_name,
        e.is_register
      FROM employee e
      LEFT JOIN position p ON e.position_id = p.id
      LEFT JOIN dept d ON e.dept_id = d.id
      LEFT JOIN division ON d.div_id = division.id
      ${whereClause}
      ORDER BY e.id
      LIMIT ? OFFSET ?
    `;
    
    // Add limit and offset to params
    const employeeParams = [...queryParams, parseInt(limit).toString(), parseInt(offset).toString()];
    
    const [rows] = await connection.execute(employeeQuery, employeeParams);
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM employee e
      LEFT JOIN position p ON e.position_id = p.id
      LEFT JOIN dept d ON e.dept_id = d.id
      LEFT JOIN division ON d.div_id = division.id
      ${whereClause}
    `;
    
    const [countResult] = await connection.execute(countQuery, queryParams);
    
    await connection.end();
    
    res.json({
      employees: rows,
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

// GET employee by ID
router.get('/:id', async (req, res) => {
  try {
    const connection = await getConnection();
    const [rows] = await connection.execute('SELECT * FROM employee WHERE id = ?', [req.params.id]);
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