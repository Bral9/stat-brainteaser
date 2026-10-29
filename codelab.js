/* Stat Brainteaser — Coding lab (v2.1 plugin).
 *
 * Answer type 'code' (cat 'coding'): a small Python editor (plain <textarea> + line-number gutter), "Run tests" against the
 * problem's test cases, per-test results, captured stdout, autosave per problem, and the interviewer's complexity follow-up.
 * Python runs in a Web Worker (codelab-worker.js) with Pyodide, which is OPTIONAL and downloaded only when the user asks
 * (pinned v0.26.4 from jsDelivr; the service worker keeps it in its own runtime cache so the lab then works offline).
 * Without Pyodide the problem falls back to "predict the output / complexity" questions plus a self-check against the reference.
 *
 * State: core.S.codelab = { code: {id: {src, t, pass?, n?}}, cx: {id: {ok, t}}, downloaded?: t }  (created lazily).
 * API: window.SBT_CODELAB = { status(), text(), ensure(), run(code, problem), problems(), remove(), onChange(fn),
 *                             _setRunnerForTests(fn), _setStatusForTests(s, text), _setTimeoutForTests(ms) }  */
(window.SBT_PLUGINS = window.SBT_PLUGINS || []).push(function (core) {
  'use strict';
  var esc = core.esc, ICONS = core.ICONS, isPlainObj = core.isPlainObj;
  var PYO_VERSION = '0.26.4';
  var INDEX_URL = 'https://cdn.jsdelivr.net/pyodide/v' + PYO_VERSION + '/full/';
  var PYO_CACHE = 'sbt-pyodide-v' + PYO_VERSION; // must match sw.js PYODIDE_CACHE
  // files Pyodide fetches at start-up, with their (uncompressed) sizes, for an honest progress bar
  var FILES = [['pyodide.js', 14761], ['pyodide.asm.js', 1229099], ['pyodide.asm.wasm', 10088051], ['python_stdlib.zip', 2341872], ['pyodide-lock.json', 106335]];
  var TOTAL_BYTES = FILES.reduce(function (s, f) { return s + f[1]; }, 0);
  var WORKER_URL = 'codelab-worker.js';
  var DL_LABEL = 'Download coding lab (~10 MB, once)';

  /* ------------------------------------------------------------------ */
  /* State                                                               */
  /* ------------------------------------------------------------------ */
  function C() {
    var S = core.S;
    if (!isPlainObj(S.codelab)) S.codelab = {};
    var c = S.codelab;
    if (!isPlainObj(c.code)) c.code = {};
    if (!isPlainObj(c.cx)) c.cx = {};
    return c;
  }
  // Merge-import: union by problem id, newest t wins. `downloaded` is NOT merged: it describes this device's cache.
  core.HOOKS.mergeState.push(function (cur, inc) {
    if (!inc || !isPlainObj(inc.codelab)) return;
    if (!isPlainObj(cur.codelab)) cur.codelab = {};
    var a = cur.codelab, b = inc.codelab;
    ['code', 'cx'].forEach(function (k) {
      if (!isPlainObj(a[k])) a[k] = {};
      var src = isPlainObj(b[k]) ? b[k] : {};
      Object.keys(src).forEach(function (id) {
        var x = a[k][id], y = src[id];
        if (!isPlainObj(y)) return;
        if (!isPlainObj(x) || (y.t || 0) > (x.t || 0)) a[k][id] = y;
      });
    });
  });

  function problems() { return core.PROBLEMS.filter(function (p) { return p.answer && p.answer.type === 'code'; }); }
  function starterOf(p) { var a = p.answer || {}; return a.starter || ((a.signature || 'def solve():') + '\n    pass\n'); }

  /* ------------------------------------------------------------------ */
  /* Runner (Pyodide in a Web Worker)                                    */
  /* ------------------------------------------------------------------ */
  var R = { status: 'none', text: '', worker: null, ready: null, version: '', initMs: 0, seq: 0, pending: {}, listeners: [],
    mock: null, mockStatus: null, mockText: '', timeout: 8000 };
  function status() { return R.mockStatus || (R.mock ? 'ready' : R.status); }
  function statusText() { return R.mockStatus ? R.mockText : R.mock ? 'Test runner' : R.text; }
  function emit() { R.listeners.slice().forEach(function (fn) { try { fn(); } catch (e) { console.warn(e); } }); }
  function setStatus(s, text) { R.status = s; R.text = text || ''; emit(); }
  function onChange(fn) { R.listeners.push(fn); return function () { R.listeners = R.listeners.filter(function (f) { return f !== fn; }); }; }
  function mb(n) { return (n / 1048576).toFixed(1); }

  function kill() {
    if (R.worker) { try { R.worker.terminate(); } catch (e) { } }
    R.worker = null;
    Object.keys(R.pending).forEach(function (k) { var cb = R.pending[k]; delete R.pending[k]; cb({ results: [], stdout: '', error: 'Python was restarted.' }); });
  }
  // Warm the service-worker cache with a visible byte counter (first download only, only when a SW controls the page).
  function prefetch(first) {
    var sw = navigator.serviceWorker && navigator.serviceWorker.controller;
    if (!first || !sw || !window.fetch || !window.ReadableStream) return Promise.resolve();
    var got = {};
    function tick() {
      var n = 0; Object.keys(got).forEach(function (k) { n += got[k]; });
      if (R.status === 'downloading') setStatus('downloading', 'Downloading Python… ' + mb(Math.min(n, TOTAL_BYTES)) + ' / ' + mb(TOTAL_BYTES) + ' MB');
    }
    return Promise.all(FILES.map(function (f) {
      return fetch(INDEX_URL + f[0], { mode: 'cors', credentials: 'omit' }).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status + ' for ' + f[0]);
        if (!res.body || !res.body.getReader) return res.arrayBuffer();
        var rd = res.body.getReader(); got[f[0]] = 0;
        function pump() { return rd.read().then(function (r) { if (r.done) return; got[f[0]] += r.value.length; tick(); return pump(); }); }
        return pump();
      });
    })).catch(function (e) { console.warn('codelab prefetch', e); /* the worker will try the network itself */ });
  }
  function spawn() {
    return new Promise(function (resolve, reject) {
      var w, done = false;
      try { w = new Worker(WORKER_URL); } catch (e) { reject(e); return; }
      R.worker = w;
      var limit = setTimeout(function () { if (!done) { done = true; reject(new Error('Python took too long to start.')); } }, 180000);
      w.onmessage = function (ev) {
        var m = ev.data || {};
        if (m.type === 'progress') { if (!done && R.worker === w) setStatus('downloading', m.text); }
        else if (m.type === 'ready') { if (!done) { done = true; clearTimeout(limit); R.version = m.version || PYO_VERSION; R.initMs = m.ms || 0; resolve(m); } }
        else if (m.type === 'error') { if (!done) { done = true; clearTimeout(limit); reject(new Error(m.error || 'Python failed to start.')); } }
        else if (m.type === 'result') { var cb = R.pending[m.id]; if (cb) { delete R.pending[m.id]; cb(m); } }
      };
      w.onerror = function (e) {
        if (e && e.preventDefault) e.preventDefault();
        if (!done) { done = true; clearTimeout(limit); reject(new Error((e && e.message) || 'The coding-lab worker failed to load.')); }
      };
      w.postMessage({ type: 'init', indexURL: INDEX_URL });
    });
  }
  function ensure() {
    if (R.mock) return Promise.resolve();
    if (R.status === 'ready' && R.worker) return Promise.resolve();
    if (R.ready) return R.ready;
    if (typeof Worker === 'undefined') { setStatus('error', 'This browser cannot run background workers.'); return Promise.reject(new Error(R.text)); }
    var first = !C().downloaded;
    setStatus('downloading', first ? 'Downloading Python (~10 MB)…' : 'Starting Python…');
    var t0 = Date.now();
    R.ready = prefetch(first).then(spawn).then(function () {
      R.ready = null;
      var c = C();
      if (!c.downloaded) { c.downloaded = Date.now(); core.save(); }
      autoTried = true;
      R.loadMs = Date.now() - t0;
      setStatus('ready', 'Python ' + R.version + ' ready');
    }, function (e) {
      R.ready = null; kill();
      var off = navigator.onLine === false;
      setStatus('error', (off ? 'You are offline and the coding lab is not downloaded yet. ' : 'Could not load Python: ') + (off ? '' : String(e && e.message || e)));
      throw e;
    });
    return R.ready;
  }
  // after a timeout: the worker is stuck in a loop — terminate it and start a fresh one (from cache)
  function restart() {
    if (R.mock) return;
    kill(); R.status = 'none';
    ensure().catch(function () { });
  }
  function runWorker(code, a) {
    return new Promise(function (resolve) {
      var id = ++R.seq;
      R.pending[id] = resolve;
      R.worker.postMessage({ type: 'run', id: id, code: code, fn: a.fn, tests: a.tests || [], cmp: a.cmp || 'exact' });
    });
  }
  function timed(promise, ms) {
    return new Promise(function (resolve, reject) {
      var t = setTimeout(function () { reject({ timeout: true }); }, ms);
      Promise.resolve(promise).then(function (v) { clearTimeout(t); resolve(v); }, function (e) { clearTimeout(t); reject(e); });
    });
  }
  /* run(code, problem) -> Promise<{pass, results:[{pass, got, error}], stdout, error, ms, timeout?}> (never rejects) */
  function run(code, p) {
    var a = (p && p.answer) || {};
    var n = (a.tests || []).length, t0 = Date.now();
    var pre = R.mock ? Promise.resolve() : ensure();
    return pre.then(function () {
      var t1 = Date.now();
      return timed(R.mock ? Promise.resolve().then(function () { return R.mock(code, p); }) : runWorker(code, a), R.timeout).then(function (r) {
        r = r || {};
        var results = Array.isArray(r.results) ? r.results : [];
        return { pass: !r.error && n > 0 && results.length === n && results.every(function (x) { return x && x.pass; }),
          results: results, stdout: String(r.stdout || ''), error: r.error || null, ms: r.ms != null ? r.ms : Date.now() - t1 };
      });
    }).catch(function (e) {
      if (e && e.timeout) { restart(); return { pass: false, results: [], stdout: '', error: 'Timed out after ' + Math.round(R.timeout / 1000) + ' s — infinite loop? Python was restarted.', timeout: true, ms: Date.now() - t0 }; }
      return { pass: false, results: [], stdout: '', error: String(e && e.message || e), ms: Date.now() - t0, unavailable: true };
    });
  }
  function cacheHasPyodide() {
    try {
      if (!window.caches) return Promise.resolve(false);
      return caches.open(PYO_CACHE).then(function (c) { return c.match(INDEX_URL + 'pyodide.asm.wasm', { ignoreVary: true }); })
        .then(function (r) { return !!r; }, function () { return false; });
    } catch (e) { return Promise.resolve(false); }
  }
  // Start Python quietly when this device already has the files (runtime cache present) — never triggers a fresh download.
  // The cache, not the saved flag, is the truth: the flag can come from another device (import) or be lost with localStorage.
  var autoTried = false;
  function autoStart() {
    if (autoTried || R.mock || R.status !== 'none') return;
    autoTried = true;
    cacheHasPyodide().then(function (has) { if (has && R.status === 'none') ensure().catch(function () { }); });
  }
  function remove() {
    kill(); R.ready = null; autoTried = false;
    delete C().downloaded; core.save();
    var p = window.caches ? caches.delete(PYO_CACHE).catch(function () { }) : Promise.resolve();
    setStatus('none', '');
    return p;
  }

  /* ------------------------------------------------------------------ */
  /* Small helpers                                                       */
  /* ------------------------------------------------------------------ */
  function hash(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; }
  function cxNorm(s) { return String(s || '').toLowerCase().replace(/\s+/g, '').replace(/²/g, '^2').replace(/³/g, '^3').replace(/ⁿ/g, '^n').replace(/[·*×⋅]/g, '').replace(/[()]/g, ''); }
  var CX_POOL = ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)', 'O(n³)', 'O(2ⁿ)', 'O(n!)', 'O(√n)', 'O(n·k)'];
  /* the complexity choice: correct time + naive (if any) + deterministic distractors, deterministic order */
  function cxOptions(p) {
    var cx = (p.answer || {}).complexity || {};
    var right = cx.time || 'O(n)';
    var seen = {}; seen[cxNorm(right)] = 1;
    var opts = [right];
    if (cx.naive && !seen[cxNorm(cx.naive)]) { opts.push(cx.naive); seen[cxNorm(cx.naive)] = 1; }
    var pool = CX_POOL.slice().sort(function (x, y) { return hash(p.id + x) - hash(p.id + y); });
    for (var i = 0; i < pool.length && opts.length < 4; i++) if (!seen[cxNorm(pool[i])]) { opts.push(pool[i]); seen[cxNorm(pool[i])] = 1; }
    opts.sort(function (x, y) { return hash(p.id + '|' + x) - hash(p.id + '|' + y); });
    return { options: opts, correct: opts.indexOf(right) };
  }
  function short(s, n) { s = String(s == null ? '' : s); return s.length > n ? s.slice(0, n - 1) + '…' : s; }
  function jsonShow(v) { try { return JSON.stringify(v); } catch (e) { return String(v); } }
  function argsShow(args) { var s = jsonShow(args || []); return s.charAt(0) === '[' ? s.slice(1, -1) : s; }

  /* ------------------------------------------------------------------ */
  /* Editor: textarea + gutter, Tab / Shift+Tab / Enter / Backspace      */
  /* ------------------------------------------------------------------ */
  var IND = '    ';
  function bindEditor(ta, gutter, onChange) {
    var escArmed = false;
    function lineStart(v, i) { return v.lastIndexOf('\n', i - 1) + 1; }
    function lineEnd(v, i) { var j = v.indexOf('\n', i); return j < 0 ? v.length : j; }
    function edit(start, end, text, s2, e2) {
      var v = ta.value, want = v.slice(0, start) + text + v.slice(end);
      if (document.activeElement !== ta) ta.focus();
      ta.setSelectionRange(start, end);
      var ok = false;
      try { ok = text ? document.execCommand('insertText', false, text) : document.execCommand('delete'); } catch (e) { ok = false; }
      if (!ok || ta.value !== want) { ta.value = want; ta.dispatchEvent(new Event('input', { bubbles: true })); } // keeps undo where supported
      ta.setSelectionRange(s2, e2 == null ? s2 : e2);
    }
    function sel() { return { v: ta.value, s: ta.selectionStart, e: ta.selectionEnd }; }
    function blockRange(x) { // whole lines touched by the selection (a selection ending at a line start excludes that line)
      var e = x.e > x.s && x.v.charAt(x.e - 1) === '\n' ? x.e - 1 : x.e;
      return { a: lineStart(x.v, x.s), b: lineEnd(x.v, e) };
    }
    function indent() {
      var x = sel();
      if (x.v.slice(x.s, x.e).indexOf('\n') < 0) { edit(x.s, x.e, IND, x.s + IND.length); return; }
      var r = blockRange(x), blk = x.v.slice(r.a, r.b), lines = blk.split('\n');
      var out = lines.map(function (l) { return l.length ? IND + l : l; }).join('\n');
      edit(r.a, r.b, out, x.s + (lines[0].length ? IND.length : 0), x.e + (out.length - blk.length));
    }
    function dedent() {
      var x = sel(), r = blockRange(x), blk = x.v.slice(r.a, r.b), lines = blk.split('\n');
      var first = 0, out = lines.map(function (l, i) {
        var m = /^( {1,4}|\t)/.exec(l), k = m ? m[0].length : 0;
        if (i === 0) first = k;
        return l.slice(k);
      }).join('\n');
      if (out === blk) return;
      var s2 = Math.max(r.a, x.s - first);
      edit(r.a, r.b, out, s2, x.s === x.e ? s2 : Math.max(s2, x.e - (blk.length - out.length)));
    }
    function newline() {
      var x = sel(), line = x.v.slice(lineStart(x.v, x.s), x.s);
      var ind = /^[ \t]*/.exec(line)[0], code = line.replace(/#.*$/, '').replace(/\s+$/, '');
      if (/:$/.test(code)) ind += IND;
      else if (/^\s*(return|pass|break|continue|raise)\b/.test(code)) ind = ind.slice(0, Math.max(0, ind.length - IND.length));
      edit(x.s, x.e, '\n' + ind, x.s + 1 + ind.length);
    }
    function backspace() {
      var x = sel();
      if (x.s !== x.e || x.s === 0) return false;
      var before = x.v.slice(lineStart(x.v, x.s), x.s);
      if (!before.length || !/^ +$/.test(before)) return false;
      var n = before.length % IND.length || IND.length;
      edit(x.s - n, x.s, '', x.s - n);
      return true;
    }
    ta.addEventListener('keydown', function (e) {
      if (e.isComposing) return;
      if (e.key === 'Escape') { escArmed = true; return; }
      if (e.key === 'Tab') {
        if (escArmed || e.ctrlKey || e.altKey || e.metaKey) { escArmed = false; return; } // Esc, then Tab leaves the editor
        e.preventDefault();
        if (e.shiftKey) dedent(); else indent();
        return;
      }
      escArmed = false;
      if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); newline(); }
      else if (e.key === 'Backspace' && !e.ctrlKey && !e.metaKey && !e.altKey) { if (backspace()) e.preventDefault(); }
    });
    var lastN = 0;
    function gut() {
      var n = ta.value.split('\n').length;
      if (n !== lastN) {
        lastN = n;
        var s = ''; for (var i = 1; i <= n; i++) s += i + '\n';
        gutter.textContent = s;
        ta.rows = Math.min(Math.max(n + 1, 8), 24);
      }
      gutter.scrollTop = ta.scrollTop;
    }
    ta.addEventListener('input', function () { gut(); if (onChange) onChange(ta.value); });
    ta.addEventListener('scroll', function () { gutter.scrollTop = ta.scrollTop; });
    gut();
    return { refresh: gut, indent: indent, dedent: dedent, newline: newline };
  }

  /* ------------------------------------------------------------------ */
  /* Answer type 'code'                                                  */
  /* ------------------------------------------------------------------ */
  function runnerLine() {
    var s = status(), t = statusText();
    var ic = s === 'ready' ? '<span class="cl-dot ok" aria-hidden="true"></span>' : s === 'downloading' ? '<span class="cl-dot busy" aria-hidden="true"></span>' : s === 'error' ? '<span class="cl-dot bad" aria-hidden="true"></span>' : '<span class="cl-dot" aria-hidden="true"></span>';
    var txt = s === 'ready' ? (t || 'Python ready') : s === 'downloading' ? (t || 'Loading Python…') : s === 'error' ? (t || 'Python failed to load') : 'Python not downloaded';
    return ic + '<span>' + esc(txt) + '</span>';
  }
  function predictHtml(p) {
    var a = p.answer || {}, qs = Array.isArray(a.predict) ? a.predict : [];
    return '<div class="cl-fb">' +
      '<p class="cl-h">Without the Python runner: check yourself</p>' +
      '<p class="small muted">Predict, then compare your code with the reference. All predictions right + equivalent code counts as solved.</p>' +
      (qs.length ? '<ol class="cl-pq">' + qs.map(function (q, i) {
        var qa = q.answer || {};
        var inner = qa.type === 'choice'
          ? '<div class="cl-qch" role="group" aria-label="Choices">' + (qa.options || []).map(function (o, j) { return '<button type="button" class="btn sm" data-qc="' + j + '">' + 'ABCDEFGH'.charAt(j) + '. ' + o + '</button>'; }).join('') + '</div>'
          : '<form class="cl-qf row" autocomplete="off" novalidate><label class="sr-only" for="clq-' + esc(p.id) + '-' + i + '">Your prediction</label><input type="text" id="clq-' + esc(p.id) + '-' + i + '" class="cl-qin" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Your prediction"><button class="btn sm" type="submit">Check</button></form>';
        return '<li data-q="' + i + '"><div class="cl-qp">' + (q.prompt || '') + '</div>' + inner + '<div class="cl-qfb small" role="status" aria-live="polite"></div></li>';
      }).join('') + '</ol>' : '') +
      '<details class="reveal cl-refd"><summary>' + ICONS.code + '<span>Compare with the reference</span><span class="chev" aria-hidden="true">▾</span></summary><div class="rbody"><pre class="cl-pre cl-code"><code>' + esc(a.reference || '') + '</code></pre></div></details>' +
      '<div class="cl-self row" role="group" aria-label="Self-check"><span class="small">Self-check:</span>' +
      '<button type="button" class="btn sm" data-self="1">' + ICONS.check + ' I wrote equivalent code</button>' +
      '<button type="button" class="btn sm" data-self="0">' + ICONS.x + ' I didn’t</button></div>' +
      '<p class="small muted cl-selfnote"></p></div>';
  }
  function resultsHtml(r, p) {
    var tests = (p.answer || {}).tests || [];
    var nPass = r.results.filter(function (x) { return x && x.pass; }).length;
    var html = '<div class="cl-sum"><b class="' + (r.pass ? 'cl-ok' : 'cl-bad') + '">' + (r.error && !r.results.length ? (r.timeout ? 'Timed out' : 'Error') : nPass + '/' + tests.length + ' tests pass') + '</b>' +
      '<span class="muted small">' + (r.ms != null ? Math.round(r.ms) + ' ms' : '') + '</span></div>';
    if (r.error) html += '<p class="cl-err mono small">' + esc(r.error) + '</p>';
    if (r.results.length) {
      html += '<div class="table-scroll cl-tblwrap"><table class="simple cl-tbl"><thead><tr><th scope="col">#</th><th scope="col">Input</th><th scope="col">Expected</th><th scope="col">Got</th><th scope="col"><span class="sr-only">Result</span></th></tr></thead><tbody>' +
        tests.map(function (t, i) {
          var x = r.results[i] || { pass: false, error: 'not run' };
          var inp = argsShow(t.args), exp = jsonShow(t.expected), got = x.error ? x.error : (x.got != null ? String(x.got) : '');
          return '<tr class="' + (x.pass ? 'cl-pass' : 'cl-fail') + '"><td>' + (i + 1) + '</td>' +
            '<td class="mono" title="' + esc(inp) + '">' + esc(short(inp, 42)) + '</td>' +
            '<td class="mono" title="' + esc(exp) + '">' + esc(short(exp, 28)) + '</td>' +
            '<td class="mono' + (x.error ? ' cl-errc' : '') + '" title="' + esc(got) + '">' + esc(short(got, 40)) + '</td>' +
            '<td>' + core.statusIcon(x.pass ? 'solved' : 'wrong') + '</td></tr>';
        }).join('') + '</tbody></table></div>';
    }
    if (r.stdout) html += '<details class="cl-out" open><summary class="small">Output (print)</summary><pre class="cl-pre">' + esc(r.stdout) + '</pre></details>';
    return html;
  }

  core.ANSWER_TYPES.code = {
    html: function (p) {
      var a = p.answer || {}, id = esc(p.id);
      var saved = (C().code[p.id] || {}).src;
      return '<div class="cl-wrap" data-cl-wrap>' +
        '<div class="cl-head"><code class="cl-sig">' + esc(a.signature || ('def ' + (a.fn || 'solve') + '(…):')) + '</code><span class="cl-run small muted" data-cl-runner role="status" aria-live="polite">' + runnerLine() + '</span></div>' +
        '<div class="cl-editor"><pre class="cl-gutter" aria-hidden="true"></pre>' +
        '<label class="sr-only" for="cl-ta-' + id + '">Python code for ' + esc(a.fn || 'the function') + '</label>' +
        '<textarea id="cl-ta-' + id + '" class="cl-ta" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" wrap="off" rows="10" aria-describedby="cl-help-' + id + '">' + esc(saved != null ? saved : starterOf(p)) + '</textarea></div>' +
        '<p class="cl-help small muted" id="cl-help-' + id + '">Tab indents · Shift+Tab dedents · Esc then Tab leaves the editor · saved automatically</p>' +
        '<div class="cl-actions">' +
        '<button type="button" class="btn primary" data-cl="run">' + ICONS.play + ' Run tests</button>' +
        '<button type="button" class="btn primary hidden" data-cl="download">' + ICONS.download + ' ' + DL_LABEL + '</button>' +
        '<button type="button" class="btn ghost" data-cl="reset">' + (ICONS.undo || '') + ' Reset to starter</button>' +
        '<button type="button" class="btn ghost" data-cl="cx">Complexity question</button>' +
        '</div>' +
        '<div class="cl-results" data-cl-results aria-live="polite"></div>' +
        '<div class="cl-fbhost" data-cl-fallback></div>' +
        '<div class="cl-cxhost" data-cl-cx></div>' +
        '</div>';
    },
    bind: function (host, p, api) {
      if (!host) return;
      var a = p.answer || {};
      var wrap = host.querySelector('[data-cl-wrap]');
      var ta = wrap.querySelector('.cl-ta'), gutter = wrap.querySelector('.cl-gutter');
      var runBtn = wrap.querySelector('[data-cl="run"]'), dlBtn = wrap.querySelector('[data-cl="download"]');
      var resEl = wrap.querySelector('[data-cl-results]'), fbHost = wrap.querySelector('[data-cl-fallback]'), cxHost = wrap.querySelector('[data-cl-cx]');
      var runnerEl = wrap.querySelector('[data-cl-runner]');
      var st = { busy: false, fbShown: false, pred: {}, cxShown: false, runs: 0 };
      wrap._cl = st;

      /* autosave (debounced) */
      var tmr = null;
      function persist() {
        tmr = null;
        var c = C(), src = ta.value, prev = c.code[p.id];
        if (src === starterOf(p) && !(prev && prev.n)) delete c.code[p.id];
        else c.code[p.id] = { src: src, t: Date.now(), pass: prev && prev.pass, n: prev && prev.n };
        core.save();
      }
      function schedule() { clearTimeout(tmr); tmr = setTimeout(persist, 400); }
      function flush() { if (tmr) { clearTimeout(tmr); persist(); } }
      ta.addEventListener('blur', flush);
      core.onCleanup(flush);
      var ed = bindEditor(ta, gutter, schedule);
      wrap._editor = ed;

      /* reference solution in the normal Solution section */
      var solBody = api.card && api.card.querySelector('details.sol .rbody');
      if (solBody && a.reference && core.stripTags(p.solution || '').indexOf('def ' + a.fn + '(') < 0) {
        var cx = a.complexity || {};
        solBody.insertAdjacentHTML('beforeend', '<p class="cl-h">Reference solution</p><pre class="cl-pre cl-code"><code>' + esc(a.reference) + '</code></pre>' +
          (cx.time ? '<p class="small">Time <b class="mono">' + esc(cx.time) + '</b>' + (cx.space ? ' · space <b class="mono">' + esc(cx.space) + '</b>' : '') + (cx.naive ? ' · naive <span class="mono">' + esc(cx.naive) + '</span>' : '') + '</p>' : ''));
      }

      /* mode: runner available → Run tests; otherwise Download + the predict / self-check fallback */
      function sync() {
        if (!wrap.isConnected) { unsub(); return; }
        var s = status();
        runnerEl.innerHTML = runnerLine();
        runBtn.classList.toggle('hidden', s === 'none' || s === 'error');
        runBtn.disabled = st.busy || s !== 'ready';
        dlBtn.classList.toggle('hidden', !(s === 'none' || s === 'error'));
        dlBtn.innerHTML = ICONS.download + ' ' + (s === 'error' ? 'Retry download' : DL_LABEL);
        var wantFb = s !== 'ready' && !st.fbShown && !(api.state.graded);
        if (wantFb) { st.fbShown = true; fbHost.innerHTML = predictHtml(p); bindPredict(); }
        if (s === 'ready' && st.fbShown && !st.fbUsed) { fbHost.innerHTML = ''; st.fbShown = false; }
      }
      var unsub = onChange(sync);
      core.onCleanup(unsub);
      sync();
      autoStart();

      dlBtn.addEventListener('click', function () { ensure().catch(function () { }); });
      wrap.querySelector('[data-cl="reset"]').addEventListener('click', function () {
        var old = ta.value, start = starterOf(p);
        if (old === start) { core.toast('Already the starter code.', null, null, 1400); return; }
        ta.value = start; ed.refresh(); persist();
        core.toast('Reset to the starter code.', 'Undo', function () { ta.value = old; ed.refresh(); persist(); }, 5000);
      });
      wrap.querySelector('[data-cl="cx"]').addEventListener('click', function () { showCx(true); });

      runBtn.addEventListener('click', function () {
        if (st.busy) return;
        if (status() !== 'ready') { sync(); return; }
        st.busy = true; st.runs++; sync();
        runBtn.innerHTML = ICONS.play + ' Running…';
        resEl.innerHTML = '<p class="small muted">Running ' + ((a.tests || []).length) + ' tests…</p>';
        flush();
        run(ta.value, p).then(function (r) {
          st.busy = false; runBtn.innerHTML = ICONS.play + ' Run tests'; sync();
          if (!wrap.isConnected) return;
          resEl.innerHTML = resultsHtml(r, p);
          var nPass = r.results.filter(function (x) { return x && x.pass; }).length, n = (a.tests || []).length;
          var c = C(), e = c.code[p.id] || { src: ta.value, t: Date.now() };
          e.pass = nPass; e.n = n; e.t = Date.now(); e.src = ta.value; c.code[p.id] = e; core.save();
          if (r.pass) {
            if (!api.state.graded) {
              api.feedback('ok', '<b>All ' + n + ' tests pass.</b>' + (api.interview ? '' : ' Now the follow-up: complexity.'));
              api.grade(true, 'tests');
              if (!api.interview && api.confetti) api.confetti();
            } else api.feedback('ok', 'All tests pass' + (api.state.correct ? '.' : ' (this problem was already graded).'));
            showCx(false);
          } else if (r.timeout) {
            api.feedback('bad', '<b>Timed out.</b> Your code ran longer than ' + Math.round(R.timeout / 1000) + ' s — an infinite loop, or a too-slow algorithm.');
          } else {
            api.feedback('bad', r.error && !r.results.length ? '<b>Your code did not run.</b> Fix the error and run again.' : '<b>' + nPass + '/' + n + ' tests pass.</b> Not graded yet — fix and run again, or open a hint.');
          }
        });
      });

      /* fallback: predict questions + self-check */
      function bindPredict() {
        var qs = Array.isArray(a.predict) ? a.predict : [];
        var selfNote = fbHost.querySelector('.cl-selfnote');
        function allDone() { return qs.every(function (_, i) { return st.pred[i] != null; }); }
        function syncSelf() {
          var done = allDone();
          fbHost.querySelectorAll('[data-self]').forEach(function (b) { b.disabled = !done || api.state.graded; });
          if (selfNote) selfNote.textContent = api.state.graded ? '' : done ? '' : 'Answer the prediction' + (qs.length > 1 ? 's' : '') + ' first.';
        }
        function answer(i, raw) {
          var li = fbHost.querySelector('li[data-q="' + i + '"]'), out = li.querySelector('.cl-qfb');
          if (st.pred[i] != null) return;
          var q = qs[i], r = core.checkAnswer({ answer: q.answer }, raw);
          if (r.invalid) { out.className = 'cl-qfb small muted'; out.textContent = 'I couldn’t read that — try a number, a fraction or a letter.'; return; }
          st.pred[i] = !!r.ok; st.fbUsed = true;
          out.className = 'cl-qfb small ' + (r.ok ? 'cl-ok' : 'cl-bad');
          out.innerHTML = r.ok ? ICONS.check + ' Right.' : ICONS.x + ' Not quite — the answer is <b>' + core.answerDisplay({ answer: q.answer }) + '</b>.';
          li.querySelectorAll('input, button').forEach(function (el) { el.disabled = true; });
          if (q.answer && q.answer.type === 'choice') {
            var btns = li.querySelectorAll('[data-qc]');
            if (btns[q.answer.correct]) btns[q.answer.correct].classList.add('cl-right');
          }
          syncSelf();
        }
        fbHost.querySelectorAll('li[data-q]').forEach(function (li) {
          var i = +li.getAttribute('data-q');
          var f = li.querySelector('form');
          if (f) f.addEventListener('submit', function (e) { e.preventDefault(); answer(i, li.querySelector('input').value); });
          li.querySelectorAll('[data-qc]').forEach(function (b) { b.addEventListener('click', function () { answer(i, 'ABCDEFGH'.charAt(+b.getAttribute('data-qc'))); }); });
        });
        fbHost.querySelectorAll('[data-self]').forEach(function (b) {
          b.addEventListener('click', function () {
            if (api.state.graded || !allDone()) return;
            st.fbUsed = true;
            var eq = b.getAttribute('data-self') === '1';
            var predOk = qs.every(function (_, i) { return st.pred[i]; });
            var ok = eq && predOk;
            api.feedback(ok ? 'ok' : 'bad', ok ? '<b>Solved</b> (predictions right, code matches the reference).' : eq ? 'Code matches, but a prediction was off — marked as not solved; it comes back in Review.' : 'Marked as not solved — it comes back in Review. Compare with the reference and try again later.');
            api.grade(ok, 'predict');
            if (ok && !api.interview && api.confetti) api.confetti();
            syncSelf();
          });
        });
        syncSelf();
      }

      /* complexity follow-up */
      function showCx(onRequest) {
        if (st.cxShown) { if (onRequest) cxHost.scrollIntoView({ block: 'nearest' }); return; }
        st.cxShown = true;
        var cx = a.complexity || {}, o = cxOptions(p);
        cxHost.innerHTML = '<div class="cl-cx"><p class="cl-h">Follow-up: complexity</p>' +
          '<p>What’s the time complexity of a good solution?</p>' +
          '<div class="cl-cxch" role="group" aria-label="Time complexity">' + o.options.map(function (t, i) {
            return '<button type="button" class="btn sm cl-cxb mono" data-cx="' + i + '">' + esc(t) + '</button>';
          }).join('') + '</div><div class="cl-cxfb small" role="status" aria-live="polite"></div>' +
          '<div class="cl-cx2 hidden"><p>Why is the naive version slow? Name the fix.</p>' +
          '<label class="sr-only" for="cl-why-' + esc(p.id) + '">Your explanation</label><textarea id="cl-why-' + esc(p.id) + '" class="cl-why" rows="2" placeholder="Say it out loud, or type a line"></textarea>' +
          '<button type="button" class="btn sm" data-cl="model">Show the model answer</button>' +
          '<div class="cl-model hidden"><p class="small"><b>Time</b> <span class="mono">' + esc(cx.time || '—') + '</span> · <b>space</b> <span class="mono">' + esc(cx.space || '—') + '</span>' +
          (cx.naive ? ' · <b>naive</b> <span class="mono">' + esc(cx.naive) + '</span>' : '') + '</p>' + (cx.why ? '<p class="small">' + cx.why + '</p>' : '') + '</div></div></div>';
        var fb = cxHost.querySelector('.cl-cxfb');
        cxHost.querySelectorAll('[data-cx]').forEach(function (b) {
          b.addEventListener('click', function () {
            var i = +b.getAttribute('data-cx'), ok = i === o.correct;
            cxHost.querySelectorAll('[data-cx]').forEach(function (x, j) { x.disabled = true; if (j === o.correct) x.classList.add('cl-right'); else if (j === i) x.classList.add('cl-wrong'); });
            fb.className = 'cl-cxfb small ' + (ok ? 'cl-ok' : 'cl-bad');
            fb.innerHTML = ok ? ICONS.check + ' Right: ' + esc(o.options[o.correct]) + '.' : ICONS.x + ' It’s ' + esc(o.options[o.correct]) + '.';
            C().cx[p.id] = { ok: ok, t: Date.now() }; core.save();
            cxHost.querySelector('.cl-cx2').classList.remove('hidden');
          });
        });
        cxHost.querySelector('[data-cl="model"]').addEventListener('click', function () { cxHost.querySelector('.cl-model').classList.remove('hidden'); this.classList.add('hidden'); });
      }
      wrap._showCx = showCx;
    }
  };
  /* Regression-harness hook: solve through the real UI. Fallback (no Python): answer every prediction correctly, then
   * "I wrote equivalent code". Runner ready: paste the reference and run the tests. Resolves when graded (or after 15 s). */
  core.ANSWER_TYPES.code.testSolve = function (host, p) {
    var a = p.answer || {}, wrap = host && host.querySelector('[data-cl-wrap]');
    if (!wrap) return Promise.resolve();
    var card = wrap.closest('.problem');
    function graded() { return card && (card.classList.contains('is-correct') || card.classList.contains('is-wrong')); }
    function waitGraded() {
      return new Promise(function (res) { var n = 0; (function poll() { if (graded() || n++ > 150) res(); else setTimeout(poll, 100); })(); });
    }
    var fb = wrap.querySelector('[data-cl-fallback] .cl-fb');
    if (status() === 'ready' && !fb) {
      var ta = wrap.querySelector('.cl-ta');
      ta.value = a.reference || ''; ta.dispatchEvent(new Event('input', { bubbles: true }));
      wrap.querySelector('[data-cl="run"]').click();
      return waitGraded();
    }
    (a.predict || []).forEach(function (q, i) {
      var li = fb.querySelector('li[data-q="' + i + '"]'), qa = q.answer || {};
      if (!li) return;
      if (qa.type === 'choice') { var b = li.querySelectorAll('[data-qc]')[qa.correct]; if (b) b.click(); return; }
      var raw = qa.type === 'numeric' ? String(qa.value) : qa.type === 'multi' ? (qa.values || []).map(String).join(', ') : qa.type === 'text' ? (qa.accept || [])[0] : '';
      li.querySelector('input').value = raw;
      li.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    });
    var yes = fb.querySelector('[data-self="1"]'); if (yes) yes.click();
    return waitGraded();
  };
  // complexity follow-up after ANY grading path (tests, predictions, revealed solution, give up)
  core.HOOKS.graded.push(function (p, ok, card) {
    if (!p || !p.answer || p.answer.type !== 'code' || !card) return;
    var w = card.querySelector('[data-cl-wrap]');
    if (w && w._showCx) w._showCx(false);
  });

  /* ------------------------------------------------------------------ */
  /* #codelab page                                                       */
  /* ------------------------------------------------------------------ */
  var CHEAT = [
    ['x in list / list.index', 'O(n)', 'set / dict lookup O(1) avg'],
    ['list.insert(0, x) / pop(0)', 'O(n)', 'collections.deque O(1)'],
    ['s += piece in a loop', 'O(n²) total', "''.join(parts) O(n)"],
    ['sorted / list.sort', 'O(n log n)', 'heapq for top-k: O(n log k)'],
    ['min of a sliding window', 'O(n·k)', 'monotonic deque O(n)'],
    ['recursion that repeats work', 'O(2ⁿ)', '@lru_cache / DP table'],
    ['search a sorted list', 'O(n)', 'bisect O(log n)'],
    ['all pairs (i, j)', 'O(n²)', 'hash map / two pointers O(n)']
  ];
  function runnerCardHtml() {
    var s = status(), c = C();
    var act = s === 'ready' ? '<button type="button" class="btn ghost sm" data-clp="remove">' + (ICONS.trash || '') + ' Remove download</button>'
      : s === 'downloading' ? '<button type="button" class="btn sm" disabled>Downloading…</button>'
      : '<button type="button" class="btn primary" data-clp="download">' + ICONS.download + ' ' + (s === 'error' ? 'Retry download' : DL_LABEL) + '</button>';
    return '<div class="card cl-runner"><p class="cl-h">Python runner</p>' +
      '<p class="cl-run" role="status" aria-live="polite">' + runnerLine() + '</p>' +
      '<div class="row">' + act + (s !== 'ready' && c.downloaded ? '<button type="button" class="btn ghost sm" data-clp="remove">Forget download</button>' : '') + '</div>' +
      '<p class="small muted">Pyodide ' + PYO_VERSION + ' (Python compiled to WebAssembly) comes from cdn.jsdelivr.net once — about ' + Math.round(TOTAL_BYTES / 1048576) +
      ' MB of browser storage — and is then kept for offline use. Your code runs on this device in a background worker; nothing is uploaded. Without it, coding problems use prediction questions and a self-check instead.' +
      (c.downloaded ? ' Downloaded ' + esc(core.ymd ? core.ymd(new Date(c.downloaded)) : '') + '.' : '') + '</p></div>';
  }
  function cheatHtml() {
    return '<div class="card cl-cheat"><p class="cl-h">Complexity cheat-sheet</p><div class="table-scroll"><table class="simple"><thead><tr><th scope="col">Pattern</th><th scope="col">Cost</th><th scope="col">Fix</th></tr></thead><tbody>' +
      CHEAT.map(function (r) { return '<tr><td class="mono">' + esc(r[0]) + '</td><td class="mono">' + esc(r[1]) + '</td><td>' + esc(r[2]) + '</td></tr>'; }).join('') +
      '</tbody></table></div><p class="small muted">Always say both: time and extra space, and what n is.</p></div>';
  }
  /* v2.3: the lab holds three kinds of problems; a segmented control picks one (remembered in S.codelab.tab). */
  var SECTIONS = [
    { id: 'all', name: 'All' },
    { id: 'dsa', name: 'Algorithms', desc: 'Classic SWE patterns: graphs, trees, stacks, linked lists, backtracking, tries, bits, design.' },
    { id: 'coding', name: 'Quant coding', desc: 'Trading-flavoured problems: DP, heaps, sliding windows, P&L and order books.' },
    { id: 'csfund', name: 'CS simulations', desc: 'Build the mechanism: page replacement, schedulers, caches, checksums, an assembler, WAL recovery.' }
  ];
  core.VIEWS.codelab = function (main) {
    var all = problems();
    var c = C();
    var secs = SECTIONS.filter(function (x) { return x.id === 'all' || all.some(function (p) { return p.cat === x.id; }); });
    var tab = secs.some(function (x) { return x.id === c.tab; }) ? c.tab : 'all';
    var list = tab === 'all' ? all : all.filter(function (p) { return p.cat === tab; });
    var solved = list.filter(function (p) { return core.status(p.id) === 'solved'; }).length;
    var sec = SECTIONS.filter(function (x) { return x.id === tab; })[0];
    main.innerHTML = core.pageHead('Coding lab', 'Python interview problems with real test cases, then the complexity follow-up an interviewer always asks.', '#train', 'Train') +
      '<div class="cl-page">' +
      '<div class="cl-main">' +
      '<div data-clp-runner>' + runnerCardHtml() + '</div>' +
      '<div class="card"><div class="row"><p class="cl-h">Problems</p><span class="spacer"></span><span class="small muted">' + solved + '/' + list.length + ' solved</span></div>' +
      (secs.length > 2 ? '<div class="seg cl-tabs" role="group" aria-label="Problem kind">' + secs.map(function (x) {
        var n = x.id === 'all' ? all.length : all.filter(function (p) { return p.cat === x.id; }).length;
        return '<button type="button" data-clp-tab="' + x.id + '" aria-pressed="' + (x.id === tab) + '">' + esc(x.name) + ' <span class="muted">' + n + '</span></button>';
      }).join('') + '</div>' + (sec && sec.desc ? '<p class="small muted">' + esc(sec.desc) + '</p>' : '') : '') +
      (list.length ? '<div class="row cl-startrow"><button type="button" class="btn primary" data-clp="start">' + ICONS.play + ' Practice (unsolved first)</button></div>' +
        '<ul class="cl-list">' + list.map(function (p, i) {
          var e = c.code[p.id], cx = (p.answer || {}).complexity || {};
          return '<li><button type="button" class="cl-item" data-clp-open="' + i + '">' + core.statusIcon(core.status(p.id)) +
            '<span class="cl-it"><b>' + esc(p.title) + '</b><small class="muted">' + core.diffDots(p.diff) + (tab === 'all' && p.cat !== 'coding' ? ' ' + esc(core.catName(p.cat)) + ' ·' : '') + (p.cat !== 'coding' && p.tags && p.tags[0] ? ' ' + esc(p.tags[0].replace(/-/g, ' ')) + ' ·' : '') + (cx.time ? ' <span class="mono">' + esc(cx.time) + '</span>' : '') +
            (e && e.n ? ' · last run ' + (e.pass || 0) + '/' + e.n : e ? ' · draft saved' : '') + '</small></span>' + ICONS.right + '</button></li>';
        }).join('') + '</ul>'
        : '<p class="muted">No coding problems in this build yet.</p>') +
      '</div></div>' +
      '<div class="cl-side">' + cheatHtml() + '</div>' +
      '</div>';
    function bindRunner() {
      var host = main.querySelector('[data-clp-runner]');
      if (!host) return;
      host.innerHTML = runnerCardHtml();
      var d = host.querySelector('[data-clp="download"]');
      if (d) d.addEventListener('click', function () { ensure().catch(function () { }); });
      var r = host.querySelector('[data-clp="remove"]');
      if (r) r.addEventListener('click', function () { remove().then(function () { core.toast('Coding lab download removed.', null, null, 1800); }); });
    }
    bindRunner();
    var unsub = onChange(function () { if (main.querySelector('[data-clp-runner]')) bindRunner(); else unsub(); });
    core.onCleanup(unsub);
    autoStart();
    var ids = list.map(function (p) { return p.id; });
    var sb = main.querySelector('[data-clp="start"]');
    var label = tab === 'all' ? 'Coding lab' : 'Coding lab · ' + sec.name;
    if (sb) sb.addEventListener('click', function () { core.startSession(core.orderForPractice(list).map(function (p) { return p.id; }), label, 0); });
    core.$all('[data-clp-tab]', main).forEach(function (b) {
      b.addEventListener('click', function () { C().tab = b.getAttribute('data-clp-tab'); core.save(); core.route(); });
    });
    core.$all('[data-clp-open]', main).forEach(function (b) {
      b.addEventListener('click', function () { core.startSession(ids, label, +b.getAttribute('data-clp-open')); });
    });
  };
  core.TAB_OF.codelab = 'train';
  core.TITLES.codelab = 'Coding lab';

  core.HOOKS.trainCards.push(function () {
    var list = problems(), s = status();
    var solved = list.filter(function (p) { return core.status(p.id) === 'solved'; }).length;
    return core.trainCard('#codelab', 'code', 'Coding lab', 'Write Python against real test cases in the browser, then answer the complexity follow-up. The Python runner is an optional one-time download.',
      (list.length ? solved + '/' + list.length + ' solved · ' : '') + (s === 'ready' ? 'Python ready' : C().downloaded ? 'Python downloaded' : 'Python not downloaded'));
  });
  core.HOOKS.moreItems.push(function () {
    return '<a class="mode-card" href="#codelab"><span class="ic">' + ICONS.code + '</span><span><b>Coding lab</b><small>Python problems with tests and complexity follow-ups</small></span></a>';
  });

  window.SBT_CODELAB = {
    version: PYO_VERSION, indexURL: INDEX_URL, cacheName: PYO_CACHE,
    status: status, text: statusText, ensure: ensure, run: run, problems: problems, remove: remove, onChange: onChange,
    cxOptions: cxOptions, cacheHasPyodide: cacheHasPyodide,
    _setRunnerForTests: function (fn) { R.mock = typeof fn === 'function' ? fn : null; emit(); },
    _setStatusForTests: function (s, text) { R.mockStatus = s || null; R.mockText = text || ''; emit(); },
    _setTimeoutForTests: function (ms) { R.timeout = ms > 0 ? ms : 8000; }
  };
});
