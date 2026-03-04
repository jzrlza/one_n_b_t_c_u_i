import { utils, write } from 'xlsx';
import { registerEnums } from './enum_config';

export const exportToExcel = (registers, unregisteredEmployees) => {
  // Create workbook
  const workbook = utils.book_new();
  
  // Sheet names (customizable)
  const sheetNames = {
    sheet1: 'report'
  };

  // Sheet 1: Transportation info
  const sheet1Data = prepareSheet1(registers);
  const worksheet1 = utils.aoa_to_sheet(sheet1Data);
  autoFitColumns(worksheet1, sheet1Data);
  utils.book_append_sheet(workbook, worksheet1, sheetNames.sheet1);
  
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
const prepareSheet1 = (registers) => {
  const headers = ['ลำดับ', 'ชื่อ', 'สกุล', 'ตำแหน่ง', 'สำนัก', 'สายงาน', 'เบอร์โต๊ะ'];

  const rows = registers.map((reg, index) => [
    index + 1,
    reg.emp_name.split(" ")[0] || '-',
    reg.emp_name.split(" ")[1] || '-',
    reg.position_name || '-',
    reg.dept_name || '-',
    reg.div_name || '-',
    reg.table_number || '-',
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