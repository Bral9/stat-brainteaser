/* Stat Brainteaser — quant / data / ML interview trainer. Plain JS, no dependencies. */
(function () {
  'use strict';

  var APP_VERSION = '2.3.0';
  var STORE_KEY = 'statbt.progress.v1'; // key kept stable across versions; schema version lives in state.v
  var SCHEMA = 4;
  var PROBLEMS = Array.isArray(window.PROBLEMS) ? window.PROBLEMS : [];
  var BY_ID = {};
  PROBLEMS.forEach(function (p) { BY_ID[p.id] = p; });
  var CORE50 = (Array.isArray(window.SBT_CORE50) ? window.SBT_CORE50 : []).filter(function (id) { return BY_ID[id]; });

  var GROUPS = [
    { id: 'quant', name: 'Quant core', desc: 'Probability, statistics and puzzles asked in trading & research interviews.' },
    { id: 'trading', name: 'Trading & markets', desc: 'Betting, options, market making and strategic games — the trader-interview formats.' },
    { id: 'tech', name: 'Technical', desc: 'Python, SQL and machine learning screens for quant, data and ML roles.' },
    { id: 'swe', name: 'Software engineering', desc: 'Algorithms, data structures and CS fundamentals for SWE and quant-developer interviews.' }
  ];
  var CATS = [
    { id: 'probability', name: 'Probability', short: 'Prob', group: 'quant', icon: 'die' },
    { id: 'statistics', name: 'Statistics', short: 'Stats', group: 'quant', icon: 'bell' },
    { id: 'ev', name: 'EV & Games', short: 'EV', group: 'quant', icon: 'coins' },
    { id: 'combinatorics', name: 'Combinatorics', short: 'Comb', group: 'quant', icon: 'grid' },
    { id: 'brainteasers', name: 'Brainteasers', short: 'Logic', group: 'quant', icon: 'puzzle' },
    { id: 'fermi', name: 'Fermi estimates', short: 'Fermi', group: 'quant', icon: 'globe' },
    { id: 'markov', name: 'Markov chains', short: 'Markov', group: 'quant', icon: 'chain' },
    { id: 'numbertheory', name: 'Number theory', short: 'NT', group: 'quant', icon: 'hash' },
    { id: 'kelly', name: 'Kelly & betting', short: 'Kelly', group: 'trading', icon: 'pie' },
    { id: 'options', name: 'Options', short: 'Opt', group: 'trading', icon: 'hockey' },
    { id: 'mm', name: 'Market making', short: 'MM', group: 'trading', icon: 'ladder' },
    { id: 'gametheory', name: 'Game theory', short: 'Games', group: 'trading', icon: 'knight' },
    { id: 'micro', name: 'Microstructure', short: 'Micro', group: 'trading', icon: 'ladder' },
    { id: 'python', name: 'Python', short: 'Py', group: 'tech', icon: 'code' },
    { id: 'sql', name: 'SQL', short: 'SQL', group: 'tech', icon: 'db' },
    { id: 'ml', name: 'Machine learning', short: 'ML', group: 'tech', icon: 'nodes' },
    { id: 'coding', name: 'Coding lab', short: 'Code', group: 'tech', icon: 'code' },
    { id: 'systems', name: 'Systems & design', short: 'Design', group: 'tech', icon: 'db' },
    { id: 'dsa', name: 'Algorithms & DS', short: 'DSA', group: 'swe', icon: 'tree' },
    { id: 'csfund', name: 'CS fundamentals', short: 'CS', group: 'swe', icon: 'chip' }
  ];
  var CAT = {};
  CATS.forEach(function (c) { CAT[c.id] = c; });
  // Problems with an unknown category still appear (as "Other").
  PROBLEMS.forEach(function (p) { if (!CAT[p.cat]) { CAT[p.cat] = { id: p.cat, name: p.cat, short: p.cat, group: 'tech', icon: 'code' }; CATS.push(CAT[p.cat]); } });
  function catName(id) { return (CAT[id] || {}).name || id; }
  var DIFF_NAME = { 1: 'Warm-up', 2: 'Interview', 3: 'Hard' };
  /* Interview-format labels: which kind of round a problem resembles (never "asked at firm X"). */
  var STYLES = [
    { id: 'trading-desk', name: 'Trading desk', desc: 'Collaborative probability / EV reasoning, solved out loud.' },
    { id: 'OA-speed', name: 'OA speed', desc: 'Short calculation you should finish in a minute or two on a timed online test.' },
    { id: 'research-stats', name: 'Research stats', desc: 'Statistics, estimation and modelling questions for research roles.' },
    { id: 'market-making-game', name: 'Market-making game', desc: 'Quoting a bid/ask, updating on trades, managing inventory.' },
    { id: 'betting-game', name: 'Betting game', desc: 'Pricing a game and sizing bets to your edge.' },
    { id: 'options-desk', name: 'Options desk', desc: 'Payoffs, parity and Greeks intuition.' },
    { id: 'brainteaser-phone', name: 'Brainteaser screen', desc: 'Classic logic puzzles from a phone screen.' },
    { id: 'math-test', name: 'Math test', desc: 'Harder written maths-test questions.' },
    { id: 'coding-screen', name: 'Coding screen', desc: 'Python / SQL output and data-manipulation questions.' }
  ];
  var STYLE = {};
  STYLES.forEach(function (s) { STYLE[s.id] = s; });
  function styleName(id) { return (STYLE[id] || {}).name || id; }
  function pStyles(p) { return Array.isArray(p.style) ? p.style : (p.style ? [p.style] : []); }
  /* Five-state problem status. */
  var STATUS_LIST = ['unsolved', 'attempting', 'wrong', 'seen', 'solved'];
  var STATUS_NAME = { unsolved: 'Unsolved', attempting: 'Attempting', wrong: 'Wrong', seen: 'Seen solution', solved: 'Solved' };
  var RETRY_DAYS = 2; // wrong / seen-solution problems come back in Review after this many days

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
  var DEBUG_TODAY = (function () { try { var v = localStorage.getItem('statbt.debugToday'); return /^\d{4}-\d{2}-\d{2}$/.test(v || '') ? v : null; } catch (e) { return null; } })();
  function today() { return DEBUG_TODAY || ymd(new Date()); }
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
    tree: svg('<circle cx="12" cy="5" r="2"/><circle cx="6" cy="17" r="2"/><circle cx="18" cy="17" r="2"/><circle cx="12" cy="17" r="2"/><path d="M11 6.8 7 15.2M13 6.8l4 8.4M12 7v8"/>'),
    chip: svg('<rect x="6" y="6" width="12" height="12" rx="1.5"/><rect x="9.5" y="9.5" width="5" height="5"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>'),
    nodes: svg('<circle cx="5" cy="6" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><path d="M7 6.8 10.2 11M7 17.2l3.2-4.2M14 12h3"/>'),
    chain: svg('<circle cx="6" cy="7" r="3"/><circle cx="18" cy="7" r="3"/><circle cx="12" cy="18" r="3"/><path d="M9 7h6M16.5 9.6l-3 5.8M7.5 9.6l3 5.8"/><path d="m13.6 5.6 1.4 1.4-1.4 1.4"/>'),
    hash: svg('<path d="M9 3 7 21M17 3l-2 18M4 8.5h17M3 15.5h17"/>'),
    pie: svg('<path d="M12 3a9 9 0 1 0 9 9h-9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/>'),
    hockey: svg('<path d="M3 17h9l9-11"/><path d="M3 21h18" opacity=".45"/><circle cx="12" cy="17" r="1.4" fill="currentColor"/>'),
    ladder: svg('<path d="M4 5h7M4 9h5M4 13h3M13 11h7M15 15h5M17 19h3"/><path d="M12 3v18" opacity=".45"/>'),
    knight: svg('<path d="M7 21h11M8 21l1-4c-2-1.5-3-3.5-2.5-6L9 6l-1-3 3 1.5L15 4c3 1.5 4 5 3 9l-1 4 .5 4"/><circle cx="11.5" cy="8" r=".9" fill="currentColor"/>'),
    eye: svg('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
    half: svg('<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor" stroke="none"/>'),
    pause: svg('<path d="M8 5v14M16 5v14"/>'),
    plus: svg('<path d="M12 5v14M5 12h14"/>'),
    star: svg('<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>'),
    keypad: svg('<rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M8 7h8M8 11h.01M12 11h.01M16 11h.01M8 14.5h.01M12 14.5h.01M16 14.5h.01M8 18h.01M12 18h.01M16 18h.01"/>'),
    help: svg('<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17h.01"/>'),
    note: svg('<path d="M5 3h10l4 4v14H5z"/><path d="M15 3v4h4M8 12h8M8 16h5"/>'),
    list: svg('<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>'),
    building: svg('<path d="M4 21V5l8-2v18M12 8l8 2v11M3 21h18M7.5 8h1M7.5 12h1M7.5 16h1M15.5 13h1M15.5 17h1"/>'),
    joystick: svg('<rect x="3" y="14" width="18" height="7" rx="2"/><path d="M12 14V8"/><circle cx="12" cy="6" r="3"/><path d="M7 17.5h2"/>'),
    route: svg('<circle cx="6" cy="19" r="2"/><circle cx="18" cy="5" r="2"/><path d="M8 19h7a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h7"/>'),
    mic: svg('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>'),
    trash: svg('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
    undo: svg('<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>')
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
      session: null,  // {ids, idx, label, res:{id:bool}, t, kind?, back?}
      comp: {},       // competition coach state (filled by coach.js)
      pstatus: {},    // v4: id -> {s: unsolved|attempting|wrong|seen|solved, t, ms (time spent), solveMs, solvedAt}
      notes: {},      // v4: id -> {text, t}   private per-problem notes
      sets: {},       // v4: setId -> {name, ids:[], created, t}   custom problem sets (many-to-many)
      presets: [],    // v4: saved practice filters [{id, name, q}]
      prep: {},       // v4: interview prep (plan, firm checklists & notes, superday mocks) — filled by prep.js
      arcade: {},     // v4: arcade games (arcade.js)
      settings: {
        theme: 'auto',
        sprint: { mode: 'classic', dur: 120, ops: { add: true, sub: true, mul: true, div: true }, addA: [2, 100], addB: [2, 100], mulA: [2, 12], mulB: [2, 100] },
        filters: { cats: [], diffs: [], status: 'all', q: '', styles: [], set: '' },
        drillTypes: [],
        ivDiff: 'mixed',
        notify: false,
        keypad: false,
        confetti: true
      },
      ui: { iosHintDismissed: false, onboarded: false, notifyOffered: false, lastSet: '' }
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
  /* v2 (1.1.0) → v3 (1.3.0): add `comp` (competition coach). Everything else unchanged.
   * v3 (1.3.0) → v4 (2.0.0): five-state status. `pstatus` is derived from the stored attempts (ever solved → solved,
   *   otherwise wrong), the practice status filter is renamed (new → unsolved, missed → wrong), and empty containers
   *   for notes / sets / presets / prep / arcade are added. attempts, srs, days, sprint, drills, interviews, session,
   *   comp, settings and ui are kept exactly as they were. The journal lives under its own key and is untouched. */
  function migrate(o) {
    if (!isPlainObj(o)) return defaultState();
    var v = +o.v || 1;
    if (v < 2) {
      var f = (o.settings && o.settings.filters) || {};
      if (o.settings) o.settings.filters = { cats: Array.isArray(f.cats) ? f.cats : [], diffs: Array.isArray(f.diffs) ? f.diffs : [], status: f.status || 'all', q: '' };
    }
    if (v < 3) { if (!isPlainObj(o.comp)) o.comp = {}; }
    if (v < 4) {
      var ps = isPlainObj(o.pstatus) ? o.pstatus : {};
      var att = isPlainObj(o.attempts) ? o.attempts : {};
      Object.keys(att).forEach(function (id) {
        var a = att[id];
        if (!isPlainObj(a) || ps[id]) return;
        ps[id] = { s: (a.c || 0) > 0 ? 'solved' : 'wrong', t: a.last || 0, ms: 0, migrated: 1 };
      });
      o.pstatus = ps;
      var ff = o.settings && o.settings.filters;
      if (isPlainObj(ff)) {
        var map = { 'new': 'unsolved', missed: 'wrong', unsolved: 'unsolved', attempting: 'attempting', wrong: 'wrong', seen: 'seen', solved: 'solved', all: 'all' };
        ff.status = map[ff.status] || 'all';
      }
    }
    o.v = SCHEMA;
    o = mergeDefaults(o, defaultState());
    if (o.session && (!Array.isArray(o.session.ids) || !o.session.ids.length)) o.session = null;
    if (!Array.isArray(o.presets)) o.presets = [];
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
  /* meta: {hints, how: 'answer'|'choice'|'self'|'revealed'|'gaveup'|'timeout', ms: attempt time} */
  function recordAttempt(id, correct, meta) {
    meta = meta || {};
    var a = S.attempts[id] || { n: 0, c: 0, last: 0, lastOk: null, hints: 0 };
    a.n++; if (correct) a.c++;
    a.last = Date.now(); a.lastOk = !!correct;
    if (meta.hints) a.hints = (a.hints || 0) + meta.hints;
    S.attempts[id] = a;
    var s = S.srs[id];
    var isNew = !s;
    s = s || { box: 0, due: today(), reviews: 0 };
    if (correct) { s.box = isNew ? 2 : Math.min(5, s.box + 1); s.due = addDays(today(), INTERVALS[s.box]); }
    else { s.box = 1; s.due = addDays(today(), RETRY_DAYS); } // wrong or seen-solution: resurface in 2 days
    s.reviews = (s.reviews || 0) + 1;
    S.srs[id] = s;
    // five-state status: solved sticks until "Mark as not solved"; seeing the solution first is never "solved"
    var cur = status(id), r = S.pstatus[id] || { s: 'unsolved', t: 0, ms: 0 };
    if (correct) {
      if (cur !== 'solved') { r.solvedAt = Date.now(); if (meta.ms) r.solveMs = Math.round(meta.ms); }
      else if (meta.ms && (!r.solveMs || meta.ms < r.solveMs)) r.bestMs = Math.round(meta.ms);
      r.s = 'solved';
    } else if (cur !== 'solved') r.s = meta.how === 'revealed' ? 'seen' : (cur === 'seen' ? 'seen' : 'wrong');
    r.t = Date.now();
    if (meta.ms) r.ms = Math.round((r.ms || 0) + meta.ms);
    S.pstatus[id] = r;
    markDay();
    save();
    updateBadges();
  }
  function markAttempting(id) {
    if (status(id) !== 'unsolved') return;
    S.pstatus[id] = { s: 'attempting', t: Date.now(), ms: (S.pstatus[id] || {}).ms || 0 };
    save();
  }
  function addTimeSpent(id, ms) {
    if (!ms || ms < 500) return;
    var r = S.pstatus[id] || { s: status(id), t: Date.now(), ms: 0 };
    r.ms = Math.round((r.ms || 0) + ms);
    S.pstatus[id] = r;
    save();
  }
  function markNotSolved(id) {
    S.pstatus[id] = { s: 'unsolved', t: Date.now(), ms: 0, reset: Date.now() };
    delete S.srs[id];
    save(); updateBadges();
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
    return PROBLEMS.filter(function (p) { return (!cat || p.cat === cat) && status(p.id) === 'solved'; }).length;
  }
  /* unsolved | attempting | wrong | seen | solved */
  function status(id) {
    var r = S.pstatus && S.pstatus[id];
    if (r && STATUS_NAME[r.s]) return r.s;
    var a = S.attempts[id];
    if (!a) return 'unsolved';
    return (a.c || 0) > 0 ? 'solved' : 'wrong';
  }
  function catStats(cat) {
    var n = 0, k = 0, solved = 0, total = 0;
    PROBLEMS.forEach(function (p) {
      if (p.cat !== cat) return;
      total++;
      var a = S.attempts[p.id];
      if (a) { n += a.n; k += a.c; }
      if (status(p.id) === 'solved') solved++;
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
  /* Split a comma/semicolon separated list at parenthesis depth 0 (so C(10,3) stays one value). */
  function splitList(raw) {
    var s = String(raw == null ? '' : raw).replace(/\band\b/gi, ',').replace(/[{}\[\]]/g, ' ');
    var out = [], depth = 0, cur = '';
    for (var i = 0; i < s.length; i++) {
      var ch = s[i];
      if (ch === '(') depth++;
      else if (ch === ')') depth = Math.max(0, depth - 1);
      if ((ch === ',' || ch === ';') && depth === 0) { out.push(cur); cur = ''; continue; }
      cur += ch;
    }
    out.push(cur);
    out = out.map(function (x) { return x.trim(); });
    // a lone "(a, b)" pair typed with outer parentheses
    if (out.length === 1 && /^\(.*,.*\)$/.test(out[0])) return splitList(out[0].slice(1, -1));
    return out.filter(function (x) { return x !== ''; });
  }
  function checkMulti(a, raw) {
    var parts = splitList(raw);
    if (!parts.length) return { invalid: true };
    var xs = parts.map(function (t) { return parseNumber(t); });
    if (xs.some(function (x) { return x === null; })) return { invalid: true, multi: true };
    var vals = (a.values || []).slice();
    if (xs.length !== vals.length) return { ok: false, count: true, want: vals.length, got: xs.length };
    function near(x, v) { var tol = Math.max(a.tolAbs || 0, (a.tolRel != null ? a.tolRel : 0.005) * Math.abs(v), 1e-9); return Math.abs(x - v) <= tol; }
    var ok;
    if (a.ordered) ok = xs.every(function (x, i) { return near(x, vals[i]); });
    else {
      var used = vals.map(function () { return false; });
      ok = xs.every(function (x) {
        for (var i = 0; i < vals.length; i++) if (!used[i] && near(x, vals[i])) { used[i] = true; return true; }
        return false;
      });
    }
    var close = false;
    if (!ok && a.ordered) {
      var sx = xs.slice().sort(function (p, q) { return p - q; }), sv = vals.slice().sort(function (p, q) { return p - q; });
      close = sx.every(function (x, i) { return near(x, sv[i]); }); // right numbers, wrong order
    }
    return { ok: ok, xs: xs, close: close, order: close };
  }
  function checkAnswer(p, raw) {
    var a = p.answer || {};
    if (a.type === 'numeric') return checkNumeric(a, raw);
    if (a.type === 'multi') return checkMulti(a, raw);
    if (a.type === 'text') {
      var n = codeNorm(raw);
      if (!n) return { invalid: true };
      return { ok: (a.accept || []).some(function (t) { return codeNorm(t) === n; }) };
    }
    if (a.type === 'choice') {
      // typed choice: a letter (A–H) or the option's index+1
      var t = String(raw == null ? '' : raw).trim().toUpperCase();
      var i = /^[A-H]$/.test(t) ? t.charCodeAt(0) - 65 : /^[1-8]$/.test(t) ? +t - 1 : -1;
      if (i < 0 || i >= (a.options || []).length) return { invalid: true };
      return { ok: i === a.correct, choice: i };
    }
    if (ANSWER_TYPES[a.type] && ANSWER_TYPES[a.type].check) return ANSWER_TYPES[a.type].check(p, raw);
    return { invalid: true };
  }
  function answerDisplay(p) {
    var a = p.answer || {};
    if (a.display) return a.display;
    if (a.type === 'numeric') return fmtNum(a.value, 6);
    if (a.type === 'multi') return (a.values || []).map(function (v) { return fmtNum(v, 6); }).join(', ');
    if (a.type === 'choice') return a.options[a.correct];
    if (a.type === 'text') return esc((a.accept || [])[0] || '');
    return '';
  }
  function formatHint(p) {
    var a = p.answer || {};
    if (a.type === 'numeric' && a.range) return { ph: 'A single number, e.g. 2.5k', help: 'Estimate — one number. Suffixes k / m / b and 1e6 are fine.' };
    if (a.type === 'numeric') return { ph: 'e.g. 5/36, 0.139 or 13.9%', help: 'Fractions, decimals, % and expressions like 1/6+1/36, C(10,3) or 1-(5/6)^4 work.' };
    if (a.type === 'multi') return { ph: 'e.g. ' + (a.values || []).map(function (_, i) { return ['1/3', '0.25', '2', '5/6', '1', '3', '7', '4'][i % 8]; }).join(', '),
      help: (a.values || []).length + ' values, separated by commas' + (a.ordered ? ', in the order asked.' : ' (any order).') + ' Each may be a fraction or expression.' };
    if (a.type === 'text') return { ph: p.cat === 'python' ? 'Exact output' : 'Short answer', help: 'Type it exactly as it would print. Case, spaces and quote style are ignored.' };
    return { ph: '', help: '' };
  }
  var FORMAT_HELP = '<ul class="fmt-list">' +
    '<li><b>Fractions &amp; decimals:</b> <code>5/36</code>, <code>0.139</code>, <code>13.9%</code></li>' +
    '<li><b>Powers &amp; factorials:</b> <code>2^10</code>, <code>1-(5/6)^4</code>, <code>10!/(8!*2!)</code></li>' +
    '<li><b>Roots, π, e, logs:</b> <code>sqrt(2)</code> or <code>√2</code>, <code>pi/4</code>, <code>e</code>, <code>ln(2)</code>, <code>exp(-1)</code></li>' +
    '<li><b>Binomials:</b> <code>C(10,3)</code> = 120</li>' +
    '<li><b>Several values:</b> separate with commas, e.g. <code>1/3, 2/3</code> (bid, ask or a distribution)</li>' +
    '<li><b>Big numbers:</b> <code>2.5k</code>, <code>3m</code>, <code>1e6</code>, <code>1,000,000</code></li>' +
    '<li>Answers within about 0.5% of the exact value count, so <code>0.333</code> is fine for 1/3.</li></ul>';
  var ENCOURAGE = [
    'Clean solve. That is exactly the reasoning an interviewer wants to hear.',
    'Nailed it — now try changing one number and solving it again.',
    'Correct! Say the key idea out loud once; that is what sticks.',
    'Spot on. Your future superday self says thanks.',
    'Right answer, right method. Keep the streak going.',
    'That one trips up a lot of people. Not you.',
    'Correct — and you did it without the solution. That counts.',
    'Sharp. Could you explain it in under 30 seconds?',
    'Yes! Write the one-line insight in your notes while it is fresh.',
    'Solid work. Speed comes from reps exactly like this.',
    'Correct. Ask yourself: what would break this method?',
    'Great — you just turned an unknown into a pattern.',
    'Exactly right. On to the next one while you are warm.',
    'Textbook. That is a problem you now own.',
    'Correct! Precision under pressure is the whole game.',
    'Well reasoned. The interviewer would happily move on to the follow-up.',
    'Boom. One more brick in the wall of intuition.',
    'Correct — calm, structured, done. Repeat tomorrow.'
  ];

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
    if (meta) meta.setAttribute('content', dark ? '#131416' : '#f5f5f6');
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
  var HOOKS = { graded: [], homeCards: [], homeAfter: [], settingsCards: [], settingsAfter: [], exportData: [], importData: [], mergeState: [], boot: [],
    // v2.1: extension points for the feature modules (mock.js, learn.js, library.js, codelab.js, deck.js, arcade)
    trainCards: [],   // fn() -> html of extra Train hub cards
    topicCards: [],   // fn(catId) -> html of extra cards in a topic page's side column
    firmCards: [],    // fn(firmId) -> html of extra cards on a firm page
    moreItems: []     // fn() -> html of extra rows on the mobile More page
  };
  /* v2.1: custom answer types (e.g. 'open' self-graded design questions, 'code' Python problems).
   * ANSWER_TYPES[type] = { html(p, opts) -> string, bind(card, p, api) , check?(p, raw) }
   * api = { grade(correct, how), feedback(kind, html), openSolution(), state, interview, opts } */
  var ANSWER_TYPES = {};
  function runHtmlHooks(list, arg) { return list.map(function (fn) { try { return fn(arg) || ''; } catch (e) { console.warn(e); return ''; } }).join(''); }
  var TAB_OF = { home: 'home', practice: 'practice', play: 'practice', review: 'review', train: 'train', sprint: 'train', drills: 'train', interview: 'train', stats: 'stats', settings: 'settings',
    sets: 'practice', core50: 'practice', topics: 'practice', topic: 'practice', firms: 'practice', firm: 'practice', arcade: 'train', prep: 'train', superday: 'train' };
  var TITLES = { home: 'Home', practice: 'Practice', play: 'Practice', review: 'Review', train: 'Train', sprint: 'Mental math', drills: 'Probability drills', interview: 'Interview mode', stats: 'Stats', settings: 'Settings',
    sets: 'Problem sets', core50: 'Core 50', arcade: 'Arcade' };
  function route() {
    var h;
    try { h = decodeURIComponent((location.hash || '#home').slice(1)); } catch (e) { h = (location.hash || '#home').slice(1); }
    var parts = h.split('/');
    var name = parts[0] || 'home';
    // "#practice?t=ev&d=2" — the query belongs to the view; views that care read location.hash themselves.
    var qi = name.indexOf('?');
    if (qi >= 0) { parts.splice(1, 0, name.slice(qi)); name = name.slice(0, qi) || 'home'; }
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
      if ((' ' + a.getAttribute('data-tab') + ' ').indexOf(' ' + tab + ' ') >= 0) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
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
  /* extra: {kind: 'list'|'playlist'|'set'|..., back: '#practice?…'} — list sessions follow the filtered list and
   * say "That's the last problem in this list." at the end instead of finishing. */
  function startSession(ids, label, startIdx, replace, extra) {
    ids = ids.filter(function (id) { return BY_ID[id]; });
    if (!ids.length) { toast('No problems to practice here.'); return; }
    S.session = { ids: ids, idx: startIdx || 0, label: label || 'Practice', res: {}, t: Date.now() };
    if (extra) Object.keys(extra).forEach(function (k) { S.session[k] = extra[k]; });
    save();
    go('#play/' + (startIdx || 0), replace);
  }
  function orderForPractice(list) {
    // unsolved first (easy → hard), then attempting / wrong / seen, then solved; shuffled within each block
    var rank = { unsolved: 0, attempting: 1, wrong: 2, seen: 3, solved: 4 };
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
    if (st === 'new') st = 'unsolved'; else if (st === 'missed') st = 'wrong'; else if (st === 'attempted') st = 'attempting';
    var name = STATUS_NAME[st] || 'Unsolved';
    var cls = { solved: 'ok', wrong: 'bad', seen: 'seen', attempting: 'att' }[st] || 'new';
    var ic = { solved: ICONS.check, wrong: ICONS.x, seen: ICONS.eye, attempting: ICONS.half }[st] || ICONS.dot;
    return '<span class="sicon ' + cls + '" title="' + name + '" role="img" aria-label="' + name + '">' + ic + '</span>';
  }
  function styleBadges(p, n) {
    return pStyles(p).slice(0, n || 2).map(function (s) { return '<span class="badge style" title="' + esc((STYLE[s] || {}).desc || '') + '">' + esc(styleName(s)) + '</span>'; }).join('');
  }

  /* ---------- custom problem sets (many-to-many) ---------- */
  function setList() {
    return Object.keys(S.sets).map(function (k) { var o = S.sets[k]; return { id: k, name: o.name, ids: o.ids || [], created: o.created || 0 }; })
      .sort(function (a, b) { return a.created - b.created || (a.id < b.id ? -1 : 1); });
  }
  function newSet(name, ids) {
    name = String(name || '').trim().slice(0, 60) || 'My set';
    var id = 's' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
    S.sets[id] = { name: name, ids: (ids || []).slice(), created: Date.now(), t: Date.now() };
    save();
    return id;
  }
  function inSet(setId, pid) { var s = S.sets[setId]; return !!s && (s.ids || []).indexOf(pid) >= 0; }
  function toggleInSet(setId, pid, force) {
    var s = S.sets[setId]; if (!s) return false;
    s.ids = s.ids || [];
    var i = s.ids.indexOf(pid), want = force == null ? i < 0 : !!force;
    if (want && i < 0) s.ids.push(pid); else if (!want && i >= 0) s.ids.splice(i, 1);
    s.t = Date.now(); S.ui.lastSet = setId; save();
    return want;
  }
  function setsOf(pid) { return setList().filter(function (s) { return s.ids.indexOf(pid) >= 0; }); }

  /* ---------- related problems: same category, most shared tags ---------- */
  function relatedProblems(p, n) {
    n = n || 4;
    var tags = p.tags || [];
    function score(q) {
      var shared = (q.tags || []).filter(function (t) { return tags.indexOf(t) >= 0; }).length;
      return shared * 10 + (status(q.id) === 'solved' ? 0 : 3) - Math.abs(q.diff - p.diff);
    }
    function rank(list) { return list.map(function (q) { return { q: q, s: score(q) }; }).sort(function (a, b) { return b.s - a.s || (a.q.id < b.q.id ? -1 : 1); }).map(function (x) { return x.q; }); }
    var out = rank(PROBLEMS.filter(function (q) { return q.id !== p.id && q.cat === p.cat; })).slice(0, n);
    if (out.length < n) out = out.concat(rank(PROBLEMS.filter(function (q) { return q.id !== p.id && q.cat !== p.cat && (q.tags || []).some(function (t) { return tags.indexOf(t) >= 0; }); })).slice(0, n - out.length));
    return out;
  }
  function relatedCards(list) {
    return '<section class="related" aria-label="Related problems"><h2 class="label">Related problems</h2><div class="rel-grid">' + list.map(function (q) {
      return '<button type="button" class="rel-card" data-rel="' + esc(q.id) + '" style="--cat: var(--c-' + esc(q.cat) + ')">' + statusIcon(status(q.id)) +
        '<span class="t"><span class="tt">' + esc(q.title) + '</span><span class="tm"><span class="cdot"></span>' + esc(catName(q.cat)) + ' · ' + DIFF_NAME[q.diff] + '</span></span></button>';
    }).join('') + '</div></section>';
  }

  /* ---------- light confetti: two side cannons, sometimes a star burst ---------- */
  function reducedMotion() { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function confetti() {
    if (!S.settings.confetti || reducedMotion() || !document.body || !window.requestAnimationFrame) return;
    var cv = document.createElement('canvas');
    cv.className = 'confetti'; cv.setAttribute('aria-hidden', 'true');
    var W = window.innerWidth, H = window.innerHeight, dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = W * dpr; cv.height = H * dpr;
    document.body.appendChild(cv);
    var ctx = cv.getContext('2d'); if (!ctx) { cv.remove(); return; }
    ctx.scale(dpr, dpr);
    var cs = getComputedStyle(document.documentElement);
    var cols = ['--accent', '--ok', '--warn', '--c-combinatorics', '--c-fermi', '--c-brainteasers'].map(function (v) { return cs.getPropertyValue(v).trim() || '#6366f1'; });
    var parts = [], star = Math.random() < 0.2, n = W < 500 ? 34 : 54;
    function add(x, y, ang, spd, shape) { parts.push({ x: x, y: y, vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd, r: 3 + Math.random() * 3, c: pick(cols), rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, shape: shape }); }
    for (var i = 0; i < n; i++) {
      add(0, H * 0.85, -Math.PI / 3 + (Math.random() - 0.5) * 0.7, 9 + Math.random() * 7, i % 3 ? 'rect' : 'dot');
      add(W, H * 0.85, -2 * Math.PI / 3 + (Math.random() - 0.5) * 0.7, 9 + Math.random() * 7, i % 3 ? 'rect' : 'dot');
    }
    if (star) for (var j = 0; j < 26; j++) add(W / 2, H * 0.4, j / 26 * Math.PI * 2, 5 + Math.random() * 3, 'star');
    var t0 = performance.now();
    function drawStar(p) { ctx.beginPath(); for (var k = 0; k < 10; k++) { var rr = k % 2 ? p.r : p.r * 2.2, a = k * Math.PI / 5 + p.rot; ctx.lineTo(p.x + Math.cos(a) * rr, p.y + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); }
    function frame(now) {
      var el = now - t0;
      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = Math.max(0, 1 - Math.max(0, el - 1100) / 600);
      parts.forEach(function (p) {
        p.vy += 0.28; p.vx *= 0.985; p.vy *= 0.985; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        ctx.fillStyle = p.c;
        if (p.shape === 'star') drawStar(p);
        else if (p.shape === 'dot') { ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 0.8, 0, 7); ctx.fill(); }
        else { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); ctx.restore(); }
      });
      if (el < 1700) requestAnimationFrame(frame); else cv.remove();
    }
    requestAnimationFrame(frame);
    setTimeout(function () { if (cv.parentNode) cv.remove(); }, 2500);
  }

  /* ---------- on-screen math keypad ---------- */
  var KEYPAD = [['7', '8', '9', '/', '(', ')'], ['4', '5', '6', '^', '!', 'sqrt('], ['1', '2', '3', '−', ',', 'pi'], ['0', '.', '%', '⌫', 'C', '✓']];
  function keypadHtml() {
    return '<div class="keypad" role="group" aria-label="Math keypad">' + KEYPAD.map(function (row) {
      return row.map(function (k) {
        var lbl = k === 'sqrt(' ? '√' : k === 'pi' ? 'π' : k === '✓' ? 'Check' : k === 'C' ? 'AC' : k;
        var aria = { '⌫': 'Backspace', 'C': 'Clear', '✓': 'Check answer', '−': 'Minus', 'sqrt(': 'Square root', 'pi': 'Pi', '^': 'Power', '!': 'Factorial', '/': 'Divide' }[k] || k;
        return '<button type="button" class="kp' + (k === '✓' ? ' kp-go' : /^[0-9.]$/.test(k) ? ' kp-num' : '') + '" data-k="' + esc(k) + '" aria-label="' + esc(aria) + '">' + esc(lbl) + '</button>';
      }).join('');
    }).join('') + '</div>';
  }
  function bindKeypad(root, input, onSubmit) {
    $all('[data-k]', root).forEach(function (b) {
      b.addEventListener('mousedown', function (e) { e.preventDefault(); }); // keep the caret in the input
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-k');
        if (k === '✓') { onSubmit(); return; }
        var v = input.value, s0 = input.selectionStart == null ? v.length : input.selectionStart, s1 = input.selectionEnd == null ? v.length : input.selectionEnd;
        if (k === 'C') { input.value = ''; s0 = 0; }
        else if (k === '⌫') { if (s0 === s1 && s0 > 0) s0--; input.value = v.slice(0, s0) + v.slice(s1); }
        else { var ins = k === '−' ? '-' : k; input.value = v.slice(0, s0) + ins + v.slice(s1); s0 += ins.length; }
        try { input.setSelectionRange(s0, s0); } catch (e) { }
        input.dispatchEvent(new Event('input'));
      });
    });
  }

  /*
   * opts: { mode: 'practice'|'review'|'interview'|'mock', onResult(correct, how), onNext, onPrev, onRelated(id),
   *         nextLabel, allowSolution, header (html above title), timer, tools }
   */
  var problemTeardown = null;
  function mountProblem(host, p, opts) {
    opts = opts || {};
    if (problemTeardown) { try { problemTeardown(); } catch (e) { } problemTeardown = null; }
    var a = p.answer || {};
    var st = { hints: 0, graded: false, revealed: false, correct: null };
    var letters = 'ABCDEFGH';
    var fh = formatHint(p);
    var interview = opts.mode === 'interview' || opts.mode === 'mock';
    var useTimer = opts.timer != null ? opts.timer : !interview;
    var useTools = opts.tools != null ? opts.tools : !interview;
    var typed = a.type === 'numeric' || a.type === 'text' || a.type === 'multi';
    var mathy = a.type === 'numeric' || a.type === 'multi';
    var last = S.ui.lastSet && S.sets[S.ui.lastSet] ? S.ui.lastSet : '';
    var note = (S.notes[p.id] || {}).text || '';
    var html = '<article class="card problem" aria-labelledby="pt-' + esc(p.id) + '">' +
      (opts.header || '') +
      '<div class="ptop"><h1 class="problem-title" id="pt-' + esc(p.id) + '">' + esc(p.title) + '</h1><span class="pstate" aria-hidden="true"></span></div>' +
      '<div class="problem-meta">' + diffDots(p.diff) +
      (p.tags || []).slice(0, 3).map(function (t) { return '<span class="badge">' + esc(t) + '</span>'; }).join('') + styleBadges(p, 1) + '</div>';
    if (useTimer || useTools) {
      html += '<div class="ptools">' +
        (useTimer ? '<span class="ptimer" role="timer" aria-label="Attempt time"><span class="ptime mono">0:00</span><button type="button" class="tbtn" data-act="pause" aria-label="Pause timer" title="Pause timer">' + ICONS.pause + '</button></span>' : '') +
        (useTools ? '<span class="pstat-badge" data-pstat></span>' +
          '<span class="addset">' + (last ? '<button type="button" class="btn sm ghost" data-act="addlast" aria-pressed="' + inSet(last, p.id) + '" title="Toggle in “' + esc(S.sets[last].name) + '”">' + ICONS.star + '<span class="addlast-l">' + esc(S.sets[last].name) + '</span></button>' : '') +
          '<button type="button" class="btn sm ghost" data-act="addmenu" aria-expanded="false" aria-haspopup="true">' + ICONS.plus + ' Add to…</button><span class="popmenu hidden" role="menu"></span></span>' +
          '<button type="button" class="btn sm ghost hidden" data-act="unsolve" title="Reset this problem to unsolved">' + ICONS.undo + ' Mark as not solved</button>' : '') +
        '</div>';
    }
    html += '<div class="prompt">' + p.prompt + '</div>';
    if (typed) {
      html += '<form class="answer-form" autocomplete="off" novalidate>' +
        '<label class="sr-only" for="ans-' + esc(p.id) + '">Your answer</label>' +
        '<div class="answer-row"><input id="ans-' + esc(p.id) + '" type="text" class="' + (a.type === 'text' ? 'mono-in' : '') + '" placeholder="' + esc(fh.ph) + '" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" aria-describedby="help-' + esc(p.id) + '">' +
        (mathy ? '<button type="button" class="btn kp-toggle" data-act="keypad" aria-pressed="' + !!S.settings.keypad + '" aria-label="Math keypad" title="Math keypad">' + ICONS.keypad + '</button>' : '') +
        '<button class="btn primary" type="submit">Check</button></div>' +
        (mathy ? '<div class="kp-host' + (S.settings.keypad ? '' : ' hidden') + '">' + keypadHtml() + '</div>' : '') +
        '<div class="answer-help" id="help-' + esc(p.id) + '">' + esc(fh.help) +
        (mathy ? ' <details class="fmt-help"><summary>' + ICONS.help + '<span>Answer format help</span></summary><div class="fmt-pop">' + FORMAT_HELP + '</div></details>' : '') + '</div></form>';
    } else if (a.type === 'choice') {
      html += '<div class="choices" role="group" aria-label="Answer choices">' + a.options.map(function (o, i) {
        return '<button type="button" class="choice" data-i="' + i + '"><span class="letter">' + letters[i] + '</span><span>' + o + '</span></button>';
      }).join('') + '</div>';
    } else if (ANSWER_TYPES[a.type]) {
      html += '<div class="answer-custom" data-atype="' + esc(a.type) + '">' + ANSWER_TYPES[a.type].html(p, opts) + '</div>';
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
      html += '<details class="reveal sol"><summary>' + ICONS.book + '<span>Solution</span><small class="muted">' + (a.type === 'self' ? 'then grade yourself' : 'marks it “seen”') + '</small><span class="chev" aria-hidden="true">▾</span></summary><div class="rbody"><div class="self-wrap"></div>' + solutionBody(p) + '</div></details>';
    }
    if (useTools) {
      html += '<details class="reveal pnotes"' + (note ? '' : '') + '><summary>' + ICONS.note + '<span>My notes</span><small class="muted note-state">' + (note ? 'saved' : 'private') + '</small><span class="chev" aria-hidden="true">▾</span></summary>' +
        '<div class="rbody"><label class="sr-only" for="note-' + esc(p.id) + '">Notes for this problem</label><textarea id="note-' + esc(p.id) + '" rows="3" placeholder="Your approach, the trap you fell into, a variant to try…">' + esc(note) + '</textarea></div></details>';
    }
    html += '</div>';
    html += '<div class="pnav">' +
      (opts.onPrev ? '<button type="button" class="btn ghost" data-act="prev">' + ICONS.left + ' Previous</button>' : '') +
      (interview ? '<button type="button" class="btn ghost" data-act="giveup">' + (a.type === 'self' ? 'Done — grade myself' : 'Give up') + ' <span class="kbd">S</span></button>' : '') +
      '<span class="spacer"></span>' +
      (opts.onNext ? '<button type="button" class="btn ' + (interview ? 'primary hidden' : 'ghost') + '" data-act="next">' + esc(opts.nextLabel || 'Next') + ' ' + ICONS.right + '</button>' : '') +
      '</div></article><div class="related-host"></div>';
    host.innerHTML = html;

    var card = host.querySelector('.problem');
    var fb = card.querySelector('.feedback');
    var input = card.querySelector('.answer-form input');
    var nextBtn = card.querySelector('[data-act="next"]');
    var solDet = card.querySelector('details.sol');

    /* ----- attempt timer: visible, pausable, pauses while the tab is hidden ----- */
    var tm = { acc: 0, start: Date.now(), manual: false, stopped: false, iv: null };
    function tmNow() { return tm.acc + (tm.start ? Date.now() - tm.start : 0); }
    var timeEl = card.querySelector('.ptime'), pauseBtn = card.querySelector('[data-act="pause"]');
    function tmRender() {
      if (!timeEl) return;
      timeEl.textContent = fmtTime(tmNow() / 1000 - 0.999);
      var paused = !tm.start;
      card.classList.toggle('timer-paused', paused && !tm.stopped);
      if (pauseBtn) {
        pauseBtn.innerHTML = paused && !tm.stopped ? ICONS.play : ICONS.pause;
        pauseBtn.setAttribute('aria-label', paused ? 'Resume timer' : 'Pause timer');
        pauseBtn.title = paused ? 'Resume timer' : 'Pause timer';
        pauseBtn.disabled = tm.stopped;
      }
    }
    function tmPause(manual) { if (tm.start) { tm.acc += Date.now() - tm.start; tm.start = 0; } if (manual) tm.manual = true; tmRender(); }
    function tmResume() { if (tm.stopped) return; if (!tm.start) tm.start = Date.now(); tm.manual = false; tmRender(); }
    function tmStop() { tmPause(false); tm.stopped = true; tmRender(); }
    function onVis() { if (document.visibilityState === 'hidden') tmPause(false); else if (!tm.manual) tmResume(); }
    document.addEventListener('visibilitychange', onVis);
    if (timeEl) tm.iv = setInterval(tmRender, 1000);
    if (pauseBtn) pauseBtn.addEventListener('click', function () { if (tm.start) tmPause(true); else tmResume(); });
    if (document.visibilityState === 'hidden') tmPause(false);
    tmRender();
    var torn = false;
    function teardown() {
      if (torn) return; torn = true;
      clearInterval(tm.iv);
      document.removeEventListener('visibilitychange', onVis);
      if (!st.graded) addTimeSpent(p.id, tmNow());
    }
    problemTeardown = teardown;
    onCleanup(teardown);
    markAttempting(p.id);

    function refreshStatus() {
      var pb = card.querySelector('[data-pstat]'), cur = status(p.id);
      if (pb) pb.innerHTML = statusIcon(cur) + '<span>' + STATUS_NAME[cur] + '</span>';
      var ub = card.querySelector('[data-act="unsolve"]');
      if (ub) ub.classList.toggle('hidden', !(cur === 'solved' || cur === 'seen' || cur === 'wrong'));
    }
    refreshStatus();

    function feedback(kind, msg) { fb.className = 'feedback show ' + kind; fb.innerHTML = msg; }
    function setState(ok) {
      card.classList.remove('is-correct', 'is-wrong');
      card.classList.add(ok ? 'is-correct' : 'is-wrong');
      card.querySelector('.pstate').innerHTML = ok ? ICONS.check : ICONS.x;
    }
    function primaryNext() {
      if (nextBtn) { nextBtn.classList.remove('hidden', 'ghost'); nextBtn.classList.add('primary'); }
    }
    function showRelated() {
      if (!opts.onRelated) return;
      var rh = host.querySelector('.related-host');
      if (!rh || rh.innerHTML) return;
      var list = relatedProblems(p, 4);
      if (!list.length) return;
      rh.innerHTML = relatedCards(list);
      $all('[data-rel]', rh).forEach(function (b) { b.addEventListener('click', function () { opts.onRelated(b.getAttribute('data-rel')); }); });
    }
    function grade(correct, how) {
      if (st.graded) return;
      st.graded = true; st.correct = correct;
      tmStop();
      recordAttempt(p.id, correct, { hints: st.hints, how: how, ms: tmNow() });
      HOOKS.graded.forEach(function (fn) { try { fn(p, correct, card, how); } catch (e) { console.warn(e); } });
      setState(correct);
      refreshStatus();
      if (opts.onResult) opts.onResult(correct, how);
      primaryNext();
      showRelated();
    }
    function openSolution() {
      if (!solDet) return;
      st.revealed = true;
      if (!solDet.open) solDet.open = true;
    }
    function praise() { return interview ? '' : ' <span class="cheer">' + esc(pick(ENCOURAGE)) + '</span>'; }
    function canon() { return '<span class="canon">Canonical form: <b>' + answerDisplay(p) + '</b></span>'; }
    function submit() {
      if (!typed) return;
      var raw = input.value;
      var r = checkAnswer(p, raw);
      if (r.invalid) {
        feedback('info', a.type === 'text' ? 'Type an answer first.' : a.type === 'multi'
          ? 'I couldn’t read that. Type ' + (a.values || []).length + ' values separated by commas, e.g. ' + esc(fh.ph.replace(/^e\.g\. /, '')) + '.'
          : 'I couldn’t read that. Try a number, a fraction (5/36), a percent (12.5%) or an expression.');
        return;
      }
      if (r.count) { feedback('info', 'Expected ' + r.want + ' values separated by commas — you typed ' + r.got + '.'); return; }
      if (st.graded) {
        feedback(r.ok ? 'ok' : 'bad', r.ok ? 'That matches (this problem is already graded).' : 'Still not matching — see the solution.');
        return;
      }
      if (r.ok) {
        feedback('ok', '<b>Correct.</b>' + (a.range ? ' Inside the accepted range.' : '') + praise() + (interview ? '' : canon()));
        grade(true, 'answer');
        if (!interview) { openSolution(); confetti(); }
      } else {
        var msg = '<b>Not quite.</b> ' + (r.order ? 'Right numbers, wrong order — check which value goes first. ' : r.close ? 'Close — check precision or arithmetic. ' : '');
        msg += interview ? 'The solution is in the summary.' : 'Try again, open a hint, or read the solution. It comes back in Review in ' + RETRY_DAYS + ' days.';
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
          feedback(ok ? 'ok' : 'bad', ok ? 'Marked as solved.' + praise() : 'Marked as missed — it will come back in Review in ' + RETRY_DAYS + ' days.');
          if (ok) confetti();
        });
      });
    }
    function onSolutionOpened() {
      st.revealed = true;
      if (a.type === 'self') { showSelfGrade(); return; }
      if (!st.graded) {
        grade(false, 'revealed');
        feedback('info', 'Solution opened before answering — marked “seen solution” (not solved). It comes back in Review in ' + RETRY_DAYS + ' days.');
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
      feedback(ok ? 'ok' : 'bad', ok ? '<b>Correct.</b>' + praise() : '<b>Not quite</b> — the answer is ' + letters[a.correct] + '.' + (interview ? '' : ' It comes back in Review in ' + RETRY_DAYS + ' days.'));
      grade(ok, 'choice');
      if (!interview) { openSolution(); if (ok) confetti(); }
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

    // keypad
    var kpBtn = card.querySelector('[data-act="keypad"]'), kpHost = card.querySelector('.kp-host');
    function applyKeypad() {
      if (!kpHost || !input) return;
      var on = !!S.settings.keypad;
      kpHost.classList.toggle('hidden', !on);
      if (kpBtn) kpBtn.setAttribute('aria-pressed', String(on));
      if (on) input.setAttribute('inputmode', 'none'); else input.removeAttribute('inputmode');
    }
    if (kpHost) { bindKeypad(kpHost, input, submit); applyKeypad(); }
    if (kpBtn) kpBtn.addEventListener('click', function () { S.settings.keypad = !S.settings.keypad; save(); applyKeypad(); input.focus(); });

    // notes (debounced autosave)
    var nta = card.querySelector('.pnotes textarea');
    if (nta) {
      var nt = null;
      nta.addEventListener('input', function () {
        clearTimeout(nt);
        nt = setTimeout(function () {
          var v = nta.value.trim();
          if (v) S.notes[p.id] = { text: nta.value, t: Date.now() }; else delete S.notes[p.id];
          save();
          var ns = card.querySelector('.note-state'); if (ns) ns.textContent = v ? 'saved' : 'private';
        }, 350);
      });
      onCleanup(function () { if (nt) { clearTimeout(nt); var v = nta.value.trim(); if (v) S.notes[p.id] = { text: nta.value, t: Date.now() }; else delete S.notes[p.id]; save(); } });
    }

    // sets
    var menu = card.querySelector('.popmenu'), menuBtn = card.querySelector('[data-act="addmenu"]'), lastBtn = card.querySelector('[data-act="addlast"]');
    function renderMenu() {
      var sets = setList();
      menu.innerHTML = '<span class="pm-title">Add to set</span>' + (sets.length ? sets.map(function (s) {
        return '<button type="button" role="menuitemcheckbox" class="pm-item" data-set="' + esc(s.id) + '" aria-checked="' + inSet(s.id, p.id) + '"><span class="pm-box">' + (inSet(s.id, p.id) ? ICONS.check : '') + '</span>' + esc(s.name) + '<small class="muted">' + s.ids.length + '</small></button>';
      }).join('') : '<span class="muted small pm-empty">No sets yet.</span>') +
        '<span class="pm-new"><input type="text" placeholder="New set name" aria-label="New set name" maxlength="60"><button type="button" class="btn sm primary" data-act="mkset">Create</button></span>';
      $all('[data-set]', menu).forEach(function (b) {
        b.addEventListener('click', function () {
          var on = toggleInSet(b.getAttribute('data-set'), p.id);
          toast(on ? 'Added to “' + S.sets[b.getAttribute('data-set')].name + '”.' : 'Removed from “' + S.sets[b.getAttribute('data-set')].name + '”.', null, null, 1600);
          renderMenu(); syncLast();
        });
      });
      var ni = menu.querySelector('.pm-new input');
      function mk() { var id = newSet(ni.value || ('Set ' + (setList().length + 1)), [p.id]); S.ui.lastSet = id; save(); toast('Created “' + S.sets[id].name + '” with this problem.', null, null, 1800); renderMenu(); syncLast(); }
      menu.querySelector('[data-act="mkset"]').addEventListener('click', mk);
      ni.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); mk(); } });
    }
    function syncLast() {
      var lid = S.ui.lastSet && S.sets[S.ui.lastSet] ? S.ui.lastSet : '';
      var wrap = card.querySelector('.addset'); if (!wrap || !lid) return;
      if (!lastBtn) {
        lastBtn = document.createElement('button'); lastBtn.type = 'button'; lastBtn.className = 'btn sm ghost'; lastBtn.setAttribute('data-act', 'addlast');
        wrap.insertBefore(lastBtn, wrap.firstChild);
        lastBtn.addEventListener('click', onLast);
      }
      lastBtn.innerHTML = ICONS.star + '<span class="addlast-l">' + esc(S.sets[lid].name) + '</span>';
      lastBtn.setAttribute('aria-pressed', String(inSet(lid, p.id)));
      lastBtn.title = 'Toggle in “' + S.sets[lid].name + '”';
    }
    function onLast() {
      var lid = S.ui.lastSet; if (!S.sets[lid]) return;
      var on = toggleInSet(lid, p.id);
      toast(on ? 'Added to “' + S.sets[lid].name + '”.' : 'Removed from “' + S.sets[lid].name + '”.', null, null, 1600);
      syncLast(); if (!menu.classList.contains('hidden')) renderMenu();
    }
    function closeMenu() { if (menu && !menu.classList.contains('hidden')) { menu.classList.add('hidden'); menuBtn.setAttribute('aria-expanded', 'false'); } }
    if (menuBtn) {
      menuBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = menu.classList.contains('hidden');
        if (open) { renderMenu(); menu.classList.remove('hidden'); menuBtn.setAttribute('aria-expanded', 'true'); var f = menu.querySelector('button, input'); if (f && hoverDevice()) f.focus(); }
        else closeMenu();
      });
      menu.addEventListener('click', function (e) { e.stopPropagation(); });
      var docClick = function () { closeMenu(); };
      document.addEventListener('click', docClick);
      menu.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeMenu(); menuBtn.focus(); } });
      onCleanup(function () { document.removeEventListener('click', docClick); });
    }
    if (lastBtn) lastBtn.addEventListener('click', onLast);
    var ub = card.querySelector('[data-act="unsolve"]');
    if (ub) ub.addEventListener('click', function () {
      markNotSolved(p.id); refreshStatus();
      toast('Marked as not solved — it is back in your unsolved list.', null, null, 2200);
    });

    if (input && opts.autofocus !== false && hoverDevice()) input.focus();
    if (ANSWER_TYPES[a.type] && ANSWER_TYPES[a.type].bind) {
      try {
        ANSWER_TYPES[a.type].bind(card.querySelector('.answer-custom'), p, { grade: grade, feedback: feedback, openSolution: openSolution, state: st, interview: interview, opts: opts, card: card, confetti: confetti });
      } catch (e) { console.warn(e); }
    }

    return {
      submit: submit, hint: hint, solution: solution,
      next: function () { if (opts.onNext && (!interview || st.graded)) opts.onNext(); },
      prev: function () { if (opts.onPrev) opts.onPrev(); },
      choose: function (i) { if (a.type === 'choice' && i < a.options.length) chooseOpt(i); },
      state: st, grade: grade, feedback: feedback, card: card, time: tmNow, pause: function () { tmPause(true); }, resume: tmResume,
      toggleTimer: function () { if (tm.stopped || !timeEl) return; if (tm.start) tmPause(true); else tmResume(); }
    };
  }

  /* ------------------------------------------------------------------ */
  /* Onboarding (first run only)                                         */
  /* ------------------------------------------------------------------ */
  var modalOpen = false;
  function showOnboarding() {
    var steps = [
      { t: 'Welcome to Stat Brainteaser', b: '<p>' + PROBLEMS.length + ' interview problems across <b>' + CATS.filter(function (c) { return catStats(c.id).total; }).length + ' topics</b> — probability, EV, Markov chains, Kelly betting, options, market making, game theory, plus Python, SQL, ML, algorithms and CS fundamentals.</p><ul>' +
        '<li><b>Practice</b> by topic or interview format; <b>Review</b> brings back what you missed.</li>' +
        '<li><b>Train</b>: mental math, the <b>Arcade</b> (80 in 8, sequences, market-making games), a 45-minute <b>superday mock</b> and an <b>interview study plan</b> for your target firm and date.</li>' +
        '<li><b>Compete</b>: a coach for QUMC and the Putnam, with a day-by-day plan and a reflection journal.</li></ul>' },
      { t: 'Rehearse the real interview', b: '<ul>' +
        '<li><b>Mock interview</b>: timed rounds that run like the real thing — explain your plan first, solve with a hint ladder, answer the interviewer’s follow-up, then get a debrief and a scorecard.</li>' +
        '<li><b>Learn</b>: short concept lessons that point you to the best chapter or video, and a <b>Library</b> of curated books, courses and guides with your reading status and notes.</li>' +
        '<li><b>Coding lab</b>: Python problems with real tests: algorithms, quant coding and CS simulations. The optional runner (about 10 MB, downloaded once) works offline afterwards.</li>' +
        '<li><b>Software engineering</b>: what SWE and quant-developer interviews test (algorithms, OS, networking, databases), by area, with free courses.</li>' +
        '<li><b>Search</b>: press <b>/</b> or the search button to find any problem, lesson, resource or game.</li>' +
        '<li><b>Interview guide</b>: how the process runs and what each firm expects, with every fact tied to its source.</li></ul>' },
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
    // v2.1 calm Home: only the essentials — streak, a quick start, today's tasks (module hook cards).
    // Topics, train modes and prep pages stay one tap away (Practice / Train / More); a collapsed topic list is kept at the bottom.
    var due = dueIds().length;
    var sk = streakInfo();
    var si = sessionInfo();
    var html = '';
    if (isIOS() && !isStandalone() && !S.ui.iosHintDismissed && S.ui.onboarded) {
      html += '<div class="banner" id="iosHint"><p><b>Install on iPhone:</b> tap <b>Share</b> then <b>Add to Home Screen</b>. It then works fully offline.</p>' +
        '<button class="btn sm ghost" type="button" id="iosHintX" aria-label="Dismiss">✕</button></div>';
    }
    var h = new Date().getHours();
    var greet = h < 5 ? 'Late-night session' : h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
    var dateTxt = '';
    try { dateTxt = new Date(today() + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }); } catch (e) { dateTxt = today(); }
    html += '<header class="home-head"><div class="home-hl"><p class="eyebrow">' + esc(greet) + ' · ' + esc(dateTxt) + '</p><h1>Today</h1></div>' +
      '<div class="streak" role="img" aria-label="' + sk.cur + '-day streak, longest ' + sk.best + '"><b>' + sk.cur + '</b><span>day streak</span></div></header>';
    // quick start: one primary action, at most two quiet secondary ones
    var cont = si && !si.finished;
    html += '<section class="card home-start" aria-label="Quick start"><div class="home-actions">' +
      (cont ? '<button type="button" class="btn primary lg" id="contBtn">' + ICONS.play + '<span><b>Continue</b><small>' + esc(si.label) + ' · ' + (si.idx + 1) + '/' + si.n + '</small></span></button>' : '') +
      '<button type="button" class="btn ' + (cont ? '' : 'primary ') + 'lg" id="mixBtn">' + ICONS.shuffle + '<span><b>Daily mix</b><small>10 problems, weighted to weak &amp; due</small></span></button>' +
      (due ? '<a class="btn lg" href="#review">' + ICONS.review + '<span><b>Review ' + due + '</b><small>due today</small></span></a>' : '') +
      '</div><p class="home-meta">' + solvedCount() + ' of ' + PROBLEMS.length + ' solved' + (due ? '' : ' · nothing due') + ' · best sprint ' + bestSprintText() + '</p></section>';
    // today's tasks: interview plan, competition plan, arcade daily (module hooks)
    var cards = '';
    HOOKS.homeCards.forEach(function (fn) { try { cards += fn() || ''; } catch (e) { console.warn(e); } });
    if (!window.SBT_ARCADE) cards += '<a class="card home-row" href="#arcade"><span class="ticon">' + ICONS.joystick + '</span><span class="hr-t"><b>Arcade</b><small>80 in 8, sequences, market-making games</small></span></a>';
    if (cards) html += '<section class="home-today" aria-labelledby="homeTodayH"><div class="group-head"><h2 id="homeTodayH">Today’s plan</h2></div>' + cards + '</section>';
    // topics stay reachable from Home, folded away
    var topics = CATS.filter(function (c) { return catStats(c.id).total; });
    html += '<details class="reveal home-topics"><summary>' + ICONS.book + '<span>Start a topic</span><small class="muted">' + topics.length + ' topics</small><span class="chev" aria-hidden="true">▾</span></summary>' +
      '<div class="rbody"><div class="topics">' + topics.map(topicCard).join('') + '</div>' +
      '<p class="small muted home-links"><a href="#topics">Topics &amp; concepts</a> · <a href="#practice">All problems</a> · <a href="#train">Train</a></p></div></details>';
    // One-time, dismissible offer for update notifications (after onboarding).
    if (S.ui.onboarded && !S.ui.notifyOffered && !S.settings.notify && 'Notification' in window && Notification.permission !== 'denied') {
      html += '<div class="banner offer" id="notifyOffer"><p><b>Want to know when new problems land?</b> Turn on update notifications — you can change this anytime in Settings.</p>' +
        '<div class="row"><button class="btn sm primary" type="button" id="offerYes">Turn on</button><button class="btn sm ghost" type="button" id="offerNo">No thanks</button></div></div>';
    }
    main.innerHTML = html;
    HOOKS.homeAfter.forEach(function (fn) { try { fn(main); } catch (e) { console.warn(e); } });
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
  /* Practice: search + filters (kept in the URL hash) + compact list     */
  /* ------------------------------------------------------------------ */
  function emptyFilters() { return { cats: [], diffs: [], status: 'all', q: '', styles: [], set: '' }; }
  function normFilters(f) {
    f = f || {};
    var out = emptyFilters();
    out.cats = (Array.isArray(f.cats) ? f.cats : []).filter(function (c, i, a) { return c && a.indexOf(c) === i; }).map(String);
    out.diffs = (Array.isArray(f.diffs) ? f.diffs : []).map(Number).filter(function (d, i, a) { return d >= 1 && d <= 3 && a.indexOf(d) === i; });
    out.status = STATUS_NAME[f.status] || f.status === 'all' ? (f.status || 'all') : 'all';
    out.q = String(f.q || '');
    out.styles = (Array.isArray(f.styles) ? f.styles : []).filter(function (s, i, a) { return s && a.indexOf(s) === i; }).map(String);
    out.set = String(f.set || '');
    return out;
  }
  /* {cats, diffs, status, q, styles, set} ⇄ "t=ev,kelly&d=2,3&s=unsolved&st=trading-desk&set=s1&q=dice" */
  function filtersToQuery(f) {
    f = normFilters(f);
    var parts = [];
    function enc(v) { return encodeURIComponent(v); }
    function add(k, v) { if (v !== '' && v != null) parts.push(k + '=' + v); }
    add('t', f.cats.map(enc).join(','));            // list items are encoded one by one, joined by literal commas
    add('d', f.diffs.join(','));
    if (f.status !== 'all') add('s', enc(f.status));
    add('st', f.styles.map(enc).join(','));
    add('set', enc(f.set));
    add('q', enc(f.q));
    return parts.join('&');
  }
  function queryToFilters(str) {
    var f = emptyFilters();
    str = String(str || '');
    var qi = str.indexOf('?'); if (qi >= 0) str = str.slice(qi + 1);
    str.split('&').forEach(function (kv) {
      if (!kv) return;
      var i = kv.indexOf('='), k = i < 0 ? kv : kv.slice(0, i), raw = i < 0 ? '' : kv.slice(i + 1);
      function dec(x) { try { return decodeURIComponent(x.replace(/\+/g, ' ')); } catch (e) { return x; } }
      function list() { return raw ? raw.split(',').map(dec).filter(Boolean) : []; }
      if (k === 't') f.cats = list();
      else if (k === 'd') f.diffs = list().map(Number);
      else if (k === 's') f.status = dec(raw);
      else if (k === 'st') f.styles = list();
      else if (k === 'set') f.set = dec(raw);
      else if (k === 'q') f.q = dec(raw);
    });
    return normFilters(f);
  }
  function practiceHash(f) { var q = filtersToQuery(f); return '#practice' + (q ? '?' + q : ''); }
  function filtered(f) {
    f = normFilters(f);
    var q = (f.q || '').trim().toLowerCase();
    var terms = q ? q.split(/\s+/) : [];
    var set = f.set && S.sets[f.set] ? S.sets[f.set] : null;
    var base = PROBLEMS;
    if (f.set) base = set ? (set.ids || []).map(function (id) { return BY_ID[id]; }).filter(Boolean) : [];
    return base.filter(function (p) {
      if (f.cats.length && f.cats.indexOf(p.cat) < 0) return false;
      if (f.diffs.length && f.diffs.indexOf(p.diff) < 0) return false;
      if (f.status !== 'all' && status(p.id) !== f.status) return false;
      if (f.styles.length && !pStyles(p).some(function (s) { return f.styles.indexOf(s) >= 0; })) return false;
      if (terms.length) {
        var hay = p._hay || (p._hay = (p.id + ' ' + p.title + ' ' + (p.tags || []).join(' ') + ' ' + pStyles(p).join(' ') + ' ' + catName(p.cat) + ' ' + stripTags(p.prompt)).toLowerCase());
        for (var i = 0; i < terms.length; i++) if (hay.indexOf(terms[i]) < 0) return false;
      }
      return true;
    });
  }
  /* "Pick one": random, unsolved first (then attempting, wrong, seen, solved). Returns an index into list. */
  function pickOneIdx(list, rnd) {
    rnd = rnd || Math.random;
    var tiers = [['unsolved'], ['attempting'], ['wrong', 'seen'], ['solved']];
    for (var t = 0; t < tiers.length; t++) {
      var idx = [];
      list.forEach(function (p, i) { if (tiers[t].indexOf(status(p.id)) >= 0) idx.push(i); });
      if (idx.length) return idx[Math.floor(rnd() * idx.length)];
    }
    return -1;
  }
  function filterLabel(f) {
    if (f.set && S.sets[f.set]) return 'Set: ' + S.sets[f.set].name;
    if (f.q) return 'Search: ' + f.q;
    if (f.cats.length === 1) return catName(f.cats[0]);
    if (f.cats.length) return f.cats.map(function (c) { return (CAT[c] || {}).short || c; }).join(' + ');
    if (f.styles.length === 1) return styleName(f.styles[0]);
    return 'All topics';
  }
  VIEWS.practice = function (main, args) {
    var raw = location.hash || '';
    var f;
    if (raw.indexOf('?') >= 0) f = queryToFilters(raw);
    else f = normFilters(S.settings.filters);
    if (args[0] && CAT[args[0]]) f.cats = [args[0]];
    if (f.set && !S.sets[f.set]) f.set = '';
    S.settings.filters = f; save();
    function syncHash() { try { history.replaceState(null, '', practiceHash(f)); } catch (e) { } }
    syncHash();
    var sets = setList();
    main.innerHTML =
      '<div class="page-head"><div><h1>Practice</h1><p class="muted" id="matchCount" aria-live="polite"></p></div>' +
      '<div class="row"><button class="btn" type="button" id="pickOne">' + ICONS.shuffle + ' Pick one</button>' +
      '<button class="btn primary" type="button" id="startList">' + ICONS.play + ' Start <span id="startN"></span></button></div></div>' +
      '<nav class="quick-links" aria-label="Practice shortcuts">' +
      '<a class="qlink" href="#topics">' + ICONS.book + 'Topics</a><a class="qlink" href="#firms">' + ICONS.building + 'Firms</a>' +
      '<a class="qlink" href="#sets">' + ICONS.star + 'Sets</a><a class="qlink" href="#core50">' + ICONS.list + 'Core 50</a></nav>' +
      '<div class="practice-layout"><aside class="filters card' + (S.settings.filtersOpen ? ' open' : '') + '" id="fPanel">' +
      '<div class="fhead"><label class="search"><span class="sr-only">Search problems</span>' + ICONS.search + '<input type="search" id="q" placeholder="Search title, tag, text…" value="' + esc(f.q || '') + '" autocomplete="off"></label>' +
      '<button type="button" class="btn sm ftoggle" id="fToggle" aria-controls="fMore" aria-expanded="' + !!S.settings.filtersOpen + '">Filters <span id="fCount"></span></button></div>' +
      '<div class="fmore" id="fMore">' +
      '<div class="frow"><span class="label" id="lblCat">Topic</span>' +
      GROUPS.map(function (g) {
        var cs = CATS.filter(function (c) { return c.group === g.id && catStats(c.id).total; });
        if (!cs.length) return '';
        return '<div class="chips scroll" role="group" aria-labelledby="lblCat">' + cs.map(function (c) {
          return '<button type="button" class="chip" data-cat="' + c.id + '" aria-pressed="' + (f.cats.indexOf(c.id) >= 0) + '" style="--cat: var(--c-' + c.id + ')"><span class="dot"></span>' + esc(c.name) + '</button>';
        }).join('') + '</div>';
      }).join('') + '</div>' +
      '<div class="frow"><span class="label" id="lblDiff">Difficulty</span><div class="chips" role="group" aria-labelledby="lblDiff">' +
      [1, 2, 3].map(function (d) { return '<button type="button" class="chip" data-diff="' + d + '" aria-pressed="' + (f.diffs.indexOf(d) >= 0) + '">' + diffDots(d) + ' ' + DIFF_NAME[d] + '</button>'; }).join('') +
      '</div></div>' +
      '<div class="frow"><span class="label" id="lblSt">Status</span><div class="seg seg-status" role="group" aria-labelledby="lblSt">' +
      [['all', 'All']].concat(STATUS_LIST.map(function (s) { return [s, s === 'seen' ? 'Seen' : STATUS_NAME[s]]; })).map(function (o) {
        return '<button type="button" data-st="' + o[0] + '" aria-pressed="' + (f.status === o[0]) + '">' + o[1] + '</button>';
      }).join('') + '</div></div>' +
      '<div class="frow"><span class="label" id="lblFmt">Interview format</span><div class="chips scroll" role="group" aria-labelledby="lblFmt">' +
      STYLES.filter(function (s) { return PROBLEMS.some(function (p) { return pStyles(p).indexOf(s.id) >= 0; }); }).map(function (s) {
        return '<button type="button" class="chip" data-sty="' + s.id + '" aria-pressed="' + (f.styles.indexOf(s.id) >= 0) + '" title="' + esc(s.desc) + '">' + esc(s.name) + '</button>';
      }).join('') + '</div></div>' +
      (sets.length ? '<div class="frow"><label class="label" for="fset">Set</label><select id="fset"><option value="">All problems</option>' + sets.map(function (s) { return '<option value="' + esc(s.id) + '"' + (f.set === s.id ? ' selected' : '') + '>' + esc(s.name) + ' (' + s.ids.length + ')</option>'; }).join('') + '</select></div>' : '') +
      '<div class="frow"><span class="label">Saved filters</span><div class="chips" id="presets"></div>' +
      '<div class="row preset-new hidden" id="presetNew"><input type="text" id="presetName" placeholder="Name this filter" maxlength="40" aria-label="Preset name"><button type="button" class="btn sm primary" id="presetSave">Save</button></div></div>' +
      '<div class="row"><button type="button" class="btn sm ghost" id="clearF">Clear filters</button><button type="button" class="btn sm ghost" id="savePreset">' + ICONS.star + ' Save filter</button><button type="button" class="btn sm ghost" id="copyLink">' + ICONS.link + ' Copy link</button></div></div></aside>' +
      '<section class="list-wrap"><div class="active-filters" id="activeF" aria-label="Active filters"></div><ul class="plist" id="plist" aria-label="Problems"></ul></section></div>';

    var list = [];
    function renderPresets() {
      var ps = S.presets || [];
      $('#presets').innerHTML = ps.length ? ps.map(function (p) {
        return '<span class="preset"><a class="chip" href="#practice' + (p.q ? '?' + esc(p.q) : '') + '">' + esc(p.name) + '</a><button type="button" class="preset-x" data-del="' + esc(p.id) + '" aria-label="Delete preset ' + esc(p.name) + '">✕</button></span>';
      }).join('') : '<span class="muted small">None yet — set some filters, then “Save filter”.</span>';
      $all('[data-del]', main).forEach(function (b) {
        b.addEventListener('click', function () { S.presets = S.presets.filter(function (p) { return p.id !== b.getAttribute('data-del'); }); save(); renderPresets(); });
      });
    }
    /* Removable chips for every active filter, shown above the list (the panel itself is collapsed on phones). */
    function renderActive() {
      var items = [];
      f.cats.forEach(function (c) { items.push(['cat', c, catName(c)]); });
      f.diffs.forEach(function (d) { items.push(['diff', d, DIFF_NAME[d]]); });
      if (f.status !== 'all') items.push(['st', f.status, STATUS_NAME[f.status] || f.status]);
      f.styles.forEach(function (x) { items.push(['sty', x, styleName(x)]); });
      if (f.set && S.sets[f.set]) items.push(['set', f.set, 'Set: ' + S.sets[f.set].name]);
      if (f.q) items.push(['q', '', '“' + f.q + '”']);
      $('#fCount').textContent = items.length ? '(' + items.length + ')' : '';
      $('#activeF').innerHTML = items.length ? items.map(function (it) {
        return '<button type="button" class="chip on" data-rm="' + it[0] + '" data-v="' + esc(String(it[1])) + '" aria-label="Remove filter ' + esc(it[2]) + '">' + esc(it[2]) + ' <span aria-hidden="true">✕</span></button>';
      }).join('') + (items.length > 1 ? '<button type="button" class="btn sm ghost" data-rm="all">Clear all</button>' : '') : '';
    }
    $('#activeF').addEventListener('click', function (e) {
      var b = e.target.closest('[data-rm]'); if (!b) return;
      var k = b.getAttribute('data-rm'), v = b.getAttribute('data-v');
      if (k === 'all') { S.settings.filters = emptyFilters(); save(); go('#practice', true); return; }
      if (k === 'cat') f.cats = f.cats.filter(function (x) { return x !== v; });
      else if (k === 'diff') f.diffs = f.diffs.filter(function (x) { return String(x) !== v; });
      else if (k === 'st') f.status = 'all';
      else if (k === 'sty') f.styles = f.styles.filter(function (x) { return x !== v; });
      else if (k === 'set') f.set = '';
      else if (k === 'q') { f.q = ''; $('#q').value = ''; }
      $all('[data-cat]', main).forEach(function (x) { x.setAttribute('aria-pressed', String(f.cats.indexOf(x.getAttribute('data-cat')) >= 0)); });
      $all('[data-diff]', main).forEach(function (x) { x.setAttribute('aria-pressed', String(f.diffs.indexOf(+x.getAttribute('data-diff')) >= 0)); });
      $all('[data-sty]', main).forEach(function (x) { x.setAttribute('aria-pressed', String(f.styles.indexOf(x.getAttribute('data-sty')) >= 0)); });
      $all('[data-st]', main).forEach(function (x) { x.setAttribute('aria-pressed', String(x.getAttribute('data-st') === f.status)); });
      var fsel = $('#fset'); if (fsel) fsel.value = f.set;
      persist(); refresh();
    });
    $('#fToggle').addEventListener('click', function () {
      var open = !$('#fPanel').classList.contains('open');
      $('#fPanel').classList.toggle('open', open);
      this.setAttribute('aria-expanded', String(open));
      S.settings.filtersOpen = open; save();
    });
    function refresh() {
      renderActive();
      list = filtered(f);
      $('#matchCount').textContent = list.length + ' of ' + PROBLEMS.length + ' problems' + (f.set && S.sets[f.set] ? ' · set “' + S.sets[f.set].name + '”' : '');
      $('#startN').textContent = list.length ? '(' + list.length + ')' : '';
      $('#startList').disabled = !list.length;
      $('#pickOne').disabled = !list.length;
      $('#plist').innerHTML = list.length ? list.map(function (p, i) {
        return '<li><button type="button" data-i="' + i + '">' + statusIcon(status(p.id)) +
          '<span class="t"><span class="tt">' + esc(p.title) + '</span><span class="tm"><span class="cdot" style="--cat: var(--c-' + p.cat + ')"></span>' + esc(catName(p.cat)) +
          (pStyles(p).length ? '<span class="tsty">· ' + esc(styleName(pStyles(p)[0])) + '</span>' : '') + '</span></span>' + diffDots(p.diff) + '</button></li>';
      }).join('') : '<li class="empty"><b>No problems match.</b><br><span class="muted small">Try clearing the search or filters.</span></li>';
    }
    function persist() { S.settings.filters = f; save(); syncHash(); }
    function toggleArr(arr, v) { var i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else arr.push(v); return i < 0; }
    $all('[data-cat]', main).forEach(function (b) { b.addEventListener('click', function () { b.setAttribute('aria-pressed', String(toggleArr(f.cats, b.getAttribute('data-cat')))); persist(); refresh(); }); });
    $all('[data-diff]', main).forEach(function (b) { b.addEventListener('click', function () { b.setAttribute('aria-pressed', String(toggleArr(f.diffs, +b.getAttribute('data-diff')))); persist(); refresh(); }); });
    $all('[data-sty]', main).forEach(function (b) { b.addEventListener('click', function () { b.setAttribute('aria-pressed', String(toggleArr(f.styles, b.getAttribute('data-sty')))); persist(); refresh(); }); });
    $all('[data-st]', main).forEach(function (b) {
      b.addEventListener('click', function () {
        f.status = b.getAttribute('data-st');
        $all('[data-st]', main).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        persist(); refresh();
      });
    });
    var fs = $('#fset'); if (fs) fs.addEventListener('change', function () { f.set = fs.value; persist(); refresh(); });
    var qt = null;
    $('#q').addEventListener('input', function (e) { f.q = e.target.value; clearTimeout(qt); qt = setTimeout(function () { persist(); refresh(); }, 120); });
    $('#clearF').addEventListener('click', function () { S.settings.filters = emptyFilters(); save(); go('#practice', true); });
    $('#savePreset').addEventListener('click', function () { $('#presetNew').classList.toggle('hidden'); var n = $('#presetName'); n.value = filterLabel(f); n.focus(); n.select(); });
    function savePreset() {
      var name = $('#presetName').value.trim() || filterLabel(f);
      S.presets = (S.presets || []).concat([{ id: 'f' + Date.now().toString(36), name: name.slice(0, 40), q: filtersToQuery(f) }]);
      save(); $('#presetNew').classList.add('hidden'); renderPresets(); toast('Filter saved: ' + name, null, null, 1600);
    }
    $('#presetSave').addEventListener('click', savePreset);
    $('#presetName').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); savePreset(); } });
    $('#copyLink').addEventListener('click', function () {
      var url = location.href.split('#')[0] + practiceHash(f);
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(function () { toast('Link copied — bookmark it or open it on another device.', null, null, 2000); }, function () { toast(url); });
      else toast(url);
    });
    var extra = function () { return { kind: 'list', back: practiceHash(f) }; };
    $('#startList').addEventListener('click', function () { startSession(orderForPractice(list).map(function (p) { return p.id; }), filterLabel(f), 0, false, extra()); });
    $('#pickOne').addEventListener('click', function () {
      var i = pickOneIdx(list);
      if (i >= 0) startSession(list.map(function (p) { return p.id; }), filterLabel(f), i, false, extra());
    });
    $('#plist').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-i]');
      if (b) startSession(list.map(function (p) { return p.id; }), filterLabel(f), +b.getAttribute('data-i'), false, extra());
    });
    renderPresets();
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
    var isList = s.kind === 'list' || s.kind === 'set' || s.kind === 'playlist';
    function goIdx(i) {
      if (i >= n) {
        if (isList) {
          toast('That’s the last problem in this list.', s.back ? 'Back to list' : 'Summary', function () { location.hash = s.back || '#play/done'; }, 4000);
          var fbEl = main.querySelector('.feedback');
          if (fbEl && !fbEl.classList.contains('show')) { fbEl.className = 'feedback show info'; fbEl.textContent = 'That’s the last problem in this list.'; }
          return;
        }
        location.hash = '#play/done'; return;
      }
      location.hash = '#play/' + Math.max(0, i);
    }
    var header = '<nav class="crumbs" aria-label="Breadcrumb">' + (s.back ? '<a href="' + esc(s.back) + '" title="Back to the list">' + ICONS.left + '</a>' : '') + '<a href="#topic/' + esc(p.cat) + '" style="--cat: var(--c-' + p.cat + ')"><span class="cdot"></span>' + esc(catName(p.cat)) + '</a>' +
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
      nextLabel: idx + 1 < n ? 'Next' : isList ? 'Next' : 'Finish',
      onResult: function (ok) { s.res[p.id] = ok; save(); },
      onNext: function () { goIdx(idx + 1); },
      onPrev: idx > 0 ? function () { goIdx(idx - 1); } : null,
      onRelated: function (rid) {
        // insert the related problem right after this one in the current session and open it
        var at = s.ids.indexOf(rid);
        if (at < 0) { s.ids.splice(idx + 1, 0, rid); at = idx + 1; }
        save(); location.hash = '#play/' + at;
      }
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
    main.innerHTML = '<div class="page-head"><div><h1>Review</h1><p class="muted" id="revSub">Spaced repetition: correct → next review in 1, 3, 7, 16, 35 days; a wrong answer or a peek at the solution brings it back in 2 days.</p></div></div><div id="rHost"></div>';
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
    var cards = [
      trainCard('#sprint', 'sprint', 'Mental math sprint', 'Timed arithmetic in the online-test format: + − × ÷ against the clock, or the quant mix (percentages, fractions, squares).', 'Best (classic 120s): ' + bestSprintText()) +
      trainCard('#drills', 'drills', 'Probability drills', 'Endless generated questions with exact answers: dice, cards, binomial, Bayes, 2×2 tables, waiting times.', d.n ? d.c + '/' + d.n + ' correct · best streak ' + (d.bestStreak || 0) : 'Not started') +
      trainCard('#interview', 'interview', 'Interview mode', '5 problems from different topics with a countdown on each. Summary and solutions at the end.', ivs.length ? ivs.length + ' sessions · last ' + ivs[ivs.length - 1].score + '/' + ivs[ivs.length - 1].total : 'Not started') +
      trainCard('#arcade', 'joystick', 'Arcade', 'Online-test style games: Arithmetic Mania, 80 in 8, number sequences, balloon risk, card-counting and dice market making, Fermi and Kelly.', arcadeStat()) +
      trainCard('#superday', 'mic', 'Superday mock', 'A timed 45-minute mixed set you solve out loud, then a 5-point self-assessment and a mistake log. Stamina mode: 4 back-to-back.', (S.prep && S.prep.mocks && S.prep.mocks.length) ? S.prep.mocks.length + ' mocks logged' : 'Not started') +
      trainCard('#prep', 'route', 'Interview plan', 'A deterministic day-by-day plan for your target date and firm: mental math → topic problems → format practice → review misses.', S.prep && S.prep.setup ? 'Target ' + S.prep.setup.date : 'Not set up')
    ].join('') + runHtmlHooks(HOOKS.trainCards);
    /* v2.3: group the cards (core + plugin hooks) into three sections instead of one long grid */
    var SECT = [
      { name: 'Timed practice', desc: 'Short, repeatable reps.', hrefs: ['#sprint', '#drills', '#interview', '#arcade', '#codelab', '#deck'] },
      { name: 'Interview simulation', desc: 'Full rounds, plans and role tracks.', hrefs: ['#mock', '#swe', '#superday', '#prep'] },
      { name: 'Study', desc: 'Lessons, resources and how interviews work.', hrefs: ['#learn', '#library', '#guide'] }
    ];
    var parts = cards.split('<a class="train-card').filter(Boolean).map(function (h) { return '<a class="train-card' + h; });
    var hrefOf = function (h) { var m = /href="([^"]*)"/.exec(h); return m ? m[1] : ''; };
    var used = {};
    var html = SECT.map(function (sec) {
      var mine = [];
      sec.hrefs.forEach(function (hr) { parts.forEach(function (h, i) { if (!used[i] && hrefOf(h) === hr) { used[i] = 1; mine.push(h); } }); });
      if (sec.name === 'Timed practice') parts.forEach(function (h, i) { if (!used[i] && SECT.every(function (x) { return x.hrefs.indexOf(hrefOf(h)) < 0; })) { used[i] = 1; mine.push(h); } });
      return mine.length ? '<section class="train-sec"><h2 class="sec-h">' + esc(sec.name) + ' <span class="muted small">' + esc(sec.desc) + '</span></h2><div class="train-grid">' + mine.join('') + '</div></section>' : '';
    }).join('');
    main.innerHTML = '<div class="page-head"><div><h1>Train</h1><p class="muted">Timed and generated practice, games and full mock days — the reps that make interviews feel easy.</p></div></div>' + html;
  };
  function arcadeStat() {
    var A = window.SBT_ARCADE;
    if (!A || !Array.isArray(A.games)) return 'Loads with the arcade module';
    return A.games.length + ' games';
  }
  function trainCard(href, icon, title, desc, stat) {
    return '<a class="train-card card" href="' + href + '"><span class="ic">' + ICONS[icon] + '</span><h2>' + esc(title) + '</h2><p class="muted">' + esc(desc) + '</p><p class="small muted">' + esc(String(stat)) + '</p><span class="btn sm">Open ' + ICONS.right + '</span></a>';
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
            '<div><button type="button" class="btn sm ghost" id="resetRanges">Reset to default ranges</button></div>'
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
        [['all', 'All'], ['quant', 'Quant core'], ['trading', 'Trading'], ['tech', 'Technical'], ['swe', 'Software']].map(function (o) {
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
  /* Problem sets, Core 50 playlist, Arcade fallback                     */
  /* ------------------------------------------------------------------ */
  function pageHead(title, desc, back, backLabel, actions) {
    return '<div class="page-head"><div>' + (back ? '<a class="back-link" href="' + back + '">' + ICONS.left + ' ' + esc(backLabel || 'Back') + '</a>' : '') +
      '<h1>' + title + '</h1>' + (desc ? '<p class="muted">' + desc + '</p>' : '') + '</div>' + (actions ? '<div class="row">' + actions + '</div>' : '') + '</div>';
  }
  VIEWS.sets = function (main) {
    function render() {
      var sets = setList();
      main.innerHTML = pageHead('Problem sets', 'Your own collections. A problem can be in any number of sets; use “Add to…” on any problem.', '#practice', 'Practice') +
        '<div class="card"><form class="row" id="newSetF" autocomplete="off"><label class="sr-only" for="newSetName">New set name</label><input type="text" id="newSetName" placeholder="New set, e.g. “Superday misses”" maxlength="60" style="flex:1;min-width:0"><button class="btn primary" type="submit">' + ICONS.plus + ' Create</button></form></div>' +
        (sets.length ? '<ul class="set-list">' + sets.map(function (s) {
          var ps = s.ids.map(function (id) { return BY_ID[id]; }).filter(Boolean);
          var solved = ps.filter(function (p) { return status(p.id) === 'solved'; }).length;
          return '<li class="card set-item" data-sid="' + esc(s.id) + '"><div class="row"><b class="set-name">' + esc(s.name) + '</b>' + (S.ui.lastSet === s.id ? '<span class="badge">last used</span>' : '') + '<span class="spacer"></span><span class="muted small">' + solved + '/' + ps.length + ' solved</span></div>' +
            '<div class="tbar" role="img" aria-label="' + solved + ' of ' + ps.length + ' solved"><span style="width:' + (ps.length ? solved / ps.length * 100 : 0) + '%;--cat:var(--accent)"></span></div>' +
            '<div class="row" style="margin-top:.6rem"><a class="btn sm primary" href="#practice?set=' + encodeURIComponent(s.id) + '">Open</a>' +
            '<button class="btn sm" type="button" data-play="' + esc(s.id) + '"' + (ps.length ? '' : ' disabled') + '>' + ICONS.play + ' Practice</button>' +
            '<button class="btn sm ghost" type="button" data-ren="' + esc(s.id) + '">Rename</button><button class="btn sm ghost danger" type="button" data-delset="' + esc(s.id) + '">' + ICONS.trash + ' Delete</button></div>' +
            '<div class="row ren-row hidden"><input type="text" maxlength="60" value="' + esc(s.name) + '" aria-label="New name" style="flex:1;min-width:0"><button class="btn sm primary" type="button" data-rensave="' + esc(s.id) + '">Save</button></div></li>';
        }).join('') + '</ul>' : '<div class="card empty">' + ICONS.star + '<h2>No sets yet</h2><p class="muted">Create one here, or open any problem and tap “Add to…”.</p></div>');
      $('#newSetF').addEventListener('submit', function (e) {
        e.preventDefault();
        var n = $('#newSetName').value.trim();
        if (!n) { toast('Give the set a name first.'); return; }
        S.ui.lastSet = newSet(n, []); save(); render();
      });
      $all('[data-play]', main).forEach(function (b) {
        b.addEventListener('click', function () {
          var s = S.sets[b.getAttribute('data-play')];
          startSession(orderForPractice((s.ids || []).map(function (id) { return BY_ID[id]; }).filter(Boolean)).map(function (p) { return p.id; }), 'Set: ' + s.name, 0, false, { kind: 'set', back: '#sets' });
        });
      });
      $all('[data-ren]', main).forEach(function (b) {
        b.addEventListener('click', function () { var li = b.closest('.set-item'); var r = li.querySelector('.ren-row'); r.classList.toggle('hidden'); r.querySelector('input').focus(); });
      });
      $all('[data-rensave]', main).forEach(function (b) {
        b.addEventListener('click', function () {
          var id = b.getAttribute('data-rensave'), v = b.closest('.ren-row').querySelector('input').value.trim();
          if (v && S.sets[id]) { S.sets[id].name = v.slice(0, 60); S.sets[id].t = Date.now(); save(); }
          render();
        });
      });
      $all('[data-delset]', main).forEach(function (b) {
        b.addEventListener('click', function () {
          var id = b.getAttribute('data-delset');
          if (!confirm('Delete the set “' + S.sets[id].name + '”? The problems themselves and your progress are kept.')) return;
          delete S.sets[id]; if (S.ui.lastSet === id) S.ui.lastSet = '';
          if (S.settings.filters.set === id) S.settings.filters.set = '';
          save(); render();
        });
      });
    }
    render();
  };

  function core50Progress() {
    var done = CORE50.filter(function (id) { return status(id) === 'solved'; }).length;
    return { n: CORE50.length, done: done };
  }
  VIEWS.core50 = function (main) {
    var pr = core50Progress();
    var next = CORE50.findIndex ? CORE50.findIndex(function (id) { return status(id) !== 'solved'; }) : -1;
    main.innerHTML = pageHead('Core 50', 'An ordered must-do list drawn from this app’s own bank: each problem teaches a pattern that keeps coming back. Work top to bottom; mixed topics and difficulties on purpose.', '#practice', 'Practice',
      CORE50.length ? '<button class="btn primary" type="button" id="c50go">' + ICONS.play + (pr.done ? ' Continue' : ' Start') + '</button>' : '') +
      '<div class="card"><div class="row"><b>' + pr.done + ' / ' + pr.n + ' solved</b><span class="spacer"></span><span class="muted small">' + (pr.n ? Math.round(pr.done / pr.n * 100) : 0) + '%</span></div>' +
      '<div class="c50bar" role="progressbar" aria-label="Core 50 progress" aria-valuemin="0" aria-valuemax="' + pr.n + '" aria-valuenow="' + pr.done + '"><div style="width:' + (pr.n ? pr.done / pr.n * 100 : 0) + '%"></div></div></div>' +
      '<ol class="c50">' + CORE50.map(function (id, i) {
        var p = BY_ID[id];
        return '<li><button type="button" data-i="' + i + '"' + (i === next ? ' class="next"' : '') + '><span class="c50n mono">' + (i + 1) + '</span>' + statusIcon(status(id)) +
          '<span class="t"><span class="tt">' + esc(p.title) + '</span><span class="tm"><span class="cdot" style="--cat: var(--c-' + p.cat + ')"></span>' + esc(catName(p.cat)) + (pStyles(p).length ? ' · ' + esc(styleName(pStyles(p)[0])) : '') + '</span></span>' + diffDots(p.diff) + '</button></li>';
      }).join('') + '</ol>';
    function open(i) { startSession(CORE50.slice(), 'Core 50', i, false, { kind: 'playlist', back: '#core50' }); }
    var g = $('#c50go'); if (g) g.addEventListener('click', function () { open(next < 0 ? 0 : next); });
    $all('.c50 [data-i]', main).forEach(function (b) { b.addEventListener('click', function () { open(+b.getAttribute('data-i')); }); });
    ctl = { submit: function () { if (g) g.click(); } };
  };

  /* The Arcade lives in arcade.js (loaded before this file). If it failed to load, show a friendly placeholder. */
  VIEWS.arcade = function (main) {
    main.innerHTML = pageHead('Arcade', 'Online-test style games: mental-math races, sequences, risk and market-making games.', '#train', 'Train') +
      '<div class="card empty">' + ICONS.joystick + '<h2>The arcade isn’t available</h2><p class="muted">Its files didn’t load (offline on first visit, or still downloading). Everything else works — reload once you’re online to cache it.</p>' +
      '<div class="row center"><a class="btn primary" href="#sprint">Mental math sprint</a><a class="btn" href="#drills">Probability drills</a></div></div>';
  };

  /* ------------------------------------------------------------------ */
  /* Stats dashboard                                                     */
  /* ------------------------------------------------------------------ */
  /* weakness score per topic (higher = needs more work); feeds the interview planner */
  function topicWeakness() {
    return CATS.filter(function (c) { return catStats(c.id).total; }).map(function (c) {
      var st = catStats(c.id);
      var acc = (st.c + 1) / (st.n + 2);           // Laplace-smoothed accuracy
      var cov = st.solved / st.total;
      var seen = PROBLEMS.filter(function (p) { return p.cat === c.id && (status(p.id) === 'seen' || status(p.id) === 'wrong'); }).length / st.total;
      return { id: c.id, acc: st.n ? st.c / st.n : null, n: st.n, cov: cov, score: Math.round(((1 - acc) * 0.6 + (1 - cov) * 0.25 + seen * 0.15) * 1000) / 1000 };
    }).sort(function (a, b) { return b.score - a.score || (a.id < b.id ? -1 : 1); });
  }
  function yearHeat() {
    var t = today(), end = parseYmd(t);
    var startD = parseYmd(addDays(t, -364)); startD.setDate(startD.getDate() - ((startD.getDay() + 6) % 7)); // a Monday
    var cell = 12, gap = 2, x0 = 28, y0 = 16, cols = 0, rects = '', months = '', lastM = -1, d = new Date(startD);
    while (d <= end) {
      var wd = (d.getDay() + 6) % 7;
      if (wd === 0 && d.getMonth() !== lastM && d.getDate() <= 7) { months += '<text x="' + (x0 + cols * (cell + gap)) + '" y="10" class="hm-l">' + d.toLocaleDateString(undefined, { month: 'short' }) + '</text>'; lastM = d.getMonth(); }
      var k = ymd(d), v = S.days[k] || 0;
      var lvl = v === 0 ? 0 : v < 3 ? 1 : v < 8 ? 2 : v < 20 ? 3 : 4;
      rects += '<rect x="' + (x0 + cols * (cell + gap)) + '" y="' + (y0 + wd * (cell + gap)) + '" width="' + cell + '" height="' + cell + '" rx="2.5" class="hm' + lvl + (k === t ? ' hm-today' : '') + '"><title>' + k + ': ' + v + ' activities</title></rect>';
      if (wd === 6) cols++;
      d.setDate(d.getDate() + 1);
    }
    var W = x0 + (cols + 1) * (cell + gap), H = y0 + 7 * (cell + gap);
    var days = ['Mon', '', 'Wed', '', 'Fri', '', ''].map(function (n, i) { return n ? '<text x="0" y="' + (y0 + i * (cell + gap) + 10) + '" class="hm-l">' + n + '</text>' : ''; }).join('');
    return '<div class="hm-scroll" tabindex="0" aria-label="Scrollable heat map"><svg class="yheat" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="Activity heat map for the last 12 months">' + months + days + rects + '</svg></div>' +
      '<div class="hm-legend small muted">Less <i class="hm0"></i><i class="hm1"></i><i class="hm2"></i><i class="hm3"></i><i class="hm4"></i> More</div>';
  }
  function conqueredRing() {
    var rings = [1, 2, 3].map(function (d) {
      var tot = PROBLEMS.filter(function (p) { return p.diff === d; });
      return { d: d, n: tot.length, k: tot.filter(function (p) { return status(p.id) === 'solved'; }).length };
    });
    var svgR = '', R = [52, 40, 28], cls = ['r1', 'r2', 'r3'];
    rings.forEach(function (r, i) {
      var c = 2 * Math.PI * R[i], f = r.n ? r.k / r.n : 0;
      svgR += '<circle cx="60" cy="60" r="' + R[i] + '" class="ring-bg"/><circle cx="60" cy="60" r="' + R[i] + '" class="ring ' + cls[i] + '" stroke-dasharray="' + (c * f).toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(-90 60 60)"/>';
    });
    var tot = rings.reduce(function (s, r) { return s + r.k; }, 0);
    return '<div class="ring-wrap"><svg viewBox="0 0 120 120" class="rings" role="img" aria-label="Solved by difficulty: ' + rings.map(function (r) { return DIFF_NAME[r.d] + ' ' + r.k + ' of ' + r.n; }).join(', ') + '">' + svgR +
      '<text x="60" y="60" class="ring-n">' + tot + '</text><text x="60" y="74" class="ring-s">solved</text></svg>' +
      '<ul class="ring-leg">' + rings.map(function (r, i) { return '<li><i class="' + cls[i] + '"></i><span>' + DIFF_NAME[r.d] + '</span><b>' + r.k + '<span class="muted">/' + r.n + '</span></b></li>'; }).join('') + '</ul></div>';
  }
  function statusCounts(list) {
    var c = { unsolved: 0, attempting: 0, wrong: 0, seen: 0, solved: 0 };
    (list || PROBLEMS).forEach(function (p) { c[status(p.id)]++; });
    return c;
  }
  function statusBreakdown() {
    var c = statusCounts(), N = PROBLEMS.length || 1;
    return '<div class="sbreak" role="img" aria-label="' + STATUS_LIST.map(function (s) { return STATUS_NAME[s] + ' ' + c[s]; }).join(', ') + '">' +
      STATUS_LIST.map(function (s) { return c[s] ? '<span class="sb-' + s + '" style="width:' + (c[s] / N * 100) + '%"></span>' : ''; }).join('') + '</div>' +
      '<ul class="sb-leg">' + STATUS_LIST.map(function (s) { return '<li><a href="#practice?s=' + s + '">' + statusIcon(s) + '<span>' + STATUS_NAME[s] + '</span><b>' + c[s] + '</b></a></li>'; }).join('') + '</ul>' +
      '<p class="muted small" style="margin:.4rem 0 0">“Seen solution” never counts as solved; it comes back in Review after ' + RETRY_DAYS + ' days.</p>';
  }
  function median(xs) { if (!xs.length) return null; xs = xs.slice().sort(function (a, b) { return a - b; }); var m = xs.length >> 1; return xs.length % 2 ? xs[m] : (xs[m - 1] + xs[m]) / 2; }
  function timeToSolveHtml() {
    var rows = CATS.filter(function (c) { return catStats(c.id).total; }).map(function (c) {
      var ts = PROBLEMS.filter(function (p) { return p.cat === c.id && S.pstatus[p.id] && S.pstatus[p.id].solveMs; }).map(function (p) { return S.pstatus[p.id].solveMs / 1000; });
      return { c: c, med: median(ts), n: ts.length };
    }).filter(function (r) { return r.n; });
    if (!rows.length) return '<div class="empty-inline">' + ICONS.interview + '<p class="muted">Solve a few problems — the attempt timer records how long each one took.</p></div>';
    var mx = Math.max.apply(null, rows.map(function (r) { return r.med; })) || 1;
    return rows.map(function (r) {
      return '<div class="bar-row" style="--cat: var(--c-' + r.c.id + ')"><span class="bn">' + esc(r.c.name) + '</span><div class="bar" role="img" aria-label="' + esc(r.c.name) + ' median ' + fmtTime(r.med) + '"><div style="width:' + Math.max(3, r.med / mx * 100) + '%"></div></div><span class="pct mono">' + fmtTime(r.med) + '</span><span class="sub">median of ' + r.n + ' solve' + (r.n > 1 ? 's' : '') + '</span></div>';
    }).join('');
  }
  function weakestHtml() {
    var w = topicWeakness().slice(0, 4);
    return '<ol class="weak-list">' + w.map(function (x) {
      return '<li style="--cat: var(--c-' + x.id + ')"><a href="#topic/' + x.id + '"><span class="cdot"></span>' + esc(catName(x.id)) + '</a><span class="muted small">' + (x.acc !== null ? pct(x.acc) + ' accuracy · ' : 'not tried · ') + Math.round(x.cov * 100) + '% solved</span></li>';
    }).join('') + '</ol><p class="muted small" style="margin:.4rem 0 0">Your <a href="#prep">interview plan</a> gives these topics extra time.</p>';
  }
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
    var heat = yearHeat();
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
      '<div class="card span-all"><div class="row"><h2 style="margin:0">Your year</h2><span class="spacer"></span><span class="small"><b>' + sk.cur + '</b>-day streak · longest <b>' + sk.best + '</b> · ' + sk.total + ' active days</span></div>' + heat + '</div>' +
      '<div class="card span2"><h2>Accuracy by topic</h2>' + catRows + '</div>' +
      '<div class="card"><h2>Problems conquered</h2>' + conqueredRing() + '</div>' +
      '<div class="card"><h2>Status breakdown</h2>' + statusBreakdown() + '</div>' +
      '<div class="card"><h2>Weakest topics</h2>' + weakestHtml() + '</div>' +
      '<div class="card span2"><h2>Time to solve</h2>' + timeToSolveHtml() + '</div>' +
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
    var hs = main.querySelector('.hm-scroll'); if (hs) hs.scrollLeft = hs.scrollWidth; // show the most recent weeks first on phones
  };

  /* ------------------------------------------------------------------ */
  /* Settings / data                                                     */
  /* ------------------------------------------------------------------ */
  function exportProgress() {
    var data = { app: 'stat-brainteaser', version: APP_VERSION, schema: SCHEMA, exportedAt: new Date().toISOString(), progress: S };
    HOOKS.exportData.forEach(function (fn) { try { fn(data); } catch (e) { console.warn(e); } });
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
    // v4: status, notes, sets, presets, arcade (prep merges itself via HOOKS.mergeState)
    var RANK = { unsolved: 0, attempting: 1, wrong: 2, seen: 3, solved: 4 };
    Object.keys(inc.pstatus || {}).forEach(function (id) {
      var a = cur.pstatus[id], b = inc.pstatus[id];
      if (!isPlainObj(b)) return;
      if (!a) { cur.pstatus[id] = b; return; }
      var keep = (b.reset || 0) > (a.t || 0) ? b : (a.reset || 0) > (b.t || 0) ? a : (RANK[b.s] || 0) > (RANK[a.s] || 0) ? b : (RANK[b.s] === RANK[a.s] && (b.t || 0) > (a.t || 0)) ? b : a;
      var m = JSON.parse(JSON.stringify(keep));
      m.ms = Math.max(a.ms || 0, b.ms || 0);
      if (a.solveMs || b.solveMs) m.solveMs = Math.min(a.solveMs || Infinity, b.solveMs || Infinity);
      cur.pstatus[id] = m;
    });
    Object.keys(inc.notes || {}).forEach(function (id) {
      var a = cur.notes[id], b = inc.notes[id];
      if (b && (!a || (b.t || 0) > (a.t || 0))) cur.notes[id] = b;
    });
    Object.keys(inc.sets || {}).forEach(function (sid) {
      var a = cur.sets[sid], b = inc.sets[sid];
      if (!isPlainObj(b)) return;
      if (!a) { cur.sets[sid] = b; return; }
      var ids = (a.ids || []).slice(); (b.ids || []).forEach(function (x) { if (ids.indexOf(x) < 0) ids.push(x); });
      a.ids = ids; if ((b.t || 0) > (a.t || 0)) a.name = b.name; a.t = Math.max(a.t || 0, b.t || 0);
    });
    var pids = {}; (cur.presets || []).forEach(function (x) { pids[x.id] = 1; });
    (inc.presets || []).forEach(function (x) { if (x && x.id && !pids[x.id]) cur.presets.push(x); });
    if (isPlainObj(inc.arcade)) Object.keys(inc.arcade).forEach(function (k) { if (cur.arcade[k] === undefined) cur.arcade[k] = inc.arcade[k]; });
    HOOKS.mergeState.forEach(function (fn) { try { fn(cur, inc); } catch (e) { console.warn(e); } });
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
        HOOKS.importData.forEach(function (fn) { try { fn(obj, mode); } catch (e) { console.warn(e); } });
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
      ['auto', 'light', 'dark'].map(function (t) { return '<button type="button" data-theme-set="' + t + '" aria-pressed="' + (S.settings.theme === t) + '">' + t[0].toUpperCase() + t.slice(1) + '</button>'; }).join('') + '</div>' +
      '<label class="switch"><input type="checkbox" id="setConfetti"' + (S.settings.confetti ? ' checked' : '') + '><span class="track" aria-hidden="true"></span><span><b>Confetti on a correct answer</b><br><span class="muted small">Always off when your system asks for reduced motion.</span></span></label>' +
      '<label class="switch"><input type="checkbox" id="setKeypad"' + (S.settings.keypad ? ' checked' : '') + '><span class="track" aria-hidden="true"></span><span><b>Math keypad under answers</b><br><span class="muted small">√, π, ^, ! and fractions without the phone keyboard.</span></span></label></div>' +
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
      [['Enter', 'Check answer / start'], ['H', 'Open next hint'], ['S', 'Open solution (interview: give up)'], ['N / P', 'Next / previous problem'], ['1–4', 'Pick a multiple-choice option'], ['T', 'Pause / resume the attempt timer'], ['Esc', 'Skip (mental math)']].map(function (r) {
        return '<tr><td><span class="kbd">' + r[0] + '</span></td><td>' + r[1] + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      HOOKS.settingsCards.map(function (fn) { try { return fn() || ''; } catch (e) { return ''; } }).join('') +
      '<div class="card"><h2>Problem bank</h2><p class="small muted" style="margin:0">' + counts + '</p></div></div>' +
      '<p class="muted small">MIT licensed · © 2026 Breal Tchuimi. Works offline after the first visit.</p>';
    $all('[data-theme-set]', main).forEach(function (b) { b.addEventListener('click', function () { S.settings.theme = b.getAttribute('data-theme-set'); save(); applyTheme(); route(); }); });
    $('#expBtn').addEventListener('click', exportProgress);
    $('#setConfetti').addEventListener('change', function (e) { S.settings.confetti = e.target.checked; save(); });
    $('#setKeypad').addEventListener('change', function (e) { S.settings.keypad = e.target.checked; save(); });
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
    HOOKS.settingsAfter.forEach(function (fn) { try { fn(main); } catch (e) { console.warn(e); } });
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
    else if (lk === 't' && ctl.toggleTimer) { e.preventDefault(); ctl.toggleTimer(); }
  });

  /* ------------------------------------------------------------------ */
  /* Boot                                                                */
  /* ------------------------------------------------------------------ */
  window.StatBT = { parseNumber: parseNumber, checkAnswer: checkAnswer, checkNumeric: checkNumeric, checkMulti: checkMulti, splitList: splitList, DRILLS: DRILLS, version: APP_VERSION, schema: SCHEMA,
    migrate: migrate, dailyMix: dailyMix, state: function () { return S; }, status: status, filtersToQuery: filtersToQuery, queryToFilters: queryToFilters, filtered: filtered,
    pickOneIdx: pickOneIdx, relatedProblems: relatedProblems, topicWeakness: topicWeakness, mergeProgress: mergeProgress, CORE50: CORE50, ENCOURAGE: ENCOURAGE,
    ANSWER_TYPES: ANSWER_TYPES };

  /* Plugin API (competition coach etc. live in separate files and register views/hooks here) */
  var core = {
    VIEWS: VIEWS, TAB_OF: TAB_OF, TITLES: TITLES, HOOKS: HOOKS, ICONS: ICONS, svg: svg,
    get S() { return S; }, save: save, toast: toast, go: go, route: route, esc: esc, $: $, $all: $all,
    today: today, ymd: ymd, parseYmd: parseYmd, addDays: addDays, fmtDate: fmtDate, pad2: pad2, fmtTime: fmtTime,
    onCleanup: onCleanup, setCtl: function (c) { ctl = c; }, markDay: markDay, mergeDefaults: mergeDefaults, isPlainObj: isPlainObj,
    checkNumeric: checkNumeric, codeNorm: codeNorm, stripTags: stripTags, hoverDevice: hoverDevice, diffDots: diffDots,
    statusIcon: statusIcon, startSession: startSession, updateBadges: updateBadges, isIOS: isIOS, version: APP_VERSION,
    PROBLEMS: PROBLEMS, BY_ID: BY_ID, CATS: CATS, CAT: CAT, GROUPS: GROUPS, STYLES: STYLES, STYLE: STYLE, STATUS_LIST: STATUS_LIST, STATUS_NAME: STATUS_NAME, DIFF_NAME: DIFF_NAME, CORE50: CORE50,
    catName: catName, styleName: styleName, pStyles: pStyles, status: status, catStats: catStats, solvedCount: solvedCount, dueIds: dueIds, streakInfo: streakInfo,
    filtered: filtered, filtersToQuery: filtersToQuery, queryToFilters: queryToFilters, practiceHash: practiceHash, orderForPractice: orderForPractice, mountProblem: mountProblem,
    topicWeakness: topicWeakness, statusCounts: statusCounts, setList: setList, newSet: newSet, modeCard: modeCard, subHead: subHead, pct: pct, shuffle: shuffle, pick: pick,
    fmtNum: fmtNum, sparkline: sparkline, answerDisplay: answerDisplay, solutionBody: solutionBody, bestSprintText: bestSprintText, startTopic: startTopic, RETRY_DAYS: RETRY_DAYS,
    get modalOpen() { return modalOpen; }, set modalOpen(v) { modalOpen = v; },
    // v2.1
    ANSWER_TYPES: ANSWER_TYPES, runHtmlHooks: runHtmlHooks, pageHead: pageHead, catBadge: catBadge, checkAnswer: checkAnswer, recordAttempt: recordAttempt,
    trainCard: trainCard, confetti: confetti, randInt: randInt, gcd: gcd, parseNumber: parseNumber, checkMulti: checkMulti, defaultState: defaultState
  };
  (window.SBT_PLUGINS || []).forEach(function (fn) { try { fn(core); } catch (e) { console.error('plugin failed', e); } });

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
    HOOKS.boot.forEach(function (fn) { try { fn(); } catch (e) { console.warn(e); } });
    if (!S.ui.onboarded) showOnboarding();
    document.documentElement.setAttribute('data-ready', '1');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
