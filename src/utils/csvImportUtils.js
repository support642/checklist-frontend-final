import Papa from 'papaparse';

// Database column definitions
export const CHECKLIST_COLUMNS = [
  { key: 'unit', label: 'Unit', type: 'text' },
  { key: 'division', label: 'Division', type: 'text' },
  { key: 'department', label: 'Department', type: 'text' },
  { key: 'given_by', label: 'Given By', type: 'text' },
  { key: 'name', label: 'Name (Doer)', type: 'text', required: true },
  { key: 'task_description', label: 'Task Description', type: 'text', required: true },
  { key: 'enable_reminder', label: 'Enable Reminder', type: 'select', options: ['yes', 'no'] },
  { key: 'require_attachment', label: 'Require Attachment', type: 'select', options: ['yes', 'no'] },
  { key: 'frequency', label: 'Frequency', type: 'text' },
  { key: 'remark', label: 'Remark', type: 'text' },
  { key: 'status', label: 'Status', type: 'text' },
  { key: 'image', label: 'Image URL', type: 'text' },
  { key: 'admin_done', label: 'Admin Done', type: 'text' },
  { key: 'delay', label: 'Delay', type: 'text' },
  { key: 'planned_date', label: 'Planned Date', type: 'datetime' },
  { key: 'task_start_date', label: 'Task Start Date', type: 'datetime' },
  { key: 'submission_date', label: 'Submission Date', type: 'datetime' }
];

export const DELEGATION_COLUMNS = [...CHECKLIST_COLUMNS];

export const MAINTENANCE_COLUMNS = [
  { key: 'unit', label: 'Unit', type: 'text', required: true },
  { key: 'division', label: 'Division', type: 'text', required: true },
  { key: 'department', label: 'Department', type: 'text', required: true },
  { key: 'given_by', label: 'Given By', type: 'text' },
  { key: 'name', label: 'Name (Doer)', type: 'text', required: true },
  { key: 'task_description', label: 'Task Description', type: 'text', required: true },
  { key: 'machine_name', label: 'Machine Name', type: 'text', required: true },
  { key: 'part_name', label: 'Part Name', type: 'text', required: true },
  { key: 'machine_area', label: 'Machine Area', type: 'text', required: true },
  { key: 'duration', label: 'Duration', type: 'text' },
  { key: 'frequency', label: 'Frequency', type: 'text', required: true },
  { key: 'enable_reminder', label: 'Enable Reminder', type: 'select', options: ['yes', 'no'] },
  { key: 'require_attachment', label: 'Require Attachment', type: 'select', options: ['yes', 'no'] },
  { key: 'planned_date', label: 'Planned Date', type: 'datetime', required: true },
  { key: 'time', label: 'Time (HH:MM)', type: 'text' },
  { key: 'machine_department', label: 'Machine Department', type: 'text' },
  { key: 'machine_division', label: 'Machine Division', type: 'text' }
];

/**
 * Parse CSV file using PapaParse
 * @param {File} file - The CSV file to parse
 * @returns {Promise} - Promise resolving to parsed data
 */
export const parseCSVFile = (file) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(new Error('CSV parsing errors: ' + results.errors.map(e => e.message).join(', ')));
        } else {
          resolve({
            headers: results.meta.fields || [],
            data: results.data
          });
        }
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

/**
 * Auto-match CSV headers to database columns
 * @param {Array} csvHeaders - Headers from CSV file
 * @param {Array} dbColumns - Database column definitions
 * @returns {Object} - Mapping of CSV headers to DB columns
 */
export const mapColumns = (csvHeaders, dbColumns) => {
  const mapping = {};
  const usedDbColumns = new Set();

  // Helper to normalize strings
  const normalize = (str) => String(str || '').toLowerCase().trim().replace(/[_\s-]/g, '');

  // Pass 1: Exact matches (Priority)
  csvHeaders.forEach(csvHeader => {
    const normalizedCsvHeader = normalize(csvHeader);

    const exactMatch = dbColumns.find(dbCol => {
      const normalizedDbKey = normalize(dbCol.key);
      const normalizedDbLabel = normalize(dbCol.label);
      return normalizedCsvHeader === normalizedDbKey || normalizedCsvHeader === normalizedDbLabel;
    });

    if (exactMatch && !usedDbColumns.has(exactMatch.key)) {
      mapping[csvHeader] = exactMatch.key;
      usedDbColumns.add(exactMatch.key);
    }
  });

  // Pass 2: Fuzzy matches for remaining columns
  csvHeaders.forEach(csvHeader => {
    if (mapping[csvHeader]) return; // Already mapped

    const normalizedCsvHeader = normalize(csvHeader);

    const fuzzyMatch = dbColumns.find(dbCol => {
      if (usedDbColumns.has(dbCol.key)) return false;

      const normalizedDbKey = normalize(dbCol.key);
      const normalizedDbLabel = normalize(dbCol.label);

      // Stricter fuzzy matching:
      // 1. Label includes key or vice versa, but NOT generic matches
      // Avoid matching "machine_name" to "name" by ensuring if they include each other,
      // they aren't drastically different in length (heuristic)
      const isGenericName = normalizedDbKey === 'name';
      if (isGenericName && normalizedCsvHeader !== 'name' && normalizedCsvHeader !== 'doer') {
        return false;
      }

      return normalizedCsvHeader.includes(normalizedDbKey) ||
        normalizedDbKey.includes(normalizedCsvHeader) ||
        normalizedCsvHeader.includes(normalizedDbLabel) ||
        normalizedDbLabel.includes(normalizedCsvHeader);
    });

    if (fuzzyMatch) {
      mapping[csvHeader] = fuzzyMatch.key;
      usedDbColumns.add(fuzzyMatch.key);
    } else {
      mapping[csvHeader] = null;
    }
  });

  return mapping;
};

/**
 * Validate a row of data
 * @param {Object} row - Row data
 * @param {Object} columnMapping - Mapping of CSV headers to DB columns
 * @param {Array} selectedColumns - Array of selected DB column keys
 * @param {Array} dbColumns - Database column definitions
 * @returns {Array} - Array of validation errors
 */
export const validateRowData = (row, columnMapping, selectedColumns, dbColumns) => {
  const errors = [];

  // Check required fields
  dbColumns.forEach(dbCol => {
    if (dbCol.required && selectedColumns.includes(dbCol.key)) {
      // Find if this column is mapped from any CSV header
      const csvHeader = Object.keys(columnMapping).find(
        header => columnMapping[header] === dbCol.key
      );

      if (!csvHeader || !row[csvHeader] || row[csvHeader].trim() === '') {
        errors.push(`Missing required field: ${dbCol.label}`);
      }
    }
  });

  return errors;
};

/**
 * Prepare data for import API
 * @param {Array} parsedData - Parsed CSV data
 * @param {Object} columnMapping - Mapping of CSV headers to DB columns
 * @param {Array} selectedColumns - Array of selected DB column keys
 * @returns {Array} - Array of data objects ready for API
 */
export const prepareImportData = (parsedData, columnMapping, selectedColumns) => {
  return parsedData.map(row => {
    const preparedRow = {};

    // Map only selected columns
    Object.entries(columnMapping).forEach(([csvHeader, dbColumn]) => {
      if (dbColumn && selectedColumns.includes(dbColumn)) {
        preparedRow[dbColumn] = row[csvHeader] || null;
      }
    });

    return preparedRow;
  });
};

/**
 * Get preview data for display
 * @param {Array} parsedData - Parsed CSV data
 * @param {Object} columnMapping - Mapping of CSV headers to DB columns
 * @param {number} maxRows - Maximum rows to preview
 * @returns {Array} - Preview data
 */
export const getPreviewData = (parsedData, columnMapping, maxRows = 5) => {
  return parsedData.slice(0, maxRows);
};
