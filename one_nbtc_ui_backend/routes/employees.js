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

const logger = new SimpleRotatingLogger(logDir, 'backend-employees.js-access.log', {
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

// GET all employees with position and department names
router.get('/', async (req, res) => {
  try {
    logFile(req);
    const { search, page = 1, limit = 20, division_id, dept_id } = req.query;
    const connection = await getConnection();
    
    let whereClause = 'WHERE e.is_deleted = 0';
    let queryParams = [];
    
    // Build conditions array
    const conditions = [];
    
    if (search) {
      conditions.push(`e.emp_name LIKE ?`);
      queryParams.push(`%${search}%`);
    }
    
    if (division_id) {
      conditions.push(`d.div_id = ?`);
      queryParams.push(division_id);
    }
    
    if (dept_id) {
      conditions.push(`e.dept_id = ?`);
      queryParams.push(dept_id);
    }
    
    // Add conditions to WHERE clause if any exist
    if (conditions.length > 0) {
      whereClause = `WHERE e.is_deleted = 0 AND ${conditions.join(' AND ')}`;
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
    
    //console.log('SQL Query:', employeeQuery);
    //console.log('Query Params:', [...queryParams, parseInt(limit).toString(), parseInt(offset).toString()]);
    
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
    
    //console.log('Count Query:', countQuery);
    //console.log('Count Params:', queryParams);
    
    const [countResult] = await connection.execute(countQuery, queryParams);
    
    await connection.end();

    const totalPages = Math.ceil(countResult[0].total / limit);
    
    res.json({
      employees: rows,
      total: countResult[0].total,
      page: totalPages > 0 ? parseInt(page) : 0,
      limit: parseInt(limit),
      totalPages: totalPages
    });
  } catch (error) {
    console.log('Database error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET departments by division
router.get('/departments/by-division/:divisionId', async (req, res) => {
  try {
    logFile(req);
    const { divisionId } = req.params;
    const connection = await getConnection();
    const [rows] = await connection.execute(
      'SELECT * FROM dept WHERE div_id = ? ORDER BY dept_name',
      [divisionId]
    );
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET positions for dropdown
router.get('/positions', async (req, res) => {
  try {
    logFile(req);
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
    logFile(req);
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

//**PROTECTED**
// POST create new employee
router.post('/', async (req, res) => {
  const user = verifyJWTToken(req,res);
    if(!user) {
      logFile(req);
      return res.status(403).json({ error: "Unauthorized Access" });
    }
  logFile(req, user);

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

//**PROTECTED**
// PUT update employee
router.put('/:id', async (req, res) => {
  const user = verifyJWTToken(req,res);
    if(!user) {
      logFile(req);
      return res.status(403).json({ error: "Unauthorized Access" });
    }
  logFile(req, user);

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
    logFile(req);
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

//**PROTECTED**
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = verifyJWTToken(req,res);
    if(!user) {
      logFile(req);
      return res.status(403).json({ error: "Unauthorized Access" });
    }
    logFile(req, user);

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

//**PROTECTED**
router.delete('/:id/force', async (req, res) => {
  try {
    const { id } = req.params;

    const user = verifyJWTToken(req,res);
    if(!user) {
      logFile(req);
      return res.status(403).json({ error: "Unauthorized Access" });
    }
    logFile(req, user);

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

// ==================== REUSABLE IMPORT FUNCTIONS ====================

/**
 * Find the header row and map column indices based on content
 */
const detectColumnIndices = (excelData) => {
  // Find the header row that contains "ลำดับ" in the first column
  let headerRowIndex = -1;
  let headerRow = null;
  
  for (let i = 0; i < excelData.length; i++) {
    const row = excelData[i];
    if (!row || row.length === 0) continue;
    
    const firstCell = row[0]?.toString().trim();
    if (firstCell === "ลำดับ") {
      headerRowIndex = i;
      headerRow = row;
      break;
    }
  }
  
  if (headerRowIndex === -1) {
    throw new Error('Header row with "ลำดับ" not found in Excel file');
  }
  
  //console.log(`Found header row at index: ${headerRowIndex}`);
  
  // Find column indices based on header content
  const columnMap = {
    seqIndex: 0, // "ลำดับ" column is always index 0
    empNameIndex: null,
    positionIndex: null,
    divisionIndex: null,
    deptIndex: null
  };
  
  // Scan through header row to find column positions
  for (let colIndex = 0; colIndex < headerRow.length; colIndex++) {
    const cellValue = headerRow[colIndex]?.toString().trim();
    if (!cellValue) continue;
    
    const lowerValue = cellValue.toLowerCase();
    if (lowerValue.startsWith("ชื่อ")) {
      columnMap.empNameIndex = colIndex;
    }
    if (lowerValue.startsWith("ตำแหน่ง")) {
      columnMap.positionIndex = colIndex;
    }
    if (lowerValue.startsWith("สายงาน")) {
      columnMap.divisionIndex = colIndex;
    }
    if (lowerValue.startsWith("สำนัก") || lowerValue.startsWith("สังกัด")) {
      columnMap.deptIndex = colIndex;
    }
  }
  
  // Validate that all required columns were found
  const missingColumns = [];
  if (columnMap.empNameIndex === null) missingColumns.push('"ชื่อ"');
  if (columnMap.positionIndex === null) missingColumns.push('"ตำแหน่ง"');
  if (columnMap.divisionIndex === null) missingColumns.push('"สายงาน"');
  if (columnMap.deptIndex === null) missingColumns.push('"สำนัก"');
  
  if (missingColumns.length > 0) {
    throw new Error(`Missing required columns in header row: ${missingColumns.join(', ')}`);
  }
  
  //console.log('Detected column indices:', columnMap);
  return {
    headerRowIndex,
    columnMap,
    dataStartIndex: headerRowIndex + 1 // Data starts right after header
  };
};

/**
 * Safely extract cell value
 */
const getCellValue = (cell) => {
  if (cell == null || cell === '') {
    return '';
  }
  return String(cell).trim();
};

/**
 * Parse and validate Excel row data with auto-add missing data
 */
const parseExcelRow = async (row, rowNumber, divisions, departments, positions, columnMap, connection, testing = false) => {
  // Check if row is empty
  if (!row || row.length === 0 || row.every(cell => cell == null || cell === '')) {
    return { skipped: true, reason: 'Empty row' };
  }
  
  // Safely get column indices
  const divisionIndex = columnMap?.divisionIndex ?? -1;
  const deptIndex = columnMap?.deptIndex ?? -1;
  const empNameIndex = columnMap?.empNameIndex ?? -1;
  const positionIndex = columnMap?.positionIndex ?? -1;
  
  // Extract values
  const divisionStr = divisionIndex >= 0 && row[divisionIndex] != null 
    ? getCellValue(row[divisionIndex]) 
    : '';
  
  const deptStr = deptIndex >= 0 && row[deptIndex] != null 
    ? getCellValue(row[deptIndex]) 
    : '';
  
  const empName = empNameIndex >= 0 && row[empNameIndex] != null 
    ? getCellValue(row[empNameIndex]) 
    : '';
  
  const positionStr = positionIndex >= 0 && row[positionIndex] != null 
    ? getCellValue(row[positionIndex]) 
    : '';
  
  // Validate required fields
  const missingFields = [];
  if (!empName) missingFields.push('Employee name');
  if (!divisionStr) missingFields.push('Division');
  if (!deptStr) missingFields.push('Department');
  if (!positionStr) missingFields.push('Position');
  
  if (missingFields.length > 0) {
    return { 
      error: `Row ${rowNumber}: Missing required fields: ${missingFields.join(', ')}` 
    };
  }
  
  // Find or add division
  let division = divisions.find(div => 
    div.div_name.toLowerCase() === divisionStr.toLowerCase()
  );
  
  // Auto-add missing division
  if (!division) {
    if (!testing) {
      const [result] = await connection.execute(
        'INSERT INTO division (div_name) VALUES (?)',
        [divisionStr]
      );
      division = { id: result.insertId, div_name: divisionStr };
      divisions.push(division);
      //console.log(`Row ${rowNumber}: Added new division: ${divisionStr}`);
    } else {
      return { 
        error: `Row ${rowNumber}: | ไม่พบสายงานชื่อ "${divisionStr}" |` 
      };
    }
  }
  
  // Find or add department
  let department = departments.find(dept => 
    dept.dept_name.toLowerCase() === deptStr.toLowerCase() && 
    dept.div_id == division.id
  );
  
  // Auto-add missing department
  if (!department) {
    if (!testing) {
      const [result] = await connection.execute(
        'INSERT INTO dept (dept_name, div_id) VALUES (?, ?)',
        [deptStr, division.id]
      );
      department = { id: result.insertId, dept_name: deptStr, div_id: division.id };
      departments.push(department);
      //console.log(`Row ${rowNumber}: Added new department: ${deptStr} in division: ${divisionStr}`);
    } else {
      return { 
        error: `Row ${rowNumber}: | ไม่พบสังกัดชื่อ "${deptStr}" ในสายงาน "${divisionStr}" |` 
      };
    }
  }
  
  // Find or add position - escape table name with backticks
  let position = positions.find(pos => 
    pos.position_name.toLowerCase() === positionStr.toLowerCase()
  );
  
  // Auto-add missing position
  if (!position) {
    if (!testing) {
      const [result] = await connection.execute(
        'INSERT INTO `position` (position_name) VALUES (?)',
        [positionStr]
      );
      position = { id: result.insertId, position_name: positionStr };
      positions.push(position);
      //console.log(`Row ${rowNumber}: Added new position: ${positionStr}`);
    } else {
      return { 
        error: `Row ${rowNumber}: | ไม่พบตำแหน่งชื่อ "${positionStr}" |` 
      };
    }
  }
  
  return {
    success: true,
    data: {
      emp_name: empName,
      division_id: division.id,
      division_name: division.div_name,
      dept_id: department.id,
      dept_name: department.dept_name,
      position_id: position.id,
      position_name: position.position_name,
      rowNumber
    }
  };
};

/**
 * Check if employee details need to be updated
 */
const needsUpdate = (existingEmployee, newData) => {
  return (
    existingEmployee.position_id != newData.position_id ||
    existingEmployee.dept_id != newData.dept_id ||
    existingEmployee.div_id != newData.div_id
  );
};

/**
 * Process Excel data rows with auto-add missing data and update existing employees
 */
const processExcelImport = async (excelData, connection, testing = false) => {
  // Load existing data
  const [divisions, departments, positions] = await Promise.all([
    connection.execute('SELECT * FROM division').then(([rows]) => rows),
    connection.execute('SELECT * FROM dept').then(([rows]) => rows),
    connection.execute('SELECT * FROM `position`').then(([rows]) => rows)
  ]);
  
  const savedEmployees = [];
  const updatedEmployees = [];
  const errors = [];

  try {
    // Detect column indices
    const { headerRowIndex, columnMap, dataStartIndex } = detectColumnIndices(excelData);
    
    // Get data rows
    const dataRows = excelData.slice(dataStartIndex);
    
    //console.log(`Processing ${dataRows.length} rows, Testing: ${testing}`);
    
    for (let index = 0; index < dataRows.length; index++) {
      const row = dataRows[index];
      const rowNumber = dataStartIndex + index + 1;
      
      // Parse and validate row with auto-add
      const validation = await parseExcelRow(
        row, rowNumber, divisions, departments, positions, 
        columnMap, connection, testing
      );
      
      if (validation.skipped) {
        continue;
      }

      if (validation.error) {
        errors.push(validation.error);
        continue;
      }
      
      const { emp_name: empName, dept_id, position_id } = validation.data;
      
      try {
        // Check for existing employee
        const [existingEmployees] = await connection.execute(
          'SELECT id, position_id, dept_id FROM employee WHERE emp_name = ? AND is_deleted = 0',
          [empName]
        );
        
        if (existingEmployees.length > 0) {
          const existingEmployee = existingEmployees[0];
          
          // Check if employee needs update
          if (needsUpdate(existingEmployee, validation.data)) {
            if (!testing) {
              // Update existing employee
              await connection.execute(
                'UPDATE employee SET position_id = ?, dept_id = ? WHERE id = ?',
                [position_id, dept_id, existingEmployee.id]
              );
              
              const updatedEmployee = {
                ...validation.data,
                id: existingEmployee.id,
                previous_position_id: existingEmployee.position_id,
                previous_dept_id: existingEmployee.dept_id,
                status: 'UPDATED',
                message: `Employee "${empName}" updated with new position/department`
              };
              
              updatedEmployees.push(updatedEmployee);
              //console.log(`Row ${rowNumber}: Employee "${empName}" updated`);
            } else {
              // In testing mode, just show what would be updated
              const testUpdate = {
                ...validation.data,
                id: existingEmployee.id,
                previous_position_id: existingEmployee.position_id,
                previous_dept_id: existingEmployee.dept_id,
                status: 'WOULD_UPDATE',
                message: `Employee "${empName}" would be updated with new position/department`
              };
              updatedEmployees.push(testUpdate);
            }
          } else {
            // Employee exists but no changes needed
            const unchangedEmployee = {
              ...validation.data,
              id: existingEmployee.id,
              status: 'UNCHANGED',
              message: `Employee "${empName}" already exists with same details`
            };
            savedEmployees.push(unchangedEmployee);
            //console.log(`Row ${rowNumber}: Employee "${empName}" already exists, no changes needed`);
          }
          
        } else {
          // Insert new employee if not testing
          if (!testing) {
            const [insertResult] = await connection.execute(
              'INSERT INTO employee (emp_name, position_id, dept_id, is_register) VALUES (?, ?, ?, 0)',
              [empName, position_id, dept_id]
            );
            
            const savedEmployee = {
              ...validation.data,
              id: insertResult.insertId,
              status: 'CREATED'
            };
            
            savedEmployees.push(savedEmployee);
            //console.log(`Row ${rowNumber}: New employee "${empName}" created`);
          } else {
            // In testing mode, return validation result
            const testEmployee = {
              ...validation.data,
              status: 'WOULD_CREATE'
            };
            savedEmployees.push(testEmployee);
          }
        }
        
      } catch (dbError) {
        errors.push(`Row ${rowNumber}: Database error - ${dbError.message}`);
      }
    }
    
    return {
      saved: savedEmployees,
      updated: updatedEmployees,
      errors,
      totalRows: dataRows.length,
      createdCount: savedEmployees.filter(e => e.status === 'CREATED' || e.status === 'WOULD_CREATE').length,
      updatedCount: updatedEmployees.filter(e => e.status === 'UPDATED' || e.status === 'WOULD_UPDATE').length,
      unchangedCount: savedEmployees.filter(e => e.status === 'UNCHANGED').length,
      errorCount: errors.length,
      testingMode: testing
    };
    
  } catch (detectionError) {
    console.log('Error:', detectionError.message);
    return {
      saved: [],
      updated: [],
      errors: [detectionError.message],
      totalRows: 0,
      createdCount: 0,
      updatedCount: 0,
      unchangedCount: 0,
      errorCount: 1,
      testingMode: testing
    };
  }
};

// ==================== EXCEL IMPORT ROUTES ====================

//**PROTECTED**
// POST test Excel import (with auto-add simulation)
router.post('/test-import', async (req, res) => {
  const user = verifyJWTToken(req,res);
    if(!user) {
      logFile(req);
      return res.status(403).json({ error: "Unauthorized Access" });
    }
  logFile(req, user);

  console.log('=== EXCEL IMPORT TEST START ===');
  
  const connection = await getConnection();
  
  try {
    const { excelData } = req.body;
    console.log('Raw Excel Data Received (first 5 rows):', excelData?.slice(0, 5));
    
    if (!excelData || !Array.isArray(excelData)) {
      return res.json({ success: false, error: 'Invalid Excel data format' });
    }
    
    // In test mode (testing = true), it will show what would be added/updated
    const result = await processExcelImport(excelData, connection, true);
    
    console.log('=== EXCEL IMPORT TEST SUMMARY ===');
    console.log('Total Rows Processed:', result.totalRows);
    console.log('Would Create:', result.createdCount);
    console.log('Would Update:', result.updatedCount);
    console.log('Unchanged:', result.unchangedCount);
    console.log('Error Rows:', result.errorCount);
    console.log('=== EXCEL IMPORT TEST END ===\n');
    
    res.json({
      success: true,
      ...result,
      message: 'This is a test. No data was actually saved. Shows what would be created/updated.'
    });
    
  } catch (error) {
    console.log('BACKEND ERROR:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  } finally {
    await connection.end();
  }
});

//**PROTECTED**
// POST real Excel import (save to database with auto-add)
router.post('/import', async (req, res) => {
  const user = verifyJWTToken(req,res);
    if(!user) {
      logFile(req);
      return res.status(403).json({ error: "Unauthorized Access" });
    }
  logFile(req, user);

  //console.log('=== EXCEL IMPORT START (SAVING TO DATABASE WITH AUTO-ADD) ===');
  
  const connection = await getConnection();
  
  try {
    const { excelData } = req.body;
    
    if (!excelData || !Array.isArray(excelData)) {
      throw new Error('Invalid Excel data format');
    }
    
    await connection.beginTransaction();
    const result = await processExcelImport(excelData, connection, false); // testing = false
    
    await connection.commit();
    
    console.log('=== EXCEL IMPORT COMPLETE ===');
    console.log('Total Rows Processed:', result.totalRows);
    console.log('New Employees Created:', result.createdCount);
    console.log('Employees Updated:', result.updatedCount);
    console.log('Employees Unchanged:', result.unchangedCount);
    console.log('Errors:', result.errorCount);
    console.log('=== EXCEL IMPORT END ===\n');
    
    res.json({
      success: true,
      ...result,
      message: 'Import completed. Existing employees were updated if their details differed.'
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

//**PROTECTED**
// POST batch import with auto-add and updates
router.post('/import-batch', async (req, res) => {
  const { excelData, batchSize = 100 } = req.body;

  const user = verifyJWTToken(req,res);
    if(!user) {
      logFile(req);
      return res.status(403).json({ error: "Unauthorized Access" });
    }
  logFile(req, user);
  
  if (!excelData || !Array.isArray(excelData)) {
    return res.status(400).json({ success: false, error: 'Invalid Excel data format' });
  }
  
  //console.log(`Starting batch import with batch size: ${batchSize}`);
  
  const connection = await getConnection();
  const results = { 
    saved: [], 
    updated: [],
    errors: [], 
    batches: []
  };
  
  try {
    await connection.beginTransaction();
    
    // Detect column indices once for the entire file
    const { headerRowIndex, columnMap, dataStartIndex } = detectColumnIndices(excelData);
    
    // Get all data rows
    const allDataRows = excelData.slice(dataStartIndex);
    const totalBatches = Math.ceil(allDataRows.length / batchSize);
    
    // Load existing data once for the entire batch process
    const [divisions, departments, positions] = await Promise.all([
      connection.execute('SELECT * FROM division').then(([rows]) => rows),
      connection.execute('SELECT * FROM dept').then(([rows]) => rows),
      connection.execute('SELECT * FROM `position`').then(([rows]) => rows)
    ]);
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const start = batchIndex * batchSize;
      const end = start + batchSize;
      const batchRows = allDataRows.slice(start, end);
      
      //console.log(`Processing batch ${batchIndex + 1}/${totalBatches} (rows ${start + 1} to ${Math.min(end, allDataRows.length)})`);
      
      const batchSaved = [];
      const batchUpdated = [];
      const batchErrors = [];
      
      for (let rowIndex = 0; rowIndex < batchRows.length; rowIndex++) {
        const row = batchRows[rowIndex];
        const globalRowIndex = start + rowIndex;
        const rowNumber = dataStartIndex + globalRowIndex + 1;
        
        try {
          // Parse and validate row with auto-add
          const validation = await parseExcelRow(
            row, rowNumber, divisions, departments, positions, 
            columnMap, connection, false // testing = false for real import
          );
          
          if (validation.skipped) {
            continue;
          }

          if (validation.error) {
            batchErrors.push(validation.error);
            continue;
          }
          
          const { emp_name: empName, dept_id, position_id } = validation.data;
          
          // Check for existing employee
          const [existingEmployees] = await connection.execute(
            'SELECT id, position_id, dept_id FROM employee WHERE emp_name = ? AND is_deleted = 0',
            [empName]
          );
          
          if (existingEmployees.length > 0) {
            const existingEmployee = existingEmployees[0];
            
            // Check if employee needs update
            if (needsUpdate(existingEmployee, validation.data)) {
              // Update existing employee
              await connection.execute(
                'UPDATE employee SET position_id = ?, dept_id = ? WHERE id = ?',
                [position_id, dept_id, existingEmployee.id]
              );
              
              const updatedEmployee = {
                ...validation.data,
                id: existingEmployee.id,
                previous_position_id: existingEmployee.position_id,
                previous_dept_id: existingEmployee.dept_id,
                status: 'UPDATED',
                message: `Employee "${empName}" updated with new position/department`
              };
              
              batchUpdated.push(updatedEmployee);
            } else {
              // Employee exists but no changes needed
              const unchangedEmployee = {
                ...validation.data,
                id: existingEmployee.id,
                status: 'UNCHANGED',
                message: `Employee "${empName}" already exists with same details`
              };
              batchSaved.push(unchangedEmployee);
            }
            
          } else {
            // Insert new employee
            const [insertResult] = await connection.execute(
              'INSERT INTO employee (emp_name, position_id, dept_id, is_register) VALUES (?, ?, ?, 0)',
              [empName, position_id, dept_id]
            );
            
            const savedEmployee = {
              ...validation.data,
              id: insertResult.insertId,
              status: 'CREATED'
            };
            
            batchSaved.push(savedEmployee);
          }
          
        } catch (dbError) {
          batchErrors.push(`Row ${rowNumber}: Database error - ${dbError.message}`);
        }
      }
      
      results.saved.push(...batchSaved);
      results.updated.push(...batchUpdated);
      results.errors.push(...batchErrors);
      results.batches.push({
        batch: batchIndex + 1,
        startRow: start + 1,
        endRow: Math.min(end, allDataRows.length),
        saved: batchSaved.length,
        updated: batchUpdated.length,
        errors: batchErrors.length
      });
    }
    
    await connection.commit();
    
    console.log('=== BATCH IMPORT COMPLETE ===');
    console.log('Total Rows Processed:', allDataRows.length);
    console.log('Total Saved:', results.saved.length);
    console.log('Total Updated:', results.updated.length);
    console.log('Total Errors:', results.errors.length);
    console.log('Number of Batches:', results.batches.length);
    
    res.json({
      success: true,
      totalRows: allDataRows.length,
      totalSaved: results.saved.length,
      totalUpdated: results.updated.length,
      totalErrors: results.errors.length,
      batches: results.batches,
      saved: results.saved,
      updated: results.updated,
      errors: results.errors,
      message: 'Batch import completed with auto-add and update functionality.'
    });
    
  } catch (error) {
    await connection.rollback();
    console.log('BATCH IMPORT ERROR:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  } finally {
    await connection.end();
  }
});

//**PROTECTED**
// POST detect missing employees between database and Excel data
router.post('/detect-missing', async (req, res) => {
  const user = verifyJWTToken(req, res);
  if (!user) {
    logFile(req);
    return res.status(403).json({ error: "Unauthorized Access" });
  }
  logFile(req, user);

  try {
    const { excelData } = req.body;
    
    if (!excelData || !Array.isArray(excelData)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Excel data is required for missing detection' 
      });
    }

    const connection = await getConnection();

    // Get all current employees from database
    const getAllEmployeesQuery = `
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
      WHERE e.is_deleted = 0
      ORDER BY e.emp_name
    `;

    const [allEmployees] = await connection.execute(getAllEmployeesQuery);
    
    if (allEmployees.length === 0) {
      await connection.end();
      return res.json({ 
        success: true, 
        totalInDatabase: 0,
        totalInExcel: 0,
        missingCount: 0,
        missingEmployeeIds: [],
        missingEmployees: [],
        message: 'No employees in database to compare'
      });
    }

    // Extract employee names from Excel data
    const excelEmployeeNames = new Set();
    const { headerRowIndex, columnMap, dataStartIndex } = detectColumnIndices(excelData);
    const dataRows = excelData.slice(dataStartIndex);
    
    dataRows.forEach(row => {
      const empNameIndex = columnMap?.empNameIndex ?? -1;
      if (empNameIndex >= 0 && row[empNameIndex]) {
        const empName = getCellValue(row[empNameIndex]);
        if (empName) {
          excelEmployeeNames.add(empName);
        }
      }
    });

    // Find employees in database but not in Excel
    const missingFromExcel = allEmployees.filter(employee => 
      !excelEmployeeNames.has(employee.emp_name)
    );

    // Also find employees in Excel but not in database (new additions)
    const databaseEmployeeNames = new Set(allEmployees.map(emp => emp.emp_name));
    const newInExcel = [];
    
    excelEmployeeNames.forEach(empName => {
      if (!databaseEmployeeNames.has(empName)) {
        newInExcel.push({
          emp_name: empName,
          status: 'New in Excel (not in database)'
        });
      }
    });

    // Store IDs of missing employees
    const missingEmployeeIds = missingFromExcel.map(emp => emp.id);

    await connection.end();

    res.json({
      success: true,
      totalInDatabase: allEmployees.length,
      totalInExcel: excelEmployeeNames.size,
      missingCount: missingFromExcel.length,
      newInExcelCount: newInExcel.length,
      missingEmployeeIds: missingEmployeeIds,
      missingEmployees: missingFromExcel.map(emp => ({
        id: emp.id,
        emp_name: emp.emp_name,
        position_name: emp.position_name,
        dept_name: emp.dept_name,
        div_name: emp.div_name,
        is_register: emp.is_register,
        status: 'Missing from Excel'
      })),
      newInExcel: newInExcel,
      comparisonSummary: {
        onlyInDatabase: missingFromExcel.length,
        onlyInExcel: newInExcel.length,
        inBoth: allEmployees.length - missingFromExcel.length
      },
      message: `Comparison completed. ${missingFromExcel.length} employees in database are missing from Excel, ${newInExcel.length} employees in Excel are not in database.`
    });

  } catch (error) {
    console.log('Missing detection error:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

//**PROTECTED**
// DELETE mass delete employees by IDs
router.patch('/excel-mass-delete', async (req, res) => {
  try {
    const user = verifyJWTToken(req, res);
    if (!user) {
      logFile(req);
      return res.status(403).json({ error: "Unauthorized Access" });
    }
    logFile(req, user);

    // Get employee IDs from request body
    const { employeeIds } = req.body;

    // Validate input
    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Employee IDs array is required'
      });
    }

    const connection = await getConnection();
    
    // Convert all IDs to numbers
    const ids = employeeIds.map(id => parseInt(id)).filter(id => !isNaN(id));
    
    if (ids.length === 0) {
      await connection.end();
      return res.status(400).json({
        success: false,
        error: 'No valid employee IDs provided'
      });
    }

    // First, get the employees that will be deleted (for response)
    const placeholders = ids.map(() => '?').join(',');
    const [employeesToDelete] = await connection.execute(
      `SELECT id, emp_name FROM employee 
       WHERE id IN (${placeholders}) AND is_deleted = 0`,
      ids
    );

    if (employeesToDelete.length === 0) {
      await connection.end();
      return res.json({
        success: true,
        message: 'No active employees found with the provided IDs',
        deletedCount: 0,
        deletedEmployees: []
      });
    }

    // Get just the IDs of employees that exist
    const foundIds = employeesToDelete.map(emp => emp.id);

    // Perform soft delete (mark as deleted)
    const [result] = await connection.execute(
      `UPDATE employee 
       SET is_deleted = 1 
       WHERE id IN (${foundIds.map(() => '?').join(',')})`,
      foundIds
    );

    await connection.end();

    res.json({
      success: true,
      message: `Successfully deleted ${result.affectedRows} employees`,
      deletedCount: result.affectedRows,
      deletedEmployees: employeesToDelete,
      requestedCount: ids.length,
      notFoundCount: ids.length - foundIds.length
    });

  } catch (error) {
    console.log('Mass delete error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to delete employees',
      details: error.message
    });
  }
});

//**PROTECTED**  
// POST preview which employees would be deleted (optional)
router.post('/excel-mass-delete/preview', async (req, res) => {
  try {
    const user = verifyJWTToken(req, res);
    if (!user) {
      logFile(req);
      return res.status(403).json({ error: "Unauthorized Access" });
    }
    logFile(req, user);

    const { employeeIds } = req.body;

    if (!employeeIds || !Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Employee IDs array is required'
      });
    }

    const connection = await getConnection();
    
    const ids = employeeIds.map(id => parseInt(id)).filter(id => !isNaN(id));
    const placeholders = ids.map(() => '?').join(',');
    
    const [employees] = await connection.execute(
      `SELECT id, emp_name, position_id, dept_id, is_register 
       FROM employee 
       WHERE id IN (${placeholders}) AND is_deleted = 0`,
      ids
    );

    await connection.end();

    res.json({
      success: true,
      totalFound: employees.length,
      employees: employees,
      missingIds: ids.filter(id => !employees.map(e => e.id).includes(id))
    });

  } catch (error) {
    console.log('Preview error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to preview delete'
    });
  }
});

module.exports = router;