// Minimal fake DOM to run js/toast.js under node; prints a JSON result.
const fs = require('fs');
function mk(tag) {
  const el = {
    tag, children: [], parentNode: null, attrs: {}, listeners: {}, _txt: '',
    classList: { s: new Set(), add(c) { this.s.add(c); }, remove(c) { this.s.delete(c); } },
    set className(v) { this.classList.s = new Set(v.split(/\s+/).filter(Boolean)); },
    get className() { return [...this.classList.s].join(' '); },
    set textContent(v) { this._txt = v; this.children = []; },
    get textContent() { return this._txt; },
    get firstChild() { return this.children[0]; },
    setAttribute(k, v) { this.attrs[k] = v; },
    appendChild(c) { c.parentNode = this; this.children.push(c); return c; },
    removeChild(c) { this.children = this.children.filter(x => x !== c); c.parentNode = null; },
    addEventListener(t, f) { (this.listeners[t] = this.listeners[t] || []).push(f); },
    fire(t, ev) { (this.listeners[t] || []).forEach(f => f(Object.assign({ type: t }, ev))); },
  };
  return el;
}
const body = mk('body');
let host = null;
global.window = global;
global.document = {
  body, createElement: mk,
  getElementById: () => host,
};
const origAppend = body.appendChild.bind(body);
body.appendChild = (c) => { host = c; return origAppend(c); };
global.requestAnimationFrame = (f) => f();
let now = 0; const timers = [];
global.Date = { now: () => now };
global.setTimeout = (f, ms) => { const t = { f, at: now + ms, on: true }; timers.push(t); return t; };
global.clearTimeout = (t) => { if (t) t.on = false; };
function tick(ms) {
  const end = now + ms;
  for (;;) {
    const n = timers.filter(t => t.on && t.at <= end).sort((a, b) => a.at - b.at)[0];
    if (!n) break;
    now = n.at; n.on = false; n.f();
  }
  now = end;
}
eval(fs.readFileSync(process.argv[2], 'utf8'));
const out = {};
const find = (el, cls) => el.children.find(c => c.classList.s.has(cls));

// aktion: structure, click, close
let clicks = [];
let el = mxhToast('Gelöscht', { ms: 3000, aktion: [{ text: 'Rückgängig', onClick: e => clicks.push(e) }, { text: 'Mehr' }] });
const btns = find(el, 'mxh-toast-aktionen').children;
out.struct = {
  text: find(el, 'mxh-toast-text').textContent,
  n: btns.length, types: btns.map(b => b.type), tags: btns.map(b => b.tag),
  c0: btns[0].className, c1: btns[1].className, role: el.attrs.role,
};
el.fire('click', {});
out.textKlickSchliesst = !!el._mxhWeg;
btns[0].fire('click', { marker: 1 });
out.knopfKlick = { calls: clicks.length, ev: clicks[0] && clicks[0].marker, weg: el._mxhWeg === true };

// single object + error role
el = mxhToast('Fehler', { kind: 'err', aktion: { text: 'Nochmal', onClick() {} } });
out.errRole = el.attrs.role;
out.singleBtn = find(el, 'mxh-toast-aktionen').children.length;

// pause by mouse
el = mxhToast('Maus', { ms: 1000, aktion: { text: 'x' } });
tick(600);
el.fire('pointerenter', { pointerType: 'mouse' });
tick(5000);
out.mausPause = !el._mxhWeg;
el.fire('pointerleave', { pointerType: 'mouse' });
tick(300); out.mausNochDa = !el._mxhWeg;
tick(200); out.mausWeg = el._mxhWeg === true;

// touch does not pause
el = mxhToast('Touch', { ms: 1000 });
el.fire('pointerenter', { pointerType: 'touch' });
tick(1000); out.touchWeg = el._mxhWeg === true;

// pause by focus
el = mxhToast('Fokus', { ms: 1000 });
tick(400); el.fire('focusin', {});
tick(5000); out.fokusPause = !el._mxhWeg;
el.fire('focusout', {});
tick(500); out.fokusNochDa = !el._mxhWeg;
tick(100); out.fokusWeg = el._mxhWeg === true;

// no aktion: unchanged
el = mxhToast('Plain', { ms: 3000 });
out.plain = { txt: el.textContent, kids: el.children.length, cls: el.className };
el.fire('click', {});
out.plainKlick = el._mxhWeg === true;
console.log(JSON.stringify(out));
