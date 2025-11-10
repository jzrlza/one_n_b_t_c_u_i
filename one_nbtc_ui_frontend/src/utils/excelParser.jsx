import { read, utils } from 'xlsx';

export const parseExcelToArray = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = utils.sheet_to_json(firstSheet, { header: 1 });
        
        // Remove completely empty rows
        const filteredData = jsonData.filter(row => 
          row && row.length > 0 && !row.every(cell => cell === '' || cell === null)
        );
        
        console.log('Frontend: Raw Excel Data (first 5 rows):', filteredData.slice(0, 5));
        
        resolve(filteredData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsArrayBuffer(file);
  });
};