const express = require('express');
const { getConnection } = require('../config/database');
const router = express.Router();
const jwt = require('jsonwebtoken');
const SimpleRotatingLogger = require('../SimpleRotatingLogger');

const JWT_SECRET_STR = process.env.JWT_SECRET;

const fs = require('fs');
const path = require('path');
const logDir = process.env.LOG_PATH || path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const verifyJWTToken = (req, res) => {
  const token = req.headers.authorization?.split(' ')[1].replace(/"/g, '');

  if (!token) {
    return null;
  }
  
  try {
    // Verify token - if valid, get user info back!
    const user = jwt.verify(token, JWT_SECRET_STR);
    return user;
  } catch (err) {
    return null;
  }
}

const logger = new SimpleRotatingLogger(logDir, 'backend-registers.js-access.log', {
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    compress: true,
    level: 'info'//,
   // consoleOutput: process.env.NODE_ENV !== 'production'
});

const logFile = (req, user=null) => {
    //let date_now = new Date().toISOString();
    //const logEntry = `${date_now} - ${req.method} ${req.url} - ${req.ip} - ${req.get('User-Agent')}\n`;
    let user_str = user ? user.username : ''
    // Write to rotating stream instead of direct append
    logger.info('API Request', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        user: user_str
    });
}

// GET all registers with employee names
// GET all registers with employee names (alternative approach)
router.get('/', async (req, res) => {
  try {
    logFile(req);
    const { search, page = 1, limit = 10 } = req.query;
    const connection = await getConnection();

    let whereClause = '';
    
    // Build conditions array
    const conditions = [];
    
    if (search) {
      conditions.push(`e.emp_name LIKE '%${search}%'`);
    }

    // Add conditions to WHERE clause if any exist
    if (conditions.length > 0) {
      whereClause = `AND ${conditions.join(' AND ')}`;
    }

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
      WHERE r.is_deleted = 0 AND e.is_deleted = 0 ${whereClause}
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

    const totalPages = Math.ceil(countResult[0].total / limitNum);
    
    res.json({
      registers: rows,
      total: countResult[0].total,
      page: totalPages > 0 ? pageNum : 0,
      limit: limitNum,
      totalPages: totalPages
    });
  } catch (error) {
    console.log('Database error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/divisions', async (req, res) => {
  try {
    logFile(req);
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
    logFile(req);
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
    logFile(req);
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
    logFile(req);
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
    logFile(req);
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

// --PUBLIC-- ****this is used in home public page where no login needed****
// POST create new register
router.post('/', async (req, res) => {
  try {
    logFile(req); //ALWAYS PUBLIC
    const { emp_id, table_number } = req.body;
    
    const connection = await getConnection();
    
    // Check if employee exists and is not deleted
    const [empRows] = await connection.execute(
      'SELECT emp_name FROM employee WHERE id = ? AND is_deleted = 0',
      [emp_id ? emp_id : null]
    );
    
    if (empRows.length === 0) {
      await connection.end();
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    const [result] = await connection.execute(
      'INSERT INTO register (emp_id, table_number, is_deleted) VALUES (?, ?, 0)',
      [emp_id, table_number]
    );
    
    // Update employee's is_register status
    await connection.execute(
      'UPDATE employee SET is_register = 1 WHERE id = ?',
      [emp_id]
    );
    
    await connection.end();
    
    res.json({ id: result.insertId, message: 'เพิ่มการลงทะเบียนเรียบร้อย' });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
});

// **PROTECTED**
// PUT update register
router.put('/:id', async (req, res) => {
  const user = verifyJWTToken(req,res);
    if(!user) {
      logFile(req);
      return res.status(403).json({ error: "Unauthorized Access" });
    }
  logFile(req, user);

  try {
    const { id } = req.params;
    const { emp_id, table_number } = req.body;
    
    const connection = await getConnection();
    
    // Check if register exists and is not deleted
    const [registerRows] = await connection.execute(
      'SELECT id FROM register WHERE id = ? AND is_deleted = 0',
      [id]
    );
    
    if (registerRows.length === 0) {
      await connection.end();
      return res.status(404).json({ error: 'ไม่พบการลงทะเบียน' });
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
      'UPDATE register SET emp_id = ?, table_number = ? WHERE id = ? AND is_deleted = 0',
      [emp_id, table_number, id]
    );
    
    await connection.end();
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Register not found' });
    }
    
    res.json({ message: 'แก้ไขการลงทะเบียนเรียบร้อย' });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET single register for edit
router.get('/single/:id', async (req, res) => {
  try {
    logFile(req);
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
      return res.status(404).json({ error: 'ไม่พบการลงทะเบียน' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
});

// **PROTECTED**
// DELETE register
// Soft delete register
router.delete('/:id', async (req, res) => {
  const user = verifyJWTToken(req,res);
    if(!user) {
      logFile(req);
      return res.status(403).json({ error: "Unauthorized Access" });
    }
  logFile(req, user);

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
    
    res.json({ message: 'ลบการลงทะเบียนเรียบร้อย' });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
});

// **PROTECTED**
// GET export data for Excel (most efficient)
router.get('/export-data', async (req, res) => {
  const user = verifyJWTToken(req,res);
    if(!user) {
      logFile(req);
      return res.status(403).json({ error: "Unauthorized Access" });
    }
  logFile(req, user);

  let connection;
  try {
    connection = await getConnection();
    
    // Get latest registers with employee details in one query
    const [registers] = await connection.execute(`
      SELECT 
        r.*,
        e.emp_name,
        p.position_name,
        d.dept_name,
        division_obj.div_name,
        division_obj.id as division_id,
        d.id as dept_id
      FROM register r
      INNER JOIN employee e ON r.emp_id = e.id
      LEFT JOIN position p ON e.position_id = p.id
      LEFT JOIN dept d ON e.dept_id = d.id
      LEFT JOIN division division_obj ON d.div_id = division_obj.id
      INNER JOIN (
        -- Subquery to get latest register for each employee
        SELECT 
          emp_id,
          MAX(id) as latest_id
        FROM register
        WHERE is_deleted = 0
        GROUP BY emp_id
      ) latest ON r.id = latest.latest_id
      WHERE r.is_deleted = 0
      ORDER BY division_obj.id, d.id, e.emp_name
    `);
    
    // Get unregistered employees
    const [unregisteredEmployees] = await connection.execute(`
      SELECT 
        e.id,
        e.emp_name,
        p.position_name,
        d.dept_name,
        division_obj.div_name,
        division_obj.id as division_id,
        d.id as dept_id
      FROM employee e
      LEFT JOIN position p ON e.position_id = p.id
      LEFT JOIN dept d ON e.dept_id = d.id
      LEFT JOIN division division_obj ON d.div_id = division_obj.id
      WHERE e.is_deleted = 0
        AND e.id NOT IN (
          SELECT DISTINCT emp_id 
          FROM register 
          WHERE is_deleted = 0
        )
      ORDER BY division_obj.id, d.id, e.emp_name
    `);
    
    res.json({
      success: true,
      registers: registers,
      unregisteredEmployees: unregisteredEmployees,
      count: registers.length,
      unregisteredCount: unregisteredEmployees.length
    });
    
  } catch (error) {
    console.log('Export error:', error.message);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.end();
  }
});

module.exports = router;
