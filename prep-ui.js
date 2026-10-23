/* Stat Brainteaser — interview-prep views: Topics (#topics, #topic/<cat>), Firm prep (#firms, #firm/<id>),
 * Interview plan (#prep, #prep/setup), Superday mock (#superday, #superday/stamina), the Home "Today" card,
 * and the problem/firm notes section of the journal. Logic lives in prep.js. */
(window.SBT_PLUGINS = window.SBT_PLUGINS || []).push(function (core) {
  'use strict';
  var P = window.SBT_PREP;
  if (!P) return;
  var D = P.D, C = P.C, FIRMS = P.FIRMS;
  var esc = core.esc, $ = core.$, $all = core.$all, ICONS = core.ICONS, VIEWS = core.VIEWS;
  var BY_ID = core.BY_ID, PROBLEMS = core.PROBLEMS, CAT = core.CAT;
  var TOPICS = window.SBT_TOPICS || {};
  if (!ICONS.edit) ICONS.edit = core.svg('<path d="M4 20h4L19 9l-4-4L4 16z"/>');
  if (!ICONS.flag) ICONS.flag = core.svg('<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>');
  function today() { return core.today(); }
  core.TITLES.topics = 'Topics'; core.TITLES.topic = 'Topic'; core.TITLES.firms = 'Firm prep'; core.TITLES.firm = 'Firm';
  core.TITLES.prep = 'Interview plan'; core.TITLES.superday = 'Superday mock';

  function head(title, desc, back, backLabel, actions) {
    return '<div class="page-head"><div>' + (back ? '<a class="back-link" href="' + back + '">' + ICONS.left + ' ' + esc(backLabel || 'Back') + '</a>' : '') +
      '<h1>' + title + '</h1>' + (desc ? '<p class="muted">' + desc + '</p>' : '') + '</div>' + (actions ? '<div class="row">' + actions + '</div>' : '') + '</div>';
  }
  function fmtD(d, o) { return core.parseYmd(d).toLocaleDateString(undefined, o || { weekday: 'short', month: 'short', day: 'numeric' }); }
  function fmtMin(m) { return m >= 60 ? Math.floor(m / 60) + ' h' + (m % 60 ? ' ' + (m % 60) + ' min' : '') : m + ' min'; }
  function inDays(d) { var n = P.daysBetween(today(), d); return n < 0 ? -n + ' days ago' : n === 0 ? 'today' : n === 1 ? 'tomorrow' : 'in ' + n + ' days'; }
  function arcadeGames() {
    var A = window.SBT_ARCADE;
    if (A && Array.isArray(A.games) && A.games.length) return A.games;
    return Object.keys(D.arcade).map(function (id) { return { id: id, name: D.arcade[id].name, desc: D.arcade[id].desc, skills: [], firms: [], fallback: true }; });
  }
  function arcadeOk() { var A = window.SBT_ARCADE; return !!(A && Array.isArray(A.games)); }
  function arcadeLink(id) {
    return '<a class="fmt-chip" href="' + P.arcadeHref(id) + '">' + ICONS.joystick + '<span>' + esc(P.arcadeName(id)) + '</span></a>';
  }
  function firmLink(f) { return '<a class="fmt-chip" href="#firm/' + f.id + '">' + ICONS.building + '<span>' + esc(f.name) + '</span></a>'; }
  function catChip(c) { return '<a class="fmt-chip" href="#topic/' + c + '" style="--cat: var(--c-' + c + ')"><span class="cdot"></span><span>' + esc(core.catName(c)) + '</span></a>'; }

  /* ------------------------------------------------------------------ */
  /* Topics                                                              */
  /* ------------------------------------------------------------------ */
  VIEWS.topics = function (main) {
    var html = head('Topics', 'Every category with mini-lessons, books, the interview formats that use it, and your progress.', '#practice', 'Practice');
    core.GROUPS.forEach(function (g) {
      var cs = core.CATS.filter(function (c) { return c.group === g.id && core.catStats(c.id).total; });
      if (!cs.length) return;
      html += '<section class="group"><div class="group-head"><h2>' + esc(g.name) + '</h2><p class="muted small">' + esc(g.desc) + '</p></div><div class="topics">' + cs.map(function (c) {
        var st = core.catStats(c.id), frac = st.total ? st.solved / st.total : 0, T = TOPICS[c.id] || {};
        return '<a class="topic" href="#topic/' + c.id + '" style="--cat: var(--c-' + c.id + ')"><span class="ticon">' + ICONS[c.icon] + '</span><span class="tbody"><span class="tname">' + esc(c.name) + '</span>' +
          '<span class="tmeta">' + esc(T.desc || (st.total + ' problems')) + '</span>' +
          '<span class="tbar" role="img" aria-label="' + Math.round(frac * 100) + '% solved"><span style="width:' + (frac * 100) + '%"></span></span></span></a>';
      }).join('') + '</div></section>';
    });
    main.innerHTML = html;
  };

  VIEWS.topic = function (main, args) {
    var cat = (args[0] || '').split('?')[0];
    var c = CAT[cat];
    if (!c || !core.catStats(cat).total) { main.innerHTML = head('Topic not found', '', '#topics', 'Topics'); return; }
    var T = TOPICS[cat] || { desc: '', cards: [] };
    var st = core.catStats(cat);
    var list = PROBLEMS.filter(function (p) { return p.cat === cat; });
    var byDiff = [1, 2, 3].map(function (d) { var l = list.filter(function (p) { return p.diff === d; }); return { d: d, n: l.length, k: l.filter(function (p) { return core.status(p.id) === 'solved'; }).length }; });
    var firms = D.firms.filter(function (f) { return f.topics.indexOf(cat) >= 0; });
    var games = (D.arcadeForCat[cat] || []).slice();
    arcadeGames().forEach(function (g) { if ((g.skills || []).indexOf(cat) >= 0 && games.indexOf(g.id) < 0) games.push(g.id); });
    var books = (D.booksForCat[cat] || []).map(function (b) { return D.books[b]; }).filter(Boolean);
    var styleCount = {};
    list.forEach(function (p) { core.pStyles(p).forEach(function (s) { styleCount[s] = (styleCount[s] || 0) + 1; }); });
    var counts = core.statusCounts(list);
    var html = head('<span class="ticon inline" style="--cat: var(--c-' + cat + ')">' + ICONS[c.icon] + '</span>' + esc(c.name), esc(T.desc || ''), '#topics', 'Topics',
      '<button class="btn primary" type="button" id="tpStart">' + ICONS.play + ' Practice ' + esc(c.short) + '</button><a class="btn" href="' + core.practiceHash({ cats: [cat] }) + '">Filter list</a>');
    html += '<div class="topic-grid"><div class="topic-main">';
    html += '<section aria-label="Concept cards"><h2 class="label">Concept cards</h2><div class="concepts">' + (T.cards || []).map(function (k, i) {
      return '<article class="card concept"><div class="cn-head"><span class="cn-num">' + (i + 1) + '</span><h3>' + k.title + '</h3></div>' +
        '<div class="cn-row cn-formula"><span class="label">Key formula</span><p>' + k.formula + '</p></div>' +
        '<div class="cn-row"><span class="label">Worked micro-example</span><p>' + k.example + '</p></div>' +
        '<div class="cn-row cn-trap"><span class="label">Common trap</span><p>' + k.trap + '</p></div></article>';
    }).join('') + '</div></section>';
    html += '<section class="card"><div class="row"><h2 style="margin:0">Problems</h2><span class="spacer"></span><span class="muted small">' + st.solved + '/' + st.total + ' solved</span></div>' +
      '<div class="table-scroll"><table class="simple ptable"><thead><tr><th></th><th>Problem</th><th>Level</th><th class="hide-sm">Format</th></tr></thead><tbody>' + list.map(function (p, i) {
        return '<tr><td>' + core.statusIcon(core.status(p.id)) + '</td><td><button type="button" class="linkbtn" data-i="' + i + '">' + esc(p.title) + '</button></td><td>' + core.diffDots(p.diff) + '</td><td class="hide-sm small muted">' + esc(core.pStyles(p).map(core.styleName).join(', ')) + '</td></tr>';
      }).join('') + '</tbody></table></div></section>';
    html += '</div><aside class="topic-side">';
    html += '<div class="card"><h2>Progress</h2>' + byDiff.map(function (r) {
      return '<div class="bar-row" style="--cat: var(--c-' + cat + ')"><span class="bn">' + core.DIFF_NAME[r.d] + '</span><div class="bar" role="img" aria-label="' + r.k + ' of ' + r.n + '"><div style="width:' + (r.n ? r.k / r.n * 100 : 0) + '%"></div></div><span class="pct">' + r.k + '/' + r.n + '</span></div>';
    }).join('') + '<p class="small muted" style="margin:.5rem 0 0">' + core.STATUS_LIST.filter(function (s) { return counts[s]; }).map(function (s) { return core.STATUS_NAME[s] + ' ' + counts[s]; }).join(' · ') + (st.acc !== null ? ' · accuracy ' + core.pct(st.acc) : '') + '</p></div>';
    html += '<div class="card"><h2>Formats that use this</h2>' +
      (Object.keys(styleCount).length ? '<p class="small">' + Object.keys(styleCount).sort(function (a, b) { return styleCount[b] - styleCount[a]; }).map(function (s) { return '<a class="badge style" href="' + core.practiceHash({ cats: [cat], styles: [s] }) + '">' + esc(core.styleName(s)) + ' · ' + styleCount[s] + '</a>'; }).join(' ') + '</p>' : '') +
      (firms.length ? '<span class="label">Firm processes</span><div class="fmt-chips">' + firms.map(firmLink).join('') + '</div>' : '') +
      (games.length ? '<span class="label">Arcade drills</span><div class="fmt-chips">' + games.map(arcadeLink).join('') + '</div>' : '') +
      '</div>';
    html += '<div class="card"><h2>Recommended books</h2>' + (books.length ? '<ul class="books">' + books.map(function (b) { return '<li><b>' + esc(b.t) + '</b> <span class="muted">— ' + esc(b.a) + '</span><br><span class="small muted">' + esc(b.why) + '</span></li>'; }).join('') + '</ul>' : '<p class="muted small">Best learned by doing: the problems here plus the official docs.</p>') + '</div>';
    if (core.runHtmlHooks) html += core.runHtmlHooks(core.HOOKS.topicCards || [], cat);
    html += '</aside></div>';
    main.innerHTML = html;
    $('#tpStart').addEventListener('click', function () { core.startTopic(cat); });
    $all('.ptable [data-i]', main).forEach(function (b) {
      b.addEventListener('click', function () { core.startSession(list.map(function (p) { return p.id; }), c.name, +b.getAttribute('data-i'), false, { kind: 'list', back: '#topic/' + cat }); });
    });
  };

  /* ------------------------------------------------------------------ */
  /* Firm prep                                                           */
  /* ------------------------------------------------------------------ */
  VIEWS.firms = function (main) {
    main.innerHTML = head('Firm prep', 'How each firm’s process usually runs, what each round tests, and a checklist to get ready. Notes written ' + D.notesDate + '.', '#practice', 'Practice') +
      '<div class="banner"><p class="small">' + esc(D.disclaimer) + '</p></div>' +
      '<div class="firm-grid">' + D.firms.map(function (f) {
        var pr = P.firmProgress(f.id), target = C().setup && C().setup.firm === f.id;
        return '<a class="card firm-card" href="#firm/' + f.id + '"><div class="row"><span class="ticon sm">' + ICONS.building + '</span><b>' + esc(f.name) + '</b>' + (target ? '<span class="badge ok">your target</span>' : '') + '</div>' +
          '<span class="muted small">' + esc(f.kind) + ' · ' + f.rounds.length + ' stages</span><p class="small">' + esc(f.summary) + '</p>' +
          '<div class="tbar" role="img" aria-label="Checklist ' + pr.k + ' of ' + pr.n + '"><span style="width:' + (pr.n ? pr.k / pr.n * 100 : 0) + '%;--cat:var(--ok)"></span></div><span class="muted small">Checklist ' + pr.k + '/' + pr.n + '</span></a>';
      }).join('') + '</div>';
  };
  VIEWS.firm = function (main, args) {
    var f = FIRMS[(args[0] || '').split('?')[0]];
    if (!f) { main.innerHTML = head('Firm not found', '', '#firms', 'Firm prep'); return; }
    var fs = P.firmState(f.id);
    var set = P.firmSet(f.id, 10);
    var drills = f.arcade.slice();
    arcadeGames().forEach(function (g) {
      var fl = (g.firms || []).map(function (x) { return String(x).toLowerCase(); });
      if ((fl.indexOf(f.id) >= 0 || fl.indexOf(f.name.toLowerCase()) >= 0) && !drills.some(function (x) { return x.split('/')[0] === g.id; })) drills.push(g.id);
    });
    var html = head(esc(f.name), esc(f.kind) + ' · ' + esc(f.summary), '#firms', 'Firm prep',
      '<button class="btn primary" type="button" id="fmSet"' + (set.length ? '' : ' disabled') + '>' + ICONS.play + ' Practice set (' + set.length + ')</button><a class="btn" href="#superday?firm=' + f.id + '">' + ICONS.mic + ' Superday mock</a>');
    html += '<div class="detail-grid"><div>';
    html += '<div class="card"><h2>Process</h2><ol class="timeline">' + f.rounds.map(function (r, i) {
      return '<li><span class="tl-dot">' + (i + 1) + '</span><div><b>' + esc(r.n) + '</b><p class="small">' + esc(r.t) + '</p></div></li>';
    }).join('') + '</ol>' + (f.roleNotes ? '<p class="small muted">' + esc(f.roleNotes) + '</p>' : '') +
      '<p class="small muted disclaimer">' + ICONS.flag + ' Notes written ' + D.notesDate + '. ' + esc(D.disclaimer) + '</p></div>';
    html += '<div class="card"><div class="row"><h2 style="margin:0">Prep checklist</h2><span class="spacer"></span><span class="muted small" id="fmCk"></span></div><ul class="tasks">' + f.checklist.map(function (item, i) {
      var done = !!fs.check[i];
      return '<li class="task' + (done ? ' done' : '') + '"><button type="button" class="tick" data-ck="' + i + '" aria-pressed="' + done + '" aria-label="' + (done ? 'Untick' : 'Tick') + ': ' + esc(item) + '">' + (done ? ICONS.check : '') + '</button><span class="tl">' + esc(item) + '</span></li>';
    }).join('') + '</ul></div>';
    html += '</div><div>';
    html += '<div class="card"><h2>Recommended topics</h2><div class="fmt-chips">' + f.topics.filter(function (c) { return CAT[c] && core.catStats(c).total; }).map(catChip).join('') + '</div>' +
      '<span class="label">Interview formats</span><p class="small">' + f.styles.map(function (s) { return '<a class="badge style" href="' + core.practiceHash({ styles: [s] }) + '">' + esc(core.styleName(s)) + '</a>'; }).join(' ') + '</p>' +
      (drills.length ? '<span class="label">Arcade drills</span><div class="fmt-chips">' + drills.map(arcadeLink).join('') + '</div>' + (arcadeOk() ? '' : '<p class="muted small">The arcade module isn’t loaded on this device yet.</p>') : '') + '</div>';
    html += '<div class="card"><h2>Practice set</h2><p class="muted small">Problems in this firm’s formats and topics, unsolved first, mixed across topics.</p><ol class="mini-list">' + set.map(function (id) {
      var p = BY_ID[id]; return '<li>' + core.statusIcon(core.status(id)) + '<span>' + esc(p.title) + ' <span class="muted small">· ' + esc(core.catName(p.cat)) + '</span></span></li>';
    }).join('') + '</ol></div>';
    html += '<div class="card"><h2>My notes on ' + esc(f.name) + '</h2><label class="sr-only" for="fmNotes">Notes</label><textarea id="fmNotes" rows="5" placeholder="Recruiter contacts, what the rounds looked like for you, questions to ask…">' + esc(fs.notes.text || '') + '</textarea><p class="muted small" id="fmSaved" style="margin:.4rem 0 0">Private; exported with your progress and your journal.</p></div>';
    if (core.runHtmlHooks) html += core.runHtmlHooks(core.HOOKS.firmCards || [], f.id);
    html += '</div></div>';
    main.innerHTML = html;
    function ck() { var pr = P.firmProgress(f.id); $('#fmCk').textContent = pr.k + '/' + pr.n + ' done'; }
    ck();
    $all('[data-ck]', main).forEach(function (b) {
      b.addEventListener('click', function () {
        var i = b.getAttribute('data-ck'), on = b.getAttribute('aria-pressed') !== 'true';
        if (on) fs.check[i] = today(); else delete fs.check[i];
        core.save();
        b.setAttribute('aria-pressed', String(on)); b.innerHTML = on ? ICONS.check : ''; b.closest('.task').classList.toggle('done', on); ck();
      });
    });
    var nt = null, ta = $('#fmNotes');
    ta.addEventListener('input', function () { clearTimeout(nt); nt = setTimeout(function () { fs.notes = { text: ta.value, t: Date.now() }; core.save(); $('#fmSaved').textContent = 'Saved.'; }, 350); });
    core.onCleanup(function () { if (nt) { clearTimeout(nt); fs.notes = { text: ta.value, t: Date.now() }; core.save(); } });
    $('#fmSet').addEventListener('click', function () { core.startSession(set, f.name + ' practice set', 0, false, { kind: 'set', back: '#firm/' + f.id }); });
  };

  /* ------------------------------------------------------------------ */
  /* Interview plan                                                      */
  /* ------------------------------------------------------------------ */
  function taskHref(t) { return (t.type === 'topic' || t.type === 'code') ? '#prep/go/' + encodeURIComponent(t.k) : (t.href || ''); }
  function taskRow(t, day) {
    var done = P.isDone(t, day), extra = '';
    if (t.type === 'topic') { var pr = P.topicProgress(t, day); extra = ' <span class="muted small">· ' + pr.n + '/' + pr.of + ' tried</span>'; }
    var badgeV21 = { mockiv: 'Mock interview', code: 'Coding', micro: 'Microstructure', read: 'Reading', lesson: 'Learn' };
    var href = taskHref(t);
    var badge = { math: 'Mental maths', topic: 'Topic', format: 'Format', review: 'Review', mock: 'Mock', stamina: 'Stamina', stories: 'Stories' }[t.type] || badgeV21[t.type] || '';
    return '<li class="task' + (done ? ' done' : '') + '"><button type="button" class="tick" data-ptick="' + esc(t.k) + '" aria-pressed="' + done + '" aria-label="' + (done ? 'Mark not done' : 'Mark done') + ': ' + esc(t.label) + '">' + (done ? ICONS.check : '') + '</button>' +
      '<span class="tl"><span class="slot slot-' + t.type + '">' + badge + '</span> ' + esc(t.label) + (t.min ? ' <span class="muted small">· ' + fmtMin(t.min) + '</span>' : '') + extra + '</span>' +
      (href ? '<a class="btn sm' + (done ? ' ghost' : '') + '" href="' + esc(href) + '">' + (done ? 'Open' : 'Go') + '</a>' : '') + '</li>';
  }
  function bindPTicks(root, rerender) {
    $all('[data-ptick]', root).forEach(function (b) {
      b.addEventListener('click', function () { P.toggleDone(b.getAttribute('data-ptick'), b.getAttribute('aria-pressed') !== 'true'); rerender(); });
    });
  }
  function todayCard(day, title, compact) {
    if (!day) return '';
    var n = day.tasks.filter(function (t) { return P.isDone(t, day); }).length;
    return '<div class="card today-card prep-today"><div class="row"><h2 style="margin:0">' + esc(title || fmtD(day.d)) + '</h2><span class="phase ph-' + esc(day.phase) + '">' + esc(day.phaseName || day.phase) + '</span><span class="spacer"></span>' +
      (day.tasks.length ? '<span class="muted small">' + n + '/' + day.tasks.length + ' done</span>' : '') + '</div>' +
      (day.rest ? '<p class="muted" style="margin:.5rem 0 0">Rest day. Optional: one 2-minute sprint, or nothing at all — recovery is part of the plan.</p>' :
        (!compact ? '<p class="muted small" style="margin:.3rem 0 .4rem">About ' + fmtMin(day.minutes) + ' · mental maths → topic problems → format practice → review misses</p>' : '') +
        '<ul class="tasks' + (compact ? ' compact' : '') + '">' + day.tasks.map(function (t) { return taskRow(t, day); }).join('') + '</ul>') + '</div>';
  }

  core.HOOKS.homeCards.push(function () {
    var c = C();
    if (!c.setup) {
      // v2.1 calm Home: compact card, one quiet button
      return '<div class="card comp-home home-card"><div class="hc-head"><b class="hc-t">Interview coming up?</b><a class="btn sm" href="#prep/setup">Plan my prep</a></div>' +
        '<p class="hc-sub">A day-by-day plan for your target date and firm.</p></div>';
    }
    var day = P.todayDay();
    var firm = c.setup.firm && FIRMS[c.setup.firm];
    return '<div class="card comp-home prep-home home-card"><div class="hc-head"><b class="hc-t">Today’s interview prep</b><a class="btn sm" href="#prep">Open</a></div>' +
      '<p class="hc-sub"><span class="cdchip"><b>' + esc(firm ? firm.name : 'Interview') + '</b> ' + esc(inDays(c.setup.date)) + '</span></p>' +
      (day && day.tasks.length ? '<ul class="tasks compact">' + day.tasks.map(function (t) { return taskRow(t, day); }).join('') + '</ul>'
        : '<p class="muted small" style="margin:.5rem 0 0">' + (day && day.rest ? 'Rest day — nothing scheduled.' : P.daysBetween(today(), c.setup.date) <= 0 ? 'Interview day reached. Good luck — then log how it went.' : 'Nothing scheduled today.') + '</p>') + '</div>';
  });
  core.HOOKS.homeAfter.push(function (main) { bindPTicks(main, function () { core.route(); }); });

  function setupForm(main) {
    var c = C(), s = c.setup || {};
    var def = s.date || core.addDays(today(), 56);
    main.innerHTML = '<div class="narrow">' + head('Interview plan', 'Rule-based and deterministic: the same inputs always give the same plan. It re-flows missed days and leans toward your weakest topics.', '#train', 'Train') +
      '<form class="card stack" id="psForm"><div class="rv-grid"><label>Interview date<input type="date" id="psDate" required value="' + esc(def) + '" min="' + esc(core.addDays(today(), 1)) + '"></label>' +
      '<label>Hours per day<input type="number" id="psHours" min="0.25" max="12" step="0.25" value="' + esc(s.hours || 1.5) + '" inputmode="decimal"></label></div>' +
      '<label class="label" for="psFirm">Target firm (optional)</label><select id="psFirm"><option value="">No specific firm — general trading / quant prep</option>' + D.firms.map(function (f) { return '<option value="' + f.id + '"' + (s.firm === f.id ? ' selected' : '') + '>' + esc(f.name) + '</option>'; }).join('') + '</select>' +
      '<label class="label" for="psRest">Rest day</label><select id="psRest">' + ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(function (n, i) { return '<option value="' + i + '"' + ((s.restDay == null ? 6 : s.restDay) === i ? ' selected' : '') + '>' + n + '</option>'; }).join('') + '<option value="-1"' + (s.restDay === -1 ? ' selected' : '') + '>No rest day</option></select>' +
      '<p class="small muted" id="psTpl"></p>' +
      '<div class="row"><button class="btn primary" type="submit">' + (c.setup ? 'Rebuild my plan' : 'Build my plan') + '</button>' + (c.setup ? '<a class="btn ghost" href="#prep">Cancel</a>' : '') + '</div></form>' +
      '<div class="card"><h2>Templates</h2><ul class="small">' + ['w12', 'w8', 'w4', 'd14'].map(function (k) { var T = D.plans[k]; return '<li><b>' + esc(T.name) + ':</b> ' + T.phases.map(function (p) { return esc(p.name); }).join(' → ') + '</li>'; }).join('') + '</ul>' +
      '<p class="small muted">Chosen from the time you have: 10+ weeks → 12-week, 6+ weeks → 8-week, 3+ weeks → 4-week (with a diagnostic), less → the 2-week superday plan. Longer or shorter spans are stretched or compressed to fit.</p>' +
      '<p class="small"><b>Habits:</b> ' + D.habits.map(esc).join(' ') + '</p></div></div>';
    function tplNote() {
      var d = $('#psDate').value; if (!d) return;
      var n = P.daysBetween(today(), d);
      var t = D.plans[P.templateFor(n)];
      $('#psTpl').textContent = n > 0 ? n + ' days to go → ' + t.name + '.' + (n < 21 ? ' Short runway: focus on formats and stamina.' : '') : 'Pick a date in the future.';
    }
    $('#psDate').addEventListener('input', tplNote); tplNote();
    $('#psForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var d = $('#psDate').value;
      if (!d || d <= today()) { core.toast('Pick an interview date after today.'); return; }
      P.saveSetup({ date: d, firm: $('#psFirm').value, hours: parseFloat($('#psHours').value) || 1.5, restDay: +$('#psRest').value });
      core.toast('Plan ready.');
      core.go('#prep', true);
    });
  }
  function planView(main) {
    var c = C(); P.refresh();
    var s = c.setup, plan = c.plan || { days: [] }, T = D.plans[plan.template] || D.plans.w8;
    var firm = s.firm && FIRMS[s.firm];
    var day = P.todayDay();
    var left = P.daysBetween(today(), s.date);
    var weak = core.topicWeakness().slice(0, 3);
    var w = plan.weights || {}, wk = Object.keys(w).filter(function (k) { return w[k] > 0; }).sort(function (a, b) { return w[b] - w[a] || (a < b ? -1 : 1); });
    var totW = wk.reduce(function (a, k) { return a + w[k]; }, 0) || 1;
    var html = head('Interview plan', esc(T.name) + ' · ' + (firm ? esc(firm.name) + ' · ' : '') + 'interview ' + esc(fmtD(s.date, { weekday: 'short', month: 'long', day: 'numeric' })) + ' (' + esc(inDays(s.date)) + ') · ~' + fmtMin(Math.round(s.hours * 60)) + '/day', '#train', 'Train',
      '<a class="btn" href="#prep/setup">' + ICONS.edit + ' Edit</a>' + (firm ? '<a class="btn" href="#firm/' + firm.id + '">' + ICONS.building + ' Firm card</a>' : ''));
    if (left <= 0) html += '<div class="banner"><p><b>Interview day.</b> Good luck! Afterwards, write down what you were asked in your journal and in the firm notes.</p><a class="btn sm" href="#journal/new?kind=free">Log it</a></div>';
    if (plan.template === 'w4' && plan.days.some(function (d) { return d.diag; })) html += '<div class="banner"><p><b>Week 1 starts with a diagnostic</b> (mixed problems + a timed arithmetic test). If it shows big gaps, consider postponing the interview rather than cramming.</p></div>';
    html += '<div class="detail-grid"><div>' + (day ? todayCard(day, 'Today') : '<div class="card"><p class="muted">Nothing scheduled today.</p></div>');
    // phase bar
    var phases = T.phases, unit = T.days ? 14 : T.weeks;
    html += '<div class="card"><h2>Phases</h2><div class="phasebar">' + phases.map(function (p) { return '<span class="ph-' + p.id + '" style="flex:' + (p.to - p.from + 1) + '" title="' + esc(p.name) + '">' + esc(p.name) + '</span>'; }).join('') + '</div>' +
      '<ul class="small phase-list">' + phases.map(function (p) { return '<li><b>' + esc(p.name) + '</b> <span class="muted">(' + (T.days ? 'days ' : 'weeks ') + p.from + (p.to > p.from ? '–' + p.to : '') + ' of ' + unit + ')</span> — ' + esc(p.desc) + '</li>'; }).join('') + '</ul></div>';
    // upcoming days grouped by week
    var up = plan.days.filter(function (d) { return d.d > today(); });
    var byWeek = {}, order = [];
    up.forEach(function (d) { var k = d.week; if (!byWeek[k]) { byWeek[k] = []; order.push(k); } byWeek[k].push(d); });
    html += '<div class="card"><h2>Coming up</h2>' + (order.length ? order.slice(0, 3).map(function (k) {
      return '<h3 class="week-h">Week ' + k + '</h3><div class="plan-days">' + byWeek[k].map(function (d) {
        return '<div class="plan-day' + (d.rest ? ' rest' : '') + '"><div class="pd-head"><span class="pd-date">' + esc(fmtD(d.d)) + '</span><span class="phase ph-' + esc(d.phase) + '">' + esc(d.phaseName) + '</span></div>' +
          (d.rest ? '<p class="muted small" style="margin:.3rem 0 0">Rest</p>' : '<ul class="pd-tasks small">' + d.tasks.map(function (t) { return '<li><span class="slot slot-' + t.type + '"></span>' + esc(t.label) + '</li>'; }).join('') + '</ul>') + '</div>';
      }).join('') + '</div>';
    }).join('') + (order.length > 3 ? '<p class="muted small">…and ' + (up.length - byWeek[order[0]].length - byWeek[order[1]].length - byWeek[order[2]].length) + ' more days.</p>' : '') : '<p class="muted">No more days before the interview.</p>') + '</div>';
    html += '</div><div>';
    html += '<div class="card"><h2>Where the time goes</h2><p class="muted small">Topic weights for today’s phase: your firm’s topics and your weakest topics get more days.</p>' + wk.slice(0, 8).map(function (k) {
      return '<div class="bar-row" style="--cat: var(--c-' + k + ')"><span class="bn">' + esc(core.catName(k)) + '</span><div class="bar"><div style="width:' + (w[k] / w[wk[0]] * 100) + '%"></div></div><span class="pct">' + Math.round(w[k] / totW * 100) + '%</span></div>';
    }).join('') + (weak.length ? '<p class="small" style="margin:.5rem 0 0">Weakest now: ' + weak.map(function (x) { return '<a href="#topic/' + x.id + '">' + esc(core.catName(x.id)) + '</a>'; }).join(', ') + '.</p>' : '') + '</div>';
    var ch = c.changes.slice(0, 5);
    if (ch.length) html += '<div class="card"><h2>What changed and why</h2><ul class="changes">' + ch.map(function (x) { return '<li><span class="cdate">' + esc(fmtD(x.d, { month: 'short', day: 'numeric' })) + '</span><span>' + esc(x.msg) + '</span></li>'; }).join('') + '</ul></div>';
    var hist = c.history.slice(-7).reverse();
    if (hist.length) html += '<div class="card"><h2>Last days</h2><ul class="hist">' + hist.map(function (h) { return '<li><span class="cdate">' + esc(fmtD(h.d, { month: 'short', day: 'numeric' })) + '</span><span>' + (h.rest ? 'Rest' : h.doneCount + '/' + h.total + ' tasks') + '</span></li>'; }).join('') + '</ul></div>';
    html += '<div class="card"><h2>Habits</h2><ul class="small">' + D.habits.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul><div class="row"><button class="btn sm" type="button" id="prRebuild">Rebuild now</button><button class="btn sm danger" type="button" id="prDel">Delete plan</button></div></div>';
    html += '</div></div>';
    main.innerHTML = html;
    bindPTicks(main, function () { planView(main); });
    $('#prRebuild').addEventListener('click', function () { P.refresh(true); core.toast('Plan rebuilt from today.'); planView(main); });
    $('#prDel').addEventListener('click', function () { if (confirm('Delete the interview plan? Firm notes, checklists and mock results are kept.')) { P.clearPlan(); core.go('#prep/setup', true); } });
  }
  VIEWS.prep = function (main, args) {
    var sub = (args[0] || '').split('?')[0];
    if (sub === 'go') {
      // start the problem session for a plan task
      var key = decodeURIComponent(args[1] || ''), c = C(), task = null, d = null;
      (c.plan ? c.plan.days : []).forEach(function (day) { day.tasks.forEach(function (t) { if (t.k === key) { task = t; d = day; } }); });
      (c.history || []).forEach(function (day) { (day.tasks || []).forEach(function (t) { if (t.k === key) { task = t; d = day; } }); });
      if (task && task.ids && task.ids.length) { core.startSession(task.ids, 'Plan · ' + task.label, 0, true, { kind: 'list', back: '#prep' }); return; }
      core.go('#prep', true); return;
    }
    if (sub === 'setup' || !C().setup) return setupForm(main);
    planView(main);
  };

  /* ------------------------------------------------------------------ */
  /* Superday mock                                                       */
  /* ------------------------------------------------------------------ */
  var MOCK_SECS = 45 * 60;
  function mockQuery() { var h = location.hash, i = h.indexOf('?'), o = {}; if (i >= 0) h.slice(i + 1).split('&').forEach(function (kv) { var p = kv.split('='); o[p[0]] = decodeURIComponent(p[1] || ''); }); return o; }
  VIEWS.superday = function (main, args) {
    var c = C(), timer = null;
    core.onCleanup(function () { if (timer) clearInterval(timer); });
    var stamina = (args[0] || '').split('?')[0] === 'stamina';
    if (c.activeMock && c.activeMock.ids) return run();
    intro();

    function intro() {
      core.setCtl(null);
      var q = mockQuery(), firmSel = q.firm || (c.setup && c.setup.firm) || '';
      var past = c.mocks.slice(-6).reverse();
      main.innerHTML = '<div class="narrow">' + head('Superday mock', 'A timed 45-minute mixed set. <b>Solve out loud</b> — narrate your setup, assumptions and sanity checks as if an interviewer were listening. Then score yourself on the 5-point rubric and log your mistakes.', '#train', 'Train') +
        '<div class="card stack"><div class="frow"><span class="label">Mode</span><div class="seg" role="group" aria-label="Mode"><button type="button" data-mode="single" aria-pressed="' + !stamina + '">One mock · 45 min</button><button type="button" data-mode="stamina" aria-pressed="' + stamina + '">Stamina · 4 back-to-back</button></div></div>' +
        '<label class="label" for="sdFirm">Style</label><select id="sdFirm"><option value="">Mixed trading-interview set</option>' + D.firms.map(function (f) { return '<option value="' + f.id + '"' + (firmSel === f.id ? ' selected' : '') + '>' + esc(f.name) + ' formats</option>'; }).join('') + '</select>' +
        '<ul class="small muted"><li>No solutions until the end; hints are allowed but cost you on the rubric.</li><li>Give up on a problem to move on — the clock keeps running.</li><li>Misses are queued for Review in ' + core.RETRY_DAYS + ' days.</li></ul>' +
        '<button class="btn primary block lg" type="button" id="sdStart">' + ICONS.mic + ' Start ' + (stamina ? '4 mocks (3 h)' : '45-minute mock') + '</button></div>' +
        '<div class="card"><h2>Rubric</h2><ol class="small">' + D.rubric.map(function (r) { return '<li><b>' + esc(r.t) + '</b> — ' + esc(r.d) + '</li>'; }).join('') + '</ol></div>' +
        (past.length ? '<div class="card"><h2>Past mocks</h2><table class="simple"><thead><tr><th>Date</th><th>Score</th><th>Rubric</th></tr></thead><tbody>' + past.map(function (m) {
          var avg = m.rubric ? D.rubric.reduce(function (s, r) { return s + (+m.rubric[r.id] || 0); }, 0) / D.rubric.length : null;
          return '<tr><td>' + esc(m.d) + (m.kind === 'stamina' ? ' <span class="badge">stamina</span>' : '') + '</td><td>' + m.score + '/' + m.total + '</td><td>' + (avg ? avg.toFixed(1) + '/5' : '—') + '</td></tr>';
        }).join('') + '</tbody></table></div>' : '') + '</div>';
      $all('[data-mode]', main).forEach(function (b) { b.addEventListener('click', function () { core.go(b.getAttribute('data-mode') === 'stamina' ? '#superday/stamina' : '#superday', true); }); });
      $('#sdStart').addEventListener('click', function () {
        var firm = $('#sdFirm').value, n = stamina ? 4 : 1, sets = [], usedIds = {};
        for (var i = 0; i < n; i++) {
          var ids = P.mockSet(firm, today() + '#' + c.mocks.length + '#' + i).filter(function (id) { return !usedIds[id]; });
          if (ids.length < 4) ids = P.mockSet(firm, today() + '#x' + i);
          ids.forEach(function (id) { usedIds[id] = 1; });
          sets.push(ids);
        }
        c.activeMock = { kind: stamina ? 'stamina' : 'single', firm: firm, sets: sets, set: 0, idx: 0, ids: sets[0], started: Date.now(), elapsed: 0, runFrom: Date.now(), results: sets.map(function () { return []; }), hints: 0 };
        core.save(); run();
      });
      core.setCtl({ submit: function () { $('#sdStart').click(); } });
    }
    function left() { var m = c.activeMock; var el = m.elapsed + (m.runFrom ? Date.now() - m.runFrom : 0); return MOCK_SECS - el / 1000; }
    function run() {
      var m = c.activeMock;
      if (m.idx >= m.ids.length || left() <= 0) return endSet();
      var p = BY_ID[m.ids[m.idx]];
      if (!p) { m.idx++; core.save(); return run(); }
      var header = '<div class="iv-top"><span>' + (m.kind === 'stamina' ? 'Mock ' + (m.set + 1) + '/4 · ' : '') + 'Q' + (m.idx + 1) + '/' + m.ids.length + '</span>' +
        '<span class="row" style="gap:.4rem"><button type="button" class="btn sm ghost" id="sdPause">' + (m.runFrom ? ICONS.pause + ' Pause' : ICONS.play + ' Resume') + '</button><span class="countdown" id="sdClock" role="timer" aria-label="Time left in this mock"></span></span></div>' +
        '<div class="banner mic-banner"><p>' + ICONS.mic + ' <b>Out loud:</b> state the setup, your plan, and a sanity check before you answer.</p></div>';
      main.innerHTML = '<div id="sdHost" class="narrow"></div>';
      var finished = false, q0 = Date.now();
      var ctl = core.mountProblem($('#sdHost'), p, {
        mode: 'mock', allowSolution: false, header: header, nextLabel: m.idx + 1 < m.ids.length ? 'Next question' : (m.kind === 'stamina' && m.set < 3 ? 'Finish this mock' : 'Finish'),
        onResult: function (ok, how) {
          if (finished) return; finished = true;
          m.results[m.set].push({ id: p.id, ok: ok, how: how, secs: Math.round((Date.now() - q0) / 1000) });
          core.save();
          var b = $('#sdHost [data-act="next"]'); if (b) b.focus();
        },
        onNext: function () { m.idx++; core.save(); run(); window.scrollTo(0, 0); }
      });
      core.setCtl({ submit: ctl.submit, hint: function () { m.hints++; ctl.hint(); }, solution: ctl.solution, next: ctl.next, choose: ctl.choose });
      var endBtn = document.createElement('button'); endBtn.type = 'button'; endBtn.className = 'btn ghost'; endBtn.textContent = 'End this mock now';
      var nav = $('#sdHost .pnav'); if (nav) nav.insertBefore(endBtn, nav.querySelector('.spacer'));
      endBtn.addEventListener('click', function () { if (confirm('End this mock now and go to the self-assessment?')) { m.idx = m.ids.length; core.save(); endSet(); } });
      function tick() {
        var el = $('#sdClock'); if (!el) return;
        var l = left();
        el.textContent = core.fmtTime(l);
        el.classList.toggle('low', l <= 300);
        if (l <= 0) { clearInterval(timer); timer = null; core.toast('Time — this mock is over.'); endSet(); }
      }
      $('#sdPause').addEventListener('click', function () {
        if (m.runFrom) { m.elapsed += Date.now() - m.runFrom; m.runFrom = 0; } else m.runFrom = Date.now();
        core.save();
        this.innerHTML = m.runFrom ? ICONS.pause + ' Pause' : ICONS.play + ' Resume';
      });
      if (timer) clearInterval(timer);
      timer = setInterval(tick, 500); tick();
    }
    function endSet() {
      var m = c.activeMock;
      if (timer) { clearInterval(timer); timer = null; }
      if (m.kind === 'stamina' && m.set < m.sets.length - 1) {
        main.innerHTML = '<div class="narrow"><div class="card sprint-stage"><div class="label">Mock ' + (m.set + 1) + ' of 4 done</div><div class="big-score">' + m.results[m.set].filter(function (r) { return r.ok; }).length + '<span class="muted" style="font-size:1.6rem">/' + m.ids.length + '</span></div>' +
          '<p class="muted">Stand up, drink some water, 5 minutes max. Stamina is part of the test.</p><div class="row center"><button class="btn primary" type="button" id="sdNext">Start mock ' + (m.set + 2) + '</button><button class="btn ghost" type="button" id="sdStop">Stop here and assess</button></div></div></div>';
        $('#sdNext').addEventListener('click', function () { m.set++; m.ids = m.sets[m.set]; m.idx = 0; m.elapsed = 0; m.runFrom = Date.now(); core.save(); run(); });
        $('#sdStop').addEventListener('click', function () { m.sets = m.sets.slice(0, m.set + 1); core.save(); assess(); });
        core.setCtl({ submit: function () { $('#sdNext').click(); } });
        return;
      }
      assess();
    }
    function assess() {
      var m = c.activeMock;
      core.setCtl(null);
      var all = [].concat.apply([], m.results);
      var score = all.filter(function (r) { return r.ok; }).length, total = [].concat.apply([], m.sets).length;
      var misses = all.filter(function (r) { return !r.ok; });
      var st = { rubric: {}, mistakes: [] };
      main.innerHTML = '<div class="narrow">' + head('Self-assessment', 'Score yourself honestly, 1 (weak) to 5 (excellent). This is what superday interviewers grade, more than the final numbers.', '', '') +
        '<div class="card sprint-stage"><div class="label">' + (m.kind === 'stamina' ? 'Stamina · ' + m.sets.length + ' mocks' : 'Mock') + ' result</div><div class="big-score">' + score + '<span class="muted" style="font-size:1.6rem">/' + total + '</span></div><p class="muted">' + all.length + ' attempted · ' + m.hints + ' hints opened</p></div>' +
        '<div class="card stack">' + D.rubric.map(function (r) {
          return '<div class="frow rub" data-r="' + r.id + '"><span class="label">' + esc(r.t) + '</span><span class="small muted">' + esc(r.d) + '</span><div class="seg" role="group" aria-label="' + esc(r.t) + '">' + [1, 2, 3, 4, 5].map(function (v) { return '<button type="button" data-v="' + v + '" aria-pressed="false">' + v + '</button>'; }).join('') + '</div></div>';
        }).join('') +
        '<div class="frow"><span class="label">Mistake types</span><div class="chips" id="sdMist">' + D.mistakes.map(function (x) { return '<button type="button" class="chip" data-m="' + esc(x) + '" aria-pressed="false">' + esc(x) + '</button>'; }).join('') + '</div></div>' +
        (misses.length ? '<span class="label">Mistake log</span>' + misses.map(function (r) { var p = BY_ID[r.id]; return '<label class="small" for="ml-' + esc(r.id) + '"><b>' + esc(p ? p.title : r.id) + '</b> — what went wrong?</label><input type="text" id="ml-' + esc(r.id) + '" data-ml="' + esc(r.id) + '" placeholder="e.g. set up the recursion on the wrong state">'; }).join('') : '') +
        '<label class="label" for="sdText">Overall notes</label><textarea id="sdText" rows="3" placeholder="Where did the time go? What will you do differently?"></textarea>' +
        '<label class="label" for="sdTip">Tip to future me</label><input type="text" id="sdTip" placeholder="One sentence to read before the real superday">' +
        '<div class="row"><button class="btn primary" type="button" id="sdSave">Save to mistake log & journal</button><button class="btn ghost" type="button" id="sdDiscard">Discard</button></div></div>' +
        '<div class="card"><h2>Solutions</h2>' + all.map(function (r, i) { var p = BY_ID[r.id]; return '<details class="reveal sol"><summary>' + (r.ok ? ICONS.check : ICONS.x) + '<span>' + (i + 1) + '. ' + esc(p.title) + '</span><span class="chev" aria-hidden="true">▾</span></summary><div class="rbody"><div class="prompt small">' + p.prompt + '</div>' + core.solutionBody(p) + '</div></details>'; }).join('') + '</div></div>';
      $all('.rub', main).forEach(function (row) {
        var id = row.getAttribute('data-r');
        $all('[data-v]', row).forEach(function (b) { b.addEventListener('click', function () { st.rubric[id] = +b.getAttribute('data-v'); $all('[data-v]', row).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); }); });
      });
      $all('#sdMist [data-m]', main).forEach(function (b) { b.addEventListener('click', function () { var v = b.getAttribute('data-m'), i = st.mistakes.indexOf(v); if (i >= 0) st.mistakes.splice(i, 1); else st.mistakes.push(v); b.setAttribute('aria-pressed', String(i < 0)); }); });
      $('#sdSave').addEventListener('click', function () {
        if (Object.keys(st.rubric).length < D.rubric.length && !confirm('Some rubric items are not scored. Save anyway?')) return;
        var secs = Math.round((Date.now() - m.started) / 1000);
        var rec = P.recordMock({ kind: m.kind, firm: m.firm, sets: m.sets, results: m.results, score: score, total: total, secs: secs, hints: m.hints, rubric: st.rubric, mistakes: st.mistakes,
          log: misses.map(function (r) { var el = main.querySelector('[data-ml="' + r.id + '"]'); return { id: r.id, note: el ? el.value.trim() : '' }; }), text: $('#sdText').value.trim(), tip: $('#sdTip').value.trim() });
        core.toast(rec.journalId ? 'Saved — the mistake log is in your journal.' : 'Saved to your mock history.');
        core.go(rec.journalId ? '#journal/e/' + rec.journalId : '#superday', true);
      });
      $('#sdDiscard').addEventListener('click', function () { if (confirm('Discard this mock? Attempts already count in your stats.')) { c.activeMock = null; core.save(); core.go('#superday', true); } });
    }
  };

  /* ------------------------------------------------------------------ */
  /* Journal: problem notes + firm notes; More page entries              */
  /* ------------------------------------------------------------------ */
  if (VIEWS.journal) {
    var jv = VIEWS.journal;
    VIEWS.journal = function (main, args) {
      jv(main, args);
      if ((args[0] || '').split('?')[0]) return; // only on the journal list
      var list = P.notesList();
      var card = document.createElement('div'); card.className = 'card notes-card'; card.id = 'jNotes';
      card.innerHTML = '<h2>' + ICONS.note + ' Problem & firm notes</h2>' + (list.length ? '<ul class="notes">' + list.slice(0, 30).map(function (n) {
        var href = n.kind === 'firm' ? '#firm/' + n.id : '#practice/' + n.id;
        return '<li><a href="' + href + '"><span class="badge">' + (n.kind === 'firm' ? 'Firm' : esc(core.catName(n.cat))) + '</span><span><b>' + esc(n.title) + ':</b> ' + esc(n.text.slice(0, 160)) + (n.text.length > 160 ? '…' : '') + '</span></a></li>';
      }).join('') + '</ul><p class="muted small">Included in the Markdown / zip export below and in Settings → Export progress.</p>' : '<p class="muted small">Notes you write under any problem (“My notes”) or on a firm card show up here and in the journal export.</p>');
      var anchor = $('#jlist', main);
      if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(card, anchor.nextSibling); else main.appendChild(card);
    };
  }
  function moreItem(href, icon, title, desc) { return '<a class="mode-card" href="' + href + '"><span class="ic">' + ICONS[icon] + '</span><span><b>' + esc(title) + '</b><small>' + esc(desc) + '</small></span></a>'; }
  var MORE_PREP = moreItem('#topics', 'book', 'Topics & concepts', 'Mini-lessons, books and progress per topic') +
    moreItem('#firms', 'building', 'Firm prep', 'Processes, rounds, checklists, notes') +
    moreItem('#prep', 'route', 'Interview plan', 'Your day-by-day prep') +
    moreItem('#sets', 'star', 'Problem sets', 'Your own collections') +
    moreItem('#core50', 'list', 'Core 50', 'The must-do playlist');
  if (VIEWS.more) {
    var mv = VIEWS.more;
    VIEWS.more = function (main, args) {
      mv(main, args);
      var l = $('.more-list', main);
      if (l) l.insertAdjacentHTML('afterbegin', MORE_PREP + (core.runHtmlHooks ? core.runHtmlHooks(core.HOOKS.moreItems || []) : ''));
    };
  } else {
    core.TAB_OF.more = 'more'; core.TITLES.more = 'More';
    VIEWS.more = function (main) {
      main.innerHTML = '<div class="page-head"><div><h1>More</h1></div></div><div class="more-list">' + MORE_PREP + (core.runHtmlHooks ? core.runHtmlHooks(core.HOOKS.moreItems || []) : '') +
        moreItem('#review', 'review', 'Review', 'Spaced repetition') + moreItem('#stats', 'stats', 'Stats', 'Heat map, streaks, progress') + moreItem('#settings', 'gear', 'Settings', 'Theme, export/import, updates') + '</div>';
    };
  }
});
