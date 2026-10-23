/* Stat Brainteaser coding lab — Web Worker that runs Python (Pyodide) off the main thread.
 *
 * Protocol (postMessage):
 *   in : {type: 'init', indexURL}                         -> out: {type: 'progress', text} ... {type: 'ready', version, ms} | {type: 'error', error}
 *   in : {type: 'run', id, code, fn, tests, cmp}           -> out: {type: 'result', id, results, stdout, error, ms}
 * The main thread enforces the time limit: an infinite loop blocks this worker, so the page terminates it and spawns a new one.
 * Pyodide's files come from the pinned CDN folder; the app's service worker keeps them in a runtime cache for offline use. */
'use strict';
var py = null;
var HARNESS = [
  'import sys, io, json, math, copy, traceback',
  'def __sbt_norm(x):',
  '    if isinstance(x, bool) or x is None or isinstance(x, (int, str)): return x',
  '    if isinstance(x, float): return x',
  '    if isinstance(x, (list, tuple)): return [__sbt_norm(v) for v in x]',
  '    if isinstance(x, (set, frozenset)):',
  '        return sorted((__sbt_norm(v) for v in x), key=lambda v: json.dumps(v, sort_keys=True, default=str))',
  '    if isinstance(x, dict): return {str(k): __sbt_norm(v) for k, v in x.items()}',
  '    try:',
  '        import numbers',
  '        if isinstance(x, numbers.Integral): return int(x)',
  '        if isinstance(x, numbers.Real): return float(x)',
  '    except Exception: pass',
  '    return repr(x)',
  'def __sbt_feq(a, b):',
  '    if isinstance(a, bool) or isinstance(b, bool): return a is b or a == b and type(a) == type(b)',
  '    if isinstance(a, (int, float)) and isinstance(b, (int, float)):',
  '        if isinstance(a, float) and isinstance(b, float) and math.isnan(a) and math.isnan(b): return True',
  '        return abs(a - b) <= 1e-6 or abs(a - b) <= 1e-6 * abs(b)',
  '    if isinstance(a, list) and isinstance(b, list): return len(a) == len(b) and all(__sbt_feq(x, y) for x, y in zip(a, b))',
  '    if isinstance(a, dict) and isinstance(b, dict): return set(a) == set(b) and all(__sbt_feq(a[k], b[k]) for k in a)',
  '    return a == b',
  'def __sbt_key(v): return json.dumps(v, sort_keys=True, default=str)',
  'def __sbt_cmp(got, exp, cmp):',
  '    g = __sbt_norm(got)',
  '    if cmp == "float": return __sbt_feq(g, exp)',
  '    if cmp == "sorted":',
  '        if not isinstance(g, list) or not isinstance(exp, list): return False',
  '        return sorted(g, key=__sbt_key) == sorted(exp, key=__sbt_key)',
  '    if cmp == "set":',
  '        if not isinstance(g, list) or not isinstance(exp, list): return False',
  '        return set(map(__sbt_key, g)) == set(map(__sbt_key, exp))',
  '    if isinstance(exp, bool) != isinstance(g, bool): return False',
  '    return g == exp',
  'def __sbt_last(e):',
  '    lines = traceback.format_exception_only(type(e), e)',
  '    return (lines[-1] if lines else repr(e)).strip()[:400]',
  'def __sbt_where(e):',
  '    tb = traceback.extract_tb(e.__traceback__)',
  '    for fr in reversed(tb):',
  '        if fr.filename == "<your code>": return fr.lineno',
  '    return None',
  'def __sbt_show(v):',
  '    try: s = json.dumps(__sbt_norm(v))',
  '    except Exception: s = repr(v)',
  '    return s if len(s) <= 300 else s[:297] + "..."',
  'def __sbt_run(src, fn, tests_json, cmp):',
  '    tests = json.loads(tests_json)',
  '    out = io.StringIO()',
  '    old_out, old_err = sys.stdout, sys.stderr',
  '    sys.stdout = out; sys.stderr = out',
  '    res = []; err = None',
  '    try:',
  '        ns = {"__name__": "__sbt__"}',
  '        try:',
  '            exec(compile(src, "<your code>", "exec"), ns)',
  '        except BaseException as e:',
  '            ln = getattr(e, "lineno", None) if isinstance(e, SyntaxError) else __sbt_where(e)',
  '            err = __sbt_last(e) + (" (line %d)" % ln if ln else "")',
  '        f = ns.get(fn)',
  '        if err is None and not callable(f): err = "NameError: define a function called " + fn + "()"',
  '        if err is None:',
  '            for t in tests:',
  '                try:',
  '                    got = f(*copy.deepcopy(t["args"]))',
  '                    res.append({"pass": bool(__sbt_cmp(got, t["expected"], cmp)), "got": __sbt_show(got)})',
  '                except BaseException as e:',
  '                    ln = __sbt_where(e)',
  '                    res.append({"pass": False, "error": __sbt_last(e) + (" (line %d)" % ln if ln else "")})',
  '    finally:',
  '        sys.stdout, sys.stderr = old_out, old_err',
  '    s = out.getvalue()',
  '    if len(s) > 8000: s = s[:8000] + "\\n... (output truncated)"',
  '    return json.dumps({"results": res, "stdout": s, "error": err})'
].join('\n');

function post(m) { self.postMessage(m); }

self.onmessage = function (ev) {
  var m = ev.data || {};
  if (m.type === 'init') {
    var t0 = Date.now();
    try {
      post({ type: 'progress', text: 'Loading the Python runtime…' });
      importScripts(m.indexURL + 'pyodide.js');
      self.loadPyodide({ indexURL: m.indexURL, stdout: function () {}, stderr: function () {} }).then(function (p) {
        post({ type: 'progress', text: 'Starting Python…' });
        py = p;
        py.runPython(HARNESS);
        post({ type: 'ready', version: py.version, ms: Date.now() - t0 });
      }).catch(function (e) { post({ type: 'error', error: String(e && e.message || e) }); });
    } catch (e) { post({ type: 'error', error: String(e && e.message || e) }); }
    return;
  }
  if (m.type === 'run') {
    var t1 = Date.now();
    if (!py) { post({ type: 'result', id: m.id, results: [], stdout: '', error: 'Python is not loaded yet.', ms: 0 }); return; }
    try {
      var run = py.globals.get('__sbt_run');
      var out = run(String(m.code || ''), String(m.fn || ''), JSON.stringify(m.tests || []), String(m.cmp || 'exact'));
      run.destroy();
      var r = JSON.parse(out);
      r.type = 'result'; r.id = m.id; r.ms = Date.now() - t1;
      post(r);
    } catch (e) {
      post({ type: 'result', id: m.id, results: [], stdout: '', error: String(e && e.message || e).split('\n').filter(Boolean).slice(-1)[0] || 'Python error', ms: Date.now() - t1 });
    }
  }
};
