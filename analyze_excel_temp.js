import * as XLSX from 'xlsx';
import fs from 'fs';

try {
  const buf = fs.readFileSync('شجرة الارتباطات.xlsx');
  const wb = XLSX.read(buf, { type: 'buffer' });
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // Array of arrays

  console.log('Headers:', data[0]);
  console.log('First Row:', data[1]);
} catch (e) {
  console.error('Error:', e.message);
}
