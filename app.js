/* Stat Brainteaser — quant interview trainer. Plain JS, no dependencies. */
(function () {
  'use strict';

  var APP_VERSION = '1.0.0';
  var STORE_KEY = 'statbt.progress.v1';
  var PROBLEMS = Array.isArray(window.PROBLEMS) ? window.PROBLEMS : [];
  var BY_ID = {};
  PROBLEMS.forEach(function (p) { BY_ID[p.id] = p; });

  var CATS = [
    { id: 'probability', name: 'Probability' },
    { id: 'statistics', name: 'Statistics' },
    { id: 'brainteasers', name: 'Brainteasers' },
    { id: 'ev', name: 'EV & Games' },
    { id: 'combinatorics', name: 'Combinatorics' },
    { id: 'fermi', name: 'Fermi' }
  ];
  var CAT_NAME = {};
  CATS.forEach(function (c) { CAT_NAME[c.id] = c.name; });
  var DIFF_NAME = { 1: 'Warm-up', 2: 'Interview', 3: 'Hard' };

  /* ------------------------------------------------------------------ */
  /* Utilities                                                           */
  /* ------------------------------------------------------------------ */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function ymd(d) { d = d || new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function today() { return ymd(new Date()); }
  function parseYmd(s) { var a = s.split('-'); return new Date(+a[0], +a[1] - 1, +a[2]); }
  function addDays(key, n) { var d = parseYmd(key); d.setDate(d.getDate() + n); return ymd(d); }
  function randInt(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a || 1; }
  function fmtNum(x, dp) {
    if (!isFinite(x)) return String(x);
    dp = dp == null ? 4 : dp;
    var r = Math.round(x * Math.pow(10, dp)) / Math.pow(10, dp);
    return String(r);
  }
  function pct(x) { return Math.round(x * 100) + '%'; }
  function fmtTime(sec) { sec = Math.max(0, Math.ceil(sec)); return Math.floor(sec / 60) + ':' + pad2(sec % 60); }
  function isTyping(el) {
    if (!el) return false;
    var t = el.tagName;
    return t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT' || el.isContentEditable;
  }

  var ICONS = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>',
    practice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="1.3" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/></svg>',
    review: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3 2"/></svg>',
    sprint: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>',
    drills: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
    interview: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/></svg>',
    stats: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-6"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    auto: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/></svg>',
    download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>'
  };

  /* ------------------------------------------------------------------ */
  /* Persistent state (localStorage, always wrapped in try/catch)       */
  /* ------------------------------------------------------------------ */
  function defaultState() {
    return {
      v: 1,
      attempts: {},   // id -> {n, c, last, lastOk, hints}
      srs: {},        // id -> {box, due, reviews}
      days: {},       // 'YYYY-MM-DD' -> activity count
      sprint: { history: [] }, // {t, key, mode, dur, score, wrong}
      drills: { n: 0, c: 0, bestStreak: 0, byType: {} },
      interviews: [], // {t, score, total, secs, ids}
      settings: {
        theme: 'auto',
        sprint: { mode: 'classic', dur: 120, ops: { add: true, sub: true, mul: true, div: true }, addA: [2, 100], addB: [2, 100], mulA: [2, 12], mulB: [2, 100] },
        filters: { cats: [], diffs: [], tag: '', status: 'all' },
        drillTypes: [],
        ivDiff: 'mixed'
      },
      ui: { iosHintDismissed: false }
    };
  }
  function isPlainObj(o) { return o && typeof o === 'object' && !Array.isArray(o); }
  function mergeDefaults(o, d) {
    if (!isPlainObj(o)) return d;
    Object.keys(d).forEach(function (k) {
      if (o[k] === undefined || o[k] === null) o[k] = d[k];
      else if (isPlainObj(d[k]) && isPlainObj(o[k]) && Object.keys(d[k]).length) o[k] = mergeDefaults(o[k], d[k]);
      else if (Array.isArray(d[k]) && !Array.isArray(o[k])) o[k] = d[k];
    });
    return o;
  }
  var storageOk = true;
  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return defaultState();
      return mergeDefaults(JSON.parse(raw), defaultState());
    } catch (e) { storageOk = false; return defaultState(); }
  }
  var S = load();
  var saveWarned = false;
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); storageOk = true; }
    catch (e) {
      storageOk = false;
      if (!saveWarned) { saveWarned = true; toast('Progress could not be saved (storage blocked or full). Use Export to keep a copy.'); }
    }
  }

  function markDay(n) { var k = today(); S.days[k] = (S.days[k] || 0) + (n || 1); }

  /* Leitner spaced repetition: boxes 1..5 */
  var INTERVALS = [0, 1, 3, 7, 16, 35];
  function recordAttempt(id, correct, meta) {
    var a = S.attempts[id] || { n: 0, c: 0, last: 0, lastOk: null, hints: 0 };
    a.n++; if (correct) a.c++;
    a.last = Date.now(); a.lastOk = !!correct;
    if (meta && meta.hints) a.hints = (a.hints || 0) + meta.hints;
    S.attempts[id] = a;
    var s = S.srs[id];
    var isNew = !s;
    s = s || { box: 0, due: today(), reviews: 0 };
    if (correct) s.box = isNew ? 2 : Math.min(5, s.box + 1);
    else s.box = 1;
    s.due = addDays(today(), INTERVALS[s.box]);
    s.reviews = (s.reviews || 0) + 1;
    S.srs[id] = s;
    markDay();
    save();
    updateBadges();
  }
  function dueIds() {
    var t = today();
    return Object.keys(S.srs).filter(function (id) { return BY_ID[id] && S.srs[id].due <= t; })
      .sort(function (a, b) { var x = S.srs[a], y = S.srs[b]; return x.box - y.box || (x.due < y.due ? -1 : x.due > y.due ? 1 : 0); });
  }
  function streakInfo() {
    var days = S.days, cur = 0, k = today();
    if (!days[k]) k = addDays(k, -1);
    while (days[k]) { cur++; k = addDays(k, -1); }
    var keys = Object.keys(days).filter(function (x) { return days[x] > 0; }).sort();
    var best = 0, run = 0, prev = null;
    keys.forEach(function (x) { run = (prev && addDays(prev, 1) === x) ? run + 1 : 1; best = Math.max(best, run); prev = x; });
    return { cur: cur, best: Math.max(best, cur), total: keys.length };
  }
  function solvedCount() { return Object.keys(S.attempts).filter(function (id) { return BY_ID[id] && S.attempts[id].c > 0; }).length; }

  /* ------------------------------------------------------------------ */
  /* Safe numeric expression parser (no eval)                           */
  /* Supports: 1/6+1/36, 0.25, 25%, 1e-3, 2.5k/m/b, 3^2, sqrt(2), √2,    */
  /* 10!, C(10,3), ln, log, exp, pi, e, parentheses, thousands commas.  */
  /* ------------------------------------------------------------------ */
  function factorial(n) {
    if (n < 0 || n !== Math.floor(n) || n > 170) throw new Error('bad factorial');
    var r = 1; for (var i = 2; i <= n; i++) r *= i; return r;
  }
  function choose(n, k) {
    if (k < 0 || k > n || n !== Math.floor(n) || k !== Math.floor(k)) return 0;
    k = Math.min(k, n - k); var r = 1;
    for (var i = 1; i <= k; i++) r = r * (n - k + i) / i;
    return Math.round(r);
  }
  var FUNCS = {
    sqrt: function (x) { return Math.sqrt(x); }, ln: function (x) { return Math.log(x); },
    log: function (x) { return Math.log(x) / Math.LN10; }, exp: function (x) { return Math.exp(x); },
    abs: function (x) { return Math.abs(x); }, c: choose, choose: choose, ncr: choose, binom: choose
  };
  function Parser(s) { this.s = s; this.i = 0; }
  Parser.prototype.peek = function () { return this.s[this.i]; };
  Parser.prototype.eat = function (c) { if (this.s[this.i] === c) { this.i++; return true; } return false; };
  Parser.prototype.expr = function () {
    var v = this.term();
    for (;;) {
      if (this.eat('+')) v += this.term();
      else if (this.eat('-')) v -= this.term();
      else return v;
    }
  };
  Parser.prototype.term = function () {
    var v = this.unary();
    for (;;) {
      if (this.eat('*')) v *= this.unary();
      else if (this.eat('/')) v /= this.unary();
      else return v;
    }
  };
  Parser.prototype.unary = function () {
    if (this.eat('-')) return -this.unary();
    if (this.eat('+')) return this.unary();
    return this.power();
  };
  Parser.prototype.power = function () {
    var b = this.postfix();
    if (this.eat('^')) return Math.pow(b, this.unary());
    return b;
  };
  Parser.prototype.postfix = function () {
    var v = this.primary();
    for (;;) {
      if (this.eat('!')) v = factorial(v);
      else if (this.eat('%')) v = v / 100;
      else return v;
    }
  };
  Parser.prototype.primary = function () {
    var rest = this.s.slice(this.i), m;
    if (this.eat('(')) { var v = this.expr(); if (!this.eat(')')) throw new Error(')'); return v; }
    m = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/.exec(rest);
    if (m) {
      this.i += m[0].length;
      var num = parseFloat(m[0]);
      var sm = /^(thousand|million|billion|trillion|bn|k|m|b|t)(?![a-z])/.exec(this.s.slice(this.i));
      if (sm) {
        this.i += sm[0].length;
        num *= { thousand: 1e3, k: 1e3, million: 1e6, m: 1e6, billion: 1e9, bn: 1e9, b: 1e9, trillion: 1e12, t: 1e12 }[sm[1]];
      }
      return num;
    }
    m = /^[a-z]+/.exec(rest);
    if (m) {
      var name = m[0];
      this.i += name.length;
      if (name === 'pi') return Math.PI;
      if (name === 'e' && this.peek() !== '(') return Math.E;
      var f = FUNCS[name];
      if (!f) throw new Error('unknown ' + name);
      if (!this.eat('(')) {
        if (name === 'sqrt') return Math.sqrt(this.postfix()); // allows √2
        throw new Error('(');
      }
      var args = [this.expr()];
      while (this.eat(',')) args.push(this.expr());
      if (!this.eat(')')) throw new Error(')');
      return f.apply(null, args);
    }
    throw new Error('unexpected');
  };
  function normalizeExpr(raw) {
    var s = String(raw == null ? '' : raw).trim().toLowerCase();
    s = s.replace(/[−–—]/g, '-').replace(/[×⋅·]/g, '*').replace(/÷/g, '/');
    s = s.replace(/√/g, 'sqrt').replace(/π/g, 'pi').replace(/²/g, '^2').replace(/³/g, '^3');
    s = s.replace(/^\s*(answer|ans|p|x)\s*[:=]\s*/, '');
    s = s.replace(/[~≈$€£]/g, '');
    s = s.replace(/(\d),(?=\d{3}(?!\d))/g, '$1');   // thousands separators
    // strip a trailing unit word ("17 minutes", "7.5°", "100 s", "2.5m L")
    s = s.replace(/\s*(minutes?|mins?|seconds?|secs?|s|hours?|hrs?|days?|nights?|dollars?|usd|cad|coins?|steps?|races?|weighings?|people|prisoners|floors?|drops?|times|degrees?|°|litres?|liters?|l|kg)\.?$/, '');
    s = s.replace(/\s+/g, '');
    return s;
  }
  function parseNumber(raw) {
    var s = normalizeExpr(raw);
    if (!s) return null;
    // a lone decimal comma like "0,25" (European) → 0.25
    if (/^-?\d+,\d+$/.test(s)) s = s.replace(',', '.');
    try {
      var p = new Parser(s);
      var v = p.expr();
      if (p.i !== s.length) return null;
      return (typeof v === 'number' && isFinite(v)) ? v : null;
    } catch (e) { return null; }
  }
  // Accept a plain decimal with ≥3 significant digits if it equals the true value rounded to that many places.
  function matchesRounded(raw, v) {
    var s = normalizeExpr(raw);
    var m = /^-?(\d*)\.(\d+)$/.exec(s);
    if (!m) return false;
    var sig = (m[1] + m[2]).replace(/^0+/, '').length;
    if (sig < 3) return false;
    var dp = m[2].length;
    var x = parseFloat(s);
    var r = Math.round(v * Math.pow(10, dp)) / Math.pow(10, dp);
    return Math.abs(r - x) < Math.pow(10, -dp) * 0.51;
  }
  function normText(s) {
    return String(s || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9.\-/ ]+/g, ' ').replace(/\s+/g, ' ').trim().replace(/^(the|a|an) /, '');
  }
  function checkNumeric(a, raw) {
    var x = parseNumber(raw);
    if (x === null) return { invalid: true };
    if (a.range) return { ok: x >= a.range[0] && x <= a.range[1], x: x, close: false };
    var v = a.value;
    var tol = Math.max(a.tolAbs || 0, (a.tolRel != null ? a.tolRel : (a.tolAbs ? 0 : 0.005)) * Math.abs(v), 1e-9);
    var ok = Math.abs(x - v) <= tol || matchesRounded(raw, v);
    var close = !ok && Math.abs(x - v) <= Math.max(0.05 * Math.abs(v), tol * 3);
    return { ok: ok, x: x, close: close };
  }
  function checkAnswer(p, raw) {
    var a = p.answer || {};
    if (a.type === 'numeric') return checkNumeric(a, raw);
    if (a.type === 'text') {
      var n = normText(raw);
      if (!n) return { invalid: true };
      var ok = (a.accept || []).some(function (t) { return normText(t) === n; });
      if (!ok) {
        // also accept numeric equivalence for text answers like "7"
        var x = parseNumber(raw);
        if (x !== null) ok = (a.accept || []).some(function (t) { var y = parseNumber(t); return y !== null && Math.abs(y - x) < 1e-9; });
      }
      return { ok: ok };
    }
    return { invalid: true };
  }
  function answerDisplay(p) {
    var a = p.answer || {};
    if (a.display) return a.display;
    if (a.type === 'numeric') return fmtNum(a.value, 6);
    if (a.type === 'choice') return a.options[a.correct];
    if (a.type === 'text') return (a.accept || [])[0] || '';
    return '';
  }

  /* ------------------------------------------------------------------ */
  /* Toasts, theme, install                                              */
  /* ------------------------------------------------------------------ */
  function toast(msg, actionLabel, onAction, ms) {
    var wrap = $('#toasts');
    if (!wrap) return;
    var el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = '<p>' + esc(msg) + '</p>';
    if (actionLabel) {
      var b = document.createElement('button');
      b.className = 'btn sm'; b.type = 'button'; b.textContent = actionLabel;
      b.addEventListener('click', function () { el.remove(); onAction && onAction(); });
      el.appendChild(b);
    }
    var x = document.createElement('button');
    x.className = 'btn sm'; x.type = 'button'; x.setAttribute('aria-label', 'Dismiss'); x.textContent = '✕';
    x.addEventListener('click', function () { el.remove(); });
    el.appendChild(x);
    wrap.appendChild(el);
    if (!actionLabel || ms) setTimeout(function () { el.remove(); }, ms || 4500);
  }

  function applyTheme() {
    var t = S.settings.theme;
    var root = document.documentElement;
    if (t === 'light' || t === 'dark') root.setAttribute('data-theme', t); else root.removeAttribute('data-theme');
    var btn = $('#themeBtn');
    if (btn) {
      btn.innerHTML = t === 'dark' ? ICONS.moon : t === 'light' ? ICONS.sun : ICONS.auto;
      btn.setAttribute('aria-label', 'Theme: ' + t + ' (click to change)');
      btn.title = 'Theme: ' + t;
    }
    var dark = t === 'dark' || (t === 'auto' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var meta = $('meta[name="theme-color"]:not([media])');
    if (meta) meta.setAttribute('content', dark ? '#0b1020' : '#f5f6fa');
  }
  function cycleTheme() {
    var order = ['auto', 'light', 'dark'];
    S.settings.theme = order[(order.indexOf(S.settings.theme) + 1) % 3];
    save(); applyTheme();
    toast('Theme: ' + S.settings.theme, null, null, 1500);
  }

  var deferredInstall = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredInstall = e;
    var b = $('#installBtn'); if (b) b.classList.remove('hidden');
  });
  window.addEventListener('appinstalled', function () {
    deferredInstall = null;
    var b = $('#installBtn'); if (b) b.classList.add('hidden');
    toast('Installed. You can launch it from your apps.');
  });
  function doInstall() {
    if (!deferredInstall) return;
    deferredInstall.prompt();
    deferredInstall.userChoice.then(function () { deferredInstall = null; $('#installBtn').classList.add('hidden'); }).catch(function () {});
  }
  function isStandalone() {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
  }
  function isIOS() {
    var ua = navigator.userAgent || '';
    return /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  /* ------------------------------------------------------------------ */
  /* Service worker: offline-ready toast + update prompt                 */
  /* ------------------------------------------------------------------ */
  var swReg = null, updateRequested = false;
  function promptUpdate(worker) {
    toast('A new version is available.', 'Update', function () {
      updateRequested = true;
      worker.postMessage({ type: 'SKIP_WAITING' });
    });
  }
  function registerSW() {
    if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
    navigator.serviceWorker.register('./sw.js', { scope: './' }).then(function (reg) {
      swReg = reg;
      if (reg.waiting && navigator.serviceWorker.controller) promptUpdate(reg.waiting);
      reg.addEventListener('updatefound', function () {
        var nw = reg.installing;
        if (!nw) return;
        nw.addEventListener('statechange', function () {
          if (nw.state === 'installed') {
            if (navigator.serviceWorker.controller) promptUpdate(nw);
            else toast('Offline ready — everything is cached and works without internet.');
          }
        });
      });
    }).catch(function (err) { console.warn('SW registration failed', err); });
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (updateRequested) { updateRequested = false; location.reload(); }
    });
  }
  function checkForUpdate() {
    if (!swReg) { toast('Updates are handled by the service worker (not available here).'); return; }
    swReg.update().then(function () {
      if (!swReg.waiting && !swReg.installing) toast('You have the latest version (' + APP_VERSION + ').');
    }).catch(function () { toast('Could not check for updates (offline?).'); });
  }

  /* ------------------------------------------------------------------ */
  /* Router                                                              */
  /* ------------------------------------------------------------------ */
  var cleanups = [];
  var ctl = null; // active keyboard controller {submit, hint, solution, next}
  function onCleanup(fn) { cleanups.push(fn); }
  function runCleanups() { while (cleanups.length) { try { cleanups.pop()(); } catch (e) { } } ctl = null; }

  var VIEWS = {};
  function route() {
    var h = (location.hash || '#home').slice(1);
    var parts = h.split('/');
    var name = parts[0] || 'home';
    if (!VIEWS[name]) name = 'home';
    runCleanups();
    var main = $('#view');
    main.classList.remove('view-enter');
    void main.offsetWidth;
    main.classList.add('view-enter');
    $all('.tabbar a').forEach(function (a) {
      if (a.getAttribute('data-view') === name) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    VIEWS[name](main, parts.slice(1));
    var titles = { home: 'Home', practice: 'Practice', review: 'Review', sprint: 'Mental math', drills: 'Probability drills', interview: 'Interview mode', stats: 'Stats', settings: 'Settings' };
    document.title = (titles[name] || 'Home') + ' · Stat Brainteaser';
    window.scrollTo(0, 0);
  }
  function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }

  function updateBadges() {
    var n = dueIds().length;
    $all('[data-due-badge]').forEach(function (b) { b.textContent = n; b.classList.toggle('hidden', n === 0); });
  }

  /* ------------------------------------------------------------------ */
  /* Problem card (shared by Practice, Review, Interview)               */
  /* ------------------------------------------------------------------ */
  function diffDots(d) {
    var s = '<span class="diff" title="Difficulty ' + d + '/3" aria-label="Difficulty ' + d + ' of 3">';
    for (var i = 1; i <= 3; i++) s += '<i class="' + (i <= d ? 'on' : '') + '"></i>';
    return s + '</span>';
  }
  function catBadge(cat) { return '<span class="badge cat" style="--cat: var(--c-' + esc(cat) + ')">' + esc(CAT_NAME[cat] || cat) + '</span>'; }
  function solutionHTML(p) {
    var sol = p.solution || '';
    // Only add a final answer line when the solution doesn't already end with one.
    var tail = sol.replace(/<[^>]+>/g, '').slice(-300);
    var needFinal = !/answer/i.test(tail);
    return '<div class="solution" id="sol-' + esc(p.id) + '">' +
      '<div class="key"><b>Key idea:</b> ' + (p.key || '') + '</div>' +
      '<h3>Solution</h3>' + sol +
      (needFinal ? '<p class="final">Answer: ' + answerDisplay(p) + '</p>' : '') + '</div>';
  }

  /*
   * opts: { mode: 'practice'|'review'|'interview', onResult(correct), onNext(), showSolutionAfter: bool,
   *         nextLabel, allowSolution }
   */
  function mountProblem(host, p, opts) {
    opts = opts || {};
    var a = p.answer || {};
    var st = { hints: 0, graded: false, revealed: false, correct: null };
    var letters = 'ABCDEFGH';
    var html = '<article class="card problem" aria-labelledby="pt-' + esc(p.id) + '">' +
      '<div class="problem-meta">' + catBadge(p.cat) + diffDots(p.diff) +
      (p.tags || []).slice(0, 4).map(function (t) { return '<span class="badge">' + esc(t) + '</span>'; }).join('') +
      '<span class="spacer"></span><span class="badge mono">' + esc(p.id) + '</span></div>' +
      '<h2 class="problem-title" id="pt-' + esc(p.id) + '">' + esc(p.title) + '</h2>' +
      '<div class="prompt">' + p.prompt + '</div>';
    if (a.type === 'numeric' || a.type === 'text') {
      var help = a.type === 'numeric'
        ? (a.range ? 'Estimate: a single number (2.5k, 3m, 1e6 OK).' : 'Fractions, decimals, % and expressions like 1/6+1/36 or C(10,3) are accepted.')
        : 'Type a short answer.';
      html += '<form class="answer-form" autocomplete="off" novalidate>' +
        '<label class="sr-only" for="ans-' + esc(p.id) + '">Your answer</label>' +
        '<input id="ans-' + esc(p.id) + '" type="text" ' + (a.type === 'numeric' ? 'inputmode="text" ' : '') + 'placeholder="Your answer" autocapitalize="off" spellcheck="false" enterkeyhint="done">' +
        '<button class="btn primary" type="submit">Submit</button></form>' +
        '<div class="answer-help">' + help + '</div>';
    } else if (a.type === 'choice') {
      html += '<div class="choices" role="group" aria-label="Answer choices">' + a.options.map(function (o, i) {
        return '<button type="button" class="choice" data-i="' + i + '"><span class="letter">' + letters[i] + '</span><span>' + o + '</span></button>';
      }).join('') + '</div>';
    } else {
      html += '<p class="answer-help">Open question: think it through (or write it down), then reveal the solution and grade yourself honestly.</p>';
    }
    html += '<div class="feedback" role="status" aria-live="polite"></div>' +
      '<div class="hints"></div>' +
      '<div class="actions">' +
      ((p.hints && p.hints.length) ? '<button type="button" class="btn" data-act="hint">Hint <span class="kbd">H</span></button>' : '') +
      (opts.allowSolution === false ? '' : '<button type="button" class="btn" data-act="solution">' + (a.type === 'self' ? 'Reveal solution' : 'Show solution') + ' <span class="kbd">S</span></button>') +
      '<span class="spacer"></span>' +
      (opts.onNext ? '<button type="button" class="btn primary hidden" data-act="next">' + esc(opts.nextLabel || 'Next') + ' <span class="kbd">N</span></button>' : '') +
      '</div><div class="self-wrap"></div><div class="sol-wrap"></div></article>';
    host.innerHTML = html;

    var card = host.querySelector('.problem');
    var fb = card.querySelector('.feedback');
    var input = card.querySelector('input');
    var nextBtn = card.querySelector('[data-act="next"]');
    var hintBtn = card.querySelector('[data-act="hint"]');
    var solBtn = card.querySelector('[data-act="solution"]');

    function feedback(kind, msg) { fb.className = 'feedback show ' + kind; fb.innerHTML = msg; }
    function showNext() { if (nextBtn) { nextBtn.classList.remove('hidden'); } }
    function revealSolution() {
      if (st.revealed) return;
      st.revealed = true;
      card.querySelector('.sol-wrap').innerHTML = solutionHTML(p);
      if (solBtn) solBtn.disabled = true;
    }
    function grade(correct, how) {
      if (st.graded) return;
      st.graded = true; st.correct = correct;
      recordAttempt(p.id, correct, { hints: st.hints });
      if (opts.onResult) opts.onResult(correct, how);
      showNext();
      if (opts.mode !== 'interview' || opts.showSolutionAfter) { /* solution handled below */ }
    }
    function submit() {
      if (a.type !== 'numeric' && a.type !== 'text') return;
      var raw = input.value;
      var r = checkAnswer(p, raw);
      if (r.invalid) { feedback('info', 'I couldn’t read that answer. Try a number, fraction (5/36), percent (12.5%) or expression.'); return; }
      if (st.graded) {
        feedback(r.ok ? 'ok' : 'bad', r.ok ? 'Correct (already graded for this attempt).' : 'Still not matching. The solution explains it.');
        return;
      }
      if (r.ok) {
        feedback('ok', '✓ Correct' + (a.range ? ' — within the accepted range.' : '.') + (opts.mode === 'interview' ? '' : ' Solution below.'));
        grade(true, 'answer');
        if (opts.mode !== 'interview') revealSolution();
      } else {
        var msg = '✗ Not quite' + (r.close ? ' — close! Check your precision/arithmetic.' : '.');
        if (opts.mode === 'interview') msg += ' Moving on is fine — solution in the summary.';
        else msg += ' Try again, take a hint, or show the solution.';
        feedback('bad', msg);
        grade(false, 'answer');
      }
    }
    function hint() {
      if (!p.hints || st.hints >= p.hints.length) return;
      var box = card.querySelector('.hints');
      var d = document.createElement('div');
      d.className = 'hint-box';
      d.innerHTML = '<p><b>Hint ' + (st.hints + 1) + ':</b> ' + p.hints[st.hints] + '</p>';
      box.appendChild(d);
      st.hints++;
      if (st.hints >= p.hints.length && hintBtn) hintBtn.disabled = true;
    }
    function solution() {
      if (opts.allowSolution === false || st.revealed) return;
      if (a.type === 'self') {
        revealSolution();
        if (!st.graded) {
          var sw = card.querySelector('.self-wrap');
          sw.innerHTML = '<div class="self-grade" role="group" aria-label="Grade yourself">' +
            '<span class="muted small" style="align-self:center">How did you do?</span>' +
            '<button type="button" class="btn" data-g="1">✓ I had it</button>' +
            '<button type="button" class="btn" data-g="0">✗ I missed it</button></div>';
          sw.querySelectorAll('[data-g]').forEach(function (b) {
            b.addEventListener('click', function () {
              var ok = b.getAttribute('data-g') === '1';
              grade(ok, 'self');
              sw.innerHTML = '';
              feedback(ok ? 'ok' : 'bad', ok ? 'Marked as solved.' : 'Marked as missed — it will come back in Review.');
            });
          });
        }
        return;
      }
      if (!st.graded) {
        grade(false, 'revealed');
        feedback('info', 'Solution revealed — counted as a miss so it comes back in Review.');
      }
      revealSolution();
      if (nextBtn) showNext();
    }
    function choose(i) {
      if (st.graded) return;
      var btns = card.querySelectorAll('.choice');
      btns.forEach(function (b, j) {
        b.disabled = true;
        if (j === a.correct) b.classList.add('correct');
        else if (j === i) b.classList.add('wrong');
      });
      var ok = i === a.correct;
      feedback(ok ? 'ok' : 'bad', ok ? '✓ Correct.' : '✗ Not quite — the answer is ' + letters[a.correct] + '.');
      grade(ok, 'choice');
      if (opts.mode !== 'interview') revealSolution();
    }

    var form = card.querySelector('form');
    if (form) form.addEventListener('submit', function (e) { e.preventDefault(); submit(); });
    card.querySelectorAll('.choice').forEach(function (b) { b.addEventListener('click', function () { choose(+b.getAttribute('data-i')); }); });
    if (hintBtn) hintBtn.addEventListener('click', hint);
    if (solBtn) solBtn.addEventListener('click', solution);
    if (nextBtn) nextBtn.addEventListener('click', function () { opts.onNext(); });
    if (input && opts.autofocus !== false && window.matchMedia && window.matchMedia('(hover: hover)').matches) input.focus();

    return {
      submit: submit, hint: hint, solution: solution,
      next: function () { if (opts.onNext && (st.graded || opts.mode === 'practice')) opts.onNext(); },
      choose: function (i) { if (a.type === 'choice' && i < a.options.length) choose(i); },
      state: st, grade: grade, revealSolution: revealSolution
    };
  }

  /* ------------------------------------------------------------------ */
  /* Home                                                                */
  /* ------------------------------------------------------------------ */
  function weakestCategory() {
    var best = null;
    CATS.forEach(function (c) {
      var n = 0, k = 0;
      PROBLEMS.forEach(function (p) { if (p.cat === c.id && S.attempts[p.id]) { n += S.attempts[p.id].n; k += S.attempts[p.id].c; } });
      var score = n >= 3 ? k / n : null;
      if (score !== null && (!best || score < best.score)) best = { id: c.id, score: score, n: n };
    });
    if (best) return best;
    // nothing with enough data: least attempted category
    var least = null;
    CATS.forEach(function (c) {
      var n = PROBLEMS.filter(function (p) { return p.cat === c.id && S.attempts[p.id]; }).length;
      if (!least || n < least.n) least = { id: c.id, score: null, n: n };
    });
    return least;
  }

  VIEWS.home = function (main) {
    var due = dueIds().length;
    var sk = streakInfo();
    var solved = solvedCount();
    var weak = weakestCategory();
    var html = '';
    if (isIOS() && !isStandalone() && !S.ui.iosHintDismissed) {
      html += '<div class="banner" id="iosHint"><p><b>Install on iPhone:</b> tap <b>Share</b> <span aria-hidden="true">⬆︎</span> then <b>Add to Home Screen</b>. It then works fully offline.</p>' +
        '<button class="btn sm ghost" type="button" id="iosHintX" aria-label="Dismiss">✕</button></div>';
    }
    html += '<div class="page-head"><div><h1>Train like the interview is tomorrow.</h1>' +
      '<p class="muted">Probability, statistics, brainteasers and mental math — offline, on any device.</p></div></div>' +
      '<div class="hero">' +
      '<div class="stat-tile accent"><div class="v">' + due + '</div><div class="l">Due today</div></div>' +
      '<div class="stat-tile"><div class="v">' + sk.cur + '<span class="small muted"> d</span></div><div class="l">Streak</div></div>' +
      '<div class="stat-tile"><div class="v">' + solved + '<span class="small muted">/' + PROBLEMS.length + '</span></div><div class="l">Solved</div></div>' +
      '<div class="stat-tile"><div class="v">' + bestSprintText() + '</div><div class="l">Best sprint</div></div>' +
      '</div>';
    if (due > 0) {
      html += '<div class="card row"><div><h3 style="margin:0">' + due + ' problem' + (due === 1 ? '' : 's') + ' due for review</h3><p class="muted small" style="margin:0">Spaced repetition brings back what you missed.</p></div><span class="spacer"></span><a class="btn primary" href="#review">Start review</a></div>';
    }
    html += '<div class="mode-grid">' +
      modeCard('#practice', 'practice', 'Practice', PROBLEMS.length + ' curated problems. Filter by category, difficulty and tag.') +
      modeCard('#review', 'review', 'Review', 'Leitner spaced repetition. ' + (due ? due + ' due today.' : 'Nothing due — nice.')) +
      modeCard('#sprint', 'sprint', 'Mental math sprint', 'Zetamac-style timed arithmetic, plus a quant variant.') +
      modeCard('#drills', 'drills', 'Probability drills', 'Unlimited generated questions with exact answers.') +
      modeCard('#interview', 'interview', 'Interview mode', '5 mixed problems against the clock, summary at the end.') +
      modeCard('#stats', 'stats', 'Stats', 'Accuracy by category, streaks, sprint trend.') +
      '</div>';
    if (weak) {
      html += '<div class="card" style="margin-top:1rem"><div class="row"><div><div class="label">Suggested focus</div><h3 style="margin:.2rem 0 0">' + esc(CAT_NAME[weak.id]) + '</h3>' +
        '<p class="muted small" style="margin:0">' + (weak.score !== null ? 'Your lowest accuracy so far (' + pct(weak.score) + ').' : 'The category you have practiced least.') + '</p></div>' +
        '<span class="spacer"></span><button class="btn" type="button" id="weakGo">Practice ' + esc(CAT_NAME[weak.id]) + '</button></div></div>';
    }
    main.innerHTML = html;
    var x = $('#iosHintX');
    if (x) x.addEventListener('click', function () { S.ui.iosHintDismissed = true; save(); $('#iosHint').remove(); });
    var wg = $('#weakGo');
    if (wg) wg.addEventListener('click', function () { practiceCategory(weak.id); });
  };
  function practiceCategory(cat) {
    S.settings.filters = { cats: [cat], diffs: [], tag: '', status: 'all' };
    save(); go('#practice');
  }
  function modeCard(href, icon, title, desc) {
    return '<a class="mode-card" href="' + href + '"><span class="ic">' + ICONS[icon] + '</span><span><h3>' + esc(title) + '</h3><p>' + esc(desc) + '</p></span></a>';
  }
  function bestSprintText() {
    var h = S.sprint.history;
    if (!h.length) return '—';
    var b = h.filter(function (r) { return r.key === 'classic-120'; });
    if (b.length) return Math.max.apply(null, b.map(function (r) { return r.score; }));
    return Math.max.apply(null, h.map(function (r) { return r.score; }));
  }

  /* ------------------------------------------------------------------ */
  /* Practice                                                            */
  /* ------------------------------------------------------------------ */
  function filtered(f) {
    return PROBLEMS.filter(function (p) {
      if (f.cats.length && f.cats.indexOf(p.cat) < 0) return false;
      if (f.diffs.length && f.diffs.indexOf(p.diff) < 0) return false;
      if (f.tag && (p.tags || []).indexOf(f.tag) < 0) return false;
      var at = S.attempts[p.id];
      if (f.status === 'new' && at) return false;
      if (f.status === 'missed' && !(at && at.lastOk === false)) return false;
      if (f.status === 'solved' && !(at && at.c > 0)) return false;
      if (f.status === 'unsolved' && at && at.c > 0) return false;
      return true;
    });
  }
  var practiceCurrent = null;
  VIEWS.practice = function (main, args) {
    var f = S.settings.filters;
    if (!Array.isArray(f.cats)) f.cats = [];
    if (!Array.isArray(f.diffs)) f.diffs = [];
    main.innerHTML =
      '<div class="page-head"><div><h1>Practice</h1><p class="muted" id="matchCount"></p></div>' +
      '<div class="row"><button class="btn" type="button" id="browseBtn" aria-expanded="false" aria-controls="browse">Browse</button>' +
      '<button class="btn primary" type="button" id="nextBtn">Next problem <span class="kbd">N</span></button></div></div>' +
      '<details class="card filter-details" id="filterBox"' + (f.cats.length || f.diffs.length || f.tag || f.status !== 'all' ? ' open' : '') + '>' +
      '<summary><span>Filters <span class="muted small" id="filterSummary"></span></span><span class="chev" aria-hidden="true">▾</span></summary>' +
      '<div class="filters" style="margin-top:.6rem">' +
      '<div class="filter-row"><span class="label" id="lblCat">Category</span><div class="chips" role="group" aria-labelledby="lblCat">' +
      CATS.map(function (c) { return '<button type="button" class="chip" data-cat="' + c.id + '" aria-pressed="' + (f.cats.indexOf(c.id) >= 0) + '" style="--cat: var(--c-' + c.id + ')"><span class="dot" style="color:var(--c-' + c.id + ')"></span>' + esc(c.name) + '</button>'; }).join('') +
      '</div></div>' +
      '<div class="filter-row"><span class="label" id="lblDiff">Difficulty</span><div class="chips" role="group" aria-labelledby="lblDiff">' +
      [1, 2, 3].map(function (d) { return '<button type="button" class="chip" data-diff="' + d + '" aria-pressed="' + (f.diffs.indexOf(d) >= 0) + '">' + diffDots(d) + ' ' + DIFF_NAME[d] + '</button>'; }).join('') +
      '</div></div>' +
      '<div class="select-row"><div class="filter-row"><label for="tagSel">Tag</label><select id="tagSel"></select></div>' +
      '<div class="filter-row"><label for="statusSel">Status</label><select id="statusSel">' +
      [['all', 'All'], ['new', 'Not attempted'], ['unsolved', 'Not yet solved'], ['missed', 'Missed last time'], ['solved', 'Solved']].map(function (o) {
        return '<option value="' + o[0] + '"' + (f.status === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
      }).join('') + '</select></div></div>' +
      '<div><button type="button" class="btn sm ghost" id="clearF">Clear filters</button></div>' +
      '</div></details>' +
      '<div class="card hidden" id="browse"><ul class="plist" id="plist"></ul></div>' +
      '<div id="pHost"></div>' +
      '<p class="kbd-help muted small">Shortcuts: <span class="kbd">Enter</span> submit · <span class="kbd">H</span> hint · <span class="kbd">S</span> solution · <span class="kbd">N</span> next · <span class="kbd">1</span>–<span class="kbd">4</span> choose option</p>';

    function refreshTags() {
      var base = filtered({ cats: f.cats, diffs: f.diffs, tag: '', status: 'all' });
      var tags = {};
      base.forEach(function (p) { (p.tags || []).forEach(function (t) { tags[t] = (tags[t] || 0) + 1; }); });
      var keys = Object.keys(tags).sort();
      if (f.tag && !tags[f.tag]) f.tag = '';
      $('#tagSel').innerHTML = '<option value="">All tags</option>' + keys.map(function (t) {
        return '<option value="' + esc(t) + '"' + (f.tag === t ? ' selected' : '') + '>' + esc(t) + ' (' + tags[t] + ')</option>';
      }).join('');
    }
    function refreshList() {
      var list = filtered(f);
      $('#matchCount').textContent = list.length + ' of ' + PROBLEMS.length + ' problems match';
      var bits = [];
      if (f.cats.length) bits.push(f.cats.map(function (c) { return CAT_NAME[c]; }).join(', '));
      if (f.diffs.length) bits.push('difficulty ' + f.diffs.join('/'));
      if (f.tag) bits.push('#' + f.tag);
      if (f.status !== 'all') bits.push(f.status);
      $('#filterSummary').textContent = bits.length ? '· ' + bits.join(' · ') : '';
      $('#plist').innerHTML = list.map(function (p) {
        var at = S.attempts[p.id];
        var cls = at ? (at.lastOk ? 'ok' : 'bad') : '';
        return '<li><button type="button" data-id="' + esc(p.id) + '"><span class="st ' + cls + '" aria-label="' + (at ? (at.lastOk ? 'solved' : 'missed') : 'new') + '"></span>' +
          '<span class="t">' + esc(p.title) + '</span>' + diffDots(p.diff) + '<span class="badge cat" style="--cat: var(--c-' + p.cat + ')">' + esc(CAT_NAME[p.cat]) + '</span></button></li>';
      }).join('') || '<li class="muted small">No problems match these filters.</li>';
      return list;
    }
    function persist() { S.settings.filters = f; save(); }
    function open(p) {
      practiceCurrent = p.id;
      if (location.hash !== '#practice/' + p.id) history.replaceState(null, '', '#practice/' + p.id);
      ctl = mountProblem($('#pHost'), p, { mode: 'practice', onNext: nextProblem, nextLabel: 'Next problem' });
    }
    function nextProblem() {
      var list = filtered(f);
      if (!list.length) {
        $('#pHost').innerHTML = '<div class="card empty"><p><b>No problems match.</b></p><p class="muted">Loosen the filters to keep going.</p></div>';
        return;
      }
      var pool = list.filter(function (p) { return p.id !== practiceCurrent; });
      if (!pool.length) pool = list;
      var fresh = pool.filter(function (p) { return !S.attempts[p.id]; });
      var unsolved = pool.filter(function (p) { return !(S.attempts[p.id] && S.attempts[p.id].c > 0); });
      open(pick(fresh.length ? fresh : unsolved.length ? unsolved : pool));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    $all('[data-cat]', main).forEach(function (b) {
      b.addEventListener('click', function () {
        var c = b.getAttribute('data-cat'), i = f.cats.indexOf(c);
        if (i >= 0) f.cats.splice(i, 1); else f.cats.push(c);
        b.setAttribute('aria-pressed', String(i < 0));
        persist(); refreshTags(); refreshList();
      });
    });
    $all('[data-diff]', main).forEach(function (b) {
      b.addEventListener('click', function () {
        var d = +b.getAttribute('data-diff'), i = f.diffs.indexOf(d);
        if (i >= 0) f.diffs.splice(i, 1); else f.diffs.push(d);
        b.setAttribute('aria-pressed', String(i < 0));
        persist(); refreshTags(); refreshList();
      });
    });
    $('#tagSel').addEventListener('change', function (e) { f.tag = e.target.value; persist(); refreshList(); });
    $('#statusSel').addEventListener('change', function (e) { f.status = e.target.value; persist(); refreshList(); });
    $('#clearF').addEventListener('click', function () {
      f = S.settings.filters = { cats: [], diffs: [], tag: '', status: 'all' }; save(); route();
    });
    $('#nextBtn').addEventListener('click', nextProblem);
    $('#browseBtn').addEventListener('click', function () {
      var b = $('#browse'); var hidden = b.classList.toggle('hidden');
      this.setAttribute('aria-expanded', String(!hidden));
    });
    $('#plist').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-id]');
      if (!b) return;
      open(BY_ID[b.getAttribute('data-id')]);
      $('#browse').classList.add('hidden'); $('#browseBtn').setAttribute('aria-expanded', 'false');
      $('#pHost').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    refreshTags(); refreshList();
    var want = args[0] && BY_ID[args[0]] ? BY_ID[args[0]] : null;
    if (want) open(want);
    else nextProblem();
  };

  /* ------------------------------------------------------------------ */
  /* Spaced-repetition review                                            */
  /* ------------------------------------------------------------------ */
  VIEWS.review = function (main) {
    var queue = dueIds();
    var done = 0, right = 0, total = queue.length;
    var requeued = {};
    main.innerHTML = '<div class="page-head"><div><h1>Review</h1><p class="muted" id="revSub"></p></div></div><div id="rHost"></div>' +
      '<p class="muted small">Leitner boxes: a correct answer moves a problem up a box (next review in 1 → 3 → 7 → 16 → 35 days); a miss sends it back to box 1 and it reappears at the end of this session.</p>';
    function sub() { $('#revSub').textContent = total ? (done + ' reviewed · ' + right + ' correct · ' + queue.length + ' left') : ''; }
    function nextOne() {
      sub();
      if (!queue.length) {
        var upcoming = Object.keys(S.srs).filter(function (id) { return BY_ID[id]; }).map(function (id) { return S.srs[id].due; }).sort()[0];
        $('#rHost').innerHTML = '<div class="card empty">' + ICONS.check +
          (total ? '<h2>Review complete</h2><p class="muted">' + right + ' of ' + done + ' correct this session.</p>' : '<h2>Nothing due today</h2><p class="muted">Problems you attempt in Practice or Interview mode are scheduled here automatically.</p>') +
          (upcoming ? '<p class="muted small">Next review due: ' + esc(upcoming) + '</p>' : '') +
          '<div class="row" style="justify-content:center"><a class="btn primary" href="#practice">Practice new problems</a><a class="btn" href="#drills">Quick drills</a></div></div>';
        return;
      }
      var id = queue.shift();
      var p = BY_ID[id];
      var box = (S.srs[id] || {}).box || 1;
      $('#rHost').innerHTML = '<p class="muted small">Box ' + box + ' of 5</p><div id="rCard"></div>';
      ctl = mountProblem($('#rCard'), p, {
        mode: 'review', nextLabel: queue.length ? 'Next due' : 'Finish',
        onResult: function (ok) {
          done++; if (ok) right++;
          if (!ok && !requeued[id]) { requeued[id] = true; queue.push(id); }
          sub();
        },
        onNext: nextOne
      });
    }
    nextOne();
  };

  /* ------------------------------------------------------------------ */
  /* Mental math sprint                                                  */
  /* ------------------------------------------------------------------ */
  function sprintKey(cfg) {
    var d = defaultState().settings.sprint;
    var custom = cfg.mode === 'classic' && (JSON.stringify(cfg.ops) !== JSON.stringify(d.ops) ||
      JSON.stringify([cfg.addA, cfg.addB, cfg.mulA, cfg.mulB]) !== JSON.stringify([d.addA, d.addB, d.mulA, d.mulB]));
    return cfg.mode + '-' + cfg.dur + (custom ? '-custom' : '');
  }
  function genClassic(cfg) {
    var ops = Object.keys(cfg.ops).filter(function (k) { return cfg.ops[k]; });
    if (!ops.length) ops = ['add'];
    var op = pick(ops), a, b;
    function r(range) { var lo = Math.min(range[0], range[1]), hi = Math.max(range[0], range[1]); return randInt(lo, hi); }
    if (op === 'add') { a = r(cfg.addA); b = r(cfg.addB); return { q: a + ' + ' + b, ans: a + b, op: op }; }
    if (op === 'sub') { a = r(cfg.addA); b = r(cfg.addB); return { q: (a + b) + ' − ' + a, ans: b, op: op }; }
    if (op === 'mul') { a = r(cfg.mulA); b = r(cfg.mulB); return { q: a + ' × ' + b, ans: a * b, op: op }; }
    a = r(cfg.mulA); b = r(cfg.mulB); if (a === 0) a = 1;
    return { q: (a * b) + ' ÷ ' + a, ans: b, op: 'div' };
  }
  function genQuant() {
    var t = pick(['pct', 'pct', 'frac', 'frac', 'sq', 'mul', 'dec', 'chg', 'mul11']);
    var a, b, r;
    if (t === 'pct') {
      for (;;) {
        a = pick([5, 10, 12.5, 15, 20, 25, 30, 35, 40, 45, 60, 75, 80, 120, 150]);
        b = randInt(2, 60) * pick([4, 8, 10, 20, 40]);
        r = a * b / 100;
        if (Math.abs(r * 10 - Math.round(r * 10)) < 1e-9) break;
      }
      return { q: a + '% of ' + b, ans: Math.round(r * 10) / 10, op: 'pct' };
    }
    if (t === 'frac') {
      b = pick([3, 6, 7, 8, 9, 11, 12, 16, 15, 14]);
      do { a = randInt(1, b - 1); } while (gcd(a, b) !== 1);
      return { q: a + '/' + b + ' ≈ ? (3 dp)', ans: a / b, tol: 0.00051, op: 'frac' };
    }
    if (t === 'sq') { a = randInt(11, 35); return { q: a + '²', ans: a * a, op: 'sq' }; }
    if (t === 'mul') { a = randInt(12, 99); b = randInt(12, 19); return { q: a + ' × ' + b, ans: a * b, op: 'mul' }; }
    if (t === 'mul11') { a = randInt(12, 99); b = pick([11, 25, 15, 5, 50]); return { q: a + ' × ' + b, ans: a * b, op: 'mul' }; }
    if (t === 'dec') {
      a = randInt(1, 9) / 10; b = pick([randInt(1, 9) / 10, randInt(2, 40) / 100 * 5, randInt(11, 99) / 10]);
      b = Math.round(b * 100) / 100;
      return { q: a + ' × ' + b, ans: Math.round(a * b * 10000) / 10000, op: 'dec' };
    }
    // percent change
    for (;;) {
      a = randInt(2, 40) * 5; var p = pick([5, 10, 15, 20, 25, 30, 40, 50, 60, 75, 80, 100, 150]); // positive only: iOS decimal keypad has no minus key
      b = a * (1 + p / 100);
      if (Number.isInteger(b) && b > 0) return { q: '% change ' + a + ' → ' + b, ans: p, op: 'chg' };
    }
  }
  function sparkline(values, w, h, label) {
    w = w || 300; h = h || 56;
    if (!values.length) return '<p class="muted small">No data yet.</p>';
    var max = Math.max.apply(null, values), min = Math.min.apply(null, values);
    if (max === min) { max += 1; min = Math.max(0, min - 1); }
    var n = values.length, padY = 6;
    var pts = values.map(function (v, i) {
      var x = n === 1 ? w / 2 : (i * (w - 8) / (n - 1)) + 4;
      var y = h - padY - (v - min) / (max - min) * (h - 2 * padY);
      return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
    });
    var line = pts.map(function (p) { return p.join(','); }).join(' ');
    var area = 'M' + pts[0][0] + ',' + h + ' L' + line.replace(/ /g, ' L') + ' L' + pts[n - 1][0] + ',' + h + ' Z';
    var last = pts[n - 1];
    return '<svg class="spark" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" role="img" aria-label="' + esc(label || 'Trend') + ': ' + values.join(', ') + '">' +
      '<path class="area" d="' + area + '"/><polyline class="line" points="' + line + '" vector-effect="non-scaling-stroke"/>' +
      '<circle class="dot" cx="' + last[0] + '" cy="' + last[1] + '" r="3"/></svg>';
  }

  VIEWS.sprint = function (main) {
    var cfg = S.settings.sprint;
    var timer = null;
    onCleanup(function () { if (timer) clearInterval(timer); });

    function setup() {
      ctl = null;
      var key = sprintKey(cfg);
      var hist = S.sprint.history.filter(function (r) { return r.key === key; });
      var best = hist.length ? Math.max.apply(null, hist.map(function (r) { return r.score; })) : null;
      var opRow = function (k, label, rangeA, rangeB, sym) {
        return '<div class="op-row"><label class="check"><input type="checkbox" data-op="' + k + '"' + (cfg.ops[k] ? ' checked' : '') + '> ' + label + '</label>' +
          (rangeA
            ? '<div class="ranges"><span class="rl">1st</span><input type="number" data-r="' + rangeA + '.0" value="' + cfg[rangeA][0] + '" aria-label="' + label + ' first operand min"> – <input type="number" data-r="' + rangeA + '.1" value="' + cfg[rangeA][1] + '" aria-label="' + label + ' first operand max"></div>' +
              '<div class="ranges"><span class="rl">' + sym + ' 2nd</span><input type="number" data-r="' + rangeB + '.0" value="' + cfg[rangeB][0] + '" aria-label="' + label + ' second operand min"> – <input type="number" data-r="' + rangeB + '.1" value="' + cfg[rangeB][1] + '" aria-label="' + label + ' second operand max"></div>'
            : '<div class="ranges"><span>inverse of ' + (k === 'sub' ? 'addition' : 'multiplication') + '</span></div>') + '</div>';
      };
      main.innerHTML = '<div class="page-head"><div><h1>Mental math sprint</h1><p class="muted">Answers auto-submit when correct. <span class="kbd">Esc</span> skips.</p></div></div>' +
        '<div class="card stack">' +
        '<div class="row"><span class="label" style="min-width:70px">Mode</span><div class="seg" role="group" aria-label="Mode">' +
        '<button type="button" data-mode="classic" aria-pressed="' + (cfg.mode === 'classic') + '">Classic</button>' +
        '<button type="button" data-mode="quant" aria-pressed="' + (cfg.mode === 'quant') + '">Quant</button></div></div>' +
        '<div class="row"><span class="label" style="min-width:70px">Duration</span><div class="seg" role="group" aria-label="Duration">' +
        [30, 60, 120, 180].map(function (d) { return '<button type="button" data-dur="' + d + '" aria-pressed="' + (cfg.dur === d) + '">' + d + 's</button>'; }).join('') + '</div></div>' +
        (cfg.mode === 'classic'
          ? '<div class="ops-grid">' + opRow('add', 'Addition', 'addA', 'addB', '+') + opRow('sub', 'Subtraction') + opRow('mul', 'Multiplication', 'mulA', 'mulB', '×') + opRow('div', 'Division') + '</div>' +
            '<div><button type="button" class="btn sm ghost" id="resetRanges">Reset to Zetamac defaults</button></div>'
          : '<p class="muted small" style="margin:0">Quant mix: percentages (15% of 240), fractions to 3 decimals (5/16), squares to 35², 2-digit × teens, decimals (0.7 × 0.35), % change (80 → 100 = 25).</p>') +
        '<button type="button" class="btn primary block" id="startBtn">Start ' + cfg.dur + 's sprint <span class="kbd">Enter</span></button>' +
        '</div>' +
        '<div class="card"><div class="row"><h3 style="margin:0">History · ' + esc(key) + '</h3><span class="spacer"></span><span class="muted small">Best: <b>' + (best === null ? '—' : best) + '</b> · ' + hist.length + ' runs</span></div>' +
        sparkline(hist.slice(-30).map(function (r) { return r.score; }), 300, 56, 'Recent scores') + '</div>';

      $all('[data-mode]', main).forEach(function (b) { b.addEventListener('click', function () { cfg.mode = b.getAttribute('data-mode'); save(); setup(); }); });
      $all('[data-dur]', main).forEach(function (b) { b.addEventListener('click', function () { cfg.dur = +b.getAttribute('data-dur'); save(); setup(); }); });
      $all('[data-op]', main).forEach(function (c) { c.addEventListener('change', function () { cfg.ops[c.getAttribute('data-op')] = c.checked; save(); }); });
      $all('[data-r]', main).forEach(function (inp) {
        inp.addEventListener('change', function () {
          var parts = inp.getAttribute('data-r').split('.');
          var v = parseInt(inp.value, 10);
          if (isFinite(v)) { cfg[parts[0]][+parts[1]] = Math.max(0, Math.min(9999, v)); save(); }
        });
      });
      var rr = $('#resetRanges');
      if (rr) rr.addEventListener('click', function () {
        var d = defaultState().settings.sprint;
        cfg.ops = d.ops; cfg.addA = d.addA; cfg.addB = d.addB; cfg.mulA = d.mulA; cfg.mulB = d.mulB; save(); setup();
      });
      $('#startBtn').addEventListener('click', run);
      ctl = { submit: run };
    }

    function run() {
      var key = sprintKey(cfg);
      var score = 0, skipped = 0, wrongKeys = 0, q = null;
      var end = Date.now() + cfg.dur * 1000;
      main.innerHTML = '<div class="card sprint-stage">' +
        '<div class="sprint-top"><span>Score <span id="spScore">0</span></span><span id="spTime" aria-live="off">' + fmtTime(cfg.dur) + '</span></div>' +
        '<div class="timebar" id="spBar"><div></div></div>' +
        '<div class="sprint-q" id="spQ" aria-live="polite"></div>' +
        '<label class="sr-only" for="spIn">Answer</label>' +
        '<input id="spIn" class="sprint-input" type="text" inputmode="decimal" autocomplete="off" autocapitalize="off" spellcheck="false">' +
        '<div class="row" style="justify-content:center;margin-top:1rem"><button type="button" class="btn" id="spSkip">Skip <span class="kbd">Esc</span></button>' +
        '<button type="button" class="btn ghost" id="spQuit">End</button></div></div>';
      var inp = $('#spIn');
      function nextQ() {
        q = cfg.mode === 'quant' ? genQuant() : genClassic(cfg);
        $('#spQ').textContent = q.q;
        inp.value = ''; inp.focus();
      }
      inp.addEventListener('input', function () {
        var s = inp.value.trim();
        if (!s || s === '-' || s === '.') return;
        var x = parseNumber(s);
        if (x === null) return;
        var ok = q.tol ? (Math.abs(x - q.ans) <= q.tol && /\.\d{2,}$/.test(s)) || Math.abs(x - q.ans) < 1e-9 : Math.abs(x - q.ans) < 1e-9;
        if (ok) {
          score++; $('#spScore').textContent = score;
          inp.classList.add('flash-ok'); setTimeout(function () { inp.classList.remove('flash-ok'); }, 150);
          nextQ();
        } else if (s.length >= String(q.ans).length + 2) { wrongKeys++; }
      });
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { e.preventDefault(); skipped++; nextQ(); }
        if (e.key === 'Enter') { e.preventDefault(); }
      });
      $('#spSkip').addEventListener('click', function () { skipped++; nextQ(); });
      $('#spQuit').addEventListener('click', function () { finish(true); });
      function tick() {
        var left = (end - Date.now()) / 1000;
        $('#spTime').textContent = fmtTime(left);
        var bar = $('#spBar');
        bar.firstChild.style.width = Math.max(0, left / cfg.dur * 100) + '%';
        bar.classList.toggle('low', left <= 10);
        if (left <= 0) finish(false);
      }
      function finish(aborted) {
        clearInterval(timer); timer = null;
        var prev = S.sprint.history.filter(function (r) { return r.key === key; });
        var prevBest = prev.length ? Math.max.apply(null, prev.map(function (r) { return r.score; })) : null;
        if (!aborted) {
          S.sprint.history.push({ t: Date.now(), d: today(), key: key, mode: cfg.mode, dur: cfg.dur, score: score, skipped: skipped });
          if (S.sprint.history.length > 1000) S.sprint.history = S.sprint.history.slice(-1000);
          markDay(); save();
        }
        var isBest = !aborted && (prevBest === null || score > prevBest);
        main.innerHTML = '<div class="card sprint-stage">' +
          '<div class="label">' + (aborted ? 'Ended early (not saved)' : 'Final score') + '</div>' +
          '<div class="big-score" style="margin:.5rem 0">' + score + '</div>' +
          '<p class="muted">' + esc(key) + ' · ' + skipped + ' skipped' + (isBest ? ' · <b style="color:var(--ok)">New best!</b>' : prevBest !== null ? ' · best ' + prevBest : '') + '</p>' +
          '<div class="row" style="justify-content:center"><button class="btn primary" type="button" id="again">Again <span class="kbd">Enter</span></button><button class="btn" type="button" id="toSetup">Settings</button></div></div>';
        $('#again').addEventListener('click', run);
        $('#toSetup').addEventListener('click', setup);
        ctl = { submit: run };
        if (!aborted) $('#again').focus();
      }
      ctl = null;
      nextQ();
      timer = setInterval(tick, 200);
    }
    setup();
  };

  /* ------------------------------------------------------------------ */
  /* Probability drills (procedurally generated, exact answers)          */
  /* ------------------------------------------------------------------ */
  function Frac(n, d) { if (d < 0) { n = -n; d = -d; } var g = gcd(n, d); this.n = n / g; this.d = d / g; }
  Frac.prototype.val = function () { return this.n / this.d; };
  Frac.prototype.str = function () { return this.d === 1 ? String(this.n) : this.n + '/' + this.d; };
  function F(n, d) { return new Frac(n, d == null ? 1 : d); }
  function fracDisplay(fr, dp) { return fr.d === 1 ? String(fr.n) : fr.str() + ' ≈ ' + fmtNum(fr.val(), dp || 4); }

  var DRILLS = {
    dice2: {
      name: 'Two-dice sums', gen: function () {
        var k = randInt(2, 12), ways = 6 - Math.abs(k - 7), fr = F(ways, 36);
        return { prompt: 'Two fair dice are rolled. What is P(sum = ' + k + ')?', fr: fr,
          explain: 'There are ' + ways + ' ordered outcomes with sum ' + k + ' out of 36 (count is 6 − |k − 7|).' };
      }
    },
    dice3: {
      name: 'Three-dice sums', gen: function () {
        var k = randInt(3, 18), w = 0;
        for (var a = 1; a <= 6; a++) for (var b = 1; b <= 6; b++) for (var c = 1; c <= 6; c++) if (a + b + c === k) w++;
        return { prompt: 'Three fair dice are rolled. What is P(sum = ' + k + ')?', fr: F(w, 216),
          explain: w + ' of the 216 ordered outcomes sum to ' + k + '. Tip: the distribution is symmetric about 10.5, so P(' + k + ') = P(' + (21 - k) + ').' };
      }
    },
    atleast: {
      name: 'At least one', gen: function () {
        var n = randInt(2, 7), face = randInt(1, 6);
        var fr = F(Math.pow(6, n) - Math.pow(5, n), Math.pow(6, n));
        return { prompt: 'A fair die is rolled ' + n + ' times. What is P(at least one ' + face + ')?', fr: fr,
          explain: 'Complement: P(no ' + face + ') = (5/6)^' + n + '. So the answer is 1 − (5/6)^' + n + ' = ' + fracDisplay(fr) + '.' };
      }
    },
    binom: {
      name: 'Binomial P(X = k)', gen: function () {
        var n = randInt(3, 8), k = randInt(0, n);
        var p = pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [1, 6]]);
        var num = choose(n, k) * Math.pow(p[0], k) * Math.pow(p[1] - p[0], n - k), den = Math.pow(p[1], n);
        var fr = F(num, den);
        return { prompt: 'X ~ Binomial(n = ' + n + ', p = ' + p[0] + '/' + p[1] + '). What is P(X = ' + k + ')?', fr: fr,
          explain: 'P(X = k) = C(n,k) p^k (1−p)^(n−k) = C(' + n + ',' + k + ')·(' + p[0] + '/' + p[1] + ')^' + k + '·(' + (p[1] - p[0]) + '/' + p[1] + ')^' + (n - k) + ' = ' + fracDisplay(fr, 5) + '.' };
      }
    },
    maxdice: {
      name: 'E[max] / E[min] of two dice', gen: function () {
        var n = pick([4, 6, 6, 8, 10, 12, 20]), isMax = Math.random() < 0.6;
        var num = 0; for (var k = 1; k <= n; k++) num += k * (2 * k - 1);
        var emax = F(num, n * n);
        var fr = isMax ? emax : F((n + 1) * emax.d - emax.n, emax.d);
        return { prompt: 'Two independent fair ' + n + '-sided dice (faces 1…' + n + ') are rolled. What is E[' + (isMax ? 'max' : 'min') + ']?', fr: fr,
          explain: 'P(max = k) = (k² − (k−1)²)/n² = (2k−1)/n², so E[max] = ∑ k(2k−1)/n² = ' + emax.str() + '.' +
            (isMax ? '' : ' Since max + min = X + Y, E[min] = (n+1) − E[max] = ' + fr.str() + '.') };
      }
    },
    table: {
      name: '2×2 conditional', gen: function () {
        var a = randInt(4, 60), b = randInt(4, 60), c = randInt(4, 60), d = randInt(4, 60);
        var ctx = pick([['Passed screen', 'Got offer'], ['Rained', 'Market up'], ['Studied', 'Passed'], ['Long signal', 'Profitable']]);
        var ask = pick(['AgB', 'BgA', 'AandB', 'AgnotB']);
        var N = a + b + c + d, fr, q, ex;
        if (ask === 'AgB') { fr = F(a, a + c); q = 'P(' + ctx[0] + ' | ' + ctx[1] + ')'; ex = 'Restrict to the "' + ctx[1] + '" column: ' + a + ' / (' + a + ' + ' + c + ').'; }
        else if (ask === 'BgA') { fr = F(a, a + b); q = 'P(' + ctx[1] + ' | ' + ctx[0] + ')'; ex = 'Restrict to the "' + ctx[0] + '" row: ' + a + ' / (' + a + ' + ' + b + ').'; }
        else if (ask === 'AandB') { fr = F(a, N); q = 'P(' + ctx[0] + ' and ' + ctx[1] + ')'; ex = 'Joint cell over the total: ' + a + ' / ' + N + '.'; }
        else { fr = F(b, b + d); q = 'P(' + ctx[0] + ' | not ' + ctx[1] + ')'; ex = 'Restrict to the "not ' + ctx[1] + '" column: ' + b + ' / (' + b + ' + ' + d + ').'; }
        var table = '<table class="drill-table"><tr><th></th><th>' + esc(ctx[1]) + '</th><th>not ' + esc(ctx[1]) + '</th></tr>' +
          '<tr><th>' + esc(ctx[0]) + '</th><td>' + a + '</td><td>' + b + '</td></tr>' +
          '<tr><th>not ' + esc(ctx[0]) + '</th><td>' + c + '</td><td>' + d + '</td></tr></table>';
        return { prompt: 'Counts from ' + N + ' observations:' + table + 'What is ' + esc(q) + '?', fr: fr, explain: ex + ' = ' + fracDisplay(fr) + '.' };
      }
    },
    bayes: {
      name: 'Bayes test', gen: function () {
        var prev = pick([1, 2, 5, 10, 20]), sens = pick([80, 90, 95, 99]), fpr = pick([1, 2, 5, 10]);
        var num = sens * prev, den = sens * prev + fpr * (100 - prev);
        var fr = F(num, den);
        return { prompt: 'A condition has prevalence ' + prev + '%. A test detects it ' + sens + '% of the time (sensitivity) and gives a false positive ' + fpr + '% of the time. A random person tests positive. What is P(condition | positive)?', fr: fr,
          explain: 'P(D|+) = P(+|D)P(D) / [P(+|D)P(D) + P(+|¬D)P(¬D)] = (' + sens / 100 + '·' + prev / 100 + ') / (' + sens / 100 + '·' + prev / 100 + ' + ' + fpr / 100 + '·' + (100 - prev) / 100 + ') = ' + fracDisplay(fr) + '.' };
      }
    },
    cards: {
      name: 'Cards', gen: function () {
        var t = pick(['pairRank', 'hearts2', 'sameSuit', 'anyPair', 'hearts3', 'aceKing']);
        var C52_2 = 1326, fr, prompt, ex;
        if (t === 'pairRank') { fr = F(6, C52_2); prompt = 'Two cards are dealt from a shuffled 52-card deck. P(both are aces)?'; ex = 'C(4,2)/C(52,2) = 6/1326.'; }
        else if (t === 'hearts2') { fr = F(78, C52_2); prompt = 'Two cards are dealt from a shuffled 52-card deck. P(both are hearts)?'; ex = 'C(13,2)/C(52,2) = 78/1326, or (13/52)(12/51).'; }
        else if (t === 'sameSuit') { fr = F(12, 51); prompt = 'Two cards are dealt from a shuffled 52-card deck. P(they are the same suit)?'; ex = 'Whatever the first card is, 12 of the remaining 51 match its suit.'; }
        else if (t === 'anyPair') { fr = F(3, 51); prompt = 'Two cards are dealt from a shuffled 52-card deck. P(they form a pair, i.e. same rank)?'; ex = 'Whatever the first card is, 3 of the remaining 51 match its rank.'; }
        else if (t === 'hearts3') { fr = F(286, 22100); prompt = 'Three cards are dealt from a shuffled 52-card deck. P(all three are hearts)?'; ex = 'C(13,3)/C(52,3) = 286/22100 = (13/52)(12/51)(11/50).'; }
        else { fr = F(32, C52_2); prompt = 'Two cards are dealt from a shuffled 52-card deck. P(one ace and one king, in either order)?'; ex = '4·4 = 16 unordered ace–king hands... out of C(52,2)=1326 is 16/1326; ordered: 2·(4/52)(4/51) = 32/2652 = 16/1326.'; fr = F(16, C52_2); }
        return { prompt: prompt, fr: fr, explain: ex + ' = ' + fracDisplay(fr, 5) + '.' };
      }
    },
    urn: {
      name: 'Urn without replacement', gen: function () {
        var r = randInt(2, 8), b = randInt(2, 8), n = r + b, t = pick(['both', 'mixed']);
        var fr = t === 'both' ? F(r * (r - 1), n * (n - 1)) : F(2 * r * b, n * (n - 1));
        return { prompt: 'An urn has ' + r + ' red and ' + b + ' blue balls. Two are drawn without replacement. P(' + (t === 'both' ? 'both red' : 'one of each colour') + ')?', fr: fr,
          explain: (t === 'both' ? '(' + r + '/' + n + ')·(' + (r - 1) + '/' + (n - 1) + ')' : '2·(' + r + '/' + n + ')·(' + b + '/' + (n - 1) + ') (red-then-blue or blue-then-red)') + ' = ' + fracDisplay(fr) + '.' };
      }
    },
    waiting: {
      name: 'Waiting times', gen: function () {
        var t = pick(['geo', 'geo', 'coupon']);
        if (t === 'geo') {
          var m = randInt(1, 5);
          var fr = F(6, m);
          return { prompt: 'You roll a fair die until you get one of ' + m + ' specified face' + (m > 1 ? 's' : '') + '. Expected number of rolls (including the last)?', fr: fr,
            explain: 'Each roll succeeds with p = ' + m + '/6, so the count is Geometric(p) with mean 1/p = ' + fr.str() + '.' };
        }
        var n = randInt(2, 6), num = 0, den = 1;
        // n * H_n exactly
        var acc = F(0, 1);
        for (var k = 1; k <= n; k++) { var a2 = acc.n * k + acc.d, d2 = acc.d * k; acc = F(a2, d2); }
        var res = F(acc.n * n, acc.d);
        return { prompt: 'A fair ' + n + '-sided die is rolled until every face has appeared at least once. Expected number of rolls?', fr: res,
          explain: 'Coupon collector: after collecting j faces, the next new face takes n/(n−j) rolls on average. Sum: n·(1 + 1/2 + … + 1/n) = ' + fracDisplay(res) + '.' };
      }
    }
  };
  var DRILL_KEYS = Object.keys(DRILLS);

  VIEWS.drills = function (main) {
    var sel = S.settings.drillTypes.filter(function (k) { return DRILLS[k]; });
    var session = { n: 0, c: 0, streak: 0 };
    var cur = null, answered = false;
    main.innerHTML = '<div class="page-head"><div><h1>Probability drills</h1><p class="muted">Generated questions with exact answers. Fractions, decimals and expressions like 1-(5/6)^4 are accepted.</p></div></div>' +
      '<details class="card filter-details"><summary><span>Question types <span class="muted small" id="dtSum"></span></span><span class="chev" aria-hidden="true">▾</span></summary>' +
      '<div class="chips" style="margin-top:.6rem" role="group" aria-label="Question types">' +
      DRILL_KEYS.map(function (k) { return '<button type="button" class="chip" data-dt="' + k + '" aria-pressed="' + (sel.indexOf(k) >= 0) + '">' + esc(DRILLS[k].name) + '</button>'; }).join('') +
      '</div><p class="muted small" style="margin:.5rem 0 0">None selected = all types.</p></details>' +
      '<div class="card"><div class="row small muted" style="margin-bottom:.4rem"><span id="dType"></span><span class="spacer"></span><span>Session <b id="dScore">0/0</b> · streak <b id="dStreak">0</b></span></div>' +
      '<div class="prompt" id="dQ" style="min-height:3.2em"></div>' +
      '<form class="answer-form" id="dForm" autocomplete="off" novalidate><label class="sr-only" for="dIn">Your answer</label>' +
      '<input id="dIn" type="text" placeholder="e.g. 5/36" autocapitalize="off" spellcheck="false" enterkeyhint="done"><button class="btn primary" type="submit" id="dBtn">Check</button></form>' +
      '<div class="feedback" id="dFb" role="status" aria-live="polite"></div>' +
      '<div class="actions"><button type="button" class="btn" id="dShow">Show answer <span class="kbd">S</span></button><span class="spacer"></span><button type="button" class="btn primary" id="dNext">Next <span class="kbd">N</span></button></div></div>' +
      '<p class="muted small">All-time drills: <span id="dAll"></span></p>';

    function sumTypes() { $('#dtSum').textContent = sel.length ? '· ' + sel.length + ' selected' : '· all'; }
    function allTime() { var d = S.drills; $('#dAll').textContent = d.c + ' / ' + d.n + ' correct' + (d.n ? ' (' + pct(d.c / d.n) + ')' : '') + ' · best streak ' + d.bestStreak; }
    function next() {
      var keys = sel.length ? sel : DRILL_KEYS;
      var k = pick(keys);
      cur = DRILLS[k].gen(); cur.key = k; answered = false;
      $('#dType').textContent = DRILLS[k].name;
      $('#dQ').innerHTML = cur.prompt;
      $('#dIn').value = ''; $('#dFb').className = 'feedback';
      $('#dBtn').textContent = 'Check';
      if (window.matchMedia && window.matchMedia('(hover: hover)').matches) $('#dIn').focus();
    }
    function record(ok) {
      answered = true;
      session.n++; if (ok) { session.c++; session.streak++; } else session.streak = 0;
      var d = S.drills; d.n++; if (ok) d.c++;
      d.bestStreak = Math.max(d.bestStreak || 0, session.streak);
      var bt = d.byType[cur.key] || { n: 0, c: 0 }; bt.n++; if (ok) bt.c++; d.byType[cur.key] = bt;
      markDay(); save();
      $('#dScore').textContent = session.c + '/' + session.n; $('#dStreak').textContent = session.streak; allTime();
      $('#dBtn').textContent = 'Next';
    }
    function showFb(ok, extra) {
      var fb = $('#dFb');
      fb.className = 'feedback show ' + (ok ? 'ok' : 'bad');
      fb.innerHTML = (ok ? '✓ Correct. ' : '✗ Answer: <b class="mono">' + esc(fracDisplay(cur.fr, 5)) + '</b>. ') + '<span style="font-weight:500">' + cur.explain + '</span>' + (extra || '');
    }
    function check() {
      if (answered) { next(); return; }
      var raw = $('#dIn').value;
      var r = checkNumeric({ value: cur.fr.val(), tolRel: 0.005 }, raw);
      if (r.invalid) { var fb = $('#dFb'); fb.className = 'feedback show info'; fb.textContent = 'Enter a number, fraction or expression.'; return; }
      record(r.ok); showFb(r.ok);
    }
    function reveal() { if (answered) return; record(false); showFb(false); }
    $('#dForm').addEventListener('submit', function (e) { e.preventDefault(); check(); });
    $('#dShow').addEventListener('click', reveal);
    $('#dNext').addEventListener('click', next);
    $all('[data-dt]', main).forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-dt'), i = sel.indexOf(k);
        if (i >= 0) sel.splice(i, 1); else sel.push(k);
        b.setAttribute('aria-pressed', String(i < 0));
        S.settings.drillTypes = sel.slice(); save(); sumTypes(); next();
      });
    });
    ctl = { submit: check, solution: reveal, next: next };
    sumTypes(); allTime(); next();
  };

  /* ------------------------------------------------------------------ */
  /* Timed interview mode                                                */
  /* ------------------------------------------------------------------ */
  var IV_TIME = { 1: 150, 2: 300, 3: 480 };
  VIEWS.interview = function (main) {
    var timer = null;
    onCleanup(function () { if (timer) clearInterval(timer); });

    function intro() {
      ctl = null;
      var last = S.interviews.slice(-5).reverse();
      main.innerHTML = '<div class="page-head"><div><h1>Interview mode</h1><p class="muted">5 problems from different categories. A countdown runs on each one (2.5 / 5 / 8 min by difficulty). Hints are allowed; solutions wait for the summary.</p></div></div>' +
        '<div class="card stack"><div class="row"><span class="label" style="min-width:80px">Difficulty</span><div class="seg" role="group" aria-label="Difficulty">' +
        [['mixed', 'Mixed'], ['1', 'Warm-up'], ['2', 'Interview'], ['3', 'Hard']].map(function (o) {
          return '<button type="button" data-ivd="' + o[0] + '" aria-pressed="' + (S.settings.ivDiff === o[0]) + '">' + o[1] + '</button>';
        }).join('') + '</div></div>' +
        '<button class="btn primary block" type="button" id="ivStart">Start interview <span class="kbd">Enter</span></button></div>' +
        (last.length ? '<div class="card"><h3>Recent sessions</h3><table class="simple"><thead><tr><th>Date</th><th>Score</th><th>Time</th></tr></thead><tbody>' +
          last.map(function (r) { return '<tr><td>' + esc(ymd(new Date(r.t))) + '</td><td>' + r.score + '/' + r.total + '</td><td>' + fmtTime(r.secs) + '</td></tr>'; }).join('') +
          '</tbody></table></div>' : '');
      $all('[data-ivd]', main).forEach(function (b) { b.addEventListener('click', function () { S.settings.ivDiff = b.getAttribute('data-ivd'); save(); intro(); }); });
      $('#ivStart').addEventListener('click', start);
      ctl = { submit: start };
    }
    function choose5() {
      var dsel = S.settings.ivDiff;
      var pool = PROBLEMS.filter(function (p) { return dsel === 'mixed' || String(p.diff) === dsel; });
      var cats = shuffle(CATS.map(function (c) { return c.id; }));
      var out = [];
      cats.forEach(function (c) {
        if (out.length >= 5) return;
        var opts = pool.filter(function (p) { return p.cat === c; });
        var unsolved = opts.filter(function (p) { return !(S.attempts[p.id] && S.attempts[p.id].c > 0); });
        if (opts.length) out.push(pick(unsolved.length ? unsolved : opts));
      });
      var rest = shuffle(pool.filter(function (p) { return out.indexOf(p) < 0; }));
      while (out.length < 5 && rest.length) out.push(rest.pop());
      return shuffle(out);
    }
    function start() {
      var qs = choose5();
      if (!qs.length) { toast('No problems available for that difficulty.'); return; }
      var results = [], idx = 0, t0 = Date.now();
      function dots() {
        return '<span class="progress-dots" aria-hidden="true">' + qs.map(function (_, i) {
          var c = i < results.length ? (results[i].ok ? 'ok' : 'bad') : i === idx ? 'cur' : '';
          return '<i class="' + c + '"></i>';
        }).join('') + '</span>';
      }
      function show() {
        if (idx >= qs.length) return summary();
        var p = qs[idx], limit = IV_TIME[p.diff] || 300, qStart = Date.now(), finished = false;
        main.innerHTML = '<div class="iv-top"><span>Question ' + (idx + 1) + ' / ' + qs.length + ' ' + dots() + '</span>' +
          '<span class="countdown" id="ivClock" role="timer" aria-label="Time left">' + fmtTime(limit) + '</span></div><div id="ivHost"></div>';
        var c = mountProblem($('#ivHost'), p, {
          mode: 'interview', nextLabel: idx + 1 < qs.length ? 'Next question' : 'See summary',
          onResult: function (ok, how) { done(ok, how); },
          onNext: function () { advance(); }
        });
        // In interview mode "S" gives up (graded as a miss) but keeps solution hidden until the summary.
        var solBtn = $('#ivHost [data-act="solution"]');
        if (solBtn) {
          var clone = solBtn.cloneNode(true);
          clone.innerHTML = (p.answer.type === 'self' ? 'Done — grade myself' : 'Give up') + ' <span class="kbd">S</span>';
          solBtn.parentNode.replaceChild(clone, solBtn);
          clone.addEventListener('click', giveUp);
        }
        function giveUp() {
          if (finished) return;
          if (p.answer.type === 'self') { c.solution(); return; }
          c.grade(false, 'gaveup');
        }
        function done(ok, how) {
          if (finished) return;
          finished = true;
          clearInterval(timer); timer = null;
          results.push({ id: p.id, ok: ok, secs: Math.round((Date.now() - qStart) / 1000), how: how });
          var b = $('#ivHost [data-act="next"]'); if (b) { b.classList.remove('hidden'); b.focus(); }
          var gb = $('#ivHost .actions .btn:not([data-act="next"])');
          $all('#ivHost .actions .btn:not([data-act="next"])').forEach(function (x) { x.disabled = true; });
        }
        function advance() { if (!finished) return; idx++; show(); }
        ctl = { submit: c.submit, hint: c.hint, solution: giveUp, next: advance, choose: c.choose };
        timer = setInterval(function () {
          var left = limit - (Date.now() - qStart) / 1000;
          var el = $('#ivClock'); if (!el) return;
          el.textContent = fmtTime(left);
          el.classList.toggle('low', left <= 30);
          if (left <= 0 && !finished) {
            c.grade(false, 'timeout');
            var fb = $('#ivHost .feedback'); fb.className = 'feedback show bad'; fb.textContent = '⏱ Time’s up — counted as a miss.';
            $all('#ivHost input, #ivHost .choice').forEach(function (x) { x.disabled = true; });
          }
        }, 250);
      }
      function summary() {
        ctl = null;
        var score = results.filter(function (r) { return r.ok; }).length;
        var secs = Math.round((Date.now() - t0) / 1000);
        S.interviews.push({ t: Date.now(), score: score, total: results.length, secs: secs, ids: results.map(function (r) { return r.id; }) });
        if (S.interviews.length > 200) S.interviews = S.interviews.slice(-200);
        save();
        var verdict = score === 5 ? 'Outstanding — offer-level.' : score >= 4 ? 'Strong performance.' : score >= 3 ? 'Solid. Review the misses below.' : 'Keep drilling — the misses are now in your review queue.';
        main.innerHTML = '<div class="card sprint-stage"><div class="label">Interview summary</div><div class="big-score" style="margin:.4rem 0">' + score + '<span class="muted" style="font-size:1.6rem">/' + results.length + '</span></div>' +
          '<p class="muted">' + verdict + ' Total time ' + fmtTime(secs) + '.</p>' +
          '<div class="row" style="justify-content:center"><button class="btn primary" type="button" id="ivAgain">New interview <span class="kbd">Enter</span></button><a class="btn" href="#review">Review queue</a></div></div>' +
          '<div class="card"><table class="simple"><thead><tr><th>#</th><th>Problem</th><th>Result</th><th>Time</th></tr></thead><tbody>' +
          results.map(function (r, i) {
            var p = BY_ID[r.id];
            var how = r.how === 'timeout' ? 'timed out' : r.how === 'gaveup' ? 'gave up' : r.ok ? 'correct' : 'wrong';
            return '<tr><td>' + (i + 1) + '</td><td>' + esc(p.title) + '<div class="small muted">' + esc(CAT_NAME[p.cat]) + ' · difficulty ' + p.diff + '</div></td>' +
              '<td class="' + (r.ok ? 'res-ok' : 'res-bad') + '">' + how + '</td><td class="mono">' + fmtTime(r.secs) + '</td></tr>';
          }).join('') + '</tbody></table>' +
          results.map(function (r, i) {
            var p = BY_ID[r.id];
            return '<details class="sol-details"><summary>' + (i + 1) + '. ' + esc(p.title) + ' — solution</summary><div class="prompt small">' + p.prompt + '</div>' + solutionHTML(p) + '</details>';
          }).join('') + '</div>';
        $('#ivAgain').addEventListener('click', start);
        ctl = { submit: start };
      }
      show();
    }
    intro();
  };

  /* ------------------------------------------------------------------ */
  /* Stats dashboard                                                     */
  /* ------------------------------------------------------------------ */
  VIEWS.stats = function (main) {
    var sk = streakInfo();
    var totN = 0, totC = 0;
    Object.keys(S.attempts).forEach(function (id) { if (BY_ID[id]) { totN += S.attempts[id].n; totC += S.attempts[id].c; } });
    var weak = weakestCategory();
    var catRows = CATS.map(function (c) {
      var ps = PROBLEMS.filter(function (p) { return p.cat === c.id; });
      var n = 0, k = 0, solved = 0;
      ps.forEach(function (p) { var a = S.attempts[p.id]; if (a) { n += a.n; k += a.c; if (a.c > 0) solved++; } });
      var acc = n ? k / n : 0;
      return '<div class="bar-row" style="--cat: var(--c-' + c.id + ')"><span>' + esc(c.name) + '</span>' +
        '<div class="bar" role="img" aria-label="' + esc(c.name) + ' accuracy ' + (n ? pct(acc) : 'no attempts') + '"><div style="width:' + (n ? Math.max(2, acc * 100) : 0) + '%"></div></div>' +
        '<span class="pct">' + (n ? pct(acc) : '—') + '</span><span class="sub">' + solved + '/' + ps.length + ' solved · ' + n + ' attempts</span></div>';
    }).join('');
    // 28-day heat strip
    var heat = '', t = today();
    for (var i = 27; i >= 0; i--) {
      var k = addDays(t, -i), v = S.days[k] || 0;
      var lvl = v === 0 ? '' : v < 5 ? 'l1' : v < 15 ? 'l2' : 'l3';
      heat += '<div class="' + lvl + (i === 0 ? ' today' : '') + '" title="' + k + ': ' + v + ' activities"></div>';
    }
    // sprint
    var keys = {};
    S.sprint.history.forEach(function (r) { keys[r.key] = (keys[r.key] || 0) + 1; });
    var mainKey = Object.keys(keys).sort(function (a, b) { return keys[b] - keys[a]; })[0];
    var sprintHtml = mainKey ? Object.keys(keys).sort().map(function (key) {
      var h = S.sprint.history.filter(function (r) { return r.key === key; });
      var best = Math.max.apply(null, h.map(function (r) { return r.score; }));
      var recent = h.slice(-10), avg = recent.reduce(function (s, r) { return s + r.score; }, 0) / recent.length;
      return '<tr><td class="mono">' + esc(key) + '</td><td>' + h.length + '</td><td><b>' + best + '</b></td><td>' + fmtNum(avg, 1) + '</td></tr>';
    }).join('') : '';
    var d = S.drills;
    var ivs = S.interviews;
    var ivAvg = ivs.length ? ivs.slice(-10).reduce(function (s, r) { return s + r.score / r.total; }, 0) / Math.min(10, ivs.length) : null;
    var boxes = [0, 0, 0, 0, 0];
    Object.keys(S.srs).forEach(function (id) { if (BY_ID[id]) { var b = S.srs[id].box; if (b >= 1 && b <= 5) boxes[b - 1]++; } });

    main.innerHTML = '<div class="page-head"><div><h1>Stats</h1><p class="muted">Everything is stored on this device. Use Settings → Export to move it.</p></div></div>' +
      '<div class="hero">' +
      '<div class="stat-tile"><div class="v">' + solvedCount() + '<span class="small muted">/' + PROBLEMS.length + '</span></div><div class="l">Solved</div></div>' +
      '<div class="stat-tile"><div class="v">' + (totN ? pct(totC / totN) : '—') + '</div><div class="l">Accuracy</div></div>' +
      '<div class="stat-tile"><div class="v">' + sk.cur + '<span class="small muted"> d</span></div><div class="l">Streak (best ' + sk.best + ')</div></div>' +
      '<div class="stat-tile"><div class="v">' + sk.total + '</div><div class="l">Days practiced</div></div></div>' +
      (weak ? '<div class="banner"><p><b>Weakest area: ' + esc(CAT_NAME[weak.id]) + '</b> — ' + (weak.score !== null ? pct(weak.score) + ' accuracy over ' + weak.n + ' attempts.' : 'least practiced so far.') + '</p><button class="btn sm primary" type="button" id="stWeak">Practice</button></div>' : '') +
      '<div class="card"><h2>Accuracy by category</h2>' + catRows + '</div>' +
      '<div class="grid grid-2" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">' +
      '<div class="card"><h2>Last 4 weeks</h2><div class="heat" role="img" aria-label="Activity in the last 28 days">' + heat + '</div><p class="muted small" style="margin:.5rem 0 0">Each square is a day; darker = more practice.</p></div>' +
      '<div class="card"><h2>Review boxes</h2><div class="row" style="align-items:flex-end;gap:.6rem;height:90px">' + boxes.map(function (b, i) {
        var mx = Math.max.apply(null, boxes) || 1;
        return '<div style="flex:1;text-align:center"><div style="height:' + Math.round(60 * b / mx + 2) + 'px;background:var(--accent);opacity:' + (0.35 + i * 0.16) + ';border-radius:6px 6px 2px 2px"></div><div class="small muted">B' + (i + 1) + ' · ' + b + '</div></div>';
      }).join('') + '</div><p class="muted small" style="margin:.5rem 0 0">' + dueIds().length + ' due today.</p></div></div>' +
      '<div class="card"><h2>Mental math</h2>' + (mainKey ? '<p class="muted small">Trend for <span class="mono">' + esc(mainKey) + '</span> (last 30 runs)</p>' +
        sparkline(S.sprint.history.filter(function (r) { return r.key === mainKey; }).slice(-30).map(function (r) { return r.score; }), 300, 56, 'Sprint scores') +
        '<table class="simple" style="margin-top:.6rem"><thead><tr><th>Config</th><th>Runs</th><th>Best</th><th>Avg (10)</th></tr></thead><tbody>' + sprintHtml + '</tbody></table>'
        : '<p class="muted">No sprints yet. <a href="#sprint">Run one</a> — Optiver-style tests reward daily practice.</p>') + '</div>' +
      '<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr))">' +
      '<div class="card"><h2>Probability drills</h2><p>' + d.c + ' / ' + d.n + ' correct' + (d.n ? ' (' + pct(d.c / d.n) + ')' : '') + ' · best streak ' + (d.bestStreak || 0) + '</p>' +
        Object.keys(d.byType).filter(function (k) { return DRILLS[k]; }).map(function (k) { var b = d.byType[k]; return '<div class="small"><span class="muted">' + esc(DRILLS[k].name) + ':</span> ' + b.c + '/' + b.n + '</div>'; }).join('') + '</div>' +
      '<div class="card"><h2>Interviews</h2>' + (ivs.length ? '<p>' + ivs.length + ' sessions · recent average ' + pct(ivAvg) + '</p>' + sparkline(ivs.slice(-20).map(function (r) { return r.score; }), 300, 48, 'Interview scores') : '<p class="muted">No sessions yet. <a href="#interview">Try one</a>.</p>') + '</div></div>';
    var sw = $('#stWeak'); if (sw) sw.addEventListener('click', function () { practiceCategory(weak.id); });
  };

  /* ------------------------------------------------------------------ */
  /* Settings / data                                                     */
  /* ------------------------------------------------------------------ */
  function exportProgress() {
    var data = { app: 'stat-brainteaser', version: APP_VERSION, exportedAt: new Date().toISOString(), progress: S };
    var blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'stat-brainteaser-progress-' + today() + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    toast('Progress exported.');
  }
  function mergeProgress(cur, inc) {
    Object.keys(inc.attempts || {}).forEach(function (id) {
      var a = cur.attempts[id], b = inc.attempts[id];
      if (!a || (b.n || 0) > (a.n || 0) || ((b.n || 0) === (a.n || 0) && (b.last || 0) > (a.last || 0))) cur.attempts[id] = b;
    });
    Object.keys(inc.srs || {}).forEach(function (id) {
      var a = cur.srs[id], b = inc.srs[id];
      if (!a || (b.reviews || 0) > (a.reviews || 0)) cur.srs[id] = b;
    });
    Object.keys(inc.days || {}).forEach(function (k) { cur.days[k] = Math.max(cur.days[k] || 0, inc.days[k] || 0); });
    var seen = {};
    cur.sprint.history.concat((inc.sprint && inc.sprint.history) || []).forEach(function (r) { seen[r.t + '|' + r.key + '|' + r.score] = r; });
    cur.sprint.history = Object.keys(seen).map(function (k) { return seen[k]; }).sort(function (a, b) { return a.t - b.t; });
    var d = inc.drills || {};
    if ((d.n || 0) > cur.drills.n) cur.drills = mergeDefaults(d, defaultState().drills);
    var iv = {};
    cur.interviews.concat(inc.interviews || []).forEach(function (r) { iv[r.t] = r; });
    cur.interviews = Object.keys(iv).map(function (k) { return iv[k]; }).sort(function (a, b) { return a.t - b.t; });
    return cur;
  }
  function importProgress(file, mode) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var obj = JSON.parse(reader.result);
        var prog = obj && obj.progress ? obj.progress : obj;
        if (!isPlainObj(prog) || !isPlainObj(prog.attempts)) throw new Error('Not a Stat Brainteaser progress file');
        prog = mergeDefaults(prog, defaultState());
        if (mode === 'replace') { if (!confirm('Replace ALL progress on this device with the imported file?')) return; S = prog; }
        else S = mergeProgress(S, prog);
        save(); applyTheme(); updateBadges();
        toast('Progress imported (' + (mode === 'replace' ? 'replaced' : 'merged') + ').');
        route();
      } catch (e) { toast('Import failed: ' + e.message); }
    };
    reader.onerror = function () { toast('Could not read that file.'); };
    reader.readAsText(file);
  }
  VIEWS.settings = function (main) {
    var counts = CATS.map(function (c) { return esc(c.name) + ' ' + PROBLEMS.filter(function (p) { return p.cat === c.id; }).length; }).join(' · ');
    main.innerHTML = '<div class="page-head"><div><h1>Settings</h1><p class="muted">Version ' + APP_VERSION + ' · ' + PROBLEMS.length + ' problems</p></div></div>' +
      '<div class="card stack"><h2>Appearance</h2><div class="seg" role="group" aria-label="Theme">' +
      ['auto', 'light', 'dark'].map(function (t) { return '<button type="button" data-theme-set="' + t + '" aria-pressed="' + (S.settings.theme === t) + '">' + t[0].toUpperCase() + t.slice(1) + '</button>'; }).join('') + '</div></div>' +
      '<div class="card stack"><h2>Your data</h2><p class="muted small">Progress lives in this browser only' + (storageOk ? '' : ' <b style="color:var(--bad)">(storage currently unavailable!)</b>') + '. Export a JSON file to back it up or move it between your PC and phone, then import it on the other device.</p>' +
      '<div class="row"><button class="btn primary" type="button" id="expBtn">' + ICONS.download + ' Export progress</button>' +
      '<label class="btn" for="impMerge">Import (merge)</label><input class="sr-only" type="file" id="impMerge" accept=".json,application/json">' +
      '<label class="btn" for="impReplace">Import (replace)</label><input class="sr-only" type="file" id="impReplace" accept=".json,application/json"></div>' +
      '<div><button class="btn danger" type="button" id="resetBtn">Reset all progress</button></div></div>' +
      '<div class="card stack"><h2>App</h2><div class="row"><button class="btn" type="button" id="updBtn">Check for updates</button>' +
      '<button class="btn' + (deferredInstall ? '' : ' hidden') + '" type="button" id="instBtn2">' + ICONS.download + ' Install app</button></div>' +
      '<p class="muted small" style="margin:0">' + (isStandalone() ? 'Running as an installed app.' : isIOS() ? 'On iPhone/iPad: Share → Add to Home Screen.' : 'In Chrome/Edge use the install icon in the address bar, or the Install button when it appears.') + '</p></div>' +
      '<div class="card"><h2>Keyboard shortcuts</h2><table class="simple"><tbody>' +
      [['Enter', 'Submit answer / start'], ['H', 'Next hint'], ['S', 'Show solution (interview: give up)'], ['N', 'Next problem'], ['1–4', 'Pick a multiple-choice option'], ['Esc', 'Skip (mental math)']].map(function (r) {
        return '<tr><td><span class="kbd">' + r[0] + '</span></td><td>' + r[1] + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<div class="card"><h2>Problem bank</h2><p class="small muted" style="margin:0">' + counts + '</p></div>' +
      '<p class="muted small">MIT licensed · © 2026 Breal Tchuimi. Works offline after the first visit.</p>';
    $all('[data-theme-set]', main).forEach(function (b) { b.addEventListener('click', function () { S.settings.theme = b.getAttribute('data-theme-set'); save(); applyTheme(); route(); }); });
    $('#expBtn').addEventListener('click', exportProgress);
    $('#impMerge').addEventListener('change', function (e) { if (e.target.files[0]) importProgress(e.target.files[0], 'merge'); e.target.value = ''; });
    $('#impReplace').addEventListener('change', function (e) { if (e.target.files[0]) importProgress(e.target.files[0], 'replace'); e.target.value = ''; });
    $('#resetBtn').addEventListener('click', function () {
      if (!confirm('Delete all progress on this device? Consider exporting first.')) return;
      var theme = S.settings.theme; S = defaultState(); S.settings.theme = theme; save(); updateBadges(); toast('Progress reset.'); route();
    });
    $('#updBtn').addEventListener('click', checkForUpdate);
    $('#instBtn2').addEventListener('click', doInstall);
  };

  /* ------------------------------------------------------------------ */
  /* Global keyboard shortcuts                                           */
  /* ------------------------------------------------------------------ */
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (!ctl) return;
    var typing = isTyping(e.target);
    var k = e.key;
    if (k === 'Enter' && !typing && ctl.submit) {
      var tag = e.target && e.target.tagName;
      if (tag === 'BUTTON' || tag === 'A' || tag === 'SUMMARY') return; // let the focused control act
      e.preventDefault(); ctl.submit(); return;
    }
    if (typing) return;
    var lk = k.toLowerCase();
    if (lk === 'h' && ctl.hint) { e.preventDefault(); ctl.hint(); }
    else if (lk === 's' && ctl.solution) { e.preventDefault(); ctl.solution(); }
    else if (lk === 'n' && ctl.next) { e.preventDefault(); ctl.next(); }
    else if (/^[1-8]$/.test(k) && ctl.choose) { e.preventDefault(); ctl.choose(+k - 1); }
  });

  /* ------------------------------------------------------------------ */
  /* Boot                                                                */
  /* ------------------------------------------------------------------ */
  // exported for tests / debugging
  window.StatBT = { parseNumber: parseNumber, checkAnswer: checkAnswer, checkNumeric: checkNumeric, DRILLS: DRILLS, version: APP_VERSION };

  function boot() {
    applyTheme();
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      var onChange = function () { if (S.settings.theme === 'auto') applyTheme(); };
      if (mq.addEventListener) mq.addEventListener('change', onChange); else if (mq.addListener) mq.addListener(onChange);
    }
    $('#themeBtn').addEventListener('click', cycleTheme);
    $('#installBtn').addEventListener('click', doInstall);
    window.addEventListener('hashchange', route);
    if (!PROBLEMS.length) {
      $('#view').innerHTML = '<div class="card"><h2>Problem bank failed to load</h2><p>problems.js is missing. Reload while online.</p></div>';
    }
    updateBadges();
    route();
    registerSW();
    document.documentElement.setAttribute('data-ready', '1');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
