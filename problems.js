/* Stat Brainteaser problem bank. Generated from build/parts/*.json — see README for the schema. */
window.PROBLEMS = [
 {
  "id": "prob-001",
  "cat": "probability",
  "diff": 1,
  "title": "Two dice sum to 8",
  "tags": [
   "dice",
   "counting"
  ],
  "prompt": "<p>Two fair six-sided dice are rolled. What is the probability that their sum is 8?</p><p>Give a fraction or decimal.</p>",
  "answer": {
   "type": "numeric",
   "value": 0.1388888888888889,
   "display": "5/36"
  },
  "hints": [
   "There are 36 equally likely ordered outcomes.",
   "List the ordered pairs (a, b) with a + b = 8."
  ],
  "solution": "<p>All 36 ordered pairs (a, b) are equally likely.</p><p>Pairs summing to 8: (2,6), (3,5), (4,4), (5,3), (6,2) — that is 5 pairs.</p><p>P = 5/36 ≈ 0.139.</p>",
  "key": "Count ordered outcomes: for two dice, the number of ways to make sum s is 6 − |s − 7|."
 },
 {
  "id": "prob-002",
  "cat": "probability",
  "diff": 1,
  "title": "At least one six in four rolls",
  "tags": [
   "dice",
   "complement"
  ],
  "prompt": "<p>A fair die is rolled 4 times. What is the probability of getting at least one 6?</p><p>Give a decimal to 3 places or a fraction.</p>",
  "answer": {
   "type": "numeric",
   "value": 0.5177469135802469,
   "display": "671/1296 ≈ 0.5177"
  },
  "hints": [
   "“At least one” problems are usually easiest through the complement.",
   "P(no six in 4 rolls) = (5/6)⁴."
  ],
  "solution": "<p>Complement: P(no 6 in four rolls) = (5/6)⁴ = 625/1296.</p><p>So P(at least one 6) = 1 − 625/1296 = 671/1296 ≈ 0.5177.</p><p>(This is the Chevalier de Méré bet — slightly better than even.)</p>",
  "key": "P(at least one) = 1 − P(none)."
 },
 {
  "id": "prob-003",
  "cat": "probability",
  "diff": 1,
  "title": "Positive test, rare disease",
  "tags": [
   "bayes",
   "conditioning"
  ],
  "prompt": "<p>A disease affects 1% of a population. A test detects it in 99% of sick people (sensitivity) but also returns a positive result for 5% of healthy people (false-positive rate).</p><p>A randomly chosen person tests positive. What is the probability they actually have the disease?</p>",
  "answer": {
   "type": "numeric",
   "value": 0.16666666666666666,
   "display": "1/6 ≈ 0.1667"
  },
  "hints": [
   "Imagine 10,000 people and count the true positives and the false positives.",
   "True positives: 0.01 · 0.99. False positives: 0.99 · 0.05. Take the ratio."
  ],
  "solution": "<p>By Bayes: P(D | +) = P(+ | D)P(D) / [P(+ | D)P(D) + P(+ | ¬D)P(¬D)].</p><p>Numerator: 0.99 · 0.01 = 0.0099.</p><p>Denominator: 0.0099 + 0.05 · 0.99 = 0.0099 + 0.0495 = 0.0594.</p><p>P(D | +) = 0.0099 / 0.0594 = 1/6 ≈ 16.7%. The low base rate means most positives are false positives.</p>",
  "key": "Bayes with a low base rate: false positives from the large healthy group dominate."
 },
 {
  "id": "prob-004",
  "cat": "probability",
  "diff": 1,
  "title": "Monty Hall: switch?",
  "tags": [
   "conditioning",
   "bayes",
   "classic"
  ],
  "prompt": "<p>There are 3 doors: one hides a car, two hide goats. You pick door 1. The host, who knows where the car is and <b>always</b> opens a door you did not pick that hides a goat (choosing at random if he has two such doors), opens door 3 to reveal a goat.</p><p>If you switch to door 2, what is your probability of winning the car?</p>",
  "answer": {
   "type": "numeric",
   "value": 0.6666666666666666,
   "display": "2/3"
  },
  "hints": [
   "What is the probability your original pick was right? Does the host's action change it?",
   "Switching wins exactly when your first pick was wrong."
  ],
  "solution": "<p>Your first pick is the car with probability 1/3. The host can always open a goat door, so his action gives no information about whether your door is right.</p><p>If your first pick was wrong (probability 2/3), the only remaining closed door must hold the car, so switching wins.</p><p>P(win by switching) = 2/3.</p><p>Bayes check: P(car behind 2 | host opens 3) = (1/3 · 1) / (1/3 · ½ + 1/3 · 1 + 1/3 · 0) = (1/3)/(1/2) = 2/3.</p>",
  "key": "Switching wins iff the first pick was wrong, which happens with probability 2/3."
 },
 {
  "id": "prob-005",
  "cat": "probability",
  "diff": 1,
  "title": "Waiting for a six",
  "tags": [
   "geometric",
   "expectation",
   "dice"
  ],
  "prompt": "<p>You roll a fair die repeatedly until you get a 6. What is the expected number of rolls (including the final 6)?</p>",
  "answer": {
   "type": "numeric",
   "value": 6.0,
   "display": "6"
  },
  "hints": [
   "The number of rolls is geometric with success probability 1/6.",
   "First-step: E = 1 + (5/6)E."
  ],
  "solution": "<p>Let E be the expected number of rolls. After the first roll, with probability 1/6 you are done; with probability 5/6 you are back where you started.</p><p>E = 1 + (5/6)E ⇒ E/6 = 1 ⇒ E = 6.</p><p>In general a geometric variable with success probability p has mean 1/p.</p>",
  "key": "Geometric distribution: mean waiting time = 1/p."
 },
 {
  "id": "prob-006",
  "cat": "probability",
  "diff": 1,
  "title": "Hat-check fixed points",
  "tags": [
   "indicators",
   "linearity",
   "permutations"
  ],
  "prompt": "<p>10 people check their hats; the hats are returned in a uniformly random order. What is the expected number of people who get their own hat back?</p>",
  "answer": {
   "type": "numeric",
   "value": 1.0,
   "display": "1"
  },
  "hints": [
   "Write the count as a sum of indicator variables, one per person.",
   "P(person i gets their own hat) = 1/10."
  ],
  "solution": "<p>Let Iᵢ = 1 if person i gets their own hat. The number of matches is X = I₁ + … + I₁₀.</p><p>Each person gets their own hat with probability 1/10, so E[Iᵢ] = 1/10.</p><p>By linearity (which needs no independence): E[X] = 10 · 1/10 = 1.</p><p>The answer is 1 for every n.</p>",
  "key": "Linearity of expectation over indicators works even when the indicators are dependent."
 },
 {
  "id": "prob-007",
  "cat": "probability",
  "diff": 1,
  "title": "Two children, at least one boy",
  "tags": [
   "conditioning",
   "classic"
  ],
  "prompt": "<p>A family has two children. Each child is independently a boy or a girl with probability ½. You ask the parent “Is at least one of your children a boy?” and the answer is “yes”.</p><p>What is the probability that both children are boys?</p>",
  "answer": {
   "type": "numeric",
   "value": 0.3333333333333333,
   "display": "1/3"
  },
  "hints": [
   "List the equally likely ordered possibilities BB, BG, GB, GG.",
   "The answer “yes” rules out only GG."
  ],
  "solution": "<p>The four ordered outcomes BB, BG, GB, GG are equally likely.</p><p>“At least one boy” leaves BB, BG, GB — three equally likely cases.</p><p>Only BB has two boys, so P = 1/3.</p><p>Note: if instead you had <i>seen</i> a particular child who is a boy, the answer would be ½. How you learn the information matters.</p>",
  "key": "Condition on exactly the event you observed; “at least one” keeps 3 of 4 cases."
 },
 {
  "id": "prob-008",
  "cat": "probability",
  "diff": 3,
  "title": "Boy born on a Tuesday",
  "tags": [
   "conditioning",
   "classic",
   "counting"
  ],
  "prompt": "<p>A family has two children. Each child's sex (boy/girl, ½ each) and weekday of birth (7 days, uniform) are independent. You ask “Do you have at least one son born on a Tuesday?” and the answer is “yes”.</p><p>What is the probability that both children are boys? Give a fraction.</p>",
  "answer": {
   "type": "numeric",
   "value": 0.48148148148148145,
   "display": "13/27 ≈ 0.4815"
  },
  "hints": [
   "Each child is one of 14 equally likely (sex, day) types, so there are 14 · 14 = 196 ordered pairs.",
   "Count pairs with at least one Tuesday-boy: 196 − 13² = 27. How many of these are two boys?"
  ],
  "solution": "<p>Each child is one of 14 equally likely types (sex × weekday); ordered pairs of children: 196.</p><p>Pairs with at least one Tuesday-boy: 196 − 13 · 13 = 27 (the complement has each child among the 13 other types).</p><p>Among two-boy pairs (7 · 7 = 49), those with at least one Tuesday: 49 − 6 · 6 = 13.</p><p>P(both boys | at least one Tuesday-boy) = 13/27 ≈ 0.481 — between 1/3 and 1/2, because the extra detail makes the condition closer to identifying one specific child.</p>",
  "key": "More specific conditioning information moves “at least one” closer to “this particular child”."
 },
 {
  "id": "prob-009",
  "cat": "probability",
  "diff": 2,
  "title": "Waiting for HH",
  "tags": [
   "markov-chain",
   "first-step",
   "coins",
   "expectation"
  ],
  "prompt": "<p>A fair coin is flipped until two heads appear in a row (HH). What is the expected number of flips?</p>",
  "answer": {
   "type": "numeric",
   "value": 6.0,
   "display": "6"
  },
  "hints": [
   "Track states: no progress, or “last flip was H”.",
   "Let E₀, E₁ be expected remaining flips. E₀ = 1 + ½E₁ + ½E₀ and E₁ = 1 + ½·0 + ½E₀."
  ],
  "solution": "<p>States: S₀ (no progress) and S₁ (last flip H). Let E₀, E₁ be expected remaining flips.</p><p>From S₀: E₀ = 1 + ½E₁ + ½E₀ (H moves to S₁, T stays).</p><p>From S₁: E₁ = 1 + ½·0 + ½E₀ (H finishes, T resets).</p><p>The first gives E₀ = 2 + E₁; substituting: E₁ = 1 + ½(2 + E₁) ⇒ E₁ = 4, E₀ = 6.</p>",
  "key": "First-step analysis on a small Markov chain of “progress” states."
 },
 {
  "id": "prob-010",
  "cat": "probability",
  "diff": 2,
  "title": "Waiting for HT",
  "tags": [
   "markov-chain",
   "first-step",
   "coins",
   "expectation"
  ],
  "prompt": "<p>A fair coin is flipped until the pattern HT (a head immediately followed by a tail) appears. What is the expected number of flips?</p>",
  "answer": {
   "type": "numeric",
   "value": 4.0,
   "display": "4"
  },
  "hints": [
   "Once you have flipped an H, a later T always completes HT — you never lose progress.",
   "Wait for the first H (mean 2), then wait for the first T after it (mean 2)."
  ],
  "solution": "<p>Wait for the first H: geometric(½), mean 2 flips.</p><p>After that, any extra H keeps you in the “last flip H” state; the first T completes HT. That is another geometric(½) wait, mean 2.</p><p>Total: 2 + 2 = 4. Compare with HH (6): with HH a T destroys your progress, with HT it does not.</p>",
  "key": "Patterns that can't overlap themselves are found faster: HT takes 4, HH takes 6."
 },
 {
  "id": "prob-011",
  "cat": "probability",
  "diff": 2,
  "title": "Waiting for HHH",
  "tags": [
   "markov-chain",
   "first-step",
   "coins",
   "recursion"
  ],
  "prompt": "<p>A fair coin is flipped until three consecutive heads (HHH) appear. What is the expected number of flips?</p>",
  "answer": {
   "type": "numeric",
   "value": 14.0,
   "display": "14"
  },
  "hints": [
   "Use states 0, 1, 2 = current run of heads. Any T sends you back to 0.",
   "Alternatively: to get a run of n heads, Eₙ = 2(Eₙ₋₁ + 1). E₁ = 2."
  ],
  "solution": "<p>Let Eₙ be the expected flips to get n heads in a row. To get n in a row, first get n−1 in a row (Eₙ₋₁ flips), then flip once more: with probability ½ you are done, otherwise you start over.</p><p>Eₙ = Eₙ₋₁ + 1 + ½Eₙ ⇒ Eₙ = 2Eₙ₋₁ + 2.</p><p>E₁ = 2, E₂ = 6, E₃ = 14. (In general Eₙ = 2ⁿ⁺¹ − 2.)</p>",
  "key": "Recursion on the run length: Eₙ = 2Eₙ₋₁ + 2, giving 2ⁿ⁺¹ − 2."
 },
 {
  "id": "prob-012",
  "cat": "probability",
  "diff": 2,
  "title": "Collect all six faces",
  "tags": [
   "coupon-collector",
   "geometric",
   "linearity",
   "dice"
  ],
  "prompt": "<p>You roll a fair die until every face 1–6 has appeared at least once. What is the expected number of rolls? (Give a decimal.)</p>",
  "answer": {
   "type": "numeric",
   "value": 14.7,
   "display": "14.7"
  },
  "hints": [
   "Split the process into stages: waiting for the 1st new face, the 2nd new face, …",
   "When you already have k faces, a new face appears with probability (6−k)/6, so that stage takes 6/(6−k) rolls on average."
  ],
  "solution": "<p>Split into stages. With k distinct faces already seen, each roll is new with probability (6−k)/6, so stage k is geometric with mean 6/(6−k).</p><p>E = 6/6 + 6/5 + 6/4 + 6/3 + 6/2 + 6/1 = 6(1 + ½ + 1/3 + ¼ + 1/5 + 1/6) = 6 · 2.45 = 14.7.</p>",
  "key": "Coupon collector: E = n·Hₙ, a sum of geometric stage waits."
 },
 {
  "id": "prob-013",
  "cat": "probability",
  "diff": 1,
  "title": "Fair gambler's ruin",
  "tags": [
   "gamblers-ruin",
   "martingale",
   "random-walk"
  ],
  "prompt": "<p>You start with $3 and bet $1 on fair coin flips (win +1 or lose −1, probability ½ each). You stop when you reach $10 or go broke at $0.</p><p>What is the probability you reach $10?</p>",
  "answer": {
   "type": "numeric",
   "value": 0.3,
   "display": "3/10"
  },
  "hints": [
   "In a fair game your expected wealth stays constant — including at the stopping time.",
   "If p is the probability of reaching 10, then 10p + 0(1−p) = 3."
  ],
  "solution": "<p>Your wealth is a martingale (fair game) and the stopping time is bounded in expectation, so E[final wealth] = initial wealth.</p><p>10p + 0 · (1 − p) = 3 ⇒ p = 3/10.</p><p>In general, starting from i with target N: P(reach N) = i/N.</p>",
  "key": "Fair game ⇒ martingale ⇒ P(hit N before 0) = i/N."
 },
 {
  "id": "prob-014",
  "cat": "probability",
  "diff": 3,
  "title": "Biased gambler's ruin",
  "tags": [
   "gamblers-ruin",
   "first-step",
   "recursion"
  ],
  "prompt": "<p>You start with $2 and repeatedly bet $1 on a game you win with probability 0.6 (lose with 0.4). You stop at $5 or at $0.</p><p>What is the probability you reach $5? Give a fraction or 4 decimals.</p>",
  "answer": {
   "type": "numeric",
   "value": 0.6398104265402843,
   "display": "135/211 ≈ 0.6398"
  },
  "hints": [
   "Let pᵢ = P(reach 5 from i). Then pᵢ = 0.6pᵢ₊₁ + 0.4pᵢ₋₁ with p₀ = 0, p₅ = 1.",
   "The solution is pᵢ = (1 − rⁱ)/(1 − r⁵) with r = q/p = 2/3."
  ],
  "solution": "<p>Let pᵢ be the probability of reaching 5 from i. First-step: pᵢ = p·pᵢ₊₁ + q·pᵢ₋₁, p₀ = 0, p₅ = 1, with p = 0.6, q = 0.4.</p><p>The general solution is pᵢ = A + B·rⁱ where r = q/p = 2/3; the boundary conditions give pᵢ = (1 − rⁱ)/(1 − r⁵).</p><p>p₂ = (1 − 4/9)/(1 − 32/243) = (5/9)/(211/243) = 135/211 ≈ 0.6398.</p>",
  "key": "Biased ruin: P(reach N from i) = (1 − (q/p)ⁱ)/(1 − (q/p)ᴺ)."
 },
 {
  "id": "prob-015",
  "cat": "probability",
  "diff": 2,
  "title": "Expected max of two dice",
  "tags": [
   "dice",
   "order-statistics",
   "expectation"
  ],
  "prompt": "<p>Two fair dice are rolled. What is the expected value of the larger of the two numbers? Give a fraction or decimal.</p>",
  "answer": {
   "type": "numeric",
   "value": 4.472222222222222,
   "display": "161/36 ≈ 4.472"
  },
  "hints": [
   "P(max ≤ k) = (k/6)².",
   "So P(max = k) = (k² − (k−1)²)/36 = (2k − 1)/36."
  ],
  "solution": "<p>P(max ≤ k) = (k/6)², so P(max = k) = (2k − 1)/36 for k = 1..6.</p><p>E[max] = Σ k(2k − 1)/36 = (1 + 6 + 15 + 28 + 45 + 66)/36 = 161/36 ≈ 4.472.</p><p>Shortcut: E[max] + E[min] = E[sum] = 7, and E[min] = 91/36, giving the same 161/36.</p>",
  "key": "For a maximum, work with the CDF: P(max ≤ k) = P(each ≤ k)."
 },
 {
  "id": "prob-016",
  "cat": "probability",
  "diff": 2,
  "title": "Range of four uniforms",
  "tags": [
   "order-statistics",
   "uniform",
   "continuous",
   "expectation"
  ],
  "prompt": "<p>X₁, X₂, X₃, X₄ are independent Uniform(0, 1). What is E[max − min]?</p>",
  "answer": {
   "type": "numeric",
   "value": 0.6,
   "display": "3/5"
  },
  "hints": [
   "For n iid uniforms, E[max] = n/(n+1) and E[min] = 1/(n+1).",
   "n points split [0,1] into n+1 gaps of equal expected length."
  ],
  "solution": "<p>n uniform points cut [0, 1] into n + 1 gaps that are exchangeable, so each has expected length 1/(n + 1).</p><p>Hence E[min] = 1/(n+1) and E[max] = n/(n+1), so E[max − min] = (n − 1)/(n + 1).</p><p>For n = 4: 3/5 = 0.6.</p>",
  "key": "n uniforms create n+1 exchangeable gaps, each with mean 1/(n+1)."
 },
 {
  "id": "prob-017",
  "cat": "probability",
  "diff": 3,
  "title": "Product of uniforms below ½",
  "tags": [
   "continuous",
   "uniform",
   "geometric-probability",
   "integration"
  ],
  "prompt": "<p>X and Y are independent Uniform(0, 1). What is P(XY &lt; ½)? Give a decimal to 4 places.</p>",
  "answer": {
   "type": "numeric",
   "value": 0.8465735902799727,
   "display": "(1 + ln 2)/2 ≈ 0.8466"
  },
  "hints": [
   "Condition on X = x: P(Y &lt; 1/(2x)) equals 1 if x ≤ ½ and 1/(2x) otherwise.",
   "Integrate: ½ + ∫ from ½ to 1 of dx/(2x)."
  ],
  "solution": "<p>Condition on X = x. If x ≤ ½, then xY ≤ ½ always. If x &gt; ½, P(Y &lt; 1/(2x)) = 1/(2x).</p><p>P = ∫₀^½ 1 dx + ∫_½^1 1/(2x) dx = ½ + ½(ln 1 − ln ½) = ½ + (ln 2)/2.</p><p>P = (1 + ln 2)/2 ≈ 0.8466.</p>",
  "key": "Condition on one variable and integrate the conditional probability."
 },
 {
  "id": "prob-018",
  "cat": "probability",
  "diff": 2,
  "title": "The meeting problem",
  "tags": [
   "continuous",
   "uniform",
   "geometric-probability"
  ],
  "prompt": "<p>Two friends each arrive at a café at an independent, uniformly random time between 12:00 and 13:00. Each waits 15 minutes for the other, then leaves (or leaves at 13:00, whichever is sooner).</p><p>What is the probability they meet? Give a fraction or decimal.</p>",
  "answer": {
   "type": "numeric",
   "value": 0.4375,
   "display": "7/16 = 0.4375"
  },
  "hints": [
   "Draw the unit square of arrival times (in hours). They meet iff |X − Y| ≤ ¼.",
   "The complement is two triangles with legs ¾."
  ],
  "solution": "<p>Measure time in hours: X, Y ~ Uniform(0,1) independent. They meet iff |X − Y| ≤ ¼.</p><p>The region |X − Y| &gt; ¼ is two right triangles with legs ¾, total area 2 · ½ · (¾)² = 9/16.</p><p>P(meet) = 1 − 9/16 = 7/16 = 0.4375.</p>",
  "key": "Two uniform times → area in the unit square; |X−Y| ≤ w has area 1 − (1−w)²."
 },
 {
  "id": "prob-019",
  "cat": "probability",
  "diff": 2,
  "title": "Broken stick triangle",
  "tags": [
   "broken-stick",
   "uniform",
   "geometric-probability"
  ],
  "prompt": "<p>A stick of length 1 is broken at two points chosen independently and uniformly along its length. What is the probability that the three pieces can form a triangle?</p>",
  "answer": {
   "type": "numeric",
   "value": 0.25,
   "display": "1/4"
  },
  "hints": [
   "The pieces form a triangle iff every piece is shorter than ½.",
   "The bad events “piece i ≥ ½” are disjoint; each has probability ¼."
  ],
  "solution": "<p>Three lengths summing to 1 form a triangle iff each is &lt; ½ (triangle inequality).</p><p>The events “piece i ≥ ½” (i = 1, 2, 3) are disjoint (two pieces can't both be ≥ ½ without equality). For the left piece: P(both cuts ≥ ½) = ¼. By symmetry of the gaps, each piece has the same probability ¼.</p><p>P(triangle) = 1 − 3 · ¼ = ¼.</p>",
  "key": "Triangle ⇔ no piece ≥ ½; the three failure events are disjoint, each with probability ¼."
 },
 {
  "id": "prob-020",
  "cat": "probability",
  "diff": 3,
  "title": "Longest piece of a broken stick",
  "tags": [
   "broken-stick",
   "order-statistics",
   "uniform"
  ],
  "prompt": "<p>A stick of length 1 is broken at two independent uniform points into three pieces. What is the expected length of the <b>longest</b> piece? Give a fraction or decimal.</p>",
  "answer": {
   "type": "numeric",
   "value": 0.6111111111111112,
   "display": "11/18 ≈ 0.6111"
  },
  "hints": [
   "The three pieces are spacings of uniform points; the shortest has mean 1/9.",
   "For n pieces, the expected k-th smallest spacing is (1/n)(1/n + 1/(n−1) + … + 1/(n−k+1))."
  ],
  "solution": "<p>The spacings (L₁, L₂, L₃) are uniformly distributed on the simplex. A classic result: for n spacings, the expected k-th smallest equals (1/n) Σ_{j=n−k+1}^{n} 1/j.</p><p>Shortest: P(min &gt; t) = (1 − 3t)², so E[min] = ∫₀^{1/3} (1 − 3t)² dt = 1/9.</p><p>Longest (n = 3, k = 3): (1/3)(1/3 + 1/2 + 1) = (1/3)(11/6) = 11/18 ≈ 0.611.</p><p>Check: the middle piece is (1/3)(1/3 + 1/2) = 5/18 and 1/9 + 5/18 + 11/18 = 1. ✓</p>",
  "key": "Uniform spacings: E[k-th smallest of n] = (1/n)(1/n + … + 1/(n−k+1))."
 },
 {
  "id": "prob-021",
  "cat": "probability",
  "diff": 1,
  "title": "Birthday problem",
  "tags": [
   "birthday",
   "complement",
   "counting"
  ],
  "prompt": "<p>Assume 365 equally likely birthdays (no leap years) and independent people. What is the smallest number of people needed so that the probability that at least two share a birthday exceeds ½?</p>",
  "answer": {
   "type": "numeric",
   "value": 23,
   "display": "23",
   "tolAbs": 0
  },
  "hints": [
   "Compute the complement: P(all distinct) = (365/365)(364/365)(363/365)…",
   "P(all distinct) ≈ exp(−n(n−1)/730). Solve for ≈ ½."
  ],
  "solution": "<p>P(all n birthdays distinct) = ∏_{k=0}^{n−1} (365 − k)/365.</p><p>Approximation: ≈ exp(−n(n−1)/(2·365)). Setting it to ½ gives n(n−1) ≈ 730 ln 2 ≈ 506, so n ≈ 23.</p><p>Exactly: n = 22 gives P(shared) ≈ 0.476, n = 23 gives ≈ 0.507. Answer: 23.</p>",
  "key": "Number of pairs grows like n²/2, so collisions arrive around √(2·365·ln2) ≈ 23."
 },
 {
  "id": "prob-022",
  "cat": "probability",
  "diff": 3,
  "title": "Rolls until a 6, given all even",
  "tags": [
   "conditioning",
   "geometric",
   "dice",
   "classic"
  ],
  "prompt": "<p>You roll a fair die until the first 6 appears. Given that <b>every</b> roll (including the 6) was an even number, what is the expected number of rolls?</p>",
  "answer": {
   "type": "numeric",
   "value": 1.5,
   "display": "3/2"
  },
  "hints": [
   "The intuitive answer 3 (rolling a die with faces 2, 4, 6) is wrong. Think about which sequences survive the conditioning.",
   "Equivalent: roll until you see any of 1, 3, 5, 6. The stopping time is independent of which of these stopped you."
  ],
  "solution": "<p>Consider rolling until the first roll in {1, 3, 5, 6}. The sequences consistent with the condition are exactly those where this stopping roll is a 6 (all earlier rolls were 2 or 4).</p><p>The stopping time is geometric with p = 4/6, and which of the four faces stops you is independent of when. So conditioning on “stopped by a 6” does not change the distribution of the time.</p><p>E[N | all even] = 1/(4/6) = 3/2.</p><p>Direct check: P(N = n, all even) ∝ (1/3)ⁿ⁻¹, a geometric(2/3) shape, mean 3/2.</p>",
  "key": "Conditioning removes long sequences (more chances to hit an odd); recast as a race among {1,3,5,6}."
 },
 {
  "id": "prob-023",
  "cat": "probability",
  "diff": 3,
  "title": "Pólya's urn",
  "tags": [
   "polya-urn",
   "symmetry",
   "exchangeability"
  ],
  "prompt": "<p>An urn starts with 1 red and 1 blue ball. Repeatedly, you draw a ball at random, then return it together with one extra ball of the same color. After 98 draws the urn contains 100 balls.</p><p>What is the probability that exactly 50 of them are red? Give a fraction.</p>",
  "answer": {
   "type": "numeric",
   "value": 0.010101010101010102,
   "display": "1/99"
  },
  "hints": [
   "Try small cases: after 1 draw, the red count is 1 or 2 with probability ½ each. After 2 draws?",
   "The number of red balls added after n draws is uniform on {0, 1, …, n}."
  ],
  "solution": "<p>Claim: after n draws, the number of red balls added, K, is uniform on {0, …, n}.</p><p>Any specific sequence with k red draws and n − k blue draws has probability [k!·(n−k)!]/(n+1)! (the numerators give 1·2·…·k for red and 1·…·(n−k) for blue, the denominators 2·3·…·(n+1)). Multiplying by C(n, k) sequences gives 1/(n+1).</p><p>Exactly 50 red means K = 49 out of n = 98 draws: P = 1/99.</p>",
  "key": "Pólya urn from (1,1): the number of red additions is uniform on {0,…,n}."
 },
 {
  "id": "prob-024",
  "cat": "probability",
  "diff": 3,
  "title": "Ballot problem",
  "tags": [
   "ballot",
   "random-walk",
   "reflection",
   "counting"
  ],
  "prompt": "<p>In an election, candidate A receives 6 votes and B receives 4. The 10 ballots are counted in uniformly random order.</p><p>What is the probability that A is <b>strictly ahead</b> of B throughout the entire count (after every ballot)?</p>",
  "answer": {
   "type": "numeric",
   "value": 0.2,
   "display": "1/5"
  },
  "hints": [
   "Bertrand's ballot theorem gives a very short formula in a and b.",
   "P = (a − b)/(a + b)."
  ],
  "solution": "<p>Bertrand's ballot theorem: with a &gt; b votes, P(A strictly ahead throughout) = (a − b)/(a + b).</p><p>Proof idea (reflection): a good count must start with an A ballot. Every sequence starting with B must reach a tie; and sequences starting with A that later tie are in bijection with sequences starting with B (swap A↔B before the first tie). So P(good) = P(first is A) − P(first is B) = a/(a+b) − b/(a+b).</p><p>Here (6 − 4)/(6 + 4) = 2/10 = 1/5.</p>",
  "key": "Ballot theorem: P(always ahead) = (a − b)/(a + b), via the reflection principle."
 },
 {
  "id": "prob-025",
  "cat": "probability",
  "diff": 2,
  "title": "Cards before the first ace",
  "tags": [
   "cards",
   "indicators",
   "linearity",
   "symmetry"
  ],
  "prompt": "<p>A standard 52-card deck is shuffled. What is the expected number of cards that appear <b>before</b> the first ace?</p>",
  "answer": {
   "type": "numeric",
   "value": 9.6,
   "display": "48/5 = 9.6"
  },
  "hints": [
   "Use an indicator for each of the 48 non-aces: is it before all four aces?",
   "A given non-ace and the 4 aces are in random relative order; the non-ace is first with probability 1/5."
  ],
  "solution": "<p>For each of the 48 non-ace cards, let Iⱼ = 1 if it comes before all four aces.</p><p>Among that card and the 4 aces, each of the 5 is equally likely to be first, so E[Iⱼ] = 1/5.</p><p>E[# cards before first ace] = 48/5 = 9.6.</p><p>(Intuition: the 4 aces split the 48 other cards into 5 gaps of equal expected size 9.6.)</p>",
  "key": "k special cards split the others into k+1 gaps of equal expected size."
 },
 {
  "id": "prob-026",
  "cat": "probability",
  "diff": 1,
  "title": "Counting HH occurrences",
  "tags": [
   "indicators",
   "linearity",
   "coins"
  ],
  "prompt": "<p>A fair coin is flipped 10 times. What is the expected number of occurrences of HH (overlapping counts: HHH contains 2 occurrences)?</p>",
  "answer": {
   "type": "numeric",
   "value": 2.25,
   "display": "9/4 = 2.25"
  },
  "hints": [
   "There are 9 adjacent positions (1,2), (2,3), …, (9,10).",
   "Each adjacent pair is HH with probability ¼."
  ],
  "solution": "<p>Let Iₖ = 1 if flips k and k+1 are both heads, k = 1..9. E[Iₖ] = ¼.</p><p>By linearity, E[# HH] = 9 · ¼ = 9/4 = 2.25 (overlaps don't matter for expectation).</p>",
  "key": "Expected pattern counts: (number of positions) × P(pattern at a position)."
 },
 {
  "id": "prob-027",
  "cat": "probability",
  "diff": 2,
  "title": "Expected number of runs",
  "tags": [
   "indicators",
   "linearity",
   "coins"
  ],
  "prompt": "<p>A fair coin is flipped 10 times. A <i>run</i> is a maximal block of identical consecutive outcomes (e.g. HHTHH has 3 runs). What is the expected number of runs?</p>",
  "answer": {
   "type": "numeric",
   "value": 5.5,
   "display": "11/2 = 5.5"
  },
  "hints": [
   "Runs = 1 + (number of positions where the outcome changes).",
   "There are 9 adjacent pairs; each differs with probability ½."
  ],
  "solution": "<p>The number of runs equals 1 plus the number of “switches” between consecutive flips.</p><p>Each of the 9 adjacent pairs is a switch with probability ½, so E[switches] = 4.5.</p><p>E[runs] = 1 + 4.5 = 5.5.</p>",
  "key": "Runs = 1 + switches; count switches with indicators."
 },
 {
  "id": "prob-028",
  "cat": "probability",
  "diff": 2,
  "title": "Poker: exactly one pair",
  "tags": [
   "cards",
   "counting",
   "poker"
  ],
  "prompt": "<p>You are dealt 5 cards from a well-shuffled 52-card deck. What is the probability of exactly one pair (two cards of one rank, three other cards of three different ranks, no other match)? Give a decimal to 3 places.</p>",
  "answer": {
   "type": "numeric",
   "value": 0.4225690276110444,
   "display": "1,098,240 / 2,598,960 ≈ 0.4226"
  },
  "hints": [
   "Choose the pair rank and its 2 suits, then choose 3 distinct other ranks and a suit for each.",
   "13·C(4,2) · C(12,3)·4³, divided by C(52,5)."
  ],
  "solution": "<p>Pair: choose the rank (13) and two suits (C(4,2) = 6).</p><p>Kickers: choose 3 different ranks from the other 12 (C(12,3) = 220) and a suit for each (4³ = 64).</p><p>Count = 13 · 6 · 220 · 64 = 1,098,240. Total hands C(52,5) = 2,598,960.</p><p>P ≈ 0.4226. (No flush/straight is possible with a pair, so nothing to subtract.)</p>",
  "key": "Build the hand in stages: rank choices × suit choices, choosing kicker ranks as a set."
 },
 {
  "id": "prob-029",
  "cat": "probability",
  "diff": 2,
  "title": "Third six on the tenth roll",
  "tags": [
   "negative-binomial",
   "dice"
  ],
  "prompt": "<p>A fair die is rolled repeatedly. What is the probability that the <b>third</b> 6 appears exactly on roll 10? Give a decimal to 4 places.</p>",
  "answer": {
   "type": "numeric",
   "value": 0.04651360787227557,
   "display": "C(9,2)(1/6)³(5/6)⁷ ≈ 0.0465"
  },
  "hints": [
   "Roll 10 must be a 6, and exactly two of the first nine must be 6s.",
   "Negative binomial: C(9,2)·(1/6)³·(5/6)⁷."
  ],
  "solution": "<p>The event requires: roll 10 is a 6, and exactly 2 sixes in rolls 1–9.</p><p>P = C(9,2) (1/6)² (5/6)⁷ · (1/6) = 36 · 5⁷ / 6¹⁰ = 2,812,500 / 60,466,176 ≈ 0.0465.</p>",
  "key": "Negative binomial: the last trial is the r-th success; choose positions of the first r−1."
 },
 {
  "id": "prob-030",
  "cat": "probability",
  "diff": 2,
  "title": "Frog on a square",
  "tags": [
   "markov-chain",
   "first-step",
   "random-walk"
  ],
  "prompt": "<p>A frog sits on a vertex of a square. Each second it jumps to one of the two adjacent vertices with equal probability. What is the expected number of jumps until it first reaches the opposite vertex?</p>",
  "answer": {
   "type": "numeric",
   "value": 4.0,
   "display": "4"
  },
  "hints": [
   "By symmetry there are only states “distance 2” (start) and “distance 1” from the target.",
   "E₂ = 1 + E₁ and E₁ = 1 + ½·0 + ½·E₂."
  ],
  "solution": "<p>Let E₂ be the expected time from the start (distance 2) and E₁ from either neighbour (distance 1).</p><p>From distance 2, any jump goes to distance 1: E₂ = 1 + E₁.</p><p>From distance 1: half the time it hits the target, half the time it goes back: E₁ = 1 + ½E₂.</p><p>So E₁ = 1 + ½(1 + E₁) ⇒ E₁ = 3, E₂ = 4.</p>",
  "key": "Use symmetry to collapse states, then first-step equations."
 },
 {
  "id": "prob-031",
  "cat": "probability",
  "diff": 2,
  "title": "First to roll a six",
  "tags": [
   "geometric",
   "first-step",
   "dice",
   "games"
  ],
  "prompt": "<p>Alice and Bob take turns rolling a fair die, Alice first. The first person to roll a 6 wins. What is the probability Alice wins?</p>",
  "answer": {
   "type": "numeric",
   "value": 0.5454545454545454,
   "display": "6/11 ≈ 0.5455"
  },
  "hints": [
   "Let p = P(Alice wins). If neither rolls a 6 in the first round, the game restarts.",
   "p = 1/6 + (5/6)(5/6)p."
  ],
  "solution": "<p>Let p = P(Alice wins). Alice wins immediately with probability 1/6. Otherwise (5/6) Bob rolls; if he also misses (5/6), we are back at the start.</p><p>p = 1/6 + (25/36)p ⇒ (11/36)p = 1/6 ⇒ p = 6/11 ≈ 0.545.</p>",
  "key": "Self-similar games: write p in terms of itself after one full round."
 },
 {
  "id": "prob-032",
  "cat": "probability",
  "diff": 3,
  "title": "Secretary problem, n = 4",
  "tags": [
   "optimal-stopping",
   "secretary",
   "permutations"
  ],
  "prompt": "<p>Four candidates with distinct quality arrive in uniformly random order. After each interview you must accept or reject immediately (no recall); you only see relative ranks so far. You win only if you accept the overall best.</p><p>Using the optimal strategy, what is your probability of winning? Give a fraction.</p>",
  "answer": {
   "type": "numeric",
   "value": 0.4583333333333333,
   "display": "11/24 ≈ 0.4583"
  },
  "hints": [
   "The optimal rule has the form: reject the first r candidates, then accept the first one better than all previous.",
   "With cutoff r, P(win) = (r/n) Σ_{k=r+1}^{n} 1/(k−1). Try r = 1 and r = 2."
  ],
  "solution": "<p>Optimal strategies are cutoff rules: skip the first r, then take the first candidate who beats everyone seen so far.</p><p>The best candidate at position k (prob 1/n) is chosen iff the best among the first k−1 is within the first r: probability r/(k−1). So P(win) = (r/n) Σ_{k=r+1}^{n} 1/(k−1).</p><p>n = 4: r = 1 gives (1/4)(1 + ½ + 1/3) = 11/24; r = 2 gives (2/4)(½ + 1/3) = 5/12 = 10/24; r = 0 gives 1/4.</p><p>Best: r = 1, P = 11/24 ≈ 0.458. (As n → ∞ the optimum tends to 1/e ≈ 0.368 with r ≈ n/e.)</p>",
  "key": "Cutoff rule: P(win) = (r/n)·Σ 1/(k−1); for large n, skip n/e and win with prob 1/e."
 },
 {
  "id": "prob-033",
  "cat": "probability",
  "diff": 3,
  "title": "Uniforms until the sum exceeds 1",
  "tags": [
   "continuous",
   "uniform",
   "expectation",
   "classic"
  ],
  "prompt": "<p>You draw independent Uniform(0, 1) numbers until their running sum exceeds 1. What is the expected number of draws? Give a decimal to 3 places.</p>",
  "answer": {
   "type": "numeric",
   "value": 2.718281828459045,
   "display": "e ≈ 2.718"
  },
  "hints": [
   "Use E[N] = Σ_{n≥0} P(N &gt; n).",
   "P(N &gt; n) = P(U₁ + … + Uₙ ≤ 1) = 1/n! (volume of a simplex)."
  ],
  "solution": "<p>N &gt; n exactly when the first n draws sum to at most 1. The region {u₁ + … + uₙ ≤ 1} in the unit cube is a simplex of volume 1/n!.</p><p>E[N] = Σ_{n≥0} P(N &gt; n) = Σ_{n≥0} 1/n! = e ≈ 2.718.</p>",
  "key": "Tail-sum formula plus the simplex volume 1/n!."
 },
 {
  "id": "prob-034",
  "cat": "probability",
  "diff": 2,
  "title": "Triangle containing the center",
  "tags": [
   "geometric-probability",
   "symmetry",
   "continuous"
  ],
  "prompt": "<p>Three points are chosen independently and uniformly on a circle. What is the probability that the triangle they form contains the center of the circle?</p>",
  "answer": {
   "type": "numeric",
   "value": 0.25,
   "display": "1/4"
  },
  "hints": [
   "The triangle misses the center iff all three points lie in some semicircle.",
   "P(n points lie in a semicircle) = n/2ⁿ⁻¹."
  ],
  "solution": "<p>The triangle contains the center iff the three points are <i>not</i> all in one semicircle.</p><p>For each point i, the event “the other two lie in the semicircle starting at i going clockwise” has probability ¼, and these 3 events are disjoint, covering exactly the “in a semicircle” case. So P(semicircle) = 3/4.</p><p>P(contains center) = 1 − 3/4 = 1/4.</p>",
  "key": "Contains center ⇔ not all in a semicircle; P(n points in a semicircle) = n/2ⁿ⁻¹."
 },
 {
  "id": "prob-035",
  "cat": "probability",
  "diff": 2,
  "title": "Distinct faces in six rolls",
  "tags": [
   "indicators",
   "linearity",
   "dice"
  ],
  "prompt": "<p>A fair die is rolled 6 times. What is the expected number of distinct faces that appear? Give a decimal to 3 places.</p>",
  "answer": {
   "type": "numeric",
   "value": 3.9906121399176953,
   "display": "6(1 − (5/6)⁶) ≈ 3.991"
  },
  "hints": [
   "Use one indicator per face: does face j appear at least once?",
   "P(face j appears) = 1 − (5/6)⁶."
  ],
  "solution": "<p>For each face j = 1..6, let Iⱼ = 1 if j appears at least once. P(Iⱼ = 1) = 1 − (5/6)⁶ ≈ 0.6651.</p><p>E[# distinct] = 6(1 − (5/6)⁶) ≈ 3.991.</p><p>Note: far fewer than 6 — on average about 2 faces are missing.</p>",
  "key": "Count “things that appear” with one indicator per thing."
 },
 {
  "id": "prob-036",
  "cat": "probability",
  "diff": 3,
  "title": "Penney's game: HHT vs HTH",
  "tags": [
   "markov-chain",
   "coins",
   "penney",
   "first-step"
  ],
  "prompt": "<p>A fair coin is flipped repeatedly until either the pattern HHT or the pattern HTH appears (as consecutive flips). Which pattern is more likely to appear first?</p>",
  "answer": {
   "type": "choice",
   "options": [
    "HHT",
    "HTH",
    "Equally likely"
   ],
   "correct": 0,
   "display": "HHT, with probability 2/3"
  },
  "hints": [
   "Both patterns start with H. What happens after you get HH?",
   "Once you have HH, HHT is guaranteed to come before HTH (you can never lose the HH suffix until a T arrives)."
  ],
  "solution": "<p>Both patterns need a starting H. Track the states H, HH, HT.</p><p>From HH: further H's keep you at HH, and the first T completes HHT. So from HH, HHT wins with probability 1.</p><p>From HT: H completes HTH; T kills all progress (back to start).</p><p>Let a = P(HHT wins from state H). From H: next H → HH (win), next T → HT. From HT: ½ lose, ½ back to start, which is equivalent to waiting for the next H, i.e. a again. So a = ½ + ½ · ½ · a ⇒ a = 2/3.</p><p>HHT appears first with probability 2/3 — even though both patterns have the same probability at any given position (and HTH actually has a longer mean waiting time, 10 vs 8).</p>",
  "key": "Self-overlap matters: HH progress is never wasted for HHT, but HTH's progress can be destroyed."
 },
 {
  "id": "stat-001",
  "cat": "statistics",
  "diff": 1,
  "title": "Unbiased sample variance",
  "tags": [
   "sample-variance",
   "estimators",
   "bessel-correction"
  ],
  "prompt": "<p>A sample of 8 observations is: 2, 4, 4, 4, 5, 5, 7, 9.</p><p>Compute the <b>unbiased</b> sample variance s². Give a fraction or a decimal (3 decimals).</p>",
  "answer": {
   "type": "numeric",
   "value": 4.571428571428571,
   "display": "32/7 ≈ 4.571"
  },
  "hints": [
   "First compute x̄, then the sum of squared deviations ∑(xᵢ − x̄)².",
   "Unbiased means divide by n − 1, not n."
  ],
  "solution": "<p>Mean: x̄ = (2+4+4+4+5+5+7+9)/8 = 40/8 = 5.</p><p>Squared deviations: 9, 1, 1, 1, 0, 0, 4, 16 → sum = 32.</p><p>Divide by n − 1 = 7: s² = 32/7 ≈ 4.571. (Dividing by n would give 4, the biased “population-style” estimate.)</p><p><b>Answer: 32/7 ≈ 4.571</b></p>",
  "key": "Unbiased variance divides the sum of squared deviations by n − 1."
 },
 {
  "id": "stat-002",
  "cat": "statistics",
  "diff": 2,
  "title": "Why n − 1?",
  "tags": [
   "sample-variance",
   "bias",
   "estimators"
  ],
  "prompt": "<p>X₁, …, X₅ are i.i.d. with variance σ² = 10. Consider the “naive” estimator</p><p>σ̂² = (1/n) ∑(Xᵢ − x̄)²  with n = 5.</p><p>What is E[σ̂²]?</p>",
  "answer": {
   "type": "numeric",
   "value": 8.0,
   "display": "8"
  },
  "hints": [
   "Show E[∑(Xᵢ − x̄)²] = (n − 1)σ².",
   "Using x̄ instead of the true μ “uses up” one degree of freedom, because x̄ is the value that minimizes the sum of squares."
  ],
  "solution": "<p>Write ∑(Xᵢ − x̄)² = ∑(Xᵢ − μ)² − n(x̄ − μ)².</p><p>Take expectations: E[∑(Xᵢ − μ)²] = nσ² and E[n(x̄ − μ)²] = n·Var(x̄) = n·σ²/n = σ².</p><p>So E[∑(Xᵢ − x̄)²] = (n − 1)σ², and E[σ̂²] = (n − 1)σ²/n = (4/5)·10 = 8.</p><p>The naive estimator is biased downward by the factor (n − 1)/n; dividing by n − 1 instead fixes it (Bessel's correction).</p><p><b>Answer: 8</b></p>",
  "key": "∑(Xᵢ − x̄)² has expectation (n − 1)σ², because x̄ is fitted from the same data."
 },
 {
  "id": "stat-003",
  "cat": "statistics",
  "diff": 3,
  "title": "Estimating θ for Uniform(0, θ)",
  "tags": [
   "mse",
   "bias-variance",
   "order-statistics",
   "uniform"
  ],
  "prompt": "<p>X₁, …, X₁₀ are i.i.d. Uniform(0, θ). Two unbiased estimators of θ:</p><ul><li>A = 2x̄ (method of moments)</li><li>B = ((n+1)/n)·max(Xᵢ)</li></ul><p>Compute the ratio MSE(A) / MSE(B) for n = 10.</p>",
  "answer": {
   "type": "numeric",
   "value": 4.0,
   "display": "4"
  },
  "hints": [
   "Both are unbiased, so MSE = variance. Var(Xᵢ) = θ²/12.",
   "For M = max, E[M] = nθ/(n+1) and E[M²] = nθ²/(n+2)."
  ],
  "solution": "<p>A: Var(2x̄) = 4·(θ²/12)/n = θ²/(3n) = θ²/30.</p><p>M = max has density n·mⁿ⁻¹/θⁿ on [0, θ], giving E[M] = nθ/(n+1), E[M²] = nθ²/(n+2), so Var(M) = nθ²/((n+1)²(n+2)).</p><p>B: Var(((n+1)/n)M) = θ²/(n(n+2)) = θ²/120.</p><p>Ratio = (1/30)/(1/120) = 4. In general the ratio is (n+2)/3: the max-based estimator's variance shrinks like 1/n² instead of 1/n.</p><p><b>Answer: 4</b></p>",
  "key": "When the support depends on θ, the sample max is far more informative than the mean (variance ~1/n² vs 1/n)."
 },
 {
  "id": "stat-004",
  "cat": "statistics",
  "diff": 2,
  "title": "MLE of an exponential rate",
  "tags": [
   "mle",
   "exponential"
  ],
  "prompt": "<p>Waiting times (in minutes) between trades are modelled as i.i.d. Exponential(λ) with density λe^(−λx). You observe 2, 3, 5, 10.</p><p>What is the maximum-likelihood estimate of λ (per minute)?</p>",
  "answer": {
   "type": "numeric",
   "value": 0.2,
   "display": "0.2"
  },
  "hints": [
   "Write the log-likelihood: ℓ(λ) = n·ln λ − λ∑xᵢ.",
   "Set dℓ/dλ = 0."
  ],
  "solution": "<p>ℓ(λ) = n ln λ − λ∑xᵢ, so ℓ′(λ) = n/λ − ∑xᵢ = 0.</p><p>λ̂ = n/∑xᵢ = 1/x̄ = 4/20 = 0.2 per minute (mean wait 5 minutes).</p><p>Note: 1/x̄ is the MLE but it is biased upward (E[λ̂] = nλ/(n−1)), a nice example that MLEs need not be unbiased.</p><p><b>Answer: 0.2</b></p>",
  "key": "Exponential MLE: λ̂ = 1/x̄."
 },
 {
  "id": "stat-005",
  "cat": "statistics",
  "diff": 2,
  "title": "Bias of the uniform MLE",
  "tags": [
   "mle",
   "bias",
   "uniform",
   "order-statistics"
  ],
  "prompt": "<p>X₁, …, X₄ are i.i.d. Uniform(0, θ) with true θ = 10. The MLE of θ is θ̂ = max(Xᵢ).</p><p>What is E[θ̂]?</p>",
  "answer": {
   "type": "numeric",
   "value": 8.0,
   "display": "8"
  },
  "hints": [
   "P(max ≤ m) = (m/θ)ⁿ.",
   "E[max] = nθ/(n+1): n points split [0, θ] into n+1 gaps of equal expected length."
  ],
  "solution": "<p>The likelihood θ⁻ⁿ (for θ ≥ all xᵢ) is decreasing in θ, so it is maximized at the smallest admissible value: θ̂ = max(Xᵢ).</p><p>CDF of the max: (m/θ)ⁿ, density n mⁿ⁻¹/θⁿ, so E[max] = nθ/(n+1).</p><p>With n = 4, θ = 10: E[θ̂] = 4·10/5 = 8. The MLE underestimates θ by θ/(n+1); multiplying by (n+1)/n removes the bias.</p><p><b>Answer: 8</b></p>",
  "key": "The max of n uniforms sits on average at n/(n+1) of the range, so the MLE is biased low."
 },
 {
  "id": "stat-006",
  "cat": "statistics",
  "diff": 1,
  "title": "Standard error of a proportion",
  "tags": [
   "mle",
   "bernoulli",
   "standard-error"
  ],
  "prompt": "<p>A strategy wins 7 of 20 independent trades. Estimate the win probability p by MLE, then give the estimated standard error of p̂.</p><p>Report the standard error to 3 decimals.</p>",
  "answer": {
   "type": "numeric",
   "value": 0.1066536450385077,
   "display": "≈ 0.107",
   "tolAbs": 0.001
  },
  "hints": [
   "The Bernoulli MLE is the sample proportion.",
   "Var(p̂) = p(1 − p)/n; plug in p̂."
  ],
  "solution": "<p>MLE: p̂ = 7/20 = 0.35.</p><p>SE(p̂) = √(p̂(1 − p̂)/n) = √(0.35·0.65/20) = √0.011375 ≈ 0.107.</p><p>That is huge relative to 0.35: twenty trades tell you very little about a strategy's edge.</p><p><b>Answer: ≈ 0.107</b></p>",
  "key": "SE of a proportion = √(p̂(1 − p̂)/n): it shrinks only like 1/√n."
 },
 {
  "id": "stat-007",
  "cat": "statistics",
  "diff": 2,
  "title": "Sum of 100 dice",
  "tags": [
   "clt",
   "normal-approximation",
   "dice",
   "continuity-correction"
  ],
  "prompt": "<p>You roll 100 fair dice. Using the normal approximation (with continuity correction), estimate P(330 ≤ sum ≤ 370).</p><p>Answer as a decimal to 2 decimals.</p>",
  "answer": {
   "type": "numeric",
   "value": 0.7699993135349721,
   "display": "≈ 0.77",
   "tolAbs": 0.01
  },
  "hints": [
   "One die: mean 3.5, variance 35/12.",
   "Sum: mean 350, variance 100·35/12 ≈ 291.7, sd ≈ 17.08. Use 329.5 and 370.5."
  ],
  "solution": "<p>One die has mean 3.5 and variance E[X²] − 3.5² = 91/6 − 49/4 = 35/12.</p><p>Sum S: mean 350, variance 3500/12 ≈ 291.67, sd ≈ 17.08.</p><p>With continuity correction: P(329.5 ≤ S ≤ 370.5) = P(|Z| ≤ 20.5/17.08) = P(|Z| ≤ 1.20) = 2Φ(1.20) − 1 ≈ 0.77.</p><p>(The exact value by convolution is 0.7697 — the CLT is excellent here.)</p><p><b>Answer: ≈ 0.77</b></p>",
  "key": "Sum of n i.i.d. → Normal(nμ, nσ²); use ±0.5 for integer-valued sums."
 },
 {
  "id": "stat-008",
  "cat": "statistics",
  "diff": 2,
  "title": "60 or more heads",
  "tags": [
   "clt",
   "binomial",
   "continuity-correction"
  ],
  "prompt": "<p>A fair coin is flipped 100 times. Using the normal approximation with continuity correction, estimate P(at least 60 heads).</p><p>Answer as a decimal (3 decimals).</p>",
  "answer": {
   "type": "numeric",
   "value": 0.028716559816001852,
   "display": "≈ 0.0287",
   "tolAbs": 0.003
  },
  "hints": [
   "Mean 50, sd √(100·¼) = 5.",
   "“At least 60” becomes X ≥ 59.5 on the continuous scale."
  ],
  "solution": "<p>X ~ Bin(100, ½): mean 50, sd 5.</p><p>P(X ≥ 60) ≈ P(Z ≥ (59.5 − 50)/5) = P(Z ≥ 1.9) ≈ 0.0287.</p><p>Without the correction you'd use z = 2 and get 0.0228; the exact binomial tail is 0.0284, so the correction matters.</p><p><b>Answer: ≈ 0.029</b></p>",
  "key": "Continuity correction: P(X ≥ k) ≈ P(Y ≥ k − 0.5)."
 },
 {
  "id": "stat-009",
  "cat": "statistics",
  "diff": 1,
  "title": "Margin of error",
  "tags": [
   "confidence-interval",
   "proportion",
   "margin-of-error"
  ],
  "prompt": "<p>A poll of n = 400 people finds p̂ = 0.50. What is the margin of error of the 95% confidence interval for p (use z = 1.96)?</p><p>Answer as a decimal or a percentage.</p>",
  "answer": {
   "type": "numeric",
   "value": 0.049,
   "display": "0.049 (4.9%)",
   "tolAbs": 0.001
  },
  "hints": [
   "SE = √(p̂(1 − p̂)/n).",
   "Margin = 1.96 × SE."
  ],
  "solution": "<p>SE = √(0.25/400) = 0.5/20 = 0.025.</p><p>Margin = 1.96 × 0.025 = 0.049, i.e. the interval is 0.50 ± 4.9 percentage points.</p><p>Rule of thumb: at p ≈ ½ the 95% margin is about 1/√n.</p><p><b>Answer: 0.049</b></p>",
  "key": "95% margin ≈ 1.96·√(p(1−p)/n) ≈ 1/√n near p = ½."
 },
 {
  "id": "stat-010",
  "cat": "statistics",
  "diff": 2,
  "title": "Sample size for ±3%",
  "tags": [
   "confidence-interval",
   "sample-size",
   "proportion"
  ],
  "prompt": "<p>You want a 95% confidence interval for a proportion with margin of error at most 3 percentage points, without any prior knowledge of p. What is the minimum sample size (use z = 1.96)?</p>",
  "answer": {
   "type": "numeric",
   "value": 1068,
   "display": "1068",
   "range": [
    1067,
    1068
   ]
  },
  "hints": [
   "Worst case is p = ½, which maximizes p(1 − p).",
   "Solve 1.96·√(0.25/n) ≤ 0.03 for n and round up."
  ],
  "solution": "<p>Need 1.96·√(p(1 − p)/n) ≤ 0.03. Without prior knowledge, use p(1 − p) ≤ ¼.</p><p>n ≥ (1.96/0.03)²·0.25 = 1067.1 → round up to 1068.</p><p>Note the inverse-square law: halving the margin to 1.5% would need four times the sample.</p><p><b>Answer: 1068</b></p>",
  "key": "n = z²·p(1−p)/E², worst case p = ½; precision costs quadratically."
 },
 {
  "id": "stat-011",
  "cat": "statistics",
  "diff": 1,
  "title": "What a p-value means",
  "tags": [
   "p-value",
   "hypothesis-testing",
   "conceptual"
  ],
  "prompt": "<p>A backtest yields p = 0.03 for H₀: “the strategy's mean return is zero”. Which statement is correct?</p>",
  "answer": {
   "type": "choice",
   "options": [
    "There is a 3% probability that H₀ is true.",
    "If H₀ were true, data at least this extreme would occur about 3% of the time.",
    "There is a 97% probability the strategy is profitable.",
    "The effect size is large."
   ],
   "correct": 1,
   "display": "If H₀ were true, data at least this extreme would occur ~3% of the time."
  },
  "hints": [
   "A p-value is computed assuming H₀ is true.",
   "It is P(data | H₀), not P(H₀ | data)."
  ],
  "solution": "<p>The p-value is P(test statistic at least as extreme as observed | H₀).</p><p>It is not P(H₀ | data) — that would require a prior (Bayes). It also says nothing directly about effect size: a tiny effect with huge n can give a small p.</p><p><b>Answer: option 2</b></p>",
  "key": "p-value = P(this extreme or more | H₀), never P(H₀ | data)."
 },
 {
  "id": "stat-012",
  "cat": "statistics",
  "diff": 2,
  "title": "Twenty backtests",
  "tags": [
   "multiple-testing",
   "type-i-error",
   "p-hacking"
  ],
  "prompt": "<p>You test 20 independent strategies, all of which truly have zero edge, each at significance level α = 0.05. What is the probability that at least one looks “significant”?</p><p>Answer as a decimal (3 decimals).</p>",
  "answer": {
   "type": "numeric",
   "value": 0.6415140775914581,
   "display": "1 − 0.95²⁰ ≈ 0.642"
  },
  "hints": [
   "Use the complement: no false positive at all.",
   "P(none) = 0.95²⁰."
  ],
  "solution": "<p>Each null test falsely rejects with probability 0.05, independently.</p><p>P(at least one) = 1 − 0.95²⁰ ≈ 1 − 0.358 = 0.642.</p><p>This is why you correct for multiple testing (e.g. Bonferroni: use α/20 = 0.0025 per test) — or hold out data.</p><p><b>Answer: ≈ 0.642</b></p>",
  "key": "Family-wise error grows as 1 − (1 − α)ᵐ; with many tries, “significance” is cheap."
 },
 {
  "id": "stat-013",
  "cat": "statistics",
  "diff": 3,
  "title": "Power of a z-test",
  "tags": [
   "power",
   "type-ii-error",
   "hypothesis-testing",
   "z-test"
  ],
  "prompt": "<p>Observations are i.i.d. Normal(μ, 1). You test H₀: μ = 0 against H₁: μ &gt; 0 with a one-sided z-test at α = 0.05 using n = 16 observations.</p><p>If in fact μ = 0.5, what is the power of the test? Answer to 2 decimals.</p>",
  "answer": {
   "type": "numeric",
   "value": 0.6387600313123355,
   "display": "≈ 0.64",
   "tolAbs": 0.01
  },
  "hints": [
   "Reject when x̄ > 1.645·σ/√n = 1.645/4.",
   "Under μ = 0.5, x̄ ~ N(0.5, 1/16). Standardize the cutoff."
  ],
  "solution": "<p>SE = 1/√16 = 0.25. Reject H₀ when x̄ &gt; 1.645 × 0.25 = 0.411.</p><p>Under μ = 0.5: P(x̄ &gt; 0.411) = P(Z &gt; (0.411 − 0.5)/0.25) = P(Z &gt; −0.355) = Φ(0.355) ≈ 0.64.</p><p>Equivalently power = Φ(μ√n/σ − z_α) = Φ(2 − 1.645). Type II error probability β ≈ 0.36.</p><p><b>Answer: ≈ 0.64</b></p>",
  "key": "Power = Φ(effect·√n/σ − z_α): it grows with effect size and √n."
 },
 {
  "id": "stat-014",
  "cat": "statistics",
  "diff": 1,
  "title": "R² from correlation",
  "tags": [
   "regression",
   "r-squared",
   "correlation"
  ],
  "prompt": "<p>The sample correlation between X and Y is −0.6. In a simple linear regression of Y on X (with intercept), what fraction of the variance of Y is explained?</p>",
  "answer": {
   "type": "numeric",
   "value": 0.36,
   "display": "0.36"
  },
  "hints": [
   "For simple regression R² equals the squared correlation."
  ],
  "solution": "<p>In a one-regressor OLS with intercept, R² = ρ² (the sign of ρ only sets the sign of the slope).</p><p>R² = (−0.6)² = 0.36: 36% of Var(Y) is explained, 64% is residual.</p><p><b>Answer: 0.36</b></p>",
  "key": "Simple regression: R² = ρ²."
 },
 {
  "id": "stat-015",
  "cat": "statistics",
  "diff": 2,
  "title": "Correlation of X with X + Y",
  "tags": [
   "correlation",
   "covariance",
   "variance-of-sum"
  ],
  "prompt": "<p>X and Y are independent with the same variance. What is Corr(X, X + Y)? Give an exact value or 4 decimals.</p>",
  "answer": {
   "type": "numeric",
   "value": 0.7071067811865475,
   "display": "1/√2 ≈ 0.7071"
  },
  "hints": [
   "Cov(X, X + Y) = Var(X) + Cov(X, Y).",
   "Var(X + Y) = 2σ²."
  ],
  "solution": "<p>Cov(X, X + Y) = Var(X) + Cov(X, Y) = σ² + 0 = σ².</p><p>Var(X + Y) = 2σ², so sd(X + Y) = σ√2.</p><p>Corr = σ²/(σ · σ√2) = 1/√2 ≈ 0.7071. (In general with n i.i.d. terms, Corr(X₁, ∑Xᵢ) = 1/√n.)</p><p><b>Answer: 1/√2 ≈ 0.7071</b></p>",
  "key": "Covariance is bilinear: Cov(X, X+Y) = Var X + Cov(X,Y)."
 },
 {
  "id": "stat-016",
  "cat": "statistics",
  "diff": 3,
  "title": "Two regression slopes",
  "tags": [
   "regression",
   "correlation",
   "slope"
  ],
  "prompt": "<p>Regressing Y on X gives slope 0.8. Regressing X on Y (same data) gives slope 0.45. What is the correlation between X and Y?</p>",
  "answer": {
   "type": "numeric",
   "value": 0.6,
   "display": "0.6"
  },
  "hints": [
   "β(Y on X) = ρ·σ_Y/σ_X and β(X on Y) = ρ·σ_X/σ_Y.",
   "Multiply the two slopes."
  ],
  "solution": "<p>β_YX = ρσ_Y/σ_X and β_XY = ρσ_X/σ_Y.</p><p>Product: β_YX·β_XY = ρ² = 0.8 × 0.45 = 0.36, so |ρ| = 0.6; both slopes are positive, so ρ = +0.6.</p><p>Note the X-on-Y slope is <i>not</i> 1/0.8 = 1.25: swapping axes gives 1/β only when |ρ| = 1. Both regressions shrink toward zero (regression to the mean).</p><p><b>Answer: 0.6</b></p>",
  "key": "The two OLS slopes multiply to ρ²; swapping axes does not invert the slope."
 },
 {
  "id": "stat-017",
  "cat": "statistics",
  "diff": 2,
  "title": "Diversifying correlated assets",
  "tags": [
   "covariance",
   "portfolio",
   "variance-of-mean",
   "correlation"
  ],
  "prompt": "<p>You hold an equal-weighted portfolio of 10 assets. Each has volatility 20% and every pair has correlation 0.3. What is the portfolio volatility?</p><p>Answer as a decimal (e.g. 0.15) or percentage, 3 significant figures.</p>",
  "answer": {
   "type": "numeric",
   "value": 0.1216552506059644,
   "display": "≈ 0.122 (12.2%)"
  },
  "hints": [
   "Var(average) = (1/n²)[nσ² + n(n−1)ρσ²].",
   "Simplify to σ²(ρ + (1 − ρ)/n)."
  ],
  "solution": "<p>Var(x̄) = (1/n²)[n σ² + n(n − 1) ρ σ²] = σ²[ρ + (1 − ρ)/n].</p><p>= 0.04 × (0.3 + 0.07) = 0.0148 → volatility √0.0148 ≈ 0.1217.</p><p>As n → ∞ the variance floors at ρσ², i.e. volatility σ√ρ ≈ 10.95%: correlated risk cannot be diversified away.</p><p><b>Answer: ≈ 12.2%</b></p>",
  "key": "Var of an equal-weight average = σ²(ρ + (1−ρ)/n), floored at ρσ²."
 },
 {
  "id": "stat-018",
  "cat": "statistics",
  "diff": 3,
  "title": "Minimum-variance portfolio",
  "tags": [
   "portfolio",
   "covariance",
   "optimization"
  ],
  "prompt": "<p>Asset 1 has volatility 10%, asset 2 has volatility 20%, and their correlation is 0.25. You must be fully invested (weights sum to 1). What weight in asset 1 minimizes portfolio variance?</p>",
  "answer": {
   "type": "numeric",
   "value": 0.875,
   "display": "0.875 (87.5%)"
  },
  "hints": [
   "Var = w²σ₁² + (1−w)²σ₂² + 2w(1−w)ρσ₁σ₂; differentiate in w.",
   "w* = (σ₂² − ρσ₁σ₂)/(σ₁² + σ₂² − 2ρσ₁σ₂)."
  ],
  "solution": "<p>Set the derivative of the variance to zero to get w* = (σ₂² − ρσ₁σ₂)/(σ₁² + σ₂² − 2ρσ₁σ₂).</p><p>σ₁² = 0.01, σ₂² = 0.04, ρσ₁σ₂ = 0.25 × 0.02 = 0.005.</p><p>w* = (0.04 − 0.005)/(0.01 + 0.04 − 0.01) = 0.035/0.04 = 0.875.</p><p>Even the riskier asset gets weight 12.5% because the imperfect correlation diversifies. (At ρ = 0.5 = σ₁/σ₂ the optimum hits w = 1.)</p><p><b>Answer: 0.875</b></p>",
  "key": "Min-variance weight: w₁ = (σ₂² − σ₁₂)/(σ₁² + σ₂² − 2σ₁₂)."
 },
 {
  "id": "stat-019",
  "cat": "statistics",
  "diff": 1,
  "title": "The hedge fund database",
  "tags": [
   "survivorship-bias",
   "sampling",
   "conceptual"
  ],
  "prompt": "<p>A database lists the 10-year track records of all hedge funds <i>currently operating</i>. Their average annual return is 11%. Why is this likely an overestimate of what a fund chosen 10 years ago would have earned?</p>",
  "answer": {
   "type": "choice",
   "options": [
    "Look-ahead bias in the benchmark",
    "Survivorship bias: funds that died (mostly poor performers) are missing",
    "Small sample size",
    "Returns are not normally distributed"
   ],
   "correct": 1,
   "display": "Survivorship bias"
  },
  "hints": [
   "Which funds can never appear in this database?"
  ],
  "solution": "<p>Only funds that survived 10 years are included. Funds close mostly after poor returns, so the sample is selected on the outcome.</p><p>This is survivorship bias; the fix is to use a database that retains dead funds. (Similar traps: backtesting on today's index constituents.)</p><p><b>Answer: survivorship bias</b></p>",
  "key": "Selecting a sample on its outcome biases the statistic — always ask who is missing."
 },
 {
  "id": "stat-020",
  "cat": "statistics",
  "diff": 1,
  "title": "Variance of a combination",
  "tags": [
   "variance-of-sum",
   "covariance"
  ],
  "prompt": "<p>Var(X) = 4, Var(Y) = 9 and Corr(X, Y) = 0.5. Compute Var(2X − Y).</p>",
  "answer": {
   "type": "numeric",
   "value": 13.0,
   "display": "13"
  },
  "hints": [
   "Cov(X, Y) = ρσ_Xσ_Y = 0.5·2·3.",
   "Var(aX + bY) = a²Var X + b²Var Y + 2ab Cov(X, Y)."
  ],
  "solution": "<p>Cov(X, Y) = 0.5 × 2 × 3 = 3.</p><p>Var(2X − Y) = 4·4 + 1·9 + 2·2·(−1)·3 = 16 + 9 − 12 = 13.</p><p><b>Answer: 13</b></p>",
  "key": "Var(aX + bY) = a²σ_X² + b²σ_Y² + 2ab·Cov(X,Y)."
 },
 {
  "id": "ev-001",
  "cat": "ev",
  "diff": 1,
  "title": "Fair price of a die roll",
  "tags": [
   "fair-price",
   "dice"
  ],
  "prompt": "<p>I roll a fair six-sided die and pay you, in dollars, the number that comes up. What is the fair price for this game (the price at which neither of us has an edge)?</p><p>Give a decimal, in dollars.</p>",
  "answer": {
   "type": "numeric",
   "value": 3.5,
   "display": "$3.50"
  },
  "hints": [
   "The fair price of a game is its expected payoff.",
   "Average the six equally likely faces."
  ],
  "solution": "<p>The fair price equals the expected payoff, since with that price the expected profit of each side is zero.</p><p>E[X] = (1 + 2 + 3 + 4 + 5 + 6)/6 = 21/6 = 3.5.</p><p><b>Answer: $3.50.</b></p>",
  "key": "Fair price = expected payoff; for a die that is 3.5."
 },
 {
  "id": "ev-002",
  "cat": "ev",
  "diff": 2,
  "title": "Die roll with one re-roll",
  "tags": [
   "fair-price",
   "re-roll",
   "optimal-stopping",
   "dice"
  ],
  "prompt": "<p>You roll a fair die and are paid its face value in dollars. After seeing the first roll you may, once, choose to re-roll; if you do, you must accept the second roll. Playing optimally, what is the game worth?</p><p>Give a fraction or decimal, in dollars.</p>",
  "answer": {
   "type": "numeric",
   "value": 4.25,
   "display": "17/4 = $4.25"
  },
  "hints": [
   "Work backwards: if you re-roll, what do you expect to get?",
   "Keep the first roll only if it beats 3.5."
  ],
  "solution": "<p>If you re-roll, you get an expected 3.5. So keep the first roll exactly when it is greater than 3.5, i.e. on 4, 5 or 6.</p><p>Value = P(4,5,6)·E[X | X ≥ 4] + P(1,2,3)·3.5 = (1/2)(5) + (1/2)(3.5) = 4.25.</p><p><b>Answer: 17/4 = $4.25.</b></p>",
  "key": "Backward induction: keep a roll only if it beats the value of continuing."
 },
 {
  "id": "ev-003",
  "cat": "ev",
  "diff": 2,
  "title": "Die roll with two re-rolls",
  "tags": [
   "fair-price",
   "re-roll",
   "optimal-stopping",
   "dice"
  ],
  "prompt": "<p>Same game as before, but now you may re-roll up to <b>two</b> times (you are paid the last roll you keep). With optimal play, what is the game worth?</p><p>Give a fraction or decimal, in dollars.</p>",
  "answer": {
   "type": "numeric",
   "value": 4.666666666666667,
   "display": "14/3 ≈ $4.667"
  },
  "hints": [
   "With one re-roll left, the game is worth 4.25.",
   "On the first roll, keep it only if it beats 4.25."
  ],
  "solution": "<p>With one re-roll remaining the continuation value is 4.25 (keep 4, 5, 6; otherwise re-roll for 3.5).</p><p>On the first roll, keep only 5 or 6 (they beat 4.25); otherwise continue and get 4.25 in expectation.</p><p>Value = (5 + 6)/6 + (4/6)(4.25) = 11/6 + 17/6 = 28/6 = 14/3.</p><p><b>Answer: 14/3 ≈ $4.67.</b></p>",
  "key": "Each extra option raises the keep threshold; values are computed from the last stage backwards."
 },
 {
  "id": "ev-004",
  "cat": "ev",
  "diff": 1,
  "title": "Paid the max of two dice",
  "tags": [
   "fair-price",
   "dice",
   "order-statistics"
  ],
  "prompt": "<p>Two fair dice are rolled and you are paid the larger of the two numbers, in dollars. What is the fair price?</p><p>Give a fraction or decimal.</p>",
  "answer": {
   "type": "numeric",
   "value": 4.472222222222222,
   "display": "161/36 ≈ $4.472"
  },
  "hints": [
   "P(max ≤ k) = (k/6)².",
   "So P(max = k) = (k² − (k−1)²)/36 = (2k − 1)/36."
  ],
  "solution": "<p>P(max ≤ k) = (k/6)², so P(max = k) = (2k − 1)/36 for k = 1..6.</p><p>E[max] = Σ k(2k − 1)/36 = (1 + 6 + 15 + 28 + 45 + 66)/36 = 161/36.</p><p><b>Answer: 161/36 ≈ $4.47.</b></p>",
  "key": "For a maximum, use the CDF: P(max ≤ k) is a product of individual CDFs."
 },
 {
  "id": "ev-005",
  "cat": "ev",
  "diff": 1,
  "title": "Paid the product of two dice",
  "tags": [
   "fair-price",
   "dice",
   "independence"
  ],
  "prompt": "<p>Two fair dice are rolled independently and you are paid the <i>product</i> of the faces in dollars. What is the fair price?</p><p>Give a decimal.</p>",
  "answer": {
   "type": "numeric",
   "value": 12.25,
   "display": "$12.25"
  },
  "hints": [
   "For independent variables, E[XY] = E[X]·E[Y]."
  ],
  "solution": "<p>The dice are independent, so E[XY] = E[X]E[Y] = 3.5 × 3.5 = 12.25.</p><p><b>Answer: $12.25.</b></p>",
  "key": "Independence lets the expectation of a product factor."
 },
 {
  "id": "ev-006",
  "cat": "ev",
  "diff": 1,
  "title": "A call option on a die",
  "tags": [
   "fair-price",
   "dice",
   "options"
  ],
  "prompt": "<p>A fair die is rolled. You receive max(X − 3, 0) dollars, where X is the face shown (a 'call struck at 3'). What is the fair price of this contract?</p>",
  "answer": {
   "type": "numeric",
   "value": 1.0,
   "display": "$1"
  },
  "hints": [
   "Payoffs for faces 1..6 are 0, 0, 0, 1, 2, 3."
  ],
  "solution": "<p>The payoffs are 0, 0, 0, 1, 2, 3 for faces 1 to 6.</p><p>E = (0 + 0 + 0 + 1 + 2 + 3)/6 = 6/6 = 1.</p><p>Note this is more than max(E[X] − 3, 0) = 0.5: convex payoffs are worth more than the payoff at the mean (Jensen).</p><p><b>Answer: $1.</b></p>",
  "key": "Price an option as the expected payoff; convexity makes it worth more than the payoff at the mean."
 },
 {
  "id": "ev-007",
  "cat": "ev",
  "diff": 2,
  "title": "St. Petersburg paradox",
  "tags": [
   "fair-price",
   "coins",
   "utility",
   "paradox"
  ],
  "prompt": "<p>A fair coin is flipped until the first tail. If the first tail occurs on flip n, you are paid 2<sup>n</sup> dollars. The expected payoff is infinite, yet almost nobody would pay even $50 to play. Which is the <b>best</b> explanation?</p>",
  "answer": {
   "type": "choice",
   "options": [
    "The expected payoff is actually finite, about $4",
    "The infinite EV comes from astronomically unlikely, unpayable outcomes; with a bounded bankroll of the payer or concave utility, the fair price is small",
    "Coin flips are not independent",
    "Expected value is not defined for discrete games"
   ],
   "correct": 1,
   "display": "Infinite EV comes from tiny-probability huge payoffs; bounded counterparty wealth / concave utility make the real value small"
  },
  "hints": [
   "Each term of the EV sum contributes (1/2ⁿ)·2ⁿ = 1.",
   "What if the house can pay at most $1 billion?"
  ],
  "solution": "<p>E = Σ (1/2ⁿ)(2ⁿ) = 1 + 1 + 1 + … = ∞. Every outcome contributes exactly $1, so most of the value is in outcomes with vanishing probability.</p><p>If the payer can pay at most W, payoffs are capped at W and only about log₂W terms contribute: with W = $1 billion (≈ 2³⁰) the EV is only about $31.</p><p>With log utility the certainty equivalent is also small (a few dollars). Also, the median payoff is just $2–4.</p><p><b>Answer: the infinite EV lives in unpayable tail outcomes; capped payoffs or concave utility give a small fair price.</b></p>",
  "key": "EV that comes only from extreme tails is fragile: cap the payoff and the value collapses to ~log₂(cap)."
 },
 {
  "id": "ev-008",
  "cat": "ev",
  "diff": 3,
  "title": "Roll until you stop, a 6 wipes you out",
  "tags": [
   "optimal-stopping",
   "dice",
   "dynamic-programming"
  ],
  "prompt": "<p>You roll a fair die repeatedly. Each roll of 1–5 adds that amount (in dollars) to your pot. If you roll a 6, you lose the whole pot and the game ends. You may stop at any time before a roll and keep the pot. Under the optimal strategy, what is the expected value of the game?</p><p>Give a decimal to 2 places.</p>",
  "answer": {
   "type": "numeric",
   "value": 6.1537379284031894,
   "display": "≈ $6.15 (stop once the pot reaches 15)",
   "tolAbs": 0.01
  },
  "hints": [
   "With pot s, one more roll gains 2.5 on average from 1–5 but loses s with probability 1/6. When is one more roll good?",
   "The one-step rule says stop once s ≥ 15. Then compute the value by dynamic programming over pots 0..19."
  ],
  "solution": "<p>One-step look-ahead: with pot s, rolling changes the expected pot by (1+2+3+4+5)/6 − s/6 = (15 − s)/6. So roll while s &lt; 15 and stop at s ≥ 15. This problem is monotone (once it's optimal to stop, it stays optimal), so the myopic rule is optimal.</p><p>Let V(s) be the value with pot s. V(s) = s for s ≥ 15, and for s &lt; 15, V(s) = (1/6)Σ<sub>k=1..5</sub> V(s + k) (a 6 gives 0).</p><p>Computing backwards from s = 14 down to 0 gives V(0) ≈ 6.154.</p><p><b>Answer: ≈ $6.15, stopping once the pot is at least 15.</b></p>",
  "key": "Compare marginal gain vs. marginal risk; for monotone stopping problems the one-step rule is optimal, then DP for the value."
 },
 {
  "id": "ev-009",
  "cat": "ev",
  "diff": 2,
  "title": "Red card +1, black card −1 (small deck)",
  "tags": [
   "optimal-stopping",
   "cards",
   "dynamic-programming"
  ],
  "prompt": "<p>A shuffled deck has 2 red and 2 black cards. You flip cards one at a time; each red card pays you +$1 and each black card costs you $1. You may stop at any time (including before the first card). With optimal play, what is the expected value?</p><p>Give a fraction or decimal.</p>",
  "answer": {
   "type": "numeric",
   "value": 0.6666666666666666,
   "display": "2/3 ≈ $0.667"
  },
  "hints": [
   "Let V(r, b) be the value with r red and b black cards left. V(r, 0) = r, V(0, b) = 0.",
   "V(r, b) = max(0, r/(r+b)·(1 + V(r−1, b)) + b/(r+b)·(−1 + V(r, b−1)))."
  ],
  "solution": "<p>Define V(r, b) as the value of the remaining game. You can always just stop, so V ≥ 0. V(r, 0) = r and V(0, b) = 0.</p><p>V(1,1) = max(0, ½(1 + 0) + ½(−1 + 1)) = ½.</p><p>V(2,1) = max(0, ⅔(1 + V(1,1)) + ⅓(−1 + V(2,0))) = ⅔(1.5) + ⅓(1) = 4/3.</p><p>V(1,2) = max(0, ⅓(1 + V(0,2)) + ⅔(−1 + V(1,1))) = max(0, ⅓ − ⅓) = 0.</p><p>V(2,2) = ½(1 + V(1,2)) + ½(−1 + V(2,1)) = ½(1) + ½(1/3) = 2/3.</p><p><b>Answer: 2/3.</b></p>",
  "key": "The option to stop has value even when the deck is fair: DP over (reds left, blacks left)."
 },
 {
  "id": "ev-010",
  "cat": "ev",
  "diff": 3,
  "title": "Red card +1, black card −1 (full deck)",
  "tags": [
   "optimal-stopping",
   "cards",
   "dynamic-programming"
  ],
  "prompt": "<p>Same game with a standard 52-card deck (26 red, 26 black): +$1 per red, −$1 per black, stop whenever you like. What is the value of the game under optimal play? (You'll need to reason about how to compute it; give a decimal to 2 places.)</p>",
  "answer": {
   "type": "numeric",
   "value": 2.624475548993925,
   "display": "≈ $2.62",
   "tolAbs": 0.01
  },
  "hints": [
   "Same recursion V(r, b) = max(0, r/(r+b)(1 + V(r−1, b)) + b/(r+b)(−1 + V(r, b−1))) — a 27×27 table.",
   "Intuition: you stop when you're ahead and the remaining deck is black-heavy; you never need to stop when behind, since finishing the deck brings you to 0."
  ],
  "solution": "<p>Let V(r, b) be the value with r reds and b blacks remaining (your current P&amp;L doesn't matter, only future increments). Boundary: V(r, 0) = r, V(0, b) = 0.</p><p>Recursion: V(r, b) = max(0, (r/(r+b))(1 + V(r−1, b)) + (b/(r+b))(−1 + V(r, b−1))).</p><p>Filling the 27 × 27 table gives V(26, 26) ≈ 2.6245.</p><p>Sanity check: it is positive because you can never end worse than 0 (if you never stop, you finish at exactly 0), yet you get to lock in gains during favorable runs. Typical interview answer: 'a bit over $2.50, computed by DP'.</p><p><b>Answer: ≈ $2.62.</b></p>",
  "key": "Optimal stopping on a fair random walk with a floor: value comes from the option to quit when ahead."
 },
 {
  "id": "ev-011",
  "cat": "ev",
  "diff": 1,
  "title": "Kelly fraction, even-money bet",
  "tags": [
   "kelly",
   "bankroll",
   "betting"
  ],
  "prompt": "<p>You can repeatedly bet on a coin that lands heads with probability 0.6. Bets pay even money (win your stake or lose it). What fraction of your bankroll should you bet each time to maximize long-run growth (Kelly)?</p><p>Give a decimal.</p>",
  "answer": {
   "type": "numeric",
   "value": 0.2,
   "display": "0.2 (20% of bankroll)"
  },
  "hints": [
   "Maximize g(f) = p·ln(1+f) + q·ln(1−f).",
   "For even money, Kelly f* = p − q."
  ],
  "solution": "<p>Long-run growth per bet: g(f) = 0.6 ln(1 + f) + 0.4 ln(1 − f).</p><p>g′(f) = 0.6/(1 + f) − 0.4/(1 − f) = 0 ⇒ 0.6(1 − f) = 0.4(1 + f) ⇒ f = 0.2.</p><p>In general for even money, f* = p − q = edge.</p><p><b>Answer: 0.2.</b></p>",
  "key": "Kelly maximizes expected log wealth; for an even-money bet f* = p − q."
 },
 {
  "id": "ev-012",
  "cat": "ev",
  "diff": 2,
  "title": "Kelly with odds",
  "tags": [
   "kelly",
   "bankroll",
   "betting",
   "odds"
  ],
  "prompt": "<p>A bet wins with probability 0.4 and pays 2-to-1 (win $2 per $1 staked, or lose your $1). What fraction of bankroll does the Kelly criterion prescribe?</p><p>Give a decimal.</p>",
  "answer": {
   "type": "numeric",
   "value": 0.1,
   "display": "0.1 (10%)"
  },
  "hints": [
   "Kelly with net odds b: f* = p − q/b = (bp − q)/b.",
   "First check the bet has positive EV: 0.4·2 − 0.6·1."
  ],
  "solution": "<p>EV per $1: 0.4·2 − 0.6 = 0.2 &gt; 0, so you should bet something.</p><p>Maximize g(f) = p ln(1 + bf) + q ln(1 − f): setting g′ = 0 gives f* = p − q/b.</p><p>f* = 0.4 − 0.6/2 = 0.1.</p><p><b>Answer: 0.1 (10% of bankroll).</b></p>",
  "key": "Kelly fraction = edge / odds = (bp − q)/b."
 },
 {
  "id": "ev-013",
  "cat": "ev",
  "diff": 2,
  "title": "Overbetting Kelly",
  "tags": [
   "kelly",
   "bankroll",
   "risk"
  ],
  "prompt": "<p>For a small-edge bet, you consistently stake <b>twice</b> the Kelly fraction. What happens to your long-run growth rate, approximately?</p>",
  "answer": {
   "type": "choice",
   "options": [
    "It doubles compared to Kelly",
    "It is the same as Kelly, just with more variance",
    "It drops to roughly zero — no better than not betting",
    "It becomes about half the Kelly growth rate"
   ],
   "correct": 2,
   "display": "Roughly zero growth"
  },
  "hints": [
   "For small edges, g(f) ≈ μf − σ²f²/2: a parabola.",
   "Where does this parabola cross zero again?"
  ],
  "solution": "<p>For small bets, the log growth is approximately g(f) ≈ μf − ½σ²f², a downward parabola maximized at f* = μ/σ² (the Kelly fraction).</p><p>The parabola is symmetric around f*, so it returns to g = 0 at f = 2f*. Betting double Kelly gives approximately zero long-run growth (beyond 2f*, growth is negative and you go broke in the long run despite a positive edge).</p><p>Half-Kelly, by contrast, keeps 75% of the growth with much lower volatility — why practitioners often bet fractional Kelly.</p><p><b>Answer: roughly zero growth.</b></p>",
  "key": "Growth is a parabola in bet size: 2× Kelly ≈ zero growth; ½ Kelly keeps 3/4 of it."
 },
 {
  "id": "ev-014",
  "cat": "ev",
  "diff": 1,
  "title": "Make me a market: sum of 3 dice",
  "tags": [
   "market-making",
   "dice",
   "fair-price"
  ],
  "prompt": "<p>Make me a market on the sum of three fair dice that are about to be rolled. Enter your <b>fair value</b> (the mid of your market).</p>",
  "answer": {
   "type": "numeric",
   "value": 10.5,
   "display": "Fair 10.5; e.g. 10 @ 11",
   "range": [
    10,
    11
   ]
  },
  "hints": [
   "Linearity: E[sum] = 3 × 3.5.",
   "Width: the sum has standard deviation about 2.96, but you're quoting the expectation, which you know exactly."
  ],
  "solution": "<p>By linearity of expectation, E[sum] = 3 × 3.5 = 10.5.</p><p>Since you know the fair value exactly, you can quote tight, e.g. 10 bid / 11 offer (or 10.25 @ 10.75). Width compensates you for risk and for the possibility the counterparty knows something; here there's no information asymmetry, so a tight market is fine.</p><p>If someone repeatedly lifts your offer at 11 on a supposedly fair die set, ask whether they know something (loaded dice?) — widen or move your market up.</p><p><b>Answer: fair value 10.5, e.g. 10 @ 11.</b></p>",
  "key": "Mid = expected value; width reflects uncertainty about fair value and adverse selection, not the variance of the outcome alone."
 },
 {
  "id": "ev-015",
  "cat": "ev",
  "diff": 2,
  "title": "Make me a market: max of 3 dice",
  "tags": [
   "market-making",
   "dice",
   "order-statistics"
  ],
  "prompt": "<p>Three fair dice will be rolled. Make me a market on the <b>maximum</b> of the three. Enter your fair value (mid).</p>",
  "answer": {
   "type": "numeric",
   "value": 4.958333333333333,
   "display": "119/24 ≈ 4.96; e.g. 4.8 @ 5.1",
   "range": [
    4.8,
    5.1
   ]
  },
  "hints": [
   "E[M] = Σ<sub>k=1..6</sub> P(M ≥ k).",
   "P(M ≥ k) = 1 − ((k−1)/6)³."
  ],
  "solution": "<p>Quick estimate first: the max of 3 dice is usually 5 or 6, so fair value is just under 5.</p><p>Exactly: E[M] = Σ P(M ≥ k) = Σ<sub>k=1..6</sub> [1 − ((k−1)/6)³] = 6 − (0 + 1 + 8 + 27 + 64 + 125)/216 = 6 − 225/216 = 119/24 ≈ 4.958.</p><p>A reasonable quote is 4.8 @ 5.1 at first (while you compute), tightening to around 4.9 @ 5.0 once you've done the math.</p><p><b>Answer: ≈ 4.96.</b></p>",
  "key": "Tail-sum formula E[M] = Σ P(M ≥ k), with P(M < k) a product of CDFs."
 },
 {
  "id": "ev-016",
  "cat": "ev",
  "diff": 3,
  "title": "Make me a market: distinct faces",
  "tags": [
   "market-making",
   "dice",
   "indicators",
   "linearity"
  ],
  "prompt": "<p>A fair die will be rolled 6 times. Make me a market on the number of <b>distinct</b> faces that appear. Enter your fair value (mid), to 2 decimals.</p>",
  "answer": {
   "type": "numeric",
   "value": 3.9906121399176953,
   "display": "6(1 − (5/6)⁶) ≈ 3.99; e.g. 3.9 @ 4.1",
   "range": [
    3.85,
    4.15
   ]
  },
  "hints": [
   "Use an indicator for each face: does face j appear at least once?",
   "P(face j never appears) = (5/6)⁶ ≈ 0.335."
  ],
  "solution": "<p>Let I<sub>j</sub> = 1 if face j appears at least once. Distinct count D = Σ I<sub>j</sub>.</p><p>By linearity, E[D] = 6 · P(face appears) = 6(1 − (5/6)⁶).</p><p>(5/6)⁶ = 15625/46656 ≈ 0.3349, so E[D] ≈ 6 × 0.6651 ≈ 3.99.</p><p>Many people's instinct is 'about 4–4.5'; the indicator trick gives a precise answer quickly. Quote something like 3.9 @ 4.1.</p><p><b>Answer: ≈ 3.99.</b></p>",
  "key": "Counting distinct items → sum of indicators, then linearity."
 },
 {
  "id": "ev-017",
  "cat": "ev",
  "diff": 2,
  "title": "Fair coin from a biased coin",
  "tags": [
   "coins",
   "von-neumann",
   "geometric"
  ],
  "prompt": "<p>You have a coin with P(heads) = 0.3. To simulate a fair coin, you flip it in pairs: HT means 'heads', TH means 'tails', and HH or TT means discard the pair and start over. What is the expected total number of flips to produce one fair result?</p><p>Give a decimal.</p>",
  "answer": {
   "type": "numeric",
   "value": 4.761904761904762,
   "display": "1/(p(1−p)) = 1/0.21 ≈ 4.76"
  },
  "hints": [
   "A pair succeeds with probability 2p(1 − p).",
   "The number of pairs is geometric; each pair costs 2 flips."
  ],
  "solution": "<p>HT and TH each have probability p(1 − p), so they are equally likely — that's why the procedure is fair.</p><p>A pair succeeds with probability s = 2p(1 − p) = 2(0.3)(0.7) = 0.42.</p><p>Number of pairs is geometric with mean 1/s, so expected flips = 2/s = 1/(p(1 − p)) = 1/0.21 ≈ 4.76.</p><p><b>Answer: ≈ 4.76 flips.</b></p>",
  "key": "Von Neumann trick: HT and TH are equally likely; expected cost is geometric with success prob 2p(1−p)."
 },
 {
  "id": "ev-018",
  "cat": "ev",
  "diff": 2,
  "title": "The doubling (martingale) strategy",
  "tags": [
   "martingale",
   "betting",
   "risk",
   "ruin"
  ],
  "prompt": "<p>At a fair even-money game you bet $1; after each loss you double your bet, and you stop after your first win (netting +$1). You start with $1,023 (enough for 10 bets: 1+2+…+512). What is true about this strategy?</p>",
  "answer": {
   "type": "choice",
   "options": [
    "It wins $1 with certainty, so EV = +$1",
    "Its EV is exactly 0: you win $1 with prob 1 − 2⁻¹⁰ and lose $1,023 with prob 2⁻¹⁰",
    "Its EV is positive but small, about $0.50",
    "Its EV is negative because the bets grow exponentially"
   ],
   "correct": 1,
   "display": "EV = 0: frequent small wins balanced by a rare large loss"
  },
  "hints": [
   "How do you lose? You must lose 10 in a row.",
   "Compute (1 − 2⁻¹⁰)(+1) + 2⁻¹⁰(−1023)."
  ],
  "solution": "<p>You lose only if all 10 bets lose: probability 2⁻¹⁰ = 1/1024, and then you've lost 1 + 2 + … + 512 = $1,023.</p><p>Otherwise (probability 1023/1024) you net exactly +$1.</p><p>EV = (1023/1024)(1) − (1/1024)(1023) = 0.</p><p>This is the optional stopping theorem in action: no stopping rule with bounded resources turns a fair game into a favorable one. The strategy just reshapes the distribution into many small wins and one rare catastrophic loss (negative skew).</p><p><b>Answer: EV is exactly 0.</b></p>",
  "key": "Optional stopping: with finite bankroll, a fair game stays fair — doubling only creates negative skew."
 },
 {
  "id": "ev-019",
  "cat": "ev",
  "diff": 3,
  "title": "Rolls until the sum reaches 10",
  "tags": [
   "dice",
   "recursion",
   "dynamic-programming",
   "stopping-time"
  ],
  "prompt": "<p>You roll a fair die repeatedly, keeping a running total. What is the expected number of rolls until the total is <b>at least 10</b>?</p><p>Give a decimal to 3 places.</p>",
  "answer": {
   "type": "numeric",
   "value": 3.323693729201595,
   "display": "≈ 3.324",
   "tolAbs": 0.002
  },
  "hints": [
   "Let E(s) be the expected additional rolls from total s; E(s) = 0 for s ≥ 10.",
   "E(s) = 1 + (1/6)Σ<sub>k=1..6</sub> E(s + k); compute from s = 9 down to 0. Sanity check: Wald's identity E[final total] = 3.5·E[rolls]."
  ],
  "solution": "<p>Let E(s) = expected rolls still needed when the total is s. E(s) = 0 for s ≥ 10.</p><p>For s &lt; 10: E(s) = 1 + (1/6)[E(s+1) + … + E(s+6)].</p><p>Backwards: E(9) = 1, E(8) = 7/6, E(7) = 49/36, E(6) ≈ 1.588, E(5) ≈ 1.853, E(4) ≈ 2.161, E(3) ≈ 2.522, E(2) ≈ 2.775, E(1) ≈ 3.043, E(0) ≈ 3.324.</p><p>Sanity check with Wald's identity: E[final total] = 3.5 · E[rolls]. The final total lies between 10 and 15 and averages about 11.6 (you overshoot 10 by a bit), giving 11.6/3.5 ≈ 3.3. ✓</p><p><b>Answer: ≈ 3.324 rolls.</b></p>",
  "key": "First-passage expectations: recursion on the current state, solved backwards."
 },
 {
  "id": "ev-020",
  "cat": "ev",
  "diff": 1,
  "title": "Is the lottery ticket worth it?",
  "tags": [
   "fair-price",
   "lottery",
   "utility"
  ],
  "prompt": "<p>A $2 lottery ticket wins a $450 million jackpot with probability 1 in 300,000,000 and pays nothing otherwise (ignore taxes, other prizes, and splitting the jackpot). What is the expected payout of one ticket, in dollars?</p>",
  "answer": {
   "type": "numeric",
   "value": 1.5,
   "display": "$1.50 (net EV −$0.50)"
  },
  "hints": [
   "EV = prize × probability."
  ],
  "solution": "<p>EV = 450,000,000 / 300,000,000 = $1.50.</p><p>The ticket costs $2, so the expected profit is −$0.50 per ticket (a −25% return). In reality, taxes and the chance of splitting the jackpot make it worse.</p><p><b>Answer: $1.50.</b></p>",
  "key": "EV = payoff × probability; compare to price to get the edge."
 },
 {
  "id": "ev-021",
  "cat": "ev",
  "diff": 3,
  "title": "Insurance premium under log utility",
  "tags": [
   "utility",
   "insurance",
   "certainty-equivalent",
   "risk"
  ],
  "prompt": "<p>You have wealth $100. With probability 10% you will lose $50. Your utility of wealth is u(w) = ln(w). What is the <b>maximum</b> premium you would pay for full insurance against the loss?</p><p>Give dollars to 2 decimals.</p>",
  "answer": {
   "type": "numeric",
   "value": 6.696700846319259,
   "display": "100(1 − 0.5^0.1) ≈ $6.70",
   "tolAbs": 0.01
  },
  "hints": [
   "Indifference: ln(100 − π) = 0.9 ln(100) + 0.1 ln(50).",
   "So 100 − π = 100^0.9 · 50^0.1."
  ],
  "solution": "<p>Without insurance, expected utility = 0.9 ln 100 + 0.1 ln 50.</p><p>With insurance at premium π, wealth is 100 − π for sure. The max premium makes you indifferent:</p><p>ln(100 − π) = 0.9 ln 100 + 0.1 ln 50 ⇒ 100 − π = 100<sup>0.9</sup> · 50<sup>0.1</sup> = 100 · 0.5<sup>0.1</sup> ≈ 93.30.</p><p>π ≈ 6.70, compared to the expected loss of $5. The extra $1.70 is the risk premium a risk-averse agent will pay.</p><p><b>Answer: ≈ $6.70.</b></p>",
  "key": "Certainty equivalent: solve u(w − π) = E[u(W)]; risk aversion makes π exceed the expected loss."
 },
 {
  "id": "ev-022",
  "cat": "ev",
  "diff": 2,
  "title": "Pay $1 per roll, keep the last",
  "tags": [
   "optimal-stopping",
   "dice",
   "re-roll",
   "fair-price"
  ],
  "prompt": "<p>Each roll of a fair die costs $1 (including the first). After any roll you may stop and receive the face value of that last roll in dollars, or pay $1 to roll again. You may roll as many times as you like. With optimal play, what is the game worth (net of all roll costs)?</p>",
  "answer": {
   "type": "numeric",
   "value": 3.0,
   "display": "$3 (stop on 4 or more; stopping on 3+ ties)"
  },
  "hints": [
   "The game is stationary: the value V satisfies V = −1 + E[max(X, V)].",
   "Try thresholds: stop when X ≥ k. Value = E[X | X ≥ k] − (expected number of rolls)."
  ],
  "solution": "<p>Strategy 'stop when X ≥ k': the number of rolls is geometric with mean 6/(7 − k), and the payoff is E[X | X ≥ k] = (k + 6)/2.</p><p>k = 6: 6 − 6 = 0. k = 5: 5.5 − 3 = 2.5. k = 4: 5 − 2 = 3. k = 3: 4.5 − 1.5 = 3. k = 2: 4 − 1.2 = 2.8.</p><p>Check with the fixed point V = −1 + E[max(X, V)]: with V = 3, E[max(X, 3)] = (3 + 3 + 3 + 4 + 5 + 6)/6 = 4, and −1 + 4 = 3. ✓</p><p>Keep any roll ≥ V = 3 (a 3 is a tie), re-roll otherwise.</p><p><b>Answer: $3.</b></p>",
  "key": "Stationary stopping: the continuation value V solves V = −c + E[max(X, V)]; stop when the roll beats V."
 },
 {
  "id": "comb-001",
  "cat": "combinatorics",
  "diff": 2,
  "title": "Two pairs of socks",
  "tags": [
   "pigeonhole",
   "worst-case"
  ],
  "prompt": "<p>A dark drawer holds 10 black, 10 white and 10 blue socks. What is the minimum number of socks you must draw to be <b>guaranteed</b> two matching pairs (two disjoint pairs; the two pairs may be the same colour)?</p>",
  "answer": {
   "type": "numeric",
   "value": 6,
   "display": "6"
  },
  "hints": [
   "Think adversarially: how many socks can you hold with only one pair?",
   "One pair plus as many singletons as possible: e.g. 3 black, 1 white, 1 blue."
  ],
  "solution": "<p>With 5 socks the adversary can give 3 black + 1 white + 1 blue: only one pair (the third black is an extra single).</p><p>With 6 socks: only a colour with an odd count leaves one sock unpaired, so at most 3 socks are unpaired. The counts sum to 6 (even), so the number of odd counts is even — at most 2. Thus at least 4 socks are paired up: two pairs.</p><p>Hence 6 is the minimum.</p><p><b>Answer: 6</b></p>",
  "key": "Pigeonhole: find the worst case one sock short of the goal, then add one."
 },
 {
  "id": "comb-002",
  "cat": "combinatorics",
  "diff": 2,
  "title": "Committee with at least two women",
  "tags": [
   "combinations",
   "casework",
   "committee"
  ],
  "prompt": "<p>From 6 men and 5 women, how many 4-person committees contain at least 2 women?</p>",
  "answer": {
   "type": "numeric",
   "value": 215,
   "display": "215"
  },
  "hints": [
   "Split by the number of women: 2, 3 or 4.",
   "Check: or compute total C(11,4) minus committees with 0 or 1 women."
  ],
  "solution": "<p>2 women: C(5,2)·C(6,2) = 10·15 = 150.</p><p>3 women: C(5,3)·C(6,1) = 10·6 = 60.</p><p>4 women: C(5,4) = 5.</p><p>Total 215. Check by complement: C(11,4) − C(6,4) − C(5,1)C(6,3) = 330 − 15 − 100 = 215.</p><p><b>Answer: 215</b></p>",
  "key": "“At least” constraints: casework on the count, or subtract the complement."
 },
 {
  "id": "comb-003",
  "cat": "combinatorics",
  "diff": 1,
  "title": "Stars and bars",
  "tags": [
   "stars-and-bars",
   "integer-solutions"
  ],
  "prompt": "<p>How many solutions in non-negative integers does x₁ + x₂ + x₃ + x₄ = 10 have?</p>",
  "answer": {
   "type": "numeric",
   "value": 286,
   "display": "C(13,3) = 286"
  },
  "hints": [
   "Represent a solution as 10 stars and 3 bars in a row.",
   "Choose positions of the 3 bars among 13 slots."
  ],
  "solution": "<p>Any arrangement of 10 stars and 3 bars encodes a solution: x₁ = stars before the first bar, etc.</p><p>Number of arrangements = C(13, 3) = 286.</p><p>General formula: C(n + k − 1, k − 1) for k variables summing to n.</p><p><b>Answer: 286</b></p>",
  "key": "Non-negative solutions of x₁+…+x_k = n: C(n+k−1, k−1)."
 },
 {
  "id": "comb-004",
  "cat": "combinatorics",
  "diff": 3,
  "title": "Bounded stars and bars",
  "tags": [
   "stars-and-bars",
   "inclusion-exclusion",
   "integer-solutions"
  ],
  "prompt": "<p>How many solutions are there to x₁ + x₂ + x₃ = 10 with each xᵢ an integer and 0 ≤ xᵢ ≤ 5?</p>",
  "answer": {
   "type": "numeric",
   "value": 21,
   "display": "21"
  },
  "hints": [
   "Start with all non-negative solutions, then subtract those with some xᵢ ≥ 6.",
   "If x₁ ≥ 6, substitute y₁ = x₁ − 6: the remaining sum is 4. Two variables can't both be ≥ 6."
  ],
  "solution": "<p>Unconstrained: C(12, 2) = 66.</p><p>Solutions with x₁ ≥ 6: set y₁ = x₁ − 6, then y₁ + x₂ + x₃ = 4 → C(6, 2) = 15. Same for x₂, x₃: 45 total.</p><p>Two variables ≥ 6 would need sum ≥ 12 &gt; 10, so no double counting.</p><p>66 − 45 = 21.</p><p><b>Answer: 21</b></p>",
  "key": "Upper bounds in stars-and-bars: inclusion–exclusion on the violated variables."
 },
 {
  "id": "comb-005",
  "cat": "combinatorics",
  "diff": 1,
  "title": "MISSISSIPPI",
  "tags": [
   "permutations",
   "multinomial",
   "repeated-letters"
  ],
  "prompt": "<p>How many distinct arrangements of the letters of MISSISSIPPI are there?</p>",
  "answer": {
   "type": "numeric",
   "value": 34650,
   "display": "11!/(4!·4!·2!) = 34650"
  },
  "hints": [
   "Letter counts: M×1, I×4, S×4, P×2.",
   "Divide 11! by the factorial of each repeated count."
  ],
  "solution": "<p>11 letters: M(1), I(4), S(4), P(2).</p><p>Permuting identical letters among themselves gives the same word, so divide: 11!/(1!·4!·4!·2!) = 39916800/1152 = 34650.</p><p><b>Answer: 34650</b></p>",
  "key": "Multinomial coefficient: n!/(n₁!·n₂!·…)."
 },
 {
  "id": "comb-006",
  "cat": "combinatorics",
  "diff": 3,
  "title": "Ten hats, nobody gets theirs",
  "tags": [
   "derangements",
   "inclusion-exclusion",
   "probability"
  ],
  "prompt": "<p>10 people check their hats; the hats are returned in a uniformly random order. What is the <b>exact</b> probability that nobody receives their own hat? Give a decimal to 6 places (or the exact fraction).</p>",
  "answer": {
   "type": "numeric",
   "value": 0.3678794642857143,
   "display": "D₁₀/10! = 1334961/3628800 ≈ 0.367879",
   "tolAbs": 5e-07
  },
  "hints": [
   "Inclusion–exclusion: P = ∑ₖ (−1)ᵏ/k! for k = 0…10.",
   "Equivalently D_n = (n − 1)(D_{n−1} + D_{n−2}), D₁ = 0, D₂ = 1."
  ],
  "solution": "<p>By inclusion–exclusion over the set of people who get their own hat:</p><p>D_n = n! ∑_{k=0}^{n} (−1)ᵏ/k!, so P = ∑_{k=0}^{10} (−1)ᵏ/k!.</p><p>Recurrence: D₃ = 2, D₄ = 9, D₅ = 44, D₆ = 265, D₇ = 1854, D₈ = 14833, D₉ = 133496, D₁₀ = 1334961.</p><p>P = 1334961/3628800 ≈ 0.367879 — already within 10⁻⁷ of 1/e ≈ 0.3678794.</p><p><b>Answer: ≈ 0.367879</b></p>",
  "key": "Derangement probability = ∑(−1)ᵏ/k! → 1/e very fast."
 },
 {
  "id": "comb-007",
  "cat": "combinatorics",
  "diff": 2,
  "title": "Balanced parentheses",
  "tags": [
   "catalan",
   "parentheses",
   "dyck-paths"
  ],
  "prompt": "<p>How many strings of 5 pairs of parentheses are balanced (e.g. (()()) is balanced for 3 pairs, )( is not)?</p>",
  "answer": {
   "type": "numeric",
   "value": 42,
   "display": "C₅ = 42"
  },
  "hints": [
   "This is the Catalan number C_n = C(2n, n)/(n + 1).",
   "Reflection principle: bad sequences of n '(' and n ')' are in bijection with sequences of n+1 ')' and n−1 '('."
  ],
  "solution": "<p>Total arrangements of 5 '(' and 5 ')': C(10,5) = 252.</p><p>Reflect the prefix up to the first point where ')' exceeds '(': bad strings ↔ strings with 6 ')' and 4 '(', of which there are C(10,4) = 210.</p><p>Good = 252 − 210 = 42 = C(10,5)/6.</p><p><b>Answer: 42</b></p>",
  "key": "Catalan: C_n = C(2n,n)/(n+1), counted via the reflection principle."
 },
 {
  "id": "comb-008",
  "cat": "combinatorics",
  "diff": 3,
  "title": "Ballot problem",
  "tags": [
   "ballot-theorem",
   "reflection-principle",
   "probability"
  ],
  "prompt": "<p>In an election candidate A gets 6 votes and B gets 4. The 10 ballots are counted in a uniformly random order. What is the probability that A is <b>strictly</b> ahead throughout the entire count?</p>",
  "answer": {
   "type": "numeric",
   "value": 0.2,
   "display": "(6−4)/(6+4) = 1/5"
  },
  "hints": [
   "The first ballot must be for A.",
   "Bertrand's ballot theorem: P = (a − b)/(a + b)."
  ],
  "solution": "<p>Any sequence starting with B fails immediately. For sequences starting with A that touch a tie at some point, reflect the part before the first tie: this is a bijection with sequences starting with B. So #bad-starting-with-A = #starting-with-B.</p><p>P(start with B) = 4/10, so P(bad) = 2·4/10 = 0.8 and P(always ahead) = 1 − 0.8 = 0.2.</p><p>General: (a − b)/(a + b) = 2/10 = 1/5.</p><p><b>Answer: 1/5</b></p>",
  "key": "Ballot theorem: P(winner always strictly ahead) = (a − b)/(a + b)."
 },
 {
  "id": "comb-009",
  "cat": "combinatorics",
  "diff": 2,
  "title": "Divisible by 2, 3 or 5",
  "tags": [
   "inclusion-exclusion",
   "number-theory"
  ],
  "prompt": "<p>How many integers from 1 to 1000 are divisible by 2, 3, or 5?</p>",
  "answer": {
   "type": "numeric",
   "value": 734,
   "display": "734"
  },
  "hints": [
   "|A∪B∪C| = |A|+|B|+|C| − |A∩B| − |A∩C| − |B∩C| + |A∩B∩C|.",
   "|A∩B| = numbers divisible by 6, etc. Use floor(1000/d)."
  ],
  "solution": "<p>Singles: ⌊1000/2⌋ + ⌊1000/3⌋ + ⌊1000/5⌋ = 500 + 333 + 200 = 1033.</p><p>Pairs: ⌊1000/6⌋ + ⌊1000/10⌋ + ⌊1000/15⌋ = 166 + 100 + 66 = 332.</p><p>Triple: ⌊1000/30⌋ = 33.</p><p>Total = 1033 − 332 + 33 = 734.</p><p><b>Answer: 734</b></p>",
  "key": "Inclusion–exclusion with floor(N/lcm)."
 },
 {
  "id": "comb-010",
  "cat": "combinatorics",
  "diff": 1,
  "title": "Handshakes",
  "tags": [
   "combinations",
   "handshakes",
   "graphs"
  ],
  "prompt": "<p>At a desk drinks event, each of 20 people shakes hands with every other person exactly once. How many handshakes occur?</p>",
  "answer": {
   "type": "numeric",
   "value": 190,
   "display": "C(20,2) = 190"
  },
  "hints": [
   "A handshake is an unordered pair of people."
  ],
  "solution": "<p>Each handshake corresponds to an unordered pair: C(20, 2) = 20·19/2 = 190.</p><p>Alternatively each person shakes 19 hands; 20·19 counts each handshake twice.</p><p><b>Answer: 190</b></p>",
  "key": "Unordered pairs: n(n−1)/2."
 },
 {
  "id": "comb-011",
  "cat": "combinatorics",
  "diff": 2,
  "title": "Full houses",
  "tags": [
   "poker",
   "cards",
   "combinations"
  ],
  "prompt": "<p>How many 5-card poker hands (from a standard 52-card deck) are a full house (three of one rank, two of another)?</p>",
  "answer": {
   "type": "numeric",
   "value": 3744,
   "display": "3744"
  },
  "hints": [
   "Choose the rank of the triple, then its suits; then the rank of the pair (different!), then its suits.",
   "13 · C(4,3) · 12 · C(4,2)."
  ],
  "solution": "<p>Rank of the triple: 13 ways; suits: C(4,3) = 4.</p><p>Rank of the pair: 12 remaining ranks; suits: C(4,2) = 6.</p><p>Total = 13·4·12·6 = 3744 (order matters between the two ranks because the triple and pair play different roles).</p><p>Probability = 3744/2598960 ≈ 0.144%.</p><p><b>Answer: 3744</b></p>",
  "key": "Pick roles in sequence; ordered choice of ranks when roles differ."
 },
 {
  "id": "comb-012",
  "cat": "combinatorics",
  "diff": 2,
  "title": "Flush probability",
  "tags": [
   "poker",
   "cards",
   "probability"
  ],
  "prompt": "<p>You are dealt 5 cards from a well-shuffled 52-card deck. What is the probability all 5 are the same suit (straight flushes included)? Give a decimal (4 significant figures) or a fraction.</p>",
  "answer": {
   "type": "numeric",
   "value": 0.0019807923169267707,
   "display": "5148/2598960 ≈ 0.001981"
  },
  "hints": [
   "Choose the suit, then 5 of its 13 cards.",
   "Or sequentially: the 2nd..5th cards must match the first: (12/51)(11/50)(10/49)(9/48)."
  ],
  "solution": "<p>Count: 4·C(13,5) = 4·1287 = 5148 hands out of C(52,5) = 2598960.</p><p>Sequential check: (12/51)(11/50)(10/49)(9/48) = 11880/5997600 ≈ 0.001981.</p><p>(Excluding the 40 straight flushes: 5108 hands.)</p><p><b>Answer: ≈ 0.00198</b></p>",
  "key": "Counting and sequential conditional probability must agree — use one to check the other."
 },
 {
  "id": "comb-013",
  "cat": "combinatorics",
  "diff": 2,
  "title": "Lattice paths avoiding a point",
  "tags": [
   "lattice-paths",
   "complement",
   "combinations"
  ],
  "prompt": "<p>Moving only right (R) or up (U) one unit at a time, how many shortest paths go from (0, 0) to (6, 4) <b>without</b> passing through the point (3, 2)?</p>",
  "answer": {
   "type": "numeric",
   "value": 110,
   "display": "210 − 100 = 110"
  },
  "hints": [
   "Total paths: choose which 4 of the 10 steps are U.",
   "Paths through (3,2): (paths to (3,2)) × (paths from (3,2) to (6,4))."
  ],
  "solution": "<p>All paths: C(10, 4) = 210.</p><p>Through (3, 2): C(5, 2)·C(5, 2) = 10·10 = 100.</p><p>Avoiding: 210 − 100 = 110.</p><p><b>Answer: 110</b></p>",
  "key": "Paths through a point multiply; avoid a point by complement."
 },
 {
  "id": "comb-014",
  "cat": "combinatorics",
  "diff": 2,
  "title": "Round table, two rivals",
  "tags": [
   "circular-permutations",
   "complement"
  ],
  "prompt": "<p>8 people sit at a round table (rotations of the same seating are identical). How many seatings have two particular people, Alice and Bob, <b>not</b> sitting next to each other?</p>",
  "answer": {
   "type": "numeric",
   "value": 3600,
   "display": "7! − 2·6! = 3600"
  },
  "hints": [
   "Circular arrangements of n people: (n − 1)!.",
   "Glue Alice and Bob into one block (2 internal orders), then arrange 7 units in a circle."
  ],
  "solution": "<p>All circular seatings: 7! = 5040.</p><p>Alice and Bob adjacent: treat them as one block → 7 units → 6! circular arrangements, ×2 for the order inside the block = 1440.</p><p>Not adjacent: 5040 − 1440 = 3600. (Check: Alice's two neighbours are Bob with probability 2/7, and 5040·5/7 = 3600.)</p><p><b>Answer: 3600</b></p>",
  "key": "Circle of n: (n−1)!; adjacency via block-gluing; complement for “not adjacent”."
 },
 {
  "id": "comb-015",
  "cat": "combinatorics",
  "diff": 1,
  "title": "Subsets with a condition",
  "tags": [
   "subsets",
   "power-set"
  ],
  "prompt": "<p>How many subsets of {1, 2, …, 10} contain the element 1 but do <b>not</b> contain the element 2?</p>",
  "answer": {
   "type": "numeric",
   "value": 256,
   "display": "2⁸ = 256"
  },
  "hints": [
   "Elements 1 and 2 are forced; each of the other 8 elements is in or out freely."
  ],
  "solution": "<p>A subset is a sequence of in/out decisions. Elements 1 (in) and 2 (out) are fixed.</p><p>The remaining 8 elements each have 2 choices: 2⁸ = 256.</p><p><b>Answer: 256</b></p>",
  "key": "Subsets = independent binary choices per element."
 },
 {
  "id": "comb-016",
  "cat": "combinatorics",
  "diff": 2,
  "title": "Domino tilings of a 2×10 board",
  "tags": [
   "recursion",
   "fibonacci",
   "tilings"
  ],
  "prompt": "<p>In how many ways can a 2×10 board be tiled with 1×2 dominoes?</p>",
  "answer": {
   "type": "numeric",
   "value": 89,
   "display": "89"
  },
  "hints": [
   "Look at the left edge: either one vertical domino, or two stacked horizontal ones.",
   "T(n) = T(n−1) + T(n−2), T(1) = 1, T(2) = 2."
  ],
  "solution": "<p>The leftmost column is covered either by a vertical domino (leaving a 2×(n−1) board) or by two horizontal dominoes (leaving 2×(n−2)).</p><p>So T(n) = T(n−1) + T(n−2) with T(1) = 1, T(2) = 2.</p><p>Sequence: 1, 2, 3, 5, 8, 13, 21, 34, 55, 89 → T(10) = 89.</p><p><b>Answer: 89</b></p>",
  "key": "Condition on the first move to get a recurrence — here Fibonacci."
 },
 {
  "id": "comb-017",
  "cat": "combinatorics",
  "diff": 1,
  "title": "Trailing zeros of 100!",
  "tags": [
   "factorials",
   "number-theory",
   "legendre"
  ],
  "prompt": "<p>How many trailing zeros does 100! have?</p>",
  "answer": {
   "type": "numeric",
   "value": 24,
   "display": "24"
  },
  "hints": [
   "Each trailing zero needs a factor 10 = 2·5; factors of 2 are plentiful.",
   "Count factors of 5: ⌊100/5⌋ + ⌊100/25⌋."
  ],
  "solution": "<p>Trailing zeros = number of factors 10 = min(#2s, #5s) = #5s.</p><p>Legendre: ⌊100/5⌋ + ⌊100/25⌋ + ⌊100/125⌋ = 20 + 4 + 0 = 24.</p><p><b>Answer: 24</b></p>",
  "key": "Count the scarce prime factor (5) with Legendre's formula."
 },
 {
  "id": "comb-018",
  "cat": "combinatorics",
  "diff": 2,
  "title": "Rectangles on a chessboard",
  "tags": [
   "combinations",
   "grids",
   "rectangles"
  ],
  "prompt": "<p>How many rectangles (of any size, sides along grid lines, squares included) are there on an 8×8 chessboard?</p>",
  "answer": {
   "type": "numeric",
   "value": 1296,
   "display": "C(9,2)² = 1296"
  },
  "hints": [
   "An 8×8 board has 9 horizontal and 9 vertical lines.",
   "A rectangle = a choice of 2 horizontal lines and 2 vertical lines."
  ],
  "solution": "<p>Each rectangle is determined by its top/bottom lines (2 of 9) and left/right lines (2 of 9).</p><p>C(9,2)² = 36² = 1296. (Also equals (1+2+…+8)² = 36².)</p><p><b>Answer: 1296</b></p>",
  "key": "Rectangles in a grid ↔ pairs of horizontal lines × pairs of vertical lines."
 },
 {
  "id": "comb-019",
  "cat": "combinatorics",
  "diff": 1,
  "title": "Squares on a chessboard",
  "tags": [
   "grids",
   "squares",
   "sums"
  ],
  "prompt": "<p>How many squares of all sizes (1×1 up to 8×8) are there on an 8×8 chessboard?</p>",
  "answer": {
   "type": "numeric",
   "value": 204,
   "display": "1² + 2² + … + 8² = 204"
  },
  "hints": [
   "A k×k square can be placed in (9 − k)² positions."
  ],
  "solution": "<p>k×k squares: (9 − k)² positions. Summing k = 1…8: 64 + 49 + 36 + 25 + 16 + 9 + 4 + 1 = 204.</p><p>Formula: n(n+1)(2n+1)/6 = 8·9·17/6 = 204.</p><p><b>Answer: 204</b></p>",
  "key": "Squares on an n×n board = ∑k² = n(n+1)(2n+1)/6."
 },
 {
  "id": "comb-020",
  "cat": "combinatorics",
  "diff": 3,
  "title": "Onto assignments",
  "tags": [
   "surjections",
   "inclusion-exclusion",
   "stirling"
  ],
  "prompt": "<p>6 distinct orders are routed to 3 distinct exchanges. In how many ways can this be done so that <b>every</b> exchange receives at least one order?</p>",
  "answer": {
   "type": "numeric",
   "value": 540,
   "display": "3⁶ − 3·2⁶ + 3·1⁶ = 540"
  },
  "hints": [
   "Total assignments 3⁶; subtract those missing at least one exchange.",
   "Inclusion–exclusion: ∑ₖ (−1)ᵏ C(3,k)(3 − k)⁶."
  ],
  "solution": "<p>All functions: 3⁶ = 729.</p><p>Missing a given exchange: 2⁶ = 64, three choices → 192. Missing two given exchanges: 1⁶ = 1, three choices → +3. Missing all three: 0.</p><p>Surjections = 729 − 192 + 3 = 540 (= 3!·S(6,3) = 6·90).</p><p><b>Answer: 540</b></p>",
  "key": "Surjections onto k boxes: ∑(−1)ʲC(k,j)(k−j)ⁿ."
 },
 {
  "id": "brain-001",
  "cat": "brainteasers",
  "diff": 2,
  "title": "Five pirates and 100 gold coins",
  "tags": [
   "backward-induction",
   "game-theory",
   "pirates"
  ],
  "prompt": "<p>Five pirates of strictly ranked seniority must split 100 indivisible gold coins. The most senior pirate proposes a split; all pirates (including the proposer) vote. If <b>at least half</b> vote yes, the split is adopted. Otherwise the proposer is thrown overboard and the next most senior pirate proposes, and so on.</p>\n<p>Every pirate is perfectly rational and (1) wants to survive, (2) wants as many coins as possible, (3) given equal coins, prefers to see someone thrown overboard.</p>\n<p>How many coins does the most senior pirate keep?</p>",
  "answer": {
   "type": "numeric",
   "value": 98.0,
   "display": "98"
  },
  "hints": [
   "Start from the end: what happens with only 1 pirate? With 2?",
   "A pirate votes yes only if he gets strictly more than he would in the next round. Buy the cheapest votes with 1 coin each."
  ],
  "solution": "<p>Label pirates P1 (most junior) … P5 (most senior). Work backwards.</p>\n<ol>\n<li><b>1 pirate (P1):</b> P1 keeps 100.</li>\n<li><b>2 pirates (P2, P1):</b> P2 needs 1 of 2 votes — his own. Split: P2 = 100, P1 = 0.</li>\n<li><b>3 pirates:</b> P3 needs 2 votes. P1 gets 0 in the next round, so 1 coin buys him. Split: P3 = 99, P2 = 0, P1 = 1.</li>\n<li><b>4 pirates:</b> P4 needs 2 votes. P2 gets 0 in the 3-pirate round, so 1 coin buys him. Split: P4 = 99, P3 = 0, P2 = 1, P1 = 0.</li>\n<li><b>5 pirates:</b> P5 needs 3 votes, i.e. 2 besides his own. The pirates getting 0 in the 4-pirate round are P3 and P1; 1 coin each buys them. Split: P5 = 98, P4 = 0, P3 = 1, P2 = 0, P1 = 1.</li>\n</ol>\n<p><b>Answer: 98 coins.</b></p>",
  "key": "Backward induction: each proposer bribes, at 1 coin each, exactly the pirates who would get nothing in the next round."
 },
 {
  "id": "brain-002",
  "cat": "brainteasers",
  "diff": 1,
  "title": "Burning ropes: measure 45 minutes",
  "tags": [
   "ropes",
   "timing",
   "construction"
  ],
  "prompt": "<p>You have two ropes and a lighter. Each rope takes exactly 60 minutes to burn completely, but burns <b>non-uniformly</b> (half the rope does not necessarily take 30 minutes). How do you measure exactly 45 minutes?</p>",
  "answer": {
   "type": "self",
   "display": "Light rope A at both ends and rope B at one end; when A finishes (30 min), light B's other end; B finishes 15 min later (45 min total)."
  },
  "hints": [
   "Lighting a rope at both ends makes it burn out in exactly half its time, whatever the burn profile.",
   "Use one rope to mark 30 minutes while the other burns from one end only."
  ],
  "solution": "<p><b>Key fact:</b> a rope lit at both ends burns out in exactly 30 minutes: the two flames together consume the rope at a combined rate that always totals 60 rope-minutes, so they meet after 30 minutes regardless of where.</p>\n<ol>\n<li>At t = 0, light rope A at <b>both</b> ends and rope B at <b>one</b> end.</li>\n<li>Rope A burns out at t = 30. At that instant rope B has exactly 30 minutes of burn left.</li>\n<li>Immediately light the other end of B. Its remaining 30 minutes of burn now take 15 minutes.</li>\n<li>B burns out at t = 45.</li>\n</ol>\n<p><b>Answer:</b> 45 minutes elapse from the first lighting until B is consumed.</p>",
  "key": "Lighting both ends halves the remaining burn time, independent of how unevenly the rope burns."
 },
 {
  "id": "brain-003",
  "cat": "brainteasers",
  "diff": 3,
  "title": "100 prisoners and a light bulb",
  "tags": [
   "prisoners",
   "strategy",
   "counting",
   "protocol"
  ],
  "prompt": "<p>100 prisoners are in solitary cells. Each day the warden picks one prisoner uniformly at random (with replacement) and takes him to a room with a single light bulb, initially <b>off</b>. The prisoner may toggle the bulb or leave it. At any time any prisoner may declare “everyone has visited the room.” If correct, all are freed; if wrong, all are executed.</p>\n<p>The prisoners may plan once beforehand and never communicate again. Give a strategy that guarantees freedom with probability 1.</p>",
  "answer": {
   "type": "self",
   "display": "Elect one counter. Every other prisoner turns the bulb ON the first time he finds it off (only once). The counter turns it OFF each time he finds it on, counting; at 99 he declares."
  },
  "hints": [
   "The bulb can carry only one bit, so let one designated prisoner be the only one who ever resets it.",
   "Each non-counter should signal exactly once."
  ],
  "solution": "<ol>\n<li>Designate one prisoner as the <b>counter</b>. The other 99 are <b>signalers</b>.</li>\n<li>A signaler who enters and finds the bulb <b>off</b> turns it <b>on</b> — but only the first time this happens to him. Ever after, he leaves the bulb untouched.</li>\n<li>The counter, whenever he finds the bulb <b>on</b>, turns it <b>off</b> and adds 1 to his count. If he finds it off, he does nothing.</li>\n<li>Each “on” the counter sees was produced by a distinct signaler (each signals once, and no one turns the bulb on again until the counter resets it). When his count reaches <b>99</b>, every signaler has visited, and the counter has obviously visited, so he declares.</li>\n</ol>\n<p>Because visits are random with replacement, every prisoner visits infinitely often with probability 1, so the count reaches 99 with probability 1 (expected time is roughly 10,000 days — slow but certain).</p>\n<p><b>Answer:</b> the single-counter protocol above.</p>",
  "key": "One bit of shared memory suffices if exactly one agent is allowed to reset it and everyone else signals exactly once."
 },
 {
  "id": "brain-004",
  "cat": "brainteasers",
  "diff": 3,
  "title": "100 prisoners and 100 boxes",
  "tags": [
   "prisoners",
   "permutations",
   "cycles",
   "probability"
  ],
  "prompt": "<p>100 prisoners are numbered 1–100. A room holds 100 closed boxes, numbered 1–100, containing the prisoners' numbers in a uniformly random arrangement (one number per box). One at a time, each prisoner enters, opens at most <b>50</b> boxes, and leaves the room exactly as found, with no communication afterwards. All are freed only if <b>every</b> prisoner finds his own number.</p>\n<p>Using the optimal strategy (each prisoner starts at the box with his own number and then follows the number he finds), what is the probability that all prisoners are freed? Give 4 decimals.</p>",
  "answer": {
   "type": "numeric",
   "value": 0.31182782068,
   "display": "1 − (1/51 + 1/52 + … + 1/100) ≈ 0.3118",
   "tolAbs": 0.002
  },
  "hints": [
   "Following the pointer chain from your own box traces the cycle of the permutation that contains your number.",
   "Everyone succeeds iff the random permutation has no cycle longer than 50. Count permutations with a cycle of length k > 50."
  ],
  "solution": "<ol>\n<li>The box contents define a random permutation σ of {1,…,100}. Prisoner i opens box i, sees σ(i), opens box σ(i), and so on. He is walking around the cycle of σ that contains i, and he finds his number exactly when he gets back to the start, i.e. after (cycle length) boxes.</li>\n<li>So prisoner i succeeds iff his cycle has length ≤ 50, and <b>all</b> succeed iff σ has no cycle of length > 50.</li>\n<li>At most one cycle can exceed 50. The number of permutations of n = 100 with a specific cycle of length k > 50 is C(100,k)·(k−1)!·(100−k)! = 100!/k. So P(longest cycle = k) = 1/k.</li>\n<li>P(fail) = ∑<sub>k=51</sub><sup>100</sup> 1/k = H<sub>100</sub> − H<sub>50</sub> ≈ 0.6882.</li>\n<li>P(all freed) = 1 − 0.6882 ≈ <b>0.3118</b>. (As n → ∞ this tends to 1 − ln 2 ≈ 0.307.)</li>\n</ol>\n<p>Compare with independent random guessing: (1/2)<sup>100</sup> ≈ 8·10<sup>−31</sup>.</p>",
  "key": "The pointer-chasing strategy correlates everyone's success: all win iff the permutation has no cycle longer than 50, probability 1 − (H₁₀₀ − H₅₀)."
 },
 {
  "id": "brain-005",
  "cat": "brainteasers",
  "diff": 1,
  "title": "Nine coins, one heavier",
  "tags": [
   "weighing",
   "balance",
   "information"
  ],
  "prompt": "<p>You have 9 identical-looking coins; exactly one is slightly <b>heavier</b>. Using a two-pan balance (no weights), what is the minimum number of weighings that <b>guarantees</b> you find the heavy coin?</p>",
  "answer": {
   "type": "numeric",
   "value": 2.0,
   "display": "2"
  },
  "hints": [
   "Each weighing has three outcomes: left heavy, right heavy, balance.",
   "Split into three groups of three."
  ],
  "solution": "<ol>\n<li>Each weighing gives one of 3 outcomes, so w weighings distinguish at most 3<sup>w</sup> cases. With 9 candidates we need 3<sup>w</sup> ≥ 9, so w ≥ 2. One weighing (3 outcomes) cannot separate 9 cases.</li>\n<li>Two suffice: weigh coins {1,2,3} vs {4,5,6}. If one side is heavier, the heavy coin is among those three; if they balance, it is among {7,8,9}.</li>\n<li>From the 3 suspects, weigh one against another: the heavier one is fake; if they balance, it is the third.</li>\n</ol>\n<p><b>Answer: 2 weighings.</b></p>",
  "key": "A balance is a ternary device: w weighings separate up to 3ʷ possibilities, so split into thirds."
 },
 {
  "id": "brain-006",
  "cat": "brainteasers",
  "diff": 3,
  "title": "Twelve coins, heavier or lighter",
  "tags": [
   "weighing",
   "balance",
   "information",
   "strategy"
  ],
  "prompt": "<p>You have 12 coins; exactly one is counterfeit and is either <b>heavier or lighter</b> (you don't know which). With a two-pan balance and exactly <b>3 weighings</b>, identify the counterfeit coin <b>and</b> whether it is heavier or lighter. Describe a strategy.</p>",
  "answer": {
   "type": "self",
   "display": "Weigh 1234 vs 5678. If balanced, fake is in 9–12: weigh 9,10,11 vs 1,2,3 (known good), then one more. If unbalanced, weigh 1,2,5 vs 3,6,G (G a known-good coin) and resolve with the third weighing."
  },
  "hints": [
   "There are 24 cases (12 coins × heavy/light) and 3³ = 27 outcomes, so every weighing must split the remaining cases as evenly as possible (≤ 9, ≤ 3, ≤ 1).",
   "After an unbalanced first weighing, move some coins across pans, swap some for known-good coins, and leave some off."
  ],
  "solution": "<p>Counting: 24 hypotheses ≤ 27 outcomes, so it is possible only if each weighing splits cases into groups of size ≤ 9, then ≤ 3, then ≤ 1.</p>\n<p><b>Weighing 1:</b> {1,2,3,4} vs {5,6,7,8}.</p>\n<p><b>Case A — balance.</b> Coins 1–8 are genuine; fake is in 9–12 (8 cases). Weigh {9,10,11} vs {1,2,3}.</p>\n<ul>\n<li>Balance → coin 12 is fake; weigh 12 vs 1 to learn heavy/light.</li>\n<li>Left heavy → one of 9,10,11 is heavy; weigh 9 vs 10: the heavier is fake, or 11 if balanced.</li>\n<li>Left light → same with “lighter”.</li>\n</ul>\n<p><b>Case B — left side heavy</b> (so either one of 1–4 is heavy or one of 5–8 is light; 8 cases). Weigh {1,2,5} vs {3,6,9} (9 is genuine).</p>\n<ul>\n<li>Left heavy → 1 heavy, 2 heavy, or 6 light. Weigh 1 vs 2: heavier one is fake (heavy); balance → 6 is light.</li>\n<li>Right heavy → 3 heavy or 5 light. Weigh 3 vs 9: if heavy, 3 is heavy; if balanced, 5 is light.</li>\n<li>Balance → 4 heavy, 7 light, or 8 light. Weigh 7 vs 8: the lighter is fake; balance → 4 is heavy.</li>\n</ul>\n<p><b>Case C — right side heavy:</b> symmetric to B with roles swapped.</p>\n<p>In every branch, after 3 weighings exactly one hypothesis remains. In fact (3<sup>w</sup> − 3)/2 = 12 is the largest number of coins solvable this way with w = 3.</p>",
  "key": "Count hypotheses vs outcomes (24 ≤ 27) and design each weighing to split the remaining cases into thirds, using rotation and known-good coins."
 },
 {
  "id": "brain-007",
  "cat": "brainteasers",
  "diff": 2,
  "title": "Ants on a stick",
  "tags": [
   "ants",
   "symmetry",
   "relabeling"
  ],
  "prompt": "<p>100 ants are placed at arbitrary positions on a 1-metre stick (endpoints allowed), each facing left or right arbitrarily. All walk at 1 cm/s. When two ants meet, both instantly reverse direction. An ant falls off when it walks past an end.</p>\n<p>Over all possible starting configurations, what is the longest time (in seconds) you might have to wait until every ant has fallen off?</p>",
  "answer": {
   "type": "numeric",
   "value": 100.0,
   "display": "100 s"
  },
  "hints": [
   "Two ants bouncing off each other looks exactly like two ants passing through each other — if you ignore their names.",
   "So each 'ghost' ant walks straight to the end it faces."
  ],
  "solution": "<ol>\n<li>When two ants collide and reverse, the set of positions and directions is identical to what it would be if they had simply walked through each other. Only the labels differ.</li>\n<li>So treat the ants as ghosts that pass through one another. Each ghost walks straight off the end it faces, taking (distance to that end)/1 cm/s.</li>\n<li>The stick is empty when the last ghost falls off, after max over ants of distance-to-facing-end, which is at most 100 cm → 100 s.</li>\n<li>This is attained: an ant at the left end facing right needs 100 s.</li>\n</ol>\n<p><b>Answer: 100 seconds</b>, no matter how many ants or collisions.</p>",
  "key": "Collisions that swap directions are equivalent to ants passing through each other; relabeling removes the interactions."
 },
 {
  "id": "brain-008",
  "cat": "brainteasers",
  "diff": 2,
  "title": "Bridge and torch",
  "tags": [
   "river-crossing",
   "optimization",
   "greedy"
  ],
  "prompt": "<p>Four people must cross a rickety bridge at night. At most <b>two</b> can be on the bridge at once, and any crossing needs the single torch, which must be walked back (it cannot be thrown). They take 1, 2, 5 and 10 minutes to cross individually; a pair moves at the slower person's pace.</p>\n<p>What is the minimum total time (in minutes) for all four to cross?</p>",
  "answer": {
   "type": "numeric",
   "value": 17.0,
   "display": "17 minutes"
  },
  "hints": [
   "The obvious plan — 1 escorts everyone — costs 10 + 1 + 5 + 1 + 2 = 19. Can the two slowest cross together?",
   "Send the two fastest first, so a fast person is waiting on the far side to bring the torch back."
  ],
  "solution": "<ol>\n<li>1 and 2 cross: 2 min.</li>\n<li>1 returns with the torch: 1 min (total 3).</li>\n<li>5 and 10 cross together: 10 min (total 13).</li>\n<li>2 returns: 2 min (total 15).</li>\n<li>1 and 2 cross: 2 min (total 17).</li>\n</ol>\n<p>Pairing the two slowest saves 5 minutes versus having 1 escort each (19 min). An exhaustive search confirms nothing beats 17.</p>\n<p><b>Answer: 17 minutes.</b></p>",
  "key": "Make the two slowest cross together, with the two fastest acting as torch shuttles."
 },
 {
  "id": "brain-009",
  "cat": "brainteasers",
  "diff": 1,
  "title": "100 lockers",
  "tags": [
   "divisors",
   "perfect-squares",
   "number-theory"
  ],
  "prompt": "<p>A hallway has 100 closed lockers numbered 1–100. Student 1 opens every locker. Student 2 toggles every 2nd locker (2, 4, 6, …). Student 3 toggles every 3rd locker, and so on, until student 100 toggles locker 100.</p>\n<p>How many lockers are open at the end?</p>",
  "answer": {
   "type": "numeric",
   "value": 10.0,
   "display": "10"
  },
  "hints": [
   "Locker n is toggled once for each divisor of n.",
   "Which numbers have an odd number of divisors?"
  ],
  "solution": "<ol>\n<li>Locker n is toggled by student d exactly when d divides n, so it is toggled d(n) times, where d(n) is its number of divisors.</li>\n<li>It ends open iff d(n) is odd.</li>\n<li>Divisors come in pairs (d, n/d). The pair collapses to a single divisor only when d = n/d, i.e. n is a perfect square. So d(n) is odd iff n is a perfect square.</li>\n<li>Perfect squares ≤ 100: 1, 4, 9, …, 100. That is <b>10</b> lockers.</li>\n</ol>",
  "key": "Divisors pair up except at √n, so only perfect squares are toggled an odd number of times."
 },
 {
  "id": "brain-010",
  "cat": "brainteasers",
  "diff": 2,
  "title": "Two eggs, 100 floors",
  "tags": [
   "dynamic-programming",
   "optimization",
   "worst-case"
  ],
  "prompt": "<p>You have 2 identical eggs and a 100-floor building. There is a critical floor F (0 ≤ F ≤ 100): an egg dropped from a floor above F breaks, and one dropped from floor F or below survives (and can be reused). What is the minimum number of drops that guarantees you determine F in the worst case?</p>",
  "answer": {
   "type": "numeric",
   "value": 14.0,
   "display": "14"
  },
  "hints": [
   "Once the first egg breaks, the second must scan linearly from the last safe floor upward.",
   "If you allow d drops in total, the first drop should be from floor d, the next from d + (d−1), and so on. You need d + (d−1) + … + 1 ≥ 100."
  ],
  "solution": "<ol>\n<li>Suppose you can afford at most d drops. Drop egg 1 from floor d: if it breaks, egg 2 checks floors 1…d−1 one by one, which is d−1 more drops. Total ≤ d.</li>\n<li>If it survives, you have d−1 drops left, so the next drop of egg 1 can go up d−1 more floors, then d−2, and so on.</li>\n<li>So d drops cover d + (d−1) + … + 1 = d(d+1)/2 floors. We need d(d+1)/2 ≥ 100.</li>\n<li>13·14/2 = 91 &lt; 100 and 14·15/2 = 105 ≥ 100, so d = <b>14</b>. One schedule: floors 14, 27, 39, 50, 60, 69, 77, 84, 90, 95, 99, 100.</li>\n</ol>",
  "key": "Balance the worst case: decrease the jump by one after each safe drop, so d drops cover d(d+1)/2 floors."
 },
 {
  "id": "brain-011",
  "cat": "brainteasers",
  "diff": 2,
  "title": "Clock hands overlapping",
  "tags": [
   "clock",
   "relative-speed",
   "counting"
  ],
  "prompt": "<p>On an analog clock, how many times do the hour and minute hands exactly overlap during a 12-hour period (count the times t in [12:00, 12:00 + 12 h), so 12:00 is counted once)?</p>",
  "answer": {
   "type": "numeric",
   "value": 11.0,
   "display": "11"
  },
  "hints": [
   "The minute hand gains on the hour hand at 360° − 30° = 330° per hour.",
   "How many full laps does it gain in 12 hours?"
  ],
  "solution": "<ol>\n<li>The minute hand moves 360°/h and the hour hand 30°/h, so the minute hand gains 330°/h on the hour hand.</li>\n<li>The hands overlap each time the gain is a multiple of 360°, i.e. every 360/330 = 12/11 h ≈ 1 h 5 min 27 s.</li>\n<li>In 12 hours the gain is 12·330 = 3960° = 11 full laps, so overlaps occur at t = 0, 12/11, 24/11, …, 120/11 h: <b>11</b> times. (There is no overlap between 11:00 and 12:00 except at 12:00 itself.)</li>\n</ol>",
  "key": "Use relative speed: the minute hand laps the hour hand 11 times every 12 hours."
 },
 {
  "id": "brain-012",
  "cat": "brainteasers",
  "diff": 2,
  "title": "Right angles in a day",
  "tags": [
   "clock",
   "relative-speed",
   "counting"
  ],
  "prompt": "<p>How many times in a full 24-hour day (from midnight inclusive to the next midnight exclusive) do the hour and minute hands of a clock form an exact right angle (90°)?</p>",
  "answer": {
   "type": "numeric",
   "value": 44.0,
   "display": "44"
  },
  "hints": [
   "The relative angle grows at 330° per hour. Every lap it passes 90° once and 270° once.",
   "How many relative laps happen in 24 hours?"
  ],
  "solution": "<ol>\n<li>The relative angle (minute − hour) increases at 330°/h. It is a right angle when it equals 90° or 270° (mod 360°).</li>\n<li>In 24 h the relative angle increases by 24·330 = 7920° = 22 full laps.</li>\n<li>Each lap passes 90° once and 270° once, and at midnight the angle is 0, which is not a right angle. So there are 2·22 = <b>44</b> right angles.</li>\n<li>Note that it is not 48: 3:00 and 9:00 are right angles, but the hands lose slots around them because the hour hand moves.</li>\n</ol>",
  "key": "Two right angles per relative lap, 22 relative laps per day → 44."
 },
 {
  "id": "brain-013",
  "cat": "brainteasers",
  "diff": 1,
  "title": "Angle at 3:15",
  "tags": [
   "clock",
   "angles",
   "mental-math"
  ],
  "prompt": "<p>What is the angle, in degrees, between the hour and minute hands of a clock at exactly 3:15?</p>",
  "answer": {
   "type": "numeric",
   "value": 7.5,
   "display": "7.5°"
  },
  "hints": [
   "At 3:15 the minute hand is exactly on the 3. Where is the hour hand?",
   "The hour hand moves 0.5° per minute."
  ],
  "solution": "<ol>\n<li>Minute hand at 15 min: 15·6° = 90°.</li>\n<li>Hour hand: 3·30° + 15·0.5° = 90° + 7.5° = 97.5°.</li>\n<li>Difference: <b>7.5°</b>.</li>\n</ol>",
  "key": "The hour hand moves 0.5° per minute, so it is never exactly on the hour mark except on the hour."
 },
 {
  "id": "brain-014",
  "cat": "brainteasers",
  "diff": 2,
  "title": "25 horses, 5 tracks",
  "tags": [
   "tournament",
   "elimination",
   "ordering"
  ],
  "prompt": "<p>You have 25 horses and a track that races 5 at a time. Races give only the finishing order (no times), and each horse runs at a fixed speed. What is the minimum number of races needed to find the <b>3 fastest</b> horses, in order?</p>",
  "answer": {
   "type": "numeric",
   "value": 7.0,
   "display": "7"
  },
  "hints": [
   "Race 5 groups of 5, then race the 5 group winners.",
   "After 6 races, only a handful of horses can still be in the top 3. Count them."
  ],
  "solution": "<ol>\n<li><b>Races 1–5:</b> split into groups A–E and race each group. Label horses A1…A5 by finish within group A, and so on.</li>\n<li><b>Race 6:</b> race the five winners A1…E1. Relabel groups so the finish order is A1 &gt; B1 &gt; C1 &gt; D1 &gt; E1. A1 is the fastest overall.</li>\n<li>Eliminate: groups D and E entirely (D1 already has 3 faster horses ahead of it); C2 and lower (behind C1, B1, A1); B3 and lower (behind B2, B1, A1); A4 and lower.</li>\n<li>Candidates for 2nd and 3rd: A2, A3, B1, B2, C1. That is exactly 5 horses. <b>Race 7</b> them; the top two are 2nd and 3rd overall.</li>\n<li><b>Why not 6?</b> Every horse must race at least once (5 races), and certifying the overall winner needs the group winners compared (a 6th race). In the worst case 5 candidates for 2nd/3rd still remain after that, so a 7th race is unavoidable.</li>\n</ol>\n<p><b>Answer: 7 races.</b></p>",
  "key": "After group races and a winners' race, prune with a 'how many horses are provably faster' argument — only 5 candidates remain."
 },
 {
  "id": "brain-015",
  "cat": "brainteasers",
  "diff": 2,
  "title": "Poisoned wine",
  "tags": [
   "binary",
   "encoding",
   "information"
  ],
  "prompt": "<p>A king has 1000 bottles of wine; exactly one is poisoned. The poison kills exactly 24 hours after even a drop is drunk, and the party starts in a little over 24 hours, so there is time for only one round of tasting. Each prisoner may sip from any number of bottles. What is the minimum number of prisoners needed to identify the poisoned bottle with certainty?</p>",
  "answer": {
   "type": "numeric",
   "value": 10.0,
   "display": "10"
  },
  "hints": [
   "Each prisoner's outcome is one bit: dies or survives.",
   "Number the bottles in binary."
  ],
  "solution": "<ol>\n<li>With one round, each prisoner yields one bit (alive/dead), so k prisoners give at most 2<sup>k</sup> distinguishable outcomes. We need 2<sup>k</sup> ≥ 1000, so k ≥ 10 (2<sup>9</sup> = 512 &lt; 1000 ≤ 1024 = 2<sup>10</sup>).</li>\n<li>10 suffice: write bottle numbers 0–999 in 10-bit binary. Prisoner j sips from every bottle whose j-th bit is 1.</li>\n<li>After 24 h, the set of dead prisoners spells the poisoned bottle's binary number.</li>\n</ol>\n<p><b>Answer: 10 prisoners.</b></p>",
  "key": "Each taster is one bit of information; binary-encode the bottles."
 },
 {
  "id": "brain-016",
  "cat": "brainteasers",
  "diff": 1,
  "title": "Water jugs: 3 L and 5 L",
  "tags": [
   "jugs",
   "bfs",
   "number-theory"
  ],
  "prompt": "<p>You have a 3-litre jug, a 5-litre jug (no markings) and an unlimited tap. Each <b>step</b> is one of: fill a jug completely, empty a jug, or pour from one jug into the other until the source is empty or the target is full. What is the minimum number of steps to have exactly 4 litres in a jug?</p>",
  "answer": {
   "type": "numeric",
   "value": 6.0,
   "display": "6 steps"
  },
  "hints": [
   "Try filling the 5 L jug first and pouring into the 3 L jug.",
   "4 = 2·5 − 2·3: fill the 5 twice, empty the 3 twice."
  ],
  "solution": "<p>Track (3 L jug, 5 L jug):</p>\n<ol>\n<li>Fill 5 → (0, 5)</li>\n<li>Pour 5 → 3 → (3, 2)</li>\n<li>Empty 3 → (0, 2)</li>\n<li>Pour 5 → 3 → (2, 0)</li>\n<li>Fill 5 → (2, 5)</li>\n<li>Pour 5 → 3 until full (1 L moves) → (3, <b>4</b>)</li>\n</ol>\n<p>Starting with the 3 L jug takes 8 steps instead; a breadth-first search over all states confirms 6 is minimal.</p>\n<p><b>Answer: 6 steps.</b></p>",
  "key": "Reachable amounts are combinations of 5 and 3 (gcd 1); BFS over (a, b) states gives the shortest sequence."
 },
 {
  "id": "brain-017",
  "cat": "brainteasers",
  "diff": 2,
  "title": "Two guards, two doors",
  "tags": [
   "logic",
   "liars",
   "self-reference"
  ],
  "prompt": "<p>Two doors: one leads to freedom, the other to doom. Each door has a guard. One guard always tells the truth, the other always lies, and you don't know which is which. You may ask <b>one</b> yes/no question to <b>one</b> guard. What do you ask to find the door to freedom?</p>",
  "answer": {
   "type": "self",
   "display": "Point at a door and ask: 'If I asked the other guard whether this door leads to freedom, would he say yes?' Then do the opposite of the answer (or ask 'Which door would the other guard say leads to freedom?' and take the other door)."
  },
  "hints": [
   "Make the answer pass through both guards, so exactly one lie is applied either way.",
   "Ask about what the other guard would say."
  ],
  "solution": "<ol>\n<li>Ask either guard: “Which door would the <i>other</i> guard say leads to freedom?”</li>\n<li>If you asked the truth-teller, he truthfully reports the liar's false answer → the doom door.</li>\n<li>If you asked the liar, he lies about the truth-teller's correct answer → the doom door.</li>\n<li>Either way you are pointed at doom, so take the <b>other</b> door.</li>\n</ol>\n<p>An alternative: “If I asked you whether the left door leads to freedom, would you say yes?” A double negation makes both guards answer truthfully.</p>",
  "key": "Route the question through both guards (or through the same liar twice) so the lies cancel or compose predictably."
 },
 {
  "id": "brain-018",
  "cat": "brainteasers",
  "diff": 1,
  "title": "Mutilated chessboard",
  "tags": [
   "invariant",
   "coloring",
   "tiling"
  ],
  "prompt": "<p>Two diagonally opposite corner squares are removed from an 8×8 chessboard, leaving 62 squares. Can the remaining board be tiled exactly by 31 dominoes (each covering two adjacent squares)?</p>",
  "answer": {
   "type": "choice",
   "options": [
    "Yes",
    "No — it is impossible",
    "Only if dominoes may overlap the edge"
   ],
   "correct": 1,
   "display": "No — a coloring argument shows it is impossible"
  },
  "hints": [
   "What colors are two diagonally opposite corners?",
   "Every domino covers one black and one white square."
  ],
  "solution": "<ol>\n<li>Opposite corners of a chessboard have the <b>same</b> color (say both white).</li>\n<li>After removal there are 30 white and 32 black squares.</li>\n<li>Every domino covers one white and one black square, so 31 dominoes would cover 31 of each.</li>\n<li>31 ≠ 30, so no tiling exists.</li>\n</ol>\n<p><b>Answer: No.</b></p>",
  "key": "Find an invariant (here, color balance) that every move preserves but the target violates."
 },
 {
  "id": "brain-019",
  "cat": "brainteasers",
  "diff": 3,
  "title": "Blue-eyed islanders",
  "tags": [
   "common-knowledge",
   "induction",
   "logic"
  ],
  "prompt": "<p>An island has 100 blue-eyed and 100 brown-eyed people, all perfect logicians. Nobody knows their own eye color, there are no mirrors, and nobody discusses eye color. Every night a ferry comes, and anyone who <b>knows</b> their own eye color must leave on it. Everyone sees everyone else every day.</p>\n<p>One day a visitor announces publicly: “I see at least one person with blue eyes.” On which night (counting the announcement day's night as night 1) do the blue-eyed people leave?</p>",
  "answer": {
   "type": "numeric",
   "value": 100.0,
   "display": "Night 100 (all 100 blue-eyed leave together)"
  },
  "hints": [
   "Solve it with 1 blue-eyed person, then 2, then 3.",
   "With n blue-eyed people, each one sees n−1 and waits to see whether those n−1 leave on night n−1."
  ],
  "solution": "<ol>\n<li><b>n = 1:</b> The lone blue-eyed person sees no blue eyes, so the announcement tells him it is him. He leaves on night 1.</li>\n<li><b>n = 2:</b> Each blue-eyed person sees one other. If he were not blue, the other would be the n = 1 case and leave on night 1. When nobody leaves on night 1, each deduces he is blue. Both leave on night 2.</li>\n<li><b>Induction:</b> if n blue-eyed people would leave on night n, then with n+1 blue-eyed people each sees n and expects them to leave on night n. When they don't, each concludes he is also blue, and all n+1 leave on night n+1.</li>\n<li>With 100 blue-eyed people they all leave on <b>night 100</b>. (The brown-eyed people then know they are not blue, though without further information they cannot deduce “brown” itself.)</li>\n</ol>\n<p>The announcement seems to add nothing (everyone already sees blue eyes), but it makes the fact <i>common knowledge</i>, which starts the countdown.</p>",
  "key": "A public announcement creates common knowledge; induction on the number of blue-eyed people gives a countdown of n nights."
 },
 {
  "id": "brain-020",
  "cat": "brainteasers",
  "diff": 1,
  "title": "Three switches, one bulb",
  "tags": [
   "logic",
   "information",
   "lateral-thinking"
  ],
  "prompt": "<p>Outside a closed room are three light switches; exactly one controls an incandescent bulb inside. You may set the switches however you like, but you may enter the room only <b>once</b>. How do you determine which switch controls the bulb?</p>",
  "answer": {
   "type": "self",
   "display": "Turn switch 1 on for ~10 minutes, turn it off, turn switch 2 on, enter: on → 2; off and warm → 1; off and cold → 3."
  },
  "hints": [
   "A bulb has more observable states than on/off.",
   "Incandescent bulbs get hot."
  ],
  "solution": "<ol>\n<li>Turn switch 1 on and wait about 10 minutes.</li>\n<li>Turn switch 1 off and turn switch 2 on, then enter the room.</li>\n<li>Bulb on → switch 2. Bulb off but warm → switch 1. Bulb off and cold → switch 3.</li>\n</ol>\n<p>A single observation gives three outcomes only because heat adds a second dimension of information.</p>",
  "key": "Find a second observable (heat) so one observation can distinguish three cases."
 },
 {
  "id": "brain-021",
  "cat": "brainteasers",
  "diff": 2,
  "title": "Blindfolded coin split",
  "tags": [
   "invariant",
   "parity",
   "construction"
  ],
  "prompt": "<p>You are blindfolded at a table with 100 coins; exactly 10 show heads. You can't see or feel which side is up, but you can move and flip coins. Split the coins into two piles with the <b>same number of heads</b>.</p>",
  "answer": {
   "type": "self",
   "display": "Take any 10 coins as pile A and flip all of them; the other 90 are pile B. Both piles then have the same number of heads."
  },
  "hints": [
   "Choose the size of one pile cleverly: it should match the number of heads.",
   "If pile A has k heads among its 10 coins, how many heads does pile B have?"
  ],
  "solution": "<ol>\n<li>Take any 10 coins as pile A; the remaining 90 form pile B.</li>\n<li>Suppose pile A contains k heads. Then pile B contains 10 − k heads.</li>\n<li>Pile A has 10 − k tails. Flip every coin in pile A: it now has 10 − k heads.</li>\n<li>Both piles have 10 − k heads.</li>\n</ol>",
  "key": "Size one pile equal to the total head count; flipping it converts its tails count into exactly the other pile's heads count."
 },
 {
  "id": "brain-022",
  "cat": "brainteasers",
  "diff": 3,
  "title": "Hats in a line",
  "tags": [
   "parity",
   "strategy",
   "prisoners",
   "hats"
  ],
  "prompt": "<p>100 prisoners stand in a line, each wearing a black or white hat assigned arbitrarily. Each sees all hats <b>in front</b> of him, but not his own or those behind. Starting from the back, each prisoner in turn says “black” or “white” aloud (everyone hears). Those who say their own hat color survive.</p>\n<p>With the best pre-agreed strategy, how many prisoners can be <b>guaranteed</b> to survive?</p>",
  "answer": {
   "type": "numeric",
   "value": 99.0,
   "display": "99"
  },
  "hints": [
   "The last prisoner can't learn anything about his own hat, but he can broadcast one bit to everyone else.",
   "Use parity: say 'black' if the number of black hats you see is odd."
  ],
  "solution": "<ol>\n<li>The back prisoner says “black” if he sees an odd number of black hats, else “white”. He survives only by luck (50%).</li>\n<li>The next prisoner sees the hats ahead and knows the parity the back prisoner saw. If the parity he sees differs, his own hat is black; otherwise it is white. He answers correctly.</li>\n<li>Each later prisoner tracks the announced parity and all the (correct) answers spoken after it, so he can deduce his own hat. All 99 answer correctly.</li>\n<li>No strategy can guarantee the back prisoner: nobody gives him any information, and the adversary can choose his hat to defeat his answer.</li>\n</ol>\n<p><b>Answer: 99 guaranteed</b> (100 with probability 1/2).</p>",
  "key": "One public parity bit lets everyone else decode their own hat from what they see and hear."
 },
 {
  "id": "fermi-001",
  "cat": "fermi",
  "diff": 2,
  "title": "Piano tuners in Montreal",
  "tags": [
   "fermi",
   "supply-demand",
   "classic"
  ],
  "prompt": "<p>Estimate the number of full-time piano tuners working in the Montreal metropolitan area.</p><p><i>Give a single number; k/m/b suffixes like 2.5m are OK.</i></p>",
  "answer": {
   "type": "numeric",
   "value": 100.0,
   "display": "~ 100 (accept 30–300)",
   "range": [
    30,
    300
   ]
  },
  "hints": [
   "Demand side: how many pianos, and how often is each tuned?",
   "Supply side: how many tunings can one tuner do in a year?"
  ],
  "solution": "<p><b>Demand.</b></p>\n<ol>\n<li>Metro population ≈ 4.3 million; about 2.3 people per household → ≈ 1.87 million households.</li>\n<li>About 1 in 20 households owns a piano → ≈ 93,500 pianos. Add schools, churches, venues and studios, ≈ 6,500 → ≈ 100,000 pianos.</li>\n<li>Pianos are tuned about once a year on average → ≈ 100,000 tunings per year.</li>\n</ol>\n<p><b>Supply.</b> A tuner does about 4 tunings a day (2 h each including travel), 5 days a week, 48 weeks a year → 4·5·48 = 960 ≈ 1,000 tunings per year.</p>\n<p><b>Estimate:</b> 100,000 / 960 ≈ <b>100 tuners</b>. Anything from ~30 to ~300 is a reasonable answer; interviewers grade the decomposition and the sanity checks.</p>",
  "key": "Match annual demand (pianos × tunings per piano) to annual supply per worker."
 },
 {
  "id": "fermi-002",
  "cat": "fermi",
  "diff": 2,
  "title": "Gas stations in Canada",
  "tags": [
   "fermi",
   "supply-demand",
   "transport"
  ],
  "prompt": "<p>Estimate the number of retail gas stations in Canada.</p><p><i>Give a single number; k/m/b suffixes like 2.5m are OK.</i></p>",
  "answer": {
   "type": "numeric",
   "value": 12000.0,
   "display": "~ 12,000 (accept 5,000–30,000)",
   "range": [
    5000,
    30000
   ]
  },
  "hints": [
   "How many cars are there, and how often does each one fill up?",
   "How many fill-ups can a typical station serve per day?"
  ],
  "solution": "<ol>\n<li>Population ≈ 40 million; about 0.65 light vehicles per person → ≈ 26 million vehicles.</li>\n<li>A vehicle fills up about once a week → 26M / 7 ≈ 3.7 million fill-ups per day.</li>\n<li>A typical station has ~6 pumps, each busy about a quarter of 16 open hours (240 min), at ~5 min per fill → 6 × 240 / 5 ≈ 290, call it 300 fill-ups per day.</li>\n<li>3.7M / 300 ≈ <b>12,000 stations</b>.</li>\n</ol>\n<p>Industry counts put Canada at roughly 11,000–12,000 retail stations, so the estimate is right on.</p>",
  "key": "Stations = (vehicles × fill-ups per vehicle per day) / fill-ups one station can serve per day."
 },
 {
  "id": "fermi-003",
  "cat": "fermi",
  "diff": 2,
  "title": "Golf balls in a school bus",
  "tags": [
   "fermi",
   "volume",
   "packing",
   "classic"
  ],
  "prompt": "<p>How many golf balls fit inside an empty yellow school bus (seats left in)?</p><p><i>Give a single number; k/m/b suffixes like 2.5m are OK.</i></p>",
  "answer": {
   "type": "numeric",
   "value": 600000.0,
   "display": "~ 600,000 (accept 250k–1.5m)",
   "range": [
    250000,
    1500000
   ]
  },
  "hints": [
   "Estimate the interior volume of the bus, then the effective volume each ball takes up.",
   "Randomly packed spheres fill about 64% of the space."
  ],
  "solution": "<ol>\n<li>Interior ≈ 10 m long × 2.4 m wide × 1.9 m high ≈ 45.6 m³. Seats, wheel wells and the driver area take ≈ 15% → ≈ 38.8 m³ ≈ 3.9·10<sup>7</sup> cm³.</li>\n<li>Golf ball diameter ≈ 4.27 cm → volume (4/3)π(2.135)³ ≈ 40.8 cm³.</li>\n<li>Random packing density ≈ 0.64 → each ball effectively occupies 40.8 / 0.64 ≈ 63.7 cm³.</li>\n<li>3.88·10<sup>7</sup> / 63.7 ≈ 6.1·10<sup>5</sup> → <b>about 600,000 golf balls</b>.</li>\n</ol>\n<p>A quick check: a ball is ≈ 4 cm across, so ~1/(0.04)³ ≈ 15,600 cubes per m³ (~10,000 balls/m³ with packing) × ~40 m³ ≈ 400,000–600,000. Same order of magnitude.</p>",
  "key": "Usable volume ÷ (ball volume ÷ packing fraction)."
 },
 {
  "id": "fermi-004",
  "cat": "fermi",
  "diff": 2,
  "title": "Coffees bought in Montreal per day",
  "tags": [
   "fermi",
   "consumer",
   "montreal"
  ],
  "prompt": "<p>Estimate how many cups of coffee are <b>bought</b> (cafés, restaurants, chains, vending, etc.) in the Montreal metropolitan area on a typical weekday.</p><p><i>Give a single number; k/m/b suffixes like 2.5m are OK.</i></p>",
  "answer": {
   "type": "numeric",
   "value": 1100000.0,
   "display": "~ 1.1 million (accept 350k–3.5m)",
   "range": [
    350000,
    3500000
   ]
  },
  "hints": [
   "Start from total coffee consumption, then estimate the fraction that is purchased rather than brewed at home or at work.",
   "Adults × share who drink coffee × cups per drinker."
  ],
  "solution": "<ol>\n<li>Metro population ≈ 4.3M; adults ≈ 80% → ≈ 3.44M.</li>\n<li>About 65% of adults drink coffee → ≈ 2.24M drinkers.</li>\n<li>About 2 cups per drinker per day → ≈ 4.47M cups consumed.</li>\n<li>Roughly a quarter of cups are bought out → 4.47M × 0.25 ≈ <b>1.1 million cups per day</b>.</li>\n</ol>\n<p>Sanity check: ~1,500 coffee-selling outlets (chains plus independents) at ~700 cups/day ≈ 1M. Consistent.</p>",
  "key": "Population funnel (adults → drinkers → cups) times the purchased share, cross-checked from the supply side (outlets × cups per outlet)."
 },
 {
  "id": "fermi-005",
  "cat": "fermi",
  "diff": 1,
  "title": "Water in an Olympic pool",
  "tags": [
   "fermi",
   "volume",
   "units"
  ],
  "prompt": "<p>Roughly how many litres of water does an Olympic swimming pool hold?</p><p><i>Give a single number; k/m/b suffixes like 2.5m are OK.</i></p>",
  "answer": {
   "type": "numeric",
   "value": 2500000.0,
   "display": "~ 2.5 million L (accept 1.8m–4m)",
   "range": [
    1800000,
    4000000
   ]
  },
  "hints": [
   "An Olympic pool is 50 m long with 10 lanes of 2.5 m.",
   "1 m³ = 1,000 litres."
  ],
  "solution": "<ol>\n<li>Dimensions: 50 m × 25 m, depth ≈ 2 m (the minimum standard; 3 m is recommended).</li>\n<li>Volume = 50 × 25 × 2 = 2,500 m³.</li>\n<li>1 m³ = 1,000 L → <b>2.5 million litres</b>. A 3 m deep pool holds 3.75M L.</li>\n</ol>\n<p>“2.5 million litres” is the standard quoted figure.</p>",
  "key": "Length × width × depth, then convert: 1 m³ = 1,000 L."
 },
 {
  "id": "fermi-006",
  "cat": "fermi",
  "diff": 1,
  "title": "Mass of air in a classroom",
  "tags": [
   "fermi",
   "physics",
   "density"
  ],
  "prompt": "<p>Estimate the mass, in <b>kilograms</b>, of the air inside a typical university classroom about 10 m × 8 m × 3 m.</p><p><i>Give a single number; k/m/b suffixes like 2.5m are OK.</i></p>",
  "answer": {
   "type": "numeric",
   "value": 290.0,
   "display": "~ 290 kg (accept 150–600)",
   "range": [
    150,
    600
   ]
  },
  "hints": [
   "Air density at room temperature and sea level is about 1.2 kg/m³.",
   "Volume first: 10 × 8 × 3."
  ],
  "solution": "<ol>\n<li>Volume = 10 × 8 × 3 = 240 m³.</li>\n<li>Air density ≈ 1.2 kg/m³ (from 1 mol ≈ 29 g occupying ≈ 24 L at 20 °C: 29/24 ≈ 1.2 g/L).</li>\n<li>Mass ≈ 240 × 1.2 = <b>288 kg</b>, about the mass of four adults.</li>\n</ol>",
  "key": "Air is not weightless: ~1.2 kg per cubic metre."
 },
 {
  "id": "fermi-007",
  "cat": "fermi",
  "diff": 3,
  "title": "Windows in Manhattan",
  "tags": [
   "fermi",
   "geometry",
   "cities"
  ],
  "prompt": "<p>Estimate the number of windows in Manhattan.</p><p><i>Give a single number; k/m/b suffixes like 2.5m are OK.</i></p>",
  "answer": {
   "type": "numeric",
   "value": 10000000.0,
   "display": "~ 10 million (accept 3m–30m)",
   "range": [
    3000000,
    30000000
   ]
  },
  "hints": [
   "Estimate total built floor area: land area × fraction covered by buildings × average number of floors.",
   "Then assume roughly one window per X m² of floor area."
  ],
  "solution": "<ol>\n<li>Land area ≈ 59 km² (≈ 23 sq mi).</li>\n<li>Streets, parks (Central Park alone is 3.4 km²) and open space leave ≈ 35% covered by building footprints → ≈ 20.7 km².</li>\n<li>Average height ≈ 6 floors (many 5-storey walk-ups plus towers) → floor area ≈ 20.7 × 6 ≈ 124 km² ≈ 1.24·10<sup>8</sup> m². (Published estimates of Manhattan floor area are around 9·10<sup>7</sup>–1·10<sup>8</sup> m², so this is in the right range.)</li>\n<li>About one window per 12 m² of floor area (a small room has one or two windows) → 1.24·10<sup>8</sup> / 12 ≈ <b>10 million windows</b>.</li>\n</ol>",
  "key": "Convert area to floor area via coverage × floors, then use a density of windows per floor area."
 },
 {
  "id": "fermi-008",
  "cat": "fermi",
  "diff": 1,
  "title": "Hairs on a human head",
  "tags": [
   "fermi",
   "density",
   "biology"
  ],
  "prompt": "<p>Estimate the number of hairs on a typical human head.</p><p><i>Give a single number; k/m/b suffixes like 2.5m are OK.</i></p>",
  "answer": {
   "type": "numeric",
   "value": 100000.0,
   "display": "~ 100,000 (accept 50k–200k)",
   "range": [
    50000,
    200000
   ]
  },
  "hints": [
   "Area of scalp covered by hair × hairs per cm².",
   "Hair follicles are spaced roughly 0.75 mm apart."
  ],
  "solution": "<ol>\n<li>The hair-covered scalp is roughly 25 cm × 24 cm ≈ 600 cm².</li>\n<li>Follicles roughly 0.75–0.8 mm apart → about (10/0.77)² ≈ 170 hairs per cm².</li>\n<li>600 × 170 ≈ 102,000 → <b>about 100,000 hairs</b>.</li>\n</ol>\n<p>The commonly cited figure is 90,000–150,000 depending on hair color.</p>",
  "key": "Count = area × areal density; get density from spacing (1/spacing²)."
 },
 {
  "id": "fermi-009",
  "cat": "fermi",
  "diff": 2,
  "title": "Revenue of one Tim Hortons",
  "tags": [
   "fermi",
   "business",
   "revenue"
  ],
  "prompt": "<p>Estimate the annual sales (in Canadian dollars) of a typical Tim Hortons restaurant in Canada.</p><p><i>Give a single number; k/m/b suffixes like 2.5m are OK.</i></p>",
  "answer": {
   "type": "numeric",
   "value": 2200000.0,
   "display": "~ $2.2 million (accept $800k–$5m)",
   "range": [
    800000,
    5000000
   ]
  },
  "hints": [
   "Revenue = transactions per day × average ticket × days open.",
   "Think about rush hours versus quiet hours, including the drive-thru."
  ],
  "solution": "<ol>\n<li>Open ≈ 18 hours a day (many are 24 h).</li>\n<li>Transactions: ~150/hour in the morning rush, ~20/hour late at night; average ≈ 60 per hour (drive-thru + counter) → 18 × 60 = 1,080 per day.</li>\n<li>Average ticket ≈ $5.50 (coffee plus a snack).</li>\n<li>Daily ≈ 1,080 × 5.50 ≈ $5,940 → annual ≈ 5,940 × 365 ≈ <b>$2.2 million</b>.</li>\n</ol>\n<p>Published average sales per Canadian restaurant are around $2M+, consistent with this estimate.</p>",
  "key": "Revenue = throughput × average ticket × time; split throughput into peak and off-peak to sanity-check the average."
 },
 {
  "id": "fermi-010",
  "cat": "fermi",
  "diff": 2,
  "title": "Montreal metro trips per weekday",
  "tags": [
   "fermi",
   "transport",
   "montreal"
  ],
  "prompt": "<p>Estimate the number of trips (entries) on the Montreal (STM) metro on a typical weekday.</p><p><i>Give a single number; k/m/b suffixes like 2.5m are OK.</i></p>",
  "answer": {
   "type": "numeric",
   "value": 1000000.0,
   "display": "~ 1 million (accept 400k–2.5m)",
   "range": [
    400000,
    2500000
   ]
  },
  "hints": [
   "Who is on the island on a weekday: residents plus commuters.",
   "What fraction ride the metro, and how many trips does each make?"
  ],
  "solution": "<ol>\n<li>Island population ≈ 2.0M, plus ≈ 0.3M off-island commuters on weekdays → ≈ 2.3M people.</li>\n<li>About 22% use the metro on a given weekday (students, downtown workers, errands) → ≈ 506,000 riders.</li>\n<li>About 2 trips each (there and back) → ≈ 1.0M trips.</li>\n</ol>\n<p><b>Estimate ≈ 1 million trips per weekday.</b> STM figures are of this order (well over a million before 2020, somewhat lower since).</p>",
  "key": "People present × participation rate × trips per participant."
 },
 {
  "id": "fermi-011",
  "cat": "fermi",
  "diff": 1,
  "title": "Smartphones sold in Canada per year",
  "tags": [
   "fermi",
   "consumer",
   "replacement-cycle"
  ],
  "prompt": "<p>Estimate the number of new smartphones sold in Canada each year.</p><p><i>Give a single number; k/m/b suffixes like 2.5m are OK.</i></p>",
  "answer": {
   "type": "numeric",
   "value": 11000000.0,
   "display": "~ 11 million (accept 4m–25m)",
   "range": [
    4000000,
    25000000
   ]
  },
  "hints": [
   "Steady state: annual sales ≈ installed base / replacement cycle.",
   "How long does a typical person keep a phone?"
  ],
  "solution": "<ol>\n<li>Population ≈ 40M; ≈ 85% own a smartphone → installed base ≈ 34M.</li>\n<li>Average replacement cycle ≈ 3 years.</li>\n<li>Annual sales ≈ 34M / 3 ≈ <b>11 million</b> (growth adds a little, second-hand phones subtract a little).</li>\n</ol>",
  "key": "In steady state, flow = stock / lifetime (Little's law)."
 },
 {
  "id": "fermi-012",
  "cat": "fermi",
  "diff": 2,
  "title": "Commercial flights per day worldwide",
  "tags": [
   "fermi",
   "transport",
   "littles-law"
  ],
  "prompt": "<p>Estimate the number of commercial (passenger and cargo airline) flights that take off worldwide on a typical day.</p><p><i>Give a single number; k/m/b suffixes like 2.5m are OK.</i></p>",
  "answer": {
   "type": "numeric",
   "value": 100000.0,
   "display": "~ 100,000 (accept 40k–250k)",
   "range": [
    40000,
    250000
   ]
  },
  "hints": [
   "Fleet size × flights per aircraft per day.",
   "There are a few tens of thousands of airliners in service."
  ],
  "solution": "<ol>\n<li>Active commercial fleet (mainline jets, regional jets and turboprops) ≈ 25,000 aircraft.</li>\n<li>Short-haul aircraft fly 5–7 legs per day, long-haul 1–2; a blended average ≈ 4 flights per aircraft per day.</li>\n<li>25,000 × 4 = <b>100,000 flights per day</b>.</li>\n</ol>\n<p>The commonly cited figure is roughly 100,000 flights per day.</p>",
  "key": "Throughput = fleet × utilization (legs per aircraft per day)."
 },
 {
  "id": "py-001",
  "cat": "python",
  "diff": 1,
  "title": "Mutable default argument",
  "tags": [
   "mutability",
   "functions"
  ],
  "prompt": "<p>A helper that collects values:</p><pre><code>def add(x, lst=[]):\n    lst.append(x)\n    return lst\n\nadd(1)\nadd(2)\nprint(add(3))</code></pre><p>What does this print? Type the output exactly as printed (on one line).</p>",
  "answer": {
   "type": "text",
   "accept": [
    "[1, 2, 3]",
    "[1,2,3]"
   ],
   "display": "[1, 2, 3]"
  },
  "hints": [
   "Default values are evaluated once, when the <code>def</code> statement runs, not on every call.",
   "All three calls share the very same list object."
  ],
  "solution": "<p>The default <code>lst=[]</code> is created a single time when the function is defined and stored on the function object (<code>add.__defaults__</code>).</p><p>Each call without a second argument appends to that same list: after <code>add(1)</code> it is <code>[1]</code>, after <code>add(2)</code> it is <code>[1, 2]</code>, and <code>add(3)</code> returns <code>[1, 2, 3]</code>.</p><p>The idiomatic fix is <code>def add(x, lst=None):</code> followed by <code>if lst is None: lst = []</code>.</p><p>Answer: <code>[1, 2, 3]</code>.</p>",
  "key": "Default arguments are evaluated once at definition time; mutable defaults are shared across calls."
 },
 {
  "id": "py-002",
  "cat": "python",
  "diff": 1,
  "title": "A 3×3 grid gone wrong",
  "tags": [
   "aliasing",
   "lists"
  ],
  "prompt": "<p>Building a grid with list multiplication:</p><pre><code>grid = [[0] * 3] * 3\ngrid[0][0] = 1\nprint(grid)</code></pre><p>What does this print? Type the output exactly as printed (on one line).</p>",
  "answer": {
   "type": "text",
   "accept": [
    "[[1, 0, 0], [1, 0, 0], [1, 0, 0]]"
   ],
   "display": "[[1, 0, 0], [1, 0, 0], [1, 0, 0]]"
  },
  "hints": [
   "<code>[row] * 3</code> repeats the <i>reference</i> to <code>row</code>, it does not copy it.",
   "How many distinct inner list objects exist?"
  ],
  "solution": "<p><code>[0] * 3</code> creates one list <code>[0, 0, 0]</code>. Multiplying the outer list by 3 puts <b>three references to that same inner list</b> into <code>grid</code>.</p><p>Setting <code>grid[0][0] = 1</code> mutates the shared inner list, so every \"row\" shows the change.</p><p>Correct construction: <code>grid = [[0] * 3 for _ in range(3)]</code> (a new inner list per iteration).</p><p>Answer: <code>[[1, 0, 0], [1, 0, 0], [1, 0, 0]]</code>.</p>",
  "key": "Sequence multiplication copies references; use a comprehension to create independent rows."
 },
 {
  "id": "py-003",
  "cat": "python",
  "diff": 2,
  "title": "copy vs deepcopy",
  "tags": [
   "copy",
   "aliasing",
   "mutability"
  ],
  "prompt": "<p>Shallow and deep copies of a nested list:</p><pre><code>import copy\na = [[1, 2], [3, 4]]\nb = copy.copy(a)\nc = copy.deepcopy(a)\na[0].append(9)\na.append([5])\nprint(len(b), b[0], c[0])</code></pre><p>What does this print? Type the output exactly as printed (on one line).</p>",
  "answer": {
   "type": "text",
   "accept": [
    "2 [1, 2, 9] [1, 2]",
    "2 [1,2,9] [1,2]"
   ],
   "display": "2 [1, 2, 9] [1, 2]"
  },
  "hints": [
   "A shallow copy is a new outer list holding the same inner lists.",
   "Appending to <code>a</code> itself changes only <code>a</code>; mutating <code>a[0]</code> changes an object that <code>b</code> also holds."
  ],
  "solution": "<p><code>b = copy.copy(a)</code> makes a new outer list whose elements are the <i>same</i> inner list objects as <code>a</code>. <code>c = copy.deepcopy(a)</code> recursively copies the inner lists too.</p><p><code>a[0].append(9)</code> mutates the inner list shared by <code>a</code> and <code>b</code>, so <code>b[0]</code> becomes <code>[1, 2, 9]</code>; <code>c[0]</code> is an independent copy and stays <code>[1, 2]</code>.</p><p><code>a.append([5])</code> changes only the outer list of <code>a</code>, so <code>len(b)</code> is still 2.</p><p>Answer: <code>2 [1, 2, 9] [1, 2]</code>.</p>",
  "key": "Shallow copy = new container, shared elements; deepcopy duplicates the whole object graph."
 },
 {
  "id": "py-004",
  "cat": "python",
  "diff": 1,
  "title": "Floor division with negatives",
  "tags": [
   "integer-division",
   "operators"
  ],
  "prompt": "<p>Python's integer division and modulo on a negative number:</p><pre><code>print(-7 // 2, -7 % 2, int(-7 / 2))</code></pre><p>What does this print? Type the output exactly as printed (on one line).</p>",
  "answer": {
   "type": "text",
   "accept": [
    "-4 1 -3"
   ],
   "display": "-4 1 -3"
  },
  "hints": [
   "<code>//</code> rounds toward negative infinity (floor), not toward zero.",
   "Python keeps the identity <code>a == (a // b) * b + a % b</code>, and <code>int()</code> truncates toward zero."
  ],
  "solution": "<p><code>-7 / 2 = -3.5</code>. Floor division takes the floor: <code>-7 // 2 = -4</code>.</p><p>The remainder must satisfy <code>-7 = (-4)·2 + r</code>, so <code>r = 1</code>; in Python the result of <code>%</code> has the sign of the divisor.</p><p><code>int(-3.5)</code> truncates toward zero, giving <code>-3</code>. (C, C++ and Java integer division also truncate toward zero, which is a classic porting bug.)</p><p>Answer: <code>-4 1 -3</code>.</p>",
  "key": "// floors toward −∞ and % takes the divisor's sign; int() truncates toward 0."
 },
 {
  "id": "py-005",
  "cat": "python",
  "diff": 3,
  "title": "round() surprises",
  "tags": [
   "floats",
   "rounding"
  ],
  "prompt": "<p>Rounding halves:</p><pre><code>print(round(0.5), round(1.5), round(2.5),\n      round(2.675, 2))</code></pre><p>What does this print? Type the output exactly as printed (on one line).</p>",
  "answer": {
   "type": "text",
   "accept": [
    "0 2 2 2.67"
   ],
   "display": "0 2 2 2.67"
  },
  "hints": [
   "Python 3 uses round-half-to-even (\"banker's rounding\").",
   "2.675 cannot be stored exactly in binary floating point; is the stored value slightly above or below 2.675?"
  ],
  "solution": "<p><code>round()</code> on an exact tie rounds to the nearest <b>even</b> integer: <code>round(0.5) = 0</code>, <code>round(1.5) = 2</code>, <code>round(2.5) = 2</code>. This avoids the upward bias of always rounding halves up.</p><p>The literal <code>2.675</code> is stored as the nearest double, which is 2.67499999999999982236431605997495353221893310546875 — slightly <i>below</i> 2.675 — so it rounds down to <code>2.67</code>. It is not a tie at all.</p><p>For money, use <code>decimal.Decimal</code> with an explicit rounding mode.</p><p>Answer: <code>0 2 2 2.67</code>.</p>",
  "key": "round() is half-to-even, and decimal literals are not exact in binary floating point."
 },
 {
  "id": "py-006",
  "cat": "python",
  "diff": 2,
  "title": "Lambdas in a loop",
  "tags": [
   "closures",
   "late-binding"
  ],
  "prompt": "<p>A list of callbacks:</p><pre><code>fs = [lambda: i for i in range(3)]\nprint([f() for f in fs])</code></pre><p>What does this print? Type the output exactly as printed (on one line).</p>",
  "answer": {
   "type": "text",
   "accept": [
    "[2, 2, 2]",
    "[2,2,2]"
   ],
   "display": "[2, 2, 2]"
  },
  "hints": [
   "A closure captures the <i>variable</i> <code>i</code>, not its value at creation time.",
   "What is the value of <code>i</code> when the lambdas are finally called?"
  ],
  "solution": "<p>Each lambda refers to the name <code>i</code> in the comprehension's scope. The lookup happens when the lambda is <b>called</b> (late binding).</p><p>By the time we call them, the loop has finished and <code>i == 2</code>, so all three return 2.</p><p>Fix: bind the current value as a default, <code>lambda i=i: i</code>, or use <code>functools.partial</code>.</p><p>Answer: <code>[2, 2, 2]</code>.</p>",
  "key": "Closures look variables up at call time (late binding); freeze values with default arguments."
 },
 {
  "id": "py-007",
  "cat": "python",
  "diff": 2,
  "title": "Summing a generator twice",
  "tags": [
   "generators",
   "iterators"
  ],
  "prompt": "<p>A generator expression consumed twice:</p><pre><code>g = (x * x for x in range(4))\nprint(sum(g), sum(g))</code></pre><p>What does this print? Type the output exactly as printed (on one line).</p>",
  "answer": {
   "type": "text",
   "accept": [
    "14 0"
   ],
   "display": "14 0"
  },
  "hints": [
   "A generator can be iterated only once.",
   "0² + 1² + 2² + 3² = ?"
  ],
  "solution": "<p>The first <code>sum(g)</code> consumes the generator: 0 + 1 + 4 + 9 = 14.</p><p>The generator is now exhausted; iterating it again yields nothing, and the sum of an empty iterable is 0.</p><p>If you need several passes, materialise it (<code>list(...)</code>) or recreate the generator.</p><p>Answer: <code>14 0</code>.</p>",
  "key": "Generators are single-pass iterators; a second pass sees nothing."
 },
 {
  "id": "py-008",
  "cat": "python",
  "diff": 2,
  "title": "Dict ordering and update",
  "tags": [
   "dicts",
   "ordering"
  ],
  "prompt": "<p>Dictionaries preserve insertion order (Python 3.7+):</p><pre><code>d = {\"b\": 1, \"a\": 2}\nd[\"c\"] = 3\nd[\"b\"] = 10\nd.update({\"a\": 0, \"d\": 4})\nprint(list(d), sum(d.values()))</code></pre><p>What does this print? Type the output exactly as printed (on one line).</p>",
  "answer": {
   "type": "text",
   "accept": [
    "['b', 'a', 'c', 'd'] 17",
    "[b, a, c, d] 17"
   ],
   "display": "['b', 'a', 'c', 'd'] 17"
  },
  "hints": [
   "Overwriting an existing key keeps its original position.",
   "Final values: b=10, a=0, c=3, d=4."
  ],
  "solution": "<p>Keys are ordered by <b>first insertion</b>: b, a, then c, then d (added by <code>update</code>).</p><p>Reassigning <code>d[\"b\"]</code> and updating <code>\"a\"</code> change values but not positions.</p><p>Values: 10 + 0 + 3 + 4 = 17.</p><p>Answer: <code>['b', 'a', 'c', 'd'] 17</code>.</p>",
  "key": "dict keeps first-insertion order; updating a key's value does not move it."
 },
 {
  "id": "py-009",
  "cat": "python",
  "diff": 1,
  "title": "is vs ==",
  "tags": [
   "identity",
   "aliasing"
  ],
  "prompt": "<p>Equality versus identity:</p><pre><code>a = [1, 2]\nb = a\nc = a[:]\nprint(a == c, a is c, b is a)</code></pre><p>What does this print? Type the output exactly as printed (on one line).</p>",
  "answer": {
   "type": "text",
   "accept": [
    "True False True"
   ],
   "display": "True False True"
  },
  "hints": [
   "<code>==</code> compares values; <code>is</code> compares object identity.",
   "A full slice <code>a[:]</code> creates a new list."
  ],
  "solution": "<p><code>c = a[:]</code> is a new list with equal contents, so <code>a == c</code> is True but <code>a is c</code> is False.</p><p><code>b = a</code> just binds a second name to the same object, so <code>b is a</code> is True.</p><p>Use <code>is</code> only for identity checks such as <code>x is None</code>.</p><p>Answer: <code>True False True</code>.</p>",
  "key": "== is value equality; is is identity. Slicing copies, assignment aliases."
 },
 {
  "id": "py-010",
  "cat": "python",
  "diff": 2,
  "title": "Slicing with steps",
  "tags": [
   "slicing",
   "strings"
  ],
  "prompt": "<p>Index carefully (0-based):</p><pre><code>s = \"quantitative\"\nprint(s[::-3], s[-4:-1], s[1:8:2])</code></pre><p>What does this print? Type the output exactly as printed (on one line).</p>",
  "answer": {
   "type": "text",
   "accept": [
    "etia tiv unia"
   ],
   "display": "etia tiv unia"
  },
  "hints": [
   "Write the indices: q0 u1 a2 n3 t4 i5 t6 a7 t8 i9 v10 e11.",
   "<code>[::-3]</code> starts at the last character; the stop index of a slice is excluded."
  ],
  "solution": "<p>Indices: q0 u1 a2 n3 t4 i5 t6 a7 t8 i9 v10 e11 (length 12).</p><p><code>s[::-3]</code>: start at 11 and step −3 → indices 11, 8, 5, 2 → e, t, i, a = <code>etia</code>.</p><p><code>s[-4:-1]</code>: −4 is index 8, −1 is index 11 (excluded) → indices 8, 9, 10 → <code>tiv</code>.</p><p><code>s[1:8:2]</code>: indices 1, 3, 5, 7 → u, n, i, a = <code>unia</code>.</p><p>Answer: <code>etia tiv unia</code>.</p>",
  "key": "Slices are start-inclusive, stop-exclusive; a negative step with no start begins at the end."
 },
 {
  "id": "py-011",
  "cat": "python",
  "diff": 2,
  "title": "zip, all and any edge cases",
  "tags": [
   "iterators",
   "builtins"
  ],
  "prompt": "<p>Three built-ins on awkward inputs:</p><pre><code>print(list(zip([1, 2, 3], \"ab\")),\n      all([]), any([]))</code></pre><p>What does this print? Type the output exactly as printed (on one line).</p>",
  "answer": {
   "type": "text",
   "accept": [
    "[(1, 'a'), (2, 'b')] True False",
    "[(1, a), (2, b)] True False"
   ],
   "display": "[(1, 'a'), (2, 'b')] True False"
  },
  "hints": [
   "<code>zip</code> stops at the shortest input.",
   "<code>all</code> asks \"is there no falsy element?\"; <code>any</code> asks \"is there at least one truthy element?\""
  ],
  "solution": "<p><code>zip</code> pairs elements until the shortest iterable (the 2-character string) runs out: <code>[(1, 'a'), (2, 'b')]</code>. The extra 3 is silently dropped — use <code>zip(..., strict=True)</code> (3.10+) to catch length mismatches.</p><p><code>all([])</code> is True (vacuous truth: no counterexample), <code>any([])</code> is False (no witness).</p><p>Answer: <code>[(1, 'a'), (2, 'b')] True False</code>.</p>",
  "key": "zip truncates silently; all() of empty is True, any() of empty is False."
 },
 {
  "id": "py-012",
  "cat": "python",
  "diff": 2,
  "title": "Big-O of a duplicate check",
  "tags": [
   "complexity",
   "lists"
  ],
  "prompt": "<p>What is the worst-case time complexity of this function for a list of length n?</p><pre><code>def has_dup(xs):\n    for i in range(len(xs)):\n        if xs[i] in xs[i + 1:]:\n            return True\n    return False</code></pre><p>And what is the standard fix?</p>",
  "answer": {
   "type": "choice",
   "options": [
    "O(n) — one loop over the list",
    "O(n log n) — like sorting",
    "O(n²) — the slice and the <code>in</code> test are both linear; fix with a set",
    "O(n³) — slice, membership and loop multiply"
   ],
   "correct": 2,
   "display": "O(n²); use a set for O(n) expected time"
  },
  "hints": [
   "Both <code>xs[i+1:]</code> (copies n−i−1 items) and <code>in</code> on a list (scans) are linear.",
   "Those two linear steps happen one after the other inside the loop — they add, not multiply."
  ],
  "solution": "<p>In iteration i, the slice copies n−i−1 elements (O(n)) and the membership test scans up to n−i−1 elements (O(n)). Those are sequential, so each iteration costs O(n).</p><p>With n iterations in the worst case (no duplicates), total work is ∑(n−i) ≈ n²/2 → <b>O(n²)</b>, not O(n³).</p><p>Fix: <code>return len(set(xs)) != len(xs)</code>, or insert into a set while scanning — O(n) expected time, since set membership is O(1) on average.</p>",
  "key": "Sequential linear steps add; only nested loops multiply. Sets give O(1) average membership."
 },
 {
  "id": "py-013",
  "cat": "python",
  "diff": 2,
  "title": "Building a big string",
  "tags": [
   "complexity",
   "strings"
  ],
  "prompt": "<p>You must concatenate 1,000,000 short strings stored in a list <code>pieces</code>. Which approach is guaranteed linear time across Python implementations?</p>",
  "answer": {
   "type": "choice",
   "options": [
    "<code>s = \"\"</code> then <code>for p in pieces: s += p</code>",
    "<code>s = \"\".join(pieces)</code>",
    "<code>s = functools.reduce(operator.add, pieces)</code>",
    "<code>s = sum(pieces, \"\")</code>"
   ],
   "correct": 1,
   "display": "\"\".join(pieces)"
  },
  "hints": [
   "Strings are immutable: <code>a + b</code> builds a brand-new string of length |a| + |b|.",
   "One option computes the total length once and copies each piece exactly once."
  ],
  "solution": "<p>Because strings are immutable, repeated <code>+</code> copies the growing prefix every time: 1 + 2 + … + n pieces copied → O(n²) characters in the worst case. <code>reduce(operator.add, …)</code> is the same thing, and <code>sum()</code> on strings is explicitly rejected by Python (<code>TypeError</code>, it tells you to use join).</p><p><code>\"\".join(pieces)</code> sizes the result once and copies each piece once: O(total length).</p><p>CPython sometimes optimises <code>s += p</code> in place when the string has a single reference, but that is an implementation detail (not in PyPy, and easily defeated), so don't rely on it.</p>",
  "key": "Repeated string + is quadratic; str.join is linear."
 },
 {
  "id": "py-014",
  "cat": "python",
  "diff": 2,
  "title": "Broadcasting shapes",
  "tags": [
   "numpy",
   "broadcasting"
  ],
  "prompt": "<p>Adding arrays of different shapes:</p><pre><code>import numpy as np\na = np.ones((4, 1, 3))\nb = np.ones((5, 1))\nprint((a + b).shape)</code></pre><p>What does this print? Type the output exactly as printed (on one line).</p>",
  "answer": {
   "type": "text",
   "accept": [
    "(4, 5, 3)",
    "(4,5,3)"
   ],
   "display": "(4, 5, 3)"
  },
  "hints": [
   "Align shapes from the right; pad the shorter one with 1s on the left.",
   "Each dimension pair must be equal or contain a 1; the result takes the larger size."
  ],
  "solution": "<p>Right-align the shapes: a = (4, 1, 3), b = (1, 5, 1) after left-padding with a 1.</p><p>Dimension by dimension: max(4, 1) = 4, max(1, 5) = 5, max(3, 1) = 3. Every pair is equal or contains a 1, so broadcasting succeeds.</p><p>Answer: <code>(4, 5, 3)</code>.</p>",
  "key": "Broadcasting: right-align shapes; sizes must match or be 1; result takes the max."
 },
 {
  "id": "py-015",
  "cat": "python",
  "diff": 1,
  "title": "Which axis?",
  "tags": [
   "numpy",
   "axis"
  ],
  "prompt": "<p>Reductions along an axis:</p><pre><code>import numpy as np\na = np.arange(6).reshape(2, 3)\nprint(a.sum(axis=0), a.mean(axis=1))</code></pre><p>What does this print? Type the output exactly as printed (on one line).</p>",
  "answer": {
   "type": "text",
   "accept": [
    "[3 5 7] [1. 4.]",
    "[3, 5, 7] [1.0, 4.0]",
    "[3 5 7] [1.0 4.0]"
   ],
   "display": "[3 5 7] [1. 4.]"
  },
  "hints": [
   "<code>a</code> is [[0, 1, 2], [3, 4, 5]].",
   "<code>axis=0</code> collapses the rows (one result per column); <code>axis=1</code> collapses the columns (one result per row)."
  ],
  "solution": "<p><code>a = [[0, 1, 2], [3, 4, 5]]</code>, shape (2, 3).</p><p><code>sum(axis=0)</code> removes axis 0 (rows) → column sums: [0+3, 1+4, 2+5] = <code>[3 5 7]</code>.</p><p><code>mean(axis=1)</code> removes axis 1 (columns) → row means: [1.0, 4.0], printed by NumPy as <code>[1. 4.]</code>.</p><p>Answer: <code>[3 5 7] [1. 4.]</code>.</p>",
  "key": "The axis you pass is the one that disappears."
 },
 {
  "id": "py-016",
  "cat": "python",
  "diff": 2,
  "title": "NaN in NumPy",
  "tags": [
   "numpy",
   "nan"
  ],
  "prompt": "<p>Missing values in a NumPy array:</p><pre><code>import numpy as np\nx = np.array([1.0, np.nan, 3.0])\nprint(np.mean(x), np.nanmean(x), (x &gt; 0).sum())</code></pre><p>What does this print? Type the output exactly as printed (on one line).</p>",
  "answer": {
   "type": "text",
   "accept": [
    "nan 2.0 2"
   ],
   "display": "nan 2.0 2"
  },
  "hints": [
   "NaN propagates through arithmetic in plain NumPy reductions.",
   "Every comparison with NaN is False."
  ],
  "solution": "<p><code>np.mean</code> sums 1 + NaN + 3 = NaN, so the mean is <code>nan</code>.</p><p><code>np.nanmean</code> ignores NaNs: (1 + 3)/2 = <code>2.0</code>.</p><p><code>x &gt; 0</code> is [True, False, True] because <code>nan &gt; 0</code> is False; the sum counts 2.</p><p>(Contrast with pandas, whose <code>mean()</code> skips NaN by default.)</p><p>Answer: <code>nan 2.0 2</code>.</p>",
  "key": "NumPy reductions propagate NaN (use nan* functions); comparisons with NaN are False."
 },
 {
  "id": "py-017",
  "cat": "python",
  "diff": 3,
  "title": "Views vs copies",
  "tags": [
   "numpy",
   "views",
   "aliasing"
  ],
  "prompt": "<p>Basic slicing versus fancy indexing:</p><pre><code>import numpy as np\na = np.arange(5)\nb = a[1:4]\nc = a[[1, 2, 3]]\nb[0] = 100\nc[1] = 200\nprint(a.tolist())</code></pre><p>What does this print? Type the output exactly as printed (on one line).</p>",
  "answer": {
   "type": "text",
   "accept": [
    "[0, 100, 2, 3, 4]",
    "[0,100,2,3,4]"
   ],
   "display": "[0, 100, 2, 3, 4]"
  },
  "hints": [
   "A basic slice like <code>a[1:4]</code> returns a <i>view</i> sharing memory with <code>a</code>.",
   "Indexing with a list of integers (\"fancy indexing\") always returns a copy."
  ],
  "solution": "<p><code>b = a[1:4]</code> is a view onto a[1], a[2], a[3]. Writing <code>b[0] = 100</code> writes to <code>a[1]</code>.</p><p><code>c = a[[1, 2, 3]]</code> uses advanced indexing, which allocates a new array. Writing <code>c[1] = 200</code> leaves <code>a</code> untouched.</p><p>So a = [0, 100, 2, 3, 4]. (Check with <code>np.shares_memory(a, b)</code>; call <code>.copy()</code> when you need independence.)</p><p>Answer: <code>[0, 100, 2, 3, 4]</code>.</p>",
  "key": "Basic slices are views (writes propagate); fancy/boolean indexing returns copies."
 },
 {
  "id": "py-018",
  "cat": "python",
  "diff": 1,
  "title": "NaN in pandas",
  "tags": [
   "pandas",
   "nan"
  ],
  "prompt": "<p>pandas aggregation with missing data:</p><pre><code>import numpy as np\nimport pandas as pd\ns = pd.Series([1, np.nan, 3, np.nan])\nprint(s.count(), s.mean(), s.sum(), len(s))</code></pre><p>What does this print? Type the output exactly as printed (on one line).</p>",
  "answer": {
   "type": "text",
   "accept": [
    "2 2.0 4.0 4"
   ],
   "display": "2 2.0 4.0 4"
  },
  "hints": [
   "pandas reductions use <code>skipna=True</code> by default.",
   "<code>count()</code> counts non-missing values; <code>len()</code> counts rows."
  ],
  "solution": "<p><code>count()</code> = number of non-NaN values = 2.</p><p><code>mean()</code> skips NaN: (1 + 3)/2 = 2.0. <code>sum()</code> skips NaN: 4.0 (float, because NaN forced the dtype to float64).</p><p><code>len(s)</code> counts all rows including missing ones: 4.</p><p>Answer: <code>2 2.0 4.0 4</code>.</p>",
  "key": "pandas skips NaN by default (unlike NumPy); count() ≠ len()."
 },
 {
  "id": "py-019",
  "cat": "python",
  "diff": 2,
  "title": "groupby + agg",
  "tags": [
   "pandas",
   "groupby"
  ],
  "prompt": "<p>Per-ticker statistics:</p><pre><code>import pandas as pd\ndf = pd.DataFrame({\n    \"tk\": [\"A\", \"B\", \"A\", \"B\", \"A\"],\n    \"px\": [10, 20, 30, 40, 50]})\ng = df.groupby(\"tk\")[\"px\"].agg([\"mean\", \"max\"])\nprint(g.loc[\"A\", \"mean\"], g.loc[\"B\", \"max\"])</code></pre><p>What does this print? Type the output exactly as printed (on one line).</p>",
  "answer": {
   "type": "text",
   "accept": [
    "30.0 40",
    "30 40"
   ],
   "display": "30.0 40"
  },
  "hints": [
   "Group A has prices 10, 30, 50; group B has 20, 40.",
   "The mean is a float; the max of an integer column stays an integer."
  ],
  "solution": "<p><code>groupby(\"tk\")</code> splits rows by ticker: A → [10, 30, 50], B → [20, 40].</p><p><code>agg([\"mean\", \"max\"])</code> returns a DataFrame indexed by ticker with columns mean and max.</p><p>A's mean = 90/3 = 30.0 (float); B's max = 40 (integer dtype preserved).</p><p>Answer: <code>30.0 40</code>.</p>",
  "key": "groupby → split by key, apply each aggregation, combine into a frame indexed by the key."
 },
 {
  "id": "py-020",
  "cat": "python",
  "diff": 3,
  "title": "Merge row counts with duplicate keys",
  "tags": [
   "pandas",
   "merge",
   "joins"
  ],
  "prompt": "<p>Joining on a key that repeats on both sides:</p><pre><code>import pandas as pd\nL = pd.DataFrame({\"k\": [1, 1, 2, 3]})\nR = pd.DataFrame({\"k\": [1, 1, 1, 2, 4]})\nprint(len(L.merge(R, on=\"k\")),\n      len(L.merge(R, on=\"k\", how=\"left\")),\n      len(L.merge(R, on=\"k\", how=\"outer\")))</code></pre><p>What does this print? Type the output exactly as printed (on one line).</p>",
  "answer": {
   "type": "text",
   "accept": [
    "7 8 9"
   ],
   "display": "7 8 9"
  },
  "hints": [
   "For each key, an inner join produces (count in L) × (count in R) rows.",
   "Left join adds unmatched left rows once; outer join also adds unmatched right rows."
  ],
  "solution": "<p>Key 1: 2 rows in L × 3 rows in R = 6 rows. Key 2: 1 × 1 = 1. Keys 3 (only L) and 4 (only R) don't match.</p><p>Inner: 6 + 1 = <b>7</b>. Left: 7 + 1 (key 3 with NaN) = <b>8</b>. Outer: 8 + 1 (key 4) = <b>9</b>.</p><p>This many-to-many blow-up is a common data bug; <code>merge(..., validate=\"one_to_one\")</code> catches it.</p><p>Answer: <code>7 8 9</code>.</p>",
  "key": "Join size per key = left count × right count; outer/left joins add unmatched rows once."
 },
 {
  "id": "py-021",
  "cat": "python",
  "diff": 3,
  "title": "loc vs iloc slicing",
  "tags": [
   "pandas",
   "indexing",
   "slicing"
  ],
  "prompt": "<p>Label-based versus position-based slices:</p><pre><code>import pandas as pd\ndf = pd.DataFrame({\"x\": [10, 11, 12, 13, 14, 15]})\nr = df.iloc[::-1]\nprint(len(df.loc[1:3]), len(df.iloc[1:3]),\n      r.loc[3:1, \"x\"].tolist())</code></pre><p>What does this print? Type the output exactly as printed (on one line).</p>",
  "answer": {
   "type": "text",
   "accept": [
    "3 2 [13, 12, 11]",
    "3 2 [13,12,11]"
   ],
   "display": "3 2 [13, 12, 11]"
  },
  "hints": [
   "<code>.loc</code> slices by label and includes the end label; <code>.iloc</code> slices by position and excludes the end.",
   "In the reversed frame <code>r</code>, label 3 comes before label 1."
  ],
  "solution": "<p><code>df.loc[1:3]</code> selects labels 1, 2, 3 — <b>inclusive</b> → 3 rows.</p><p><code>df.iloc[1:3]</code> selects positions 1 and 2 — end exclusive like Python → 2 rows.</p><p><code>r</code> has index order 5, 4, 3, 2, 1, 0. A label slice <code>3:1</code> walks that order from label 3 to label 1 inclusive: labels 3, 2, 1 → x = [13, 12, 11].</p><p>Answer: <code>3 2 [13, 12, 11]</code>.</p>",
  "key": ".loc slices by label inclusive of the end, following index order; .iloc slices by position, end exclusive."
 },
 {
  "id": "py-022",
  "cat": "python",
  "diff": 1,
  "title": "Fastest way to compute log returns",
  "tags": [
   "pandas",
   "vectorization",
   "finance"
  ],
  "prompt": "<p><code>p</code> is a pandas Series of 1,000,000 daily prices. Which computes log returns fastest (and correctly)?</p>",
  "answer": {
   "type": "choice",
   "options": [
    "A Python <code>for</code> loop over <code>range(1, len(p))</code> using <code>math.log(p.iloc[i] / p.iloc[i-1])</code>",
    "<code>p.to_frame().apply(lambda row: ..., axis=1)</code> row by row",
    "<code>np.log(p).diff()</code>",
    "Iterating with <code>p.items()</code> and appending to a list"
   ],
   "correct": 2,
   "display": "np.log(p).diff()"
  },
  "hints": [
   "Avoid anything that executes Python bytecode once per element.",
   "log(pₜ/pₜ₋₁) = log pₜ − log pₜ₋₁."
  ],
  "solution": "<p>log(pₜ / pₜ₋₁) = log pₜ − log pₜ₋₁, so take the log of the whole series once and difference it: <code>np.log(p).diff()</code> (equivalently <code>np.log(p / p.shift(1))</code>).</p><p>Both operations run in compiled loops over contiguous memory — typically 100× or more faster than a Python-level loop, <code>apply(axis=1)</code> or <code>items()</code>, each of which pays interpreter overhead per element (and <code>.iloc</code> per access).</p><p>The first value is NaN (no previous price), which is the correct behaviour.</p>",
  "key": "Vectorize: express the computation as whole-array operations instead of per-element Python."
 },
 {
  "id": "py-023",
  "cat": "python",
  "diff": 3,
  "title": "A rolling z-score without look-ahead",
  "tags": [
   "pandas",
   "leakage",
   "finance",
   "rolling"
  ],
  "prompt": "<p><code>s</code> is a daily price Series. You want a 20-day z-score signal that, at each date t, uses only information available at the close of day t. Which is correct?</p>",
  "answer": {
   "type": "choice",
   "options": [
    "<code>(s - s.mean()) / s.std()</code>",
    "<code>(s - s.rolling(20, center=True).mean()) / s.rolling(20, center=True).std()</code>",
    "<code>(s - s.rolling(20).mean()) / s.rolling(20).std()</code>",
    "<code>(s - s.shift(-20).rolling(20).mean()) / s.rolling(20).std()</code>"
   ],
   "correct": 2,
   "display": "(s - s.rolling(20).mean()) / s.rolling(20).std()"
  },
  "hints": [
   "Ask of each option: does the value at date t change if you edit a price after t?",
   "Full-sample statistics, centered windows and negative shifts all peek into the future."
  ],
  "solution": "<p>Option A uses the mean and std of the <b>whole</b> sample, including future prices — classic look-ahead bias that makes backtests look great and live trading disappointing.</p><p>Option B's centered window at t covers about t−10 … t+9 — it uses future data.</p><p>Option D's <code>shift(-20)</code> pulls prices from 20 days ahead.</p><p>Option C's trailing window covers t−19 … t only. The first 19 values are NaN, which is honest. (If the trade is executed at the same close, you would additionally <code>shift(1)</code> the signal.)</p>",
  "key": "Use trailing windows only; full-sample stats, centered windows and negative shifts leak the future."
 },
 {
  "id": "py-024",
  "cat": "python",
  "diff": 3,
  "title": "Removing items while iterating",
  "tags": [
   "mutability",
   "lists",
   "iterators"
  ],
  "prompt": "<p>Trying to drop the even numbers:</p><pre><code>xs = [2, 4, 5, 6, 8]\nfor x in xs:\n    if x % 2 == 0:\n        xs.remove(x)\nprint(xs)</code></pre><p>What does this print? Type the output exactly as printed (on one line).</p>",
  "answer": {
   "type": "text",
   "accept": [
    "[4, 5, 8]",
    "[4,5,8]"
   ],
   "display": "[4, 5, 8]"
  },
  "hints": [
   "The <code>for</code> loop walks an internal index 0, 1, 2, … over the <i>live</i> list.",
   "After removing the element at the current index, the next element slides into that index and gets skipped."
  ],
  "solution": "<p>Index 0: x = 2 is even → remove it; list = [4, 5, 6, 8].</p><p>Index 1: x = 5 (4 was skipped because it slid to index 0) → keep.</p><p>Index 2: x = 6 → remove; list = [4, 5, 8].</p><p>Index 3: past the end → loop stops. Result <code>[4, 5, 8]</code>.</p><p>Correct approach: build a new list, <code>xs = [x for x in xs if x % 2]</code>, or iterate over a copy <code>for x in xs[:]</code>.</p><p>Answer: <code>[4, 5, 8]</code>.</p>",
  "key": "Never mutate a list while iterating over it; filter into a new list instead."
 },
 {
  "id": "sql-001",
  "cat": "sql",
  "diff": 1,
  "title": "Inner join with duplicate keys",
  "tags": [
   "joins",
   "inner-join",
   "nulls",
   "count"
  ],
  "prompt": "<p><b>a</b></p><table><thead><tr><th>k</th></tr></thead><tbody><tr><td>1</td></tr><tr><td>1</td></tr><tr><td>2</td></tr><tr><td><i>NULL</i></td></tr></tbody></table><p><b>b</b></p><table><thead><tr><th>k</th><th>v</th></tr></thead><tbody><tr><td>1</td><td>x</td></tr><tr><td>1</td><td>y</td></tr><tr><td>2</td><td>z</td></tr><tr><td><i>NULL</i></td><td>w</td></tr><tr><td>3</td><td>q</td></tr></tbody></table><p>How many rows does this query return?</p><pre><code>SELECT a.k, b.v\nFROM a\nJOIN b ON a.k = b.k;</code></pre>",
  "answer": {
   "type": "numeric",
   "value": 5,
   "display": "5"
  },
  "hints": [
   "An inner join emits one row for every matching (a-row, b-row) pair — duplicates multiply.",
   "Does NULL = NULL count as a match?"
  ],
  "solution": "<p><b>Key 1:</b> a has two rows with k = 1 and b has two (x, y), so 2 × 2 = 4 rows.</p><p><b>Key 2:</b> one row in a × one row in b = 1 row.</p><p><b>NULL:</b> <code>NULL = NULL</code> is UNKNOWN, not TRUE, so the NULL rows never match. Key 3 exists only in b, so it is dropped by the inner join.</p><p>Answer: 4 + 1 = <b>5</b> rows.</p>",
  "key": "Join row count = Σ over keys of (count in left × count in right); NULL keys never match."
 },
 {
  "id": "sql-002",
  "cat": "sql",
  "diff": 1,
  "title": "Left join row count",
  "tags": [
   "joins",
   "left-join",
   "nulls",
   "count"
  ],
  "prompt": "<p><b>a</b></p><table><thead><tr><th>k</th></tr></thead><tbody><tr><td>1</td></tr><tr><td>1</td></tr><tr><td>2</td></tr><tr><td><i>NULL</i></td></tr></tbody></table><p><b>b</b></p><table><thead><tr><th>k</th><th>v</th></tr></thead><tbody><tr><td>1</td><td>x</td></tr><tr><td>1</td><td>y</td></tr><tr><td>2</td><td>z</td></tr><tr><td><i>NULL</i></td><td>w</td></tr><tr><td>3</td><td>q</td></tr></tbody></table><p>Same tables as before. How many rows does this LEFT JOIN return?</p><pre><code>SELECT a.k, b.v\nFROM a\nLEFT JOIN b ON a.k = b.k;</code></pre>",
  "answer": {
   "type": "numeric",
   "value": 6,
   "display": "6"
  },
  "hints": [
   "Start from the inner-join rows, then add back every row of a that matched nothing.",
   "Which rows of a have no match in b?"
  ],
  "solution": "<p>Matched rows (as in the inner join): 4 for k = 1 and 1 for k = 2, so 5.</p><p>A LEFT JOIN keeps every row of the left table. The row of a with k = NULL matches nothing, so it is kept once with b.v = NULL.</p><p>The b-only key 3 is not added (it is on the right side).</p><p>Answer: 5 + 1 = <b>6</b> rows.</p>",
  "key": "LEFT JOIN rows = matched pairs + one row per unmatched left row."
 },
 {
  "id": "sql-003",
  "cat": "sql",
  "diff": 2,
  "title": "LEFT JOIN quietly becomes INNER",
  "tags": [
   "joins",
   "left-join",
   "where",
   "nulls"
  ],
  "prompt": "<p><b>customers</b></p><table><thead><tr><th>id</th><th>name</th></tr></thead><tbody><tr><td>1</td><td>Ana</td></tr><tr><td>2</td><td>Ben</td></tr><tr><td>3</td><td>Cy</td></tr><tr><td>4</td><td>Dee</td></tr></tbody></table><p><b>orders</b></p><table><thead><tr><th>id</th><th>cust_id</th><th>amount</th></tr></thead><tbody><tr><td>10</td><td>1</td><td>50</td></tr><tr><td>11</td><td>1</td><td>20</td></tr><tr><td>12</td><td>2</td><td>70</td></tr><tr><td>13</td><td>3</td><td>5</td></tr></tbody></table><p>An analyst wants every customer, with their orders over 10 if any. How many rows does this return?</p><pre><code>SELECT c.name, o.amount\nFROM customers c\nLEFT JOIN orders o ON o.cust_id = c.id\nWHERE o.amount &gt; 10;</code></pre>",
  "answer": {
   "type": "numeric",
   "value": 3,
   "display": "3"
  },
  "hints": [
   "Do the LEFT JOIN first, then apply WHERE to its rows.",
   "What is NULL > 10 for customers with no order?"
  ],
  "solution": "<p><b>Step 1, the LEFT JOIN</b> gives 5 rows: (Ana, 50), (Ana, 20), (Ben, 70), (Cy, 5), (Dee, NULL).</p><p><b>Step 2, the WHERE filter</b> keeps rows with amount &gt; 10. (Cy, 5) fails, and (Dee, NULL) gives NULL &gt; 10 = UNKNOWN, which is filtered out too.</p><p>So the result is Ana 50, Ana 20, Ben 70: <b>3</b> rows. That is exactly what an inner join would give. A WHERE condition on the right table undoes the LEFT JOIN. To keep every customer, put the condition in the ON clause (see the next problem).</p>",
  "key": "Filtering the right-hand table in WHERE removes the NULL-extended rows, turning a LEFT JOIN into an INNER JOIN."
 },
 {
  "id": "sql-004",
  "cat": "sql",
  "diff": 2,
  "title": "Filter in ON instead",
  "tags": [
   "joins",
   "left-join",
   "nulls"
  ],
  "prompt": "<p><b>customers</b></p><table><thead><tr><th>id</th><th>name</th></tr></thead><tbody><tr><td>1</td><td>Ana</td></tr><tr><td>2</td><td>Ben</td></tr><tr><td>3</td><td>Cy</td></tr><tr><td>4</td><td>Dee</td></tr></tbody></table><p><b>orders</b></p><table><thead><tr><th>id</th><th>cust_id</th><th>amount</th></tr></thead><tbody><tr><td>10</td><td>1</td><td>50</td></tr><tr><td>11</td><td>1</td><td>20</td></tr><tr><td>12</td><td>2</td><td>70</td></tr><tr><td>13</td><td>3</td><td>5</td></tr></tbody></table><p>Same tables. The condition is moved into the ON clause. How many rows now?</p><pre><code>SELECT c.name, o.amount\nFROM customers c\nLEFT JOIN orders o\n  ON o.cust_id = c.id AND o.amount &gt; 10;</code></pre>",
  "answer": {
   "type": "numeric",
   "value": 5,
   "display": "5"
  },
  "hints": [
   "The ON condition only decides which orders match. It never removes a customer.",
   "Cy's only order fails the condition. What happens to Cy?"
  ],
  "solution": "<p>Matches that satisfy both conditions: Ana–50, Ana–20, Ben–70 (3 rows).</p><p>Cy has an order, but it fails amount &gt; 10, so Cy has no match and is kept with amount NULL. Dee has no orders and is kept with amount NULL too.</p><p>Answer: 3 + 2 = <b>5</b> rows, and every customer appears.</p>",
  "key": "In a LEFT JOIN, conditions in ON filter the matches; conditions in WHERE filter the result."
 },
 {
  "id": "sql-005",
  "cat": "sql",
  "diff": 1,
  "title": "COUNT(*) vs COUNT(col) vs COUNT(DISTINCT)",
  "tags": [
   "count",
   "nulls",
   "distinct"
  ],
  "prompt": "<p><b>t</b></p><table><thead><tr><th>x</th></tr></thead><tbody><tr><td>1</td></tr><tr><td>2</td></tr><tr><td>2</td></tr><tr><td><i>NULL</i></td></tr><tr><td><i>NULL</i></td></tr><tr><td>3</td></tr></tbody></table><p>What does this return? Give the three numbers in order, comma-separated.</p><pre><code>SELECT COUNT(*), COUNT(x), COUNT(DISTINCT x)\nFROM t;</code></pre>",
  "answer": {
   "type": "text",
   "accept": [
    "6, 4, 3",
    "6,4,3",
    "6 4 3"
   ],
   "display": "6, 4, 3"
  },
  "hints": [
   "COUNT(*) counts rows. COUNT(x) counts rows where x is not NULL."
  ],
  "solution": "<p><code>COUNT(*)</code> counts all 6 rows, NULLs included.</p><p><code>COUNT(x)</code> skips NULLs: 1, 2, 2, 3, so 4.</p><p><code>COUNT(DISTINCT x)</code> counts distinct non-NULL values {1, 2, 3}, so 3.</p><p>Answer: <b>6, 4, 3</b>.</p>",
  "key": "Aggregates other than COUNT(*) ignore NULLs."
 },
 {
  "id": "sql-006",
  "cat": "sql",
  "diff": 1,
  "title": "AVG and NULL",
  "tags": [
   "nulls",
   "aggregates"
  ],
  "prompt": "<p><b>scores</b></p><table><thead><tr><th>student</th><th>score</th></tr></thead><tbody><tr><td>A</td><td>80</td></tr><tr><td>B</td><td><i>NULL</i></td></tr><tr><td>C</td><td>70</td></tr><tr><td>D</td><td>90</td></tr></tbody></table><p>What does this return?</p><pre><code>SELECT AVG(score) FROM scores;</code></pre>",
  "answer": {
   "type": "numeric",
   "value": 80,
   "display": "80"
  },
  "hints": [
   "Is the NULL treated as 0, or skipped?"
  ],
  "solution": "<p>AVG ignores NULLs, so it averages 80, 70 and 90 over 3 rows: 240 / 3 = <b>80</b>.</p><p>If you want missing scores to count as 0, write <code>AVG(COALESCE(score, 0))</code>, which gives 240 / 4 = 60. In finance data this choice matters, e.g. missing returns versus zero returns.</p>",
  "key": "AVG(col) = SUM(col) / COUNT(col): NULLs are dropped from both."
 },
 {
  "id": "sql-007",
  "cat": "sql",
  "diff": 2,
  "title": "NULL = NULL",
  "tags": [
   "nulls",
   "where"
  ],
  "prompt": "<p><b>t</b></p><table><thead><tr><th>id</th><th>a</th><th>b</th></tr></thead><tbody><tr><td>1</td><td>1</td><td>1</td></tr><tr><td>2</td><td><i>NULL</i></td><td><i>NULL</i></td></tr><tr><td>3</td><td>2</td><td><i>NULL</i></td></tr><tr><td>4</td><td>3</td><td>4</td></tr></tbody></table><p>How many rows does this count?</p><pre><code>SELECT COUNT(*) FROM t WHERE a = b;</code></pre>",
  "answer": {
   "type": "numeric",
   "value": 1,
   "display": "1"
  },
  "hints": [
   "SQL uses three-valued logic: TRUE, FALSE, UNKNOWN. WHERE keeps only TRUE.",
   "What is NULL = NULL?"
  ],
  "solution": "<p>Row 1: 1 = 1 is TRUE.</p><p>Row 2: NULL = NULL is UNKNOWN, so the row is dropped.</p><p>Row 3: 2 = NULL is UNKNOWN. Row 4: 3 = 4 is FALSE.</p><p>Answer: <b>1</b>. To treat two NULLs as equal, use <code>a IS b</code> (SQLite) or <code>a IS NOT DISTINCT FROM b</code> (standard SQL / Postgres).</p>",
  "key": "Any comparison with NULL is UNKNOWN, and WHERE drops UNKNOWN."
 },
 {
  "id": "sql-008",
  "cat": "sql",
  "diff": 3,
  "title": "NOT IN and a sneaky NULL",
  "tags": [
   "nulls",
   "subquery",
   "not-in"
  ],
  "prompt": "<p><b>employees</b></p><table><thead><tr><th>id</th><th>name</th><th>manager_id</th></tr></thead><tbody><tr><td>1</td><td>Ana</td><td><i>NULL</i></td></tr><tr><td>2</td><td>Ben</td><td>1</td></tr><tr><td>3</td><td>Cy</td><td>1</td></tr><tr><td>4</td><td>Dee</td><td>2</td></tr></tbody></table><p>The goal is to find employees who manage nobody. How many rows does this query count?</p><pre><code>SELECT COUNT(*)\nFROM employees\nWHERE id NOT IN (\n  SELECT manager_id FROM employees\n);</code></pre>",
  "answer": {
   "type": "numeric",
   "value": 0,
   "display": "0"
  },
  "hints": [
   "The subquery returns (NULL, 1, 1, 2).",
   "x NOT IN (…, NULL) means x &lt;&gt; … AND x &lt;&gt; NULL. What is x &lt;&gt; NULL?"
  ],
  "solution": "<p>The subquery returns {NULL, 1, 1, 2}, because Ana has no manager.</p><p>For Cy (id 3): 3 NOT IN (NULL, 1, 2) expands to 3 &lt;&gt; NULL AND 3 &lt;&gt; 1 AND 3 &lt;&gt; 2, which is UNKNOWN AND TRUE AND TRUE = UNKNOWN. The row is dropped. The same happens for every row.</p><p>Answer: <b>0</b> rows, although Cy and Dee really manage nobody.</p><p><b>Fix:</b> use <code>NOT EXISTS (SELECT 1 FROM employees m WHERE m.manager_id = e.id)</code>, or add <code>WHERE manager_id IS NOT NULL</code> to the subquery. Either gives 2.</p>",
  "key": "A single NULL in a NOT IN list makes the predicate UNKNOWN for every row. Prefer NOT EXISTS."
 },
 {
  "id": "sql-009",
  "cat": "sql",
  "diff": 1,
  "title": "GROUP BY and ORDER BY",
  "tags": [
   "group-by",
   "aggregates",
   "order-by"
  ],
  "prompt": "<p><b>trades</b></p><table><thead><tr><th>trader</th><th>qty</th></tr></thead><tbody><tr><td>A</td><td>10</td></tr><tr><td>B</td><td>5</td></tr><tr><td>A</td><td>7</td></tr><tr><td>C</td><td>3</td></tr><tr><td>B</td><td>8</td></tr><tr><td>C</td><td>20</td></tr><tr><td>D</td><td>4</td></tr></tbody></table><p>List the <b>trader</b> column of the result in output order, comma-separated (e.g. X, Y, Z).</p><pre><code>SELECT trader, SUM(qty) AS total\nFROM trades\nGROUP BY trader\nORDER BY total DESC;</code></pre>",
  "answer": {
   "type": "text",
   "accept": [
    "C, A, B, D",
    "C,A,B,D",
    "C A B D"
   ],
   "display": "C, A, B, D"
  },
  "hints": [
   "Compute each trader's total first."
  ],
  "solution": "<p>Totals: A = 10 + 7 = 17, B = 5 + 8 = 13, C = 3 + 20 = 23, D = 4.</p><p>Sorted descending: C (23), A (17), B (13), D (4).</p><p>Answer: <b>C, A, B, D</b>.</p>",
  "key": "GROUP BY collapses rows into one per group; ORDER BY can use the SELECT alias."
 },
 {
  "id": "sql-010",
  "cat": "sql",
  "diff": 2,
  "title": "HAVING with two conditions",
  "tags": [
   "group-by",
   "having",
   "aggregates"
  ],
  "prompt": "<p><b>trades</b></p><table><thead><tr><th>trader</th><th>qty</th></tr></thead><tbody><tr><td>A</td><td>10</td></tr><tr><td>B</td><td>5</td></tr><tr><td>A</td><td>7</td></tr><tr><td>C</td><td>3</td></tr><tr><td>B</td><td>8</td></tr><tr><td>C</td><td>20</td></tr><tr><td>D</td><td>4</td></tr></tbody></table><p>Which traders are returned? List them comma-separated in output order.</p><pre><code>SELECT trader\nFROM trades\nGROUP BY trader\nHAVING COUNT(*) &gt;= 2 AND SUM(qty) &gt; 15\nORDER BY trader;</code></pre>",
  "answer": {
   "type": "text",
   "accept": [
    "A, C",
    "A,C",
    "A C"
   ],
   "display": "A, C"
  },
  "hints": [
   "Make a small table per trader: number of trades and total qty."
  ],
  "solution": "<p>A: 2 trades, total 17, passes. B: 2 trades, total 13, fails the sum condition.</p><p>C: 2 trades, total 23, passes. D: 1 trade, fails the count condition.</p><p>Answer: <b>A, C</b>.</p>",
  "key": "HAVING filters groups after aggregation, so it can use COUNT/SUM."
 },
 {
  "id": "sql-011",
  "cat": "sql",
  "diff": 1,
  "title": "WHERE or HAVING?",
  "tags": [
   "where-vs-having",
   "group-by",
   "having"
  ],
  "prompt": "<p>Table <code>trades(trader, qty)</code>. You want traders whose <b>total</b> qty exceeds 100. Which query is correct?</p>",
  "answer": {
   "type": "choice",
   "options": [
    "SELECT trader FROM trades WHERE SUM(qty) > 100 GROUP BY trader;",
    "SELECT trader FROM trades GROUP BY trader HAVING SUM(qty) > 100;",
    "SELECT trader FROM trades WHERE qty > 100 GROUP BY trader;",
    "SELECT trader FROM trades GROUP BY trader ORDER BY SUM(qty) > 100;"
   ],
   "correct": 1,
   "display": "SELECT trader FROM trades GROUP BY trader HAVING SUM(qty) > 100;"
  },
  "hints": [
   "WHERE runs before grouping, so aggregates don't exist yet."
  ],
  "solution": "<p>WHERE filters <i>individual rows</i> before GROUP BY, so an aggregate like SUM can't appear there. Option A is a syntax error.</p><p>Option C answers a different question: traders with at least one single trade over 100.</p><p>Option D only sorts. It filters nothing.</p><p>HAVING filters <i>groups</i> after aggregation, so the answer is <b>option B</b>.</p>",
  "key": "WHERE filters rows before grouping; HAVING filters groups after aggregation."
 },
 {
  "id": "sql-012",
  "cat": "sql",
  "diff": 2,
  "title": "Logical order of evaluation",
  "tags": [
   "query-order",
   "where-vs-having"
  ],
  "prompt": "<p>In what <b>logical</b> order does SQL evaluate the clauses of a SELECT statement? (This is why a SELECT alias usually can't be used in WHERE.)</p>",
  "answer": {
   "type": "choice",
   "options": [
    "SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY",
    "FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY",
    "FROM → GROUP BY → WHERE → HAVING → SELECT → ORDER BY",
    "FROM → WHERE → SELECT → GROUP BY → HAVING → ORDER BY"
   ],
   "correct": 1,
   "display": "FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY"
  },
  "hints": [
   "Rows must exist before you can filter them, and groups must exist before you can filter groups."
  ],
  "solution": "<p><b>FROM/JOIN</b> builds the rows. <b>WHERE</b> filters rows. <b>GROUP BY</b> forms groups. <b>HAVING</b> filters groups. <b>SELECT</b> computes output columns and aliases (window functions run here). Then DISTINCT, then <b>ORDER BY</b> (which can see aliases), then LIMIT.</p><p>WHERE runs before SELECT, so it cannot see <code>SELECT qty*px AS notional</code>'s alias. ORDER BY can. It also explains why you can't filter on a window function in WHERE: wrap it in a subquery or CTE.</p><p>Answer: <b>FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY</b>.</p>",
  "key": "FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT."
 },
 {
  "id": "sql-013",
  "cat": "sql",
  "diff": 2,
  "title": "DISTINCT and NULL",
  "tags": [
   "distinct",
   "nulls",
   "count"
  ],
  "prompt": "<p><b>visits</b></p><table><thead><tr><th>user</th><th>city</th></tr></thead><tbody><tr><td>u1</td><td>MTL</td></tr><tr><td>u2</td><td>TOR</td></tr><tr><td>u3</td><td>MTL</td></tr><tr><td>u4</td><td><i>NULL</i></td></tr><tr><td>u5</td><td>NYC</td></tr><tr><td>u6</td><td>TOR</td></tr></tbody></table><p>How many rows does this return?</p><pre><code>SELECT DISTINCT city FROM visits;</code></pre>",
  "answer": {
   "type": "numeric",
   "value": 4,
   "display": "4"
  },
  "hints": [
   "COUNT(DISTINCT city) would ignore NULL. Does SELECT DISTINCT?"
  ],
  "solution": "<p>The distinct values are MTL, TOR and NYC, and NULL also forms one row of its own. DISTINCT treats all NULLs as duplicates of each other.</p><p>Answer: <b>4</b> rows. By contrast, <code>COUNT(DISTINCT city)</code> = 3 because aggregates skip NULL.</p>",
  "key": "SELECT DISTINCT keeps one NULL row; COUNT(DISTINCT col) ignores NULL."
 },
 {
  "id": "sql-014",
  "cat": "sql",
  "diff": 1,
  "title": "RANK with ties",
  "tags": [
   "window-functions",
   "rank"
  ],
  "prompt": "<p><b>scores</b></p><table><thead><tr><th>name</th><th>score</th></tr></thead><tbody><tr><td>Ana</td><td>95</td></tr><tr><td>Ben</td><td>90</td></tr><tr><td>Cy</td><td>90</td></tr><tr><td>Dee</td><td>85</td></tr><tr><td>Eve</td><td>80</td></tr></tbody></table><p>What is Dee's value of <code>r</code>?</p><pre><code>SELECT name,\n       RANK() OVER (ORDER BY score DESC) AS r\nFROM scores;</code></pre>",
  "answer": {
   "type": "numeric",
   "value": 4,
   "display": "4"
  },
  "hints": [
   "Ben and Cy tie for second place. How many people are ahead of Dee?"
  ],
  "solution": "<p>Ana is 1. Ben and Cy tie, so both are 2. RANK then <i>skips</i>: the next rank is 1 + (number of rows ahead) = 4.</p><p>Answer: Dee has <b>4</b> (Eve has 5). With DENSE_RANK Dee would be 3; with ROW_NUMBER, 4, but Ben and Cy would get 2 and 3 in arbitrary order.</p>",
  "key": "RANK leaves gaps after ties; DENSE_RANK doesn't; ROW_NUMBER breaks ties arbitrarily."
 },
 {
  "id": "sql-015",
  "cat": "sql",
  "diff": 2,
  "title": "DENSE_RANK sequence",
  "tags": [
   "window-functions",
   "dense-rank",
   "rank"
  ],
  "prompt": "<p><b>scores</b></p><table><thead><tr><th>name</th><th>score</th></tr></thead><tbody><tr><td>Ana</td><td>95</td></tr><tr><td>Ben</td><td>90</td></tr><tr><td>Cy</td><td>90</td></tr><tr><td>Dee</td><td>85</td></tr><tr><td>Eve</td><td>80</td></tr><tr><td>Fay</td><td>80</td></tr></tbody></table><p>List the column <code>d</code> in output order, comma-separated.</p><pre><code>SELECT DENSE_RANK() OVER (ORDER BY score DESC) AS d\nFROM scores\nORDER BY score DESC, name;</code></pre>",
  "answer": {
   "type": "text",
   "accept": [
    "1, 2, 2, 3, 4, 4",
    "1,2,2,3,4,4",
    "1 2 2 3 4 4"
   ],
   "display": "1, 2, 2, 3, 4, 4"
  },
  "hints": [
   "DENSE_RANK = number of distinct scores strictly higher, plus 1."
  ],
  "solution": "<p>Scores in descending order: 95, 90, 90, 85, 80, 80.</p><p>DENSE_RANK gives each distinct value the next consecutive integer: 95 gets 1, 90 gets 2, 85 gets 3, 80 gets 4.</p><p>Answer: <b>1, 2, 2, 3, 4, 4</b>. RANK would give 1, 2, 2, 4, 5, 5, and ROW_NUMBER 1, 2, 3, 4, 5, 6.</p>",
  "key": "DENSE_RANK counts distinct values above you; RANK counts rows above you."
 },
 {
  "id": "sql-016",
  "cat": "sql",
  "diff": 2,
  "title": "Running PnL",
  "tags": [
   "window-functions",
   "running-sum",
   "subquery"
  ],
  "prompt": "<p><b>pnl</b></p><table><thead><tr><th>day</th><th>pnl</th></tr></thead><tbody><tr><td>1</td><td>100</td></tr><tr><td>2</td><td>-50</td></tr><tr><td>3</td><td>30</td></tr><tr><td>4</td><td>-80</td></tr><tr><td>5</td><td>120</td></tr></tbody></table><p>What does this return?</p><pre><code>SELECT MIN(cum)\nFROM (\n  SELECT day,\n         SUM(pnl) OVER (ORDER BY day) AS cum\n  FROM pnl\n) AS t;</code></pre>",
  "answer": {
   "type": "numeric",
   "value": 0,
   "display": "0"
  },
  "hints": [
   "Write out the cumulative sum day by day."
  ],
  "solution": "<p><code>SUM(...) OVER (ORDER BY day)</code> is a running total: 100, 50, 80, 0, 120.</p><p>The minimum is <b>0</b> (on day 4).</p><p>Note that the window function must sit in the inner query: an aggregate cannot wrap a window function directly in the same SELECT.</p>",
  "key": "SUM() OVER (ORDER BY t) = cumulative sum; aggregate over it in an outer query."
 },
 {
  "id": "sql-017",
  "cat": "sql",
  "diff": 3,
  "title": "Max drawdown in SQL",
  "tags": [
   "window-functions",
   "running-sum",
   "cte",
   "drawdown"
  ],
  "prompt": "<p><b>pnl</b></p><table><thead><tr><th>day</th><th>pnl</th></tr></thead><tbody><tr><td>1</td><td>100</td></tr><tr><td>2</td><td>-50</td></tr><tr><td>3</td><td>30</td></tr><tr><td>4</td><td>-80</td></tr><tr><td>5</td><td>120</td></tr></tbody></table><p>This computes the maximum drawdown of cumulative PnL (the largest drop from a running peak). What does it return?</p><pre><code>WITH c AS (\n  SELECT day,\n         SUM(pnl) OVER (ORDER BY day) AS cum\n  FROM pnl\n),\np AS (\n  SELECT day, cum,\n         MAX(cum) OVER (ORDER BY day) AS peak\n  FROM c\n)\nSELECT MAX(peak - cum) FROM p;</code></pre>",
  "answer": {
   "type": "numeric",
   "value": 100,
   "display": "100"
  },
  "hints": [
   "First cum: 100, 50, 80, 0, 120. Then the running maximum of cum.",
   "Drawdown each day = peak − cum."
  ],
  "solution": "<p>Cumulative PnL: 100, 50, 80, 0, 120.</p><p>Running peak: 100, 100, 100, 100, 120.</p><p>Drawdown (peak − cum): 0, 50, 20, 100, 0.</p><p>Maximum drawdown = <b>100</b> (from the 100 peak to 0 on day 4).</p><p>Chaining CTEs keeps each window step readable. A window function can't be nested directly inside another.</p>",
  "key": "Drawdown = running max of the equity curve minus the curve; stack window functions with CTEs."
 },
 {
  "id": "sql-018",
  "cat": "sql",
  "diff": 2,
  "title": "Daily returns with LAG",
  "tags": [
   "window-functions",
   "lag",
   "returns"
  ],
  "prompt": "<p><b>prices</b></p><table><thead><tr><th>day</th><th>px</th></tr></thead><tbody><tr><td>1</td><td>100</td></tr><tr><td>2</td><td>104</td></tr><tr><td>3</td><td>101.4</td></tr><tr><td>4</td><td>106.47</td></tr></tbody></table><p>What is <code>ret</code> on day 3? Give a decimal.</p><pre><code>SELECT day,\n       ROUND(px / LAG(px) OVER (ORDER BY day)\n             - 1, 4) AS ret\nFROM prices;</code></pre>",
  "answer": {
   "type": "numeric",
   "value": -0.025,
   "display": "-0.025",
   "tolAbs": 5e-05
  },
  "hints": [
   "LAG(px) is the previous day's price.",
   "Day 3 return = 101.4 / 104 − 1."
  ],
  "solution": "<p><code>LAG(px) OVER (ORDER BY day)</code> returns the previous row's price (NULL on day 1, so day 1's return is NULL).</p><p>Day 3: 101.4 / 104 = 0.975, so the return is 0.975 − 1 = <b>−0.025</b> (−2.5%).</p><p>For reference, day 2 is +0.04 and day 4 is 106.47 / 101.4 − 1 = +0.05.</p>",
  "key": "Simple return = px / LAG(px) − 1; the first row is NULL."
 },
 {
  "id": "sql-019",
  "cat": "sql",
  "diff": 2,
  "title": "Moving average edge effect",
  "tags": [
   "window-functions",
   "moving-average",
   "rows-between"
  ],
  "prompt": "<p><b>px</b></p><table><thead><tr><th>day</th><th>close</th></tr></thead><tbody><tr><td>1</td><td>10</td></tr><tr><td>2</td><td>12</td></tr><tr><td>3</td><td>14</td></tr><tr><td>4</td><td>13</td></tr><tr><td>5</td><td>16</td></tr></tbody></table><p>What is <code>ma3</code> on day 2?</p><pre><code>SELECT day,\n       AVG(close) OVER (\n         ORDER BY day\n         ROWS BETWEEN 2 PRECEDING\n              AND CURRENT ROW\n       ) AS ma3\nFROM px;</code></pre>",
  "answer": {
   "type": "numeric",
   "value": 11,
   "display": "11"
  },
  "hints": [
   "On day 2, how many rows are actually in the frame?"
  ],
  "solution": "<p>The frame is the current row plus up to 2 earlier rows. On day 2 only days 1 and 2 exist, so the average is (10 + 12) / 2 = <b>11</b>. It is <i>not</i> NULL, and it is not divided by 3.</p><p>From day 3 on it is a true 3-day average: 12, 13, 14.33. In backtests, either drop the warm-up rows or require <code>COUNT(*) OVER (same frame) = 3</code>. Otherwise early signals use fewer observations.</p>",
  "key": "ROWS BETWEEN n PRECEDING frames are partial at the start; AVG divides by rows present."
 },
 {
  "id": "sql-020",
  "cat": "sql",
  "diff": 2,
  "title": "Second-highest salary",
  "tags": [
   "subquery",
   "aggregates",
   "ties"
  ],
  "prompt": "<p><b>salaries</b></p><table><thead><tr><th>name</th><th>salary</th></tr></thead><tbody><tr><td>A</td><td>100</td></tr><tr><td>B</td><td>120</td></tr><tr><td>C</td><td>120</td></tr><tr><td>D</td><td>90</td></tr><tr><td>E</td><td>110</td></tr></tbody></table><p>What does this return?</p><pre><code>SELECT MAX(salary)\nFROM salaries\nWHERE salary &lt; (SELECT MAX(salary)\n                FROM salaries);</code></pre>",
  "answer": {
   "type": "numeric",
   "value": 110,
   "display": "110"
  },
  "hints": [
   "The inner query gives 120. What is the largest salary strictly below it?"
  ],
  "solution": "<p>The inner query returns 120. Among salaries &lt; 120 (100, 90, 110) the maximum is <b>110</b>.</p><p>A common trap: <code>ORDER BY salary DESC LIMIT 1 OFFSET 1</code> returns 120 here, because B and C tie at the top. Use the subquery, <code>DENSE_RANK() = 2</code>, or <code>SELECT DISTINCT salary … OFFSET 1</code>.</p>",
  "key": "\"Second highest\" means second distinct value; watch ties at the top."
 },
 {
  "id": "sql-021",
  "cat": "sql",
  "diff": 3,
  "title": "Top 2 per desk",
  "tags": [
   "top-n-per-group",
   "row-number",
   "cte",
   "window-functions"
  ],
  "prompt": "<p><b>pnl</b></p><table><thead><tr><th>desk</th><th>trader</th><th>pnl</th></tr></thead><tbody><tr><td>FX</td><td>ann</td><td>50</td></tr><tr><td>FX</td><td>bob</td><td>80</td></tr><tr><td>FX</td><td>cat</td><td>80</td></tr><tr><td>FX</td><td>dan</td><td>10</td></tr><tr><td>EQ</td><td>eve</td><td>30</td></tr><tr><td>EQ</td><td>fay</td><td>70</td></tr><tr><td>EQ</td><td>gus</td><td>-20</td></tr><tr><td>RT</td><td>hal</td><td>40</td></tr></tbody></table><p>What does this return?</p><pre><code>WITH r AS (\n  SELECT desk, trader, pnl,\n         ROW_NUMBER() OVER (\n           PARTITION BY desk\n           ORDER BY pnl DESC) AS rn\n  FROM pnl\n)\nSELECT SUM(pnl) FROM r WHERE rn &lt;= 2;</code></pre>",
  "answer": {
   "type": "numeric",
   "value": 300,
   "display": "300"
  },
  "hints": [
   "PARTITION BY restarts the numbering for each desk.",
   "The RT desk has only one trader. Is it still included?"
  ],
  "solution": "<p>FX: bob 80 and cat 80 get rn 1 and 2 (in either order), summing to 160.</p><p>EQ: fay 70 and eve 30, summing to 100. RT: hal 40 is the only row, with rn = 1, so 40.</p><p>Total = 160 + 100 + 40 = <b>300</b>.</p><p>The filter must go in an outer query or CTE, because WHERE is evaluated before window functions. Because of the FX tie, which two FX rows are picked is arbitrary, but here the sum is the same either way.</p>",
  "key": "Top-N per group = ROW_NUMBER() OVER (PARTITION BY g ORDER BY x DESC) in a CTE, then WHERE rn ≤ N."
 },
 {
  "id": "sql-022",
  "cat": "sql",
  "diff": 3,
  "title": "Top 2 with ties",
  "tags": [
   "top-n-per-group",
   "dense-rank",
   "rank",
   "row-number"
  ],
  "prompt": "<p>Table <code>pnl(desk, trader, pnl)</code>. You want <b>every trader whose PnL is among the two highest distinct PnL values on their desk</b> (ties included). Inside a CTE you compute <code>x</code> <code>OVER (PARTITION BY desk ORDER BY pnl DESC)</code> and keep <code>x &lt;= 2</code>. Which function should x be?</p>",
  "answer": {
   "type": "choice",
   "options": [
    "ROW_NUMBER()",
    "RANK()",
    "DENSE_RANK()",
    "NTILE(2)"
   ],
   "correct": 2,
   "display": "DENSE_RANK()"
  },
  "hints": [
   "Try it on PnLs 80, 80, 50, 10. You want 80, 80 and 50."
  ],
  "solution": "<p>On desk PnLs 80, 80, 50, 10:</p><ul><li>ROW_NUMBER gives 1, 2, 3, 4. Keeping ≤ 2 returns only the two 80s, so the 50 is lost.</li><li>RANK gives 1, 1, 3, 4. Keeping ≤ 2 also loses the 50.</li><li>DENSE_RANK gives 1, 1, 2, 3. Keeping ≤ 2 returns 80, 80, 50. Correct.</li><li>NTILE(2) splits rows into halves, which is unrelated to distinct values.</li></ul><p>Answer: <b>DENSE_RANK()</b>. Use ROW_NUMBER when you need exactly N rows, and RANK when you want 'top N positions, including ties for the last place'.</p>",
  "key": "Exactly N rows → ROW_NUMBER; top N distinct values → DENSE_RANK; ties at the cutoff → RANK."
 },
 {
  "id": "sql-023",
  "cat": "sql",
  "diff": 3,
  "title": "Counting orders per customer",
  "tags": [
   "left-join",
   "count",
   "nulls",
   "group-by"
  ],
  "prompt": "<p><b>customers</b></p><table><thead><tr><th>id</th><th>name</th></tr></thead><tbody><tr><td>1</td><td>Ana</td></tr><tr><td>2</td><td>Ben</td></tr><tr><td>3</td><td>Cy</td></tr><tr><td>4</td><td>Dee</td></tr></tbody></table><p><b>orders</b></p><table><thead><tr><th>id</th><th>cust_id</th><th>amount</th></tr></thead><tbody><tr><td>10</td><td>1</td><td>50</td></tr><tr><td>11</td><td>1</td><td>20</td></tr><tr><td>12</td><td>2</td><td>70</td></tr><tr><td>13</td><td>3</td><td>5</td></tr></tbody></table><p>What value of <code>n</code> does this report for <b>Dee</b>, who has never ordered?</p><pre><code>SELECT c.name, COUNT(*) AS n\nFROM customers c\nLEFT JOIN orders o ON o.cust_id = c.id\nGROUP BY c.name;</code></pre>",
  "answer": {
   "type": "numeric",
   "value": 1,
   "display": "1"
  },
  "hints": [
   "How many rows does Dee have after the LEFT JOIN?",
   "Does COUNT(*) care that o.id is NULL in that row?"
  ],
  "solution": "<p>After the LEFT JOIN, Dee has one row with all order columns NULL.</p><p><code>COUNT(*)</code> counts rows, so Dee gets <b>1</b>. That's a classic bug.</p><p>Fix: <code>COUNT(o.id)</code>, which ignores the NULL and gives 0.</p>",
  "key": "After a LEFT JOIN count a right-table column (COUNT(o.id)), not COUNT(*)."
 },
 {
  "id": "sql-024",
  "cat": "sql",
  "diff": 3,
  "title": "Join fan-out inflates sums",
  "tags": [
   "joins",
   "fan-out",
   "aggregates"
  ],
  "prompt": "<p><b>orders</b></p><table><thead><tr><th>order_id</th><th>amount</th></tr></thead><tbody><tr><td>1</td><td>100</td></tr><tr><td>2</td><td>50</td></tr></tbody></table><p><b>shipments</b></p><table><thead><tr><th>order_id</th><th>ship_id</th></tr></thead><tbody><tr><td>1</td><td>a</td></tr><tr><td>1</td><td>b</td></tr><tr><td>2</td><td>c</td></tr></tbody></table><p>The true revenue is 150. What does this query return?</p><pre><code>SELECT SUM(o.amount)\nFROM orders o\nJOIN shipments s\n  ON s.order_id = o.order_id;</code></pre>",
  "answer": {
   "type": "numeric",
   "value": 250,
   "display": "250"
  },
  "hints": [
   "How many times does order 1 appear after the join?"
  ],
  "solution": "<p>Order 1 has two shipments, so it appears twice after the join. Order 2 appears once.</p><p>SUM = 100 + 100 + 50 = <b>250</b>, so revenue is overstated by 100.</p><p>Fix: aggregate each table to the join grain <i>before</i> joining (e.g. count shipments per order in a CTE), or use <code>EXISTS</code> when you only need to filter. Checking row counts before and after a join is a good habit.</p>",
  "key": "Joining to a one-to-many table duplicates the 'one' side; aggregate to the right grain before joining."
 },
 {
  "id": "ml-001",
  "cat": "ml",
  "diff": 1,
  "title": "Precision from a confusion matrix",
  "tags": [
   "metrics",
   "precision",
   "confusion-matrix"
  ],
  "prompt": "<p>A fraud classifier is evaluated on 1,000 transactions:</p><table><thead><tr><th></th><th>Pred +</th><th>Pred −</th></tr></thead><tbody><tr><th>Actual +</th><td>40</td><td>20</td></tr><tr><th>Actual −</th><td>10</td><td>930</td></tr></tbody></table><p>What is its <b>precision</b>? Give a decimal.</p>",
  "answer": {
   "type": "numeric",
   "value": 0.8,
   "display": "40/50 = 0.8"
  },
  "hints": [
   "Precision asks: of everything flagged positive, how much really was positive?",
   "Precision = TP / (TP + FP)."
  ],
  "solution": "<p>TP = 40 (actual +, predicted +). FP = 10 (actual −, predicted +).</p><p>Precision = TP / (TP + FP) = 40 / 50 = 0.8.</p><p>Answer: 0.8 — 80% of the alerts are real fraud.</p>",
  "key": "Precision = TP/(TP+FP): the quality of the positive predictions."
 },
 {
  "id": "ml-002",
  "cat": "ml",
  "diff": 2,
  "title": "Recall and F1",
  "tags": [
   "metrics",
   "recall",
   "f1",
   "confusion-matrix"
  ],
  "prompt": "<p>Same classifier as before:</p><table><thead><tr><th></th><th>Pred +</th><th>Pred −</th></tr></thead><tbody><tr><th>Actual +</th><td>40</td><td>20</td></tr><tr><th>Actual −</th><td>10</td><td>930</td></tr></tbody></table><p>What is its <b>F1 score</b>? Give a fraction or decimal.</p>",
  "answer": {
   "type": "numeric",
   "value": 0.7272727272727273,
   "display": "8/11 ≈ 0.727"
  },
  "hints": [
   "First get recall = TP / (TP + FN).",
   "F1 is the harmonic mean: 2PR / (P + R)."
  ],
  "solution": "<p>Precision P = 40/50 = 0.8. Recall R = TP/(TP+FN) = 40/60 = 2/3.</p><p>F1 = 2PR/(P+R) = 2·0.8·(2/3) / (0.8 + 2/3) = (16/15)/(22/15) = 16/22 = 8/11.</p><p>Shortcut: F1 = 2TP / (2TP + FP + FN) = 80 / (80 + 10 + 20) = 80/110 = 8/11.</p><p>Answer: 8/11 ≈ 0.727.</p>",
  "key": "F1 = 2TP/(2TP+FP+FN), the harmonic mean of precision and recall; it ignores TN."
 },
 {
  "id": "ml-003",
  "cat": "ml",
  "diff": 1,
  "title": "The accuracy paradox",
  "tags": [
   "metrics",
   "class-imbalance",
   "accuracy"
  ],
  "prompt": "<p>A dataset has 1,000 card transactions, of which 10 are fraudulent. A lazy model always predicts “not fraud”.</p><p>What is its <b>accuracy</b>? Give a decimal.</p>",
  "answer": {
   "type": "numeric",
   "value": 0.99,
   "display": "0.99"
  },
  "hints": [
   "Accuracy = correct predictions / all predictions.",
   "It gets every legitimate transaction right and every fraud wrong."
  ],
  "solution": "<p>It is right on the 990 legitimate transactions and wrong on the 10 frauds: accuracy = 990/1000 = 0.99.</p><p>Yet its recall on fraud is 0 — it catches nothing. With heavy class imbalance, accuracy is dominated by the majority class. Use precision/recall, F1, PR-AUC, or cost-weighted metrics, and consider class weights or resampling.</p><p>Answer: 0.99.</p>",
  "key": "Under class imbalance a trivial majority-class model gets high accuracy; look at recall/precision instead."
 },
 {
  "id": "ml-004",
  "cat": "ml",
  "diff": 3,
  "title": "ROC-AUC by counting pairs",
  "tags": [
   "metrics",
   "roc-auc",
   "ranking"
  ],
  "prompt": "<p>A model outputs scores for 3 positives and 4 negatives:</p><ul><li>Positives: 0.9, 0.8, 0.4</li><li>Negatives: 0.8, 0.3, 0.2, 0.1</li></ul><p>Using the interpretation AUC = P(random positive scores higher than random negative), with ties counting ½, what is the <b>ROC-AUC</b>? Give a fraction or decimal.</p>",
  "answer": {
   "type": "numeric",
   "value": 0.875,
   "display": "10.5/12 = 7/8 = 0.875"
  },
  "hints": [
   "There are 3 × 4 = 12 (positive, negative) pairs. Count the ones ranked correctly.",
   "The positive 0.8 ties with the negative 0.8: that pair counts ½."
  ],
  "solution": "<p>All 12 pairs:</p><ul><li>Positive 0.9 beats all 4 negatives → 4.</li><li>Positive 0.8 ties 0.8 (½) and beats 0.3, 0.2, 0.1 → 3.5.</li><li>Positive 0.4 loses to 0.8, beats 0.3, 0.2, 0.1 → 3.</li></ul><p>AUC = (4 + 3.5 + 3)/12 = 10.5/12 = 0.875.</p><p>This equals the area under the ROC curve (it is the Mann–Whitney U statistic divided by n₊n₋). AUC only depends on the <i>ranking</i> of scores, not on their calibration.</p><p>Answer: 0.875.</p>",
  "key": "AUC = probability a random positive is scored above a random negative (ties ½) — a pure ranking metric."
 },
 {
  "id": "ml-005",
  "cat": "ml",
  "diff": 2,
  "title": "Log-loss of three predictions",
  "tags": [
   "metrics",
   "log-loss",
   "cross-entropy"
  ],
  "prompt": "<p>Labels y = (1, 0, 1) and predicted probabilities of class 1 are p = (0.9, 0.2, 0.6).</p><p>What is the average <b>log-loss</b> (binary cross-entropy, natural log)? Round to 3 decimals.</p>",
  "answer": {
   "type": "numeric",
   "value": 0.2797765635793423,
   "display": "≈ 0.280"
  },
  "hints": [
   "Each example contributes −ln(probability assigned to the true class).",
   "The true-class probabilities are 0.9, 0.8 (= 1 − 0.2) and 0.6."
  ],
  "solution": "<p>Log-loss = −(1/n) Σ [y ln p + (1−y) ln(1−p)].</p><p>Example 1 (y=1): −ln 0.9 ≈ 0.1054. Example 2 (y=0): −ln 0.8 ≈ 0.2231. Example 3 (y=1): −ln 0.6 ≈ 0.5108.</p><p>Average = (0.1054 + 0.2231 + 0.5108)/3 ≈ 0.8393/3 ≈ 0.280.</p><p>Note how the least confident correct prediction (0.6) contributes most; a confident wrong prediction (say p = 0.01 for a positive) would add −ln 0.01 ≈ 4.6 on its own.</p><p>Answer: ≈ 0.280.</p>",
  "key": "Log-loss averages −ln(probability given to the true class); it punishes confident mistakes heavily."
 },
 {
  "id": "ml-006",
  "cat": "ml",
  "diff": 1,
  "title": "R² from predictions",
  "tags": [
   "metrics",
   "r-squared",
   "regression"
  ],
  "prompt": "<p>True values y = (2, 4, 6, 8); a model predicts ŷ = (3, 4, 5, 9).</p><p>What is R² = 1 − SSE/SST? Give a decimal.</p>",
  "answer": {
   "type": "numeric",
   "value": 0.85,
   "display": "1 − 3/20 = 0.85"
  },
  "hints": [
   "SSE = Σ(y − ŷ)². SST = Σ(y − ȳ)² with ȳ = 5.",
   "SSE = 1 + 0 + 1 + 1 = 3."
  ],
  "solution": "<p>Residuals: −1, 0, 1, −1, so SSE = 1 + 0 + 1 + 1 = 3.</p><p>ȳ = 5, deviations −3, −1, 1, 3, so SST = 9 + 1 + 1 + 9 = 20.</p><p>R² = 1 − 3/20 = 0.85: the model explains 85% of the variance around the mean. (R² can be negative out of sample, when the model is worse than predicting ȳ.)</p><p>Answer: 0.85.</p>",
  "key": "R² = 1 − SSE/SST compares the model's squared error to that of always predicting the mean."
 },
 {
  "id": "ml-007",
  "cat": "ml",
  "diff": 3,
  "title": "Bias–variance decomposition of a shrunk mean",
  "tags": [
   "bias-variance",
   "shrinkage",
   "mse"
  ],
  "prompt": "<p>Y ~ N(μ, σ²) with μ = 2, σ² = 4. You observe n = 10 i.i.d. training values and predict a <i>new</i> independent Y with the shrunk estimator ŷ = 0.8·Ȳ.</p><p>What is the expected squared prediction error E[(Y<sub>new</sub> − ŷ)²]? Give a decimal.</p>",
  "answer": {
   "type": "numeric",
   "value": 4.416,
   "display": "0.16 + 0.256 + 4 = 4.416"
  },
  "hints": [
   "Expected prediction error = bias² + variance of ŷ + irreducible noise σ².",
   "Bias = 0.8μ − μ = −0.4; Var(ŷ) = 0.64 · σ²/n."
  ],
  "solution": "<p>Decompose: E[(Y<sub>new</sub> − ŷ)²] = Var(Y<sub>new</sub>) + (E[ŷ] − μ)² + Var(ŷ), since Y<sub>new</sub> is independent of ŷ.</p><p>Noise: σ² = 4.</p><p>Bias: E[ŷ] = 0.8 · 2 = 1.6, so bias = −0.4 and bias² = 0.16.</p><p>Variance: Var(ŷ) = 0.8² · σ²/n = 0.64 · 0.4 = 0.256.</p><p>Total = 4 + 0.16 + 0.256 = 4.416. For comparison, the unbiased Ȳ gives 4 + 0 + 0.4 = 4.4 — here shrinkage's variance reduction (0.4 → 0.256) is not quite worth the added bias² (0.16). With a smaller μ or noisier data it would be.</p><p>Answer: 4.416.</p>",
  "key": "Expected test MSE = bias² + variance + irreducible noise; shrinkage trades bias for variance."
 },
 {
  "id": "ml-008",
  "cat": "ml",
  "diff": 2,
  "title": "L1 vs L2: who zeroes coefficients?",
  "tags": [
   "regularization",
   "lasso",
   "ridge",
   "sparsity"
  ],
  "prompt": "<p>You fit a linear model on 200 features, many of them irrelevant, with a strong penalty. Which statement is correct?</p>",
  "answer": {
   "type": "choice",
   "options": [
    "Ridge (L2) sets many coefficients exactly to zero; Lasso (L1) only shrinks them.",
    "Lasso (L1) tends to set many coefficients exactly to zero; Ridge (L2) shrinks them toward zero but rarely to exactly zero.",
    "Both produce exactly the same coefficients for a large enough penalty.",
    "Neither penalty changes the coefficients if the features are standardized."
   ],
   "correct": 1,
   "display": "Lasso gives sparse solutions; Ridge shrinks smoothly."
  },
  "hints": [
   "Picture the constraint regions: |β₁| + |β₂| ≤ t versus β₁² + β₂² ≤ t.",
   "The L1 diamond has corners on the axes; the loss contours tend to touch it there."
  ],
  "solution": "<p>Penalized least squares = minimize the loss subject to a budget on ‖β‖. The L1 ball is a diamond with corners on the axes, so the first contact of the elliptical loss contours is often at a corner, where some coordinates are exactly 0 → sparse model (built-in feature selection).</p><p>The L2 ball is round: contact happens at a generic point, so coefficients shrink proportionally (in an orthonormal design, β<sub>ridge</sub> = β<sub>OLS</sub>/(1+λ)) but are not exactly zero. In the orthonormal case Lasso is soft-thresholding: sign(β)·max(|β| − λ/2, 0).</p><p>Ridge is preferable with many correlated, all-somewhat-useful features; Lasso when you believe only a few matter. Elastic net mixes both. Always standardize features first, since both penalties are scale-dependent.</p>",
  "key": "L1 (Lasso) → exact zeros/sparsity via corners of the diamond; L2 (Ridge) → smooth shrinkage."
 },
 {
  "id": "ml-009",
  "cat": "ml",
  "diff": 2,
  "title": "One-dimensional ridge regression",
  "tags": [
   "regularization",
   "ridge",
   "closed-form"
  ],
  "prompt": "<p>Fit y ≈ βx with no intercept by minimizing Σ(yᵢ − βxᵢ)² + λβ², with λ = 2, on the data x = (1, 2, 3), y = (2, 3, 5).</p><p>What is the ridge estimate β̂? Give a fraction or decimal.</p>",
  "answer": {
   "type": "numeric",
   "value": 1.4375,
   "display": "23/16 = 1.4375"
  },
  "hints": [
   "Differentiate with respect to β and set to zero.",
   "β̂ = Σxy / (Σx² + λ)."
  ],
  "solution": "<p>d/dβ: −2Σxᵢ(yᵢ − βxᵢ) + 2λβ = 0 ⇒ β̂ = Σxᵢyᵢ / (Σxᵢ² + λ).</p><p>Σxy = 2 + 6 + 15 = 23. Σx² = 1 + 4 + 9 = 14.</p><p>β̂ = 23/(14 + 2) = 23/16 = 1.4375, versus OLS 23/14 ≈ 1.643: the penalty shrinks the slope toward 0. In matrix form this is β̂ = (XᵀX + λI)⁻¹Xᵀy.</p><p>Answer: 23/16 = 1.4375.</p>",
  "key": "Ridge adds λ to the diagonal of XᵀX: β̂ = (XᵀX + λI)⁻¹Xᵀy, shrinking toward zero."
 },
 {
  "id": "ml-010",
  "cat": "ml",
  "diff": 1,
  "title": "How many model fits?",
  "tags": [
   "cross-validation",
   "hyperparameters",
   "grid-search"
  ],
  "prompt": "<p>You tune one hyperparameter over 10 candidate values using 5-fold cross-validation, then refit the chosen model once on all the training data.</p><p>How many times is the model trained in total?</p>",
  "answer": {
   "type": "numeric",
   "value": 51,
   "display": "5 × 10 + 1 = 51"
  },
  "hints": [
   "Each candidate value is trained once per fold.",
   "Don't forget the final refit."
  ],
  "solution": "<p>Each of the 10 candidates is fit on 5 different training folds: 10 × 5 = 50 fits. Then one final fit on the full training set with the best value: 50 + 1 = 51.</p><p>(This is exactly what scikit-learn's GridSearchCV does with refit=True.) The held-out test set is touched only once, after all of this.</p><p>Answer: 51.</p>",
  "key": "Grid search cost = (#candidates) × (#folds) + 1 refit."
 },
 {
  "id": "ml-011",
  "cat": "ml",
  "diff": 3,
  "title": "Cross-validating a return predictor",
  "tags": [
   "cross-validation",
   "time-series",
   "leakage",
   "finance"
  ],
  "prompt": "<p>You predict next-day returns of a stock from features built on rolling 20-day windows of past prices, using 10 years of daily data. Which validation setup gives an honest estimate of live performance?</p>",
  "answer": {
   "type": "choice",
   "options": [
    "Shuffle all days, standardize features using the mean/std of the whole dataset, then run 10-fold random K-fold CV.",
    "Random K-fold is fine because each prediction only uses past prices in its features.",
    "Walk-forward (expanding or rolling) validation: train on the past, test on the following block, fit any scaler on the training window only, and leave a gap (embargo) between train and test.",
    "Use the last year as the test set, but choose hyperparameters by checking which value scores best on that last year."
   ],
   "correct": 2,
   "display": "Walk-forward validation with train-only preprocessing and an embargo gap."
  },
  "hints": [
   "Ask: could information from the test period reach the model during training?",
   "Overlapping rolling windows and full-sample scaling both leak; so does tuning on the test set."
  ],
  "solution": "<p><b>Random K-fold</b> puts days from the future in the training set and the day before them in the test set. Because features use overlapping 20-day windows (and returns are autocorrelated / regime-dependent), neighbouring train and test rows share information → optimistic scores. Each row's features using only past data does not fix this: the <i>model</i> still learns from the future.</p><p><b>Full-sample standardization</b> leaks the future mean and volatility into training features. Fit scalers, imputers and feature selection inside each training window only (a pipeline).</p><p><b>Tuning on the test year</b> turns the test set into a validation set; its score is no longer an unbiased estimate.</p><p><b>Walk-forward</b> respects time order, mirrors how the model is used live, and an embargo/purge gap of about the window length removes overlap between train labels and test features.</p>",
  "key": "In time series, validate forward in time, fit all preprocessing on the training window only, and purge/embargo overlapping samples."
 },
 {
  "id": "ml-012",
  "cat": "ml",
  "diff": 1,
  "title": "Roles of train, validation and test",
  "tags": [
   "train-val-test",
   "model-selection",
   "overfitting"
  ],
  "prompt": "<p>A student compares 50 model variants and reports the best one's score on the <b>test</b> set — the same test set used to pick the winner. What is the main problem?</p>",
  "answer": {
   "type": "choice",
   "options": [
    "None; the test set is meant for choosing between models.",
    "The reported score is optimistically biased: selecting the best of many on the test set overfits to it, so it no longer estimates performance on new data.",
    "The test set is too small to train on.",
    "The model will underfit because it never saw the test data."
   ],
   "correct": 1,
   "display": "Selection on the test set makes its score optimistic."
  },
  "hints": [
   "If you try 50 variants, one will look good partly by luck.",
   "Which split should be used for selection, and which only once at the very end?"
  ],
  "solution": "<p>Training set: fit parameters. Validation set (or CV): choose hyperparameters/models. Test set: evaluate <i>once</i> at the end.</p><p>Picking the maximum of 50 noisy test scores selects partly on noise (a winner's curse), so the reported number is biased upward — the test set has become a validation set. The fix: select with validation/CV and keep a pristine test set, or use nested CV.</p><p>This is the ML version of p-hacking / backtest overfitting in quant research.</p>",
  "key": "Train fits, validation selects, test evaluates once; reusing the test set for selection makes it optimistic."
 },
 {
  "id": "ml-013",
  "cat": "ml",
  "diff": 1,
  "title": "Two steps of gradient descent",
  "tags": [
   "optimization",
   "gradient-descent",
   "learning-rate"
  ],
  "prompt": "<p>Minimize f(w) = (w − 3)² by gradient descent from w₀ = 0 with learning rate η = 0.1.</p><p>What is w₂ (after two updates)? Give a decimal.</p>",
  "answer": {
   "type": "numeric",
   "value": 1.08,
   "display": "1.08"
  },
  "hints": [
   "f′(w) = 2(w − 3); update w ← w − η f′(w).",
   "w₁ = 0 − 0.1·(−6) = 0.6."
  ],
  "solution": "<p>f′(w) = 2(w − 3).</p><p>Step 1: f′(0) = −6, w₁ = 0 + 0.6 = 0.6.</p><p>Step 2: f′(0.6) = −4.8, w₂ = 0.6 + 0.48 = 1.08.</p><p>In general w<sub>t</sub> − 3 = (1 − 2η)<sup>t</sup>(w₀ − 3) = 0.8<sup>t</sup> · (−3); for t = 2: 3 − 3·0.64 = 1.08. The error shrinks geometrically by a factor 0.8 per step.</p><p>Answer: 1.08.</p>",
  "key": "On a quadratic, gradient descent contracts the error by a constant factor (1 − ηf″) each step."
 },
 {
  "id": "ml-014",
  "cat": "ml",
  "diff": 3,
  "title": "When does gradient descent blow up?",
  "tags": [
   "optimization",
   "gradient-descent",
   "learning-rate",
   "convergence"
  ],
  "prompt": "<p>Gradient descent on f(w) = 5(w − 1)² with a fixed learning rate η &gt; 0.</p><p>What is the critical learning rate η* such that the iterates converge to the minimum from any start for 0 &lt; η &lt; η*, and fail to converge for η ≥ η*?</p>",
  "answer": {
   "type": "numeric",
   "value": 0.2,
   "display": "η* = 0.2 (= 2/f″)"
  },
  "hints": [
   "Write the update in terms of e = w − 1.",
   "e ← (1 − 10η)e; you need |1 − 10η| &lt; 1."
  ],
  "solution": "<p>f′(w) = 10(w − 1), so with e = w − 1: e<sub>t+1</sub> = e<sub>t</sub> − 10η e<sub>t</sub> = (1 − 10η)e<sub>t</sub>.</p><p>Convergence ⇔ |1 − 10η| &lt; 1 ⇔ 0 &lt; η &lt; 0.2. At η = 0.2 the factor is −1 (oscillates forever between ±e₀); above it, the iterates oscillate with growing amplitude and diverge.</p><p>General rule: for a quadratic with curvature L = f″ (largest Hessian eigenvalue in many dimensions), GD converges iff η &lt; 2/L; η = 1/L is the one-step optimum here (factor 0). Ill-conditioned problems (large L/μ) force a small η and slow progress along flat directions — one reason to scale features.</p><p>Answer: η* = 0.2.</p>",
  "key": "GD on a quadratic converges iff η < 2/L where L is the largest curvature; too large a step oscillates and diverges."
 },
 {
  "id": "ml-015",
  "cat": "ml",
  "diff": 1,
  "title": "Reading a logistic coefficient",
  "tags": [
   "logistic-regression",
   "odds",
   "interpretation"
  ],
  "prompt": "<p>In a logistic regression for default, the coefficient on “number of late payments” is 0.7.</p><p>By what factor are the <b>odds</b> of default multiplied for each extra late payment (holding everything else fixed)? Round to 2 decimals.</p>",
  "answer": {
   "type": "numeric",
   "value": 2.0137527074704766,
   "display": "e^0.7 ≈ 2.01"
  },
  "hints": [
   "The model is linear in the log-odds: ln(p/(1−p)) = β₀ + βx.",
   "Increasing x by 1 adds β to the log-odds."
  ],
  "solution": "<p>ln(odds) = β₀ + 0.7x + …. Raising x by 1 adds 0.7 to the log-odds, i.e. multiplies the odds by e<sup>0.7</sup> ≈ 2.01.</p><p>So each extra late payment roughly doubles the odds of default. Note this is the <i>odds</i>, not the probability: the change in probability depends on the starting level (largest near p = 0.5, where dp/dx = β·p(1−p)).</p><p>Answer: ≈ 2.01.</p>",
  "key": "A logistic coefficient β multiplies the odds by e^β per unit increase of its feature."
 },
 {
  "id": "ml-016",
  "cat": "ml",
  "diff": 1,
  "title": "From logit to probability",
  "tags": [
   "logistic-regression",
   "sigmoid"
  ],
  "prompt": "<p>A logistic model has intercept β₀ = −1 and slope β₁ = 0.5. For x = 4, what probability does it predict? Round to 3 decimals.</p>",
  "answer": {
   "type": "numeric",
   "value": 0.7310585786300049,
   "display": "σ(1) ≈ 0.731"
  },
  "hints": [
   "Compute the logit z = β₀ + β₁x first.",
   "p = σ(z) = 1/(1 + e^(−z)); here z = 1."
  ],
  "solution": "<p>z = −1 + 0.5·4 = 1.</p><p>p = 1/(1 + e<sup>−1</sup>) = 1/(1 + 0.3679) ≈ 0.731.</p><p>Handy values: σ(0) = 0.5, σ(1) ≈ 0.73, σ(2) ≈ 0.88, σ(−z) = 1 − σ(z).</p><p>Answer: ≈ 0.731.</p>",
  "key": "Logistic regression: probability = sigmoid(linear score), σ(z) = 1/(1+e^(−z))."
 },
 {
  "id": "ml-017",
  "cat": "ml",
  "diff": 1,
  "title": "Gini impurity of a node",
  "tags": [
   "decision-trees",
   "gini",
   "impurity"
  ],
  "prompt": "<p>A decision-tree node contains 30 positive and 10 negative examples. What is its <b>Gini impurity</b> 1 − Σ p<sub>k</sub>²? Give a decimal.</p>",
  "answer": {
   "type": "numeric",
   "value": 0.375,
   "display": "1 − (0.75² + 0.25²) = 0.375"
  },
  "hints": [
   "Class proportions are 0.75 and 0.25.",
   "1 − (0.5625 + 0.0625)."
  ],
  "solution": "<p>p₊ = 30/40 = 0.75, p₋ = 0.25.</p><p>Gini = 1 − (0.75² + 0.25²) = 1 − (0.5625 + 0.0625) = 0.375. Equivalently 2p(1−p) = 2·0.75·0.25.</p><p>Gini is 0 for a pure node and maximal (0.5 for two classes) at a 50/50 split. Trees choose the split that most reduces the weighted impurity of the children.</p><p>Answer: 0.375.</p>",
  "key": "Gini = 1 − Σp_k² (= 2p(1−p) for two classes): the chance two random draws from the node disagree."
 },
 {
  "id": "ml-018",
  "cat": "ml",
  "diff": 3,
  "title": "Information gain of a split",
  "tags": [
   "decision-trees",
   "entropy",
   "information-gain"
  ],
  "prompt": "<p>A node has 8 positives and 8 negatives. A split sends 6 positives + 2 negatives left, and 2 positives + 6 negatives right.</p><p>What is the <b>information gain</b> (entropy in bits, parent entropy minus weighted child entropy)? Round to 3 decimals.</p>",
  "answer": {
   "type": "numeric",
   "value": 0.18872187554086717,
   "display": "1 − H(0.25) ≈ 0.189"
  },
  "hints": [
   "Parent entropy of a 50/50 node is 1 bit.",
   "Both children have class proportions 3/4 and 1/4: H = −(¾ log₂ ¾ + ¼ log₂ ¼) ≈ 0.811."
  ],
  "solution": "<p>Parent: H(½) = 1 bit.</p><p>Each child has proportions ¾/¼: H = ¼·log₂4 + ¾·log₂(4/3) = 0.5 + 0.75·0.415 ≈ 0.811 bits.</p><p>Weighted child entropy = ½·0.811 + ½·0.811 = 0.811.</p><p>Gain = 1 − 0.811 ≈ 0.189 bits.</p><p>Answer: ≈ 0.189.</p>",
  "key": "Information gain = H(parent) − Σ (n_child/n) H(child); trees greedily pick the split maximizing it."
 },
 {
  "id": "ml-019",
  "cat": "ml",
  "diff": 2,
  "title": "Random forest vs gradient boosting",
  "tags": [
   "ensembles",
   "random-forest",
   "boosting",
   "bias-variance"
  ],
  "prompt": "<p>Which statement best contrasts random forests and gradient boosting?</p>",
  "answer": {
   "type": "choice",
   "options": [
    "Random forests fit trees sequentially to the residuals; boosting averages independent trees.",
    "Random forests average many deep, decorrelated trees trained on bootstrap samples (mainly reducing variance); boosting adds shallow trees sequentially, each fitting the current errors (mainly reducing bias).",
    "Both are identical except that boosting uses more trees.",
    "Boosting cannot overfit, no matter how many trees are added."
   ],
   "correct": 1,
   "display": "RF: parallel averaging of deep trees → variance reduction. Boosting: sequential weak learners → bias reduction."
  },
  "hints": [
   "One method is parallel (bagging), the other sequential.",
   "Which one keeps fitting what is still wrong?"
  ],
  "solution": "<p><b>Random forest</b> = bagging + random feature subsets. Deep trees have low bias but high variance; averaging B decorrelated trees cuts the variance. Adding more trees doesn't overfit (it just converges); it is robust with little tuning.</p><p><b>Gradient boosting</b> builds shallow trees one after another, each fit to the negative gradient of the loss (the residuals for MSE), scaled by a learning rate. It steadily reduces bias and is often the most accurate on tabular data, but it <i>can</i> overfit with too many trees or too high a learning rate — use early stopping on a validation set.</p>",
  "key": "Bagging/RF averages deep trees to cut variance; boosting adds shallow trees sequentially to cut bias (needs early stopping)."
 },
 {
  "id": "ml-020",
  "cat": "ml",
  "diff": 2,
  "title": "One k-means iteration",
  "tags": [
   "clustering",
   "k-means",
   "unsupervised"
  ],
  "prompt": "<p>Points: (0,0), (2,0), (0,2), (3,3), (8,8). k-means with k = 2 starts from centroids c₁ = (0,0) and c₂ = (4,4).</p><p>After one assignment step and one update step, what is the <b>x-coordinate of c₂</b>?</p>",
  "answer": {
   "type": "numeric",
   "value": 5.5,
   "display": "5.5 (c₂ = (5.5, 5.5))"
  },
  "hints": [
   "Assign each point to its nearest centroid (Euclidean distance).",
   "(3,3) is √18 ≈ 4.24 from c₁ but √2 from c₂."
  ],
  "solution": "<p>Assignment: (0,0), (2,0), (0,2) are closer to c₁ (e.g. (2,0): distance 2 vs √20). (3,3) is √2 from c₂ vs √18 from c₁, and (8,8) is clearly closer to c₂.</p><p>Update: c₁ = mean of (0,0),(2,0),(0,2) = (⅔, ⅔); c₂ = mean of (3,3),(8,8) = (5.5, 5.5).</p><p>k-means alternates these two steps; each step can only decrease the within-cluster sum of squares, so it converges — but only to a local optimum that depends on initialization (hence k-means++ and multiple restarts).</p><p>Answer: 5.5.</p>",
  "key": "k-means alternates: assign to nearest centroid, move each centroid to the mean of its points."
 },
 {
  "id": "ml-021",
  "cat": "ml",
  "diff": 2,
  "title": "How many principal components?",
  "tags": [
   "pca",
   "dimensionality-reduction",
   "explained-variance"
  ],
  "prompt": "<p>The covariance matrix of 5 standardized features has eigenvalues 5, 2.5, 1.5, 0.6, 0.4.</p><p>What is the smallest number of principal components that explains at least 90% of the variance?</p>",
  "answer": {
   "type": "numeric",
   "value": 3,
   "display": "3"
  },
  "hints": [
   "Total variance = sum of eigenvalues.",
   "Cumulative ratios: 50%, 75%, 90%, …"
  ],
  "solution": "<p>Total variance = 5 + 2.5 + 1.5 + 0.6 + 0.4 = 10 (it equals the number of standardized features).</p><p>Explained variance ratios: 0.50, 0.25, 0.15, 0.06, 0.04. Cumulative: 0.50, 0.75, 0.90 ✓.</p><p>So 3 components reach 90%. In finance, the first PC of a stock-return or yield-curve covariance matrix is typically the 'market' or 'level' factor.</p><p>Answer: 3.</p>",
  "key": "PC k explains λ_k / Σλ of the variance; keep components until the cumulative ratio reaches your target."
 },
 {
  "id": "ml-022",
  "cat": "ml",
  "diff": 2,
  "title": "Curse of dimensionality: everything is near the edge",
  "tags": [
   "curse-of-dimensionality",
   "geometry",
   "knn"
  ],
  "prompt": "<p>Points are uniform in the unit hypercube [0,1]<sup>10</sup>. What fraction of them lie within distance 0.05 of the boundary (i.e. at least one coordinate is in [0, 0.05) or (0.95, 1])? Round to 3 decimals.</p>",
  "answer": {
   "type": "numeric",
   "value": 0.6513215599,
   "display": "1 − 0.9¹⁰ ≈ 0.651"
  },
  "hints": [
   "The 'interior' is the cube [0.05, 0.95]¹⁰.",
   "Its volume is 0.9¹⁰."
  ],
  "solution": "<p>A point is in the interior iff every coordinate is in [0.05, 0.95], probability 0.9 each, independently: 0.9¹⁰ ≈ 0.349.</p><p>So ≈ 1 − 0.349 = 0.651 of the points are within 0.05 of the boundary. In d = 100 it is 1 − 0.9¹⁰⁰ ≈ 99.997%.</p><p>In high dimensions volume concentrates near the boundary, distances between random points become similar, and neighbourhoods must be huge to contain any data — which is why k-NN and kernel methods degrade and why feature selection/regularization matter.</p><p>Answer: ≈ 0.651.</p>",
  "key": "In d dimensions the interior fraction is (1−2ε)^d → 0: almost all volume is near the edge."
 },
 {
  "id": "ml-023",
  "cat": "ml",
  "diff": 2,
  "title": "Losses as likelihoods",
  "tags": [
   "mle",
   "loss-functions",
   "cross-entropy",
   "mse"
  ],
  "prompt": "<p>Which pairing of loss function and probabilistic model is correct (minimizing the loss = maximizing the likelihood)?</p>",
  "answer": {
   "type": "choice",
   "options": [
    "Mean squared error ↔ Bernoulli labels; cross-entropy ↔ Gaussian noise.",
    "Mean squared error ↔ Gaussian noise with constant variance; binary cross-entropy (log-loss) ↔ Bernoulli labels.",
    "Mean absolute error ↔ Gaussian noise; MSE ↔ Laplace noise.",
    "Loss functions have no connection to likelihoods."
   ],
   "correct": 1,
   "display": "MSE ↔ Gaussian; cross-entropy ↔ Bernoulli (and MAE ↔ Laplace)."
  },
  "hints": [
   "Write the Gaussian log-density: −(y − f(x))²/(2σ²) + const.",
   "The Bernoulli log-likelihood is y ln p + (1−y) ln(1−p)."
  ],
  "solution": "<p>Gaussian: y = f(x) + ε, ε ~ N(0, σ²). The negative log-likelihood is Σ(yᵢ − f(xᵢ))²/(2σ²) + const, so maximizing likelihood = minimizing squared error.</p><p>Bernoulli: y ∈ {0,1} with P(y=1) = p(x). The negative log-likelihood is −Σ[yᵢ ln pᵢ + (1−yᵢ) ln(1−pᵢ)] — exactly binary cross-entropy (log-loss).</p><p>Likewise Laplace noise ↔ mean absolute error (median regression), and a Gaussian prior on weights ↔ L2 penalty (MAP = ridge), Laplace prior ↔ L1 (Lasso).</p>",
  "key": "Loss = negative log-likelihood: MSE ↔ Gaussian, log-loss ↔ Bernoulli, MAE ↔ Laplace; L2/L1 penalties ↔ Gaussian/Laplace priors."
 },
 {
  "id": "ml-024",
  "cat": "ml",
  "diff": 2,
  "title": "Softmax by hand",
  "tags": [
   "softmax",
   "classification",
   "neural-networks"
  ],
  "prompt": "<p>A 3-class model outputs logits z = (2, 1, 0). What softmax probability does it assign to the first class? Round to 3 decimals.</p>",
  "answer": {
   "type": "numeric",
   "value": 0.6652409557748219,
   "display": "e²/(e² + e + 1) ≈ 0.665"
  },
  "hints": [
   "softmax(z)ᵢ = e^{zᵢ} / Σⱼ e^{zⱼ}.",
   "e² ≈ 7.389, e ≈ 2.718, e⁰ = 1."
  ],
  "solution": "<p>Exponentiate: e² ≈ 7.389, e¹ ≈ 2.718, e⁰ = 1; sum ≈ 11.107.</p><p>p₁ = 7.389/11.107 ≈ 0.665 (the others: ≈ 0.245 and ≈ 0.090).</p><p>Softmax is invariant to adding a constant to all logits — implementations subtract max(z) for numerical stability. With two classes it reduces to the sigmoid of the logit difference.</p><p>Answer: ≈ 0.665.</p>",
  "key": "softmax(z)_i = e^{z_i}/Σe^{z_j}; shift-invariant, and the 2-class case is the sigmoid."
 },
 {
  "id": "ml-025",
  "cat": "ml",
  "diff": 1,
  "title": "Which model doesn't care about scaling?",
  "tags": [
   "feature-scaling",
   "preprocessing",
   "decision-trees"
  ],
  "prompt": "<p>One feature is annual income in dollars (≈ 10⁴–10⁶), another is age in years. If you do <b>not</b> standardize them, which model's predictions are essentially unaffected?</p>",
  "answer": {
   "type": "choice",
   "options": [
    "k-nearest neighbours",
    "Ridge or Lasso regression",
    "A decision tree / random forest",
    "An SVM with an RBF kernel"
   ],
   "correct": 2,
   "display": "Tree-based models are invariant to monotone rescaling of features."
  },
  "hints": [
   "Which models compute distances, or penalize coefficient sizes?",
   "A tree only asks questions like “income < 52,000?”."
  ],
  "solution": "<p>Trees split on thresholds of one feature at a time; any monotone transformation (rescaling, log) leaves the possible partitions unchanged, so trees and forests (and gradient-boosted trees) don't need scaling.</p><p>k-NN and RBF-SVMs use distances, which income would completely dominate. Ridge/Lasso penalize coefficient magnitudes, which depend on feature units, so the penalty would hit features unequally. Gradient-descent-trained models (neural nets, logistic regression via SGD) also converge much faster on standardized features.</p>",
  "key": "Distance-, penalty- and gradient-based models need scaling; tree-based models are invariant to it."
 }
];
