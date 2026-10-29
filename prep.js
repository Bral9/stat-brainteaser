/* Stat Brainteaser — interview prep logic: deterministic rule-based study planner (12 / 8 / 4-week and 2-week
 * superday templates), firm checklists & notes, superday mocks, journal integration. No LLM, no randomness:
 * the same saved state and the same date always give the same plan. Views live in prep-ui.js.
 * Registers itself with app.js through window.SBT_PLUGINS. */
(window.SBT_PLUGINS = window.SBT_PLUGINS || []).push(function (core) {
  'use strict';
  var D = window.SBT_PREP_DATA;
  if (!D) return;
  var P = window.SBT_PREP = { core: core, D: D };
  var FIRMS = {}; D.firms.forEach(function (f) { FIRMS[f.id] = f; });
  P.FIRMS = FIRMS;
  var addDays = core.addDays, parseYmd = core.parseYmd;
  function today() { return core.today(); }
  function daysBetween(a, b) { return Math.round((parseYmd(b) - parseYmd(a)) / 864e5); }
  function weekdayIdx(d) { return (parseYmd(d).getDay() + 6) % 7; } // 0 = Monday
  P.daysBetween = daysBetween; P.weekdayIdx = weekdayIdx;

  /* ------------------------------------------------------------------ */
  /* State                                                               */
  /* ------------------------------------------------------------------ */
  function defaults() {
    return {
      setup: null,      // {date, firm, hours, restDay (0=Mon … 6=Sun, -1 none), created}
      plan: null,       // {built, template, start, end, days:[…], weights}
      history: [],      // past plan days [{d, phase, tasks, doneCount, total}]
      done: {},         // manual task ticks: key -> date
      changes: [],      // [{d, msg}]
      firms: {},        // firmId -> {check: {i: date}, notes: {text, t}}
      mocks: [],        // superday mock results
      activeMock: null
    };
  }
  function C() {
    var s = core.S;
    if (!core.isPlainObj(s.prep) || !s.prep._v) { s.prep = core.mergeDefaults(core.isPlainObj(s.prep) ? s.prep : {}, defaults()); s.prep._v = 1; }
    return s.prep;
  }
  P.C = C;
  function save() { core.save(); }
  function addChange(msg) { var c = C(); c.changes.unshift({ d: today(), msg: msg }); if (c.changes.length > 40) c.changes.length = 40; }

  /* ------------------------------------------------------------------ */
  /* Planner                                                             */
  /* ------------------------------------------------------------------ */
  var PROBS = core.PROBLEMS, BY_ID = core.BY_ID;
  var QUANT = core.CATS.filter(function (c) { return c.group !== 'tech' && c.group !== 'swe' && core.catStats(c.id).total; }).map(function (c) { return c.id; });
  var TECH = core.CATS.filter(function (c) { return (c.group === 'tech' || c.group === 'swe') && core.catStats(c.id).total; }).map(function (c) { return c.id; });
  var MIN_PER = { 1: 6, 2: 10, 3: 15 };

  function templateFor(days) { return days >= 70 ? 'w12' : days >= 42 ? 'w8' : days >= 21 ? 'w4' : 'd14'; }
  function phaseAt(tpl, frac) {
    // frac in [0,1): position inside the template; templates count in weeks (or days for d14)
    var T = D.plans[tpl], unit = T.days ? 14 : T.weeks, pos = Math.min(unit - 1e-9, frac * unit) + 1;
    for (var i = 0; i < T.phases.length; i++) if (pos < T.phases[i].to + 1) return T.phases[i];
    return T.phases[T.phases.length - 1];
  }
  P.templateFor = templateFor; P.phaseAt = phaseAt;

  /* topic weights: firm topics and phase focus count more; weak topics (from Stats) count up to ~2.2× more */
  function weightsFor(setup, phase, weak) {
    var firm = setup.firm && FIRMS[setup.firm];
    var w = {};
    QUANT.concat(TECH).forEach(function (c) {
      var base = TECH.indexOf(c) >= 0 ? (firm && firm.topics.indexOf(c) >= 0 ? 1.4 : 0) : (c === 'fermi' ? 0.5 : 1);
      if (firm && firm.topics.indexOf(c) >= 0) base = Math.max(base, 2);
      if (phase.focus && phase.focus.indexOf(c) >= 0) base *= 1.8;
      var wk = weak[c] == null ? 0.5 : weak[c];
      w[c] = Math.round(base * (0.6 + 1.6 * wk) * 1000) / 1000;
    });
    return w;
  }
  function weaknessMap() {
    var list = core.topicWeakness(), mx = 0, out = {};
    list.forEach(function (x) { mx = Math.max(mx, x.score); });
    list.forEach(function (x) { out[x.id] = mx ? x.score / mx : 0.5; });
    // v2.1: topics flagged weak by recent mock-interview reports are weighted up (never down)
    var MK = window.SBT_MOCK, mw = null;
    try { mw = MK && MK.weakTopics ? MK.weakTopics() : null; } catch (e) { mw = null; }
    if (mw) Object.keys(mw).forEach(function (c) { var v = +mw[c]; if (isFinite(v) && v > 0) out[c] = Math.max(out[c] == null ? 0.5 : out[c], Math.min(1, v)); });
    return out;
  }
  P.weaknessMap = weaknessMap;

  function arcadeHref(id) { return '#arcade/' + id; }
  function arcadeName(id) {
    var base = String(id).split('/')[0];
    var A = window.SBT_ARCADE, g = A && Array.isArray(A.games) ? A.games.filter(function (x) { return x.id === base; })[0] : null;
    var nm = (g && g.name) || (D.arcade[base] || {}).name || base;
    var v = String(id).split('/')[1];
    return nm + (v ? ' (' + ({ oa: 'test mode', make: 'make markets', test: 'test mode', optiver: 'test format' }[v] || v) + ')' : '');
  }
  P.arcadeName = arcadeName; P.arcadeHref = arcadeHref;
  function round5(x) { return Math.max(5, Math.round(x / 5) * 5); }

  /* Build the plan for [from, setup.date). Deterministic: the topic rotation is simulated from setup.created so it
   * continues smoothly across rebuilds; problems are picked by a fixed ordering (unsolved first, difficulty, id). */
  function buildPlan(setup, from, weakOverride) {
    if (!setup || !setup.date) return null;
    var start = setup.created || from;
    if (start > from) start = from;
    var total = daysBetween(start, setup.date);
    if (total <= 0 || daysBetween(from, setup.date) <= 0) return { built: from, template: templateFor(Math.max(0, total)), start: start, end: setup.date, days: [], weights: {} };
    var tpl = templateFor(total);
    var weak = weakOverride || weaknessMap();
    var firm = setup.firm && FIRMS[setup.firm];
    var minutes = Math.max(20, Math.round((+setup.hours || 1.5) * 60));
    var credit = {}, used = {}, days = [], fmtIdx = 0, studyN = 0, firstStudy = -1;
    QUANT.concat(TECH).forEach(function (c) { credit[c] = 0; });
    var status = core.status;
    function pickProblems(cat, k, diffs, styles) {
      var pool = PROBS.filter(function (p) { return p.cat === cat && !used[p.id] && status(p.id) !== 'solved' && p.answer && p.answer.type !== 'self'; });
      var rank = { unsolved: 0, attempting: 1, wrong: 2, seen: 2 };
      pool.sort(function (a, b) {
        var da = diffs.indexOf(a.diff) < 0 ? 1 : 0, db = diffs.indexOf(b.diff) < 0 ? 1 : 0;
        var sa = styles && core.pStyles(a).some(function (s) { return styles.indexOf(s) >= 0; }) ? 0 : 1;
        var sb = styles && core.pStyles(b).some(function (s) { return styles.indexOf(s) >= 0; }) ? 0 : 1;
        return da - db || sa - sb || rank[status(a.id)] - rank[status(b.id)] || a.diff - b.diff || (a.id < b.id ? -1 : 1);
      });
      var out = [], mins = 0;
      for (var i = 0; i < pool.length && out.length < k; i++) { out.push(pool[i].id); used[pool[i].id] = 1; mins += MIN_PER[pool[i].diff]; }
      return { ids: out, mins: mins };
    }
    /* v2.1 slots: mock interviews (weekly, then twice a week in the last 3 weeks), a weekly coding-lab problem,
     * a weekly microstructure slot for trading-desk targets, and reading slots (Library "start here" items in week 1, then
     * a weekly Learn lesson / Library item in the weakest topic). All deterministic in (setup, saved state, date). */
    var LIB = window.SBT_LIB, LRN = window.SBT_LEARN;
    var usedRead = {}, usedLesson = {}, readN = 0;
    var weakest = Object.keys(weak).filter(function (c) { return QUANT.concat(TECH).indexOf(c) >= 0; }).sort(function (a, b) { return weak[b] - weak[a] || (a < b ? -1 : 1); })[0] || 'probability';
    var codingTarget = !firm || firm.topics.indexOf('coding') >= 0 || firm.topics.indexOf('python') >= 0 || firm.topics.indexOf('dsa') >= 0 || firm.styles.indexOf('coding-screen') >= 0;
    var tradingTarget = !!firm && (firm.topics.indexOf('micro') >= 0 || firm.styles.indexOf('market-making-game') >= 0 || firm.styles.indexOf('trading-desk') >= 0);
    var mockFmt = firm ? (firm.id === 'jane-street' ? 'js' : 'firm:' + firm.id) : 'classic';
    function libPick(cat, startOnly) {
      if (!LIB) return null;
      var list = [];
      try { list = (startOnly ? LIB.startItems(6, cat) : LIB.forCat(cat, 8)) || []; } catch (e) { list = []; }
      if (!list.length && startOnly) { try { list = LIB.startItems(6) || []; } catch (e) { list = []; } }
      var st = (core.S.library && core.S.library.items) || {};
      for (var j = 0; j < list.length; j++) {
        var it = list[j]; if (!it || usedRead[it.id]) continue;
        if ((st[it.id] || {}).status === 'done') continue;
        usedRead[it.id] = 1; return it;
      }
      return null;
    }
    function lessonPick(cat) {
      if (!LRN || !LRN.forCat) return null;
      var list = []; try { list = LRN.forCat(cat) || []; } catch (e) { list = []; }
      var ls = (core.S.learn && core.S.learn.lessons) || {};
      for (var j = 0; j < list.length; j++) { var l = list[j]; if (l && !usedLesson[l.id] && !(ls[l.id] || {}).read) { usedLesson[l.id] = 1; return l; } }
      return null;
    }
    function addV21Tasks(day, i, ph, superdayMock) {
      if (day.diag) return;
      var left = daysBetween(day.d, setup.date);
      var busy = superdayMock || day.tasks.some(function (t) { return t.type === 'mock' || t.type === 'stamina'; });
      // 1) mock interview (replaces that day's format practice)
      var mockDay = left <= 21 ? (left % 7 === 2 || left % 7 === 5) : left % 7 === 4;
      if (mockDay && !busy && left > 0) {
        var fmt = studyN <= 7 ? 'phone' : mockFmt;
        day.tasks = day.tasks.filter(function (t) { return t.type !== 'format'; });
        day.tasks.push({ k: 'mockiv@' + day.d, type: 'mockiv', fmt: fmt, label: 'Mock interview: ' + (fmt === 'phone' ? '30-minute phone screen' : fmt === 'classic' ? '2 maths + 1 coding round' : fmt === 'js' ? 'conversational trading interview' : (firm ? firm.name + '-style rounds' : 'mixed rounds')) + ', out loud', href: '#mock/' + fmt, min: fmt === 'phone' ? 30 : 60 });
        return;
      }
      // 2) coding lab: one problem a week, with the complexity follow-up
      if (codingTarget && left % 7 === 1) {
        // v2.3: alternate the quant-flavoured coding lab with classic algorithms when the target codes algorithmically
        var algoWeek = (!firm || firm.topics.indexOf('dsa') >= 0) && Math.floor(i / 7) % 2 === 1;
        var pk = pickProblems(algoWeek ? 'dsa' : 'coding', 1, [1, 2, 3], null);
        if (!pk.ids.length && algoWeek) pk = pickProblems('coding', 1, [1, 2, 3], null);
        if (!pk.ids.length) pk = pickProblems('python', 1, [2, 3], null);
        if (pk.ids.length) day.tasks.push({ k: 'code@' + day.d, type: 'code', ids: pk.ids, label: 'Coding lab: ' + (BY_ID[pk.ids[0]] || {}).title + ' (+ complexity follow-up)', min: 25 });
      }
      // 3) microstructure slot for trading-desk targets: the queue game, alternating with a microstructure lesson
      if (tradingTarget && left % 7 === 6) {
        var ml = (Math.floor(i / 7) % 2) ? lessonPick('micro') : null;
        if (ml) day.tasks.push({ k: 'lesson@' + day.d, type: 'lesson', lesson: ml.id, label: 'Microstructure lesson: ' + ml.title, href: '#learn/' + ml.id, min: 10 });
        else day.tasks.push({ k: 'micro@' + day.d, type: 'micro', label: 'Microstructure: Queue Position game (queue strength, scratch vs hold, fees vs tick)', href: '#arcade/queue', min: 15 });
      }
      // 4) reading: week 1 = 1-2 Library "start here" items; afterwards a weekly Learn lesson / reading slot in the weakest topic
      if (i < 7) {
        if (readN < 2 && (readN === 0 || i >= 3)) {
          var it = libPick(weakest, true);
          if (it) { readN++; day.tasks.push({ k: 'read@' + day.d, type: 'read', item: it.id, label: 'Read: ' + it.title + (it.author ? ' (' + it.author + ')' : ''), href: '#library/' + encodeURIComponent(it.id), min: 20 }); }
        }
      } else if (left % 7 === 0) {
        var les = Math.floor(i / 7) % 2 ? lessonPick(weakest) : null;
        if (les) day.tasks.push({ k: 'lesson@' + day.d, type: 'lesson', lesson: les.id, label: 'Learn: ' + les.title + ' (' + core.catName(weakest) + ', your weakest topic)', href: '#learn/' + les.id, min: 10 });
        else {
          var it2 = libPick(weakest, false) || libPick(weakest, true);
          if (it2) day.tasks.push({ k: 'read@' + day.d, type: 'read', item: it2.id, label: 'Reading: ' + it2.title, href: '#library/' + encodeURIComponent(it2.id), min: 20 });
          else { var les2 = lessonPick(weakest); if (les2) day.tasks.push({ k: 'lesson@' + day.d, type: 'lesson', lesson: les2.id, label: 'Learn: ' + les2.title, href: '#learn/' + les2.id, min: 10 }); }
        }
      }
    }
    for (var i = 0; i < total; i++) {
      var d = addDays(start, i);
      var frac = i / total;
      var ph = phaseAt(tpl, frac);
      var rest = setup.restDay != null && setup.restDay >= 0 && weekdayIdx(d) === +setup.restDay;
      var w = weightsFor(setup, ph, weak);
      var cat = null;
      if (!rest) {
        // largest-credit rotation (deterministic weighted round-robin)
        var sum = 0; Object.keys(w).forEach(function (c) { credit[c] += w[c]; sum += w[c]; });
        Object.keys(w).sort().forEach(function (c) { if (w[c] > 0 && (cat === null || credit[c] > credit[cat] + 1e-9)) cat = c; });
        if (cat) credit[cat] -= sum;
        studyN++;
        if (firstStudy < 0) firstStudy = i;
      }
      if (d < from) continue;
      var day = { d: d, phase: ph.id, phaseName: ph.name, rest: rest, minutes: rest ? 0 : minutes, tasks: [], week: Math.floor(i / 7) + 1 };
      if (!rest) {
        var mix = ph.mix, msum = mix.math + mix.topic + mix.format + mix.review;
        var mm = round5(minutes * mix.math / msum), tm = minutes * mix.topic / msum, fm = mix.format ? round5(minutes * mix.format / msum) : 0, rm = round5(minutes * mix.review / msum);
        // 1) mental maths
        var oa = firm && firm.arcade.filter(function (x) { return /^(eighty|mania|sequences)/.test(x); });
        var mathRef = (studyN % 2 && oa && oa.length) ? oa[(studyN >> 1) % oa.length] : null;
        if (ph.id === 'diagnostic' && i === firstStudy) {
          day.diag = true;
          day.tasks.push({ k: 'math@' + d, type: 'math', label: 'Diagnostic: timed arithmetic test (2-minute sprint)', href: '#sprint', min: mm });
        } else day.tasks.push({ k: 'math@' + d, type: 'math', label: 'Mental maths: ' + (mathRef ? arcadeName(mathRef) : '2-minute sprint'), href: mathRef ? arcadeHref(mathRef) : '#sprint', min: mm });
        // 2) topic problems
        var diffs = ph.id === 'foundations' || ph.id === 'diagnostic' || ph.id === 'map' ? [1, 2] : ph.id === 'core' ? [2] : [2, 3];
        var styles = firm && (ph.id === 'firm' || ph.id === 'sets' || ph.id === 'stamina' || ph.id === 'formats') ? firm.styles : null;
        if (day.diag) {
          var ids = [];
          QUANT.slice(0, 8).forEach(function (c) { ids = ids.concat(pickProblems(c, 1, [1, 2], null).ids); });
          day.tasks.push({ k: 'topic@' + d, type: 'topic', label: 'Diagnostic: ' + ids.length + ' mixed problems', ids: ids, cat: null, min: round5(tm) });
        } else if (cat && tm >= 8) {
          var k = Math.max(1, Math.round(tm / MIN_PER[diffs[diffs.length - 1]]));
          var pk = pickProblems(cat, k, diffs, styles);
          if (pk.ids.length < k) { // topic exhausted: top up from the next weakest topic
            var alt = Object.keys(w).filter(function (c) { return c !== cat && w[c] > 0; }).sort(function (a, b) { return w[b] - w[a] || (a < b ? -1 : 1); });
            for (var j = 0; j < alt.length && pk.ids.length < k; j++) pk.ids = pk.ids.concat(pickProblems(alt[j], k - pk.ids.length, diffs, styles).ids);
          }
          if (pk.ids.length) day.tasks.push({ k: 'topic@' + d, type: 'topic', cat: cat, ids: pk.ids, label: core.catName(cat) + ': ' + pk.ids.length + ' problem' + (pk.ids.length > 1 ? 's' : ''), min: round5(tm) });
        }
        // 3) format practice
        var isMock = (ph.mockDaily) || (ph.mock && (daysBetween(d, setup.date) % 7 === 3 || daysBetween(d, setup.date) % 7 === 6) && ph.mock >= 1);
        if (ph.stamina && weekdayIdx(d) % 2 === 0) day.tasks.push({ k: 'mock@' + d, type: 'stamina', label: 'Stamina: 4 back-to-back superday mocks', href: '#superday/stamina', min: 180 });
        else if (isMock) day.tasks.push({ k: 'mock@' + d, type: 'mock', label: 'Superday mock: 45-minute mixed set, out loud', href: '#superday', min: 45 });
        else if (fm) {
          var pool = (firm && firm.arcade.length ? firm.arcade : []).concat((ph.focus || []).reduce(function (a, c) { return a.concat(D.arcadeForCat[c] || []); }, []));
          if (!pool.length) pool = ['dice/make', 'cards', 'kelly', 'fermi', 'balloon'];
          var g = pool[fmtIdx++ % pool.length];
          day.tasks.push({ k: 'format@' + d, type: 'format', label: 'Format practice: ' + arcadeName(g), href: arcadeHref(g), min: fm });
        }
        addV21Tasks(day, i, ph, isMock);
        if (ph.stories && !day.tasks.some(function (t) { return t.type === 'stories'; })) day.tasks.push({ k: 'stories@' + d, type: 'stories', label: 'Write and rehearse 3–4 two-minute behavioural stories', href: '#journal/new?kind=free', min: 20 });
        // 4) review misses
        day.tasks.push({ k: 'review@' + d, type: 'review', label: 'Review misses (spaced repetition)', href: '#review', min: rm });
      }
      days.push(day);
    }
    return { v21: 1, built: from, template: tpl, start: start, end: setup.date, days: days, weights: weightsFor(setup, phaseAt(tpl, Math.min(0.999, daysBetween(start, from) / total)), weak) };
  }
  P.buildPlan = buildPlan;

  /* ------------------------------------------------------------------ */
  /* Task completion                                                     */
  /* ------------------------------------------------------------------ */
  function dayStartMs(d) { return parseYmd(d).getTime(); }
  function topicProgress(t, day) {
    var since = dayStartMs(day.d), n = 0;
    (t.ids || []).forEach(function (id) { var a = core.S.attempts[id]; if (a && a.last >= since) n++; });
    return { n: n, of: (t.ids || []).length };
  }
  function isDone(t, day) {
    var c = C();
    if (c.done[t.k]) return true;
    switch (t.type) {
      case 'topic': var pr = topicProgress(t, day); return pr.of > 0 && pr.n >= pr.of;
      case 'math': return core.S.sprint.history.some(function (r) { return r.d === day.d; });
      case 'review': return day.d === today() && core.dueIds().length === 0 && (core.S.days[day.d] || 0) > 0;
      case 'mock': return c.mocks.some(function (m) { return m.d === day.d; });
      case 'stamina': return c.mocks.some(function (m) { return m.d === day.d && m.kind === 'stamina'; });
      // v2.1 slots
      case 'code': var pc = topicProgress(t, day); return pc.of > 0 && pc.n >= pc.of;
      case 'mockiv': var ms = core.S.mock; return !!(ms && Array.isArray(ms.reports) && ms.reports.some(function (r) { return r && (r.d === day.d || (r.t && core.ymd(new Date(r.t)) === day.d)); }));
      case 'micro': var R = (core.S.arcade && core.S.arcade.runs) || {}; return Object.keys(R).some(function (k) { return k.split('/')[0] === 'queue' && Array.isArray(R[k]) && R[k].some(function (r) { return r && r.t && core.ymd(new Date(r.t)) === day.d; }); });
      case 'read': var li = core.S.library && core.S.library.items && core.S.library.items[t.item]; return !!(li && (li.status === 'reading' || li.status === 'done'));
      case 'lesson': var le = core.S.learn && core.S.learn.lessons && core.S.learn.lessons[t.lesson]; return !!(le && le.read);
      default: return false;
    }
  }
  function toggleDone(k, v) { var c = C(); if (v) c.done[k] = today(); else delete c.done[k]; save(); }
  P.isDone = isDone; P.toggleDone = toggleDone; P.topicProgress = topicProgress;

  /* ------------------------------------------------------------------ */
  /* Lifecycle: setup, daily refresh (archive + re-flow), today          */
  /* ------------------------------------------------------------------ */
  function saveSetup(st) {
    var c = C();
    var setup = { date: st.date, firm: FIRMS[st.firm] ? st.firm : '', hours: Math.max(0.25, Math.min(12, +st.hours || 1.5)), restDay: st.restDay == null ? 6 : +st.restDay, created: (c.setup && c.setup.date === st.date && c.setup.created) || today() };
    c.setup = setup;
    c.plan = buildPlan(setup, today());
    addChange('Plan built: ' + D.plans[c.plan.template].name + ' to ' + setup.date + (setup.firm ? ' for ' + FIRMS[setup.firm].name : '') + ', about ' + Math.round(setup.hours * 60) + ' min a day.');
    save();
    return c.plan;
  }
  function clearPlan() { var c = C(); c.setup = null; c.plan = null; addChange('Interview plan removed.'); save(); }
  P.saveSetup = saveSetup; P.clearPlan = clearPlan;

  /* Once per day: archive finished days, and rebuild from today so missed work re-flows and weights track your stats. */
  function refresh(force) {
    var c = C(), t = today();
    if (!c.setup || !c.plan) return;
    if (!force && c.plan.built === t && c.plan.v21) return; // v2.1: plans built by 2.0 are rebuilt once to add the new slots
    var past = (c.plan.days || []).filter(function (d) { return d.d < t; });
    var missedDays = past.filter(function (d) { return !d.rest && d.tasks.length && d.tasks.every(function (x) { return !isDone(x, d); }); });
    var undone = 0;
    past.forEach(function (d) {
      var done = d.tasks.filter(function (x) { return isDone(x, d); }).length;
      undone += d.tasks.filter(function (x) { return x.type === 'topic' && !isDone(x, d); }).length;
      if (!c.history.some(function (h) { return h.d === d.d; })) c.history.push({ d: d.d, phase: d.phase, rest: d.rest, tasks: d.tasks, doneCount: done, total: d.tasks.length });
    });
    if (c.history.length > 400) c.history = c.history.slice(-400);
    var oldW = c.plan.weights || {};
    c.plan = buildPlan(c.setup, t);
    if (missedDays.length) addChange('Re-flowed ' + missedDays.length + ' missed day' + (missedDays.length > 1 ? 's' : '') + ': their unsolved problems moved into the coming days.');
    else if (undone) addChange('Unfinished topic problems from earlier days were moved forward.');
    var nw = c.plan.weights || {}, top = Object.keys(nw).sort(function (a, b) { return nw[b] - nw[a] || (a < b ? -1 : 1); })[0], otop = Object.keys(oldW).sort(function (a, b) { return oldW[b] - oldW[a] || (a < b ? -1 : 1); })[0];
    if (top && otop && top !== otop) addChange('Most weight now on ' + core.catName(top) + ' (your weakest area right now).');
    save();
  }
  P.refresh = refresh;
  function todayDay() { var c = C(); if (!c.plan) return null; var t = today(); return (c.plan.days || []).filter(function (d) { return d.d === t; })[0] || null; }
  P.todayDay = todayDay;

  /* ------------------------------------------------------------------ */
  /* Practice sets for firms and mocks (deterministic picks)             */
  /* ------------------------------------------------------------------ */
  function firmSet(firmId, n) {
    var f = FIRMS[firmId]; if (!f) return [];
    n = n || 10;
    var st = core.status;
    var pool = PROBS.filter(function (p) {
      return p.answer && p.answer.type !== 'self' && (core.pStyles(p).some(function (s) { return f.styles.indexOf(s) >= 0; }) || f.topics.indexOf(p.cat) >= 0);
    });
    function score(p) {
      var s = 0;
      if (core.pStyles(p).some(function (x) { return f.styles.indexOf(x) >= 0; })) s += 4;
      if (f.topics.indexOf(p.cat) >= 0) s += 2;
      if (st(p.id) !== 'solved') s += 3;
      if (p.diff >= 2) s += 1;
      return s;
    }
    pool.sort(function (a, b) { return score(b) - score(a) || a.diff - b.diff || (a.id < b.id ? -1 : 1); });
    // interleave categories so the set is mixed
    var out = [], byCat = {};
    pool.forEach(function (p) { (byCat[p.cat] = byCat[p.cat] || []).push(p); });
    var cats = Object.keys(byCat).sort(function (a, b) { return score(byCat[b][0]) - score(byCat[a][0]) || (a < b ? -1 : 1); });
    while (out.length < n && cats.some(function (c) { return byCat[c].length; })) cats.forEach(function (c) { if (out.length < n && byCat[c].length) out.push(byCat[c].shift().id); });
    return out;
  }
  P.firmSet = firmSet;
  var MOCK_MIN = { 1: 5, 2: 8, 3: 12 };
  /* A ~45-minute mixed set: trader-style problems, unsolved first, mixed topics and difficulty. `salt` varies mocks. */
  function mockSet(firmId, salt) {
    var f = FIRMS[firmId];
    var styles = f ? f.styles : ['trading-desk', 'betting-game', 'market-making-game', 'OA-speed', 'brainteaser-phone'];
    var st = core.status, h = 0, key = String(salt || '') + (firmId || '');
    for (var i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
    var pool = PROBS.filter(function (p) { return p.answer && p.answer.type !== 'self' && p.cat !== 'sql' && p.cat !== 'python' && core.pStyles(p).some(function (s) { return styles.indexOf(s) >= 0; }); });
    if (pool.length < 8) pool = PROBS.filter(function (p) { return p.answer && p.answer.type !== 'self' && QUANT.indexOf(p.cat) >= 0; });
    function hv(id) { var x = h; for (var j = 0; j < id.length; j++) x = (x * 33 + id.charCodeAt(j)) >>> 0; return x; }
    pool.sort(function (a, b) { return (st(a.id) === 'solved') - (st(b.id) === 'solved') || hv(a.id) - hv(b.id); });
    var out = [], mins = 0, cats = {}, want = [2, 1, 3, 2, 2, 3, 2];
    for (var w = 0; w < want.length && mins < 42; w++) {
      var p = pool.filter(function (q) { return out.indexOf(q.id) < 0 && q.diff === want[w] && !cats[q.cat]; })[0] || pool.filter(function (q) { return out.indexOf(q.id) < 0 && !cats[q.cat]; })[0] || pool.filter(function (q) { return out.indexOf(q.id) < 0; })[0];
      if (!p) break;
      out.push(p.id); mins += MOCK_MIN[p.diff]; cats[p.cat] = 1;
    }
    return out;
  }
  P.mockSet = mockSet;
  P.mockMinutes = function (ids) { return ids.reduce(function (s, id) { return s + MOCK_MIN[(BY_ID[id] || {}).diff || 2]; }, 0); };

  /* ------------------------------------------------------------------ */
  /* Firm checklist + notes                                              */
  /* ------------------------------------------------------------------ */
  function firmState(id) { var c = C(); c.firms[id] = c.firms[id] || { check: {}, notes: { text: '', t: 0 } }; if (!c.firms[id].check) c.firms[id].check = {}; if (!c.firms[id].notes) c.firms[id].notes = { text: '', t: 0 }; return c.firms[id]; }
  P.firmState = firmState;
  function firmProgress(id) { var f = FIRMS[id], s = (C().firms[id] || {}).check || {}; var n = f.checklist.length, k = f.checklist.filter(function (_, i) { return s[i]; }).length; return { k: k, n: n }; }
  P.firmProgress = firmProgress;

  /* ------------------------------------------------------------------ */
  /* Mocks                                                               */
  /* ------------------------------------------------------------------ */
  function recordMock(m) {
    var c = C();
    m.id = m.id || ('m' + Date.now().toString(36));
    m.d = m.d || today(); m.t = m.t || Date.now();
    c.mocks.push(m);
    if (c.mocks.length > 200) c.mocks = c.mocks.slice(-200);
    c.activeMock = null;
    core.markDay(3);
    // mistake log → journal (when the competition coach / journal is loaded)
    var K = window.SBT_COACH;
    if (K && K.addEntry) {
      try {
        var lines = [];
        lines.push('**Score:** ' + m.score + '/' + m.total + ' in ' + Math.round(m.secs / 60) + ' min' + (m.kind === 'stamina' ? ' (stamina: 4 mocks)' : ''));
        if (m.rubric) lines.push('**Rubric:** ' + D.rubric.map(function (r) { return r.t + ' ' + (m.rubric[r.id] || '–') + '/5'; }).join(' · '));
        (m.log || []).forEach(function (x) { if (x.note) lines.push('- ' + (BY_ID[x.id] ? BY_ID[x.id].title : x.id) + ': ' + x.note); });
        if (m.text) lines.push(m.text);
        var e = K.addEntry({ kind: 'superday', text: lines.join('\n\n'), mistakes: (m.mistakes || []).slice(), problemTitle: 'Superday mock' + (m.firm && FIRMS[m.firm] ? ' — ' + FIRMS[m.firm].name : '') + ' (' + m.d + ')', tip: m.tip || '', src: 'prep' });
        m.journalId = e.id;
      } catch (err) { console.warn(err); }
    }
    save();
    return m;
  }
  P.recordMock = recordMock;

  /* ------------------------------------------------------------------ */
  /* Hooks: export/merge, journal (problem + firm notes), boot          */
  /* ------------------------------------------------------------------ */
  core.HOOKS.mergeState.push(function (cur, inc) {
    var ic = inc.prep; if (!core.isPlainObj(ic)) return;
    var cc = cur.prep;
    if (!core.isPlainObj(cc) || !cc._v) { cur.prep = ic; return; }
    if (!cc.setup && ic.setup) { cc.setup = ic.setup; cc.plan = ic.plan; }
    Object.keys(ic.done || {}).forEach(function (k) { if (!cc.done[k]) cc.done[k] = ic.done[k]; });
    var have = {}; (cc.mocks || []).forEach(function (m) { have[m.id] = 1; });
    (ic.mocks || []).forEach(function (m) { if (m && m.id && !have[m.id]) cc.mocks.push(m); });
    cc.mocks.sort(function (a, b) { return (a.t || 0) - (b.t || 0); });
    var hd = {}; (cc.history || []).forEach(function (h) { hd[h.d] = 1; }); (ic.history || []).forEach(function (h) { if (!hd[h.d]) cc.history.push(h); });
    Object.keys(ic.firms || {}).forEach(function (id) {
      var a = cc.firms[id], b = ic.firms[id];
      if (!a) { cc.firms[id] = b; return; }
      Object.keys(b.check || {}).forEach(function (i) { if (!a.check[i]) a.check[i] = b.check[i]; });
      if (b.notes && (b.notes.t || 0) > ((a.notes || {}).t || 0)) a.notes = b.notes;
    });
  });

  function notesList() {
    var S = core.S, out = [];
    Object.keys(S.notes || {}).forEach(function (id) { var n = S.notes[id]; if (n && n.text && n.text.trim()) out.push({ kind: 'problem', id: id, title: BY_ID[id] ? BY_ID[id].title : id, cat: BY_ID[id] ? BY_ID[id].cat : '', text: n.text, t: n.t || 0 }); });
    var c = C();
    Object.keys(c.firms || {}).forEach(function (id) { var n = (c.firms[id] || {}).notes; if (n && n.text && n.text.trim()) out.push({ kind: 'firm', id: id, title: FIRMS[id] ? FIRMS[id].name : id, text: n.text, t: n.t || 0 }); });
    return out.sort(function (a, b) { return b.t - a.t; });
  }
  P.notesList = notesList;
  function notesMarkdown() {
    var list = notesList();
    if (!list.length) return '';
    var pn = list.filter(function (n) { return n.kind === 'problem'; }), fn = list.filter(function (n) { return n.kind === 'firm'; });
    var md = '\n\n---\n\n# Problem notes\n\n' + (pn.length ? pn.map(function (n) { return '## ' + n.title + ' (' + n.id + ', ' + core.catName(n.cat) + ')\n\n' + n.text.trim() + '\n'; }).join('\n') : '_None._\n');
    md += '\n# Firm notes\n\n' + (fn.length ? fn.map(function (n) { return '## ' + n.title + '\n\n' + n.text.trim() + '\n'; }).join('\n') : '_None._\n');
    return md;
  }
  P.notesMarkdown = notesMarkdown;

  core.HOOKS.boot.push(function () {
    try { refresh(); } catch (e) { console.warn(e); }
    var K = window.SBT_COACH;
    if (K) {
      if (K.KIND_NAME && !K.KIND_NAME.superday) K.KIND_NAME.superday = 'Superday mock log';
      // journal exports include problem + firm notes
      if (K.journalMarkdown && !K.journalMarkdown._prep) {
        var jm = K.journalMarkdown;
        K.journalMarkdown = function (entries) { return jm(entries) + notesMarkdown(); };
        K.journalMarkdown._prep = true;
      }
      if (K.journalZip && K.makeZip && !K.journalZip._prep) {
        K.journalZip = function () {
          var files = K.J.entries.slice().sort(function (a, b) { return a.t - b.t; }).map(function (e) { return { name: 'stat-brainteaser-journal/' + K.entryFileName(e), data: K.entryToMd(e) }; });
          notesList().forEach(function (n) {
            var slug = String(n.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || n.id;
            files.push({ name: 'stat-brainteaser-journal/' + (n.kind === 'firm' ? 'firm-notes/' : 'problem-notes/') + slug + '.md',
              data: '---\nkind: ' + n.kind + '-note\n' + (n.kind === 'problem' ? 'problem: "' + n.id + '"\ntopic: ' + n.cat + '\n' : 'firm: ' + n.id + '\n') + 'tags: [stat-brainteaser, ' + n.kind + '-note]\n---\n# ' + n.title + '\n\n' + n.text.trim() + '\n' });
          });
          files.push({ name: 'stat-brainteaser-journal/README.md', data: '# Stat Brainteaser journal\n\nOne note per entry with YAML front-matter (date, kind, problem, nodes, competition, season, tags), plus problem-notes/ and firm-notes/. Drop this folder into your Obsidian vault.\n' });
          return K.makeZip(files);
        };
        K.journalZip._prep = true;
      }
    }
  });
});
