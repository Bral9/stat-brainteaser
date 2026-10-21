/* Stat Brainteaser — competition coach logic (QUMC / Putnam).
 * Deterministic, offline "smart planner": seasons, mastery model, day-by-day plan generation,
 * adaptation rules, diagnostic placement, mock results, and the reflection journal store.
 * Views live in coach-ui.js. Registers itself as a plugin with app.js (window.SBT_PLUGINS). */
(window.SBT_PLUGINS = window.SBT_PLUGINS || []).push(function (core) {
  'use strict';
  var D = window.SBT_COMP;
  if (!D) return;
  var K = window.SBT_COACH = { core: core, D: D };

  /* ------------------------------------------------------------------ */
  /* Data indexes                                                        */
  /* ------------------------------------------------------------------ */
  var COMP_LIST = D.competitions.competitions, COMPS = {};
  COMP_LIST.forEach(function (c) { COMPS[c.id] = c; });
  var NODE_LIST = D.syllabus.nodes, NODES = {};
  NODE_LIST.forEach(function (n) { NODES[n.id] = n; });
  var GROUPS = D.syllabus.groups;
  var CP_LIST = D.problems.problems, CP = {};
  CP_LIST.forEach(function (p) { CP[p.id] = p; });
  var PL = D.plans;
  var PHASES = {}; PL.phases.forEach(function (p) { PHASES[p.id] = p; });
  var TPL = {}; PL.sessionTemplates.forEach(function (t) { TPL[t.id] = t; });
  var MOCK_LIST = D.mocks.mocks.slice(), MOCKS = {};
  // Composite: the 2026 four-session Putnam rhythm = half paper 1 + half paper 2 back to back.
  (function () {
    var h1 = D.mocks.mocks.filter(function (m) { return m.id === 'putnam-half-1'; })[0];
    var h2 = D.mocks.mocks.filter(function (m) { return m.id === 'putnam-half-2'; })[0];
    if (h1 && h2) MOCK_LIST.push({
      id: 'putnam-full-1', competition: 'putnam', name: 'Full Putnam day (4 × 90 min)', durationMinutes: 360,
      problemIds: h1.problemIds.concat(h2.problemIds), blocks: h1.blocks.concat(h2.blocks), includes: ['putnam-half-1', 'putnam-half-2'],
      description: 'Half papers 1 and 2 in the real 2026 rhythm: four 90-minute sessions of 3 problems, 15-minute breaks after sessions 1 and 3 and a long lunch break after session 2.',
      instructions: h1.instructions, levels: h1.levels.concat(h2.levels), groups: h1.groups.concat(h2.groups), optional: true
    });
  })();
  MOCK_LIST.forEach(function (m) { MOCKS[m.id] = m; });
  K.COMP_LIST = COMP_LIST; K.COMPS = COMPS; K.NODE_LIST = NODE_LIST; K.NODES = NODES; K.GROUPS = GROUPS;
  K.CP_LIST = CP_LIST; K.CP = CP; K.PL = PL; K.PHASES = PHASES; K.TPL = TPL; K.MOCK_LIST = MOCK_LIST; K.MOCKS = MOCKS;

  /* ------------------------------------------------------------------ */
  /* Dates                                                               */
  /* ------------------------------------------------------------------ */
  var addDays = core.addDays, ymd = core.ymd, parseYmd = core.parseYmd;
  function today() { return core.today(); }
  function daysBetween(a, b) { return Math.round((parseYmd(b) - parseYmd(a)) / 864e5); }
  function firstWeekday(year, month, wd) { var d = new Date(year, month, 1); while (d.getDay() !== wd) d.setDate(d.getDate() + 1); return ymd(d); }
  function putnamDate(y) { return firstWeekday(y, 11, 6); }            // first Saturday of December
  function qumcDefault(y) {                                             // ISM announces it each year
    var d = COMPS.qumc && COMPS.qumc.date2026 && COMPS.qumc.date2026.date;
    if (d && +d.slice(0, 4) === y) return d;
    return firstWeekday(y, 10, 5);                                      // estimate: first Friday of November
  }
  function weekdayIdx(d) { return (parseYmd(d).getDay() + 6) % 7; }     // 0 = Monday
  function seasonLabel(y) { return y + '–' + core.pad2((y + 1) % 100); }
  K.daysBetween = daysBetween; K.putnamDate = putnamDate; K.qumcDefault = qumcDefault; K.seasonLabel = seasonLabel; K.weekdayIdx = weekdayIdx;

  /* ------------------------------------------------------------------ */
  /* State                                                               */
  /* ------------------------------------------------------------------ */
  function defaults() {
    return {
      season: 0, seasons: {}, forcedSeason: 0,
      setup: null,       // {targets, hours, days[7], background:{proofs, courses}, wantDiag, created}
      mastery: {},       // node -> {m, n, tl, since, recent:[{k,s,l,h,d}]}
      attempts: {},      // pid -> [{t, d, s, g, sc, h, min, mode, ok}]
      retry: {},         // pid -> {due, stage}
      plan: null,        // {created, days, segments, history}
      planSeed: 1,
      done: {},          // manual / event task completion keys
      lessonsRead: {},   // node -> date
      visits: {},        // node -> last visit date
      boost: {},         // node -> {from, d}
      diag: null,        // {started, done, scores, total, placement, d}
      mocks: [],         // results
      activeMock: null,
      refs: {},          // Putnam ref id -> 'attempted' | 'solved'
      reviews: [],
      changes: [],       // [{d, msg, kind}]
      flags: { prereq: {}, stuckUntil: '', writeupUntil: '', lightUntil: '' },
      settings: { mixInDaily: false, reflectQuant: false, dailyPromptDismissed: '' }
    };
  }
  function C() {
    var s = core.S;
    if (!s.comp || !s.comp._v) { s.comp = core.mergeDefaults(core.isPlainObj(s.comp) ? s.comp : {}, defaults()); s.comp._v = 1; }
    return s.comp;
  }
  K.C = C;
  function save() { core.save(); }

  /* ------------------------------------------------------------------ */
  /* Seasons                                                             */
  /* ------------------------------------------------------------------ */
  function contestYear(t) { var y = +t.slice(0, 4); return t <= addDays(putnamDate(y), 14) ? y : y + 1; }
  function newSeason(y, yoc, prev) {
    return {
      year: y, label: seasonLabel(y), yearOfCompeting: yoc, started: today(),
      dates: { qumc: qumcDefault(y), putnam: putnamDate(y) }, dateEdited: {},
      checklist: { qumc: {}, putnam: {} }, results: {}, reviewDone: {}, archived: false,
      fromLast: prev ? (prev.lessonsForNext || '') : ''
    };
  }
  function snapshot() {
    var c = C(), ms = NODE_LIST.map(function (n) { return mval(n.id); });
    var solved = CP_LIST.filter(function (p) { return probStatus(p.id) === 'solved'; }).length;
    return {
      masteryAvg: ms.reduce(function (a, b) { return a + b; }, 0) / ms.length,
      mastered: NODE_LIST.filter(function (n) { return isMastered(n.id); }).length,
      solved: solved, attempts: Object.keys(c.attempts).reduce(function (a, k) { return a + c.attempts[k].length; }, 0),
      journal: J.entries.length, mocks: c.mocks.length
    };
  }
  function ensureSeason() {
    var c = C(), t = today();
    var y = Math.max(contestYear(t), c.forcedSeason || 0);
    if (!c.season || !c.seasons[c.season]) {
      c.seasons[y] = c.seasons[y] || newSeason(y, 1);
      c.season = y; save(); return;
    }
    if (c.season < y) {
      var old = c.seasons[c.season];
      old.archived = true; old.archivedOn = t; old.snapshot = snapshot();
      var yoc = (old.yearOfCompeting || 1) + (y - c.season);
      c.seasons[y] = newSeason(y, yoc, old);
      c.season = y;
      if (c.plan) { c.plan = null; }
      if (c.setup) c.setup.needsReview = true;
      c.mocks.forEach(function (m) { m.season = m.season || old.year; });
      addChange('New season ' + seasonLabel(y) + ' started (year ' + yoc + ' of competing). Mastery, journal and history carry over — review your setup to plan for the new dates.', 'season');
      save();
    }
  }
  function season() { ensureSeason(); return C().seasons[C().season]; }
  function compDate(id) { return season().dates[id]; }
  function setCompDate(id, d) { var s = season(); s.dates[id] = d; s.dateEdited[id] = true; save(); if (C().plan) replan('date'); }
  function startNextSeason() { var c = C(); c.forcedSeason = (c.season || contestYear(today())) + 1; ensureSeason(); }
  function seasonOver() { var s = season(), t = today(); return ['qumc', 'putnam'].every(function (id) { return s.dates[id] < t; }); }
  function yearKey(yoc) { return yoc >= 3 ? 'year3plus' : 'year' + yoc; }
  K.contestYear = contestYear; K.ensureSeason = ensureSeason; K.season = season; K.compDate = compDate; K.setCompDate = setCompDate;
  K.startNextSeason = startNextSeason; K.seasonOver = seasonOver; K.yearKey = yearKey; K.snapshot = snapshot;

  var CHECKLISTS = {
    qumc: [
      { id: 'contact', label: 'Email or visit the Concordia representative (Nadia Lafrenière, LB-921.4) — ask how to register' },
      { id: 'registered', label: 'Registration confirmed' },
      { id: 'room', label: 'Know the room and start time (2026: Fri 15:00–18:30)' },
      { id: 'aids', label: 'Asked about allowed aids and the number of problems' },
      { id: 'past', label: 'Asked whether past papers exist internally' }
    ],
    putnam: [
      { id: 'supervisor', label: 'Asked the Math & Stats department who Concordia’s Putnam local supervisor is' },
      { id: 'link', label: 'Received the registration link from the local supervisor' },
      { id: 'registered', label: 'Registered with the MAA (before the local deadline)' },
      { id: 'site', label: 'Know the site, room and the four session times' },
      { id: 'food', label: 'Planned food, water and breaks for the 4 × 90-minute day' }
    ]
  };
  K.CHECKLISTS = CHECKLISTS;
  function registered(compId) { var s = season(); return !!(s.checklist[compId] && s.checklist[compId].registered); }
  K.registered = registered;

  /* ------------------------------------------------------------------ */
  /* Mastery model                                                       */
  /* ------------------------------------------------------------------ */
  var ALPHA = 0.3;
  function mrec(id) {
    var c = C();
    if (!c.mastery[id]) c.mastery[id] = { m: 0, n: 0, tl: (NODES[id] || {}).level || 1, since: 0, recent: [] };
    return c.mastery[id];
  }
  function mval(id) { var r = C().mastery[id]; return r ? r.m : 0; }
  function tlOf(id) { var r = C().mastery[id]; return r ? r.tl : ((NODES[id] || {}).level || 1); }
  function isMastered(id) { var r = C().mastery[id]; return !!r && r.m >= 0.7 && r.n >= 3; }
  function stars(m) { return Math.max(0, Math.min(5, Math.round(m * 5))); }
  function applyScore(nodeId, s, level, weight, hints) {
    var r = mrec(nodeId);
    var eff = level >= r.tl ? s : s * (0.7 + 0.3 * level / r.tl);
    var a = ALPHA * weight;
    r.m = Math.max(0, Math.min(1, (1 - a) * r.m + a * eff));
    r.n++;
    r.recent.push({ k: r.n, s: s, l: level, h: hints || 0, d: today() });
    if (r.recent.length > 12) r.recent.shift();
  }
  K.mrec = mrec; K.mval = mval; K.tlOf = tlOf; K.isMastered = isMastered; K.stars = stars;

  function scoreFromGrade(g, hints) { var s = [0, 0.4, 0.7, 1][g] || 0; if (hints >= 2 && g >= 2) s = Math.min(s, 0.6); return s; }
  function probAttempts(pid) { return C().attempts[pid] || []; }
  function probStatus(pid) {
    var a = probAttempts(pid);
    if (!a.length) return 'new';
    return a[a.length - 1].s >= 0.7 ? 'solved' : 'missed';
  }
  function mocksTaken() {
    var t = {};
    C().mocks.forEach(function (r) { t[r.mockId] = r.d; (MOCKS[r.mockId] && MOCKS[r.mockId].includes || []).forEach(function (x) { t[x] = r.d; }); });
    return t;
  }
  function reservedBlocked(p) { return !!p.reservedForMock && !mocksTaken()[p.reservedForMock]; }
  K.scoreFromGrade = scoreFromGrade; K.probAttempts = probAttempts; K.probStatus = probStatus; K.mocksTaken = mocksTaken; K.reservedBlocked = reservedBlocked;

  /* Record a graded attempt on a competition problem.
   * o: {grade 0..3 | score10 0..10, hints, minutes, mode: 'practice'|'mock'|'diag', answerOk} */
  function recordAttempt(pid, o) {
    var p = CP[pid], c = C(), t = today();
    if (!p) return null;
    var hints = o.hints || 0;
    var s = o.score10 != null ? o.score10 / 10 : scoreFromGrade(o.grade, hints);
    (c.attempts[pid] = c.attempts[pid] || []).push({ t: Date.now(), d: t, s: s, g: o.grade, sc: o.score10, h: hints, min: o.minutes || 0, mode: o.mode || 'practice', ok: o.answerOk });
    p.nodes.forEach(function (n, i) { applyScore(n, s, p.level, i === 0 ? 1 : 0.5, hints); if (c.boost[n] && i === 0) delete c.boost[n]; });
    // spaced retry (3 days, then 10 days, without hints)
    var r = c.retry[pid];
    if (s < 0.7 || hints >= 2) c.retry[pid] = { due: addDays(t, 3), stage: 1 };
    else if (r) { if (r.stage === 1) c.retry[pid] = { due: addDays(t, 10), stage: 2 }; else delete c.retry[pid]; }
    core.markDay();
    var msgs = o.mode === 'diag' ? [] : adapt([p.nodes[0]]); // level rules use the problem's primary skill
    save();
    return { s: s, changes: msgs };
  }
  K.recordAttempt = recordAttempt;

  /* ------------------------------------------------------------------ */
  /* Adaptation rules (plans.json adaptationRules)                       */
  /* ------------------------------------------------------------------ */
  function addChange(msg, kind) {
    var c = C();
    c.changes.unshift({ d: today(), msg: msg, kind: kind || 'info' });
    if (c.changes.length > 80) c.changes.length = 80;
  }
  K.addChange = addChange;
  function names(ids) {
    var n = ids.map(function (id) { return NODES[id] ? NODES[id].name : id; });
    return n.length <= 1 ? n.join('') : n.slice(0, -1).join(', ') + ' and ' + n[n.length - 1];
  }
  function allAttemptsSorted() {
    var c = C(), out = [];
    Object.keys(c.attempts).forEach(function (pid) { c.attempts[pid].forEach(function (a) { out.push({ pid: pid, a: a }); }); });
    return out.sort(function (x, y) { return x.a.t - y.a.t; });
  }
  function adapt(nodes) {
    var c = C(), t = today(), msgs = [];
    (nodes || []).forEach(function (n) {
      var r = mrec(n), node = NODES[n];
      var fresh = r.recent.filter(function (x) { return x.k > (r.since || 0); });
      // prereq-review: accuracy < 50% over the last >= 4 attempts
      var last = r.recent.slice(-4);
      if (last.length >= 4) {
        var ok = last.filter(function (x) { return x.s >= 0.7; }).length;
        var flagged = c.flags.prereq[n] && daysBetween(c.flags.prereq[n], t) < 7;
        if (ok / last.length < 0.5 && !flagged) {
          c.flags.prereq[n] = t;
          var pre = node.prerequisites.filter(function (q) { return mval(q) < 0.7; });
          pre.forEach(function (q) { c.boost[q] = { from: n, d: t }; });
          var oldTl = r.tl;
          r.tl = Math.max(1, r.tl - 1); r.since = r.n;
          msgs.push((pre.length ? 'Added a review of ' + names(pre) + ' because only ' + ok + '/' + last.length + ' recent ' + node.name + ' problems were solved.'
            : 'Only ' + ok + '/' + last.length + ' recent ' + node.name + ' problems were solved.') +
            (oldTl !== r.tl ? ' Target level for ' + node.name + ' lowered from ' + oldTl + ' to ' + r.tl + '.' : ''));
          return;
        }
      }
      // level-up: >= 3 consecutive solves at the target level
      var atL = fresh.filter(function (x) { return x.l >= r.tl; }).slice(-3);
      if (atL.length === 3 && atL.every(function (x) { return x.s >= 0.7; }) && r.tl < 5) {
        r.tl++; r.since = r.n;
        msgs.push('Level up on ' + node.name + ': 3 solved in a row, so you’ll now get level-' + r.tl + ' problems there.');
        return;
      }
      // level-down: 2 consecutive failures at the target level (even after hints)
      var l2 = fresh.slice(-2);
      if (l2.length === 2 && l2.every(function (x) { return x.l >= r.tl && x.s < 0.4; }) && r.tl > 1) {
        r.tl--; r.since = r.n;
        msgs.push('Two misses in a row on ' + node.name + ' — next you’ll get a level-' + r.tl + ' problem, then retry the harder one.');
      }
    });
    // hint-dependence: > 50% of last week's solves needed hint 2+
    var all = allAttemptsSorted();
    var week = all.filter(function (x) { return daysBetween(x.a.d, t) <= 7; });
    var solved = week.filter(function (x) { return x.a.s >= 0.6; });
    if (solved.length >= 3 && solved.filter(function (x) { return x.a.h >= 2; }).length / solved.length > 0.5 && !(c.flags.stuckUntil >= t)) {
      c.flags.stuckUntil = addDays(t, 7);
      msgs.push('Most recent solves used hint 2 or 3, so for the next 7 days hints unlock after 15 minutes, with a “change representation” prompt first.');
    }
    // writeup-gap: correct answers but self-graded write-ups < 8/10
    var okList = all.filter(function (x) { return x.a.ok === true && x.a.g != null; }).slice(-5);
    if (okList.length >= 4) {
      var avg = okList.reduce(function (s, x) { return s + x.a.g; }, 0) / okList.length;
      if (avg < 2.4 && !(c.flags.writeupUntil >= t)) {
        c.flags.writeupUntil = addDays(t, 7);
        c.boost['h-proof-writing'] = { from: 'writeup', d: t };
        msgs.push('Your answers are right but write-ups average ' + avg.toFixed(1) + '/3 — added proof-writing drills and full write-ups for every solved problem this week.');
      }
    }
    msgs.forEach(function (m) { addChange(m, 'adapt'); });
    if (msgs.length && c.plan) replan('adapt');
    return msgs;
  }
  K.adapt = adapt;

  /* ------------------------------------------------------------------ */
  /* Deterministic planner                                               */
  /* ------------------------------------------------------------------ */
  function hashStr(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rngFrom(seed) { var a = hashStr(seed); return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function bucketFor(days) { var b = PL.timeBuckets; for (var i = 0; i < b.length; i++) if (days <= b[i].maxDays) return b[i]; return b[b.length - 1]; }
  K.bucketFor = bucketFor;
  var PHASE_ORDER = ['foundations', 'toolbox', 'mixed', 'competition', 'taper'];
  function allocate(n, mix) {
    var out = {}, tot = 0;
    if (n <= 0) { PHASE_ORDER.forEach(function (p) { out[p] = 0; }); return out; }
    if (n === 1) { PHASE_ORDER.forEach(function (p) { out[p] = 0; }); out.taper = 1; return out; }
    if (n === 2) { PHASE_ORDER.forEach(function (p) { out[p] = 0; }); out.competition = 1; out.taper = 1; return out; }
    var sum = PHASE_ORDER.reduce(function (s, p) { return s + (mix[p] || 0); }, 0) || 1;
    var rem = PHASE_ORDER.map(function (p) { var x = (mix[p] || 0) / sum * n; out[p] = Math.floor(x); tot += out[p]; return { p: p, r: x - Math.floor(x) }; });
    rem.sort(function (a, b) { return b.r - a.r; });
    for (var i = 0; tot < n; i++, tot++) out[rem[i % rem.length].p]++;
    function need(p, k) { while (out[p] < k) { var donor = ['toolbox', 'mixed', 'foundations', 'competition'].filter(function (d) { return d !== p && out[d] > (d === 'toolbox' ? 1 : 0); }).sort(function (a, b) { return out[b] - out[a]; })[0]; if (!donor) break; out[donor]--; out[p]++; } }
    need('taper', n >= 10 ? 2 : 1);
    if (n >= 4) need('competition', n >= 12 ? 3 : 1);
    if (n >= 7) need('mixed', 1);
    return out;
  }
  K.allocate = allocate;
  function round5(x) { return Math.round(x / 5) * 5; }
  function perDayMinutes(setup, from) {
    var c = C();
    var weekly = setup.hours * 60 * (c.flags.lightUntil >= from ? 0.7 : 1);
    var n = setup.days.filter(Boolean).length || 7;
    return Math.max(25, Math.min(180, round5(weekly / n)));
  }
  function tplFor(phase, minutes) {
    if (phase === 'taper') return 'taper-30';
    if (phase === 'mixed') return minutes >= 75 ? 'mixed-set-90' : minutes >= 45 ? 'standard-60' : 'short-30';
    if (minutes < 45) return 'short-30';
    if (minutes < 80) return 'standard-60';
    return 'deep-90';
  }
  function groupWeight(g, comp) { var w = COMPS[comp] && COMPS[comp].topicWeights.weights; return (w && w[g]) || 0.05; }
  function nodePriority(n, comp) {
    var node = NODES[n];
    var yoc = season().yearOfCompeting || 1;
    var focus = (PL.multiYear[Math.min(yoc, 4) - 1] || {}).contentFocus || [];
    var inFocus = focus.some(function (f) { return f === n || (f.slice(-1) === '*' && n.indexOf(f.slice(0, -1)) === 0); });
    return groupWeight(node.group, comp) * ((node.relevance[comp] || 1) / 3) * (1 - mval(n)) * (inFocus ? 1.25 : 1);
  }
  K.nodePriority = nodePriority;

  function buildPlan(from) {
    var c = C(), setup = c.setup;
    if (!setup) return null;
    var s = season();
    var targets = (setup.targets || []).filter(function (id) { return s.dates[id] && s.dates[id] >= from; })
      .map(function (id) { return { id: id, date: s.dates[id] }; })
      .sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; });
    var plan = { created: from, seed: c.planSeed || 1, days: [], segments: [], history: [] };
    if (!targets.length) return plan;
    var rng = rngFrom(from + '|' + plan.seed);
    var ctx = { used: {}, sched: {}, covered: {}, rng: rng, mockUsed: {}, officialUsed: {} };
    NODE_LIST.forEach(function (n) { if (c.lessonsRead[n.id] || mval(n.id) >= 0.5) ctx.covered[n.id] = 1; });
    // recently attempted problems are not re-served (except as spaced retries)
    Object.keys(c.attempts).forEach(function (pid) { var a = c.attempts[pid]; if (a.length && daysBetween(a[a.length - 1].d, from) < 3) ctx.used[pid] = 1; });
    var taken = mocksTaken();
    var perDay = perDayMinutes(setup, from);
    var start = from, prevComp = null;
    targets.forEach(function (T, ti) {
      var dates = [];
      for (var d = start; d < T.date; d = addDays(d, 1)) dates.push(d);
      var study = dates.filter(function (d) { return setup.days[weekdayIdx(d)]; });
      if (!study.length) study = dates.slice();
      var calDays = daysBetween(start, T.date);
      var bucket = bucketFor(calDays);
      var mix = {}; PHASE_ORDER.forEach(function (p) { mix[p] = bucket.phaseMix[p]; });
      var place = c.diag && c.diag.done ? c.diag.placement : null;
      if (place === 'advanced') { mix.toolbox += mix.foundations; mix.foundations = 0; }
      if (PHASES.foundations.focusNodes.every(function (id) { return mval(id) >= 0.7; })) { mix.toolbox += mix.foundations; mix.foundations = 0; }
      var alloc = allocate(study.length, mix);
      var seq = [];
      PHASE_ORDER.forEach(function (p) { for (var i = 0; i < alloc[p]; i++) seq.push(p); });
      var mockQueue = MOCK_LIST.filter(function (m) { return m.competition === T.id && !m.optional && !taken[m.id] && !ctx.mockUsed[m.id]; }).map(function (m) { return m.id; });
      var si = 0, lastWasMock = null, firstDay = true;
      dates.forEach(function (d) {
        var isStudy = study.indexOf(d) >= 0;
        var day = { d: d, target: T.id, tasks: [] };
        if (firstDay && prevComp) {
          day.tasks.push(task('review', 'review:' + prevComp + '@' + s.year, 'Post-competition review: ' + shortName(prevComp), prevComp, 30));
        }
        if (firstDay && ti === 0) {
          (setup.targets || []).forEach(function (id) {
            if (s.dates[id] >= from && !registered(id)) day.tasks.push(task('reg', 'reg:' + id + '@' + s.year, 'Register for ' + shortName(id) + ' (tick the checklist)', id, 5));
          });
        }
        if (!isStudy) {
          day.rest = true;
          days_push(day);
          firstDay = false;
          return;
        }
        var phase = seq[si++] || 'taper';
        day.phase = phase; day.minutes = perDay;
        var toComp = daysBetween(d, T.date);
        if (firstDay && ti === 0 && setup.wantDiag && !(c.diag && c.diag.done) && calDays >= 7) {
          day.tpl = 'diagnostic'; day.minutes = Math.max(perDay, 90);
          day.tasks.push(task('diag', 'diag', 'Placement diagnostic (90 min, 12 short problems)', null, 90));
        } else if (phase === 'competition') {
          if (lastWasMock) {
            day.tpl = 'review';
            day.tasks.push(task('mockreview', 'mockreview:' + lastWasMock, 'Mock post-mortem: re-solve misses with hints only, write one model solution', lastWasMock, 45));
            day.tasks.push(task('journal', 'journal@' + d, 'Journal: what will you do differently on the day?', null, 10));
            lastWasMock = null;
          } else if (mockQueue.length) {
            var mid = mockQueue.shift(); ctx.mockUsed[mid] = 1;
            day.tpl = 'mock-full'; day.minutes = MOCKS[mid].durationMinutes;
            day.tasks.push(task('mock', 'mock:' + mid, MOCKS[mid].name + ' — under real timing (' + fmtMin(MOCKS[mid].durationMinutes) + ')', mid, MOCKS[mid].durationMinutes));
            lastWasMock = mid;
          } else if (T.id === 'putnam' && nextOfficial(ctx)) {
            var op = nextOfficial(ctx); ctx.officialUsed[op.year] = 1;
            day.tpl = 'mixed-set-90';
            day.tasks.push(task('official', 'official:' + op.year, 'Official Putnam ' + op.year + ' (90 min): ' + op.use, op.year, 90));
          } else {
            fillMixed(day, T, ctx, Math.min(perDay, 90));
          }
        } else if (phase === 'taper') {
          day.tpl = 'taper-30'; day.minutes = Math.min(perDay, 30);
          day.tasks.push(task('tips', 'tips@' + d, 'Re-read your pinned tips and error log', null, 15));
          var easy = pickEasy(ctx, T);
          if (easy) day.tasks.push(probTask(easy, d, 'One easy problem you can finish — end on a success'));
          if (toComp === 1) day.tasks.push(task('logistics', 'logistics:' + T.id + '@' + s.year, 'Logistics: room, time, pens, ID, food — and read the day-of strategy', T.id, 10));
        } else if (phase === 'mixed') {
          fillMixed(day, T, ctx, perDay);
        } else {
          fillToolbox(day, phase, T, ctx, perDay, toComp);
        }
        days_push(day);
        firstDay = false;
      });
      // competition day
      plan.days.push({ d: T.date, event: true, target: T.id, tasks: [
        task('beforestart', 'beforestart:' + T.id + '@' + s.year, 'Read before you start: your pinned tips + day-of strategy', T.id, 5),
        task('compday', 'compday:' + T.id + '@' + s.year, 'After the contest: competition-day log (journal)', T.id, 10)
      ] });
      plan.segments.push({ comp: T.id, date: T.date, start: start, calDays: calDays, studyDays: study.length, bucket: bucket.id, alloc: alloc, perDay: perDay });
      prevComp = T.id;
      start = addDays(T.date, 1);
    });
    // day after the last competition: review
    var lastT = targets[targets.length - 1];
    plan.days.push({ d: addDays(lastT.date, 1), target: lastT.id, tasks: [task('review', 'review:' + lastT.id + '@' + s.year, 'Post-competition review: ' + shortName(lastT.id), lastT.id, 30)] });
    function days_push(day) { plan.days.push(day); }
    return plan;
  }
  function fmtMin(m) { return m >= 60 ? (Math.floor(m / 60) + ' h' + (m % 60 ? ' ' + (m % 60) + ' min' : '')) : m + ' min'; }
  K.fmtMin = fmtMin;
  function shortName(id) { return id === 'qumc' ? 'QUMC' : id === 'putnam' ? 'Putnam' : id; }
  K.shortName = shortName;
  function task(type, key, label, ref, min, extra) { var t = { k: key, type: type, label: label, ref: ref, min: min || 0 }; if (extra) for (var x in extra) t[x] = extra[x]; return t; }
  function probTask(pid, d, label, extra) { var p = CP[pid]; return task('prob', 'prob:' + pid, (label ? label + ': ' : '') + p.title + ' (L' + p.level + ')', pid, p.estimatedMinutes || 15, extra); }
  function nextOfficial(ctx) { var list = D.mocks.officialPapers || []; for (var i = 0; i < list.length; i++) { var o = list[i]; if (!ctx.officialUsed[o.year] && !C().done['official:' + o.year]) return o; } return null; }

  function pickNode(phase, T, d, ctx, toComp) {
    var c = C();
    if (phase === 'foundations') {
      var f = PHASES.foundations.focusNodes.filter(function (id) { return !ctx.sched[id] && mval(id) < 0.7; });
      var fb = f.filter(function (id) { return c.boost[id]; });
      if (fb.length) return fb[0];
      if (f.length) return f[0];
    }
    var boosted = Object.keys(c.boost).filter(function (id) { return NODES[id] && !ctx.sched[id]; })
      .sort(function (a, b) { return c.boost[a].d < c.boost[b].d ? -1 : 1; });
    if (boosted.length) return boosted[0];
    var cand = NODE_LIST.filter(function (n) { return !ctx.sched[n.id] && mval(n.id) < 0.7; });
    if (toComp < 14) cand = cand.filter(function (n) { return (n.relevance[T.id] || 0) >= 3 && n.level <= 3; });
    cand = cand.filter(function (n) { return n.level === 1 || n.prerequisites.every(function (q) { return ctx.covered[q] || ctx.sched[q]; }); });
    cand.sort(function (a, b) { return nodePriority(b.id, T.id) - nodePriority(a.id, T.id) || a.level - b.level || (a.id < b.id ? -1 : 1); });
    return cand.length ? cand[0].id : null;
  }
  function pickProblems(nodeId, levels, k, ctx) {
    var tl = tlOf(nodeId), node = NODES[nodeId];
    var pool = node.allProblems.map(function (id) { return CP[id]; }).filter(function (p) {
      return p && !ctx.used[p.id] && !reservedBlocked(p) && probStatus(p.id) !== 'solved';
    });
    var lo = Math.max(levels[0], tl - 1), hi = Math.min(levels[levels.length - 1], tl + 1);
    var a = pool.filter(function (p) { return p.level >= lo && p.level <= hi; });
    if (a.length < k) a = a.concat(pool.filter(function (p) { return a.indexOf(p) < 0 && p.level >= levels[0] && p.level <= levels[levels.length - 1]; }));
    if (a.length < k) a = a.concat(pool.filter(function (p) { return a.indexOf(p) < 0; }));
    var r = {}; a.forEach(function (p) { r[p.id] = ctx.rng(); });
    a.sort(function (x, y) {
      var ax = probAttempts(x.id).length ? 1 : 0, ay = probAttempts(y.id).length ? 1 : 0;
      return ax - ay || Math.abs(x.level - tl) - Math.abs(y.level - tl) || r[x.id] - r[y.id];
    });
    var out = a.slice(0, k).map(function (p) { ctx.used[p.id] = 1; return p.id; });
    return out;
  }
  function pickEasy(ctx, T) {
    var c = C();
    var pool = CP_LIST.filter(function (p) { return p.level <= 2 && !ctx.used[p.id] && !reservedBlocked(p) && probStatus(p.id) !== 'solved' && ctx.covered[p.nodes[0]]; });
    if (!pool.length) pool = CP_LIST.filter(function (p) { return p.level <= 2 && !ctx.used[p.id] && !reservedBlocked(p) && probStatus(p.id) !== 'solved'; });
    if (!pool.length) return null;
    pool.sort(function (a, b) { return a.level - b.level || groupWeight(NODES[b.nodes[0]].group, T.id) - groupWeight(NODES[a.nodes[0]].group, T.id) || (a.id < b.id ? -1 : 1); });
    var p = pool[Math.floor(ctx.rng() * Math.min(5, pool.length))];
    ctx.used[p.id] = 1;
    return p.id;
  }
  function dueRetries(d, ctx, max) {
    var c = C();
    return Object.keys(c.retry).filter(function (pid) { return c.retry[pid].due <= d && !ctx.used[pid] && CP[pid]; })
      .sort(function (a, b) { return c.retry[a].due < c.retry[b].due ? -1 : 1; }).slice(0, max)
      .map(function (pid) { ctx.used[pid] = 1; return pid; });
  }
  function fillToolbox(day, phase, T, ctx, minutes, toComp) {
    var c = C();
    var tplId = tplFor(phase, minutes);
    day.tpl = tplId;
    var node = pickNode(phase, T, day.d, ctx, toComp);
    if (!node) { fillMixed(day, T, ctx, minutes); return; }
    ctx.sched[node] = 1; ctx.covered[node] = 1;
    day.node = node;
    var levels = PHASES[phase].problemLevels;
    // warm-up: due spaced retries first
    var warm = dueRetries(day.d, ctx, tplId === 'short-30' ? 0 : 1);
    warm.forEach(function (pid) { day.tasks.push(task('retry', 'retry:' + pid + '@' + day.d, 'Warm-up retry (no hints): ' + CP[pid].title, pid, 10, { since: day.d })); });
    if (tplId === 'short-30') {
      day.tasks.push(task(c.lessonsRead[node] ? 'flash' : 'lesson', c.lessonsRead[node] ? 'flash:' + node + '@' + day.d : 'lesson:' + node, (c.lessonsRead[node] ? 'Flash review: ' : 'Lesson card: ') + NODES[node].name, node, 5));
      pickProblems(node, levels, 1, ctx).forEach(function (pid) { day.tasks.push(probTask(pid, day.d)); });
    } else {
      day.tasks.push(task(c.lessonsRead[node] ? 'flash' : 'lesson', c.lessonsRead[node] ? 'flash:' + node + '@' + day.d : 'lesson:' + node, (c.lessonsRead[node] ? 'Review lesson card: ' : 'Lesson card: ') + NODES[node].name, node, tplId === 'deep-90' ? 15 : 10));
      var k = tplId === 'deep-90' ? 2 : 2;
      var lv = tplId === 'deep-90' ? [Math.max(levels[0], tlOf(node)), Math.min(5, levels[levels.length - 1] + 1)] : levels;
      pickProblems(node, lv, k, ctx).forEach(function (pid) { day.tasks.push(probTask(pid, day.d)); });
      if (tplId === 'deep-90' && T.id === 'putnam') {
        var ref = (NODES[node].putnamRefs || []).filter(function (r) { return r.difficulty <= tlOf(node) + 1 && !C().refs[r.id] && !C().done['ref:' + r.id]; })[0];
        if (ref) day.tasks.push(task('ref', 'ref:' + ref.id, 'Official ' + ref.id + ' (' + ref.topic + ')', ref.id, 30, { node: node }));
      }
    }
    day.tasks.push(task('journal', 'journal@' + day.d, 'Write-up + reflection: one full solution, then a quick journal note', null, tplId === 'short-30' ? 5 : 15));
  }
  function fillMixed(day, T, ctx, minutes) {
    day.tpl = minutes >= 75 ? 'mixed-set-90' : minutes >= 45 ? 'standard-60' : 'short-30';
    var k = day.tpl === 'mixed-set-90' ? 3 : day.tpl === 'standard-60' ? 2 : 1;
    var levels = PHASES.mixed.problemLevels;
    var place = C().diag && C().diag.done ? C().diag.placement : null;
    if (place === 'foundations') levels = [1, 2, 3];
    var groups = GROUPS.slice().sort(function (a, b) { return groupWeight(b, T.id) - groupWeight(a, T.id); });
    var chosen = [], tries = 0;
    while (chosen.length < k && tries++ < 40) {
      var tot = groups.reduce(function (s, g) { return s + (chosen.indexOf(g) < 0 ? groupWeight(g, T.id) : 0); }, 0);
      var x = ctx.rng() * tot, g = null;
      for (var i = 0; i < groups.length; i++) { if (chosen.indexOf(groups[i]) >= 0) continue; x -= groupWeight(groups[i], T.id); if (x <= 0) { g = groups[i]; break; } }
      if (!g) break;
      chosen.push(g);
    }
    var pids = [];
    chosen.forEach(function (g) {
      var pool = CP_LIST.filter(function (p) { return NODES[p.nodes[0]].group === g && !ctx.used[p.id] && !reservedBlocked(p) && probStatus(p.id) !== 'solved' && levels.indexOf(p.level) >= 0; });
      if (!pool.length) return;
      var p = pool[Math.floor(ctx.rng() * pool.length)];
      ctx.used[p.id] = 1; pids.push(p.id);
    });
    if (k >= 2) day.tasks.push(task('triage', 'triage@' + day.d, 'Triage first: read all ' + pids.length + ' problems, mark A / B / C, then solve A → B → C', null, 5));
    pids.forEach(function (pid) { day.tasks.push(probTask(pid, day.d, 'Mixed', { blind: true })); });
    day.tasks.push(task('journal', 'journal@' + day.d, 'Self-grade + note: were your A’s really A’s?', null, 10));
  }
  K.buildPlan = buildPlan;

  /* Task completion (computed from state, plus manual ticks) */
  function isDone(t, day) {
    var c = C();
    if (c.done[t.k]) return true;
    var s = season();
    switch (t.type) {
      case 'prob': return probAttempts(t.ref).some(function (a) { return a.d >= ((c.plan && c.plan.created) || '0'); });
      case 'retry': return probAttempts(t.ref).some(function (a) { return a.d >= (t.since || day.d); });
      case 'lesson': return !!c.lessonsRead[t.ref];
      case 'flash': return !!c.visits[t.ref] && c.visits[t.ref] >= day.d;
      case 'mock': return !!mocksTaken()[t.ref];
      case 'diag': return !!(c.diag && c.diag.done);
      case 'reg': return registered(t.ref);
      case 'review': return !!(s.reviewDone && s.reviewDone[t.ref]);
      case 'journal': return J.entries.some(function (e) { return e.date === day.d; });
      case 'ref': return !!c.refs[t.ref];
      case 'compday': return J.entries.some(function (e) { return e.kind === 'compday' && e.comp === t.ref && e.season === s.label; });
      default: return false;
    }
  }
  function toggleDone(k, v) { var c = C(); if (v) c.done[k] = today(); else delete c.done[k]; save(); }
  K.isDone = isDone; K.toggleDone = toggleDone;

  function replan(reason) {
    var c = C();
    var t = today();
    var old = c.plan;
    // After an attempt/mock/review, keep today's list stable and re-plan from tomorrow.
    var keepToday = old && /^(adapt|mock|review|diag)$/.test(reason || '') ? (old.days || []).filter(function (d) { return d.d === t; })[0] : null;
    var p = buildPlan(keepToday ? addDays(t, 1) : t);
    if (!p) { c.plan = null; save(); return null; }
    if (keepToday) { p.days.unshift(keepToday); p.created = t; }
    if (old) {
      var past = (old.days || []).filter(function (d) { return d.d < t; }).map(function (d) {
        return { d: d.d, phase: d.phase, rest: d.rest, event: d.event, target: d.target, node: d.node, tasks: d.tasks, doneCount: d.tasks.filter(function (x) { return isDone(x, d); }).length };
      });
      p.history = (old.history || []).concat(past).slice(-120);
    }
    p.reason = reason;
    c.plan = p;
    save();
    return p;
  }
  K.replan = replan;

  /* Daily maintenance: re-flow after missed days, burnout guard, season rollover. */
  function refresh() {
    ensureSeason();
    var c = C(), t = today();
    if (!c.setup || !c.plan) return { changed: false };
    if (c.plan.checked === t) return { changed: false };
    var past = c.plan.days.filter(function (d) { return d.d < t && !d.rest && !d.event && d.tasks.length; });
    var missedDays = past.filter(function (d) { return d.tasks.every(function (x) { return !isDone(x, d); }); });
    var incomplete = past.reduce(function (s, d) { return s + d.tasks.filter(function (x) { return !isDone(x, d); }).length; }, 0);
    var recentMissed = missedDays.filter(function (d) { return daysBetween(d.d, t) <= 7; }).length;
    var changed = false;
    if (recentMissed >= 3 && !(c.flags.lightUntil >= t)) {
      c.flags.lightUntil = addDays(t, 7);
      addChange('Busy stretch — ' + recentMissed + ' sessions missed this week. Sessions are 30% shorter for the next 7 days; keep the 5-minute error-log review going.', 'burnout');
      changed = true;
    }
    if (incomplete > 0 || changed) {
      replan('reflow');
      if (incomplete > 0) addChange(missedDays.length
        ? 'You missed ' + missedDays.length + ' planned day' + (missedDays.length > 1 ? 's' : '') + ' — no problem. The rest of the plan was re-flowed from today; ' + incomplete + ' unfinished task' + (incomplete > 1 ? 's were' : ' was') + ' redistributed.'
        : incomplete + ' unfinished task' + (incomplete > 1 ? 's' : '') + ' from earlier days ' + (incomplete > 1 ? 'were' : 'was') + ' folded into the plan from today.', 'reflow');
      changed = true;
    } else if (past.length || c.plan.days.some(function (d) { return d.d < t; })) {
      // all done: move finished days to history, keep the future as it was
      var keep = [], hist = c.plan.history || [];
      c.plan.days.forEach(function (d) { if (d.d < t) hist.push({ d: d.d, phase: d.phase, rest: d.rest, event: d.event, target: d.target, node: d.node, tasks: d.tasks, doneCount: d.tasks.filter(function (x) { return isDone(x, d); }).length }); else keep.push(d); });
      c.plan.days = keep; c.plan.history = hist.slice(-120);
    }
    c.plan.checked = t;
    save();
    return { changed: changed, missed: missedDays.length, incomplete: incomplete };
  }
  K.refresh = refresh;
  function todayDay() {
    var c = C(), t = today();
    if (!c.plan) return null;
    return c.plan.days.filter(function (d) { return d.d === t; })[0] || null;
  }
  function nextStudyDay() {
    var c = C(), t = today();
    if (!c.plan) return null;
    return c.plan.days.filter(function (d) { return d.d > t && !d.rest; })[0] || null;
  }
  K.todayDay = todayDay; K.nextStudyDay = nextStudyDay;

  /* Setup + background seeding */
  var BG_SEEDS = {
    proofs: { some: { 'h-proof-writing': 0.2, 'h-induction': 0.2 }, comfortable: { 'h-proof-writing': 0.35, 'h-induction': 0.35, 'h-contradiction': 0.3, 'h-small-cases': 0.3 } },
    courses: {
      calc1: { 'r-continuity-ivt': 0.25, 'r-mvt': 0.15 }, calc2: { 'r-sequences': 0.25, 'r-series': 0.25, 'r-integrals': 0.2 },
      linalg: { 'l-determinants': 0.3, 'l-eigen': 0.15 }, discrete: { 'c-counting': 0.3, 'h-induction': 0.3, 'n-divisibility': 0.25 },
      proofs: { 'h-proof-writing': 0.3, 'h-contradiction': 0.3 }, olympiad: { 'h-small-cases': 0.35, 'h-pigeonhole': 0.3, 'h-parity-invariants': 0.3, 'n-modular': 0.25 }
    }
  };
  function seed(nodeId, v) { var r = mrec(nodeId); if (r.n === 0 && r.m < v) r.m = v; }
  function saveSetup(st) {
    var c = C();
    var first = !c.setup;
    c.setup = { targets: st.targets, hours: st.hours, days: st.days, background: st.background || {}, wantDiag: !!st.wantDiag, created: c.setup ? c.setup.created : today(), updated: today() };
    var s = season();
    if (st.yearOfCompeting) s.yearOfCompeting = st.yearOfCompeting;
    var bg = st.background || {};
    if (BG_SEEDS.proofs[bg.proofs]) Object.keys(BG_SEEDS.proofs[bg.proofs]).forEach(function (n) { seed(n, BG_SEEDS.proofs[bg.proofs][n]); });
    (bg.courses || []).forEach(function (k) { var m = BG_SEEDS.courses[k]; if (m) Object.keys(m).forEach(function (n) { seed(n, m[n]); }); });
    c.planSeed = (c.planSeed || 1);
    replan(first ? 'setup' : 'setup-edit');
    addChange(first ? 'Plan created: ' + planSummary() : 'Setup updated — plan regenerated: ' + planSummary(), 'setup');
    save();
    return c.plan;
  }
  function planSummary() {
    var p = C().plan;
    if (!p || !p.segments.length) return 'no upcoming target this season.';
    return p.segments.map(function (sg) { return shortName(sg.comp) + ' in ' + sg.calDays + ' days (' + sg.studyDays + ' study days, ~' + sg.perDay + ' min each)'; }).join('; ') + '.';
  }
  K.saveSetup = saveSetup; K.planSummary = planSummary;

  /* Diagnostic placement */
  function applyDiag(scores) {
    var c = C();
    var ids = PL.diagnostic.problemIds;
    var total = 0;
    ids.forEach(function (pid) {
      var sc = scores[pid];
      var p = CP[pid];
      if (sc == null) { p.nodes.forEach(function (n) { var r = mrec(n); if (r.n === 0 && r.m < 0.25) r.m = 0.25; }); return; }
      total += sc;
      p.nodes.forEach(function (n, i) { var r = mrec(n); var v = i === 0 ? sc / 2 : sc / 4; if (r.n === 0) r.m = Math.max(r.m, v); });
      (c.attempts[pid] = c.attempts[pid] || []).push({ t: Date.now(), d: today(), s: sc / 2, g: sc === 2 ? 3 : sc === 1 ? 1 : 0, h: 0, mode: 'diag' });
      if (sc < 2) c.retry[pid] = { due: addDays(today(), 3), stage: 1 };
    });
    var placement = total <= 8 ? 'foundations' : total <= 16 ? 'mixed' : 'advanced';
    NODE_LIST.forEach(function (n) {
      var r = mrec(n.id);
      if (placement === 'foundations') r.tl = Math.min(r.tl, 2);
      else if (placement === 'advanced') r.tl = Math.max(r.tl, 3);
    });
    c.diag = { started: c.diag && c.diag.started, done: true, scores: scores, total: total, placement: placement, d: today() };
    addChange('Diagnostic: ' + total + '/24 → ' + ({ foundations: 'start with Foundations at levels 1–2', mixed: 'short Foundations, then Toolbox at levels 2–3', advanced: 'skip Foundations; Toolbox at level 3 plus official A1/B1 references' })[placement] + '.', 'diag');
    if (c.plan) replan('diag');
    save();
    return c.diag;
  }
  K.applyDiag = applyDiag;

  /* Mock results */
  function recordMock(mockId, res) {
    var c = C(), m = MOCKS[mockId];
    var total = 0, max = 0;
    m.problemIds.forEach(function (pid) {
      var sc = res.scores[pid] == null ? 0 : res.scores[pid];
      total += sc; max += 10;
      recordAttempt(pid, { score10: sc, mode: 'mock', minutes: (res.minutes || {})[pid] || 0 });
    });
    var triageHits = m.problemIds.filter(function (pid) { return (res.triage || {})[pid] === 'A'; });
    var aSolved = triageHits.filter(function (pid) { return (res.scores[pid] || 0) >= 8; }).length;
    var r = { mockId: mockId, d: today(), season: C().season, total: total, max: max, scores: res.scores, triage: res.triage || {}, aSolved: aSolved, aCount: triageHits.length };
    c.mocks.push(r);
    c.activeMock = null;
    addChange(m.name + ': ' + total + '/' + max + '. Unsolved problems were added to spaced retry (in 3 days).', 'mock');
    if (c.plan) replan('mock');
    save();
    return r;
  }
  K.recordMock = recordMock;

  /* Post-competition review */
  function saveReview(compId, rv) {
    var c = C(), s = season();
    s.results[compId] = { attempted: rv.attempted, solved: rv.solved, score: rv.score, rank: rv.rank, d: today() };
    s.reviewDone[compId] = today();
    if (rv.lessons) s.lessonsForNext = ((s.lessonsForNext ? s.lessonsForNext + '\n' : '') + shortName(compId) + ': ' + rv.lessons).slice(0, 2000);
    (rv.weakNodes || []).forEach(function (n) {
      c.boost[n] = { from: 'review', d: today() };
      var cands = NODES[n].allProblems.filter(function (pid) { return probStatus(pid) !== 'solved' && !reservedBlocked(CP[pid]); }).slice(0, 2);
      cands.forEach(function (pid) { c.retry[pid] = { due: addDays(today(), 3), stage: 1 }; });
    });
    c.reviews.push({ comp: compId, season: s.year, d: today(), answers: rv });
    addChange('Post-competition review saved for ' + shortName(compId) + (rv.weakNodes && rv.weakNodes.length ? ': ' + names(rv.weakNodes) + ' pushed into review.' : '.'), 'review');
    if (c.plan) replan('review');
    save();
  }
  K.saveReview = saveReview;

  /* Answer checking for competition problems */
  function compNorm(s) {
    return String(s == null ? '' : s).toLowerCase()
      .replace(/²/g, '^2').replace(/³/g, '^3').replace(/ⁿ/g, '^n').replace(/[−–]/g, '-')
      .replace(/\b(the|answer|is|only)\b/g, '')
      .replace(/[\s.,;:()!'"“”‘’]/g, '');
  }
  function checkCompAnswer(p, raw) {
    var a = p.answer || {};
    if (a.type === 'numeric') return core.checkNumeric({ value: a.value, tolAbs: Math.max(a.tolerance || 0, 1e-9) }, raw);
    if (a.type === 'text') {
      var n = compNorm(raw);
      if (!n) return { invalid: true };
      var ok = (a.accept || []).concat([a.display || '']).some(function (t) { return compNorm(t) === n || core.codeNorm(t) === core.codeNorm(raw); });
      return { ok: ok };
    }
    return { invalid: true };
  }
  K.compNorm = compNorm; K.checkCompAnswer = checkCompAnswer;

  /* ------------------------------------------------------------------ */
  /* Journal store (separate localStorage key so it can grow)            */
  /* ------------------------------------------------------------------ */
  var JKEY = 'statbt.journal.v1';
  var J = loadJ();
  function loadJ() {
    try { var o = JSON.parse(localStorage.getItem(JKEY) || 'null'); if (o && Array.isArray(o.entries)) return o; } catch (e) { }
    return { v: 1, entries: [] };
  }
  function saveJ() {
    try { localStorage.setItem(JKEY, JSON.stringify(J)); return true; }
    catch (e) { core.toast('Journal could not be saved — browser storage is full. Export the journal (Markdown or JSON), then delete old entries.'); return false; }
  }
  K.J = J; K.saveJ = saveJ;
  function storageUsage() {
    var chars = 0;
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); chars += k.length + (localStorage.getItem(k) || '').length; } } catch (e) { }
    return { chars: chars, limit: 5 * 1024 * 1024, near: chars > 4 * 1024 * 1024 };
  }
  K.storageUsage = storageUsage;
  function uid() { return 'j' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36); }
  function addEntry(e) {
    var s = season();
    var entry = {
      id: uid(), t: Date.now(), date: today(), season: s.label, kind: e.kind || 'free',
      problemId: e.problemId || null, problemTitle: e.problemTitle || (e.problemId && CP[e.problemId] ? CP[e.problemId].title : null),
      nodes: e.nodes || (e.problemId && CP[e.problemId] ? CP[e.problemId].nodes.slice() : []),
      comp: e.comp || null, outcome: e.outcome || null, minutes: e.minutes || null,
      approaches: e.approaches || [], stuck: e.stuck || '', insight: e.insight || '', mistakes: e.mistakes || [],
      confidence: e.confidence || null, tip: e.tip || '', text: e.text || '', prompt: e.prompt || '', pinned: !!e.pinned, src: e.src || 'comp'
    };
    J.entries.push(entry);
    saveJ();
    core.markDay();
    core.save();
    var u = storageUsage();
    if (u.near) core.toast('Storage is getting full (' + Math.round(u.chars / 1048576 * 10) / 10 + 'M of ~5M characters). Export your journal soon.');
    return entry;
  }
  function updateEntry(id, patch) { var e = getEntry(id); if (!e) return null; for (var k in patch) e[k] = patch[k]; e.edited = Date.now(); saveJ(); return e; }
  function deleteEntry(id) { var i = J.entries.findIndex(function (e) { return e.id === id; }); if (i >= 0) { J.entries.splice(i, 1); saveJ(); } }
  function getEntry(id) { return J.entries.filter(function (e) { return e.id === id; })[0] || null; }
  function entryText(e) {
    return [e.problemTitle, e.problemId, (e.nodes || []).map(function (n) { return NODES[n] ? NODES[n].name : n; }).join(' '), e.comp, e.kind, e.season,
      (e.approaches || []).join(' '), e.stuck, e.insight, (e.mistakes || []).join(' '), e.tip, e.text].join(' ').toLowerCase();
  }
  function searchJ(q, f) {
    f = f || {};
    var terms = String(q || '').toLowerCase().split(/\s+/).filter(Boolean);
    return J.entries.filter(function (e) {
      if (f.kind && e.kind !== f.kind) return false;
      if (f.season && e.season !== f.season) return false;
      if (f.node && (e.nodes || []).indexOf(f.node) < 0) return false;
      if (f.comp && e.comp !== f.comp) return false;
      if (f.tipsOnly && !e.tip) return false;
      var hay = entryText(e);
      return terms.every(function (t) { return hay.indexOf(t) >= 0; });
    }).sort(function (a, b) { return b.t - a.t; });
  }
  function resurface(nodeIds, pid, limit) {
    nodeIds = nodeIds || [];
    return J.entries.filter(function (e) {
      return (pid && e.problemId === pid) || (e.nodes || []).some(function (n) { return nodeIds.indexOf(n) >= 0; });
    }).sort(function (a, b) { return (b.pinned - a.pinned) || ((pid && b.problemId === pid) - (pid && a.problemId === pid)) || (b.t - a.t); }).slice(0, limit || 4);
  }
  function pinnedTips() { return J.entries.filter(function (e) { return e.pinned && (e.tip || e.text); }).sort(function (a, b) { return b.t - a.t; }); }
  K.addEntry = addEntry; K.updateEntry = updateEntry; K.deleteEntry = deleteEntry; K.getEntry = getEntry;
  K.searchJ = searchJ; K.resurface = resurface; K.pinnedTips = pinnedTips;

  /* Markdown export (Obsidian-friendly) */
  function yq(s) { return '"' + String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ') + '"'; }
  function slug(s) { return String(s || 'entry').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'entry'; }
  var KIND_NAME = { problem: 'Problem reflection', free: 'Free note', daily: 'Daily reflection', session: 'Session reflection', compday: 'Competition-day log', review: 'Post-competition review', mock: 'Mock post-mortem' };
  K.KIND_NAME = KIND_NAME;
  function entryTitle(e) { return e.problemTitle ? e.problemTitle : (KIND_NAME[e.kind] || 'Note') + ' — ' + e.date; }
  K.entryTitle = entryTitle;
  function entryToMd(e) {
    var tags = ['stat-brainteaser', 'kind/' + e.kind].concat((e.mistakes || []).map(function (m) { return 'mistake/' + slug(m); }));
    var fm = ['---',
      'date: ' + e.date,
      'kind: ' + e.kind,
      e.problemId ? 'problem: ' + yq(e.problemId + (e.problemTitle ? ' — ' + e.problemTitle : '')) : null,
      'nodes: [' + (e.nodes || []).join(', ') + ']',
      e.comp ? 'competition: ' + e.comp : null,
      'season: ' + yq(e.season),
      e.outcome ? 'outcome: ' + e.outcome : null,
      e.confidence ? 'confidence: ' + e.confidence : null,
      e.minutes ? 'minutes: ' + e.minutes : null,
      'pinned: ' + (e.pinned ? 'true' : 'false'),
      'tags: [' + tags.join(', ') + ']',
      'id: ' + e.id,
      '---', ''].filter(function (x) { return x !== null; });
    var body = ['# ' + entryTitle(e), ''];
    if (e.prompt) body.push('> ' + e.prompt, '');
    if ((e.nodes || []).length) body.push('Skills: ' + e.nodes.map(function (n) { return '[[' + (NODES[n] ? NODES[n].name : n) + ']]'; }).join(', '), '');
    if ((e.approaches || []).length) body.push('**Approach tried:** ' + e.approaches.join(', '), '');
    if (e.stuck) body.push('**Where I got stuck:** ' + e.stuck, '');
    if (e.insight) body.push('**Key insight:** ' + e.insight, '');
    if ((e.mistakes || []).length) body.push('**Mistake type:** ' + e.mistakes.join(', '), '');
    if (e.tip) body.push('**Tip to future me:** ' + e.tip, '');
    if (e.text) body.push(e.text, '');
    return fm.join('\n') + body.join('\n');
  }
  function entryFileName(e) { return e.date + '-' + slug(entryTitle(e)) + '-' + e.id.slice(-5) + '.md'; }
  function journalMarkdown(entries) {
    entries = (entries || J.entries).slice().sort(function (a, b) { return a.t - b.t; });
    return '# Stat Brainteaser journal\n\nExported ' + today() + ' · ' + entries.length + ' entries\n\n' +
      entries.map(function (e) { return entryToMd(e).replace(/^---\n/, '```yaml\n').replace(/\n---\n/, '\n```\n'); }).join('\n---\n\n');
  }
  K.entryToMd = entryToMd; K.entryFileName = entryFileName; K.journalMarkdown = journalMarkdown;

  /* Minimal store-only ZIP writer (no compression, no dependencies) */
  var CRC_TABLE = (function () { var t = new Uint32Array(256); for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(bytes) { var c = 0xFFFFFFFF; for (var i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function makeZip(files) {
    var enc = new TextEncoder(), chunks = [], central = [], offset = 0;
    var now = new Date();
    var dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
    var dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    function u16(v) { return [v & 255, (v >>> 8) & 255]; }
    function u32(v) { return [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]; }
    files.forEach(function (f) {
      var name = enc.encode(f.name), data = typeof f.data === 'string' ? enc.encode(f.data) : f.data, crc = crc32(data);
      var head = [].concat([0x50, 0x4b, 0x03, 0x04], u16(20), u16(0x0800), u16(0), u16(dosTime), u16(dosDate), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0));
      chunks.push(new Uint8Array(head), name, data);
      central.push(new Uint8Array([].concat([0x50, 0x4b, 0x01, 0x02], u16(20), u16(20), u16(0x0800), u16(0), u16(dosTime), u16(dosDate), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset))), name);
      offset += head.length + name.length + data.length;
    });
    var cdSize = central.reduce(function (s, c) { return s + c.length; }, 0);
    var end = new Uint8Array([].concat([0x50, 0x4b, 0x05, 0x06], u16(0), u16(0), u16(files.length), u16(files.length), u32(cdSize), u32(offset), u16(0)));
    return new Blob(chunks.concat(central, [end]), { type: 'application/zip' });
  }
  function journalZip() {
    var files = J.entries.slice().sort(function (a, b) { return a.t - b.t; }).map(function (e) { return { name: 'stat-brainteaser-journal/' + entryFileName(e), data: entryToMd(e) }; });
    files.push({ name: 'stat-brainteaser-journal/README.md', data: '# Stat Brainteaser journal\n\nOne note per entry with YAML front-matter (date, kind, problem, nodes, competition, season, tags). Drop this folder into your Obsidian vault.\n' });
    return makeZip(files);
  }
  K.crc32 = crc32; K.makeZip = makeZip; K.journalZip = journalZip;
  function download(blob, name) {
    var url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 3000);
  }
  K.download = download;

  /* ------------------------------------------------------------------ */
  /* Hooks into the main app                                             */
  /* ------------------------------------------------------------------ */
  core.HOOKS.exportData.push(function (data) { data.journal = J.entries; });
  core.HOOKS.importData.push(function (obj, mode) {
    if (!obj || !Array.isArray(obj.journal)) return;
    if (mode === 'replace') J.entries = obj.journal.slice();
    else { var have = {}; J.entries.forEach(function (e) { have[e.id] = 1; }); obj.journal.forEach(function (e) { if (e && e.id && !have[e.id]) J.entries.push(e); }); }
    K.J = J; saveJ();
  });
  core.HOOKS.mergeState.push(function (cur, inc) {
    var ic = inc.comp;
    if (!ic || !core.isPlainObj(ic)) return;
    var cc = cur.comp;
    if (!cc || !cc.setup) { cur.comp = ic; return; }
    Object.keys(ic.attempts || {}).forEach(function (pid) {
      var seen = {}; (cc.attempts[pid] = cc.attempts[pid] || []).forEach(function (a) { seen[a.t] = 1; });
      ic.attempts[pid].forEach(function (a) { if (!seen[a.t]) cc.attempts[pid].push(a); });
      cc.attempts[pid].sort(function (a, b) { return a.t - b.t; });
    });
    Object.keys(ic.mastery || {}).forEach(function (n) { if (!cc.mastery[n] || (ic.mastery[n].n || 0) > (cc.mastery[n].n || 0)) cc.mastery[n] = ic.mastery[n]; });
    ['lessonsRead', 'refs', 'done', 'visits'].forEach(function (k) { cc[k] = cc[k] || {}; Object.keys(ic[k] || {}).forEach(function (x) { if (!cc[k][x]) cc[k][x] = ic[k][x]; }); });
    var mt = {}; (cc.mocks || []).forEach(function (m) { mt[m.mockId + m.d] = 1; }); (ic.mocks || []).forEach(function (m) { if (!mt[m.mockId + m.d]) cc.mocks.push(m); });
  });
  // Optional reflection after quant problems
  core.HOOKS.graded.push(function (p, correct, card) {
    if (!C().settings.reflectQuant || !card) return;
    var nav = card.querySelector('.pnav');
    if (!nav || card.querySelector('.reflect-link')) return;
    var a = document.createElement('a');
    a.className = 'btn ghost reflect-link'; a.href = '#journal/new?kind=problem&qp=' + encodeURIComponent(p.id) + '&ok=' + (correct ? 1 : 0);
    a.textContent = 'Add a reflection';
    nav.insertBefore(a, nav.querySelector('.spacer'));
  });
  core.HOOKS.boot.push(function () { try { ensureSeason(); refresh(); } catch (e) { console.warn(e); } });
});
