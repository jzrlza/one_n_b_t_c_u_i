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

const logger = new SimpleRotatingLogger(logDir, 'backend-users.js-access.log', {
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

// GET all users
router.get('/', async (req, res) => {
  try {
    logFile(req);
    const { search, page = 1, limit = 10 } = req.query;

    const connection = await getConnection();

    let whereClause = '';
    
    // Build conditions array
    const conditions = [];
    
    if (search) {
      conditions.push(`u.username LIKE '%${search}%'`);
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
        u.id,
        u.username,
        u.employee_id,
        u.type,
        u.is_2fa_enabled,
        (u.two_factor_secret IS NOT NULL) as has_two_password,
        e.emp_name
      FROM users u
      LEFT JOIN employee e ON u.employee_id = e.id
      WHERE u.is_deleted = 0 AND (u.employee_id IS NULL OR e.is_deleted = 0) ${whereClause}
      ORDER BY u.id DESC
      LIMIT ${limitNum} OFFSET ${offset}
    `; //LEFT JOIN employee e ON u.emp_id = e.id     AND e.is_deleted = 0
    
    const [rows] = await connection.execute(query);
    
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM users u
      WHERE u.is_deleted = 0
    `; //LEFT JOIN employee e ON u.employee_id = e.id     AND e.is_deleted = 0
    const [countResult] = await connection.execute(countQuery);

    await connection.end();

    const totalPages = Math.ceil(countResult[0].total / limitNum);
    
    res.json({
      users: rows,
      total: countResult[0].total,
      page: totalPages > 0 ? pageNum : 0,
      limit: limitNum,
      totalPages: totalPages
    });
  } catch (error) {
    console.log(error.message);
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
        division_obj.div_name,
        user_obj.type,
        user_obj.id as user_id
      FROM employee e
      LEFT JOIN position p ON e.position_id = p.id
      LEFT JOIN dept d ON e.dept_id = d.id
      LEFT JOIN division division_obj ON d.div_id = division_obj.id
      LEFT JOIN users user_obj ON e.id = user_obj.employee_id
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
      division_name: employee.div_name,
      type: employee.type,
      user_id: employee.user_id
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

// GET user by ID
router.get('/:id', async (req, res) => {
  try {
    logFile(req);
    const connection = await getConnection();
    const [rows] = await connection.execute('SELECT * FROM users WHERE id = ?', [req.params.id]);
    await connection.end();
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
});

// **PROTECTED**
// POST create new user
router.post('/', async (req, res) => {
  const user = verifyJWTToken(req,res);
    if(!user) {
      logFile(req);
      return res.status(403).json({ error: "Unauthorized Access" });
    }
  logFile(req, user);

  try {
    const { employee_id, type, username, is_2fa_enabled } = req.body;
    
    const connection = await getConnection();
    
    // Check if employee exists and is not deleted
    const [empRows] = await connection.execute(
      'SELECT emp_name FROM employee WHERE id = ? AND is_deleted = 0',
      [employee_id ? employee_id : null]
    );
    
    if (empRows.length === 0) {
      await connection.end();
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Check if username is duplicated
    const [users_duplicated] = await connection.execute(
      'SELECT 1 FROM users WHERE username = ? AND is_deleted = 0',
      [username ? username : null]
    );
    if (users_duplicated.length > 0) {
      await connection.end();
      return res.status(401).json({ error: 'Username ซ้ำ' });
    }
    
    const [result] = await connection.execute(
      'INSERT INTO users (username, employee_id, type, is_2fa_enabled, is_deleted) VALUES (?, ?, ?, ?, 0)',
      [username, employee_id, type, (is_2fa_enabled ? 1 : 0)]
    );
    
    await connection.end();
    
    res.json({ id: result.insertId, message: 'เพิ่มผู้ใช้งานเรียบร้อย' });
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
    const { employee_id, type, username, is_2fa_enabled } = req.body;
    
    const connection = await getConnection();
    
    // Check if register exists and is not deleted
    const [registerRows] = await connection.execute(
      'SELECT id FROM users WHERE id = ? AND is_deleted = 0',
      [id]
    );
    
    if (registerRows.length === 0) {
      await connection.end();
      return res.status(404).json({ error: 'ไม่พบผู้ใช้งาน' });
    }
    
    // Check if employee exists and is not deleted
    const [empRows] = await connection.execute(
      'SELECT emp_name FROM employee WHERE id = ? AND is_deleted = 0',
      [employee_id]
    );
    
    if (empRows.length === 0) {
      await connection.end();
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Check if username is duplicated
    const [users_duplicated] = await connection.execute(
      'SELECT 1 FROM users WHERE username = ? AND is_deleted = 0 AND NOT (id = ?)',
      [username ? username : null, id]
    );
    if (users_duplicated.length > 0) {
      await connection.end();
      return res.status(401).json({ error: 'Username ซ้ำ' });
    }
    
    const [result] = await connection.execute(
      'UPDATE users SET username = ?, employee_id = ?, type = ?, is_2fa_enabled = ? WHERE id = ? AND is_deleted = 0',
      [username, employee_id, type, (is_2fa_enabled ? 1 : 0), id]
    );
    
    await connection.end();
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'แก้ไขผู้ใช้งานเรียบร้อย' });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
});

// **PROTECTED**
// DELETE user
// Soft delete user
router.delete('/:id', async (req, res) => {
  const user = verifyJWTToken(req,res);
    if(!user) {
      logFile(req);
      return res.status(403).json({ error: "Unauthorized Access" });
    }
  logFile(req, user);

  try {
    const { id } = req.params;

    const self_delete = parseInt(user.id) === parseInt(id);
    
    const connection = await getConnection();
    
    const [result] = await connection.execute(
      'UPDATE users SET is_deleted = 1 WHERE id = ?',
      [id]
    );
    
    await connection.end();
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: 'User ถูกลบเรียบร้อย', self_delete: self_delete });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
});

// **PROTECTED**
// DELETE 2fa
router.delete('/2fa/:id', async (req, res) => {
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
      'UPDATE users SET two_factor_secret = NULL WHERE id = ?',
      [id]
    );
    
    await connection.end();
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ message: '2FA ถูกลบเรียบร้อย' });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;