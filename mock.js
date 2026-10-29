/* Stat Brainteaser — Mock interview mode (#mock). Rule-based and deterministic (no LLM, no randomness beyond seeded
 * PRNGs): formats (classic / trading / research / phone / js / firm:<id>), each round runs Explain → Solve →
 * Follow-up → Feedback; a scorecard with the four published tips (approach methodically, communicate clearly,
 * correct your mistakes, ask why); an inline market-making round and a mental-maths burst; the `open` answer type.
 * Registers itself with app.js through window.SBT_PLUGINS. */
(window.SBT_PLUGINS = window.SBT_PLUGINS || []).push(function (core) {
  'use strict';
  var esc = core.esc, ICONS = core.ICONS, $ = core.$, $all = core.$all;
  var M = window.SBT_MOCK = window.SBT_MOCK || {};
  M.core = core;

  /* ------------------------------------------------------------------ */
  /* Helpers                                                             */
  /* ------------------------------------------------------------------ */
  function hstr(s) { s = String(s); var h = 2166136261 >>> 0; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h; }
  function rng(seed) {
    var a = typeof seed === 'number' ? seed >>> 0 : hstr(seed);
    return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function ri(r, lo, hi) { return lo + Math.floor(r() * (hi - lo + 1)); }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function half(x) { return x == null || !isFinite(x) ? null : Math.round(x * 2) / 2; }
  function strip(h) { return core.stripTags(h || '').replace(/\s+/g, ' ').trim(); }
  function fmtN(x) { return core.fmtNum(x, 4); }
  function plural(n, w) { return n + ' ' + w + (n === 1 ? '' : 's'); }
  function shortTxt(s, n) { s = strip(s).replace(/[.\s]+$/, ''); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s; }
  function lc1(s) { return s ? s.charAt(0).toLowerCase() + s.slice(1) : s; }
  function today() { return core.today(); }
  function catName(c) { return core.catName(c); }
  function byId(id) { return core.BY_ID[id]; }

  /* ------------------------------------------------------------------ */
  /* State: core.S.mock = {reports, active, open, prefs}                 */
  /* ------------------------------------------------------------------ */
  function C() {
    var s = core.S;
    if (!core.isPlainObj(s.mock)) s.mock = {};
    var m = s.mock;
    if (!Array.isArray(m.reports)) m.reports = [];
    if (!core.isPlainObj(m.open)) m.open = {};
    if (!core.isPlainObj(m.prefs)) m.prefs = { speak: false };
    if (!core.isPlainObj(m.active)) m.active = null;
    return m;
  }
  M.C = C;
  function save() { core.save(); }

  /* ------------------------------------------------------------------ */
  /* Formats                                                             */
  /* ------------------------------------------------------------------ */
  var MATH_CATS = ['probability', 'statistics', 'combinatorics', 'markov', 'ev', 'numbertheory', 'brainteasers'];
  var TECH = ['python', 'sql', 'ml', 'coding', 'systems', 'dsa', 'csfund'];
  var CODE_CATS = ['coding', 'dsa', 'python'];
  var BASE = {
    classic: { id: 'classic', name: 'Classic quant', mins: 60, desc: 'Two maths problems and one coding problem, with push-back and a debrief after every round.',
      rounds: [{ k: 'p', cats: ['probability', 'statistics', 'combinatorics', 'markov'], diffs: [2, 3] }, { k: 'p', cats: ['statistics', 'probability', 'ev', 'markov', 'numbertheory'], diffs: [2, 3] }, { k: 'code' }] },
    trading: { id: 'trading', name: 'Trading desk', mins: 45, desc: 'A probability problem, a market-making round and a two-minute mental-maths burst.',
      rounds: [{ k: 'p', cats: ['probability', 'ev', 'combinatorics', 'kelly'], styles: ['trading-desk', 'betting-game'], diffs: [1, 2, 3] }, { k: 'mm' }, { k: 'mental' }] },
    research: { id: 'research', name: 'Quant research', mins: 60, desc: 'Statistics and regression, then machine learning, then a coding problem.',
      rounds: [{ k: 'p', cats: ['statistics'], styles: ['research-stats'], diffs: [2, 3] }, { k: 'p', cats: ['ml', 'statistics'], styles: ['research-stats'], diffs: [2, 3] }, { k: 'code' }] },
    phone: { id: 'phone', name: 'Phone screen', mins: 30, desc: 'Thirty minutes, three quick problems. Short explanations, quick follow-ups.', quick: true,
      rounds: [0, 1, 2].map(function () { return { k: 'p', cats: ['probability', 'brainteasers', 'ev', 'combinatorics', 'fermi'], styles: ['brainteaser-phone', 'OA-speed', 'trading-desk'], diffs: [1, 2] }; }) },
    js: { id: 'js', name: 'Jane Street style', mins: 60, chat: true, desc: 'Conversational and collaborative: probability, a market and a betting problem. It should feel more like a conversation than a quiz, so ask questions.',
      rounds: [{ k: 'p', cats: ['probability', 'markov', 'combinatorics'], styles: ['trading-desk'], diffs: [2, 3] }, { k: 'mm' }, { k: 'p', cats: ['ev', 'kelly', 'gametheory', 'probability'], styles: ['betting-game', 'trading-desk'], diffs: [2, 3] }] }
  };
  BASE.swe = { id: 'swe', name: 'Software engineer', mins: 60, desc: 'Two algorithm problems coded and tested, then a CS-fundamentals question (OS, networking, databases, bits). State complexity and edge cases out loud.',
    rounds: [{ k: 'code', cats: ['dsa'], diffs: [1, 2] }, { k: 'code', cats: ['dsa'], diffs: [2, 3] }, { k: 'p', cats: ['csfund'], diffs: [2, 3] }] };
  var ORDER = ['classic', 'trading', 'research', 'phone', 'js', 'swe'];
  M.FORMATS = ORDER.map(function (k) { var f = BASE[k]; return { id: f.id, name: f.name, mins: f.mins, desc: f.desc }; });

  function firms() {
    var P = window.SBT_PREP;
    if (P && P.FIRMS) return P.FIRMS;
    var D = window.SBT_PREP_DATA, out = {};
    if (D && Array.isArray(D.firms)) D.firms.forEach(function (f) { out[f.id] = f; });
    return out;
  }
  function firmFormat(fid) {
    var F = firms()[fid];
    if (!F) return null;
    var topics = F.topics || [], styles = F.styles || [];
    var quant = topics.filter(function (c) { return TECH.indexOf(c) < 0 && c !== 'mm' && c !== 'micro'; });
    if (!quant.length) quant = MATH_CATS.slice();
    var a = quant.slice(0, Math.max(1, Math.ceil(quant.length / 2))), b = quant.slice(a.length);
    if (!b.length) b = quant;
    var rounds = [{ k: 'p', cats: a, styles: styles, diffs: [2, 3] }];
    if (styles.indexOf('market-making-game') >= 0 || topics.indexOf('mm') >= 0) rounds.push({ k: 'mm' });
    if (styles.indexOf('OA-speed') >= 0) rounds.push({ k: 'mental' });
    if (topics.some(function (c) { return c === 'coding' || c === 'python' || c === 'dsa'; })) rounds.push({ k: 'code', cats: topics.indexOf('dsa') >= 0 ? ['coding', 'dsa'] : ['coding'] });
    else if (topics.indexOf('ml') >= 0) rounds.push({ k: 'p', cats: ['ml'], styles: styles, diffs: [2, 3] });
    while (rounds.length < 3) rounds.push({ k: 'p', cats: b, styles: styles, diffs: [2, 3] });
    rounds = rounds.slice(0, 3);
    return { id: 'firm:' + fid, firm: fid, name: F.name + ' style', mins: 45, chat: fid === 'jane-street',
      desc: 'Built from ' + F.name + '’s commonly reported topics (' + topics.slice(0, 4).map(catName).join(', ') + ') and interview styles.', rounds: rounds };
  }
  function getFormat(id) {
    id = String(id || '');
    if (BASE[id]) return BASE[id];
    if (id.indexOf('firm:') === 0) return firmFormat(id.slice(5));
    return null;
  }
  M.format = getFormat;

  /* ------------------------------------------------------------------ */
  /* Problem selection (deterministic)                                   */
  /* ------------------------------------------------------------------ */
  var OK_TYPES = ['numeric', 'multi', 'choice', 'text'];
  function okType(p) { return p && p.answer && OK_TYPES.indexOf(p.answer.type) >= 0; }
  function parOf(p) { return p && +p.par > 0 ? +p.par : ({ 1: 4, 2: 8, 3: 12 })[(p && p.diff) || 2]; }
  function pickProblem(r, salt, used, cats, quick) {
    var P = core.PROBLEMS, weak = weakTopics(), cand;
    if (r.k === 'code') {
      var cc = r.cats || ['coding'];
      cand = core.ANSWER_TYPES.code ? P.filter(function (p) { return cc.indexOf(p.cat) >= 0 && p.answer && p.answer.type === 'code'; }) : [];
      if (!cand.length) cand = P.filter(function (p) { return (cc.indexOf(p.cat) >= 0 || p.cat === 'python') && okType(p); });
    } else cand = P.filter(function (p) { return r.cats.indexOf(p.cat) >= 0 && okType(p); });
    cand = cand.filter(function (p) { return !used[p.id]; });
    if (!cand.length) cand = P.filter(function (p) { return MATH_CATS.indexOf(p.cat) >= 0 && okType(p) && !used[p.id]; });
    if (!cand.length) return null;
    function score(p) {
      var s = 0;
      if (core.status(p.id) !== 'solved') s += 4;
      if (Array.isArray(p.followups) && p.followups.length) s += 3;
      if (p.plan) s += 2;
      if (r.styles && core.pStyles(p).some(function (x) { return r.styles.indexOf(x) >= 0; })) s += 1.5;
      if (r.diffs && r.diffs.indexOf(p.diff) >= 0) s += 1;
      if (!cats[p.cat]) s += 1;
      if (quick && p.diff === 1) s += 0.5;
      s += 1.5 * (weak[p.cat] || 0);
      return s;
    }
    var sc = {}; cand.forEach(function (p) { sc[p.id] = score(p); });
    cand.sort(function (a, b) { return sc[b.id] - sc[a.id] || hstr(salt + a.id) - hstr(salt + b.id) || (a.id < b.id ? -1 : 1); });
    return cand[0];
  }
  function planFor(fmtId, reroll, nPrev, day) {
    var F = getFormat(fmtId);
    if (!F) return null;
    nPrev = nPrev == null ? C().reports.length : nPrev;
    var seed = (day || today()) + '|' + fmtId + '|' + nPrev + '|' + (reroll || 0);
    var used = {}, cats = {}, rounds = [];
    F.rounds.forEach(function (r, i) {
      if (r.k === 'mm') rounds.push({ kind: 'mm', scen: SCEN[hstr(seed + '|mm' + i) % SCEN.length].id, seed: hstr(seed + '|mmdraw' + i) });
      else if (r.k === 'mental') rounds.push({ kind: 'mental', seed: hstr(seed + '|mental' + i) });
      else {
        var p = pickProblem(r, seed + '|' + i, used, cats, F.quick);
        if (p) { used[p.id] = 1; cats[p.cat] = 1; rounds.push({ kind: r.k === 'code' ? 'code' : 'problem', id: p.id }); }
      }
    });
    return { format: F.id, name: F.name, seed: seed, reroll: reroll || 0, rounds: rounds };
  }
  M.planFor = planFor;

  /* ------------------------------------------------------------------ */
  /* Market-making scenarios (all values computed by exact enumeration)  */
  /* ------------------------------------------------------------------ */
  function diceDist(n, faces) {
    var d = { 0: 1 };
    for (var k = 0; k < n; k++) {
      var nd = {};
      Object.keys(d).forEach(function (v) { for (var f = 1; f <= faces; f++) nd[+v + f] = (nd[+v + f] || 0) + d[v] / faces; });
      d = nd;
    }
    return d;
  }
  function conv(a, b) { var o = {}; Object.keys(a).forEach(function (x) { Object.keys(b).forEach(function (y) { o[+x + +y] = (o[+x + +y] || 0) + a[x] * b[y]; }); }); return o; }
  function moments(d) {
    var m = 0, v = 0;
    Object.keys(d).forEach(function (x) { m += +x * d[x]; });
    Object.keys(d).forEach(function (x) { v += (+x - m) * (+x - m) * d[x]; });
    return { mean: m, sd: Math.sqrt(v) };
  }
  function choose(n, k) { if (k < 0 || k > n) return 0; var r = 1; for (var i = 1; i <= k; i++) r = r * (n - k + i) / i; return r; }
  function meanOf(d) { return moments(d).mean; }
  var SCEN = [
    { id: 'dice3', name: 'the sum of three fair dice', peekText: 'I peeked at one of the three dice before you quoted.',
      build: function () {
        var d = diceDist(3, 6), rest = meanOf(diceDist(2, 6));
        return { dist: d, peeks: [1, 2, 3, 4, 5, 6].map(function (v) { return { label: 'the die I saw shows ' + v, p: 1 / 6, cond: v + rest, wrong: v + 3 * 3.5 }; }) };
      } },
    { id: 'dice2', name: 'the sum of two fair dice', peekText: 'I saw one of the two dice.',
      build: function () {
        var d = diceDist(2, 6), rest = meanOf(diceDist(1, 6));
        return { dist: d, peeks: [1, 2, 3, 4, 5, 6].map(function (v) { return { label: 'the die I saw shows ' + v, p: 1 / 6, cond: v + rest, wrong: v + 2 * 3.5 }; }) };
      } },
    { id: 'd20d6', name: 'a 20-sided die plus a six-sided die', peekText: 'I peeked at the six-sided die.',
      build: function () {
        var d = conv(diceDist(1, 20), diceDist(1, 6)), rest = meanOf(diceDist(1, 20));
        return { dist: d, peeks: [1, 2, 3, 4, 5, 6].map(function (v) { return { label: 'the six-sided die shows ' + v, p: 1 / 6, cond: v + rest, wrong: v + rest + 3.5 }; }) };
      } },
    { id: 'aces', name: 'the number of aces in a five-card hand from a shuffled 52-card deck', peekText: 'I saw the first card of the hand.',
      build: function () {
        var d = {}; for (var k = 0; k <= 4; k++) d[k] = choose(4, k) * choose(48, 5 - k) / choose(52, 5);
        return { dist: d, peeks: [
          { label: 'the first card is an ace', p: 4 / 52, cond: 1 + 4 * 3 / 51, wrong: 1 + 4 * 4 / 52 },
          { label: 'the first card is not an ace', p: 48 / 52, cond: 4 * 4 / 51, wrong: 5 * 4 / 52 }] };
      } },
    { id: 'heads', name: 'the number of heads in ten fair coin flips', peekText: 'I watched the first three flips.',
      build: function () {
        var d = {}; for (var k = 0; k <= 10; k++) d[k] = choose(10, k) / 1024;
        return { dist: d, peeks: [0, 1, 2, 3].map(function (c) { return { label: c + ' of the first three flips ' + (c === 1 ? 'was' : 'were') + ' heads', p: choose(3, c) / 8, cond: c + 3.5, wrong: c + 5 }; }) };
      } }
  ];
  var SCEN_BY = {}; SCEN.forEach(function (s) { SCEN_BY[s.id] = s; });
  function scenario(id, seed) {
    var S0 = SCEN_BY[id] || SCEN[0], b = S0.build(), mo = moments(b.dist);
    var u = rng(seed >>> 0)(), acc = 0, pk = b.peeks[b.peeks.length - 1];
    for (var i = 0; i < b.peeks.length; i++) { acc += b.peeks[i].p; if (u < acc) { pk = b.peeks[i]; break; } }
    var lift = pk.cond > mo.mean;
    var side = b.peeks.filter(function (x) { return (x.cond > mo.mean) === lift; });
    var ps = side.reduce(function (s, x) { return s + x.p; }, 0);
    var condDir = side.reduce(function (s, x) { return s + x.p * x.cond; }, 0) / (ps || 1);
    var keys = Object.keys(b.dist).map(Number);
    return { id: S0.id, name: S0.name, peekText: S0.peekText, fair: mo.mean, sd: mo.sd, lo: Math.min.apply(null, keys), hi: Math.max.apply(null, keys),
      peek: pk, lift: lift, condDir: condDir, peeks: b.peeks };
  }
  M.scenario = scenario;
  M.SCENARIOS = SCEN.map(function (s) { return s.id; });
  /* pure evaluation of the three quotes: q = [{b,a,s}, {b,a}, {b,a}] */
  function evalMM(sc, q) {
    var e = {};
    var q1 = q[0], q2 = q[1], q3 = q[2], eps = 1e-9;
    if (q1) {
      e.inside = q1.b <= sc.fair + eps && sc.fair <= q1.a + eps;
      e.width = q1.a - q1.b;
      e.widthRatio = sc.sd ? e.width / sc.sd : 0;
      e.widthOk = e.width > 0 && e.widthRatio <= 1.5;
      e.pnl = (q1.s || 1) * (sc.lift ? q1.a - sc.peek.cond : sc.peek.cond - q1.b);
    }
    if (q1 && q2) {
      var m1 = (q1.a + q1.b) / 2, m2 = (q2.a + q2.b) / 2;
      e.dir = sc.lift ? m2 > m1 + eps : m2 < m1 - eps;
      e.over = Math.abs(m2 - m1) > 2 * Math.abs(sc.condDir - sc.fair) + 0.25 * sc.sd;
      e.shift = m2 - m1;
    }
    if (q3) e.finalInside = q3.b <= sc.peek.cond + eps && sc.peek.cond <= q3.a + eps;
    e.ok = !!(e.inside && e.dir && e.finalInside);
    return e;
  }
  M.evalMM = evalMM;

  /* ------------------------------------------------------------------ */
  /* Mental maths items                                                  */
  /* ------------------------------------------------------------------ */
  function mentalItems(seed, n) {
    var r = rng(seed >>> 0), out = [], kinds = ['add', 'sub', 'mul1', 'mul2', 'div', 'pct'];
    for (var i = 0; i < (n || 12); i++) {
      var k = kinds[(i + ri(r, 0, 5)) % kinds.length], a, b, q, ans;
      if (k === 'add') { a = ri(r, 120, 989); b = ri(r, 15, 899); q = a + ' + ' + b; ans = a + b; }
      else if (k === 'sub') { a = ri(r, 300, 999); b = ri(r, 17, a - 50); q = a + ' − ' + b; ans = a - b; }
      else if (k === 'mul1') { a = ri(r, 13, 98); b = ri(r, 3, 9); q = a + ' × ' + b; ans = a * b; }
      else if (k === 'mul2') { a = ri(r, 11, 39); b = ri(r, 11, 29); q = a + ' × ' + b; ans = a * b; }
      else if (k === 'div') { b = ri(r, 3, 12); ans = ri(r, 4, 29); a = ans * b; q = a + ' ÷ ' + b; }
      else { a = [5, 10, 15, 20, 25, 30, 40, 50, 75][ri(r, 0, 8)]; b = 20 * ri(r, 1, 20); q = a + '% of ' + b; ans = a * b / 100; }
      out.push({ k: k, q: q, ans: ans });
    }
    return out;
  }
  M.mentalItems = mentalItems;
  var MENTAL_SECS = 120;

  /* ------------------------------------------------------------------ */
  /* Explain-first tick options                                          */
  /* ------------------------------------------------------------------ */
  var GENERIC_TICKS = [
    { t: 'Try small cases first', sanity: true }, { t: 'Look for a symmetry' }, { t: 'Use linearity of expectation' },
    { t: 'Condition on the first event' }, { t: 'First-step analysis: a recursion on states' }, { t: 'Check an extreme or limiting case', sanity: true }];
  var GENERIC_DISTRACT = ['Assume every event is independent without checking', 'List every outcome by hand, whatever the size', 'Use a normal approximation straight away', 'Guess the answer, then justify it'];
  var MM_TICKS = [
    { t: 'Work out the fair value (expected value) first', ok: true, g: 'Structure' }, { t: 'Set the width from how uncertain the value is', ok: true, g: 'Method' },
    { t: 'Ask what a trade against me tells me (adverse selection)', ok: true, g: 'Method' }, { t: 'Check the quote against the possible range', ok: true, g: 'Check', sanity: true },
    { t: 'Quote as wide as possible so I can never lose', ok: false, g: 'Method' }, { t: 'Keep the same market whatever trades', ok: false, g: 'Method' },
    { t: 'Centre the market on the single most likely outcome', ok: false, g: 'Structure' }];
  var MENTAL_TICKS = [
    { t: 'Estimate the size of the answer first', ok: true, g: 'Check', sanity: true }, { t: 'Round to friendly numbers, then adjust', ok: true, g: 'Method' },
    { t: 'Skip a hard item and keep the pace', ok: true, g: 'Method' }, { t: 'Do every item long-hand, digit by digit', ok: false, g: 'Method' }, { t: 'Never skip an item', ok: false, g: 'Method' }];
  function planItems(p) {
    var pl = p && p.plan, out = [];
    if (!pl) return out;
    if (pl.keyIdea) out.push({ t: strip(pl.keyIdea), g: 'Structure', ok: true });
    if (pl.method) out.push({ t: strip(pl.method), g: 'Method', ok: true });
    (pl.sanityChecks || []).slice(0, 2).forEach(function (s) { out.push({ t: strip(s), g: 'Check', ok: true, sanity: true }); });
    return out;
  }
  function explainOptions(round, p, seed) {
    var opts;
    if (round.kind === 'mm') opts = MM_TICKS.slice();
    else if (round.kind === 'mental') opts = MENTAL_TICKS.slice();
    else {
      var good = planItems(p);
      if (good.length) {
        var others = core.PROBLEMS.filter(function (q) { return q.plan && q.id !== p.id && q.cat !== p.cat; });
        if (others.length < 2) others = core.PROBLEMS.filter(function (q) { return q.plan && q.id !== p.id; });
        others.sort(function (a, b) { return hstr(seed + a.id) - hstr(seed + b.id); });
        var bad = [];
        if (others[0] && others[0].plan.keyIdea) bad.push({ t: strip(others[0].plan.keyIdea), g: 'Structure', ok: false });
        if (others[1] && others[1].plan.method) bad.push({ t: strip(others[1].plan.method), g: 'Method', ok: false });
        var gi = hstr(seed + p.id);
        while (bad.length < 2) { bad.push({ t: GENERIC_DISTRACT[(gi + bad.length) % GENERIC_DISTRACT.length], g: 'Method', ok: false }); }
        bad = bad.filter(function (b) { return !good.some(function (g) { return g.t === b.t; }); });
        opts = good.concat(bad);
      } else {
        opts = GENERIC_TICKS.map(function (g) { return { t: g.t, g: g.sanity ? 'Check' : 'Method', ok: null, sanity: !!g.sanity }; });
        if (round.kind === 'code' || (p && CODE_CATS.indexOf(p.cat) >= 0)) opts.push({ t: 'State the time and space complexity', g: 'Method', ok: null, complexity: true });
      }
    }
    return opts.map(function (o, i) { o.i = i; return o; }).sort(function (a, b) { return hstr(seed + '|' + a.t) - hstr(seed + '|' + b.t); });
  }
  M.explainOptions = explainOptions;
  function summarizeExplain(opts, ticked, text, clarify, skipped, ms) {
    var tk = opts.filter(function (o) { return ticked.indexOf(o.t) >= 0; });
    var generic = opts.every(function (o) { return o.ok === null || o.ok === undefined; });
    var nCorrect = generic ? 0 : opts.filter(function (o) { return o.ok; }).length;
    var correctTicks = tk.filter(function (o) { return o.ok; }).length;
    var dis = tk.filter(function (o) { return o.ok === false; });
    text = String(text || '');
    var done = !skipped && (generic ? tk.length >= 1 : correctTicks >= 1) || (!skipped && text.trim().length >= 15);
    return { done: !!done, skipped: !!skipped, ms: ms || 0, ticks: tk.map(function (o) { return o.t; }), nTicks: tk.length, generic: generic, nCorrect: nCorrect, correctTicks: correctTicks,
      distractors: dis.length, distractorText: dis.length ? dis[0].t : '', textLen: text.trim().length, text: text.trim().slice(0, 600),
      sanity: tk.some(function (o) { return o.sanity; }) || /sanity|small case|check|n\s*=\s*[12]\b|limit|extreme|symmetr/i.test(text),
      complexity: tk.some(function (o) { return o.complexity; }) || /complexity|O\(/i.test(text), clarify: String(clarify || '').trim().length >= 8 };
  }
  M.summarizeExplain = summarizeExplain;

  /* ------------------------------------------------------------------ */
  /* Follow-ups                                                          */
  /* ------------------------------------------------------------------ */
  var FU_LABEL = { faster: 'a faster way', variant: 'a variant', limit: 'a limiting case', sanity: 'a sanity check', complexity: 'complexity', explain: 'the intuition', correct: 'a planted mistake' };
  function validFU(f) { return f && f.prompt && FU_LABEL[f.type] && (f.type !== 'correct' || f.answer); }
  function plantWrong(v) {
    if (v > 0 && v < 1) return Math.abs(1 - 2 * v) > 0.05 ? 1 - v : v / 2;
    if (Number.isInteger(v)) return v === 0 ? 1 : v * 2;
    return v * 2;
  }
  function chooseFollowup(round, p, L, seed) {
    if (round.kind === 'mm') {
      var sc = scenario(round.scen, round.seed);
      return { type: 'correct', synthetic: true, prompt: '<p>So now that you know ' + esc(sc.peek.label) + ', the fair value is <b>' + fmtN(sc.peek.wrong) + '</b>, right?</p>',
        model: '<p>No. Fair value given what I saw is <b>' + fmtN(sc.peek.cond) + '</b>: the part I saw is known, so only the rest is still random. (Counting the seen part twice, or ignoring that a card was removed, gives ' + fmtN(sc.peek.wrong) + '.)</p>',
        answer: { type: 'numeric', value: sc.peek.cond } };
    }
    if (round.kind === 'mental') {
      var items = mentalItems(round.seed, 12), it = items.filter(function (x) { return x.k === 'mul2' || x.k === 'mul1'; })[0] || items[0];
      var wrong = it.ans + (it.ans % 10 === 0 ? 20 : 10);
      return { type: 'correct', synthetic: true, prompt: '<p>Quick one: I make <b>' + esc(it.q) + ' = ' + wrong + '</b>. Agree?</p>',
        model: '<p>' + esc(it.q) + ' = <b>' + it.ans + '</b>. A last-digit check catches it straight away.</p>', answer: { type: 'numeric', value: it.ans } };
    }
    var fus = (p.followups || []).filter(validFU);
    if (fus.length) {
      var withAns = fus.filter(function (f) { return f.answer; });
      var pool = withAns.length ? withAns : fus;
      var f = pool[hstr(seed + '|fu|' + p.id) % pool.length];
      return { type: f.type, prompt: f.prompt, model: f.model || '', answer: f.answer || null, synthetic: false };
    }
    var a = p.answer || {};
    if (a.type === 'code' && a.complexity && a.complexity.time) {
      var cx = a.complexity, opts = [cx.time];
      [cx.naive, 'O(n³)', 'O(log n)', 'O(n)', 'O(2ⁿ)'].forEach(function (o) { if (o && opts.indexOf(o) < 0 && opts.length < 4) opts.push(o); });
      var order = opts.slice().sort(function (x, y) { return hstr(seed + x) - hstr(seed + y); });
      return { type: 'complexity', synthetic: true, prompt: '<p>What is the time complexity of a good solution here?</p>',
        model: '<p>' + esc(cx.time) + (cx.space ? ' time, ' + esc(cx.space) + ' space' : '') + '.' + (cx.why ? ' ' + cx.why : '') + '</p>',
        answer: { type: 'choice', options: order, correct: order.indexOf(cx.time) } };
    }
    if (round.kind === 'code' || CODE_CATS.indexOf(p.cat) >= 0) {
      return { type: 'complexity', synthetic: true, prompt: '<p>What is the time and space complexity of the code you would write, and where is the bottleneck?</p>',
        model: '<p>Name the dominant loop or recursion and count how often it runs. If the same sub-problem is recomputed, memoise it; if you scan a list repeatedly, use a dict or set.</p>', answer: null };
    }
    if (a.type === 'numeric' && L && L.solve && L.solve.ok && isFinite(a.value) && !a.range) {
      var w = plantWrong(a.value);
      return { type: 'correct', synthetic: true, prompt: '<p>I worked this one too and got <b>' + fmtN(w) + '</b>. Which of us is right?</p>',
        model: '<p>The answer is <b>' + core.answerDisplay(p) + '</b>. When someone states a different number, re-check your argument, then hold your ground politely.</p>', answer: a };
    }
    var pl = p.plan;
    if (pl && pl.sanityChecks && pl.sanityChecks.length) {
      return { type: 'sanity', synthetic: true, prompt: '<p>Sanity-check your answer: ' + esc(strip(pl.sanityChecks[0])) + '</p>', model: '<p>' + esc(strip(pl.sanityChecks.join(' '))) + '</p>' + (p.key ? '<p>' + p.key + '</p>' : ''), answer: null };
    }
    return { type: 'sanity', synthetic: true, prompt: '<p>Sanity-check your answer with the smallest case you can do by hand. Does it agree?</p>',
      model: '<p>Shrink the problem (n = 1 or 2, one die, two players) and check that your formula gives the hand-computed value.</p>' + (p.key ? '<p>' + p.key + '</p>' : ''), answer: null };
  }
  M.chooseFollowup = chooseFollowup;

  /* ------------------------------------------------------------------ */
  /* Feedback rules: pure function of a round log                        */
  /* ------------------------------------------------------------------ */
  var STUCK = [
    { k: 'small', t: 'Try small cases', nudge: 'Shrink it: n = 1, 2, 3. Compute those by hand and look for the pattern.' },
    { k: 'symmetry', t: 'Look for symmetry', nudge: 'Which outcomes are interchangeable? Symmetry often turns a sum into a single term.' },
    { k: 'simpler', t: 'Solve a simpler version', nudge: 'Drop one condition, solve that, then add the condition back.' },
    { k: 'backwards', t: 'Work backwards', nudge: 'Start from the end state (or the last step) and step back one move at a time.' },
    { k: 'restate', t: 'Restate the question', nudge: 'Say the question back in your own words. What exactly is random, and what is being asked?' },
    { k: 'estimate', t: 'Estimate first', nudge: 'Get a rough number or a range first; it tells you whether the exact answer is plausible.' }];
  var STUCK_NAME = {}; STUCK.forEach(function (s) { STUCK_NAME[s.k] = lc1(s.t); });
  M.STUCK = STUCK;

  function feedback(L) {
    L = L || {};
    var kind = L.kind || 'problem', ex = L.explain || {}, sv = L.solve || {}, fu = L.followup || null;
    var hints = +L.hints || 0, stuck = Array.isArray(L.stuck) ? L.stuck : [];
    var explained = !!ex.done && !ex.skipped;
    var planQ = ex.nCorrect ? clamp((ex.correctTicks - 0.5 * (ex.distractors || 0)) / ex.nCorrect, 0, 1) : (explained ? ((ex.nTicks || 0) >= 2 || (ex.textLen || 0) >= 40 ? 1 : 0.6) : 0);
    var sanity = !!ex.sanity || !!(fu && fu.type === 'sanity' && fu.handled >= 0.5);
    var mins = (sv.ms || 0) / 60000, par = +L.par || 0;
    var mm = L.mm || null, mt = L.mental || null;
    var isProb = kind === 'problem' || kind === 'code';
    var fired = [];
    function rule(id, pr, text) { fired.push({ id: id, pr: pr, text: text }); }
    var ok;

    /* opener */
    var opener;
    if (isProb) {
      ok = !!sv.ok;
      opener = ok ? 'Correct answer' + (hints ? ' with ' + plural(hints, 'hint') : '') + '.'
        : sv.how === 'gaveup' ? 'You moved on without an answer.' : 'The final answer didn’t match. That’s recoverable when the reasoning is sound; the model solution is below.';
    } else if (kind === 'mm') {
      ok = !!(mm && mm.ok);
      opener = mm ? (ok ? 'Solid market-making round: fair value inside your first quote, the right update, and a final market around the true value.' : 'A useful market-making round to learn from.') : 'The market-making round was not finished.';
    } else {
      ok = !!(mt && mt.n && mt.correct / mt.n >= 0.7);
      opener = mt ? 'You got ' + mt.correct + ' of ' + mt.n + ' right in ' + Math.round(mt.secs || 0) + ' s.' : 'The mental-maths round was not finished.';
    }

    /* explain-first rules */
    if (!explained) rule('explain-skipped', 1, 'You went straight to computing. Spend 30 seconds first saying which property you’ll use and how you’ll check the answer. That is the first thing the interviewer listens for.');
    else if (planQ >= 0.67) rule('explain-first', 3, 'You named the structure before calculating' + (L.keyIdea ? ' (' + shortTxt(L.keyIdea, 90) + ')' : '') + ', which is exactly what an interviewer wants to hear first.');
    else if (ex.nCorrect) rule('explain-thin', 2, 'Your plan was only partly there. The key idea to say out loud first: ' + (L.keyIdea ? shortTxt(L.keyIdea, 110) : 'the structure of the problem') + '.');
    if ((ex.distractors || 0) > 0) rule('plan-distractor', 3, 'One item in your plan (“' + shortTxt(ex.distractorText, 70) + '”) doesn’t fit this problem. Choose the tool that matches the structure in front of you.');
    if (ex.clarify) rule('clarified', 7, 'Asking a clarifying question before starting was a good move.');

    /* hints & stuck */
    if (isProb) {
      if (sv.how === 'gaveup') rule('gave-up', 1, 'Giving up sounds like “I don’t know”. Ask for a hint or try a simpler version out loud instead; that keeps the interview going.');
      if (hints > 0 && ok) rule('hints-good', 4, 'You used ' + plural(hints, 'hint') + ' and turned ' + (hints === 1 ? 'it' : 'them') + ' into an answer. That is exactly how hints are meant to be used.');
      if (hints > 0 && L.hintContext) rule('hints-context', 5, 'You said what you had tried before asking for help, which makes a hint far more useful.');
      if (hints === 0 && ok) rule('no-hints', 8, 'No hints needed.');
      if (stuck.length) rule('stuck-used', 4, 'Good recovery: when stuck you tried to ' + stuck.map(function (k) { return STUCK_NAME[k] || k; }).slice(0, 2).join(' and ') + '.');
      else if (!ok && hints === 0 && sv.how !== 'gaveup') rule('stuck-missing', 2, 'When it wasn’t working you didn’t change approach. Try small cases or a simpler version out loud before committing to an answer.');
      if (par && sv.ms) {
        if (ok && mins <= 0.6 * par) rule('time-fast', 7, 'Quick: ' + Math.max(1, Math.round(mins)) + ' min against a par of ' + par + ' min.');
        else if (mins > 1.5 * par) rule('time-slow', 5, 'This took ' + Math.round(mins) + ' min against a par of ' + par + ' min. Naming the method earlier is usually what saves the time.');
      }
    }

    /* follow-up */
    if (fu) {
      var lab = FU_LABEL[fu.type] || 'the follow-up';
      if (fu.type === 'correct') {
        if (fu.disagreed && fu.handled === 1) rule('correct-held', 2, 'When I stated a wrong claim you disagreed and gave the right value. That is what “correct your mistakes” looks like in practice.');
        else if (fu.disagreed) rule('correct-partial', 3, 'You spotted that something was off, but the corrected value wasn’t right. Re-derive it from the start rather than adjusting the number.');
        else rule('correct-accepted', 1, 'I planted a wrong claim and you went along with it. Re-check before agreeing; interviewers test this on purpose.');
      } else if (fu.handled === 1) rule('fu-handled', 3, 'You handled the follow-up (' + lab + ') well. Switching angle under push-back shows your understanding isn’t brittle.');
      else if (fu.handled === 0.5) rule('fu-partial', 4, 'You were part of the way there on the follow-up (' + lab + '). Compare with the model answer below.');
      else if (fu.handled === 0) rule('fu-missed', 2, 'The follow-up (' + lab + ') tripped you up. Read the model answer and try the same push-back again tomorrow.');
    }
    if (isProb) {
      if (!sanity) rule('no-sanity', 6, 'Finish with a sanity check (' + (L.sanityHint ? shortTxt(L.sanityHint, 80) : 'for example the smallest case') + ').');
      else rule('sanity-done', 9, 'Good that you planned a sanity check.');
    }
    if (kind === 'code') {
      if (L.complexity === 1) rule('complexity-ok', 3, 'You knew the complexity and why the naive version is slow. That is what the coding round is really testing.');
      else rule('complexity-missed', 2, 'In a coding round, state the complexity before you are asked, and why the naive version is slow (repeated sub-problems → memoise).');
    }
    if (L.why) rule('why-asked', 8, 'You asked yourself why the answer is what it is. Keep that habit.');

    /* market making */
    if (kind === 'mm' && mm) {
      if (mm.inside === false) rule('mm-outside', 1, 'Your first market didn’t contain the fair value (' + fmtN(L.fair) + '). Compute the expected value first, then centre the quote on it.');
      if (mm.widthOk === false) rule('mm-width', 3, mm.width <= 0 ? 'A market needs a bid below the offer.' : 'Your market was wide for something this predictable (sd ≈ ' + fmtN(L.sd) + '). Tighten it; wide markets don’t trade.');
      if (mm.dir === false) rule('mm-dir-wrong', 1, 'After I ' + (L.lift ? 'bought from you' : 'sold to you') + ', your market should have moved ' + (L.lift ? 'up' : 'down') + '. A counterparty who has seen part of the outcome is telling you something.');
      else if (mm.dir && mm.over) rule('mm-over', 2, 'You moved in the right direction but too far. One trade is evidence, not proof.');
      else if (mm.dir) rule('mm-dir-ok', 4, 'You updated in the right direction and by a sensible amount after the trade.');
      if (mm.finalInside === false) rule('mm-final-miss', 2, 'Once I told you what I saw, your final market should have contained ' + fmtN(L.cond) + '.');
      else if (mm.finalInside) rule('mm-final-ok', 6, 'Your final market contained the true conditional value.');
    }
    if (kind === 'mental' && mt && mt.n) {
      var rate = mt.correct / mt.n;
      if (rate < 0.6) rule('mental-slow', 2, 'Accuracy was below 60%. Slow down slightly and estimate the size first; a wrong answer costs more than a skip.');
      else if (rate >= 0.85) rule('mental-good', 6, 'Fast and accurate.');
      if ((mt.answered || 0) < mt.n * 0.6) rule('mental-pace', 4, 'You answered ' + (mt.answered || 0) + ' of ' + mt.n + ' in time. Skip early on items that need long-hand work.');
    }

    fired.sort(function (a, b) { return a.pr - b.pr || (a.id < b.id ? -1 : 1); });
    var pick = fired.slice(0, 3);
    var lines = [opener].concat(pick.map(function (r) { return r.text; }));

    /* scores 0..5 */
    var s = {};
    s.communication = clamp((explained ? 2 + 3 * planQ : 1) + (ex.clarify ? 0.5 : 0) + (L.hintContext ? 0.5 : 0), 0, 5);
    if (isProb) s.correctness = ok ? Math.max(2.5, 5 - 0.5 * hints) : (sv.how === 'gaveup' ? 0.5 : 1.5);
    else if (kind === 'mm') s.correctness = mm ? 5 * ((mm.inside ? 1 : 0) + (mm.widthOk ? 1 : 0) + (mm.dir ? 1 : 0) + (mm.dir && !mm.over ? 1 : 0) + (mm.finalInside ? 1 : 0)) / 5 : 0;
    else s.correctness = mt && mt.n ? 5 * mt.correct / mt.n : 0;
    var fuS = fu ? (fu.handled === 1 ? 5 : fu.handled === 0.5 ? 3 : 1.5) : null;
    s.adaptability = kind === 'mm' && mm ? (fuS == null ? (mm.dir && !mm.over ? 5 : 1.5) : ((mm.dir && !mm.over ? 5 : 1.5) + fuS) / 2) : fuS;
    if (isProb) s.stuck = sv.how === 'gaveup' ? 1 : stuck.length ? (ok ? 5 : 3.5) : hints > 0 ? (ok ? 4 : 2.5) : !ok ? 1.5 : null;
    else s.stuck = null;
    if (isProb && par && sv.ms && sv.how !== 'gaveup' && sv.how !== 'revealed') { var ra = mins / par; s.speed = Math.max(1, (ra <= 0.75 ? 5 : ra <= 1 ? 4 : ra <= 1.5 ? 3 : ra <= 2.5 ? 2 : 1) - (ok ? 0 : 1)); }
    else if (kind === 'mental' && mt && mt.n) s.speed = clamp(5 * (mt.answered || 0) / mt.n, 0, 5);
    else s.speed = null;
    s.complexity = kind === 'code' ? (L.complexity === 1 ? 5 : L.complexity === 0.5 ? 3 : 1.5) : null;
    s.methodical = clamp(1 + (explained ? 2 : 0) + planQ + (sanity ? 1 : 0), 0, 5);
    s.clear = s.communication;
    s.correct = fu && fu.type === 'correct' ? (fu.disagreed && fu.handled === 1 ? 5 : fu.disagreed ? 3 : 1) : null;
    s.why = L.why ? 5 : (fu && fu.type === 'explain' && fu.handled >= 0.5 ? 4 : 2);
    Object.keys(s).forEach(function (k) { s[k] = half(s[k]); });
    return { lines: lines, scores: s, rules: fired.map(function (r) { return r.id; }), ok: ok };
  }
  M.feedback = feedback;

  var DIMS = [
    { id: 'communication', t: 'Communication', d: 'Explained the plan before computing; structured, clear reasoning.' },
    { id: 'correctness', t: 'Correctness', d: 'Right answers and sound markets (each hint costs a little).' },
    { id: 'adaptability', t: 'Adaptability', d: 'Handled the push-back from a new angle.' },
    { id: 'stuck', t: 'Handling being stuck', d: 'Used hints and the stuck protocol; never “I don’t know”.' },
    { id: 'speed', t: 'Speed', d: 'Time against a strong candidate’s par.' },
    { id: 'complexity', t: 'Complexity awareness', d: 'Knew why a solution is slow and how to fix it (coding).' }];
  var TIPS = [
    { id: 'methodical', t: 'Approach methodically', d: 'Plan, then compute, then check.' },
    { id: 'clear', t: 'Communicate clearly', d: 'Say the structure and method out loud.' },
    { id: 'correct', t: 'Correct your mistakes', d: 'Spot a wrong claim and fix it.' },
    { id: 'why', t: 'Ask why', d: 'Understand why the answer is what it is.' }];
  M.DIMS = DIMS; M.TIPS = TIPS;

  /* ------------------------------------------------------------------ */
  /* Reports                                                             */
  /* ------------------------------------------------------------------ */
  function aggregate(rounds) {
    var out = {};
    DIMS.concat(TIPS).forEach(function (d) {
      var v = rounds.map(function (r) { return r.fb && r.fb.scores ? r.fb.scores[d.id] : null; }).filter(function (x) { return x != null && isFinite(x); });
      out[d.id] = v.length ? Math.round(v.reduce(function (a, b) { return a + b; }, 0) / v.length * 10) / 10 : null;
    });
    return out;
  }
  function overallOf(sc) { var v = DIMS.map(function (d) { return sc[d.id]; }).filter(function (x) { return x != null; }); return v.length ? Math.round(v.reduce(function (a, b) { return a + b; }, 0) / v.length * 10) / 10 : 0; }
  function lessonFor(cat) {
    var L = window.SBT_LEARN;
    if (!L || typeof L.forCat !== 'function') return null;
    try {
      var x = L.forCat(cat);
      if (Array.isArray(x)) x = x[0];
      if (x && x.id && x.title) return x;
    } catch (e) { }
    return null;
  }
  function arcadeLabel(id, fallback) { var P = window.SBT_PREP; try { if (P && P.arcadeName) return P.arcadeName(id); } catch (e) { } return fallback; }
  function nextActions(rep) {
    var acts = [], seen = {};
    function add(t, href) { if (seen[t]) return; seen[t] = 1; acts.push({ t: t, href: href }); }
    var sc = rep.scores || {};
    (rep.rounds || []).forEach(function (r) {
      var c = r.fb && r.fb.scores ? r.fb.scores.correctness : null;
      if ((r.kind === 'problem' || r.kind === 'code') && r.cat && c != null && c < 3.5) {
        add('3 ' + catName(r.cat) + ' problems' + (r.method ? ' using ' + lc1(shortTxt(r.method, 48)) : ''), core.practiceHash({ cats: [r.cat], status: 'unsolved' }));
        var ls = lessonFor(r.cat); if (ls) add('Learn: ' + ls.title, '#learn/' + ls.id);
      }
      if (r.kind === 'mm' && c != null && c < 4) { add('Arcade: ' + arcadeLabel('dice/make', 'Dice market making'), '#arcade/dice/make'); var lm = lessonFor('mm'); if (lm) add('Learn: ' + lm.title, '#learn/' + lm.id); }
      if (r.kind === 'mental' && c != null && c < 4) add('Arcade: ' + arcadeLabel('eighty', '80 in 8'), '#arcade/eighty');
    });
    if (sc.communication != null && sc.communication < 3.5) add('Explain first: on your next 5 problems, say the key idea and one sanity check out loud before computing', '#practice');
    if (sc.complexity != null && sc.complexity < 3.5) add(core.VIEWS.codelab ? 'Coding lab: state the complexity before you code' : 'Python problems: say the complexity before answering', core.VIEWS.codelab ? '#codelab' : core.practiceHash({ cats: ['python'] }));
    if (sc.correct != null && sc.correct < 3.5) add('Review: re-derive yesterday’s answers from scratch and check them against a small case', '#review');
    if (sc.stuck != null && sc.stuck < 3) add('Stuck drill: when stuck, try small cases first, then ask for a hint (never “I don’t know”)', '#review');
    if (!acts.length) add('Raise the bar: re-roll a harder ' + (rep.formatName || 'mock') + ' mock', '#mock/' + rep.format);
    return acts.slice(0, 5);
  }
  M.nextActions = nextActions;
  function weakTopics() {
    var reps = C().reports.slice().sort(function (a, b) { return (a.t || 0) - (b.t || 0); }).slice(-5);
    var acc = {}, n = {};
    reps.forEach(function (r, i) {
      var w = 1 + 0.25 * i;
      (r.rounds || []).forEach(function (x) {
        var cat = x.cat || (x.kind === 'mm' ? 'mm' : null);
        if (!cat) return;
        var c = x.fb && x.fb.scores ? x.fb.scores.correctness : null;
        var miss = c == null ? 0.5 : 1 - c / 5;
        acc[cat] = (acc[cat] || 0) + w * miss; n[cat] = (n[cat] || 0) + w;
      });
    });
    var out = {};
    Object.keys(acc).sort().forEach(function (c) { out[c] = Math.round(clamp(acc[c] / n[c], 0, 1) * 1000) / 1000; });
    return out;
  }
  M.weakTopics = weakTopics;
  M.reports = function () { return C().reports.slice(); };
  M.active = function () { return C().active; };

  function fmtScore(x) { return x == null ? '–' : (Math.round(x * 10) / 10).toFixed(1).replace(/\.0$/, ''); }
  function roundTitle(r) {
    if (r.kind === 'mm') { var s = SCEN_BY[r.scen]; return 'Market: ' + (s ? s.name : 'market making'); }
    if (r.kind === 'mental') return 'Mental maths: 12 items in 2 minutes';
    var p = byId(r.id); return p ? p.title : r.id;
  }
  function roundKindLabel(r) {
    if (r.kind === 'mm') return 'Market making';
    if (r.kind === 'mental') return 'Mental maths';
    if (r.kind === 'code') return 'Coding';
    var p = byId(r.id); return p ? catName(p.cat) : 'Problem';
  }
  function reportMarkdown(rep) {
    var tags = ['stat-brainteaser', 'mock-interview', 'format-' + String(rep.format).replace(/[^a-z0-9]+/gi, '-')];
    (rep.rounds || []).forEach(function (r) { var c = r.cat || (r.kind === 'mm' ? 'mm' : r.kind === 'mental' ? 'mental-math' : ''); if (c && tags.indexOf(c) < 0) tags.push(c); });
    var sc = rep.scores || {}, md = '---\n';
    md += 'date: ' + rep.d + '\nkind: mock-interview\nformat: "' + rep.format + '"\nformat_name: "' + String(rep.formatName || '').replace(/"/g, "'") + '"\noverall: ' + rep.overall + '\nscores:\n';
    DIMS.concat(TIPS).forEach(function (d) { md += '  ' + d.id + ': ' + (sc[d.id] == null ? 'null' : sc[d.id]) + '\n'; });
    md += 'tags: [' + tags.join(', ') + ']\n---\n\n';
    md += '# Mock interview: ' + (rep.formatName || rep.format) + ' (' + rep.d + ')\n\n';
    md += 'Overall **' + fmtScore(rep.overall) + '/5** · ' + (rep.rounds || []).length + ' rounds · ' + Math.max(1, Math.round((rep.secs || 0) / 60)) + ' min\n\n## Scorecard\n\n| Dimension | Score |\n|---|---|\n';
    DIMS.forEach(function (d) { md += '| ' + d.t + ' | ' + fmtScore(sc[d.id]) + ' |\n'; });
    md += '\n**Interview tips**\n\n| Tip | Score |\n|---|---|\n';
    TIPS.forEach(function (d) { md += '| ' + d.t + ' | ' + fmtScore(sc[d.id]) + ' |\n'; });
    md += '\n## Rounds\n';
    (rep.rounds || []).forEach(function (r, i) {
      var L = r.log || {};
      md += '\n### ' + (i + 1) + '. ' + r.title + ' (' + r.label + ')' + (r.fb && r.fb.ok ? ' ✓' : ' ✗') + '\n\n';
      if (L.explain) md += '- Explained first: ' + (L.explain.done ? 'yes' : 'no') + ' (' + Math.round((L.explain.ms || 0) / 1000) + ' s)' + (L.explain.ticks && L.explain.ticks.length ? ': ' + L.explain.ticks.join('; ') : '') + '\n';
      if (L.explain && L.explain.text) md += '- My plan: ' + L.explain.text.replace(/\n+/g, ' ') + '\n';
      if (r.kind === 'problem' || r.kind === 'code') md += '- Hints: ' + (L.hints || 0) + ' · Stuck protocol: ' + ((L.stuck || []).map(function (k) { return STUCK_NAME[k] || k; }).join(', ') || 'not used') + (L.solve ? ' · ' + Math.round((L.solve.ms || 0) / 60000) + ' min (par ' + (L.par || '?') + ')' : '') + '\n';
      if (L.followup) md += '- Follow-up (' + (FU_LABEL[L.followup.type] || L.followup.type) + '): ' + (L.followup.handled === 1 ? 'handled' : L.followup.handled === 0.5 ? 'partly' : 'missed') + '\n';
      if (L.whyText) md += '- Why: ' + L.whyText.replace(/\n+/g, ' ') + '\n';
      ((r.fb && r.fb.lines) || []).forEach(function (l) { md += '\n> ' + l; });
      md += '\n';
    });
    md += '\n## Next actions\n\n' + (rep.actions || []).map(function (a) { return '- [ ] ' + a.t; }).join('\n') + '\n';
    return md;
  }
  M.reportMarkdown = reportMarkdown;
  function download(text, name) {
    var blob = new Blob([text], { type: 'text/markdown' });
    var K = window.SBT_COACH;
    if (K && K.download) { K.download(blob, name); return; }
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function finishMock() {
    var c = C(), A = c.active;
    if (!A) return null;
    var rounds = A.plan.rounds.map(function (r, i) {
      var L = A.logs[i] || {}, p = r.id ? byId(r.id) : null;
      return { kind: r.kind, id: r.id || null, scen: r.scen || null, cat: p ? p.cat : (r.kind === 'mm' ? 'mm' : null), title: roundTitle(r), label: roundKindLabel(r),
        method: p && p.plan ? strip(p.plan.method) : '', log: L, fb: L.fb || feedback(roundLog(r, L)) };
    });
    var t = Date.now();
    var rep = { id: 'mk' + t.toString(36), t: t, d: today(), format: A.format, formatName: A.formatName, seed: A.seed, secs: Math.round((t - A.started) / 1000), rounds: rounds };
    rep.scores = aggregate(rounds);
    rep.overall = overallOf(rep.scores);
    rep.actions = nextActions(rep);
    c.reports.push(rep);
    if (c.reports.length > 100) c.reports = c.reports.slice(-100);
    c.active = null;
    core.markDay(3);
    var K = window.SBT_COACH;
    if (K && K.addEntry) {
      try {
        var text = ['**Overall:** ' + fmtScore(rep.overall) + '/5', '**Scorecard:** ' + DIMS.map(function (d) { return d.t + ' ' + fmtScore(rep.scores[d.id]); }).join(' · '),
          '**Tips:** ' + TIPS.map(function (d) { return d.t + ' ' + fmtScore(rep.scores[d.id]); }).join(' · ')]
          .concat(rounds.map(function (r, i) { return '- ' + (i + 1) + '. ' + r.title + ' (' + r.label + '): ' + ((r.fb && r.fb.lines) || []).join(' '); }))
          .concat(['**Next:** ' + rep.actions.map(function (a) { return a.t; }).join('; ')]).join('\n\n');
        var e = K.addEntry({ kind: 'mockiv', text: text, problemTitle: 'Mock interview: ' + (rep.formatName || rep.format) + ' (' + rep.d + ')', mistakes: [], tip: rep.actions[0] ? rep.actions[0].t : '', src: 'mock' });
        rep.journalId = e && e.id;
      } catch (err) { console.warn(err); }
    }
    save();
    return rep;
  }
  M.finishMock = finishMock;

  /* the log handed to feedback(): the stored log plus the problem facts the rules need */
  function roundLog(r, L) {
    var o = {}; Object.keys(L || {}).forEach(function (k) { if (k !== 'fb') o[k] = L[k]; });
    o.kind = r.kind;
    var p = r.id ? byId(r.id) : null;
    if (p) {
      o.par = parOf(p); o.cat = p.cat;
      o.keyIdea = p.plan && p.plan.keyIdea ? strip(p.plan.keyIdea) : (p.key ? strip(p.key) : '');
      o.sanityHint = p.plan && p.plan.sanityChecks && p.plan.sanityChecks[0] ? strip(p.plan.sanityChecks[0]) : '';
    }
    if (r.kind === 'mm') { var sc = scenario(r.scen, r.seed); o.fair = sc.fair; o.sd = sc.sd; o.lift = sc.lift; o.cond = sc.peek.cond; }
    return o;
  }
  M.roundLog = roundLog;

  /* ------------------------------------------------------------------ */
  /* Speech                                                              */
  /* ------------------------------------------------------------------ */
  function canSpeak() { try { return !!(window.speechSynthesis && typeof window.SpeechSynthesisUtterance === 'function'); } catch (e) { return false; } }
  function say(html) {
    if (!canSpeak() || !C().prefs.speak) return;
    try { window.speechSynthesis.cancel(); window.speechSynthesis.speak(new window.SpeechSynthesisUtterance(strip(html))); } catch (e) { }
  }
  function hush() { if (canSpeak()) try { window.speechSynthesis.cancel(); } catch (e) { } }
  M.canSpeak = canSpeak; M.say = say;

  /* ------------------------------------------------------------------ */
  /* Open answer type (systems & design questions)                       */
  /* ------------------------------------------------------------------ */
  var OPEN_GRADE = ['missed', 'partial', 'solid', 'interview-ready'];
  function openRec(id) { return C().open[id] || null; }
  core.ANSWER_TYPES.open = {
    html: function (p) {
      var a = p.answer || {}, prev = openRec(p.id);
      return '<div class="op-wrap"><p class="small muted">Answer out loud or on paper first. Then tick the key points you covered and grade yourself.' +
        (prev ? ' <span class="badge">Last time ' + prev.score + '/3</span>' : '') + '</p>' +
        '<ul class="op-points">' + (a.points || []).map(function (t, i) {
          return '<li><label class="op-pt"><input type="checkbox" data-op="' + i + '"><span>' + esc(strip(t)) + '</span></label></li>';
        }).join('') + '</ul>' +
        '<div class="op-grade"><span class="label" id="opg-' + esc(p.id) + '">Self-grade</span><div class="seg op-seg" role="group" aria-labelledby="opg-' + esc(p.id) + '">' +
        [0, 1, 2, 3].map(function (v) { return '<button type="button" data-og="' + v + '" aria-pressed="false"><b>' + v + '</b> ' + OPEN_GRADE[v] + '</button>'; }).join('') + '</div>' +
        '<button type="button" class="btn primary" data-act="op-save" disabled>Save grade</button></div><div class="op-after hidden"></div></div>';
    },
    bind: function (host, p, api) {
      var a = p.answer || {}, score = null, done = false;
      var saveBtn = host.querySelector('[data-act="op-save"]');
      $all('[data-og]', host).forEach(function (b) {
        b.addEventListener('click', function () {
          if (done) return;
          score = +b.getAttribute('data-og');
          $all('[data-og]', host).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
          saveBtn.disabled = false;
        });
      });
      saveBtn.addEventListener('click', function () {
        if (done || score == null) return;
        done = true;
        var pts = $all('[data-op]', host).filter(function (x) { return x.checked; }).map(function (x) { return +x.getAttribute('data-op'); });
        C().open[p.id] = { score: score, points: pts, t: Date.now() };
        $all('input, button', host).forEach(function (x) { x.disabled = true; });
        var ok = score >= 2;
        api.grade(ok, 'self');
        api.feedback(ok ? 'ok' : 'bad', '<b>' + score + '/3 · ' + OPEN_GRADE[score] + '.</b> ' + pts.length + ' of ' + (a.points || []).length + ' key points covered.' + (ok ? '' : ' It comes back in Review.'));
        var after = host.querySelector('.op-after');
        after.innerHTML = (a.outline ? '<div class="op-outline"><span class="label">Model outline</span>' + a.outline + '</div>' : '') +
          (a.pitfalls && a.pitfalls.length ? '<div class="op-pitfalls"><span class="label">Pitfalls</span><ul>' + a.pitfalls.map(function (x) { return '<li>' + esc(strip(x)) + '</li>'; }).join('') + '</ul></div>' : '') +
          ((a.points || []).length > pts.length ? '<div class="op-missed"><span class="label">Points you didn’t tick</span><ul>' + (a.points || []).map(function (t, i) { return pts.indexOf(i) < 0 ? '<li>' + esc(strip(t)) + '</li>' : ''; }).join('') + '</ul></div>' : '');
        after.classList.remove('hidden');
        save();
      });
    },
    check: function () { return { invalid: true }; },
    testSolve: function (host) {
      $all('[data-op]', host).forEach(function (x) { x.checked = true; });
      var b = host.querySelector('[data-og="3"]'); if (b) b.click();
      var s = host.querySelector('[data-act="op-save"]'); if (s) s.click();
    }
  };

  /* ------------------------------------------------------------------ */
  /* Merge-import, hooks, cards                                          */
  /* ------------------------------------------------------------------ */
  function mergeMock(cur, inc) {
    var ic = inc && inc.mock; if (!core.isPlainObj(ic)) return;
    if (!core.isPlainObj(cur.mock)) { cur.mock = ic; return; }
    var cc = cur.mock;
    if (!Array.isArray(cc.reports)) cc.reports = [];
    var by = {}; cc.reports.forEach(function (r, i) { if (r && r.id) by[r.id] = i; });
    (Array.isArray(ic.reports) ? ic.reports : []).forEach(function (r) {
      if (!r || !r.id) return;
      if (by[r.id] == null) { cc.reports.push(r); by[r.id] = cc.reports.length - 1; }
      else if ((r.t || 0) > (cc.reports[by[r.id]].t || 0)) cc.reports[by[r.id]] = r;
    });
    cc.reports.sort(function (a, b) { return (a.t || 0) - (b.t || 0); });
    if (!core.isPlainObj(cc.open)) cc.open = {};
    Object.keys(core.isPlainObj(ic.open) ? ic.open : {}).forEach(function (id) {
      var a = cc.open[id], b = ic.open[id];
      if (core.isPlainObj(b) && (!a || (b.t || 0) > (a.t || 0))) cc.open[id] = b;
    });
    if (!core.isPlainObj(cc.active) && core.isPlainObj(ic.active)) cc.active = ic.active;
    if (!core.isPlainObj(cc.prefs) && core.isPlainObj(ic.prefs)) cc.prefs = ic.prefs;
  }
  M.merge = mergeMock;
  core.HOOKS.mergeState.push(mergeMock);

  core.TITLES.mock = 'Mock interview';
  core.TAB_OF.mock = 'train';
  function lastStat() {
    var r = C().reports;
    return r.length ? plural(r.length, 'mock') + ' · last ' + fmtScore(r[r.length - 1].overall) + '/5' : 'Not started';
  }
  core.HOOKS.trainCards.push(function () {
    return core.trainCard('#mock', 'mic', 'Mock interview', 'Explain first, solve, handle the push-back, get a debrief. Classic, trading, research, phone and firm styles.', lastStat());
  });
  core.HOOKS.homeCards.push(function () {
    var A = C().active;
    if (!A || !A.plan) return '';
    return '<div class="card mk-home"><div class="row"><span class="ticon" style="--cat: var(--accent)">' + ICONS.mic + '</span><div style="flex:1;min-width:0"><b>Mock interview in progress</b><div class="muted small">' + esc(A.formatName) + ' · round ' + (A.idx + 1) + ' of ' + A.plan.rounds.length + '</div></div>' +
      '<a class="btn primary sm" href="#mock/run">Resume</a></div></div>';
  });
  core.HOOKS.moreItems.push(function () {
    return '<a class="mode-card" href="#mock"><span class="ic">' + ICONS.mic + '</span><span><b>Mock interview</b><small>Explain → solve → follow-up → debrief</small></span></a>';
  });
  core.HOOKS.firmCards.push(function (fid) {
    if (!firms()[fid]) return '';
    var href = fid === 'jane-street' ? '#mock/js' : '#mock/firm:' + fid;
    return '<div class="card mk-firm"><h2>Mock interview</h2><p class="muted small">Three rounds chosen from this firm’s usual topics and formats, with follow-ups and a debrief.</p><a class="btn primary sm" href="' + href + '">' + ICONS.mic + ' Mock interview in this firm’s style</a></div>';
  });
  core.HOOKS.boot.push(function () {
    var K = window.SBT_COACH;
    if (K && K.KIND_NAME) K.KIND_NAME.mockiv = 'Mock interview';
  });

  /* ------------------------------------------------------------------ */
  /* Views                                                               */
  /* ------------------------------------------------------------------ */
  var rerolls = {};
  var PHASES = [['explain', 'Explain'], ['solve', 'Solve'], ['followup', 'Follow-up'], ['feedback', 'Feedback']];
  function stepper(phase) {
    var idx = PHASES.map(function (x) { return x[0]; }).indexOf(phase);
    return '<ol class="mk-steps" aria-label="Round phases">' + PHASES.map(function (x, i) {
      return '<li class="' + (i < idx ? 'done' : i === idx ? 'cur' : '') + '"' + (i === idx ? ' aria-current="step"' : '') + '><span class="mk-n">' + (i < idx ? ICONS.check : i + 1) + '</span><span>' + x[1] + '</span></li>';
    }).join('') + '</ol>';
  }
  function ivCard(html, label, extra) {
    return '<div class="card mk-iv' + (extra ? ' ' + extra : '') + '"><span class="label mk-iv-l">' + esc(label || 'Interviewer') + '</span>' + html + '</div>';
  }

  core.VIEWS.mock = function (main, args) {
    core.setCtl(null);
    core.onCleanup(hush);
    var a0 = args[0] || '';
    if (a0 === 'report') return reportView(main, args[1]);
    if (a0 === 'run') { if (C().active && C().active.plan) return runView(main); core.go('#mock', true); return; }
    return setupView(main, a0);
  };

  function setupView(main, fmtId) {
    var c = C();
    if (!getFormat(fmtId)) fmtId = (c.prefs.last && getFormat(c.prefs.last)) ? c.prefs.last : 'classic';
    var F = getFormat(fmtId), rr = rerolls[fmtId] || 0;
    var plan = planFor(fmtId, rr);
    var A = c.active, fl = firms();
    var past = c.reports.slice(-6).reverse();
    var html = '<div class="narrow mk">' + core.pageHead('Mock interview', 'A full interview, one round at a time: <b>explain your plan</b> before computing, solve, take the interviewer’s push-back, then read a short debrief. Everything is scored on the same rubric each time.', '#train', 'Train');
    if (A && A.plan) html += '<div class="banner mk-resume"><p><b>Mock in progress:</b> ' + esc(A.formatName) + ', round ' + (A.idx + 1) + ' of ' + A.plan.rounds.length + '.</p><a class="btn primary sm" href="#mock/run">Resume</a><button type="button" class="btn ghost sm" id="mkDiscard">Discard</button></div>';
    html += '<div class="card stack"><div class="frow"><span class="label">Format</span><div class="mk-formats" role="group" aria-label="Format">' + M.FORMATS.map(function (f) {
      return '<button type="button" class="mk-fmt" data-fmt="' + f.id + '" aria-pressed="' + (f.id === fmtId) + '"><b>' + esc(f.name) + '</b><small>' + f.mins + ' min</small></button>';
    }).join('') + '</div></div>' +
      '<div class="frow"><label class="label" for="mkFirm">Or a firm’s style</label><select id="mkFirm"><option value="">Choose a firm…</option>' + Object.keys(fl).map(function (id) {
        return '<option value="' + esc(id) + '"' + (fmtId === 'firm:' + id ? ' selected' : '') + '>' + esc(fl[id].name) + '</option>';
      }).join('') + '</select></div>' +
      '<p class="mk-desc">' + esc(F.desc) + '</p></div>';
    html += '<div class="card"><div class="row"><h2 style="margin:0">The plan</h2><span class="spacer"></span><span class="muted small">' + esc(F.name) + ' · ~' + F.mins + ' min</span></div><ol class="mk-plan">' + plan.rounds.map(function (r) {
      var p = r.id ? byId(r.id) : null;
      return '<li><span class="mk-plan-k">' + esc(roundKindLabel(r)) + '</span><span class="mk-plan-t">' + esc(roundTitle(r)) + '</span>' + (p ? '<span class="muted small">' + core.DIFF_NAME[p.diff] + ' · par ' + parOf(p) + ' min' + (p.followups && p.followups.length ? ' · scripted follow-up' : '') + '</span>' : '') + '</li>';
    }).join('') + '</ol>' +
      (canSpeak() ? '<label class="switch mk-speak"><input type="checkbox" id="mkSpeak"' + (c.prefs.speak ? ' checked' : '') + '><span class="track" aria-hidden="true"></span><span><b>Speak the interviewer aloud</b><br><span class="muted small">Uses your device’s built-in voice. Nothing leaves the device.</span></span></label>' : '') +
      '<div class="row mk-actions"><button type="button" class="btn primary" id="mkStart"' + (plan.rounds.length ? '' : ' disabled') + '>' + ICONS.mic + ' Start mock</button><button type="button" class="btn ghost" id="mkReroll">' + ICONS.shuffle + ' Re-roll problems</button></div></div>';
    html += '<div class="card"><h2>How each round works</h2><ol class="small mk-how"><li><b>Explain</b>: say (tick or type) the structure, the method and a sanity check. The answer box stays locked until you do.</li><li><b>Solve</b>: hints are allowed and logged at a small cost. Asking for a hint is fine; saying “I don’t know” is not.</li><li><b>Follow-up</b>: the interviewer pushes back with a faster way, a variant, a limit, the complexity, or a planted mistake to correct.</li><li><b>Feedback</b>: a short, specific debrief from what you actually did.</li></ol>' +
      '<p class="small muted">Scored on communication, correctness, adaptability, handling being stuck, speed and complexity, plus four published interview tips: approach methodically, communicate clearly, correct your mistakes, ask why.</p></div>';
    if (past.length) html += '<div class="card"><h2>Past mocks</h2><div class="table-scroll"><table class="simple"><thead><tr><th>Date</th><th>Format</th><th>Overall</th></tr></thead><tbody>' + past.map(function (r) {
      return '<tr><td><a href="#mock/report/' + esc(r.id) + '">' + esc(r.d) + '</a></td><td>' + esc(r.formatName || r.format) + '</td><td>' + fmtScore(r.overall) + '/5</td></tr>';
    }).join('') + '</tbody></table></div></div>';
    html += '</div>';
    main.innerHTML = html;
    $all('[data-fmt]', main).forEach(function (b) { b.addEventListener('click', function () { core.go('#mock/' + b.getAttribute('data-fmt'), true); }); });
    $('#mkFirm').addEventListener('change', function () { var v = this.value; if (v) core.go('#mock/' + (v === 'jane-street' ? 'js' : 'firm:' + v), true); });
    $('#mkReroll').addEventListener('click', function () { rerolls[fmtId] = rr + 1; setupView(main, fmtId); });
    var sp = $('#mkSpeak'); if (sp) sp.addEventListener('change', function () { C().prefs.speak = sp.checked; save(); if (!sp.checked) hush(); });
    var dc = $('#mkDiscard'); if (dc) dc.addEventListener('click', function () { if (confirm('Discard the mock in progress? Attempts already graded still count in your stats.')) { C().active = null; save(); setupView(main, fmtId); } });
    $('#mkStart').addEventListener('click', function () {
      var cc = C();
      if (cc.active && !confirm('Replace the mock in progress with a new one?')) return;
      startMock(fmtId, rr);
      core.go('#mock/run');
    });
  }
  /* rounds (optional) replaces the planned rounds, e.g. [{kind:'problem', id:'…'}] (used by tests) */
  function startMock(fmtId, rr, rounds) {
    var c = C(), plan = planFor(fmtId, rr || 0), F = getFormat(fmtId);
    if (Array.isArray(rounds) && rounds.length) plan.rounds = rounds;
    c.prefs.last = fmtId;
    c.active = { id: 'a' + Date.now().toString(36), format: F.id, formatName: F.name, chat: !!F.chat, seed: plan.seed, reroll: plan.reroll, plan: plan, idx: 0, phase: 'explain', logs: plan.rounds.map(function () { return {}; }), started: Date.now() };
    save();
    return c.active;
  }
  M.start = startMock;

  /* ---------------- run ---------------- */
  function runView(main) {
    var timers = [];
    core.onCleanup(function () { timers.forEach(clearInterval); timers = []; });
    function A() { return C().active; }
    function every(fn, ms) { var t = setInterval(fn, ms); timers.push(t); return t; }
    function stopTimers() { timers.forEach(clearInterval); timers = []; }
    render();

    function render() {
      stopTimers();
      core.setCtl(null);
      var a = A();
      if (!a) { core.go('#mock', true); return; }
      if (a.idx >= a.plan.rounds.length) { var rep = finishMock(); core.go('#mock/report/' + rep.id, true); return; }
      var r = a.plan.rounds[a.idx], L = a.logs[a.idx] = a.logs[a.idx] || {};
      L.kind = r.kind;
      var p = r.id ? byId(r.id) : null;
      if ((r.kind === 'problem' || r.kind === 'code') && !p) { a.idx++; save(); return render(); }
      main.innerHTML = '<div class="narrow mk mk-run" data-phase="' + a.phase + '"><div class="mk-head"><span><b>Round ' + (a.idx + 1) + ' of ' + a.plan.rounds.length + '</b> · ' + esc(roundKindLabel(r)) + '</span><span class="row" style="gap:.4rem"><span class="countdown" id="mkClock" role="timer" aria-label="Elapsed time">0:00</span><button type="button" class="btn sm ghost" id="mkQuit">Leave</button></span></div>' +
        stepper(a.phase) + '<div id="mkPhase"></div></div>';
      $('#mkQuit').addEventListener('click', function () { core.go('#mock'); });
      var clk = $('#mkClock');
      function tick() { if (clk) clk.textContent = core.fmtTime((Date.now() - a.started) / 1000); }
      tick(); every(tick, 1000);
      var host = $('#mkPhase');
      if (a.phase === 'explain') explainPhase(host, a, r, L, p);
      else if (a.phase === 'solve') solvePhase(host, a, r, L, p);
      else if (a.phase === 'followup') followupPhase(host, a, r, L, p);
      else feedbackPhase(host, a, r, L, p);
      window.scrollTo(0, 0);
    }
    function setPhase(ph) { var a = A(); a.phase = ph; save(); render(); }

    function problemBlock(p) { return '<div class="mk-problem"><h2 class="mk-ptitle">' + esc(p.title) + '</h2><div class="prompt">' + p.prompt + '</div></div>'; }
    function roundPromptHtml(r, p) {
      if (r.kind === 'mm') { var sc = scenario(r.scen, r.seed); return '<div class="mk-problem"><h2 class="mk-ptitle">Make me a market</h2><div class="prompt"><p>Make me a market on <b>' + esc(sc.name) + '</b>. Give a bid, an offer and a size. Then I may trade with you, and you update.</p></div></div>'; }
      if (r.kind === 'mental') return '<div class="mk-problem"><h2 class="mk-ptitle">Mental maths</h2><div class="prompt"><p>Twelve quick arithmetic items in two minutes. No paper, no calculator.</p></div></div>';
      return problemBlock(p);
    }

    /* ---------- 1. explain ---------- */
    function explainPhase(host, a, r, L, p) {
      var opts = explainOptions(r, p, a.seed + '|' + a.idx);
      var D = L.draft = L.draft || { ticks: [], text: '', clarify: '', start: Date.now() };
      var chat = a.chat;
      var ask = chat ? 'Let’s think about this one together. Before any numbers: what do you notice about it, and where would you start? Thinking out loud is the point, and questions are welcome.'
        : 'Before you calculate anything, tell me how you’ll approach it: what structure do you see, what method will you use, and how will you check the answer?';
      host.innerHTML = roundPromptHtml(r, p) + ivCard('<p class="mk-say">' + esc(ask) + '</p>') +
        '<div class="card stack mk-explain"><div class="row"><span class="label">Your plan</span><span class="spacer"></span><span class="mono small muted" id="mkExT" role="timer" aria-label="Planning time">0:00</span></div>' +
        '<fieldset class="mk-ticks"><legend class="sr-only">Tick what you would say</legend>' + opts.map(function (o, i) {
          return '<label class="mk-tick"><input type="checkbox" data-tk="' + i + '"' + (D.ticks.indexOf(o.t) >= 0 ? ' checked' : '') + '><span><small class="muted">' + esc(o.g || '') + '</small>' + esc(o.t) + '</span></label>';
        }).join('') + '</fieldset>' +
        '<label class="label" for="mkPlanText">In your own words (optional)</label><textarea id="mkPlanText" rows="3" placeholder="e.g. The matrix must be positive semidefinite; find its eigenvalues; check n = 2.">' + esc(D.text) + '</textarea>' +
        '<label class="label" for="mkClarify">Anything to clarify first? (optional)</label><input type="text" id="mkClarify" value="' + esc(D.clarify) + '" placeholder="e.g. Are the dice fair? With or without replacement?">' +
        '<div class="mk-locked" aria-live="polite" id="mkLock">' + ICONS.note + '<span>The answer box unlocks once you’ve ticked a plan item or written a sentence.</span></div>' +
        '<div class="row"><button type="button" class="btn primary" id="mkUnlock" disabled>Start solving ' + ICONS.right + '</button><button type="button" class="btn ghost" id="mkSkip">Skip and compute (logged)</button></div></div>';
      say(ask);
      var t0 = D.start, et = $('#mkExT');
      function tick() { if (et) et.textContent = core.fmtTime((Date.now() - t0) / 1000); }
      tick(); every(tick, 1000);
      var btn = $('#mkUnlock'), ta = $('#mkPlanText'), cl = $('#mkClarify');
      function valid() { return D.ticks.length >= 1 || ta.value.trim().length >= 15; }
      function sync() { btn.disabled = !valid(); $('#mkLock').classList.toggle('ready', valid()); }
      $all('[data-tk]', host).forEach(function (cb) {
        cb.addEventListener('change', function () {
          var t = opts[+cb.getAttribute('data-tk')].t, k = D.ticks.indexOf(t);
          if (cb.checked && k < 0) D.ticks.push(t); else if (!cb.checked && k >= 0) D.ticks.splice(k, 1);
          save(); sync();
        });
      });
      ta.addEventListener('input', function () { D.text = ta.value; sync(); });
      ta.addEventListener('change', save);
      cl.addEventListener('input', function () { D.clarify = cl.value; });
      cl.addEventListener('change', save);
      sync();
      function go(skipped) {
        L.explain = summarizeExplain(opts, D.ticks, D.text, D.clarify, skipped, Date.now() - t0);
        delete L.draft;
        setPhase('solve');
      }
      btn.addEventListener('click', function () { if (valid()) go(false); });
      $('#mkSkip').addEventListener('click', function () { go(true); });
    }

    /* ---------- 2. solve ---------- */
    function solvePhase(host, a, r, L, p) {
      if (r.kind === 'mm') return mmSolve(host, a, r, L);
      if (r.kind === 'mental') return mentalSolve(host, a, r, L);
      if (L.solve) return setPhase('followup');
      L.solveStart = L.solveStart || Date.now();
      L.hints = L.hints || 0; L.stuck = L.stuck || []; L.hintLevel = L.hintLevel || 0;
      var ex = L.explain || {};
      var planLine = ex.ticks && ex.ticks.length ? ex.ticks.join(' · ') : ex.text || (ex.skipped ? 'No plan given (skipped).' : '');
      host.innerHTML = '<div id="mkSolveHost" class="mk-solve"></div>' +
        '<div class="card stack mk-help"><div class="row"><h2 style="margin:0">' + (a.chat ? 'Stuck? Talk to me' : 'Hints') + '</h2><span class="spacer"></span><span class="small muted" id="mkHintN"></span></div>' +
        '<p class="small mk-hint-note">' + (a.chat ? 'This is a conversation: asking is encouraged. Tell me what you’ve tried and I’ll nudge you. ' : '') + 'Asking for a hint is fine — interviewers want to see how you use it. Saying “I don’t know” is not. Each hint costs a little on correctness.</p>' +
        '<label class="label" for="mkTried">What have you tried? (optional, it makes the hint better)</label><input type="text" id="mkTried" placeholder="e.g. I set up a recursion but I’m not sure about the base case">' +
        '<div class="row"><button type="button" class="btn" id="mkHint">' + ICONS.bulb + ' <span id="mkHintL">Ask for a hint</span></button></div><div id="mkKey"></div>' +
        '<details class="reveal mk-stuck"' + (L.stuck.length ? ' open' : '') + '><summary>' + ICONS.help + '<span>Stuck protocol</span><small class="muted">try one, out loud</small><span class="chev" aria-hidden="true">▾</span></summary><div class="rbody"><div class="chips" id="mkStuckChips">' +
        STUCK.map(function (s) { return '<button type="button" class="chip" data-stuck="' + s.k + '" aria-pressed="' + (L.stuck.indexOf(s.k) >= 0) + '">' + esc(s.t) + '</button>'; }).join('') + '</div><p class="small muted" id="mkNudge"></p></div></details></div>';
      var hdr = planLine ? '<div class="mk-plan-recap small"><span class="label">Your plan</span> ' + esc(shortTxt(planLine, 220)) + '</div>' : '';
      var ctl = core.mountProblem($('#mkSolveHost'), p, {
        mode: 'mock', timer: false, tools: false, allowSolution: false, header: hdr, nextLabel: 'Interviewer follow-up',
        onResult: function (ok, how) {
          if (L.solve) return;
          L.solve = { ok: !!ok, how: how, ms: Date.now() - L.solveStart };
          $('#mkHint').disabled = true;
          save();
        },
        onNext: function () { if (L.solve) setPhase('followup'); }
      });
      var card = ctl.card;
      var hintDets = card ? card.querySelectorAll('details.hint') : [];
      var key = p.plan && p.plan.keyIdea ? p.plan.keyIdea : p.key;
      var nh = Math.min(2, hintDets.length), total = nh + (key ? 1 : 0);
      for (var i = 0; i < Math.min(L.hintLevel, nh); i++) { hintDets[i].dataset.seen = '1'; hintDets[i].open = true; }
      function showKey() { $('#mkKey').innerHTML = ivCard('<p><b>Key idea.</b> ' + key + '</p>', 'Hint 3 · key idea', 'mk-keyidea'); }
      if (L.hintLevel > nh && key) showKey();
      function label() {
        $('#mkHintN').textContent = L.hints ? plural(L.hints, 'hint') + ' used' : '';
        var b = $('#mkHint');
        if (L.hintLevel >= total) { b.disabled = true; $('#mkHintL').textContent = total ? 'No more hints' : 'No hints for this one'; }
        else $('#mkHintL').textContent = 'Ask for a hint (' + (L.hintLevel + 1) + ' of ' + total + ')';
        if (L.solve) b.disabled = true;
      }
      // opening a problem hint directly also counts (once each)
      Array.prototype.forEach.call(hintDets, function (d, j) {
        d.addEventListener('toggle', function () {
          if (!d.open || L.solve || d.dataset.mk) return;
          d.dataset.mk = '1';
          if (j < nh && j >= L.hintLevel) { L.hintLevel = j + 1; }
          L.hints++; save(); label();
        });
        if (j < L.hintLevel) d.dataset.mk = '1';
      });
      function nextHint() {
        if (L.solve || L.hintLevel >= total) return;
        var tried = $('#mkTried').value.trim();
        if (tried.length >= 10) { L.hintContext = true; L.tried = tried.slice(0, 200); }
        if (L.hintLevel < nh) { var d = hintDets[L.hintLevel]; d.open = true; say(d.querySelector('.rbody') ? d.querySelector('.rbody').innerHTML : ''); }
        else { L.hintLevel++; L.hints++; showKey(); say(key); save(); }
        label();
      }
      $('#mkHint').addEventListener('click', nextHint);
      $all('[data-stuck]', host).forEach(function (b) {
        b.addEventListener('click', function () {
          var k = b.getAttribute('data-stuck');
          if (L.stuck.indexOf(k) < 0 && !L.solve) L.stuck.push(k);
          b.setAttribute('aria-pressed', 'true');
          var s = STUCK.filter(function (x) { return x.k === k; })[0];
          $('#mkNudge').textContent = s.nudge;
          save();
        });
      });
      label();
      core.setCtl({ submit: ctl.submit, choose: ctl.choose, hint: nextHint, next: ctl.next });
    }

    /* market-making round */
    function mmSolve(host, a, r, L) {
      var sc = scenario(r.scen, r.seed);
      L.mmq = L.mmq || [];
      var q = L.mmq, step = q.length;
      var chat = ['<li class="mk-msg iv"><span class="label">Interviewer</span><p>Make me a market on <b>' + esc(sc.name) + '</b>. Bid, offer and size.</p></li>'];
      function you(x, i) { return '<li class="mk-msg you"><span class="label">You</span><p>' + fmtN(x.b) + ' bid, ' + fmtN(x.a) + ' offer' + (i === 0 ? ', ' + x.s + ' up' : '') + '</p></li>'; }
      var tradeLine = sc.peekText + ' ' + (sc.lift ? 'I buy ' + (q[0] ? q[0].s : '') + ' at ' + (q[0] ? fmtN(q[0].a) : '') + ': take ’em.' : 'I sell you ' + (q[0] ? q[0].s : '') + ' at ' + (q[0] ? fmtN(q[0].b) : '') + ': sold.') + ' Where’s your market now?';
      var revealLine = 'Fair enough. Here’s what I saw: ' + sc.peek.label + '. Make me a final market.';
      if (step >= 1) { chat.push(you(q[0], 0)); chat.push('<li class="mk-msg iv"><span class="label">Interviewer</span><p>' + esc(tradeLine) + '</p></li>'); }
      if (step >= 2) { chat.push(you(q[1], 1)); chat.push('<li class="mk-msg iv"><span class="label">Interviewer</span><p>' + esc(revealLine) + '</p></li>'); }
      if (step >= 3) chat.push(you(q[2], 2));
      var form = step >= 3 ? '' : '<form class="mk-quote" id="mkQuote" autocomplete="off" novalidate><div class="mk-qgrid"><label><span class="label">Bid</span><input type="text" inputmode="decimal" id="mkBid"></label><label><span class="label">Offer</span><input type="text" inputmode="decimal" id="mkAsk"></label>' +
        (step === 0 ? '<label><span class="label">Size</span><input type="text" inputmode="numeric" id="mkSize" value="10"></label>' : '') + '</div><button class="btn primary" type="submit">Quote</button><p class="feedback" id="mkQfb" role="status"></p></form>';
      host.innerHTML = '<div class="card stack mk-mm"><div class="row"><span class="badge">' + esc(sc.name) + '</span><span class="badge">possible values ' + fmtN(sc.lo) + '–' + fmtN(sc.hi) + '</span></div><ul class="mk-chat">' + chat.join('') + '</ul>' + form + '</div>';
      if (step < 3) say(step === 0 ? 'Make me a market on ' + sc.name : step === 1 ? tradeLine : revealLine);
      if (step < 3) $('#mkQuote').addEventListener('submit', function (e) {
        e.preventDefault();
        var b = core.parseNumber($('#mkBid').value), ak = core.parseNumber($('#mkAsk').value), s = step === 0 ? core.parseNumber($('#mkSize').value) : null;
        var fb = $('#mkQfb');
        function err(m) { fb.className = 'feedback show info'; fb.textContent = m; }
        if (b === null || ak === null) return err('Type a number for both the bid and the offer.');
        if (!(b < ak)) return err('Your bid has to be below your offer.');
        if (step === 0 && !(s >= 1)) return err('Give a size of at least 1.');
        q.push(step === 0 ? { b: b, a: ak, s: Math.round(s) } : { b: b, a: ak });
        if (q.length >= 3) { L.mm = evalMM(sc, q); }
        save();
        mmSolve(host, a, r, L);
      });
      function mmDone() {
        var e = L.mm;
        host.insertAdjacentHTML('beforeend', ivCard('<p>Thanks, done trading. Given what I saw, fair value was <b>' + fmtN(sc.peek.cond) + '</b> (before that: ' + fmtN(sc.fair) + '). Expected P&amp;L of your first trade: <b>' + (e.pnl >= 0 ? '+' : '') + fmtN(e.pnl) + '</b>.</p><div class="row"><button type="button" class="btn primary" id="mkMMnext">Interviewer follow-up ' + ICONS.right + '</button></div>'));
        $('#mkMMnext').addEventListener('click', function () { setPhase('followup'); });
      }
      if (L.mm && q.length >= 3) mmDone();
      core.setCtl(null);
    }

    /* mental maths round */
    function mentalSolve(host, a, r, L) {
      var items = mentalItems(r.seed, 12);
      var S0 = L.mt = L.mt || { start: Date.now(), i: 0, ans: [] };
      function finish() {
        if (L.mental) return;
        var correct = S0.ans.filter(function (x) { return x && x.ok; }).length, answered = S0.ans.filter(function (x) { return x && !x.skip; }).length;
        L.mental = { n: items.length, correct: correct, answered: answered, secs: Math.min(MENTAL_SECS, (Date.now() - S0.start) / 1000) };
        save(); draw();
      }
      function left() { return MENTAL_SECS - (Date.now() - S0.start) / 1000; }
      function draw() {
        if (L.mental) {
          host.innerHTML = '<div class="card sprint-stage mk-mental"><div class="label">Mental maths</div><div class="big-score">' + L.mental.correct + '<span class="muted" style="font-size:1.6rem">/' + L.mental.n + '</span></div><p class="muted">' + L.mental.answered + ' answered in ' + Math.round(L.mental.secs) + ' s</p>' +
            '<ol class="mk-mlist small">' + items.map(function (it, i) { var x = S0.ans[i]; return '<li>' + esc(it.q) + ' = ' + it.ans + ' <span class="' + (x && x.ok ? 'mk-ok' : 'mk-bad') + '">' + (x && x.ok ? ICONS.check : x && !x.skip ? ICONS.x : '–') + '</span></li>'; }).join('') + '</ol>' +
            '<div class="row center"><button type="button" class="btn primary" id="mkMTnext">Interviewer follow-up ' + ICONS.right + '</button></div></div>';
          $('#mkMTnext').addEventListener('click', function () { setPhase('followup'); });
          return;
        }
        if (S0.i >= items.length || left() <= 0) return finish();
        var it = items[S0.i];
        host.innerHTML = '<div class="card sprint-stage mk-mental"><div class="row"><span class="label">Item ' + (S0.i + 1) + ' of ' + items.length + '</span><span class="spacer"></span><span class="countdown" id="mkMTclock" role="timer" aria-label="Time left"></span></div>' +
          '<div class="mk-mq mono" id="mkMq">' + esc(it.q) + '</div><form id="mkMTf" class="answer-row" autocomplete="off" novalidate><label class="sr-only" for="mkMTin">Answer</label><input id="mkMTin" type="text" inputmode="decimal" enterkeyhint="done"><button class="btn primary" type="submit">Enter</button><button class="btn ghost" type="button" id="mkMTskip">Skip</button></form></div>';
        var inp = $('#mkMTin'); if (core.hoverDevice()) inp.focus();
        $('#mkMTf').addEventListener('submit', function (e) {
          e.preventDefault();
          var x = core.parseNumber(inp.value);
          if (x === null) return;
          S0.ans[S0.i] = { v: x, ok: Math.abs(x - it.ans) < 1e-9 }; S0.i++; save(); draw();
        });
        $('#mkMTskip').addEventListener('click', function () { S0.ans[S0.i] = { skip: true }; S0.i++; save(); draw(); });
        ctick();
      }
      function ctick() { var el = $('#mkMTclock'); if (L.mental) return; var l = left(); if (el) { el.textContent = core.fmtTime(l); el.classList.toggle('low', l <= 20); } if (l <= 0) finish(); }
      draw();
      every(ctick, 250);
    }

    /* ---------- 3. follow-up ---------- */
    function followupPhase(host, a, r, L, p) {
      var fu = L.fu = L.fu || chooseFollowup(r, p, L, a.seed + '|' + a.idx);
      var res = L.followup;
      var ans = fu.answer;
      var intro = r.kind === 'mm' || r.kind === 'mental' ? '' : (L.solve ? '<p class="small muted">You answered ' + (L.solve.ok ? 'correctly' : L.solve.how === 'gaveup' ? 'nothing yet (you moved on)' : 'incorrectly') + '. Let’s still look at one more question on this problem.</p>' : '');
      var body = '';
      if (!res) {
        if (fu.type === 'correct') {
          body = '<div class="row mk-agree" id="mkAgreeRow"><button type="button" class="btn" id="mkAgree">You’re right</button><button type="button" class="btn" id="mkDisagree">I disagree</button></div><div id="mkCorr" class="hidden">' + answerInput(ans, 'Your corrected value') + '</div>';
        } else if (ans) body = answerInput(ans, 'Your answer');
        else body = '<label class="label" for="mkFuText">Your answer (for yourself)</label><textarea id="mkFuText" rows="3"></textarea><div class="row"><button type="button" class="btn" id="mkModel">Show the model answer</button></div><div id="mkSelf"></div>';
      }
      host.innerHTML = (p ? '<details class="reveal mk-recall"><summary>' + ICONS.book + '<span>The problem again</span><span class="chev" aria-hidden="true">▾</span></summary><div class="rbody">' + problemBlock(p) + '</div></details>' : '') +
        ivCard(intro + '<div class="mk-say">' + fu.prompt + '</div>' + (fu.type ? '<span class="badge">' + esc(FU_LABEL[fu.type] || fu.type) + '</span>' : ''), 'Interviewer · follow-up') +
        '<div class="card stack mk-fu" id="mkFuCard">' + (res ? resultHtml() : body) + '<p class="feedback" id="mkFuFb" role="status"></p></div>';
      say(fu.prompt);
      if (res) return bindAfter();
      function resultHtml() {
        var h = res.handled;
        return '<p class="mk-fu-res"><b>' + (h === 1 ? 'Handled.' : h === 0.5 ? 'Partly there.' : 'Missed.') + '</b></p>' + (fu.model ? '<div class="mk-model"><span class="label">Model answer</span>' + fu.model + '</div>' : '') +
          '<label class="label" for="mkWhy">Ask why: in one sentence, why is the answer what it is?</label><textarea id="mkWhy" rows="2" placeholder="e.g. Conditioning on the sum makes the variables negatively related.">' + esc(L.whyText || '') + '</textarea>' +
          '<div class="row"><button type="button" class="btn primary" id="mkToFb">See the debrief ' + ICONS.right + '</button></div>';
      }
      function done(rec) {
        L.followup = rec;
        if (fu.type === 'complexity') L.complexity = rec.handled;
        save();
        followupPhase(host, a, r, L, p);
      }
      function bindAfter() {
        $('#mkToFb').addEventListener('click', function () {
          var w = $('#mkWhy').value.trim();
          L.whyText = w.slice(0, 400); L.why = w.length >= 20;
          setPhase('feedback');
        });
      }
      function check(raw) { return core.checkAnswer({ answer: ans }, raw); }
      function bindAnswer(scope, onGraded) {
        var f = scope.querySelector('form.mk-fu-form');
        if (f) f.addEventListener('submit', function (e) {
          e.preventDefault();
          var r0 = check(f.querySelector('input').value);
          if (r0.invalid || r0.count) { var fb = $('#mkFuFb'); fb.className = 'feedback show info'; fb.textContent = r0.count ? 'Expected ' + r0.want + ' values separated by commas.' : 'I couldn’t read that. Try a number, a fraction or an expression.'; return; }
          onGraded(!!r0.ok);
        });
        $all('[data-fc]', scope).forEach(function (b) { b.addEventListener('click', function () { onGraded(!!check(String(+b.getAttribute('data-fc') + 1)).ok); }); });
      }
      if (fu.type === 'correct') {
        $('#mkAgree').addEventListener('click', function () { done({ type: fu.type, disagreed: false, handled: 0, synthetic: !!fu.synthetic }); });
        $('#mkDisagree').addEventListener('click', function () {
          $('#mkAgreeRow').classList.add('hidden'); $('#mkCorr').classList.remove('hidden');
          var i0 = $('#mkCorr input'); if (i0 && core.hoverDevice()) i0.focus();
        });
        bindAnswer($('#mkCorr'), function (ok) { done({ type: fu.type, disagreed: true, handled: ok ? 1 : 0.5, synthetic: !!fu.synthetic }); });
      } else if (ans) {
        bindAnswer($('#mkFuCard'), function (ok) { done({ type: fu.type, handled: ok ? 1 : 0, synthetic: !!fu.synthetic }); });
      } else {
        $('#mkModel').addEventListener('click', function () {
          this.disabled = true;
          $('#mkSelf').innerHTML = '<div class="mk-model"><span class="label">Model answer</span>' + (fu.model || '<p>No model answer for this one.</p>') + '</div><div class="row" role="group" aria-label="How did you do?"><button type="button" class="btn sm" data-self="1">I matched it</button><button type="button" class="btn sm" data-self="0.5">Partly</button><button type="button" class="btn sm" data-self="0">I missed it</button></div>';
          $all('[data-self]', host).forEach(function (b) { b.addEventListener('click', function () { done({ type: fu.type, handled: +b.getAttribute('data-self'), self: true, synthetic: !!fu.synthetic }); }); });
        });
      }
    }
    function answerInput(ans, lab) {
      if (ans.type === 'choice') return '<div class="choices" role="group" aria-label="' + esc(lab) + '">' + ans.options.map(function (o, i) { return '<button type="button" class="choice" data-fc="' + i + '"><span class="letter">' + 'ABCDEFGH'[i] + '</span><span>' + o + '</span></button>'; }).join('') + '</div>';
      return '<form class="mk-fu-form answer-row" autocomplete="off" novalidate><label class="sr-only" for="mkFuIn">' + esc(lab) + '</label><input id="mkFuIn" type="text" placeholder="' + esc(lab) + '" autocapitalize="off" spellcheck="false"><button class="btn primary" type="submit">Check</button></form>';
    }

    /* ---------- 4. feedback ---------- */
    function feedbackPhase(host, a, r, L, p) {
      if (!L.fb) { L.fb = feedback(roundLog(r, L)); save(); }
      var fb = L.fb, last = a.idx + 1 >= a.plan.rounds.length;
      host.innerHTML = ivCard(fb.lines.map(function (l) { return '<p>' + esc(l) + '</p>'; }).join(''), 'Interviewer · debrief', 'mk-debrief') +
        '<div class="card"><h2>This round</h2><div class="mk-mini">' + DIMS.concat(TIPS).filter(function (d) { return fb.scores[d.id] != null; }).map(function (d) {
          return '<span class="mk-mini-i"><span class="small muted">' + esc(d.t) + '</span><b>' + fmtScore(fb.scores[d.id]) + '</b></span>';
        }).join('') + '</div>' +
        (p ? '<details class="reveal sol"><summary>' + ICONS.book + '<span>Model solution</span><span class="chev" aria-hidden="true">▾</span></summary><div class="rbody">' + core.solutionBody(p) + '</div></details>' : '') +
        '<div class="row mk-actions"><button type="button" class="btn primary" id="mkNext">' + (last ? 'Finish and see the report' : 'Next round') + ' ' + ICONS.right + '</button></div></div>';
      say(fb.lines.join(' '));
      $('#mkNext').addEventListener('click', function () { var aa = A(); aa.idx++; aa.phase = 'explain'; save(); render(); });
      core.setCtl({ submit: function () { $('#mkNext').click(); } });
    }
  }

  /* ---------------- report ---------------- */
  function reportView(main, id) {
    var rep = C().reports.filter(function (r) { return r.id === id; })[0];
    if (!rep) { main.innerHTML = '<div class="narrow mk">' + core.pageHead('Report not found', 'This mock report is not on this device.', '#mock', 'Mock interview') + '</div>'; return; }
    var sc = rep.scores || {};
    function rows(list) {
      return list.map(function (d) {
        var v = sc[d.id];
        return '<li class="mk-sc"><span class="mk-sc-t"><b>' + esc(d.t) + '</b><small class="muted">' + esc(d.d) + '</small></span><span class="mk-bar" role="img" aria-label="' + esc(d.t) + ' ' + fmtScore(v) + ' of 5"><span style="width:' + (v == null ? 0 : v / 5 * 100) + '%"></span></span><b class="mk-sc-v">' + fmtScore(v) + '</b></li>';
      }).join('');
    }
    main.innerHTML = '<div class="narrow mk mk-report">' + core.pageHead('Mock report', esc(rep.formatName || rep.format) + ' · ' + esc(rep.d) + ' · ' + Math.max(1, Math.round((rep.secs || 0) / 60)) + ' min', '#mock', 'Mock interview') +
      '<div class="card sprint-stage"><div class="label">Overall</div><div class="big-score">' + fmtScore(rep.overall) + '<span class="muted" style="font-size:1.6rem">/5</span></div><p class="muted">' + (rep.rounds || []).filter(function (r) { return r.fb && r.fb.ok; }).length + ' of ' + (rep.rounds || []).length + ' rounds solid</p></div>' +
      '<div class="card"><h2>Scorecard</h2><ul class="mk-scores">' + rows(DIMS) + '</ul><h3 class="label mk-tips-h">Interview tips</h3><ul class="mk-scores">' + rows(TIPS) + '</ul></div>' +
      '<div class="card"><h2>Next actions</h2><ul class="mk-next">' + (rep.actions || []).map(function (x) { return '<li><a href="' + esc(x.href) + '">' + esc(x.t) + '</a></li>'; }).join('') + '</ul></div>' +
      '<div class="card"><h2>Rounds</h2>' + (rep.rounds || []).map(function (r, i) {
        var p = r.id ? byId(r.id) : null;
        return '<details class="reveal mk-rround"' + (i === 0 ? ' open' : '') + '><summary>' + (r.fb && r.fb.ok ? ICONS.check : ICONS.x) + '<span>' + (i + 1) + '. ' + esc(r.title) + '</span><small class="muted">' + esc(r.label) + '</small><span class="chev" aria-hidden="true">▾</span></summary><div class="rbody">' +
          ((r.fb && r.fb.lines) || []).map(function (l) { return '<p>' + esc(l) + '</p>'; }).join('') +
          (p ? '<details class="reveal sol"><summary>' + ICONS.book + '<span>Model solution</span><span class="chev" aria-hidden="true">▾</span></summary><div class="rbody">' + core.solutionBody(p) + '</div></details>' : '') + '</div></details>';
      }).join('') + '</div>' +
      '<div class="row mk-actions"><button type="button" class="btn" id="mkMd">' + ICONS.download + ' Export report (Markdown)</button>' + (rep.journalId && core.VIEWS.journal ? '<a class="btn ghost" href="#journal/e/' + esc(rep.journalId) + '">Journal entry</a>' : '') + '<a class="btn primary" href="#mock/' + esc(rep.format) + '">New mock</a></div></div>';
    $('#mkMd').addEventListener('click', function () { download(reportMarkdown(rep), 'mock-interview-' + rep.d + '-' + String(rep.format).replace(/[^a-z0-9]+/gi, '-') + '.md'); core.toast('Report exported (Markdown).'); });
  }

  /* test hooks */
  M._test = {
    inject: function (list) { list.forEach(function (p) { if (!core.BY_ID[p.id]) { core.PROBLEMS.push(p); core.BY_ID[p.id] = p; } }); },
    remove: function (ids) { ids.forEach(function (id) { var i = core.PROBLEMS.indexOf(core.BY_ID[id]); if (i >= 0) core.PROBLEMS.splice(i, 1); delete core.BY_ID[id]; }); },
    hstr: hstr, rng: rng, aggregate: aggregate, overallOf: overallOf, canSpeak: canSpeak
  };
});
