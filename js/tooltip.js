/* ════════════════════════════════════════════════════════════════
 * meryverse_core — Tooltip (Meryverse-Mouseover), UI-Kit Phase 4 Teil 2, seit 0.16.0
 *
 * Aus dem Chor herausgelöst (.mv-tip, Betreiber 2026-09-28). Statt des
 * verzögerten, auf Touch unsichtbaren Browser-title:
 *
 *   <button data-tip-t="Feedback" data-tip="Rückmeldung zu diesem Part"
 *           aria-label="Feedback: Rückmeldung zu diesem Part">…</button>
 *
 * data-tip-t = fetter Titel, data-tip = Text darunter (eins von beiden reicht).
 * Ein gemeinsames Kästchen .mxh-tip unter (oder über) dem Element, per
 * Delegation — gilt auch für später gerenderte Elemente. Maus: beim Drüberfahren;
 * Tastatur: beim Fokus per Tab; Touch: Finger ~0,5 s halten (der Klick danach
 * wird geschluckt, damit Halten nicht gleichzeitig auslöst). aria-label bzw.
 * sichtbarer Text bleibt für Screenreader zuständig — der Tooltip ist nur Optik.
 * Braucht tooltip.css. Global: mxhTip.zeigen(el) / mxhTip.weg().
 * ════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';
  if (global.mxhTip) return;

  var SEL = '[data-tip-t], [data-tip]';
  var box = null, aktuell = null, haltenTimer = null, klickSchlucken = false;

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function weg() { if (box) box.hidden = true; aktuell = null; }

  function zeigen(el) {
    if (!el || el === aktuell) return;
    var titel = el.getAttribute('data-tip-t'), text = el.getAttribute('data-tip');
    if (!titel && !text) { weg(); return; }
    aktuell = el;
    if (!box) {
      box = document.createElement('div');
      box.className = 'mxh-tip'; box.hidden = true;
      box.setAttribute('aria-hidden', 'true');
      document.body.appendChild(box);
    }
    box.innerHTML = (titel ? '<b>' + esc(titel) + '</b>' : '') + (text ? esc(text) : '');
    box.classList.toggle('mxh-tip--nur-titel', !text);
    box.hidden = false;
    var r = el.getBoundingClientRect(), b = box.getBoundingClientRect();
    var x = r.left + r.width / 2 - b.width / 2, y = r.bottom + 8;
    if (y + b.height > window.innerHeight - 8) y = r.top - b.height - 8;
    box.style.left = Math.max(8, Math.min(window.innerWidth - b.width - 8, x)) + 'px';
    box.style.top = Math.max(8, y) + 'px';
  }

  function ziel(e) { return e.target && e.target.closest ? e.target.closest(SEL) : null; }

  // Nur echte Maus. Safari auf dem iPhone erzeugt beim Antippen ein mouseover;
  // erscheint dabei der Tooltip, wertet iOS das erste Tippen als „Hover" und
  // löst den Klick NICHT aus — Knöpfe mit Tooltip (Chor 🎤, Loop speichern,
  // Stecknadel …) reagierten erst beim zweiten Tippen bzw. gar nicht
  // (Betreiber 2026-10-05). Touch zeigt den Tooltip weiter per Halten.
  document.addEventListener(global.PointerEvent ? 'pointerover' : 'mouseover', function (e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    var t = ziel(e);
    if (t) zeigen(t); else if (aktuell) weg();
  });
  document.addEventListener('focusin', function (e) {
    // Nur bei Tastatur (fokus.js setzt html.mxh-maus bei Maus/Touch).
    if (document.documentElement.classList.contains('mxh-maus')) return;
    var t = ziel(e);
    if (t) zeigen(t); else weg();
  });
  document.addEventListener('focusout', weg);
  document.addEventListener('scroll', weg, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') weg(); });

  document.addEventListener('pointerdown', function (e) {
    weg();
    clearTimeout(haltenTimer);
    if (e.pointerType !== 'touch') return;
    var t = ziel(e);
    if (!t) return;
    haltenTimer = setTimeout(function () { aktuell = null; zeigen(t); klickSchlucken = true; }, 500);
  }, true);
  ['pointerup', 'pointercancel', 'pointermove'].forEach(function (typ) {
    document.addEventListener(typ, function (e) {
      if (typ === 'pointermove' && e.pointerType === 'touch' && (Math.abs(e.movementX) + Math.abs(e.movementY) < 6)) return;
      clearTimeout(haltenTimer);
    }, true);
  });
  document.addEventListener('click', function (e) {
    if (!klickSchlucken) return;
    klickSchlucken = false;
    e.preventDefault(); e.stopPropagation();
  }, true);
  document.addEventListener('contextmenu', function (e) { if (aktuell && ziel(e)) e.preventDefault(); });

  global.mxhTip = { zeigen: function (el) { aktuell = null; zeigen(el); }, weg: weg };
})(window);
