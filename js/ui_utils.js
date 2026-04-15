/**
 * ui_utils.js
 *
 * Shared UI helper utilities for Meryverse applications.
 * Provides formatting functions, notifications, and common DOM operations.
 */

// ===================================================================
// Number Formatting (German locale)
// ===================================================================

/**
 * Format a number with German locale and specified decimal places
 * Returns '—' for null, undefined, empty, or NaN values
 * @param {number|string} value - Value to format
 * @param {number} digits - Number of decimal places (default: 2)
 * @returns {string} Formatted number or '—' for invalid values
 */
function fmtNum(value, digits = 2) {
  if (value === null || value === undefined || value === '' || isNaN(value)) {
    return '—';
  }
  const num = Number(value);
  if (Number.isInteger(num) && digits === 0) {
    return String(num);
  }
  return num.toLocaleString('de-DE', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}

/**
 * Format a number as Euro currency (German locale)
 * @param {number|string} value - Value to format
 * @param {number} digits - Decimal places (default: 2)
 * @returns {string} Formatted currency or '—'
 */
function fmtEuro(value, digits = 2) {
  if (value === null || value === undefined || value === '' || isNaN(value)) {
    return '—';
  }
  const num = Number(value);
  return num.toLocaleString('de-DE', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }) + ' €';
}

/**
 * Format a number as percentage
 * @param {number|string} value - Value as decimal (e.g., 0.25 for 25%)
 * @param {number} digits - Decimal places (default: 1)
 * @returns {string} Formatted percentage or '—'
 */
function fmtPercent(value, digits = 1) {
  if (value === null || value === undefined || value === '' || isNaN(value)) {
    return '—';
  }
  const num = Number(value) * 100;
  return num.toLocaleString('de-DE', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }) + '%';
}

// ===================================================================
// Date Formatting
// ===================================================================

/**
 * Check if a value is a Date object (works across realms)
 * @param {*} value - Value to check
 * @returns {boolean} True if value is a Date object
 */
function isDateLike(value) {
  return value !== null &&
         typeof value === 'object' &&
         Object.prototype.toString.call(value) === '[object Date]' &&
         typeof value.getTime === 'function';
}

/**
 * Format a Date as ISO-like string: YYYY-MM-DD HH:MM
 * @param {Date|string} iso - ISO date string or Date object
 * @returns {string} Formatted timestamp or empty string for invalid input
 */
function fmtTs(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Format a Date as dd.mm.yyyy string (German date format)
 * Works with Date objects or Excel-like date values
 * @param {Date|number|string} value - Date to format
 * @returns {string} Date as dd.mm.yyyy or original value if not a date
 */
function formatExcelDate(value) {
  if (value === null || value === undefined || value === '') {
    return value;
  }
  if (isDateLike(value) && !isNaN(value.getTime())) {
    const pad = n => String(n).padStart(2, '0');
    return `${pad(value.getDate())}.${pad(value.getMonth() + 1)}.${value.getFullYear()}`;
  }
  return value;
}

/**
 * Format a date as ISO date string (YYYY-MM-DD)
 * @param {Date} date - Date to format
 * @returns {string} Date as YYYY-MM-DD
 */
function fmtDate(date) {
  if (!date || isNaN(new Date(date).getTime())) {
    return '';
  }
  const d = new Date(date);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// ===================================================================
// Cell Formatting (polymorphic for various data types)
// ===================================================================

/**
 * Format any cell value for display (handles dates, numbers, strings)
 * @param {*} value - Value to format
 * @returns {string} Formatted value or '—' for empty
 */
function fmtCell(value) {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  if (isDateLike(value)) {
    return formatExcelDate(value);
  }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : fmtNum(value, 2);
  }
  return String(value);
}

// ===================================================================
// Notifications / Alerts
// ===================================================================

/**
 * Show a simple alert dialog
 * @param {string} message - Message to display
 * @param {string} title - Optional title (default: 'Information')
 */
function showAlert(message, title = 'Information') {
  alert(message);
}

/**
 * Show a confirmation dialog
 * @param {string} message - Message to display
 * @param {string} title - Optional title (default: 'Bestätigung')
 * @returns {boolean} True if user clicked OK, false if Cancel
 */
function showConfirm(message, title = 'Bestätigung') {
  return confirm(message);
}

/**
 * Display a toast-like notification (appends to body)
 * Can be styled with a toast container in CSS
 * @param {string} message - Message to display
 * @param {string} type - Notification type: 'info', 'success', 'warning', 'error'
 * @param {number} duration - Duration in ms before auto-remove (0 = no auto-remove, default: 3000)
 */
function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 16px;
    background: ${getToastColor(type)};
    color: white;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    font-size: 14px;
    z-index: 10000;
    max-width: 300px;
    word-wrap: break-word;
  `;

  document.body.appendChild(toast);

  if (duration > 0) {
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => document.body.removeChild(toast), 300);
    }, duration);
  }

  return toast;
}

/**
 * Get background color for toast type
 * @private
 * @param {string} type - Toast type
 * @returns {string} Color string
 */
function getToastColor(type) {
  const colors = {
    'info': '#3498db',
    'success': '#2ecc71',
    'warning': '#f39c12',
    'error': '#e74c3c'
  };
  return colors[type] || colors['info'];
}

/**
 * Show an info toast
 * @param {string} message - Message to display
 * @param {number} duration - Auto-remove duration in ms
 */
function toastInfo(message, duration = 3000) {
  return showToast(message, 'info', duration);
}

/**
 * Show a success toast
 * @param {string} message - Message to display
 * @param {number} duration - Auto-remove duration in ms
 */
function toastSuccess(message, duration = 3000) {
  return showToast(message, 'success', duration);
}

/**
 * Show a warning toast
 * @param {string} message - Message to display
 * @param {number} duration - Auto-remove duration in ms
 */
function toastWarning(message, duration = 3000) {
  return showToast(message, 'warning', duration);
}

/**
 * Show an error toast
 * @param {string} message - Message to display
 * @param {number} duration - Auto-remove duration in ms
 */
function toastError(message, duration = 3000) {
  return showToast(message, 'error', duration);
}

// ===================================================================
// String / HTML Utilities
// ===================================================================

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped HTML
 */
function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Escape text for safe use in a regular expression
 * @param {string} str - String to escape
 * @returns {string} Escaped for regex use
 */
function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Truncate a string to a maximum length
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} suffix - Suffix when truncated (default: '…')
 * @returns {string} Truncated string
 */
function truncate(str, maxLength, suffix = '…') {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length) + suffix;
}

// ===================================================================
// DOM Utilities
// ===================================================================

/**
 * Set visibility of an element (display: none or block)
 * @param {HTMLElement|string} elem - Element or selector
 * @param {boolean} visible - True to show, false to hide
 */
function setVisible(elem, visible) {
  const el = typeof elem === 'string' ? document.querySelector(elem) : elem;
  if (el) {
    el.style.display = visible ? 'block' : 'none';
  }
}

/**
 * Enable or disable a form element
 * @param {HTMLElement|string} elem - Element or selector
 * @param {boolean} enabled - True to enable, false to disable
 */
function setEnabled(elem, enabled) {
  const el = typeof elem === 'string' ? document.querySelector(elem) : elem;
  if (el) {
    el.disabled = !enabled;
  }
}

/**
 * Add or remove a CSS class from an element
 * @param {HTMLElement|string} elem - Element or selector
 * @param {string} className - Class name to toggle
 * @param {boolean} force - Optional: force add (true) or remove (false)
 */
function toggleClass(elem, className, force) {
  const el = typeof elem === 'string' ? document.querySelector(elem) : elem;
  if (el && el.classList) {
    el.classList.toggle(className, force);
  }
}

/**
 * Get text content from an element, trimmed
 * @param {HTMLElement|string} elem - Element or selector
 * @returns {string} Trimmed text content
 */
function getText(elem) {
  const el = typeof elem === 'string' ? document.querySelector(elem) : elem;
  return el ? el.textContent.trim() : '';
}

/**
 * Set text content of an element
 * @param {HTMLElement|string} elem - Element or selector
 * @param {string} text - Text content to set
 */
function setText(elem, text) {
  const el = typeof elem === 'string' ? document.querySelector(elem) : elem;
  if (el) {
    el.textContent = text;
  }
}

/**
 * Get form input value
 * @param {HTMLElement|string} elem - Input element or selector
 * @returns {string} Input value
 */
function getInputValue(elem) {
  const el = typeof elem === 'string' ? document.querySelector(elem) : elem;
  return el ? el.value : '';
}

/**
 * Set form input value
 * @param {HTMLElement|string} elem - Input element or selector
 * @param {string} value - Value to set
 */
function setInputValue(elem, value) {
  const el = typeof elem === 'string' ? document.querySelector(elem) : elem;
  if (el) {
    el.value = value;
  }
}

// ===================================================================
// Utility Classes for Common Patterns
// ===================================================================

/**
 * Helper class for managing modal dialogs
 */
class ModalHelper {
  static create(html, onClose = null) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = html;
    modal.onclick = (e) => {
      if (e.target === modal) {
        this.close(modal);
        if (onClose) onClose();
      }
    };
    return modal;
  }

  static show(html, onClose = null) {
    const modal = this.create(html, onClose);
    document.body.appendChild(modal);
    return modal;
  }

  static close(modal) {
    if (modal && modal.parentNode) {
      modal.parentNode.removeChild(modal);
    }
  }
}

/**
 * Helper class for loading states and spinners
 */
class LoadingHelper {
  static show(message = 'Laden...', targetElem = null) {
    const container = targetElem || document.body;
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner';
    spinner.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 24px; margin-bottom: 8px;">⏳</div>
        <div>${message}</div>
      </div>
    `;
    container.appendChild(spinner);
    return spinner;
  }

  static hide(spinner) {
    if (spinner && spinner.parentNode) {
      spinner.parentNode.removeChild(spinner);
    }
  }
}
