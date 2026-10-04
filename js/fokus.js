/* meryverse_core — fokus.js (UI-Kit Phase 1)
 *
 * Fokusring in Textfeldern nur bei Tastaturbedienung (Betreiber-Entscheidung
 * 2026-10-04). Chrome wertet :focus-visible in Eingabefeldern auch nach einem
 * Mausklick und bei autofocus als „sichtbar" — dann säße der Ring zusätzlich
 * zum Feldrahmen, ohne dass jemand die Tastatur benutzt.
 *
 * Das Skript setzt html.mxh-maus, solange mit Maus/Finger bedient wird, und
 * nimmt die Klasse beim ersten Tab wieder weg. Die passende Regel steht in
 * tokens.css. Ohne dieses Skript gibt es die Klasse nie — dann zeigt jedes
 * Feld den Ring (sichere Seite).
 *
 * Synchron im <head> direkt nach tokens.css laden, damit die Klasse vor dem
 * autofocus gesetzt ist.
 */
(function () {
  var html = document.documentElement;
  html.classList.add('mxh-maus');
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Tab') html.classList.remove('mxh-maus');
  }, true);
  document.addEventListener('pointerdown', function () {
    html.classList.add('mxh-maus');
  }, true);
})();

/* ── Fokusfalle für App-Dialoge (UI-Kit Phase 4, seit 0.17.0) ─────────────
 *
 * Gilt automatisch für jedes sichtbare `.mxh-overlay` (status.css) — die Apps
 * müssen nichts aufrufen, egal ob sie per hidden, Klasse oder style öffnen:
 *  - Tab / Umschalt+Tab laufen im obersten offenen Dialog im Kreis;
 *  - beim Öffnen wandert der Fokus in den Dialog, falls die App ihn nicht
 *    selbst setzt — auf den Dialog als Ganzes, NICHT ins erste Feld (sonst
 *    ginge am Handy ungefragt die Tastatur auf);
 *  - beim Schließen kehrt der Fokus zum Auslöser zurück.
 * mxhModal (eigene Falle in modal.js) hat Vorrang, wenn es offen ist. Esc
 * bleibt Sache der App (manche Dialoge haben ungespeicherte Eingaben).
 * Bewegliche Fenster ohne Schleier (Chor: Klavier, MIDI, Verwalten) tragen kein
 * .mxh-overlay und bleiben bewusst ohne Falle.
 */
(function () {
  var FOKUSSIERBAR = 'a[href], button:not([disabled]), input:not([disabled]):not([type=hidden]), ' +
    'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';
  var offen = [];          // [{el, ausloeser}] in Öffnungsreihenfolge
  var geplant = false;
  var zuletzt = null;      // zuletzt berührtes/fokussiertes Element

  // Auslöser merken: Safari fokussiert Knöpfe beim Klick nicht, activeElement
  // wäre dann <body> — daher auch das angetippte Element mitschreiben.
  function merken(el) {
    if (!el || el === document.body || !el.closest) return;
    var ziel = el.closest(FOKUSSIERBAR) || el;
    zuletzt = ziel;
  }
  document.addEventListener('focusin', function (e) { merken(e.target); }, true);
  document.addEventListener('pointerdown', function (e) { merken(e.target); }, true);

  function sichtbar(el) {
    if (!el.isConnected || el.hidden) return false;
    var s = getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden' && el.getClientRects().length > 0;
  }
  function ebene(el) { var z = parseInt(getComputedStyle(el).zIndex, 10); return isNaN(z) ? 0 : z; }
  function dialogVon(ov) { return ov.querySelector('.mxh-dialog') || ov; }

  function oberster() {
    var top = null;
    offen.forEach(function (o) {
      if (!top || ebene(o.el) >= ebene(top.el)) top = o;   // gleiche Ebene: zuletzt geöffnet
    });
    return top;
  }

  function fokussierbare(box) {
    return Array.prototype.filter.call(box.querySelectorAll(FOKUSSIERBAR), function (el) {
      return !el.closest('[hidden]') && el.getClientRects().length > 0;
    });
  }

  function fokusRein(o) {
    var d = dialogVon(o.el);
    if (d.contains(document.activeElement)) return;
    if (!d.hasAttribute('tabindex')) d.setAttribute('tabindex', '-1');
    try { d.focus({ preventScroll: true }); } catch (e) {}
  }

  function abgleichen() {
    geplant = false;
    var jetzt = Array.prototype.filter.call(document.querySelectorAll('.mxh-overlay'), sichtbar);
    // Geschlossene austragen (von oben nach unten), Fokus zurückgeben.
    for (var i = offen.length - 1; i >= 0; i--) {
      var o = offen[i];
      if (jetzt.indexOf(o.el) !== -1) continue;
      offen.splice(i, 1);
      var akt = document.activeElement;
      var verloren = !akt || akt === document.body || !akt.isConnected || o.el.contains(akt);
      if (verloren && o.ausloeser && o.ausloeser.isConnected && o.ausloeser.getClientRects().length) {
        try { o.ausloeser.focus({ preventScroll: true }); } catch (e) {}
      }
    }
    // Neue eintragen; erst einen Takt später prüfen, ob die App selbst fokussiert.
    jetzt.forEach(function (el) {
      for (var k = 0; k < offen.length; k++) if (offen[k].el === el) return;
      var akt = document.activeElement;
      var ausl = (akt && akt !== document.body && !el.contains(akt)) ? akt : null;
      // Stapel: in einem offenen Dialog zuletzt Fokussiertes bleibt gültiger Auslöser.
      if (!ausl && zuletzt && zuletzt.isConnected && !el.contains(zuletzt)) ausl = zuletzt;
      var o = { el: el, ausloeser: ausl };
      offen.push(o);
      setTimeout(function () { if (offen.indexOf(o) !== -1 && oberster() === o) fokusRein(o); }, 60);
    });
  }

  function planen() { if (!geplant) { geplant = true; requestAnimationFrame(abgleichen); } }


  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab' || !offen.length) return;
    var mm = document.getElementById('mxh-modal-root');
    if (mm && !mm.hidden) return;                      // mxhModal fängt selbst
    var o = oberster();
    if (!o || !sichtbar(o.el)) return;
    var d = dialogVon(o.el), els = fokussierbare(d);
    var akt = document.activeElement;
    if (!els.length) { e.preventDefault(); fokusRein(o); return; }
    var erstes = els[0], letztes = els[els.length - 1];
    if (!d.contains(akt)) { e.preventDefault(); (e.shiftKey ? letztes : erstes).focus(); }
    else if (e.shiftKey && (akt === erstes || akt === d)) { e.preventDefault(); letztes.focus(); }
    else if (!e.shiftKey && akt === letztes) { e.preventDefault(); erstes.focus(); }
  });

  function start() {
    new MutationObserver(planen).observe(document.body, {
      subtree: true, childList: true, attributes: true, attributeFilter: ['hidden', 'class', 'style']
    });
    planen();
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);

  window.mxhFokusfalle = { abgleichen: abgleichen };
})();

/* ── Tabs per Tastatur (UI-Kit Phase 5, seit 0.20.0) ─────────────────────
 * Für jedes [role=tablist]: ←/→ (bzw. ↑/↓ bei aria-orientation=vertical),
 * Home und End wechseln den Fokus zwischen den Tabs und lösen sie aus (Klick
 * — die App schaltet wie bei der Maus um). Nur der gewählte Tab steht in der
 * Tab-Reihenfolge (roving tabindex); Klick setzt aria-selected selbst, falls
 * die App es nicht tut.
 */
(function () {
  function tabs(liste) {
    return Array.prototype.filter.call(liste.querySelectorAll('[role=tab]'), function (t) {
      return t.closest('[role=tablist]') === liste && !t.disabled && t.getClientRects().length;
    });
  }
  function ordnen(liste) {
    var alle = tabs(liste); if (!alle.length) return;
    var akt = alle.filter(function (t) { return t.getAttribute('aria-selected') === 'true'; })[0] || alle[0];
    alle.forEach(function (t) { t.tabIndex = t === akt ? 0 : -1; });
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[role=tab]');
    var liste = t && t.closest('[role=tablist]');
    if (!liste) return;
    tabs(liste).forEach(function (x) { x.setAttribute('aria-selected', x === t ? 'true' : 'false'); });
    ordnen(liste);
  });
  document.addEventListener('keydown', function (e) {
    var t = e.target.closest && e.target.closest('[role=tab]');
    var liste = t && t.closest('[role=tablist]');
    if (!liste) return;
    var senk = liste.getAttribute('aria-orientation') === 'vertical';
    var vor = senk ? 'ArrowDown' : 'ArrowRight', zurueck = senk ? 'ArrowUp' : 'ArrowLeft';
    var alle = tabs(liste), i = alle.indexOf(t), n = -1;
    if (e.key === vor) n = (i + 1) % alle.length;
    else if (e.key === zurueck) n = (i - 1 + alle.length) % alle.length;
    else if (e.key === 'Home') n = 0;
    else if (e.key === 'End') n = alle.length - 1;
    if (n < 0) return;
    e.preventDefault();
    alle[n].focus(); alle[n].click();
  });
  function alle() { Array.prototype.forEach.call(document.querySelectorAll('[role=tablist]'), ordnen); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', alle); else alle();
})();
