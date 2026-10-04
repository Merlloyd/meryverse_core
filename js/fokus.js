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
