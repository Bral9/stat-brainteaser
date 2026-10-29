/* Stat Brainteaser — Search everything (v2.3 plugin).
 *
 * A header button (and "/" or Ctrl/Cmd+K) opens a dialog that searches pages, topics, problems, Learn lessons, Library
 * items and Arcade games at once. Results are grouped, keyboard-navigable (↑ ↓ Enter, Esc closes) and capped per group.
 * Matching: every query word must appear in the item's text; title hits rank first. No state of its own.
 * API: window.SBT_SEARCH = { open(query?), query(text) -> [{group, title, sub, href|pid}] } */
(window.SBT_PLUGINS = window.SBT_PLUGINS || []).push(function (core) {
  'use strict';
  var esc = core.esc, ICONS = core.ICONS;

  var PAGES = [
    ['Home', '#home', 'today daily mix streak'], ['Practice', '#practice', 'problems filters topics'], ['Review', '#review', 'spaced repetition due missed'],
    ['Train', '#train', 'timed practice'], ['Mental math sprint', '#sprint', 'arithmetic speed online test'], ['Probability drills', '#drills', 'generated dice cards bayes'],
    ['Interview mode', '#interview', 'five problems countdown'], ['Mock interview', '#mock', 'rounds debrief scorecard'], ['SWE mock interview', '#mock/swe', 'software engineer coding algorithms'],
    ['Software engineering', '#swe', 'swe quant developer algorithms data structures graphs trees linked lists dynamic programming cs fundamentals os networking databases shell git'],
    ['Coding lab', '#codelab', 'python tests complexity pyodide'], ['Arcade', '#arcade', 'games bots market making'], ['Superday mock', '#superday', 'stamina'],
    ['Interview plan', '#prep', 'study plan target date firm'], ['Firm prep', '#firms', 'companies process rounds'], ['Topics & concepts', '#topics', 'concept cards'],
    ['Learn', '#learn', 'lessons'], ['Library', '#library', 'books courses resources reading list'], ['Interview guide', '#guide', 'pipeline firms sources'],
    ['Problem sets', '#sets', 'collections'], ['Core 50', '#core50', 'must-do playlist'], ['Competitions', '#comp', 'qumc putnam coach'],
    ['Journal', '#journal', 'reflection notes'], ['Stats', '#stats', 'accuracy progress'], ['Settings', '#settings', 'export import theme data backup']
  ];
  var idx = null;
  function strip(s) { return core.stripTags ? core.stripTags(String(s || '')) : String(s || '').replace(/<[^>]*>/g, ' '); }
  function build() {
    if (idx) return idx;
    idx = [];
    PAGES.forEach(function (p) { idx.push({ g: 'Pages', t: p[0], s: '', href: p[1], hay: (p[0] + ' ' + p[2]).toLowerCase() }); });
    core.CATS.forEach(function (c) {
      var st = core.catStats(c.id); if (!st.total) return;
      idx.push({ g: 'Topics', t: c.name, s: st.total + ' problems', href: '#topic/' + c.id, hay: (c.name + ' ' + c.id + ' ' + c.short).toLowerCase() });
    });
    core.PROBLEMS.forEach(function (p) {
      idx.push({ g: 'Problems', t: p.title, s: core.catName(p.cat) + ' · ' + (core.DIFF_NAME[p.diff] || ''), pid: p.id,
        hay: (p.title + ' ' + (p.tags || []).join(' ') + ' ' + core.catName(p.cat) + ' ' + p.id).toLowerCase(), body: null, p: p });
    });
    var L = window.SBT_LEARN;
    if (L && Array.isArray(L.lessons)) L.lessons.forEach(function (l) {
      idx.push({ g: 'Lessons', t: l.title, s: ((L.get(l.track) || {}).title || '') + (l.mins ? ' · ' + l.mins + ' min' : ''), href: '#learn/' + l.id, hay: (l.title + ' ' + strip(l.idea)).toLowerCase() });
    });
    var B = window.SBT_LIB;
    if (B && Array.isArray(B.items)) B.items.forEach(function (it) {
      idx.push({ g: 'Library', t: it.title, s: [it.author, it.type].filter(Boolean).join(' · '), href: '#library/' + it.id, hay: (it.title + ' ' + (it.author || '') + ' ' + (it.topics || []).join(' ') + ' ' + (it.desc || '')).toLowerCase() });
    });
    var A = window.SBT_ARCADE;
    if (A && Array.isArray(A.games)) A.games.forEach(function (g) {
      idx.push({ g: 'Games', t: g.name, s: g.desc || '', href: g.href, hay: (g.name + ' ' + (g.desc || '') + ' ' + (g.skills || []).join(' ')).toLowerCase() });
    });
    return idx;
  }
  var ORDER = ['Pages', 'Topics', 'Problems', 'Lessons', 'Library', 'Games'];
  var CAP = { Pages: 5, Topics: 4, Problems: 8, Lessons: 5, Library: 5, Games: 4 };
  function query(text) {
    var words = String(text || '').toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    var hits = [];
    build().forEach(function (e) {
      var tl = e.t.toLowerCase(), score = 0;
      for (var i = 0; i < words.length; i++) {
        var w = words[i];
        if (tl.indexOf(w) >= 0) score += tl.indexOf(w) === 0 ? 4 : 3;
        else if (e.hay.indexOf(w) >= 0) score += 1;
        else if (e.g === 'Problems' && w.length >= 3) {
          if (e.body === null) e.body = strip(e.p.prompt).toLowerCase();
          if (e.body.indexOf(w) >= 0) score += 0.5; else return;
        } else return;
      }
      hits.push({ e: e, score: score });
    });
    hits.sort(function (a, b) { return b.score - a.score || (a.e.t < b.e.t ? -1 : 1); });
    var out = [], n = {};
    ORDER.forEach(function (g) {
      hits.forEach(function (h) {
        if (h.e.g !== g || (n[g] || 0) >= CAP[g]) return;
        n[g] = (n[g] || 0) + 1;
        out.push({ group: g, title: h.e.t, sub: h.e.s, href: h.e.href, pid: h.e.pid });
      });
    });
    return out;
  }

  var back = null;
  function close() {
    if (!back) return;
    back.remove(); back = null; core.modalOpen = false;
    document.removeEventListener('keydown', onKey, true);
  }
  function go(r) {
    close();
    if (r.pid) core.startSession([r.pid], r.title, 0);
    else if (r.href) core.go(r.href);
  }
  var results = [], sel = 0;
  function render() {
    var box = back.querySelector('.srch-res'), q = back.querySelector('input').value;
    results = query(q);
    sel = Math.min(sel, Math.max(0, results.length - 1));
    if (!q.trim()) { box.innerHTML = '<p class="muted small srch-hint">Search problems, topics, lessons, books and courses, games and pages. Try “graph”, “TCP”, “kelly” or “LRU”.</p>'; return; }
    if (!results.length) { box.innerHTML = '<p class="muted small srch-hint">No matches.</p>'; return; }
    var last = '', h = '';
    results.forEach(function (r, i) {
      if (r.group !== last) { h += (last ? '</ul>' : '') + '<p class="srch-g">' + esc(r.group) + '</p><ul>'; last = r.group; }
      h += '<li><button type="button" class="srch-it' + (i === sel ? ' on' : '') + '" data-sr="' + i + '" role="option" aria-selected="' + (i === sel) + '"><b>' + esc(r.title) + '</b>' + (r.sub ? '<small class="muted">' + esc(r.sub) + '</small>' : '') + '</button></li>';
    });
    box.innerHTML = h + '</ul>';
  }
  function onKey(e) {
    if (!back) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!results.length) return;
      sel = (sel + (e.key === 'ArrowDown' ? 1 : results.length - 1)) % results.length; render();
      var b = back.querySelector('.srch-it.on'); if (b && b.scrollIntoView) b.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' && document.activeElement && document.activeElement.tagName === 'INPUT') {
      e.preventDefault(); e.stopPropagation(); if (results[sel]) go(results[sel]);
    }
  }
  function open(q) {
    if (back) return;
    if (core.modalOpen) return;
    back = document.createElement('div');
    back.className = 'modal-back srch-back';
    back.innerHTML = '<div class="modal srch" role="dialog" aria-modal="true" aria-label="Search everything">' +
      '<label class="search"><span class="sr-only">Search everything</span>' + ICONS.search + '<input type="search" placeholder="Search everything…" autocomplete="off" spellcheck="false" aria-controls="srchRes"></label>' +
      '<div class="srch-res" id="srchRes" role="listbox"></div><p class="small muted srch-foot"><span class="kbd">↑</span> <span class="kbd">↓</span> move · <span class="kbd">Enter</span> open · <span class="kbd">Esc</span> close</p></div>';
    document.body.appendChild(back);
    core.modalOpen = true;
    var inp = back.querySelector('input');
    inp.value = q || '';
    var t = null;
    inp.addEventListener('input', function () { sel = 0; clearTimeout(t); t = setTimeout(render, 60); });
    back.addEventListener('click', function (e) {
      if (e.target === back) { close(); return; }
      var b = e.target.closest('[data-sr]'); if (b) go(results[+b.getAttribute('data-sr')]);
    });
    document.addEventListener('keydown', onKey, true);
    render();
    inp.focus();
  }
  // global shortcut: "/" (when not typing) or Ctrl/Cmd+K
  document.addEventListener('keydown', function (e) {
    if (back || core.modalOpen) return;
    var t = e.target, typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
    if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey) && !e.altKey) { e.preventDefault(); open(); }
    else if (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); open(); }
  });
  // header button, next to the theme toggle
  function addButton() {
    var bar = document.querySelector('.top-actions');
    if (!bar || bar.querySelector('[data-search-btn]')) return;
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'icon-btn'; b.setAttribute('data-search-btn', ''); b.setAttribute('aria-label', 'Search everything'); b.title = 'Search everything (/ or Ctrl+K)';
    b.innerHTML = ICONS.search + '<span class="lbl">Search</span>';
    b.addEventListener('click', function () { open(); });
    bar.insertBefore(b, bar.firstChild);
  }
  addButton();

  window.SBT_SEARCH = { open: open, query: query, close: close };
});
