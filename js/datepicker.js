/* ════════════════════════════════════════════════════════════════
 * meryverse_core — Datum und Uhrzeit (UI-Kit Phase 6, seit 0.21.0).
 * Braucht datepicker.css.
 *
 * F9: Es gibt im Portal kein natives Datums-/Zeitfeld mehr. Jedes
 *   <input type="date|time|datetime-local">  und jedes
 *   <input data-mxh-datum | data-mxh-zeit | data-mxh-datumzeit>
 * wird automatisch aufgewertet (auch später eingefügte, per
 * MutationObserver). Ausnahme: data-mxh-nativ.
 *
 * Das Feld BLEIBT das Feld (wie bei der Auswahl, menu.js): es wird ein
 * Textfeld, zeigt TT.MM.JJJJ / HH:MM / TT.MM.JJJJ HH:MM und lässt sich tippen;
 * ein Klick öffnet den Meryverse-Kalender (Montag-Start, NRW-Feiertage,
 * 40-px-Ziele, Bottom-Sheet am Handy). `.value` liefert und nimmt weiter ISO
 * (JJJJ-MM-TT, HH:MM, JJJJ-MM-TTTHH:MM) — bestehendes JS, id, Klassen, Labels
 * und `change`-Events funktionieren unverändert. Unlesbare Eingabe: `.value`
 * ist '' (wie beim nativen Feld), das Feld bekommt aria-invalid.
 *
 *   mxhDatum.aufwerten(input)      von Hand
 *   mxhDatum.oeffnen(input)        Kalender öffnen
 *   mxhDatum.schliessen()
 *   mxhDatum.gueltig(input)        false, wenn Text drinsteht, der kein Datum ist
 *   mxhDatum.feld(behaelter, {art, label, wert, aufWahl, placeholder})
 *                                  legt ein Feld an → {el, wert(), setzen(iso), offen(), schliessen()}
 *   mxhDatum.fmt(iso|Date)         → TT.MM.JJJJ (4-stelliges Jahr)
 *   mxhDatum.fmtZeit(iso)          → HH:MM
 *   mxhDatum.fmtDatumZeit(iso)     → TT.MM.JJJJ HH:MM (Zeitstempel mit Z/Offset in Ortszeit)
 *   mxhDatum.lesen(text, art)      → ISO | '' (leer) | null (unlesbar)
 *   mxhDatum.iso(Date)             → JJJJ-MM-TT
 *   mxhDatum.feiertage(jahr)       → {iso: Name} (NRW)
 *
 * Tastatur am Feld: ↓ / Alt+↓ / F4 öffnen den Kalender mit Fokus im Gitter,
 * Esc schließt. Im Kalender: Pfeile (Tag/Woche), Bild↑/↓ (Monat), mit
 * Umschalt (Jahr), Pos1/Ende (Wochenanfang/-ende), Enter wählt, Tab bleibt im
 * Kalender, Esc schließt (Fokus zurück ins Feld).
 *
 * iPhone-Regeln (Phase 5): keine DOM-Änderung bei Hover; auf Touch ohne
 * Bildschirmtastatur (inputmode=none) — der Kalender ist die Eingabe.
 * ════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';
  if (global.mxhDatum) return;

  var MONATE = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli',
    'August', 'September', 'Oktober', 'November', 'Dezember'];
  var WT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  var WT_LANG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  var PLATZ = { datum: 'TT.MM.JJJJ', zeit: 'HH:MM', datumzeit: 'TT.MM.JJJJ HH:MM' };
  var FEHLER = { datum: 'Datum als TT.MM.JJJJ eingeben.', zeit: 'Uhrzeit als HH:MM eingeben (24 h).',
    datumzeit: 'Als TT.MM.JJJJ HH:MM eingeben.' };
  var PFEIL_L = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>';
  var PFEIL_R = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>';

  // ── Helfer ────────────────────────────────────────────────────────
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function isoVon(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function ausIso(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || '');
    if (!m) return null;
    var d = new Date(+m[1], +m[2] - 1, +m[3]);
    return d.getMonth() === +m[2] - 1 ? d : null;
  }
  function heute() { return isoVon(new Date()); }
  function plusTage(iso, n) { var d = ausIso(iso); return isoVon(new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)); }
  function plusMonate(iso, n) {
    var d = ausIso(iso), t = d.getDate();
    var z = new Date(d.getFullYear(), d.getMonth() + n, 1);
    var letzter = new Date(z.getFullYear(), z.getMonth() + 1, 0).getDate();
    return isoVon(new Date(z.getFullYear(), z.getMonth(), Math.min(t, letzter)));
  }
  function beruehrung() {
    return !!window.matchMedia && window.matchMedia('(pointer: coarse), (hover: none)').matches;
  }
  function istSheet() {
    return !!window.matchMedia &&
      window.matchMedia('(max-width: 600px) and (pointer: coarse), (max-width: 600px) and (hover: none)').matches;
  }

  // Ostersonntag (Gauß, gregorianisch) → bewegliche Feiertage.
  function ostern(j) {
    var a = j % 19, b = Math.floor(j / 100), c = j % 100, d = Math.floor(b / 4), e = b % 4,
      f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30,
      i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7,
      m = Math.floor((a + 11 * h + 22 * l) / 451), n = h + l - 7 * m + 114;
    return new Date(j, Math.floor(n / 31) - 1, (n % 31) + 1);
  }
  var ftCache = {};
  function feiertage(j) {
    if (ftCache[j]) return ftCache[j];
    var o = ostern(j), r = {};
    function rel(n, name) { r[isoVon(new Date(j, o.getMonth(), o.getDate() + n))] = name; }
    r[j + '-01-01'] = 'Neujahr';
    rel(-2, 'Karfreitag'); rel(1, 'Ostermontag');
    r[j + '-05-01'] = 'Tag der Arbeit';
    rel(39, 'Christi Himmelfahrt'); rel(50, 'Pfingstmontag'); rel(60, 'Fronleichnam');
    r[j + '-10-03'] = 'Tag der Deutschen Einheit';
    r[j + '-11-01'] = 'Allerheiligen';
    r[j + '-12-25'] = '1. Weihnachtstag'; r[j + '-12-26'] = '2. Weihnachtstag';
    return (ftCache[j] = r);
  }

  // ── Lesen (Eingabe → ISO) ─────────────────────────────────────────
  // '' = leer, null = unlesbar.
  function datumLesen(s) {
    s = String(s == null ? '' : s).trim();
    if (!s) return '';
    var m, j, mo, t;
    if ((m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s))) { j = +m[1]; mo = +m[2]; t = +m[3]; }
    else if ((m = /^(\d{1,2})[.\/](\d{1,2})(?:[.\/](\d{2}|\d{4})?)?$/.exec(s))) {
      t = +m[1]; mo = +m[2];
      j = m[3] ? +m[3] : new Date().getFullYear();
      if (m[3] && m[3].length === 2) j += 2000;
    } else if ((m = /^(\d{2})(\d{2})(\d{2}|\d{4})$/.exec(s))) {
      t = +m[1]; mo = +m[2]; j = +m[3];
      if (m[3].length === 2) j += 2000;
    } else return null;
    if (j < 1000) return null;
    var d = new Date(j, mo - 1, t);
    if (d.getFullYear() !== j || d.getMonth() !== mo - 1 || d.getDate() !== t) return null;
    return isoVon(d);
  }
  // "9"→09:00, "14"→14:00, "930"→09:30, "1430"→14:30, "9:5"→09:05, "9.30"→09:30
  // (Regeln aus dem Timetracker-clock-input).
  function zeitLesen(s) {
    s = String(s == null ? '' : s).trim();
    if (!s) return '';
    var h, m, p;
    if (/[:.]/.test(s)) {
      p = s.split(/[:.]/);
      if (p.length === 3 && /^\d{2}$/.test(p[2])) p = p.slice(0, 2);   // HH:MM:SS
      if (p.length !== 2 || !/^\d{1,2}$/.test(p[0]) || !/^\d{1,2}$/.test(p[1])) return null;
      h = +p[0]; m = +p[1];
    } else {
      if (!/^\d{1,4}$/.test(s)) return null;
      if (s.length <= 2) { h = +s; m = 0; }
      else if (s.length === 3) { h = +s.slice(0, 1); m = +s.slice(1); }
      else { h = +s.slice(0, 2); m = +s.slice(2); }
    }
    if (h > 23 || m > 59) return null;
    return pad(h) + ':' + pad(m);
  }
  function datumZeitLesen(s) {
    s = String(s == null ? '' : s).trim();
    if (!s) return '';
    var m = /^(\S+?)(?:[\sT,]+(\S+))?$/.exec(s);
    if (!m || !m[2]) return null;
    var d = datumLesen(m[1]), z = zeitLesen(m[2]);
    return d && z ? d + 'T' + z : null;
  }
  function lesen(text, art) {
    return art === 'zeit' ? zeitLesen(text) : art === 'datumzeit' ? datumZeitLesen(text) : datumLesen(text);
  }

  // ── Anzeige (ISO → Text) ──────────────────────────────────────────
  // Zeitstempel MIT Zone (Z, +02:00) sind ein Moment → Ortszeit; ohne Zone
  // wörtlich (wie das native Feld).
  function alsDate(v) {
    if (v instanceof Date) return isNaN(v) ? null : v;
    var s = String(v || '');
    if (/T\d{2}:\d{2}.*(Z|[+-]\d{2}:?\d{2})$/.test(s)) { var d = new Date(s); return isNaN(d) ? null : d; }
    return null;
  }
  function fmtDatum(v) {
    var d = alsDate(v);
    if (d) return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear();
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(v || ''));
    return m ? m[3] + '.' + m[2] + '.' + m[1] : '';
  }
  function fmtZeit(v) {
    var d = alsDate(v);
    if (d) return pad(d.getHours()) + ':' + pad(d.getMinutes());
    var m = /(?:^|T|\s)(\d{2}):(\d{2})/.exec(String(v || ''));
    return m ? m[1] + ':' + m[2] : '';
  }
  function fmtDatumZeit(v) {
    var a = fmtDatum(v), b = fmtZeit(v);
    return a && b ? a + ' ' + b : a;
  }
  function anzeigen(art, v) {
    var iso = lesen(v, art);
    if (iso === null) return String(v == null ? '' : v);   // unlesbar: so stehen lassen
    if (!iso) return '';
    return art === 'zeit' ? iso : art === 'datumzeit' ? fmtDatumZeit(iso) : fmtDatum(iso);
  }

  // ── Aufwerten ─────────────────────────────────────────────────────
  var DESC = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  var SEL = 'input[type=date], input[type=time], input[type=datetime-local], ' +
    'input[data-mxh-datum], input[data-mxh-zeit], input[data-mxh-datumzeit]';

  function artVon(inp) {
    if (inp.hasAttribute('data-mxh-datumzeit')) return 'datumzeit';
    if (inp.hasAttribute('data-mxh-zeit')) return 'zeit';
    if (inp.hasAttribute('data-mxh-datum')) return 'datum';
    var t = (inp.getAttribute('type') || '').toLowerCase();
    return t === 'date' ? 'datum' : t === 'time' ? 'zeit' : t === 'datetime-local' ? 'datumzeit' : null;
  }
  function roh(inp) { return DESC.get.call(inp); }
  function gueltig(inp) { return !inp || !inp._mxhDatum || lesen(roh(inp), inp._mxhDatum.art) !== null; }
  function pruefen(inp, melden) {
    var ok = gueltig(inp);
    if (inp._mxhDatum.versteckt) inp._mxhDatum.versteckt.value = inp.value;
    if (ok) {
      if (inp.getAttribute('aria-invalid') === 'true' && inp._mxhDatum.ungueltig) inp.removeAttribute('aria-invalid');
      inp._mxhDatum.ungueltig = false;
      inp.setCustomValidity('');
    } else if (melden) {
      inp.setAttribute('aria-invalid', 'true');
      inp._mxhDatum.ungueltig = true;
      inp.setCustomValidity(FEHLER[inp._mxhDatum.art]);
    }
    return ok;
  }
  function melden(inp) {
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    inp.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function aufwerten(inp) {
    if (!inp || inp._mxhDatum || inp.tagName !== 'INPUT' || inp.hasAttribute('data-mxh-nativ')) return;
    var art = artVon(inp);
    if (!art) return;
    var start = roh(inp);   // vom nativen Feld schon als ISO geprüft
    inp._mxhDatum = { art: art };
    if (inp.type !== 'text') inp.type = 'text';
    inp.setAttribute('data-mxh-' + art, '');
    inp.classList.add('mxh-dp-feld');
    inp.setAttribute('autocomplete', 'off');
    inp.spellcheck = false;
    if (!inp.placeholder) inp.placeholder = PLATZ[art];
    if (!inp.hasAttribute('size')) inp.size = art === 'zeit' ? 6 : art === 'datum' ? 11 : 17;
    if (inp.getAttribute('maxlength') && +inp.getAttribute('maxlength') < PLATZ[art].length) inp.removeAttribute('maxlength');
    // Touch: keine Bildschirmtastatur, der Kalender ist die Eingabe.
    if (beruehrung()) inp.setAttribute('inputmode', 'none');
    else if (!inp.hasAttribute('inputmode')) inp.setAttribute('inputmode', art === 'zeit' ? 'numeric' : 'text');
    inp.setAttribute('aria-haspopup', 'dialog');
    inp.setAttribute('aria-expanded', 'false');
    // Formular: der sichtbare Text ist deutsch — ISO geht über ein verstecktes
    // Feld mit dem Namen raus (F9).
    if (inp.name) {
      var h = document.createElement('input');
      h.type = 'hidden'; h.name = inp.name;
      inp.removeAttribute('name');
      inp.parentNode.insertBefore(h, inp.nextSibling);
      inp._mxhDatum.versteckt = h;
    }

    Object.defineProperty(inp, 'value', {
      configurable: true,
      get: function () { var v = lesen(roh(inp), art); return v || ''; },
      set: function (v) {
        DESC.set.call(inp, anzeigen(art, v));
        pruefen(inp, false);
        if (st && st.inp === inp) { uebernehmen(); zeichnen(); }
      }
    });
    inp.value = start;

    inp.addEventListener('click', function () {
      if (inp.disabled || inp.readOnly || (st && st.inp === inp)) return;
      oeffnen(inp, false);
    });
    inp.addEventListener('keydown', function (e) {
      var offen = st && st.inp === inp;
      if ((e.key === 'ArrowDown' && !e.ctrlKey && !e.metaKey) || e.key === 'F4') {
        e.preventDefault();
        if (offen) fokusInsGitter(); else oeffnen(inp, true);
      } else if (e.key === 'Enter' && offen) {
        e.preventDefault();
        normalisieren(inp); schliessen(false);
      } else if (e.key === 'Tab' && offen) {
        schliessen(false);
      }
    });
    inp.addEventListener('input', function () {
      pruefen(inp, false);
      if (st && st.inp === inp) { uebernehmen(); zeichnen(); }
    });
    inp.addEventListener('blur', function () {
      setTimeout(function () {
        if (st && st.inp === inp && st.el.contains(document.activeElement)) return;
        if (document.activeElement === inp) return;
        if (st && st.inp === inp) schliessen(false);
        normalisieren(inp);
      }, 0);
    });
  }

  // Lesbare Eingabe in Normalform bringen ("5.10." → "05.10.2026"); sonst markieren.
  function normalisieren(inp) {
    var art = inp._mxhDatum.art, iso = lesen(roh(inp), art);
    if (iso === null) { pruefen(inp, true); return; }
    var text = anzeigen(art, iso);
    if (text !== roh(inp)) DESC.set.call(inp, text);
    pruefen(inp, false);
  }

  // ── Kalender ──────────────────────────────────────────────────────
  // st: {inp, art, el, sheet, backdrop, seite 'tag'|'monate'|'zeit',
  //      jahr, monat, fokus (ISO), wahl (ISO-Datum|''), std, min}
  var st = null;

  function schritt(inp) {
    var s = parseInt(inp.getAttribute('step'), 10);
    var m = s >= 60 ? Math.round(s / 60) : 5;
    return 60 % m === 0 ? m : 5;
  }
  function grenzen(inp) {
    var art = inp._mxhDatum.art;
    function g(a) { var v = inp.getAttribute(a); if (!v) return ''; var i = art === 'zeit' ? '' : datumLesen(String(v).slice(0, 10)); return i || ''; }
    return { min: g('min'), max: g('max') };
  }
  // Feldwert → Zustand
  function uebernehmen() {
    var text = roh(st.inp), iso = lesen(text, st.art) || '';
    var d = st.art === 'zeit' ? '' : iso.slice(0, 10);
    var z = st.art === 'zeit' ? iso : st.art === 'datumzeit' ? iso.slice(11, 16) : '';
    if (st.art === 'datumzeit' && !iso) {   // halb fertig ("05.10.2026 "): Tag trotzdem zeigen
      var teile = String(text).trim().split(/[\sT,]+/);
      d = datumLesen(teile[0]) || '';
      z = teile[1] ? (zeitLesen(teile[1]) || '') : '';
    }
    st.wahl = d;
    if (z) { st.std = +z.slice(0, 2); st.min = +z.slice(3, 5); } else if (!st.zeitAngefasst) { st.std = null; st.min = null; }
    if (d) { var dd = ausIso(d); st.jahr = dd.getFullYear(); st.monat = dd.getMonth(); st.fokus = d; }
  }
  function setzenAusZustand(fertig) {
    var art = st.art, iso;
    if (art === 'datum') iso = st.wahl;
    else {
      var z = st.std == null ? '' : pad(st.std) + ':' + pad(st.min == null ? 0 : st.min);
      iso = art === 'zeit' ? z : (st.wahl && z ? st.wahl + 'T' + z : '');
      if (art === 'datumzeit' && st.wahl && !z) {   // nur der Tag ist gewählt: Datum zeigen, Zeit folgt
        DESC.set.call(st.inp, fmtDatum(st.wahl) + ' ');
        return;
      }
    }
    var alt = roh(st.inp);
    DESC.set.call(st.inp, anzeigen(art, iso));
    pruefen(st.inp, false);
    if (roh(st.inp) !== alt || fertig) melden(st.inp);
  }

  function knopf(cls, html, label) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = cls; b.innerHTML = html;
    if (label) b.setAttribute('aria-label', label);
    return b;
  }
  function langDatum(iso) {
    var d = ausIso(iso);
    return WT_LANG[d.getDay()] + ', ' + d.getDate() + '. ' + MONATE[d.getMonth()] + ' ' + d.getFullYear();
  }

  function zeichnen() {
    if (!st) return;
    var el = st.el, aktiv = document.activeElement, fokusDrin = el.contains(aktiv);
    el.innerHTML = '';
    if (st.seite === 'zeit') zeitSeite(el);
    else if (st.seite === 'monate') monatsSeite(el);
    else tagSeite(el);
    if (fokusDrin) fokusInsGitter();
  }

  function kopf(el, links, titel, rechts, titelKlick) {
    var k = document.createElement('div'); k.className = 'mxh-dp-kopf';
    if (links) k.appendChild(links);
    var t = titelKlick ? knopf('mxh-dp-titel', '', null) : document.createElement('span');
    if (!titelKlick) t.className = 'mxh-dp-titel';
    t.textContent = titel;
    if (titelKlick) t.addEventListener('click', titelKlick);
    k.appendChild(t);
    if (rechts) k.appendChild(rechts);
    el.appendChild(k);
    return t;
  }
  function fuss(el, teile) {
    var f = document.createElement('div'); f.className = 'mxh-dp-fuss';
    teile.forEach(function (t) {
      var b = knopf('mxh-btn mxh-btn--ghost mxh-dp-fussknopf', '', null);
      b.textContent = t[0]; b.addEventListener('click', t[1]); f.appendChild(b);
    });
    el.appendChild(f);
  }
  function leerErlaubt() { return !st.inp.required; }
  function leeren() {
    st.wahl = ''; st.std = null; st.min = null;
    DESC.set.call(st.inp, '');
    pruefen(st.inp, false); melden(st.inp);
    schliessen(true);
  }

  function tagSeite(el) {
    var zur = knopf('mxh-dp-nav', PFEIL_L, 'Vorheriger Monat');
    var vor = knopf('mxh-dp-nav', PFEIL_R, 'Nächster Monat');
    zur.addEventListener('click', function () { monatWechseln(-1); });
    vor.addEventListener('click', function () { monatWechseln(1); });
    var t = kopf(el, zur, MONATE[st.monat] + ' ' + st.jahr, vor, function () { st.seite = 'monate'; zeichnen(); fokusInsGitter(); });
    t.setAttribute('aria-label', MONATE[st.monat] + ' ' + st.jahr + ' — Monat und Jahr wählen');
    t.setAttribute('aria-live', 'polite');

    var wt = document.createElement('div'); wt.className = 'mxh-dp-wtage'; wt.setAttribute('aria-hidden', 'true');
    WT.forEach(function (w) { var s = document.createElement('span'); s.textContent = w; wt.appendChild(s); });
    el.appendChild(wt);

    var g = document.createElement('div'); g.className = 'mxh-dp-gitter mxh-dp-tage';
    g.setAttribute('role', 'group'); g.setAttribute('aria-label', MONATE[st.monat] + ' ' + st.jahr);
    var erster = new Date(st.jahr, st.monat, 1);
    var start = new Date(st.jahr, st.monat, 1 - ((erster.getDay() + 6) % 7));
    var h = heute(), gr = grenzen(st.inp);
    var fokusDa = false;
    for (var i = 0; i < 42; i++) {
      var d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      var iso = isoVon(d), ft = feiertage(d.getFullYear())[iso];
      var b = knopf('mxh-dp-tag', String(d.getDate()), null);
      if (d.getMonth() !== st.monat) b.classList.add('is-fremd');
      if (d.getDay() === 0 || d.getDay() === 6 || ft) b.classList.add('is-frei');
      if (ft) { b.classList.add('is-feiertag'); b.title = ft; }
      if (iso === h) b.setAttribute('aria-current', 'date');
      b.setAttribute('aria-pressed', iso === st.wahl ? 'true' : 'false');
      b.setAttribute('aria-label', langDatum(iso) + (ft ? ', ' + ft : '') + (iso === h ? ', heute' : ''));
      if ((gr.min && iso < gr.min) || (gr.max && iso > gr.max)) b.disabled = true;
      b.dataset.iso = iso;
      b.tabIndex = -1;
      if (iso === st.fokus) { b.tabIndex = 0; fokusDa = true; }
      b.addEventListener('click', tagGewaehlt);
      g.appendChild(b);
    }
    if (!fokusDa) {
      var erste = g.querySelector('.mxh-dp-tag:not(.is-fremd)');
      erste.tabIndex = 0; st.fokus = erste.dataset.iso;
    }
    el.appendChild(g);

    var teile = [[st.art === 'datumzeit' ? 'Jetzt' : 'Heute', function () {
      if (st.art === 'datumzeit') { var n = new Date(), s = schritt(st.inp); st.std = n.getHours(); st.min = Math.floor(n.getMinutes() / s) * s; }
      st.wahl = h; setzenAusZustand(true); schliessen(true);
    }]];
    if (leerErlaubt()) teile.push(['Leeren', leeren]);
    fuss(el, teile);
  }

  function tagGewaehlt(e) {
    var iso = e.currentTarget.dataset.iso;
    st.wahl = iso; st.fokus = iso;
    if (st.art === 'datumzeit') {
      setzenAusZustand(false);
      st.seite = 'zeit'; zeichnen();
      var tastatur = e.detail === 0;
      if (tastatur) fokusInsGitter();
      return;
    }
    setzenAusZustand(true);
    schliessen(true);
  }
  function monatWechseln(n) {
    var m = st.monat + n, j = st.jahr + Math.floor(m / 12);
    m = ((m % 12) + 12) % 12;
    st.jahr = j; st.monat = m;
    var f = ausIso(st.fokus || heute());
    var letzter = new Date(j, m + 1, 0).getDate();
    st.fokus = isoVon(new Date(j, m, Math.min(f.getDate(), letzter)));
    zeichnen();
  }

  function monatsSeite(el) {
    var zur = knopf('mxh-dp-nav', PFEIL_L, 'Vorheriges Jahr');
    var vor = knopf('mxh-dp-nav', PFEIL_R, 'Nächstes Jahr');
    zur.addEventListener('click', function () { st.jahr--; zeichnen(); });
    vor.addEventListener('click', function () { st.jahr++; zeichnen(); });
    kopf(el, zur, String(st.jahr), vor, null).setAttribute('aria-live', 'polite');
    var g = document.createElement('div'); g.className = 'mxh-dp-gitter mxh-dp-monate';
    g.setAttribute('role', 'group'); g.setAttribute('aria-label', 'Monat ' + st.jahr);
    MONATE.forEach(function (name, i) {
      var b = knopf('mxh-dp-zelle', name.slice(0, 3), name + ' ' + st.jahr);
      b.setAttribute('aria-pressed', i === st.monat ? 'true' : 'false');
      b.tabIndex = i === st.monat ? 0 : -1;
      b.addEventListener('click', function () { st.monat = i; st.seite = 'tag'; monatWechseln(0); });
      g.appendChild(b);
    });
    el.appendChild(g);
  }

  function zeitSeite(el) {
    var zur = null;
    if (st.art === 'datumzeit') {
      zur = knopf('mxh-dp-nav', PFEIL_L, 'Zurück zum Kalender');
      zur.addEventListener('click', function () { st.seite = 'tag'; zeichnen(); fokusInsGitter(); });
    }
    kopf(el, zur, st.art === 'datumzeit' && st.wahl ? langDatum(st.wahl) : 'Uhrzeit', null, null);

    function abschnitt(titel, werte, aktuell, klick, fmt) {
      var h = document.createElement('div'); h.className = 'mxh-dp-abschnitt'; h.textContent = titel;
      el.appendChild(h);
      var g = document.createElement('div'); g.className = 'mxh-dp-gitter mxh-dp-zeiten';
      g.setAttribute('role', 'group'); g.setAttribute('aria-label', titel);
      var fokusGesetzt = false;
      werte.forEach(function (v) {
        var b = knopf('mxh-dp-zelle', fmt(v), titel + ' ' + fmt(v));
        b.setAttribute('aria-pressed', v === aktuell ? 'true' : 'false');
        b.tabIndex = -1;
        if (v === aktuell) { b.tabIndex = 0; fokusGesetzt = true; }
        b.addEventListener('click', function (e) { klick(v, e); });
        g.appendChild(b);
      });
      if (!fokusGesetzt) g.firstChild.tabIndex = 0;
      el.appendChild(g);
      return g;
    }
    var std = [], min = [], s = schritt(st.inp);
    for (var i = 0; i < 24; i++) std.push(i);
    for (var m = 0; m < 60; m += s) min.push(m);
    var minAkt = st.min == null ? null : (min.indexOf(st.min) >= 0 ? st.min : null);
    abschnitt('Stunde', std, st.std, function (v, e) {
      st.std = v; if (st.min == null) st.min = 0;
      st.zeitAngefasst = true;
      setzenAusZustand(false); zeichnen();
      // Weiter zu den Minuten (Tastatur)
      if (e.detail === 0) { var mg = st.el.querySelectorAll('.mxh-dp-zeiten')[1]; var z = mg && (mg.querySelector('[tabindex="0"]')); if (z) z.focus(); }
    }, pad);
    abschnitt('Minute', min, minAkt, function (v) {
      if (st.std == null) st.std = new Date().getHours();
      st.min = v; st.zeitAngefasst = true;
      setzenAusZustand(true); schliessen(true);
    }, function (v) { return ':' + pad(v); });

    var teile = [['Jetzt', function () {
      var n = new Date();
      st.std = n.getHours(); st.min = Math.floor(n.getMinutes() / s) * s;
      if (st.art === 'datumzeit' && !st.wahl) st.wahl = heute();
      setzenAusZustand(true); schliessen(true);
    }]];
    if (leerErlaubt()) teile.push(['Leeren', leeren]);
    fuss(el, teile);
  }

  function fokusInsGitter() {
    if (!st) return;
    var z = st.el.querySelector('.mxh-dp-gitter [tabindex="0"]');
    if (z) try { z.focus({ preventScroll: true }); } catch (e) { z.focus(); }
  }

  // ── Tastatur im Kalender ──────────────────────────────────────────
  function tasten(e) {
    if (!st) return;
    if (e.key === 'Escape') {
      e.preventDefault(); e.stopPropagation();
      if (st.seite === 'monate') { st.seite = 'tag'; zeichnen(); fokusInsGitter(); return; }
      schliessen(true); return;
    }
    if (e.key === 'Tab') {   // im Kalender halten (Dialog)
      var f = Array.prototype.filter.call(st.el.querySelectorAll('button'), function (b) {
        return !b.disabled && (b.tabIndex >= 0);
      });
      if (!f.length) return;
      // Selbst weiterschalten und nicht durchreichen: die Fokusfalle eines
      // App-Dialogs (fokus.js) sähe den Fokus außerhalb ihres Dialogs und
      // holte ihn zurück — der Kalender hängt am <body>, nicht im Dialog.
      e.preventDefault(); e.stopPropagation();
      var i = f.indexOf(document.activeElement);
      var n = e.shiftKey ? (i <= 0 ? f.length - 1 : i - 1) : (i === f.length - 1 ? 0 : i + 1);
      f[n].focus();
      return;
    }
    var b = document.activeElement;
    if (!b || !b.parentNode || !b.parentNode.classList || !b.parentNode.classList.contains('mxh-dp-gitter')) return;
    if (b.dataset.iso) {   // Tage
      var iso = b.dataset.iso, neu = null;
      switch (e.key) {
        case 'ArrowLeft': neu = plusTage(iso, -1); break;
        case 'ArrowRight': neu = plusTage(iso, 1); break;
        case 'ArrowUp': neu = plusTage(iso, -7); break;
        case 'ArrowDown': neu = plusTage(iso, 7); break;
        case 'Home': neu = plusTage(iso, -((ausIso(iso).getDay() + 6) % 7)); break;
        case 'End': neu = plusTage(iso, 6 - ((ausIso(iso).getDay() + 6) % 7)); break;
        case 'PageUp': neu = plusMonate(iso, e.shiftKey ? -12 : -1); break;
        case 'PageDown': neu = plusMonate(iso, e.shiftKey ? 12 : 1); break;
        default: return;
      }
      e.preventDefault();
      var d = ausIso(neu);
      st.fokus = neu;
      if (d.getMonth() !== st.monat || d.getFullYear() !== st.jahr) { st.jahr = d.getFullYear(); st.monat = d.getMonth(); }
      zeichnen(); fokusInsGitter();
      return;
    }
    // Monate (4 Spalten) und Uhrzeiten (6 Spalten): Gitter-Navigation
    var alle = Array.prototype.slice.call(b.parentNode.children);
    var sp = b.parentNode.classList.contains('mxh-dp-monate') ? 4 : 6, k = alle.indexOf(b), z = k;
    switch (e.key) {
      case 'ArrowLeft': z = k - 1; break;
      case 'ArrowRight': z = k + 1; break;
      case 'ArrowUp': z = k - sp; break;
      case 'ArrowDown': z = k + sp; break;
      case 'Home': z = 0; break;
      case 'End': z = alle.length - 1; break;
      default: return;
    }
    e.preventDefault();
    if (z < 0 || z >= alle.length) return;
    b.tabIndex = -1; alle[z].tabIndex = 0; alle[z].focus();
  }

  // ── Öffnen, Lage, Schließen ───────────────────────────────────────
  function lage() {
    if (!st) return;
    var m = st.el;
    if (st.sheet) { m.style.visibility = ''; return; }
    var r = st.inp.getBoundingClientRect(), H = window.innerHeight, W = window.innerWidth;
    m.style.maxHeight = '';
    var h = m.offsetHeight, w = m.offsetWidth;
    var unten = H - r.bottom - 10, oben = r.top - 10;
    var nachOben = h > unten && oben > unten;
    // Passt es auf keiner Seite, scrollt der Kalender in sich — er deckt das Feld nie zu.
    var platz = Math.max(200, nachOben ? oben : unten);
    if (h > platz) { m.style.maxHeight = platz + 'px'; h = platz; }
    m.style.left = Math.max(8, Math.min(r.left, W - w - 8)) + 'px';
    m.style.top = (nachOben ? Math.max(4, r.top - h - 6) : r.bottom + 6) + 'px';
    m.style.visibility = '';
  }

  function oeffnen(inp, tastatur) {
    if (!inp || !inp._mxhDatum || inp.disabled || inp.readOnly) return;
    if (st) schliessen(false);
    if (global.mxhMenu && global.mxhMenu.isOpen && global.mxhMenu.isOpen()) global.mxhMenu.close(false);
    var art = inp._mxhDatum.art;
    var el = document.createElement('div');
    el.className = 'mxh-dp mxh-dp--' + art;
    el.setAttribute('role', 'dialog');
    var lab = inp.getAttribute('aria-label') || (inp.labels && inp.labels[0] ? inp.labels[0].textContent.trim() : '');
    el.setAttribute('aria-label', (lab || (art === 'zeit' ? 'Uhrzeit' : 'Datum')) + ' wählen');
    el.style.visibility = 'hidden';
    var b = new Date();
    st = { inp: inp, art: art, el: el, sheet: istSheet(), seite: art === 'zeit' ? 'zeit' : 'tag',
      jahr: b.getFullYear(), monat: b.getMonth(), fokus: heute(), wahl: '', std: null, min: null };
    uebernehmen();
    if (st.sheet) {
      el.classList.add('mxh-dp--sheet');
      st.backdrop = document.createElement('div');
      st.backdrop.className = 'mxh-dp-backdrop';
      document.body.appendChild(st.backdrop);
    }
    document.body.appendChild(el);
    zeichnen();
    lage();
    inp.setAttribute('aria-expanded', 'true');
    // Maus: Fokus bleibt im Feld (tippen geht weiter). Safari fokussiert Knöpfe
    // beim Klick nicht — ohne das liefe blur ins Leere und schlösse vorher.
    el.addEventListener('mousedown', function (e) { e.preventDefault(); });
    el.addEventListener('keydown', tasten);
    if (tastatur) fokusInsGitter();
    setTimeout(function () {
      if (!st || st.el !== el) return;
      document.addEventListener('pointerdown', aussen, true);
      document.addEventListener('keydown', escGlobal, true);
      window.addEventListener('resize', aussenGroesse);
      document.addEventListener('scroll', mitscrollen, true);
    }, 0);
  }
  function aussen(e) {
    if (!st || st.el.contains(e.target) || e.target === st.inp) return;
    schliessen(false);
  }
  function escGlobal(e) {
    if (st && e.key === 'Escape' && (e.target === st.inp || st.el.contains(e.target))) {
      e.preventDefault(); e.stopPropagation();   // Esc schließt nur den Kalender, nicht den Dialog dahinter
      if (st.seite === 'monate') { st.seite = 'tag'; zeichnen(); fokusInsGitter(); return; }
      schliessen(true);
    }
  }
  function aussenGroesse() { if (st && !st.sheet) schliessen(false); }
  function mitscrollen(e) {
    if (!st || st.sheet || (e.target && e.target.nodeType === 1 && st.el.contains(e.target))) return;
    lage();
  }
  function schliessen(fokusZurueck) {
    if (!st) return;
    var s = st;
    st = null;
    if (s.el.parentNode) s.el.parentNode.removeChild(s.el);
    if (s.backdrop && s.backdrop.parentNode) s.backdrop.parentNode.removeChild(s.backdrop);
    document.removeEventListener('pointerdown', aussen, true);
    document.removeEventListener('keydown', escGlobal, true);
    window.removeEventListener('resize', aussenGroesse);
    document.removeEventListener('scroll', mitscrollen, true);
    s.inp.setAttribute('aria-expanded', 'false');
    if (fokusZurueck && s.inp.isConnected && document.activeElement !== s.inp) {
      try { s.inp.focus({ preventScroll: true }); } catch (e) {}
    }
  }

  // ── Feld anlegen (für Apps, die bisher eigene Datumsknöpfe bauten) ──
  function feld(behaelter, o) {
    o = o || {};
    var art = o.art || 'datum';
    var inp = document.createElement('input');
    inp.type = 'text';
    inp.className = 'mxh-input' + (o.klasse ? ' ' + o.klasse : '');
    inp.setAttribute('data-mxh-' + art, '');
    if (o.id) inp.id = o.id;
    if (o.label) inp.setAttribute('aria-label', o.label);
    if (o.placeholder) inp.placeholder = o.placeholder;
    if (o.required) inp.required = true;
    behaelter.appendChild(inp);
    aufwerten(inp);
    if (o.wert) inp.value = o.wert;
    if (o.aufWahl) inp.addEventListener('change', function () { if (gueltig(inp)) o.aufWahl(inp.value); });
    return {
      el: inp,
      wert: function () { return inp.value || null; },
      setzen: function (iso) { inp.value = iso || ''; if (st && st.inp === inp) schliessen(false); },
      offen: function () { return !!st && st.inp === inp; },
      schliessen: function () { if (st && st.inp === inp) schliessen(false); }
    };
  }

  function alleAufwerten(wurzel) {
    if (wurzel.matches && wurzel.matches(SEL)) aufwerten(wurzel);
    if (wurzel.querySelectorAll) Array.prototype.forEach.call(wurzel.querySelectorAll(SEL), aufwerten);
  }
  function start() {
    alleAufwerten(document);
    new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        Array.prototype.forEach.call(m.addedNodes, function (n) { if (n.nodeType === 1) alleAufwerten(n); });
      });
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);

  global.mxhDatum = {
    aufwerten: aufwerten,
    oeffnen: function (inp) { oeffnen(inp, false); },
    schliessen: function () { schliessen(false); },
    offen: function () { return !!st; },
    gueltig: gueltig,
    feld: feld,
    fmt: fmtDatum, fmtZeit: fmtZeit, fmtDatumZeit: fmtDatumZeit,
    lesen: lesen, iso: isoVon, feiertage: feiertage
  };
})(window);
