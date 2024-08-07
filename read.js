const XLSX = require('xlsx');
const fs = require('fs');

function excelToJSON(excelFile) {
    // Read Excel file
    const workbook = XLSX.readFile(excelFile);

    // Get the first sheet name
    const sheetName = workbook.SheetNames[0];

    // Get worksheet
    const worksheet = workbook.Sheets[sheetName];

    // Convert worksheet to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    // Print JSON data
    console.log(JSON.stringify(jsonData, null, 2));
}

// Provide the path to your Excel file
const excelFilePath = 'payments.xlsx';

// Call the function with the Excel file path
excelToJSON(excelFilePath);
