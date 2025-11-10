const express = require('express');
const { getConnection } = require('../config/database');
const router = express.Router();

// GET all employees with position and department names
router.get('/', async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const connection = await getConnection();
    
    let whereClause = 'WHERE e.is_deleted = 0 \n';
    let queryParams = [];
    
    if (search) {
      whereClause += `AND e.emp_name LIKE ?`;
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

// GET positions for dropdown
router.get('/positions', async (req, res) => {
  try {
    const connection = await getConnection();
    const [rows] = await connection.execute('SELECT * FROM position ORDER BY position_name');
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
    const connection = await getConnection();
    const [rows] = await connection.execute('SELECT * FROM dept ORDER BY dept_name');
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.log(error.message);
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

// POST create new employee
router.post('/', async (req, res) => {
  try {
    const { emp_name, position_id, dept_id } = req.body;
    const connection = await getConnection();
    
    const [result] = await connection.execute(
      'INSERT INTO employee (emp_name, position_id, dept_id) VALUES (?, ?, ?)',
      [emp_name, position_id, dept_id]
    );
    
    await connection.end();
    res.json({ success: true, id: result.insertId });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
});

// PUT update employee
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { emp_name, position_id, dept_id } = req.body;
    const connection = await getConnection();
    
    await connection.execute(
      'UPDATE employee SET emp_name = ?, position_id = ?, dept_id = ? WHERE id = ?',
      [emp_name, position_id, dept_id, id]
    );
    
    await connection.end();
    res.json({ success: true });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET single employee for edit
router.get('/single/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await getConnection();
    
    const [rows] = await connection.execute(
      'SELECT * FROM employee WHERE id = ? AND is_deleted = 0',
      [id]
    );
    
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

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await getConnection();
    
    await connection.execute(
      'UPDATE employee SET is_deleted = 1 WHERE id = ?',
      [id]
    );
    
    await connection.end();
    res.json({ success: true });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id/force', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await getConnection();
    
    await connection.execute(
      'DELETE FROM employee WHERE id = ?',
      [id]
    );
    
    await connection.end();
    res.json({ success: true });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST test Excel import (console.log only)
router.post('/test-import', async (req, res) => {
  try {
    const { excelData } = req.body;
    
    console.log('=== EXCEL IMPORT TEST START ===');
    console.log('Raw Excel Data Received:', excelData);
    
    if (!excelData || !Array.isArray(excelData)) {
      console.log('ERROR: Invalid Excel data format');
      return res.json({ success: false, error: 'Invalid Excel data format' });
    }
    
    // Get all enums for matching
    const connection = await getConnection();
    const [divisions] = await connection.execute('SELECT * FROM division');
    const [departments] = await connection.execute('SELECT * FROM dept');
    const [positions] = await connection.execute('SELECT * FROM position');
    await connection.end();
    
    console.log('Available Divisions:', divisions);
    console.log('Available Departments:', departments);
    console.log('Available Positions:', positions);
    
    const results = [];
    const errors = [];
    
    // Skip first row (header)
    const dataRows = excelData.slice(1);
    
    dataRows.forEach((row, index) => {
      const rowNumber = index + 2; // +2 for header row and 0-based index
      
      try {
        // Skip empty rows
        if (!row || row.length === 0 || row.every(cell => !cell)) {
          console.log(`Row ${rowNumber}: Skipping empty row`);
          return;
        }
        
        const divisionStr = row[1]?.toString().trim();
        const deptStr = row[2]?.toString().trim();
        const empName = row[3]?.toString().trim();
        const positionStr = row[4]?.toString().trim();
        
        console.log(`\n--- Row ${rowNumber} Processing ---`);
        console.log('Raw Data:', { divisionStr, deptStr, empName, positionStr });
        
        // Validate required fields
        if (!empName) {
          const error = `Row ${rowNumber}: Employee name is required`;
          console.log('ERROR:', error);
          errors.push(error);
          return;
        }
        
        if (!divisionStr) {
          const error = `Row ${rowNumber}: Division is required`;
          console.log('ERROR:', error);
          errors.push(error);
          return;
        }
        
        if (!deptStr) {
          const error = `Row ${rowNumber}: Department is required`;
          console.log('ERROR:', error);
          errors.push(error);
          return;
        }
        
        if (!positionStr) {
          const error = `Row ${rowNumber}: Position is required`;
          console.log('ERROR:', error);
          errors.push(error);
          return;
        }
        
        // Find division ID
        const division = divisions.find(div => 
          div.div_name.toLowerCase() === divisionStr.toLowerCase()
        );
        
        if (!division) {
          const error = `Row ${rowNumber}: Division "${divisionStr}" not found. Available: ${divisions.map(d => d.div_name).join(', ')}`;
          console.log('ERROR:', error);
          errors.push(error);
          return;
        }
        
        console.log(`Division Match: "${divisionStr}" -> ID ${division.id}`);
        
        // Find department ID (must belong to the found division)
        const department = departments.find(dept => 
          dept.dept_name.toLowerCase() === deptStr.toLowerCase() && 
          dept.div_id == division.id
        );
        
        if (!department) {
          const availableDepts = departments.filter(d => d.div_id == division.id).map(d => d.dept_name);
          const error = `Row ${rowNumber}: Department "${deptStr}" not found in division "${divisionStr}". Available in this division: ${availableDepts.join(', ')}`;
          console.log('ERROR:', error);
          errors.push(error);
          return;
        }
        
        console.log(`Department Match: "${deptStr}" -> ID ${department.id}`);
        
        // Find position ID
        const position = positions.find(pos => 
          pos.position_name.toLowerCase() === positionStr.toLowerCase()
        );
        
        if (!position) {
          const error = `Row ${rowNumber}: Position "${positionStr}" not found. Available: ${positions.map(p => p.position_name).join(', ')}`;
          console.log('ERROR:', error);
          errors.push(error);
          return;
        }
        
        console.log(`Position Match: "${positionStr}" -> ID ${position.id}`);
        
        const result = {
          emp_name: empName,
          division_id: division.id,
          division_name: division.div_name,
          dept_id: department.id,
          dept_name: department.dept_name,
          position_id: position.id,
          position_name: position.position_name,
          rowNumber,
          status: 'VALID'
        };
        
        console.log('SUCCESS: Row processed successfully', result);
        results.push(result);
        
      } catch (error) {
        const errorMsg = `Row ${rowNumber}: ${error.message}`;
        console.log('EXCEPTION:', errorMsg);
        errors.push(errorMsg);
      }
    });
    
    console.log('\n=== EXCEL IMPORT TEST SUMMARY ===');
    console.log('Total Rows Processed:', dataRows.length);
    console.log('Successful Rows:', results.length);
    console.log('Error Rows:', errors.length);
    console.log('Results:', results);
    console.log('Errors:', errors);
    console.log('=== EXCEL IMPORT TEST END ===\n');
    
    res.json({
      success: true,
      data: results,
      errors: errors,
      totalRows: dataRows.length,
      validRows: results.length,
      errorRows: errors.length
    });
    
  } catch (error) {
    console.log('BACKEND ERROR:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST real Excel import (save to database)
router.post('/import', async (req, res) => {
  const connection = await getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { excelData } = req.body;
    
    console.log('=== EXCEL IMPORT START (SAVING TO DATABASE) ===');
    
    if (!excelData || !Array.isArray(excelData)) {
      throw new Error('Invalid Excel data format');
    }
    
    // Get all enums for matching
    const [divisions] = await connection.execute('SELECT * FROM division');
    const [departments] = await connection.execute('SELECT * FROM dept');
    const [positions] = await connection.execute('SELECT * FROM position');
    
    const results = [];
    const errors = [];
    const savedEmployees = [];
    
    // Skip first row (header)
    const dataRows = excelData.slice(1);
    
    for (let index = 0; index < dataRows.length; index++) {
      const row = dataRows[index];
      const rowNumber = index + 2;
      
      try {
        // Skip empty rows
        if (!row || row.length === 0 || row.every(cell => !cell)) {
          console.log(`Row ${rowNumber}: Skipping empty row`);
          continue;
        }
        
        const divisionStr = row[1]?.toString().trim();
        const deptStr = row[2]?.toString().trim();
        const empName = row[3]?.toString().trim();
        const positionStr = row[4]?.toString().trim();
        
        // Validate required fields
        if (!empName) {
          errors.push(`Row ${rowNumber}: Employee name is required`);
          continue;
        }
        
        if (!divisionStr) {
          errors.push(`Row ${rowNumber}: Division is required`);
          continue;
        }
        
        if (!deptStr) {
          errors.push(`Row ${rowNumber}: Department is required`);
          continue;
        }
        
        if (!positionStr) {
          errors.push(`Row ${rowNumber}: Position is required`);
          continue;
        }
        
        // Find division ID
        const division = divisions.find(div => 
          div.div_name.toLowerCase() === divisionStr.toLowerCase()
        );
        
        if (!division) {
          errors.push(`Row ${rowNumber}: Division "${divisionStr}" not found`);
          continue;
        }
        
        // Find department ID (must belong to the found division)
        const department = departments.find(dept => 
          dept.dept_name.toLowerCase() === deptStr.toLowerCase() && 
          dept.div_id == division.id
        );
        
        if (!department) {
          errors.push(`Row ${rowNumber}: Department "${deptStr}" not found in division "${divisionStr}"`);
          continue;
        }
        
        // Find position ID
        const position = positions.find(pos => 
          pos.position_name.toLowerCase() === positionStr.toLowerCase()
        );
        
        if (!position) {
          errors.push(`Row ${rowNumber}: Position "${positionStr}" not found`);
          continue;
        }
        
        // Check if employee already exists
        const [existingEmployees] = await connection.execute(
          'SELECT id FROM employee WHERE emp_name = ? AND is_deleted = 0',
          [empName]
        );
        
        if (existingEmployees.length > 0) {
          errors.push(`Row ${rowNumber}: Employee "${empName}" already exists`);
          continue;
        }
        
        // Insert employee
        const [insertResult] = await connection.execute(
          'INSERT INTO employee (emp_name, position_id, dept_id, is_register) VALUES (?, ?, ?, 0)',
          [empName, position.id, department.id]
        );
        
        const result = {
          emp_name: empName,
          division_name: division.div_name,
          dept_name: department.dept_name,
          position_name: position.position_name,
          rowNumber,
          id: insertResult.insertId,
          status: 'SAVED'
        };
        
        console.log(`Row ${rowNumber}: Employee saved successfully`, result);
        results.push(result);
        savedEmployees.push(result);
        
      } catch (error) {
        errors.push(`Row ${rowNumber}: ${error.message}`);
      }
    }
    
    await connection.commit();
    
    console.log('=== EXCEL IMPORT COMPLETE ===');
    console.log('Total Rows Processed:', dataRows.length);
    console.log('Successfully Saved:', savedEmployees.length);
    console.log('Errors:', errors.length);
    
    res.json({
      success: true,
      saved: savedEmployees,
      errors: errors,
      totalRows: dataRows.length,
      savedCount: savedEmployees.length,
      errorCount: errors.length
    });
    
  } catch (error) {
    await connection.rollback();
    console.log('IMPORT ERROR:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  } finally {
    await connection.end();
  }
});

module.exports = router;