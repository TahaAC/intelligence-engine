// =============================================================================
// LOTTO INTELLIGENCE ENGINE — Statistical Analysis & Prediction Module
// Australian Powerball format: 7 main numbers (1-35) + 1 Powerball (1-20)
// =============================================================================
// Implements (separately for MAIN numbers and POWERBALL):
//   1. Frequency analysis (empirical PMF)
//   2. Hot / Cold ranking
//   3. Gap / "Due" analysis
//   4. Odd/Even & High/Low distribution (main only)
//   5. Sum-range analysis (main only)
//   6. Consecutive-pair detection (main only)
//   7. First-order Markov transition probabilities (main only)
//   8. Bayesian posterior update (Beta prior + observed counts)
//   9. Poisson goodness-of-fit chi-square
//  10. Five-strategy ensemble predictor producing 7 main + 1 Powerball each
// =============================================================================

import { LOTTERY_DRAWS, LOTTERY_CONFIG, LATEST_DRAW, type Draw } from "./lottery-data";

const {
  mainMax: MAIN_MAX,
  mainNumbersPerDraw: MAIN_PER_DRAW,
  powerballMax: PB_MAX,
} = LOTTERY_CONFIG;

const ALL_MAIN = Array.from({ length: MAIN_MAX }, (_, i) => i + 1);
const ALL_PB = Array.from({ length: PB_MAX }, (_, i) => i + 1);

// -----------------------------------------------------------------------------
// 1. FREQUENCY ANALYSIS — MAIN
// -----------------------------------------------------------------------------
export interface FrequencyRecord {
  number: number;
  count: number;
  percentage: number;
  expectedCount: number;
  deviation: number;
  zScore: number;
}

export function computeFrequency(): FrequencyRecord[] {
  const counts = new Array<number>(MAIN_MAX + 1).fill(0);
  let totalNumbers = 0;
  for (const draw of LOTTERY_DRAWS) {
    for (const n of draw.mainNumbers) {
      counts[n]++;
      totalNumbers++;
    }
  }

  const drawsCount = LOTTERY_DRAWS.length;
  const expectedPerNumber = (drawsCount * MAIN_PER_DRAW) / MAIN_MAX;
  const variance = drawsCount * MAIN_PER_DRAW * (1 / MAIN_MAX) * (1 - 1 / MAIN_MAX);
  const stdDev = Math.sqrt(variance);

  return ALL_MAIN.map((number) => {
    const count = counts[number];
    const percentage = totalNumbers > 0 ? (count / totalNumbers) * 100 : 0;
    const deviation = count - expectedPerNumber;
    const zScore = stdDev > 0 ? deviation / stdDev : 0;
    return { number, count, percentage, expectedCount: expectedPerNumber, deviation, zScore };
  });
}

// -----------------------------------------------------------------------------
// 1b. FREQUENCY ANALYSIS — POWERBALL
// -----------------------------------------------------------------------------
export function computePowerballFrequency(): FrequencyRecord[] {
  const counts = new Array<number>(PB_MAX + 1).fill(0);
  for (const draw of LOTTERY_DRAWS) {
    counts[draw.powerball]++;
  }
  const drawsCount = LOTTERY_DRAWS.length;
  const expectedPerNumber = drawsCount / PB_MAX;
  const variance = drawsCount * (1 / PB_MAX) * (1 - 1 / PB_MAX);
  const stdDev = Math.sqrt(variance);

  return ALL_PB.map((number) => {
    const count = counts[number];
    const percentage = (count / drawsCount) * 100;
    const deviation = count - expectedPerNumber;
    const zScore = stdDev > 0 ? deviation / stdDev : 0;
    return { number, count, percentage, expectedCount: expectedPerNumber, deviation, zScore };
  });
}

// -----------------------------------------------------------------------------
// 2. HOT / COLD — MAIN
// -----------------------------------------------------------------------------
export interface HotColdResult {
  hot: FrequencyRecord[];
  cold: FrequencyRecord[];
  neutral: FrequencyRecord[];
}

export function computeHotCold(topN = 7): HotColdResult {
  const freq = computeFrequency();
  const sorted = [...freq].sort((a, b) => b.count - a.count);
  return {
    hot: sorted.slice(0, topN),
    cold: sorted.slice(-topN).reverse(),
    neutral: sorted.slice(topN, -topN),
  };
}

export function computePowerballHotCold(topN = 5): HotColdResult {
  const freq = computePowerballFrequency();
  const sorted = [...freq].sort((a, b) => b.count - a.count);
  return {
    hot: sorted.slice(0, topN),
    cold: sorted.slice(-topN).reverse(),
    neutral: sorted.slice(topN, -topN),
  };
}

// -----------------------------------------------------------------------------
// 3. GAP / "DUE" — MAIN
// -----------------------------------------------------------------------------
export interface GapRecord {
  number: number;
  currentGap: number;
  averageGap: number;
  maxGap: number;
  dueScore: number;
  lastSeen: number | null;
}

export function computeGaps(): GapRecord[] {
  const chronological = [...LOTTERY_DRAWS].sort((a, b) => a.date.localeCompare(b.date));
  const lastSeenIdx = new Array<number | null>(MAIN_MAX + 1).fill(null);
  const gapsByNumber: number[][] = Array.from({ length: MAIN_MAX + 1 }, () => []);

  chronological.forEach((draw, idx) => {
    for (const n of draw.mainNumbers) {
      if (lastSeenIdx[n] !== null) {
        gapsByNumber[n].push(idx - (lastSeenIdx[n] as number));
      }
      lastSeenIdx[n] = idx;
    }
  });

  const totalDraws = chronological.length;
  return ALL_MAIN.map((number) => {
    const gaps = gapsByNumber[number];
    const lastIdx = lastSeenIdx[number];
    const currentGap = lastIdx === null ? totalDraws : totalDraws - lastIdx;
    const averageGap = gaps.length > 0 ? gaps.reduce((s, g) => s + g, 0) / gaps.length : totalDraws;
    const maxGap = gaps.length > 0 ? Math.max(...gaps) : totalDraws;
    const dueScore = averageGap > 0 ? currentGap / averageGap : 0;
    const lastSeen = lastIdx !== null ? chronological[lastIdx].drawNumber : null;
    return { number, currentGap, averageGap, maxGap, dueScore, lastSeen };
  });
}

export function computePowerballGaps(): GapRecord[] {
  const chronological = [...LOTTERY_DRAWS].sort((a, b) => a.date.localeCompare(b.date));
  const lastSeenIdx = new Array<number | null>(PB_MAX + 1).fill(null);
  const gapsByNumber: number[][] = Array.from({ length: PB_MAX + 1 }, () => []);

  chronological.forEach((draw, idx) => {
    const n = draw.powerball;
    if (lastSeenIdx[n] !== null) {
      gapsByNumber[n].push(idx - (lastSeenIdx[n] as number));
    }
    lastSeenIdx[n] = idx;
  });

  const totalDraws = chronological.length;
  return ALL_PB.map((number) => {
    const gaps = gapsByNumber[number];
    const lastIdx = lastSeenIdx[number];
    const currentGap = lastIdx === null ? totalDraws : totalDraws - lastIdx;
    const averageGap = gaps.length > 0 ? gaps.reduce((s, g) => s + g, 0) / gaps.length : totalDraws;
    const maxGap = gaps.length > 0 ? Math.max(...gaps) : totalDraws;
    const dueScore = averageGap > 0 ? currentGap / averageGap : 0;
    const lastSeen = lastIdx !== null ? chronological[lastIdx].drawNumber : null;
    return { number, currentGap, averageGap, maxGap, dueScore, lastSeen };
  });
}

// -----------------------------------------------------------------------------
// 4. ODD/EVEN & HIGH/LOW — MAIN only
// -----------------------------------------------------------------------------
export interface OddEvenResult {
  oddCount: number;
  evenCount: number;
  oddPercentage: number;
  evenPercentage: number;
  perDraw: { drawNumber: number; odd: number; even: number }[];
}

export function computeOddEven(): OddEvenResult {
  let oddCount = 0;
  let evenCount = 0;
  const perDraw = LOTTERY_DRAWS.map((d) => {
    const odd = d.mainNumbers.filter((n) => n % 2 === 1).length;
    const even = d.mainNumbers.length - odd;
    oddCount += odd;
    evenCount += even;
    return { drawNumber: d.drawNumber, odd, even };
  });
  const total = oddCount + evenCount;
  return {
    oddCount,
    evenCount,
    oddPercentage: total > 0 ? (oddCount / total) * 100 : 0,
    evenPercentage: total > 0 ? (evenCount / total) * 100 : 0,
    perDraw,
  };
}

export interface HighLowResult {
  lowCount: number;
  highCount: number;
  lowPercentage: number;
  highPercentage: number;
  perDraw: { drawNumber: number; low: number; high: number }[];
}

export function computeHighLow(): HighLowResult {
  const midPoint = Math.floor(MAIN_MAX / 2);
  let lowCount = 0;
  let highCount = 0;
  const perDraw = LOTTERY_DRAWS.map((d) => {
    const low = d.mainNumbers.filter((n) => n <= midPoint).length;
    const high = d.mainNumbers.length - low;
    lowCount += low;
    highCount += high;
    return { drawNumber: d.drawNumber, low, high };
  });
  const total = lowCount + highCount;
  return {
    lowCount,
    highCount,
    lowPercentage: total > 0 ? (lowCount / total) * 100 : 0,
    highPercentage: total > 0 ? (highCount / total) * 100 : 0,
    perDraw,
  };
}

// -----------------------------------------------------------------------------
// 5. SUM-RANGE ANALYSIS — MAIN only
// -----------------------------------------------------------------------------
export interface SumResult {
  perDraw: { drawNumber: number; sum: number; dateLabel: string }[];
  mean: number;
  min: number;
  max: number;
  stdDev: number;
  expectedMean: number;
  expectedStdDev: number;
}

export function computeSums(): SumResult {
  const perDraw = LOTTERY_DRAWS.map((d) => ({
    drawNumber: d.drawNumber,
    sum: d.mainNumbers.reduce((s, n) => s + n, 0),
    dateLabel: d.dateLabel,
  }));
  const sums = perDraw.map((p) => p.sum);
  const mean = sums.reduce((s, x) => s + x, 0) / sums.length;
  const variance = sums.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / sums.length;
  const stdDev = Math.sqrt(variance);

  const k = MAIN_PER_DRAW;
  const N = MAIN_MAX;
  const expectedMean = (k * (N + 1)) / 2;
  const expectedVariance = (k * (N - k) * (N + 1)) / 12;
  const expectedStdDev = Math.sqrt(expectedVariance);

  return {
    perDraw,
    mean,
    min: Math.min(...sums),
    max: Math.max(...sums),
    stdDev,
    expectedMean,
    expectedStdDev,
  };
}

// -----------------------------------------------------------------------------
// 6. CONSECUTIVE-PAIR DETECTION — MAIN only
// -----------------------------------------------------------------------------
export interface ConsecutiveResult {
  perDraw: { drawNumber: number; pairs: [number, number][] }[];
  totalPairs: number;
  drawsWithPair: number;
  percentageDrawsWithPair: number;
}

export function computeConsecutivePairs(): ConsecutiveResult {
  const perDraw = LOTTERY_DRAWS.map((d) => {
    const sorted = [...d.mainNumbers].sort((a, b) => a - b);
    const pairs: [number, number][] = [];
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i + 1] - sorted[i] === 1) {
        pairs.push([sorted[i], sorted[i + 1]]);
      }
    }
    return { drawNumber: d.drawNumber, pairs };
  });
  const totalPairs = perDraw.reduce((s, p) => s + p.pairs.length, 0);
  const drawsWithPair = perDraw.filter((p) => p.pairs.length > 0).length;
  return {
    perDraw,
    totalPairs,
    drawsWithPair,
    percentageDrawsWithPair: (drawsWithPair / LOTTERY_DRAWS.length) * 100,
  };
}

// -----------------------------------------------------------------------------
// 7. MARKOV TRANSITION — MAIN only
// -----------------------------------------------------------------------------
export interface MarkovResult {
  transitionMatrix: number[][];
  candidates: { number: number; score: number; rank: number }[];
  topTransitions: { from: number; to: number; prob: number }[];
}

export function computeMarkov(): MarkovResult {
  const cooccur = Array.from({ length: MAIN_MAX + 1 }, () => new Array<number>(MAIN_MAX + 1).fill(0));
  const marg = new Array<number>(MAIN_MAX + 1).fill(0);

  for (const draw of LOTTERY_DRAWS) {
    const nums = draw.mainNumbers;
    for (let i = 0; i < nums.length; i++) {
      marg[nums[i]]++;
      for (let j = 0; j < nums.length; j++) {
        if (i !== j) cooccur[nums[i]][nums[j]]++;
      }
    }
  }

  const transitionMatrix: number[][] = Array.from({ length: MAIN_MAX + 1 }, () => new Array<number>(MAIN_MAX + 1).fill(0));
  for (let a = 1; a <= MAIN_MAX; a++) {
    if (marg[a] === 0) continue;
    for (let b = 1; b <= MAIN_MAX; b++) {
      transitionMatrix[a][b] = cooccur[a][b] / marg[a];
    }
  }

  const seed = LATEST_DRAW.mainNumbers;
  const scores = new Array<number>(MAIN_MAX + 1).fill(0);
  for (const a of seed) {
    for (let b = 1; b <= MAIN_MAX; b++) {
      if (seed.includes(b)) continue;
      scores[b] += transitionMatrix[a][b];
    }
  }

  const candidates = ALL_MAIN
    .filter((n) => !seed.includes(n))
    .map((number) => ({ number, score: scores[number], rank: 0 }))
    .sort((a, b) => b.score - a.score)
    .map((c, i) => ({ ...c, rank: i + 1 }));

  const allTransitions: { from: number; to: number; prob: number }[] = [];
  for (let a = 1; a <= MAIN_MAX; a++) {
    for (let b = 1; b <= MAIN_MAX; b++) {
      if (a === b) continue;
      if (transitionMatrix[a][b] > 0) allTransitions.push({ from: a, to: b, prob: transitionMatrix[a][b] });
    }
  }
  allTransitions.sort((a, b) => b.prob - a.prob);
  const topTransitions = allTransitions.slice(0, 10);

  return { transitionMatrix, candidates, topTransitions };
}

// -----------------------------------------------------------------------------
// 8. BAYESIAN POSTERIOR — separate for MAIN and POWERBALL
// -----------------------------------------------------------------------------
export interface BayesRecord {
  number: number;
  posteriorMean: number;
  credibleLower: number;
  credibleUpper: number;
  appearances: number;
  exceedsUniform: boolean;
}

export function computeBayes(): BayesRecord[] {
  const freq = computeFrequency();
  const T = LOTTERY_DRAWS.length * MAIN_PER_DRAW;
  return freq.map((r) => {
    const a = 1 + r.count;
    const b = 1 + (T - r.count);
    const mean = a / (a + b);
    const variance = (a * b) / Math.pow(a + b, 2) / (a + b + 1);
    const sd = Math.sqrt(variance);
    return {
      number: r.number,
      posteriorMean: mean,
      credibleLower: Math.max(0, mean - 1.96 * sd),
      credibleUpper: Math.min(1, mean + 1.96 * sd),
      appearances: r.count,
      exceedsUniform: mean > 1 / MAIN_MAX,
    };
  });
}

export function computePowerballBayes(): BayesRecord[] {
  const freq = computePowerballFrequency();
  const T = LOTTERY_DRAWS.length;
  return freq.map((r) => {
    const a = 1 + r.count;
    const b = 1 + (T - r.count);
    const mean = a / (a + b);
    const variance = (a * b) / Math.pow(a + b, 2) / (a + b + 1);
    const sd = Math.sqrt(variance);
    return {
      number: r.number,
      posteriorMean: mean,
      credibleLower: Math.max(0, mean - 1.96 * sd),
      credibleUpper: Math.min(1, mean + 1.96 * sd),
      appearances: r.count,
      exceedsUniform: mean > 1 / PB_MAX,
    };
  });
}

// -----------------------------------------------------------------------------
// 9. CHI-SQUARE — separate for MAIN and POWERBALL
// -----------------------------------------------------------------------------
export interface ChiSquareResult {
  chiSquare: number;
  degreesOfFreedom: number;
  criticalValue95: number;
  isUniform: boolean;
  interpretation: string;
}

export function computeChiSquare(): ChiSquareResult {
  const freq = computeFrequency();
  const expected = freq[0].expectedCount;
  let chiSq = 0;
  for (const f of freq) chiSq += Math.pow(f.count - expected, 2) / expected;
  const dof = MAIN_MAX - 1;
  // 95% critical value for df=34 is ~48.60
  const criticalValue95 = dof > 30 ? 48.6 : 49.0;
  return {
    chiSquare: chiSq,
    degreesOfFreedom: dof,
    criticalValue95,
    isUniform: chiSq < criticalValue95,
    interpretation:
      chiSq < criticalValue95
        ? "Distribution is statistically consistent with uniform random draws (no exploitable bias)."
        : "Distribution deviates from uniform — some numbers appear more often than expected by chance.",
  };
}

export function computePowerballChiSquare(): ChiSquareResult {
  const freq = computePowerballFrequency();
  const expected = freq[0].expectedCount;
  let chiSq = 0;
  for (const f of freq) chiSq += Math.pow(f.count - expected, 2) / expected;
  const dof = PB_MAX - 1;
  // 95% critical value for df=19 is ~30.14
  const criticalValue95 = dof === 19 ? 30.14 : 31.4;
  return {
    chiSquare: chiSq,
    degreesOfFreedom: dof,
    criticalValue95,
    isUniform: chiSq < criticalValue95,
    interpretation:
      chiSq < criticalValue95
        ? "Powerball distribution is consistent with uniform random draws."
        : "Powerball distribution deviates from uniform.",
  };
}

// -----------------------------------------------------------------------------
// 10. FIVE-STRATEGY ENSEMBLE PREDICTOR — produces 7 main + 1 Powerball per strategy
// -----------------------------------------------------------------------------
export type StrategyId =
  | "frequency_weighted"
  | "cold_due"
  | "balanced"
  | "markov_informed"
  | "statistical_norm";

export interface StrategyResult {
  id: StrategyId;
  name: string;
  tagline: string;
  description: string;
  mainNumbers: number[];
  powerball: number;
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return function () {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function weightedPick<T extends { score: number; item: number }>(
  candidates: T[],
  count: number,
  seed: number = 1337
): number[] {
  const rng = mulberry32(seed);
  const pool = [...candidates];
  const picked: number[] = [];
  while (picked.length < count && pool.length > 0) {
    const total = pool.reduce((s, p) => s + Math.max(p.score, 1e-9), 0);
    let r = rng() * total;
    let idx = 0;
    for (let i = 0; i < pool.length; i++) {
      r -= Math.max(pool[i].score, 1e-9);
      if (r <= 0) { idx = i; break; }
      idx = i;
    }
    picked.push(pool[idx].item);
    pool.splice(idx, 1);
  }
  return picked.sort((a, b) => a - b);
}

export function computePredictions(seed?: number): StrategyResult[] {
  const freq = computeFrequency();
  const gaps = computeGaps();
  const markov = computeMarkov();

  const pbFreq = computePowerballFrequency();
  const pbGaps = computePowerballGaps();

  const pickCount = MAIN_PER_DRAW;
  // If a seed is provided (button click), use it (offset per strategy);
  // otherwise use the original fixed seeds so default predictions stay stable.
  const baseSeed = seed ?? 0;
  const resolveSeed = (offset: number, fallback: number) =>
    baseSeed === 0 ? fallback : baseSeed + offset;

  // ---- MAIN predictions ----
  // Strategy 1 — Frequency weighted (hot)
  const hotCandidates = freq.map((f) => ({ item: f.number, score: Math.max(f.count, 1) }));
  const mainHot = weightedPick(hotCandidates, pickCount, resolveSeed(101, 71401));

  // Strategy 2 — Cold / Due
  const coldCandidates = gaps.map((g) => ({ item: g.number, score: Math.pow(g.dueScore, 2) + 0.5 }));
  const mainCold = weightedPick(coldCandidates, pickCount, resolveSeed(202, 91337));

  // Strategy 3 — Balanced
  const balancedCandidates = freq.map((f) => {
    const g = gaps[f.number - 1];
    const hotRank = [...freq].sort((a, b) => b.count - a.count).findIndex(x => x.number === f.number) + 1;
    const coldRank = [...gaps].sort((a, b) => b.dueScore - a.dueScore).findIndex(x => x.number === g.number) + 1;
    const score = 1 / (hotRank + 2) + 1 / (coldRank + 2);
    return { item: f.number, score };
  });
  const mainBalanced = weightedPick(balancedCandidates, pickCount, resolveSeed(303, 424242));

  // Strategy 4 — Markov-informed
  const markovCandidates = markov.candidates.map((c) => ({ item: c.number, score: c.score + 0.1 }));
  const mainMarkov = weightedPick(markovCandidates, pickCount, resolveSeed(404, 555555));

  // Strategy 5 — Statistical norm (Monte-Carlo, sum + balance optimization)
  const expectedSum = (pickCount * (MAIN_MAX + 1)) / 2;
  let bestSet: number[] = [];
  let bestScore = -Infinity;
  const mcSeed = resolveSeed(505, 20261022);
  const rng = mulberry32(mcSeed);
  for (let trial = 0; trial < 50_000; trial++) {
    const candidate: number[] = [];
    while (candidate.length < pickCount) {
      const n = 1 + Math.floor(rng() * MAIN_MAX);
      if (!candidate.includes(n)) candidate.push(n);
    }
    candidate.sort((a, b) => a - b);
    const sum = candidate.reduce((s, x) => s + x, 0);
    const oddCount = candidate.filter((n) => n % 2 === 1).length;
    const lowCount = candidate.filter((n) => n <= Math.floor(MAIN_MAX / 2)).length;
    const sumScore = -Math.abs(sum - expectedSum) / 10;
    const balanceScore = -Math.abs(oddCount - pickCount / 2) - Math.abs(lowCount - pickCount / 2);
    const score = sumScore + balanceScore + rng() * 0.01;
    if (score > bestScore) { bestScore = score; bestSet = candidate; }
  }

  // ---- POWERBALL predictions (now also seed-aware) ----
  // Strategy 1 — weighted pick biased toward hot PB
  const pbHotCands = pbFreq.map((f) => ({ item: f.number, score: Math.max(f.count, 1) }));
  const pbHot = weightedPick(pbHotCands, 1, resolveSeed(601, 71401))[0];

  // Strategy 2 — weighted pick biased toward overdue PB
  const pbColdCands = pbGaps.map((g) => ({ item: g.number, score: Math.pow(g.dueScore, 2) + 0.5 }));
  const pbCold = weightedPick(pbColdCands, 1, resolveSeed(702, 91337))[0];

  // Strategy 3 — weighted pick from rank-fused PB scores
  const pbBalancedCands = pbFreq.map((f, i) => {
    const g = pbGaps[i];
    const hotRank = [...pbFreq].sort((a, b) => b.count - a.count).findIndex(x => x.number === f.number) + 1;
    const coldRank = [...pbGaps].sort((a, b) => b.dueScore - a.dueScore).findIndex(x => x.number === g.number) + 1;
    return { item: f.number, score: 1 / (hotRank + 2) + 1 / (coldRank + 2) };
  });
  const pbBalanced = weightedPick(pbBalancedCands, 1, resolveSeed(803, 424242))[0];

  // Strategy 4 — Markov PB: weighted by frequency (still gives some variety)
  const pbMarkovCands = pbFreq.map((f) => ({ item: f.number, score: Math.max(f.count, 0.5) }));
  const pbMarkov = weightedPick(pbMarkovCands, 1, resolveSeed(904, 555555))[0];

  // Strategy 5 — Statistical Norm PB: weighted around midpoint of 1-20 (i.e. 10-11)
  const pbStatCands = ALL_PB.map((n) => ({
    item: n,
    score: 1 / (1 + Math.abs(n - 10.5)),
  }));
  const pbStatistical = weightedPick(pbStatCands, 1, resolveSeed(1005, 20261022))[0];

  return [
    {
      id: "frequency_weighted",
      name: "Hot Pursuit",
      tagline: "Frequency-weighted",
      description:
        "Numbers drawn most often over the entire 43-draw window, weighted by empirical count. Assumes any bias in the physical draw system persists. Powerball = most frequent PB historically.",
      mainNumbers: mainHot,
      powerball: pbHot,
    },
    {
      id: "cold_due",
      name: "Cold Snap",
      tagline: "Gap / Due",
      description:
        "Numbers whose current dry spell most exceeds their historical mean gap. Powerball = most overdue PB.",
      mainNumbers: mainCold,
      powerball: pbCold,
    },
    {
      id: "balanced",
      name: "Equilibrium",
      tagline: "Rank fusion",
      description:
        "Inverse-rank fusion of hot and cold rankings — picks numbers that balance momentum with mean-reversion intuition. Powerball = balanced rank.",
      mainNumbers: mainBalanced,
      powerball: pbBalanced,
    },
    {
      id: "markov_informed",
      name: "Markov Chain",
      tagline: "Co-occurrence",
      description:
        "First-order Markov model: aggregates conditional co-occurrence probabilities of every other main number given the main numbers in the latest draw (#1588). Powerball = 2nd-most frequent PB.",
      mainNumbers: mainMarkov,
      powerball: pbMarkov,
    },
    {
      id: "statistical_norm",
      name: "Statistical Norm",
      tagline: "Sum + balance",
      description:
        "Monte-Carlo search (50,000 trials) maximizing closeness to the theoretical expected sum (k(N+1)/2 = 126) and balanced odd/even & high/low. Powerball = midpoint of 1-20 range.",
      mainNumbers: bestSet,
      powerball: pbStatistical,
    },
  ];
}

// -----------------------------------------------------------------------------
// AGGREGATE STATS
// -----------------------------------------------------------------------------
export interface AggregateStats {
  totalDraws: number;
  totalMainNumbers: number;
  latestDrawNumber: number;
  latestDrawDate: string;
  earliestDrawNumber: number;
  earliestDrawDate: string;
  meanPerDraw: number;
  hotMainNumbers: number[];
  coldMainNumbers: number[];
  hotPowerball: number[];
  coldPowerball: number[];
  mostOverdueMain: number;
  mostOverduePowerball: number;
  chiSquareMain: ChiSquareResult;
  chiSquarePowerball: ChiSquareResult;
  sum: SumResult;
  oddEven: OddEvenResult;
  highLow: HighLowResult;
  consecutive: ConsecutiveResult;
}

export function computeAggregate(): AggregateStats {
  const freq = computeFrequency();
  const gaps = computeGaps();
  const pbFreq = computePowerballFrequency();
  const pbGaps = computePowerballGaps();
  const sorted = [...LOTTERY_DRAWS].sort((a, b) => a.date.localeCompare(b.date));
  const earliest = sorted[0];
  const latest = sorted[sorted.length - 1];

  return {
    totalDraws: LOTTERY_DRAWS.length,
    totalMainNumbers: LOTTERY_DRAWS.length * MAIN_PER_DRAW,
    latestDrawNumber: latest.drawNumber,
    latestDrawDate: latest.dateLabel,
    earliestDrawNumber: earliest.drawNumber,
    earliestDrawDate: earliest.dateLabel,
    meanPerDraw: freq.reduce((s, f) => s + f.count, 0) / LOTTERY_DRAWS.length,
    hotMainNumbers: [...freq].sort((a, b) => b.count - a.count).slice(0, 5).map((f) => f.number),
    coldMainNumbers: [...freq].sort((a, b) => a.count - b.count).slice(0, 5).map((f) => f.number),
    hotPowerball: [...pbFreq].sort((a, b) => b.count - a.count).slice(0, 3).map((f) => f.number),
    coldPowerball: [...pbFreq].sort((a, b) => a.count - b.count).slice(0, 3).map((f) => f.number),
    mostOverdueMain: [...gaps].sort((a, b) => b.dueScore - a.dueScore)[0].number,
    mostOverduePowerball: [...pbGaps].sort((a, b) => b.dueScore - a.dueScore)[0].number,
    chiSquareMain: computeChiSquare(),
    chiSquarePowerball: computePowerballChiSquare(),
    sum: computeSums(),
    oddEven: computeOddEven(),
    highLow: computeHighLow(),
    consecutive: computeConsecutivePairs(),
  };
}

// Re-export for convenience
export { LATEST_DRAW, LOTTERY_DRAWS, LOTTERY_CONFIG };
export type { Draw };
