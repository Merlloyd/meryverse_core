# Export and UI Utilities Guide

This guide documents the shared utility files extracted from the Meryverse Python HTML generators.

## Files Created

### 1. export_utils.js
Core export and download functionality extracted from:
- `generate_html.py`
- `generate_kettenauswertung_html.py`
- `generate_fte_auswertung_html.py`
- `generate_aktien.py`
- `generate_dashboard.py`

**Key Functions:**
- `downloadBlob(blob, filename, mimeType)` - Download any blob data as file
- `downloadJSON(obj, filename, indentSpaces)` - Export object as JSON
- `downloadCSV(csvContent, filename)` - Export CSV with Excel BOM
- `downloadHTML(htmlContent, filename)` - Export HTML content
- `downloadEncrypted(obj, password, filename)` - Encrypted JSON export
- `downloadEncryptedDual(obj, pwFull, pwRead, filename)` - Dual encryption (full/read-only)
- `getTimestampForFilename(date)` - Generate timestamp for filenames (YYYY-MM-DD-HH-MM)
- `sanitizeFilename(str)` - Remove special chars from filenames
- `buildFilename(label, extension, date)` - Create filename with timestamp
- `formatCSVRow(fields)` - Escape and format CSV row with semicolon delimiters

### 2. ui_utils.js
UI formatting and helper functions extracted from same sources.

**Number Formatting (German locale):**
- `fmtNum(value, digits)` - Format number with 2 decimal places, returns '—' for invalid
- `fmtEuro(value, digits)` - Format as Euro currency with symbol
- `fmtPercent(value, digits)` - Format as percentage (value * 100)

**Date Formatting:**
- `fmtTs(iso)` - Format as "YYYY-MM-DD HH:MM" from ISO string
- `fmtDate(date)` - Format as "YYYY-MM-DD"
- `formatExcelDate(value)` - Format as "dd.mm.yyyy" (German format)
- `isDateLike(value)` - Cross-realm Date detection

**Cell Formatting:**
- `fmtCell(value)` - Polymorphic formatter for any data type (dates, numbers, text)

**Notifications:**
- `showToast(message, type, duration)` - Toast notification (info/success/warning/error)
- `toastInfo(message, duration)` - Info toast shortcut
- `toastSuccess(message, duration)` - Success toast shortcut
- `toastWarning(message, duration)` - Warning toast shortcut
- `toastError(message, duration)` - Error toast shortcut
- `showAlert(message, title)` - Simple alert dialog
- `showConfirm(message, title)` - Confirmation dialog

**String Utilities:**
- `escHtml(str)` - HTML escape for safe display
- `escapeRegExp(str)` - Regex escape
- `truncate(str, maxLength, suffix)` - Truncate with ellipsis

**DOM Utilities:**
- `setVisible(elem, visible)` - Toggle display: none/block
- `setEnabled(elem, enabled)` - Enable/disable form elements
- `toggleClass(elem, className, force)` - Add/remove CSS class
- `getText(elem)` - Get trimmed text content
- `setText(elem, text)` - Set text content
- `getInputValue(elem)` - Get form input value
- `setInputValue(elem, value)` - Set form input value

**Helper Classes:**
- `ModalHelper` - Modal dialog management
- `LoadingHelper` - Loading spinner management

## Encryption Support

The export utilities support encryption when the following functions are available globally:
- `encrypt(obj, password)` - Single encryption
- `encryptDual(obj, pwFull, pwRead)` - Dual encryption
- `deriveKey(password, salt)` - Key derivation

These functions come from the `crypto.js` module (already in the codebase).

## Common Patterns from Source Files

### Pattern 1: Simple JSON Download
```javascript
const envelope = await encrypt(APP.data, APP.password);
downloadJSON(envelope, buildFilename('export', 'json'));
```

### Pattern 2: CSV Export with BOM
```javascript
const rows = data.map(item => formatCSVRow([
  item.field1,
  item.field2,
  fmtEuro(item.amount)
]));
const csvContent = 'Header1;Header2;Amount\n' + rows.join('\n');
downloadCSV(csvContent, 'export');
```

### Pattern 3: Number Formatting for Display
```javascript
// German locale, 2 decimal places
const formatted = fmtNum(1234.5678, 2); // "1.234,57"
const euro = fmtEuro(1234.5678);       // "1.234,57 €"
const pct = fmtPercent(0.25);          // "25,0%"
```

### Pattern 4: Date Formatting
```javascript
const timestamp = fmtTs('2026-04-15T14:30:00Z');    // "2026-04-15 14:30"
const german = formatExcelDate(new Date());         // "15.04.2026"
const iso = fmtDate(new Date());                    // "2026-04-15"
```

### Pattern 5: Toast Notifications
```javascript
toastSuccess('Datei exportiert!');
toastError('Fehler beim Speichern');
toastWarning('Duplikate gefunden', 5000);
```

## Element Selection

All DOM functions accept either HTMLElement objects or CSS selectors:
```javascript
// Direct element
setText(document.getElementById('status'), 'Ready');

// CSS selector
setText('#status', 'Ready');
setText('.notification', 'Ready');
```

## Integration Notes

1. Include files in HTML in order:
   ```html
   <script src="js/export_utils.js"></script>
   <script src="js/ui_utils.js"></script>
   ```

2. For encryption support, also include:
   ```html
   <script src="js/crypto.js"></script>
   ```

3. All functions are global and can be called from anywhere in your application

4. Number/date formatting uses German (de-DE) locale as default - modify if needed

5. Toast notifications use inline styles - customize colors in `getToastColor()` if desired

## Testing

Quick test in browser console:
```javascript
// Test number formatting
console.log(fmtNum(1234.567));      // "1.234,57"
console.log(fmtEuro(99.99));        // "99,99 €"

// Test date formatting
console.log(fmtTs('2026-04-15T14:30:00Z'));  // "2026-04-15 14:30"

// Test export
downloadJSON({test: 'data'}, 'test-export');
```
