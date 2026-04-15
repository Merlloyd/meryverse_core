# JavaScript Modules

This directory contains extracted JavaScript modules from the Python HTML generator files, refactored as clean, standalone libraries.

## crypto.js

Complete encryption/decryption library using Web Crypto API.

**Key Functions:**
- `deriveKey(password, salt)` - PBKDF2-SHA256 key derivation
- `encrypt(obj, password)` - AES-256-GCM encryption
- `decrypt(envelope, password)` - AES-256-GCM decryption
- `encryptDual(obj, pwFull, pwRead)` - Dual-password encryption
- `decryptAuto(envelope, pw)` - Auto-detect v1/v2 with mode discovery
- `b64(arr)` - Chunked base64 encoding
- `ub64(s)` - Base64 decoding
- `sha256hex(str)` - SHA-256 hashing to hex

**Encryption Scheme:**
- Algorithm: AES-256-GCM
- KDF: PBKDF2-SHA256 (250,000 iterations)
- Salt: 16 bytes random
- IV: 12 bytes random

**No Dependencies:** Uses only Web Crypto API (modern browsers).

## lock_screen.js

File unlock and creation flow for the lock screen UI.

**Key Functions:**
- `lsChoose(c)` - Handle "Load" vs "Create" choice
- `lsNext1()` / `lsBack()` - Navigation
- `setupLSDropzone()` - Initialize drag-drop upload
- `lsLoadFile(file)` - Parse uploaded JSON
- `lsUnlock()` - Decrypt and unlock
- `lsCreateNew()` - Create new file
- `launchApp()` - Transition to main app
- Helper functions: `markModified()`, `updateStatusbar()`

**Requirements:**
- Must load `crypto.js` first
- Requires specific HTML element IDs (see crypto.js docstrings)
- Requires global `APP` object with: `data`, `mode`, `password`, `modified`, `currentPage`
- Requires global functions: `launchApp()`, `setReadonlyMode()`, `updateStatusbar()`, `showPage()`

## Usage

```html
<!-- Load in order -->
<script src="js/crypto.js"></script>
<script src="js/lock_screen.js"></script>
```

Both modules are self-contained and can be included in any HTML file that provides:
1. Required DOM elements (see lock_screen.js docstring)
2. Global APP object
3. Global helper functions (launchApp, showPage, updateStatusbar, setReadonlyMode)

## Notes

- All code uses standard JavaScript (no framework dependencies)
- Full JSDoc documentation for all functions
- German UI text (error messages, labels) - easily customizable
- Password validation: minimum 8 characters, dual passwords must differ
- Supports both v1 (single password) and v2 (dual password) file formats
