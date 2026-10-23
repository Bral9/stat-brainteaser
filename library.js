/* Stat Brainteaser v2.1 — Library (#library): a curated reading list with search, filters, a "Start here" shelf,
 * per-item status / note / rating (S.library, merge-aware), Obsidian Markdown export, and shelves on topic and firm
 * pages. Data: window.SBT_LIBRARY (library-data.js, built by build/build_library.py). API: window.SBT_LIB. */
(window.SBT_PLUGINS = window.SBT_PLUGINS || []).push(function (core) {
  'use strict';
  var DATA = window.SBT_LIBRARY && Array.isArray(window.SBT_LIBRARY.items) ? window.SBT_LIBRARY : { items: [], aliases: {}, source: 'none', attribution: '' };
  if (!core.isPlainObj(DATA.aliases)) DATA.aliases = {};
  var esc = core.esc, $ = core.$, $all = core.$all, ICONS = core.ICONS, isObj = core.isPlainObj;
  var ITEMS = DATA.items.filter(function (it) { return it && it.id && it.title && /^https?:\/\//i.test(it.url || ''); });
  ITEMS.forEach(function (it, i) {
    it._i = i;
    ['topics', 'cats', 'tracks', 'firms', 'links'].forEach(function (k) { if (!Array.isArray(it[k])) it[k] = it[k] ? [it[k]] : []; });
    ['author', 'type', 'level', 'cost', 'desc', 'source', 'linkStatus'].forEach(function (k) { if (typeof it[k] !== 'string') it[k] = it[k] == null ? '' : String(it[k]); });
    if (['start', 'next', 'later'].indexOf(it.priority) < 0) it.priority = 'next';
  });
  var BY = {};
  ITEMS.forEach(function (it) { BY[it.id] = it; });
  var ATTR = DATA.attribution || 'Curated from Quant Roadmap 2024/25 by Stat Arb (@quant_arb) and other sources';

  if (!ICONS.ext) ICONS.ext = core.svg('<path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>');
  var IC_BOOK = ICONS.book || '';

  core.TITLES.library = 'Library';
  core.TAB_OF.library = 'train';

  var ST_LIST = ['to-read', 'reading', 'done'];
  var ST_NAME = { 'to-read': 'To read', reading: 'Reading', done: 'Done' };
  var PRI_NAME = { start: 'Start here', next: 'Next', later: 'Later' };
  var PRI_RANK = { start: 0, next: 1, later: 2 };
  var LEVEL_ORDER = ['beginner', 'intro', 'introductory', 'intermediate', 'advanced', 'expert'];

  /* ------------------------------------------------------------------ */
  /* State: core.S.library = {items: {id: {status, note, rating, t}}}    */
  /* ------------------------------------------------------------------ */
  function resolve(id) {
    var seen = {}, al = DATA.aliases || {};
    while (id != null && !BY[id] && al[id] && !seen[id]) { seen[id] = 1; id = al[id]; }
    return id;
  }
  function cleanRec(r) {
    if (!isObj(r)) return null;
    return { status: ST_LIST.indexOf(r.status) >= 0 ? r.status : '', note: typeof r.note === 'string' ? r.note : '', rating: Math.max(0, Math.min(5, Math.round(+r.rating || 0))), t: +r.t || 0 };
  }
  // move records stored under an alias id onto the real id (newest t wins)
  function canon(lib) {
    if (!isObj(lib) || !isObj(lib.items)) return;
    Object.keys(lib.items).forEach(function (k) {
      var id = resolve(k);
      if (id === k) return;
      var a = lib.items[id], b = cleanRec(lib.items[k]);
      if (b && (!a || (b.t || 0) > (a.t || 0))) lib.items[id] = b;
      delete lib.items[k];
    });
  }
  function L() {
    var S = core.S;
    if (!isObj(S.library)) S.library = { items: {} };
    if (!isObj(S.library.items)) S.library.items = {};
    return S.library;
  }
  function rec(id) {
    var lib = core.S.library;
    if (!isObj(lib) || !isObj(lib.items)) return null;
    var cid = resolve(id), r = lib.items[cid];
    if (!r) Object.keys(lib.items).forEach(function (k) { if (k !== cid && resolve(k) === cid && (!r || (lib.items[k].t || 0) > (r.t || 0))) r = lib.items[k]; });
    return isObj(r) ? r : null;
  }
  function setRec(id, patch) {
    var lib = L(), cid = resolve(id);
    canon(lib);
    var r = cleanRec(lib.items[cid]) || { status: '', note: '', rating: 0, t: 0 };
    Object.keys(patch).forEach(function (k) { r[k] = patch[k]; });
    r.t = Math.max(Date.now(), (r.t || 0) + 1);
    lib.items[cid] = r;
    core.save();
    return r;
  }
  function status(id) { var r = rec(id); return (r && r.status) || ''; }
  function tracked(r) { return r && (r.status || (r.note && r.note.trim()) || r.rating); }
  function counts() {
    var c = { 'to-read': 0, reading: 0, done: 0, rated: 0, noted: 0 };
    ITEMS.forEach(function (it) { var r = rec(it.id); if (!r) return; if (c[r.status] != null) c[r.status]++; if (r.rating) c.rated++; if (r.note && r.note.trim()) c.noted++; });
    return c;
  }

  core.HOOKS.mergeState.push(function (cur, inc) {
    var ib = inc && inc.library;
    if (!isObj(ib) || !isObj(ib.items)) return;
    if (!isObj(cur.library) || !isObj(cur.library.items)) cur.library = { items: {} };
    canon(cur.library);
    Object.keys(ib.items).forEach(function (k) {
      var b = cleanRec(ib.items[k]); if (!b) return;
      var id = resolve(k), a = cur.library.items[id];
      if (!a || (b.t || 0) > (a.t || 0)) cur.library.items[id] = b;
    });
  });
  core.HOOKS.boot.push(function () { if (isObj(core.S.library)) canon(core.S.library); });

  /* ------------------------------------------------------------------ */
  /* Selection helpers / API                                             */
  /* ------------------------------------------------------------------ */
  function stRank(it) { var s = status(it.id); return s === 'done' ? 2 : s === 'reading' ? -1 : 0; }
  function deadRank(it) { return it.linkStatus === 'dead' ? 1 : 0; }
  function byDefault(a, b) { return PRI_RANK[a.priority] - PRI_RANK[b.priority] || a._i - b._i; }
  function forCat(cat, n) {
    var l = ITEMS.filter(function (it) { return it.cats.indexOf(cat) >= 0; });
    l.sort(function (a, b) { return deadRank(a) - deadRank(b) || stRank(a) - stRank(b) || PRI_RANK[a.priority] - PRI_RANK[b.priority] || a.cats.indexOf(cat) - b.cats.indexOf(cat) || a._i - b._i; });
    return l.slice(0, n == null ? 3 : n);
  }
  function firmOf(firmId) { var P = window.SBT_PREP; return P && P.FIRMS && P.FIRMS[firmId] || null; }
  function forFirm(firmId, n) {
    var f = firmOf(firmId), topics = (f && f.topics) || [], name = f && f.name ? f.name.toLowerCase() : '';
    var scored = ITEMS.map(function (it) {
      var s = 0;
      if (it.firms.indexOf(firmId) >= 0) s += 10;
      if (name && (it.title + ' ' + it.author).toLowerCase().indexOf(name) >= 0) s += 10;
      it.cats.forEach(function (c, ci) { var k = topics.indexOf(c); if (k >= 0) s += (topics.length - k) / topics.length * (ci === 0 ? 1.5 : 1); });
      return { it: it, s: s };
    }).filter(function (x) { return x.s > 0; });
    scored.sort(function (a, b) { return deadRank(a.it) - deadRank(b.it) || stRank(a.it) - stRank(b.it) || b.s - a.s || PRI_RANK[a.it.priority] - PRI_RANK[b.it.priority] || a.it._i - b.it._i; });
    return scored.slice(0, n == null ? 3 : n).map(function (x) { return x.it; });
  }
  /* "Start here" items (optionally in one category; topped up with that category's best other items). */
  function startItems(n, cat) {
    n = n == null ? 6 : n;
    var l = ITEMS.filter(function (it) { return it.priority === 'start' && (!cat || it.cats.indexOf(cat) >= 0); });
    l.sort(function (a, b) { return deadRank(a) - deadRank(b) || stRank(a) - stRank(b) || (cat ? a.cats.indexOf(cat) - b.cats.indexOf(cat) : 0) || a._i - b._i; });
    if (cat && l.length < n) forCat(cat, n + l.length).forEach(function (it) { if (l.indexOf(it) < 0) l.push(it); });
    return l.slice(0, n);
  }
  function get(id) { return BY[resolve(id)] || null; }
  function extLink(it, inner, cls) {
    return '<a' + (cls ? ' class="' + cls + '"' : '') + ' href="' + esc(it.url) + '" target="_blank" rel="noopener noreferrer">' + inner + '</a>';
  }
  function chipHtml(id, what) {
    var it = get(id); if (!it) return '';
    return '<a class="fmt-chip lb-chip" href="' + esc(it.url) + '" target="_blank" rel="noopener noreferrer"' + (what ? ' title="' + esc(what) + '"' : '') + '>' + IC_BOOK +
      '<span>' + esc(it.title) + (what ? ' <span class="lb-chip-what">· ' + esc(what) + '</span>' : '') + '</span></a>';
  }
  function quietMeta(it) {
    return [it.type, it.level, it.cost].filter(Boolean).map(function (s) { return esc(s.charAt(0).toUpperCase() + s.slice(1)); }).join(' · ');
  }
  function stMark(id) {
    var s = status(id);
    return s ? '<span class="lb-stmark lb-st-' + s + '">' + (s === 'done' ? ICONS.check : '') + esc(ST_NAME[s]) + '</span>' : '';
  }
  function shelfHtml(o) {
    o = o || {};
    var n = o.n || 3, list, more = '#library';
    if (Array.isArray(o.ids)) list = o.ids.map(get).filter(Boolean).filter(function (it, i, a) { return a.indexOf(it) === i; }).slice(0, n);
    else if (o.firm) { list = forFirm(o.firm, n); }
    else if (o.cat) { list = forCat(o.cat, n); more = '#library?cat=' + encodeURIComponent(o.cat); }
    else list = startItems(n);
    if (!list.length) return '';
    return '<div class="card lb-shelf"><h2>' + esc(o.title || 'Read next') + '</h2><ul class="lb-mini">' + list.map(function (it) {
      return '<li>' + extLink(it, esc(it.title) + '<span class="sr-only"> (opens in a new tab)</span>', 'lb-mini-t') +
        '<span class="small muted">' + esc(it.author) + (it.author && quietMeta(it) ? ' · ' : '') + quietMeta(it) + '</span>' + stMark(it.id) + '</li>';
    }).join('') + '</ul><a class="small lb-more" href="' + more + '">All in the Library ' + (ICONS.right || '→') + '</a></div>';
  }

  window.SBT_LIB = {
    items: ITEMS, source: DATA.source, attribution: ATTR, aliases: DATA.aliases,
    get: get, resolve: resolve, forCat: forCat, forFirm: forFirm, startItems: startItems, status: status,
    record: function (id) { var r = rec(id); return r ? JSON.parse(JSON.stringify(r)) : null; },
    chipHtml: chipHtml, shelfHtml: shelfHtml, counts: counts,
    markdown: function () { return readingListMd(); }, itemMarkdown: function (id) { var it = get(id); return it ? itemMd(it) : ''; }
  };

  /* ------------------------------------------------------------------ */
  /* Markdown export (Obsidian)                                          */
  /* ------------------------------------------------------------------ */
  function yq(s) { return '"' + String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ') + '"'; }
  function tagSlug(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'x'; }
  function fileSlug(s) { return String(s || 'item').replace(/[\\\/:*?"<>|#^\[\]]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80) || 'item'; }
  function tagsOf(it, r) {
    var t = ['stat-brainteaser', 'library'];
    if (r && r.status) t.push('status/' + r.status);
    it.cats.forEach(function (c) { t.push('topic/' + tagSlug(c)); });
    if (it.type) t.push('type/' + tagSlug(it.type));
    return t;
  }
  function stars(n) { return n ? new Array(n + 1).join('★') + new Array(6 - n).join('☆') : ''; }
  function itemMd(it) {
    var r = rec(it.id) || {};
    var fm = ['---', 'title: ' + yq(it.title), 'author: ' + yq(it.author), 'url: ' + yq(it.url), 'status: ' + (r.status || 'none'), 'rating: ' + (r.rating || 0),
      'type: ' + yq(it.type), 'level: ' + yq(it.level), 'cost: ' + yq(it.cost), 'priority: ' + it.priority,
      'tags: [' + tagsOf(it, r).join(', ') + ']', 'library-id: ' + it.id, 'exported: ' + core.today(), '---', ''];
    var body = ['# ' + it.title, ''];
    if (it.author) body.push('*' + it.author + '*', '');
    body.push('[Open the resource](' + it.url + ')' + (it.links.length ? ' · ' + it.links.map(function (l) { return '[' + l.label + '](' + l.url + ')'; }).join(' · ') : ''), '');
    if (it.desc) body.push(it.desc, '');
    var meta = [it.cats.length ? 'Topics: ' + it.cats.map(core.catName).join(', ') : '', r.rating ? 'My rating: ' + stars(r.rating) : ''].filter(Boolean);
    if (meta.length) body.push(meta.join(' · '), '');
    body.push('## My notes', '', (r.note && r.note.trim()) || '_No notes yet._', '');
    return fm.join('\n') + body.join('\n');
  }
  function listLine(it, r, wiki) {
    var link = wiki ? '[[' + fileSlug(it.title) + ']] ([link](' + it.url + '))' : '[' + it.title.replace(/[\[\]]/g, '') + '](' + it.url + ')';
    var s = '- [' + (r && r.status === 'done' ? 'x' : ' ') + '] ' + link + (it.author ? ' — ' + it.author : '') + (r && r.rating ? ' · ' + stars(r.rating) : '');
    if (r && r.note && r.note.trim()) s += '\n' + r.note.trim().split('\n').map(function (x) { return '    > ' + x; }).join('\n');
    return s;
  }
  function readingListMd(wiki) {
    var groups = { reading: [], 'to-read': [], done: [], other: [] }, start = [];
    ITEMS.slice().sort(byDefault).forEach(function (it) {
      var r = rec(it.id);
      if (tracked(r)) groups[r.status || 'other'].push(listLine(it, r, wiki));
      else if (it.priority === 'start') start.push(listLine(it, null, wiki));
    });
    var c = counts();
    var out = ['---', 'title: "Reading list"', 'exported: ' + core.today(), 'source: ' + (DATA.source || 'unknown'),
      'counts: {to-read: ' + c['to-read'] + ', reading: ' + c.reading + ', done: ' + c.done + '}', 'tags: [stat-brainteaser, library, reading-list]', '---', '',
      '# Reading list', '', '_' + ATTR + '._', ''];
    [['reading', 'Reading'], ['to-read', 'To read'], ['done', 'Done'], ['other', 'Rated or noted']].forEach(function (g) {
      if (groups[g[0]].length) out.push('## ' + g[1], '', groups[g[0]].join('\n'), '');
    });
    if (start.length) out.push('## Start here (not started yet)', '', start.join('\n'), '');
    return out.join('\n');
  }
  function download(blob, name) {
    var K = window.SBT_COACH;
    if (K && K.download) { K.download(blob, name); return; }
    var url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 3000);
  }
  function exportMd() {
    download(new Blob([readingListMd(false)], { type: 'text/markdown' }), 'reading-list-' + core.today() + '.md');
    core.toast('Reading list exported (Markdown).');
  }
  function exportZip() {
    var K = window.SBT_COACH;
    if (!K || !K.makeZip) { exportMd(); return; }
    var list = ITEMS.filter(function (it) { return tracked(rec(it.id)); });
    if (!list.length) list = ITEMS.slice();
    var used = {}, dir = 'stat-brainteaser-library/';
    var files = list.sort(byDefault).map(function (it) {
      var nm = fileSlug(it.title), k = nm, i = 2; while (used[k.toLowerCase()]) k = nm + ' ' + (i++); used[k.toLowerCase()] = 1;
      return { name: dir + k + '.md', data: itemMd(it) };
    });
    files.push({ name: dir + 'Reading list.md', data: readingListMd(true) });
    download(K.makeZip(files), 'stat-brainteaser-library-' + core.today() + '.zip');
    core.toast('Library notes exported (' + (files.length - 1) + ' notes, zip).');
  }

  /* ------------------------------------------------------------------ */
  /* View                                                                */
  /* ------------------------------------------------------------------ */
  var FKEYS = ['q', 'cat', 'type', 'level', 'cost', 'pri', 'st'];
  function parseQuery() {
    var F = {}, h = location.hash || '', qi = h.indexOf('?');
    FKEYS.forEach(function (k) { F[k] = ''; });
    if (qi >= 0) h.slice(qi + 1).split('&').forEach(function (kv) {
      var p = kv.split('='), k = p[0], v = p.slice(1).join('=');
      try { v = decodeURIComponent(v.replace(/\+/g, ' ')); } catch (e) { }
      if (FKEYS.indexOf(k) >= 0) F[k] = v;
    });
    return F;
  }
  function toQuery(F) { return FKEYS.filter(function (k) { return F[k]; }).map(function (k) { return k + '=' + encodeURIComponent(F[k]); }).join('&'); }
  function activeCount(F) { return FKEYS.filter(function (k) { return k !== 'q' && F[k]; }).length; }
  function haystack(it) {
    if (!it._h) it._h = [it.title, it.author, it.desc, it.topics.join(' '), it.cats.map(core.catName).join(' '), it.type].join(' ').toLowerCase();
    return it._h;
  }
  function filterItems(F) {
    var toks = (F.q || '').toLowerCase().split(/\s+/).filter(Boolean);
    return ITEMS.filter(function (it) {
      if (F.cat && it.cats.indexOf(F.cat) < 0) return false;
      if (F.type && it.type !== F.type) return false;
      if (F.level && it.level !== F.level) return false;
      if (F.cost && it.cost !== F.cost) return false;
      if (F.pri && it.priority !== F.pri) return false;
      if (F.st) { var s = status(it.id); if (F.st === 'none' ? s : s !== F.st) return false; }
      var h = haystack(it);
      return toks.every(function (t) { return h.indexOf(t) >= 0; });
    }).sort(byDefault);
  }
  function distinct(key) {
    var seen = {};
    ITEMS.forEach(function (it) { if (it[key]) seen[it[key]] = (seen[it[key]] || 0) + 1; });
    var l = Object.keys(seen);
    if (key === 'level') l.sort(function (a, b) { var x = LEVEL_ORDER.indexOf(a), y = LEVEL_ORDER.indexOf(b); return (x < 0 ? 99 : x) - (y < 0 ? 99 : y) || (a < b ? -1 : 1); });
    else l.sort();
    return l;
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function sel(id, label, key, opts, F) {
    return '<label class="lb-f"><span class="label">' + esc(label) + '</span><select id="' + id + '" data-f="' + key + '"><option value="">All</option>' +
      opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (F[key] === o[0] ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select></label>';
  }
  function itemCard(it) {
    var r = rec(it.id) || {}, s = r.status || '', rt = r.rating || 0, note = r.note || '';
    var host = ''; try { host = new URL(it.redirectTo || it.url).hostname.replace(/^www\./, ''); } catch (e) { }
    var linkNote = it.linkStatus === 'dead' ? '<p class="lb-link small muted"><span class="lb-dot bad" aria-hidden="true"></span>Link reported dead — search for the title if it doesn’t open.</p>'
      : it.linkStatus === 'auth' ? '<p class="lb-link small muted"><span class="lb-dot" aria-hidden="true"></span>May need sign-in (or a normal browser) to open.</p>'
      : it.linkStatus === 'redirect' ? '<p class="lb-link small muted"><span class="lb-dot" aria-hidden="true"></span>Link redirects' + (it.redirectTo ? ' to ' + esc(host) : '') + '.</p>' : '';
    return '<article class="card lb-item" data-id="' + esc(it.id) + '">' +
      '<div class="lb-top"><h3 class="lb-title">' + extLink(it, esc(it.title) + ' <span class="lb-ext" aria-hidden="true">' + ICONS.ext + '</span><span class="sr-only"> (opens in a new tab)</span>') + '</h3></div>' +
      (it.author ? '<p class="lb-by small">' + esc(it.author) + '</p>' : '') +
      '<p class="lb-meta small muted">' + quietMeta(it) + (quietMeta(it) ? ' · ' : '') + esc(PRI_NAME[it.priority]) + (host ? ' · ' + esc(host) : '') + '</p>' +
      (it.desc ? '<p class="lb-desc small">' + esc(it.desc) + '</p>' : '') +
      (it.cats.length ? '<p class="lb-cats small muted">' + it.cats.map(function (c) { return '<a href="#library?cat=' + encodeURIComponent(c) + '" data-setcat="' + esc(c) + '">' + esc(core.catName(c)) + '</a>'; }).join(' · ') + '</p>' : '') +
      (it.links.length ? '<p class="lb-links small">' + it.links.map(function (l) { return '<a href="' + esc(l.url) + '" target="_blank" rel="noopener noreferrer">' + esc(l.label) + '</a>'; }).join(' · ') + '</p>' : '') +
      linkNote +
      '<div class="lb-ctl"><div class="seg sm lb-seg" role="group" aria-label="Reading status">' + ST_LIST.map(function (k) {
        return '<button type="button" data-lb-st="' + k + '" aria-pressed="' + (s === k) + '">' + esc(ST_NAME[k]) + '</button>';
      }).join('') + '</div>' +
      '<div class="lb-rate" role="group" aria-label="Rating">' + [1, 2, 3, 4, 5].map(function (k) {
        return '<button type="button" data-lb-rate="' + k + '" aria-pressed="' + (rt >= k) + '" aria-label="Rate ' + k + ' of 5">' + (rt >= k ? '★' : '☆') + '</button>';
      }).join('') + '</div></div>' +
      '<details class="lb-note"' + (note.trim() ? ' data-has="1"' : '') + '><summary><span>' + (note.trim() ? 'My note' : 'Add a note') + '</span><span class="chev" aria-hidden="true">▾</span></summary>' +
      '<label class="sr-only" for="lbn-' + esc(it.id) + '">Note on ' + esc(it.title) + '</label><textarea id="lbn-' + esc(it.id) + '" data-lb-note rows="3" placeholder="What to read, key takeaways, chapter you stopped at…">' + esc(note) + '</textarea></details>' +
      '</article>';
  }
  function miniStart(list) {
    return '<section class="lb-start" aria-label="Start here"><h2 class="label">Start here</h2><div class="lb-start-row">' + list.map(function (it) {
      return '<div class="card lb-sitem">' + extLink(it, esc(it.title) + '<span class="sr-only"> (opens in a new tab)</span>', 'lb-mini-t') +
        '<span class="small muted">' + esc(it.author) + '</span><span class="small muted">' + quietMeta(it) + '</span>' + stMark(it.id) + '</div>';
    }).join('') + '</div></section>';
  }

  core.VIEWS.library = function (main, args) {
    var F = parseQuery();
    // #library/<itemId> (alias ids ok): show that item highlighted; unknown id -> plain #library
    var a0 = args && args[0] ? String(args[0]).split('?')[0] : '', focus = a0 ? get(a0) : null, first = true;
    var cats = core.CATS.filter(function (c) { return ITEMS.some(function (it) { return it.cats.indexOf(c.id) >= 0; }); });
    var wide = window.matchMedia && window.matchMedia('(min-width: 760px)').matches;
    var dataNote = DATA.source === 'real' ? ITEMS.length + ' resources · list generated ' + esc(DATA.generated || '') :
      DATA.source === 'placeholder' ? 'Placeholder list (' + ITEMS.length + ' resources) — the full link-checked list arrives in a later update.' : 'No library data loaded.';
    var html = core.pageHead('Library', 'Books, courses, videos and practice sites for each topic — pick one, track it, and keep notes. Links open in a new tab and need a connection.', '#train', 'Train',
      '<button class="btn" type="button" id="lbMd">' + (ICONS.download || '') + ' Reading list .md</button><button class="btn ghost" type="button" id="lbZip">Notes .zip</button>');
    html += '<p class="lb-attr small muted">' + esc(ATTR) + ' — links and titles only, descriptions in our own words. <span class="lb-src" data-source="' + esc(DATA.source || '') + '">' + dataNote + '</span></p>';
    html += '<div class="lb-counts small" id="lbCounts"></div>';
    html += '<div class="lb-bar"><label class="search lb-search"><span class="sr-only">Search the library</span>' + (ICONS.search || '') +
      '<input type="search" id="lbQ" placeholder="Search title, author, topic…" value="' + esc(F.q) + '" autocomplete="off"></label>' +
      '<details class="reveal lb-filters" id="lbFilters"' + (wide || activeCount(F) ? ' open' : '') + '><summary><span>Filters</span><small class="muted" id="lbFn"></small><span class="chev" aria-hidden="true">▾</span></summary><div class="lb-fgrid">' +
      sel('lbCat', 'Topic', 'cat', cats.map(function (c) { return [c.id, c.name]; }), F) +
      sel('lbType', 'Type', 'type', distinct('type').map(function (x) { return [x, cap(x)]; }), F) +
      sel('lbLevel', 'Level', 'level', distinct('level').map(function (x) { return [x, cap(x)]; }), F) +
      sel('lbCost', 'Cost', 'cost', distinct('cost').map(function (x) { return [x, cap(x)]; }), F) +
      sel('lbPri', 'Priority', 'pri', [['start', 'Start here'], ['next', 'Next'], ['later', 'Later']], F) +
      sel('lbSt', 'My status', 'st', [['to-read', 'To read'], ['reading', 'Reading'], ['done', 'Done'], ['none', 'Not tracked']], F) +
      '</div><div class="row lb-freset"><button class="btn sm ghost" type="button" id="lbClear">Clear filters</button></div></details></div>';
    html += '<div id="lbBody"></div>';
    main.innerHTML = html;

    var body = $('#lbBody'), noteTimers = {};
    function flushNotes() {
      Object.keys(noteTimers).forEach(function (id) { clearTimeout(noteTimers[id].t); noteTimers[id].fn(); });
      noteTimers = {};
    }
    function syncHash() {
      var q = toQuery(F), h = '#library' + (q ? '?' + q : '');
      if (first && focus) return;
      if (location.hash !== h) try { history.replaceState(null, '', h); } catch (e) { }
    }
    function renderCounts() {
      var c = counts();
      $('#lbCounts').innerHTML = ST_LIST.map(function (k) {
        return '<button type="button" class="lb-count" data-cnt="' + k + '" aria-pressed="' + (F.st === k) + '"><b>' + c[k] + '</b> ' + esc(ST_NAME[k].toLowerCase()) + '</button>';
      }).join('') + '<span class="muted">' + c.rated + ' rated · ' + c.noted + ' with notes</span>';
      var n = activeCount(F); $('#lbFn').textContent = n ? n + ' active' : '';
    }
    function render() {
      flushNotes();
      var list = filterItems(F), any = F.q || activeCount(F);
      var h = '';
      if (!any) {
        var st = startItems(6);
        if (st.length) h += miniStart(st);
      }
      h += '<div class="row lb-listhead"><h2 class="label" style="margin:0">' + (any ? list.length + ' match' + (list.length === 1 ? '' : 'es') : 'All resources · ' + list.length) + '</h2></div>';
      h += list.length ? '<div class="lb-grid">' + list.map(itemCard).join('') + '</div>' :
        '<div class="card"><p class="muted">Nothing matches. Try fewer words or clear the filters.</p></div>';
      body.innerHTML = h;
      renderCounts(); syncHash(); first = false;
    }
    render();
    if (focus) {
      var fc = body.querySelector('.lb-item[data-id="' + (window.CSS && CSS.escape ? CSS.escape(focus.id) : focus.id) + '"]');
      if (fc) {
        fc.classList.add('lb-focus'); fc.setAttribute('tabindex', '-1');
        setTimeout(function () { try { fc.scrollIntoView({ block: 'center' }); fc.focus({ preventScroll: true }); } catch (e) { } }, 30);
      }
    }

    var qt = null;
    $('#lbQ').addEventListener('input', function (e) { clearTimeout(qt); qt = setTimeout(function () { F.q = e.target.value.trim(); render(); }, 150); });
    $all('select[data-f]', main).forEach(function (s) { s.addEventListener('change', function () { F[s.getAttribute('data-f')] = s.value; render(); }); });
    $('#lbClear').addEventListener('click', function () { FKEYS.forEach(function (k) { if (k !== 'q') F[k] = ''; }); $all('select[data-f]', main).forEach(function (s) { s.value = ''; }); render(); });
    $('#lbMd').addEventListener('click', function () { flushNotes(); exportMd(); });
    $('#lbZip').addEventListener('click', function () { flushNotes(); exportZip(); });
    function onClick(e) {
      var t = e.target.closest ? e.target.closest('[data-lb-st],[data-lb-rate],[data-cnt],[data-setcat]') : null;
      if (!t || !main.contains(t)) return;
      if (t.hasAttribute('data-cnt')) { var k = t.getAttribute('data-cnt'); F.st = F.st === k ? '' : k; $('#lbSt').value = F.st; render(); return; }
      if (t.hasAttribute('data-setcat')) { e.preventDefault(); F.cat = t.getAttribute('data-setcat'); $('#lbCat').value = F.cat; render(); window.scrollTo(0, 0); return; }
      var card = t.closest('.lb-item'), id = card && card.getAttribute('data-id');
      if (!id) return;
      var r = rec(id) || {};
      if (t.hasAttribute('data-lb-st')) {
        var v = t.getAttribute('data-lb-st'), nv = r.status === v ? '' : v;
        setRec(id, { status: nv });
        $all('[data-lb-st]', card).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-lb-st') === nv)); });
      } else {
        var k2 = +t.getAttribute('data-lb-rate'), nr = r.rating === k2 ? 0 : k2;
        setRec(id, { rating: nr });
        $all('[data-lb-rate]', card).forEach(function (b) { var on = +b.getAttribute('data-lb-rate') <= nr; b.setAttribute('aria-pressed', String(on)); b.textContent = on ? '★' : '☆'; });
      }
      renderCounts();
    }
    function onInput(e) {
      var ta = e.target;
      if (!ta.hasAttribute || !ta.hasAttribute('data-lb-note')) return;
      var id = ta.closest('.lb-item').getAttribute('data-id');
      if (noteTimers[id]) clearTimeout(noteTimers[id].t);
      var fn = function () { delete noteTimers[id]; setRec(id, { note: ta.value }); renderCounts(); };
      noteTimers[id] = { fn: fn, t: setTimeout(fn, 400) };
    }
    // #view persists across routes: listeners on it must be removed when the view is left
    main.addEventListener('click', onClick);
    main.addEventListener('input', onInput);
    core.onCleanup(function () { clearTimeout(qt); flushNotes(); main.removeEventListener('click', onClick); main.removeEventListener('input', onInput); });
  };

  /* ------------------------------------------------------------------ */
  /* Hooks into the rest of the app                                      */
  /* ------------------------------------------------------------------ */
  if (ITEMS.length) {
    core.HOOKS.topicCards.push(function (cat) { return shelfHtml({ cat: cat, n: 3, title: 'Read next' }); });
    core.HOOKS.firmCards.push(function (firmId) { var f = firmOf(firmId); return shelfHtml({ firm: firmId, n: 3, title: 'Reading for ' + (f ? f.name : 'this firm') }); });
  }
  core.HOOKS.trainCards.push(function () {
    var c = counts();
    return core.trainCard('#library', 'book', 'Library', 'Curated books, courses, videos and practice sites per topic, with a “Start here” shelf, your reading status, notes and ratings.',
      ITEMS.length ? ITEMS.length + ' resources · ' + c.done + ' done · ' + c.reading + ' reading' : 'No data loaded');
  });
  core.HOOKS.moreItems.push(function () {
    return '<a class="mode-card" href="#library"><span class="ic">' + IC_BOOK + '</span><span><b>Library</b><small>Reading list per topic, with notes and ratings</small></span></a>';
  });
});
