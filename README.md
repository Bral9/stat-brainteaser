# Stat Brainteaser

An offline-first Progressive Web App for preparing for **quant trading and quant research internship interviews**. It covers probability, statistics, brainteasers, expected value and betting games, combinatorics, Fermi estimation and mental math.

**Live:** https://bral9.github.io/stat-brainteaser/

It is plain static files with no build step, no frameworks, no CDNs and no tracking. After the first visit it works entirely offline, on desktop and on a phone.

## Features

- **132 curated problems** in six categories, each with difficulty 1–3, tags, 1–2 progressive hints, a step-by-step solution and a one-line *key idea*.
  - Probability (36): conditioning, Bayes, linearity and indicators, geometric and negative binomial, coupon collector, gambler's ruin, Markov chains and pattern waiting times, order statistics, broken stick, Pólya urn, ballot problem, secretary problem and more.
  - Statistics (20): bias and variance, MLE, CLT, confidence intervals, p-values, multiple testing, regression and R², covariance of sums, minimum-variance portfolio.
  - Brainteasers (22): pirates, 100 prisoners, two eggs, bridge and torch, ants, lockers, blue-eyed islanders, weighings, ropes and more.
  - EV & Games (22): fair prices, re-roll options, optimal stopping, red/black card game, Kelly sizing, "make me a market" questions.
  - Combinatorics (20): stars and bars, derangements, Catalan numbers, inclusion–exclusion, poker hands, surjections.
  - Fermi (12): estimation questions graded against a reasoned acceptance range.
- **Every numeric answer was checked by script.** Each answer was recomputed independently, by exact enumeration, fractions, dynamic programming or Monte Carlo, before it was shipped.
- **Tolerant answer checking.** The checker accepts `5/36`, `0.1389`, `13.9%`, `1/6+1/36`, `1-(5/6)^4`, `C(10,3)`, `10!`, `sqrt(2)`, `2.5k`, `3m`, `1e6` and `$1,250`. It uses a small safe expression parser and never calls `eval`.
- **Practice:** filter by category, difficulty, tag and status (new, unsolved, missed, solved), or browse the full list.
- **Spaced-repetition review:** Leitner boxes with review intervals of 1, 3, 7, 16 and 35 days. Missed problems return to box 1 and come back again later in the same session. The Home screen and the tab badge show how many are due today.
- **Mental math sprint:** a Zetamac / Optiver-style timed test of 30, 60, 120 or 180 seconds.
  - Classic mode drills + − × ÷ over ranges you configure.
  - Quant mode drills percentages, fractions to decimals, squares, decimal products and percent change.
  - Answers submit automatically when correct. Best scores and history are tracked.
- **Probability drills:** endless generated questions with exact answers and explanations. Types include dice sums, "at least one", binomial, E[max]/E[min], 2×2 conditional tables, Bayes tests, cards, urns and waiting times.
- **Interview mode:** 5 problems from different categories, each with a countdown (2.5, 5 or 8 minutes by difficulty). A summary with the solutions follows at the end.
- **Stats dashboard:** accuracy per category, problems solved, streak and best streak, a 4-week activity strip, the review boxes, sprint best scores with an SVG trend sparkline, and a suggested weakest category.
- **Export / Import progress** as a JSON file to move between PC and phone. You can merge or replace.
- Light and dark mode (follows the system, or set manually), mobile-first layout down to 360 px, large tap targets, accessible labels, and `aria-live` feedback.
- **Keyboard shortcuts on desktop:**

| Key | Action |
| --- | --- |
| Enter | Submit |
| H | Hint |
| S | Solution |
| N | Next |
| 1–4 | Pick a multiple-choice option |
| Esc | Skip (sprint) |

## Screenshots

_Add screenshots here, e.g. `docs/home.png`, `docs/practice.png`, `docs/sprint.png`._

## Install

### Windows (Chrome or Edge)
1. Open https://bral9.github.io/stat-brainteaser/.
2. Click the **Install** button in the app header, or the install icon in the address bar. In Edge you can also use **⋯ → Apps → Install this site as an app**.
3. The app gets its own window and Start-menu entry, and it works offline.

### Android (Chrome)
1. Open the site in Chrome.
2. Tap **Install** in the app, or **⋮ → Install app / Add to Home screen**.

### iPhone / iPad (Safari)
1. Open the site in **Safari**. Other iOS browsers cannot install web apps on older iOS versions.
2. Tap **Share** (the square with an arrow), then **Add to Home Screen**.
3. Launch it from the home screen icon.

Wait for the "Offline ready" message on your first visit. After that, everything is cached.

> **Progress is stored per device and per browser** (localStorage). To move it, go to **Settings → Export progress**, send the file to the other device, then use **Import (merge)** there. On iOS the installed app and Safari keep separate storage, so export and import between them too.

## Adding problems

Problems live in `problems.js` as `window.PROBLEMS = [ ... ]`. Append an object with this shape:

```js
{
  "id": "prob-037",               // unique
  "cat": "probability",           // probability | statistics | brainteasers | ev | combinatorics | fermi
  "diff": 2,                      // 1 warm-up, 2 interview, 3 hard
  "title": "Short title",
  "tags": ["conditioning", "dice"],
  "prompt": "<p>HTML allowed: p, b, i, sup, sub, br, ul, ol, li, code. Use Unicode math (x², √, Σ).</p>",
  "answer": { "type": "numeric", "value": 0.1388888888888889, "display": "5/36" },
  "hints": ["Gentle nudge", "Stronger hint"],
  "solution": "<p>Step 1 ...</p><p>Answer: 5/36.</p>",
  "key": "One-line key idea"
}
```

Answer types:

| Type | Fields | Graded how |
| --- | --- | --- |
| `numeric` | `value`, `display`, optional `tolRel` (default 0.005) or `tolAbs` | within tolerance; a correctly rounded decimal with ≥3 significant digits is also accepted |
| `numeric` + `range` | `range: [lo, hi]` | accepted if inside the range (Fermi and market-making) |
| `choice` | `options: [...]`, `correct: index` | click / keys 1–4 |
| `text` | `accept: ["variant", ...]` | case- and punctuation-insensitive match |
| `self` | `display` | the user reveals the solution and marks themselves right or wrong |

**After editing any file, bump `VERSION` in `sw.js`** (and `APP_VERSION` in `app.js`). Installed copies will then show an "Update available" prompt. If you add a new file, also add it to the `PRECACHE` list in `sw.js`.

## Project layout

```
index.html            app shell
styles.css            all styles (light/dark tokens)
app.js                router, views, parser, SRS, sprint, drills, stats
problems.js           problem bank
manifest.webmanifest  PWA manifest (relative paths, scope "./")
sw.js                 cache-first service worker, versioned cache
icons/                192/512 icons, maskable variants, apple-touch-icon, favicon
.nojekyll             serve files as-is on GitHub Pages
```

To run it locally, start `python -m http.server 8000` in this folder and open http://localhost:8000/. A service worker needs `http://localhost` or HTTPS; it does not work from `file://`.

## License

MIT © 2026 Breal Tchuimi. See [LICENSE](LICENSE).
