/* Stat Brainteaser — quant / data / ML interview trainer. Plain JS, no dependencies. */
(function () {
  'use strict';

  var APP_VERSION = '1.2.0';
  var STORE_KEY = 'statbt.progress.v1'; // key kept stable across versions; schema version lives in state.v
  var SCHEMA = 2;
  var PROBLEMS = Array.isArray(window.PROBLEMS) ? window.PROBLEMS : [];
  var BY_ID = {};
  PROBLEMS.forEach(function (p) { BY_ID[p.id] = p; });

  var GROUPS = [
    { id: 'quant', name: 'Quant core', desc: 'Probability, statistics and puzzles asked in trading & research interviews.' },
    { id: 'tech', name: 'Technical', desc: 'Python, SQL and machine learning screens for quant, data and ML roles.' }
  ];
  var CATS = [
    { id: 'probability', name: 'Probability', short: 'Prob', group: 'quant', icon: 'die' },
    { id: 'statistics', name: 'Statistics', short: 'Stats', group: 'quant', icon: 'bell' },
    { id: 'ev', name: 'EV & Games', short: 'EV', group: 'quant', icon: 'coins' },
    { id: 'combinatorics', name: 'Combinatorics', short: 'Comb', group: 'quant', icon: 'grid' },
    { id: 'brainteasers', name: 'Brainteasers', short: 'Logic', group: 'quant', icon: 'puzzle' },
    { id: 'fermi', name: 'Fermi estimates', short: 'Fermi', group: 'quant', icon: 'globe' },
    { id: 'python', name: 'Python', short: 'Py', group: 'tech', icon: 'code' },
    { id: 'sql', name: 'SQL', short: 'SQL', group: 'tech', icon: 'db' },
    { id: 'ml', name: 'Machine learning', short: 'ML', group: 'tech', icon: 'nodes' }
  ];
  var CAT = {};
  CATS.forEach(function (c) { CAT[c.id] = c; });
  // Problems with an unknown category still appear (as "Other").
  PROBLEMS.forEach(function (p) { if (!CAT[p.cat]) { CAT[p.cat] = { id: p.cat, name: p.cat, short: p.cat, group: 'tech', icon: 'code' }; CATS.push(CAT[p.cat]); } });
  function catName(id) { return (CAT[id] || {}).name || id; }
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
    return String(Math.round(x * Math.pow(10, dp)) / Math.pow(10, dp));
  }
  function pct(x) { return Math.round(x * 100) + '%'; }
  function fmtTime(sec) { sec = Math.max(0, Math.ceil(sec)); return Math.floor(sec / 60) + ':' + pad2(sec % 60); }
  function stripTags(h) { return String(h || '').replace(/<[^>]+>/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&[a-z#0-9]+;/gi, ' '); }
  function isTyping(el) {
    if (!el) return false;
    var t = el.tagName;
    return t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT' || el.isContentEditable;
  }
  function hoverDevice() { return window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches; }

  function svg(inner, extra) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + (extra || '') + '>' + inner + '</svg>';
  }
  var ICONS = {
    home: svg('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/>'),
    practice: svg('<path d="M4 6h16M4 12h16M4 18h10"/>'),
    review: svg('<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3 2"/>'),
    train: svg('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'),
    stats: svg('<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-6"/>'),
    sprint: svg('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'),
    drills: svg('<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'),
    interview: svg('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5M9 2h6"/>'),
    sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
    moon: svg('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>'),
    auto: svg('<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>'),
    download: svg('<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>'),
    check: svg('<path d="M20 6 9 17l-5-5"/>'),
    x: svg('<path d="M18 6 6 18M6 6l12 12"/>'),
    dot: svg('<circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none"/>'),
    play: svg('<path d="M7 4v16l13-8z" fill="currentColor"/>'),
    shuffle: svg('<path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/>'),
    search: svg('<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>'),
    left: svg('<path d="M15 18l-6-6 6-6"/>'),
    right: svg('<path d="M9 18l6-6-6-6"/>'),
    bulb: svg('<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>'),
    book: svg('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5V21h16"/>'),
    gear: svg('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1"/>'),
    // topic icons
    die: svg('<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="1.2" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.2" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1.2" fill="currentColor"/>'),
    bell: svg('<path d="M2 20h20"/><path d="M3 19c3 0 4-13 9-13s6 13 9 13"/>'),
    coins: svg('<ellipse cx="9" cy="7" rx="6" ry="3"/><path d="M3 7v5c0 1.7 2.7 3 6 3s6-1.3 6-3V7"/><path d="M9 15v2c0 1.7 2.7 3 6 3s6-1.3 6-3v-5c0-1.7-2.7-3-6-3"/>'),
    grid: svg('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'),
    puzzle: svg('<path d="M10 3h4v3a2 2 0 1 0 4 0V3h3v7h-3a2 2 0 1 0 0 4h3v7h-7v-3a2 2 0 1 0-4 0v3H3v-7h3a2 2 0 1 0 0-4H3V3z"/>'),
    globe: svg('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'),
    code: svg('<path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 4l-4 16"/>'),
    db: svg('<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>'),
    nodes: svg('<circle cx="5" cy="6" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><path d="M7 6.8 10.2 11M7 17.2l3.2-4.2M14 12h3"/>')
  };

  /* ------------------------------------------------------------------ */
  /* Persistent state (localStorage, always wrapped in try/catch)       */
  /* ------------------------------------------------------------------ */
  function defaultState() {
    return {
      v: SCHEMA,
      attempts: {},   // id -> {n, c, last, lastOk, hints}
      srs: {},        // id -> {box, due, reviews}
      days: {},       // 'YYYY-MM-DD' -> activity count
      sprint: { history: [] },
      drills: { n: 0, c: 0, bestStreak: 0, byType: {} },
      interviews: [],
      session: null,  // {ids, idx, label, res:{id:bool}, t}
      settings: {
        theme: 'auto',
        sprint: { mode: 'classic', dur: 120, ops: { add: true, sub: true, mul: true, div: true }, addA: [2, 100], addB: [2, 100], mulA: [2, 12], mulB: [2, 100] },
        filters: { cats: [], diffs: [], status: 'all', q: '' },
        drillTypes: [],
        ivDiff: 'mixed',
        notify: false
      },
      ui: { iosHintDismissed: false, onboarded: false, notifyOffered: false }
    };
  }
  function isPlainObj(o) { return !!o && typeof o === 'object' && !Array.isArray(o); }
  function mergeDefaults(o, d) {
    if (!isPlainObj(o)) return d;
    Object.keys(d).forEach(function (k) {
      if (o[k] === undefined || (o[k] === null && d[k] !== null)) o[k] = d[k];
      else if (isPlainObj(d[k]) && isPlainObj(o[k]) && Object.keys(d[k]).length) o[k] = mergeDefaults(o[k], d[k]);
      else if (Array.isArray(d[k]) && !Array.isArray(o[k])) o[k] = d[k];
    });
    return o;
  }
  /* Schema migration. v1 (app 1.0.0) → v2 (app 1.1.0):
   *  - filters: drop `tag`, add `q`; keep cats/diffs/status
   *  - add `session`, `ui.onboarded` (via defaults)
   *  - attempts/srs/days/sprint/drills/interviews are unchanged and preserved as-is. */
  function migrate(o) {
    if (!isPlainObj(o)) return defaultState();
    var v = +o.v || 1;
    if (v < 2) {
      var f = (o.settings && o.settings.filters) || {};
      if (o.settings) o.settings.filters = { cats: Array.isArray(f.cats) ? f.cats : [], diffs: Array.isArray(f.diffs) ? f.diffs : [], status: f.status || 'all', q: '' };
      o.v = 2;
    }
    o = mergeDefaults(o, defaultState());
    if (o.session && (!Array.isArray(o.session.ids) || !o.session.ids.length)) o.session = null;
    return o;
  }
  var storageOk = true;
  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return defaultState();
      return migrate(JSON.parse(raw));
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
  save(); // persist any migration immediately

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
  function solvedCount(cat) {
    return PROBLEMS.filter(function (p) { return (!cat || p.cat === cat) && S.attempts[p.id] && S.attempts[p.id].c > 0; }).length;
  }
  function status(id) {
    var a = S.attempts[id];
    if (!a) return 'new';
    return a.lastOk ? 'solved' : 'missed';
  }
  function catStats(cat) {
    var n = 0, k = 0, solved = 0, total = 0;
    PROBLEMS.forEach(function (p) {
      if (p.cat !== cat) return;
      total++;
      var a = S.attempts[p.id];
      if (a) { n += a.n; k += a.c; if (a.c > 0) solved++; }
    });
    return { n: n, c: k, solved: solved, total: total, acc: n ? k / n : null };
  }

  /* ------------------------------------------------------------------ */
  /* Safe numeric expression parser (no eval)                           */
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
    // strip a trailing unit word ("17 minutes", "7.5°", "100 s", "2.5m L", "12 rows")
    s = s.replace(/\s*(minutes?|mins?|seconds?|secs?|s|hours?|hrs?|days?|nights?|dollars?|usd|cad|coins?|steps?|races?|weighings?|people|prisoners|floors?|drops?|times|degrees?|°|litres?|liters?|l|kg|rows?|fits?|ms)\.?$/, '');
    s = s.replace(/\s+/g, '');
    return s;
  }
  function parseNumber(raw) {
    var s = normalizeExpr(raw);
    if (!s) return null;
    if (/^-?\d+,\d+$/.test(s)) s = s.replace(',', '.'); // European decimal comma "0,25"
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
  // Text answers (e.g. program output): case-insensitive, whitespace-insensitive, quote style ignored.
  function codeNorm(s) {
    return String(s == null ? '' : s).trim().toLowerCase()
      .replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/"/g, "'")
      .replace(/\s+/g, '').replace(/\.$/, '');
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
      var n = codeNorm(raw);
      if (!n) return { invalid: true };
      return { ok: (a.accept || []).some(function (t) { return codeNorm(t) === n; }) };
    }
    return { invalid: true };
  }
  function answerDisplay(p) {
    var a = p.answer || {};
    if (a.display) return a.display;
    if (a.type === 'numeric') return fmtNum(a.value, 6);
    if (a.type === 'choice') return a.options[a.correct];
    if (a.type === 'text') return esc((a.accept || [])[0] || '');
    return '';
  }
  function formatHint(p) {
    var a = p.answer || {};
    if (a.type === 'numeric' && a.range) return { ph: 'A single number, e.g. 2.5k', help: 'Estimate — one number. Suffixes k / m / b and 1e6 are fine.' };
    if (a.type === 'numeric') return { ph: 'e.g. 5/36, 0.139 or 13.9%', help: 'Fractions, decimals, % and expressions like 1/6+1/36, C(10,3) or 1-(5/6)^4 work.' };
    if (a.type === 'text') return { ph: p.cat === 'python' ? 'Exact output' : 'Short answer', help: 'Type it exactly as it would print. Case, spaces and quote style are ignored.' };
    return { ph: '', help: '' };
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
      b.addEventListener('click', function () { el.remove(); if (onAction) onAction(); });
      el.appendChild(b);
    }
    var x = document.createElement('button');
    x.className = 'btn sm'; x.type = 'button'; x.setAttribute('aria-label', 'Dismiss'); x.textContent = '✕';
    x.addEventListener('click', function () { el.remove(); });
    el.appendChild(x);
    wrap.appendChild(el);
    if (!actionLabel || ms) setTimeout(function () { el.remove(); }, ms || 4500);
    return el;
  }

  function applyTheme() {
    var t = S.settings.theme;
    var root = document.documentElement;
    if (t === 'light' || t === 'dark') root.setAttribute('data-theme', t); else root.removeAttribute('data-theme');
    $all('[data-theme-btn]').forEach(function (btn) {
      btn.innerHTML = (t === 'dark' ? ICONS.moon : t === 'light' ? ICONS.sun : ICONS.auto) + '<span class="lbl">Theme: ' + t + '</span>';
      btn.setAttribute('aria-label', 'Theme: ' + t + ' (click to change)');
      btn.title = 'Theme: ' + t;
    });
    var dark = t === 'dark' || (t === 'auto' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var meta = $('meta[name="theme-color"]');
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
    $all('[data-install]').forEach(function (b) { b.classList.remove('hidden'); });
  });
  window.addEventListener('appinstalled', function () {
    deferredInstall = null;
    $all('[data-install]').forEach(function (b) { b.classList.add('hidden'); });
    toast('Installed. You can launch it from your apps.');
  });
  function doInstall() {
    if (!deferredInstall) { toast(isIOS() ? 'On iPhone: Share → Add to Home Screen.' : 'Use the install icon in your browser’s address bar.'); return; }
    deferredInstall.prompt();
    deferredInstall.userChoice.then(function () { deferredInstall = null; $all('[data-install]').forEach(function (b) { b.classList.add('hidden'); }); }).catch(function () {});
  }
  function isStandalone() {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
  }
  function isIOS() {
    var ua = navigator.userAgent || '';
    return /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  /* ------------------------------------------------------------------ */
  /* Service worker: offline-ready toast, update detection & prompt,      */
  /* optional update notifications (periodic background sync).            */
  /* ------------------------------------------------------------------ */
  var swReg = null, updateRequested = false, promptedWorker = null;
  var UPDATE_EVERY_MS = 30 * 60 * 1000;
  function fetchVersionInfo() {
    // version.json is written by the deploy workflow; the SW never caches it. Missing locally (dev) → null.
    return fetch('version.json?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }
  function swInfo(worker) {
    // Ask a service worker for its {version, build}.
    return new Promise(function (resolve) {
      worker = worker || (navigator.serviceWorker && navigator.serviceWorker.controller);
      if (!worker || typeof MessageChannel === 'undefined') { resolve(null); return; }
      var ch = new MessageChannel();
      var done = false;
      ch.port1.onmessage = function (e) { done = true; resolve(e.data); };
      try { worker.postMessage({ type: 'GET_VERSION' }, [ch.port2]); } catch (e) { resolve(null); return; }
      setTimeout(function () { if (!done) resolve(null); }, 1500);
    });
  }
  function fmtDate(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    return isNaN(d) ? '' : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }
  function promptUpdate(worker) {
    if (promptedWorker === worker) return;
    promptedWorker = worker;
    Promise.all([fetchVersionInfo(), swInfo(worker)]).then(function (res) {
      var info = res[0] || {}, w = res[1] || {};
      var build = w.build || info.build;
      var meta = [];
      if (w.version || info.version) meta.push('v' + (w.version || info.version));
      if (build && build !== 'dev') meta.push('build ' + build);
      if (info.date) meta.push(fmtDate(info.date));
      var msg = 'Update available' + (meta.length ? ' (' + meta.join(' · ') + ')' : '') +
        (info.notes ? ': “' + info.notes + '”.' : '.') + ' Your progress is kept.';
      var el = toast(msg, 'Update', function () {
        updateRequested = true;
        worker.postMessage({ type: 'SKIP_WAITING' });
      });
      if (el) el.classList.add('toast-update');
      // App open in a background tab: also raise a system notification (if allowed).
      if (document.visibilityState === 'hidden' && S.settings.notify && window.Notification && Notification.permission === 'granted' && swReg) {
        swReg.showNotification('Stat Brainteaser update available', {
          body: (info.notes ? info.notes + '\n' : '') + 'Open the app and tap Update.',
          icon: 'icons/icon-192.png', badge: 'icons/favicon-32.png', tag: 'update', data: { url: './' }
        }).catch(function () {});
        if (build) worker.postMessage({ type: 'MARK_NOTIFIED', build: build });
      }
    });
  }
  function watchRegistration(reg) {
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
  }
  function pollUpdate() {
    if (!swReg) return Promise.resolve();
    return swReg.update().catch(function () {}).then(function () {
      if (swReg.waiting && navigator.serviceWorker.controller) promptUpdate(swReg.waiting);
    });
  }
  function registerSW() {
    if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
    navigator.serviceWorker.register('./sw.js', { scope: './' }).then(function (reg) {
      swReg = reg;
      watchRegistration(reg);
      pollUpdate(); // on load
      setInterval(pollUpdate, UPDATE_EVERY_MS); // every 30 min while open
      document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') pollUpdate(); });
      if (S.settings.notify) ensurePeriodicSync(); // keep the background registration alive
    }).catch(function (err) { console.warn('SW registration failed', err); });
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (updateRequested) { updateRequested = false; location.reload(); }
    });
  }
  function checkForUpdate(outEl) {
    function say(t) { if (outEl) outEl.textContent = t; else toast(t); }
    if (!swReg) { say('Update checks need the service worker (not available here).'); return Promise.resolve(); }
    say('Checking…');
    return swReg.update().then(function () {
      return new Promise(function (r) { setTimeout(r, 600); });
    }).then(function () {
      if (swReg.waiting || swReg.installing) {
        say('Update found — tap Update in the message that just appeared.');
        if (swReg.waiting) promptUpdate(swReg.waiting);
        return;
      }
      return Promise.all([fetchVersionInfo(), swInfo()]).then(function (res) {
        var info = res[0] || {}, w = res[1] || {};
        var build = w.build || info.build || 'dev';
        say('You’re up to date · v' + (w.version || APP_VERSION) + ' · build ' + build + (info.date ? ' · ' + fmtDate(info.date) : ''));
      });
    }).catch(function () { say('Could not check for updates (offline?).'); });
  }

  /* Background update notifications */
  function notifySupport() {
    var hasNotif = 'Notification' in window;
    var hasPeriodic = !!(swReg && 'periodicSync' in swReg);
    return { notif: hasNotif, periodic: hasPeriodic, perm: hasNotif ? Notification.permission : 'unsupported' };
  }
  function ensurePeriodicSync() {
    // Resolves to 'on' | 'needs-install' | 'unsupported' | 'error'
    if (!swReg || !('periodicSync' in swReg)) return Promise.resolve('unsupported');
    var q = (navigator.permissions && navigator.permissions.query)
      ? navigator.permissions.query({ name: 'periodic-background-sync' }).then(function (st) { return st.state; }).catch(function () { return 'prompt'; })
      : Promise.resolve('prompt');
    return q.then(function (state) {
      if (state === 'denied') return 'needs-install';
      return swReg.periodicSync.register('check-update', { minInterval: 12 * 60 * 60 * 1000 })
        .then(function () { return 'on'; })
        .catch(function () { return 'needs-install'; });
    }).catch(function () { return 'error'; });
  }
  function enableNotifications() {
    if (!('Notification' in window)) { toast('Notifications are not supported in this browser.'); return Promise.resolve(false); }
    return Promise.resolve(Notification.requestPermission()).then(function (perm) {
      if (perm !== 'granted') {
        S.settings.notify = false; save();
        toast(perm === 'denied' ? 'Notifications are blocked for this site — allow them in your browser settings.' : 'Notifications not enabled.');
        return false;
      }
      S.settings.notify = true; save();
      return ensurePeriodicSync().then(function (st) {
        toast(st === 'on' ? 'Update notifications on — checked about twice a day, even when the app is closed.'
          : 'Notifications on while the app is open. Background checks need the installed app in Chrome/Edge.');
        return true;
      });
    }).catch(function () { toast('Could not enable notifications.'); return false; });
  }
  function disableNotifications() {
    S.settings.notify = false; save();
    if (swReg && swReg.periodicSync) return swReg.periodicSync.unregister('check-update').catch(function () {});
    return Promise.resolve();
  }
  function notifyStatusText() {
    var ns = notifySupport();
    if (!ns.notif) return Promise.resolve('Not supported on this browser — you’ll see updates when you open the app.');
    if (ns.perm === 'denied') return Promise.resolve('Notifications are blocked for this site in your browser settings. You’ll still see updates when you open the app.');
    if (!S.settings.notify) return Promise.resolve(ns.periodic ? 'Off. Turn on to hear about new problems even when the app is closed (installed Chrome/Edge app).' : 'Off. On this browser updates can only appear while the app is open.');
    if (!ns.periodic) return Promise.resolve('Background checks: not supported on this browser — you’ll see updates when you open the app.');
    return swReg.periodicSync.getTags().then(function (tags) {
      return tags.indexOf('check-update') >= 0 ? 'Background checks: on (Chrome/Edge installed app), about every 12 hours.'
        : 'Background checks need the installed app (Chrome/Edge). Until then you’re notified while the app is open.';
    }).catch(function () { return 'Background checks unavailable — you’ll see updates when you open the app.'; });
  }

  /* ------------------------------------------------------------------ */
  /* Router (hash based: browser/Android back moves between screens)     */
  /* ------------------------------------------------------------------ */
  var cleanups = [];
  var ctl = null; // active keyboard controller {submit, hint, solution, next, prev, choose}
  function onCleanup(fn) { cleanups.push(fn); }
  function runCleanups() { while (cleanups.length) { try { cleanups.pop()(); } catch (e) { } } ctl = null; }

  var VIEWS = {};
  var TAB_OF = { home: 'home', practice: 'practice', play: 'practice', review: 'review', train: 'train', sprint: 'train', drills: 'train', interview: 'train', stats: 'stats', settings: 'settings' };
  var TITLES = { home: 'Home', practice: 'Practice', play: 'Practice', review: 'Review', train: 'Train', sprint: 'Mental math', drills: 'Probability drills', interview: 'Interview mode', stats: 'Stats', settings: 'Settings' };
  function route() {
    var h = decodeURIComponent((location.hash || '#home').slice(1));
    var parts = h.split('/');
    var name = parts[0] || 'home';
    // legacy deep link from 1.0: #practice/<problem-id>
    if (name === 'practice' && parts[1] && BY_ID[parts[1]]) { startSession([parts[1]], BY_ID[parts[1]].title, 0, true); return; }
    if (!VIEWS[name]) name = 'home';
    runCleanups();
    var main = $('#view');
    main.classList.remove('view-enter');
    void main.offsetWidth;
    main.classList.add('view-enter');
    var tab = TAB_OF[name] || 'home';
    $all('[data-tab]').forEach(function (a) {
      if (a.getAttribute('data-tab') === tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    document.body.setAttribute('data-view', name);
    VIEWS[name](main, parts.slice(1));
    document.title = (TITLES[name] || 'Home') + ' · Stat Brainteaser';
    window.scrollTo(0, 0);
  }
  function go(hash, replace) {
    if (location.hash === hash) { route(); return; }
    if (replace) { history.replaceState(null, '', hash); route(); }
    else location.hash = hash;
  }

  function updateBadges() {
    var n = dueIds().length;
    $all('[data-due-badge]').forEach(function (b) { b.textContent = n; b.classList.toggle('hidden', n === 0); });
  }

  /* ------------------------------------------------------------------ */
  /* Sessions: an ordered list of problems you step through              */
  /* ------------------------------------------------------------------ */
  function startSession(ids, label, startIdx, replace) {
    ids = ids.filter(function (id) { return BY_ID[id]; });
    if (!ids.length) { toast('No problems to practice here.'); return; }
    S.session = { ids: ids, idx: startIdx || 0, label: label || 'Practice', res: {}, t: Date.now() };
    save();
    go('#play/' + (startIdx || 0), replace);
  }
  function orderForPractice(list) {
    // new first (easy → hard), then missed, then solved; shuffled within each block
    var rank = { 'new': 0, missed: 1, solved: 2 };
    return shuffle(list).sort(function (a, b) {
      return rank[status(a.id)] - rank[status(b.id)] || a.diff - b.diff;
    });
  }
  function startTopic(cat) {
    var list = orderForPractice(PROBLEMS.filter(function (p) { return p.cat === cat; }));
    startSession(list.map(function (p) { return p.id; }), catName(cat), 0);
  }
  function weakestCategory() {
    var best = null;
    CATS.forEach(function (c) {
      var st = catStats(c.id);
      if (!st.total) return;
      if (st.n >= 3 && (!best || st.acc < best.score)) best = { id: c.id, score: st.acc, n: st.n };
    });
    if (best) return best;
    var least = null;
    CATS.forEach(function (c) {
      var st = catStats(c.id);
      if (!st.total) return;
      var n = PROBLEMS.filter(function (p) { return p.cat === c.id && S.attempts[p.id]; }).length;
      if (!least || n < least.n) least = { id: c.id, score: null, n: n };
    });
    return least;
  }
  // Daily mix: due reviews first, then problems drawn with weight toward weak / unpracticed topics.
  function dailyMix(size) {
    size = size || 10;
    var out = dueIds().slice(0, Math.min(4, size));
    var weights = CATS.map(function (c) {
      var st = catStats(c.id);
      if (!st.total) return 0;
      var acc = st.n >= 3 ? st.acc : 0.5;
      var coverage = st.solved / st.total;
      return 0.6 + 2 * (1 - acc) + (1 - coverage);
    });
    var guard = 0;
    while (out.length < size && guard++ < 400) {
      var tot = weights.reduce(function (s, w) { return s + w; }, 0);
      if (!tot) break;
      var r = Math.random() * tot, ci = 0;
      while (r > weights[ci]) { r -= weights[ci]; ci++; }
      var cat = CATS[Math.min(ci, CATS.length - 1)].id;
      var cands = PROBLEMS.filter(function (p) { return p.cat === cat && out.indexOf(p.id) < 0; });
      var fresh = cands.filter(function (p) { return status(p.id) !== 'solved'; });
      var pool = fresh.length ? fresh : cands;
      if (!pool.length) { weights[ci] = 0; continue; }
      out.push(pick(pool).id);
    }
    var due = out.slice(0, Math.min(4, dueIds().length));
    return due.concat(shuffle(out.slice(due.length)));
  }
  function sessionInfo() {
    var s = S.session;
    if (!s || !s.ids || !s.ids.length) return null;
    var done = Object.keys(s.res || {}).length;
    var finished = s.idx >= s.ids.length || done >= s.ids.length;
    return { label: s.label, idx: Math.min(s.idx, s.ids.length - 1), n: s.ids.length, done: done, finished: finished };
  }

  /* ------------------------------------------------------------------ */
  /* Problem card (shared by Play, Review, Interview)                    */
  /* ------------------------------------------------------------------ */
  function diffDots(d) {
    var s = '<span class="diff" title="' + DIFF_NAME[d] + '" aria-label="Difficulty ' + d + ' of 3">';
    for (var i = 1; i <= 3; i++) s += '<i class="' + (i <= d ? 'on' : '') + '"></i>';
    return s + '</span>';
  }
  function catBadge(cat) { return '<span class="badge cat" style="--cat: var(--c-' + esc(cat) + ')">' + esc(catName(cat)) + '</span>'; }
  function solutionBody(p) {
    var sol = p.solution || '';
    var tail = stripTags(sol).slice(-300);
    var needFinal = !/answer/i.test(tail);
    return '<div class="key">' + ICONS.bulb + '<div><b>Key idea.</b> ' + (p.key || '') + '</div></div>' + sol +
      (needFinal ? '<p class="final">Answer: ' + answerDisplay(p) + '</p>' : '');
  }
  function statusIcon(st) {
    if (st === 'solved') return '<span class="sicon ok" title="Solved">' + ICONS.check + '</span>';
    if (st === 'missed') return '<span class="sicon bad" title="Missed last time">' + ICONS.x + '</span>';
    return '<span class="sicon new" title="New">' + ICONS.dot + '</span>';
  }

  /*
   * opts: { mode: 'practice'|'review'|'interview', onResult(correct, how), onNext, onPrev,
   *         nextLabel, allowSolution, header (html above title) }
   */
  function mountProblem(host, p, opts) {
    opts = opts || {};
    var a = p.answer || {};
    var st = { hints: 0, graded: false, revealed: false, correct: null };
    var letters = 'ABCDEFGH';
    var fh = formatHint(p);
    var interview = opts.mode === 'interview';
    var html = '<article class="card problem" aria-labelledby="pt-' + esc(p.id) + '">' +
      (opts.header || '') +
      '<div class="ptop"><h1 class="problem-title" id="pt-' + esc(p.id) + '">' + esc(p.title) + '</h1><span class="pstate" aria-hidden="true"></span></div>' +
      '<div class="problem-meta">' + diffDots(p.diff) +
      (p.tags || []).slice(0, 3).map(function (t) { return '<span class="badge">' + esc(t) + '</span>'; }).join('') + '</div>' +
      '<div class="prompt">' + p.prompt + '</div>';
    if (a.type === 'numeric' || a.type === 'text') {
      html += '<form class="answer-form" autocomplete="off" novalidate>' +
        '<label class="sr-only" for="ans-' + esc(p.id) + '">Your answer</label>' +
        '<div class="answer-row"><input id="ans-' + esc(p.id) + '" type="text" class="' + (a.type === 'text' ? 'mono-in' : '') + '" placeholder="' + esc(fh.ph) + '" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" aria-describedby="help-' + esc(p.id) + '">' +
        '<button class="btn primary" type="submit">Check</button></div>' +
        '<div class="answer-help" id="help-' + esc(p.id) + '">' + esc(fh.help) + '</div></form>';
    } else if (a.type === 'choice') {
      html += '<div class="choices" role="group" aria-label="Answer choices">' + a.options.map(function (o, i) {
        return '<button type="button" class="choice" data-i="' + i + '"><span class="letter">' + letters[i] + '</span><span>' + o + '</span></button>';
      }).join('') + '</div>';
    } else {
      html += '<p class="answer-help">Open question — work it out (paper helps), then reveal the solution and grade yourself honestly.</p>';
    }
    html += '<div class="feedback" role="status" aria-live="polite"></div>';
    // hints & solution as expandable sections
    html += '<div class="reveals">';
    (p.hints || []).forEach(function (h, i) {
      html += '<details class="reveal hint" data-h="' + i + '"><summary>' + ICONS.bulb + '<span>Hint ' + (i + 1) + '</span><span class="chev" aria-hidden="true">▾</span></summary><div class="rbody">' + h + '</div></details>';
    });
    if (opts.allowSolution !== false) {
      html += '<details class="reveal sol"><summary>' + ICONS.book + '<span>Solution</span><small class="muted">' + (a.type === 'self' ? 'then grade yourself' : 'counts as a miss') + '</small><span class="chev" aria-hidden="true">▾</span></summary><div class="rbody"><div class="self-wrap"></div>' + solutionBody(p) + '</div></details>';
    }
    html += '</div>';
    html += '<div class="pnav">' +
      (opts.onPrev ? '<button type="button" class="btn ghost" data-act="prev">' + ICONS.left + ' Previous</button>' : '') +
      (interview ? '<button type="button" class="btn ghost" data-act="giveup">' + (a.type === 'self' ? 'Done — grade myself' : 'Give up') + ' <span class="kbd">S</span></button>' : '') +
      '<span class="spacer"></span>' +
      (opts.onNext ? '<button type="button" class="btn ' + (interview ? 'primary hidden' : 'ghost') + '" data-act="next">' + esc(opts.nextLabel || 'Next') + ' ' + ICONS.right + '</button>' : '') +
      '</div></article>';
    host.innerHTML = html;

    var card = host.querySelector('.problem');
    var fb = card.querySelector('.feedback');
    var input = card.querySelector('input');
    var nextBtn = card.querySelector('[data-act="next"]');
    var solDet = card.querySelector('details.sol');

    function feedback(kind, msg) { fb.className = 'feedback show ' + kind; fb.innerHTML = msg; }
    function setState(ok) {
      card.classList.remove('is-correct', 'is-wrong');
      card.classList.add(ok ? 'is-correct' : 'is-wrong');
      card.querySelector('.pstate').innerHTML = ok ? ICONS.check : ICONS.x;
    }
    function primaryNext() {
      if (nextBtn) { nextBtn.classList.remove('hidden', 'ghost'); nextBtn.classList.add('primary'); }
    }
    function grade(correct, how) {
      if (st.graded) return;
      st.graded = true; st.correct = correct;
      recordAttempt(p.id, correct, { hints: st.hints });
      setState(correct);
      if (opts.onResult) opts.onResult(correct, how);
      primaryNext();
    }
    function openSolution() {
      if (!solDet) return;
      st.revealed = true;
      if (!solDet.open) solDet.open = true;
    }
    function submit() {
      if (a.type !== 'numeric' && a.type !== 'text') return;
      var raw = input.value;
      var r = checkAnswer(p, raw);
      if (r.invalid) { feedback('info', a.type === 'text' ? 'Type an answer first.' : 'I couldn’t read that. Try a number, a fraction (5/36), a percent (12.5%) or an expression.'); return; }
      if (st.graded) {
        feedback(r.ok ? 'ok' : 'bad', r.ok ? 'That matches (this problem is already graded).' : 'Still not matching — see the solution.');
        return;
      }
      if (r.ok) {
        feedback('ok', '<b>Correct.</b> ' + (a.range ? 'Inside the accepted range. ' : '') + (interview ? '' : 'Compare with the worked solution below.'));
        grade(true, 'answer');
        if (!interview) openSolution();
      } else {
        var msg = '<b>Not quite.</b> ' + (r.close ? 'Close — check precision or arithmetic. ' : '');
        msg += interview ? 'The solution is in the summary.' : 'Try again, open a hint, or read the solution.';
        feedback('bad', msg);
        grade(false, 'answer');
      }
    }
    function hint() {
      var dets = card.querySelectorAll('details.hint');
      for (var i = 0; i < dets.length; i++) { if (!dets[i].open) { dets[i].open = true; return; } }
    }
    function showSelfGrade() {
      var sw = card.querySelector('.self-wrap');
      if (!sw || st.graded) return;
      sw.innerHTML = '<div class="self-grade" role="group" aria-label="Grade yourself"><span>How did you do?</span>' +
        '<button type="button" class="btn sm" data-g="1">' + ICONS.check + ' I had it</button>' +
        '<button type="button" class="btn sm" data-g="0">' + ICONS.x + ' I missed it</button></div>';
      sw.querySelectorAll('[data-g]').forEach(function (b) {
        b.addEventListener('click', function () {
          var ok = b.getAttribute('data-g') === '1';
          grade(ok, 'self');
          sw.innerHTML = '';
          feedback(ok ? 'ok' : 'bad', ok ? 'Marked as solved.' : 'Marked as missed — it will come back in Review.');
        });
      });
    }
    function onSolutionOpened() {
      st.revealed = true;
      if (a.type === 'self') { showSelfGrade(); return; }
      if (!st.graded) {
        grade(false, 'revealed');
        feedback('info', 'Solution opened before answering — counted as a miss so it comes back in Review.');
      }
    }
    function solution() { if (solDet && !interview) openSolution(); else if (interview) giveUp(); }
    function giveUp() {
      if (st.graded) return;
      if (a.type === 'self') {
        // interview: self-graded problems are graded right away without showing the solution
        var sw = document.createElement('div'); sw.className = 'self-wrap';
        card.querySelector('.feedback').after(sw);
        sw.innerHTML = '<div class="self-grade"><span>Did you solve it?</span><button type="button" class="btn sm" data-g="1">' + ICONS.check + ' Yes</button><button type="button" class="btn sm" data-g="0">' + ICONS.x + ' No</button></div>';
        sw.querySelectorAll('[data-g]').forEach(function (b) {
          b.addEventListener('click', function () { grade(b.getAttribute('data-g') === '1', 'self'); sw.remove(); });
        });
        return;
      }
      feedback('bad', 'Skipped — counted as a miss. The solution is in the summary.');
      grade(false, 'gaveup');
    }
    function chooseOpt(i) {
      if (st.graded) return;
      var btns = card.querySelectorAll('.choice');
      btns.forEach(function (b, j) {
        b.disabled = true;
        if (j === a.correct) b.classList.add('correct');
        else if (j === i) b.classList.add('wrong');
      });
      var ok = i === a.correct;
      feedback(ok ? 'ok' : 'bad', ok ? '<b>Correct.</b>' : '<b>Not quite</b> — the answer is ' + letters[a.correct] + '.');
      grade(ok, 'choice');
      if (!interview) openSolution();
    }

    var form = card.querySelector('form');
    if (form) form.addEventListener('submit', function (e) { e.preventDefault(); submit(); });
    card.querySelectorAll('.choice').forEach(function (b) { b.addEventListener('click', function () { chooseOpt(+b.getAttribute('data-i')); }); });
    card.querySelectorAll('details.hint').forEach(function (d) {
      d.addEventListener('toggle', function () { if (d.open && !d.dataset.seen) { d.dataset.seen = '1'; st.hints++; } });
    });
    if (solDet) solDet.addEventListener('toggle', function () { if (solDet.open) onSolutionOpened(); });
    var gb = card.querySelector('[data-act="giveup"]'); if (gb) gb.addEventListener('click', giveUp);
    if (nextBtn) nextBtn.addEventListener('click', function () { if (!interview || st.graded) opts.onNext(); });
    var pb = card.querySelector('[data-act="prev"]'); if (pb) pb.addEventListener('click', function () { opts.onPrev(); });
    if (input && opts.autofocus !== false && hoverDevice()) input.focus();

    return {
      submit: submit, hint: hint, solution: solution,
      next: function () { if (opts.onNext && (!interview || st.graded)) opts.onNext(); },
      prev: function () { if (opts.onPrev) opts.onPrev(); },
      choose: function (i) { if (a.type === 'choice' && i < a.options.length) chooseOpt(i); },
      state: st, grade: grade, feedback: feedback, card: card
    };
  }

  /* ------------------------------------------------------------------ */
  /* Onboarding (first run only)                                         */
  /* ------------------------------------------------------------------ */
  var modalOpen = false;
  function showOnboarding() {
    var steps = [
      { t: 'Welcome to Stat Brainteaser', b: '<p>' + PROBLEMS.length + ' interview problems across <b>' + CATS.length + ' topics</b> — probability, statistics, EV games, brainteasers, Fermi, plus Python, SQL and machine learning.</p><ul><li><b>Practice</b> by topic, or tap <b>Daily mix</b>.</li><li><b>Review</b> brings back what you missed (spaced repetition).</li><li><b>Train</b>: mental-math sprints, endless probability drills, timed interviews.</li></ul>' },
      { t: 'Install it — works offline', b: isIOS()
        ? '<p>On iPhone/iPad in <b>Safari</b>: tap <b>Share</b> then <b>Add to Home Screen</b>.</p><p>After the first visit everything is cached, so it works on the metro with no signal.</p>'
        : '<p>On a computer: click <b>Install</b> (or the install icon in Chrome/Edge’s address bar).</p><p>On Android: Chrome menu → <b>Install app</b>. On iPhone: Safari → Share → <b>Add to Home Screen</b>.</p><p>Once loaded, it works fully offline.</p>' },
      { t: 'Your progress stays with you', b: '<p>Progress is saved on <b>this device</b> only — no account, no tracking.</p><p>To move it between your PC and phone, use <b>Settings → Export progress</b>, then <b>Import</b> on the other device.</p>' }
    ];
    var i = 0;
    var back = document.createElement('div');
    back.className = 'modal-back';
    back.innerHTML = '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="obTitle"><div class="ob-dots" aria-hidden="true"></div><h2 id="obTitle"></h2><div class="ob-body"></div>' +
      '<div class="row ob-actions"><button type="button" class="btn ghost" data-ob="skip">Skip</button><span class="spacer"></span><button type="button" class="btn" data-ob="back">Back</button><button type="button" class="btn primary" data-ob="next"></button></div></div>';
    document.body.appendChild(back);
    modalOpen = true;
    function render() {
      back.querySelector('#obTitle').textContent = steps[i].t;
      back.querySelector('.ob-body').innerHTML = steps[i].b;
      back.querySelector('.ob-dots').innerHTML = steps.map(function (_, j) { return '<i class="' + (j === i ? 'on' : '') + '"></i>'; }).join('');
      back.querySelector('[data-ob="back"]').classList.toggle('hidden', i === 0);
      back.querySelector('[data-ob="next"]').textContent = i === steps.length - 1 ? 'Get started' : 'Next';
      back.querySelector('[data-ob="next"]').focus();
    }
    function close() {
      S.ui.onboarded = true; save();
      back.remove(); modalOpen = false;
      document.removeEventListener('keydown', onKey, true);
    }
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'Tab') { // keep focus inside the dialog
        var f = $all('button:not(.hidden)', back);
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    back.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ob]');
      if (!b) return;
      var k = b.getAttribute('data-ob');
      if (k === 'skip') close();
      else if (k === 'back') { i = Math.max(0, i - 1); render(); }
      else if (i < steps.length - 1) { i++; render(); } else close();
    });
    document.addEventListener('keydown', onKey, true);
    render();
  }

  /* ------------------------------------------------------------------ */
  /* Home                                                                */
  /* ------------------------------------------------------------------ */
  function topicCard(c) {
    var st = catStats(c.id);
    var frac = st.total ? st.solved / st.total : 0;
    return '<button type="button" class="topic" data-topic="' + c.id + '" style="--cat: var(--c-' + c.id + ')">' +
      '<span class="ticon">' + ICONS[c.icon] + '</span>' +
      '<span class="tbody"><span class="tname">' + esc(c.name) + '</span>' +
      '<span class="tmeta">' + st.total + ' problems · ' + st.solved + ' solved' + (st.acc !== null ? ' · ' + pct(st.acc) : '') + '</span>' +
      '<span class="tbar" role="img" aria-label="' + Math.round(frac * 100) + '% solved"><span style="width:' + (frac * 100) + '%"></span></span></span></button>';
  }
  VIEWS.home = function (main) {
    var due = dueIds().length;
    var sk = streakInfo();
    var si = sessionInfo();
    var weak = weakestCategory();
    var html = '';
    if (isIOS() && !isStandalone() && !S.ui.iosHintDismissed && S.ui.onboarded) {
      html += '<div class="banner" id="iosHint"><p><b>Install on iPhone:</b> tap <b>Share</b> then <b>Add to Home Screen</b>. It then works fully offline.</p>' +
        '<button class="btn sm ghost" type="button" id="iosHintX" aria-label="Dismiss">✕</button></div>';
    }
    var h = new Date().getHours();
    var greet = h < 5 ? 'Late-night session' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
    html += '<section class="hero-card"><div class="hero-text"><p class="eyebrow">' + greet + '</p><h1>What are we training today?</h1>' +
      '<p class="muted">' + PROBLEMS.length + ' problems · ' + solvedCount() + ' solved · ' + sk.cur + '-day streak</p></div>' +
      '<div class="hero-actions">' +
      (si && !si.finished ? '<button type="button" class="btn primary lg" id="contBtn">' + ICONS.play + '<span><b>Continue</b><small>' + esc(si.label) + ' · ' + (si.idx + 1) + '/' + si.n + '</small></span></button>' : '') +
      '<button type="button" class="btn ' + (si && !si.finished ? '' : 'primary ') + 'lg" id="mixBtn">' + ICONS.shuffle + '<span><b>Daily mix</b><small>10 problems, weighted to weak & due</small></span></button>' +
      (due ? '<a class="btn lg" href="#review">' + ICONS.review + '<span><b>Review ' + due + '</b><small>due today</small></span></a>' : '') +
      '</div></section>';
    html += '<div class="tiles">' +
      '<div class="stat-tile' + (due ? ' accent' : '') + '"><div class="v">' + due + '</div><div class="l">Due today</div></div>' +
      '<div class="stat-tile"><div class="v">' + sk.cur + '<small> d</small></div><div class="l">Streak</div></div>' +
      '<div class="stat-tile"><div class="v">' + solvedCount() + '<small>/' + PROBLEMS.length + '</small></div><div class="l">Solved</div></div>' +
      '<div class="stat-tile"><div class="v">' + bestSprintText() + '</div><div class="l">Best sprint</div></div></div>';
    GROUPS.forEach(function (g) {
      var cs = CATS.filter(function (c) { return c.group === g.id && catStats(c.id).total; });
      if (!cs.length) return;
      html += '<section class="group"><div class="group-head"><h2>' + esc(g.name) + '</h2><p class="muted small">' + esc(g.desc) + '</p></div>' +
        '<div class="topics">' + cs.map(topicCard).join('') + '</div></section>';
    });
    html += '<section class="group"><div class="group-head"><h2>Train</h2><p class="muted small">Speed and stamina.</p></div><div class="mode-grid">' +
      modeCard('#sprint', 'sprint', 'Mental math sprint', 'Best ' + bestSprintText() + ' · Zetamac-style') +
      modeCard('#drills', 'drills', 'Probability drills', 'Endless generated questions') +
      modeCard('#interview', 'interview', 'Interview mode', '5 problems against the clock') + '</div></section>';
    if (weak) {
      html += '<div class="banner"><p><b>Suggested focus: ' + esc(catName(weak.id)) + '</b> — ' + (weak.score !== null ? 'your lowest accuracy so far (' + pct(weak.score) + ').' : 'the topic you’ve practiced least.') + '</p>' +
        '<button class="btn sm primary" type="button" data-topic="' + weak.id + '">Start</button></div>';
    }
    // One-time, dismissible offer for update notifications (after onboarding).
    if (S.ui.onboarded && !S.ui.notifyOffered && !S.settings.notify && 'Notification' in window && Notification.permission !== 'denied') {
      var offer = '<div class="banner offer" id="notifyOffer"><p><b>Want to know when new problems land?</b> Turn on update notifications — you can change this anytime in Settings.</p>' +
        '<div class="row"><button class="btn sm primary" type="button" id="offerYes">Turn on</button><button class="btn sm ghost" type="button" id="offerNo">No thanks</button></div></div>';
      html = html.replace('<section class="group">', offer + '<section class="group">');
    }
    main.innerHTML = html;
    var oy = $('#offerYes');
    if (oy) {
      var closeOffer = function () { S.ui.notifyOffered = true; save(); var o = $('#notifyOffer'); if (o) o.remove(); };
      oy.addEventListener('click', function () { closeOffer(); enableNotifications(); });
      $('#offerNo').addEventListener('click', closeOffer);
    }
    var x = $('#iosHintX');
    if (x) x.addEventListener('click', function () { S.ui.iosHintDismissed = true; save(); $('#iosHint').remove(); });
    var cb = $('#contBtn'); if (cb) cb.addEventListener('click', function () { go('#play/' + S.session.idx); });
    $('#mixBtn').addEventListener('click', function () { startSession(dailyMix(10), 'Daily mix', 0); });
    $all('[data-topic]', main).forEach(function (b) { b.addEventListener('click', function () { startTopic(b.getAttribute('data-topic')); }); });
    ctl = { submit: function () { if (si && !si.finished) go('#play/' + S.session.idx); else startSession(dailyMix(10), 'Daily mix', 0); } };
  };
  function modeCard(href, icon, title, desc) {
    return '<a class="mode-card" href="' + href + '"><span class="ic">' + ICONS[icon] + '</span><span><b>' + esc(title) + '</b><small>' + esc(desc) + '</small></span></a>';
  }
  function bestSprintText() {
    var h = S.sprint.history;
    if (!h.length) return '—';
    var b = h.filter(function (r) { return r.key === 'classic-120'; });
    return Math.max.apply(null, (b.length ? b : h).map(function (r) { return r.score; }));
  }

  /* ------------------------------------------------------------------ */
  /* Practice: search + filters + compact list                           */
  /* ------------------------------------------------------------------ */
  function filtered(f) {
    var q = (f.q || '').trim().toLowerCase();
    var terms = q ? q.split(/\s+/) : [];
    return PROBLEMS.filter(function (p) {
      if (f.cats.length && f.cats.indexOf(p.cat) < 0) return false;
      if (f.diffs.length && f.diffs.indexOf(p.diff) < 0) return false;
      var s = status(p.id);
      if (f.status === 'new' && s !== 'new') return false;
      if (f.status === 'missed' && s !== 'missed') return false;
      if (f.status === 'solved' && s !== 'solved') return false;
      if (terms.length) {
        var hay = p._hay || (p._hay = (p.id + ' ' + p.title + ' ' + (p.tags || []).join(' ') + ' ' + catName(p.cat) + ' ' + stripTags(p.prompt)).toLowerCase());
        for (var i = 0; i < terms.length; i++) if (hay.indexOf(terms[i]) < 0) return false;
      }
      return true;
    });
  }
  VIEWS.practice = function (main, args) {
    var f = S.settings.filters;
    if (args[0] && CAT[args[0]]) { f.cats = [args[0]]; save(); }
    main.innerHTML =
      '<div class="page-head"><div><h1>Practice</h1><p class="muted" id="matchCount" aria-live="polite"></p></div>' +
      '<button class="btn primary" type="button" id="startList">' + ICONS.play + ' Start <span id="startN"></span></button></div>' +
      '<div class="practice-layout"><aside class="filters card">' +
      '<label class="search"><span class="sr-only">Search problems</span>' + ICONS.search + '<input type="search" id="q" placeholder="Search title, tag, text…" value="' + esc(f.q || '') + '" autocomplete="off"></label>' +
      '<div class="frow"><span class="label" id="lblCat">Topic</span>' +
      GROUPS.map(function (g) {
        return '<div class="chips scroll" role="group" aria-labelledby="lblCat">' + CATS.filter(function (c) { return c.group === g.id && catStats(c.id).total; }).map(function (c) {
          return '<button type="button" class="chip" data-cat="' + c.id + '" aria-pressed="' + (f.cats.indexOf(c.id) >= 0) + '" style="--cat: var(--c-' + c.id + ')"><span class="dot"></span>' + esc(c.name) + '</button>';
        }).join('') + '</div>';
      }).join('') + '</div>' +
      '<div class="frow"><span class="label" id="lblDiff">Difficulty</span><div class="chips" role="group" aria-labelledby="lblDiff">' +
      [1, 2, 3].map(function (d) { return '<button type="button" class="chip" data-diff="' + d + '" aria-pressed="' + (f.diffs.indexOf(d) >= 0) + '">' + diffDots(d) + ' ' + DIFF_NAME[d] + '</button>'; }).join('') +
      '</div></div>' +
      '<div class="frow"><span class="label" id="lblSt">Status</span><div class="seg" role="group" aria-labelledby="lblSt">' +
      [['all', 'All'], ['new', 'New'], ['missed', 'Missed'], ['solved', 'Solved']].map(function (o) {
        return '<button type="button" data-st="' + o[0] + '" aria-pressed="' + (f.status === o[0]) + '">' + o[1] + '</button>';
      }).join('') + '</div></div>' +
      '<button type="button" class="btn sm ghost" id="clearF">Clear filters</button></aside>' +
      '<section class="list-wrap"><ul class="plist" id="plist" aria-label="Problems"></ul></section></div>';

    var list = [];
    function refresh() {
      list = filtered(f);
      $('#matchCount').textContent = list.length + ' of ' + PROBLEMS.length + ' problems';
      $('#startN').textContent = list.length ? '(' + list.length + ')' : '';
      $('#startList').disabled = !list.length;
      $('#plist').innerHTML = list.length ? list.map(function (p, i) {
        return '<li><button type="button" data-i="' + i + '">' + statusIcon(status(p.id)) +
          '<span class="t"><span class="tt">' + esc(p.title) + '</span><span class="tm"><span class="cdot" style="--cat: var(--c-' + p.cat + ')"></span>' + esc(catName(p.cat)) + '</span></span>' + diffDots(p.diff) + '</button></li>';
      }).join('') : '<li class="empty"><b>No problems match.</b><br><span class="muted small">Try clearing the search or filters.</span></li>';
    }
    function persist() { S.settings.filters = f; save(); }
    $all('[data-cat]', main).forEach(function (b) {
      b.addEventListener('click', function () {
        var c = b.getAttribute('data-cat'), i = f.cats.indexOf(c);
        if (i >= 0) f.cats.splice(i, 1); else f.cats.push(c);
        b.setAttribute('aria-pressed', String(i < 0)); persist(); refresh();
      });
    });
    $all('[data-diff]', main).forEach(function (b) {
      b.addEventListener('click', function () {
        var d = +b.getAttribute('data-diff'), i = f.diffs.indexOf(d);
        if (i >= 0) f.diffs.splice(i, 1); else f.diffs.push(d);
        b.setAttribute('aria-pressed', String(i < 0)); persist(); refresh();
      });
    });
    $all('[data-st]', main).forEach(function (b) {
      b.addEventListener('click', function () {
        f.status = b.getAttribute('data-st');
        $all('[data-st]', main).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        persist(); refresh();
      });
    });
    var qt = null;
    $('#q').addEventListener('input', function (e) { f.q = e.target.value; clearTimeout(qt); qt = setTimeout(function () { persist(); refresh(); }, 120); });
    $('#clearF').addEventListener('click', function () { S.settings.filters = { cats: [], diffs: [], status: 'all', q: '' }; save(); go('#practice', true); });
    function label() {
      if (f.q) return 'Search: ' + f.q;
      if (f.cats.length === 1) return catName(f.cats[0]);
      if (f.cats.length) return f.cats.map(function (c) { return CAT[c].short; }).join(' + ');
      return 'All topics';
    }
    $('#startList').addEventListener('click', function () { startSession(orderForPractice(list).map(function (p) { return p.id; }), label(), 0); });
    $('#plist').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-i]');
      if (b) startSession(list.map(function (p) { return p.id; }), label(), +b.getAttribute('data-i'));
    });
    refresh();
    ctl = { submit: function () { if (list.length) $('#startList').click(); } };
  };

  /* ------------------------------------------------------------------ */
  /* Play: one problem of the current session                            */
  /* ------------------------------------------------------------------ */
  VIEWS.play = function (main, args) {
    var s = S.session;
    if (!s || !s.ids || !s.ids.length) {
      main.innerHTML = '<div class="card empty">' + ICONS.practice + '<h2>No active session</h2><p class="muted">Pick a topic on Home, or browse the problem list.</p>' +
        '<div class="row center"><a class="btn primary" href="#home">Choose a topic</a><a class="btn" href="#practice">Browse problems</a></div></div>';
      return;
    }
    s.res = s.res || {};
    if (args[0] === 'done') return sessionDone(main);
    var idx = Math.max(0, Math.min(s.ids.length - 1, parseInt(args[0], 10) || 0));
    s.idx = idx; save();
    var p = BY_ID[s.ids[idx]];
    var n = s.ids.length;
    var doneCount = Object.keys(s.res).length;
    function goIdx(i) {
      if (i >= n) { location.hash = '#play/done'; return; }
      location.hash = '#play/' + Math.max(0, i);
    }
    var header = '<nav class="crumbs" aria-label="Breadcrumb"><a href="#practice/' + esc(p.cat) + '" style="--cat: var(--c-' + p.cat + ')"><span class="cdot"></span>' + esc(catName(p.cat)) + '</a>' +
      '<span aria-hidden="true">›</span><span>' + DIFF_NAME[p.diff] + '</span><span class="spacer"></span><span class="count">' + (idx + 1) + ' / ' + n + '</span></nav>' +
      '<div class="sbar" role="progressbar" aria-label="Session progress" aria-valuemin="0" aria-valuemax="' + n + '" aria-valuenow="' + doneCount + '"><div style="width:' + (doneCount / n * 100) + '%"></div></div>';
    main.innerHTML = '<div class="play"><div class="play-main" id="pHost"></div><aside class="play-side card" aria-label="Session">' +
      '<div class="row"><b>' + esc(s.label) + '</b><span class="spacer"></span><span class="muted small">' + doneCount + '/' + n + ' answered</span></div>' +
      '<ol class="slist">' + s.ids.map(function (id, i) {
        var q = BY_ID[id]; if (!q) return '';
        var r = s.res[id];
        var st = r === true ? 'solved' : r === false ? 'missed' : 'new';
        return '<li><a href="#play/' + i + '"' + (i === idx ? ' aria-current="step"' : '') + '>' + statusIcon(st) + '<span>' + esc(q.title) + '</span></a></li>';
      }).join('') + '</ol>' +
      '<p class="muted small kbd-help">Keys: <span class="kbd">Enter</span> check · <span class="kbd">H</span> hint · <span class="kbd">S</span> solution · <span class="kbd">N</span>/<span class="kbd">P</span> next/prev · <span class="kbd">1</span>–<span class="kbd">4</span> options</p></aside></div>';
    var c = mountProblem($('#pHost'), p, {
      mode: 'practice', header: header,
      nextLabel: idx + 1 < n ? 'Next' : 'Finish',
      onResult: function (ok) { s.res[p.id] = ok; save(); },
      onNext: function () { goIdx(idx + 1); },
      onPrev: idx > 0 ? function () { goIdx(idx - 1); } : null
    });
    ctl = c;
    var cur = main.querySelector('.slist [aria-current]');
    if (cur && cur.scrollIntoView && window.innerWidth >= 1100) cur.scrollIntoView({ block: 'nearest' });
  };
  function sessionDone(main) {
    var s = S.session;
    var ids = s.ids, res = s.res || {};
    var answered = ids.filter(function (id) { return id in res; }).length;
    var right = ids.filter(function (id) { return res[id] === true; }).length;
    var missed = ids.filter(function (id) { return res[id] === false; });
    main.innerHTML = '<div class="card sprint-stage"><div class="label">' + esc(s.label) + ' — complete</div>' +
      '<div class="big-score">' + right + '<span class="muted" style="font-size:1.6rem">/' + answered + '</span></div>' +
      '<p class="muted">' + answered + ' of ' + ids.length + ' answered' + (missed.length ? ' · ' + missed.length + ' added to Review' : '') + '.</p>' +
      '<div class="row center">' + (missed.length ? '<button class="btn primary" type="button" id="redo">Retry the ' + missed.length + ' missed</button>' : '') +
      '<button class="btn' + (missed.length ? '' : ' primary') + '" type="button" id="mix">Daily mix</button><a class="btn" href="#home">Home</a></div></div>';
    var r = $('#redo'); if (r) r.addEventListener('click', function () { startSession(missed, s.label + ' (retry)', 0); });
    $('#mix').addEventListener('click', function () { startSession(dailyMix(10), 'Daily mix', 0); });
    s.idx = ids.length; save();
  }

  /* ------------------------------------------------------------------ */
  /* Spaced-repetition review                                            */
  /* ------------------------------------------------------------------ */
  VIEWS.review = function (main) {
    var queue = dueIds();
    var done = 0, right = 0, total = queue.length;
    var requeued = {};
    main.innerHTML = '<div class="page-head"><div><h1>Review</h1><p class="muted" id="revSub">Spaced repetition: correct → next review in 1, 3, 7, 16, 35 days; a miss resets to tomorrow.</p></div></div><div id="rHost"></div>';
    function sub(extra) { if (total) $('#revSub').textContent = done + ' reviewed · ' + right + ' correct · ' + (queue.length + (extra || 0)) + ' left'; }
    function nextOne() {
      sub();
      if (!queue.length) {
        var upcoming = Object.keys(S.srs).filter(function (id) { return BY_ID[id]; }).map(function (id) { return S.srs[id].due; }).sort()[0];
        $('#rHost').innerHTML = '<div class="card empty">' + ICONS.check +
          (total ? '<h2>Review complete</h2><p class="muted">' + right + ' of ' + done + ' correct this session.</p>' : '<h2>All caught up</h2><p class="muted">Nothing is due today. Problems you attempt anywhere in the app are scheduled here automatically.</p>') +
          (upcoming ? '<p class="muted small">Next review due: ' + esc(upcoming) + '</p>' : '') +
          '<div class="row center"><button class="btn primary" type="button" id="rvMix">Daily mix</button><a class="btn" href="#drills">Quick drills</a></div></div>';
        $('#rvMix').addEventListener('click', function () { startSession(dailyMix(10), 'Daily mix', 0); });
        ctl = null;
        return;
      }
      var id = queue.shift();
      var p = BY_ID[id];
      var box = (S.srs[id] || {}).box || 1;
      var header = '<nav class="crumbs"><span style="--cat: var(--c-' + p.cat + ')"><span class="cdot"></span>' + esc(catName(p.cat)) + '</span><span aria-hidden="true">›</span><span>Box ' + box + ' of 5</span><span class="spacer"></span><span class="count">' + (done + 1) + ' / ' + (done + 1 + queue.length) + '</span></nav>';
      ctl = mountProblem($('#rHost'), p, {
        mode: 'review', header: header, nextLabel: queue.length ? 'Next due' : 'Finish',
        onResult: function (ok) {
          done++; if (ok) right++;
          if (!ok && !requeued[id]) { requeued[id] = true; queue.push(id); }
          sub();
        },
        onNext: function () { nextOne(); window.scrollTo(0, 0); }
      });
    }
    nextOne();
  };

  /* ------------------------------------------------------------------ */
  /* Train hub                                                           */
  /* ------------------------------------------------------------------ */
  VIEWS.train = function (main) {
    var d = S.drills, ivs = S.interviews;
    main.innerHTML = '<div class="page-head"><div><h1>Train</h1><p class="muted">Timed and generated practice — the reps that make interviews feel easy.</p></div></div>' +
      '<div class="train-grid">' +
      trainCard('#sprint', 'sprint', 'Mental math sprint', 'Zetamac/Optiver-style: + − × ÷ against the clock, or the quant mix (percentages, fractions, squares).', 'Best (classic 120s): ' + bestSprintText()) +
      trainCard('#drills', 'drills', 'Probability drills', 'Endless generated questions with exact answers: dice, cards, binomial, Bayes, 2×2 tables, waiting times.', d.n ? d.c + '/' + d.n + ' correct · best streak ' + (d.bestStreak || 0) : 'Not started') +
      trainCard('#interview', 'interview', 'Interview mode', '5 problems from different topics with a countdown on each. Summary and solutions at the end.', ivs.length ? ivs.length + ' sessions · last ' + ivs[ivs.length - 1].score + '/' + ivs[ivs.length - 1].total : 'Not started') +
      '</div>';
  };
  function trainCard(href, icon, title, desc, stat) {
    return '<a class="train-card card" href="' + href + '"><span class="ic">' + ICONS[icon] + '</span><h2>' + esc(title) + '</h2><p class="muted">' + esc(desc) + '</p><p class="small"><b>' + esc(String(stat)) + '</b></p><span class="btn primary sm">Open ' + ICONS.right + '</span></a>';
  }
  function subHead(title, desc) {
    return '<div class="page-head"><div><a class="back-link" href="#train">' + ICONS.left + ' Train</a><h1>' + esc(title) + '</h1>' + (desc ? '<p class="muted">' + desc + '</p>' : '') + '</div></div>';
  }

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
            ? '<div class="ranges"><span class="rl">1st</span><input type="number" inputmode="numeric" data-r="' + rangeA + '.0" value="' + cfg[rangeA][0] + '" aria-label="' + label + ' first operand min"> – <input type="number" inputmode="numeric" data-r="' + rangeA + '.1" value="' + cfg[rangeA][1] + '" aria-label="' + label + ' first operand max"></div>' +
              '<div class="ranges"><span class="rl">' + sym + ' 2nd</span><input type="number" inputmode="numeric" data-r="' + rangeB + '.0" value="' + cfg[rangeB][0] + '" aria-label="' + label + ' second operand min"> – <input type="number" inputmode="numeric" data-r="' + rangeB + '.1" value="' + cfg[rangeB][1] + '" aria-label="' + label + ' second operand max"></div>'
            : '<div class="ranges"><span>inverse of ' + (k === 'sub' ? 'addition' : 'multiplication') + '</span></div>') + '</div>';
      };
      main.innerHTML = subHead('Mental math sprint', 'Answers auto-submit when correct. <span class="kbd">Esc</span> skips.') +
        '<div class="two-col"><div class="card stack">' +
        '<div class="frow"><span class="label">Mode</span><div class="seg" role="group" aria-label="Mode">' +
        '<button type="button" data-mode="classic" aria-pressed="' + (cfg.mode === 'classic') + '">Classic</button>' +
        '<button type="button" data-mode="quant" aria-pressed="' + (cfg.mode === 'quant') + '">Quant</button></div></div>' +
        '<div class="frow"><span class="label">Duration</span><div class="seg" role="group" aria-label="Duration">' +
        [30, 60, 120, 180].map(function (d) { return '<button type="button" data-dur="' + d + '" aria-pressed="' + (cfg.dur === d) + '">' + d + 's</button>'; }).join('') + '</div></div>' +
        (cfg.mode === 'classic'
          ? '<div class="ops-grid">' + opRow('add', 'Addition', 'addA', 'addB', '+') + opRow('sub', 'Subtraction') + opRow('mul', 'Multiplication', 'mulA', 'mulB', '×') + opRow('div', 'Division') + '</div>' +
            '<div><button type="button" class="btn sm ghost" id="resetRanges">Reset to Zetamac defaults</button></div>'
          : '<p class="muted small" style="margin:0">Quant mix: percentages (15% of 240), fractions to 3 decimals (5/16), squares to 35², 2-digit × teens, decimals (0.7 × 0.35), % change (80 → 100 = 25).</p>') +
        '<button type="button" class="btn primary block lg" id="startBtn">Start ' + cfg.dur + 's sprint <span class="kbd">Enter</span></button>' +
        '</div>' +
        '<div class="card"><div class="row"><h3 style="margin:0">History</h3><span class="spacer"></span><span class="muted small mono">' + esc(key) + '</span></div>' +
        '<div class="hist-best"><span class="big">' + (best === null ? '—' : best) + '</span><span class="muted small">best · ' + hist.length + ' runs</span></div>' +
        sparkline(hist.slice(-30).map(function (r) { return r.score; }), 300, 56, 'Recent scores') + '</div></div>';

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
      var score = 0, skipped = 0, q = null;
      var end = Date.now() + cfg.dur * 1000;
      main.innerHTML = '<div class="card sprint-stage">' +
        '<div class="sprint-top"><span>Score <span id="spScore">0</span></span><span id="spTime">' + fmtTime(cfg.dur) + '</span></div>' +
        '<div class="timebar" id="spBar"><div></div></div>' +
        '<div class="sprint-q" id="spQ" aria-live="polite"></div>' +
        '<label class="sr-only" for="spIn">Answer</label>' +
        '<input id="spIn" class="sprint-input" type="text" inputmode="decimal" autocomplete="off" autocapitalize="off" spellcheck="false">' +
        '<div class="row center" style="margin-top:1rem"><button type="button" class="btn" id="spSkip">Skip <span class="kbd">Esc</span></button>' +
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
        }
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
          '<p class="muted">' + esc(key) + ' · ' + skipped + ' skipped' + (isBest ? ' · <b class="res-ok">New best!</b>' : prevBest !== null ? ' · best ' + prevBest : '') + '</p>' +
          '<div class="row center"><button class="btn primary" type="button" id="again">Again <span class="kbd">Enter</span></button><button class="btn" type="button" id="toSetup">Settings</button></div></div>';
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
      name: 'E[max] / E[min]', gen: function () {
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
        else { fr = F(16, C52_2); prompt = 'Two cards are dealt from a shuffled 52-card deck. P(one ace and one king, in either order)?'; ex = '4·4 = 16 ace–king hands out of C(52,2) = 1326. (Ordered: 2·(4/52)(4/51) gives the same.)'; }
        return { prompt: prompt, fr: fr, explain: ex + ' = ' + fracDisplay(fr, 5) + '.' };
      }
    },
    urn: {
      name: 'Urn draws', gen: function () {
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
        var n = randInt(2, 6);
        var acc = F(0, 1);
        for (var k = 1; k <= n; k++) acc = F(acc.n * k + acc.d, acc.d * k);
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
    main.innerHTML = subHead('Probability drills', 'Generated questions with exact answers. Fractions, decimals and expressions like 1-(5/6)^4 are accepted.') +
      '<div class="card"><div class="frow"><span class="label">Question types <span class="muted" id="dtSum"></span></span><div class="chips scroll" role="group" aria-label="Question types">' +
      DRILL_KEYS.map(function (k) { return '<button type="button" class="chip" data-dt="' + k + '" aria-pressed="' + (sel.indexOf(k) >= 0) + '">' + esc(DRILLS[k].name) + '</button>'; }).join('') +
      '</div></div></div>' +
      '<div class="card problem"><div class="crumbs"><span id="dType"></span><span class="spacer"></span><span class="count">Session <b id="dScore">0/0</b> · streak <b id="dStreak">0</b></span></div>' +
      '<div class="prompt" id="dQ" style="min-height:3.2em"></div>' +
      '<form class="answer-form" id="dForm" autocomplete="off" novalidate><label class="sr-only" for="dIn">Your answer</label>' +
      '<div class="answer-row"><input id="dIn" type="text" placeholder="e.g. 5/36" autocapitalize="off" spellcheck="false" enterkeyhint="done"><button class="btn primary" type="submit" id="dBtn">Check</button></div></form>' +
      '<div class="feedback" id="dFb" role="status" aria-live="polite"></div>' +
      '<div class="pnav"><button type="button" class="btn ghost" id="dShow">Show answer <span class="kbd">S</span></button><span class="spacer"></span><button type="button" class="btn ghost" id="dNext">Next ' + ICONS.right + '</button></div></div>' +
      '<p class="muted small">All-time drills: <span id="dAll"></span></p>';

    function sumTypes() { $('#dtSum').textContent = sel.length ? '· ' + sel.length + ' selected' : '· all (tap to narrow)'; }
    function allTime() { var d = S.drills; $('#dAll').textContent = d.c + ' / ' + d.n + ' correct' + (d.n ? ' (' + pct(d.c / d.n) + ')' : '') + ' · best streak ' + d.bestStreak; }
    function next() {
      var keys = sel.length ? sel : DRILL_KEYS;
      var k = pick(keys);
      cur = DRILLS[k].gen(); cur.key = k; answered = false;
      $('#dType').textContent = DRILLS[k].name;
      $('#dQ').innerHTML = cur.prompt;
      $('#dIn').value = ''; $('#dFb').className = 'feedback';
      $('#dBtn').textContent = 'Check';
      if (hoverDevice()) $('#dIn').focus();
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
    function showFb(ok) {
      var fb = $('#dFb');
      fb.className = 'feedback show ' + (ok ? 'ok' : 'bad');
      fb.innerHTML = (ok ? '<b>Correct.</b> ' : '<b>Answer: <span class="mono">' + esc(fracDisplay(cur.fr, 5)) + '</span>.</b> ') + '<span class="fw-normal">' + cur.explain + '</span>';
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
      var ivc = S.settings.ivCats || 'all';
      main.innerHTML = subHead('Interview mode', '5 problems from different topics, a countdown on each (2.5 / 5 / 8 min by difficulty). Hints allowed; solutions wait for the summary.') +
        '<div class="card stack"><div class="frow"><span class="label">Difficulty</span><div class="seg" role="group" aria-label="Difficulty">' +
        [['mixed', 'Mixed'], ['1', 'Warm-up'], ['2', 'Interview'], ['3', 'Hard']].map(function (o) {
          return '<button type="button" data-ivd="' + o[0] + '" aria-pressed="' + (S.settings.ivDiff === o[0]) + '">' + o[1] + '</button>';
        }).join('') + '</div></div>' +
        '<div class="frow"><span class="label">Topics</span><div class="seg" role="group" aria-label="Topics">' +
        [['all', 'All'], ['quant', 'Quant core'], ['tech', 'Technical']].map(function (o) {
          return '<button type="button" data-ivc="' + o[0] + '" aria-pressed="' + (ivc === o[0]) + '">' + o[1] + '</button>';
        }).join('') + '</div></div>' +
        '<button class="btn primary block lg" type="button" id="ivStart">Start interview <span class="kbd">Enter</span></button></div>' +
        (last.length ? '<div class="card"><h3>Recent sessions</h3><table class="simple"><thead><tr><th>Date</th><th>Score</th><th>Time</th></tr></thead><tbody>' +
          last.map(function (r) { return '<tr><td>' + esc(ymd(new Date(r.t))) + '</td><td>' + r.score + '/' + r.total + '</td><td>' + fmtTime(r.secs) + '</td></tr>'; }).join('') +
          '</tbody></table></div>' : '');
      $all('[data-ivd]', main).forEach(function (b) { b.addEventListener('click', function () { S.settings.ivDiff = b.getAttribute('data-ivd'); save(); intro(); }); });
      $all('[data-ivc]', main).forEach(function (b) { b.addEventListener('click', function () { S.settings.ivCats = b.getAttribute('data-ivc'); save(); intro(); }); });
      $('#ivStart').addEventListener('click', start);
      ctl = { submit: start };
    }
    function choose5() {
      var dsel = S.settings.ivDiff, csel = S.settings.ivCats || 'all';
      var pool = PROBLEMS.filter(function (p) {
        return (dsel === 'mixed' || String(p.diff) === dsel) && (csel === 'all' || (CAT[p.cat] && CAT[p.cat].group === csel));
      });
      var cats = shuffle(CATS.map(function (c) { return c.id; }));
      var out = [];
      cats.forEach(function (c) {
        if (out.length >= 5) return;
        var opts = pool.filter(function (p) { return p.cat === c; });
        var unsolved = opts.filter(function (p) { return status(p.id) !== 'solved'; });
        if (opts.length) out.push(pick(unsolved.length ? unsolved : opts));
      });
      var rest = shuffle(pool.filter(function (p) { return out.indexOf(p) < 0; }));
      while (out.length < 5 && rest.length) out.push(rest.pop());
      return shuffle(out);
    }
    function start() {
      var qs = choose5();
      if (!qs.length) { toast('No problems available for that selection.'); return; }
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
        var header = '<div class="iv-top"><span>Q' + (idx + 1) + '/' + qs.length + ' ' + dots() + '</span><span class="countdown" id="ivClock" role="timer" aria-label="Time left">' + fmtTime(limit) + '</span></div>' +
          '<nav class="crumbs"><span style="--cat: var(--c-' + p.cat + ')"><span class="cdot"></span>' + esc(catName(p.cat)) + '</span><span aria-hidden="true">›</span><span>' + DIFF_NAME[p.diff] + '</span></nav>';
        main.innerHTML = '<div id="ivHost" class="narrow"></div>';
        var c = mountProblem($('#ivHost'), p, {
          mode: 'interview', allowSolution: false, header: header,
          nextLabel: idx + 1 < qs.length ? 'Next question' : 'See summary',
          onResult: function (ok, how) { done(ok, how); },
          onNext: function () { advance(); }
        });
        function done(ok, how) {
          if (finished) return;
          finished = true;
          clearInterval(timer); timer = null;
          results.push({ id: p.id, ok: ok, secs: Math.round((Date.now() - qStart) / 1000), how: how });
          $all('#ivHost [data-act="giveup"]').forEach(function (x) { x.disabled = true; });
          var b = $('#ivHost [data-act="next"]'); if (b) b.focus();
        }
        function advance() { if (!finished) return; idx++; show(); window.scrollTo(0, 0); }
        ctl = { submit: c.submit, hint: c.hint, solution: c.solution, next: advance, choose: c.choose };
        timer = setInterval(function () {
          var left = limit - (Date.now() - qStart) / 1000;
          var el = $('#ivClock'); if (!el) return;
          el.textContent = fmtTime(left);
          el.classList.toggle('low', left <= 30);
          if (left <= 0 && !finished) {
            c.grade(false, 'timeout');
            c.feedback('bad', '⏱ Time’s up — counted as a miss.');
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
        main.innerHTML = '<div class="narrow"><div class="card sprint-stage"><div class="label">Interview summary</div><div class="big-score" style="margin:.4rem 0">' + score + '<span class="muted" style="font-size:1.6rem">/' + results.length + '</span></div>' +
          '<p class="muted">' + verdict + ' Total time ' + fmtTime(secs) + '.</p>' +
          '<div class="row center"><button class="btn primary" type="button" id="ivAgain">New interview <span class="kbd">Enter</span></button><a class="btn" href="#review">Review queue</a></div></div>' +
          '<div class="card"><table class="simple"><thead><tr><th>#</th><th>Problem</th><th>Result</th><th>Time</th></tr></thead><tbody>' +
          results.map(function (r, i) {
            var p = BY_ID[r.id];
            var how = r.how === 'timeout' ? 'timed out' : r.how === 'gaveup' ? 'gave up' : r.ok ? 'correct' : 'wrong';
            return '<tr><td>' + (i + 1) + '</td><td>' + esc(p.title) + '<div class="small muted">' + esc(catName(p.cat)) + ' · ' + DIFF_NAME[p.diff] + '</div></td>' +
              '<td class="' + (r.ok ? 'res-ok' : 'res-bad') + '">' + how + '</td><td class="mono">' + fmtTime(r.secs) + '</td></tr>';
          }).join('') + '</tbody></table>' +
          results.map(function (r, i) {
            var p = BY_ID[r.id];
            return '<details class="reveal sol"><summary>' + ICONS.book + '<span>' + (i + 1) + '. ' + esc(p.title) + '</span><span class="chev" aria-hidden="true">▾</span></summary><div class="rbody"><div class="prompt small">' + p.prompt + '</div>' + solutionBody(p) + '</div></details>';
          }).join('') + '</div></div>';
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
    var catRows = GROUPS.map(function (g) {
      var rows = CATS.filter(function (c) { return c.group === g.id && catStats(c.id).total; }).map(function (c) {
        var st = catStats(c.id);
        return '<div class="bar-row" style="--cat: var(--c-' + c.id + ')"><span class="bn">' + esc(c.name) + '</span>' +
          '<div class="bar" role="img" aria-label="' + esc(c.name) + ' accuracy ' + (st.n ? pct(st.acc) : 'no attempts') + '"><div style="width:' + (st.n ? Math.max(2, st.acc * 100) : 0) + '%"></div></div>' +
          '<span class="pct">' + (st.n ? pct(st.acc) : '—') + '</span><span class="sub">' + st.solved + '/' + st.total + ' solved · ' + st.n + ' attempts</span></div>';
      }).join('');
      return rows ? '<h3 class="grp">' + esc(g.name) + '</h3>' + rows : '';
    }).join('');
    var heat = '', t = today();
    for (var i = 27; i >= 0; i--) {
      var k = addDays(t, -i), v = S.days[k] || 0;
      var lvl = v === 0 ? '' : v < 5 ? 'l1' : v < 15 ? 'l2' : 'l3';
      heat += '<div class="' + lvl + (i === 0 ? ' today' : '') + '" title="' + k + ': ' + v + ' activities"></div>';
    }
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
    var mx = Math.max.apply(null, boxes) || 1;

    main.innerHTML = '<div class="page-head"><div><h1>Stats</h1><p class="muted">Stored on this device — Settings → Export to move it.</p></div></div>' +
      '<div class="tiles">' +
      '<div class="stat-tile"><div class="v">' + solvedCount() + '<small>/' + PROBLEMS.length + '</small></div><div class="l">Solved</div></div>' +
      '<div class="stat-tile"><div class="v">' + (totN ? pct(totC / totN) : '—') + '</div><div class="l">Accuracy</div></div>' +
      '<div class="stat-tile"><div class="v">' + sk.cur + '<small> d</small></div><div class="l">Streak · best ' + sk.best + '</div></div>' +
      '<div class="stat-tile"><div class="v">' + sk.total + '</div><div class="l">Days practiced</div></div></div>' +
      (weak ? '<div class="banner"><p><b>Weakest area: ' + esc(catName(weak.id)) + '</b> — ' + (weak.score !== null ? pct(weak.score) + ' accuracy over ' + weak.n + ' attempts.' : 'least practiced so far.') + '</p><button class="btn sm primary" type="button" id="stWeak">Practice</button></div>' : '') +
      '<div class="stats-grid">' +
      '<div class="card span2"><h2>Accuracy by topic</h2>' + catRows + '</div>' +
      '<div class="card"><h2>Last 4 weeks</h2><div class="heat" role="img" aria-label="Activity in the last 28 days">' + heat + '</div><p class="muted small" style="margin:.5rem 0 0">Each square is a day; darker = more practice.</p></div>' +
      '<div class="card"><h2>Review boxes</h2><div class="boxes">' + boxes.map(function (b, i) {
        return '<div><div class="bx" style="height:' + Math.round(60 * b / mx + 2) + 'px;opacity:' + (0.35 + i * 0.16) + '"></div><div class="small muted">B' + (i + 1) + ' · ' + b + '</div></div>';
      }).join('') + '</div><p class="muted small" style="margin:.5rem 0 0">' + dueIds().length + ' due today.</p></div>' +
      '<div class="card span2"><h2>Mental math</h2>' + (mainKey ? '<p class="muted small">Trend for <span class="mono">' + esc(mainKey) + '</span> (last 30 runs)</p>' +
        sparkline(S.sprint.history.filter(function (r) { return r.key === mainKey; }).slice(-30).map(function (r) { return r.score; }), 300, 56, 'Sprint scores') +
        '<div class="table-scroll"><table class="simple" style="margin-top:.6rem"><thead><tr><th>Config</th><th>Runs</th><th>Best</th><th>Avg (10)</th></tr></thead><tbody>' + sprintHtml + '</tbody></table></div>'
        : '<div class="empty-inline">' + ICONS.sprint + '<p class="muted">No sprints yet. <a href="#sprint">Run one</a> — daily 2-minute sprints add up fast.</p></div>') + '</div>' +
      '<div class="card"><h2>Probability drills</h2>' + (d.n ? '<p>' + d.c + ' / ' + d.n + ' correct (' + pct(d.c / d.n) + ') · best streak ' + (d.bestStreak || 0) + '</p>' +
        Object.keys(d.byType).filter(function (k) { return DRILLS[k]; }).map(function (k) { var b = d.byType[k]; return '<div class="small"><span class="muted">' + esc(DRILLS[k].name) + ':</span> ' + b.c + '/' + b.n + '</div>'; }).join('')
        : '<p class="muted">No drills yet. <a href="#drills">Start</a>.</p>') + '</div>' +
      '<div class="card"><h2>Interviews</h2>' + (ivs.length ? '<p>' + ivs.length + ' sessions · recent average ' + pct(ivAvg) + '</p>' + sparkline(ivs.slice(-20).map(function (r) { return r.score; }), 300, 48, 'Interview scores') : '<p class="muted">No sessions yet. <a href="#interview">Try one</a>.</p>') + '</div>' +
      '</div>';
    var sw = $('#stWeak'); if (sw) sw.addEventListener('click', function () { startTopic(weak.id); });
  };

  /* ------------------------------------------------------------------ */
  /* Settings / data                                                     */
  /* ------------------------------------------------------------------ */
  function exportProgress() {
    var data = { app: 'stat-brainteaser', version: APP_VERSION, schema: SCHEMA, exportedAt: new Date().toISOString(), progress: S };
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
        prog = migrate(prog);
        if (mode === 'replace') { if (!confirm('Replace ALL progress on this device with the imported file?')) return; S = prog; }
        else S = mergeProgress(S, prog);
        S.ui.onboarded = true;
        save(); applyTheme(); updateBadges();
        toast('Progress imported (' + (mode === 'replace' ? 'replaced' : 'merged') + ').');
        route();
      } catch (e) { toast('Import failed: ' + e.message); }
    };
    reader.onerror = function () { toast('Could not read that file.'); };
    reader.readAsText(file);
  }
  VIEWS.settings = function (main) {
    var counts = CATS.filter(function (c) { return catStats(c.id).total; }).map(function (c) { return esc(c.name) + ' ' + catStats(c.id).total; }).join(' · ');
    main.innerHTML = '<div class="page-head"><div><h1>Settings</h1><p class="muted">Version ' + APP_VERSION + ' · ' + PROBLEMS.length + ' problems</p></div></div>' +
      '<div class="settings-grid">' +
      '<div class="card stack"><h2>Appearance</h2><div class="seg" role="group" aria-label="Theme">' +
      ['auto', 'light', 'dark'].map(function (t) { return '<button type="button" data-theme-set="' + t + '" aria-pressed="' + (S.settings.theme === t) + '">' + t[0].toUpperCase() + t.slice(1) + '</button>'; }).join('') + '</div></div>' +
      '<div class="card stack"><h2>Your data</h2><p class="muted small">Progress lives in this browser only' + (storageOk ? '' : ' <b class="res-bad">(storage currently unavailable!)</b>') + '. Export a JSON file to back it up or move it between your PC and phone, then import it on the other device.</p>' +
      '<div class="row"><button class="btn primary" type="button" id="expBtn">' + ICONS.download + ' Export progress</button>' +
      '<label class="btn" for="impMerge">Import (merge)</label><input class="sr-only" type="file" id="impMerge" accept=".json,application/json">' +
      '<label class="btn" for="impReplace">Import (replace)</label><input class="sr-only" type="file" id="impReplace" accept=".json,application/json"></div>' +
      '<div><button class="btn danger" type="button" id="resetBtn">Reset all progress</button></div></div>' +
      '<div class="card stack" id="updCard"><h2>Updates</h2>' +
      '<dl class="about"><dt>Version</dt><dd id="abVer">' + APP_VERSION + '</dd><dt>Build</dt><dd class="mono" id="abBuild">…</dd><dt>Deployed</dt><dd id="abDate">—</dd></dl>' +
      '<div class="row"><button class="btn" type="button" id="updBtn">Check for updates now</button></div>' +
      '<p class="small" id="updOut" role="status" aria-live="polite" style="margin:0"></p>' +
      '<label class="switch"><input type="checkbox" id="notifyToggle"' + (S.settings.notify ? ' checked' : '') + '><span class="track" aria-hidden="true"></span><span><b>Update notifications</b><br><span class="muted small">Get a system notification when new problems or features are published.</span></span></label>' +
      '<p class="muted small" id="notifyStatus" style="margin:0"></p></div>' +
      '<div class="card stack"><h2>App</h2><div class="row">' +
      '<button class="btn' + (deferredInstall ? '' : ' hidden') + '" type="button" data-install id="instBtn2">' + ICONS.download + ' Install app</button>' +
      '<button class="btn" type="button" id="obBtn">Show intro again</button></div>' +
      '<p class="muted small" style="margin:0">' + (isStandalone() ? 'Running as an installed app.' : isIOS() ? 'On iPhone/iPad: Share → Add to Home Screen.' : 'In Chrome/Edge use the install icon in the address bar, or the Install button when it appears.') + '</p></div>' +
      '<div class="card"><h2>Keyboard shortcuts</h2><table class="simple"><tbody>' +
      [['Enter', 'Check answer / start'], ['H', 'Open next hint'], ['S', 'Open solution (interview: give up)'], ['N / P', 'Next / previous problem'], ['1–4', 'Pick a multiple-choice option'], ['Esc', 'Skip (mental math)']].map(function (r) {
        return '<tr><td><span class="kbd">' + r[0] + '</span></td><td>' + r[1] + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<div class="card"><h2>Problem bank</h2><p class="small muted" style="margin:0">' + counts + '</p></div></div>' +
      '<p class="muted small">MIT licensed · © 2026 Breal Tchuimi. Works offline after the first visit.</p>';
    $all('[data-theme-set]', main).forEach(function (b) { b.addEventListener('click', function () { S.settings.theme = b.getAttribute('data-theme-set'); save(); applyTheme(); route(); }); });
    $('#expBtn').addEventListener('click', exportProgress);
    $('#impMerge').addEventListener('change', function (e) { if (e.target.files[0]) importProgress(e.target.files[0], 'merge'); e.target.value = ''; });
    $('#impReplace').addEventListener('change', function (e) { if (e.target.files[0]) importProgress(e.target.files[0], 'replace'); e.target.value = ''; });
    $('#resetBtn').addEventListener('click', function () {
      if (!confirm('Delete all progress on this device? Consider exporting first.')) return;
      var theme = S.settings.theme; S = defaultState(); S.settings.theme = theme; S.ui.onboarded = true; save(); updateBadges(); toast('Progress reset.'); route();
    });
    $('#updBtn').addEventListener('click', function () { checkForUpdate($('#updOut')); });
    function refreshNotifyStatus() { notifyStatusText().then(function (t) { var el = $('#notifyStatus'); if (el) el.textContent = t; }); }
    var nt = $('#notifyToggle');
    if (!('Notification' in window)) nt.disabled = true;
    nt.addEventListener('change', function () {
      S.ui.notifyOffered = true;
      (nt.checked ? enableNotifications() : disableNotifications().then(function () { return false; })).then(function (on) {
        nt.checked = !!S.settings.notify; save(); refreshNotifyStatus();
      });
    });
    refreshNotifyStatus();
    Promise.all([fetchVersionInfo(), swInfo()]).then(function (res) {
      var info = res[0] || {}, w = res[1] || {};
      var b = $('#abBuild'); if (!b) return;
      b.textContent = w.build || info.build || 'dev (local)';
      if (info.date) $('#abDate').textContent = fmtDate(info.date) + (info.notes ? ' — ' + info.notes : '');
    });
    $('#instBtn2').addEventListener('click', doInstall);
    $('#obBtn').addEventListener('click', showOnboarding);
  };

  /* ------------------------------------------------------------------ */
  /* Global keyboard shortcuts                                           */
  /* ------------------------------------------------------------------ */
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey || modalOpen) return;
    if (!ctl) return;
    var typing = isTyping(e.target);
    var k = e.key;
    if (k === 'Enter' && !typing && ctl.submit) {
      var tag = e.target && e.target.tagName;
      if (tag === 'BUTTON' || tag === 'A' || tag === 'SUMMARY' || tag === 'LABEL') return; // let the focused control act
      e.preventDefault(); ctl.submit(); return;
    }
    if (typing) return;
    var lk = k.toLowerCase();
    if (lk === 'h' && ctl.hint) { e.preventDefault(); ctl.hint(); }
    else if (lk === 's' && ctl.solution) { e.preventDefault(); ctl.solution(); }
    else if (lk === 'n' && ctl.next) { e.preventDefault(); ctl.next(); }
    else if (lk === 'p' && ctl.prev) { e.preventDefault(); ctl.prev(); }
    else if (/^[1-8]$/.test(k) && ctl.choose) { e.preventDefault(); ctl.choose(+k - 1); }
  });

  /* ------------------------------------------------------------------ */
  /* Boot                                                                */
  /* ------------------------------------------------------------------ */
  window.StatBT = { parseNumber: parseNumber, checkAnswer: checkAnswer, checkNumeric: checkNumeric, DRILLS: DRILLS, version: APP_VERSION, migrate: migrate, dailyMix: dailyMix, state: function () { return S; } };

  function boot() {
    applyTheme();
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      var onChange = function () { if (S.settings.theme === 'auto') applyTheme(); };
      if (mq.addEventListener) mq.addEventListener('change', onChange); else if (mq.addListener) mq.addListener(onChange);
    }
    $all('[data-theme-btn]').forEach(function (b) { b.addEventListener('click', cycleTheme); });
    $all('[data-install]').forEach(function (b) { b.addEventListener('click', doInstall); });
    window.addEventListener('hashchange', route);
    if (!PROBLEMS.length) {
      $('#view').innerHTML = '<div class="card"><h2>Problem bank failed to load</h2><p>problems.js is missing. Reload while online.</p></div>';
    }
    updateBadges();
    route();
    registerSW();
    if (!S.ui.onboarded) showOnboarding();
    document.documentElement.setAttribute('data-ready', '1');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
