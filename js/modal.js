/* ════════════════════════════════════════════════════════════════
 * meryverse_core — Modal-Komponente (geteilte Popups)
 *
 * Framework-frei, Promise-basiert, `.mxh-modal-*`-gescoped. Ersetzt native
 * window.alert/confirm/prompt durch gestylte Meryverse-Dialoge und bietet ein
 * generisches open()/close() für eigene Inhalte. Nutzt die Design-Tokens der
 * jeweiligen Seite (var(--surface) …) mit dunklen Fallbacks.
 *
 * Vendored ausgeliefert unter /core/modal.{js,css} (wie feedback.*). Global:
 *   mxhModal.alert(msg, {title, okText})            -> Promise<void>
 *   mxhModal.confirm(msg, {title, okText, cancelText, danger}) -> Promise<bool>
 *   mxhModal.prompt(label, {title, default, placeholder, type, validate, okText, cancelText}) -> Promise<string|null>
 *   mxhModal.open(html, {wide})                      -> Promise<any>  (Buttons mit data-mxh-close="<wert>")
 *   mxhModal.close()
 * ════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  var ROOT_ID = 'mxh-modal-root';
  var stack = [];   // { cancelValue, _done }

  function ensureRoot() {
    var r = document.getElementById(ROOT_ID);
    if (r) return r;
    r = document.createElement('div');
    r.id = ROOT_ID;
    r.className = 'mxh-modal-overlay';
    r.setAttribute('hidden', '');
    r.innerHTML = '<div class="mxh-modal-card" role="dialog" aria-modal="true"></div>';
    document.body.appendChild(r);
    r.addEventListener('mousedown', function (e) { if (e.target === r) cancelTop(); });
    return r;
  }

  function cancelTop() {
    var top = stack[stack.length - 1];
    if (top) top._done(top.cancelValue);
  }

  document.addEventListener('keydown', function (e) {
    if (!stack.length) return;
    if (e.key === 'Escape') { e.stopPropagation(); cancelTop(); }
  }, true);

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function show(buildBody, cancelValue, opts) {
    opts = opts || {};
    var root = ensureRoot();
    var card = root.querySelector('.mxh-modal-card');
    return new Promise(function (resolve) {
      var entry = { cancelValue: cancelValue };
      entry._done = function (val) {
        var idx = stack.indexOf(entry);
        if (idx === -1) return;
        stack.splice(idx, 1);
        if (!stack.length) { root.setAttribute('hidden', ''); card.innerHTML = ''; }
        resolve(val);
      };
      stack.push(entry);
      card.classList.toggle('mxh-modal-wide', !!opts.wide);
      root.removeAttribute('hidden');
      buildBody(card, entry._done);
    });
  }

  function actions(okText, cancelText, danger) {
    var c = cancelText
      ? '<button type="button" class="mxh-modal-btn mxh-modal-cancel">' + esc(cancelText) + '</button>'
      : '';
    var okCls = 'mxh-modal-btn mxh-modal-ok' + (danger ? ' mxh-modal-danger' : '');
    return '<div class="mxh-modal-actions">' + c +
      '<button type="button" class="' + okCls + '">' + esc(okText) + '</button></div>';
  }

  function header(title) {
    return title ? '<h3 class="mxh-modal-title">' + esc(title) + '</h3>' : '';
  }

  var api = {
    open: function (html, opts) {
      return show(function (card, done) {
        card.innerHTML = html;
        Array.prototype.forEach.call(card.querySelectorAll('[data-mxh-close]'), function (b) {
          b.addEventListener('click', function () { done(b.getAttribute('data-mxh-close') || null); });
        });
        var f = card.querySelector('[autofocus], input, textarea, button');
        if (f) { try { f.focus(); } catch (e) {} }
      }, null, opts);
    },

    close: function () { cancelTop(); },

    alert: function (message, opts) {
      opts = opts || {};
      return show(function (card, done) {
        card.innerHTML = header(opts.title) +
          '<div class="mxh-modal-msg">' + esc(message) + '</div>' +
          actions(opts.okText || 'OK', null, false);
        var ok = card.querySelector('.mxh-modal-ok');
        ok.addEventListener('click', function () { done(); });
        try { ok.focus(); } catch (e) {}
      }, undefined, opts);
    },

    confirm: function (message, opts) {
      opts = opts || {};
      return show(function (card, done) {
        card.innerHTML = header(opts.title) +
          '<div class="mxh-modal-msg">' + esc(message) + '</div>' +
          actions(opts.okText || 'OK', opts.cancelText || 'Abbrechen', !!opts.danger);
        card.querySelector('.mxh-modal-ok').addEventListener('click', function () { done(true); });
        card.querySelector('.mxh-modal-cancel').addEventListener('click', function () { done(false); });
      }, false, opts);
    },

    prompt: function (label, opts) {
      opts = opts || {};
      return show(function (card, done) {
        card.innerHTML = header(opts.title) +
          (label ? '<label class="mxh-modal-label">' + esc(label) + '</label>' : '') +
          '<input type="' + esc(opts.type || 'text') + '" class="mxh-modal-input" ' +
            (opts.placeholder ? 'placeholder="' + esc(opts.placeholder) + '" ' : '') +
            'value="' + esc(opts['default'] != null ? opts['default'] : '') + '">' +
          '<div class="mxh-modal-err" hidden></div>' +
          actions(opts.okText || 'OK', opts.cancelText || 'Abbrechen', false);
        var input = card.querySelector('.mxh-modal-input');
        var err = card.querySelector('.mxh-modal-err');
        function submit() {
          var v = input.value;
          if (opts.validate) {
            var msg = opts.validate(v);
            if (msg) { err.textContent = msg; err.removeAttribute('hidden'); return; }
          }
          done(v);
        }
        card.querySelector('.mxh-modal-ok').addEventListener('click', submit);
        card.querySelector('.mxh-modal-cancel').addEventListener('click', function () { done(null); });
        input.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') { e.preventDefault(); submit(); }
        });
        setTimeout(function () { try { input.focus(); input.select(); } catch (e) {} }, 0);
      }, null, opts);
    }
  };

  global.mxhModal = api;
})(window);
