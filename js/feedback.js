/**
 * Meryverse Feedback-Komponente (framework-frei, Vanilla JS)
 * ==========================================================
 *
 * Wiederverwendbare Feedback-/Hilfe-Kommentar-Komponente für alle Meryverse-
 * Apps. Aktivierung pro App über `feedbackInit(config)`. Drei Modi:
 *
 *   (a) Hilfe-KommentarLayer  — Textmarkierung auf Hilfe-Seiten:
 *         mouseup-Selektion → Erstell-Popup → POST. Persistente
 *         amber/grün-Markierungen werden NUR gerendert, wenn config.isAdmin
 *         true ist (Design-Entscheidung #3). Nicht-Admins können markieren +
 *         absenden (transiente „Danke"-Bestätigung), sehen aber keine
 *         Highlights.
 *   (b) Globaler Freitext-Button — feste Ecke, Modal „Feedback zu dieser
 *         Seite" (kontext_typ='page', anker=route).
 *   (c) feedbackForItem(kontext) — Freitext-Modal für ein Lied/Part
 *         (kontext_typ='song'|'part').
 *
 * Alle Modi schreiben über die generische REST-API `${apiBase}/api/feedback`.
 *
 * config = {
 *   app_key:   'chor',            // Pflicht — App-Schlüssel für sys_feedback
 *   isAdmin:   false,             // rendert persistente Hilfe-Markierungen
 *   route:     location.pathname, // Anker für Seiten-Feedback
 *   apiBase:   '',                // Origin-Präfix (Default: same-origin)
 *   help:      { containerId: 'hilfe-content' },  // aktiviert Modus (a)
 *   pageButton:true,              // aktiviert Modus (b)
 * }
 *
 * Anker auf Hilfe-Seiten = die nächste Überschriften-ID (toc-Extension),
 * NICHT <section id>. Quelle/Plan:
 *   plans/2026-05-31-feedback-kommentar-system.md — Schritt 3
 *   mxh-excel-vergleich/context/hilfe-feedback-pattern.md (Vorlage)
 */

(function (global) {
  "use strict";

  // ── Modul-State ───────────────────────────────────────────────────────
  var CFG = null;        // aktive Konfiguration (nach feedbackInit)
  var MARKS = [];        // aktuell gerenderte <mark>-Elemente (Aufräumen)
  var STYLE_NS = "mxh-fb";

  // ── Kleine DOM-Helfer ─────────────────────────────────────────────────
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "class") node.className = attrs[k];
        else if (k === "text") node.textContent = attrs[k];
        else if (k === "html") node.innerHTML = attrs[k];
        else if (k.slice(0, 2) === "on" && typeof attrs[k] === "function") {
          node.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        } else node.setAttribute(k, attrs[k]);
      });
    }
    (children || []).forEach(function (c) {
      if (c == null) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }

  function api(path) {
    return (CFG && CFG.apiBase ? CFG.apiBase.replace(/\/$/, "") : "") + path;
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ── Toast / „Danke"-Bestätigung ───────────────────────────────────────
  function toast(msg, kind) {
    var t = el("div", {
      class: STYLE_NS + "-toast " + (kind === "error" ? "is-error" : "is-ok"),
      text: msg,
    });
    document.body.appendChild(t);
    // Reflow → Transition
    void t.offsetWidth;
    t.classList.add("is-visible");
    setTimeout(function () {
      t.classList.remove("is-visible");
      setTimeout(function () { t.remove(); }, 300);
    }, 2600);
  }

  // ── REST-Aufrufe ──────────────────────────────────────────────────────
  function postFeedback(payload) {
    return fetch(api("/api/feedback"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(payload),
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok || !j.success) {
          throw new Error(j.message || ("HTTP " + r.status));
        }
        return j;
      });
    });
  }

  function listHelpFeedback() {
    var url = api("/api/feedback")
      + "?app=" + encodeURIComponent(CFG.app_key)
      + "&kontext_typ=help";
    return fetch(url, { credentials: "same-origin" })
      .then(function (r) { return r.ok ? r.json() : { feedback: [] }; })
      .then(function (j) { return (j && j.feedback) || []; });
  }

  function patchFeedback(id, body) {
    return fetch(api("/api/feedback/" + id), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body),
    }).then(function (r) { return r.json(); });
  }

  function deleteFeedback(id) {
    return fetch(api("/api/feedback/" + id), {
      method: "DELETE",
      credentials: "same-origin",
    }).then(function (r) { return r.json(); });
  }

  // ── Generisches Freitext-Modal (Modi b + c) ───────────────────────────
  function openTextModal(opts) {
    // opts: { title, placeholder, onSubmit(text) -> Promise }
    closeModal();
    var ta = el("textarea", {
      class: STYLE_NS + "-textarea",
      rows: "5",
      placeholder: opts.placeholder || "Dein Feedback …",
    });
    var hint = el("div", { class: STYLE_NS + "-hint", text: "" });
    var submitBtn = el("button", {
      class: STYLE_NS + "-btn primary",
      type: "button",
      text: "Senden",
    });
    submitBtn.addEventListener("click", function () {
      var text = ta.value.trim();
      if (!text) { ta.focus(); return; }
      submitBtn.disabled = true;
      hint.textContent = "Wird gesendet …";
      opts.onSubmit(text).then(function () {
        closeModal();
        toast("Danke für dein Feedback!");
      }).catch(function (err) {
        submitBtn.disabled = false;
        hint.textContent = "Fehler: " + err.message;
      });
    });

    var card = el("div", { class: STYLE_NS + "-modal-card" }, [
      el("div", { class: STYLE_NS + "-modal-head" }, [
        el("h3", { text: opts.title || "Feedback" }),
        el("button", {
          class: STYLE_NS + "-x", type: "button", "aria-label": "Schließen",
          text: "✕", onClick: closeModal,
        }),
      ]),
      ta,
      hint,
      el("div", { class: STYLE_NS + "-modal-actions" }, [
        el("button", {
          class: STYLE_NS + "-btn", type: "button", text: "Abbrechen",
          onClick: closeModal,
        }),
        submitBtn,
      ]),
    ]);
    var overlay = el("div", { class: STYLE_NS + "-overlay", id: STYLE_NS + "-overlay" }, [card]);
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeModal();
    });
    document.body.appendChild(overlay);
    setTimeout(function () { ta.focus(); }, 50);
  }

  function closeModal() {
    var ov = document.getElementById(STYLE_NS + "-overlay");
    if (ov) ov.remove();
    closeCreatePopup();
  }

  // ── Modus (b): globaler Seiten-Feedback-Button ────────────────────────
  function mountPageButton() {
    if (document.getElementById(STYLE_NS + "-page-btn")) return;
    var btn = el("button", {
      class: STYLE_NS + "-fab",
      id: STYLE_NS + "-page-btn",
      type: "button",
      title: "Feedback zu dieser Seite",
      "aria-label": "Feedback zu dieser Seite",
      html: "<span>💬</span><span class='" + STYLE_NS + "-fab-label'>Feedback</span>",
    });
    btn.addEventListener("click", function () {
      openTextModal({
        title: "Feedback zu dieser Seite",
        placeholder: "Was möchtest du uns zu dieser Seite mitteilen?",
        onSubmit: function (text) {
          return postFeedback({
            app_key: CFG.app_key,
            kontext_typ: "page",
            anker: CFG.route || location.pathname,
            kommentar: text,
          });
        },
      });
    });
    document.body.appendChild(btn);
  }

  // ── Modus (c): Feedback zu einem Lied / Part ──────────────────────────
  function feedbackForItem(kontext) {
    // kontext: { kontext_typ:'song'|'part', anker:<name>, label?:<anzeige> }
    var typ = (kontext && kontext.kontext_typ) || "part";
    var anker = kontext && kontext.anker;
    var label = (kontext && kontext.label) || anker || (typ === "song" ? "Lied" : "Part");
    openTextModal({
      title: "Feedback zu „" + label + "“",
      placeholder: "Dein Hinweis zu diesem " + (typ === "song" ? "Lied" : "Part") + " …",
      onSubmit: function (text) {
        return postFeedback({
          app_key: CFG.app_key,
          kontext_typ: typ,
          anker: anker || null,
          kommentar: text,
        });
      },
    });
  }

  // ── Modus (a): Hilfe-KommentarLayer ───────────────────────────────────
  function helpContainer() {
    var id = CFG.help && CFG.help.containerId;
    return id ? document.getElementById(id) : null;
  }

  // Nächste Überschriften-ID (toc-Anker) zum markierten Knoten finden.
  function findAnchorId(node) {
    var container = helpContainer();
    if (!container) return null;
    // Alle Überschriften mit id in Dokumentreihenfolge sammeln.
    var headings = Array.prototype.slice.call(
      container.querySelectorAll("h1[id],h2[id],h3[id],h4[id],h5[id],h6[id]")
    );
    if (!headings.length) return null;
    var elNode = node.nodeType === 3 ? node.parentNode : node;
    // Die letzte Überschrift, die VOR dem markierten Knoten im DOM steht.
    var best = null;
    for (var i = 0; i < headings.length; i++) {
      var pos = headings[i].compareDocumentPosition(elNode);
      // elNode kommt NACH der Überschrift (oder ist enthalten)
      if (pos & Node.DOCUMENT_POSITION_FOLLOWING || pos === 0) {
        best = headings[i];
      } else {
        break;
      }
    }
    return best ? best.id : headings[0].id;
  }

  // Markierten Text innerhalb des Containers finden + mit <mark> umschließen.
  function highlightText(text, className, meta) {
    var container = helpContainer();
    if (!container || !text) return [];
    var walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
    var hits = [];
    var node;
    while ((node = walker.nextNode())) {
      // Nicht in bereits gesetzte Marks hinein-markieren.
      if (node.parentNode && node.parentNode.classList
          && node.parentNode.classList.contains(STYLE_NS + "-mark")) continue;
      var idx = (node.textContent || "").indexOf(text);
      if (idx !== -1) hits.push({ node: node, start: idx });
    }
    var made = [];
    hits.forEach(function (h) {
      try {
        var range = document.createRange();
        range.setStart(h.node, h.start);
        range.setEnd(h.node, h.start + text.length);
        var mark = el("mark", { class: STYLE_NS + "-mark " + className });
        range.surroundContents(mark);
        mark.title = meta.kommentar || "";
        mark.dataset.fbId = String(meta.id);
        made.push(mark);
      } catch (e) { /* Element-Grenzen — überspringen */ }
    });
    return made;
  }

  function clearMarks() {
    MARKS.forEach(function (mark) {
      var parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent || ""), mark);
        parent.normalize();
      }
    });
    MARKS = [];
  }

  function renderMarks(items) {
    clearMarks();
    items.forEach(function (k) {
      if (!k.markierter_text) return;
      var cls = k.status === "erledigt" ? "is-done" : "is-open";
      var marks = highlightText(k.markierter_text, cls, k);
      MARKS.push.apply(MARKS, marks);
    });
  }

  function refreshMarks() {
    // Nur Admins sehen persistente Markierungen (Design-Entscheidung #3).
    if (!CFG.isAdmin) return;
    listHelpFeedback().then(renderMarks).catch(function () { /* still */ });
  }

  // Erstell-Popup nach Textmarkierung
  function openCreatePopup(x, y, selectedText, anchorId) {
    closeCreatePopup();
    var ta = el("textarea", {
      class: STYLE_NS + "-pop-textarea",
      rows: "3",
      placeholder: "Änderungswunsch zu dieser Stelle …",
    });
    var saveBtn = el("button", {
      class: STYLE_NS + "-btn primary", type: "button", text: "Speichern",
    });
    saveBtn.addEventListener("click", function () {
      var komm = ta.value.trim();
      if (!komm) { ta.focus(); return; }
      saveBtn.disabled = true;
      postFeedback({
        app_key: CFG.app_key,
        kontext_typ: "help",
        anker: anchorId || null,
        markierter_text: selectedText,
        kommentar: komm,
      }).then(function () {
        closeCreatePopup();
        toast("Danke für dein Feedback!");
        refreshMarks();
      }).catch(function (err) {
        saveBtn.disabled = false;
        toast("Fehler: " + err.message, "error");
      });
    });

    var pop = el("div", { class: STYLE_NS + "-popup", id: STYLE_NS + "-create-pop" }, [
      el("div", { class: STYLE_NS + "-pop-quote", text: "“" + selectedText + "”" }),
      ta,
      el("div", { class: STYLE_NS + "-pop-actions" }, [
        el("button", { class: STYLE_NS + "-btn", type: "button", text: "Abbrechen", onClick: closeCreatePopup }),
        saveBtn,
      ]),
    ]);
    positionPopup(pop, x, y);
    document.body.appendChild(pop);
    setTimeout(function () { ta.focus(); }, 30);
  }

  function closeCreatePopup() {
    var p = document.getElementById(STYLE_NS + "-create-pop");
    if (p) p.remove();
    var d = document.getElementById(STYLE_NS + "-detail-pop");
    if (d) d.remove();
  }

  function positionPopup(pop, x, y) {
    pop.style.position = "fixed";
    pop.style.left = Math.min(x, window.innerWidth - 320) + "px";
    pop.style.top = Math.min(y, window.innerHeight - 200) + "px";
  }

  // Detail-Popup bei Klick auf eine Markierung (nur Admin sieht Marks)
  function openDetailPopup(mark, item) {
    closeCreatePopup();
    var rect = mark.getBoundingClientRect();
    var statusTxt = item.status === "erledigt" ? "✅ Erledigt" : "🟡 Offen";
    var children = [
      el("div", { class: STYLE_NS + "-pop-status", text: statusTxt }),
      el("div", { class: STYLE_NS + "-pop-komm", text: item.kommentar }),
    ];
    if (item.erledigt_notiz) {
      children.push(el("div", { class: STYLE_NS + "-pop-notiz", text: "Notiz: " + item.erledigt_notiz }));
    }
    children.push(el("div", { class: STYLE_NS + "-pop-meta", text: "von " + (item.created_by || "?") }));

    var actions = [];
    if (item.status === "erledigt") {
      var reopenBtn = el("button", { class: STYLE_NS + "-btn", type: "button", text: "Wieder öffnen" });
      reopenBtn.addEventListener("click", function () {
        patchFeedback(item.id, { status: "offen" }).then(function () {
          closeCreatePopup(); refreshMarks();
        });
      });
      actions.push(reopenBtn);
    }
    var delBtn = el("button", { class: STYLE_NS + "-btn danger", type: "button", text: "Löschen" });
    delBtn.addEventListener("click", function () {
      deleteFeedback(item.id).then(function () {
        closeCreatePopup(); refreshMarks();
      });
    });
    actions.push(delBtn);

    children.push(el("div", { class: STYLE_NS + "-pop-actions" }, actions));
    var pop = el("div", { class: STYLE_NS + "-popup", id: STYLE_NS + "-detail-pop" }, children);
    positionPopup(pop, rect.left, rect.bottom + 6);
    document.body.appendChild(pop);
  }

  function onMouseUp() {
    var sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return;
    var text = sel.toString().trim();
    if (!text || text.length < 3) return;
    var range = sel.getRangeAt(0);
    var container = helpContainer();
    if (!container || !container.contains(range.commonAncestorContainer)) return;
    var anchorId = findAnchorId(range.startContainer);
    var rect = range.getBoundingClientRect();
    openCreatePopup(rect.left + rect.width / 2 - 150, rect.bottom + 8, text, anchorId);
  }

  function mountHelpLayer() {
    var container = helpContainer();
    if (!container) return;
    container.addEventListener("mouseup", onMouseUp);
    // Klick auf eine Markierung → Detail (nur relevant für Admins)
    if (CFG.isAdmin) {
      container.addEventListener("click", function (e) {
        var mark = e.target.closest ? e.target.closest("." + STYLE_NS + "-mark") : null;
        if (!mark) return;
        var id = Number(mark.dataset.fbId);
        listHelpFeedback().then(function (items) {
          var it = items.find(function (x) { return x.id === id; });
          if (it) openDetailPopup(mark, it);
        });
      });
    }
    // Popups bei Klick außerhalb schließen
    document.addEventListener("mousedown", function (e) {
      var p = e.target.closest ? e.target.closest("." + STYLE_NS + "-popup") : null;
      var isMark = e.target.closest ? e.target.closest("." + STYLE_NS + "-mark") : null;
      if (!p && !isMark) closeCreatePopup();
    });
    refreshMarks();
  }

  // ── Öffentliche API ───────────────────────────────────────────────────
  function feedbackInit(config) {
    CFG = Object.assign({
      app_key: "",
      isAdmin: false,
      route: (typeof location !== "undefined" ? location.pathname : ""),
      apiBase: "",
      help: null,
      pageButton: false,
    }, config || {});
    if (!CFG.app_key) {
      console.warn("[feedback] feedbackInit ohne app_key — abgebrochen.");
      return;
    }
    var start = function () {
      if (CFG.help && CFG.help.containerId) mountHelpLayer();
      if (CFG.pageButton) mountPageButton();
    };
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", start);
    } else {
      start();
    }
  }

  // Globale Exporte (Chor inlinet/referenziert die Datei und ruft diese auf)
  global.feedbackInit = feedbackInit;
  global.feedbackForItem = feedbackForItem;
  global.MXHFeedback = {
    init: feedbackInit,
    forItem: feedbackForItem,
    refreshMarks: refreshMarks,
  };
})(typeof window !== "undefined" ? window : this);
