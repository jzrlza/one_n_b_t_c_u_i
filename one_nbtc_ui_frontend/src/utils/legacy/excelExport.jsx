import { utils, write } from 'xlsx';
import { registerEnums } from './enum_config';

export const exportToExcel = (registers, unregisteredEmployees) => {
  // Create workbook
  const workbook = utils.book_new();
  
  // Sheet names (customizable)
  const sheetNames = {
    sheet1: '1รายงานรถตู้',
    sheet2: '2รายงานอาหาร',
    sheet3: '3รายงานคนเข้าร่วมทั้งหมด',
    sheet4: '4รายงานคนไม่เข้าร่วม', 
    sheet5: '5รายงานคนที่ยังไม่ลงทะเบียน'
  };

  // Sheet 1: Transportation info
  const sheet1Data = prepareTransportationSheet(registers);
  const worksheet1 = utils.aoa_to_sheet(sheet1Data);
  autoFitColumns(worksheet1, sheet1Data);
  utils.book_append_sheet(workbook, worksheet1, sheetNames.sheet1);

  // Sheet 2: Food preferences
  const sheet2Data = prepareFoodSheet(registers);
  const worksheet2 = utils.aoa_to_sheet(sheet2Data);
  autoFitColumns(worksheet2, sheet2Data);
  utils.book_append_sheet(workbook, worksheet2, sheetNames.sheet2);

  // Sheet 3: Attending employees
  const sheet3Data = prepareAttendingSheet(registers);
  const worksheet3 = utils.aoa_to_sheet(sheet3Data);
  autoFitColumns(worksheet3, sheet3Data);
  utils.book_append_sheet(workbook, worksheet3, sheetNames.sheet3);

  // Sheet 4: Not attending employees
  const sheet4Data = prepareNotAttendingSheet(registers);
  const worksheet4 = utils.aoa_to_sheet(sheet4Data);
  autoFitColumns(worksheet4, sheet4Data);
  utils.book_append_sheet(workbook, worksheet4, sheetNames.sheet4);

  // Sheet 5: Unregistered employees
  const sheet5Data = prepareUnregisteredSheet(unregisteredEmployees);
  const worksheet5 = utils.aoa_to_sheet(sheet5Data);
  autoFitColumns(worksheet5, sheet5Data);
  utils.book_append_sheet(workbook, worksheet5, sheetNames.sheet5);
  
  // Generate Excel file
  const excelBuffer = write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `attendance_export_${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Helper functions using frontend enum config
const prepareTransportationSheet = (registers) => {
  const headers = ['ID', 'ชื่อ-สกุล B', 'สังกัดย่อ E', 'เบอร์โทร ข้อ 5', 'เดินทาง (ข้อ 7 คือเอาคำตอบ ข้อ 1-3)', 'ช่วงเวลาเดินทาง (ข้อ 8 คือเอาคำตอบ ข้อ 1-3)'];
  
  const rows = registers.map((reg, index) => [
    index + 1,
    reg.emp_name || '-',
    reg.dept_name || '-',
    reg.phone_number || '-',
    getEnumDisplay('take_van_id', reg.take_van_id),
    reg.van_round_id ? getEnumDisplay('van_round_id', reg.van_round_id) : '-'
  ]);
  
  return [headers, ...rows];
};

const prepareFoodSheet = (registers) => {
  const headers = ['ID', 'ชื่อ-สกุล B', 'ตำแหน่ง C', 'สังกัดย่อ E', 'เบอร์โทร ข้อ 5', 'อาหารที่รับประทาน (ข้อ 8 คือเอาคำตอบ ข้อ 1-2)'];
  
  const rows = registers.map((reg, index) => [
    index + 1,
    reg.emp_name || '-',
    reg.position_name || '-',
    reg.dept_name || '-',
    reg.phone_number || '-',
    getEnumDisplay('take_food', reg.take_food)
  ]);
  
  return [headers, ...rows];
};

const prepareAttendingSheet = (registers) => {
  const headers = ['ID', 'ชื่อ-สกุล B', 'ตำแหน่ง C', 'สังกัดย่อ E', 'เบอร์โทร ข้อ 5'];
  
  const attending = registers.filter(reg => reg.is_attend == 1);
  const rows = attending.map((reg, index) => [
    index + 1,
    reg.emp_name || '-',
    reg.position_name || '-',
    reg.dept_name || '-',
    reg.phone_number || '-'
  ]);
  
  return [headers, ...rows];
};

const prepareNotAttendingSheet = (registers) => {
  const headers = ['ID', 'ชื่อ-สกุล B', 'ตำแหน่ง C', 'สังกัดย่อ E', 'เบอร์โทร ข้อ 5'];
  
  const notAttending = registers.filter(reg => reg.is_attend != 1);
  const rows = notAttending.map((reg, index) => [
    index + 1,
    reg.emp_name || '-',
    reg.position_name || '-',
    reg.dept_name || '-',
    reg.phone_number || '-'
  ]);
  
  return [headers, ...rows];
};

const prepareUnregisteredSheet = (unregisteredEmployees) => {
  const headers = ['ID', 'ชื่อ-สกุล B', 'ตำแหน่ง C', 'สังกัดย่อ E'];
  
  const rows = unregisteredEmployees.map((emp, index) => [
    index + 1,
    emp.emp_name || '-',
    emp.position_name || '-',
    emp.dept_name || '-'
  ]);
  
  return [headers, ...rows];
};

const getEnumDisplay = (type, value) => {
  return registerEnums[type]?.[value] || value || '-';
};

// Add this function to excelExport.js
const autoFitColumns = (worksheet, data) => {
  const colWidths = [];
  
  data.forEach(row => {
    row.forEach((cell, colIndex) => {
      const cellLength = cell ? cell.toString().length : 0;
      colWidths[colIndex] = Math.max(colWidths[colIndex] || 0, cellLength);
    });
  });
  
  worksheet['!cols'] = colWidths.map(width => ({ 
    width: Math.min(Math.max(width + 2, 10), 50) // Min 10, Max 50, +2 for padding
  }));
};