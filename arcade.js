/* Stat Brainteaser — Arcade (v2.0): timed drills and trading games.
 * Part 1 is a set of PURE engines (no DOM), exposed as SBT_ARCADE._engine for the tests.
 * Part 2 is the plugin UI (shared game shell, hub, game views). Plain ES5, no dependencies.
 * All randomness in a run comes from a seeded PRNG (mulberry32), so a challenge code replays the same game. */
(function (root) {
  'use strict';
  var DATA = root.SBT_ARCADE_DATA || { fermi: [], daily: [], tickers: [] };

  /* ================================================================== */
  /* PRNG + small maths helpers                                          */
  /* ================================================================== */
  function mulberry32(a) {
    a = a >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function makeRng(seed) {
    var f = mulberry32(seed);
    var r = {
      seed: seed >>> 0,
      next: f,
      int: function (a, b) { return a + Math.floor(f() * (b - a + 1)); },
      pick: function (arr) { return arr[Math.floor(f() * arr.length)]; },
      chance: function (p) { return f() < p; },
      sign: function () { return f() < 0.5 ? -1 : 1; },
      normal: function () { var u = 0; while (u === 0) u = f(); var v = f(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); },
      shuffle: function (a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(f() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
    };
    return r;
  }
  function hashStr(s) {
    var h = 2166136261 >>> 0;
    s = String(s);
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
  }
  function deriveSeed(seed, salt) { return hashStr((seed >>> 0) + ':' + salt); }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function round(x, dp) { var m = Math.pow(10, dp || 0); return Math.round(x * m + (x >= 0 ? 1e-9 : -1e-9)) / m; }
  function clean(x) { return parseFloat(Number(x).toPrecision(12)); }
  function sum(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return s; }
  function mean(a) { return a.length ? sum(a) / a.length : 0; }
  function log10(x) { return Math.log10 ? Math.log10(x) : Math.log(x) / Math.LN10; }
  function near(a, b, eps) { return Math.abs(a - b) <= (eps == null ? 1e-9 : eps); }
  function fmtNum(x, dp) {               // trims trailing zeros, keeps sign
    if (!isFinite(x)) return String(x);
    var s = clean(dp == null ? x : round(x, dp)).toString();
    if (/e/.test(s)) return s;
    return s;
  }
  function fmtFixed(x, dp) { return (x < 0 ? '−' : '') + Math.abs(x).toFixed(dp); }
  function fmtSigned(x, dp) { return (x > 0 ? '+' : x < 0 ? '−' : '±') + Math.abs(round(x, dp == null ? 2 : dp)).toString(); }
  function ymdParts(s) { var a = String(s).split('-'); return Date.UTC(+a[0], +a[1] - 1, +a[2]); }
  function daysBetween(a, b) { return Math.round((ymdParts(b) - ymdParts(a)) / 864e5); }

  /* ================================================================== */
  /* 1. Arithmetic Mania                                                 */
  /* ================================================================== */
  var OPS = ['+', '−', '×', '÷'];
  function mulPair(r) {
    if (r.next() < 0.5) return [r.int(1, 20), r.int(1, 10)];
    return [r.int(20, 50), r.int(1, 6)];
  }
  function genMania(r) {
    var op = r.pick(OPS), a, b, p;
    if (op === '+' || op === '−') {
      a = r.int(1, 99); b = r.int(1, 99);
      return { q: a + ' ' + op + ' ' + b, ans: op === '+' ? a + b : a - b, op: op, a: a, b: b };
    }
    p = mulPair(r); a = p[0]; b = p[1];
    if (op === '×') return { q: a + ' × ' + b, ans: a * b, op: op, a: a, b: b };
    return { q: (a * b) + ' ÷ ' + b, ans: a, op: op, a: a * b, b: b };
  }

  /* ================================================================== */
  /* 2. 80 in 8 (practice + Real OA multiple choice)                     */
  /* ================================================================== */
  function genEighty(r) {
    var op = r.pick(OPS), a, b;
    if (op === '+' || op === '−') {
      a = r.int(100, 9999); b = r.int(100, 9999);            // hundredths, i.e. [1.00, 99.99]
      var res = op === '+' ? a + b : a - b;
      return { q: (a / 100).toFixed(2) + ' ' + op + ' ' + (b / 100).toFixed(2), ans: res / 100, dp: 2, op: op, a: a / 100, b: b / 100 };
    }
    if (r.next() < 0.5) { a = r.int(1, 99); b = r.int(1, 99); } else { a = r.int(100, 999); b = r.int(1, 9); }
    if (op === '×') return { q: a + ' × ' + b, ans: a * b, dp: 0, op: op, a: a, b: b };
    return { q: (a * b) + ' ÷ ' + b, ans: a, dp: 0, op: op, a: a * b, b: b };
  }
  /* Distractors: one digit off, a power of ten off, and a nearby value. Returns 4 options (numbers) + index of the answer. */
  function digitVariant(r, ans, dp) {
    var neg = ans < 0, s = Math.abs(ans).toFixed(dp), idx = [];
    for (var i = 0; i < s.length; i++) if (/\d/.test(s[i])) idx.push(i);
    var at = r.pick(idx), dgt = +s[at], nd = dgt + r.sign();
    if (nd < 0 || nd > 9) nd = dgt - (nd - dgt);
    if (at === 0 && nd === 0 && idx.length > 1) nd = dgt + 1 > 9 ? dgt - 1 : dgt + 1;
    var v = parseFloat(s.slice(0, at) + nd + s.slice(at + 1));
    return neg ? -v : v;
  }
  function oaChoices(r, q) {
    var ans = q.ans, dp = q.dp || 0, unit = dp ? 0.01 : 1;
    function norm(x) { return round(x, dp); }
    var digit = [], pow = [], nearby = [];
    for (var t = 0; t < 4; t++) digit.push(norm(digitVariant(r, ans, dp)));
    pow.push(norm(ans * 10));
    if (!dp && ans % 10 === 0 && ans !== 0) pow.push(norm(ans / 10));
    if (dp) pow.push(norm(ans / 10));
    if (q.op === '×') { nearby.push(norm(ans + q.a), norm(ans - q.a), norm(ans + q.b)); }
    else if (q.op === '÷') { nearby.push(norm(ans + 1), norm(ans - 1), norm(ans + 2)); }
    else { nearby.push(norm(ans + unit), norm(ans - unit), norm(ans + 10 * unit), norm(ans - 10 * unit), norm(ans + 1)); }
    var used = {}; used[norm(ans)] = 1;
    var out = [];
    function take(list) {
      list = r.shuffle(list);
      for (var i = 0; i < list.length; i++) {
        var v = list[i];
        if (!isFinite(v) || used[v] || (ans >= 0 && v < 0)) continue;
        used[v] = 1; out.push(v); return true;
      }
      return false;
    }
    take(digit); take(pow); take(nearby);
    var all = digit.concat(pow, nearby);
    var guard = 0;
    while (out.length < 3 && guard++ < 20) { if (!take(all)) { all.push(norm(ans + (guard + 1) * unit * r.sign())); } }
    var at = r.int(0, 3);
    out.splice(at, 0, norm(ans));
    return { opts: out, idx: at };
  }

  /* ================================================================== */
  /* 3. Sequences (5-minute game + Optiver-style 26-in-30 test)          */
  /* ================================================================== */
  var SEQ_KINDS = ['arith1', 'arith2', 'affine', 'inter', 'geom', 'fib'];
  var SEQ_HARD = ['squares', 'cubes', 'primes', 'altops', 'diff2', 'triangular', 'trib', 'factorial', 'mixinter', 'affinestep', 'squaresalt', 'powers'];
  var PRIMES = (function () { var p = [], n = 2; while (p.length < 60) { var ok = true; for (var i = 0; i < p.length && p[i] * p[i] <= n; i++) if (n % p[i] === 0) { ok = false; break; } if (ok) p.push(n); n++; } return p; })();
  var SEQ_RULES = {
    arith1: 'Arithmetic: add a constant step.', arith2: 'Second order: the step itself changes by a constant each term.',
    affine: 'Affine map: x → m·x + c.', inter: 'Two arithmetic sequences interleaved.', geom: 'Geometric: multiply by a constant ratio.',
    fib: 'Fibonacci-like: combine the previous two terms.', squares: 'Shifted squares: n² + c.', cubes: 'Cubes: n³ (+ c).',
    primes: 'Built from consecutive primes.', altops: 'Alternating operations.', diff2: 'Differences of differences: the second differences form an arithmetic sequence.',
    triangular: 'Triangular numbers n(n+1)/2 (+ c).', trib: 'Each term is the sum of the previous three.', factorial: 'Multiply by 2, 3, 4, … in turn.',
    mixinter: 'An arithmetic and a geometric sequence interleaved.', affinestep: 'x → 2x + k, with k increasing by 1 each step.',
    squaresalt: 'Alternating signs on squares: ±n².', powers: 'Powers of a base, plus a constant.'
  };
  function genSeq(r, kind) {
    kind = kind || r.pick(SEQ_KINDS);
    var t = [], n, s, d, i, x;
    switch (kind) {
      case 'arith1':
        n = r.int(4, 5); s = r.int(1, 50); d = r.sign() * r.int(1, 10);
        for (i = 0; i <= n; i++) t.push(s + i * d);
        break;
      case 'arith2':
        n = r.int(4, 5); x = r.int(1, 50); d = r.sign() * r.int(1, 10);
        var dd = r.sign() * r.int(1, 5);
        for (i = 0; i <= n; i++) { t.push(x); x += d; d += dd; }
        break;
      case 'affine':
        n = r.int(4, 5); var m = r.int(1, 5), c = r.sign() * r.int(1, 10); x = r.int(1, 20);
        if (m >= 4) n = 4;
        for (i = 0; i <= n; i++) { t.push(x); x = m * x + c; }
        break;
      case 'inter':
        n = r.int(5, 6);
        var a0 = r.int(1, 50), da = r.sign() * r.int(1, 10), b0 = r.int(1, 50), db = r.sign() * r.int(1, 10);
        for (i = 0; i <= n; i++) t.push(i % 2 === 0 ? a0 + (i / 2) * da : b0 + ((i - 1) / 2) * db);
        break;
      case 'geom':
        n = r.int(4, 5); var q = r.pick([2, 5, 10, 0.1, 0.5]); x = r.int(1, 50);
        if (q === 10 || q === 0.1) n = 4;
        for (i = 0; i <= n; i++) { t.push(clean(x)); x = clean(x * q); }
        break;
      case 'fib':
        var fa = r.int(1, 6), fb = r.int(fa, 10), op = r.pick(['+', '−', '×']);
        n = op === '×' ? 4 : r.int(4, 5);
        t.push(fa, fb);
        while (t.length <= n) { var p2 = t[t.length - 2], p1 = t[t.length - 1]; t.push(op === '+' ? p2 + p1 : op === '−' ? p2 - p1 : p2 * p1); }
        break;
      /* ---------- harder generators (Optiver-style test) ---------- */
      case 'squares':
        s = r.int(2, 12); var cs = r.int(-6, 6);
        for (i = 0; i <= 5; i++) t.push((s + i) * (s + i) + cs);
        break;
      case 'cubes':
        s = r.int(1, 6); var cc = r.pick([0, 0, 1, -1, 2]);
        for (i = 0; i <= 4; i++) t.push((s + i) * (s + i) * (s + i) + cc);
        break;
      case 'primes':
        s = r.int(2, 14); var how = r.pick(['p', '2p', 'p+1', 'p2', 'gap']);
        for (i = 0; i <= 5; i++) {
          var pr = PRIMES[s + i];
          t.push(how === 'p' ? pr : how === '2p' ? 2 * pr : how === 'p+1' ? pr + 1 : how === 'p2' ? (i <= 4 ? PRIMES[s + i] * PRIMES[s + i] : 0) : 0);
        }
        if (how === 'p2') { t = []; s = r.int(0, 5); for (i = 0; i <= 4; i++) t.push(PRIMES[s + i] * PRIMES[s + i]); }
        if (how === 'gap') { t = []; x = r.int(1, 20); for (i = 0; i <= 5; i++) { t.push(x); x += PRIMES[i]; } }
        break;
      case 'altops':
        x = r.int(1, 9); var ka = r.int(1, 9), kb = r.int(2, 3), first = r.pick(['add', 'mul', 'sub']);
        for (i = 0; i <= 6; i++) {
          t.push(x);
          var useMul = (i % 2 === 0) === (first === 'mul');
          x = useMul ? x * kb : (first === 'sub' ? x - ka : x + ka);
        }
        break;
      case 'diff2':
        x = r.int(1, 30); d = r.int(1, 8); var e = r.int(1, 4), f = r.int(1, 3);
        for (i = 0; i <= 5; i++) { t.push(x); x += d; d += e; e += f; }
        break;
      case 'triangular':
        s = r.int(1, 8); var ct = r.pick([0, 0, 1, -1, 3]);
        for (i = 0; i <= 5; i++) { var k = s + i; t.push(k * (k + 1) / 2 + ct); }
        break;
      case 'trib':
        t.push(r.int(0, 3), r.int(1, 4), r.int(1, 5));
        while (t.length <= 6) t.push(t[t.length - 1] + t[t.length - 2] + t[t.length - 3]);
        break;
      case 'factorial':
        x = r.int(1, 5); var mlt = 2;
        for (i = 0; i <= 5; i++) { t.push(x); x *= mlt; mlt++; }
        break;
      case 'mixinter':
        var ma = r.int(1, 30), mda = r.sign() * r.int(2, 9), mg = r.int(1, 5), mq = r.pick([2, 3]);
        for (i = 0; i <= 6; i++) t.push(i % 2 === 0 ? ma + (i / 2) * mda : mg * Math.pow(mq, (i - 1) / 2));
        break;
      case 'affinestep':
        x = r.int(1, 6); var kk = r.int(0, 3);
        for (i = 0; i <= 5; i++) { t.push(x); x = 2 * x + kk; kk++; }
        break;
      case 'squaresalt':
        s = r.int(1, 5);
        for (i = 0; i <= 6; i++) { var sq = (s + i) * (s + i); t.push(i % 2 === 0 ? sq : -sq); }
        break;
      case 'powers':
        var base = r.pick([2, 3]), cp = r.int(-3, 5); s = r.int(0, 3);
        for (i = 0; i <= 5; i++) t.push(Math.pow(base, s + i) + cp);
        break;
      default: return genSeq(r, 'arith1');
    }
    return { terms: t.slice(0, -1), ans: t[t.length - 1], kind: kind, rule: SEQ_RULES[kind] };
  }
  function genSeqHard(r) { return genSeq(r, r.pick(SEQ_HARD)); }
  /* Answers are rounded to 4 decimals: accept anything within half a unit of the 4th decimal. */
  function seqCheck(x, ans) { return x !== null && isFinite(x) && Math.abs(x - ans) < 0.0000501; }

  /* ================================================================== */
  /* 4. Pump Up The Balloon                                              */
  /* ================================================================== */
  /* Burst point B ~ Uniform{1..N}; the balloon pops when the pump count reaches B.
   * Collecting after k pumps succeeds iff B > k: P = (N−k)/N, EV(k) = k(N−k)/N.
   * Dynamic programme over "alive with k pending": V(k) = max(k, P(B>k+1 | B>k)·V(k+1)). */
  function balloonPolicy(N) {
    N = N || 16;
    var ev = [], k, best = 0, bestK = 0;
    for (k = 0; k <= N; k++) { ev.push(k * (N - k) / N); if (ev[k] > best + 1e-12) { best = ev[k]; bestK = k; } }
    var V = new Array(N + 1), stop = new Array(N + 1);
    V[N - 1] = N - 1; stop[N - 1] = true;
    for (k = N - 2; k >= 0; k--) {
      var cont = (N - k - 1) / (N - k) * V[k + 1];
      if (k >= cont - 1e-12) { V[k] = k; stop[k] = true; } else { V[k] = cont; stop[k] = false; }
    }
    var stopAt = 0; while (stopAt < N && !stop[stopAt]) stopAt++;
    return { N: N, ev: ev, bestK: bestK, bestEV: best, V0: V[0], stopAt: stopAt, V: V };
  }
  function balloonBursts(r, n, N) { var b = []; for (var i = 0; i < n; i++) b.push(r.int(1, N || 16)); return b; }
  /* What a fixed "collect after k pumps" policy would have banked on these burst points. */
  function balloonReplay(bursts, k) { var s = 0; for (var i = 0; i < bursts.length; i++) if (bursts[i] > k) s += k; return s; }

  /* ================================================================== */
  /* 5. Card Counting market                                             */
  /* ================================================================== */
  var CARD_LEVELS = { easy: { n: 3, up: 2 }, medium: { n: 3, up: 1 }, hard: { n: 3, up: 0 } };
  var RANK_TXT = { 11: 'J', 12: 'Q', 13: 'K', 14: 'A' };
  function cardLabel(v) { return RANK_TXT[v] || String(v); }
  function freshDeck(r) { var d = []; for (var i = 0; i < 52; i++) d.push({ v: 2 + (i % 13), s: Math.floor(i / 13) }); return r.shuffle(d); }
  function cardFair(visibleVals, hiddenCount, unseenVals) { return sum(visibleVals) + hiddenCount * mean(unseenVals); }
  function makeQuote(r, fair, sLo, sHi, oLo, oHi) {
    var spread = r.int(sLo, sHi), off = r.int(oLo, oHi);
    var bid = Math.max(0, Math.floor(fair + off - spread / 2));
    return { bid: bid, ask: bid + spread, spread: spread, off: off };
  }
  /* Pre-deals every round so the content depends only on the seed (not on the player's choices).
   * The shoe persists across rounds; "unseen" = undealt cards + this round's face-down cards. */
  function cardRounds(r, cfg) {
    var n = cfg.n, up = Math.min(cfg.up, n), rounds = [], deck = freshDeck(r), seen = [], shoe = 1;
    for (var i = 0; i < (cfg.rounds || 20); i++) {
      var reshuffled = false;
      if (deck.length < n) { deck = freshDeck(r); seen = []; shoe++; reshuffled = true; }
      var cards = deck.splice(0, n);
      var vis = cards.slice(0, up), hid = cards.slice(up);
      var unseen = deck.concat(hid).map(function (c) { return c.v; });
      var fair = cardFair(vis.map(function (c) { return c.v; }), hid.length, unseen);
      var q = makeQuote(r, fair, 2, 5, -4, 4);
      rounds.push({ cards: cards, up: up, fair: fair, trueV: sum(cards.map(function (c) { return c.v; })), bid: q.bid, ask: q.ask, spread: q.spread,
        seenBefore: seen.length, deckLeft: deck.length + hid.length, shoe: shoe, reshuffled: reshuffled, unseenMean: mean(unseen) });
      seen = seen.concat(cards);
    }
    return rounds;
  }
  var MAX_QTY = 10;
  function tradeResult(side, qty, bid, ask, fair, trueV) {
    qty = side === 'pass' ? 0 : clamp(Math.round(qty) || 0, 1, MAX_QTY);
    var pnl = 0, evc = 0;
    if (side === 'buy') { pnl = qty * (trueV - ask); evc = qty * (fair - ask); }
    else if (side === 'sell') { pnl = qty * (bid - trueV); evc = qty * (bid - fair); }
    var eva = MAX_QTY * Math.max(fair - ask, bid - fair, 0);
    var best = fair - ask > bid - fair ? (fair - ask > 0 ? 'buy' : 'pass') : (bid - fair > 0 ? 'sell' : 'pass');
    return { side: side, qty: qty, pnl: clean(pnl), evc: clean(evc), eva: clean(eva), best: best };
  }

  /* ================================================================== */
  /* 6. Dice Market Maker                                                */
  /* ================================================================== */
  var DICE_EVENTS = [
    { id: 'high', name: 'High roll', desc: 'Every die shows 5 or 6.', faces: [5, 6] },
    { id: 'low', name: 'Low roll', desc: 'Every die shows 1 or 2.', faces: [1, 2] },
    { id: 'tails', name: 'Tails', desc: 'Every die shows 1 or 6.', faces: [1, 6] },
    { id: 'even', name: 'Even', desc: 'Every die is even.', faces: [2, 4, 6] },
    { id: 'odd', name: 'Odd', desc: 'Every die is odd.', faces: [1, 3, 5] },
    { id: 'sevens', name: 'Ones count as 7', desc: 'A rolled 1 scores 7.', faces: [7, 2, 3, 4, 5, 6] }
  ];
  var DICE_LEVELS = {
    easy: { visible: 2, orders: 2, lots: 5, pInf: 0.2, width: 2, limit: 15 },
    medium: { visible: 1, orders: 3, lots: 5, pInf: 0.3, width: 2.5, limit: 20 },
    hard: { visible: 0, orders: 3, lots: 5, pInf: 0.4, width: 3, limit: 20 }
  };
  function diceRound(r, lvlName, eventsOn) {
    var lvl = DICE_LEVELS[lvlName] || DICE_LEVELS.medium;
    var ev = eventsOn && r.next() < 0.45 ? r.pick(DICE_EVENTS) : null;
    var faces = ev ? ev.faces : [1, 2, 3, 4, 5, 6];
    var dice = [r.pick(faces), r.pick(faces), r.pick(faces)];
    var nv = lvl.visible, vis = dice.slice(0, nv), hidden = 3 - nv;
    var fm = mean(faces), fmax = Math.max.apply(null, faces), fmin = Math.min.apply(null, faces);
    var fair = sum(vis) + hidden * fm;
    var q = makeQuote(r, fair, 2, 4, -3, 3);
    return { dice: dice, visible: nv, event: ev ? ev.id : null, faces: faces, fair: clean(fair), trueSum: sum(dice),
      maxSum: sum(vis) + hidden * fmax, minSum: sum(vis) + hidden * fmin, bid: q.bid, ask: q.ask, spread: q.spread };
  }
  function diceRounds(r, lvlName, eventsOn, n) { var a = []; for (var i = 0; i < (n || 10); i++) a.push(diceRound(r, lvlName, eventsOn)); return a; }
  /* Take mode: buy costs ask·qty; a sell's worst case is (max − bid)·qty. Both must fit the budget. */
  function takeCost(side, qty, rd) { return side === 'buy' ? rd.ask * qty : (rd.maxSum - rd.bid) * qty; }
  function takeAllowed(side, qty, rd, budget) { return qty > 0 && takeCost(side, qty, rd) <= budget + 1e-9; }
  function makeValidate(bid, ask, maxSum) {
    if (bid === null || ask === null || !isFinite(bid) || !isFinite(ask)) return 'Enter both a bid and an ask.';
    if (bid < 0) return 'Bid must be at least 0.';
    if (!(ask > bid)) return 'Ask must be above the bid.';
    if (ask > maxSum) return 'Ask can’t be above the maximum possible sum (' + maxSum + ').';
    return '';
  }
  /* Order flow for one quoted round. The PRNG draws are the same whatever the quote,
   * so the same seed produces the same counterparties for everyone. */
  function makeFills(r, bid, ask, rd, lvl) {
    var pos = 0, pnl = 0, fills = [], vol = 0, volInf = 0;
    for (var i = 0; i < lvl.orders; i++) {
      var uInf = r.next(), uSide = r.next(), z = r.normal();
      var informed = uInf < lvl.pInf, side = null, tol = Math.abs(z) * lvl.width;
      if (informed) { if (rd.trueSum > ask) side = 'buy'; else if (rd.trueSum < bid) side = 'sell'; }
      else {
        var wantsBuy = uSide < 0.5;
        if (wantsBuy && ask <= rd.fair + tol) side = 'buy';
        else if (!wantsBuy && bid >= rd.fair - tol) side = 'sell';
      }
      var f = { who: informed ? 'informed' : 'noise', side: side, qty: 0, px: null, pnl: 0, tol: informed ? null : clean(tol), wanted: informed ? null : (uSide < 0.5 ? 'buy' : 'sell') };
      if (side) {
        // counterparty buys → we sell (position falls); counterparty sells → we buy
        var room = side === 'buy' ? lvl.limit + pos : lvl.limit - pos;
        var qty = Math.max(0, Math.min(lvl.lots, room));
        f.capped = qty < lvl.lots;
        if (qty > 0) {
          f.qty = qty; f.px = side === 'buy' ? ask : bid;
          f.pnl = clean(side === 'buy' ? qty * (ask - rd.trueSum) : qty * (rd.trueSum - bid));
          pos += side === 'buy' ? -qty : qty; pnl += f.pnl; vol += qty; if (informed) volInf += qty;
        }
      }
      fills.push(f);
    }
    return { fills: fills, pos: pos, pnl: clean(pnl), vol: vol, volInf: volInf };
  }

  /* ================================================================== */
  /* 7–8. Fermi estimation + Daily Fermi                                 */
  /* ================================================================== */
  var SUFFIX = { k: 1e3, thousand: 1e3, m: 1e6, mn: 1e6, mio: 1e6, million: 1e6, b: 1e9, bn: 1e9, billion: 1e9, t: 1e12, tn: 1e12, trillion: 1e12 };
  function parseQty(s) {
    if (s == null) return null;
    s = String(s).trim().toLowerCase().replace(/[,\s_']/g, '').replace(/[×*·]/g, 'x').replace(/−/g, '-').replace(/\*\*/g, '^');
    if (!s) return null;
    var m = s.match(/^(\d+(?:\.\d*)?|\.\d+)?(?:x?10\^\(?(-?\d+(?:\.\d+)?)\)?)?(?:e([+-]?\d+))?(k|mn|mio|m|bn|b|tn|t|thousand|million|billion|trillion)?$/);
    if (!m || (m[1] === undefined && m[2] === undefined)) return null;
    var v = m[1] !== undefined ? parseFloat(m[1]) : 1;
    if (m[2] !== undefined) v *= Math.pow(10, parseFloat(m[2]));
    if (m[3] !== undefined) v *= Math.pow(10, parseInt(m[3], 10));
    if (m[4]) v *= SUFFIX[m[4]];
    return isFinite(v) ? v : null;
  }
  function fermiValidate(L, U) {
    if (L === null || U === null) return 'Enter both ends, e.g. 2e6 or 3x10^5 or 40k.';
    if (!(L > 0) || !(U > 0)) return 'Both ends must be positive.';
    if (!(U > L)) return 'The upper end must be above the lower end.';
    if (U / L < 1.8 - 1e-12) return 'Make the range at least 1.8× wide (upper ÷ lower ≥ 1.8).';
    return '';
  }
  var Z80_WIDTH = 2.5631;  // an 80% interval spans ±1.28155σ
  function fermiAccuracy(sigma, z) { return Math.round(clamp(100 * (Math.log(1.5 / sigma) - z * z / 2) / Math.log(15), -100, 100)); }
  function fermiSigma(L, U) { return Math.max(0.1, (log10(U) - log10(L)) / Z80_WIDTH); }
  function fermiScore(L, U, ans, tLeft, limit) {
    var lL = log10(L), lU = log10(U), mu = (lL + lU) / 2, sigma = fermiSigma(L, U);
    var z = (log10(ans) - mu) / sigma;
    var acc = fermiAccuracy(sigma, z);
    var speed = acc > 0 ? Math.round(20 * clamp(tLeft / limit, 0, 1) * acc / 100) : 0;
    return { mu: mu, sigma: sigma, z: z, acc: acc, speed: speed, total: acc + speed, hit: ans >= L && ans <= U };
  }
  function fermiPreview(L, U) {
    var sigma = fermiSigma(L, U), zEdge = (log10(U) - log10(L)) / 2 / sigma;
    return { centre: fermiAccuracy(sigma, 0), edge: fermiAccuracy(sigma, zEdge), sigma: sigma };
  }
  function fermiPick(r, level, n, pool) {
    pool = pool || DATA.fermi || [];
    var want = { easy: 1, medium: 2, hard: 3 }[level];
    var cand = want ? pool.filter(function (q) { return q.d === want; }) : pool.slice();
    var out = r.shuffle(cand).slice(0, n);
    if (!want) out.sort(function (a, b) { return a.d - b.d; });
    return out;
  }
  var FERMI_LIMIT = { 1: 60, 2: 45, 3: 30 };
  var FERMI_LEVEL_LIMIT = { easy: 60, medium: 45, hard: 30 };
  var DAILY_EPOCH = '2026-01-01';
  function dailyPick(dateStr, pool) {
    pool = pool || DATA.daily || [];
    var n = daysBetween(DAILY_EPOCH, dateStr) + 1, len = pool.length;
    if (!len) return { n: n, q: null };
    var k = ((n - 1) % len + len) % len, cycle = Math.floor((n - 1) / len);
    var order = makeRng(hashStr('sbt-daily-fermi:' + cycle)).shuffle(pool.map(function (_, i) { return i; }));
    return { n: n, q: pool[order[k]], idx: order[k] };
  }
  function dailyScore(guess, ans) {
    var e = log10(guess / ans), ratio = Math.pow(10, Math.abs(e));
    var score = Math.round(clamp(1000 * (1 - Math.abs(e) / 2), 0, 1000));
    var band = ratio <= 1.5 + 1e-9 ? 'great' : ratio <= 3 + 1e-9 ? 'good' : ratio <= 10 + 1e-9 ? 'ok' : 'bad';
    var txt = ratio < 1.005 ? 'Spot on' : (ratio < 9.95 ? ratio.toFixed(1) : String(Math.round(ratio))) + '× too ' + (e > 0 ? 'high' : 'low');
    return { score: score, err: e, ratio: ratio, band: band, text: txt };
  }
  function shareBar(score) { var g = clamp(Math.round(score / 100), 0, 10), s = ''; for (var i = 0; i < 10; i++) s += i < g ? '🟩' : '🟨'; return s; }
  function shareText(n, score, txt) { return 'Stat Brainteaser · Daily Fermi #' + n + '\n' + shareBar(score) + ' ' + score + '/1000\n' + txt; }
  function inWords(x) {
    if (!isFinite(x)) return '';
    var a = Math.abs(x), units = [[1e12, 'trillion'], [1e9, 'billion'], [1e6, 'million'], [1e3, 'thousand']];
    if (a >= 1e15) { var e = Math.floor(log10(a)); return (x / Math.pow(10, e)).toFixed(2).replace(/\.?0+$/, '') + ' × 10^' + e; }
    for (var i = 0; i < units.length; i++) if (a >= units[i][0]) return clean(round(x / units[i][0], a / units[i][0] >= 100 ? 0 : a / units[i][0] >= 10 ? 1 : 2)) + ' ' + units[i][1];
    if (a > 0 && a < 1e-3) { var e2 = Math.floor(log10(a)); return (x / Math.pow(10, e2)).toFixed(2).replace(/\.?0+$/, '') + ' × 10^' + e2; }
    return String(clean(round(x, a >= 100 ? 0 : a >= 1 ? 2 : 4)));
  }
  function sci(x) {   // compact human format for answers and axis labels
    if (!isFinite(x)) return String(x);
    var a = Math.abs(x);
    if (a !== 0 && (a >= 1e7 || a < 1e-3)) { var e = Math.floor(log10(a)), m = x / Math.pow(10, e); if (Math.abs(m) >= 9.995) { m /= 10; e++; } return m.toFixed(2).replace(/\.?0+$/, '') + '×10^' + e; }
    if (a >= 1000) return Math.round(x).toLocaleString('en-US');
    return String(clean(round(x, a >= 100 ? 1 : a >= 1 ? 2 : 4)));
  }

  /* ================================================================== */
  /* 9. Kelly betting                                                    */
  /* ================================================================== */
  function kellyF(p, b) { return p - (1 - p) / b; }
  function kellyGrowth(p, b, f) { if (f >= 1) return -Infinity; return p * Math.log(1 + b * f) + (1 - p) * Math.log(1 - f); }
  function kellyStep(w, f, win, b) { f = clamp(f, 0, 1); var stake = w * f; var nw = win ? w + stake * b : w - stake; return nw < 0.005 ? 0 : nw; }
  function kellyPath(bets, fracFn, w0) {
    var w = w0, path = [w0];
    for (var i = 0; i < bets.length; i++) { if (w > 0) w = kellyStep(w, fracFn(i, bets[i], w), bets[i].win, bets[i].b); path.push(w); }
    return path;
  }
  /* Unknown-p posterior on a grid over [lo, hi] with a flat prior; returns the posterior mean. */
  function posteriorMean(wins, losses, lo, hi) {
    var n = 101, num = 0, den = 0, maxLog = -Infinity, logs = [];
    for (var i = 0; i < n; i++) { var p = lo + (hi - lo) * i / (n - 1); var l = wins * Math.log(p) + losses * Math.log(1 - p); logs.push(l); if (l > maxLog) maxLog = l; }
    for (var j = 0; j < n; j++) { var pj = lo + (hi - lo) * j / (n - 1), wgt = Math.exp(logs[j] - maxLog); num += pj * wgt; den += wgt; }
    return num / den;
  }
  var KELLY_VARIANTS = {
    classic: { n: 100, w0: 25, name: 'Classic coin' },
    odds: { n: 40, w0: 100, name: 'Changing odds' },
    unknown: { n: 100, w0: 25, name: 'Unknown bias' }
  };
  function kellyBets(r, variant) {
    var bets = [], i, cfg = KELLY_VARIANTS[variant] || KELLY_VARIANTS.classic;
    if (variant === 'odds') {
      for (i = 0; i < cfg.n; i++) {
        var b = r.pick([0.5, 1, 1, 2, 3, 4]);
        var pFair = 1 / (1 + b), edge = r.pick([-0.08, -0.04, 0.03, 0.05, 0.08, 0.1, 0.12, 0.15]);
        var p = clamp(round(pFair + edge, 2), 0.05, 0.95);
        bets.push({ p: p, b: b, win: r.next() < p });
      }
      return { bets: bets, pTrue: null };
    }
    var pt = variant === 'unknown' ? round(0.5 + 0.25 * r.next(), 3) : 0.6;
    for (i = 0; i < cfg.n; i++) bets.push({ p: pt, b: 1, win: r.next() < pt });
    return { bets: bets, pTrue: pt };
  }
  /* Ghost strategies on the same flips. mult = 1 (full), 0.5 (half), 2 (double). */
  function kellyGhost(bets, w0, mult, variant) {
    var wins = 0, losses = 0;
    return kellyPath(bets, function (i, bt) {
      var p = bt.p;
      if (variant === 'unknown') { p = posteriorMean(wins, losses, 0.5, 0.75); if (bt.win) wins++; else losses++; }
      return clamp(mult * Math.max(0, kellyF(p, bt.b)), 0, 1);
    }, w0);
  }

  /* ================================================================== */
  /* 10. Extras: ETF arb, Spread & Edge, Options mental math             */
  /* ================================================================== */
  var TICKERS = DATA.tickers && DATA.tickers.length ? DATA.tickers : ['ALPH', 'BRVO', 'CHRL', 'DLTA', 'ECHO', 'FXTR'];
  /* Everything in integer cents so no float noise reaches the answer. */
  function genEtf(r) {
    var n = r.int(3, 4), names = r.shuffle(TICKERS).slice(0, n), comps = [], bb = 0, ba = 0;
    for (var i = 0; i < n; i++) {
      var mid = r.int(10, 60) * 100 + r.pick([0, 50]), half = r.pick([5, 10]), qty = r.int(1, 4);
      var c = { t: names[i], q: qty, bid: mid - half, ask: mid + half };
      comps.push(c); bb += qty * c.bid; ba += qty * c.ask;
    }
    var cost = r.pick([10, 20, 30, 50]), kind = r.pick(['cheap', 'rich', 'none', 'none', 'cheap', 'rich']), ew = r.pick([10, 20]), edge = r.pick([10, 20, 30, 40, 60]);
    var eb, ea;
    if (kind === 'cheap') { ea = bb - cost - edge; eb = ea - ew; }
    else if (kind === 'rich') { eb = ba + cost + edge; ea = eb + ew; }
    else {
      // inside the no-arb band, but tempting: just short of covering the cost on one side
      if (r.next() < 0.5) { eb = ba + cost - r.pick([10, 20]); ea = eb + ew; }
      else { ea = bb - cost + r.pick([10, 20]); eb = ea - ew; }
    }
    var pBuyEtf = bb - ea - cost, pSellEtf = eb - ba - cost;
    var answer = pBuyEtf > 0 ? 0 : pSellEtf > 0 ? 1 : 2;
    return { comps: comps, etfBid: eb, etfAsk: ea, cost: cost, basketBid: bb, basketAsk: ba, answer: answer, profit: Math.max(pBuyEtf, pSellEtf, 0) };
  }
  function cents(x) { return (x / 100).toFixed(2); }
  function genSpread(r) {
    var kind = r.pick(['edge', 'edge', 'quote', 'mtm', 'mid', 'dice', 'skew', 'avg']), fair, q, a, b, qty, px;
    switch (kind) {
      case 'edge':
        fair = r.int(20, 90) + r.pick([0, 0.5]); qty = r.int(2, 12);
        if (r.next() < 0.5) { px = fair - r.pick([0.5, 1, 1.5, 2, 2.5, 3]); return { kind: kind, q: 'Fair ' + fair + '. You lift ' + qty + ' lots at ' + px + '. Edge?', ans: clean(qty * (fair - px)), help: qty + ' × (' + fair + ' − ' + px + ')' }; }
        px = fair + r.pick([0.5, 1, 1.5, 2, 2.5, 3]); return { kind: kind, q: 'Fair ' + fair + '. You hit the bid: sell ' + qty + ' at ' + px + '. Edge?', ans: clean(qty * (px - fair)), help: qty + ' × (' + px + ' − ' + fair + ')' };
      case 'quote':
        fair = r.int(20, 90) + r.pick([0, 0.5]); var w = r.pick([1, 2, 3, 4, 5]); var side = r.pick(['bid', 'ask']);
        return { kind: kind, q: 'Fair ' + fair + '. Quote ' + w + ' wide, centred. Your ' + side + '?', ans: clean(side === 'bid' ? fair - w / 2 : fair + w / 2), help: fair + (side === 'bid' ? ' − ' : ' + ') + w + '/2' };
      case 'mtm':
        qty = r.int(2, 20); a = r.int(20, 80) + r.pick([0, 0.5]); b = clean(a + r.sign() * r.pick([0.5, 1, 1.5, 2, 3])); var lng = r.next() < 0.5;
        return { kind: kind, q: (lng ? 'Long ' : 'Short ') + qty + ' at ' + a + ', now marked ' + b + '. P&L?', ans: clean((lng ? 1 : -1) * qty * (b - a)), help: (lng ? '' : '−') + qty + ' × (' + b + ' − ' + a + ')' };
      case 'mid':
        a = r.int(20, 90); b = clean(a + r.pick([0.5, 1, 1.5, 2, 2.5, 3, 4])); return { kind: kind, q: 'Market ' + a + ' at ' + b + '. Mid?', ans: clean((a + b) / 2), help: '(' + a + ' + ' + b + ') / 2' };
      case 'dice':
        var nd = r.pick([2, 3, 3]), shown = r.int(1, nd - 1), vals = []; for (var i = 0; i < shown; i++) vals.push(r.int(1, 6));
        return { kind: kind, q: 'Sum of ' + nd + ' dice. You see ' + vals.join(' and ') + '. Fair value?', ans: clean(sum(vals) + (nd - shown) * 3.5), help: vals.join(' + ') + ' + ' + (nd - shown) + ' × 3.5' };
      case 'skew':
        fair = r.int(20, 90); var w2 = r.pick([2, 4]), sk = r.pick([0.5, 1]), lg = r.next() < 0.5, sd = r.pick(['bid', 'ask']);
        var midq = lg ? fair - sk : fair + sk;
        return { kind: kind, q: 'Fair ' + fair + ', ' + w2 + ' wide. You are ' + (lg ? 'long' : 'short') + ', so skew ' + sk + (lg ? ' down' : ' up') + '. Your ' + sd + '?', ans: clean(sd === 'bid' ? midq - w2 / 2 : midq + w2 / 2), help: 'mid ' + midq + (sd === 'bid' ? ' − ' : ' + ') + w2 / 2 };
      default:
        var q1 = r.int(2, 10), p1 = r.int(20, 60), q2 = r.int(2, 10), p2 = p1 + r.int(1, 6);
        var tot = q1 + q2, avg = (q1 * p1 + q2 * p2) / tot;
        if (Math.abs(avg * 100 - Math.round(avg * 100)) > 1e-9) { q2 = q1; avg = (p1 + p2) / 2; tot = 2 * q1; }
        return { kind: 'avg', q: 'Bought ' + q1 + ' at ' + p1 + ' and ' + q2 + ' at ' + p2 + '. Average price?', ans: clean(avg), help: '(' + q1 + '×' + p1 + ' + ' + q2 + '×' + p2 + ') / ' + tot };
    }
  }
  var T_CHOICES = [{ t: 1, txt: '1 year' }, { t: 0.25, txt: '3 months' }, { t: 64 / 256, txt: '64 trading days' }, { t: 16 / 256, txt: '16 trading days' }, { t: 4, txt: '4 years' }, { t: 4 / 256, txt: '4 trading days' }];
  function genOptions(r) {
    var kind = r.pick(['atm', 'atm', 'straddle', 'parity', 'parity', 'daily', 'impl', 'move']);
    var S = r.pick([20, 40, 50, 80, 100, 100, 120, 200, 250, 400]), sig = r.pick([10, 16, 20, 24, 25, 30, 32, 40, 48, 50, 64, 80]), T = r.pick(T_CHOICES), K, C, P;
    switch (kind) {
      case 'atm': return { kind: kind, q: 'ATM call: S = ' + S + ', σ = ' + sig + '%, T = ' + T.txt + ' (r = 0). Price ≈ ?', ans: clean(0.4 * sig / 100 * Math.sqrt(T.t) * S), tol: 0.04, help: '0.4 × ' + sig / 100 + ' × √' + clean(T.t) + ' × ' + S };
      case 'straddle': return { kind: kind, q: 'ATM straddle: S = ' + S + ', σ = ' + sig + '%, T = ' + T.txt + '. Price ≈ ?', ans: clean(0.8 * sig / 100 * Math.sqrt(T.t) * S), tol: 0.04, help: '0.8 × ' + sig / 100 + ' × √' + clean(T.t) + ' × ' + S };
      case 'parity':
        K = S + r.sign() * r.pick([0, 5, 10, 20]); C = clean(r.int(3, 30) + r.pick([0, 0.5, 0.25]));
        P = clean(C - S + K);
        if (P <= 0) { K = S + 20; P = clean(C - S + K); }
        if (r.next() < 0.5) return { kind: kind, q: 'Put–call parity (r = 0): S = ' + S + ', K = ' + K + ', call = ' + C + '. Put = ?', ans: P, tol: 0, help: 'P = C − S + K = ' + C + ' − ' + S + ' + ' + K };
        return { kind: kind, q: 'Put–call parity (r = 0): S = ' + S + ', K = ' + K + ', put = ' + P + '. Call = ?', ans: C, tol: 0, help: 'C = P + S − K = ' + P + ' + ' + S + ' − ' + K };
      case 'daily': return { kind: kind, q: 'Annual vol ' + sig + '%. One-day 1σ move, in % (256-day year)?', ans: clean(sig / 16), tol: 0.02, help: sig + ' / √256 = ' + sig + ' / 16' };
      case 'move': return { kind: kind, q: 'Stock at ' + S + ', vol ' + sig + '%. One-day 1σ move in $ (256-day year)?', ans: clean(S * sig / 100 / 16), tol: 0.03, help: S + ' × ' + sig / 100 + ' / 16' };
      default:
        var st = clean(0.8 * sig / 100 * Math.sqrt(T.t) * S);
        return { kind: 'impl', q: 'ATM straddle on S = ' + S + ' for ' + T.txt + ' costs ' + st + '. Implied vol in % ≈ ?', ans: sig, tol: 0.04, help: st + ' / (0.8 × √' + clean(T.t) + ' × ' + S + ')' };
    }
  }
  function optCheck(x, q) { if (x === null || !isFinite(x)) return false; if (!q.tol) return Math.abs(x - q.ans) < 1e-6; return Math.abs(x - q.ans) <= q.tol * Math.abs(q.ans) + 1e-9; }

  /* ================================================================== */
  /* Runs: PB tables, percentiles, ghost pace, challenge codes           */
  /* ================================================================== */
  function eligible(r) { return r && !r.early; }
  function pbTable(runs, sinceT, lowerBetter) {
    return runs.filter(function (r) { return eligible(r) && (!sinceT || r.t >= sinceT); }).slice().sort(function (a, b) {
      return (lowerBetter ? a.score - b.score : b.score - a.score) || a.t - b.t;
    });
  }
  function betterThan(runs, score, excludeId) {
    var pool = runs.filter(function (r) { return eligible(r) && r.id !== excludeId; });
    if (!pool.length) return null;
    var below = pool.filter(function (r) { return r.score < score; }).length;
    return Math.round(100 * below / pool.length);
  }
  /* tl = [[deciseconds, scoreAfter], ...]; ghost score at elapsed ms */
  function ghostAt(tl, ms) {
    var s = 0, ds = ms / 100;
    if (!tl) return 0;
    for (var i = 0; i < tl.length; i++) { if (tl[i][0] <= ds) s = tl[i][1]; else break; }
    return s;
  }
  var B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  function b64enc(str) {
    var bytes = [], i;
    for (i = 0; i < str.length; i++) { var c = str.charCodeAt(i); if (c > 127) c = 63; bytes.push(c); }
    var out = '';
    for (i = 0; i < bytes.length; i += 3) {
      var n = (bytes[i] << 16) | ((bytes[i + 1] || 0) << 8) | (bytes[i + 2] || 0);
      out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + (i + 1 < bytes.length ? B64[(n >> 6) & 63] : '') + (i + 2 < bytes.length ? B64[n & 63] : '');
    }
    return out;
  }
  function b64dec(s) {
    var out = '', buf = 0, bits = 0;
    for (var i = 0; i < s.length; i++) {
      var v = B64.indexOf(s[i]);
      if (v < 0) throw new Error('bad character');
      buf = (buf << 6) | v; bits += 6;
      if (bits >= 8) { bits -= 8; out += String.fromCharCode((buf >> bits) & 255); }
    }
    return out;
  }
  function checksum(s) { var c = (hashStr(s) % 1296).toString(36).toUpperCase(); return c.length < 2 ? '0' + c : c; }
  function encodeChallenge(o) {
    var body = b64enc(JSON.stringify({ g: o.g, v: o.v, s: o.seed >>> 0, sc: o.score }));
    return 'SBT-' + body + '-' + checksum(body);
  }
  function decodeChallenge(code) {
    var s = String(code || '').replace(/\s+/g, '');
    var m = s.match(/^SBT-([A-Za-z0-9_-]+)-([0-9A-Za-z]{2})$/);
    if (!m) throw new Error('That isn’t a challenge code (they start with SBT-).');
    if (checksum(m[1]) !== m[2].toUpperCase()) throw new Error('Checksum mismatch: the code was mistyped or cut off.');
    var o = JSON.parse(b64dec(m[1]));
    if (!o || typeof o.g !== 'string' || typeof o.v !== 'string' || !isFinite(o.s)) throw new Error('Incomplete challenge code.');
    return { g: o.g, v: o.v, seed: o.s >>> 0, score: +o.sc };
  }

  var ENGINE = {
    mulberry32: mulberry32, makeRng: makeRng, hashStr: hashStr, deriveSeed: deriveSeed, clamp: clamp, round: round, clean: clean, sum: sum, mean: mean, log10: log10, near: near,
    fmtNum: fmtNum, fmtFixed: fmtFixed, fmtSigned: fmtSigned, daysBetween: daysBetween,
    genMania: genMania, genEighty: genEighty, oaChoices: oaChoices,
    genSeq: genSeq, genSeqHard: genSeqHard, seqCheck: seqCheck, SEQ_KINDS: SEQ_KINDS, SEQ_HARD: SEQ_HARD, PRIMES: PRIMES,
    balloonPolicy: balloonPolicy, balloonBursts: balloonBursts, balloonReplay: balloonReplay,
    CARD_LEVELS: CARD_LEVELS, cardLabel: cardLabel, freshDeck: freshDeck, cardFair: cardFair, makeQuote: makeQuote, cardRounds: cardRounds, tradeResult: tradeResult, MAX_QTY: MAX_QTY,
    DICE_EVENTS: DICE_EVENTS, DICE_LEVELS: DICE_LEVELS, diceRound: diceRound, diceRounds: diceRounds, takeCost: takeCost, takeAllowed: takeAllowed, makeValidate: makeValidate, makeFills: makeFills,
    parseQty: parseQty, fermiValidate: fermiValidate, fermiScore: fermiScore, fermiPreview: fermiPreview, fermiAccuracy: fermiAccuracy, fermiPick: fermiPick,
    FERMI_LIMIT: FERMI_LIMIT, FERMI_LEVEL_LIMIT: FERMI_LEVEL_LIMIT, DAILY_EPOCH: DAILY_EPOCH, dailyPick: dailyPick, dailyScore: dailyScore, shareBar: shareBar, shareText: shareText, inWords: inWords, sci: sci,
    kellyF: kellyF, kellyGrowth: kellyGrowth, kellyStep: kellyStep, kellyPath: kellyPath, kellyBets: kellyBets, kellyGhost: kellyGhost, posteriorMean: posteriorMean, KELLY_VARIANTS: KELLY_VARIANTS,
    genEtf: genEtf, cents: cents, genSpread: genSpread, genOptions: genOptions, optCheck: optCheck,
    pbTable: pbTable, betterThan: betterThan, ghostAt: ghostAt, b64enc: b64enc, b64dec: b64dec, encodeChallenge: encodeChallenge, decodeChallenge: decodeChallenge
  };

  /* ================================================================== */
  /* Catalogue (public: window.SBT_ARCADE.games)                         */
  /* ================================================================== */
  var GAMES = [
    { id: 'mania', name: 'Arithmetic Mania', icon: 'mania', group: 'speed', color: 'var(--c-probability)',
      desc: 'Three minutes of + − × ÷ on whole numbers. An answer locks in the moment it is right.',
      skills: ['Mental math', 'Speed'], firms: ['Optiver', 'Akuna', 'Flow Traders', 'IMC', 'Virtu', 'Tower Research'],
      why: 'Timed mental-math screens open the process at most market makers.', variants: [{ id: 'std', name: '3 minutes' }] },
    { id: 'eighty', name: '80 in 8', icon: 'eighty', group: 'speed', color: 'var(--c-sql)',
      desc: '80 questions in 8 minutes: decimals and 3-digit products. Real OA mode has 4 choices and scores +1 / −1 / 0.',
      skills: ['Mental math', 'Test strategy'], firms: ['Optiver', 'Akuna', 'Flow Traders', 'Virtu'],
      why: 'The Optiver numerical test format; ≈ 55 is the reported pass line, ≈ 70 is competitive.', variants: [{ id: 'practice', name: 'Practice' }, { id: 'oa', name: 'Real OA' }] },
    { id: 'sequences', name: 'Number Sequences', icon: 'sequences', group: 'speed', color: 'var(--c-combinatorics)',
      desc: 'Find the next term: arithmetic, affine, interleaved, geometric, Fibonacci-like. Optiver mode: 26 harder ones in 30 minutes.',
      skills: ['Pattern recognition', 'Speed'], firms: ['Optiver', 'Akuna', 'WorldQuant'],
      why: 'Optiver’s online sequences test (about 26 in 30 minutes) and Akuna’s timed screen.', variants: [{ id: 'std', name: '5 minutes' }, { id: 'optiver', name: 'Optiver 26 in 30' }] },
    { id: 'spread', name: 'Spread & Edge', icon: 'spread', group: 'speed', color: 'var(--c-ev)',
      desc: 'Quick-quote drill: edge on a trade, centred and skewed markets, mark-to-market, dice fair values.',
      skills: ['Market making', 'Mental math'], firms: ['Optiver', 'IMC', 'Citadel Securities', 'Flow Traders', 'Akuna'],
      why: 'The arithmetic inside every market-making game, done in under three seconds.', variants: [{ id: 'std', name: '3 minutes' }] },
    { id: 'options', name: 'Options Mental Math', icon: 'options', group: 'speed', color: 'var(--c-ml)',
      desc: 'ATM call ≈ 0.4·σ·√T·S, straddles, put–call parity, daily moves from vol, implied vol from a straddle.',
      skills: ['Options', 'Mental math'], firms: ['Akuna', 'DRW', 'Optiver', 'Goldman Sachs'],
      why: 'Options basics show up in Akuna and DRW trader rounds and at Goldman superdays.', variants: [{ id: 'std', name: '4 minutes' }] },
    { id: 'cards', name: 'Card Counting Market', icon: 'cards', group: 'market', color: 'var(--c-brainteasers)',
      desc: 'Trade the sum of a few cards against a quote. The shoe is not reshuffled, so counting the cards already seen moves fair value.',
      skills: ['Market making', 'Expected value', 'Card counting'], firms: ['Jane Street', 'Citadel Securities', 'IMC', 'SIG', 'Optiver'],
      why: 'Trading games on card sums are classic Jane Street, IMC and CitSec rounds.', variants: [{ id: 'easy', name: 'Easy' }, { id: 'medium', name: 'Medium' }, { id: 'hard', name: 'Hard' }, { id: 'custom', name: 'Custom' }] },
    { id: 'dice', name: 'Dice Market Maker', icon: 'dice', group: 'market', color: 'var(--c-statistics)',
      desc: 'Take quotes or make your own on the sum of 3 dice. Informed and noise flow, market events, position limits, round reports.',
      skills: ['Market making', 'Adverse selection'], firms: ['Optiver', 'Citadel Securities', 'IMC', 'DRW', 'Flow Traders', 'Jane Street'],
      why: 'The market-making game in Optiver, IMC, DRW and CitSec technicals, and Flow Traders’ online MM test.', variants: [{ id: 'take', name: 'Take' }, { id: 'make', name: 'Make' }] },
    { id: 'etf', name: 'ETF Arbitrage', icon: 'etf', group: 'market', color: 'var(--c-python)',
      desc: 'A basket and its ETF are both quoted. Is there a creation/redemption arb after costs, and which way?',
      skills: ['ETF arbitrage', 'Mental math'], firms: ['Flow Traders', 'Optiver', 'Jane Street'],
      why: 'Flow Traders’ ETF case study: creation, redemption and basket arbitrage.', variants: [{ id: 'std', name: '3 minutes' }] },
    { id: 'balloon', name: 'Pump Up The Balloon', icon: 'balloon', group: 'decide', color: 'var(--c-sql)',
      desc: '30 balloons, each with a hidden burst point from 1 to 16. Pump to grow the pot, collect before it pops.',
      skills: ['Optimal stopping', 'Expected value'], firms: ['SIG', 'Jane Street', 'HRT', 'IMC'],
      why: 'EV and stopping decisions under uncertainty, like the SIG and HRT EV games.', variants: [{ id: 'std', name: '30 balloons' }] },
    { id: 'kelly', name: 'Kelly Betting', icon: 'kelly', group: 'decide', color: 'var(--c-ev)',
      desc: 'Bet a biased coin and race ghost bankrolls for full, half and double Kelly on the same flips. Learn f* = p − q/b.',
      skills: ['Bet sizing', 'Log utility', 'Bayesian updating'], firms: ['SIG', 'Jane Street', 'HRT'],
      why: 'Sizing bets to your edge (and declining negative-EV bets) is on the superday rubric; SIG tests it directly.', variants: [{ id: 'classic', name: 'Classic coin' }, { id: 'odds', name: 'Changing odds' }, { id: 'unknown', name: 'Unknown bias' }] },
    { id: 'fermi', name: 'Fermi Estimation', icon: 'fermi', group: 'estimate', color: 'var(--c-fermi)',
      desc: 'Ten questions. Give an 80% interval; log scoring rewards ranges that are tight and right. Track your calibration.',
      skills: ['Estimation', 'Calibration'], firms: ['Jane Street', 'IMC', 'Goldman Sachs'],
      why: 'Estimating with honest uncertainty is part of “reasoning and updating” in trading interviews.', variants: [{ id: 'mixed', name: 'Mixed' }, { id: 'easy', name: 'Easy' }, { id: 'medium', name: 'Medium' }, { id: 'hard', name: 'Hard' }] },
    { id: 'daily-fermi', name: 'Daily Fermi', icon: 'daily', group: 'estimate', color: 'var(--c-fermi)',
      desc: 'One question a day, one point guess. Scored on how many times off you are, with shareable text.',
      skills: ['Estimation', 'Order of magnitude'], firms: ['Jane Street', 'SIG'],
      why: 'A 30-second daily rep of order-of-magnitude thinking.', variants: [{ id: 'std', name: 'Today' }] }
  ];
  var GAME = {};
  GAMES.forEach(function (g) { GAME[g.id] = g; });
  var GROUPS = [
    { id: 'speed', name: 'Speed & online tests', desc: 'The timed screens that come before any interview.' },
    { id: 'market', name: 'Market making', desc: 'Quote, trade and size against flow that may know more than you.' },
    { id: 'decide', name: 'Decisions & sizing', desc: 'When to stop, how much to bet.' },
    { id: 'estimate', name: 'Estimation', desc: 'Numbers you can’t look up, with honest error bars.' }
  ];
  function bestFor(x) {
    if (GAME[x]) return GAME[x].firms.slice();
    var k = String(x || '').toLowerCase();
    return GAMES.filter(function (g) { return g.firms.some(function (f) { return f.toLowerCase() === k || f.toLowerCase().indexOf(k) === 0; }); }).map(function (g) { return g.id; });
  }
  root.SBT_ARCADE = {
    version: '2.0',
    games: GAMES.map(function (g) { return { id: g.id, name: g.name, desc: g.desc, skills: g.skills.slice(), firms: g.firms.slice(), why: g.why, href: '#arcade/' + g.id, variants: g.variants.map(function (v) { return { id: v.id, name: v.name, href: '#arcade/' + g.id + '/' + v.id }; }) }; }),
    bestFor: bestFor,
    _engine: ENGINE
  };

  /* ================================================================== */
  /* Plugin UI                                                           */
  /* ================================================================== */
  (root.SBT_PLUGINS = root.SBT_PLUGINS || []).push(function (core) {
    var esc = core.esc, $ = core.$, $all = core.$all, svg = core.svg, ICONS = core.ICONS;
    var E = ENGINE;
    var IC = {
      arcade: ICONS.joystick || svg('<rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 10.5v4M5 12.5h4"/><circle cx="15.5" cy="11.5" r="1" fill="currentColor"/><circle cx="18" cy="13.8" r="1" fill="currentColor"/>'),
      mania: svg('<path d="M5 5h5M7.5 2.5v5M14 5h5M5 16.5l5 5M10 16.5l-5 5M14 17h5M14 21h5"/>'),
      eighty: svg('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 1.5M9 2h6M19 6l1.5-1.5"/>'),
      sequences: svg('<circle cx="4" cy="17" r="1.6" fill="currentColor"/><circle cx="9" cy="13" r="1.6" fill="currentColor"/><circle cx="14" cy="10" r="1.6" fill="currentColor"/><path d="M18 4v4M16 6h4"/><path d="M4 17l5-4 5-3" stroke-dasharray="2 2"/>'),
      spread: svg('<path d="M4 8h10M10 4l4 4-4 4M20 16H10M14 12l-4 4 4 4"/>'),
      options: svg('<path d="M3 20h18M3 20c6 0 9-3 11-8s3-8 7-8"/><path d="M3 15h7" stroke-dasharray="2 2"/>'),
      cards: svg('<rect x="3" y="5" width="11" height="15" rx="2"/><path d="M10 3.5h7a2 2 0 0 1 2 2V17"/><path d="M8.5 10.5l-2 2.2 2 2.2 2-2.2z" fill="currentColor"/>'),
      dice: ICONS.die,
      etf: svg('<path d="M12 3 3 8l9 5 9-5z"/><path d="M3 13l9 5 9-5"/><path d="M3 17.5 12 22l9-4.5"/>'),
      balloon: svg('<path d="M12 2a6.5 7.5 0 0 0-6.5 7.5c0 4.2 3.6 7.5 6.5 8 2.9-.5 6.5-3.8 6.5-8A6.5 7.5 0 0 0 12 2z"/><path d="M12 17.5l-1 1.5h2zM12 19c0 1.5-1.5 2-1 3"/>'),
      kelly: svg('<path d="M3 20h18"/><path d="M4 17l4-5 3 2 4-6 5 3"/><circle cx="20" cy="11" r="1.4" fill="currentColor"/>'),
      fermi: ICONS.globe,
      daily: svg('<rect x="3" y="4" width="18" height="17" rx="3"/><path d="M8 2v4M16 2v4M3 9h18"/><path d="M12 12.5v4l2.5 1.5"/>'),
      trophy: svg('<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>'),
      copy: svg('<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>'),
      ghost: svg('<path d="M5 21V10a7 7 0 0 1 14 0v11l-2.5-2-2.3 2-2.2-2-2.2 2-2.3-2z"/><circle cx="9.5" cy="10.5" r="1" fill="currentColor"/><circle cx="14.5" cy="10.5" r="1" fill="currentColor"/>'),
      pause: svg('<path d="M9 5v14M15 5v14"/>'),
      // Fermi category icons
      count: ICONS.grid, geo: svg('<path d="M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/>'),
      space: svg('<circle cx="12" cy="12" r="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-20 12 12)"/>'),
      phys: svg('<circle cx="12" cy="12" r="1.6" fill="currentColor"/><ellipse cx="12" cy="12" rx="10" ry="4"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)"/>'),
      bio: svg('<path d="M20.4 4.6a5.4 5.4 0 0 0-7.6 0L12 5.4l-.8-.8a5.4 5.4 0 0 0-7.6 7.6L12 20.6l8.4-8.4a5.4 5.4 0 0 0 0-7.6z"/>'),
      fin: ICONS.coins, time: svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'), tech: ICONS.code,
      life: svg('<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/>')
    };
    if (!core.ICONS.arcade) core.ICONS.arcade = IC.arcade;
    core.TAB_OF.arcade = 'train';
    core.TITLES.arcade = 'Arcade';

    /* ---------------- state ---------------- */
    var HIST_CAP = 200, TL_KEEP = 20;
    function A() {
      var S = core.S;
      if (!core.isPlainObj(S.arcade)) S.arcade = {};
      var a = S.arcade;
      if (!core.isPlainObj(a.runs)) a.runs = {};
      if (!core.isPlainObj(a.prefs)) a.prefs = {};
      if (!core.isPlainObj(a.last)) a.last = {};
      if (!a.v) a.v = 1;
      return a;
    }
    function prefs(g) { var p = A().prefs; if (!core.isPlainObj(p[g])) p[g] = {}; return p[g]; }
    function gpref(k, d) { var p = A().prefs; return p[k] === undefined ? d : p[k]; }
    function keyOf(g, rv) { return g + '/' + rv; }
    function runsOf(key) { var l = A().runs[key]; return Array.isArray(l) ? l.filter(function (r) { return r && isFinite(r.score); }) : []; }
    function runsOfGame(g) { var out = [], R = A().runs; Object.keys(R).forEach(function (k) { if (k.split('/')[0] === g && Array.isArray(R[k])) out = out.concat(R[k]); }); return out.sort(function (a, b) { return a.t - b.t; }); }
    function pbRun(key) { var t = E.pbTable(runsOf(key)); return t[0] || null; }
    function newId() { return Date.now().toString(36) + '-' + Math.floor(Math.random() * 1679616).toString(36); }
    function newSeed() { var a = new Uint32Array(1); try { (root.crypto || root.msCrypto).getRandomValues(a); return a[0] >>> 0; } catch (e) { return Math.floor(Math.random() * 4294967296) >>> 0; } }
    function markActivity() {
      if (typeof core.markDay === 'function') core.markDay();
      else { var S = core.S, k = core.today(); if (!core.isPlainObj(S.days)) S.days = {}; S.days[k] = (S.days[k] || 0) + 1; }
    }
    function trimList(list) {
      list.sort(function (a, b) { return a.t - b.t; });
      if (list.length > HIST_CAP) list.splice(0, list.length - HIST_CAP);
      // Ghost timelines are kept only for the PB and the most recent runs (storage budget).
      var pb = E.pbTable(list)[0];
      for (var i = 0; i < list.length - TL_KEEP; i++) if (list[i].tl && list[i] !== pb) delete list[i].tl;
      return list;
    }
    function saveRun(run) {
      var R = A().runs, key = keyOf(run.g, run.v);
      if (!Array.isArray(R[key])) R[key] = [];
      R[key].push(run);
      trimList(R[key]);
      markActivity();
      core.save();
    }
    function lastPlayed(g) { var r = runsOfGame(g); return r.length ? r[r.length - 1] : null; }

    /* ---------------- formatting ---------------- */
    function num(x, dp) { if (x === null || x === undefined || !isFinite(x)) return '—'; var s = E.fmtNum(x, dp == null ? 2 : dp); return s.charAt(0) === '-' ? '−' + s.slice(1) : s; }
    function signed(x, dp) { if (!isFinite(x)) return '—'; var v = E.round(x, dp == null ? 2 : dp); return (v > 0 ? '+' : v < 0 ? '−' : '') + E.fmtNum(Math.abs(v), dp == null ? 2 : dp); }
    function money(x) { return (x < 0 ? '−$' : '$') + Math.abs(x).toFixed(2); }
    function dur(sec) { sec = Math.round(sec || 0); return sec >= 60 ? Math.floor(sec / 60) + 'm ' + core.pad2(sec % 60) + 's' : sec + 's'; }
    function shortDate(d) { try { var p = core.parseYmd(d); return p.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + (d.slice(0, 4) !== core.today().slice(0, 4) ? ' ' + d.slice(0, 4) : ''); } catch (e) { return d; } }
    function ago(d) { var n = E.daysBetween(d, core.today()); return n <= 0 ? 'today' : n === 1 ? 'yesterday' : n + ' days ago'; }
    function parseNum(s) {
      s = String(s == null ? '' : s).trim().replace(/−/g, '-').replace(/,/g, '').replace(/\s+/g, '');
      if (!/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return null;
      var v = parseFloat(s); return isFinite(v) ? v : null;
    }
    function reducedMotion() { return !!(root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches); }
    function useKeypad() { var k = gpref('keypad', 'auto'); return k === 'on' || (k === 'auto' && !core.hoverDevice()); }
    function sparkline(values, w, h, label) {
      w = w || 300; h = h || 56;
      if (!values.length) return '<p class="muted small">No runs yet.</p>';
      var max = Math.max.apply(null, values), min = Math.min.apply(null, values);
      if (max === min) { max += 1; min -= 1; }
      var n = values.length, padY = 6;
      var pts = values.map(function (v, i) { return [n === 1 ? w / 2 : (i * (w - 8) / (n - 1)) + 4, h - padY - (v - min) / (max - min) * (h - 2 * padY)]; });
      var line = pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ');
      var area = 'M' + pts[0][0].toFixed(1) + ',' + h + ' L' + line.replace(/ /g, ' L') + ' L' + pts[n - 1][0].toFixed(1) + ',' + h + ' Z';
      var last = pts[n - 1];
      return '<svg class="spark" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" role="img" aria-label="' + esc(label || 'Trend') + '">' +
        '<path class="area" d="' + area + '"/><polyline class="line" points="' + line + '" vector-effect="non-scaling-stroke"/><circle class="dot" cx="' + last[0].toFixed(1) + '" cy="' + last[1].toFixed(1) + '" r="3"/></svg>';
    }
    function copyText(txt, okMsg) {
      function fallback() {
        var ta = document.createElement('textarea'); ta.value = txt; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        var ok = false; try { ok = document.execCommand('copy'); } catch (e) { }
        ta.remove(); core.toast(ok ? (okMsg || 'Copied.') : 'Copy failed — select the text and copy it manually.');
      }
      try { if (navigator.clipboard && root.isSecureContext) { navigator.clipboard.writeText(txt).then(function () { core.toast(okMsg || 'Copied.'); }, fallback); return; } } catch (e) { }
      fallback();
    }

    /* ---------------- confetti (canvas, respects reduced motion) ---------------- */
    function confetti(power) {
      if (reducedMotion() || gpref('confetti', true) === false) return;
      var cv = document.createElement('canvas'), dpr = Math.min(2, root.devicePixelRatio || 1);
      cv.className = 'ar-confetti'; cv.setAttribute('aria-hidden', 'true');
      var W = root.innerWidth, H = root.innerHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      document.body.appendChild(cv);
      var ctx = cv.getContext('2d'); if (!ctx) { cv.remove(); return; }
      ctx.scale(dpr, dpr);
      var cs = getComputedStyle(document.documentElement);
      var cols = ['--accent', '--ok', '--warn', '--c-combinatorics', '--c-fermi', '--c-statistics', '--c-python'].map(function (v) { return cs.getPropertyValue(v).trim() || '#6366f1'; });
      var n = Math.round(90 * (power || 1)), parts = [];
      for (var i = 0; i < n; i++) {
        var fromLeft = i % 2 === 0;
        parts.push({ x: fromLeft ? -10 : W + 10, y: H * (0.55 + Math.random() * 0.2), vx: (fromLeft ? 1 : -1) * (4 + Math.random() * 7), vy: -(7 + Math.random() * 8),
          w: 5 + Math.random() * 5, h: 3 + Math.random() * 4, r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.3, c: cols[i % cols.length] });
      }
      var t0 = performance.now(), D = 2400;
      function frame(now) {
        var t = now - t0;
        ctx.clearRect(0, 0, W, H);
        ctx.globalAlpha = t > D - 600 ? Math.max(0, (D - t) / 600) : 1;
        parts.forEach(function (p) {
          p.vy += 0.22; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
        });
        if (t < D && document.body.contains(cv)) requestAnimationFrame(frame); else cv.remove();
      }
      requestAnimationFrame(frame);
    }

    /* ---------------- numeric input + on-screen keypad ---------------- */
    function numField(id, o) {
      o = o || {};
      var kp = useKeypad() && !o.noKeypad;
      var keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', o.noMinus ? '' : '−', '0', '.'];
      return '<div class="ar-num' + (o.cls ? ' ' + o.cls : '') + '">' +
        (o.label ? '<label class="label" for="' + id + '">' + o.label + '</label>' : '<label class="sr-only" for="' + id + '">' + esc(o.aria || 'Answer') + '</label>') +
        '<input id="' + id + '" class="ar-input' + (o.small ? ' sm' : '') + '" type="text" inputmode="' + (o.mode || 'decimal') + '" enterkeyhint="' + (o.enter || 'done') + '" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false"' + (o.ph ? ' placeholder="' + esc(o.ph) + '"' : '') + (kp ? ' readonly data-kp="1"' : '') + '>' +
        (kp ? '<div class="ar-keypad" data-for="' + id + '">' + keys.map(function (k) { return k ? '<button type="button" data-k="' + k + '">' + k + '</button>' : '<span></span>'; }).join('') +
          '<button type="button" data-k="del" aria-label="Delete">⌫</button>' + (o.enterKey ? '<button type="button" data-k="enter" class="go">' + esc(o.enterKey) + '</button>' : '') + (o.extraKey ? '<button type="button" data-k="extra">' + esc(o.extraKey) + '</button>' : '') + '</div>' : '') +
        '</div>';
    }
    function bindNum(root, id, onInput, onEnter, onExtra) {
      var el = $('#' + id, root);
      var kp = $('.ar-keypad[data-for="' + id + '"]', root);
      el.addEventListener('input', function () { onInput && onInput(el.value); });
      el.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); onEnter && onEnter(el.value); } });
      if (kp) kp.addEventListener('click', function (e) {
        var b = e.target.closest('button'); if (!b) return;
        var k = b.getAttribute('data-k');
        if (k === 'enter') { onEnter && onEnter(el.value); return; }
        if (k === 'extra') { onExtra && onExtra(); return; }
        if (k === 'del') el.value = el.value.slice(0, -1); else el.value += k;
        el.dispatchEvent(new Event('input'));
      });
      return {
        el: el, get value() { return el.value; },
        clear: function () { el.value = ''; },
        focus: function () { if (!el.hasAttribute('readonly')) { try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } } },
        flash: function (cls) { el.classList.remove('ok', 'bad'); void el.offsetWidth; el.classList.add(cls); setTimeout(function () { el.classList.remove(cls); }, 220); }
      };
    }

    /* ================================================================== */
    /* The shared game shell                                               */
    /* ================================================================== */
    var CH = null;   // active challenge {g, v, seed, score}
    function Shell(main, o) {
      var g = GAME[o.g];
      var sh = { o: o, score: 0, tl: [], ended: false, running: false, paused: false, acc: 0, t0: 0, roundStart: 0, roundLimit: null, roundExpired: false, onRoundExpire: null, timers: [], keyFn: null, startedAt: Date.now() };
      var ghost = o.ghost && o.ghost.tl && o.ghost.tl.length ? o.ghost : null;
      var chal = o.challenge;
      core.setCtl(null);
      main.innerHTML = '<div class="ar-stage" style="--gc:' + g.color + '">' +
        '<div class="ar-head">' +
        '<div class="ar-score"><span class="ar-k">' + esc(o.scoreLabel || 'Score') + '</span><b id="arScore">' + esc(o.scoreText ? o.scoreText(0) : '0') + '</b></div>' +
        '<div class="ar-title"><b>' + esc(o.title || g.name) + '</b><small id="arSub">' + esc(o.sub || '') + '</small></div>' +
        '<div class="ar-timer' + (o.limit ? '' : ' txt') + '" id="arTimer" aria-live="off">' + (o.limit ? core.fmtTime(o.limit) : esc(typeof o.rightText === 'function' ? o.rightText() : (o.rightText || ''))) + '</div></div>' +
        '<div class="ar-bar' + (o.limit || o.rounds ? '' : ' hidden') + '" id="arBar"><div></div></div>' +
        (ghost ? '<div class="ar-ghost" id="arGhost"><span class="gi">' + IC.ghost + '</span><div class="gtrack"><i class="you"></i><i class="pb"></i></div><span class="gtxt" id="arGhostTxt">PB pace</span></div>' : '') +
        (chal ? '<div class="ar-chal small">Challenge: beat <b>' + esc(fmtScore(o.g, chal.score)) + '</b> on seed ' + chal.seed + '</div>' : '') +
        '<div class="ar-body" id="arBody"></div>' +
        '<div class="ar-foot">' + (o.noSubmit ? '' : '<button type="button" class="btn sm" id="arSubmit">' + ICONS.check + ' Submit &amp; exit</button>') +
        '<button type="button" class="btn sm ghost" id="arQuit">Quit</button><span class="spacer"></span><span class="muted small mono" title="Seed (shareable as a challenge code at the end)">#' + o.seed + '</span></div>' +
        '<div class="ar-ov" id="arOv"></div></div>';
      sh.stage = $('.ar-stage', main); sh.body = $('#arBody', main);
      var ov = $('#arOv', main), timerEl = $('#arTimer', main), barEl = $('#arBar', main), scoreEl = $('#arScore', main);
      sh.$ = function (sel) { return $(sel, sh.stage); };

      sh.elapsed = function () { return sh.acc + (sh.running ? Date.now() - sh.t0 : 0); };
      sh.setScore = function (v, noTl) {
        sh.score = v;
        scoreEl.textContent = o.scoreText ? o.scoreText(v) : num(v);
        if (!noTl) sh.tl.push([Math.round(sh.elapsed() / 100), E.round(v, 2)]);
      };
      sh.setSub = function (t) { $('#arSub', main).textContent = t; };
      sh.setRight = function (t) { timerEl.textContent = t; timerEl.classList.remove('amber', 'red'); timerEl.classList.add('txt'); };
      sh.later = function (fn, ms) { var id = setTimeout(function () { sh.timers = sh.timers.filter(function (x) { return x !== id; }); if (!sh.ended) fn(); }, ms); sh.timers.push(id); return id; };
      sh.keys = function (fn) { sh.keyFn = fn; };
      sh.startRound = function (limitSec, onExpire) { sh.roundStart = sh.elapsed(); sh.roundLimit = limitSec; sh.roundExpired = false; sh.onRoundExpire = onExpire; barEl.classList.remove('hidden'); tick(); };
      sh.stopRound = function () { sh.roundLimit = null; sh.onRoundExpire = null; };
      sh.roundLeft = function () { return sh.roundLimit == null ? null : Math.max(0, sh.roundLimit - (sh.elapsed() - sh.roundStart) / 1000); };
      sh.left = function () { return o.limit ? Math.max(0, o.limit - sh.elapsed() / 1000) : null; };

      function setTimer(left, limit) {
        timerEl.classList.remove('txt');
        timerEl.textContent = core.fmtTime(left);
        timerEl.classList.toggle('amber', left < 10 && left >= 5);
        timerEl.classList.toggle('red', left < 5);
        barEl.firstChild.style.width = Math.max(0, Math.min(100, left / limit * 100)) + '%';
        barEl.classList.toggle('low', left < 10);
      }
      function tick() {
        if (sh.ended) return;
        if (sh.roundLimit != null) {
          var rl = sh.roundLeft();
          setTimer(rl, sh.roundLimit);
          if (rl <= 0 && !sh.roundExpired && sh.running) { sh.roundExpired = true; var f = sh.onRoundExpire; sh.onRoundExpire = null; if (f) f(); }
        } else if (o.limit) {
          var left = sh.left();
          setTimer(left, o.limit);
          if (left <= 0 && sh.running) { sh.finish(false); return; }
        } else if (o.rightText && typeof o.rightText === 'function') { timerEl.textContent = o.rightText(); }
        if (ghost && sh.running) {
          var gs = E.ghostAt(ghost.tl, sh.elapsed()), d = E.round(sh.score - gs, 2), top = Math.max(ghost.score, sh.score, 1);
          var gEl = $('#arGhost', main);
          gEl.querySelector('.you').style.width = Math.max(0, Math.min(100, sh.score / top * 100)) + '%';
          gEl.querySelector('.pb').style.left = Math.max(0, Math.min(100, gs / top * 100)) + '%';
          $('#arGhostTxt', main).textContent = (d > 0 ? '+' + num(d) : d < 0 ? '−' + num(-d) : '±0') + ' vs PB';
          gEl.classList.toggle('ahead', d > 0); gEl.classList.toggle('behind', d < 0);
        }
      }
      var iv = null;
      function pause(reason) {
        if (!sh.running || sh.ended) return;
        sh.acc += Date.now() - sh.t0; sh.running = false; sh.paused = true;
        sh.stage.classList.add('is-paused');
        ov.innerHTML = '<div class="ar-ovc"><span class="ar-ovic">' + IC.pause + '</span><h2>Paused</h2><p class="muted">' + esc(reason || 'The clock stopped while this tab was hidden.') + '</p><button type="button" class="btn primary" id="arResume">Resume <span class="kbd">Enter</span></button></div>';
        ov.classList.add('show');
        $('#arResume', main).addEventListener('click', resume);
      }
      function resume() {
        if (!sh.paused || sh.ended) return;
        sh.paused = false; sh.running = true; sh.t0 = Date.now();
        sh.stage.classList.remove('is-paused');
        ov.classList.remove('show'); ov.innerHTML = '';
        if (o.onResume) o.onResume();
      }
      function onVis() {
        if (document.visibilityState === 'hidden') { if (sh.running) { pause(); sh.lurked = true; } }
        else if (sh.lurked) { sh.lurked = false; core.toast('No lurking — the clock paused while you were away.'); }
      }
      function onKey(e) {
        if (core.modalOpen || e.ctrlKey || e.metaKey || e.altKey || sh.ended) return;
        if (counting) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } return; }
        if (sh.paused) { if (e.key === 'Enter') { e.preventDefault(); resume(); } return; }
        if (sh.keyFn) sh.keyFn(e);
      }
      document.addEventListener('keydown', onKey);
      document.addEventListener('visibilitychange', onVis);
      function release() {
        sh.ended = true; sh.running = false;
        if (iv) clearInterval(iv); iv = null;
        sh.timers.forEach(clearTimeout); sh.timers = [];
        document.removeEventListener('keydown', onKey);
        document.removeEventListener('visibilitychange', onVis);
        if (cdTimer) clearInterval(cdTimer);
      }
      core.onCleanup(release);

      /* countdown */
      var counting = true, cdTimer = null, cdLeft = 5;
      function go() {
        if (!counting) return;
        counting = false; clearInterval(cdTimer); cdTimer = null;
        ov.classList.remove('show'); ov.innerHTML = '';
        sh.running = true; sh.t0 = Date.now(); sh.startedAt = Date.now();
        iv = setInterval(tick, 100);
        o.onStart(sh);
        tick();
      }
      ov.innerHTML = '<div class="ar-ovc ar-count"><p class="eyebrow">' + esc(o.title || g.name) + '</p><div class="ar-cd" id="arCd">5</div><p class="muted small">' + esc(o.hint || 'Get ready.') + '</p>' +
        '<button type="button" class="btn sm" id="arGo">Start now <span class="kbd">Enter</span></button></div>';
      ov.classList.add('show');
      $('#arGo', main).addEventListener('click', go);
      ov.addEventListener('click', function (e) { if (counting && !e.target.closest('button')) go(); });
      cdTimer = setInterval(function () {
        cdLeft--;
        var c = $('#arCd', main);
        if (cdLeft <= 0) { go(); return; }
        if (c) { c.textContent = cdLeft; c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); }
      }, 1000);

      $('#arQuit', main).addEventListener('click', function () { release(); core.go('#arcade/' + o.g + '/' + (o.routeV || ''), true); });
      if (!o.noSubmit) $('#arSubmit', main).addEventListener('click', function () { if (!counting) sh.finish(true); });

      /* finish → save → results */
      sh.finish = function (early) {
        if (sh.ended) return;
        var elapsed = sh.elapsed();
        release();
        var res = o.result(sh) || {};
        var run = { id: newId(), g: o.g, v: o.rv, t: Date.now(), d: core.today(), dur: Math.round(elapsed / 1000), score: E.round(res.score != null ? res.score : sh.score, 2), seed: o.seed >>> 0, set: o.settings || {} };
        if (o.tlOn) run.tl = sh.tl;
        if (res.x) run.x = res.x;
        if (early) run.early = true;
        if (chal) run.chal = chal.score;
        var key = keyOf(o.g, o.rv), before = runsOf(key);
        var prevPb = E.pbTable(before)[0] || null;
        saveRun(run);
        results(main, o, run, res, prevPb, before);
      };
      sh.release = release;
      return sh;
    }

    function fmtScore(g, v) {
      var d = GDEF[g];
      return d && d.fmt ? d.fmt(v) : num(v);
    }

    /* ---------------- results ---------------- */
    function results(main, o, run, res, prevPb, before) {
      var g = GAME[o.g], key = keyOf(o.g, o.rv), list = runsOf(key);
      var isPb = !run.early && (!prevPb || run.score > prevPb.score);
      var pct = run.early ? null : E.betterThan(list, run.score, run.id);
      var rank = E.pbTable(list).map(function (r) { return r.id; }).indexOf(run.id) + 1;
      var chalTxt = '';
      if (o.challenge) {
        var won = run.score > o.challenge.score, tie = run.score === o.challenge.score;
        chalTxt = '<div class="banner ar-chalres ' + (won ? 'won' : tie ? 'tie' : 'lost') + '"><p><b>' + (won ? 'Challenge won' : tie ? 'Challenge tied' : 'Challenge lost') + '.</b> You ' + esc(fmtScore(o.g, run.score)) + ' vs ' + esc(fmtScore(o.g, o.challenge.score)) + ' on the same seed.</p></div>';
      }
      var code = E.encodeChallenge({ g: o.g, v: o.rv, seed: run.seed, score: run.score });
      main.innerHTML =
        '<div class="card ar-result" style="--gc:' + g.color + '">' +
        '<div class="ar-rhead"><span class="ar-gic">' + IC[g.icon] + '</span><div><p class="eyebrow">' + esc(g.name) + ' · ' + esc(variantName(o.g, o.rv)) + '</p>' +
        '<div class="ar-big">' + esc(res.scoreText || fmtScore(o.g, run.score)) + '</div><p class="muted" style="margin:0">' + esc(res.scoreLabel || o.scoreLabel || 'score') + ' · ' + dur(run.dur) + '</p></div></div>' +
        '<div class="row ar-badges">' +
        (run.early ? '<span class="badge warn">Submitted early · not eligible for PB</span>' : '') +
        (isPb ? '<span class="badge ok">' + IC.trophy + ' New personal best' + (prevPb ? ' (was ' + esc(fmtScore(o.g, prevPb.score)) + ')' : '') + '</span>' : (prevPb ? '<span class="badge">PB ' + esc(fmtScore(o.g, prevPb.score)) + '</span>' : '')) +
        (pct !== null ? '<span class="badge">Better than ' + pct + '% of your runs</span>' : (!run.early ? '<span class="badge">First run of this variant</span>' : '')) +
        (rank && !run.early ? '<span class="badge">Rank #' + rank + ' of ' + E.pbTable(list).length + '</span>' : '') + '</div>' +
        chalTxt +
        '<div class="ar-details">' + (res.details || '') + '</div>' +
        '<div class="row ar-ractions"><button type="button" class="btn primary" id="arAgain">Play again <span class="kbd">Enter</span></button>' +
        (o.challenge || o.replayable !== false ? '<button type="button" class="btn" id="arSame">Replay this seed</button>' : '') +
        '<a class="btn ghost" href="#arcade/' + o.g + '/' + (o.routeV || '') + '">' + esc(g.name) + '</a><a class="btn ghost" href="#arcade">' + IC.arcade + ' Arcade</a></div>' +
        '<details class="ar-code"><summary>Challenge code <span class="muted small">— replay this exact game on your other device</span></summary>' +
        '<div class="row"><code class="mono" id="arCode">' + esc(code) + '</code><button type="button" class="btn sm" id="arCopy">' + IC.copy + ' Copy</button></div>' +
        '<p class="muted small" style="margin:.4rem 0 0">Paste it on the Arcade page. Same seed = same questions, cards, dice and flips.</p></details>' +
        '</div>' +
        '<div class="two-col">' + pbCard(o.g, o.rv, run.id) + historyCard(o.g, o.rv) + '</div>';
      bindPb(main, o.g, o.rv, run.id);
      $('#arCopy', main).addEventListener('click', function () { copyText(code, 'Challenge code copied.'); });
      function again(same) {
        if (same) CH = { g: o.g, v: o.rv, seed: run.seed, score: o.challenge ? o.challenge.score : run.score };
        startGame(main, o.g, o.routeV, same ? CH : null);
      }
      $('#arAgain', main).addEventListener('click', function () { again(false); });
      var sameBtn = $('#arSame', main); if (sameBtn) sameBtn.addEventListener('click', function () { again(true); });
      core.setCtl({ submit: function () { again(false); } });
      if (o.afterResults) o.afterResults(main, run, res);
      if (!run.early) confetti(isPb ? 1.6 : 0.8);
      try { $('#arAgain', main).focus({ preventScroll: true }); } catch (e) { }
      window.scrollTo(0, 0);
    }

    /* ---------------- PB tables & history ---------------- */
    function pbRows(g, rv, scope, hl) {
      var since = scope === '7d' ? Date.now() - 7 * 864e5 : 0;
      var t = E.pbTable(runsOf(keyOf(g, rv)), since).slice(0, 10);
      if (!t.length) return '<p class="muted small" style="margin:.6rem 0 0">' + (scope === '7d' ? 'No runs in the last 7 days.' : 'No runs yet — your best ten will show here.') + '</p>';
      return '<table class="simple ar-pbt"><thead><tr><th>#</th><th>Score</th><th>Date</th><th>Time</th></tr></thead><tbody>' +
        t.map(function (r, i) {
          return '<tr' + (r.id === hl ? ' class="hl"' : '') + '><td>' + (i < 3 ? '<span class="ar-medal m' + (i + 1) + '" title="' + ['Gold', 'Silver', 'Bronze'][i] + '">' + (i + 1) + '</span>' : (i + 1)) + '</td>' +
            '<td class="mono"><b>' + esc(fmtScore(g, r.score)) + '</b>' + (r.chal != null ? ' <span class="muted small">challenge</span>' : '') + '</td><td>' + esc(shortDate(r.d)) + '</td><td class="mono">' + dur(r.dur) + '</td></tr>';
        }).join('') + '</tbody></table>';
    }
    function pbCard(g, rv, hl) {
      return '<div class="card ar-pbcard"><div class="row"><h3 style="margin:0">Personal bests</h3><span class="spacer"></span>' +
        '<div class="seg" role="group" aria-label="Period"><button type="button" data-pbs="all" aria-pressed="true">All time</button><button type="button" data-pbs="7d" aria-pressed="false">7 days</button></div></div>' +
        '<p class="muted small" style="margin:.2rem 0 0">' + esc(variantName(g, rv)) + ' · offline leaderboard of your own runs</p>' +
        '<div class="ar-pbhost">' + pbRows(g, rv, 'all', hl) + '</div></div>';
    }
    function bindPb(rootEl, g, rv, hl) {
      $all('[data-pbs]', rootEl).forEach(function (b) {
        b.addEventListener('click', function () {
          $all('[data-pbs]', rootEl).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
          $('.ar-pbhost', rootEl).innerHTML = pbRows(g, rv, b.getAttribute('data-pbs'), hl);
        });
      });
    }
    function historyCard(g, rv) {
      var list = runsOf(keyOf(g, rv)).filter(function (r) { return !r.early; });
      var last10 = list.slice(-10), avg = last10.length ? E.mean(last10.map(function (r) { return r.score; })) : null;
      var week = list.filter(function (r) { return r.t >= Date.now() - 7 * 864e5; }).length;
      return '<div class="card"><h3 style="margin:0 0 .3rem">History</h3>' +
        '<div class="ar-mini"><div><b>' + list.length + '</b><span>runs</span></div><div><b>' + (avg === null ? '—' : esc(fmtScore(g, E.round(avg, 2)))) + '</b><span>avg last 10</span></div><div><b>' + week + '</b><span>this week</span></div></div>' +
        sparkline(list.slice(-40).map(function (r) { return r.score; }), 300, 56, 'Recent scores') + '</div>';
    }
    function variantName(g, rv) {
      var d = GDEF[g];
      if (d && d.variantLabel) return d.variantLabel(rv);
      var v = (GAME[g].variants.filter(function (x) { return x.id === rv; })[0]);
      return v ? v.name : rv;
    }

    /* ================================================================== */
    /* Game definitions                                                    */
    /* ================================================================== */
    var GDEF = {};
    function base(ctx, extra) {
      var o = { g: ctx.g, rv: ctx.rv, routeV: ctx.v, seed: ctx.seed, challenge: ctx.challenge, ghost: ctx.ghost, settings: ctx.settings || {} };
      Object.keys(extra).forEach(function (k) { o[k] = extra[k]; });
      return o;
    }
    function tiles(items) {
      return '<div class="ar-tiles">' + items.map(function (t) { return '<div class="stat-tile"><div class="v' + (t.cls ? ' ' + t.cls : '') + '">' + t.v + '</div><div class="l">' + esc(t.l) + '</div></div>'; }).join('') + '</div>';
    }
    function focusTyping(e, inp) {
      if (e.target === inp.el || inp.el.hasAttribute('readonly')) return;
      if (/^[0-9.\-−]$/.test(e.key) || e.key === 'Backspace') inp.focus();
    }
    function fmtTerm(x) { return num(E.clean(x), 6); }

    /* ---------- generic auto-accept speed game (Mania, 80-in-8 practice, Sequences, Spread & Edge) ---------- */
    function autoGame(main, ctx, spec) {
      var r = E.makeRng(ctx.seed), q = null, score = 0, correct = 0, skipped = 0, asked = 0, sh, inp, fbT = null, qShownAt = 0, times = [];
      sh = Shell(main, base(ctx, {
        title: spec.title, limit: spec.limit, tlOn: true, hint: spec.hint, scoreText: spec.scoreText, scoreLabel: spec.scoreLabel,
        onStart: function () { next(); },
        result: function () {
          var mins = Math.max(sh.elapsed(), 1) / 60000;
          return { score: score, x: { c: correct, sk: skipped, n: asked }, details: tiles([
            { v: correct, l: 'correct' }, { v: skipped, l: spec.skipCost ? 'skipped (−' + spec.skipCost + ')' : 'skipped' },
            { v: sh.elapsed() >= 10000 ? num(correct / mins, 1) : '—', l: 'per minute' }, { v: times.length ? num(E.mean(times) / 1000, 1) + 's' : '—', l: 'avg per answer' }]) + (spec.extraDetails ? spec.extraDetails(correct, skipped, asked) : '') };
        }
      }));
      sh.body.innerHTML = '<div class="ar-qwrap"><div class="ar-qn" id="qn"></div><div class="ar-q' + (spec.qClass ? ' ' + spec.qClass : '') + '" id="q" aria-live="polite">&nbsp;</div></div>' +
        numField('ans', { extraKey: spec.skip ? 'Skip' : null }) + '<div class="ar-fb" id="fb" aria-live="polite"></div>' +
        (spec.skip ? '<div class="row center"><button type="button" class="btn sm ghost" id="skipB">Skip' + (spec.skipCost ? ' (−' + spec.skipCost + ')' : '') + ' <span class="kbd">Esc</span></button></div>' : '');
      var qEl = sh.$('#q'), qnEl = sh.$('#qn'), fbEl = sh.$('#fb');
      inp = bindNum(sh.stage, 'ans', onInput, null, doSkip);
      if (spec.skip) sh.$('#skipB').addEventListener('click', doSkip);
      function feedback(html, cls) {
        fbEl.className = 'ar-fb show ' + (cls || ''); fbEl.innerHTML = html;
        if (fbT) clearTimeout(fbT);
        fbT = setTimeout(function () { fbEl.className = 'ar-fb'; }, 2600);
      }
      function next() {
        if (spec.maxQ && asked >= spec.maxQ) { sh.finish(false); return; }
        q = spec.gen(r); asked++;
        qEl.innerHTML = spec.render ? spec.render(q) : esc(q.q);
        qnEl.textContent = spec.maxQ ? 'Q' + asked + ' / ' + spec.maxQ : (spec.label ? spec.label(q) : '');
        inp.clear(); inp.focus(); qShownAt = sh.elapsed();
      }
      function onInput(v) {
        if (!sh.running || !q) return;
        var x = parseNum(v);
        if (x !== null && spec.check(x, q)) {
          correct++; score = E.round(correct - skipped * (spec.skipCost || 0), 2); times.push(sh.elapsed() - qShownAt);
          sh.setScore(score); inp.flash('ok'); next();
        }
      }
      function doSkip() {
        if (!sh.running || !spec.skip || !q) return;
        skipped++; score = E.round(correct - skipped * (spec.skipCost || 0), 2);
        if (spec.skipCost) sh.setScore(score);
        feedback(spec.reveal ? spec.reveal(q) : 'Answer: <b>' + esc(num(q.ans, 4)) + '</b>', 'info');
        next();
      }
      sh.keys(function (e) {
        if (e.key === 'Escape') { e.preventDefault(); doSkip(); return; }
        focusTyping(e, inp);
      });
      return sh;
    }

    /* ---------- generic Enter-to-submit game (Optiver sequences, Options) ---------- */
    function enterGame(main, ctx, spec) {
      var r = E.makeRng(ctx.seed), q = null, correct = 0, wrong = 0, skipped = 0, asked = 0, sh, inp, log = [];
      sh = Shell(main, base(ctx, {
        title: spec.title, limit: spec.limit, tlOn: true, hint: spec.hint, scoreLabel: spec.scoreLabel,
        onStart: function () { next(); },
        result: function () {
          return { score: correct, x: { c: correct, w: wrong, sk: skipped, n: asked }, details: tiles([
            { v: correct, l: 'correct' }, { v: wrong, l: 'wrong' }, { v: skipped, l: 'skipped' }, { v: asked ? Math.round(100 * correct / asked) + '%' : '—', l: 'accuracy' }]) +
            (spec.extraDetails ? spec.extraDetails(correct, asked) : '') + reviewList(log) };
        }
      }));
      sh.body.innerHTML = '<div class="ar-qwrap"><div class="ar-qn" id="qn"></div><div class="ar-q' + (spec.qClass ? ' ' + spec.qClass : '') + '" id="q" aria-live="polite">&nbsp;</div></div>' +
        numField('ans', { enterKey: 'Enter', extraKey: 'Skip' }) + '<div class="ar-fb" id="fb" aria-live="polite"></div>' +
        '<div class="row center"><button type="button" class="btn sm primary" id="subB">Submit <span class="kbd">Enter</span></button><button type="button" class="btn sm ghost" id="skipB">Skip <span class="kbd">Esc</span></button></div>';
      var qEl = sh.$('#q'), qnEl = sh.$('#qn'), fbEl = sh.$('#fb');
      inp = bindNum(sh.stage, 'ans', null, submit, skip);
      sh.$('#subB').addEventListener('click', function () { submit(inp.value); });
      sh.$('#skipB').addEventListener('click', skip);
      function next() {
        if (spec.maxQ && asked >= spec.maxQ) { sh.finish(false); return; }
        q = spec.gen(r); asked++;
        qEl.innerHTML = spec.render ? spec.render(q) : esc(q.q);
        qnEl.textContent = spec.maxQ ? 'Q' + asked + ' / ' + spec.maxQ : '';
        inp.clear(); inp.focus();
      }
      function show(html, cls) { fbEl.className = 'ar-fb show ' + cls; fbEl.innerHTML = html; }
      function submit(v) {
        if (!sh.running || !q) return;
        var x = parseNum(v);
        if (x === null) { inp.flash('bad'); return; }
        var ok = spec.check(x, q);
        if (ok) { correct++; sh.setScore(correct); inp.flash('ok'); } else { wrong++; inp.flash('bad'); }
        log.push({ q: q, you: x, ok: ok });
        show(spec.feedback(q, x, ok, asked), ok ? 'ok' : 'bad');
        next();
      }
      function skip() {
        if (!sh.running || !q) return;
        skipped++; log.push({ q: q, you: null, ok: false });
        show(spec.feedback(q, null, false, asked), 'info'); next();
      }
      sh.keys(function (e) {
        if (e.key === 'Escape') { e.preventDefault(); skip(); return; }
        focusTyping(e, inp);
      });
      return sh;
    }
    function reviewList(log) {
      var miss = log.filter(function (l) { return !l.ok; });
      if (!miss.length) return '';
      return '<details class="reveal ar-review"><summary>' + ICONS.book + '<span>Review the ' + miss.length + ' you missed</span><span class="chev" aria-hidden="true">▾</span></summary><div class="rbody"><table class="simple"><tbody>' +
        miss.slice(0, 40).map(function (l) {
          return '<tr><td>' + (l.q.terms ? esc(l.q.terms.map(fmtTerm).join(', ')) + ', <b>' + esc(fmtTerm(l.q.ans)) + '</b><br><span class="muted small">' + esc(l.q.rule || '') + '</span>' : esc(l.q.q) + '<br><span class="muted small">' + esc(l.q.help || '') + '</span>') + '</td>' +
            '<td class="mono">' + (l.you === null ? '<span class="muted">skipped</span>' : 'you ' + esc(num(l.you, 4))) + '<br>ans <b>' + esc(num(l.q.ans, 4)) + '</b></td></tr>';
        }).join('') + '</tbody></table></div></details>';
    }

    /* ---------- generic multiple-choice game (80-in-8 Real OA, ETF arb) ---------- */
    function choiceGame(main, ctx, spec) {
      var r = E.makeRng(ctx.seed), q = null, score = 0, correct = 0, wrong = 0, skipped = 0, asked = 0, sh, locked = false, log = [];
      sh = Shell(main, base(ctx, {
        title: spec.title, limit: spec.limit, tlOn: true, hint: spec.hint, scoreLabel: spec.scoreLabel,
        onStart: function () { next(); },
        result: function () {
          return { score: score, x: { c: correct, w: wrong, sk: skipped, n: asked }, details: tiles([
            { v: correct, l: 'correct (+1)' }, { v: wrong, l: 'wrong (−1)' }, { v: skipped, l: 'skipped (0)' }, { v: (correct + wrong) ? Math.round(100 * correct / (correct + wrong)) + '%' : '—', l: 'hit rate when answering' }]) +
            (spec.extraDetails ? spec.extraDetails(score, correct, wrong, skipped, log) : '') };
        }
      }));
      sh.body.innerHTML = '<div class="ar-qwrap"><div class="ar-qn" id="qn"></div><div class="ar-q ' + (spec.qClass || '') + '" id="q" aria-live="polite">&nbsp;</div></div>' +
        '<div class="ar-choices' + (spec.cols ? ' c' + spec.cols : '') + (spec.textOpts ? ' text' : '') + '" id="ch"></div><div class="ar-fb" id="fb" aria-live="polite"></div>' +
        '<div class="row center"><button type="button" class="btn sm ghost" id="skipB">Skip (0) <span class="kbd">S</span></button></div>';
      var qEl = sh.$('#q'), qnEl = sh.$('#qn'), chEl = sh.$('#ch'), fbEl = sh.$('#fb');
      sh.$('#skipB').addEventListener('click', function () { choose(-1); });
      chEl.addEventListener('click', function (e) { var b = e.target.closest('[data-i]'); if (b) choose(+b.getAttribute('data-i')); });
      function next() {
        if (spec.maxQ && asked >= spec.maxQ) { sh.finish(false); return; }
        q = spec.gen(r); asked++; locked = false;
        qEl.innerHTML = spec.render(q);
        qnEl.textContent = spec.maxQ ? 'Q' + asked + ' / ' + spec.maxQ : '';
        chEl.innerHTML = q.opts.map(function (t, i) { return '<button type="button" class="choice" data-i="' + i + '"><span class="letter">' + (i + 1) + '</span><span>' + t + '</span></button>'; }).join('');
      }
      function choose(i) {
        if (!sh.running || locked || !q) return;
        locked = true;
        var ok = i === q.idx;
        if (i < 0) { skipped++; } else if (ok) { correct++; score++; } else { wrong++; score--; }
        if (i >= 0) sh.setScore(score);
        log.push({ q: q, i: i, ok: ok });
        var btns = $all('.choice', chEl);
        if (i >= 0) btns[i].classList.add(ok ? 'correct' : 'wrong');
        if (!ok && btns[q.idx]) btns[q.idx].classList.add('correct');
        if (spec.feedback) { fbEl.className = 'ar-fb show ' + (i < 0 ? 'info' : ok ? 'ok' : 'bad'); fbEl.innerHTML = spec.feedback(q, i, ok); }
        sh.later(next, ok ? 160 : (spec.wrongPause || 420));
      }
      sh.keys(function (e) {
        var n = q ? q.opts.length : 4;
        if (/^[1-9]$/.test(e.key) && +e.key <= n) { e.preventDefault(); choose(+e.key - 1); }
        else if (e.key === 's' || e.key === 'S' || e.key === ' ' || e.key === '0' || e.key === 'Escape') { e.preventDefault(); choose(-1); }
      });
      return sh;
    }

    /* ---------- 1. Arithmetic Mania ---------- */
    GDEF.mania = {
      rules: ['One operation per question, chosen uniformly from + − × ÷. Whole numbers only.',
        '+ and −: both numbers from 1 to 99. Subtraction can go negative (the on-screen keypad has a − key).',
        '×: half the time 1–20 × 1–10, otherwise 20–50 × 1–6. ÷ is one of those products divided back.',
        'The answer is accepted the moment it is right — no Enter. +1 each, no penalty and no reveal.'],
      start: function (main, ctx) { autoGame(main, ctx, { title: 'Arithmetic Mania', limit: 180, gen: E.genMania, check: function (x, q) { return x === q.ans; }, hint: 'Type answers; they lock in automatically.', scoreLabel: 'correct' }); }
    };

    /* ---------- 2. 80 in 8 ---------- */
    function oaGuide(score) {
      var p = Math.max(0, Math.min(100, score / 80 * 100));
      return '<div class="ar-guide"><div class="ar-gtrack"><i class="m55" style="left:' + (55 / 80 * 100) + '%"></i><i class="m70" style="left:' + (70 / 80 * 100) + '%"></i><b style="left:' + p + '%"></b></div>' +
        '<div class="row small muted"><span>0</span><span class="spacer"></span><span>≈ 55 reported pass line</span><span>· ≈ 70 competitive</span><span class="spacer"></span><span>80</span></div>' +
        '<p class="small" style="margin:.3rem 0 0">' + (score >= 70 ? '<b class="res-ok">Competitive range.</b>' : score >= 55 ? '<b class="res-ok">Above the reported pass line.</b> Push toward 70.' : '<b class="res-bad">Below the reported pass line (≈ 55).</b> Accuracy first: a wrong answer costs as much as a right one earns, so skip when unsure.') + '</p></div>';
    }
    GDEF.eighty = {
      variantRules: {
        practice: ['80 questions or 8 minutes, whichever comes first.', '+ and −: two-decimal numbers in [1.00, 99.99]. ×: 1–99 × 1–99, or 100–999 × 1–9. ÷ divides a product back.', 'Answers lock in automatically; +1 each. Esc skips (no penalty).'],
        oa: ['The real Optiver format: 80 questions, 8 minutes, 4 options each.', 'Scoring +1 right, −1 wrong, 0 skipped — press 1–4 to answer, S (or Space) to skip.', 'Distractors are one digit off, a power of 10 off, or a nearby value. ≈ 55 is the reported pass line; ≈ 70 is competitive.']
      },
      start: function (main, ctx) {
        if (ctx.v === 'oa') {
          choiceGame(main, ctx, { title: '80 in 8 · Real OA', limit: 480, maxQ: 80, cols: 2, qClass: 'mono', scoreLabel: 'net score', hint: '1–4 answers, S skips. −1 for a wrong answer.',
            gen: function (r) { var q = E.genEighty(r), ch = E.oaChoices(r, q); return { q: q.q, ans: q.ans, opts: ch.opts.map(function (v) { return esc(q.dp ? E.fmtFixed(v, 2) : num(v, 0)); }), idx: ch.idx }; },
            render: function (q) { return esc(q.q); },
            extraDetails: function (score) { return oaGuide(score); } });
          return;
        }
        autoGame(main, ctx, { title: '80 in 8 · Practice', limit: 480, maxQ: 80, gen: E.genEighty, check: function (x, q) { return Math.abs(x - q.ans) < 1e-9; }, skip: true, scoreLabel: 'correct', hint: '80 questions or 8 minutes. Esc skips.',
          extraDetails: function (c) { return oaGuide(c); } });
      }
    };

    /* ---------- 3. Sequences ---------- */
    function seqRender(q) { return q.terms.map(function (t) { return '<span>' + esc(fmtTerm(t)) + '</span>'; }).join('<i>,</i>') + '<i>,</i><span class="qm">?</span>'; }
    GDEF.sequences = {
      variantRules: {
        std: ['5 minutes. Each question uses one generator: arithmetic, second-order, affine (m·x + c), two interleaved, geometric (×2, ×5, ×10, ×0.1, ×0.5) or Fibonacci-like (a+b, a−b, a·b).',
          'Answers are rounded to 4 decimals and accepted automatically. +1 each.', 'Skip with Esc costs −0.25 — so only skip when you’re truly stuck.'],
        optiver: ['26 questions in 30 minutes, like Optiver’s sequences test. Type an answer and press Enter.',
          'Harder generators: shifted squares and cubes, primes, alternating operations, differences of differences, triangular numbers, tribonacci, ×2 ×3 ×4…, mixed interleaves.',
          'A wrong answer moves on (no second try); skipping costs nothing. Score = correct answers.']
      },
      fmt: function (v) { return num(v, 2); },
      start: function (main, ctx) {
        if (ctx.v === 'optiver') {
          enterGame(main, ctx, { title: 'Sequences · Optiver 26 in 30', limit: 1800, maxQ: 26, gen: E.genSeqHard, check: function (x, q) { return E.seqCheck(x, q.ans); }, render: seqRender, qClass: 'seq', scoreLabel: 'correct', hint: 'Enter submits. Esc skips.',
            feedback: function (q, x, ok, n) { return 'Q' + n + ': ' + (ok ? '✓ ' : (x === null ? 'skipped — ' : '✗ you ' + esc(num(x, 4)) + ' — ')) + 'next term <b>' + esc(fmtTerm(q.ans)) + '</b> · ' + esc(q.rule); },
            extraDetails: function (c) { return '<p class="small">' + (c >= 20 ? '<b class="res-ok">Strong.</b>' : c >= 15 ? '<b>Solid.</b>' : '<b class="res-bad">Keep drilling.</b>') + ' On the real test there is no partial credit, so speed matters as much as accuracy.</p>'; } });
          return;
        }
        autoGame(main, ctx, { title: 'Number Sequences', limit: 300, gen: E.genSeq, check: function (x, q) { return E.seqCheck(x, q.ans); }, render: seqRender, qClass: 'seq', skip: true, skipCost: 0.25,
          scoreText: function (v) { return num(v, 2); }, hint: 'Type the next term. Esc skips (−0.25).',
          reveal: function (q) { return 'Next term was <b>' + esc(fmtTerm(q.ans)) + '</b> · ' + esc(q.rule); } });
      }
    };

    /* ---------- extra: Spread & Edge ---------- */
    GDEF.spread = {
      rules: ['3 minutes of quick-quote arithmetic, the kind you need inside every market-making game.',
        'Edge = size × (fair − price) when you buy, size × (price − fair) when you sell. A W-wide market centred on fair is fair ± W/2.',
        'Mark-to-market: long q from p, marked m → q·(m − p); short is the negative. Dice fair value: shown faces + 3.5 per hidden die.',
        'Answers lock in automatically. Esc skips (no penalty) and shows the working.'],
      start: function (main, ctx) {
        autoGame(main, ctx, { title: 'Spread & Edge', limit: 180, gen: E.genSpread, check: function (x, q) { return Math.abs(x - q.ans) < 1e-9; }, skip: true, scoreLabel: 'correct', hint: 'Exact answers; negatives allowed.',
          reveal: function (q) { return esc(q.help) + ' = <b>' + esc(num(q.ans, 4)) + '</b>'; } });
      }
    };

    /* ---------- extra: Options mental math ---------- */
    GDEF.options = {
      rules: ['4 minutes. Rules of thumb with r = 0: ATM call ≈ ATM put ≈ 0.4 · σ · √T · S; ATM straddle ≈ 0.8 · σ · √T · S.',
        'Put–call parity: C − P = S − K (exact here). One-day move ≈ σ / 16 on a 256-day year (√256 = 16).',
        'Approximation questions accept answers within 4% of the rule-of-thumb value (2–3% for the daily-move ones); parity must be exact. Enter submits.'],
      start: function (main, ctx) {
        enterGame(main, ctx, { title: 'Options Mental Math', limit: 240, gen: E.genOptions, check: function (x, q) { return E.optCheck(x, q); }, scoreLabel: 'correct', hint: 'Enter submits, Esc skips.',
          feedback: function (q, x, ok) { return (ok ? '✓ ' : x === null ? 'Skipped — ' : '✗ ') + esc(q.help) + ' = <b>' + esc(num(q.ans, 3)) + '</b>' + (q.tol ? ' <span class="muted">(±' + Math.round(q.tol * 100) + '%)</span>' : ''); } });
      }
    };

    /* ---------- extra: ETF arbitrage ---------- */
    var ETF_OPTS = ['Buy ETF, sell basket <small>(create-side arb: ETF too cheap)</small>', 'Sell ETF, buy basket <small>(ETF too rich)</small>', 'No arbitrage after costs'];
    GDEF.etf = {
      rules: ['3 minutes. One creation unit of the ETF = the listed quantities of each component.',
        'Buying the ETF and selling the basket earns basket bid − ETF ask − cost. Selling the ETF and buying the basket earns ETF bid − basket ask − cost.',
        'Pick the profitable side, or “no arbitrage” if neither beats the cost. +1 right, −1 wrong, S skips. Keys 1–3.'],
      start: function (main, ctx) {
        choiceGame(main, ctx, { title: 'ETF Arbitrage', limit: 180, textOpts: true, scoreLabel: 'net score', wrongPause: 1400, hint: 'Keys 1–3. Work in cents.',
          gen: function (r) { var e = E.genEtf(r); e.opts = ETF_OPTS; e.idx = e.answer; return e; },
          render: function (e) {
            return '<table class="ar-etf"><thead><tr><th>Component</th><th>Qty</th><th>Bid</th><th>Ask</th></tr></thead><tbody>' +
              e.comps.map(function (c) { return '<tr><td>' + esc(c.t) + '</td><td>' + c.q + '</td><td>' + E.cents(c.bid) + '</td><td>' + E.cents(c.ask) + '</td></tr>'; }).join('') +
              '<tr class="etf"><td><b>ETF</b> (1 unit)</td><td></td><td><b>' + E.cents(e.etfBid) + '</b></td><td><b>' + E.cents(e.etfAsk) + '</b></td></tr></tbody></table>' +
              '<p class="small muted ar-etfc">Create / redeem cost: <b>' + E.cents(e.cost) + '</b> per unit</p>';
          },
          feedback: function (e) {
            return 'Basket ' + E.cents(e.basketBid) + ' / ' + E.cents(e.basketAsk) + ' · buy-ETF arb ' + E.cents(e.basketBid - e.etfAsk - e.cost) + ' · sell-ETF arb ' + E.cents(e.etfBid - e.basketAsk - e.cost) + ' → <b>' + ['buy ETF', 'sell ETF', 'no arb'][e.answer] + '</b>';
          } });
      }
    };

    /* ---------- 4. Pump Up The Balloon ---------- */
    function balloonSvg(k, popped) {
      var s = Math.pow(1.07, k);
      if (popped) {
        var shards = '';
        for (var i = 0; i < 12; i++) { var a = i * Math.PI / 6, r1 = 14 * s, r2 = 26 * s; shards += '<line x1="' + (Math.cos(a) * r1).toFixed(1) + '" y1="' + (30 + Math.sin(a) * r1).toFixed(1) + '" x2="' + (Math.cos(a) * r2).toFixed(1) + '" y2="' + (30 + Math.sin(a) * r2).toFixed(1) + '"/>'; }
        return '<g class="pop">' + shards + '<text x="0" y="36" text-anchor="middle">POP</text></g>';
      }
      return '<g class="bal" transform="translate(0 50) scale(' + s.toFixed(4) + ') translate(0 -50)">' +
        '<path class="string" d="M0 52 C 5 64, -5 74, 2 96"/>' +
        '<ellipse class="body" cx="0" cy="28" rx="16" ry="20"/><ellipse class="shine" cx="-6" cy="19" rx="4" ry="6.5"/>' +
        '<path class="knot" d="M-3 50 L3 50 L0 46 Z"/></g>';
    }
    GDEF.balloon = {
      rules: ['30 balloons. Each has a hidden burst point B, uniform on 1–16.', 'Each pump adds +1 to the pot. If the pump count reaches B the balloon pops and the pot is lost.',
        '“Collect” banks the pot and brings the next balloon. Space pumps, Enter collects.', 'At the end you get the exact EV-optimal policy and how your stops compare.'],
      fmt: function (v) { return num(v, 0); }, ghost: false,
      start: function (main, ctx) {
        var r = E.makeRng(ctx.seed), N = 16, n = 30, bursts = E.balloonBursts(r, n, N), i = 0, k = 0, banked = 0, log = [], busy = false, sh;
        sh = Shell(main, base(ctx, { title: 'Balloon', scoreLabel: 'banked', rightText: function () { return Math.max(0, n - i) + ' left'; }, hint: 'Space pumps · Enter collects.',
          onStart: function () { draw(); },
          result: function () { return { score: banked, x: { log: log }, details: balloonDetails(log, bursts, banked) }; } }));
        sh.body.innerHTML = '<div class="ar-bwrap"><svg class="ar-balloon" viewBox="-62 -66 124 166" role="img" aria-label="Balloon" id="bsvg"></svg>' +
          '<div class="ar-pot"><span class="label">Pot</span><b id="pot">0</b></div></div>' +
          '<div class="ar-fb show info" id="fb">Balloon 1 of 30 — pump to grow the pot.</div>' +
          '<div class="ar-actions two"><button type="button" class="btn primary lg" id="pump">Pump <span class="kbd">Space</span></button><button type="button" class="btn lg" id="collect">Collect <span class="kbd">Enter</span></button></div>' +
          '<div class="ar-dots" id="dots" aria-label="Results so far"></div>';
        var svgEl = sh.$('#bsvg'), potEl = sh.$('#pot'), fb = sh.$('#fb'), dots = sh.$('#dots');
        function draw(popped) { svgEl.innerHTML = balloonSvg(k, popped); potEl.textContent = k; }
        function msg(t, cls) { fb.className = 'ar-fb show ' + cls; fb.innerHTML = t; }
        function dotsHtml() { var h = ''; for (var j = 0; j < n; j++) { var l = log[j]; h += '<i class="' + (!l ? '' : l.popped ? 'pop' : 'ok') + '" title="' + (l ? (l.popped ? 'Popped at ' + l.B : 'Banked ' + l.k + ' (burst ' + l.B + ')') : '') + '">' + (l && !l.popped ? l.k : '') + '</i>'; } return h; }
        dots.innerHTML = dotsHtml();
        function nextBalloon() {
          i++; k = 0; busy = false; sh.setRight(Math.max(0, n - i) + ' left'); dots.innerHTML = dotsHtml();
          if (i >= n) { sh.finish(false); return; }
          draw(); sh.$('#bsvg').classList.remove('popped');
        }
        function pump() {
          if (!sh.running || busy || i >= n) return;
          k++;
          if (k >= bursts[i]) {
            busy = true; log.push({ B: bursts[i], k: k, popped: true });
            draw(true); svgEl.classList.add('popped');
            msg('Burst on pump ' + bursts[i] + '. Nothing banked.', 'bad');
            sh.later(nextBalloon, 900);
          } else draw();
        }
        function collect() {
          if (!sh.running || busy || i >= n) return;
          busy = true; banked += k; sh.setScore(banked);
          log.push({ B: bursts[i], k: k, popped: false });
          msg('Banked ' + k + '. Would have burst on pump ' + bursts[i] + '.', 'ok');
          sh.later(nextBalloon, 650);
        }
        sh.$('#pump').addEventListener('click', pump);
        sh.$('#collect').addEventListener('click', collect);
        sh.keys(function (e) {
          if (e.key === ' ' || e.key === 'p' || e.key === 'P' || e.key === 'ArrowUp') { e.preventDefault(); pump(); }
          else if (e.key === 'Enter' || e.key === 'c' || e.key === 'C') { e.preventDefault(); collect(); }
        });
      }
    };
    function balloonDetails(log, bursts, banked) {
      var P = E.balloonPolicy(16), stops = log.filter(function (l) { return !l.popped; }).map(function (l) { return l.k; });
      var avg = stops.length ? E.mean(stops) : null, pops = log.filter(function (l) { return l.popped; }).length;
      var played = log.length, optSame = E.balloonReplay(bursts.slice(0, played), P.bestK);
      var maxEv = P.bestEV, bars = '', W = 300, H = 120, bw = W / 17;
      for (var k = 1; k <= 15; k++) {
        var h = P.ev[k] / maxEv * (H - 26), x = k * bw;
        bars += '<rect class="' + (k === P.bestK ? 'best' : '') + '" x="' + (x - bw * 0.36).toFixed(1) + '" y="' + (H - 16 - h).toFixed(1) + '" width="' + (bw * 0.72).toFixed(1) + '" height="' + h.toFixed(1) + '" rx="2"><title>Stop at ' + k + ': EV ' + P.ev[k].toFixed(3) + '</title></rect>' +
          '<text x="' + x.toFixed(1) + '" y="' + (H - 3) + '" text-anchor="middle">' + k + '</text>';
      }
      if (avg !== null) { var ax = avg * bw; bars += '<line class="you" x1="' + ax.toFixed(1) + '" x2="' + ax.toFixed(1) + '" y1="4" y2="' + (H - 16) + '"/><text class="you" x="' + Math.min(W - 24, Math.max(24, ax)).toFixed(1) + '" y="12" text-anchor="middle">you ' + avg.toFixed(1) + '</text>'; }
      var yourK = avg === null ? 0 : Math.round(avg);
      return tiles([{ v: banked, l: 'banked' }, { v: avg === null ? '—' : avg.toFixed(1), l: 'your average stop' }, { v: P.bestK, l: 'optimal stop' }, { v: pops, l: 'pops' }]) +
        '<div class="ar-panel"><h3>The EV-optimal policy</h3>' +
        '<p class="small">Collecting after k pumps survives only if the burst point B &gt; k, so P = (16 − k)/16 and <b>EV(k) = k(16 − k)/16</b>. It peaks at <b>k = ' + P.bestK + '</b>: EV ' + P.bestEV.toFixed(2) + ' per balloon, ' + (P.bestEV * 30).toFixed(0) + ' over 30.</p>' +
        '<svg class="ar-evbars" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="EV by stopping point">' + bars + '</svg>' +
        '<p class="small">Dynamic check (backward induction): with k in the pot, one more pump is worth (k + 1)·(15 − k)/(16 − k), which beats banking k only while k ≤ 7. So the optimal dynamic rule is the same as the best fixed rule: stop at 8. Exact value of the game: ' + P.V0.toFixed(3) + ' per balloon.</p>' +
        '<p class="small">On <b>your</b> ' + played + ' balloons, always stopping at 8 would have banked <b>' + optSame + '</b> (you banked ' + banked + '). ' +
        (avg === null ? '' : 'A fixed stop at your average (' + yourK + ') is worth ' + (P.ev[yourK] * 30).toFixed(1) + ' in expectation vs ' + (P.bestEV * 30).toFixed(0) + ' at the optimum' + (yourK < P.bestK ? ' — you are collecting too early.' : yourK > P.bestK ? ' — you are pumping too long.' : ' — spot on.')) + '</p></div>';
    }

    /* ---------- 5. Card Counting market ---------- */
    var SUITS = ['♠', '♥', '♦', '♣'];
    function cardHtml(c, faceUp, extra) {
      if (!faceUp) return '<div class="ar-card back' + (extra || '') + '" aria-label="Face-down card"><span></span></div>';
      var red = c.s === 1 || c.s === 2;
      return '<div class="ar-card' + (red ? ' red' : '') + (extra || '') + '" aria-label="' + E.cardLabel(c.v) + SUITS[c.s] + '"><b>' + E.cardLabel(c.v) + '</b><i>' + SUITS[c.s] + '</i><em>' + c.v + '</em></div>';
    }
    function qtyPicker(cur, max) {
      var h = '<div class="ar-qty" role="group" aria-label="Size">';
      for (var q = 1; q <= (max || 10); q++) h += '<button type="button" data-q="' + q + '" aria-pressed="' + (q === cur) + '">' + q + '</button>';
      return h + '</div>';
    }
    function cardCfg(v, p) {
      if (v === 'custom') { var n = E.clamp(+p.n || 4, 1, 7); return { n: n, up: E.clamp(p.up == null ? 1 : +p.up, 0, n) }; }
      return E.CARD_LEVELS[v] || E.CARD_LEVELS.medium;
    }
    GDEF.cards = {
      rules: ['20 rounds, 60 seconds each. Cards are worth 2–10, J = 11, Q = 12, K = 13, A = 14.',
        'Easy: 3 cards, 2 face-up. Medium: 1 face-up. Hard: 0. Custom: 1–7 cards, any number face-up.',
        'The shoe is NOT reshuffled between rounds, so fair = visible sum + hidden count × the mean of every card you haven’t seen. Count!',
        'The dealer makes you a market, e.g. “40 at 44”: you may sell at the bid (40) or buy at the ask (44). Width = ask − bid.',
        'Hit the bid (Sell), Pass, or lift the offer (Buy), size 1–10 (keys 1–9, 0 = 10; S / Space / B). Timeout = pass.',
        'Your edge per lot is fair − ask when you lift, bid − fair when you hit. Trade only when fair is outside the quote; pass when it is inside.',
        'Scored on EV captured — qty × your edge vs fair — out of the EV available at full size. P&L (vs the true sum) is shown too.'],
      recVariant: function (v, p) { if (v !== 'custom') return v; var c = cardCfg(v, p); return 'custom-' + c.n + 'x' + c.up; },
      fromRec: function (rv, p) { var m = /^custom-(\d)x(\d)$/.exec(rv); if (m) { p.n = +m[1]; p.up = +m[2]; return 'custom'; } return rv; },
      variantLabel: function (rv) { var m = /^custom-(\d)x(\d)$/.exec(rv); if (m) return 'Custom ' + m[1] + ' cards, ' + m[2] + ' up'; return { easy: 'Easy', medium: 'Medium', hard: 'Hard' }[rv] || rv; },
      fmt: function (v) { return signed(v, 1); }, ghost: false,
      settings: function (v, p) {
        var h = '';
        if (v === 'custom') {
          var c = cardCfg(v, p), opt = function (lo, hi, cur) { var s = ''; for (var x = lo; x <= hi; x++) s += '<option value="' + x + '"' + (x === cur ? ' selected' : '') + '>' + x + '</option>'; return s; };
          h += '<div class="ar-setrow"><label class="frow"><span class="label">Cards per round</span><select data-set="n">' + opt(1, 7, c.n) + '</select></label>' +
            '<label class="frow"><span class="label">Face-up</span><select data-set="up">' + opt(0, c.n, c.up) + '</select></label></div>';
        }
        h += '<label class="switch"><input type="checkbox" data-set="tray"' + (p.tray ? ' checked' : '') + '><span class="track" aria-hidden="true"></span><span><b>Show the discard tray</b><br><span class="muted small">Training wheels: counts of each rank already seen in this shoe.</span></span></label>';
        return h;
      },
      start: function (main, ctx) {
        var p = ctx.prefs, cfg = cardCfg(ctx.v, p), r = E.makeRng(ctx.seed);
        var rounds = E.cardRounds(r, { n: cfg.n, up: cfg.up, rounds: 20 }), i = -1, pnl = 0, evc = 0, eva = 0, qty = E.clamp(+p.qty || 5, 1, 10), log = [], phase = 'idle', sh;
        ctx.settings = { n: cfg.n, up: cfg.up, tray: !!p.tray };
        sh = Shell(main, base(ctx, { title: 'Card Counting', scoreLabel: 'P&L', scoreText: function (v) { return signed(v, 1); }, rounds: true, hint: 'S sell · Space pass · B buy · 1–0 size.',
          onStart: function () { nextRound(); },
          result: function () {
            return { score: E.round(evc, 1), scoreText: signed(evc, 1), scoreLabel: 'EV captured (P&L ' + signed(pnl, 1) + ')', x: { pnl: E.round(pnl, 2), eva: E.round(eva, 2), n: log.length },
              details: marketDetails(pnl, evc, eva, log, 'card') };
          } }));
        function nextRound() {
          i++;
          if (i >= rounds.length) { sh.finish(false); return; }
          var rd = rounds[i]; phase = 'trade';
          sh.setSub('Round ' + (i + 1) + ' / ' + rounds.length);
          sh.body.innerHTML = '<div class="ar-info small">' + (rd.reshuffled ? '<b class="res-bad">New shoe — the deck was reshuffled.</b> ' : '') + 'Shoe ' + rd.shoe + ' · ' + rd.seenBefore + ' cards seen · ' + rd.deckLeft + ' unseen</div>' +
            '<div class="ar-cards" id="cds">' + rd.cards.map(function (c, j) { return cardHtml(c, j < rd.up); }).join('') + '</div>' +
            '<div class="ar-quote"><div class="b"><span class="label">Bid</span><b>' + rd.bid + '</b></div><div class="w">' + rd.spread + ' wide</div><div class="a"><span class="label">Ask</span><b>' + rd.ask + '</b></div></div>' +
            '<div class="ar-sizerow"><span class="label">Size</span>' + qtyPicker(qty) + '</div>' +
            '<div class="ar-actions three"><button type="button" class="btn sell" data-a="sell">Sell @ ' + rd.bid + ' <span class="kbd">S</span></button><button type="button" class="btn" data-a="pass">Pass <span class="kbd">Space</span></button><button type="button" class="btn buy" data-a="buy">Buy @ ' + rd.ask + ' <span class="kbd">B</span></button></div>' +
            (p.tray ? trayHtml(rounds, i) : '') + '<div id="rep"></div>';
          $all('[data-q]', sh.body).forEach(function (b) { b.addEventListener('click', function () { setQty(+b.getAttribute('data-q')); }); });
          $all('[data-a]', sh.body).forEach(function (b) { b.addEventListener('click', function () { act(b.getAttribute('data-a')); }); });
          sh.startRound(60, function () { act('pass', true); });
        }
        function setQty(q) { qty = q; p.qty = q; $all('[data-q]', sh.body).forEach(function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-q') === q)); }); }
        function act(side, timeout) {
          if (phase !== 'trade' || !sh.running) return;
          phase = 'report'; sh.stopRound();
          var rd = rounds[i], res = E.tradeResult(side, qty, rd.bid, rd.ask, rd.fair, rd.trueV);
          pnl += res.pnl; evc += res.evc; eva += res.eva; sh.setScore(E.round(pnl, 2), true);
          log.push({ rd: rd, res: res, timeout: !!timeout });
          sh.$('#cds').innerHTML = rd.cards.map(function (c, j) { return cardHtml(c, true, j >= rd.up ? ' flip' : ''); }).join('');
          $all('[data-a]', sh.body).forEach(function (b) { b.disabled = true; if (b.getAttribute('data-a') === side) b.classList.add('chosen'); });
          sh.$('#rep').innerHTML = reportHtml(rd.trueV, rd.fair, res, timeout, rd.bid, rd.ask) + '<div class="row center"><button type="button" class="btn primary" id="nx">' + (i + 1 < rounds.length ? 'Next round' : 'See results') + ' <span class="kbd">Enter</span></button></div>';
          sh.$('#nx').addEventListener('click', nextRound);
          try { sh.$('#nx').focus({ preventScroll: true }); } catch (e) { }
        }
        sh.keys(function (e) {
          var k = e.key;
          if (phase === 'report') { if (k === 'Enter' || k === ' ') { e.preventDefault(); nextRound(); } return; }
          if (phase !== 'trade') return;
          if (/^[0-9]$/.test(k)) { e.preventDefault(); setQty(k === '0' ? 10 : +k); }
          else if (k === 's' || k === 'S') { e.preventDefault(); act('sell'); }
          else if (k === 'b' || k === 'B') { e.preventDefault(); act('buy'); }
          else if (k === ' ' || k === 'p' || k === 'P') { e.preventDefault(); act('pass'); }
        });
      }
    };
    function trayHtml(rounds, i) {
      var cnt = {}, shoe = rounds[i].shoe;
      for (var j = 0; j < i; j++) if (rounds[j].shoe === shoe) rounds[j].cards.forEach(function (c) { cnt[c.v] = (cnt[c.v] || 0) + 1; });
      var h = '<div class="ar-tray" aria-label="Discard tray"><span class="label">Seen this shoe</span><div>';
      for (var v = 2; v <= 14; v++) h += '<span><b>' + E.cardLabel(v) + '</b><i>' + (cnt[v] || 0) + '</i></span>';
      return h + '</div></div>';
    }
    function reportHtml(trueV, fair, res, timeout, bid, ask) {
      var act = res.side === 'pass' ? (timeout ? 'Timed out — pass' : 'You passed') : 'You ' + (res.side === 'buy' ? 'lifted the offer: bought ' + res.qty + ' @ ' + ask : 'hit the bid: sold ' + res.qty + ' @ ' + bid);
      var bestTxt = res.best === 'pass' ? 'no edge either side, fair was inside the quote (pass was right)' : (res.best === 'buy' ? 'lift the offer' : 'hit the bid') + ' at full size';
      return '<div class="ar-report"><div class="ar-rgrid"><div><span class="label">True</span><b>' + num(trueV) + '</b></div><div><span class="label">Fair</span><b>' + num(fair, 2) + '</b></div>' +
        '<div><span class="label">P&amp;L</span><b class="' + (res.pnl > 0 ? 'res-ok' : res.pnl < 0 ? 'res-bad' : '') + '">' + signed(res.pnl, 2) + '</b></div><div><span class="label">EV</span><b class="' + (res.evc > 0 ? 'res-ok' : res.evc < 0 ? 'res-bad' : '') + '">' + signed(res.evc, 2) + '</b></div></div>' +
        '<p class="small" style="margin:.4rem 0 0">' + esc(act) + '. Best: ' + esc(bestTxt) + ' (EV ' + num(res.eva, 2) + ').</p></div>';
    }
    function marketDetails(pnl, evc, eva, log, kind) {
      var share = eva > 0 ? Math.round(100 * Math.max(0, evc) / eva) : null;
      var rows = log.map(function (l, j) {
        var rd = l.rd, res = l.res;
        return '<tr><td>' + (j + 1) + '</td><td class="mono">' + num(rd.fair, 2) + '</td><td class="mono">' + rd.bid + ' / ' + rd.ask + '</td><td>' + (res.side === 'pass' ? '<span class="muted">pass</span>' : res.side + ' ' + res.qty) + '</td><td class="mono">' + num(kind === 'card' ? rd.trueV : rd.trueSum) + '</td><td class="mono ' + (res.pnl > 0 ? 'res-ok' : res.pnl < 0 ? 'res-bad' : '') + '">' + signed(res.pnl, 1) + '</td><td class="mono">' + signed(res.evc, 1) + '</td></tr>';
      }).join('');
      return tiles([{ v: signed(pnl, 1), l: 'P&L', cls: pnl >= 0 ? 'res-ok' : 'res-bad' }, { v: signed(evc, 1), l: 'EV captured' }, { v: num(eva, 1), l: 'EV available (size 10)' }, { v: share === null ? '—' : share + '%', l: 'of available EV' }]) +
        '<p class="small muted">EV uses fair value, so it measures decisions, not luck. P&amp;L uses the true outcome. Lifting the offer earns fair − ask per lot, hitting the bid earns bid − fair: trade only when fair sits outside the quote.</p>' +
        '<details class="reveal"><summary>' + ICONS.book + '<span>Round by round</span><span class="chev" aria-hidden="true">▾</span></summary><div class="rbody table-scroll"><table class="simple"><thead><tr><th>#</th><th>Fair</th><th>Quote</th><th>You</th><th>True</th><th>P&amp;L</th><th>EV</th></tr></thead><tbody>' + rows + '</tbody></table></div></details>';
    }

    /* ---------- 6. Dice Market Maker ---------- */
    var PIPS = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
    function dieHtml(v, shown) {
      if (!shown) return '<div class="ar-die hid" aria-label="Hidden die"><span>?</span></div>';
      var face = v === 7 ? 1 : v, pips = PIPS[face].map(function (p) { return '<circle cx="' + (12 + p[0] * 6.5) + '" cy="' + (12 + p[1] * 6.5) + '" r="2.3"/>'; }).join('');
      return '<div class="ar-die" aria-label="Die showing ' + v + '"><svg viewBox="0 0 24 24">' + pips + '</svg>' + (v === 7 ? '<em>=7</em>' : '') + '</div>';
    }
    function eventHtml(rd) {
      if (!rd.event) return '<div class="ar-event none small muted">No market event this round — fair dice (1–6).</div>';
      var ev = E.DICE_EVENTS.filter(function (x) { return x.id === rd.event; })[0];
      return '<div class="ar-event"><b>Market event: ' + esc(ev.name) + '.</b> ' + esc(ev.desc) + ' Allowed faces: ' + ev.faces.join(', ') + ' (mean ' + num(E.mean(ev.faces), 2) + ').</div>';
    }
    function diceLevel(p) { return E.DICE_LEVELS[p.level] ? p.level : 'medium'; }
    GDEF.dice = {
      rules: ['10 rounds, 60 seconds each, on the sum of 3 dice. Easy shows 2 dice, Medium 1, Hard none.',
        'Optional market events restrict the faces: high (5–6), low (1–2), tails (1 and 6), even, odd, or “ones count as 7”. fair = visible sum + hidden × mean allowed face.',
        'Take: trade the quote with size 1, 5, 10 or custom. Budget = 500 + P&L; a buy costs ask × qty, a sell risks (max sum − bid) × qty.',
        'Make: quote your own bid and ask. Orders of 5 lots arrive: informed traders know the true sum; noise traders trade if your price is within a random tolerance of fair. Watch your adverse selection.'],
      variantRules: {
        take: ['10 rounds, 60 seconds each, on the sum of 3 dice. Easy shows 2 dice, Medium 1, Hard none.',
          'Optional market events restrict the faces: high (5–6), low (1–2), tails (1 and 6), even, odd, or “ones count as 7”. fair = visible sum + hidden × mean allowed face.',
          'You are shown a market “bid at ask”. Hit the bid (sell) if fair is below it, lift the offer (buy) if fair is above it, otherwise pass.',
          'Size 1, 5, 10 or custom. Budget = 500 + P&L; a buy costs ask × qty, a sell risks (max sum − bid) × qty — big size on a wide range can be refused.'],
        make: ['10 rounds, 60 seconds each, on the sum of 3 dice. Easy shows 2 dice, Medium 1, Hard none.',
          'You are the market maker: say a bid and an ask, e.g. “9 at 12, 5 up” — you buy 5 at 9 and sell 5 at 12. Centre it on fair (visible sum + hidden × mean face).',
          'Width is your protection: wider when more dice are hidden, tighter when you can see more. Each order is 5 lots, up to your position limit.',
          'Being lifted (they buy your ask) leaves you short; being hit (they sell your bid) leaves you long. Ask who did it: informed traders know the true sum and only trade when it is outside your quote.',
          'That is adverse selection: if most of your fills are informed, your mid is off fair or your width is too tight. Noise traders paying your width is where the profit comes from.']
      },
      recVariant: function (v, p) { return v + '-' + diceLevel(p); },
      fromRec: function (rv, p) { var m = /^(take|make)-(easy|medium|hard)$/.exec(rv); if (m) { p.level = m[2]; return m[1]; } return rv; },
      variantLabel: function (rv) { var a = rv.split('-'); return (a[0] === 'make' ? 'Make' : 'Take') + ' · ' + (a[1] ? a[1].charAt(0).toUpperCase() + a[1].slice(1) : ''); },
      fmt: function (v) { return signed(v, 1); }, ghost: false,
      settings: function (v, p) {
        var lv = diceLevel(p), L = E.DICE_LEVELS[lv];
        return '<div class="frow"><span class="label">Difficulty</span><div class="seg" role="group" aria-label="Difficulty">' + ['easy', 'medium', 'hard'].map(function (x) { return '<button type="button" data-setv="level" data-val="' + x + '" aria-pressed="' + (x === lv) + '">' + x.charAt(0).toUpperCase() + x.slice(1) + '</button>'; }).join('') + '</div></div>' +
          (v === 'make' ? '<table class="simple ar-lvl small"><tbody><tr><td>Orders per round</td><td>' + L.orders + ' × ' + L.lots + ' lots</td></tr><tr><td>P(informed)</td><td>' + Math.round(L.pInf * 100) + '%</td></tr><tr><td>Noise tolerance</td><td>|N(0,1)| × ' + L.width + '</td></tr><tr><td>Position limit</td><td>±' + L.limit + '</td></tr></tbody></table>' : '') +
          '<label class="switch"><input type="checkbox" data-set="events"' + (p.events !== false ? ' checked' : '') + '><span class="track" aria-hidden="true"></span><span><b>Market events</b><br><span class="muted small">About 45% of rounds restrict the dice faces.</span></span></label>';
      },
      start: function (main, ctx) {
        var p = ctx.prefs, lvName = diceLevel(p), L = E.DICE_LEVELS[lvName], make = ctx.v === 'make', r = E.makeRng(ctx.seed);
        var rounds = E.diceRounds(r, lvName, p.events !== false, 10), i = -1, pnl = 0, evc = 0, eva = 0, log = [], phase = 'idle', sh, size = E.clamp(+p.size || 5, 1, 999);
        ctx.settings = { level: lvName, events: p.events !== false };
        sh = Shell(main, base(ctx, { title: make ? 'Dice · Make' : 'Dice · Take', scoreLabel: 'P&L', scoreText: function (v) { return signed(v, 1); }, rounds: true,
          hint: make ? 'Type a bid and ask, Enter to quote.' : 'S sell · Space pass · B buy.',
          onStart: function () { nextRound(); },
          result: function () {
            if (make) return { score: E.round(pnl, 1), x: makeStats(log), details: makeDetails(pnl, log) };
            return { score: E.round(pnl, 1), scoreLabel: 'P&L (EV ' + signed(evc, 1) + ')', x: { evc: E.round(evc, 2), eva: E.round(eva, 2) }, details: marketDetails(pnl, evc, eva, log, 'dice') };
          } }));
        function header(rd) {
          return eventHtml(rd) + '<div class="ar-dice">' + rd.dice.map(function (d, j) { return dieHtml(d, j < rd.visible); }).join('') + '</div>' +
            '<div class="ar-info small">Visible sum ' + E.sum(rd.dice.slice(0, rd.visible)) + ' · ' + (3 - rd.visible) + ' hidden · possible sums ' + rd.minSum + '–' + rd.maxSum + '</div>';
        }
        function nextRound() {
          i++;
          if (i >= rounds.length) { sh.finish(false); return; }
          var rd = rounds[i]; phase = 'trade';
          sh.setSub('Round ' + (i + 1) + ' / ' + rounds.length);
          if (make) renderMake(rd); else renderTake(rd);
          sh.startRound(60, function () { if (make) quoteMake(true); else take('pass', true); });
        }
        /* ----- Take ----- */
        function renderTake(rd) {
          sh.body.innerHTML = header(rd) +
            '<div class="ar-quote"><div class="b"><span class="label">Bid</span><b>' + rd.bid + '</b></div><div class="w">' + rd.spread + ' wide</div><div class="a"><span class="label">Ask</span><b>' + rd.ask + '</b></div></div>' +
            '<div class="ar-sizerow"><span class="label">Size</span><div class="ar-qty">' + [1, 5, 10].map(function (q) { return '<button type="button" data-q="' + q + '" aria-pressed="' + (q === size) + '">' + q + '</button>'; }).join('') +
            '</div><input class="ar-input sm ar-cust" id="cust" type="text" inputmode="numeric" placeholder="custom" value="' + ([1, 5, 10].indexOf(size) < 0 ? size : '') + '" aria-label="Custom size"></div>' +
            '<div class="small muted ar-budget" id="bud">Budget ' + num(500 + pnl, 1) + '</div>' +
            '<div class="ar-actions three"><button type="button" class="btn sell" data-a="sell">Sell @ ' + rd.bid + ' <span class="kbd">S</span></button><button type="button" class="btn" data-a="pass">Pass <span class="kbd">Space</span></button><button type="button" class="btn buy" data-a="buy">Buy @ ' + rd.ask + ' <span class="kbd">B</span></button></div>' +
            '<div class="ar-fb" id="fb"></div><div id="rep"></div>';
          $all('[data-q]', sh.body).forEach(function (b) { b.addEventListener('click', function () { setSize(+b.getAttribute('data-q')); sh.$('#cust').value = ''; }); });
          sh.$('#cust').addEventListener('input', function (e) { var v = parseInt(e.target.value, 10); if (v > 0) setSize(v, true); });
          $all('[data-a]', sh.body).forEach(function (b) { b.addEventListener('click', function () { take(b.getAttribute('data-a')); }); });
        }
        function setSize(q, fromCustom) { size = q; p.size = q; $all('[data-q]', sh.body).forEach(function (b) { b.setAttribute('aria-pressed', String(!fromCustom && +b.getAttribute('data-q') === q)); }); }
        function take(side, timeout) {
          if (phase !== 'trade' || !sh.running) return;
          var rd = rounds[i], budget = 500 + pnl;
          if (side !== 'pass' && !E.takeAllowed(side, size, rd, budget)) {
            var fb = sh.$('#fb'); fb.className = 'ar-fb show bad';
            fb.textContent = 'Rejected: ' + (side === 'buy' ? 'buying ' + size + ' costs ' + num(rd.ask * size) : 'selling ' + size + ' risks up to ' + num((rd.maxSum - rd.bid) * size)) + ', budget is ' + num(budget, 1) + '.';
            return;
          }
          phase = 'report'; sh.stopRound();
          var q = side === 'pass' ? 0 : size;
          var pl = side === 'buy' ? q * (rd.trueSum - rd.ask) : side === 'sell' ? q * (rd.bid - rd.trueSum) : 0;
          var ev = side === 'buy' ? q * (rd.fair - rd.ask) : side === 'sell' ? q * (rd.bid - rd.fair) : 0;
          var avail = 10 * Math.max(rd.fair - rd.ask, rd.bid - rd.fair, 0);
          var best = rd.fair - rd.ask > rd.bid - rd.fair ? (rd.fair - rd.ask > 0 ? 'buy' : 'pass') : (rd.bid - rd.fair > 0 ? 'sell' : 'pass');
          var res = { side: side, qty: q, pnl: E.clean(pl), evc: E.clean(ev), eva: E.clean(avail), best: best };
          pnl += res.pnl; evc += res.evc; eva += res.eva; sh.setScore(E.round(pnl, 2), true);
          log.push({ rd: rd, res: res });
          sh.$('.ar-dice').innerHTML = rd.dice.map(function (d) { return dieHtml(d, true); }).join('');
          $all('[data-a]', sh.body).forEach(function (b) { b.disabled = true; if (b.getAttribute('data-a') === side) b.classList.add('chosen'); });
          sh.$('#rep').innerHTML = reportHtml(rd.trueSum, rd.fair, res, timeout, rd.bid, rd.ask) + nextBtn();
          bindNext();
        }
        function nextBtn() { return '<div class="row center"><button type="button" class="btn primary" id="nx">' + (i + 1 < rounds.length ? 'Next round' : 'See results') + ' <span class="kbd">Enter</span></button></div>'; }
        function bindNext() { sh.$('#nx').addEventListener('click', nextRound); try { sh.$('#nx').focus({ preventScroll: true }); } catch (e) { } }
        /* ----- Make ----- */
        function renderMake(rd) {
          sh.body.innerHTML = header(rd) +
            '<div class="ar-make"><div class="ar-mf"><label class="label" for="mBid">Your bid</label><div class="ar-step"><button type="button" data-st="mBid" data-d="-0.5" aria-label="Bid down">−</button><input class="ar-input sm" id="mBid" type="text" inputmode="decimal" autocomplete="off"><button type="button" data-st="mBid" data-d="0.5" aria-label="Bid up">+</button></div></div>' +
            '<div class="ar-mf"><label class="label" for="mAsk">Your ask</label><div class="ar-step"><button type="button" data-st="mAsk" data-d="-0.5" aria-label="Ask down">−</button><input class="ar-input sm" id="mAsk" type="text" inputmode="decimal" autocomplete="off"><button type="button" data-st="mAsk" data-d="0.5" aria-label="Ask up">+</button></div></div></div>' +
            '<p class="small ar-helper" id="help">Quote a two-sided market on the final sum: a bid you’d buy at and an ask you’d sell at, centred on fair.</p>' +
            '<div class="row center"><button type="button" class="btn primary" id="qb">Quote <span class="kbd">Enter</span></button></div>' +
            '<div class="ar-fb" id="fb"></div><div id="rep"></div>';
          var bi = sh.$('#mBid'), ai = sh.$('#mAsk');
          function upd() {
            var b = parseNum(bi.value), a = parseNum(ai.value), h = sh.$('#help');
            if (b === null || a === null) { h.textContent = 'Quote a two-sided market on the final sum (possible ' + rd.minSum + '–' + rd.maxSum + '): a bid you’d buy at and an ask you’d sell at.'; return; }
            var err = E.makeValidate(b, a, rd.maxSum);
            h.innerHTML = err ? '<span class="res-bad">' + esc(err) + '</span>' : 'You are <b>' + num(b) + ' at ' + num(a) + ', ' + L.lots + ' up</b> — ' + num(a - b) + ' wide, mid ' + num((a + b) / 2) + '. Lifted = you sell at ' + num(a) + '; hit = you buy at ' + num(b) + '.';
          }
          bi.addEventListener('input', upd); ai.addEventListener('input', upd);
          bi.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); if (parseNum(ai.value) === null) ai.focus(); else quoteMake(); } });
          ai.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); quoteMake(); } });
          $all('[data-st]', sh.body).forEach(function (b) {
            b.addEventListener('click', function () {
              var inp = sh.$('#' + b.getAttribute('data-st')), v = parseNum(inp.value);
              if (v === null) v = Math.round(rd.fair) + (b.getAttribute('data-st') === 'mBid' ? -1 : 1);
              else v = Math.max(0, v + parseFloat(b.getAttribute('data-d')));
              inp.value = E.fmtNum(v); upd();
            });
          });
          sh.$('#qb').addEventListener('click', function () { quoteMake(); });
          if (core.hoverDevice()) bi.focus();
        }
        function quoteMake(timeout) {
          if (phase !== 'trade' || !sh.running) return;
          var rd = rounds[i], b = parseNum(sh.$('#mBid').value), a = parseNum(sh.$('#mAsk').value);
          if (!timeout) {
            var err = E.makeValidate(b, a, rd.maxSum);
            if (err) { var fb = sh.$('#fb'); fb.className = 'ar-fb show bad'; fb.textContent = err; return; }
          }
          phase = 'report'; sh.stopRound();
          $all('.ar-make input, .ar-make button, #qb', sh.body).forEach(function (x) { x.disabled = true; });
          sh.$('.ar-dice').innerHTML = rd.dice.map(function (d) { return dieHtml(d, true); }).join('');
          if (timeout) {
            log.push({ rd: rd, quoted: false });
            sh.$('#rep').innerHTML = '<div class="ar-report"><p style="margin:0"><b>Time’s up — no quote, no trades.</b> True sum ' + rd.trueSum + ', fair ' + num(rd.fair, 2) + '.</p></div>' + nextBtn();
            bindNext(); return;
          }
          var fr = E.makeFills(E.makeRng(E.deriveSeed(ctx.seed, 'flow' + i)), b, a, rd, L);
          pnl += fr.pnl; sh.setScore(E.round(pnl, 2), true);
          var mid = (a + b) / 2, err2 = Math.abs(mid - rd.fair);
          log.push({ rd: rd, quoted: true, bid: b, ask: a, fr: fr, midErr: err2 });
          var rows = fr.fills.map(function (f, j) {
            var who = f.who === 'informed' ? '<span class="badge warn">informed</span>' : '<span class="badge">noise</span>';
            var what = !f.side ? (f.who === 'informed' ? 'no edge vs your quote — passed' : 'wanted to ' + f.wanted + ', price outside tolerance ' + num(f.tol, 2) + ' — passed')
              : (f.qty ? (f.side === 'buy' ? 'lifted your ask: you sold ' : 'hit your bid: you bought ') + f.qty + ' @ ' + num(f.px) + (f.capped ? ' (capped by limit)' : '') : 'blocked by your position limit');
            return '<li style="animation-delay:' + (j * 0.25) + 's">' + who + ' <span>' + esc(what) + '</span>' + (f.qty ? '<b class="' + (f.pnl > 0 ? 'res-ok' : f.pnl < 0 ? 'res-bad' : '') + '">' + signed(f.pnl, 1) + '</b>' : '') + '</li>';
          }).join('');
          sh.$('#rep').innerHTML = '<ul class="ar-fills">' + rows + '</ul>' +
            '<div class="ar-report"><div class="ar-rgrid"><div><span class="label">True</span><b>' + rd.trueSum + '</b></div><div><span class="label">Fair</span><b>' + num(rd.fair, 2) + '</b></div>' +
            '<div><span class="label">P&amp;L</span><b class="' + (fr.pnl > 0 ? 'res-ok' : fr.pnl < 0 ? 'res-bad' : '') + '">' + signed(fr.pnl, 1) + '</b></div><div><span class="label">Position</span><b>' + (fr.pos > 0 ? '+' : '') + fr.pos + '</b></div></div>' +
            '<p class="small" style="margin:.4rem 0 0">Your mid was <b>' + num(err2, 2) + '</b> from fair on a ' + num(a - b) + '-wide market' + (err2 > (a - b) / 2 ? ' — fair was outside your quote, so informed flow picks you off.' : '.') + '</p>' +
            '<p class="small muted" style="margin:.25rem 0 0">' + esc(fillLesson(fr.fills, mid, rd.trueSum)) + '</p></div>' + nextBtn();
          bindNext();
        }
        sh.keys(function (e) {
          var k = e.key;
          if (phase === 'report') { if (k === 'Enter' || (k === ' ' && !make)) { e.preventDefault(); nextRound(); } return; }
          if (phase !== 'trade' || make) { if (make && k === 'Enter' && e.target.tagName !== 'INPUT') { e.preventDefault(); quoteMake(); } return; }
          if (e.target && e.target.id === 'cust') return;
          if (k === 's' || k === 'S') { e.preventDefault(); take('sell'); }
          else if (k === 'b' || k === 'B') { e.preventDefault(); take('buy'); }
          else if (k === ' ' || k === 'p' || k === 'P') { e.preventDefault(); take('pass'); }
        });
      }
    };
    /* rule-based "what did the fills tell you?" line for a Make round */
    function fillLesson(fills, mid, trueSum) {
      var lifted = 0, hit = 0, liftInf = 0, hitInf = 0;
      fills.forEach(function (f) {
        if (!f.qty) return;
        if (f.side === 'buy') { lifted += f.qty; if (f.who === 'informed') liftInf += f.qty; }
        else if (f.side === 'sell') { hit += f.qty; if (f.who === 'informed') hitInf += f.qty; }
      });
      if (!lifted && !hit) return 'No fills: nobody wanted your prices. Quoting wide is safe but earns nothing — tighten if you are confident in fair.';
      var s = 'You were lifted ' + lifted + ' and hit ' + hit + '. ';
      if (lifted > hit) s += 'More buyers than sellers is a signal the sum is above your mid — in a live game you would move your market up before the next order' + (trueSum > mid ? ' (and here it was: ' + trueSum + ').' : ' (this time it wasn’t — noise flow).');
      else if (hit > lifted) s += 'More sellers than buyers is a signal the sum is below your mid — in a live game you would move your market down before the next order' + (trueSum < mid ? ' (and here it was: ' + trueSum + ').' : ' (this time it wasn’t — noise flow).');
      else s += 'Balanced flow: buyers and sellers paid your width and you stayed flat — the ideal for a market maker.';
      if (liftInf + hitInf > 0) s += ' The informed lots (' + (liftInf + hitInf) + ') are the adverse selection: they only trade when you are wrong.';
      return s;
    }
    function makeStats(log) {
      var q = log.filter(function (l) { return l.quoted; }), vol = 0, inf = 0;
      q.forEach(function (l) { vol += l.fr.vol; inf += l.fr.volInf; });
      return { quoted: q.length, midErr: q.length ? E.round(E.mean(q.map(function (l) { return l.midErr; })), 3) : null, vol: vol, infPct: vol ? Math.round(100 * inf / vol) : 0 };
    }
    function makeDetails(pnl, log) {
      var st = makeStats(log);
      var rows = log.map(function (l, j) {
        if (!l.quoted) return '<tr><td>' + (j + 1) + '</td><td class="mono">' + num(l.rd.fair, 2) + '</td><td class="muted">no quote</td><td class="mono">' + l.rd.trueSum + '</td><td></td><td></td></tr>';
        var inf = l.fr.fills.filter(function (f) { return f.qty && f.who === 'informed'; }).length, noi = l.fr.fills.filter(function (f) { return f.qty && f.who === 'noise'; }).length;
        return '<tr><td>' + (j + 1) + '</td><td class="mono">' + num(l.rd.fair, 2) + '</td><td class="mono">' + num(l.bid) + ' / ' + num(l.ask) + '</td><td class="mono">' + l.rd.trueSum + '</td><td class="small">' + inf + ' inf · ' + noi + ' noise</td><td class="mono ' + (l.fr.pnl > 0 ? 'res-ok' : l.fr.pnl < 0 ? 'res-bad' : '') + '">' + signed(l.fr.pnl, 1) + '</td></tr>';
      }).join('');
      return tiles([{ v: signed(pnl, 1), l: 'P&L', cls: pnl >= 0 ? 'res-ok' : 'res-bad' }, { v: st.quoted + ' / ' + log.length, l: 'rounds quoted' },
        { v: st.midErr === null ? '—' : num(st.midErr, 2), l: 'avg |mid − fair|' }, { v: st.infPct + '%', l: 'volume from informed', cls: st.infPct > 50 ? 'res-bad' : '' }]) +
        '<p class="small">' + (st.infPct > 50 ? '<b class="res-bad">Most of your volume came from informed traders</b> — your quotes are too tight or off-centre, so you only trade when you are wrong.' : 'Informed flow was under half your volume. Profit comes from noise traders paying your spread.') +
        ' Keep the mid on fair, and widen when you can’t see the dice.</p>' +
        '<p class="small muted">Adverse selection in one line: conditional on being filled, the value has usually moved against you. After a lift ask “why did they buy?”, after a hit “why did they sell?” — and re-centre before quoting again.</p>' +
        '<details class="reveal"><summary>' + ICONS.book + '<span>Round by round</span><span class="chev" aria-hidden="true">▾</span></summary><div class="rbody table-scroll"><table class="simple"><thead><tr><th>#</th><th>Fair</th><th>You</th><th>True</th><th>Fills</th><th>P&amp;L</th></tr></thead><tbody>' + rows + '</tbody></table></div></details>';
    }

    /* ---------- 7. Fermi estimation ---------- */
    var DIFF_TXT = { 1: 'Easy', 2: 'Medium', 3: 'Hard' };
    function diffDots(d) { return '<span class="diff" aria-label="' + DIFF_TXT[d] + '">' + [1, 2, 3].map(function (i) { return '<i class="' + (i <= d ? 'on' : '') + '"></i>'; }).join('') + '</span>'; }
    function bellSvg(L, U, ans, Wpx) {
      var lL = E.log10(L), lU = E.log10(U), mu = (lL + lU) / 2, sg = Math.max(0.1, (lU - lL) / 2.5631), la = E.log10(ans);
      var x0 = Math.min(mu - 3.2 * sg, la - 0.35), x1 = Math.max(mu + 3.2 * sg, la + 0.35), W = Math.round(Math.max(280, Math.min(640, Wpx || 320))), H = Math.round(Math.max(132, Math.min(190, W * 0.36))), top = 14, base = H - 30;
      function X(v) { return 8 + (v - x0) / (x1 - x0) * (W - 16); }
      function Y(v) { var z = (v - mu) / sg; return base - Math.exp(-z * z / 2) * (base - top); }
      var d = '', band = '', n = 80;
      for (var k = 0; k <= n; k++) { var v = x0 + (x1 - x0) * k / n; d += (k ? ' L' : 'M') + X(v).toFixed(1) + ' ' + Y(v).toFixed(1); }
      band = 'M' + X(lL).toFixed(1) + ' ' + base;
      for (var j = 0; j <= 40; j++) { var vb = lL + (lU - lL) * j / 40; band += ' L' + X(vb).toFixed(1) + ' ' + Y(vb).toFixed(1); }
      band += ' L' + X(lU).toFixed(1) + ' ' + base + ' Z';
      var hit = ans >= L && ans <= U, ax = X(la);
      var lx = X(lL), ux = X(lU), close = Math.abs(ux - lx) < 56;
      return '<svg class="ar-bell" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Your 80% range on a log scale with the answer marked">' +
        '<line class="axis" x1="4" x2="' + (W - 4) + '" y1="' + base + '" y2="' + base + '"/>' +
        '<path class="band" d="' + band + '"/><path class="curve" d="' + d + '"/>' +
        '<line class="edge" x1="' + lx.toFixed(1) + '" x2="' + lx.toFixed(1) + '" y1="' + base + '" y2="' + (base + 5) + '"/><line class="edge" x1="' + ux.toFixed(1) + '" x2="' + ux.toFixed(1) + '" y1="' + base + '" y2="' + (base + 5) + '"/>' +
        '<text class="tick" x="' + lx.toFixed(1) + '" y="' + (base + 16) + '" text-anchor="' + (close ? 'end' : 'middle') + '">' + esc(E.sci(L)) + '</text>' +
        '<text class="tick" x="' + ux.toFixed(1) + '" y="' + (base + 16) + '" text-anchor="' + (close ? 'start' : 'middle') + '">' + esc(E.sci(U)) + '</text>' +
        '<line class="ans ' + (hit ? 'hit' : 'miss') + '" x1="' + ax.toFixed(1) + '" x2="' + ax.toFixed(1) + '" y1="' + (top - 6) + '" y2="' + base + '"/>' +
        '<text class="anst ' + (hit ? 'hit' : 'miss') + '" x="' + Math.max(30, Math.min(W - 30, ax)).toFixed(1) + '" y="' + (top - 7 < 8 ? 9 : top - 7) + '" text-anchor="middle">' + esc(E.sci(ans)) + '</text>' +
        '<text class="tick muted" x="' + (W - 6) + '" y="' + (H - 2) + '" text-anchor="end">log scale · shaded = your 80%</text></svg>';
    }
    function fermiCalibration(lastN) {
      var rounds = [];
      runsOfGame('fermi').forEach(function (r) { ((r.x && r.x.rounds) || []).forEach(function (q) { if (q.L) rounds.push(q); }); });
      rounds = rounds.slice(-(lastN || 20));
      var hits = rounds.filter(function (q) { return q.hit; }).length;
      return { n: rounds.length, hits: hits, rate: rounds.length ? hits / rounds.length : null };
    }
    function calHtml(c) {
      if (!c.n) return '<p class="muted small">No calibrated rounds yet.</p>';
      var pct = Math.round(c.rate * 100), cls = pct < 50 ? 'res-bad' : pct >= 70 && pct <= 90 ? 'res-ok' : '';
      return '<div class="ar-cal"><div class="ar-caltrack"><i class="t80" style="left:80%"></i><b style="width:' + pct + '%"></b></div>' +
        '<p class="small" style="margin:.35rem 0 0"><b class="' + cls + '">' + pct + '%</b> of your last ' + c.n + ' answers fell inside your 80% range (' + c.hits + '/' + c.n + '). ' +
        (pct < 60 ? 'You are overconfident: widen your ranges.' : pct > 92 && c.n >= 10 ? 'Ranges may be too wide: you could tighten them and score more.' : 'Close to the 80% target.') + '</p></div>';
    }
    var FERMI_CHIPS = [['k', 'k'], ['M', 'm'], ['B', 'b'], ['T', 't'], ['×10^', 'x10^'], ['e', 'e']];
    GDEF.fermi = {
      rules: ['10 questions. Easy 60 s, Medium 45 s, Hard 30 s each (Mixed uses each question’s level).',
        'Give an 80% interval: a low end you’re 90% sure the answer is above, a high end you’re 90% sure it’s below. Formats: 2e6, 3x10^5, 10^9, 40k, 1.2m, 3b, 1,000,000.',
        'Scoring in log10: μ = centre, σ = max(0.1, width / 2.5631). Accuracy = 100·(ln(1.5/σ) − z²/2)/ln 15, clamped to ±100. Speed bonus up to +20 when accuracy is positive.',
        'Tight and right scores most; a confident miss costs a lot. Aim to catch 8 out of 10.'],
      fmt: function (v) { return num(v, 0); }, ghost: false,
      start: function (main, ctx) {
        var r = E.makeRng(ctx.seed), level = ctx.v, qs = E.fermiPick(r, level, 10), i = -1, total = 0, rounds = [], phase = 'idle', sh, limit = 60, lastField = 'fL';
        sh = Shell(main, base(ctx, { title: 'Fermi Estimation', scoreLabel: 'points', rounds: true, hint: 'Two numbers: your 10th and 90th percentile.',
          onStart: function () { next(); },
          result: function () {
            var hits = rounds.filter(function (q) { return q.hit; }).length, cal = fermiCalibration(20);
            return { score: total, x: { rounds: rounds, hits: hits }, details:
              tiles([{ v: total, l: 'points' }, { v: hits + ' / ' + rounds.length, l: 'hit rate (80% target)', cls: rounds.length && hits / rounds.length < 0.5 ? 'res-bad' : '' },
                { v: rounds.length ? Math.round(E.mean(rounds.map(function (q) { return q.acc; }))) : '—', l: 'avg accuracy' }, { v: rounds.filter(function (q) { return q.L; }).length ? '×' + num(Math.pow(10, E.mean(rounds.filter(function (q) { return q.L; }).map(function (q) { return E.log10(q.U / q.L); }))), 1) : '—', l: 'avg range width (U/L)' }]) +
              '<div class="ar-panel"><h3>Calibration · last 20 rounds</h3>' + calHtml(cal) + '</div>' + fermiTable(rounds) };
          } }));
        function next() {
          i++;
          if (i >= qs.length) { sh.finish(false); return; }
          var q = qs[i]; phase = 'ask';
          limit = level === 'mixed' ? E.FERMI_LIMIT[q.d] : E.FERMI_LEVEL_LIMIT[level];
          sh.setSub('Question ' + (i + 1) + ' / ' + qs.length);
          sh.body.innerHTML = '<div class="ar-fq"><div class="ar-fqh"><span class="ticon" style="--cat: var(--c-fermi)">' + (IC[q.cat] || IC.fermi) + '</span><div><div class="small muted">Q' + (i + 1) + ' · ' + diffDots(q.d) + ' ' + DIFF_TXT[q.d] + ' · ' + limit + ' s</div>' +
            '<p class="ar-fqt">' + esc(q.q) + '</p><p class="small muted" style="margin:0">Unit: <b>' + esc(q.unit) + '</b></p></div></div>' +
            '<div class="ar-range">' + numField('fL', { noKeypad: true, label: 'Low (10th pct)', ph: 'e.g. 2e6', enter: 'next', mode: 'text' }) + numField('fU', { noKeypad: true, label: 'High (90th pct)', ph: 'e.g. 3x10^7', enter: 'go', mode: 'text' }) + '</div>' +
            '<div class="ar-chips" role="group" aria-label="Insert a suffix">' + FERMI_CHIPS.map(function (c) { return '<button type="button" class="chip" data-chip="' + c[1] + '">' + c[0] + '</button>'; }).join('') + '</div>' +
            '<p class="small ar-preview" id="pv">&nbsp;</p>' +
            '<div class="row center"><button type="button" class="btn primary" id="fGo">Lock in <span class="kbd">Enter</span></button></div></div><div id="fres"></div>';
          var fL = sh.$('#fL'), fU = sh.$('#fU');
          [fL, fU].forEach(function (el) {
            el.addEventListener('focus', function () { lastField = el.id; });
            el.addEventListener('input', preview);
            el.addEventListener('keydown', function (e) {
              if (e.key !== 'Enter') return;
              e.preventDefault(); e.stopPropagation();
              if (el === fL && !fU.value.trim()) fU.focus(); else submit(false);
            });
          });
          $all('[data-chip]', sh.body).forEach(function (b) {
            b.addEventListener('click', function () { var el = sh.$('#' + lastField); el.value += b.getAttribute('data-chip'); el.focus(); preview(); });
          });
          sh.$('#fGo').addEventListener('click', function () { submit(false); });
          if (core.hoverDevice()) fL.focus();
          sh.startRound(limit, function () { submit(true); });
        }
        function vals() { return [E.parseQty(sh.$('#fL').value), E.parseQty(sh.$('#fU').value)]; }
        function preview() {
          var v = vals(), pv = sh.$('#pv');
          if (v[0] === null && v[1] === null) { pv.innerHTML = '&nbsp;'; return; }
          var err = E.fermiValidate(v[0], v[1]);
          if (err) { pv.innerHTML = '<span class="muted">' + (v[0] !== null ? '= ' + esc(E.inWords(v[0])) : '…') + ' to ' + (v[1] !== null ? esc(E.inWords(v[1])) : '…') + '</span> · <span class="res-bad">' + esc(err) + '</span>'; return; }
          var p = E.fermiPreview(v[0], v[1]);
          pv.innerHTML = '<span class="muted">' + esc(E.inWords(v[0])) + ' to ' + esc(E.inWords(v[1])) + '</span> · <b>' + signed(p.centre, 0) + '</b> if dead centre, <b>' + signed(p.edge, 0) + '</b> at either end';
        }
        function submit(timeout) {
          if (phase !== 'ask' || !sh.running) return;
          var q = qs[i], v = vals(), err = E.fermiValidate(v[0], v[1]);
          if (err && !timeout) { sh.$('#pv').innerHTML = '<span class="res-bad">' + esc(err) + '</span>'; return; }
          phase = 'result';
          var left = timeout ? 0 : sh.roundLeft(); sh.stopRound();
          var rec = { id: q.id, a: q.a, L: null, U: null, hit: false, acc: 0, spd: 0 }, sc = null;
          if (!err) { sc = E.fermiScore(v[0], v[1], q.a, left, limit); rec = { id: q.id, a: q.a, L: v[0], U: v[1], hit: sc.hit, acc: sc.acc, spd: sc.speed, z: E.round(sc.z, 2) }; }
          rounds.push(rec); total += rec.acc + rec.spd; sh.setScore(total, true);
          $all('.ar-fq input, .ar-fq button', sh.body).forEach(function (x) { x.disabled = true; });
          var line = !sc ? '<b class="res-bad">Time’s up — no valid range, 0 points.</b>'
            : (sc.hit ? '<b class="res-ok">Inside your range.</b> ' : '<b class="res-bad">Missed.</b> ') + 'z = ' + (sc.z >= 0 ? '+' : '−') + num(Math.abs(sc.z), 2) + 'σ · accuracy <b>' + signed(sc.acc, 0) + '</b> · speed <b>+' + sc.speed + '</b>' + (timeout ? ' <span class="muted">(auto-submitted at the buzzer)</span>' : '');
          sh.$('#fres').innerHTML = '<div class="ar-fresult">' + (sc ? bellSvg(v[0], v[1], q.a, Math.min(620, sh.body.clientWidth)) : '') +
            '<p class="ar-fline">' + line + '</p><p style="margin:.2rem 0"><span class="label">Answer</span> <b class="ar-fans">' + esc(E.sci(q.a)) + '</b> ' + esc(q.unit) + (q.a >= 1e4 ? ' <span class="muted small">= ' + esc(E.inWords(q.a)) + '</span>' : '') + '</p>' +
            '<p class="small muted" style="margin:0 0 .4rem">' + esc(q.src) + '</p><ol class="ar-napkin small">' + q.napkin.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' +
            '<div class="row center"><button type="button" class="btn primary" id="fNext">' + (i + 1 < qs.length ? 'Next question' : 'See results') + ' <span class="kbd">Enter</span></button></div></div>';
          sh.$('#fNext').addEventListener('click', next);
          try { sh.$('#fNext').focus({ preventScroll: true }); } catch (e) { }
          sh.$('#fres').scrollIntoView({ block: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' });
        }
        sh.keys(function (e) {
          if (phase === 'result' && e.key === 'Enter') { e.preventDefault(); next(); }
          else if (phase === 'ask' && e.key === 'Enter' && e.target.tagName !== 'INPUT') { e.preventDefault(); submit(false); }
        });
      }
    };
    function fermiTable(rounds) {
      var byId = {}; (DATA.fermi || []).concat(DATA.daily || []).forEach(function (q) { byId[q.id] = q; });
      return '<details class="reveal"><summary>' + ICONS.book + '<span>All 10 questions</span><span class="chev" aria-hidden="true">▾</span></summary><div class="rbody table-scroll"><table class="simple"><thead><tr><th>Question</th><th>Your 80%</th><th>Answer</th><th>Pts</th></tr></thead><tbody>' +
        rounds.map(function (q) {
          var Q = byId[q.id] || { q: q.id, unit: '' };
          return '<tr><td class="small">' + esc(Q.q) + '</td><td class="mono small">' + (q.L ? esc(E.sci(q.L)) + ' – ' + esc(E.sci(q.U)) : '—') + '</td><td class="mono small ' + (q.hit ? 'res-ok' : 'res-bad') + '">' + esc(E.sci(q.a)) + '</td><td class="mono">' + (q.acc + q.spd) + '</td></tr>';
        }).join('') + '</tbody></table></div></details>';
    }

    /* ---------- 8. Daily Fermi ---------- */
    function dailyRuns() { return runsOf(keyOf('daily-fermi', 'std')).filter(function (r) { return r.x && r.x.date; }); }
    function dailyToday() { var t = core.today(); return dailyRuns().filter(function (r) { return r.x.date === t; })[0] || null; }
    function dailyStreak() {
      var have = {}; dailyRuns().forEach(function (r) { have[r.x.date] = 1; });
      var d = core.today(), n = 0;
      if (!have[d]) d = core.addDays(d, -1);
      while (have[d]) { n++; d = core.addDays(d, -1); }
      return n;
    }
    function errHist(runs, mark) {
      var bins = [-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2], cnt = new Array(bins.length + 1).fill ? new Array(bins.length + 1).fill(0) : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      runs.forEach(function (r) { var e = r.x.err, b = 0; while (b < bins.length && e >= bins[b]) b++; cnt[b]++; });
      var mx = Math.max.apply(null, cnt.concat([1])), W = 300, H = 110, bw = W / cnt.length;
      var labels = ['≪', '÷30', '÷10', '÷3', '', '', '×3', '×10', '×30', '≫'];
      var mb = -1; if (mark != null) { mb = 0; while (mb < bins.length && mark >= bins[mb]) mb++; }
      var h = '<svg class="ar-hist" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Histogram of your past daily errors in log10">';
      cnt.forEach(function (c, j) {
        var bh = c / mx * (H - 34), x = j * bw;
        h += '<rect class="' + (j === mb ? 'me' : j === 4 || j === 5 ? 'mid' : '') + '" x="' + (x + 2).toFixed(1) + '" y="' + (H - 20 - bh).toFixed(1) + '" width="' + (bw - 4).toFixed(1) + '" height="' + Math.max(bh, c ? 2 : 0).toFixed(1) + '" rx="2"/>' +
          (c ? '<text x="' + (x + bw / 2).toFixed(1) + '" y="' + (H - 24 - bh).toFixed(1) + '" text-anchor="middle">' + c + '</text>' : '') +
          '<text class="lb" x="' + (x + bw / 2).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle">' + labels[j] + '</text>';
      });
      h += '<text class="lb" x="' + (W / 2) + '" y="' + (H - 6) + '" text-anchor="middle">spot on</text></svg>';
      return h;
    }
    function untilMidnight() {
      var now = new Date(), m = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1), s = Math.max(0, Math.floor((m - now) / 1000));
      return Math.floor(s / 3600) + 'h ' + core.pad2(Math.floor(s / 60) % 60) + 'm ' + core.pad2(s % 60) + 's';
    }
    function dailyResultHtml(run) {
      var q = (DATA.daily || []).filter(function (x) { return x.id === run.x.qid; })[0], sc = E.dailyScore(run.x.guess, run.x.a);
      var share = E.shareText(run.x.n, sc.score, sc.text);
      return '<div class="ar-daily-res"><div class="row"><span class="ar-band ' + sc.band + '">' + { great: 'Great', good: 'Good', ok: 'OK', bad: 'Way off' }[sc.band] + '</span><b>' + esc(sc.text) + '</b></div>' +
        (q ? '<p class="small" style="margin:.5rem 0 .2rem">' + esc(q.q) + '</p>' : '') +
        '<p style="margin:.2rem 0">You said <b>' + esc(E.sci(run.x.guess)) + '</b> · answer <b>' + esc(E.sci(run.x.a)) + '</b> ' + esc(q ? q.unit : '') + (run.x.a >= 1e4 ? ' <span class="muted small">(' + esc(E.inWords(run.x.a)) + ')</span>' : '') + '</p>' +
        (q ? '<p class="small muted" style="margin:0 0 .3rem">' + esc(q.src) + '</p><ol class="ar-napkin small">' + q.napkin.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' : '') +
        '<div class="ar-panel"><h3>Your daily errors so far</h3>' + errHist(dailyRuns(), run.x.err) + '<p class="small muted" style="margin:0">' + dailyRuns().length + ' days played · streak ' + dailyStreak() + '</p></div>' +
        '<div class="ar-share"><pre id="shareTxt">' + esc(share) + '</pre><button type="button" class="btn sm" id="shareBtn">' + IC.copy + ' Copy result</button></div>' +
        '<p class="small muted">Next question in <b id="dCount">' + untilMidnight() + '</b></p></div>';
    }
    function bindDaily(rootEl, run) {
      var b = $('#shareBtn', rootEl), sc = E.dailyScore(run.x.guess, run.x.a);
      if (b) b.addEventListener('click', function () { copyText(E.shareText(run.x.n, sc.score, sc.text), 'Result copied — paste it anywhere.'); });
      var iv = setInterval(function () { var c = $('#dCount', rootEl); if (!c) { clearInterval(iv); return; } c.textContent = untilMidnight(); }, 1000);
      core.onCleanup(function () { clearInterval(iv); });
    }
    GDEF['daily-fermi'] = {
      rules: ['One question per day, the same for everyone on this app, numbered “Fermi #N”.', 'Give a single best guess. Big numbers are echoed back in words so you can check the zeros.',
        'Score = 1000 × (1 − |log10(guess / answer)| / 2), floored at 0: 2× off ≈ 850, 10× off = 500, 100× off = 0.', 'Within 1.5× is great, 3× good, 10× OK.'],
      fmt: function (v) { return num(v, 0); }, ghost: false, noAgain: true,
      landingTop: function () {
        var run = dailyToday(), pk = E.dailyPick(core.today());
        if (run) return '<div class="card ar-dailycard"><p class="eyebrow">Daily Fermi #' + pk.n + ' · done</p><div class="ar-big">' + run.score + '<small>/1000</small></div>' + dailyResultHtml(run) + '</div>';
        return '';
      },
      bindLanding: function (main) { var run = dailyToday(); if (run) bindDaily(main, run); },
      start: function (main, ctx) {
        var date = core.today(), pk = E.dailyPick(date), q = pk.q, sh, done = false;
        if (!q) { core.toast('No daily questions loaded.'); return; }
        if (dailyToday()) { core.go('#arcade/daily-fermi', true); return; }
        sh = Shell(main, base(ctx, { title: 'Daily Fermi #' + pk.n, scoreLabel: 'score', rightText: 'Fermi #' + pk.n, noSubmit: true, noAgain: true, replayable: false, hint: 'One guess. Make it count.',
          onStart: function () { var el = sh.$('#dG'); if (core.hoverDevice()) el.focus(); },
          result: function () {
            var g = E.parseQty(sh.$('#dG').value), sc = E.dailyScore(g, q.a);
            return { score: sc.score, scoreText: sc.score + ' / 1000', scoreLabel: sc.text, x: { date: date, n: pk.n, qid: q.id, guess: g, a: q.a, err: E.round(sc.err, 4) } };
          },
          afterResults: function (m, run) {
            var det = $('.ar-details', m); det.innerHTML = dailyResultHtml(run); bindDaily(m, run);
            $all('#arAgain, #arSame', m).forEach(function (b) { b.remove(); });
            core.setCtl(null);
          } }));
        sh.body.innerHTML = '<div class="ar-fq"><div class="ar-fqh"><span class="ticon" style="--cat: var(--c-fermi)">' + (IC[q.cat] || IC.fermi) + '</span><div><div class="small muted">Fermi #' + pk.n + ' · ' + esc(core.today()) + '</div>' +
          '<p class="ar-fqt">' + esc(q.q) + '</p><p class="small muted" style="margin:0">Unit: <b>' + esc(q.unit) + '</b></p></div></div>' +
          '<div class="ar-range one">' + numField('dG', { noKeypad: true, label: 'Your best guess', ph: 'e.g. 3.2m or 4e9', mode: 'text', enter: 'go' }) + '</div>' +
          '<div class="ar-chips" role="group" aria-label="Insert a suffix">' + FERMI_CHIPS.map(function (c) { return '<button type="button" class="chip" data-chip="' + c[1] + '">' + c[0] + '</button>'; }).join('') + '</div>' +
          '<p class="small ar-preview" id="dEcho">&nbsp;</p><div class="row center"><button type="button" class="btn primary" id="dGo">Submit guess <span class="kbd">Enter</span></button></div></div>';
        var el = sh.$('#dG');
        function echo() { var g = E.parseQty(el.value); sh.$('#dEcho').innerHTML = g === null ? (el.value.trim() ? '<span class="res-bad">Can’t read that number yet.</span>' : '&nbsp;') : g > 0 ? '= <b>' + esc(E.inWords(g)) + '</b>' : '<span class="res-bad">Must be positive.</span>'; }
        function go() { if (done || !sh.running) return; var g = E.parseQty(el.value); if (!(g > 0)) { echo(); el.focus(); return; } done = true; sh.finish(false); }
        el.addEventListener('input', echo);
        el.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); go(); } });
        $all('[data-chip]', sh.body).forEach(function (b) { b.addEventListener('click', function () { el.value += b.getAttribute('data-chip'); el.focus(); echo(); }); });
        sh.$('#dGo').addEventListener('click', go);
        sh.keys(function (e) { if (e.key === 'Enter' && e.target !== el) { e.preventDefault(); go(); } });
      }
    };

    /* ---------- 9. Kelly betting ---------- */
    function kellyChart(paths, n, upto, Wpx) {
      var W = Math.round(Math.max(280, Math.min(720, Wpx || 340))), H = Math.round(Math.max(160, Math.min(240, W * 0.42))), padL = 40, padB = 18, ys = [];
      paths.forEach(function (p) { p.pts.slice(0, upto + 1).forEach(function (w) { ys.push(E.log10(Math.max(w, 0.01))); }); });
      var lo = Math.min.apply(null, ys), hi = Math.max.apply(null, ys);
      lo = Math.floor(Math.min(lo, E.log10(paths[0].pts[0]) - 0.3) * 2) / 2; hi = Math.ceil(Math.max(hi, E.log10(paths[0].pts[0]) + 0.3) * 2) / 2;
      if (hi - lo < 1) hi = lo + 1;
      function X(i) { return padL + i / n * (W - padL - 6); }
      function Y(v) { return 6 + (hi - v) / (hi - lo) * (H - padB - 6); }
      var g = '';
      for (var t = Math.ceil(lo); t <= Math.floor(hi); t++) {
        g += '<line class="grid" x1="' + padL + '" x2="' + (W - 6) + '" y1="' + Y(t).toFixed(1) + '" y2="' + Y(t).toFixed(1) + '"/><text class="tick" x="' + (padL - 4) + '" y="' + (Y(t) + 3).toFixed(1) + '" text-anchor="end">' + (t >= 3 ? '$' + E.sci(Math.pow(10, t)) : '$' + E.fmtNum(Math.pow(10, t))) + '</text>';
      }
      g += '<line class="grid base" x1="' + padL + '" x2="' + (W - 6) + '" y1="' + Y(E.log10(paths[0].pts[0])).toFixed(1) + '" y2="' + Y(E.log10(paths[0].pts[0])).toFixed(1) + '"/>';
      var lines = paths.map(function (p) {
        var d = p.pts.slice(0, upto + 1).map(function (w, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(E.log10(Math.max(w, 0.01))).toFixed(1); }).join(' ');
        return '<path class="kl ' + p.cls + '" d="' + d + '"/>';
      }).join('');
      return '<svg class="ar-kchart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Log-wealth paths: you versus Kelly ghosts">' + g + lines +
        '<text class="tick" x="' + (W - 6) + '" y="' + (H - 4) + '" text-anchor="end">flip ' + upto + ' / ' + n + ' · log scale</text></svg>';
    }
    function kellyTeach(v) {
      var rows = [0.05, 0.1, 0.2, 0.3, 0.4, 0.5].map(function (f) { var gr = E.kellyGrowth(0.6, 1, f); return '<tr' + (f === 0.2 ? ' class="hl"' : '') + '><td>' + Math.round(f * 100) + '%</td><td class="mono">' + (gr >= 0 ? '+' : '−') + Math.abs(gr * 100).toFixed(2) + '%</td><td class="mono">×' + Math.exp(100 * gr).toFixed(2) + '</td></tr>'; }).join('');
      return '<details class="reveal ar-teach"><summary>' + ICONS.bulb + '<span>The Kelly criterion</span><span class="chev" aria-hidden="true">▾</span></summary><div class="rbody small">' +
        '<p>To maximise long-run growth, bet the fraction <b>f* = p − q/b</b> of your bankroll, where p is your win probability, q = 1 − p, and the bet pays b : 1. Equivalently f* = edge / odds = (b·p − q)/b.</p>' +
        '<p>Coin at p = 0.6, even money (b = 1): f* = 0.6 − 0.4 = <b>20%</b>. Growth per flip is g(f) = p·ln(1 + b·f) + q·ln(1 − f):</p>' +
        '<table class="simple"><thead><tr><th>f</th><th>g(f) per flip</th><th>median ×, 100 flips</th></tr></thead><tbody>' + rows + '</tbody></table>' +
        '<p>Half Kelly keeps about 75% of the growth with half the volatility; <b>2× Kelly grows at roughly zero</b> (here slightly negative) and anything beyond loses money for sure in the long run, even with an edge.</p>' +
        (v === 'odds' ? '<p><b>Changing odds:</b> each bet has its own p and b. If p − q/b ≤ 0 the bet has no edge: bet nothing. A long shot at 4 : 1 with p = 0.25 has f* = 0.25 − 0.75/4 = 6.25%.</p>' : '') +
        (v === 'unknown' ? '<p><b>Unknown bias:</b> p is somewhere in 50–75% (flat prior). For one bet, expected log-growth is linear in p, so the right move is Kelly at your <b>posterior mean</b>; it starts at 0.625 (f = 25%) and updates as flips land. Uncertainty about p is a reason to shade toward half Kelly.</p>' : '') +
        '<p class="muted">Inspired by a well-known 2016 experiment with these coin parameters, where many finance-trained players went bust by over-betting.</p></div></details>';
    }
    GDEF.kelly = {
      variantRules: {
        classic: ['100 flips of a coin that lands heads 60% of the time. Even money. You start with $25 and always bet on heads.', 'Choose the fraction of your bankroll to bet each flip, or set a fixed fraction on autopilot.', 'Ghost bankrolls bet full Kelly (20%), half Kelly (10%) and 2× Kelly (40%) on the very same flips.'],
        odds: ['40 bets, each with its own win probability p and payout b : 1. Some have no edge at all.', 'Bet a fraction of your bankroll on each (0% to pass). Start with $100.', 'Ghosts bet full, half and 2× of f* = p − q/b on every bet.'],
        unknown: ['100 even-money flips of a coin whose heads probability is unknown — somewhere between 50% and 75%.', 'Learn the bias from the flips as you go. Start with $25.', 'Ghosts use Bayesian Kelly (posterior mean), half of it, and double it. The true p is revealed at the end.']
      },
      fmt: function (v) { return money(v); }, ghost: false,
      start: function (main, ctx) {
        var v = ctx.v, r = E.makeRng(ctx.seed), kb = E.kellyBets(r, v), bets = kb.bets, n = bets.length, w0 = E.KELLY_VARIANTS[v].w0;
        var ghosts = { full: E.kellyGhost(bets, w0, 1, v), half: E.kellyGhost(bets, w0, 0.5, v), dbl: E.kellyGhost(bets, w0, 2, v) };
        var i = 0, w = w0, path = [w0], fracs = [], f = E.clamp(ctx.prefs.f == null ? 0.1 : +ctx.prefs.f, 0, 1), wins = 0, losses = 0, auto = null, sh;
        sh = Shell(main, base(ctx, { title: 'Kelly · ' + E.KELLY_VARIANTS[v].name, scoreLabel: 'bankroll', scoreText: money, rightText: function () { return 'Flip ' + Math.min(i + 1, n) + ' / ' + n; }, hint: '← → adjust · Enter bets · A autopilot.',
          onStart: function () { sh.setScore(w, true); render(); },
          result: function () { stopAuto(); return { score: E.round(w, 2), x: { ghosts: [ghosts.full[i], ghosts.half[i], ghosts.dbl[i]].map(function (x) { return E.round(x, 2); }), avgF: fracs.length ? E.round(E.mean(fracs), 3) : 0, flips: i, pTrue: kb.pTrue }, details: kellyDetails() }; } }));
        sh.body.innerHTML = '<div class="ar-kstats" id="ks"></div><div id="kc"></div>' +
          '<div class="ar-kbet"><p class="small ar-kinfo" id="ki"></p>' +
          '<div class="ar-frac"><label class="label" for="kf">Bet fraction</label><input type="range" id="kf" min="0" max="100" step="1"><output id="kfv"></output></div>' +
          '<div class="ar-kq">' + [0, 5, 10, 20, 25, 50, 100].map(function (x) { return '<button type="button" class="chip" data-kf="' + x + '">' + x + '%</button>'; }).join('') + '</div>' +
          '<div class="ar-actions two"><button type="button" class="btn primary lg" id="kBet">Bet <span class="kbd">Enter</span></button><button type="button" class="btn lg" id="kAuto">Autopilot <span class="kbd">A</span></button></div>' +
          '<div class="ar-fb show info" id="kfb">Pick a fraction and bet.</div></div>' + kellyTeach(v);
        var slider = sh.$('#kf');
        function setF(x) { f = E.clamp(Math.round(x * 100) / 100, 0, 1); ctx.prefs.f = f; slider.value = Math.round(f * 100); info(); }
        slider.addEventListener('input', function () { setF(+slider.value / 100); });
        $all('[data-kf]', sh.body).forEach(function (b) { b.addEventListener('click', function () { setF(+b.getAttribute('data-kf') / 100); }); });
        sh.$('#kBet').addEventListener('click', function () { bet(); });
        sh.$('#kAuto').addEventListener('click', toggleAuto);
        function pHat() { return E.posteriorMean(wins, losses, 0.5, 0.75); }
        function info() {
          var bt = bets[Math.min(i, n - 1)], stake = w * f;
          sh.$('#kfv').textContent = Math.round(f * 100) + '% · $' + stake.toFixed(2);
          var t;
          if (v === 'odds') t = 'Bet ' + Math.min(i + 1, n) + ': pays <b>' + E.fmtNum(bt.b) + ' : 1</b>, wins with probability <b>' + Math.round(bt.p * 100) + '%</b>.';
          else if (v === 'unknown') t = 'Heads probability unknown (50–75%). Seen <b>' + wins + ' H / ' + losses + ' T</b> → posterior mean <b>' + pHat().toFixed(3) + '</b>.';
          else t = 'Heads 60%, even money. Betting on heads.';
          sh.$('#ki').innerHTML = t;
        }
        function render() {
          var you = { pts: path, cls: 'you' };
          sh.$('#kc').innerHTML = kellyChart([you, { pts: ghosts.full, cls: 'full' }, { pts: ghosts.half, cls: 'half' }, { pts: ghosts.dbl, cls: 'dbl' }], n, i, sh.$('#kc').clientWidth);
          var lbl = v === 'unknown' ? ['Bayes Kelly', '½ Bayes', '2× Bayes'] : ['Full Kelly', 'Half Kelly', '2× Kelly'];
          sh.$('#ks').innerHTML = '<div class="you"><span>You</span><b>' + money(w) + '</b></div><div class="full"><span>' + lbl[0] + '</span><b>' + money(ghosts.full[i]) + '</b></div><div class="half"><span>' + lbl[1] + '</span><b>' + money(ghosts.half[i]) + '</b></div><div class="dbl"><span>' + lbl[2] + '</span><b>' + money(ghosts.dbl[i]) + '</b></div>';
          slider.value = Math.round(f * 100); info();
        }
        function bet() {
          if (!sh.running || i >= n || w <= 0) return;
          var bt = bets[i], stake = w * f, before = w;
          w = E.kellyStep(w, f, bt.win, bt.b); fracs.push(f); path.push(w);
          var ks = Math.max(0, E.kellyF(v === 'unknown' ? pHat() : bt.p, bt.b));
          if (bt.win) wins++; else losses++;
          i++;
          var fb = sh.$('#kfb'), outcome = v === 'odds' ? (bt.win ? 'Won' : 'Lost') : (bt.win ? 'Heads' : 'Tails');
          fb.className = 'ar-fb show ' + (f === 0 ? 'info' : bt.win ? 'ok' : 'bad');
          fb.innerHTML = '<b>' + outcome + '.</b> ' + (f === 0 ? 'No bet.' : (bt.win ? '+' : '−') + '$' + (bt.win ? stake * bt.b : stake).toFixed(2) + ' → ' + money(w) + '.') +
            ' <span class="muted">Kelly' + (v === 'unknown' ? ' (at p̂)' : '') + ' was ' + (ks * 100).toFixed(1) + '%' + (v === 'odds' ? ' = ' + bt.p.toFixed(2) + ' − ' + (1 - bt.p).toFixed(2) + '/' + E.fmtNum(bt.b) : '') + '.</span>';
          sh.setScore(w, true);
          render();
          if (w <= 0) { stopAuto(); fb.className = 'ar-fb show bad'; fb.innerHTML = '<b>Bust.</b> ' + before.toFixed(2) + ' went all in and lost.'; sh.later(function () { sh.finish(false); }, 900); return; }
          if (i >= n) { stopAuto(); sh.later(function () { sh.finish(false); }, 500); }
        }
        function stopAuto() { if (auto) { clearInterval(auto); auto = null; var b = sh.$('#kAuto'); if (b) b.innerHTML = 'Autopilot <span class="kbd">A</span>'; } }
        function toggleAuto() {
          if (!sh.running) return;
          if (auto) { stopAuto(); return; }
          sh.$('#kAuto').innerHTML = 'Stop autopilot <span class="kbd">A</span>';
          if (reducedMotion()) { while (i < n && w > 0) bet(); stopAuto(); return; }
          auto = setInterval(function () { if (!sh.running) return; bet(); }, 90);
        }
        core.onCleanup(stopAuto);
        sh.o.onResume = function () { };
        sh.keys(function (e) {
          var k = e.key, step = e.shiftKey ? 0.05 : 0.01;
          if (k === 'ArrowRight' || k === 'ArrowUp') { e.preventDefault(); setF(f + step); }
          else if (k === 'ArrowLeft' || k === 'ArrowDown') { e.preventDefault(); setF(f - step); }
          else if (k === 'Enter') { if (e.target === slider || e.target.tagName !== 'BUTTON') { e.preventDefault(); bet(); } }
          else if (k === 'a' || k === 'A') { e.preventDefault(); toggleAuto(); }
          else if (k === '0') { e.preventDefault(); setF(0); }
        });
        function kellyDetails() {
          var nF = Math.max(1, i), gYou = w > 0 ? Math.log(w / w0) / nF : null, gK = ghosts.full[i] > 0 ? Math.log(ghosts.full[i] / w0) / nF : null;
          var avgF = fracs.length ? E.mean(fracs) : 0;
          var lbl = v === 'unknown' ? ['Bayes Kelly', '½ Bayes', '2× Bayes'] : ['Full Kelly', 'Half Kelly', '2× Kelly'];
          var exp = v === 'classic' ? '<p class="small">Expected growth per flip at your average fraction (' + Math.round(avgF * 100) + '%): <b>' + (E.kellyGrowth(0.6, 1, avgF) * 100).toFixed(2) + '%</b> vs <b>' + (E.kellyGrowth(0.6, 1, 0.2) * 100).toFixed(2) + '%</b> at Kelly. ' +
            (avgF > 0.3 ? 'You over-bet: past 2× Kelly growth turns negative.' : avgF < 0.12 ? 'Cautious: safe, but you leave growth on the table.' : 'Close to the Kelly zone.') + '</p>' : '';
          return tiles([{ v: money(w), l: 'you', cls: w >= w0 ? 'res-ok' : 'res-bad' }, { v: money(ghosts.full[i]), l: lbl[0] }, { v: money(ghosts.half[i]), l: lbl[1] }, { v: money(ghosts.dbl[i]), l: lbl[2] }]) +
            '<div class="ar-panel">' + kellyChart([{ pts: path, cls: 'you' }, { pts: ghosts.full, cls: 'full' }, { pts: ghosts.half, cls: 'half' }, { pts: ghosts.dbl, cls: 'dbl' }], n, i, Math.min(700, ((document.getElementById('view') || {}).clientWidth || 380) - 70)) +
            '<div class="ar-legend small"><span class="you">You</span><span class="full">' + lbl[0] + '</span><span class="half">' + lbl[1] + '</span><span class="dbl">' + lbl[2] + '</span></div>' +
            '<p class="small">Realised log-growth per bet: you <b>' + (gYou === null ? 'bust' : (gYou * 100).toFixed(2) + '%') + '</b>, ' + lbl[0].toLowerCase() + ' <b>' + (gK === null ? 'bust' : (gK * 100).toFixed(2) + '%') + '</b>. Average fraction bet: ' + Math.round(avgF * 100) + '%. ' + wins + ' wins / ' + losses + ' losses.</p>' +
            exp + (v === 'unknown' ? '<p class="small">The true heads probability was <b>' + kb.pTrue + '</b> (oracle Kelly ' + Math.round(Math.max(0, E.kellyF(kb.pTrue, 1)) * 100) + '%). Your final posterior mean: ' + pHat().toFixed(3) + '.</p>' : '') + '</div>' + kellyTeach(v);
        }
      }
    };

    /* ================================================================== */
    /* Starting a game, landing pages, hub                                 */
    /* ================================================================== */
    var VARIANT_ALIAS = { sequences: { test: 'optiver', oa: 'optiver', hard: 'optiver' }, eighty: { test: 'oa', real: 'oa' }, dice: { take: 'take', mm: 'make' }, fermi: { std: 'mixed' } };
    function routeVariant(gid, v) {
      var gm = GAME[gid];
      if (v && VARIANT_ALIAS[gid] && VARIANT_ALIAS[gid][v]) v = VARIANT_ALIAS[gid][v];
      if (v && gm.variants.some(function (x) { return x.id === v; })) return v;
      var last = A().last[gid];
      return last && gm.variants.some(function (x) { return x.id === last; }) ? last : gm.variants[0].id;
    }
    function recVariant(gid, v) { var d = GDEF[gid]; return d.recVariant ? d.recVariant(v, prefs(gid)) : v; }
    function startGame(main, gid, v, chal) {
      var d = GDEF[gid];
      v = routeVariant(gid, v);
      var rv = recVariant(gid, v);
      if (chal && (chal.g !== gid || chal.v !== rv)) chal = null;
      A().last[gid] = v; core.save();
      var ctx = { g: gid, v: v, rv: rv, seed: chal ? chal.seed >>> 0 : newSeed(), prefs: prefs(gid), challenge: chal, ghost: d.ghost === false ? null : pbRun(keyOf(gid, rv)) };
      d.start(main, ctx);
    }
    function chips(list, cls) { return list.map(function (s) { return '<span class="ar-tag ' + cls + '">' + esc(s) + '</span>'; }).join(''); }

    function landing(main, gid, vIn) {
      var gm = GAME[gid], d = GDEF[gid], p = prefs(gid), v = routeVariant(gid, vIn), rv = recVariant(gid, v);
      var rules = (d.variantRules && d.variantRules[v]) || d.rules || [];
      var chal = CH && CH.g === gid && CH.v === rv ? CH : null;
      var top = d.landingTop ? d.landingTop() : '';
      main.innerHTML = '<div class="page-head"><div><a class="back-link" href="#arcade">' + ICONS.left + ' Arcade</a><h1 class="ar-h1" style="--gc:' + gm.color + '"><span class="ar-gic">' + IC[gm.icon] + '</span>' + esc(gm.name) + '</h1><p class="muted">' + esc(gm.desc) + '</p></div></div>' +
        top +
        '<div class="two-col"><div class="card stack ar-setup" style="--gc:' + gm.color + '">' +
        (gm.variants.length > 1 ? '<div class="frow"><span class="label">Variant</span><div class="seg" role="group" aria-label="Variant">' + gm.variants.map(function (x) { return '<button type="button" data-var="' + x.id + '" aria-pressed="' + (x.id === v) + '">' + esc(x.name) + '</button>'; }).join('') + '</div></div>' : '') +
        (d.settings ? '<div class="stack ar-settings">' + d.settings(v, p) + '</div>' : '') +
        '<div><span class="label">How it works</span><ul class="ar-rules">' + rules.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' +
        '<div class="ar-firmline small"><span class="label">Used by</span> ' + chips(gm.firms, 'firm') + '<p class="muted" style="margin:.35rem 0 0">' + esc(gm.why) + '</p></div>' +
        (chal ? '<div class="banner ar-chalb"><p><b>Challenge loaded:</b> beat ' + esc(fmtScore(gid, chal.score)) + ' on seed ' + chal.seed + '.</p><button type="button" class="btn sm ghost" id="chDrop">Dismiss</button></div>' : '') +
        (top && d.noAgain ? '<p class="muted small" style="margin:0">Come back tomorrow for the next question.</p>' :
          '<button type="button" class="btn primary block lg ar-start" id="arStart">' + ICONS.play + '<span><b>' + (chal ? 'Start challenge' : 'Start') + '</b><small>' + esc(variantName(gid, rv)) + ' · 5-second countdown</small></span><span class="kbd">Enter</span></button>') +
        '</div><div>' + pbCard(gid, rv) + historyCard(gid, rv) + (gid === 'fermi' ? '<div class="card"><h3 style="margin:0 0 .4rem">Calibration · last 20 rounds</h3>' + calHtml(fermiCalibration(20)) + '</div>' : '') + '</div></div>';
      bindPb(main, gid, rv);
      $all('[data-var]', main).forEach(function (b) { b.addEventListener('click', function () { A().last[gid] = b.getAttribute('data-var'); core.save(); core.go('#arcade/' + gid + '/' + b.getAttribute('data-var'), true); }); });
      $all('[data-set]', main).forEach(function (el) {
        el.addEventListener('change', function () {
          var k = el.getAttribute('data-set');
          p[k] = el.type === 'checkbox' ? el.checked : (isFinite(+el.value) ? +el.value : el.value);
          if (gid === 'cards' && k === 'n' && p.up > p.n) p.up = p.n;
          core.save(); landing(main, gid, v);
        });
      });
      $all('[data-setv]', main).forEach(function (b) { b.addEventListener('click', function () { p[b.getAttribute('data-setv')] = b.getAttribute('data-val'); core.save(); landing(main, gid, v); }); });
      var dr = $('#chDrop', main); if (dr) dr.addEventListener('click', function () { CH = null; landing(main, gid, v); });
      var st = $('#arStart', main);
      function start() { startGame(main, gid, v, chal); }
      if (st) { st.addEventListener('click', start); core.setCtl({ submit: start }); } else core.setCtl(null);
      if (d.bindLanding) d.bindLanding(main);
    }

    function dailySet() {
      var t = core.today(), h = E.hashStr('set:' + t);
      var speed = ['mania', 'eighty', 'sequences', 'spread', 'options'], deep = ['cards', 'dice', 'balloon', 'kelly', 'etf', 'fermi'];
      return ['daily-fermi', speed[h % speed.length], deep[(h >>> 8) % deep.length]].map(function (g) {
        var done = runsOfGame(g).some(function (r) { return r.d === t && !r.early; });
        return { g: g, done: done };
      });
    }
    function cardStat(gid) {
      var v = routeVariant(gid), rv = recVariant(gid, v), pb = pbRun(keyOf(gid, rv)), lp = lastPlayed(gid);
      return { v: v, rv: rv, pb: pb, lp: lp };
    }
    function gameCard(g) {
      var s = cardStat(g.id);
      return '<a class="ar-gcard card" href="#arcade/' + g.id + '" style="--gc:' + g.color + '">' +
        '<div class="ar-gtop"><span class="ar-gic">' + IC[g.icon] + '</span><div class="ar-gt"><h3>' + esc(g.name) + '</h3><p class="muted small">' + esc(g.desc) + '</p></div></div>' +
        '<div class="ar-tags">' + chips(g.skills, 'skill') + '</div>' +
        '<div class="ar-firms small"><span class="label">Firms</span> ' + esc(g.firms.slice(0, 4).join(' · ')) + (g.firms.length > 4 ? ' <span class="muted">+' + (g.firms.length - 4) + '</span>' : '') + '</div>' +
        '<div class="ar-gfoot small"><span>' + (s.pb ? 'PB <b>' + esc(fmtScore(g.id, s.pb.score)) + '</b> <span class="muted">' + esc(variantName(g.id, s.rv)) + '</span>' : '<span class="muted">No runs yet</span>') + '</span>' +
        '<span class="muted">' + (s.lp ? esc(ago(s.lp.d)) : '') + '</span></div></a>';
    }
    function hub(main) {
      var set = dailySet(), nDone = set.filter(function (x) { return x.done; }).length;
      var all = []; GAMES.forEach(function (g) { all = all.concat(runsOfGame(g.id)); });
      var week = all.filter(function (r) { return r.t >= Date.now() - 7 * 864e5; }).length;
      var days = {}; all.forEach(function (r) { days[r.d] = 1; });
      var dt = dailyToday(), pk = E.dailyPick(core.today());
      main.innerHTML = '<div class="page-head"><div><a class="back-link" href="#train">' + ICONS.left + ' Train</a><h1>Arcade</h1><p class="muted">Interview-format games: mental-math screens, sequences, market making, sizing, estimation. All offline, all seeded.</p></div></div>' +
        '<div class="card ar-dailyset"><div class="row"><span class="ticon" style="--cat: var(--accent)">' + IC.daily + '</span><div style="flex:1;min-width:0"><b>Daily set</b> <span class="muted small">· ' + nDone + ' / 3 done today</span><p class="muted small" style="margin:0">One estimate, one speed screen, one decision game — about 15 minutes.</p></div></div>' +
        '<div class="ar-setlist">' + set.map(function (x) { var g = GAME[x.g]; return '<a class="ar-setitem' + (x.done ? ' done' : '') + '" href="#arcade/' + x.g + '" style="--gc:' + g.color + '"><span class="ar-gic">' + (x.done ? ICONS.check : IC[g.icon]) + '</span><span><b>' + esc(g.name) + '</b><small>' + (x.g === 'daily-fermi' ? (dt ? 'Fermi #' + pk.n + ' · ' + dt.score + '/1000' : 'Fermi #' + pk.n + ' · not played') : x.done ? 'done today' : esc(g.skills[0])) + '</small></span></a>'; }).join('') + '</div></div>' +
        '<div class="tiles">' +
        '<div class="stat-tile"><div class="v">' + all.length + '</div><div class="l">runs</div></div>' +
        '<div class="stat-tile"><div class="v">' + week + '</div><div class="l">this week</div></div>' +
        '<div class="stat-tile"><div class="v">' + Object.keys(days).length + '</div><div class="l">days played</div></div>' +
        '<div class="stat-tile"><div class="v">' + dailyStreak() + '</div><div class="l">daily Fermi streak</div></div></div>' +
        GROUPS.map(function (gr) {
          return '<section class="ar-group"><div class="ar-ghead"><h2>' + esc(gr.name) + '</h2><p class="muted small">' + esc(gr.desc) + '</p></div><div class="ar-grid">' +
            GAMES.filter(function (g) { return g.group === gr.id; }).map(gameCard).join('') + '</div></section>';
        }).join('') +
        '<div class="card ar-chalcard"><h3 style="margin:0 0 .3rem">Play a challenge code</h3><p class="muted small">Every result screen has a code. Paste it here (on any device) to replay the exact same game and try to beat the score.</p>' +
        '<form class="row" id="chForm"><label class="sr-only" for="chIn">Challenge code</label><input type="text" id="chIn" placeholder="SBT-…" autocomplete="off" autocapitalize="off" spellcheck="false" style="flex:1;min-width:200px"><button type="submit" class="btn primary">Load</button></form></div>';
      $('#chForm', main).addEventListener('submit', function (e) {
        e.preventDefault();
        try {
          var c = E.decodeChallenge($('#chIn', main).value);
          if (!GAME[c.g] || !GDEF[c.g]) throw new Error('Unknown game in that code.');
          if (c.g === 'daily-fermi') throw new Error('Daily Fermi can’t be replayed — it’s one question per day.');
          var d = GDEF[c.g], v = d.fromRec ? d.fromRec(c.v, prefs(c.g)) : c.v;
          if (!GAME[c.g].variants.some(function (x) { return x.id === v; })) throw new Error('Unknown variant in that code.');
          CH = c; core.save();
          core.go('#arcade/' + c.g + '/' + v);
        } catch (err) { core.toast(err.message || 'Could not read that code.'); }
      });
      core.setCtl(null);
    }

    core.VIEWS.arcade = function (main, parts) {
      parts = (parts || []).map(function (s) { return String(s).replace(/\?.*$/, ''); });
      var gid = parts[0];
      if (gid && GAME[gid] && GDEF[gid]) { core.TITLES.arcade = GAME[gid].name; landing(main, gid, parts[1]); }
      else { core.TITLES.arcade = 'Arcade'; hub(main); }
      A();
    };

    /* ================================================================== */
    /* App hooks: home, settings, export/import/merge                      */
    /* ================================================================== */
    core.HOOKS.homeCards.push(function () {
      var set = dailySet(), nDone = set.filter(function (x) { return x.done; }).length, dt = dailyToday(), pk = E.dailyPick(core.today());
      return '<div class="card ar-home home-card"><div class="hc-head"><b class="hc-t">Arcade</b><a class="btn sm" href="#arcade' + (dt ? '' : '/daily-fermi') + '">' + (dt ? 'Open' : 'Play') + '</a></div>' +
        '<p class="hc-sub">Daily set ' + nDone + '/3 · ' + (dt ? 'Daily Fermi #' + pk.n + ': <b>' + dt.score + '/1000</b>' : 'Daily Fermi #' + pk.n + ' is waiting') + '</p></div>';
    });
    core.HOOKS.settingsCards.push(function () {
      var n = 0, R = A().runs; Object.keys(R).forEach(function (k) { if (Array.isArray(R[k])) n += R[k].length; });
      var kp = gpref('keypad', 'auto');
      return '<div class="card stack"><h2>Arcade</h2>' +
        '<div class="frow"><span class="label">On-screen number pad</span><div class="seg" role="group" aria-label="On-screen number pad">' + ['auto', 'on', 'off'].map(function (x) { return '<button type="button" data-arkp="' + x + '" aria-pressed="' + (kp === x) + '">' + { auto: 'Auto (touch)', on: 'Always', off: 'Never' }[x] + '</button>'; }).join('') + '</div>' +
        '<span class="muted small">The pad has a − key and never pops up the wrong phone keyboard.</span></div>' +
        '<label class="switch"><input type="checkbox" id="arConf"' + (gpref('confetti', true) !== false ? ' checked' : '') + '><span class="track" aria-hidden="true"></span><span><b>Confetti at the end of a run</b><br><span class="muted small">Always off when your system asks for reduced motion.</span></span></label>' +
        '<p class="small" style="margin:0">' + n + ' arcade runs stored (up to ' + HIST_CAP + ' per variant). They are included in Export and merged on Import.</p>' +
        '<div class="row"><a class="btn" href="#arcade">Open Arcade</a><button class="btn danger" type="button" id="arReset">Clear arcade history</button></div></div>';
    });
    core.HOOKS.settingsAfter.push(function (main) {
      $all('[data-arkp]', main).forEach(function (b) { b.addEventListener('click', function () { A().prefs.keypad = b.getAttribute('data-arkp'); core.save(); $all('[data-arkp]', main).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); }); });
      var c = $('#arConf', main); if (c) c.addEventListener('change', function () { A().prefs.confetti = c.checked; core.save(); });
      var r = $('#arReset', main); if (r) r.addEventListener('click', function () {
        if (!confirm('Delete every arcade run, personal best and daily Fermi result on this device?')) return;
        A().runs = {}; core.save(); core.toast('Arcade history cleared.'); core.route();
      });
    });
    function sanitizeArcade(a) {
      if (!core.isPlainObj(a)) return null;
      var runs = core.isPlainObj(a.runs) ? a.runs : {}, out = {};
      Object.keys(runs).forEach(function (k) {
        if (!/^[a-z-]+\/[a-z0-9-]+$/.test(k) || !Array.isArray(runs[k])) return;
        out[k] = runs[k].filter(function (r) { return r && typeof r.id === 'string' && isFinite(r.score) && isFinite(r.t); });
      });
      a.runs = out;
      if (!core.isPlainObj(a.prefs)) a.prefs = {};
      if (!core.isPlainObj(a.last)) a.last = {};
      return a;
    }
    core.HOOKS.exportData.push(function (data) {
      var n = 0, R = A().runs; Object.keys(R).forEach(function (k) { n += (R[k] || []).length; });
      data.arcade = { version: 1, runs: n };
    });
    core.HOOKS.importData.push(function (obj) {
      var prog = obj && obj.progress ? obj.progress : obj;
      if (prog && prog.arcade !== undefined && !sanitizeArcade(prog.arcade)) prog.arcade = {};
    });
    core.HOOKS.mergeState.push(function (cur, inc) {
      var ia = sanitizeArcade(inc && inc.arcade);
      if (!ia) return;
      var ca = sanitizeArcade(cur.arcade) || {};
      cur.arcade = ca; ca.runs = ca.runs || {};
      Object.keys(ia.runs).forEach(function (k) {
        var have = {}, list = (ca.runs[k] || []).slice();
        list.forEach(function (r) { have[r.id] = 1; });
        ia.runs[k].forEach(function (r) { if (!have[r.id]) { list.push(r); have[r.id] = 1; } });
        ca.runs[k] = trimList(list);
      });
      Object.keys(ia.prefs || {}).forEach(function (k) { if (ca.prefs[k] === undefined) ca.prefs[k] = ia.prefs[k]; });
      Object.keys(ia.last || {}).forEach(function (k) { if (ca.last[k] === undefined) ca.last[k] = ia.last[k]; });
    });
    core.HOOKS.boot.push(function () { try { A(); } catch (e) { } });

    root.SBT_ARCADE._ui = { A: A, saveRun: saveRun, runsOf: runsOf, startGame: startGame, GDEF: GDEF, trimList: trimList, sanitize: sanitizeArcade, dailySet: dailySet, Shell: Shell, GAMES: GAMES, GAME: GAME, IC: IC };  // Shell/GAMES/GAME/IC: used by a7_queue.js
  });
})(typeof window !== 'undefined' ? window : globalThis);

/* ================================================================== */
/* Part 7 (v2.1): Queue Position — a FIFO limit-order-book simulator  */
/* of the "0+" queue strategy. Its own IIFE, appended after the hub.   */
/* Pure engine: SBT_ARCADE.queue.engine (no DOM). UI: a plugin that    */
/* registers GDEF.queue through SBT_ARCADE._ui.                         */
/* The 0+ idea comes from a PROMOTIONAL exchange blog post (2023); the */
/* model is illustrative and its claims are unverified.                */
/* ================================================================== */
(function (root) {
  'use strict';
  var AR = root.SBT_ARCADE;
  if (!AR || !AR._engine) return;
  var E = AR._engine;

  /* ---------------- parameters ---------------- */
  var STEPS = 150;          // ticks of game time per run
  var NLV = 4;              // visible levels per side
  var PX0 = 5000;           // ask starts at 50.00 (prices in cents; tick = 1 cent)
  var LOT = 100;            // shares per order: 1 tick on one lot = $1
  var P_MKT = 0.6;          // per tick, per side: chance of a small market order (1–3 lots)
  var P_FADE = 0.05;        // per tick, per side: chance the crowd at the touch starts cancelling
  var FADE_CUT = 0.55;      // during a fade each crowd order cancels with this probability
  var P_CANCEL = 0.02;      // background cancel probability per crowd order per tick
  var HZ_MAX = 0.2, HZ_SCALE = 3;    // sweep hazard h(q) = 0.2·exp(−q/3), q = lots resting at the touch
  var CROWD_LAT = 50;       // crowd orders arrive after the fast phase
  var BOTS = [
    { id: 'alpha', name: 'Bot α', lat: 2, size: 2, pull: 3 },
    { id: 'beta', name: 'Bot β', lat: 3, size: 1, pull: 2 },
    { id: 'gamma', name: 'Bot γ', lat: 8, size: 3, pull: 4 }
  ];
  var PRIV = { id: 'priv', name: 'Privileged', lat: 999, size: 4, pull: 5 };
  var SCEN = {
    hft: { name: 'HFT fees (fee < tick)', maker: -0.2, taker: 0.3, priv: false },
    retail: { name: 'Retail fees (fee > tick)', maker: 2.5, taker: 2.5, priv: false },
    nofifo: { name: 'FIFO broken (privileged order type)', maker: -0.2, taker: 0.3, priv: true },
    custom: { name: 'Custom fees', maker: 0, taker: 0.3, priv: false }
  };
  var LAT = {
    colo: { name: 'Co-located', lat: 1, slow: false, desc: 'first at a new level — ahead of every bot' },
    fast: { name: 'Fast', lat: 5, slow: false, desc: 'behind bots α and β, ahead of γ' },
    retail: { name: 'Retail', lat: 100, slow: true, desc: 'arrives after the bots, the market events and the crowd' }
  };
  var MAKER_OPTS = [-0.3, -0.2, -0.1, 0, 0.1, 0.25, 0.5, 1, 2.5];
  var TAKER_OPTS = [0, 0.1, 0.3, 0.5, 1, 2.5];
  var AUTO = { cancelBelow: 3, scratchBelow: 6 };
  /* tunable flow parameters (read at run time, so tests can probe them) */
  var PRM = { pMkt: P_MKT, mktMax: 3, pFade: P_FADE, fadeCut: FADE_CUT, pCancel: P_CANCEL, hzMax: HZ_MAX, hzScale: HZ_SCALE, crowdOld: 0.5, crowdYoung: 0.85 };

  /* ---------------- FIFO queue primitives ---------------- */
  function mkLevel(px, side, born) { return { px: px, side: side, q: [], born: born == null ? -1 : born }; }
  function levelSize(L) { var s = 0; for (var i = 0; i < L.q.length; i++) s += L.q[i].size; return s; }
  function addOrder(L, o, atHead) { if (atHead) L.q.unshift(o); else L.q.push(o); return o; }
  function findOrder(L, id) { for (var i = 0; i < L.q.length; i++) if (L.q[i].id === id) return i; return -1; }
  function cancelOrder(L, id) { var k = findOrder(L, id); return k < 0 ? null : L.q.splice(k, 1)[0]; }
  /* A market order of `size` lots fills resting orders strictly from the head (time priority). */
  function fillMarket(L, size) {
    var fills = [], left = size;
    while (left > 0 && L.q.length) {
      var o = L.q[0], take = Math.min(o.size, left);
      fills.push({ id: o.id, who: o.who, bot: o.bot, size: take, partial: take < o.size });
      o.size -= take; left -= take;
      if (o.size <= 0) L.q.shift();
    }
    return { fills: fills, filled: size - left, left: left };
  }
  function queuePos(L, id) {
    var k = findOrder(L, id); if (k < 0) return null;
    var ahead = 0; for (var i = 0; i < k; i++) ahead += L.q[i].size;
    var total = levelSize(L), mine = L.q[k].size;
    return { pos: k + 1, n: L.q.length, ahead: ahead, size: mine, behind: total - ahead - mine, total: total };
  }

  /* ---------------- closed forms ---------------- */
  function tickHazard(q) { return q > 0 ? PRM.hzMax * Math.exp(-q / PRM.hzScale) : 1; }
  /* Idealised 0+ trade: win a tick with probability p, otherwise scratch at 0; pay `fee` per side. */
  function zeroPlusEV(p, tick, fee) { return p * tick - 2 * fee; }
  function breakevenFee(p, tick) { return p * tick / 2; }
  /* With losses: entry is a maker order; a win exits as maker, a scratch or a stop-out as taker. */
  function tradeEV(pw, ps, pl, f) { return pw * (1 - 2 * f.maker) + ps * (-f.maker - f.taker) + pl * (-1 - f.maker - f.taker); }
  function tradeFee(exitKind, f) { return f.maker + (exitKind === 'maker' ? f.maker : f.taker); }
  function fmtPx(px) { return (px / 100).toFixed(2); }

  /* ---------------- the simulator ---------------- */
  function createSim(seed, opt) {
    opt = opt || {};
    seed = seed >>> 0;
    var scenId = SCEN[opt.scen] ? opt.scen : 'hft', sc = SCEN[scenId], latId = LAT[opt.lat] ? opt.lat : 'colo', lt = LAT[latId];
    var fees = { maker: opt.maker != null && isFinite(opt.maker) ? +opt.maker : sc.maker, taker: opt.taker != null && isFinite(opt.taker) ? +opt.taker : sc.taker };
    var S = {
      seed: seed, t: 0, steps: opt.steps || STEPS, scen: scenId, lat: latId, latV: lt.lat, slow: lt.slow, fees: fees,
      priv: opt.priv != null ? !!opt.priv : sc.priv, bids: [], asks: [], bots: [],
      you: { order: null, pos: null, pending: null, tr: null },
      trades: [], log: [], abandons: 0, pulled: 0, ticks: 0, newLevels: 0, privAhead: 0, nid: 0, done: false
    };
    var r0 = E.makeRng(E.deriveSeed(seed, 'qp-init'));
    function oid(p) { S.nid++; return p + S.nid; }
    function crowdFill(L, total, r) { while (total > 0) { var s = Math.min(total, 1 + Math.floor(r.next() * 4)); L.q.push({ id: oid('c'), who: 'crowd', size: s, t: S.t }); total -= s; } }
    for (var i = 0; i < NLV; i++) {
      var b = mkLevel(PX0 - 1 - i, 'bid', -1), a = mkLevel(PX0 + i, 'ask', -1);
      crowdFill(b, i === 0 ? 8 + r0.int(0, 8) : 10 + r0.int(0, 10), r0);
      crowdFill(a, i === 0 ? 8 + r0.int(0, 8) : 10 + r0.int(0, 10), r0);
      S.bids.push(b); S.asks.push(a);
    }
    BOTS.concat(S.priv ? [PRIV] : []).forEach(function (d) { S.bots.push({ def: d, order: null, scratch: null }); });

    function arr(side) { return side === 'bid' ? S.bids : S.asks; }
    function touch(side) { return arr(side)[0]; }
    function opp(side) { return side === 'bid' ? 'ask' : 'bid'; }
    function levelAt(side, px) { var a = arr(side); for (var i = 0; i < a.length; i++) if (a[i].px === px) return a[i]; return null; }
    function note(k, txt) { S.log.push({ t: S.t, k: k, txt: txt }); if (S.log.length > 80) S.log.shift(); }
    function botById(id) { for (var i = 0; i < S.bots.length; i++) if (S.bots[i].def.id === id) return S.bots[i]; return null; }
    function cancelAnywhere(id) {
      var all = S.bids.concat(S.asks);
      for (var i = 0; i < all.length; i++) if (cancelOrder(all[i], id)) return true;
      return false;
    }
    function closeTrade(outcome, gross, exitKind, px, why) {
      var y = S.you, tr = y.tr;
      if (!tr || !y.pos) return;
      if (y.pos.exitId) cancelAnywhere(y.pos.exitId);
      tr.outcome = outcome; tr.gross = gross; if (outcome === 'loss') tr.lossBy = tr.tFill === S.t && tr.fillBy !== 'flow' ? 'adverse-fill' : 'held'; tr.exitKind = exitKind; tr.exitPx = px; tr.tExit = S.t; tr.why = why || '';
      tr.fee = E.clean(tradeFee(exitKind, fees)); tr.net = E.clean(gross - tr.fee);
      S.trades.push(tr); y.pos = null; y.tr = null;
      note(outcome, outcome === 'win' ? 'Your exit filled at ' + fmtPx(px) + ': +1 tick.' : outcome === 'scratch' ? 'Scratched at ' + fmtPx(px) + ': 0 ticks before fees.' : 'Stopped out at ' + fmtPx(px) + ': ' + (gross > 0 ? '+' : '') + gross + ' tick' + (Math.abs(gross) === 1 ? '' : 's') + (why ? ' (' + why + ')' : '') + '.');
    }
    function onFill(f, L, kind, depleted, preYou) {
      var y = S.you;
      if (f.who === 'you') {
        if (y.order && f.id === y.order.id) {
          var tr = y.tr;
          tr.tFill = S.t; tr.fillBy = kind === 'sweep' ? 'sweep' : depleted ? 'deplete' : 'flow';
          tr.behindAtFill = preYou ? preYou.behind : 0; tr.entry = L.px;
          y.order = null;
          y.pos = { side: L.side === 'bid' ? 'long' : 'short', entry: L.px, lvSide: L.side, exitId: null };
          var XL = touch(opp(L.side)), xpx = L.side === 'bid' ? L.px + 1 : L.px - 1;
          if (XL.px === xpx) { var xo = { id: oid('x'), who: 'you', size: 1, t: S.t, exit: true }; XL.q.push(xo); y.pos.exitId = xo.id; }
          note('fill', 'Filled: ' + (L.side === 'bid' ? 'bought' : 'sold') + ' 1 lot at ' + fmtPx(L.px) + (tr.fillBy === 'flow' ? '.' : ' — in a ' + (tr.fillBy === 'sweep' ? 'sweep' : 'queue wipe-out') + '.'));
        } else if (y.pos && f.id === y.pos.exitId) {
          y.pos.exitId = null;
          closeTrade('win', 1, 'maker', L.px);
        }
      } else if (f.who === 'bot' || f.who === 'priv') {
        var bt = botById(f.bot);
        if (bt) {
          bt.scratch = { side: L.side, px: L.px, size: (bt.scratch ? bt.scratch.size : 0) + f.size };
          if (!f.partial) bt.order = null;
        }
      }
    }
    function marketHit(side, size, kind) {
      var L = touch(side);
      if (!levelSize(L) || size <= 0) return 0;
      var preYou = S.you.order && S.you.order.side === side ? queuePos(L, S.you.order.id) : null;
      var res = fillMarket(L, size), depleted = L.q.length === 0;
      for (var i = 0; i < res.fills.length; i++) onFill(res.fills[i], L, kind, depleted, preYou);
      if (depleted) tickThrough(side, kind);
      return res.filled;
    }
    function tickThrough(side, kind) {
      S.ticks++;
      var a = arr(side), o = arr(opp(side));
      var old = a.shift(), last = a[a.length - 1];
      var deep = mkLevel(side === 'bid' ? last.px - 1 : last.px + 1, side, -1);
      crowdFill(deep, 8 + Math.floor(E.makeRng(E.deriveSeed(seed, 'qp-d' + S.t + '-' + S.ticks)).next() * 10), E.makeRng(E.deriveSeed(seed, 'qp-dd' + S.t + '-' + S.ticks)));
      a.push(deep);
      var oldOpp = o[0], nl = mkLevel(old.px, opp(side), S.t);
      o.unshift(nl); o.pop();
      S.newLevels++;
      note('tick', (side === 'bid' ? 'Bid ' + fmtPx(old.px) + ' ticked through: price down a tick.' : 'Ask ' + fmtPx(old.px) + ' ticked through: price up a tick.') + ' New empty ' + opp(side) + ' level at ' + fmtPx(old.px) + '.');
      var y = S.you;
      if (y.order && y.order.side === opp(side)) {        // your resting entry is no longer at the touch
        cancelOrder(oldOpp, y.order.id); y.order = null; y.tr = null; S.pulled++;
        note('pulled', 'Your ' + (side === 'bid' ? 'offer' : 'bid') + ' is no longer at the touch, so it was pulled.');
      }
      S.bots.forEach(function (bt) { if (bt.order && bt.order.side === opp(side)) { cancelOrder(oldOpp, bt.order.id); bt.order = null; } });
      if (y.pos && y.pos.lvSide === side) {                 // the level you entered at is gone: flatten one tick worse
        closeTrade('loss', -1, 'taker', side === 'bid' ? old.px - 1 : old.px + 1, kind === 'sweep' ? 'the queue was swept' : 'your entry level emptied');
      }
    }
    function youAct(a) {
      var y = S.you;
      if (a === 'bid' || a === 'ask') {
        if (y.pos) return;
        if (y.order) { if (y.order.side === a) return; var Lo = levelAt(y.order.side, y.order.px); if (Lo) cancelOrder(Lo, y.order.id); y.order = null; y.tr = null; S.abandons++; }
        var L = touch(a), o = { id: oid('y'), who: 'you', size: 1, t: S.t };
        L.q.push(o); y.order = { side: a, px: L.px, id: o.id };
        var qp = queuePos(L, o.id);
        var privAt = L.q.some(function (x) { return x.who === 'priv'; });
        if (privAt) S.privAhead++;
        y.tr = { side: a === 'bid' ? 'long' : 'short', tJoin: S.t, joinPos: qp.pos, joinAhead: qp.ahead, newLevel: S.t - L.born <= 1, entry: L.px, decision: null, privAhead: privAt };
        note('join', 'Joined the ' + a + ' at ' + fmtPx(L.px) + ' as #' + qp.pos + ' of ' + qp.n + ' (' + qp.ahead + ' lots ahead).');
      } else if (a === 'cancel') {
        if (y.order) { var Lc = levelAt(y.order.side, y.order.px); if (Lc) cancelOrder(Lc, y.order.id); y.order = null; y.tr = null; S.abandons++; note('cancel', 'You abandoned the level.'); }
      } else if (a === 'scratch') {
        if (!y.pos) return;
        var p = y.pos, T = touch(p.lvSide);
        if (T.px !== p.entry || levelSize(T) <= 0) return;
        y.tr.decision = y.tr.decision === 'hold' ? 'hold-scratch' : 'scratch';
        closeTrade('scratch', 0, 'taker', p.entry);
        marketHit(p.lvSide, 1, 'scratch');
      } else if (a === 'hold') {
        if (y.pos && y.tr && !y.tr.decision) y.tr.decision = 'hold';
      }
    }
    function step() {
      if (S.done) return;
      S.t++;
      var t = S.t, r = E.makeRng(E.deriveSeed(seed, 'qp-m' + t)), rc = E.makeRng(E.deriveSeed(seed, 'qp-c' + t));
      // fixed draw order, so the exogenous flow depends only on the seed
      var d = { fadeB: r.next(), fadeA: r.next(), mS: r.next(), sS: 1 + Math.floor(r.next() * PRM.mktMax), mB: r.next(), sB: 1 + Math.floor(r.next() * PRM.mktMax),
        hzB: r.next(), hzA: r.next(), cB: r.next(), csB: r.next(), cA: r.next(), csA: r.next(), first: r.next() };
      /* phase 1: fast arrivals (bots, co-located and fast players), ranked by latency */
      var acts = [];
      S.bots.forEach(function (bt) {
        var df = bt.def;
        if (bt.scratch) acts.push({ lat: df.lat, fn: function () { var s = bt.scratch; if (!s) return; bt.scratch = null; var L = touch(s.side); if (L.px === s.px) marketHit(s.side, s.size, 'scratch'); } });
        else if (bt.order) acts.push({ lat: df.lat, fn: function () {
          if (!bt.order) return;
          var L = levelAt(bt.order.side, bt.order.px), qp = L && queuePos(L, bt.order.id);
          if (!qp) { bt.order = null; return; }
          if (S.t - L.born >= 3 && qp.behind < df.pull) { cancelOrder(L, bt.order.id); bt.order = null; }
        } });
        else acts.push({ lat: df.lat, fn: function () {
          if (bt.order || bt.scratch) return;
          var side = S.bids[0].born === S.t - 1 ? 'bid' : S.asks[0].born === S.t - 1 ? 'ask' : null;
          if (!side) return;
          var L = touch(side), isPriv = df.id === 'priv';
          var youThere = S.you.order && S.you.order.side === side && findOrder(L, S.you.order.id) >= 0;
          addOrder(L, { id: oid('b'), who: isPriv ? 'priv' : 'bot', bot: df.id, size: df.size, t: S.t }, isPriv);   // privileged: straight to the head
          bt.order = { side: side, px: L.px, id: L.q[isPriv ? 0 : L.q.length - 1].id };
          if (isPriv && youThere) { S.privAhead++; if (S.you.tr && !S.you.tr.privAhead) { S.you.tr.privAhead = true; S.you.tr.joinPos++; S.you.tr.joinAhead += df.size; } }
        } });
      });
      var pend = S.you.pending;
      if (pend && !S.slow) { acts.push({ lat: S.latV, fn: function () { youAct(pend); } }); S.you.pending = null; }
      acts.forEach(function (x, i) { x.i = i; });
      acts.sort(function (a, b) { return a.lat - b.lat || a.i - b.i; });
      acts.forEach(function (x) { x.fn(); });
      /* phase 2: market events */
      ['bid', 'ask'].forEach(function (side) {
        var L = touch(side), u = side === 'bid' ? d.fadeB : d.fadeA;
        var fade = u < PRM.pFade, cut = 0;
        L.q.slice().forEach(function (o) { if (o.who === 'crowd' && rc.next() < (fade ? PRM.fadeCut : PRM.pCancel)) { cancelOrder(L, o.id); cut += o.size; } });
        if (fade && cut) note('fade', 'The ' + side + ' queue at ' + fmtPx(L.px) + ' is fading: ' + cut + ' lots cancelled.');
        if (!L.q.length && S.t - L.born >= 3) tickThrough(side, 'cancel');
      });
      var order = d.first < 0.5 ? ['bid', 'ask'] : ['ask', 'bid'];
      order.forEach(function (side) {
        var u = side === 'bid' ? d.mS : d.mB, sz = side === 'bid' ? d.sS : d.sB;
        if (u < PRM.pMkt && levelSize(touch(side))) { var px = touch(side).px; var n = marketHit(side, sz, 'flow'); note('mkt', 'Market ' + (side === 'bid' ? 'sell' : 'buy') + ' ' + n + ' lot' + (n === 1 ? '' : 's') + ' at ' + fmtPx(px) + '.'); }
      });
      order.forEach(function (side) {
        var L = touch(side), q = levelSize(L), u = side === 'bid' ? d.hzB : d.hzA;
        if (q > 0 && L.born < S.t && u < tickHazard(q)) { note('sweep', 'A large ' + (side === 'bid' ? 'sell' : 'buy') + ' swept all ' + q + ' lots at ' + fmtPx(L.px) + '.'); marketHit(side, q, 'sweep'); }
      });
      /* phase 3: slow arrivals (the crowd, then a retail-latency player) */
      ['bid', 'ask'].forEach(function (side) {
        var L = touch(side), u = side === 'bid' ? d.cB : d.cA, us = side === 'bid' ? d.csB : d.csA;
        if (L.born === S.t) return;            // nobody slow reaches a level born this tick
        var young = S.t - L.born <= 3;
        if (u < (young ? PRM.crowdYoung : PRM.crowdOld)) L.q.push({ id: oid('c'), who: 'crowd', size: young ? 2 + Math.floor(us * 4) : 1 + Math.floor(us * 3), t: S.t });
      });
      pend = S.you.pending;
      if (pend && S.slow) { youAct(pend); S.you.pending = null; }
      if (S.t >= S.steps) S.done = true;
    }
    function act(a) { if (['bid', 'ask', 'scratch', 'hold', 'cancel'].indexOf(a) >= 0) S.you.pending = a; }
    function finish() {
      var y = S.you;
      if (y.order) { var L = levelAt(y.order.side, y.order.px); if (L) cancelOrder(L, y.order.id); y.order = null; y.tr = null; }
      if (y.pos) {
        var T = touch(y.pos.lvSide), g = y.pos.side === 'long' ? T.px - y.pos.entry : y.pos.entry - T.px;
        y.tr.endFlat = true;
        closeTrade(g > 0 ? 'win' : g < 0 ? 'loss' : 'scratch', g, 'taker', T.px, 'flattened at the end');
      }
      S.done = true;
      return report();
    }
    function report() { return reportOf(S.trades, fees, S); }
    function levelView(L, isTouch) {
      var age = S.t - L.born;
      return { px: L.px, side: L.side, size: levelSize(L), touch: isTouch, isNew: L.born >= 0 && age <= 1, age: L.born >= 0 ? age : null,
        orders: isTouch ? L.q.map(function (o) { return { who: o.who, size: o.size, exit: !!o.exit, bot: o.bot }; }) : [{ who: 'crowd', size: levelSize(L) }] };
    }
    function view() {
      var y = S.you, v = { t: S.t, steps: S.steps, bids: S.bids.map(function (L, i) { return levelView(L, i === 0); }), asks: S.asks.map(function (L, i) { return levelView(L, i === 0); }),
        pending: y.pending, events: S.log.slice(-6), state: 'flat' };
      if (y.order) { var L = levelAt(y.order.side, y.order.px); v.state = 'resting'; v.side = y.order.side; v.px = y.order.px; v.qp = L ? queuePos(L, y.order.id) : null; }
      if (y.pos) {
        var T = touch(y.pos.lvSide), XL = touch(opp(y.pos.lvSide));
        v.state = y.pos.side; v.entry = y.pos.entry; v.entryLeft = T.px === y.pos.entry ? levelSize(T) : 0;
        v.exitQp = y.pos.exitId ? queuePos(XL, y.pos.exitId) : null; v.exitPx = XL.px; v.decided = y.tr && y.tr.decision;
      }
      var rp = report(); v.tally = { n: rp.n, w: rp.w, s: rp.s, l: rp.l, gross: rp.gross, net: rp.net };
      return v;
    }
    return { S: S, step: step, act: act, finish: finish, report: report, view: view, touch: touch, fees: fees,
      get t() { return S.t; }, get steps() { return S.steps; }, get done() { return S.done; }, get you() { return S.you; } };
  }

  function reportOf(trades, fees, S) {
    var n = trades.length, w = 0, s = 0, l = 0, gross = 0, net = 0, fee = 0, first = 0, firstW = 0, deepN = 0, deepW = 0, bad = 0, behind = 0, newLv = 0, holds = 0, scr = 0;
    trades.forEach(function (tr) {
      if (tr.outcome === 'win') w++; else if (tr.outcome === 'scratch') s++; else l++;
      gross += tr.gross; net += tr.net; fee += tr.fee;
      if (tr.joinPos === 1) { first++; if (tr.outcome === 'win') firstW++; } else { deepN++; if (tr.outcome === 'win') deepW++; }
      if (tr.fillBy && tr.fillBy !== 'flow') bad++;
      behind += tr.behindAtFill || 0;
      if (tr.newLevel) newLv++;
      if (tr.decision === 'scratch' || tr.decision === 'hold-scratch') scr++; else holds++;
    });
    return {
      n: n, w: w, s: s, l: l, gross: E.clean(gross), net: E.clean(net), fee: E.clean(fee),
      edgeGross: n ? E.clean(gross / n) : 0, edgeNet: n ? E.clean(net / n) : 0, scratchRate: n ? s / n : 0, winRate: n ? w / n : 0, lossRate: n ? l / n : 0,
      firstRate: n ? first / n : 0, first: first, firstWin: first ? firstW / first : null, deepWin: deepN ? deepW / deepN : null, deepN: deepN,
      badFills: bad, meanBehind: n ? behind / n : 0, newLevelRate: n ? newLv / n : 0, scratchCalls: scr, holds: holds,
      abandons: S ? S.abandons : 0, pulled: S ? S.pulled : 0, ticks: S ? S.ticks : 0, newLevels: S ? S.newLevels : 0, privAhead: S ? S.privAhead : 0,
      fees: { maker: fees.maker, taker: fees.taker }, closedFormEV: n ? E.clean(tradeEV(w / n, s / n, l / n, fees)) : 0
    };
  }

  /* Reference 0+ algorithm: join only brand-new levels, abandon a level when fewer than 3 lots are queued behind,
   * scratch as soon as fewer than 4 lots remain at the entry price, otherwise hold for the tick. */
  function autoPolicy(sim) {
    var S = sim.S, y = S.you;
    if (y.pos) { var T = sim.touch(y.pos.lvSide); return T.px === y.pos.entry && sumSize(T) < AUTO.scratchBelow ? 'scratch' : null; }
    if (y.order) {
      var L = sim.touch(y.order.side);
      if (L.px !== y.order.px) return null;
      var qp = queuePos(L, y.order.id);
      return qp && qp.behind < AUTO.cancelBelow && S.t - L.born >= 2 ? 'cancel' : null;
    }
    if (S.bids[0].born === S.t) return 'bid';
    if (S.asks[0].born === S.t) return 'ask';
    return null;
  }
  function sumSize(L) { return levelSize(L); }
  function runAuto(seed, opt, policy) {
    var sim = createSim(seed, opt);
    policy = policy || autoPolicy;
    while (!sim.done) { var a = policy(sim); if (a) sim.act(a); sim.step(); }
    var rep = sim.finish();
    rep.trades = sim.S.trades;
    return rep;
  }
  /* Rule-based debrief. */
  function debrief(rep, o) {
    o = o || {};
    var out = [], f = rep.fees, rt = f.maker + f.taker;
    if (2 * f.maker >= 1 || rt >= 1) out.push({ k: 'bad', t: 'Fees: a win nets 1 − 2×' + f.maker + ' = ' + E.clean(1 - 2 * f.maker) + ' ticks and a scratch costs ' + E.clean(rt) + ' ticks. When the fee per side is above half a tick, even a perfect “win a tick or scratch” record loses money — scratching is negative EV at these fees.' });
    if (!rep.n) { out.push({ k: 'info', t: 'No trades. Right after a tick-through the new level is empty: join it at once (B or A) to be first in the queue.' }); return out; }
    if (o.scen === 'nofifo') out.push({ k: 'bad', t: 'A privileged order sat ahead of you at ' + rep.privAhead + ' level' + (rep.privAhead === 1 ? '' : 's') + '. Once an order type can jump the queue, being fastest no longer makes you #1, and the small, harmless fills go to the order in front of you. This is the rule risk behind the “Hide Not Slide” story.' });
    if (o.lat === 'retail') out.push({ k: 'bad', t: 'With retail latency your orders landed after the bots and the crowd, so you were #1 in ' + Math.round(100 * rep.firstRate) + '% of trades. The strategy assumes you are the fastest.' });
    else if (o.scen !== 'nofifo' && rep.n >= 3 && rep.firstRate < 0.4) out.push({ k: 'info', t: 'You were #1 in only ' + Math.round(100 * rep.firstRate) + '% of trades. Joining an established queue puts you at the back, where you mostly get filled when the level is about to break.' });
    if (rep.lossRate > 0.3) out.push({ k: 'bad', t: Math.round(100 * rep.lossRate) + '% of trades lost a tick. Scratch as soon as the size left at your price gets thin (≈ 6 lots) — the scratch only works while someone is still queued behind you.' });
    if (rep.badFills >= 2 && rep.badFills / rep.n > 0.25) out.push({ k: 'bad', t: rep.badFills + ' of your fills came from a sweep or from the last lots of a queue: adverse selection. Being filled at the back usually means the price is about to move against you.' });
    if (rep.scratchRate > 0.75 && rep.n >= 4) out.push({ k: 'info', t: 'You scratched ' + Math.round(100 * rep.scratchRate) + '% of trades. Scratching is the insurance; the profit is the tick you earn when you hold a strong queue.' });
    if (rep.firstWin != null && rep.deepWin != null && rep.first >= 2 && rep.deepN >= 2) out.push({ k: 'info', t: 'Win rate as #1: ' + Math.round(100 * rep.firstWin) + '%; deeper in the queue: ' + Math.round(100 * rep.deepWin) + '%.' });
    if (rep.net > 0) out.push({ k: 'ok', t: 'Positive edge: ' + E.clean(E.round(rep.edgeNet, 3)) + ' ticks per trade after fees. Wins of +1 against scratches at 0 make the distribution lopsided — the “slightly better than 50/50” claim, in this toy model.' });
    else if (rep.gross > 0) out.push({ k: 'info', t: 'Gross edge was positive (' + E.clean(E.round(rep.edgeGross, 3)) + ' ticks per trade) but fees took ' + E.clean(E.round(rep.fee / rep.n, 3)) + ' per trade.' });
    return out;
  }

  var QE = {
    STEPS: STEPS, NLV: NLV, PX0: PX0, LOT: LOT, P_MKT: P_MKT, P_FADE: P_FADE, HZ_MAX: HZ_MAX, HZ_SCALE: HZ_SCALE, CROWD_LAT: CROWD_LAT,
    BOTS: BOTS, PRIV: PRIV, SCEN: SCEN, LAT: LAT, MAKER_OPTS: MAKER_OPTS, TAKER_OPTS: TAKER_OPTS, AUTO: AUTO, PRM: PRM,
    mkLevel: mkLevel, levelSize: levelSize, addOrder: addOrder, cancelOrder: cancelOrder, fillMarket: fillMarket, queuePos: queuePos,
    tickHazard: tickHazard, zeroPlusEV: zeroPlusEV, breakevenFee: breakevenFee, tradeEV: tradeEV, tradeFee: tradeFee, fmtPx: fmtPx,
    createSim: createSim, reportOf: reportOf, autoPolicy: autoPolicy, runAuto: runAuto, debrief: debrief
  };
  var META = {
    id: 'queue', name: 'Queue Position', icon: 'queue', group: 'market', color: 'var(--c-micro, var(--c-mm))',
    desc: 'A FIFO limit-order book: race to the front of new price levels, then scratch at 0 or hold for a tick. Fees, latency and a broken-FIFO scenario.',
    skills: ['Microstructure', 'Queue priority', 'Fees vs tick'],
    firms: ['Hudson River Trading', 'Jump Trading', 'Virtu', 'Tower Research', 'Citadel Securities', 'XTX Markets'],
    why: 'HFT and electronic market-making interviews probe queue priority, maker/taker fees versus the tick size, and adverse selection.',
    variants: [{ id: 'hft', name: 'HFT fees' }, { id: 'retail', name: 'Retail fees' }, { id: 'nofifo', name: 'FIFO broken' }, { id: 'custom', name: 'Custom fees' }]
  };
  AR.queue = { engine: QE, meta: META };
  if (Array.isArray(AR.games) && !AR.games.some(function (g) { return g.id === 'queue'; })) {
    AR.games.push({ id: META.id, name: META.name, desc: META.desc, skills: META.skills.slice(), firms: META.firms.slice(), why: META.why, href: '#arcade/queue',
      variants: META.variants.map(function (v) { return { id: v.id, name: v.name, href: '#arcade/queue/' + v.id }; }) });
  }

  /* ================================================================== */
  /* UI plugin                                                           */
  /* ================================================================== */
  (root.SBT_PLUGINS = root.SBT_PLUGINS || []).push(function (core) {
    var U = AR._ui;
    if (!U || !U.Shell || !U.GDEF || !U.GAMES) return;
    var esc = core.esc, $all = core.$all, ICONS = core.ICONS;
    if (!U.GAME.queue) { U.GAMES.push(META); U.GAME.queue = META; }
    U.IC.queue = core.svg('<path d="M4 5h8M4 9h12"/><path d="M4 15h6M4 19h11"/><path d="M19 4v16" stroke-dasharray="2 2"/>');
    var TEMPO = { slow: 900, normal: 600, fast: 350 };

    function num(x, dp) { if (x === null || x === undefined || !isFinite(x)) return '—'; var s = E.fmtNum(x, dp == null ? 2 : dp); return s.charAt(0) === '-' ? '−' + s.slice(1) : s; }
    function signed(x, dp) { if (!isFinite(x)) return '—'; var v = E.round(x, dp == null ? 2 : dp); return (v > 0 ? '+' : v < 0 ? '−' : '') + E.fmtNum(Math.abs(v), dp == null ? 2 : dp); }
    function pct(x) { return Math.round(100 * x) + '%'; }
    function tiles(items) { return '<div class="ar-tiles">' + items.map(function (t) { return '<div class="stat-tile"><div class="v' + (t.cls ? ' ' + t.cls : '') + '">' + t.v + '</div><div class="l">' + esc(t.l) + '</div></div>'; }).join('') + '</div>'; }
    function base(ctx, extra) { var o = { g: ctx.g, rv: ctx.rv, routeV: ctx.v, seed: ctx.seed, challenge: ctx.challenge, ghost: null, settings: ctx.settings || {} }; Object.keys(extra).forEach(function (k) { o[k] = extra[k]; }); return o; }
    function latOf(p) { return LAT[p.lat] ? p.lat : 'colo'; }
    function idx(v, list, d) { v = Math.round(+v); return v >= 0 && v < list.length ? v : d; }
    function feesFor(v, p) {
      if (v === 'custom') return { maker: MAKER_OPTS[idx(p.mk, MAKER_OPTS, 3)], taker: TAKER_OPTS[idx(p.tk, TAKER_OPTS, 2)] };
      var s = SCEN[v] || SCEN.hft; return { maker: s.maker, taker: s.taker };
    }
    function feeTxt(x) { return x < 0 ? 'rebate ' + num(-x, 2) : num(x, 2); }

    U.GDEF.queue = {
      rules: ['A limit order book with a 1-cent tick (prices around $50). Each price level is a FIFO queue: market orders fill resting orders strictly in arrival order. Orders are 1 lot = 100 shares, so 1 tick = $1.',
        'Join the best bid (B) or ask (A). Right after a tick-through a new, empty level appears — the fastest order there is #1. Bots α, β, γ race you by latency; the crowd arrives later.',
        'When you are filled, an exit order is placed one tick better at the back of the other queue. Hold (H) for that tick, or Scratch (S): trade back at your entry price against the orders queued behind you — 0 ticks before fees. C cancels a resting order.',
        'If your entry level empties (a sweep, or the queue simply runs out) you are flattened one tick worse. Thin queues tick through more often: sweep hazard h(q) = 0.2·e^(−q/3) per tick, q = lots at the touch.',
        'Fees per share in ticks: entry is a maker order; a win exits as maker, a scratch or stop-out as taker. Score = net P&L in ticks per share (= $ per lot). Between ticks the clock is frozen: an order you send arrives on the next tick.'],
      recVariant: function (v, p) { var l = latOf(p); if (v === 'custom') return 'custom-' + idx(p.mk, MAKER_OPTS, 3) + 'x' + idx(p.tk, TAKER_OPTS, 2) + '-' + l; return v + '-' + l; },
      fromRec: function (rv, p) {
        var m = /^(hft|retail|nofifo)-(colo|fast|retail)$/.exec(rv); if (m) { p.lat = m[2]; return m[1]; }
        m = /^custom-(\d)x(\d)-(colo|fast|retail)$/.exec(rv); if (m) { p.mk = +m[1]; p.tk = +m[2]; p.lat = m[3]; return 'custom'; }
        return rv;
      },
      variantLabel: function (rv) {
        var m = /^custom-(\d)x(\d)-(colo|fast|retail)$/.exec(rv);
        if (m) return 'Custom (maker ' + feeTxt(MAKER_OPTS[+m[1]] || 0) + ', taker ' + num(TAKER_OPTS[+m[2]] || 0, 2) + ') · ' + LAT[m[3]].name;
        var a = /^(hft|retail|nofifo)-(colo|fast|retail)$/.exec(rv);
        return a ? ({ hft: 'HFT fees', retail: 'Retail fees', nofifo: 'FIFO broken' })[a[1]] + ' · ' + LAT[a[2]].name : rv;
      },
      fmt: function (v) { return signed(v, 2); }, ghost: false,
      landingTop: function () {
        return '<div class="banner qp-note"><p class="small" style="margin:0"><b>Illustrative model.</b> The “0+” queue strategy comes from a promotional blog post by a crypto exchange (2023); its claims are unverified. ' +
          'This toy book shows the logic — time priority, scratching, fees versus tick size, latency and rule risk — not evidence that the strategy works. ' +
          '<a href="#learn/ms-zero-plus">Read the lesson</a>.</p></div>';
      },
      settings: function (v, p) {
        var l = latOf(p), tp = TEMPO[p.tempo] ? p.tempo : 'normal', f = feesFor(v, p), h = '';
        h += '<div class="frow"><span class="label">Your latency</span><div class="seg" role="group" aria-label="Latency">' + ['colo', 'fast', 'retail'].map(function (x) { return '<button type="button" data-setv="lat" data-val="' + x + '" aria-pressed="' + (x === l) + '">' + LAT[x].name + '</button>'; }).join('') + '</div>' +
          '<span class="muted small">' + esc(LAT[l].name + ': ' + LAT[l].desc + '.') + '</span></div>';
        h += '<div class="frow"><span class="label">Tempo</span><div class="seg" role="group" aria-label="Tempo">' + ['slow', 'normal', 'fast'].map(function (x) { return '<button type="button" data-setv="tempo" data-val="' + x + '" aria-pressed="' + (x === tp) + '">' + x.charAt(0).toUpperCase() + x.slice(1) + '</button>'; }).join('') + '</div>' +
          '<span class="muted small">' + STEPS + ' ticks, one every ' + (TEMPO[tp] / 1000) + ' s.</span></div>';
        if (v === 'custom') {
          var opt = function (list, cur) { return list.map(function (x, i) { return '<option value="' + i + '"' + (i === cur ? ' selected' : '') + '>' + (x < 0 ? '−' + Math.abs(x) + ' (rebate)' : x) + '</option>'; }).join(''); };
          h += '<div class="ar-setrow"><label class="frow"><span class="label">Maker fee (ticks/share)</span><select data-set="mk">' + opt(MAKER_OPTS, idx(p.mk, MAKER_OPTS, 3)) + '</select></label>' +
            '<label class="frow"><span class="label">Taker fee (ticks/share)</span><select data-set="tk">' + opt(TAKER_OPTS, idx(p.tk, TAKER_OPTS, 2)) + '</select></label></div>';
        }
        var win = E.clean(1 - 2 * f.maker), scr = E.clean(-f.maker - f.taker), los = E.clean(-1 - f.maker - f.taker);
        h += '<div class="table-scroll"><table class="simple small qp-ftab"><caption class="sr-only">Net ticks per trade outcome</caption><thead><tr><th>Fees (ticks/share)</th><th>Win</th><th>Scratch</th><th>Loss</th></tr></thead><tbody>' +
          '<tr><td>maker ' + esc(feeTxt(f.maker)) + ' · taker ' + num(f.taker, 2) + '</td><td class="mono">' + signed(win, 2) + '</td><td class="mono">' + signed(scr, 2) + '</td><td class="mono">' + signed(los, 2) + '</td></tr></tbody></table></div>' +
          '<p class="muted small" style="margin:0">Break-even for an ideal “win a tick or scratch” trader with win rate p: fee per side &lt; p/2 tick. ' + (v === 'retail' ? 'About 5 bp of a $50 stock is 2.5 cents a side — 2.5 ticks.' : v === 'nofifo' ? 'Same fees as HFT, but a privileged order type jumps ahead of you at every new level.' : '') + '</p>';
        return h;
      },
      start: function (main, ctx) {
        var p = ctx.prefs, l = latOf(p), f = feesFor(ctx.v, p);
        var tempo = isFinite(+p.tempoMs) && +p.tempoMs > 0 ? E.clamp(+p.tempoMs, 20, 3000) : (TEMPO[p.tempo] || TEMPO.normal);
        var simOpt = { scen: ctx.v, lat: l, maker: f.maker, taker: f.taker };
        var sim = createSim(ctx.seed, simOpt), sh;
        ctx.settings = { scen: ctx.v, lat: l, maker: f.maker, taker: f.taker };
        sh = U.Shell(main, base(ctx, { title: 'Queue Position', scoreLabel: 'net ticks', scoreText: function (v) { return signed(v, 2); }, rounds: true,
          rightText: function () { return Math.max(0, sim.steps - sim.t) + ' ticks left'; }, hint: 'B / A join · S scratch · H hold · C cancel.',
          onStart: function () { render(); sh.later(loop, tempo); },
          result: function () {
            var rep = sim.finish(), ref = runAuto(ctx.seed, simOpt);
            return { score: E.round(rep.net, 2), scoreText: signed(rep.net, 2) + ' ticks', scoreLabel: 'net P&L after fees · gross ' + signed(rep.gross, 2),
              x: { n: rep.n, w: rep.w, s: rep.s, l: rep.l, gross: rep.gross, net: rep.net, first: E.round(rep.firstRate, 3), ref: ref.net },
              details: details(rep, ref, sim.S.trades, ctx.v, l) };
          } }));
        sh.body.innerHTML = '<div class="qp-wrap">' +
          '<div class="qp-meta small muted">' + esc(SCEN[ctx.v] ? SCEN[ctx.v].name : '') + ' · ' + esc(LAT[l].name) + ' · maker ' + esc(feeTxt(f.maker)) + ', taker ' + num(f.taker, 2) + ' ticks/share</div>' +
          '<div class="qp-book" id="qpBook" role="img" aria-label="Order book"></div>' +
          '<div class="qp-you" id="qpYou" aria-live="polite"></div>' +
          '<div class="qp-actions" id="qpAct">' +
          '<button type="button" class="btn" data-qa="bid">Join bid <span class="kbd">B</span></button>' +
          '<button type="button" class="btn" data-qa="ask">Join ask <span class="kbd">A</span></button>' +
          '<button type="button" class="btn" data-qa="scratch">Scratch <span class="kbd">S</span></button>' +
          '<button type="button" class="btn" data-qa="hold">Hold <span class="kbd">H</span></button>' +
          '<button type="button" class="btn ghost" data-qa="cancel">Cancel <span class="kbd">C</span></button></div>' +
          '<div class="qp-tally small" id="qpTally"></div>' +
          '<ul class="qp-feed small" id="qpFeed"></ul></div>';
        $all('[data-qa]', sh.body).forEach(function (b) { b.addEventListener('click', function () { send(b.getAttribute('data-qa')); }); });
        function send(a) {
          if (!sh.running || sim.done) return;
          var v = sim.view();
          if ((a === 'bid' || a === 'ask') && (v.state === 'long' || v.state === 'short')) return;
          if ((a === 'scratch' || a === 'hold') && !(v.state === 'long' || v.state === 'short')) return;
          if (a === 'cancel' && v.state !== 'resting') return;
          sim.act(a); render();
        }
        function loop() {
          if (sim.done) return;
          if (sh.running) {
            sim.step(); render();
            if (sim.done) { sh.finish(false); return; }
          }
          sh.later(loop, tempo);
        }
        function ladderRow(L, kind, maxV) {
          var w = Math.max(L.size ? 6 : 0, Math.min(100, L.size / maxV * 100));
          var segs = L.orders.filter(function (o) { return o.size > 0; }).map(function (o) {
            return '<i class="qp-o ' + o.who + (o.exit ? ' exit' : '') + '" style="flex-grow:' + o.size + '" title="' + esc((o.who === 'you' ? (o.exit ? 'Your exit' : 'You') : o.who === 'bot' ? 'Bot' : o.who === 'priv' ? 'Privileged order' : 'Crowd') + ': ' + o.size + ' lot' + (o.size === 1 ? '' : 's')) + '"></i>';
          }).join('');
          return '<div class="qp-row ' + kind + (L.touch ? ' touch' : '') + (L.isNew ? ' new' : '') + '"><span class="qp-px mono">' + fmtPx(L.px) + '</span><span class="qp-sz mono">' + L.size + '</span>' +
            '<span class="qp-track"><span class="qp-bar" style="width:' + w.toFixed(1) + '%">' + segs + '</span></span><span class="qp-tag">' + (L.isNew ? 'new' : L.touch ? (kind === 'ask' ? 'best ask' : 'best bid') : '') + '</span></div>';
        }
        function render() {
          var v = sim.view(), maxV = 24;
          v.bids.concat(v.asks).forEach(function (L) { if (L.size > maxV) maxV = L.size; });
          sh.$('#qpBook').innerHTML = v.asks.slice().reverse().map(function (L) { return ladderRow(L, 'ask', maxV); }).join('') +
            '<div class="qp-mid small muted">spread 1 tick · ' + v.t + ' / ' + v.steps + '</div>' + v.bids.map(function (L) { return ladderRow(L, 'bid', maxV); }).join('');
          var y = '', st = v.state;
          if (st === 'flat') y = '<b>Flat.</b> Join the bid or the ask. Right after a tick-through the new level is empty — the first order there is #1.';
          else if (st === 'resting') {
            var q = v.qp;
            y = '<b>Resting ' + (v.side === 'bid' ? 'buy' : 'sell') + ' 1 lot @ ' + fmtPx(v.px) + '</b>' + (q ? ' · <b>#' + q.pos + ' of ' + q.n + '</b> · ahead ' + q.ahead + ' lots · behind ' + q.behind + ' lots · strength ' + q.total : '') +
              (q && q.behind < 3 ? '<br><span class="res-bad">Thin queue behind you: if you get filled now there is little to scratch into.</span>' : '');
          } else {
            var lng = st === 'long';
            y = '<b>' + (lng ? 'Long' : 'Short') + ' 1 lot from ' + fmtPx(v.entry) + '</b> · size left at ' + fmtPx(v.entry) + ': <b>' + v.entryLeft + ' lots</b>' +
              (v.exitQp ? ' · exit ' + fmtPx(v.exitPx) + ': #' + v.exitQp.pos + ' of ' + v.exitQp.n + ' (' + v.exitQp.ahead + ' lots ahead)' : '') +
              '<br>' + (v.decided ? '<span class="muted">Holding for the tick — S still scratches.</span>' : '<span>Scratch (S) at 0, or Hold (H) for +1?</span>') +
              (v.entryLeft < 6 ? ' <span class="res-bad">The queue behind you is thin.</span>' : '');
          }
          if (v.pending) y += '<br><span class="muted small">Sent: ' + esc(v.pending) + ' — arrives next tick (' + esc(LAT[l].name.toLowerCase()) + ').</span>';
          sh.$('#qpYou').innerHTML = y;
          var pos = st === 'long' || st === 'short';
          $all('[data-qa]', sh.body).forEach(function (b) {
            var a = b.getAttribute('data-qa');
            b.disabled = (a === 'bid' || a === 'ask') ? pos || (st === 'resting' && v.side === a) : (a === 'scratch') ? !pos : (a === 'hold') ? !pos || !!v.decided : st !== 'resting';
            b.setAttribute('aria-pressed', String(v.pending === a));
          });
          var T = v.tally;
          sh.$('#qpTally').innerHTML = '<span><b>' + T.n + '</b> trades</span><span>' + T.w + ' win · ' + T.s + ' scratch · ' + T.l + ' loss</span><span>gross <b class="mono">' + signed(T.gross, 2) + '</b></span><span>net <b class="mono">' + signed(T.net, 2) + '</b></span>';
          sh.$('#qpFeed').innerHTML = v.events.slice(-4).reverse().map(function (e) { return '<li class="k-' + e.k + '"><span class="mono muted">t' + e.t + '</span> ' + esc(e.txt) + '</li>'; }).join('');
          sh.setScore(E.round(T.net, 2), true);
          var bar = sh.$('#arBar > div'); if (bar) bar.style.width = (100 * Math.max(0, v.steps - v.t) / v.steps).toFixed(1) + '%';
        }
        sh.keys(function (e) {
          var k = (e.key || '').toLowerCase(), m = { b: 'bid', a: 'ask', s: 'scratch', h: 'hold', c: 'cancel' }[k];
          if (m) { e.preventDefault(); send(m); }
        });
      }
    };

    function distBars(rep) {
      var rows = [['win', 'Win (+1)', rep.w], ['scratch', 'Scratch (0)', rep.s], ['loss', 'Loss (−1)', rep.l]], n = Math.max(1, rep.n);
      return '<div class="qp-dist" role="img" aria-label="Win ' + rep.w + ', scratch ' + rep.s + ', loss ' + rep.l + '">' + rows.map(function (r) {
        return '<div class="qp-drow ' + r[0] + '"><span>' + r[1] + '</span><span class="qp-dtrack"><i class="qp-d ' + r[0] + '" style="width:' + (100 * r[2] / n).toFixed(1) + '%"></i></span><b class="mono">' + r[2] + '</b></div>';
      }).join('') + '</div>';
    }
    function details(rep, ref, trades, scen, l) {
      var db = debrief(rep, { scen: scen, lat: l }), f = rep.fees;
      var rows = trades.map(function (tr, j) {
        return '<tr><td>' + (j + 1) + '</td><td>' + (tr.side === 'long' ? 'buy' : 'sell') + ' ' + fmtPx(tr.entry) + '</td><td class="mono">#' + tr.joinPos + (tr.newLevel ? ' <span class="muted">new</span>' : '') + '</td><td>' + esc(tr.fillBy || '') + '</td><td>' + esc(tr.outcome) + (tr.endFlat ? ' <span class="muted">(end)</span>' : '') + '</td><td class="mono">' + signed(tr.gross, 0) + '</td><td class="mono">' + signed(tr.net, 2) + '</td></tr>';
      }).join('');
      var p = rep.n ? rep.w / rep.n : 0;
      return tiles([{ v: rep.n, l: 'fills (trades)' }, { v: rep.n ? pct(rep.scratchRate) : '—', l: 'scratch rate' }, { v: signed(rep.gross, 2), l: 'P&L before fees (ticks)' },
        { v: signed(rep.net, 2), l: 'P&L after fees (ticks)', cls: rep.net > 0 ? 'res-ok' : rep.net < 0 ? 'res-bad' : '' }]) +
        '<div class="ar-panel"><h3>Win / scratch / loss</h3>' + distBars(rep) +
        '<p class="small">Edge per trade: <b>' + signed(rep.edgeGross, 3) + '</b> ticks before fees, <b>' + signed(rep.edgeNet, 3) + '</b> after (×$1 per 100-share lot). You were #1 in ' + (rep.n ? pct(rep.firstRate) : '—') + ' of trades.</p>' +
        '<p class="small">Closed form with your frequencies: EV = p<sub>w</sub>(1 − 2m) + p<sub>s</sub>(−m − t) + p<sub>l</sub>(−1 − m − t) = <b>' + signed(rep.closedFormEV, 3) + '</b> ticks per trade, with maker m = ' + num(f.maker, 2) + ' and taker t = ' + num(f.taker, 2) + '. ' +
        'The ideal 0+ trader (never loses, fee c per side) earns p − 2c: at your win rate p = ' + num(p, 2) + ' that breaks even at c = ' + num(breakevenFee(p, 1), 3) + ' tick.</p></div>' +
        '<div class="ar-panel"><h3>Reference algorithm, same seed</h3><p class="small">Joins only brand-new levels, abandons a level when fewer than ' + AUTO.cancelBelow + ' lots queue behind it, scratches when fewer than ' + AUTO.scratchBelow + ' lots remain at the entry price, otherwise holds: ' +
        '<b>' + ref.n + '</b> trades (' + ref.w + ' / ' + ref.s + ' / ' + ref.l + '), net <b>' + signed(ref.net, 2) + '</b> ticks (gross ' + signed(ref.gross, 2) + ').</p></div>' +
        '<div class="ar-panel"><h3>Debrief</h3><ul class="qp-debrief small">' + db.map(function (x) { return '<li class="' + x.k + '">' + esc(x.t) + '</li>'; }).join('') + '</ul>' +
        '<p class="muted small" style="margin:.4rem 0 0">Toy model of a promotional idea: real books have hidden orders, many venues, queue-position games and fee tiers. <a href="#learn/ms-rule-risk">Rule risk: the Hide Not Slide story</a>.</p></div>' +
        '<details class="reveal"><summary>' + ICONS.book + '<span>Trade by trade</span><span class="chev" aria-hidden="true">▾</span></summary><div class="rbody table-scroll"><table class="simple"><thead><tr><th>#</th><th>Entry</th><th>Queue</th><th>Fill</th><th>Outcome</th><th>Gross</th><th>Net</th></tr></thead><tbody>' + rows + '</tbody></table></div></details>';
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
