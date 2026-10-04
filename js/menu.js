/* ════════════════════════════════════════════════════════════════
 * meryverse_core — Menü (UI-Kit Phase 5, seit 0.18.0). Braucht menu.css.
 *
 * Aus dem Chor-Meryverse-Menü (mitsing-app.js, mitsingAnzeigeOpenMenu)
 * herausgelöst — gleiche Einträge, gleiche Optik — und um das ergänzt, was
 * dort fehlte: Tastatur auf allen Ebenen, ARIA-Rollen, Fokus zurück an den
 * Auslöser, Höhen-Clamp, Schließen bei Scroll/Größenänderung, Bottom-Sheet am
 * Handy. Framework-frei, ohne Abhängigkeit vom Chor.
 *
 *   mxhMenu.open(anker, items, opts)   öffnet (ein zweiter Aufruf mit demselben
 *                                      Anker schließt — Umschalter)
 *   mxhMenu.close()                    schließt (Fokus zurück an den Anker)
 *   mxhMenu.refresh()                  baut das offene Menü mit frischen Einträgen neu
 *   mxhMenu.isOpen()
 *   mxhMenu.build(items, {after})      flache Form für bewegliche Fenster: Gruppen
 *                                      statt Untermenüs, Auswahl schließt nichts,
 *                                      ruft after() (Neuaufbau)
 *
 * items: Array oder Funktion, die ein frisches Array liefert. Eintrag:
 *   {label, onSelect, checked, radio, disabled, title, keepOpen,
 *    icon      (fertiges <svg>-HTML, vertrauenswürdig),
 *    hint      (Nebentext rechts), color (Farbpunkt), suche (zusätzliche Suchwörter),
 *    children: [...]}  oder  {sep: true}
 *   oder  {group: 'Überschrift'} (nicht wählbar, z. B. <optgroup>)
 *   checked gesetzt (true/false) → Häkchen-Eintrag (menuitemcheckbox), radio → menuitemradio.
 *   keepOpen: Auswahl lässt das Menü offen und baut es neu (Schalter).
 *
 * opts: host (Element, Standard body — z. B. ein Vollbild-Overlay),
 *       placement 'below' (Standard) | 'above' (z. B. Dock unten),
 *       search (true | ab N Einträgen: Zahl), searchPlaceholder,
 *       title + onDetach (Kopfzeile mit „Ablösen"-Knopf), matchWidth (Breite ≥ Anker),
 *       role 'menu' (Standard) | 'listbox' (Auswahl), onClose,
 *       className (Zusatzklasse(n) am Menü, z. B. 'no-scrollbar').
 *
 * Tastatur: ↑/↓ Home/End, Enter/Leertaste wählen, → öffnet ein Untermenü,
 * ←/Esc schließt es, Esc schließt das Menü, Tab schließt und geht weiter,
 * Buchstaben springen zum nächsten passenden Eintrag (ohne Suchfeld).
 * ════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';
  if (global.mxhMenu) return;

  var st = null;                 // offenes Menü: {anker, build, opts, el, backdrop, ...}
  var zuletzt = { anker: null, zeit: 0 };   // gerade per pointerdown geschlossen
  var idNr = 0;

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function norm(v) { return String(v || '').normalize('NFC').toLowerCase(); }
  function istSheet() {
    return !!window.matchMedia &&
      window.matchMedia('(max-width: 600px) and (pointer: coarse), (max-width: 600px) and (hover: none)').matches;
  }

  // ── Einträge bauen ────────────────────────────────────────────────
  function zeile(it, flat) {
    var row = document.createElement('button');
    row.type = 'button';
    row.className = 'mxh-menu-item' + (it.checked ? ' is-checked' : '') + (it.children ? ' mxh-has-sub' : '');
    row.tabIndex = -1;
    var rolle = st && st.opts.role === 'listbox' ? 'option'
      : it.children ? 'menuitem' : it.radio ? 'menuitemradio'
      : (typeof it.checked === 'boolean') ? 'menuitemcheckbox' : 'menuitem';
    row.setAttribute('role', rolle);
    if (rolle === 'option') row.setAttribute('aria-selected', it.checked ? 'true' : 'false');
    else if (rolle !== 'menuitem') row.setAttribute('aria-checked', it.checked ? 'true' : 'false');
    if (it.children && !flat) { row.setAttribute('aria-haspopup', 'menu'); row.setAttribute('aria-expanded', 'false'); }
    row.innerHTML =
      '<span class="mxh-menu-check" aria-hidden="true">' + (it.checked ? '✓' : '') + '</span>' +
      (it.color ? '<span class="mxh-menu-dot" style="background:' + esc(it.color) + '" aria-hidden="true"></span>' : '') +
      (it.icon ? '<span class="mxh-menu-icon" aria-hidden="true">' + it.icon + '</span>' : '') +
      '<span class="mxh-menu-label">' + esc(it.label) + '</span>' +
      (it.hint ? '<span class="mxh-menu-hint">' + esc(it.hint) + '</span>' : '') +
      (it.children && !flat ? '<span class="mxh-menu-arrow" aria-hidden="true">▸</span>' : '');
    if (it.title) row.title = it.title;
    if (it.disabled) row.disabled = true;
    row._mxhItem = it;
    return row;
  }

  function liste(items, ebene) {
    var box = document.createElement('div');
    box.className = 'mxh-menu' + (ebene ? ' mxh-menu-sub' : '');
    box.setAttribute('role', (st && st.opts.role) || 'menu');
    box.tabIndex = -1;
    if (!items.length) {
      var leer = document.createElement('div'); leer.className = 'mxh-menu-leer'; leer.textContent = 'Keine Einträge';
      box.appendChild(leer);
    }
    items.forEach(function (it) {
      if (it.sep) { var sp = document.createElement('div'); sp.className = 'mxh-menu-sep'; sp.setAttribute('role', 'separator'); box.appendChild(sp); return; }
      if (it.group) { var g = document.createElement('div'); g.className = 'mxh-menu-group'; g.setAttribute('role', 'presentation'); g.textContent = it.group; box.appendChild(g); return; }
      var row = zeile(it, false);
      box.appendChild(row);
      row.addEventListener('mouseenter', function () {
        if (row !== document.activeElement && st && !st.sucheEl) try { row.focus({ preventScroll: true }); } catch (e) {}
        if (it.children) unterOeffnen(box, row, ebene, false); else unterZu(box);
      });
      row.addEventListener('click', function (e) {
        e.stopPropagation();
        if (row.disabled) return;
        if (it.children) { unterOeffnen(box, row, ebene, true); return; }
        waehlen(it);
      });
    });
    return box;
  }

  function waehlen(it) {
    if (it.keepOpen) { if (it.onSelect) it.onSelect(); api.refresh(); return; }
    api.close();
    if (it.onSelect) it.onSelect();
  }

  // Untermenüs hängen als eigene, fest positionierte Ebene am Host (nicht im
  // Menü selbst): das Menü scrollt bei langer Liste, ein Kind darin würde
  // seitlich abgeschnitten. box._sub zeigt auf das offene Untermenü,
  // sub._mxhEltern/_mxhRow zurück.
  function unterZu(box) {
    if (!box) return;
    if (box._sub) { unterZu(box._sub); if (box._sub.parentNode) box._sub.parentNode.removeChild(box._sub); box._sub = null; }
    Array.prototype.forEach.call(box.querySelectorAll(':scope > .mxh-menu-item.is-open'), function (el) {
      el.classList.remove('is-open'); el.setAttribute('aria-expanded', 'false');
    });
  }
  function drin(ziel) {
    for (var b = st && st.el; b; b = b._sub) if (b.contains(ziel)) return true;
    return false;
  }

  function unterOeffnen(box, row, ebene, fokus) {
    var it = row._mxhItem;
    if (st && st.sheet) { sheetEbene(it); return; }
    if (row.classList.contains('is-open')) {
      if (fokus) erstes(box._sub);
      return;
    }
    unterZu(box);
    var sub = liste(it.children, (ebene || 0) + 1);
    sub._mxhEltern = box; sub._mxhRow = row; box._sub = sub;
    sub.addEventListener('keydown', tasten);
    sub.style.visibility = 'hidden';
    st.host.appendChild(sub);
    row.classList.add('is-open'); row.setAttribute('aria-expanded', 'true');
    var H = window.innerHeight, W = window.innerWidth;
    sub.style.maxHeight = (H - 8) + 'px';
    var r = row.getBoundingClientRect(), b = box.getBoundingClientRect(), s = sub.getBoundingClientRect();
    var left = b.right - 2;
    if (left + s.width > W - 4) left = Math.max(4, b.left - s.width + 2);
    sub.style.left = left + 'px';
    sub.style.top = Math.max(4, Math.min(r.top - 5, H - s.height - 4)) + 'px';
    sub.style.visibility = '';
    if (fokus) erstes(sub);
  }

  // Bottom-Sheet: ein Untermenü ersetzt den Inhalt, oben „‹ Zurück".
  function sheetEbene(it) {
    st.stapel.push(it);
    neuZeichnen();
  }

  function eintraege(box) {
    return Array.prototype.filter.call(box ? box.querySelectorAll(':scope > .mxh-menu-item') : [],
      function (r) { return !r.hidden && !r.disabled; });
  }
  function erstes(box) {
    var els = eintraege(box);
    var sel = els.filter(function (r) { return r.classList.contains('is-checked'); })[0] || els[0];
    if (sel) try { sel.focus({ preventScroll: false }); } catch (e) {}
    else if (box) box.focus();
  }

  // ── Öffnen, Lage, Neuaufbau ───────────────────────────────────────
  function inhalt() {
    var items = st.build();
    for (var i = 0; i < st.stapel.length; i++) {
      var lbl = st.stapel[i].label, gefunden = null;
      items.forEach(function (x) { if (x.children && x.label === lbl) gefunden = x; });
      if (!gefunden) { st.stapel.length = i; break; }
      items = gefunden.children;
    }
    return items;
  }

  function neuZeichnen() {
    var alt = st.el, items = inhalt();
    var box = liste(items, 0);
    box.classList.toggle('mxh-menu--sheet', st.sheet);
    if (st.opts.className) String(st.opts.className).split(/\s+/).forEach(function (k) { if (k) box.classList.add(k); });
    if (st.opts.title || st.stapel.length) {
      var head = document.createElement('div'); head.className = 'mxh-menu-head';
      if (st.stapel.length) {
        head.innerHTML = '<button type="button" class="mxh-menu-pin" aria-label="Zurück">‹</button>' +
          '<span class="mxh-menu-title">' + esc(st.stapel[st.stapel.length - 1].label) + '</span>';
        head.querySelector('.mxh-menu-pin').addEventListener('click', function (e) {
          e.stopPropagation(); st.stapel.pop(); neuZeichnen();
        });
      } else {
        head.innerHTML = '<span class="mxh-menu-title">' + esc(st.opts.title) + '</span>' +
          (st.opts.onDetach ? '<button type="button" class="mxh-menu-pin" title="Als bewegliches Fenster ablösen (bleibt offen)" aria-label="Als Fenster ablösen">' +
            (st.opts.detachIcon || '⧉') + '</button>' : '');
        var pin = head.querySelector('.mxh-menu-pin');
        if (pin) pin.addEventListener('click', function (e) {
          e.stopPropagation(); var f = st.opts.onDetach; api.close(); f();
        });
      }
      box.insertBefore(head, box.firstChild);
    }
    var mitSuche = st.opts.search === true ||
      (typeof st.opts.search === 'number' && items.filter(function (x) { return !x.sep; }).length >= st.opts.search);
    st.sucheEl = null;
    if (mitSuche && !st.stapel.length) sucheAnlegen(box);
    if (st.opts.label) box.setAttribute('aria-label', st.opts.label);
    box.addEventListener('keydown', tasten);
    if (alt && alt.parentNode) {
      box.style.cssText = alt.style.cssText;
      alt.parentNode.replaceChild(box, alt);
    } else {
      box.style.visibility = 'hidden';
      st.host.appendChild(box);
    }
    st.el = box;
    if (!alt) lage(); else if (st.sheet) box.scrollTop = 0;
    return box;
  }

  function sucheAnlegen(box) {
    var inp = document.createElement('input');
    inp.type = 'text'; inp.className = 'mxh-menu-search'; inp.autocomplete = 'off';
    inp.setAttribute('aria-label', st.opts.searchPlaceholder || 'Suchen');
    inp.placeholder = st.opts.searchPlaceholder || 'Suchen …';
    var erstesItem = box.querySelector(':scope > .mxh-menu-item, :scope > .mxh-menu-sep, :scope > .mxh-menu-leer');
    box.insertBefore(inp, erstesItem);
    st.sucheEl = inp; st.akt = -1;
    inp.addEventListener('input', function () {
      var q = norm(inp.value).trim();
      Array.prototype.forEach.call(box.querySelectorAll(':scope > .mxh-menu-item'), function (row) {
        // Gesucht wird in Name, Nebentext und optionalen Stichwörtern (it.suche).
        var it = row._mxhItem || {};
        var text = [it.label, it.hint, it.suche].filter(Boolean).join(' ');
        row.hidden = !!q && norm(text).indexOf(q) < 0;
      });
      Array.prototype.forEach.call(box.querySelectorAll(':scope > .mxh-menu-sep, :scope > .mxh-menu-group'), function (sp) { sp.hidden = !!q; });
      // Leere Suche: Hinweis statt einer leeren Fläche.
      var leer = box.querySelector(':scope > .mxh-menu-leer--suche');
      var treffer = eintraege(box).length;
      if (!treffer && !leer) {
        leer = document.createElement('div'); leer.className = 'mxh-menu-leer mxh-menu-leer--suche';
        leer.textContent = 'Keine Treffer'; box.appendChild(leer);
      } else if (treffer && leer) leer.remove();
      st.akt = q ? 0 : -1; markieren();
    });
    var vor = eintraege(box).map(function (r) { return r.classList.contains('is-checked'); }).indexOf(true);
    if (vor >= 0) { st.akt = vor; }
  }

  function markieren() {
    var els = eintraege(st.el);
    Array.prototype.forEach.call(st.el.querySelectorAll(':scope > .mxh-menu-item.is-akt'), function (r) {
      r.classList.remove('is-akt');
    });
    if (st.akt >= els.length) st.akt = els.length - 1;
    var r = els[st.akt];
    if (st.akt >= 0 && r) {
      r.classList.add('is-akt'); r.scrollIntoView({ block: 'nearest' });
      if (!r.id) r.id = 'mxh-menu-opt-' + (++idNr);
      st.sucheEl.setAttribute('aria-activedescendant', r.id);
    } else if (st.sucheEl) st.sucheEl.removeAttribute('aria-activedescendant');
  }

  function lage() {
    var m = st.el, a = st.anker;
    if (st.sheet) {
      st.backdrop = document.createElement('div');
      st.backdrop.className = 'mxh-menu-backdrop';
      st.host.insertBefore(st.backdrop, m);
      m.style.visibility = '';
      return;
    }
    var r = a.getBoundingClientRect(), H = window.innerHeight, W = window.innerWidth;
    if (st.opts.matchWidth) m.style.minWidth = Math.max(180, r.width) + 'px';
    var unten = H - r.bottom - 10, oben = r.top - 10;
    var hoch = m.scrollHeight;
    var nachOben = st.opts.placement === 'above' ? (hoch <= oben || oben > unten) : (hoch > unten && oben > unten);
    var platz = Math.max(120, nachOben ? oben : unten);
    m.style.maxHeight = platz + 'px';
    var h = Math.min(hoch, platz), w = m.getBoundingClientRect().width;
    var left = Math.min(r.left, W - w - 8);
    m.style.left = Math.max(8, left) + 'px';
    m.style.top = (nachOben ? Math.max(4, r.top - h - 6) : r.bottom + 6) + 'px';
    m.style.visibility = '';
  }

  // ── Tastatur ──────────────────────────────────────────────────────
  function tasten(e) {
    if (!st) return;
    var box = e.target.closest ? e.target.closest('.mxh-menu') : null;
    if (!box) return;
    var suche = st.sucheEl && e.target === st.sucheEl;
    var els = eintraege(box);
    var i = suche ? st.akt : els.indexOf(document.activeElement);
    var zu = function (n) {
      if (!els.length) return;
      n = (n + els.length) % els.length;
      if (suche) { st.akt = n; markieren(); } else els[n].focus();
    };
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); zu(i < 0 ? 0 : i + 1); break;
      case 'ArrowUp': e.preventDefault(); zu(i < 0 ? els.length - 1 : i - 1); break;
      case 'Home': if (!suche) { e.preventDefault(); zu(0); } break;
      case 'End': if (!suche) { e.preventDefault(); zu(els.length - 1); } break;
      case 'ArrowRight': {
        var row = suche ? els[st.akt] : document.activeElement;
        if (row && row._mxhItem && row._mxhItem.children) { e.preventDefault(); unterOeffnen(box, row, box._mxhEltern ? 1 : 0, true); }
        break;
      }
      case 'ArrowLeft':
        if (box._mxhEltern) {
          e.preventDefault(); e.stopPropagation();
          var offen = box._mxhRow; unterZu(box._mxhEltern); if (offen) offen.focus();
        } else if (st.sheet && st.stapel.length) { e.preventDefault(); st.stapel.pop(); erstes(neuZeichnen()); }
        break;
      case 'Enter': case ' ': {
        if (suche && e.key === ' ') break;
        var ziel = suche ? (els[st.akt >= 0 ? st.akt : 0]) : document.activeElement;
        if (ziel && ziel.classList.contains('mxh-menu-item')) { e.preventDefault(); ziel.click(); }
        break;
      }
      case 'Escape':
        e.preventDefault(); e.stopPropagation();
        if (box._mxhEltern) {
          var o = box._mxhRow; unterZu(box._mxhEltern); if (o) o.focus();
        } else if (st.sheet && st.stapel.length) { st.stapel.pop(); erstes(neuZeichnen()); }
        else api.close();
        break;
      case 'Tab':
        api.close();   // Fokus liegt danach am Anker, Tab geht von dort weiter
        break;
      default:
        if (!suche && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          var k = norm(e.key);
          for (var s = 1; s <= els.length; s++) {
            var c = els[(Math.max(i, -1) + s) % els.length];
            var l = c.querySelector('.mxh-menu-label');
            if (l && norm(l.textContent).trim().indexOf(k) === 0) { c.focus(); break; }
          }
        }
    }
  }

  // ── Schließen von außen ───────────────────────────────────────────
  function aussen(e) {
    if (!st || drin(e.target)) return;
    var anker = st.anker && st.anker.contains && st.anker.contains(e.target) ? st.anker : null;
    api.close(false);   // Klick woandershin: Fokus gehört dem neuen Ziel
    if (anker) { zuletzt.anker = anker; zuletzt.zeit = Date.now(); }
  }
  function escGlobal(e) { if (st && e.key === 'Escape' && !drin(e.target)) { e.stopPropagation(); api.close(); } }
  function weg(e) {
    if (!st) return;
    if (e && e.target && e.target.nodeType === 1 && drin(e.target)) return;   // Scrollen im Menü
    // Handy: die Bildschirmtastatur (Suchfeld) ändert die Fenstergröße — kein Grund zu schließen.
    if (e && e.type === 'resize' && (st.sheet || document.activeElement === st.sucheEl)) return;
    api.close(false);
  }

  var api = {
    open: function (anker, items, opts) {
      if (st) { var gleich = st.anker === anker; api.close(); if (gleich) return; }
      if (zuletzt.anker === anker && Date.now() - zuletzt.zeit < 500) { zuletzt.anker = null; return; }
      opts = opts || {};
      st = {
        anker: anker, opts: opts, build: typeof items === 'function' ? items : function () { return items; },
        host: opts.host || document.body, sheet: istSheet(), stapel: [], el: null
      };
      if (anker && anker.setAttribute) {
        if (!anker.hasAttribute('aria-haspopup')) anker.setAttribute('aria-haspopup', opts.role === 'listbox' ? 'listbox' : 'menu');
        anker.setAttribute('aria-expanded', 'true');
      }
      var box = neuZeichnen();
      if (st.sucheEl) { st.sucheEl.focus(); if (st.akt >= 0) markieren(); }
      else erstes(box);
      setTimeout(function () {
        if (!st) return;
        document.addEventListener('pointerdown', aussen, true);
        document.addEventListener('keydown', escGlobal, true);
        window.addEventListener('resize', weg);
        document.addEventListener('scroll', weg, true);
      }, 0);
      return box;
    },

    close: function (fokusZurueck) {
      if (!st) return;
      var s = st;
      unterZu(s.el);
      st = null;
      if (s.el && s.el.parentNode) s.el.parentNode.removeChild(s.el);
      if (s.backdrop && s.backdrop.parentNode) s.backdrop.parentNode.removeChild(s.backdrop);
      document.removeEventListener('pointerdown', aussen, true);
      document.removeEventListener('keydown', escGlobal, true);
      window.removeEventListener('resize', weg);
      document.removeEventListener('scroll', weg, true);
      if (s.anker && s.anker.setAttribute) s.anker.setAttribute('aria-expanded', 'false');
      if (fokusZurueck !== false && s.anker && s.anker.focus && s.anker.isConnected) {
        try { s.anker.focus({ preventScroll: true }); } catch (e) {}
      }
      if (s.opts.onClose) s.opts.onClose();
    },

    refresh: function () {
      if (!st) return;
      // Offene Untermenü-Kette und den fokussierten Eintrag (Ebene + Position)
      // merken, damit ein Schalter (keepOpen) im Untermenü dort weiterarbeitet.
      var kette = [], box = st.el;
      while (box) {
        var offen = box.querySelector(':scope > .mxh-menu-item.is-open');
        if (!offen) break;
        kette.push(eintraege(box).indexOf(offen));
        box = box._sub;
      }
      var fokusEbene = -1, fokusIdx = -1, ak = document.activeElement;
      var ebeneBox = ak && ak.closest ? ak.closest('.mxh-menu') : null;
      if (ebeneBox && drin(ebeneBox)) {
        fokusIdx = eintraege(ebeneBox).indexOf(ak);
        for (var e = ebeneBox, n = 0; e && e !== st.el; e = e._mxhEltern) n++;
        fokusEbene = n;
      }
      unterZu(st.el);
      var neu = neuZeichnen(), b = neu;
      for (var i = 0; i < kette.length && b; i++) {
        var row = eintraege(b)[kette[i]];
        if (!row || !row._mxhItem || !row._mxhItem.children) break;
        unterOeffnen(b, row, i, false);
        b = b._sub;
        if (i + 1 === fokusEbene) break;
      }
      if (fokusIdx >= 0) {
        var ziel = neu;
        for (var j = 0; j < fokusEbene && ziel; j++) ziel = ziel._sub;
        var els = eintraege(ziel);
        if (els[fokusIdx]) els[fokusIdx].focus();
      }
    },

    isOpen: function () { return !!st; },

    build: function (items, flat) {
      flat = flat || {};
      var box = document.createElement('div');
      box.className = 'mxh-menu-flat'; box.setAttribute('role', 'menu');
      items.forEach(function (it) {
        if (it.sep) { var sp = document.createElement('div'); sp.className = 'mxh-menu-sep'; box.appendChild(sp); return; }
        if (it.children) {
          var h = document.createElement('div'); h.className = 'mxh-menu-group'; h.textContent = it.label;
          if (it.title) h.title = it.title;
          box.appendChild(h);
          var sub = api.build(it.children, flat); sub.classList.add('mxh-menu-indent');
          box.appendChild(sub);
          return;
        }
        var row = zeile(it, true);
        row.tabIndex = 0;
        row.addEventListener('click', function (e) {
          e.stopPropagation(); if (it.onSelect) it.onSelect(); if (flat.after) flat.after();
        });
        box.appendChild(row);
      });
      return box;
    }
  };

  global.mxhMenu = api;

  /* ── Auswahl: <select> mit Meryverse-Liste (F8, seit 0.18.0) ──────────────
   * Jedes <select class="mxh-input"> (auch class="mxh-modal-input" und
   * [data-mxh-auswahl]) öffnet statt der Browser-Liste dieses Menü als Liste
   * (Suche ab 8 Einträgen). Das <select> selbst bleibt das sichtbare Feld mit
   * allen Klassen, Maßen und JS-Bezügen — nur das Öffnen wird abgefangen
   * (Maus, Finger, Tastatur). Wert, name, Formular, select.value und das
   * change-Event bleiben unverändert. Neu gerenderte Selects erfasst ein
   * MutationObserver. Ausnahmen: multiple, size > 1, data-mxh-nativ.
   *   mxhAuswahl.aufwerten(select)   von Hand (z. B. ohne Klasse)
   *   mxhAuswahl.oeffnen(select)
   */
  var SEL = 'select.mxh-input, select.mxh-modal-input, select[data-mxh-auswahl]';

  function liste_oeffnen(sel) {
    if (sel.disabled) return;
    var items = [], gruppe = null;
    Array.prototype.forEach.call(sel.options, function (o, i) {
      var g = o.parentNode.tagName === 'OPTGROUP' ? o.parentNode : null;
      if (g !== gruppe) { gruppe = g; if (g) items.push({ group: g.label }); }
      if (o.hidden) return;
      items.push({ label: o.label || o.textContent, checked: i === sel.selectedIndex, disabled: o.disabled || (g && g.disabled),
        onSelect: function () {
          if (sel.selectedIndex === i) return;
          sel.selectedIndex = i;
          sel.dispatchEvent(new Event('input', { bubbles: true }));
          sel.dispatchEvent(new Event('change', { bubbles: true }));
        } });
    });
    var lab = sel.labels && sel.labels[0];
    api.open(sel, items, { role: 'listbox', matchWidth: true, search: 8,
      label: sel.getAttribute('aria-label') || (lab ? lab.textContent.trim() : '') });
  }

  function aufwerten(sel) {
    if (!sel || sel._mxhAuswahl || sel.multiple || sel.size > 1 || sel.hasAttribute('data-mxh-nativ')) return;
    sel._mxhAuswahl = true;
    sel.setAttribute('aria-haspopup', 'listbox');
    sel.setAttribute('aria-expanded', 'false');
    // Maus: die Browser-Liste öffnet bei mousedown — abfangen, Fokus selbst setzen.
    sel.addEventListener('mousedown', function (e) {
      if (e.button !== 0) return;
      e.preventDefault();
      if (document.activeElement !== sel) try { sel.focus({ preventScroll: true }); } catch (x) {}
      liste_oeffnen(sel);
    });
    // Finger: der Klick nach touchend würde die System-Auswahl öffnen.
    var start = null;
    sel.addEventListener('touchstart', function (e) { var t = e.touches[0]; start = t ? { x: t.clientX, y: t.clientY } : null; }, { passive: true });
    sel.addEventListener('touchend', function (e) {
      var t = e.changedTouches[0];
      if (!start || !t || Math.abs(t.clientX - start.x) + Math.abs(t.clientY - start.y) > 10) return;   // war Scrollen
      e.preventDefault();
      liste_oeffnen(sel);
    });
    // Tastatur: Enter, Leertaste, Alt+↓/↑, F4 öffnen; Pfeile ohne Alt bleiben
    // nativ (Wert direkt umschalten), Buchstaben ebenso.
    sel.addEventListener('keydown', function (e) {
      // ↓/↑ öffnen die Liste (Muster „Combobox“). Ohne das fielen sie an den
      // Browser durch: macOS öffnet dann die NATIVE Liste (genau die, die F8
      // abschafft), Windows springt den Wert ohne Liste um (lokale Prüfung
      // 2026-10-04).
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'F4' ||
          e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault(); liste_oeffnen(sel);
      }
    });
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

  global.mxhAuswahl = { aufwerten: aufwerten, oeffnen: liste_oeffnen };
})(window);
