/**
 * Crypto Module - Encryption/Decryption with AES-256-GCM + PBKDF2-SHA256
 *
 * Used for protecting sensitive data files with dual-access passwords:
 * - Full password: read+write access
 * - Read password: read-only access
 *
 * Encryption scheme:
 * - Algorithm: AES-256-GCM
 * - Key derivation: PBKDF2-SHA256 (250,000 iterations)
 * - Salt: 16 bytes random
 * - IV: 12 bytes random
 * - Supports v1 (single password) and v2 (dual password) envelopes
 */

// ===================================================================
// KEY DERIVATION
// ===================================================================

/**
 * Derive an AES-256-GCM key from password and salt using PBKDF2-SHA256
 * @param {string} password - The password to derive from
 * @param {Uint8Array} salt - The salt (16 bytes recommended)
 * @returns {Promise<CryptoKey>} The derived key ready for encrypt/decrypt
 */
async function deriveKey(password, salt) {
  const enc = new TextEncoder();
  const km = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 250000, hash: 'SHA-256' },
    km, { name: 'AES-GCM', length: 256 }, false, ['encrypt','decrypt']
  );
}

// ===================================================================
// ENCRYPTION
// ===================================================================

/**
 * Encrypt a JSON-serializable object with AES-256-GCM
 * @param {*} obj - Object to encrypt (will be JSON.stringify'd)
 * @param {string} password - Password to encrypt with
 * @returns {Promise<Object>} Envelope with {v, alg, kdf, salt, iv, data}
 */
async function encrypt(obj, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const key  = await deriveKey(password, salt);
  const pt   = new TextEncoder().encode(JSON.stringify(obj));
  const ct   = await crypto.subtle.encrypt({ name:'AES-GCM', iv }, key, pt);
  return {
    v: 1,
    alg: 'AES-256-GCM',
    kdf: 'PBKDF2-SHA256-250000',
    salt: b64(salt),
    iv: b64(iv),
    data: b64(new Uint8Array(ct))
  };
}

/**
 * Decrypt an AES-256-GCM encrypted envelope
 * @param {Object} envelope - Encrypted envelope from encrypt()
 * @param {string} password - Password to decrypt with
 * @returns {Promise<*>} Decrypted object (JSON.parse'd)
 */
async function decrypt(envelope, password) {
  const salt = ub64(envelope.salt);
  const iv   = ub64(envelope.iv);
  const ct   = ub64(envelope.data);
  const key  = await deriveKey(password, salt);
  const pt   = await crypto.subtle.decrypt({ name:'AES-GCM', iv }, key, ct);
  return JSON.parse(new TextDecoder().decode(pt));
}

// ===================================================================
// DUAL-ACCESS ENCRYPTION
// ===================================================================

/**
 * Encrypt for dual-access: creates two independent envelopes
 * One encrypted with pwFull, one with pwRead
 *
 * @param {*} obj - Object to encrypt
 * @param {string} pwFull - Full access password
 * @param {string} pwRead - Read-only access password
 * @returns {Promise<Object>} Envelope with {v, full, read}
 */
async function encryptDual(obj, pwFull, pwRead) {
  const [envFull, envRead] = await Promise.all([
    encrypt(obj, pwFull),
    encrypt(obj, pwRead)
  ]);
  return { v: 2, full: envFull, read: envRead };
}

/**
 * Auto-detect and decrypt v1 or v2 envelopes with automatic mode detection
 *
 * Tries decryption on each envelope slot and validates against password hashes
 * stored in obj.meta.pw_hash_full and obj.meta.pw_hash_read
 *
 * @param {Object} envelope - Encrypted envelope (v1 or v2)
 * @param {string} pw - Password to try
 * @returns {Promise<{obj, mode}>} Decrypted object and access mode ('full' or 'read')
 * @throws {Error} 'wrong_password' if decryption fails or hashes don't match
 */
async function decryptAuto(envelope, pw) {
  const hash = await sha256hex(pw);
  if (envelope.v === 2) {
    // Try full slot
    try {
      const obj = await decrypt(envelope.full, pw);
      if (obj.meta?.pw_hash_full === hash) return { obj, mode:'full' };
    } catch(_){}
    // Try read slot
    try {
      const obj = await decrypt(envelope.read, pw);
      if (obj.meta?.pw_hash_read === hash) return { obj, mode:'read' };
    } catch(_){}
  } else {
    // v1 single envelope
    try {
      const obj = await decrypt(envelope, pw);
      if (obj.meta?.pw_hash_full === hash) return { obj, mode:'full' };
      if (obj.meta?.pw_hash_read === hash) return { obj, mode:'read' };
    } catch(_){}
  }
  throw new Error('wrong_password');
}

// ===================================================================
// ENCODING / DECODING
// ===================================================================

/**
 * Encode Uint8Array to base64
 * Uses chunked encoding to avoid "Maximum call stack size exceeded" on large arrays
 * @param {Uint8Array|Array} arr - Bytes to encode
 * @returns {string} Base64-encoded string
 */
function b64(arr){
  let s = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < arr.length; i += CHUNK) {
    const slice = arr.subarray ? arr.subarray(i, i+CHUNK) : arr.slice(i, i+CHUNK);
    s += String.fromCharCode.apply(null, slice);
  }
  return btoa(s);
}

/**
 * Decode base64 string to Uint8Array
 * @param {string} s - Base64-encoded string
 * @returns {Uint8Array} Decoded bytes
 */
function ub64(s){
  return Uint8Array.from(atob(s), c => c.charCodeAt(0));
}

// ===================================================================
// HASHING
// ===================================================================

/**
 * Compute SHA-256 hash and return as hex string
 * Used for password verification without storing the password itself
 * @param {string} str - String to hash
 * @returns {Promise<string>} Lowercase hex-encoded hash
 */
async function sha256hex(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}
