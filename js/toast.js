/* ════════════════════════════════════════════════════════════════
 * meryverse_core — Toast (kurze Rückmeldung), UI-Kit Phase 4, seit 0.15.0
 *
 * Ersetzt die elf lokalen toast()-Kopien der Apps und alert() für Fehler.
 * Framework-frei, braucht toast.css. Global:
 *
 *   mxhToast(text, {kind, ms, aktion})
 *                                kind: 'ok' (Standard) | 'err' | 'info'
 *                                ms:   Anzeigedauer, Standard 3000 (Fehler 6000);
 *                                      0 = bleibt bis zum Klick
 *                                aktion: {text, onClick} oder Array solcher Objekte;
 *                                      je Aktion ein Knopf (erster primär, weitere
 *                                      ghost). Knopfklick ruft onClick(event) und
 *                                      schließt; Klick auf den Text schließt dann
 *                                      nicht. Der Timer pausiert, solange eine echte
 *                                      Maus oder der Fokus auf dem Toast liegt, und
 *                                      läuft danach mit der Restzeit weiter.
 *   mxhToast(text, 'err')        Kurzform; auch 'error'/'fehler' gelten als Fehler
 *   mxhToast(text, 5000)         Kurzform für ms
 *
 * Gestapelt unten in der Mitte, höchstens vier gleichzeitig. Fehler werden
 * Screenreadern sofort vorgelesen (role=alert), alles andere höflich
 * (role=status). Ein Klick schließt (außer bei Toasts mit Aktion). Liefert das Element zurück.
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
    var aktionen = [].concat(opts.aktion || []).filter(function (a) {
      return a && typeof a === 'object';
    });
    if (aktionen.length) {
      el.classList.add('mxh-toast--aktion');
      var t = document.createElement('span');
      t.className = 'mxh-toast-text';
      t.textContent = String(text == null ? '' : text);
      var box = document.createElement('div');
      box.className = 'mxh-toast-aktionen';
      aktionen.forEach(function (a, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'mxh-btn ' + (i === 0 ? 'mxh-btn--primary' : 'mxh-btn--ghost');
        b.textContent = String(a.text == null ? '' : a.text);
        b.addEventListener('click', function (ev) {
          try { if (typeof a.onClick === 'function') a.onClick(ev); } finally { weg(el); }
        });
        box.appendChild(b);
      });
      el.appendChild(t);
      el.appendChild(box);
    } else {
      el.textContent = String(text == null ? '' : text);
      el.addEventListener('click', function () { weg(el); });
    }
    h.appendChild(el);
    // Ein Frame später einblenden, damit die Übergangsanimation greift.
    requestAnimationFrame(function () { el.classList.add('is-sichtbar'); });

    var ms = opts.ms != null ? opts.ms : (k === 'err' ? 6000 : 3000);
    if (ms > 0) {
      var rest = ms, start = 0, timer = null, maus = false, fokus = false;
      var lauf = function () {
        if (timer || el._mxhWeg) return;
        start = Date.now();
        timer = setTimeout(function () { timer = null; weg(el); }, rest);
      };
      var halt = function () {
        if (!timer) return;
        clearTimeout(timer);
        timer = null;
        rest = Math.max(0, rest - (Date.now() - start));
      };
      var pruefen = function () { if (maus || fokus) halt(); else lauf(); };
      el.addEventListener('pointerenter', function (e) {
        if (e.pointerType === 'mouse') { maus = true; pruefen(); }
      });
      el.addEventListener('pointerleave', function (e) {
        if (e.pointerType === 'mouse') { maus = false; pruefen(); }
      });
      el.addEventListener('focusin', function () { fokus = true; pruefen(); });
      el.addEventListener('focusout', function () { fokus = false; pruefen(); });
      lauf();
    }
    return el;
  }

  global.mxhToast = mxhToast;
})(window);
