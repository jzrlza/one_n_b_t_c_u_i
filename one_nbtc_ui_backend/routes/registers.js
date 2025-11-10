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

// GET employees for search
router.get('/employees/search', async (req, res) => {
  try {
    const { search } = req.query;
    const connection = await getConnection();
    
    let query = 'SELECT id, emp_name FROM employee WHERE is_deleted = 0';
    let params = [];
    
    if (search) {
      query += ' AND emp_name LIKE ?';
      params.push(`%${search}%`);
    }
    
    query += ' ORDER BY emp_name LIMIT 10';
    
    const [rows] = await connection.execute(query, params);
    await connection.end();
    
    res.json(rows);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST create new register
router.post('/', async (req, res) => {
  try {
    const { emp_id, phone_number, is_attend, take_van_id, van_round_id, take_food } = req.body;
    const connection = await getConnection();
    
    const [result] = await connection.execute(
      'INSERT INTO register (emp_id, phone_number, is_attend, take_van_id, van_round_id, take_food) VALUES (?, ?, ?, ?, ?, ?)',
      [emp_id, phone_number, is_attend, take_van_id, van_round_id, take_food]
    );
    
    await connection.end();
    res.json({ success: true, id: result.insertId });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
});

// PUT update register
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { emp_id, phone_number, is_attend, take_van_id, van_round_id, take_food } = req.body;
    const connection = await getConnection();
    
    await connection.execute(
      'UPDATE register SET emp_id = ?, phone_number = ?, is_attend = ?, take_van_id = ?, van_round_id = ?, take_food = ? WHERE id = ?',
      [emp_id, phone_number, is_attend, take_van_id, van_round_id, take_food, id]
    );
    
    await connection.end();
    res.json({ success: true });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET single register for edit
router.get('/single/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await getConnection();
    
    const [rows] = await connection.execute(`
      SELECT r.*, e.emp_name 
      FROM register r 
      LEFT JOIN employee e ON r.emp_id = e.id 
      WHERE r.id = ?
    `, [id]);
    
    await connection.end();
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Registration not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.log(error.message);
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

// GET export data for Excel (raw data only)
router.get('/export-data', async (req, res) => {
  try {
    const connection = await getConnection();
    
    // Get all register data with employee details
    const [registers] = await connection.execute(`
      SELECT 
        r.*,
        e.emp_name,
        p.position_name,
        d.dept_name,
        division_obj.div_name
      FROM register r
      LEFT JOIN employee e ON r.emp_id = e.id
      LEFT JOIN position p ON e.position_id = p.id
      LEFT JOIN dept d ON e.dept_id = d.id
      LEFT JOIN division division_obj ON d.div_id = division_obj.id
      ORDER BY e.id
    `);
    
    // Get all employees to find unregistered ones
    const [allEmployees] = await connection.execute(`
      SELECT 
        e.id,
        e.emp_name,
        p.position_name,
        d.dept_name,
        division_obj.div_name
      FROM employee e
      LEFT JOIN position p ON e.position_id = p.id
      LEFT JOIN dept d ON e.dept_id = d.id
      LEFT JOIN division division_obj ON d.div_id = division_obj.id
      WHERE e.is_deleted = 0
      ORDER BY e.id
    `);
    
    await connection.end();
    
    // Get registered employee IDs
    const registeredEmpIds = new Set(registers.map(r => r.emp_id));
    
    // Find unregistered employees
    const unregisteredEmployees = allEmployees.filter(emp => !registeredEmpIds.has(emp.id));
    
    res.json({
      success: true,
      registers: registers,
      unregisteredEmployees: unregisteredEmployees
    });
    
  } catch (error) {
    console.log('Export error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
