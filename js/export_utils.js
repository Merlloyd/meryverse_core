/**
 * export_utils.js
 *
 * Shared export/download utilities for Meryverse applications.
 * Provides functions for exporting data as JSON, CSV, HTML, and more.
 * Includes encryption support for sensitive data.
 */

/**
 * Download arbitrary Blob data as a file
 * @param {Blob} blob - The data blob to download
 * @param {string} filename - Name for the downloaded file
 * @param {string} mimeType - MIME type (e.g., 'application/json', 'text/csv')
 */
function downloadBlob(blob, filename, mimeType) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;

  // Some browsers require appending to DOM before click
  if (document.body) {
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    a.click();
  }

  // Clean up object URL
  URL.revokeObjectURL(url);
}

/**
 * Download JSON data as a file
 * @param {object} obj - Object to serialize and download
 * @param {string} filename - Name for the downloaded file (without .json extension)
 * @param {number} indentSpaces - Spaces for JSON indentation (default: 2)
 */
function downloadJSON(obj, filename, indentSpaces = 2) {
  const json = JSON.stringify(obj, null, indentSpaces);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const finalFilename = filename.endsWith('.json') ? filename : `${filename}.json`;
  downloadBlob(blob, finalFilename, 'application/json');
}

/**
 * Download CSV data as a file with proper encoding and BOM for Excel
 * @param {string} csvContent - CSV content (rows separated by \n, columns by semicolon)
 * @param {string} filename - Name for the downloaded file (without .csv extension)
 */
function downloadCSV(csvContent, filename) {
  // UTF-8 BOM for Excel compatibility
  const BOM = '\ufeff';
  const fullCSV = BOM + csvContent;
  const blob = new Blob([fullCSV], { type: 'text/csv;charset=utf-8' });
  const finalFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  downloadBlob(blob, finalFilename, 'text/csv');
}

/**
 * Download HTML content as a file
 * @param {string} htmlContent - HTML content to download
 * @param {string} filename - Name for the downloaded file (without .html extension)
 */
function downloadHTML(htmlContent, filename) {
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const finalFilename = filename.endsWith('.html') ? filename : `${filename}.html`;
  downloadBlob(blob, finalFilename, 'text/html');
}

/**
 * Download encrypted JSON data
 * Requires the encrypt() and deriveKey() functions to be available globally
 * @param {object} obj - Object to encrypt and download
 * @param {string} password - Password for encryption
 * @param {string} filename - Base filename (without .json)
 * @returns {Promise<void>}
 */
async function downloadEncrypted(obj, password, filename) {
  if (!window.encrypt) {
    throw new Error('encrypt() function not available. Please include crypto utilities.');
  }

  try {
    const envelope = await window.encrypt(obj, password);
    const json = JSON.stringify(envelope, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const finalFilename = filename.endsWith('.json') ? filename : `${filename}.json`;
    downloadBlob(blob, finalFilename, 'application/json');
  } catch (e) {
    throw new Error(`Encryption failed: ${e.message}`);
  }
}

/**
 * Download data with dual encryption (separate passwords for full and read-only access)
 * Requires encryptDual() function to be available globally
 * @param {object} obj - Object to encrypt and download
 * @param {string} pwFull - Password for full access
 * @param {string} pwRead - Password for read-only access
 * @param {string} filename - Base filename (without .json)
 * @returns {Promise<void>}
 */
async function downloadEncryptedDual(obj, pwFull, pwRead, filename) {
  if (!window.encryptDual) {
    throw new Error('encryptDual() function not available. Please include crypto utilities.');
  }

  try {
    const envelope = await window.encryptDual(obj, pwFull, pwRead);
    const json = JSON.stringify(envelope, null, 2);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const finalFilename = filename.endsWith('.json') ? filename : `${filename}.json`;
    downloadBlob(blob, finalFilename, 'application/json');
  } catch (e) {
    throw new Error(`Dual encryption failed: ${e.message}`);
  }
}

/**
 * Generate a timestamp string suitable for filenames (ISO format without special chars)
 * Format: YYYY-MM-DD-HH-MM
 * @param {Date} date - Date to format (default: current date)
 * @returns {string} Filename-safe timestamp
 */
function getTimestampForFilename(date = new Date()) {
  return date.toISOString().slice(0, 16).replace(/[:T]/g, '-');
}

/**
 * Sanitize a string for use as a filename (replace special characters)
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string safe for filenames
 */
function sanitizeFilename(str) {
  return String(str || '').replace(/[^\w\-]/g, '_');
}

/**
 * Build a standard filename with sanitized label and timestamp
 * @param {string} label - Descriptive label for the file
 * @param {string} extension - File extension (without dot)
 * @param {Date} date - Date for timestamp (default: current date)
 * @returns {string} Complete filename with timestamp
 */
function buildFilename(label, extension, date = new Date()) {
  const sanitized = sanitizeFilename(label);
  const timestamp = getTimestampForFilename(date);
  return `${sanitized}_${timestamp}.${extension}`;
}

/**
 * Generate CSV header and row helper
 * Escapes quotes and wraps fields in quotes
 * @param {Array} fields - Array of field values
 * @returns {string} CSV-formatted row with semicolon delimiters
 */
function formatCSVRow(fields) {
  return fields
    .map(v => `"${String(v || '').replace(/"/g, '""')}"`)
    .join(';');
}
