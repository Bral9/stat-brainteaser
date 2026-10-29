/* Stat Brainteaser — Software-engineering track (v2.3 plugin).
 *
 * #swe: one page that answers "what should I know for SWE / quant-developer interviews, and how do I practise it?".
 * It groups the `dsa` and `csfund` problems (plus python, sql, systems and the quant coding lab) into skill areas, shows
 * progress per area, what to know, the matching free course (Library ids) and a Practice button (unsolved first).
 * The study method paraphrases a public LinkedIn post listing free CS courses (2026); course names are used as a
 * syllabus only. No state of its own: progress comes from the problem statuses.
 * API: window.SBT_SWE = { areas, areaOf(problem), problemsFor(areaId) } */
(window.SBT_PLUGINS = window.SBT_PLUGINS || []).push(function (core) {
  'use strict';
  var esc = core.esc, ICONS = core.ICONS;

  /* Each area claims problems by category, an optional regex over tags + title (`re`) and an optional regex for the
   * leading area tag (`first`); areas are tried in order and a problem
   * belongs to the first one that matches, so the counts never double up. */
  var AREAS = [
    { id: 'python', name: 'Python fluency', cats: ['python'],
      know: ['Mutability and aliasing: lists in lists, default arguments, copy vs deepcopy', 'The cost of built-ins: <code>x in list</code> is O(n), in a set O(1) on average; <code>pop(0)</code> is O(n)',
        'Generators, closures and late binding', 'NumPy / pandas basics: axes, broadcasting, NaN, groupby'],
      how: 'Predict the output before running anything; most interview bugs are aliasing or a hidden O(n) inside a loop.',
      lib: ['ph-python-tutorial', 'py-timecomplexity', 'mit-6-101-fundamentals-of-programming'], learn: 'coding' },
    { id: 'design', name: 'Designing small components', cats: ['dsa', 'coding'], re: /(^| )(design|matching-engine|order-book)( |$)/,
      know: ['Pick structures for each operation’s cost: a hash map + doubly linked list gives an O(1) LRU cache', 'Write the class interface first, then each method with its complexity',
        'Order books: price levels (sorted map or tick array) + FIFO per level + id → order map', 'Invariants: what must stay true after every call'],
      how: 'Say the operations and their target costs before writing code; test with a short script of calls.',
      lib: ['berkeley-cs61b', 'cs-video-courses'] },
    { id: 'graphs', name: 'Graphs', cats: ['dsa'], first: /^graphs$/,
      know: ['Adjacency lists; BFS for unweighted shortest paths (mark visited on enqueue)', 'DFS for reachability, cycle detection and topological order (or Kahn’s algorithm)',
        'Dijkstra with a heap, O((V + E) log V), and why negative edges break it', 'Union-find with path compression for connectivity'],
      how: 'Draw the graph for the example, name the algorithm out loud, then code it iteratively (Python’s recursion limit is about 1,000).',
      lib: ['mit-6-006-introduction-to-algorithms-ocw', 'berkeley-cs61b'] },
    { id: 'algos', name: 'Search, sort, DP & backtracking', cats: ['dsa'], first: /^(backtracking|sorting|selection|binary-search|dynamic-programming)$/,
      know: ['Binary search with exact loop invariants (leftmost / rightmost bounds)', 'Merge sort and quickselect; stability; the n log n lower bound',
        'Dynamic programming: state, recurrence, base case, order, answer (SRTBOT)', 'Backtracking with pruning; counting vs listing solutions'],
      how: 'Write the brute force first, find the repeated work, then memoise or reorder. State the complexity unprompted.',
      lib: ['mit-6-006-introduction-to-algorithms-ocw', 'mit-6-1200j-math-for-cs'], learn: 'coding' },
    { id: 'ds', name: 'Core data structures', cats: ['dsa'],
      know: ['Arrays, strings and hash maps: counting, two pointers, sliding windows', 'Stacks and monotonic stacks; queues and deques',
        'Linked lists: dummy head, fast/slow pointers, in-place reversal', 'Trees: traversals, BST invariant, recursion on subtrees; heaps; tries', 'Bit manipulation: masks, two’s complement, XOR tricks'],
      how: 'Implement each structure once from scratch (a linked list, a BST, a trie), then use the library version in interviews.',
      lib: ['harvard-cs50x', 'berkeley-cs61b', 'mit-6-006-introduction-to-algorithms-ocw'] },
    { id: 'quantcode', name: 'Quant-flavoured coding', cats: ['coding'],
      know: ['Streaming statistics: rolling windows, running median, Welford', 'P&L bookkeeping: FIFO lots, average cost, drawdown', 'Heaps and deques on market data'],
      how: 'These mirror quant-developer screens: same algorithms, trading vocabulary. Do them after the classic patterns.',
      lib: ['py-heapq'] },
    { id: 'machine', name: 'How the machine works', cats: ['csfund'], first: /^(architecture|c-memory)$/,
      know: ['Binary, hex and two’s complement; overflow vs carry', 'Stack vs heap, pointers and value semantics (C)', 'Caches: lines, sets, locality; why row-major loops are faster', 'Floating point: 0.1 + 0.2, the 2<sup>24</sup> limit of float32'],
      how: 'Nand2Tetris builds the intuition; CS50’s memory week makes pointers concrete.',
      lib: ['nand2tetris', 'harvard-cs50x', 'cmu-15-213-systems'] },
    { id: 'os', name: 'Operating systems & concurrency', cats: ['csfund'], first: /^os$/,
      know: ['Process vs thread; what a context switch costs', 'Virtual memory: pages, page tables, TLB, page faults', 'Locks, condition variables, semaphores; the four deadlock conditions', 'Scheduling (round robin, SJF) and durability (fsync)'],
      how: 'Read one OSTEP chapter, then do its questions here the same day; simulate traces by hand before coding them.',
      lib: ['ostep-book', 'cmu-15-213-systems'] },
    { id: 'net', name: 'Networking', cats: ['csfund'], first: /^networking$/,
      know: ['TCP vs UDP; the handshake; flow vs congestion control', 'Latency vs bandwidth; the bandwidth-delay product', 'Why exchanges multicast market data over UDP with sequence numbers', 'What happens when you open a URL: DNS → TCP → TLS → HTTP'],
      how: 'Work the delay arithmetic until it is automatic; low-latency firms ask it on the phone.',
      lib: ['kurose-networking-lectures'] },
    { id: 'db', name: 'Databases inside', cats: ['csfund', 'sql'], first: /^databases$/, firstCats: ['csfund'],
      know: ['B+ tree vs hash indexes; why range queries need the tree', 'Join algorithms and their I/O cost; external sorting', 'ACID, isolation levels and their anomalies, MVCC', 'Write-ahead logging and recovery'],
      how: 'Pair each 15-445 lecture with its questions here; write SQL by hand for the window-function problems.',
      lib: ['cmu-15-445-databases'] },
    { id: 'tools', name: 'Tooling: shell, git, debugging', cats: ['csfund'], first: /^tooling$/,
      know: ['Pipes and redirection (<code>2&gt;&amp;1</code> order), quoting, exit codes', '<code>sort | uniq -c | sort -rn</code> and friends', 'Git as a graph of snapshots: reset modes, rebase vs merge, merge base', 'Profilers: self vs cumulative time'],
      how: 'Use the terminal for your own projects; every Missing Semester lecture has exercises to do in a real shell.',
      lib: ['mit-missing-semester'] },
    { id: 'analysis', name: 'Analysis & discrete maths', cats: ['csfund'],
      know: ['Big-O, amortised cost (dynamic arrays), recurrences and the master theorem', 'Counting and the birthday bound for hashing', 'Proof habits: invariants and induction for correctness'],
      how: 'Same maths as the probability side of the app; it shows up as “prove your loop is correct” or “what is the amortised cost?”.',
      lib: ['mit-6-1200j-math-for-cs', 'mit-6-006-introduction-to-algorithms-ocw'] },
    { id: 'sysdesign', name: 'Trading-system design', cats: ['systems'],
      know: ['Order books, feeds, sequence numbers and recovery', 'Risk checks and storage of tick data', 'Trade-offs and failure modes, structured out loud'],
      how: 'Open answers graded on structure: requirements → components → data flow → failure modes.',
      lib: ['cs-video-courses'] }
  ];
  var BYID = {}; AREAS.forEach(function (a) { BYID[a.id] = a; });

  function areaOf(p) {
    if (!p) return null;
    var tags = (p.tags || []).join(' ').toLowerCase() + ' ' + String(p.title || '').toLowerCase();
    for (var i = 0; i < AREAS.length; i++) {
      var a = AREAS[i];
      if (a.cats.indexOf(p.cat) < 0) continue;
      if (a.re && !a.re.test(tags)) continue;
      // `first` matches the leading (area) tag; with firstCats it only applies to those categories
      if (a.first && (!a.firstCats || a.firstCats.indexOf(p.cat) >= 0) && !a.first.test((p.tags || [])[0] || '')) continue;
      return a.id;
    }
    return null;
  }
  var cache = null;
  function index() {
    if (cache) return cache;
    cache = {};
    AREAS.forEach(function (a) { cache[a.id] = []; });
    core.PROBLEMS.forEach(function (p) { var a = areaOf(p); if (a) cache[a].push(p); });
    return cache;
  }
  function problemsFor(id) { return index()[id] || []; }
  function hasTrack() { return !!(core.CATS && core.PROBLEMS.some(function (p) { return p.cat === 'dsa' || p.cat === 'csfund'; })); }

  function libChips(ids) {
    var L = window.SBT_LIB;
    if (!L) return '';
    var h = ids.map(function (id) { return L.chipHtml(id); }).filter(Boolean).join('');
    return h ? '<div class="sw-libs">' + h + '</div>' : '';
  }
  function bar(frac) { return '<span class="tbar" role="img" aria-label="' + Math.round(frac * 100) + '% solved"><span style="width:' + (frac * 100) + '%"></span></span>'; }

  core.VIEWS.swe = function (main) {
    var idx = index();
    var rows = AREAS.map(function (a) {
      var list = idx[a.id] || [];
      var solved = list.filter(function (p) { return core.status(p.id) === 'solved'; }).length;
      var tried = list.filter(function (p) { return core.status(p.id) !== 'unsolved'; }).length;
      return { a: a, list: list, solved: solved, tried: tried };
    }).filter(function (r) { return r.list.length; });
    var total = rows.reduce(function (s, r) { return s + r.list.length; }, 0);
    var done = rows.reduce(function (s, r) { return s + r.solved; }, 0);
    // next area: the first (in study order) that is under 60% solved
    var next = rows.filter(function (r) { return r.solved < 0.6 * r.list.length; })[0] || null;
    var LRN = window.SBT_LEARN, track = LRN && LRN.get ? LRN.get('swe') : null;
    var html = core.pageHead('Software engineering', 'What SWE and quant-developer interviews test in raw programming, how to practise it, and where you stand. ' + done + ' of ' + total + ' problems solved.', '#train', 'Train',
      '<a class="btn primary" href="#mock/swe">' + ICONS.mic + ' SWE mock</a>');
    html += '<div class="sw-top">' +
      '<section class="card sw-card"><h2>How programming is tested</h2><ul class="sw-list">' +
      '<li><b>Online assessment.</b> Usually 2–3 algorithm problems in 60–90 minutes with hidden tests: correctness, edge cases and complexity all count.</li>' +
      '<li><b>Live coding.</b> Clarify the input, say the brute force, improve it, then code and test by hand while talking. Silence and untested code cost more than a slow start.</li>' +
      '<li><b>CS fundamentals.</b> Short questions on memory, OS, networking and databases; low-latency trading firms go deeper (caches, threads, TCP vs UDP).</li>' +
      '<li><b>Your code and projects.</b> Expect “walk me through it” and “how would you test it?”.</li></ul>' +
      '<p class="small muted">Formats vary by firm and year; see the <a href="#guide">Interview guide</a> for sourced details per firm.</p></section>' +
      '<section class="card sw-card"><h2>How to study it</h2><ol class="sw-list">' +
      '<li><b>Learn each topic twice.</b> Watch the matching lecture from a free course (below) in the same week your own course covers it.</li>' +
      '<li><b>Build it once from scratch</b>: a linked list, a BST, a trie, a page-replacement simulator.</li>' +
      '<li><b>Then solve 3–5 problems here</b> in that area, timing yourself and stating the complexity out loud.</li>' +
      '<li><b>Review what you missed</b>; the Review tab brings it back on a schedule.</li></ol>' +
      '<p class="small muted">Method adapted from a public post listing free CS courses (MIT, Stanford, Harvard).</p></section></div>';
    html += '<div class="row sw-actions">' +
      (next ? '<button type="button" class="btn primary" data-sw-go="' + next.a.id + '">' + ICONS.play + ' Next: ' + esc(next.a.name) + '</button>' : '') +
      '<a class="btn" href="#codelab">' + ICONS.code + ' Coding lab</a>' +
      (track ? '<a class="btn" href="#learn/swe">' + ICONS.book + ' Lessons</a>' : '') +
      '<a class="btn" href="#practice?t=dsa,csfund">' + ICONS.list + ' All SWE problems</a></div>';
    html += '<div class="sw-areas">' + rows.map(function (r, i) {
      var a = r.a, frac = r.list.length ? r.solved / r.list.length : 0;
      return '<section class="card sw-area" id="sw-' + a.id + '"><div class="sw-ah"><span class="sw-n">' + (i + 1) + '</span><div class="sw-at"><h3>' + esc(a.name) + '</h3>' +
        '<p class="small muted">' + r.solved + '/' + r.list.length + ' solved' + (r.tried > r.solved ? ' · ' + (r.tried - r.solved) + ' in progress' : '') + '</p>' + bar(frac) + '</div>' +
        '<button type="button" class="btn sm" data-sw-go="' + a.id + '">' + ICONS.play + ' Practice</button></div>' +
        '<details class="sw-know"' + (next && next.a.id === a.id ? ' open' : '') + '><summary>What you should know</summary><ul>' + a.know.map(function (k) { return '<li>' + k + '</li>'; }).join('') + '</ul>' +
        '<p class="small"><b>How to practise:</b> ' + esc(a.how) + '</p>' + libChips(a.lib) + '</details></section>';
    }).join('') + '</div>';
    main.innerHTML = html;
    core.$all('[data-sw-go]', main).forEach(function (b) {
      b.addEventListener('click', function () {
        var a = BYID[b.getAttribute('data-sw-go')], list = problemsFor(a.id);
        core.startSession(core.orderForPractice(list).map(function (p) { return p.id; }), 'SWE · ' + a.name, 0, false, { kind: 'list', back: '#swe' });
      });
    });
  };
  core.TAB_OF.swe = 'train';
  core.TITLES.swe = 'Software engineering';

  core.HOOKS.trainCards.push(function () {
    if (!hasTrack()) return '';
    var idx = index(), n = 0, s = 0;
    AREAS.forEach(function (a) { (idx[a.id] || []).forEach(function (p) { n++; if (core.status(p.id) === 'solved') s++; }); });
    return core.trainCard('#swe', 'tree', 'Software engineering', 'What SWE and quant-dev interviews test in raw programming: algorithms, data structures and CS fundamentals by area, with free courses and a SWE mock.', s + '/' + n + ' solved');
  });
  core.HOOKS.moreItems.push(function () {
    if (!hasTrack()) return '';
    return '<a class="mode-card" href="#swe"><span class="ic">' + ICONS.tree + '</span><span><b>Software engineering</b><small>Algorithms, data structures and CS fundamentals by area</small></span></a>';
  });

  window.SBT_SWE = { areas: AREAS, areaOf: areaOf, problemsFor: problemsFor };
});
