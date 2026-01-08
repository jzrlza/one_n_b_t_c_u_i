const express = require('express');
const { getConnection } = require('../config/database');
const router = express.Router();

// GET all registers with employee names
// GET all registers with employee names (alternative approach)
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const connection = await getConnection();

    // Validate and parse parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, Math.min(parseInt(limit), 100)); // Cap at 100 for safety
    const offset = (pageNum - 1) * limitNum;
    
    // Build query with inline values for LIMIT (since they're validated numbers)
    const query = `
      SELECT 
        r.*,
        e.emp_name
      FROM register r
      LEFT JOIN employee e ON r.emp_id = e.id
      WHERE r.is_deleted = 0 AND e.is_deleted = 0
      ORDER BY r.sys_datetime DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `;
    
    const [rows] = await connection.execute(query);
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM register r
      LEFT JOIN employee e ON r.emp_id = e.id
      WHERE r.is_deleted = 0 AND e.is_deleted = 0
    `;
    const [countResult] = await connection.execute(countQuery);
    
    await connection.end();
    
    res.json({
      registers: rows,
      total: countResult[0].total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(countResult[0].total / limitNum)
    });
  } catch (error) {
    console.log('Database error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/divisions', async (req, res) => {
  try {
    const connection = await getConnection();
    const [rows] = await connection.execute('SELECT * FROM division ORDER BY div_name');
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET departments for dropdown
router.get('/departments', async (req, res) => {
  try {
    const { div_id } = req.query;
    
    if (!div_id) {
      return res.status(400).json({ error: 'div_id is required' });
    }

    const connection = await getConnection();
    const [rows] = await connection.execute(
      `SELECT * FROM dept d
      WHERE d.div_id = ?
      ORDER BY dept_name`, 
      [div_id]
      );
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET employees by department ID
router.get('/employees', async (req, res) => {
  try {
    const { dept_id } = req.query;
    
    if (!dept_id) {
      return res.status(400).json({ error: 'Department ID is required' });
    }

    const connection = await getConnection();
    const [rows] = await connection.execute(
      `SELECT e.id, e.emp_name, p.position_name, e.dept_id 
       FROM employee e 
       LEFT JOIN position p ON e.position_id = p.id 
       WHERE e.dept_id = ? AND e.is_deleted = 0 
       ORDER BY e.emp_name`, 
      [dept_id]
    );
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET employee info (division and department) for edit mode
router.get('/employee-info/:emp_id', async (req, res) => {
  try {
    const { emp_id } = req.params;
    
    const connection = await getConnection();
    const [rows] = await connection.execute(`
      SELECT 
        e.id,
        e.emp_name,
        p.position_name,
        e.dept_id,
        d.dept_name,
        d.div_id,
        division_obj.div_name
      FROM employee e
      LEFT JOIN position p ON e.position_id = p.id
      LEFT JOIN dept d ON e.dept_id = d.id
      LEFT JOIN division division_obj ON d.div_id = division_obj.id
      WHERE e.id = ? AND e.is_deleted = 0
    `, [emp_id]);
    await connection.end();
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    const employee = rows[0];
    res.json({
      id: employee.id,
      emp_name: employee.emp_name,
      position_name: employee.position_name,
      department_id: employee.dept_id,
      department_name: employee.dept_name,
      division_id: employee.div_id,
      division_name: employee.div_name
    });
  } catch (error) {
    console.log(error.message);
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
    
    // Check if employee exists and is not deleted
    const [empRows] = await connection.execute(
      'SELECT emp_name FROM employee WHERE id = ? AND is_deleted = 0',
      [emp_id]
    );
    
    if (empRows.length === 0) {
      await connection.end();
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    const [result] = await connection.execute(
      'INSERT INTO register (emp_id, phone_number, is_attend, take_van_id, van_round_id, take_food, is_deleted) VALUES (?, ?, ?, ?, ?, ?, 0)',
      [emp_id, phone_number, is_attend, take_van_id, van_round_id, take_food]
    );
    
    // Update employee's is_register status
    await connection.execute(
      'UPDATE employee SET is_register = 1 WHERE id = ?',
      [emp_id]
    );
    
    await connection.end();
    
    res.json({ id: result.insertId, message: 'Registration created successfully' });
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
    
    // Check if register exists and is not deleted
    const [registerRows] = await connection.execute(
      'SELECT id FROM register WHERE id = ? AND is_deleted = 0',
      [id]
    );
    
    if (registerRows.length === 0) {
      await connection.end();
      return res.status(404).json({ error: 'Register not found' });
    }
    
    // Check if employee exists and is not deleted
    const [empRows] = await connection.execute(
      'SELECT emp_name FROM employee WHERE id = ? AND is_deleted = 0',
      [emp_id]
    );
    
    if (empRows.length === 0) {
      await connection.end();
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    const [result] = await connection.execute(
      'UPDATE register SET emp_id = ?, phone_number = ?, is_attend = ?, take_van_id = ?, van_round_id = ?, take_food = ? WHERE id = ? AND is_deleted = 0',
      [emp_id, phone_number, is_attend, take_van_id, van_round_id, take_food, id]
    );
    
    await connection.end();
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Register not found' });
    }
    
    res.json({ message: 'Registration updated successfully' });
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
// Soft delete register
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const connection = await getConnection();
    
    const [result] = await connection.execute(
      'UPDATE register SET is_deleted = 1 WHERE id = ?',
      [id]
    );
    
    await connection.end();
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Register not found' });
    }
    
    res.json({ message: 'Registration deleted successfully' });
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
