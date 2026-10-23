/* Stat Brainteaser — competition coach views: Competitions hub, setup wizard, diagnostic, plan,
 * skill tree, lessons, competition problems with self-grading + guided reflection, mocks,
 * post-competition review, multi-year progress, journal, tips, "More" page. */
(window.SBT_PLUGINS = window.SBT_PLUGINS || []).push(function (core) {
  'use strict';
  var K = window.SBT_COACH;
  if (!K) return;
  var esc = core.esc, $ = core.$, $all = core.$all, ICONS = core.ICONS, svg = core.svg;
  var VIEWS = core.VIEWS;
  var C = K.C, NODES = K.NODES, CP = K.CP, COMPS = K.COMPS, MOCKS = K.MOCKS, PL = K.PL;
  function today() { return core.today(); }

  core.TAB_OF.comp = 'comp'; core.TAB_OF.journal = 'journal'; core.TAB_OF.more = 'more';
  core.TITLES.comp = 'Competitions'; core.TITLES.journal = 'Journal'; core.TITLES.more = 'More';

  ICONS.trophy = svg('<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>');
  ICONS.journal = svg('<path d="M5 3h12a2 2 0 0 1 2 2v16H7a2 2 0 0 1-2-2z"/><path d="M5 19a2 2 0 0 1 2-2h12M9 7h6M9 11h6"/>');
  ICONS.tree = svg('<circle cx="12" cy="5" r="2"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="19" r="2"/><circle cx="12" cy="12" r="2"/><path d="M12 7v3M10.6 13.4 7.4 17.6M13.4 13.4l3.2 4.2"/>');
  ICONS.calendar = svg('<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M8 2v4M16 2v4"/>');
  ICONS.flag = svg('<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>');
  ICONS.pin = svg('<path d="M12 17v5M9 3h6l-1 5 4 4H6l4-4z"/>');
  ICONS.timer = svg('<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/>');
  ICONS.lock = svg('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>');
  ICONS.more = svg('<circle cx="5" cy="12" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="19" cy="12" r="1.6" fill="currentColor"/>');
  ICONS.link = svg('<path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/>');
  ICONS.edit = svg('<path d="M4 20h4L19 9l-4-4L4 16z"/>');

  var GROUP_SHORT = { 'Heuristics & proof': 'Heuristics', 'Algebra': 'Algebra', 'Number theory': 'Number theory', 'Combinatorics': 'Combinatorics', 'Probability': 'Probability', 'Analysis': 'Analysis', 'Linear algebra': 'Linear algebra', 'Geometry': 'Geometry' };
  var PHASE_NAME = { foundations: 'Foundations', toolbox: 'Toolbox', mixed: 'Mixed', competition: 'Competition', taper: 'Taper' };
  var RUBRIC = [
    { g: 0, t: 'No progress', d: 'Nothing a grader could credit yet.' },
    { g: 1, t: 'Key idea', d: 'Found the right idea, but the argument is incomplete.' },
    { g: 2, t: 'Mostly complete', d: 'Essentially done; a small gap or unchecked case.' },
    { g: 3, t: 'Complete & rigorous', d: 'A grader would give full marks.' }
  ];
  var APPROACHES = ['Small cases', 'Induction', 'Contradiction', 'Invariant / parity', 'Pigeonhole', 'Extremal', 'Symmetry', 'Algebraic manipulation', 'Bounding / inequality', 'Construction', 'Counting two ways', 'Generating function', 'Calculus / analysis', 'Linear algebra'];
  var MISTAKES = ['Algebra slip', 'Wrong idea', 'Missed case', 'Ran out of time', 'Didn’t know the technique', 'Misread the problem', 'Incomplete write-up', 'Gave up too early'];

  /* ------------------------------------------------------------------ */
  /* Small helpers                                                       */
  /* ------------------------------------------------------------------ */
  function qp(arg) {
    var out = {}, i = (arg || '').indexOf('?');
    if (i < 0) return out;
    arg.slice(i + 1).split('&').forEach(function (kv) { var p = kv.split('='); if (p[0]) out[p[0]] = decodeURIComponent((p[1] || '').replace(/\+/g, ' ')); });
    return out;
  }
  function base(arg) { var i = (arg || '').indexOf('?'); return i < 0 ? (arg || '') : arg.slice(0, i); }
  function argsQuery(args) { return qp((args || []).join('/')); }
  function fmtD(d, opts) { return core.parseYmd(d).toLocaleDateString(undefined, opts || { weekday: 'short', month: 'short', day: 'numeric' }); }
  function inDays(d) {
    var n = K.daysBetween(today(), d);
    return n < 0 ? (n === -1 ? 'yesterday' : -n + ' days ago') : n === 0 ? 'today' : n === 1 ? 'tomorrow' : 'in ' + n + ' days';
  }
  function dots(m) { var s = K.stars(m), h = '<span class="mdots" role="img" aria-label="Mastery ' + s + ' of 5">'; for (var i = 1; i <= 5; i++) h += '<i class="' + (i <= s ? 'on' : '') + '"></i>'; return h + '</span>'; }
  function lvl(l) { return '<span class="badge lvl">L' + l + '</span>'; }
  function nodeName(id) { return NODES[id] ? NODES[id].name : id; }
  function ext(url, label) { return url ? '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + (label || esc(url)) + ' ' + ICONS.link + '</a>' : esc(label || ''); }
  function seg(name, opts, cur) {
    return '<div class="seg" role="group" aria-label="' + esc(name) + '">' + opts.map(function (o) {
      return '<button type="button" data-v="' + esc(o[0]) + '" aria-pressed="' + (String(cur) === String(o[0])) + '">' + esc(o[1]) + '</button>';
    }).join('') + '</div>';
  }
  function bindSeg(root, sel, fn) { $all(sel + ' [data-v]', root).forEach(function (b) { b.addEventListener('click', function () { $all(sel + ' [data-v]', root).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); fn(b.getAttribute('data-v'), b); }); }); }
  function chips(name, opts, sel) {
    return '<div class="chips" role="group" aria-label="' + esc(name) + '">' + opts.map(function (o) {
      var v = Array.isArray(o) ? o[0] : o, l = Array.isArray(o) ? o[1] : o;
      return '<button type="button" class="chip" data-c="' + esc(v) + '" aria-pressed="' + (sel.indexOf(v) >= 0) + '">' + esc(l) + '</button>';
    }).join('') + '</div>';
  }
  function bindChips(root, sel, arr) { $all(sel + ' [data-c]', root).forEach(function (b) { b.addEventListener('click', function () { var v = b.getAttribute('data-c'), i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else arr.push(v); b.setAttribute('aria-pressed', String(i < 0)); }); }); }
  function subHead(title, desc, back, backLabel) {
    return '<div class="page-head"><div>' + (back ? '<a class="back-link" href="' + back + '">' + ICONS.left + ' ' + esc(backLabel || 'Back') + '</a>' : '') + '<h1>' + title + '</h1>' + (desc ? '<p class="muted">' + desc + '</p>' : '') + '</div></div>';
  }
  function compShort(id) { return K.shortName(id); }
  function nextTargets() {
    var s = K.season(), t = today();
    return ['qumc', 'putnam'].map(function (id) { return { id: id, date: s.dates[id] }; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
  }

  /* Task → action link */
  function taskHref(t) {
    switch (t.type) {
      case 'prob': return '#comp/p/' + t.ref + '?src=plan' + (t.blind ? '&blind=1' : '');
      case 'retry': return '#comp/p/' + t.ref + '?src=plan&retry=1';
      case 'lesson': case 'flash': return '#comp/node/' + t.ref;
      case 'mock': return '#comp/mock/' + t.ref;
      case 'mockreview': return '#comp/mock/' + t.ref;
      case 'diag': return '#comp/diag';
      case 'reg': case 'logistics': case 'beforestart': return '#comp/c/' + t.ref;
      case 'review': return '#comp/review/' + t.ref;
      case 'journal': return '#journal/new?kind=session';
      case 'compday': return '#journal/new?kind=compday&comp=' + t.ref;
      case 'tips': return '#journal/tips';
      case 'ref': return '#comp/node/' + (t.node || '');
      case 'official': return 'https://kskedlaya.org/putnam-archive/' + t.ref + '.pdf';
      default: return '';
    }
  }
  function taskRow(t, day, opts) {
    opts = opts || {};
    var done = K.isDone(t, day);
    var href = taskHref(t);
    var external = /^https?:/.test(href);
    return '<li class="task' + (done ? ' done' : '') + '"><button type="button" class="tick" data-tick="' + esc(t.k) + '" aria-pressed="' + done + '" aria-label="' + (done ? 'Mark not done' : 'Mark done') + ': ' + esc(t.label) + '">' + (done ? ICONS.check : '') + '</button>' +
      '<span class="tl">' + esc(t.label) + (t.min ? ' <span class="muted small">· ' + K.fmtMin(t.min) + '</span>' : '') + '</span>' +
      (href && !opts.noGo ? '<a class="btn sm' + (done ? ' ghost' : '') + '" href="' + esc(href) + '"' + (external ? ' target="_blank" rel="noopener"' : '') + '>' + (done ? 'Open' : 'Go') + '</a>' : '') + '</li>';
  }
  function bindTicks(root, rerender) {
    $all('[data-tick]', root).forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-tick');
        var now = b.getAttribute('aria-pressed') === 'true';
        K.toggleDone(k, !now);
        if (now && C().done[k] === undefined) { /* computed-done tasks stay done */ }
        rerender();
      });
    });
  }
  function dayCard(day, title) {
    if (!day) return '';
    var tplName = day.tpl && K.TPL[day.tpl] ? K.TPL[day.tpl].name : day.tpl === 'diagnostic' ? 'Placement diagnostic' : day.tpl === 'review' ? 'Review day' : '';
    var doneN = day.tasks.filter(function (t) { return K.isDone(t, day); }).length;
    var head = day.event ? '<span class="phase ev">' + ICONS.trophy + ' ' + esc(COMPS[day.target] ? compShort(day.target) : '') + ' day</span>' :
      day.rest ? '<span class="phase rest">Rest day</span>' : '<span class="phase ph-' + day.phase + '">' + PHASE_NAME[day.phase] + '</span>';
    return '<div class="card today-card" data-day="' + day.d + '"><div class="row"><h2 style="margin:0">' + esc(title || fmtD(day.d)) + '</h2>' + head +
      '<span class="spacer"></span>' + (day.tasks.length ? '<span class="muted small">' + doneN + '/' + day.tasks.length + ' done</span>' : '') + '</div>' +
      (tplName && !day.rest ? '<p class="muted small" style="margin:.3rem 0 .6rem">' + esc(tplName) + (day.minutes ? ' · about ' + K.fmtMin(day.minutes) : '') + (day.node ? ' · focus: <a href="#comp/node/' + day.node + '">' + esc(nodeName(day.node)) + '</a>' : '') + '</p>' : '') +
      (day.tasks.length ? '<ul class="tasks">' + day.tasks.map(function (t) { return taskRow(t, day); }).join('') + '</ul>' :
        '<p class="muted" style="margin:.5rem 0 0">' + (day.rest ? 'Nothing scheduled. Optional: flash-review one lesson card, or rest — recovery is part of the plan.' : 'Nothing scheduled.') + '</p>') +
      '</div>';
  }
  function changesCard(n, noLink) {
    var ch = C().changes.slice(0, n || 4);
    if (!ch.length) return '';
    return '<div class="card"><div class="row"><h2 style="margin:0">What changed and why</h2><span class="spacer"></span>' + (noLink ? '' : '<a class="small" href="#comp/plan">Full plan</a>') + '</div><ul class="changes">' +
      ch.map(function (c) { return '<li><span class="cdate">' + esc(fmtD(c.d, { month: 'short', day: 'numeric' })) + '</span><span>' + esc(c.msg) + '</span></li>'; }).join('') + '</ul></div>';
  }
  function flagsNotice() {
    var f = C().flags, t = today(), out = [];
    if (f.stuckUntil >= t) out.push('Hints unlock after 15 minutes (until ' + fmtD(f.stuckUntil) + ').');
    if (f.writeupUntil >= t) out.push('Write-up week: write every solved problem in full (until ' + fmtD(f.writeupUntil) + ').');
    if (f.lightUntil >= t) out.push('Lighter week: sessions are 30% shorter (until ' + fmtD(f.lightUntil) + ').');
    return out.length ? '<div class="banner"><p>' + out.map(esc).join('<br>') + '</p></div>' : '';
  }
  function pastNotes(nodes, pid, title) {
    var es = K.resurface(nodes, pid, 3);
    if (!es.length) return '';
    return '<div class="card notes-card"><h3>' + ICONS.journal + ' ' + esc(title || 'Your past notes') + '</h3><ul class="notes">' + es.map(function (e) {
      var line = e.tip || e.insight || e.text || e.stuck || '';
      return '<li><a href="#journal/e/' + e.id + '"><span class="cdate">' + esc(fmtD(e.date, { month: 'short', year: 'numeric' })) + '</span>' + (e.pinned ? ICONS.pin : '') +
        '<span>' + (e.tip ? '<b>Tip:</b> ' : '') + esc(line.slice(0, 180)) + (line.length > 180 ? '…' : '') + '</span></a></li>';
    }).join('') + '</ul></div>';
  }
  function readBeforeCard(compId) {
    var tips = K.pinnedTips().slice(0, 5);
    var mist = {};
    K.J.entries.slice(-30).forEach(function (e) { (e.mistakes || []).forEach(function (m) { mist[m] = (mist[m] || 0) + 1; }); });
    var top = Object.keys(mist).sort(function (a, b) { return mist[b] - mist[a]; }).slice(0, 3);
    var strat = compId && COMPS[compId] ? COMPS[compId].dayOfStrategy : [];
    return '<div class="card rbs"><h2>' + ICONS.pin + ' Read before you start</h2>' +
      (tips.length ? '<ul class="notes">' + tips.map(function (e) { return '<li><span>' + esc(e.tip || e.text) + '</span></li>'; }).join('') + '</ul>' : '<p class="muted small">Pin tips in your journal and they will appear here before every mock and contest.</p>') +
      (top.length ? '<p class="small"><b>Your most frequent mistakes lately:</b> ' + top.map(esc).join(' · ') + '</p>' : '') +
      (strat.length ? '<details class="reveal"><summary>' + ICONS.flag + '<span>Day-of strategy</span><span class="chev" aria-hidden="true">▾</span></summary><div class="rbody"><ul>' + strat.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div></details>' : '') + '</div>';
  }

  /* ------------------------------------------------------------------ */
  /* Home + settings integration                                         */
  /* ------------------------------------------------------------------ */
  core.HOOKS.homeCards.push(function () {
    var c = C(), tg = nextTargets().filter(function (x) { return x.date >= today(); });
    var cd = tg.map(function (x) { return '<span class="cdchip"><b>' + compShort(x.id) + '</b> ' + esc(inDays(x.date)) + '</span>'; }).join('');
    var html;
    // v2.1 calm Home: compact card — title + one quiet button on one line, countdowns as a muted line below.
    if (!c.setup) {
      html = '<div class="card comp-home home-card"><div class="hc-head"><b class="hc-t">Competition prep</b><a class="btn sm" href="#comp/setup">Build plan</a></div>' +
        (cd ? '<p class="hc-sub">' + cd + '</p>' : '') + '</div>';
    } else {
      var day = K.todayDay();
      var tasks = day ? day.tasks : [];
      var left = tasks.filter(function (t) { return !K.isDone(t, day); });
      html = '<div class="card comp-home home-card"><div class="hc-head"><b class="hc-t">Today’s competition plan</b><a class="btn sm" href="#comp">Open</a></div>' +
        (cd ? '<p class="hc-sub">' + cd + '</p>' : '') +
        (day && tasks.length ? '<ul class="tasks compact">' + tasks.slice(0, 4).map(function (t) { return taskRow(t, day); }).join('') + '</ul>' + (left.length ? '' : '<p class="small res-ok" style="margin:.4rem 0 0">All done for today.</p>')
          : '<p class="muted small" style="margin:.5rem 0 0">' + (day && day.rest ? 'Rest day — nothing scheduled.' : 'No tasks today.') + '</p>') + '</div>';
    }
    if (c.settings.mixInDaily) {
      var pid = problemOfTheDay();
      if (pid) html += '<div class="banner"><p><b>Competition problem of the day:</b> ' + esc(CP[pid].title) + ' (L' + CP[pid].level + ', ' + esc(nodeName(CP[pid].nodes[0])) + ')</p><a class="btn sm primary" href="#comp/p/' + pid + '?src=home">Solve</a></div>';
    }
    return html;
  });
  core.HOOKS.homeAfter.push(function (main) { bindTicks(main, function () { core.route(); }); });
  function problemOfTheDay() {
    var pool = K.CP_LIST.filter(function (p) { return K.probStatus(p.id) !== 'solved' && !K.reservedBlocked(p) && p.level <= Math.max(2, K.tlOf(p.nodes[0])); });
    if (!pool.length) return null;
    var h = 0, s = today(); for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return pool[h % pool.length].id;
  }
  core.HOOKS.settingsCards.push(function () {
    var c = C(), u = K.storageUsage();
    return '<div class="card stack"><h2>Competition coach</h2>' +
      '<label class="switch"><input type="checkbox" id="setMix"' + (c.settings.mixInDaily ? ' checked' : '') + '><span class="track" aria-hidden="true"></span><span><b>Competition problem of the day on Home</b><br><span class="muted small">Off by default, so competition problems never mix into your quant Daily mix.</span></span></label>' +
      '<label class="switch"><input type="checkbox" id="setReflect"' + (c.settings.reflectQuant ? ' checked' : '') + '><span class="track" aria-hidden="true"></span><span><b>Offer a reflection after quant problems</b><br><span class="muted small">Adds an “Add a reflection” button after you grade a quant problem.</span></span></label>' +
      '<p class="small" style="margin:0">Storage used: <b>' + Math.round(u.chars / 1024) + ' K</b> of ~5 M characters' + (u.near ? ' — <b class="res-bad">getting full: export your journal</b>' : '') + '. Journal entries: ' + K.J.entries.length + '.</p>' +
      '<div class="row"><a class="btn" href="#journal">Journal &amp; export</a><button class="btn danger" type="button" id="resetComp">Reset competition data</button></div></div>';
  });
  core.HOOKS.settingsAfter.push(function (main) {
    var m = $('#setMix', main); if (!m) return;
    m.addEventListener('change', function () { C().settings.mixInDaily = m.checked; core.save(); });
    $('#setReflect', main).addEventListener('change', function (e) { C().settings.reflectQuant = e.target.checked; core.save(); });
    $('#resetComp', main).addEventListener('click', function () {
      if (!confirm('Reset the competition coach (plan, mastery, attempts, mocks, seasons)? Your journal is kept.')) return;
      core.S.comp = {}; C(); core.save(); core.toast('Competition data reset.'); core.route();
    });
  });

  /* ------------------------------------------------------------------ */
  /* More page (mobile)                                                  */
  /* ------------------------------------------------------------------ */
  VIEWS.more = function (main) {
    var due = 0; try { due = +($('[data-due-badge]') || {}).textContent || 0; } catch (e) { }
    function item(href, icon, title, desc, badge) {
      return '<a class="mode-card" href="' + href + '"><span class="ic">' + ICONS[icon] + '</span><span><b>' + esc(title) + (badge ? ' <span class="tab-badge inline">' + badge + '</span>' : '') + '</b><small>' + esc(desc) + '</small></span></a>';
    }
    main.innerHTML = '<div class="page-head"><div><h1>More</h1></div></div><div class="more-list">' +
      item('#review', 'review', 'Review', 'Spaced repetition for quant problems', due || '') +
      item('#journal', 'journal', 'Journal', 'Reflections, tips to future me, export to Obsidian') +
      item('#journal/tips', 'pin', 'Tips library', 'Everything you told your future self') +
      item('#stats', 'stats', 'Stats', 'Accuracy, streaks, sprint trend') +
      item('#comp/progress', 'trophy', 'Multi-year progress', 'Seasons, goals and results') +
      item('#settings', 'gear', 'Settings', 'Theme, export/import, updates, notifications') + '</div>';
  };

  /* ------------------------------------------------------------------ */
  /* Competitions router                                                 */
  /* ------------------------------------------------------------------ */
  VIEWS.comp = function (main, args) {
    K.ensureSeason();
    K.refresh();
    var sub = base(args[0] || '');
    var q = argsQuery(args);
    var id = base(args[1] || '');
    var r = SUB[sub] || SUB[''];
    r(main, id, q);
  };
  var SUB = {};

  /* Overview */
  SUB[''] = function (main) {
    var c = C(), s = K.season(), t = today();
    var html = '<div class="page-head"><div><p class="eyebrow">Season ' + esc(s.label) + ' · year ' + s.yearOfCompeting + ' of competing</p><h1>Competitions</h1>' +
      '<p class="muted">QUMC and Putnam prep: a day-by-day plan that adapts to how you do.</p></div>' +
      '<div class="row"><a class="btn" href="#comp/plan">' + ICONS.calendar + ' Plan</a><a class="btn" href="#comp/setup">' + ICONS.edit + ' Setup</a></div></div>';
    if (c.activeMock && MOCKS[c.activeMock.id]) html += '<div class="banner"><p><b>Mock in progress:</b> ' + esc(MOCKS[c.activeMock.id].name) + '</p><a class="btn sm primary" href="#comp/mock/' + c.activeMock.id + '">Resume</a></div>';
    if (c.setup && c.setup.needsReview) html += '<div class="banner"><p><b>New season.</b> Review your setup (targets, hours, dates) to build this season’s plan.</p><a class="btn sm primary" href="#comp/setup">Review setup</a></div>';
    // countdown cards
    html += '<div class="cd-grid">' + nextTargets().map(function (x) {
      var comp = COMPS[x.id], n = K.daysBetween(t, x.date), reg = K.registered(x.id);
      var targeted = c.setup && c.setup.targets.indexOf(x.id) >= 0;
      return '<a class="card cd-card" href="#comp/c/' + x.id + '"><div class="row"><b>' + compShort(x.id) + '</b>' + (targeted ? '<span class="badge">target</span>' : '') + '<span class="spacer"></span>' +
        (n >= 0 ? (reg ? '<span class="badge ok">registered</span>' : '<span class="badge warn">not registered</span>') : '') + '</div>' +
        '<div class="cd-num">' + (n > 0 ? n + '<small> days</small>' : n === 0 ? 'Today' : 'Done') + '</div>' +
        '<div class="muted small">' + esc(fmtD(x.date, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })) + '</div></a>';
    }).join('') + '</div>';
    if (!c.setup) {
      html += '<div class="card hero-card"><div class="hero-text"><h2>Build your plan</h2><p class="muted">Tell the coach your target(s), hours per week and background. Optional 90-minute placement test. You get a day-by-day plan to contest day that re-flows when life happens.</p></div>' +
        '<div class="hero-actions"><a class="btn primary lg" href="#comp/setup">' + ICONS.play + '<span><b>Start setup</b><small>About 2 minutes</small></span></a></div></div>';
    } else {
      html += flagsNotice();
      var day = K.todayDay();
      if (day && day.event) html += readBeforeCard(day.target);
      html += day ? dayCard(day, 'Today') : '<div class="card"><h2>Today</h2><p class="muted">' + (c.plan && c.plan.days.length ? 'Nothing planned today.' : 'No upcoming target this season. ') + '</p>' + (K.nextStudyDay() ? '' : '<a class="btn" href="#comp/setup">Update setup</a>') + '</div>';
      if (day && day.rest && K.nextStudyDay()) html += '<p class="muted small">Next session: ' + esc(fmtD(K.nextStudyDay().d)) + '.</p>';
    }
    // review CTAs
    ['qumc', 'putnam'].forEach(function (id) {
      if (s.dates[id] < t && !s.reviewDone[id] && K.daysBetween(s.dates[id], t) <= 30) html += '<div class="banner"><p><b>' + compShort(id) + ' is over.</b> A 20-minute post-competition review turns it into next season’s plan.</p><a class="btn sm primary" href="#comp/review/' + id + '">Review</a></div>';
    });
    if (K.seasonOver()) html += '<div class="banner"><p><b>Season ' + esc(s.label) + ' is complete.</b> Start the next season now to plan for next year’s dates (it also starts automatically).</p><button class="btn sm primary" type="button" id="nextSeason">Start next season</button></div>';
    // daily reflection prompt
    var wrote = K.J.entries.some(function (e) { return e.date === t; });
    if (c.setup && !wrote && c.settings.dailyPromptDismissed !== t) html += '<div class="banner"><p><b>Daily reflection:</b> one thing you learned today, one thing for tomorrow. 60 seconds.</p><div class="row"><a class="btn sm primary" href="#journal/new?kind=daily">Write</a><button class="btn sm ghost" type="button" id="dismissDaily">Not today</button></div></div>';
    html += changesCard(3);
    html += '<div class="mode-grid">' +
      quick('#comp/tree', 'tree', 'Skill tree', '40 techniques with mastery') +
      quick('#comp/bank', 'practice', 'Problem bank', K.CP_LIST.length + ' competition problems') +
      quick('#comp/mocks', 'timer', 'Mock exams', 'Timed QUMC & Putnam-style papers') +
      quick('#journal', 'journal', 'Journal', K.J.entries.length + ' entries') +
      quick('#journal/tips', 'pin', 'Tips library', 'Notes to future you') +
      quick('#comp/progress', 'trophy', 'Multi-year progress', 'Year ' + s.yearOfCompeting + ' goals & seasons') + '</div>';
    main.innerHTML = html;
    bindTicks(main, function () { core.route(); });
    var ns = $('#nextSeason'); if (ns) ns.addEventListener('click', function () { if (confirm('Archive season ' + s.label + ' and start the next one?')) { K.startNextSeason(); core.route(); } });
    var dd = $('#dismissDaily'); if (dd) dd.addEventListener('click', function () { C().settings.dailyPromptDismissed = t; core.save(); core.route(); });
  };
  function quick(href, icon, title, desc) { return '<a class="mode-card" href="' + href + '"><span class="ic">' + ICONS[icon] + '</span><span><b>' + esc(title) + '</b><small>' + esc(desc) + '</small></span></a>'; }

  /* Competition detail */
  SUB.c = function (main, id) {
    var comp = COMPS[id];
    if (!comp) { core.go('#comp', true); return; }
    var s = K.season(), t = today(), d = s.dates[id], n = K.daysBetween(t, d);
    var yoc = s.yearOfCompeting, yk = K.yearKey(yoc);
    var f = comp.format;
    var ck = K.CHECKLISTS[id] || [];
    var weights = comp.topicWeights.weights;
    var maxW = Math.max.apply(null, Object.keys(weights).map(function (k) { return weights[k]; }));
    var res = comp.recommendedResources.slice().sort(function (a, b) { return a.priority - b.priority; });
    var html = subHead(esc(comp.name), esc(comp.organizer), '#comp', 'Competitions');
    if (n >= 0 && n <= 1) html += readBeforeCard(id);
    html += '<div class="detail-grid"><div>' +
      '<div class="card cd-hero"><div class="cd-num">' + (n > 0 ? n + '<small> days</small>' : n === 0 ? 'Today' : 'Done') + '</div>' +
      '<p style="margin:.2rem 0"><b>' + esc(fmtD(d, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })) + '</b>' +
      (id === 'qumc' && s.year === 2026 ? ' · ' + esc(comp.date2026.start) + '–' + esc(comp.date2026.end) : '') +
      (id === 'putnam' ? ' · sessions (Eastern): ' + (comp.date2026.sessionsEastern || []).map(function (x) { return x.join('–'); }).join(', ') : '') + '</p>' +
      '<p class="muted small">' + (id === 'qumc' ? esc(comp.dateRule) + (s.dateEdited.qumc ? ' (date set by you)' : s.year === 2026 ? ' Verified: ' + esc(comp.date2026.verified) + '.' : ' This year’s date is an estimate until ISM announces it — edit it below.') : esc(comp.dateRule) + ' Times as published for Eastern sites — confirm with your local supervisor.') + '</p>' +
      '<div class="row"><label class="small" for="cdate">Contest date</label><input type="date" id="cdate" value="' + esc(d) + '" style="max-width:190px"><button class="btn sm ghost" type="button" id="cdateReset">Reset</button></div></div>' +
      '<div class="card"><h2>Registration</h2><ul class="tasks">' + ck.map(function (it) {
        var on = !!(s.checklist[id] || {})[it.id];
        return '<li class="task' + (on ? ' done' : '') + '"><button type="button" class="tick" data-ck="' + it.id + '" aria-pressed="' + on + '" aria-label="' + esc(it.label) + '">' + (on ? ICONS.check : '') + '</button><span class="tl">' + esc(it.label) + '</span></li>';
      }).join('') + '</ul><details class="reveal"><summary>' + ICONS.book + '<span>How to register</span><span class="chev" aria-hidden="true">▾</span></summary><div class="rbody"><ul>' + comp.registration.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
      (comp.location2026 ? '<p class="small">' + esc(comp.location2026) + '</p>' : '') + '<p class="small muted">Facts can change — confirm with your local representative / supervisor.</p></div></details></div>' +
      '<div class="card"><h2>Your goals · year ' + yoc + '</h2><p>' + esc(comp.goalsByYear[yk] || '') + '</p>' +
      '<p class="muted small" style="margin:0">Next year: ' + esc(comp.goalsByYear[K.yearKey(yoc + 1)] || '') + '</p></div>' +
      '<div class="card"><h2>Day-of strategy</h2><ul>' + comp.dayOfStrategy.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' +
      '</div><div>' +
      '<div class="card"><h2>Format</h2><dl class="about">' +
      '<dt>Duration</dt><dd>' + (f.sessions > 1 ? f.sessions + ' × ' + f.sessionMinutes + ' min' : K.fmtMin(f.durationMinutes)) + '</dd>' +
      '<dt>Problems</dt><dd>' + (f.problems ? f.problems + (f.pointsPerProblem ? ' × ' + f.pointsPerProblem + ' pts (max ' + f.maxScore + ')' : '') : 'Not published') + '</dd>' +
      '<dt>Aids</dt><dd>' + esc(f.aids || '') + '</dd></dl>' +
      (f.change2026 ? '<p class="small"><b>2026 change:</b> ' + esc(f.change2026) + '</p>' : '') + (f.problemsNote ? '<p class="small muted">' + esc(f.problemsNote) + '</p>' : '') +
      (f.style ? '<p class="small">' + esc(f.style) + '</p>' : '') + '</div>' +
      '<div class="card"><h2>Scoring</h2><p class="small">' + esc(typeof comp.scoring === 'string' ? comp.scoring : comp.scoring.summary) + '</p>' +
      (comp.scoring.recognition ? '<p class="small muted">' + esc(comp.scoring.recognition) + '</p>' : '') + '</div>' +
      '<div class="card"><h2>Topic weights</h2><p class="muted small">' + esc(comp.topicWeights.note) + '</p>' + Object.keys(weights).sort(function (a, b) { return weights[b] - weights[a]; }).map(function (g) {
        return '<div class="bar-row"><span class="bn">' + esc(GROUP_SHORT[g] || g) + '</span><div class="bar"><div style="width:' + (weights[g] / maxW * 100) + '%"></div></div><span class="pct">' + Math.round(weights[g] * 100) + '%</span></div>';
      }).join('') + '</div>' +
      '<div class="card"><h2>Past papers</h2><p class="small">' + (comp.pastPapers.available ? 'Available: ' + esc(comp.pastPapers.years || '') + ' — ' + ext(comp.pastPapers.url, 'Kedlaya archive') : esc(comp.pastPapers.note)) + '</p>' +
      (id === 'putnam' ? '<a class="btn sm" href="#comp/mocks">Recommended official papers</a>' : '') + '</div>' +
      '<div class="card"><h2>Resources</h2><ul class="res">' + res.filter(function (r) { return (r.for || []).indexOf(id) >= 0; }).map(function (r) {
        return '<li><b>' + (r.link ? ext(r.link, esc(r.title)) : esc(r.title)) + '</b> <span class="muted small">· ' + esc(r.author) + ' · ' + esc(r.cost) + '</span><br><span class="small">' + esc(r.why) + '</span></li>';
      }).join('') + '</ul></div>' +
      '<div class="card"><h2>Official links</h2><ul>' + comp.officialLinks.map(function (l) { return '<li>' + ext(l.url, esc(l.label)) + '</li>'; }).join('') + '</ul></div>' +
      '</div></div>';
    main.innerHTML = html;
    $all('[data-ck]', main).forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-ck'); var cl = s.checklist[id] = s.checklist[id] || {};
        cl[k] = !cl[k]; if (!cl[k]) delete cl[k];
        core.save(); SUB.c(main, id);
      });
    });
    $('#cdate').addEventListener('change', function (e) { if (/^\d{4}-\d{2}-\d{2}$/.test(e.target.value)) { K.setCompDate(id, e.target.value); core.toast('Date updated — plan re-flowed.'); SUB.c(main, id); } });
    $('#cdateReset').addEventListener('click', function () { s.dates[id] = id === 'putnam' ? K.putnamDate(s.year) : K.qumcDefault(s.year); delete s.dateEdited[id]; core.save(); if (C().plan) K.replan('date'); SUB.c(main, id); });
  };

  /* Setup wizard */
  SUB.setup = function (main) {
    var c = C(), s = K.season(), prev = c.setup || {};
    var st = {
      targets: (prev.targets || ['qumc', 'putnam']).filter(function (id) { return s.dates[id] >= today(); }),
      hours: prev.hours || 6, days: (prev.days || [1, 1, 1, 1, 1, 1, 1]).slice(),
      background: JSON.parse(JSON.stringify(prev.background || { proofs: 'some', courses: [] })),
      wantDiag: prev.wantDiag != null ? prev.wantDiag : true, yearOfCompeting: s.yearOfCompeting || 1, diagNow: false
    };
    if (!st.background.courses) st.background.courses = [];
    var step = 0;
    var DAYN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    function render() {
      var steps = ['Targets', 'Time', 'Background', 'Placement'];
      var html = subHead('Plan setup', 'Step ' + (step + 1) + ' of 4 · ' + steps[step], '#comp', 'Competitions') +
        '<div class="wiz-dots" aria-hidden="true">' + steps.map(function (_, i) { return '<i class="' + (i <= step ? 'on' : '') + '"></i>'; }).join('') + '</div><div class="card stack wiz">';
      if (s.fromLast && step === 0) html += '<div class="banner"><p><b>From last season’s review:</b> ' + esc(s.fromLast) + '</p></div>';
      if (step === 0) {
        html += '<h2>Which competitions are you preparing for?</h2>' + ['qumc', 'putnam'].map(function (id) {
          var d = s.dates[id], past = d < today();
          return '<label class="switch"><input type="checkbox" data-tg="' + id + '"' + (st.targets.indexOf(id) >= 0 ? ' checked' : '') + (past ? ' disabled' : '') + '><span class="track" aria-hidden="true"></span><span><b>' + esc(COMPS[id].name) + '</b><br><span class="muted small">' + esc(fmtD(d, { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })) + ' · ' + (past ? 'already passed this season' : esc(inDays(d))) + '</span></span></label>' +
            (id === 'qumc' && !past ? '<div class="row" style="padding-left:56px"><label class="small" for="qd">QUMC date</label><input type="date" id="qd" value="' + esc(d) + '" style="max-width:190px"></div>' : '');
        }).join('') + '<p class="muted small">The Putnam is always the first Saturday of December. ISM announces the QUMC date each year — edit it if it differs.</p>';
      } else if (step === 1) {
        html += '<h2>How much time do you have?</h2><div class="frow"><span class="label">Hours per week</span>' +
          seg('Hours per week', [[2, '2'], [3, '3'], [4, '4'], [5, '5'], [6, '6'], [8, '8'], [10, '10'], [12, '12']], st.hours).replace('class="seg"', 'class="seg" id="hrs"') + '</div>' +
          '<div class="frow"><span class="label">Days you can study</span><div class="chips" id="days">' + DAYN.map(function (n, i) { return '<button type="button" class="chip" data-day="' + i + '" aria-pressed="' + !!st.days[i] + '">' + n + '</button>'; }).join('') + '</div></div>' +
          '<p class="muted small" id="perday"></p>';
      } else if (step === 2) {
        html += '<h2>Your background</h2><div class="frow"><span class="label">This season is my…</span>' + seg('Year of competing', [[1, '1st year competing'], [2, '2nd year'], [3, '3rd year +']], Math.min(3, st.yearOfCompeting)).replace('class="seg"', 'class="seg" id="yoc"') + '</div>' +
          '<div class="frow"><span class="label">Writing proofs</span>' + seg('Proof comfort', [['new', 'New to proofs'], ['some', 'Some practice'], ['comfortable', 'Comfortable']], st.background.proofs).replace('class="seg"', 'class="seg" id="proofs"') + '</div>' +
          '<div class="frow"><span class="label">Courses / experience</span><div id="courses">' + chips('Courses', [['calc1', 'Calculus I'], ['calc2', 'Calculus II'], ['linalg', 'Linear algebra'], ['discrete', 'Discrete math'], ['proofs', 'Intro to proofs'], ['olympiad', 'Olympiad experience']], st.background.courses) + '</div></div>' +
          '<p class="muted small">This only seeds your starting mastery. The diagnostic and your results quickly correct it.</p>';
      } else {
        html += '<h2>Placement diagnostic</h2><p>12 short problems in 90 minutes, sketch solutions only, self-graded 0 / 1 / 2. It places each skill and decides whether you skip Foundations.</p>' +
          seg('Diagnostic', [['now', 'Take it now'], ['plan', 'Schedule it as day 1'], ['skip', 'Skip']], st.diagNow ? 'now' : st.wantDiag ? 'plan' : 'skip').replace('class="seg"', 'class="seg" id="dg"') +
          (c.diag && c.diag.done ? '<p class="small res-ok">Already done: ' + c.diag.total + '/24 (' + esc(c.diag.placement) + ').</p>' : '') +
          '<p class="muted small">' + (st.targets.length ? 'You’ll get a plan to ' + st.targets.map(function (id) { return compShort(id) + ' (' + inDays(s.dates[id]) + ')'; }).join(' and ') + ', about ' + st.hours + ' h/week on ' + st.days.filter(Boolean).length + ' days.' : 'Pick at least one target in step 1.') + '</p>';
      }
      html += '<div class="row"><button class="btn ghost" type="button" id="wBack"' + (step === 0 ? ' disabled' : '') + '>' + ICONS.left + ' Back</button><span class="spacer"></span>' +
        '<button class="btn primary" type="button" id="wNext">' + (step === 3 ? 'Create my plan' : 'Next') + ' ' + ICONS.right + '</button></div></div>';
      main.innerHTML = html;
      $all('[data-tg]', main).forEach(function (b) { b.addEventListener('change', function () { var id = b.getAttribute('data-tg'), i = st.targets.indexOf(id); if (b.checked && i < 0) st.targets.push(id); if (!b.checked && i >= 0) st.targets.splice(i, 1); }); });
      var qd = $('#qd'); if (qd) qd.addEventListener('change', function () { if (/^\d{4}-\d{2}-\d{2}$/.test(qd.value)) { s.dates.qumc = qd.value; s.dateEdited.qumc = true; core.save(); } });
      bindSeg(main, '#hrs', function (v) { st.hours = +v; perday(); });
      $all('[data-day]', main).forEach(function (b) { b.addEventListener('click', function () { var i = +b.getAttribute('data-day'); st.days[i] = st.days[i] ? 0 : 1; b.setAttribute('aria-pressed', String(!!st.days[i])); perday(); }); });
      bindSeg(main, '#yoc', function (v) { st.yearOfCompeting = +v; });
      bindSeg(main, '#proofs', function (v) { st.background.proofs = v; });
      bindChips(main, '#courses', st.background.courses);
      bindSeg(main, '#dg', function (v) { st.diagNow = v === 'now'; st.wantDiag = v !== 'skip'; });
      function perday() { var el = $('#perday'); if (!el) return; var n = st.days.filter(Boolean).length; el.textContent = n ? 'About ' + Math.round(st.hours * 60 / n) + ' minutes per study day (' + n + ' days/week).' : 'Pick at least one day.'; }
      perday();
      $('#wBack').addEventListener('click', function () { if (step > 0) { step--; render(); } });
      $('#wNext').addEventListener('click', function () {
        if (step === 0 && !st.targets.length) { core.toast('Pick at least one competition.'); return; }
        if (step === 1 && !st.days.some(Boolean)) { core.toast('Pick at least one study day.'); return; }
        if (step < 3) { step++; render(); window.scrollTo(0, 0); return; }
        if (c.setup) delete c.setup.needsReview;
        K.saveSetup(st);
        core.toast('Plan ready. ' + K.planSummary());
        core.go(st.diagNow && !(c.diag && c.diag.done) ? '#comp/diag' : '#comp/plan');
      });
    }
    render();
  };

  /* Plan */
  SUB.plan = function (main) {
    var c = C();
    if (!c.setup) { main.innerHTML = subHead('Plan', '', '#comp', 'Competitions') + '<div class="card empty">' + ICONS.calendar + '<h2>No plan yet</h2><p class="muted">Answer four quick questions and the coach builds a day-by-day plan to contest day.</p><a class="btn primary" href="#comp/setup">Build my plan</a></div>'; return; }
    var p = c.plan, t = today();
    var html = subHead('Your plan', p && p.segments.length ? esc(K.planSummary()) : 'No upcoming target this season.', '#comp', 'Competitions');
    html += '<div class="row" style="margin:-.4rem 0 1rem"><a class="btn sm" href="#comp/setup">' + ICONS.edit + ' Edit setup</a><button class="btn sm" type="button" id="rePlan">Re-plan from today</button></div>';
    html += flagsNotice();
    if (p && p.segments.length) {
      html += '<div class="card"><h2>Phases</h2>' + p.segments.map(function (sg) {
        var b = K.PL.timeBuckets.filter(function (x) { return x.id === sg.bucket; })[0];
        var tot = Object.keys(sg.alloc).reduce(function (s, k) { return s + sg.alloc[k]; }, 0) || 1;
        return '<div class="seg-plan"><div class="row"><b>' + compShort(sg.comp) + '</b><span class="muted small">' + esc(fmtD(sg.date)) + ' · ' + sg.calDays + ' days · bucket “' + esc(b ? b.label : sg.bucket) + '”</span></div>' +
          '<div class="phasebar" role="img" aria-label="Phase split">' + ['foundations', 'toolbox', 'mixed', 'competition', 'taper'].filter(function (k) { return sg.alloc[k]; }).map(function (k) {
            return '<span class="ph-' + k + '" style="flex:' + sg.alloc[k] + '" title="' + PHASE_NAME[k] + ': ' + sg.alloc[k] + ' days">' + sg.alloc[k] + '</span>';
          }).join('') + '</div><div class="ph-legend">' + ['foundations', 'toolbox', 'mixed', 'competition', 'taper'].filter(function (k) { return sg.alloc[k]; }).map(function (k) {
            return '<span><i class="ph-' + k + '"></i>' + PHASE_NAME[k] + ' ' + sg.alloc[k] + 'd</span>'; }).join('') + '</div>' +
          (b && !(sg.comp !== 'qumc' && /QUMC/.test(b.advice)) ? '<p class="muted small" style="margin:.3rem 0 0">' + esc(b.advice) + '</p>' : '') + '</div>';
      }).join('') + '</div>';
    }
    html += changesCard(8, true);
    if (p) {
      var weeks = {}, order = [];
      p.days.forEach(function (d) {
        var dt = core.parseYmd(d.d), mon = new Date(dt); mon.setDate(dt.getDate() - ((dt.getDay() + 6) % 7));
        var key = core.ymd(mon);
        if (!weeks[key]) { weeks[key] = []; order.push(key); }
        weeks[key].push(d);
      });
      html += order.map(function (wk) {
        return '<h3 class="week-h">Week of ' + esc(fmtD(wk, { month: 'short', day: 'numeric' })) + '</h3><div class="plan-days">' + weeks[wk].map(function (d) { return planDay(d, d.d === t); }).join('') + '</div>';
      }).join('');
      if (p.history && p.history.length) {
        html += '<details class="reveal" style="margin-top:1rem"><summary>' + ICONS.review + '<span>Past days (' + p.history.length + ')</span><span class="chev" aria-hidden="true">▾</span></summary><div class="rbody"><ul class="hist">' +
          p.history.slice().reverse().map(function (h) { return '<li><span class="cdate">' + esc(fmtD(h.d)) + '</span>' + (h.rest ? '<span class="muted">rest</span>' : h.event ? '<b>' + compShort(h.target) + '</b>' : '<span>' + (PHASE_NAME[h.phase] || '') + ' · ' + h.doneCount + '/' + h.tasks.length + ' done</span>') + '</li>'; }).join('') + '</ul></div></details>';
      }
    }
    main.innerHTML = html;
    bindTicks(main, function () { SUB.plan(main); });
    $('#rePlan').addEventListener('click', function () { K.replan('manual'); K.addChange('Plan regenerated from today at your request.', 'manual'); core.save(); SUB.plan(main); });
    var cur = $('.plan-day.today', main); if (cur && window.innerWidth > 0) cur.scrollIntoView({ block: 'center' });
  };
  function planDay(d, isToday) {
    var cls = 'plan-day' + (isToday ? ' today' : '') + (d.rest ? ' rest' : '') + (d.event ? ' event' : '');
    var head = d.event ? '<span class="phase ev">' + ICONS.trophy + ' ' + compShort(d.target) + '</span>' : d.rest ? '<span class="phase rest">Rest</span>' : d.phase ? '<span class="phase ph-' + d.phase + '">' + PHASE_NAME[d.phase] + '</span>' : '';
    return '<div class="' + cls + '"><div class="pd-head"><span class="pd-date">' + esc(fmtD(d.d)) + (isToday ? ' · today' : '') + '</span>' + head +
      (d.minutes && !d.rest ? '<span class="muted small">' + K.fmtMin(d.minutes) + '</span>' : '') + '</div>' +
      (d.tasks.length ? '<ul class="tasks compact">' + d.tasks.map(function (x) { return taskRow(x, d); }).join('') + '</ul>' : '') + '</div>';
  }

  /* Skill tree */
  SUB.tree = function (main) {
    var c = C(), tg = c.setup && c.setup.targets.length ? c.setup.targets[0] : 'qumc';
    var covered = {};
    K.NODE_LIST.forEach(function (n) { if (c.lessonsRead[n.id] || K.mval(n.id) >= 0.5) covered[n.id] = 1; });
    var rec = K.NODE_LIST.filter(function (n) { return K.mval(n.id) < 0.7 && (n.level === 1 || n.prerequisites.every(function (q) { return covered[q]; })); })
      .sort(function (a, b) { return K.nodePriority(b.id, tg) - K.nodePriority(a.id, tg); })[0];
    var html = subHead('Skill tree', '40 techniques. Dots = mastery (≥ 4 dots with 3+ attempts = mastered). L = your current target level.', '#comp', 'Competitions');
    if (rec) html += '<div class="banner"><p><b>Recommended next:</b> ' + esc(rec.name) + ' — highest weight × lowest mastery for ' + compShort(tg) + ', prerequisites met.</p><a class="btn sm primary" href="#comp/node/' + rec.id + '">Open</a></div>';
    html += K.GROUPS.map(function (g) {
      var ns = K.NODE_LIST.filter(function (n) { return n.group === g; }).sort(function (a, b) { return a.level - b.level; });
      var avg = ns.reduce(function (s, n) { return s + K.mval(n.id); }, 0) / ns.length;
      return '<section class="group"><div class="group-head"><h2>' + esc(g) + '</h2><span class="muted small">' + dots(avg) + '</span></div><div class="tree-grid">' + ns.map(function (n) {
        var locked = n.level > 1 && !n.prerequisites.every(function (q) { return covered[q]; });
        var m = K.mval(n.id), mastered = K.isMastered(n.id);
        return '<a class="node-card' + (mastered ? ' mastered' : '') + (locked ? ' locked' : '') + '" href="#comp/node/' + n.id + '">' +
          '<span class="nc-top"><b>' + esc(n.name) + '</b>' + (locked ? '<span class="lk" title="Prerequisites not covered yet">' + ICONS.lock + '</span>' : '') + '</span>' +
          '<span class="nc-meta">' + dots(m) + lvl(K.tlOf(n.id)) + '<span class="muted small">Q' + (n.relevance.qumc || 0) + ' · P' + (n.relevance.putnam || 0) + '</span></span>' +
          (n.prerequisites.length ? '<span class="nc-pre muted small">after ' + n.prerequisites.map(nodeName).map(esc).join(', ') + '</span>' : '') + '</a>';
      }).join('') + '</div></section>';
    }).join('');
    main.innerHTML = html;
  };

  /* Node: lesson card, problems, Putnam references, past notes */
  SUB.node = function (main, id) {
    var n = NODES[id];
    if (!n) { core.go('#comp/tree', true); return; }
    var c = C();
    c.visits[id] = today(); core.save();
    var L = n.lesson, r = c.mastery[id];
    var html = subHead(esc(n.name), esc(n.group) + ' · base level ' + n.level + ' · relevance QUMC ' + (n.relevance.qumc || 0) + '/3, Putnam ' + (n.relevance.putnam || 0) + '/3', '#comp/tree', 'Skill tree');
    html += '<div class="detail-grid"><div>';
    html += '<div class="card"><div class="row"><span>' + dots(K.mval(id)) + '</span><span class="small">mastery ' + Math.round(K.mval(id) * 100) + '% · ' + (r ? r.n : 0) + ' attempts · target ' + lvl(K.tlOf(id)) + '</span><span class="spacer"></span>' +
      (K.isMastered(id) ? '<span class="badge ok">mastered</span>' : '') + '</div>' +
      (n.prerequisites.length ? '<p class="small" style="margin:.5rem 0 0">Prerequisites: ' + n.prerequisites.map(function (q) { return '<a href="#comp/node/' + q + '">' + esc(nodeName(q)) + '</a> ' + dots(K.mval(q)); }).join(' · ') + '</p>' : '') + '</div>';
    html += pastNotes([id], null);
    html += '<div class="card lesson"><h2>' + ICONS.book + ' Lesson card</h2><div class="prompt">' + L.coreIdea + '</div>' +
      '<h3>Recognise it when…</h3><ul>' + L.recognise.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>' +
      '<h3>Key facts</h3><ul>' + L.keyFacts.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>' +
      '<h3>Traps</h3><ul>' + L.traps.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>' +
      '<div class="row"><button class="btn ' + (c.lessonsRead[id] ? '' : 'primary') + '" type="button" id="readBtn">' + (c.lessonsRead[id] ? ICONS.check + ' Read on ' + esc(fmtD(c.lessonsRead[id], { month: 'short', day: 'numeric' })) : 'Mark lesson as read') + '</button>' +
      '<a class="btn" href="#journal/new?kind=free&node=' + id + '">Add a note</a></div></div>';
    html += '<div class="card"><h2>Reading</h2><ul class="res">' + n.reading.map(function (x) { return '<li><b>' + (x.link ? ext(x.link, esc(x.source)) : esc(x.source)) + '</b><br><span class="small muted">' + esc(x.where) + '</span></li>'; }).join('') + '</ul></div>';
    html += '</div><div>';
    html += '<div class="card"><div class="row"><h2 style="margin:0">Practice problems</h2><span class="spacer"></span><button class="btn sm primary" type="button" id="practiceNode">Practice now</button></div><ul class="plist comp-list">' +
      n.allProblems.map(function (pid) { return probRow(pid); }).join('') + '</ul></div>';
    html += '<div class="card"><h2>Official Putnam references</h2><p class="muted small">Problems are linked, not copied. Mark what you tried.</p><ul class="refs">' + (n.putnamRefs || []).map(function (ref) {
      var st = c.refs[ref.id] || '';
      return '<li><div class="row"><b>' + esc(ref.id) + '</b><span class="muted small">' + esc(ref.topic) + '</span><span class="spacer"></span>' + core.diffDots(Math.min(3, Math.max(1, Math.round(ref.difficulty * 0.6)))) + '</div>' +
        '<div class="row small">' + ext(ref.link, 'Problems') + ext(ref.solutionLink, 'Solutions') + '<span class="spacer"></span>' +
        seg('Status for ' + ref.id, [['', '—'], ['attempted', 'Attempted'], ['solved', 'Solved']], st).replace('class="seg"', 'class="seg sm" data-ref="' + esc(ref.id) + '"') + '</div>' +
        '<details class="reveal"><summary>' + ICONS.bulb + '<span>Hint (own words)</span><span class="chev" aria-hidden="true">▾</span></summary><div class="rbody small">' + esc(ref.hint) + '</div></details></li>';
    }).join('') + '</ul></div>';
    html += '</div></div>';
    main.innerHTML = html;
    $('#readBtn').addEventListener('click', function () { if (c.lessonsRead[id]) delete c.lessonsRead[id]; else c.lessonsRead[id] = today(); core.save(); SUB.node(main, id); });
    $('#practiceNode').addEventListener('click', function () {
      var pids = n.allProblems.filter(function (pid) { return K.probStatus(pid) !== 'solved' && !K.reservedBlocked(CP[pid]); });
      var pid = (pids.sort(function (a, b) { return Math.abs(CP[a].level - K.tlOf(id)) - Math.abs(CP[b].level - K.tlOf(id)); })[0]) || n.allProblems[0];
      core.go('#comp/p/' + pid + '?src=node&node=' + id);
    });
    $all('[data-ref]', main).forEach(function (sg) {
      var rid = sg.getAttribute('data-ref');
      $all('[data-v]', sg).forEach(function (b) { b.addEventListener('click', function () { var v = b.getAttribute('data-v'); if (v) c.refs[rid] = v; else delete c.refs[rid]; core.save(); $all('[data-v]', sg).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); }); });
    });
  };
  function probRow(pid, href) {
    var p = CP[pid], st = K.probStatus(pid);
    var reserved = K.reservedBlocked(p);
    return '<li><a class="prow" href="' + (href || '#comp/p/' + pid) + '">' + core.statusIcon(st) + '<span class="t"><span class="tt">' + esc(p.title) + '</span><span class="tm">' + esc(nodeName(p.nodes[0])) + ' · ~' + p.estimatedMinutes + ' min' + (reserved ? ' · ' + ICONS.lock + ' mock' : '') + '</span></span>' + lvl(p.level) + '</a></li>';
  }

  /* Problem bank */
  SUB.bank = function (main) {
    var f = { g: '', l: '', st: 'all', q: '' };
    function render() {
      var list = K.CP_LIST.filter(function (p) {
        if (f.g && NODES[p.nodes[0]].group !== f.g) return false;
        if (f.l && p.level !== +f.l) return false;
        var st = K.probStatus(p.id);
        if (f.st !== 'all' && st !== f.st) return false;
        if (f.q) { var h = (p.title + ' ' + p.nodes.map(nodeName).join(' ') + ' ' + core.stripTags(p.statement)).toLowerCase(); if (f.q.toLowerCase().split(/\s+/).some(function (t) { return t && h.indexOf(t) < 0; })) return false; }
        return true;
      });
      $('#bankList').innerHTML = list.length ? list.map(function (p) { return probRow(p.id); }).join('') : '<li class="empty"><b>No problems match.</b></li>';
      $('#bankCount').textContent = list.length + ' of ' + K.CP_LIST.length + ' problems';
    }
    main.innerHTML = subHead('Competition problem bank', '<span id="bankCount"></span> · original or classical problems in our own words, levels 1–5.', '#comp', 'Competitions') +
      '<div class="practice-layout"><aside class="filters card"><label class="search"><span class="sr-only">Search</span>' + ICONS.search + '<input type="search" id="bq" placeholder="Search title, technique, text…" autocomplete="off"></label>' +
      '<div class="frow"><span class="label">Area</span><div class="chips scroll" id="bg">' + [''].concat(K.GROUPS).map(function (g) { return '<button type="button" class="chip" data-g="' + esc(g) + '" aria-pressed="' + (g === '') + '">' + esc(g ? GROUP_SHORT[g] : 'All') + '</button>'; }).join('') + '</div></div>' +
      '<div class="frow"><span class="label">Level</span>' + seg('Level', [['', 'All'], [1, '1'], [2, '2'], [3, '3'], [4, '4'], [5, '5']], '').replace('class="seg"', 'class="seg" id="bl"') + '</div>' +
      '<div class="frow"><span class="label">Status</span>' + seg('Status', [['all', 'All'], ['new', 'New'], ['missed', 'Missed'], ['solved', 'Solved']], 'all').replace('class="seg"', 'class="seg" id="bs"') + '</div></aside>' +
      '<section class="list-wrap"><ul class="plist comp-list" id="bankList"></ul></section></div>';
    $all('#bg [data-g]', main).forEach(function (b) { b.addEventListener('click', function () { f.g = b.getAttribute('data-g'); $all('#bg [data-g]', main).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); render(); }); });
    bindSeg(main, '#bl', function (v) { f.l = v; render(); });
    bindSeg(main, '#bs', function (v) { f.st = v; render(); });
    $('#bq').addEventListener('input', function (e) { f.q = e.target.value.trim(); render(); });
    render();
  };

  /* ------------------------------------------------------------------ */
  /* Competition problem: attempt → check → self-grade → reflect          */
  /* ------------------------------------------------------------------ */
  SUB.p = function (main, id, q) {
    var p = CP[id];
    if (!p) { core.go('#comp/bank', true); return; }
    var c = C();
    var blind = q.blind === '1';
    var started = Date.now(), hintsOpened = 0, answerOk = null, graded = false, revealed = false;
    var stuckLock = c.flags.stuckUntil >= today();
    var reserved = K.reservedBlocked(p);
    var a = p.answer || {};
    var crumbs = blind ? '<span>Mixed set (technique hidden)</span>' : '<span><span class="cdot" style="--cat: var(--accent)"></span>' + esc(NODES[p.nodes[0]].group) + '</span><span aria-hidden="true">›</span><span class="cnodes">' + p.nodes.map(function (n) { return '<a href="#comp/node/' + n + '">' + esc(nodeName(n)) + '</a>'; }).join('<span aria-hidden="true"> · </span>') + '</span>';
    var html = '<div class="narrow">' + '<a class="back-link" href="' + (q.src === 'plan' ? '#comp' : q.src === 'node' && q.node ? '#comp/node/' + q.node : q.src === 'diag' ? '#comp/diag' : '#comp/bank') + '">' + ICONS.left + ' ' + (q.src === 'plan' ? 'Today' : q.src === 'node' ? 'Lesson' : 'Problem bank') + '</a>' +
      (reserved ? '<div class="banner"><p>' + ICONS.lock + ' This problem is reserved for <b>' + esc(MOCKS[p.reservedForMock].name) + '</b>. Solving it now spoils the mock — fine if you won’t take it.</p></div>' : '') +
      (!blind ? pastNotes(p.nodes, p.id, 'Your past notes on this') : pastNotes([], p.id, 'Your past notes on this problem')) +
      '<article class="card problem comp-problem" aria-labelledby="cpt"><nav class="crumbs" aria-label="Breadcrumb">' + crumbs + '<span class="spacer"></span><span class="count">' + ICONS.timer + ' <span id="sw">0:00</span></span></nav>' +
      '<div class="ptop"><h1 class="problem-title" id="cpt">' + esc(p.title) + '</h1><span class="pstate" aria-hidden="true"></span></div>' +
      '<div class="problem-meta">' + lvl(p.level) + '<span class="badge">~' + p.estimatedMinutes + ' min</span>' + (q.retry ? '<span class="badge warn">spaced retry — no hints</span>' : '') + '<span class="badge">' + esc(a.type === 'proof' ? 'proof' : a.type === 'numeric' ? 'answer + proof' : 'answer + proof') + '</span></div>' +
      '<div class="prompt comp-stmt">' + p.statement + '</div>';
    if (a.type === 'numeric' || a.type === 'text') {
      html += '<form class="answer-form" id="caf" autocomplete="off" novalidate><label class="sr-only" for="cain">Your answer</label><div class="answer-row"><input id="cain" type="text" placeholder="' + (a.type === 'numeric' ? 'Final answer' : 'Short answer') + '" autocapitalize="off" spellcheck="false" enterkeyhint="done"><button class="btn primary" type="submit">Check</button></div>' +
        '<div class="answer-help">Check the final answer here — then grade your written justification. A bare answer earns little in a real contest.</div></form>';
    } else {
      html += '<div class="row" style="margin-top:1rem"><button class="btn primary" type="button" id="proofDone">I’ve written my solution</button><span class="muted small">Then compare with the model solution and grade yourself.</span></div>';
    }
    html += '<div class="feedback" id="cfb" role="status" aria-live="polite"></div><div class="reveals" id="hints"></div>' +
      '<details class="reveal sol" id="csol"><summary>' + ICONS.book + '<span>Model solution</span><small class="muted">opens grading</small><span class="chev" aria-hidden="true">▾</span></summary><div class="rbody">' +
      '<div class="key">' + ICONS.bulb + '<div><b>Key idea.</b> ' + esc(p.keyIdea) + '</div></div>' + p.solution +
      (p.commonMistakes && p.commonMistakes.length ? '<h3>Common mistakes</h3><ul>' + p.commonMistakes.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') +
      '<p class="small muted">Source: ' + esc(p.source) + (p.sourceNote ? ' — ' + esc(p.sourceNote) : '') + '</p></div></details>' +
      '<div id="gradeBox"></div><div id="reflectBox"></div><div id="afterBox"></div></article></div>';
    main.innerHTML = html;
    var swEl = $('#sw');
    var iv = setInterval(function () { if (!swEl.isConnected) return; swEl.textContent = core.fmtTime((Date.now() - started) / 1000); if (stuckLock) renderHints(); }, 1000);
    core.onCleanup(function () { clearInterval(iv); });
    var hintsRendered = '';
    function renderHints() {
      var box = $('#hints'); if (!box) return;
      var el = (Date.now() - started) / 1000;
      var mode = q.retry ? 'none' : stuckLock && el < 900 ? 'locked' : 'open';
      if (mode === hintsRendered) return;
      hintsRendered = mode;
      if (mode === 'none') { box.innerHTML = '<p class="muted small">Spaced retry: solve it without hints this time.</p>'; return; }
      if (mode === 'locked') { box.innerHTML = '<div class="hint-lock">' + ICONS.lock + '<div><b>Hints unlock after 15 minutes this week.</b><br><span class="small">First change the representation: try small cases, draw it, make a table, restate the goal, or solve a simpler version.</span></div></div>'; return; }
      box.innerHTML = (p.hints || []).map(function (h, i) { return '<details class="reveal hint" data-h="' + i + '"><summary>' + ICONS.bulb + '<span>Hint ' + (i + 1) + '</span><span class="chev" aria-hidden="true">▾</span></summary><div class="rbody">' + h + '</div></details>'; }).join('');
      $all('details.hint', box).forEach(function (d) { d.addEventListener('toggle', function () { if (d.open && !d.dataset.seen) { d.dataset.seen = '1'; hintsOpened++; } }); });
    }
    renderHints();
    function fb(kind, msg) { var f = $('#cfb'); f.className = 'feedback show ' + kind; f.innerHTML = msg; }
    var form = $('#caf');
    if (form) form.addEventListener('submit', function (e) {
      e.preventDefault();
      var r = K.checkCompAnswer(p, $('#cain').value);
      if (r.invalid) { fb('info', 'Type an answer first.'); return; }
      answerOk = !!r.ok;
      fb(r.ok ? 'ok' : 'bad', r.ok ? '<b>Correct answer.</b> Now grade your written justification.' : '<b>Not the expected answer.</b> Re-check, or open the model solution.' );
      if (r.ok) { $('#csol').open = true; }
      showGrade();
    });
    var pd = $('#proofDone'); if (pd) pd.addEventListener('click', function () { $('#csol').open = true; showGrade(); });
    $('#csol').addEventListener('toggle', function () { if ($('#csol').open) { revealed = true; showGrade(); } });
    function showGrade() {
      if (graded || $('#gradeBox').innerHTML) return;
      var sugg = answerOk === true ? 'Your answer is right — grade the write-up: is every step justified?' : answerOk === false ? 'The answer didn’t match — at most 1 unless the mismatch is just formatting.' : 'Compare your write-up with the model solution, step by step.';
      $('#gradeBox').innerHTML = '<div class="grade-box"><h3>Grade yourself</h3><p class="muted small">' + sugg + '</p><div class="rubric" role="group" aria-label="Rubric">' + RUBRIC.map(function (x) {
        return '<button type="button" class="rub" data-g="' + x.g + '"><b>' + x.g + '</b><span><b>' + x.t + '</b><small>' + x.d + '</small></span></button>';
      }).join('') + '</div></div>';
      $all('#gradeBox [data-g]').forEach(function (b) { b.addEventListener('click', function () { grade(+b.getAttribute('data-g')); }); });
    }
    function grade(g) {
      if (graded) return;
      graded = true;
      var minutes = Math.max(1, Math.round((Date.now() - started) / 60000));
      var res = K.recordAttempt(p.id, { grade: g, hints: hintsOpened, minutes: minutes, mode: 'practice', answerOk: answerOk });
      var card = $('.comp-problem');
      card.classList.add(res.s >= 0.7 ? 'is-correct' : 'is-wrong');
      card.querySelector('.pstate').innerHTML = res.s >= 0.7 ? ICONS.check : ICONS.x;
      $('#gradeBox').innerHTML = '<div class="feedback show ' + (res.s >= 0.7 ? 'ok' : 'info') + '"><b>Saved: ' + RUBRIC[g].t + '</b> (' + minutes + ' min' + (hintsOpened ? ', ' + hintsOpened + ' hint' + (hintsOpened > 1 ? 's' : '') : '') + '). ' +
        p.nodes.map(function (n) { return esc(nodeName(n)) + ' ' + dots(K.mval(n)); }).join(' · ') +
        (K.C().retry[p.id] ? '<br><span class="fw-normal">It will come back for a no-hint retry on ' + esc(fmtD(K.C().retry[p.id].due)) + '.</span>' : '') +
        (res.changes.length ? '<ul class="changes">' + res.changes.map(function (m) { return '<li>' + esc(m) + '</li>'; }).join('') + '</ul>' : '') + '</div>';
      var outcome = g >= 2 ? 'solved' : g === 1 ? 'partial' : 'failed';
      reflectionSheet($('#reflectBox'), { problemId: p.id, nodes: p.nodes, outcome: outcome, minutes: minutes, est: p.estimatedMinutes, hints: hintsOpened, comp: planTarget(), blind: blind }, after);
    }
    function after() {
      var day = K.todayDay();
      var next = day && day.tasks.filter(function (t) { return !K.isDone(t, day) && (t.type === 'prob' || t.type === 'retry') && t.ref !== p.id; })[0];
      $('#afterBox').innerHTML = '<div class="pnav">' + (next ? '<a class="btn primary" href="' + taskHref(next) + '">Next task: ' + esc(CP[next.ref] ? CP[next.ref].title : next.label) + ' ' + ICONS.right + '</a>' : '') +
        '<a class="btn' + (next ? '' : ' primary') + '" href="#comp">Back to today</a>' + (!blind ? '<a class="btn ghost" href="#comp/node/' + p.nodes[0] + '">' + esc(nodeName(p.nodes[0])) + '</a>' : '') + '</div>';
    }
    core.setCtl({
      submit: function () { if (form) form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit', { cancelable: true })); },
      hint: function () { var d = $all('#hints details.hint').filter(function (x) { return !x.open; })[0]; if (d) d.open = true; },
      solution: function () { $('#csol').open = true; }
    });
    if (form && core.hoverDevice()) $('#cain').focus();
  };
  function planTarget() { var c = C(), d = K.todayDay(); return d ? d.target : (c.setup && c.setup.targets[0]) || null; }

  /* Guided reflection sheet (rule-based prompts, always skippable) */
  function reflectionSheet(box, ctx, done) {
    var prompt;
    if (ctx.outcome === 'failed') prompt = 'What would have made you see it?';
    else if (ctx.outcome === 'partial') prompt = 'What was the missing step — and what signal pointed to it?';
    else if (ctx.hints >= 1) prompt = 'Which hint unlocked it — and what question could you have asked yourself instead?';
    else if (ctx.est && ctx.minutes <= ctx.est * 0.6) prompt = 'What pattern did you recognise so quickly?';
    else if (ctx.est && ctx.minutes >= ctx.est * 1.5) prompt = 'Where did the time go?';
    else prompt = 'What is the one idea worth remembering from this problem?';
    var st = { approaches: [], mistakes: [], confidence: null, pinned: false };
    var pre = ctx.outcome !== 'solved' ? 'Wrong idea' : null;
    box.innerHTML = '<div class="reflect card flat"><div class="row"><h3 style="margin:0">' + ICONS.journal + ' Quick reflection</h3><span class="spacer"></span><span class="muted small">30 seconds · optional</span></div>' +
      '<p class="rprompt">' + esc(prompt) + '</p>' +
      '<label class="sr-only" for="rIns">' + esc(prompt) + '</label><textarea id="rIns" rows="2" placeholder="Key insight…"></textarea>' +
      '<div class="frow"><span class="label">Approach tried</span><div id="rAp">' + chips('Approach', APPROACHES, st.approaches) + '</div></div>' +
      (ctx.outcome !== 'solved' || ctx.hints ? '<label class="label" for="rStuck">Where I got stuck</label><input type="text" id="rStuck" placeholder="e.g. couldn’t find the invariant">' : '') +
      '<div class="frow"><span class="label">Mistake type</span><div id="rMi">' + chips('Mistakes', MISTAKES, st.mistakes) + '</div></div>' +
      '<div class="frow"><span class="label">Confidence now</span>' + seg('Confidence', [[1, '1'], [2, '2'], [3, '3'], [4, '4'], [5, '5']], '').replace('class="seg"', 'class="seg" id="rConf"') + '</div>' +
      '<label class="label" for="rTip">Tip to future me</label><input type="text" id="rTip" placeholder="e.g. try small cases before algebra on these">' +
      '<label class="check"><input type="checkbox" id="rPin"> Pin this tip (shown before mocks and contests)</label>' +
      '<div class="row"><button class="btn primary" type="button" id="rSave">Save reflection</button><button class="btn ghost" type="button" id="rSkip">Skip</button></div></div>';
    bindChips(box, '#rAp', st.approaches);
    bindChips(box, '#rMi', st.mistakes);
    bindSeg(box, '#rConf', function (v) { st.confidence = +v; });
    $('#rSkip', box).addEventListener('click', function () { box.innerHTML = '<p class="muted small">Reflection skipped.</p>'; done && done(); });
    $('#rSave', box).addEventListener('click', function () {
      var e = K.addEntry({
        kind: ctx.kind || 'problem', problemId: ctx.problemId, problemTitle: ctx.problemTitle, nodes: ctx.nodes, comp: ctx.comp, outcome: ctx.outcome, minutes: ctx.minutes,
        approaches: st.approaches.slice(), stuck: ($('#rStuck', box) || {}).value || '', insight: $('#rIns', box).value.trim(), mistakes: st.mistakes.slice(),
        confidence: st.confidence, tip: $('#rTip', box).value.trim(), pinned: $('#rPin', box).checked, prompt: prompt, src: ctx.src || 'comp'
      });
      box.innerHTML = '<div class="feedback show ok">Saved to your journal' + (e.tip ? ' — tip added to your library' : '') + '. <a href="#journal/e/' + e.id + '">View</a></div>';
      done && done();
    });
    if (pre) { /* gentle default nudge only */ }
  }
  K.reflectionSheet = reflectionSheet;

  /* ------------------------------------------------------------------ */
  /* Diagnostic                                                          */
  /* ------------------------------------------------------------------ */
  SUB.diag = function (main) {
    var c = C(), dg = PL.diagnostic, ids = dg.problemIds;
    var D0 = c.diag || {};
    var timer = null;
    core.onCleanup(function () { if (timer) clearInterval(timer); });
    function intro() {
      main.innerHTML = subHead('Placement diagnostic', '', '#comp', 'Competitions') + '<div class="card stack narrow">' +
        (D0.done ? '<div class="feedback show ok">Done on ' + esc(fmtD(D0.d)) + ': <b>' + D0.total + '/24</b> → ' + esc(placementText(D0.placement)) + '</div>' : '') +
        '<p>' + esc(dg.description) + '</p><ul>' + dg.design.map(function (x) { return '<li>' + esc(x.group) + ' · L' + x.level + ' — ' + esc(x.purpose) + '</li>'; }).join('') + '</ul>' +
        '<div class="row"><button class="btn primary lg" type="button" id="dStart">' + ICONS.timer + '<span><b>' + (D0.done ? 'Retake' : 'Start') + ' (90 min)</b><small>Paper and pen ready — sketch solutions only</small></span></button></div></div>';
      $('#dStart').addEventListener('click', function () { c.diag = { started: Date.now(), done: false, answers: {}, scores: D0.done ? {} : {} }; core.save(); running(); });
    }
    function running() {
      var d = c.diag;
      var end = d.started + dg.durationMinutes * 60000;
      main.innerHTML = '<div class="narrow"><div class="iv-top"><span>Diagnostic · 12 problems</span><span class="countdown" id="dClock">' + core.fmtTime((end - Date.now()) / 1000) + '</span></div>' +
        '<p class="muted small">Sketch the key steps on paper. Answer boxes are optional (they help grading). Order doesn’t matter — do what you can.</p>' +
        ids.map(function (pid, i) {
          var p = CP[pid], a = p.answer;
          return '<details class="card diag-q reveal"' + (i === 0 ? ' open' : '') + '><summary><span class="badge">' + (i + 1) + '</span><span>' + esc(p.title) + '</span>' + lvl(p.level) + '<span class="chev" aria-hidden="true">▾</span></summary><div class="rbody"><div class="prompt comp-stmt">' + p.statement + '</div>' +
            (a.type !== 'proof' ? '<input type="text" class="dans" data-p="' + pid + '" placeholder="Optional final answer" value="' + esc((d.answers || {})[pid] || '') + '">' : '') + '</div></details>';
        }).join('') + '<div class="row"><button class="btn primary" type="button" id="dFinish">Finish &amp; grade</button></div></div>';
      $all('.dans', main).forEach(function (inp) { inp.addEventListener('change', function () { d.answers = d.answers || {}; d.answers[inp.getAttribute('data-p')] = inp.value; core.save(); }); });
      timer = setInterval(function () { var el = $('#dClock'); if (!el) return; var left = (end - Date.now()) / 1000; el.textContent = left > 0 ? core.fmtTime(left) : 'time’s up'; el.classList.toggle('low', left < 300); }, 500);
      $('#dFinish').addEventListener('click', grading);
    }
    function grading() {
      if (timer) { clearInterval(timer); timer = null; }
      var d = c.diag, scores = {};
      main.innerHTML = '<div class="narrow">' + subHead('Grade your diagnostic', 'For each problem: 0 = no idea, 1 = right idea but incomplete, 2 = complete sketch. Leave “skipped” if you didn’t try it.') +
        ids.map(function (pid, i) {
          var p = CP[pid], typed = (d.answers || {})[pid], chk = typed ? K.checkCompAnswer(p, typed) : null;
          return '<div class="card"><div class="row"><span class="badge">' + (i + 1) + '</span><b>' + esc(p.title) + '</b><span class="spacer"></span>' + lvl(p.level) + '</div>' +
            (chk ? '<p class="small ' + (chk.ok ? 'res-ok' : 'res-bad') + '">Your answer “' + esc(typed) + '” is ' + (chk.ok ? 'correct' : 'not the expected one') + '.</p>' : '') +
            '<details class="reveal"><summary>' + ICONS.book + '<span>Model solution</span><span class="chev" aria-hidden="true">▾</span></summary><div class="rbody"><div class="prompt comp-stmt small">' + p.statement + '</div>' + p.solution + '</div></details>' +
            seg('Score for ' + p.title, [['', 'Skipped'], [0, '0'], [1, '1'], [2, '2']], '').replace('class="seg"', 'class="seg" data-ds="' + pid + '"') + '</div>';
        }).join('') + '<div class="row"><button class="btn primary" type="button" id="dSave">Save placement</button></div></div>';
      $all('[data-ds]', main).forEach(function (sg) { var pid = sg.getAttribute('data-ds'); $all('[data-v]', sg).forEach(function (b) { b.addEventListener('click', function () { var v = b.getAttribute('data-v'); if (v === '') delete scores[pid]; else scores[pid] = +v; $all('[data-v]', sg).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); }); }); });
      $('#dSave').addEventListener('click', function () {
        var r = K.applyDiag(scores);
        core.toast('Placement: ' + r.total + '/24 — ' + placementText(r.placement));
        core.go('#comp/plan');
      });
      window.scrollTo(0, 0);
    }
    if (c.diag && c.diag.started && !c.diag.done) running(); else intro();
  };
  function placementText(p) { return { foundations: 'start with Foundations (levels 1–2)', mixed: 'short Foundations, then Toolbox (levels 2–3)', advanced: 'skip Foundations; Toolbox at level 3 + official A1/B1' }[p] || p; }

  /* ------------------------------------------------------------------ */
  /* Mocks                                                               */
  /* ------------------------------------------------------------------ */
  SUB.mocks = function (main) {
    var c = C(), taken = K.mocksTaken();
    var html = subHead('Mock exams', 'Timed papers in each format. Results feed your mastery; unsolved problems return for spaced retry.', '#comp', 'Competitions');
    ['qumc', 'putnam'].forEach(function (cid) {
      html += '<h2 class="week-h">' + compShort(cid) + '</h2><div class="train-grid">' + K.MOCK_LIST.filter(function (m) { return m.competition === cid; }).map(function (m) {
        var res = c.mocks.filter(function (r) { return r.mockId === m.id; }).slice(-1)[0];
        return '<a class="card train-card" href="#comp/mock/' + m.id + '"><span class="ic">' + ICONS.timer + '</span><h2>' + esc(m.name) + '</h2><p class="muted small">' + esc(m.description) + '</p>' +
          '<p class="small"><b>' + m.blocks.length + ' × ' + m.blocks[0].minutes + ' min · ' + m.problemIds.length + ' problems</b>' + (res ? ' · <span class="res-ok">' + res.total + '/' + res.max + ' on ' + esc(fmtD(res.d, { month: 'short', day: 'numeric' })) + '</span>' : taken[m.id] ? ' · taken' : '') + '</p>' +
          '<span class="btn sm ' + (res ? '' : 'primary') + '">' + (c.activeMock && c.activeMock.id === m.id ? 'Resume' : res ? 'Retake / results' : 'Start') + '</span></a>';
      }).join('') + '</div>';
    });
    html += '<div class="card" style="margin-top:1rem"><h2>Official Putnam papers</h2><p class="muted small">' + esc(K.D.mocks.officialNote) + '</p><ul class="tasks">' + K.D.mocks.officialPapers.map(function (o) {
      var k = 'official:' + o.year, done = !!c.done[k];
      return '<li class="task' + (done ? ' done' : '') + '"><button type="button" class="tick" data-tick="' + k + '" aria-pressed="' + done + '" aria-label="Mark ' + o.year + ' done">' + (done ? ICONS.check : '') + '</button><span class="tl"><b>' + o.year + '</b> — ' + esc(o.use) + '<br>' + ext(o.problems, 'Problems') + ' · ' + ext(o.solutions, 'Solutions') + '</span></li>';
    }).join('') + '</ul></div>';
    if (c.mocks.length) html += '<div class="card"><h2>History</h2><table class="simple"><thead><tr><th>Date</th><th>Mock</th><th>Score</th><th>A’s solved</th></tr></thead><tbody>' + c.mocks.slice().reverse().map(function (r) {
      return '<tr><td>' + esc(fmtD(r.d, { month: 'short', day: 'numeric', year: 'numeric' })) + '</td><td>' + esc(MOCKS[r.mockId] ? MOCKS[r.mockId].name : r.mockId) + '</td><td><b>' + r.total + '</b>/' + r.max + '</td><td>' + r.aSolved + '/' + r.aCount + '</td></tr>';
    }).join('') + '</tbody></table></div>';
    main.innerHTML = html;
    bindTicks(main, function () { SUB.mocks(main); });
  };

  SUB.mock = function (main, id, q) {
    var m = MOCKS[id];
    if (!m) { core.go('#comp/mocks', true); return; }
    var c = C();
    var timer = null;
    core.onCleanup(function () { if (timer) clearInterval(timer); });
    var A = c.activeMock && c.activeMock.id === id ? c.activeMock : null;
    function persist() { c.activeMock = A; core.save(); }
    function blockIds(i) { return m.blocks[i].problemIds; }
    function breakMinutes(i) { return m.blocks.length === 4 && i === 1 ? 105 : 15; }
    function render() {
      if (timer) { clearInterval(timer); timer = null; }
      if (!A) return intro();
      if (A.phase === 'triage' || A.phase === 'solve') return solve();
      if (A.phase === 'break') return brk();
      if (A.phase === 'grade') return gradeV();
      intro();
    }
    function intro() {
      var last = c.mocks.filter(function (r) { return r.mockId === id; }).slice(-1)[0];
      var other = c.activeMock && c.activeMock.id !== id ? MOCKS[c.activeMock.id] : null;
      main.innerHTML = '<div class="narrow">' + subHead(esc(m.name), esc(m.description), '#comp/mocks', 'Mock exams') +
        (other ? '<div class="banner"><p>Another mock is in progress: <b>' + esc(other.name) + '</b>.</p><a class="btn sm" href="#comp/mock/' + c.activeMock.id + '">Resume it</a></div>' : '') +
        (last ? resultsCard(last) : '') +
        readBeforeCard(m.competition) +
        '<div class="card stack"><h2>Rules</h2><p>' + esc(m.instructions) + '</p><p class="small muted">' + m.blocks.length + ' block' + (m.blocks.length > 1 ? 's' : '') + ' of ' + m.blocks[0].minutes + ' minutes' + (m.blocks.length > 1 ? ', with breaks between blocks' : '') + '. Each block starts with a triage step: read every problem, label it A (I see a route) / B (an idea) / C (no clue). The clock runs during triage.</p>' +
        '<button class="btn primary lg" type="button" id="mStart"' + (other ? ' disabled' : '') + '>' + ICONS.timer + '<span><b>Start ' + (last ? 'again' : 'the mock') + '</b><small>' + K.fmtMin(m.blocks.length * m.blocks[0].minutes) + ' of work</small></span></button></div></div>';
      var b = $('#mStart'); if (b) b.addEventListener('click', function () {
        A = { id: id, phase: 'triage', block: 0, blockStart: Date.now(), triage: {}, status: {}, scores: {}, startedAt: Date.now() };
        persist(); render(); window.scrollTo(0, 0);
      });
    }
    function solve() {
      var i = A.block, ids = blockIds(i), mins = m.blocks[i].minutes;
      var end = A.blockStart + mins * 60000;
      var order = ids.slice();
      if (A.phase === 'solve') order.sort(function (a, b) { return 'ABC'.indexOf(A.triage[a] || 'C') - 'ABC'.indexOf(A.triage[b] || 'C'); });
      main.innerHTML = '<div class="narrow"><div class="iv-top"><span>' + esc(m.name) + ' · block ' + (i + 1) + '/' + m.blocks.length + '</span><span class="countdown" id="mClock">' + core.fmtTime((end - Date.now()) / 1000) + '</span></div>' +
        (A.phase === 'triage' ? '<div class="banner"><p><b>Triage.</b> Read all ' + ids.length + ' problems and label each A / B / C. Then solve A → B → C.</p></div>' : '<p class="muted small">Write on paper. Mark each problem’s status as you go; you’ll grade with the model solutions afterwards.</p>') +
        order.map(function (pid, k) {
          var p = CP[pid];
          return '<div class="card"><div class="row"><span class="badge">' + (ids.indexOf(pid) + 1) + '</span><b>' + esc(p.title) + '</b><span class="spacer"></span>' + (A.triage[pid] ? '<span class="badge tri-' + A.triage[pid] + '">' + A.triage[pid] + '</span>' : '') + '</div>' +
            '<div class="prompt comp-stmt">' + p.statement + '</div>' +
            (A.phase === 'triage' ? seg('Triage ' + p.title, [['A', 'A — route'], ['B', 'B — idea'], ['C', 'C — no clue']], A.triage[pid] || '').replace('class="seg"', 'class="seg" data-tri="' + pid + '"')
              : seg('Status ' + p.title, [['', 'Not started'], ['working', 'Working'], ['written', 'Written up']], A.status[pid] || '').replace('class="seg"', 'class="seg" data-st="' + pid + '"')) + '</div>';
        }).join('') +
        '<div class="row">' + (A.phase === 'triage' ? '<button class="btn primary" type="button" id="mGo">Start solving ' + ICONS.right + '</button>' : '<button class="btn" type="button" id="mEnd">End block ' + (i + 1) + '</button>') +
        '<span class="spacer"></span><button class="btn ghost danger" type="button" id="mAbandon">Abandon mock</button></div></div>';
      $all('[data-tri]', main).forEach(function (sg) { var pid = sg.getAttribute('data-tri'); $all('[data-v]', sg).forEach(function (b) { b.addEventListener('click', function () { A.triage[pid] = b.getAttribute('data-v'); persist(); $all('[data-v]', sg).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); }); }); });
      $all('[data-st]', main).forEach(function (sg) { var pid = sg.getAttribute('data-st'); $all('[data-v]', sg).forEach(function (b) { b.addEventListener('click', function () { A.status[pid] = b.getAttribute('data-v'); persist(); $all('[data-v]', sg).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); }); }); });
      var go = $('#mGo'); if (go) go.addEventListener('click', function () { ids.forEach(function (pid) { if (!A.triage[pid]) A.triage[pid] = 'C'; }); A.phase = 'solve'; persist(); render(); window.scrollTo(0, 0); });
      var en = $('#mEnd'); if (en) en.addEventListener('click', function () { if (confirm('End block ' + (i + 1) + ' now?')) endBlock(); });
      $('#mAbandon').addEventListener('click', function () { if (confirm('Abandon this mock? Nothing is recorded.')) { A = null; persist(); render(); } });
      timer = setInterval(function () {
        var el = $('#mClock'); if (!el) return;
        var left = (end - Date.now()) / 1000;
        el.textContent = core.fmtTime(left); el.classList.toggle('low', left <= 600);
        if (left <= 0) { core.toast('Time! Block ' + (i + 1) + ' is over.'); endBlock(); }
      }, 500);
    }
    function endBlock() {
      blockIds(A.block).forEach(function (pid) { if (!A.triage[pid]) A.triage[pid] = 'C'; });
      if (A.block + 1 < m.blocks.length) { A.phase = 'break'; A.breakUntil = Date.now() + breakMinutes(A.block) * 60000; }
      else A.phase = 'grade';
      persist(); render(); window.scrollTo(0, 0);
    }
    function brk() {
      main.innerHTML = '<div class="narrow"><div class="card sprint-stage"><div class="label">Break</div><div class="big-score" id="bClock">' + core.fmtTime((A.breakUntil - Date.now()) / 1000) + '</div>' +
        '<p class="muted">' + (breakMinutes(A.block) > 30 ? 'Lunch break — eat properly, walk, don’t discuss problems.' : 'Stand up, drink water, reset. Don’t look back at the last block.') + '</p>' +
        '<button class="btn primary" type="button" id="bNext">Start block ' + (A.block + 2) + '</button></div></div>';
      function next() { A.block++; A.phase = 'triage'; A.blockStart = Date.now(); persist(); render(); window.scrollTo(0, 0); }
      $('#bNext').addEventListener('click', next);
      timer = setInterval(function () { var el = $('#bClock'); if (!el) return; var left = (A.breakUntil - Date.now()) / 1000; el.textContent = core.fmtTime(left); if (left <= 0) next(); }, 500);
    }
    function gradeV() {
      main.innerHTML = '<div class="narrow">' + subHead('Grade your mock', 'Putnam scale: 10 complete · 8–9 minor gap · 1–2 real progress · 0 otherwise. Be strict.') +
        m.problemIds.map(function (pid, k) {
          var p = CP[pid];
          return '<div class="card"><div class="row"><span class="badge">' + (k + 1) + '</span><b>' + esc(p.title) + '</b><span class="spacer"></span><span class="badge tri-' + (A.triage[pid] || 'C') + '">' + (A.triage[pid] || 'C') + '</span></div>' +
            '<details class="reveal"><summary>' + ICONS.book + '<span>Statement & model solution</span><span class="chev" aria-hidden="true">▾</span></summary><div class="rbody"><div class="prompt comp-stmt">' + p.statement + '</div><div class="key">' + ICONS.bulb + '<div><b>Key idea.</b> ' + esc(p.keyIdea) + '</div></div>' + p.solution +
            (p.commonMistakes ? '<h3>Common mistakes</h3><ul>' + p.commonMistakes.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : '') + '</div></details>' +
            '<div class="scale" role="group" aria-label="Score for ' + esc(p.title) + '" data-sc="' + pid + '">' + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(function (v) { return '<button type="button" data-v="' + v + '" aria-pressed="' + (A.scores[pid] === v) + '">' + v + '</button>'; }).join('') + '</div></div>';
        }).join('') + '<div class="row"><button class="btn primary" type="button" id="gSave">Save results</button><span class="muted small" id="gLeft"></span></div></div>';
      function left() { var n = m.problemIds.filter(function (pid) { return A.scores[pid] == null; }).length; $('#gLeft').textContent = n ? n + ' ungraded (counted as 0)' : ''; }
      $all('[data-sc]', main).forEach(function (sg) { var pid = sg.getAttribute('data-sc'); $all('[data-v]', sg).forEach(function (b) { b.addEventListener('click', function () { A.scores[pid] = +b.getAttribute('data-v'); persist(); $all('[data-v]', sg).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); left(); }); }); });
      left();
      $('#gSave').addEventListener('click', function () {
        var r = K.recordMock(id, { scores: A.scores, triage: A.triage });
        A = null;
        main.innerHTML = '<div class="narrow">' + subHead('Mock results', '', '#comp/mocks', 'Mock exams') + resultsCard(r) +
          '<div class="card"><h2>Post-mortem</h2><ul>' + PL.postCompetitionReview.questions.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
          '<div class="row"><a class="btn primary" href="#journal/new?kind=mock&mock=' + id + '">Write the post-mortem</a><a class="btn" href="#comp">Back to today</a></div></div></div>';
        window.scrollTo(0, 0);
      });
    }
    render();
  };
  function resultsCard(r) {
    var m = MOCKS[r.mockId];
    return '<div class="card"><div class="row"><h2 style="margin:0">Last result</h2><span class="spacer"></span><span class="muted small">' + esc(fmtD(r.d, { month: 'short', day: 'numeric', year: 'numeric' })) + '</span></div>' +
      '<div class="big-score" style="font-size:2.6rem">' + r.total + '<span class="muted" style="font-size:1.2rem">/' + r.max + '</span></div>' +
      '<p class="small">Triage audit: you labelled ' + r.aCount + ' problem' + (r.aCount === 1 ? '' : 's') + ' A and solved ' + r.aSolved + ' of them (≥ 8 points).</p>' +
      '<table class="simple"><thead><tr><th>#</th><th>Problem</th><th>Triage</th><th>Score</th></tr></thead><tbody>' + m.problemIds.map(function (pid, k) {
        var sc = r.scores[pid] || 0;
        return '<tr><td>' + (k + 1) + '</td><td><a href="#comp/p/' + pid + '">' + esc(CP[pid].title) + '</a></td><td>' + esc(r.triage[pid] || '—') + '</td><td class="' + (sc >= 8 ? 'res-ok' : sc ? '' : 'res-bad') + '">' + sc + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  /* Post-competition review */
  SUB.review = function (main, compId) {
    if (!COMPS[compId]) { core.go('#comp', true); return; }
    var s = K.season(), prev = s.results[compId] || {};
    var st = { weak: [] };
    main.innerHTML = '<div class="narrow">' + subHead('Post-competition review · ' + compShort(compId), esc(PL.postCompetitionReview.when), '#comp', 'Competitions') +
      '<div class="card"><h2>Steps</h2><ol class="small">' + PL.postCompetitionReview.steps.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol></div>' +
      '<div class="card stack"><h2>How did it go?</h2><div class="rv-grid">' +
      '<label>Problems attempted<input type="number" min="0" id="rvA" value="' + (prev.attempted != null ? prev.attempted : '') + '"></label>' +
      '<label>Solved completely<input type="number" min="0" id="rvS" value="' + (prev.solved != null ? prev.solved : '') + '"></label>' +
      '<label>Score (if known)<input type="number" min="0" id="rvSc" value="' + (prev.score != null ? prev.score : '') + '"></label>' +
      '<label>Rank (if known)<input type="number" min="0" id="rvR" value="' + (prev.rank != null ? prev.rank : '') + '"></label></div>' +
      PL.postCompetitionReview.questions.map(function (x, i) { return '<label class="label" for="rq' + i + '">' + esc(x) + '</label><textarea id="rq' + i + '" rows="2"></textarea>'; }).join('') +
      '<label class="label" for="rvWell">What went well</label><textarea id="rvWell" rows="2"></textarea>' +
      '<label class="label" for="rvLess">Lessons for next season (shown when you set up next season)</label><textarea id="rvLess" rows="2"></textarea>' +
      '<div class="frow"><span class="label">Weak techniques to push into review</span><div id="rvW">' + chips('Weak nodes', K.NODE_LIST.map(function (n) { return [n.id, n.name]; }), st.weak) + '</div></div>' +
      '<div class="row"><button class="btn primary" type="button" id="rvSave">Save review</button></div></div></div>';
    bindChips(main, '#rvW', st.weak);
    $('#rvSave').addEventListener('click', function () {
      function num(id) { var v = $(id).value; return v === '' ? null : +v; }
      var ans = PL.postCompetitionReview.questions.map(function (x, i) { return $('#rq' + i).value.trim(); });
      var rv = { attempted: num('#rvA'), solved: num('#rvS'), score: num('#rvSc'), rank: num('#rvR'), answers: ans, well: $('#rvWell').value.trim(), lessons: $('#rvLess').value.trim(), weakNodes: st.weak.slice() };
      K.saveReview(compId, rv);
      var text = PL.postCompetitionReview.questions.map(function (x, i) { return ans[i] ? '**' + x + '** ' + ans[i] : ''; }).filter(Boolean).join('\n\n') + (rv.well ? '\n\n**What went well:** ' + rv.well : '');
      K.addEntry({ kind: 'review', comp: compId, nodes: rv.weakNodes, text: text, tip: rv.lessons, outcome: rv.solved != null ? rv.solved + ' solved' : null });
      core.toast('Review saved — it seeds next season’s plan.');
      core.go('#comp/progress');
    });
  };

  /* Multi-year progress */
  SUB.progress = function (main) {
    var c = C(), s = K.season(), yoc = s.yearOfCompeting, my = PL.multiYear[Math.min(yoc, 4) - 1];
    var seasons = Object.keys(c.seasons).map(Number).sort();
    var byGroup = K.GROUPS.map(function (g) { var ns = K.NODE_LIST.filter(function (n) { return n.group === g; }); return { g: g, m: ns.reduce(function (a, n) { return a + K.mval(n.id); }, 0) / ns.length, mastered: ns.filter(function (n) { return K.isMastered(n.id); }).length, n: ns.length }; });
    var snap = K.snapshot();
    var html = subHead('Multi-year progress', 'Year ' + yoc + ' of competing · season ' + esc(s.label), '#comp', 'Competitions');
    html += '<div class="tiles"><div class="stat-tile"><div class="v">' + snap.mastered + '<small>/40</small></div><div class="l">Techniques mastered</div></div>' +
      '<div class="stat-tile"><div class="v">' + snap.solved + '<small>/' + K.CP_LIST.length + '</small></div><div class="l">Problems solved</div></div>' +
      '<div class="stat-tile"><div class="v">' + c.mocks.length + '</div><div class="l">Mocks taken</div></div>' +
      '<div class="stat-tile"><div class="v">' + K.J.entries.length + '</div><div class="l">Journal entries</div></div></div>';
    html += '<div class="detail-grid"><div><div class="card"><h2>Year ' + yoc + ' goals (' + esc(my.season) + ' plan)</h2><ul>' + my.goals.map(function (g) { return '<li>' + esc(g) + '</li>'; }).join('') + '</ul>' +
      '<p class="small"><b>QUMC:</b> ' + esc(COMPS.qumc.goalsByYear[K.yearKey(yoc)]) + '</p><p class="small"><b>Putnam:</b> ' + esc(COMPS.putnam.goalsByYear[K.yearKey(yoc)]) + '</p>' +
      '<p class="small muted">Off-season: ' + esc(my.offSeason) + '</p></div>' +
      '<div class="card"><h2>The road ahead</h2><ol class="years">' + PL.multiYear.map(function (y) { return '<li class="' + (y.year === yoc ? 'cur' : y.year < yoc ? 'past' : '') + '"><b>Year ' + y.year + ' · ' + esc(y.season) + '</b><br><span class="small">' + esc(y.goals[0]) + '</span></li>'; }).join('') + '</ol></div></div>' +
      '<div><div class="card"><h2>Mastery by area</h2>' + byGroup.map(function (x) { return '<div class="bar-row"><span class="bn">' + esc(GROUP_SHORT[x.g]) + '</span><div class="bar"><div style="width:' + Math.max(2, x.m * 100) + '%"></div></div><span class="pct">' + x.mastered + '/' + x.n + '</span></div>'; }).join('') + '</div>' +
      '<div class="card"><h2>Seasons</h2><div class="table-scroll"><table class="simple"><thead><tr><th>Season</th><th>QUMC</th><th>Putnam</th><th>Mastered</th></tr></thead><tbody>' + seasons.map(function (y) {
        var se = c.seasons[y], r = se.results || {};
        function cell(id) { var x = r[id]; return x ? (x.score != null ? x.score + ' pts' : x.solved != null ? x.solved + ' solved' : 'done') + (x.rank ? ' · #' + x.rank : '') : (se.dates[id] < today() ? (se.reviewDone[id] ? 'reviewed' : '<a href="#comp/review/' + id + '">review</a>') : '—'); }
        return '<tr><td><b>' + esc(se.label) + '</b><div class="small muted">year ' + se.yearOfCompeting + (se.archived ? ' · archived' : ' · current') + '</div></td><td>' + cell('qumc') + '</td><td>' + cell('putnam') + '</td><td>' + (se.snapshot ? se.snapshot.mastered : snap.mastered) + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      (c.diag && c.diag.done ? '<p class="small">Diagnostic: ' + c.diag.total + '/24 on ' + esc(fmtD(c.diag.d)) + ' (' + esc(placementText(c.diag.placement)) + ').</p>' : '<p class="small"><a href="#comp/diag">Take the placement diagnostic</a></p>') + '</div></div></div>';
    main.innerHTML = html;
  };

  /* ------------------------------------------------------------------ */
  /* Journal                                                             */
  /* ------------------------------------------------------------------ */
  var KIND_NAME = K.KIND_NAME;
  VIEWS.journal = function (main, args) {
    K.ensureSeason();
    var sub = base(args[0] || ''), q = argsQuery(args);
    if (sub === 'new') return jNew(main, q);
    if (sub === 'tips') return jTips(main);
    if (sub === 'e') return jEntry(main, base(args[1] || ''));
    jList(main, q);
  };
  function entryCard(e) {
    var title = K.entryTitle(e);
    var snippet = (e.insight || e.text || e.stuck || '').replace(/\*\*/g, '');
    return '<li class="jentry' + (e.pinned ? ' pinned' : '') + '"><a href="#journal/e/' + e.id + '"><div class="row"><span class="cdate">' + esc(fmtD(e.date, { month: 'short', day: 'numeric' })) + '</span><span class="badge">' + esc(KIND_NAME[e.kind] || e.kind) + '</span>' +
      (e.comp ? '<span class="badge">' + compShort(e.comp) + '</span>' : '') + (e.outcome ? '<span class="badge">' + esc(e.outcome) + '</span>' : '') + '<span class="spacer"></span>' + (e.pinned ? '<span class="pinic">' + ICONS.pin + '</span>' : '') + '</div>' +
      '<b class="jt">' + esc(title) + '</b>' + (snippet ? '<span class="js">' + esc(snippet.slice(0, 160)) + (snippet.length > 160 ? '…' : '') + '</span>' : '') +
      (e.tip ? '<span class="jtip"><b>Tip:</b> ' + esc(e.tip) + '</span>' : '') +
      ((e.nodes || []).length ? '<span class="jn">' + e.nodes.slice(0, 3).map(function (n) { return '<span class="badge">' + esc(nodeName(n)) + '</span>'; }).join('') + '</span>' : '') + '</a></li>';
  }
  function jList(main, q) {
    var f = { q: q.q || '', kind: q.kind || '', season: q.season || '' };
    var seasons = {}; K.J.entries.forEach(function (e) { seasons[e.season] = 1; });
    var u = K.storageUsage();
    main.innerHTML = '<div class="page-head"><div><h1>Journal</h1><p class="muted">Your thinking log: reflections, mistakes, tips to future you. ' + K.J.entries.length + ' entries.</p></div>' +
      '<div class="row"><a class="btn primary" href="#journal/new?kind=free">' + ICONS.edit + ' New entry</a><a class="btn" href="#journal/tips">' + ICONS.pin + ' Tips</a></div></div>' +
      '<div class="row" style="margin-bottom:1rem"><a class="btn sm" href="#journal/new?kind=daily">Daily reflection</a><a class="btn sm" href="#journal/new?kind=session">End of session</a><a class="btn sm" href="#journal/new?kind=compday">Competition-day log</a></div>' +
      '<div class="card filters-inline"><label class="search"><span class="sr-only">Search journal</span>' + ICONS.search + '<input type="search" id="jq" placeholder="Search notes, tips, problems…" value="' + esc(f.q) + '" autocomplete="off"></label>' +
      '<div class="chips scroll" id="jk">' + [['', 'All']].concat(Object.keys(KIND_NAME).map(function (k) { return [k, KIND_NAME[k]]; })).map(function (o) { return '<button type="button" class="chip" data-k="' + o[0] + '" aria-pressed="' + (f.kind === o[0]) + '">' + esc(o[1]) + '</button>'; }).join('') + '</div>' +
      (Object.keys(seasons).length > 1 ? '<select id="js" aria-label="Season"><option value="">All seasons</option>' + Object.keys(seasons).sort().reverse().map(function (s) { return '<option' + (f.season === s ? ' selected' : '') + '>' + esc(s) + '</option>'; }).join('') + '</select>' : '') + '</div>' +
      '<div id="jlist"></div>' +
      '<div class="card"><h2>Export</h2><p class="muted small">Markdown with YAML front-matter (date, problem, nodes, competition, season, tags) for Obsidian. The journal is also included in Settings → Export progress (JSON).</p>' +
      '<div class="row"><button class="btn" type="button" id="jmd">' + ICONS.download + ' Single .md file</button><button class="btn" type="button" id="jzip">' + ICONS.download + ' .zip (one note per entry)</button></div>' +
      '<p class="small ' + (u.near ? 'res-bad' : 'muted') + '" style="margin:.6rem 0 0">Storage used: ' + Math.round(u.chars / 1024) + ' K of ~5 M characters' + (u.near ? ' — getting full: export and prune old entries.' : '.') + '</p></div>';
    function render() {
      var list = K.searchJ(f.q, { kind: f.kind, season: f.season });
      if (!list.length) { $('#jlist').innerHTML = '<div class="card empty">' + ICONS.journal + '<h2>' + (K.J.entries.length ? 'No entries match' : 'Your journal is empty') + '</h2><p class="muted">' + (K.J.entries.length ? 'Try another search.' : 'Reflections are offered after each competition problem. You can also write a free note anytime.') + '</p></div>'; return; }
      var groups = {}, order = [];
      list.forEach(function (e) { var key = e.season + '|' + e.date.slice(0, 7); if (!groups[key]) { groups[key] = []; order.push(key); } groups[key].push(e); });
      $('#jlist').innerHTML = order.map(function (k) {
        var p = k.split('|');
        return '<h3 class="week-h">' + esc(core.parseYmd(p[1] + '-01').toLocaleDateString(undefined, { month: 'long', year: 'numeric' })) + ' <span class="muted small">· season ' + esc(p[0]) + '</span></h3><ul class="jlist">' + groups[k].map(entryCard).join('') + '</ul>';
      }).join('');
    }
    $('#jq').addEventListener('input', function (e) { f.q = e.target.value; render(); });
    $all('#jk [data-k]', main).forEach(function (b) { b.addEventListener('click', function () { f.kind = b.getAttribute('data-k'); $all('#jk [data-k]', main).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); render(); }); });
    var js = $('#js'); if (js) js.addEventListener('change', function () { f.season = js.value; render(); });
    $('#jmd').addEventListener('click', function () { K.download(new Blob([K.journalMarkdown()], { type: 'text/markdown' }), 'stat-brainteaser-journal-' + today() + '.md'); core.toast('Journal exported (Markdown).'); });
    $('#jzip').addEventListener('click', function () { K.download(K.journalZip(), 'stat-brainteaser-journal-' + today() + '.zip'); core.toast('Journal exported (zip of notes).'); });
    render();
  }
  function jTips(main) {
    var f = { node: '', comp: '', season: '' };
    var withTips = K.J.entries.filter(function (e) { return e.tip; });
    var nodes = {}, seasons = {};
    withTips.forEach(function (e) { (e.nodes || []).forEach(function (n) { nodes[n] = 1; }); seasons[e.season] = 1; });
    main.innerHTML = subHead('Tips library', 'Every “tip to future me” you wrote. Pinned tips appear before mocks and contests.', '#journal', 'Journal') +
      '<div class="card filters-inline"><div class="row">' +
      '<select id="tn" aria-label="Technique"><option value="">All techniques</option>' + Object.keys(nodes).sort().map(function (n) { return '<option value="' + n + '">' + esc(nodeName(n)) + '</option>'; }).join('') + '</select>' +
      '<select id="tc" aria-label="Competition"><option value="">All competitions</option><option value="qumc">QUMC</option><option value="putnam">Putnam</option></select>' +
      '<select id="ts" aria-label="Season"><option value="">All seasons</option>' + Object.keys(seasons).sort().reverse().map(function (s) { return '<option>' + esc(s) + '</option>'; }).join('') + '</select></div></div><ul class="tips" id="tlist"></ul>';
    function render() {
      var list = withTips.filter(function (e) { return (!f.node || (e.nodes || []).indexOf(f.node) >= 0) && (!f.comp || e.comp === f.comp) && (!f.season || e.season === f.season); })
        .sort(function (a, b) { return (b.pinned - a.pinned) || (b.t - a.t); });
      $('#tlist').innerHTML = list.length ? list.map(function (e) {
        return '<li class="tip' + (e.pinned ? ' pinned' : '') + '"><button type="button" class="pinbtn" data-pin="' + e.id + '" aria-pressed="' + !!e.pinned + '" aria-label="' + (e.pinned ? 'Unpin' : 'Pin') + ' tip">' + ICONS.pin + '</button>' +
          '<div><p>' + esc(e.tip) + '</p><span class="muted small">' + esc(fmtD(e.date, { month: 'short', day: 'numeric', year: 'numeric' })) + (e.problemTitle ? ' · <a href="' + (CP[e.problemId] ? '#comp/p/' + e.problemId : '#journal/e/' + e.id) + '">' + esc(e.problemTitle) + '</a>' : '') +
          ((e.nodes || []).length ? ' · ' + e.nodes.slice(0, 2).map(nodeName).map(esc).join(', ') : '') + '</span></div></li>';
      }).join('') : '<li class="card empty">' + ICONS.pin + '<h2>No tips yet</h2><p class="muted">Write a “tip to future me” in any reflection and it lands here.</p></li>';
      $all('[data-pin]', main).forEach(function (b) { b.addEventListener('click', function () { var e = K.getEntry(b.getAttribute('data-pin')); K.updateEntry(e.id, { pinned: !e.pinned }); render(); }); });
    }
    $('#tn').addEventListener('change', function (e) { f.node = e.target.value; render(); });
    $('#tc').addEventListener('change', function (e) { f.comp = e.target.value; render(); });
    $('#ts').addEventListener('change', function (e) { f.season = e.target.value; render(); });
    K.toggleDone('tips@' + today(), true);
    render();
  }
  var KIND_PROMPTS = {
    free: ['Anything worth remembering?'],
    daily: ['What did I learn today?', 'What will I do tomorrow?'],
    session: ['What worked in this session?', 'What will I change next time?'],
    compday: ['How did the triage go?', 'Problem by problem: what did I try, where did I stop?', 'How do I feel right now?'],
    mock: ['Which signal in a statement should have triggered the right technique?', 'Where did the time go?', 'What will I do differently on the day?'],
    review: ['What went well?', 'What will I change?']
  };
  function jNew(main, q) {
    var kind = q.kind || 'free';
    if (kind === 'problem' && q.qp) {
      // reflection after a quant problem
      var qp0 = (window.PROBLEMS || []).filter(function (x) { return x.id === q.qp; })[0];
      main.innerHTML = '<div class="narrow">' + subHead('Reflection', qp0 ? esc(qp0.title) : '', '#journal', 'Journal') + '<div id="rb"></div></div>';
      reflectionSheet($('#rb'), { problemId: null, problemTitle: qp0 ? qp0.title : q.qp, nodes: [], outcome: q.ok === '1' ? 'solved' : 'failed', kind: 'problem', src: 'quant' }, function () { setTimeout(function () { history.back(); }, 600); });
      return;
    }
    var prompts = KIND_PROMPTS[kind] || KIND_PROMPTS.free;
    var st = { mistakes: [], pinned: false, kind: kind, comp: q.comp || (kind === 'compday' ? (nextTargets().filter(function (x) { return x.date <= today(); }).slice(-1)[0] || {}).id : '') || '', node: q.node || '' };
    main.innerHTML = '<div class="narrow">' + subHead('New journal entry', '', '#journal', 'Journal') + '<div class="card stack">' +
      '<div class="frow"><span class="label">Kind</span>' + seg('Kind', [['free', 'Free note'], ['daily', 'Daily'], ['session', 'Session'], ['compday', 'Competition day'], ['mock', 'Mock']], kind).replace('class="seg"', 'class="seg" id="nk"') + '</div>' +
      prompts.map(function (p, i) { return '<label class="label" for="np' + i + '">' + esc(p) + '</label><textarea id="np' + i + '" rows="' + (i === 0 ? 3 : 2) + '"></textarea>'; }).join('') +
      '<div class="frow"><span class="label">Mistake types (optional)</span><div id="nm">' + chips('Mistakes', MISTAKES, st.mistakes) + '</div></div>' +
      '<div class="rv-grid"><label>Technique<select id="nn"><option value="">—</option>' + K.NODE_LIST.map(function (n) { return '<option value="' + n.id + '"' + (st.node === n.id ? ' selected' : '') + '>' + esc(n.name) + '</option>'; }).join('') + '</select></label>' +
      '<label>Competition<select id="nc"><option value="">—</option><option value="qumc"' + (st.comp === 'qumc' ? ' selected' : '') + '>QUMC</option><option value="putnam"' + (st.comp === 'putnam' ? ' selected' : '') + '>Putnam</option></select></label></div>' +
      '<label class="label" for="ntip">Tip to future me</label><input type="text" id="ntip" placeholder="One sentence you want to read before the next contest">' +
      '<label class="check"><input type="checkbox" id="npin"> Pin this tip</label>' +
      '<div class="row"><button class="btn primary" type="button" id="nsave">Save entry</button><a class="btn ghost" href="#journal">Cancel</a></div></div></div>';
    bindSeg(main, '#nk', function (v) { core.go('#journal/new?kind=' + v + (q.comp ? '&comp=' + q.comp : '') + (q.node ? '&node=' + q.node : '') + (q.mock ? '&mock=' + q.mock : ''), true); });
    bindChips(main, '#nm', st.mistakes);
    $('#nsave').addEventListener('click', function () {
      var parts = prompts.map(function (p, i) { var v = $('#np' + i).value.trim(); return v ? (prompts.length > 1 ? '**' + p + '** ' : '') + v : ''; }).filter(Boolean);
      var tip = $('#ntip').value.trim();
      if (!parts.length && !tip) { core.toast('Write something first (or Cancel).'); return; }
      var node = $('#nn').value;
      var mock = q.mock && MOCKS[q.mock] ? MOCKS[q.mock] : null;
      var e = K.addEntry({ kind: kind, text: parts.join('\n\n'), tip: tip, pinned: $('#npin').checked, mistakes: st.mistakes.slice(), nodes: node ? [node] : [], comp: $('#nc').value || (mock ? mock.competition : null), prompt: prompts.join(' / '), problemTitle: mock ? mock.name : null });
      if (mock) K.toggleDone('mockreview:' + q.mock, true);
      core.toast('Saved to your journal.');
      core.go('#journal/e/' + e.id, true);
    });
  }
  function jEntry(main, id) {
    var e = K.getEntry(id);
    if (!e) { main.innerHTML = subHead('Entry not found', '', '#journal', 'Journal'); return; }
    function field(l, v) { return v ? '<h3>' + esc(l) + '</h3><p>' + esc(v).replace(/\n/g, '<br>') + '</p>' : ''; }
    main.innerHTML = '<div class="narrow">' + subHead(esc(K.entryTitle(e)), esc(fmtD(e.date, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })) + ' · ' + esc(KIND_NAME[e.kind] || e.kind) + ' · season ' + esc(e.season), '#journal', 'Journal') +
      '<div class="card">' + '<div class="row">' + (e.comp ? '<span class="badge">' + compShort(e.comp) + '</span>' : '') + (e.outcome ? '<span class="badge">' + esc(e.outcome) + '</span>' : '') + (e.confidence ? '<span class="badge">confidence ' + e.confidence + '/5</span>' : '') +
      (e.minutes ? '<span class="badge">' + e.minutes + ' min</span>' : '') + (e.nodes || []).map(function (n) { return '<a class="badge" href="#comp/node/' + n + '">' + esc(nodeName(n)) + '</a>'; }).join('') + '</div>' +
      (e.problemId && CP[e.problemId] ? '<p class="small"><a href="#comp/p/' + e.problemId + '">Open the problem</a></p>' : '') +
      (e.prompt && e.kind === 'problem' ? '<p class="rprompt">' + esc(e.prompt) + '</p>' : '') +
      field('Key insight', e.insight) + field('Approach tried', (e.approaches || []).join(', ')) + field('Where I got stuck', e.stuck) + field('Mistake type', (e.mistakes || []).join(', ')) +
      (e.text ? '<div class="jtext">' + esc(e.text).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>') + '</div>' : '') +
      '<label class="label" for="etip">Tip to future me</label><input type="text" id="etip" value="' + esc(e.tip || '') + '">' +
      '<label class="check"><input type="checkbox" id="epin"' + (e.pinned ? ' checked' : '') + '> Pinned (shown before mocks and contests)</label>' +
      '<label class="label" for="etext">Notes</label><textarea id="etext" rows="4">' + esc(e.text || '') + '</textarea>' +
      '<div class="row"><button class="btn primary" type="button" id="esave">Save changes</button><button class="btn" type="button" id="emd">' + ICONS.download + ' .md</button><span class="spacer"></span><button class="btn danger" type="button" id="edel">Delete</button></div></div></div>';
    $('#esave').addEventListener('click', function () { K.updateEntry(id, { tip: $('#etip').value.trim(), pinned: $('#epin').checked, text: $('#etext').value }); core.toast('Saved.'); jEntry(main, id); });
    $('#edel').addEventListener('click', function () { if (confirm('Delete this journal entry?')) { K.deleteEntry(id); core.go('#journal', true); } });
    $('#emd').addEventListener('click', function () { K.download(new Blob([K.entryToMd(e)], { type: 'text/markdown' }), K.entryFileName(e)); });
  }
});
