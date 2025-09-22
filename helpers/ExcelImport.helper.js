const xlsx = require('xlsx');

/**
 * Generate Excel template for word imports
 * @returns {Buffer} Excel file buffer
 */
const generateWordTemplate = () => {
  // Create workbook and worksheet
  const workbook = xlsx.utils.book_new();
  
  // Sample data with instructions
  const sampleData = [
    {
      word: '(Required) Example: book',
      note: '(Required) Example: a written or printed work consisting of pages',
      level: '(Optional) 1-5, Example: 1',
      type: '(Optional) 1=noun, 2=verb, etc.'
    },
    {
      word: 'cat',
      note: 'a small domesticated carnivorous mammal',
      level: '1',
      type: '1'
    },
    {
      word: 'run',
      note: 'move at a speed faster than a walk',
      level: '2',
      type: '2'
    }
  ];

  // Create worksheet with sample data
  const worksheet = xlsx.utils.json_to_sheet(sampleData);

  // Set column widths
  const columnWidths = [
    { wch: 20 },  // word
    { wch: 40 },  // note
    { wch: 15 },  // level
    { wch: 20 }   // type
  ];
  worksheet['!cols'] = columnWidths;

  // Add sheet to workbook
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Words Template');

  // Generate buffer
  return xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};

/**
 * Parse Excel file for word imports
 * @param {Buffer} buffer - Excel file buffer
 * @returns {Array} Array of word objects
 */
const parseWordExcel = (buffer) => {
  try {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(worksheet);

    return data.map(row => ({
      word: String(row.word || '').trim(),
      note: String(row.note || '').trim(),
      level: Number(row.level) || 1,
      type: Number(row.type) || 1,
      is_active: true
    })).filter(item => item.word && item.note); // Filter out rows with missing required fields
  } catch (error) {
    throw new Error('Failed to parse Excel file: ' + error.message);
  }
};

/**
 * Validate word data from Excel
 * @param {Object} wordData - Word data object
 * @returns {string|null} Error message or null if valid
 */
const validateExcelWordData = (wordData) => {
  if (!wordData.word || typeof wordData.word !== 'string' || wordData.word.length > 100) {
    return 'Invalid word text (max 100 characters)';
  }

  if (!wordData.note || typeof wordData.note !== 'string') {
    return 'Note is required';
  }

  if (wordData.level < 1 || wordData.level > 5) {
    return 'Level must be between 1 and 5';
  }

  if (wordData.type < 1) {
    return 'Invalid word type';
  }

  if (wordData.note && typeof wordData.note === 'string' && wordData.note.length > 1000) {
    return 'Note cannot exceed 1000 characters';
  }

  return null;
};

module.exports = {
  parseWordExcel,
  validateExcelWordData,
  generateWordTemplate
};