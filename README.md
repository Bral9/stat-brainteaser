# Stat Brainteaser

An offline-first Progressive Web App for preparing for **quant trading / quant research, data science and ML internship interviews**: probability, statistics, brainteasers, expected value and betting games, combinatorics, Fermi estimation, Python, SQL, machine learning and mental math.

**Live:** https://bral9.github.io/stat-brainteaser/

It is plain static files with no build step, no frameworks, no CDNs and no tracking. After the first visit it works entirely offline, on desktop and on a phone.

## Features

**205 curated problems in 9 topics**, each with difficulty 1–3, tags, 1–2 progressive hints, a step-by-step solution and a one-line *key idea*.

| Group | Topic | Count | Highlights |
| --- | --- | --- | --- |
| Quant core | Probability | 36 | conditioning, Bayes, indicators, coupon collector, gambler's ruin, Markov chains, order statistics, broken stick, Pólya urn, ballot, secretary |
| Quant core | Statistics | 20 | bias/variance, MLE, CLT, confidence intervals, p-values, multiple testing, regression and R², covariance of sums |
| Quant core | EV & Games | 22 | fair prices, re-roll options, optimal stopping, red/black card game, Kelly sizing, "make me a market" |
| Quant core | Combinatorics | 20 | stars and bars, derangements, Catalan, inclusion–exclusion, poker hands, surjections |
| Quant core | Brainteasers | 22 | pirates, 100 prisoners, two eggs, bridge and torch, ants, lockers, blue-eyed islanders, weighings |
| Quant core | Fermi estimates | 12 | estimation graded against a reasoned acceptance range |
| Technical | Python | 24 | output prediction (mutable defaults, aliasing, copy/deepcopy, closures, generators, rounding, slicing), Big-O, numpy broadcasting/axes/NaN, pandas groupby/merge/loc vs iloc, vectorization |
| Technical | SQL | 24 | join row counts with duplicates and NULLs, GROUP BY/HAVING, NULL semantics, ROW_NUMBER/RANK/DENSE_RANK, running sums, LAG returns, CTEs, top-N per group |
| Technical | Machine learning | 25 | bias–variance, L1 vs L2, CV and time-series leakage, precision/recall/F1, ROC-AUC, log-loss, gradient descent, logistic odds, Gini/entropy, k-means, PCA, MLE ↔ loss |

**Every answer that can be computed was checked by a script before it shipped.** Numeric answers were recomputed with exact fractions, enumeration, DP or Monte Carlo. Every Python output was produced by running the snippet. Every SQL answer was produced by running the query on the shown tables in SQLite.

### Modes

- **Home:** topic cards grouped into *Quant core* and *Technical*, each with a progress bar. Tap a card to start practising that topic. The *Continue* button resumes your last session; *Daily mix* builds 10 problems weighted toward due reviews and your weakest topics.
- **Practice:** search plus filters for topic, difficulty and status (new / missed / solved), shown as a compact list with status icons.
- **Problem screen:**
  - breadcrumb (topic › difficulty) and a session counter (3 / 10)
  - a large prompt with scrollable code blocks and tables
  - an answer box with an inline format hint
  - hints and the solution as expandable sections
  - Previous/Next buttons and a clear correct/incorrect state
  - On desktop, a side panel lists the session.
  - Browser and Android back buttons move between problems.
- **Review:** Leitner spaced repetition with reviews after 1, 3, 7, 16 and 35 days. Missed problems return to box 1. A badge shows how many are due today.
- **Train:**
  - *Mental math sprint* (Zetamac/Optiver style, classic or quant mix, best scores and history)
  - *Probability drills* (endless generated questions with exact answers)
  - *Interview mode* (5 mixed problems, a countdown on each, then a summary)
- **Stats:** accuracy per topic, problems solved, streaks, a 4-week activity strip, review boxes, a sprint trend sparkline and your weakest topic.
- **Settings:**
  - theme (auto / light / dark)
  - Export / Import progress as JSON, to move between PC and phone
  - reset progress
  - check for updates
  - replay the intro
- A short 3-step intro on first run, which you can skip.
- **Answer checking:**
  - Numbers can be typed as `5/36`, `0.1389`, `13.9%`, `1/6+1/36`, `1-(5/6)^4`, `C(10,3)`, `10!`, `sqrt(2)`, `2.5k` or `$1,250`. A small safe parser reads them; `eval` is never used.
  - Code-output answers such as `[1, 2, 3]` or `True` are compared ignoring case, spaces and quote style.
- **Layout:**
  - Mobile: a bottom tab bar.
  - Desktop (900 px and wider): a sidebar, a two-column practice screen and a session panel.
  - Light and dark themes, accessible labels and focus states, and `aria-live` feedback.
  - No horizontal scrolling at 360 px.

**Keyboard shortcuts on desktop:**

| Key | Action |
| --- | --- |
| Enter | Check / start |
| H | Open next hint |
| S | Open solution (interview: give up) |
| N / P | Next / previous problem |
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
  "cat": "probability",           // probability | statistics | ev | combinatorics | brainteasers | fermi | python | sql | ml
  "diff": 2,                      // 1 warm-up, 2 interview, 3 hard
  "title": "Short title",
  "tags": ["conditioning", "dice"],
  "prompt": "<p>HTML allowed: p, b, i, sup, sub, br, ul, ol, li, code, pre, table. Use Unicode math (x², √, Σ). Code goes in <pre><code>…</code></pre>.</p>",
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
| `text` | `accept: ["[1, 2, 3]", ...]` | case-, whitespace- and quote-style-insensitive exact match (good for "what does this print?") |
| `self` | `display` | the user reveals the solution and marks themselves right or wrong |

Progress is saved under a stable key with a schema version (`state.v`). If you change its shape, add a step to `migrate()` in `app.js`.

You don't have to bump anything for an update to reach users: every push gets a unique build id (see below). Bump `APP_VERSION` in `app.js` and `VERSION` in `sw.js` together, and only for releases you want a human-readable version number for. If you add a new file, also add it to the `PRECACHE` list in `sw.js`.

## Updates & notifications

### How a deploy works
1. You push to `main`.
2. `.github/workflows/deploy.yml` runs. It copies the site, stamps a unique build id (`<short sha>-<run number>`) into `sw.js` by replacing `var BUILD = 'dev';`, and writes a `version.json`:
   ```json
   {"version": "1.2.0", "build": "abc1234-17", "date": "2026-10-21T16:00:00Z", "notes": "first line of the commit message"}
   ```
3. The workflow publishes the result to GitHub Pages.
4. Because `sw.js` changes on every deploy, browsers detect a new service worker. Its cache name includes the build id, so old caches are deleted when it activates.
5. Locally (no Action), `BUILD` stays `'dev'`, there is no `version.json`, and everything still works.

> **One-time setup:** in the repo, go to **Settings → Pages → Build and deployment** and set **Source: GitHub Actions**.

### In the app
- **Update prompt:** the app checks for a new version when it opens, whenever you come back to the tab, and every 30 minutes while it is open. When one is ready, you get an **"Update available"** prompt showing the version, build, date and the commit message. Tap **Update** and the app reloads into the new version. Your progress is kept, because it lives in localStorage and not in the cache.
- **Settings → Updates** shows:
  - the current version, build and deploy date
  - a **Check for updates now** button ("You're up to date · v1.2.0 · build abc1234-17 · 21 Oct 2026")
  - the **Update notifications** toggle (off by default; the Home screen offers it once)

### Notifications when the app is closed
Turning notifications on asks for permission. On browsers that support **Periodic Background Sync**, it also registers a background check about every 12 hours. That means **Chrome or Edge, with the app installed**.

The background check reads `version.json`, which is never cached. If the build differs from the one you are running, it shows one notification per new build: "Stat Brainteaser update available", with the commit message. Tapping the notification opens the app, where the Update prompt is waiting. If the app is open in a background tab when an update is found, you also get a system notification.

| Platform | What you get |
| --- | --- |
| Chrome / Edge, installed app (Windows, Android) | Background checks about every 12 h, plus a system notification |
| Chrome / Edge in a normal tab | Notification while the app is open (including a background tab) |
| iPhone / iPad, Firefox | No background checks; the update prompt appears when you open the app |

The browser decides when periodic sync actually runs, based on how much you use the app, so it can be less frequent than 12 hours.

### Alternative: get notified by GitHub
On https://github.com/bral9/stat-brainteaser, click **Watch → Custom**, then tick **Releases**, or choose **All activity** to hear about every push. GitHub then emails you and notifies you in the GitHub mobile app whenever something is added.

## Project layout

```
index.html            app shell
styles.css            all styles (light/dark tokens)
app.js                router, views, sessions, parser, SRS, sprint, drills, stats, migration
problems.js           problem bank
manifest.webmanifest  PWA manifest (relative paths, scope "./")
sw.js                 cache-first service worker; cache name = version + build; periodic update check
icons/                192/512 icons, maskable variants, apple-touch-icon, favicon
.github/workflows/    deploy.yml: stamps the build id, writes version.json, deploys to Pages
version.json          generated at deploy time only (not in the repo, never cached)
.nojekyll             serve files as-is on GitHub Pages
```

To run it locally, start `python -m http.server 8000` in this folder and open http://localhost:8000/. A service worker needs `http://localhost` or HTTPS; it does not work from `file://`.

## License

MIT © 2026 Breal Tchuimi. See [LICENSE](LICENSE).
