# Stat Brainteaser

An offline-first Progressive Web App for preparing for **quant trading / quant research, data science and ML internship interviews** and **math competitions**: probability, statistics, brainteasers, expected value, Markov chains, Kelly betting, options, market making, game theory, number theory, combinatorics, Fermi estimation, Python, SQL, machine learning and mental math — plus a rule-based mock interview, short concept lessons with a curated library, a Python coding lab, an interview guide, an arcade, firm prep, interview study plans and superday mocks.

**Live:** https://bral9.github.io/stat-brainteaser/

It is plain static files with no build step, no frameworks, no CDNs and no tracking. After the first visit it works entirely offline, on desktop and on a phone.

## Features

**601 curated problems in 18 topics** (340 of them with interviewer follow-ups), each with difficulty 1–3, tags, an *interview-format* label, 1–2 progressive hints, a step-by-step solution and a one-line *key idea*. Every topic has its own page with concept cards (key formula, worked micro-example, common trap), recommended books and your progress.

| Group | Topic | Count | Highlights |
| --- | --- | --- | --- |
| Quant core | Probability | 44 | conditioning, Bayes, indicators, coupon collector, gambler's ruin, order statistics, broken stick, Pólya urn, ballot, secretary |
| Quant core | Statistics | 27 | bias/variance, MLE, CLT, confidence intervals, p-values, regression algebra, conjugate priors, correlation bounds |
| Quant core | EV & Games | 29 | fair prices, re-roll options, optimal stopping, best-of-seven, bold play, "make me a market" |
| Quant core | Combinatorics | 25 | stars and bars, derangements, Catalan, inclusion–exclusion, Burnside necklaces, poker hands |
| Quant core | Brainteasers | 27 | pirates, 100 prisoners, egg drops, weighings, hats, knight tours |
| Quant core | Fermi estimates | 12 | estimation graded against a reasoned acceptance range |
| Quant core | **Markov chains** (new) | 22 | first-step analysis, stationary distributions, return times, biased gambler's ruin, pattern races, regime switching |
| Quant core | **Number theory** (new) | 22 | last digits, CRT, divisor functions, Fermat/Euler, Legendre, Frobenius coin problem |
| Trading & markets | **Kelly & betting** (new) | 22 | pricing a game, Kelly fraction, growth rates, fractional Kelly, doubling-before-halving, pot odds |
| Trading & markets | **Options** (new) | 22 | payoffs, put–call parity & arbitrage, binomial trees, Greeks intuition, ATM ≈ 0.4·σ·√T·S, delta-hedged P&L |
| Trading & markets | **Market making** (new) | 22 | quoting fair value ± width, adverse selection (Glosten–Milgrom), inventory skew, trade-stream P&L, ETF creation arbitrage |
| Trading & markets | **Game theory** (new) | 22 | mixed equilibria, zero-sum values, auctions, Nim/Grundy, truels, Rubinstein bargaining |
| Technical | Python | 24 | output prediction, Big-O, numpy broadcasting/axes/NaN, pandas groupby/merge |
| Technical | SQL | 24 | join row counts, NULL semantics, window functions, running sums, top-N per group |
| Technical | Machine learning | 25 | bias–variance, regularisation, leakage, metrics, gradient descent, k-means, PCA |

The counts above are the 2.0 bank; 2.1 adds the packs listed below (bank total 601: probability 103, statistics 61, EV 52, Markov 40, ML 31, options 30, Kelly 29, market making 32, **microstructure 20**, **coding lab 33**, **systems & design 12**, …).

### New in 2.1 (all content original, every number machine-verified)

- **Mock interview** (`#mock`): a rule-based, offline recreation of a real quant interview. Formats: classic (2 maths + 1 coding, ~60 min), trading desk (probability + a market-making round + mental maths), research (stats/regression + ML/coding), a 30-minute phone screen, a conversational Jane-Street-style preset and firm-flavoured presets. Each round runs **Explain first → Solve (3-level hint ladder, stuck protocol) → Follow-up push-back (faster? n→∞? sanity check? new parameter? complexity? a planted mistake to correct) → between-round debrief**. The final scorecard covers communication, correctness, adaptability, handling stuck, speed, complexity awareness and the four published tips (approach methodically, communicate clearly, correct your mistakes, ask why); next actions feed the interview planner, the report goes to the journal and exports to Markdown. Optional speak-aloud via the Web Speech API.
- **Follow-ups on 340 problems** (`plan`, `par`, `followups` in the schema): 687 scripted follow-ups, 641 with a checkable answer.
- **New packs**: the classic interview pack (48: equicorrelation and PSD, conditional regression and collider bias, Bayes, order statistics, stopping times, OLS facts), a syllabus pack built from an unofficial question compilation (40 numeric + 12 open design questions; the source's errors are corrected), the Probability & Markets track (33), the **Probability deck** (`#deck`, 52 cards: ♣ expectation, ♦ conditional probability, ♥ geometric probability, ♠ random walks & martingales), microstructure (14) and 33 Python coding problems.
- **Open questions** (answer type `open`): design / discussion questions (order book, OMS, backtesting pitfalls, risk system, tick storage, ML in trading…) graded against a key-points checklist on a 0–3 scale, with a model outline and pitfalls.
- **Coding lab** (`#codelab`, answer type `code`): a plain editor (tab handling, line numbers) and real tests run by **Pyodide** in a Web Worker with a timeout. The runner is optional: one explicit download (~10 MB, pinned v0.26.4 from jsDelivr), then cached by the service worker for offline use. Without it, problems fall back to predict-the-output / complexity questions and a self-check. Each problem ends with the complexity follow-up ("why is the naive version slow? name the fix").
- **Learn** (`#learn`): 82 short concept lessons in 12 tracks (probability, EV & Kelly, statistics & regression, linear algebra, Markov chains, markets & market making, microstructure & HFT, options, stat arb, coding, interview craft, mental maths). Each lesson is a 2–4 minute index card that points to the exact chapter or video to read next, with read / "confusing" flags, notes and Obsidian export.
- **Library** (`#library`): 194 curated books, courses and guides — *curated from Quant Roadmap 2024/25 by Stat Arb (@quant_arb) and other sources* (titles and links only; descriptions are our own) — with search, filters, a "start here" shelf, per-item status / notes / rating and Obsidian export.
- **Interview guide** (`#guide`): the typical pipeline, what interviewers evaluate, role differences, a firm comparison matrix and per-firm expectations; every fact carries a source tag and an as-of date, and conflicting claims are shown side by side. Content lives in `build/guide/guide.json`.
- **Queue Position** arcade game (`#arcade/queue`): a FIFO limit-order-book simulator of the "0+" scratching idea (illustrative, from a promotional blog post): choose a latency tier, join levels, watch your queue position and queue strength, scratch or hold after a fill; presets show the edge vanish with retail fees and when a privileged order type breaks FIFO.
- **Planner**: weekly mock interviews (twice a week in the last three weeks), a weekly coding-lab problem, a microstructure slot for trading-desk targets, Library "start here" reading in week 1 and weekly Learn lessons in your weakest topic; weak topics from mock reports are weighted up. Home's "Today" card shows these.
- **Calmer design**: one muted accent, neutral graphite dark mode, low-chroma topic dots, one card / button / header style everywhere, no gradients; WCAG AA contrast in both themes.

### New in 2.0 (all content original)

- **Problem status** with five states — unsolved, attempting, wrong, seen solution, solved — shown as icons everywhere. Opening a solution before solving marks it *seen solution* (never counted as solved); **Mark as not solved** resets a problem. Wrong and seen-solution problems come back in Review **2 days** later.
- **Attempt timer** on every problem (visible, pausable with the button or <kbd>T</kbd>, pauses when the tab is hidden); time-to-solve is stored and charted per topic.
- **Shareable filters**: topics, difficulty, status, interview format, set and search live in the URL (`#practice?t=kelly,mm&d=3&s=unsolved`). **Saved filter presets**, **Pick one** (random, unsolved first), and **Next** follows the filtered list ("That's the last problem in this list.").
- **Custom problem sets** (create, rename, delete; a problem can be in many sets; "Add to" remembers the last set) and the ordered **Core 50** must-do playlist with a progress bar.
- **Answer box**: comma-separated multi-value answers (bid, ask; equilibrium probabilities), typed multiple choice, an on-screen **math keypad** (digits, / ^ ! √ π ( ) , −) for phones, an **answer format help** popover and the canonical form shown on a correct answer — plus an encouraging message and light confetti (off with reduced motion).
- **Related problems** (4 cards) after you answer, and private **notes** per problem (saved, exported, shown in the journal).
- **Interview format labels** (trading desk, OA speed, research stats, market-making game, betting game, options desk, brainteaser screen, math test, coding screen) — describing the *kind* of round a problem resembles, never claiming a firm asked it.
- **Firm prep** for 17 firms: process timeline, what each round tests, a tickable prep checklist, recommended topics and arcade drills, a one-tap practice set and your own notes. Notes written October 2026 — processes change.
- **Interview study plan** (deterministic, rule-based — no AI): 12 / 8 / 4-week and 2-week superday templates chosen from your date, optional target firm and hours per day. Each day runs *mental maths → topic problems → format practice → review misses*; weak topics get more days, missed days re-flow, and today's tasks sit on Home next to the competition coach.
- **Superday mock**: a timed 45-minute mixed set solved out loud, then a 1–5 self-assessment on the 5-point rubric and a mistake log saved to your journal. **Stamina mode** runs 4 mocks back to back.
- **Arcade** (Train → Arcade): online-test style games — Arithmetic Mania, 80 in 8, number sequences, balloon risk, card-counting and dice market making, Fermi and Kelly.
- **Stats**: a year-long activity heat map, current and longest streak, a "problems conquered" ring by difficulty, status breakdown, time to solve per topic and your weakest topics (which feed the planner).

**Every answer was checked by a script before it shipped** (`build/verify_all.py` runs all verifiers). Numeric answers were recomputed with exact fractions, enumeration, DP or Monte Carlo. Every Python output was produced by running the snippet. Every SQL answer was produced by running the query on the shown tables in SQLite.

### Competitions: QUMC & Putnam coach (v1.3)

A separate **Compete** section prepares you for the Quebec University Mathematics Competition (ISM) and the Putnam. It covers 139 original or classical problems at levels 1–5, a 40-technique skill tree with lesson cards, 134 official Putnam references, and 3 + 3 mock exams. Official Putnam problems are **linked**, never copied. Competition problems stay in their own section; turn on *Settings → Competition problem of the day* if you want one on Home.

- **Competition pages:**
  - countdown and format
  - the date rule: the Putnam is the first Saturday of December; the QUMC date is editable because ISM announces it each year
  - a registration checklist you tick off, with "confirm with your local supervisor" where facts can change
  - goals for your current year of competing
  - day-of strategy, topic weights, past-paper status and resources
- **Smart planner (deterministic, offline, no AI):**
  - A setup wizard asks for your targets, hours per week, the days you can study and your background. It offers an optional 90-minute placement diagnostic (12 problems, self-graded 0/1/2).
  - It then generates a **day-by-day plan** to each contest. The time bucket sets the phase split (Foundations → Toolbox → Mixed → Competition → Taper), and each day follows a session template:
    - a lesson card, two problems at your level, and a write-up with a reflection
    - triage practice in mixed sets
    - mocks under real timing
    - taper days before the contest
- **Adaptation:** the plan applies the rules in `plans.json` and tells you what changed and why.
  - **prerequisite review:** e.g. "Added a review of Pigeonhole because only 1/4 Graphs problems were solved"
  - **level up / level down**
  - **hint dependence:** hints lock for 15 minutes
  - **write-up gap:** proof-writing drills are added
  - **spaced retry:** at +3 and +10 days
  - **time pressure:** under 14 days, no new hard topics
  - **burnout:** if you miss sessions, the next week is 30% lighter
  - **missed days:** the remaining plan re-flows from today, without guilt
- **Skill tree:** mastery dots, target level, prerequisites, lesson cards, linked problems, and Putnam references you can mark attempted or solved.
- **Problem screen:**
  - a stopwatch and progressive hints
  - an answer check for numeric and short answers
  - the model solution with common mistakes
  - self-grading on a rubric: **0** no progress · **1** key idea · **2** mostly complete · **3** complete & rigorous
  - the grade updates mastery (an exponentially weighted model)
- **Mock exams:**
  - QUMC-style papers: 7 problems in 210 minutes
  - Putnam-style half papers: two 90-minute blocks of 3, or the full 4 × 90-minute day with breaks
  - a timed **triage A/B/C** step opens every block; you then grade on the Putnam scale and get a triage audit
- **Seasons and multiple years:**
  - Each contest year is a season ("2026–27"). When it ends it is archived, and your mastery, journal and history carry over.
  - Year-of-competing goals run from Year 1 to Year 4.
  - A post-competition review wizard records scores and lessons, and those lessons seed the next season.

### Journal (thinking log)

- **Guided reflection after every competition problem:**
  - takes about 30 seconds and is always skippable
  - you fill in: approach chips, where you got stuck, the key insight, mistake-type chips, confidence, and a **tip to future me**
  - the prompt adapts to the outcome: "What would have made you see it?" after a miss, "What pattern did you recognise?" after a quick solve
  - you can turn the same reflection on for quant problems in Settings
- **Free-form entries:** a daily reflection, an end-of-session note, a competition-day log, or a mock post-mortem.
- **Organisation:**
  - entries are tagged automatically with problem, skills, competition, season and date
  - a timeline groups them by month and season, with search and filters
- **Tips library:** filter by skill, competition or season, and pin favourites. Pinned tips show up in a **"Read before you start"** card before every mock and on contest day.
- **Resurfacing:** opening a skill or problem shows your past notes on it.
- **Export:**
  - **Markdown for Obsidian:** one file, or a `.zip` with one note per entry and YAML front-matter (the zip is built in the browser, with no libraries)
  - the journal is also included in the JSON progress export and import
- **Storage:** the journal lives under its own localStorage key, and the app warns you when storage is close to full.

### Modes

- **Home:** topic cards grouped into *Quant core*, *Trading & markets* and *Technical*, each with a progress bar. Tap a card to start practising that topic. The *Continue* button resumes your last session; *Daily mix* builds 10 problems weighted toward due reviews and your weakest topics.
- **Practice:** search plus filters for topic, difficulty, status (unsolved / attempting / wrong / seen / solved), interview format and set, kept in the URL; saved presets, Pick one, and shortcuts to Topics, Firms, Sets and Core 50.
- **Problem screen:**
  - breadcrumb (topic › difficulty) and a session counter (3 / 10)
  - a large prompt with scrollable code blocks and tables
  - an answer box with an inline format hint
  - hints and the solution as expandable sections
  - Previous/Next buttons and a clear correct/incorrect state
  - On desktop, a side panel lists the session.
  - Browser and Android back buttons move between problems.
- **Review:** Leitner spaced repetition with reviews after 1, 3, 7, 16 and 35 days. Wrong answers and peeks at the solution return to box 1 and come back 2 days later. A badge shows how many are due today.
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
  - Mobile: a bottom tab bar (Home, Practice, Compete, Train, More — Review, Journal, Stats and Settings live under More).
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

Problems live in `problems.js` as `window.PROBLEMS = [ ... ]`, generated by `build/assemble.py` from `build/parts/*.json` (each part has a `src_*.py` generator and a `verify_*.py` verifier; concept cards and the Core 50 playlist are generated into the same file). A problem looks like this:

```js
{
  "id": "prob-037",               // unique
  "cat": "probability",           // probability | statistics | ev | combinatorics | brainteasers | fermi | markov | numbertheory | kelly | options | mm | gametheory | python | sql | ml
  "diff": 2,                      // 1 warm-up, 2 interview, 3 hard
  "title": "Short title",
  "tags": ["conditioning", "dice"],
  "style": ["trading-desk"],     // 1–2 interview-format labels (see STYLES in app.js)
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
| `choice` | `options: [...]`, `correct: index` | click / keys 1–4 (or type the letter) |
| `multi` | `values: [...]`, `ordered: true/false`, optional `tolRel` | comma-separated values, each a number or expression; unordered lists accept any order |
| `text` | `accept: ["[1, 2, 3]", ...]` | case-, whitespace- and quote-style-insensitive exact match (good for "what does this print?") |
| `self` | `display` | the user reveals the solution and marks themselves right or wrong |

Progress is saved under a stable key with a schema version (`state.v`, currently 4). If you change its shape, add a step to `migrate()` in `app.js`. The v3 → v4 step (app 2.0) derives the five-state status from your attempts and keeps everything else, including competition and journal data.

You don't have to bump anything for an update to reach users: every push gets a unique build id (see below). Bump `APP_VERSION` in `app.js` and `VERSION` in `sw.js` together, and only for releases you want a human-readable version number for. If you add a new file, also add it to the `PRECACHE` list in `sw.js`.

### v2.1 fields

- `plan: {keyIdea, method, sanityChecks: []}`: what a strong candidate says before computing (used by the mock interview's "explain first" phase).
- `par`: realistic minutes for a strong candidate.
- `followups: [{type, prompt, model, answer?}]`, where `type` is one of `faster`, `variant`, `limit`, `sanity`, `complexity`, `explain` or `correct` (the interviewer plants a mistake for you to correct). `answer` has the same shape as a problem answer and is machine-verified.
- `deck: {suit, rank}`: a card in the probability deck.
- Answer type `open`: `{points, outline, pitfalls}`, self-graded from 0 to 3.
- Answer type `code`: `{fn, signature, starter, reference, tests, cmp, complexity, predict}`, run by the coding lab.
- Follow-ups for existing problems live in `build/parts/overlay_followups.json`.

`python build/check_part.py parts/<name>.json` validates a part. `python build/verify_all.py` re-runs every verifier, then the bank-level checks.

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
problems.js           problem bank, concept cards (SBT_TOPICS) and the Core 50 playlist (generated)
competitions.js       competition content: QUMC & Putnam facts, skill tree, 139 problems, mocks, plans (generated from JSON)
coach.js              competition coach logic: seasons, mastery, planner, adaptation, journal store, Markdown/zip export
coach-ui.js           competition & journal views
prep-data.js          firm process notes, books, interview-plan templates, superday rubric
prep.js               interview prep logic: deterministic planner, firm checklists/notes, mocks, journal export of notes
prep-ui.js            topic pages, firm pages, interview plan, superday mock, Home "Today" card
mock.js               mock interview mode (formats, phases, follow-ups, rule-based feedback, scorecard) + the `open` answer type
learn.js, learn-data.js      Learn lessons (data generated by build/build_learn.py from build/learn/*.json)
library.js, library-data.js  Library (data generated by build/build_library.py from build/library/*.json)
guide.js, guide-data.js      Interview guide (data generated by build/build_guide.py from build/guide/guide.json)
codelab.js, codelab-worker.js  coding lab: editor, `code` answer type, optional Pyodide runner in a Web Worker
deck.js               the probability deck view
features.css          styles of the v2.1 modules (generated by build/build_css.py from build/css/*.css)
arcade*.js, arcade.css  the Arcade games (optional: the app still works if they are missing)
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
