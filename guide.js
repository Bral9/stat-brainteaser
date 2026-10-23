/* Stat Brainteaser — Interview Guide (#guide overview, #guide/matrix firm comparison, #guide/sources) and the
 * "What they expect" card on each firm page (core.HOOKS.firmCards). Content is pure data (guide-data.js, built from
 * build/guide/guide.json); every fact carries source ids that render as small numbered chips. Adding a resource =
 * adding data and rebuilding, not code. Public: window.SBT_GUIDE = { data, sources, source(id), firm(id), facts() }. */
(window.SBT_PLUGINS = window.SBT_PLUGINS || []).push(function (core) {
  'use strict';
  var G = window.SBT_GUIDE_DATA;
  if (!G || !Array.isArray(G.sources)) return;
  var esc = core.esc, $ = core.$, $all = core.$all, ICONS = core.ICONS;
  var SRC = {}, NUM = {};
  G.sources.forEach(function (s, i) { SRC[s.id] = s; NUM[s.id] = i + 1; });
  var KIND = { official: 'Official', aggregator: 'Aggregator', article: 'Article', unofficial: 'Unofficial' };
  var MARK = { yes: { t: '✓', n: 'Yes' }, some: { t: '~', n: 'Partly / some roles' }, no: { t: '—', n: 'No' }, '?': { t: '?', n: 'No source' } };
  var RANK = { yes: 0, some: 1, no: 2, '?': 3 };
  var FIRMS = (window.SBT_PREP && window.SBT_PREP.FIRMS) || {};
  var FLIST = ((window.SBT_PREP_DATA && window.SBT_PREP_DATA.firms) || []).filter(function (f) { return G.matrix[f.id]; });
  if (!FLIST.length) FLIST = Object.keys(G.matrix).map(function (id) { return { id: id, name: id, kind: '' }; });
  var GROUP_OF = {};
  G.groups.forEach(function (g) { g.firms.forEach(function (f) { GROUP_OF[f] = g; }); });

  if (!ICONS.compass) ICONS.compass = core.svg('<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>');
  core.TITLES.guide = 'Interview guide';
  core.TAB_OF.guide = 'train';

  /* ---------------- public API ---------------- */
  function facts() {
    var out = [];
    ['pipeline', 'evaluate', 'roles', 'context'].forEach(function (sec) {
      (G[sec] || []).forEach(function (b) { (b.facts || []).forEach(function (f) { out.push({ text: f.text, sources: f.sources, where: sec + '/' + b.id }); }); });
    });
    Object.keys(G.firms).forEach(function (id) {
      var fe = G.firms[id];
      ['stages', 'expect'].forEach(function (k) { (fe[k] || []).forEach(function (f) { out.push({ text: f.text, sources: f.sources, where: 'firm/' + id + '/' + k }); }); });
      (fe.conflicts || []).forEach(function (c) { c.claims.forEach(function (f) { out.push({ text: f.text, sources: f.sources, where: 'firm/' + id + '/conflict' }); }); });
    });
    Object.keys(G.matrix).forEach(function (id) {
      Object.keys(G.matrix[id]).forEach(function (c) { var cell = G.matrix[id][c]; if (cell.v !== '?') out.push({ text: c + ': ' + cell.v, sources: cell.sources, where: 'matrix/' + id + '/' + c }); });
    });
    return out;
  }
  window.SBT_GUIDE = {
    data: G, sources: G.sources, source: function (id) { return SRC[id] || null; },
    firm: function (id) { var fe = G.firms[id]; if (!fe) return null; return { id: id, asOf: fe.asOf, stages: fe.stages, expect: fe.expect, prepare: fe.prepare, conflicts: fe.conflicts, matrix: G.matrix[id], group: GROUP_OF[id] ? GROUP_OF[id].id : null }; },
    facts: facts, chips: chips
  };

  /* ---------------- rendering helpers ---------------- */
  function chips(ids) {
    return '<span class="gd-cites">' + (ids || []).filter(function (id) { return SRC[id]; }).map(function (id) {
      var s = SRC[id];
      return '<button type="button" class="gd-src gd-k-' + s.kind + '" data-src="' + esc(id) + '" aria-expanded="false" aria-label="Source ' + NUM[id] + ': ' + esc(s.title) + '">' + NUM[id] + '</button>';
    }).join('') + '</span>';
  }
  function factLi(f) { return '<li>' + esc(f.text) + ' ' + chips(f.sources) + '</li>'; }
  function factList(list, cls) { return '<ul class="gd-facts' + (cls ? ' ' + cls : '') + '">' + (list || []).map(factLi).join('') + '</ul>'; }
  function resolve(l) {
    var L = window.SBT_LEARN;
    if (l.learn && L && typeof L.forCat === 'function') {
      try {
        var ls = L.forCat(l.learn);
        if (Array.isArray(ls) && ls.length && ls[0] && ls[0].id) return { href: '#learn/' + ls[0].id, label: 'Lesson: ' + (ls[0].title || l.label) };
      } catch (e) { /* fall back to the static route */ }
    }
    return { href: l.href, label: l.label };
  }
  function linkChips(ls) {
    if (!ls || !ls.length) return '';
    return '<div class="gd-links">' + ls.map(function (l) { var r = resolve(l); return '<a class="chip" href="' + esc(r.href) + '">' + esc(r.label) + '</a>'; }).join('') + '</div>';
  }
  function tabs(cur) {
    var t = [['#guide', 'Overview', 'overview'], ['#guide/matrix', 'Firm matrix', 'matrix'], ['#guide/sources', 'Sources', 'sources']];
    return '<nav class="gd-tabs" aria-label="Guide sections">' + t.map(function (x) {
      return '<a href="' + x[0] + '"' + (x[2] === cur ? ' aria-current="page"' : '') + '>' + x[1] + '</a>';
    }).join('') + '</nav>';
  }
  function head(desc) {
    return core.pageHead('Interview guide', desc, '#train', 'Train', '<a class="btn" href="#firms">' + (ICONS.building || '') + ' Firm prep</a>');
  }
  function sourcesBlock() {
    var LIB = window.SBT_LIB;
    return '<section class="card gd-sources-card" id="gdSources" aria-labelledby="gdSrcH"><h2 id="gdSrcH">Sources</h2><ol class="gd-sources">' + G.sources.map(function (s) {
      var title = s.url ? (s.url.charAt(0) === '#' ? '<a href="' + esc(s.url) + '">' + esc(s.title) + '</a>' : '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.title) + '</a>') : esc(s.title);
      var lib = '';
      if (s.lib && LIB && typeof LIB.get === 'function') {
        try { if (LIB.get(s.lib)) lib = '<div class="gd-lib">' + (typeof LIB.chipHtml === 'function' ? LIB.chipHtml(s.lib, 'In the Library') : '<a href="#library">In the Library</a>') + '</div>'; } catch (e) { lib = ''; }
      }
      return '<li id="gd-src-' + esc(s.id) + '"><span class="gd-num">' + NUM[s.id] + '</span><div><b>' + title + '</b>' +
        '<div class="gd-meta"><span class="badge">' + esc(KIND[s.kind] || s.kind) + '</span><span class="badge">' + esc(s.reliability) + ' reliability</span><span class="muted small">retrieved ' + esc(s.retrieved) + '</span></div>' +
        (s.note ? '<p class="small muted">' + esc(s.note) + '</p>' : '') + lib + '</div></li>';
    }).join('') + '</ol><p class="small muted gd-change">' + (ICONS.flag || '') + ' ' + esc(G.note) + ' Guide content as of ' + esc(G.asOf) + '.</p></section>';
  }

  /* ---------------- source popover (one, shared; hover / focus / tap) ---------------- */
  var tip = null, tipFor = null, hideT = null;
  function ensureTip() {
    if (tip && document.body.contains(tip)) return tip;
    tip = document.createElement('div'); tip.className = 'gd-tip'; tip.id = 'gdTip'; tip.setAttribute('role', 'tooltip'); tip.hidden = true;
    document.body.appendChild(tip);
    tip.addEventListener('mouseenter', function () { clearTimeout(hideT); });
    tip.addEventListener('mouseleave', function () { hideSoon(); });
    return tip;
  }
  function showTip(btn) {
    var s = SRC[btn.getAttribute('data-src')]; if (!s) return;
    clearTimeout(hideT);
    var t = ensureTip();
    if (tipFor && tipFor !== btn) tipFor.setAttribute('aria-expanded', 'false');
    t.innerHTML = '<b>' + NUM[s.id] + '. ' + esc(s.title) + '</b><span>' + esc(KIND[s.kind] || s.kind) + ' · ' + esc(s.reliability) + ' reliability · retrieved ' + esc(s.retrieved) + '</span>' +
      (s.url && s.url.charAt(0) !== '#' ? '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">Open source</a>' : s.url ? '<a href="' + esc(s.url) + '">Open</a>' : '') +
      '<a href="#guide/sources">All sources</a>';
    t.hidden = false;
    btn.setAttribute('aria-expanded', 'true'); btn.setAttribute('aria-describedby', 'gdTip'); tipFor = btn;
    var r = btn.getBoundingClientRect(), vw = document.documentElement.clientWidth, tw = Math.min(300, vw - 16);
    t.style.width = tw + 'px';
    var left = Math.max(8, Math.min(r.left + r.width / 2 - tw / 2, vw - tw - 8));
    var th = t.offsetHeight, top = r.bottom + 6;
    if (top + th > window.innerHeight - 8 && r.top - th - 6 > 8) top = r.top - th - 6;
    t.style.left = left + 'px'; t.style.top = top + 'px';
  }
  function hideTip() {
    clearTimeout(hideT);
    if (tip) tip.hidden = true;
    if (tipFor) { tipFor.setAttribute('aria-expanded', 'false'); tipFor.removeAttribute('aria-describedby'); }
    tipFor = null;
  }
  function hideSoon() { clearTimeout(hideT); hideT = setTimeout(hideTip, 220); }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.gd-src');
    if (b) { e.preventDefault(); if (tipFor === b && tip && !tip.hidden) hideTip(); else showTip(b); return; }
    if (tip && !tip.hidden && !(e.target.closest && e.target.closest('.gd-tip'))) hideTip();
  });
  document.addEventListener('mouseover', function (e) { var b = e.target.closest && e.target.closest('.gd-src'); if (b && window.matchMedia && window.matchMedia('(hover: hover)').matches) showTip(b); });
  document.addEventListener('mouseout', function (e) { var b = e.target.closest && e.target.closest('.gd-src'); if (b && tipFor === b) hideSoon(); });
  document.addEventListener('focusin', function (e) { var b = e.target.closest && e.target.closest('.gd-src'); if (b) showTip(b); else if (tip && !tip.hidden && !(e.target.closest && e.target.closest('.gd-tip'))) hideTip(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && tip && !tip.hidden) { var b = tipFor; hideTip(); if (b) b.focus(); } });
  window.addEventListener('hashchange', hideTip);
  window.addEventListener('scroll', function () { if (tip && !tip.hidden) hideTip(); }, { passive: true });

  /* ---------------- #guide (overview) ---------------- */
  function block(b, extra) {
    return '<article class="card gd-block' + (extra || '') + '"><h3>' + esc(b.title) + '</h3>' + factList(b.facts) + linkChips(b.links) + '</article>';
  }
  function overview(main) {
    var html = head('How quant interviews usually run, what interviewers look for and how firms differ. Every point is tagged with its source.') + tabs('overview');
    html += '<section aria-labelledby="gdPipeH"><h2 class="gd-h" id="gdPipeH">The typical pipeline</h2><ol class="gd-steps">' + G.pipeline.map(function (st, i) {
      return '<li class="card"><span class="gd-step-n" aria-hidden="true">' + (i + 1) + '</span><div><h3>' + esc(st.title) + '</h3>' + factList(st.facts) + linkChips(st.links) + '</div></li>';
    }).join('') + '</ol></section>';
    html += '<section aria-labelledby="gdEvH"><h2 class="gd-h" id="gdEvH">What interviewers evaluate</h2><p class="muted small gd-lead">Synthesised across the sources; firm-specific points say which firm.</p><div class="gd-grid">' + G.evaluate.map(function (b) { return block(b); }).join('') + '</div></section>';
    html += '<section aria-labelledby="gdRoleH"><h2 class="gd-h" id="gdRoleH">Trader, researcher, developer</h2><div class="gd-grid">' + G.roles.map(function (b) { return block(b); }).join('') + '</div></section>';
    if (G.context && G.context.length) html += '<section aria-labelledby="gdCtxH"><h2 class="gd-h" id="gdCtxH">Background</h2>' + G.context.map(function (b) { return block(b, ' gd-context'); }).join('') + '</section>';
    html += '<div class="card gd-cta"><div><b>Compare firms side by side</b><p class="small muted">Online tests, mental maths, sequences, trading games, probability, coding and stats for ' + FLIST.length + ' firms.</p></div><a class="btn primary" href="#guide/matrix">Firm matrix ' + ICONS.right + '</a></div>';
    html += sourcesBlock();
    main.innerHTML = html;
  }

  /* ---------------- #guide/matrix ---------------- */
  var MS = { col: 'any', val: 'any', group: 'all', sort: 'name', dir: 1 };
  function cellHtml(cell, col) {
    if (!cell) cell = { v: '?', sources: [] };
    var cls = col.text ? 'gd-txt' : 'gd-v gd-v-' + (cell.v === '?' ? 'unk' : cell.v);
    var inner = col.text ? (cell.v === '?' ? '<span class="gd-mark gd-v-unk" aria-label="No source">?</span>' : '<span>' + esc(cell.v) + '</span>')
      : '<span class="gd-mark" aria-hidden="true">' + MARK[cell.v].t + '</span><span class="sr-only">' + MARK[cell.v].n + '</span>';
    return '<span class="' + cls + '">' + inner + (cell.sources && cell.sources.length ? chips(cell.sources) : '') + '</span>' + (cell.note ? '<span class="gd-note">' + esc(cell.note) + '</span>' : '');
  }
  function rows() {
    var list = FLIST.filter(function (f) {
      if (MS.group !== 'all' && (!GROUP_OF[f.id] || GROUP_OF[f.id].id !== MS.group)) return false;
      if (MS.col !== 'any' && MS.val !== 'any') { var c = G.matrix[f.id][MS.col]; if (!c || c.v !== MS.val) return false; }
      return true;
    });
    var col = MS.sort;
    list.sort(function (a, b) {
      var r = 0;
      if (col === 'name') r = a.name.localeCompare(b.name);
      else if (col === 'group') r = G.groups.indexOf(GROUP_OF[a.id]) - G.groups.indexOf(GROUP_OF[b.id]);
      else {
        var ca = G.matrix[a.id][col] || { v: '?' }, cb = G.matrix[b.id][col] || { v: '?' };
        var isText = G.columns.some(function (c) { return c.id === col && c.text; });
        if (isText) r = (ca.v === '?') - (cb.v === '?') || String(ca.v).split('→').length - String(cb.v).split('→').length;
        else r = RANK[ca.v] - RANK[cb.v];
      }
      return r * MS.dir || a.name.localeCompare(b.name);
    });
    return list;
  }
  function matrixBody(hl) {
    var list = rows(), cols = G.columns;
    var thSort = function (id, label) {
      var on = MS.sort === id;
      return '<th scope="col"' + (on ? ' aria-sort="' + (MS.dir > 0 ? 'ascending' : 'descending') + '"' : '') + '><button type="button" class="gd-sort" data-sort="' + id + '">' + esc(label) + (on ? '<span aria-hidden="true">' + (MS.dir > 0 ? ' ↓' : ' ↑') + '</span>' : '') + '</button></th>';
    };
    var table = '<div class="table-scroll gd-table-wrap"><table class="simple gd-matrix"><caption class="sr-only">Firm comparison. ✓ yes, ~ partly or some roles, — no, ? no source.</caption><thead><tr>' + thSort('name', 'Firm') +
      cols.map(function (c) { return thSort(c.id, c.name); }).join('') + '</tr></thead><tbody>' + list.map(function (f) {
        return '<tr data-firm="' + f.id + '"' + (hl === f.id ? ' class="gd-hl"' : '') + '><th scope="row"><a href="#firm/' + f.id + '">' + esc(f.name) + '</a><span class="gd-note">' + esc(GROUP_OF[f.id] ? GROUP_OF[f.id].name : f.kind) + '</span></th>' +
          cols.map(function (c) { return '<td>' + cellHtml(G.matrix[f.id][c.id], c) + '</td>'; }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>';
    var cards = '<div class="gd-cards">' + list.map(function (f) {
      return '<article class="card gd-fcard' + (hl === f.id ? ' gd-hl' : '') + '" data-firm="' + f.id + '"><div class="row"><h3><a href="#firm/' + f.id + '">' + esc(f.name) + '</a></h3><span class="spacer"></span><span class="muted small">' + esc(GROUP_OF[f.id] ? GROUP_OF[f.id].name : f.kind) + '</span></div><dl>' +
        cols.map(function (c) { return '<div class="gd-dl-row"><dt>' + esc(c.name) + '</dt><dd>' + cellHtml(G.matrix[f.id][c.id], c) + '</dd></div>'; }).join('') + '</dl></article>';
    }).join('') + '</div>';
    return '<p class="small muted" id="gdCount" aria-live="polite">Showing ' + list.length + ' of ' + FLIST.length + ' firms.</p>' + (list.length ? table + cards : '<div class="card"><p class="muted">No firm matches these filters.</p></div>');
  }
  function matrix(main) {
    var hl = null, m = /[?&]firm=([a-z0-9-]+)/.exec(location.hash);
    if (m && G.matrix[m[1]]) hl = m[1];
    var opt = function (v, l, cur) { return '<option value="' + v + '"' + (v === cur ? ' selected' : '') + '>' + esc(l) + '</option>'; };
    var markCols = G.columns.filter(function (c) { return !c.text; });
    var html = head('Firm by firm: what the sources say each process includes. Only cells a source supports are filled.') + tabs('matrix');
    html += '<div class="card gd-filters"><div class="gd-frow"><label class="label" for="gdGroup">Firm kind</label><select id="gdGroup">' + opt('all', 'All firms', MS.group) + G.groups.map(function (g) { return opt(g.id, g.name, MS.group); }).join('') + '</select></div>' +
      '<div class="gd-frow"><label class="label" for="gdCol">Column</label><select id="gdCol">' + opt('any', 'Any column', MS.col) + markCols.map(function (c) { return opt(c.id, c.name, MS.col); }).join('') + '</select></div>' +
      '<div class="gd-frow gd-fseg"><span class="label" id="gdValL">Value</span><div class="seg" role="group" aria-labelledby="gdValL">' + [['any', 'Any'], ['yes', '✓'], ['some', '~'], ['no', '—'], ['?', '?']].map(function (v) {
        return '<button type="button" data-val="' + v[0] + '" aria-pressed="' + (MS.val === v[0]) + '"' + (v[0] !== 'any' ? ' aria-label="' + MARK[v[0]].n + '"' : '') + '>' + v[1] + '</button>';
      }).join('') + '</div></div>' +
      '<div class="gd-frow"><label class="label" for="gdSort">Sort by</label><select id="gdSort">' + opt('name', 'Firm name', MS.sort) + opt('group', 'Firm kind', MS.sort) + G.columns.map(function (c) { return opt(c.id, c.name + (c.text ? ' (fewest stages)' : ' (✓ first)'), MS.sort); }).join('') + '</select></div>' +
      '<button type="button" class="btn ghost sm" id="gdReset">Reset</button></div>';
    html += '<p class="small muted gd-legend"><span><b>✓</b> yes</span><span><b>~</b> partly / some roles</span><span><b>—</b> reported as not part of it</span><span><b>?</b> no source</span><span>Numbers are sources: hover, focus or tap.</span></p>';
    html += '<div id="gdMatrix">' + matrixBody(hl) + '</div>';
    html += sourcesBlock();
    main.innerHTML = html;
    function redraw() { $('#gdMatrix', main).innerHTML = matrixBody(hl); bindSort(); }
    function bindSort() {
      $all('.gd-sort', main).forEach(function (b) {
        b.addEventListener('click', function () {
          var id = b.getAttribute('data-sort');
          if (MS.sort === id) MS.dir = -MS.dir; else { MS.sort = id; MS.dir = 1; }
          $('#gdSort', main).value = MS.sort; redraw();
          var nb = $('.gd-sort[data-sort="' + id + '"]', main); if (nb) nb.focus();
        });
      });
    }
    bindSort();
    $('#gdGroup', main).addEventListener('change', function (e) { MS.group = e.target.value; redraw(); });
    $('#gdCol', main).addEventListener('change', function (e) { MS.col = e.target.value; if (MS.col === 'any') setVal('any'); redraw(); });
    $('#gdSort', main).addEventListener('change', function (e) { MS.sort = e.target.value; MS.dir = 1; redraw(); });
    function setVal(v) { MS.val = v; $all('[data-val]', main).forEach(function (x) { x.setAttribute('aria-pressed', String(x.getAttribute('data-val') === v)); }); }
    $all('[data-val]', main).forEach(function (b) {
      b.addEventListener('click', function () {
        setVal(b.getAttribute('data-val'));
        if (MS.val !== 'any' && MS.col === 'any') { MS.col = 'oa-style'; $('#gdCol', main).value = MS.col; }
        redraw();
      });
    });
    $('#gdReset', main).addEventListener('click', function () { MS = { col: 'any', val: 'any', group: 'all', sort: 'name', dir: 1 }; matrix(main); });
    if (hl) { var r = $('.gd-hl', main); if (r && r.offsetParent && r.scrollIntoView) setTimeout(function () { try { r.scrollIntoView({ block: 'center' }); } catch (e) { /* ignore */ } }, 0); }
  }

  function sourcesView(main) {
    main.innerHTML = head('Where every point in the guide comes from, with how much to trust it.') + tabs('sources') +
      '<div class="card"><p class="small">Official pages are the firm describing itself. Aggregated notes summarise what candidates commonly report. Articles are one person’s view. Unofficial material is labelled and only used to show where it disagrees.</p></div>' + sourcesBlock();
  }

  core.VIEWS.guide = function (main, args) {
    var a = (args && args[0] || '').split('?')[0];
    if (a === 'matrix') matrix(main); else if (a === 'sources') sourcesView(main); else overview(main);
  };

  /* ---------------- firm page card (#firm/<id>) ---------------- */
  core.HOOKS.firmCards = core.HOOKS.firmCards || [];
  core.HOOKS.firmCards.push(function (fid) {
    var fe = G.firms[fid]; if (!fe) return '';
    var f = FIRMS[fid] || { name: fid };
    var html = '<section class="card gd-firm" aria-labelledby="gdFirmH"><div class="row"><h2 id="gdFirmH" style="margin:0">What they expect</h2><span class="spacer"></span><span class="badge">as of ' + esc(fe.asOf) + '</span></div>';
    html += factList(fe.expect);
    if (fe.prepare && fe.prepare.length) html += '<span class="label">How to prepare in this app</span>' + linkChips(fe.prepare);
    (fe.conflicts || []).forEach(function (c) {
      html += '<div class="gd-conflict"><span class="label">Sources disagree</span><p class="gd-ctopic"><b>' + esc(c.topic) + '</b></p><div class="gd-claims">' + c.claims.map(function (cl) {
        var kinds = cl.sources.map(function (id) { return SRC[id] ? KIND[SRC[id].kind] : ''; }).filter(Boolean);
        return '<div class="gd-claim"><span class="gd-ckind">' + esc(kinds.filter(function (k, i) { return kinds.indexOf(k) === i; }).join(' + ')) + '</span><p>' + esc(cl.text) + ' ' + chips(cl.sources) + '</p></div>';
      }).join('') + '</div></div>';
    });
    if (fe.stages && fe.stages.length) html += '<details class="reveal gd-stages"><summary>Stage notes with sources</summary>' + factList(fe.stages) + '</details>';
    html += '<p class="small muted gd-foot">Processes change; numbers are sources (tap one). <a href="#guide/matrix?firm=' + esc(fid) + '">Compare in the firm matrix</a> · <a href="#guide">Full guide ' + ICONS.right + '</a></p></section>';
    return html;
  });

  /* ---------------- Train hub card + More row ---------------- */
  core.HOOKS.trainCards = core.HOOKS.trainCards || [];
  core.HOOKS.trainCards.push(function () {
    return core.trainCard('#guide', 'compass', 'Interview guide', 'How the process runs, what interviewers look for, and a firm-by-firm comparison, every point with its source.', FLIST.length + ' firms · ' + G.sources.length + ' sources');
  });
  core.HOOKS.moreItems = core.HOOKS.moreItems || [];
  core.HOOKS.moreItems.push(function () {
    return '<a class="mode-card" href="#guide"><span class="ic">' + ICONS.compass + '</span><span><b>Interview guide</b><small>Process, expectations, firm matrix</small></span></a>';
  });
});
