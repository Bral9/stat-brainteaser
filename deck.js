/* Stat Brainteaser — Probability deck (#deck). 52 problems laid out as a deck of cards:
 * ♣ expectation & linearity · ♦ classical / conditional probability · ♥ geometric probability · ♠ random walks & martingales.
 * Rank A → K = rising difficulty; 10–K are competition level. Problems carry p.deck = {suit, rank}.
 * A card is face-down until the problem is solved (core.status(id) === 'solved'), then it flips.
 * UI prefs live in core.S.deck = {focus, seen: {id: t}, t} (lazy, merged on import). */
(window.SBT_PLUGINS = window.SBT_PLUGINS || []).push(function (core) {
  'use strict';
  var esc = core.esc, ICONS = core.ICONS;
  var SUITS = [
    { id: 'clubs', glyph: '♣', name: 'Clubs', topic: 'Expectation & linearity' },
    { id: 'diamonds', glyph: '♦', name: 'Diamonds', topic: 'Classical & conditional probability' },
    { id: 'hearts', glyph: '♥', name: 'Hearts', topic: 'Geometric probability' },
    { id: 'spades', glyph: '♠', name: 'Spades', topic: 'Random walks & martingales' }
  ];
  var SUIT = {}; SUITS.forEach(function (s) { SUIT[s.id] = s; });
  var RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  var RANK_NAME = ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Jack', 'Queen', 'King'];
  var FOCUS_SUITS = ['clubs', 'diamonds'], FOCUS_MAX = 6, HARD_FROM = 10;
  var TXT = '︎'; // text presentation: keeps ♥ ♦ from turning into coloured emoji

  if (!ICONS.cards) ICONS.cards = core.svg('<rect x="3" y="5" width="12" height="16" rx="2"/><path d="M9 3h10a2 2 0 0 1 2 2v12"/><path d="M9 11.5c0-1.4 2-2.2 2-3.5 0 1.3 2 2.1 2 3.5a2 2 0 0 1-4 0zM11 13.5v2"/>');

  core.TITLES.deck = 'Probability deck';
  core.TAB_OF.deck = 'train';

  /* ------------------------------------------------------------------ */
  /* data                                                                */
  /* ------------------------------------------------------------------ */
  function grid() {
    var g = {};
    SUITS.forEach(function (s) { g[s.id] = []; });
    (core.PROBLEMS || []).forEach(function (p) {
      var d = p && p.deck;
      if (d && g[d.suit] && d.rank >= 1 && d.rank <= 13 && !g[d.suit][d.rank - 1]) g[d.suit][d.rank - 1] = p;
    });
    return g;
  }
  function allCards(g) {
    var out = [];
    SUITS.forEach(function (s) { for (var r = 1; r <= 13; r++) if (g[s.id][r - 1]) out.push(g[s.id][r - 1]); });
    return out;
  }
  function isFocus(p) { return FOCUS_SUITS.indexOf(p.deck.suit) >= 0 && p.deck.rank <= FOCUS_MAX; }
  function solved(p) { return core.status(p.id) === 'solved'; }
  function st() {
    var S = core.S;
    if (!core.isPlainObj(S.deck)) S.deck = {};
    var d = S.deck;
    if (typeof d.focus !== 'boolean') d.focus = false;
    if (!core.isPlainObj(d.seen)) d.seen = {};
    return d;
  }
  function progress() {
    var g = grid(), bySuit = {}, k = 0, n = 0, fk = 0, fn = 0;
    SUITS.forEach(function (s) {
      var row = g[s.id].filter(Boolean), sk = row.filter(solved).length;
      bySuit[s.id] = { k: sk, n: row.length };
      k += sk; n += row.length;
      row.forEach(function (p) { if (isFocus(p)) { fn++; if (solved(p)) fk++; } });
    });
    return { solved: k, total: n, bySuit: bySuit, focus: { k: fk, n: fn } };
  }
  function label(p) { return RANKS[p.deck.rank - 1] + SUIT[p.deck.suit].glyph + TXT; }
  function nextCard(g, focus) {
    // interview-focus cards (♣ / ♦ A–6) first, then the rest; lowest rank first, suits in deck order
    function scan(onlyFocus) {
      for (var r = 1; r <= 13; r++) {
        for (var i = 0; i < SUITS.length; i++) {
          var p = g[SUITS[i].id][r - 1];
          if (p && !solved(p) && (!onlyFocus || isFocus(p))) return p;
        }
      }
      return null;
    }
    return scan(true) || (focus ? null : scan(false));
  }

  /* ------------------------------------------------------------------ */
  /* view                                                                */
  /* ------------------------------------------------------------------ */
  function cardHtml(p, flipNow) {
    var s = SUIT[p.deck.suit], r = p.deck.rank, hard = r >= HARD_FROM, done = solved(p);
    var face = '<span class="dk-rank">' + RANKS[r - 1] + '</span><span class="dk-glyph" aria-hidden="true">' + s.glyph + TXT + '</span>' + (hard ? '<span class="dk-hardmark" aria-hidden="true"></span>' : '');
    var name = RANK_NAME[r - 1] + ' of ' + s.name.toLowerCase() + ': ' + core.stripTags(p.title) + '. ' +
      (hard ? 'Competition level. ' : r <= 4 ? 'Warm-up. ' : 'Interview level. ') + (done ? 'Solved.' : 'Not solved yet.');
    return '<button type="button" class="dk-card' + (hard ? ' dk-hard' : '') + (done && flipNow ? ' dk-up' : '') + '" data-id="' + esc(p.id) + '"' +
      (done && !flipNow ? ' data-flip="1"' : '') + ' title="' + esc(core.stripTags(p.title)) + '" aria-label="' + esc(name) + '">' +
      '<span class="dk-inner"><span class="dk-face dk-back">' + face + '</span>' +
      '<span class="dk-face dk-front">' + face + '<span class="dk-tick" aria-hidden="true">' + ICONS.check + '</span></span></span></button>';
  }

  core.VIEWS.deck = function (main) {
    var g = grid(), cards = allCards(g), d = st();
    var head = core.pageHead('Probability deck',
      'Four suits of thirteen cards; the difficulty climbs from the ace to the king. Solve a problem and its card turns face up.', '#train', 'Train');
    if (!cards.length) {
      main.innerHTML = head + '<div class="card dk-empty" role="status"><h2>Deck loading…</h2><p class="muted">The deck’s problems are not in this copy of the problem bank yet. Reload once the latest update has downloaded.</p></div>';
      return;
    }
    var pr = progress(), focus = d.focus;
    var nx = nextCard(g, focus);
    var html = head;
    html += '<div class="card dk-intro"><div class="dk-legend">' + SUITS.map(function (s) {
      return '<span class="dk-leg"><span class="dk-leg-g" aria-hidden="true">' + s.glyph + TXT + '</span><span><b>' + esc(s.name) + '</b> <span class="muted">' + esc(s.topic) + '</span></span></span>';
    }).join('') + '</div>' +
      '<p class="small muted dk-advice">For interview prep, the first five or six cards of clubs and diamonds cover what most interviews ask. The higher cards, marked with a dot (10 to K), are closer to competition level, so treat them as stretch goals.</p>' +
      '<div class="dk-controls"><label class="switch dk-switch"><input type="checkbox" id="dkFocus"' + (focus ? ' checked' : '') + '><span class="track" aria-hidden="true"></span>' +
      '<span><b>Interview focus: ♣' + TXT + ' and ♦' + TXT + ' A–6</b><br><span class="muted small">Show only the ' + pr.focus.n + ' cards that matter most for interviews.</span></span></label>' +
      '<div class="dk-totals" aria-live="polite"><span class="dk-total"><b>' + pr.solved + '</b>/' + pr.total + ' solved</span><span class="muted small">Focus ' + pr.focus.k + '/' + pr.focus.n + '</span></div></div>' +
      '<div class="tbar" role="img" aria-label="' + pr.solved + ' of ' + pr.total + ' cards solved"><span style="width:' + (pr.total ? pr.solved / pr.total * 100 : 0) + '%;--cat:var(--accent)"></span></div>' +
      (nx ? '<div class="row dk-next"><button type="button" class="btn primary" id="dkNext" data-id="' + esc(nx.id) + '">' + ICONS.play + ' Next card: ' + label(nx) + ' ' + esc(core.stripTags(nx.title)) + '</button></div>'
        : '<p class="small dk-next"><b>' + (focus ? 'Interview focus complete.' : 'Every card is face up.') + '</b></p>') +
      '</div>';
    var newly = [];
    SUITS.forEach(function (s) {
      if (focus && FOCUS_SUITS.indexOf(s.id) < 0) return;
      var row = g[s.id].filter(Boolean);
      if (!row.length) return;
      if (focus) row = row.filter(isFocus);
      var b = pr.bySuit[s.id];
      html += '<section class="dk-suit" data-suit="' + s.id + '" aria-labelledby="dk-h-' + s.id + '"><div class="dk-suit-head">' +
        '<h2 id="dk-h-' + s.id + '"><span class="dk-suit-g" aria-hidden="true">' + s.glyph + TXT + '</span> ' + esc(s.name) + ' <span class="muted dk-topic">' + esc(s.topic) + '</span></h2>' +
        '<span class="dk-count" data-count="' + s.id + '"><b>' + b.k + '</b>/' + b.n + '</span></div>' +
        '<div class="dk-row">' + row.map(function (p) {
          var fresh = solved(p) && !d.seen[p.id];
          if (fresh) newly.push(p.id);
          return cardHtml(p, !fresh);
        }).join('') + '</div></section>';
    });
    if (focus) html += '<p class="small muted dk-hidden-note">Hearts and spades, and clubs and diamonds 7 to K, are hidden while interview focus is on.</p>';
    main.innerHTML = html;

    function open(id) {
      var list, label2;
      var p = core.BY_ID[id]; if (!p) return;
      if (focus && isFocus(p)) {
        list = cards.filter(isFocus).sort(function (a, b) { return FOCUS_SUITS.indexOf(a.deck.suit) - FOCUS_SUITS.indexOf(b.deck.suit) || a.deck.rank - b.deck.rank; });
        label2 = 'Probability deck';
      } else {
        list = g[p.deck.suit].filter(Boolean);
        label2 = 'Probability deck';
      }
      var ids = list.map(function (q) { return q.id; });
      core.startSession(ids, label2, Math.max(0, ids.indexOf(id)), false, { kind: 'list', back: '#deck' });
    }
    core.$all('.dk-card', main).forEach(function (b) { b.addEventListener('click', function () { open(b.getAttribute('data-id')); }); });
    var nb = core.$('#dkNext', main); if (nb) nb.addEventListener('click', function () { open(nb.getAttribute('data-id')); });
    var fc = core.$('#dkFocus', main);
    if (fc) fc.addEventListener('change', function () {
      var dd = st(); dd.focus = !!fc.checked; dd.t = Date.now(); core.save();
      core.VIEWS.deck(main);
      var f2 = core.$('#dkFocus', main); if (f2) f2.focus();
    });
    // flip the cards solved since the last visit (CSS transition; instant under reduced motion)
    if (newly.length) {
      var tm = setTimeout(function () {
        core.$all('.dk-card[data-flip]', main).forEach(function (b) { b.classList.add('dk-up'); b.removeAttribute('data-flip'); });
        var dd = st(), now = Date.now();
        newly.forEach(function (id) { dd.seen[id] = now; });
        dd.t = now; core.save();
      }, 80);
      core.onCleanup(function () { clearTimeout(tm); });
    }
  };

  /* ------------------------------------------------------------------ */
  /* hooks: Train hub card, mobile More row, merge-import                */
  /* ------------------------------------------------------------------ */
  function statText() {
    var pr = progress();
    return pr.total ? pr.solved + '/' + pr.total + ' cards face up · focus ' + pr.focus.k + '/' + pr.focus.n : 'Deck loading…';
  }
  core.HOOKS.trainCards.push(function () {
    return core.trainCard('#deck', 'cards', 'Probability deck', '52 problems as a deck of cards: expectation, conditional, geometric probability and random walks, rising from ace to king.', statText());
  });
  core.HOOKS.moreItems.push(function () {
    return '<a class="mode-card" href="#deck"><span class="ic">' + ICONS.cards + '</span><span><b>Probability deck</b><small>' + esc(statText()) + '</small></span></a>';
  });
  core.HOOKS.mergeState.push(function (cur, inc) {
    var b = inc && inc.deck;
    if (!core.isPlainObj(b)) return;
    if (!core.isPlainObj(cur.deck)) cur.deck = {};
    var a = cur.deck;
    if (!core.isPlainObj(a.seen)) a.seen = {};
    if (core.isPlainObj(b.seen)) Object.keys(b.seen).forEach(function (id) {
      var t = +b.seen[id] || 0; if (!a.seen[id] || t > a.seen[id]) a.seen[id] = t;
    });
    if (typeof b.focus === 'boolean' && ((b.t || 0) > (a.t || 0) || typeof a.focus !== 'boolean')) a.focus = b.focus;
    a.t = Math.max(a.t || 0, b.t || 0);
  });

  window.SBT_DECK = { progress: progress, suits: SUITS, cards: function () { return allCards(grid()); } };
});
