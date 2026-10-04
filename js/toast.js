/* ════════════════════════════════════════════════════════════════
 * meryverse_core — Toast (kurze Rückmeldung), UI-Kit Phase 4, seit 0.15.0
 *
 * Ersetzt die elf lokalen toast()-Kopien der Apps und alert() für Fehler.
 * Framework-frei, braucht toast.css. Global:
 *
 *   mxhToast(text, {kind, ms})   kind: 'ok' (Standard) | 'err' | 'info'
 *                                ms:   Anzeigedauer, Standard 3000 (Fehler 6000);
 *                                      0 = bleibt bis zum Klick
 *   mxhToast(text, 'err')        Kurzform; auch 'error'/'fehler' gelten als Fehler
 *   mxhToast(text, 5000)         Kurzform für ms
 *
 * Gestapelt unten in der Mitte, höchstens vier gleichzeitig. Fehler werden
 * Screenreadern sofort vorgelesen (role=alert), alles andere höflich
 * (role=status). Ein Klick schließt. Liefert das Element zurück.
 * ════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  var HOST_ID = 'mxh-toast-host';
  var MAX = 4;

  function host() {
    var h = document.getElementById(HOST_ID);
    if (h) return h;
    h = document.createElement('div');
    h.id = HOST_ID;
    h.className = 'mxh-toast-host';
    document.body.appendChild(h);
    return h;
  }

  function art(kind) {
    var k = String(kind || 'ok').toLowerCase();
    if (k === 'err' || k === 'error' || k === 'fehler' || k === 'neg') return 'err';
    if (k === 'info' || k === 'hinweis') return 'info';
    return 'ok';
  }

  function weg(el) {
    if (!el || el._mxhWeg) return;
    el._mxhWeg = true;
    el.classList.remove('is-sichtbar');
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 250);
  }

  function mxhToast(text, opts) {
    if (typeof opts === 'string') opts = { kind: opts };
    else if (typeof opts === 'number') opts = { ms: opts };
    opts = opts || {};
    var k = art(opts.kind);
    var h = host();
    while (h.children.length >= MAX) h.removeChild(h.firstChild);

    var el = document.createElement('div');
    el.className = 'mxh-toast mxh-toast--' + k;
    el.setAttribute('role', k === 'err' ? 'alert' : 'status');
    el.textContent = String(text == null ? '' : text);
    el.addEventListener('click', function () { weg(el); });
    h.appendChild(el);
    // Ein Frame später einblenden, damit die Übergangsanimation greift.
    requestAnimationFrame(function () { el.classList.add('is-sichtbar'); });

    var ms = opts.ms != null ? opts.ms : (k === 'err' ? 6000 : 3000);
    if (ms > 0) setTimeout(function () { weg(el); }, ms);
    return el;
  }

  global.mxhToast = mxhToast;
})(window);
