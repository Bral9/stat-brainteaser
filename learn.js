/* Stat Brainteaser v2.1 — Learn (#learn): short conceptual mini-lessons organised track → unit → lesson, each pointing
 * to curated resources (Library ids) for the details. Routes: #learn (hub), #learn/<trackId>, #learn/<lessonId>.
 * State: core.S.learn = {lessons: {id: {read: t|0, confusing: bool, note: str, t}}} (lazy, merge-aware).
 * Data: window.SBT_LEARN_DATA (learn-data.js, built by build/build_learn.py). API: window.SBT_LEARN. */
(window.SBT_PLUGINS = window.SBT_PLUGINS || []).push(function (core) {
  'use strict';
  var DATA = window.SBT_LEARN_DATA && Array.isArray(window.SBT_LEARN_DATA.tracks) ? window.SBT_LEARN_DATA : { tracks: [], res: {} };
  var RES = core.isPlainObj(DATA.res) ? DATA.res : {};
  var esc = core.esc, $ = core.$, $all = core.$all, ICONS = core.ICONS, isObj = core.isPlainObj;
  if (!ICONS.flag) ICONS.flag = core.svg('<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>');
  if (!ICONS.book) ICONS.book = core.svg('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5V21h16"/>');
  var IC_LINK = core.svg('<path d="M14 4h6v6M20 4l-9 9M18 14v6H4V6h6"/>');
  var IC_CIRCLE = core.svg('<circle cx="12" cy="12" r="8"/>');

  /* ---------------- data index ---------------- */
  var TRACKS = DATA.tracks.slice().sort(function (a, b) { return (a.order || 99) - (b.order || 99); });
  var LESSONS = [], BY = {}, TBY = {};
  TRACKS.forEach(function (t) {
    TBY[t.id] = t; t.lessons = [];
    (t.units || []).forEach(function (u) {
      (u.lessons || []).forEach(function (l) {
        if (!l || !l.id || BY[l.id]) return;
        l.track = t.id; l.unit = u.id; l.unitTitle = u.title; l.idx = LESSONS.length;
        l.cats = Array.isArray(l.cats) && l.cats.length ? l.cats : (t.cats || []);
        l.firms = Array.isArray(l.firms) ? l.firms : [];
        l.check = (l.check || []).filter(function (id) { return core.BY_ID[id]; });
        l.practice = isObj(l.practice) ? l.practice : {};
        l.practice.problems = (l.practice.problems || []).filter(function (id) { return core.BY_ID[id]; });
        LESSONS.push(l); BY[l.id] = l; t.lessons.push(l);
      });
    });
  });

  /* ---------------- state ---------------- */
  function st() {
    var S = core.S;
    if (!isObj(S.learn)) S.learn = { lessons: {} };
    if (!isObj(S.learn.lessons)) S.learn.lessons = {};
    return S.learn;
  }
  function rec(id) { var S = core.S, L = S && isObj(S.learn) && isObj(S.learn.lessons) ? S.learn.lessons : {}; return isObj(L[id]) ? L[id] : null; }
  function isRead(id) { var r = rec(id); return !!(r && r.read); }
  function isConf(id) { var r = rec(id); return !!(r && r.confusing); }
  function setRec(id, patch) {
    var L = st().lessons, r = isObj(L[id]) ? L[id] : { read: 0, confusing: false, note: '' };
    Object.keys(patch).forEach(function (k) { r[k] = patch[k]; });
    r.t = Date.now(); L[id] = r; core.save();
    return r;
  }
  core.HOOKS.mergeState.push(function (cur, inc) {
    var il = isObj(inc.learn) && isObj(inc.learn.lessons) ? inc.learn.lessons : null;
    if (!il) return;
    if (!isObj(cur.learn)) cur.learn = { lessons: {} };
    if (!isObj(cur.learn.lessons)) cur.learn.lessons = {};
    var cl = cur.learn.lessons;
    Object.keys(il).forEach(function (id) {
      var b = il[id], a = cl[id];
      if (!isObj(b)) return;
      if (!isObj(a) || (b.t || 0) > (a.t || 0)) cl[id] = b;
    });
  });

  /* ---------------- queries ---------------- */
  function forCat(cat) { return LESSONS.filter(function (l) { return l.cats.indexOf(cat) >= 0; }); }
  function firmTopics(fid) { var P = window.SBT_PREP, f = P && P.FIRMS && P.FIRMS[fid]; return f && Array.isArray(f.topics) ? f.topics : []; }
  function forFirm(fid) {
    var direct = LESSONS.filter(function (l) { return l.firms.indexOf(fid) >= 0; });
    var tp = firmTopics(fid), rest = LESSONS.filter(function (l) { return direct.indexOf(l) < 0 && l.cats.some(function (c) { return tp.indexOf(c) >= 0; }); });
    return direct.concat(rest);
  }
  function nextLesson(cat) {
    var pool = cat ? forCat(cat) : LESSONS, n = pool.filter(function (l) { return !isRead(l.id); })[0];
    if (!n && cat) n = LESSONS.filter(function (l) { return !isRead(l.id); })[0];
    return n || null;
  }
  function progress() {
    var out = { read: 0, total: LESSONS.length, confusing: 0, tracks: {} };
    TRACKS.forEach(function (t) {
      var k = t.lessons.filter(function (l) { return isRead(l.id); }).length;
      out.tracks[t.id] = { read: k, total: t.lessons.length };
      out.read += k;
    });
    out.confusing = LESSONS.filter(function (l) { return isConf(l.id); }).length;
    return out;
  }
  function pickFew(list, n) {
    var un = list.filter(function (l) { return !isRead(l.id); }), rd = list.filter(function (l) { return isRead(l.id); });
    return un.concat(rd).slice(0, n);
  }

  /* ---------------- resources ---------------- */
  function libItem(id) {
    var LB = window.SBT_LIB;
    if (LB && typeof LB.get === 'function') { var it = LB.get(id); if (it) return it; }
    var D = window.SBT_LIBRARY;
    if (D && Array.isArray(D.items)) {
      var al = isObj(D.aliases) ? D.aliases : {}, x = id, g = 0;
      while (al[x] && g++ < 5) x = al[x];
      for (var i = 0; i < D.items.length; i++) if (D.items[i] && D.items[i].id === x) return D.items[i];
    }
    return RES[id] || null;
  }
  function resChip(id, what) {
    var LB = window.SBT_LIB;
    if (LB && typeof LB.chipHtml === 'function' && LB.get && LB.get(id)) { var h = LB.chipHtml(id, what); if (h) return h; }
    var it = libItem(id);
    if (!it) return '';
    var inner = ICONS.book + '<span>' + esc(it.title) + (what ? ' <span class="ln-what">· ' + esc(what) + '</span>' : '') + '</span>';
    return /^https?:\/\//i.test(it.url || '') ? '<a class="fmt-chip ln-chip" href="' + esc(it.url) + '" target="_blank" rel="noopener noreferrer">' + inner + '</a>' : '<span class="fmt-chip ln-chip">' + inner + '</span>';
  }
  function arcadeName(id) {
    var P = window.SBT_PREP;
    if (P && P.arcadeName) { try { return P.arcadeName(id); } catch (e) { } }
    return id;
  }
  var MOCK_NAMES = { classic: 'Classic mock', trading: 'Trading mock', research: 'Research mock', phone: 'Phone screen mock', js: 'Collaborative mock', swe: 'SWE mock' };
  function mockName(id) {
    var M = window.SBT_MOCK, f = M && Array.isArray(M.FORMATS) ? M.FORMATS.filter(function (x) { return x.id === id; })[0] : null;
    if (f && f.name) return f.name;
    if (/^firm:/.test(id)) { var P = window.SBT_PREP, fm = P && P.FIRMS && P.FIRMS[id.slice(5)]; return (fm ? fm.name : id.slice(5)) + ' mock'; }
    return MOCK_NAMES[id] || id;
  }

  /* ---------------- views ---------------- */
  core.TAB_OF.learn = 'train';
  core.TITLES.learn = 'Learn';
  function bar(k, n, label) {
    var p = n ? Math.round(k / n * 100) : 0;
    return '<div class="ln-bar" role="img" aria-label="' + esc(label || (k + ' of ' + n + ' read')) + '"><span style="width:' + p + '%"></span></div>';
  }
  function stIcon(l) {
    if (isConf(l.id)) return '<span class="ln-st conf" title="Confusing — revisit">' + ICONS.flag + '<span class="sr-only">confusing</span></span>';
    if (isRead(l.id)) return '<span class="ln-st read" title="Read">' + ICONS.check + '<span class="sr-only">read</span></span>';
    return '<span class="ln-st" title="Not read">' + IC_CIRCLE + '<span class="sr-only">not read</span></span>';
  }
  function lessonRow(l, showTrack) {
    var t = TBY[l.track];
    return '<li><a class="ln-row" href="#learn/' + esc(l.id) + '">' + stIcon(l) + '<span class="ln-rt"><span class="ln-rtitle">' + esc(l.title) + '</span>' +
      (showTrack ? '<span class="muted small">' + esc(t ? t.title : '') + '</span>' : '') + '</span><span class="muted small ln-mins">' + (l.mins || 3) + ' min</span></a></li>';
  }

  function hub(main) {
    var pr = progress(), nx = nextLesson();
    var actions = (nx ? '<a class="btn primary" id="lnContinue" href="#learn/' + esc(nx.id) + '">' + ICONS.play + ' ' + (pr.read ? 'Continue' : 'Start') + '</a>' : '') +
      '<button class="btn" type="button" id="lnExport">' + ICONS.download + ' Export notes</button>';
    var html = core.pageHead('Learn', 'Short, conceptual lessons (2–4 minutes). Each one gives the idea, the intuition and a trap, then points you to the best resources for the details.', '#train', 'Train', actions);
    if (!LESSONS.length) { main.innerHTML = html + '<div class="card"><p class="muted">The lessons have not loaded. Reload while online once.</p></div>'; bindHub(main); return; }
    html += '<p class="muted small ln-sum">' + pr.read + ' of ' + pr.total + ' lessons read' + (pr.confusing ? ' · ' + pr.confusing + ' flagged to revisit' : '') +
      (nx ? ' · next: <a href="#learn/' + esc(nx.id) + '">' + esc(nx.title) + '</a>' : ' · all read') + '</p>';
    html += '<div class="ln-tracks">' + TRACKS.map(function (t) {
      var p = pr.tracks[t.id], mins = t.lessons.reduce(function (s, l) { return s + (l.mins || 3); }, 0);
      return '<a class="card ln-track" href="#learn/' + esc(t.id) + '"><span class="ln-num">' + esc(String(t.order)) + '</span><span class="ln-tb"><b>' + esc(t.title) + '</b>' +
        '<span class="muted small">' + esc(t.desc || '') + '</span>' + bar(p.read, p.total, p.read + ' of ' + p.total + ' lessons read') +
        '<span class="small muted">' + p.read + '/' + p.total + ' read · about ' + mins + ' min</span></span></a>';
    }).join('') + '</div>';
    var conf = LESSONS.filter(function (l) { return isConf(l.id); });
    if (conf.length) html += '<section class="card"><h2>' + ICONS.flag + ' Revisit</h2><ul class="ln-list">' + conf.map(function (l) { return lessonRow(l, true); }).join('') + '</ul></section>';
    main.innerHTML = html;
    bindHub(main);
  }
  function bindHub(main) { var b = $('#lnExport', main); if (b) b.addEventListener('click', exportAll); }

  function trackView(main, t) {
    var p = progress().tracks[t.id], nx = t.lessons.filter(function (l) { return !isRead(l.id); })[0];
    var html = core.pageHead(esc(t.title), esc(t.desc || ''), '#learn', 'Learn',
      nx ? '<a class="btn primary" href="#learn/' + esc(nx.id) + '">' + ICONS.play + ' ' + (p.read ? 'Continue' : 'Start') + '</a>' : '');
    html += '<div class="ln-track-prog">' + bar(p.read, p.total) + '<span class="small muted">' + p.read + '/' + p.total + ' read</span></div>';
    html += (t.units || []).map(function (u) {
      var ls = t.lessons.filter(function (l) { return l.unit === u.id; });
      return '<section class="card ln-unit"><h2>' + esc(u.title) + '</h2><ol class="ln-list">' + ls.map(function (l) { return lessonRow(l, false); }).join('') + '</ol></section>';
    }).join('');
    main.innerHTML = html;
  }

  function sec(label, body, cls) { return '<section class="ln-sec' + (cls ? ' ' + cls : '') + '"><h2 class="label">' + label + '</h2>' + body + '</section>'; }
  function lessonView(main, l) {
    var t = TBY[l.track], r = rec(l.id) || {}, i = t.lessons.indexOf(l), prev = t.lessons[i - 1], next = t.lessons[i + 1] || null;
    var html = core.pageHead(esc(l.title), esc(t.title) + ' · ' + esc(l.unitTitle || '') + ' · ' + (l.mins || 3) + ' min', '#learn/' + t.id, t.title);
    html += '<div class="ln-layout"><article class="card ln-lesson" aria-label="Lesson">';
    html += sec('The idea', '<p class="ln-idea">' + esc(l.idea) + '</p>');
    html += sec('Intuition', '<ul class="ln-ints">' + (l.intuitions || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>');
    if (l.formula || l.svg) html += sec(l.formula ? 'Key formula' : 'Picture', (l.formula ? '<p class="ln-formula">' + esc(l.formula) + '</p>' : '') + (l.svg ? '<figure class="ln-fig">' + l.svg + '</figure>' : ''));
    html += sec('Example', '<p>' + esc(l.example) + '</p>');
    html += sec('Common trap', '<p>' + esc(l.trap) + '</p>', 'ln-trap');
    if (l.check.length) html += sec('Check yourself', '<div class="fmt-chips">' + l.check.map(function (id) {
      return '<button type="button" class="fmt-chip ln-prob" data-check="' + esc(id) + '">' + ICONS.play + '<span>' + esc(core.BY_ID[id].title) + '</span></button>';
    }).join('') + '</div>');
    var deep = (l.deeper || []).map(function (d) {
      var c = resChip(d.lib); if (!c) return '';
      return '<li>' + c + '<p class="small"><span class="ln-read">Read:</span> ' + esc(d.what || 'the whole resource') + '</p>' + (d.why ? '<p class="small muted">' + esc(d.why) + '</p>' : '') + '</li>';
    }).join('');
    if (deep) html += sec('Go deeper', '<ul class="ln-deeper">' + deep + '</ul>');
    var pr = l.practice, pp = pr.problems;
    var ph = '';
    if (pp.length) ph += '<button type="button" class="btn sm" id="lnPractice">' + ICONS.play + ' Practice ' + pp.length + ' problem' + (pp.length > 1 ? 's' : '') + '</button>';
    var chips = (pr.arcade || []).map(function (a) { return '<a class="fmt-chip" href="#arcade/' + esc(a) + '">' + (ICONS.joystick || ICONS.play) + '<span>' + esc(arcadeName(a)) + '</span></a>'; }).join('');
    if (pr.mock) chips += '<a class="fmt-chip" href="#mock/' + esc(pr.mock) + '">' + (ICONS.mic || ICONS.interview) + '<span>' + esc(mockName(pr.mock)) + '</span></a>';
    if (chips) ph += '<div class="fmt-chips">' + chips + '</div>';
    if (ph) html += sec('Practice next', ph);
    html += '</article>';
    html += '<aside class="card ln-mine" aria-label="Your progress on this lesson"><h2>Your notes</h2><div class="ln-toggles">' +
      '<button type="button" class="btn sm ln-tg" id="lnRead" aria-pressed="' + (r.read ? 'true' : 'false') + '">' + ICONS.check + ' <span>' + (r.read ? 'Read' : 'Mark as read') + '</span></button>' +
      '<button type="button" class="btn sm ln-tg" id="lnConf" aria-pressed="' + (r.confusing ? 'true' : 'false') + '">' + ICONS.flag + ' <span>Confusing — revisit</span></button></div>' +
      '<label class="label" for="lnNote">Personal note</label><textarea id="lnNote" rows="4" placeholder="What clicked, what to look up, which chapter you read…">' + esc(r.note || '') + '</textarea>' +
      '<p class="small muted" id="lnSaved" aria-live="polite">' + (r.note ? 'Saved' : 'Notes are saved on this device and exported with your progress.') + '</p></aside></div>';
    html += '<nav class="ln-nav" aria-label="Lesson navigation">' + (prev ? '<a class="btn ghost" href="#learn/' + esc(prev.id) + '">' + ICONS.left + ' <span>' + esc(prev.title) + '</span></a>' : '<span></span>') +
      (next ? '<a class="btn" id="lnNext" href="#learn/' + esc(next.id) + '"><span>' + esc(next.title) + '</span> ' + ICONS.right + '</a>' : '<a class="btn" href="#learn/' + esc(t.id) + '"><span>Back to ' + esc(t.title) + '</span></a>') + '</nav>';
    main.innerHTML = html;

    $all('[data-check]', main).forEach(function (b) {
      b.addEventListener('click', function () { core.startSession(l.check, l.title, l.check.indexOf(b.getAttribute('data-check')), false, { kind: 'list', back: '#learn/' + l.id }); });
    });
    var pb = $('#lnPractice', main);
    if (pb) pb.addEventListener('click', function () { core.startSession(pp, l.title, 0, false, { kind: 'list', back: '#learn/' + l.id }); });
    $('#lnRead', main).addEventListener('click', function () {
      var on = !isRead(l.id); setRec(l.id, { read: on ? Date.now() : 0 });
      this.setAttribute('aria-pressed', on ? 'true' : 'false'); this.querySelector('span').textContent = on ? 'Read' : 'Mark as read';
      if (on) core.toast(next ? 'Marked as read. Next: ' + next.title : 'Marked as read. Track finished.');
    });
    $('#lnConf', main).addEventListener('click', function () {
      var on = !isConf(l.id); setRec(l.id, { confusing: on }); this.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    var ta = $('#lnNote', main), sv = $('#lnSaved', main), timer = null;
    function flush() {
      if (timer) { clearTimeout(timer); timer = null; }
      var v = ta.value, cur = (rec(l.id) || {}).note || '';
      if (v !== cur) { setRec(l.id, { note: v }); sv.textContent = 'Saved'; }
    }
    ta.addEventListener('input', function () { sv.textContent = 'Saving…'; if (timer) clearTimeout(timer); timer = setTimeout(flush, 600); });
    ta.addEventListener('blur', flush);
    core.onCleanup(flush);
  }

  core.VIEWS.learn = function (main, args) {
    var id = String(args[0] || '').split('?')[0];
    if (!id) return hub(main);
    if (TBY[id]) return trackView(main, TBY[id]);
    if (BY[id]) return lessonView(main, BY[id]);
    main.innerHTML = core.pageHead('Lesson not found', 'This lesson does not exist (any more).', '#learn', 'Learn');
  };

  /* ---------------- Markdown export (Obsidian) ---------------- */
  function yq(s) { return '"' + String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ') + '"'; }
  function ymdOf(t) { var d = new Date(t); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function tag(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
  function markdown(id) {
    var l = BY[id]; if (!l) return '';
    var t = TBY[l.track], r = rec(id) || {};
    var tags = ['stat-brainteaser', 'learn', tag(t.id)].concat(l.cats.map(tag));
    var md = '---\ntitle: ' + yq(l.title) + '\ntrack: ' + yq(t.title) + '\nunit: ' + yq(l.unitTitle || '') + '\nlesson: ' + l.id +
      '\nread: ' + (r.read ? ymdOf(r.read) : 'false') + '\nconfusing: ' + (r.confusing ? 'true' : 'false') + '\nminutes: ' + (l.mins || 3) +
      '\ntags: [' + tags.filter(function (x, i) { return x && tags.indexOf(x) === i; }).join(', ') + ']\n---\n\n';
    md += '# ' + l.title + '\n\n> ' + l.idea + '\n\n## Intuition\n\n' + (l.intuitions || []).map(function (x) { return '- ' + x; }).join('\n') + '\n\n';
    if (l.formula) md += '## Key formula\n\n`' + l.formula + '`\n\n';
    md += '## Example\n\n' + l.example + '\n\n## Common trap\n\n' + l.trap + '\n\n';
    if (l.check.length) md += '## Check yourself\n\n' + l.check.map(function (pid) { return '- ' + core.BY_ID[pid].title + ' (`' + pid + '`)'; }).join('\n') + '\n\n';
    var dl = (l.deeper || []).map(function (d) {
      var it = libItem(d.lib); if (!it) return '';
      return '- ' + (it.url ? '[' + it.title + '](' + it.url + ')' : it.title) + (it.author ? ', ' + it.author : '') + ' — ' + d.what + '. ' + (d.why || '');
    }).filter(Boolean);
    if (dl.length) md += '## Go deeper\n\n' + dl.join('\n') + '\n\n';
    var pr = l.practice, pl = [];
    if (pr.problems.length) pl.push('Problems: ' + pr.problems.join(', '));
    if ((pr.arcade || []).length) pl.push('Arcade: ' + pr.arcade.map(arcadeName).join(', '));
    if (pr.mock) pl.push('Mock: ' + mockName(pr.mock));
    if (pl.length) md += '## Practice next\n\n' + pl.map(function (x) { return '- ' + x; }).join('\n') + '\n\n';
    md += '## My note\n\n' + ((r.note || '').trim() || '_No note yet._') + '\n';
    return md;
  }
  function exportFiles() {
    var root = 'stat-brainteaser-learn/', files = [];
    TRACKS.forEach(function (t) {
      var dir = root + ('0' + (t.order || 0)).slice(-2) + ' ' + t.title.replace(/[\\/:*?"<>|&]/g, '').trim() + '/';
      t.lessons.forEach(function (l) { files.push({ name: dir + l.id + '.md', data: markdown(l.id) }); });
    });
    var pr = progress();
    var idx = '---\ntitle: "Learn index"\ntags: [stat-brainteaser, learn]\n---\n\n# Stat Brainteaser: Learn\n\n' + pr.read + ' of ' + pr.total + ' lessons read.\n\n' +
      TRACKS.map(function (t) {
        return '## ' + t.order + '. ' + t.title + '\n\n' + t.lessons.map(function (l) { return '- [' + (isRead(l.id) ? 'x' : ' ') + '] [[' + l.id + '|' + l.title + ']]' + (isConf(l.id) ? ' (revisit)' : ''); }).join('\n') + '\n';
      }).join('\n');
    files.push({ name: root + 'Learn index.md', data: idx });
    return files;
  }
  function exportAll() {
    var K = window.SBT_COACH, files = exportFiles(), blob, name;
    if (K && typeof K.makeZip === 'function') { blob = K.makeZip(files); name = 'stat-brainteaser-learn-' + core.today() + '.zip'; }
    else { blob = new Blob([files.map(function (f) { return f.data; }).join('\n\n---\n\n')], { type: 'text/markdown' }); name = 'stat-brainteaser-learn-' + core.today() + '.md'; }
    if (K && typeof K.download === 'function') K.download(blob, name);
    else { var u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(u); }, 3000); }
    core.toast('Exported ' + (files.length - 1) + ' lesson notes');
  }

  /* ---------------- hooks ---------------- */
  function miniCard(title, list, more) {
    if (!list.length) return '';
    return '<div class="card ln-mini"><h2>' + ICONS.book + ' ' + esc(title) + '</h2><ul class="ln-list">' + list.map(function (l) { return lessonRow(l, false); }).join('') + '</ul>' +
      '<a class="small" href="' + more + '">All lessons ' + ICONS.right + '</a></div>';
  }
  core.HOOKS.topicCards.push(function (cat) { return miniCard('Learn the concepts', pickFew(forCat(cat), 3), '#learn'); });
  core.HOOKS.firmCards.push(function (fid) { return miniCard('Lessons for this process', pickFew(forFirm(fid), 3), '#learn'); });
  core.HOOKS.trainCards.push(function () {
    var p = progress();
    return core.trainCard('#learn', 'book', 'Learn', 'Short concept lessons that point you to the best books, courses and videos.', p.read + '/' + p.total + ' lessons read');
  });
  core.HOOKS.moreItems.push(function () {
    return '<a class="mode-card" href="#learn"><span class="ic">' + ICONS.book + '</span><span><b>Learn</b><small>Mini-lessons with curated resources</small></span></a>';
  });

  window.SBT_LEARN = {
    tracks: TRACKS, lessons: LESSONS, get: function (id) { return BY[id] || TBY[id] || null; }, forCat: forCat, forFirm: forFirm, nextLesson: nextLesson,
    progress: progress, isRead: isRead, isConfusing: isConf, markdown: markdown, exportFiles: exportFiles, resource: libItem
  };
});
