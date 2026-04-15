/**
 * Lock Screen Module - File unlock and new file creation flow
 *
 * Manages a 2-step UI flow:
 * Step 1: Choose "Load existing file" or "Create new file"
 * Step 2a (Load): File upload with drag-drop, password unlock
 * Step 2b (Create): Set label and dual passwords (full + read)
 *
 * Requires:
 * - crypto.js (deriveKey, encrypt, decrypt, decryptAuto, sha256hex)
 * - HTML elements with specific IDs (lock-screen, app, opt-load, opt-new, ls-pw, etc.)
 * - APP global object with {data, mode, password, modified, currentPage}
 * - launchApp() function to transition from lock screen to main app
 */

// ===================================================================
// STATE
// ===================================================================

var lsChoice = 'load';      // 'load' | 'new' - user's choice at step 1
var lsFileData = null;      // Parsed JSON from loaded file

// ===================================================================
// STEP 1: CHOICE
// ===================================================================

/**
 * Handle user selecting "Load" or "Create new"
 * @param {string} c - Choice: 'load' or 'new'
 */
function lsChoose(c){
  lsChoice = c;
  document.getElementById('opt-load').classList.toggle('selected', c==='load');
  document.getElementById('opt-new').classList.toggle('selected', c==='new');
}

/**
 * Transition from Step 1 (choice) to Step 2 (load or create)
 */
function lsNext1(){
  document.getElementById('ls-step1').style.display = 'none';
  if (lsChoice === 'load') {
    document.getElementById('ls-step2-load').style.display = 'block';
    setupLSDropzone();
    setTimeout(() => document.getElementById('ls-pw')?.focus(), 100);
  } else {
    document.getElementById('ls-step2-new').style.display = 'block';
    setTimeout(() => document.getElementById('ls-label')?.focus(), 100);
  }
}

/**
 * Go back to Step 1, reset state
 */
function lsBack(){
  document.getElementById('ls-step2-load').style.display = 'none';
  document.getElementById('ls-step2-new').style.display = 'none';
  document.getElementById('ls-step1').style.display = 'block';
  lsFileData = null;
  document.getElementById('ls-dz-label').textContent = 'Datei auswählen oder hierher ziehen';
  document.getElementById('ls-dz').classList.remove('ok');
  document.getElementById('ls-file-info').textContent = '';
  document.getElementById('ls-error').textContent = '';
  document.getElementById('ls-new-error').textContent = '';
}

// ===================================================================
// STEP 2a: LOAD EXISTING FILE
// ===================================================================

/**
 * Initialize drag-drop zone for file upload
 * Only init once (uses dz._init flag)
 */
function setupLSDropzone(){
  const dz = document.getElementById('ls-dz');
  const fi = document.getElementById('ls-fi');
  if (dz._init) return;
  dz._init = true;
  dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('drag'));
  dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('drag'); lsLoadFile(e.dataTransfer.files[0]); });
  fi.addEventListener('change', e => { if (e.target.files[0]) lsLoadFile(e.target.files[0]); });
}

/**
 * Load a file from disk and parse as JSON
 * Shows file info and enables password field
 * @param {File} file - File object from input or drop
 */
async function lsLoadFile(file){
  const text = await file.text();
  try {
    lsFileData = JSON.parse(text);
    document.getElementById('ls-dz-label').textContent = file.name;
    document.getElementById('ls-dz').classList.add('ok');
    document.getElementById('ls-file-info').textContent = '🔐 Verschlüsselte Datei geladen';
    setTimeout(() => document.getElementById('ls-pw')?.focus(), 50);
  } catch(e){
    document.getElementById('ls-error').textContent = 'Ungültige JSON-Datei.';
  }
}

/**
 * Attempt to unlock the loaded file with the entered password
 * Determines access mode (full or read) based on password hashes
 * Sets APP.mode, APP.data, APP.password and calls launchApp()
 */
async function lsUnlock(){
  const pw  = document.getElementById('ls-pw').value;
  const err = document.getElementById('ls-error');
  err.textContent = '';
  if (!pw)          { err.textContent = 'Bitte Kennwort eingeben.'; return; }
  if (!lsFileData)  { err.textContent = 'Bitte zuerst eine Datei laden.'; return; }
  try {
    const { obj, mode } = await decryptAuto(lsFileData, pw);
    APP.mode     = mode;
    APP.data     = obj;
    // Backwards-compat: old files may not have compare_favorites
    if (!Array.isArray(APP.data.compare_favorites)) APP.data.compare_favorites = [];
    APP.password = (mode === 'full') ? pw : (obj.meta?.pw_read || pw);
    launchApp();
  } catch(e){
    err.textContent = 'Falsches Kennwort oder beschädigte Datei.';
  }
}

// ===================================================================
// STEP 2b: CREATE NEW FILE
// ===================================================================

/**
 * Create a new file with the entered label and passwords
 * Validates passwords, creates data structure, and launches app
 */
async function lsCreateNew(){
  const label  = document.getElementById('ls-label').value.trim();
  const pwFull = document.getElementById('ls-pw-full').value;
  const pwRead = document.getElementById('ls-pw-read').value;
  const err    = document.getElementById('ls-new-error');
  err.textContent = '';
  if (!label) { err.textContent = 'Bitte Bezeichnung eingeben.'; return; }
  if (!pwFull || !pwRead) { err.textContent = 'Bitte beide Kennwörter vergeben.'; return; }
  if (pwFull.length < 8 || pwRead.length < 8) { err.textContent = 'Kennwörter min. 8 Zeichen.'; return; }
  if (pwFull === pwRead) { err.textContent = 'Kennwörter müssen unterschiedlich sein.'; return; }
  APP.data     = await makeFreshData(label, pwFull, pwRead);
  APP.mode     = 'full';
  APP.password = pwFull;
  markModified();
  launchApp();
}

/**
 * Create a fresh data structure for a new file
 * @param {string} label - File label/name
 * @param {string} pwFull - Full access password
 * @param {string} pwRead - Read-only access password
 * @returns {Promise<Object>} Initialized data object with metadata
 */
async function makeFreshData(label, pwFull, pwRead){
  const hf = await sha256hex(pwFull);
  const hr = await sha256hex(pwRead);
  return {
    schema_version: 1,
    meta: {
      pw_hash_full: hf,
      pw_hash_read: hr,
      pw_read:      pwRead,
      file_label:   label,
      created_at:   new Date().toISOString()
    },
    structure: null,           // Set on first import
    imports: [],
    compare_favorites: []      // [{name, hidden: {colname: true, ...}}]
  };
}

// ===================================================================
// APP LAUNCH
// ===================================================================

/**
 * Transition from lock screen to main app UI
 * Updates mode badge, file label, and initializes UI state
 * Shows appropriate first page based on whether data has imports
 *
 * Requires:
 * - APP.mode, APP.data, APP.password to be set
 * - HTML elements: lock-screen, app, mode-badge, file-label, download-btn, etc.
 * - Functions: setReadonlyMode(), updateStatusbar(), showPage()
 */
function launchApp(){
  document.getElementById('lock-screen').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  const badge = document.getElementById('mode-badge');
  badge.textContent = APP.mode === 'full' ? 'Vollzugriff' : 'Lesezugriff';
  badge.className = APP.mode === 'full' ? 'mode-full' : 'mode-read';
  document.getElementById('file-label').textContent = APP.data.meta?.file_label || '—';
  setReadonlyMode(APP.mode === 'read');
  updateStatusbar();
  document.getElementById('download-btn').disabled = (APP.mode === 'read');
  showPage(APP.data.imports.length === 0 ? 'import' : 'overview');
}

/**
 * Set read-only mode restrictions on the UI
 * Hides/disables download button in read mode
 * @param {boolean} ro - True for read-only mode
 */
function setReadonlyMode(ro){
  const dl = document.getElementById('download-btn');
  if (dl) { dl.style.display = ro ? 'none' : ''; dl.disabled = ro; }
  // Structure page remains visible but changes are blocked by event handlers
}

// ===================================================================
// HELPERS (called by launchApp and app code)
// ===================================================================

/**
 * Mark current file as modified
 * Updates status bar indicator
 * (Requires: APP.modified, markModified visibility)
 */
function markModified(){
  APP.modified = true;
  document.getElementById('sb-modified').textContent = '● ungespeichert';
  updateStatusbar();
}

/**
 * Update status bar with import count and row count
 * (Requires: APP.data, updateStatusbar visibility)
 */
function updateStatusbar(){
  const n = APP.data?.imports?.length || 0;
  const last = n > 0 ? APP.data.imports[n-1] : null;
  document.getElementById('sb-versions').textContent = n + ' Import' + (n===1?'':'e');
  document.getElementById('sb-rows').textContent = last ? (last.rows.length + ' Zeilen (letzter Import)') : '— Zeilen';
}
