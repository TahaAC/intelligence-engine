// =============================================================================
// LOTTO INTELLIGENCE ENGINE — Multi-game Statistical Analysis & Prediction
// =============================================================================
// Refactored to support multiple Australian lottery games:
//   - Powerball: 7 main (1-35) + 1 Powerball (1-20)
//   - Oz Lotto:  7 main (1-47) + 3 supplementary (1-47)
//
// All functions accept a `game` parameter and use the appropriate GameConfig.
// =============================================================================

import { getDraws, getLatestDraw, type UnifiedDraw } from "./draw-store";
import { getGameConfig, type GameId, type GameConfig } from "./game-config";

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

function getMainDraws(game: GameId = "powerball") {
  return getDraws(game).map((d) => d.mainNumbers);
}

function getSecondaryDraws(game: GameId = "powerball"): number[] {
  const draws = getDraws(game);
  if (game === "powerball") {
    return draws.map((d) => d.powerball).filter((n): n is number => n !== null && n !== undefined);
  }
  // Oz Lotto: flatten supplementary arrays
  return draws
    .map((d) => d.supplementaryNumbers)
    .filter((arr): arr is number[] => Array.isArray(arr))
    .flat();
}

export function computeFrequency(game: GameId = "powerball"): FrequencyRecord[] {
  const config = getGameConfig(game);
  const allNumbers = Array.from({ length: config.mainMax }, (_, i) => i + 1);
  const counts = new Array<number>(config.mainMax + 1).fill(0);
  let totalNumbers = 0;
  for (const nums of getMainDraws(game)) {
    for (const n of nums) {
      counts[n]++;
      totalNumbers++;
    }
  }
  const drawsCount = getDraws(game).length;
  const expectedPerNumber = (drawsCount * config.mainNumbersPerDraw) / config.mainMax;
  const variance = drawsCount * config.mainNumbersPerDraw * (1 / config.mainMax) * (1 - 1 / config.mainMax);
  const stdDev = Math.sqrt(variance);

  return allNumbers.map((number) => {
    const count = counts[number];
    const percentage = totalNumbers > 0 ? (count / totalNumbers) * 100 : 0;
    const deviation = count - expectedPerNumber;
    const zScore = stdDev > 0 ? deviation / stdDev : 0;
    return { number, count, percentage, expectedCount: expectedPerNumber, deviation, zScore };
  });
}

// -----------------------------------------------------------------------------
// 1b. FREQUENCY ANALYSIS — SECONDARY (Powerball OR Oz Lotto supplementary)
// -----------------------------------------------------------------------------
export function computeSecondaryFrequency(game: GameId = "powerball"): FrequencyRecord[] {
  const config = getGameConfig(game);
  const secMax = config.hasPowerball ? config.powerballMax : config.supplementaryMax;
  const allNumbers = Array.from({ length: secMax }, (_, i) => i + 1);
  const counts = new Array<number>(secMax + 1).fill(0);
  const values = getSecondaryDraws(game);
  for (const v of values) counts[v]++;

  const drawsCount = getDraws(game).length;
  const appearancesPerDraw = config.hasPowerball ? 1 : config.supplementaryCount;
  const expectedPerNumber = (drawsCount * appearancesPerDraw) / secMax;
  const variance = drawsCount * appearancesPerDraw * (1 / secMax) * (1 - 1 / secMax);
  const stdDev = Math.sqrt(variance);
  const totalNumbers = values.length;

  return allNumbers.map((number) => {
    const count = counts[number];
    const percentage = totalNumbers > 0 ? (count / totalNumbers) * 100 : 0;
    const deviation = count - expectedPerNumber;
    const zScore = stdDev > 0 ? deviation / stdDev : 0;
    return { number, count, percentage, expectedCount: expectedPerNumber, deviation, zScore };
  });
}

// -----------------------------------------------------------------------------
// 2. HOT / COLD — MAIN and SECONDARY
// -----------------------------------------------------------------------------
export interface HotColdResult {
  hot: FrequencyRecord[];
  cold: FrequencyRecord[];
  neutral: FrequencyRecord[];
}

export function computeHotCold(game: GameId = "powerball", topN = 7): HotColdResult {
  const freq = computeFrequency(game);
  const sorted = [...freq].sort((a, b) => b.count - a.count);
  return {
    hot: sorted.slice(0, topN),
    cold: sorted.slice(-topN).reverse(),
    neutral: sorted.slice(topN, -topN),
  };
}

export function computeSecondaryHotCold(game: GameId = "powerball", topN = 5): HotColdResult {
  const freq = computeSecondaryFrequency(game);
  const sorted = [...freq].sort((a, b) => b.count - a.count);
  return {
    hot: sorted.slice(0, topN),
    cold: sorted.slice(-topN).reverse(),
    neutral: sorted.slice(topN, -topN),
  };
}

// -----------------------------------------------------------------------------
// 3. GAP / "DUE" — MAIN and SECONDARY
// -----------------------------------------------------------------------------
export interface GapRecord {
  number: number;
  currentGap: number;
  averageGap: number;
  maxGap: number;
  dueScore: number;
  lastSeen: number | null;
}

export function computeGaps(game: GameId = "powerball"): GapRecord[] {
  const config = getGameConfig(game);
  const allNumbers = Array.from({ length: config.mainMax }, (_, i) => i + 1);
  const chronological = [...getDraws(game)].sort((a, b) => a.date.localeCompare(b.date));
  const lastSeenIdx = new Array<number | null>(config.mainMax + 1).fill(null);
  const gapsByNumber: number[][] = Array.from({ length: config.mainMax + 1 }, () => []);

  chronological.forEach((draw, idx) => {
    for (const n of draw.mainNumbers) {
      if (lastSeenIdx[n] !== null) {
        gapsByNumber[n].push(idx - (lastSeenIdx[n] as number));
      }
      lastSeenIdx[n] = idx;
    }
  });

  const totalDraws = chronological.length;
  return allNumbers.map((number) => {
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

export function computeSecondaryGaps(game: GameId = "powerball"): GapRecord[] {
  const config = getGameConfig(game);
  const secMax = config.hasPowerball ? config.powerballMax : config.supplementaryMax;
  const allNumbers = Array.from({ length: secMax }, (_, i) => i + 1);
  const chronological = [...getDraws(game)].sort((a, b) => a.date.localeCompare(b.date));
  const lastSeenIdx = new Array<number | null>(secMax + 1).fill(null);
  const gapsByNumber: number[][] = Array.from({ length: secMax + 1 }, () => []);

  chronological.forEach((draw, idx) => {
    let secondaryNums: number[] = [];
    if (config.hasPowerball) {
      if (draw.powerball != null) secondaryNums = [draw.powerball];
    } else if (Array.isArray(draw.supplementaryNumbers)) {
      secondaryNums = draw.supplementaryNumbers;
    }
    for (const n of secondaryNums) {
      if (lastSeenIdx[n] !== null) {
        gapsByNumber[n].push(idx - (lastSeenIdx[n] as number));
      }
      lastSeenIdx[n] = idx;
    }
  });

  const totalDraws = chronological.length;
  return allNumbers.map((number) => {
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
// 3b. K-S TEST FOR GEOMETRIC DISTRIBUTION (gap distribution analysis)
// -----------------------------------------------------------------------------
// For each number, compute the gap sequence and test whether it follows the
// theoretical geometric distribution that random independent draws should
// produce. K-S statistic = max |empirical_CDF - theoretical_CDF|.
// Critical value at α=0.05: 1.36 / sqrt(n) where n is number of gaps.

export interface GapDistributionResult {
  number: number;
  gaps: number[];                  // observed gaps (draws between appearances)
  gapCount: number;
  observedMeanGap: number;
  theoreticalMeanGap: number;      // (1/p) - 1 where p = m_drawn / n_pool
  ksStatistic: number;
  pValue: number;                  // approximate p-value via Kolmogorov CDF
  criticalValue05: number;         // 1.36 / sqrt(n)
  isConsistentWithRandom: boolean; // true if K-S statistic < critical value
  interpretation: string;
}

// Kolmogorov CDF approximation for K-S test p-value.
function kolmogorovPValueApprox(ksStat: number, n: number): number {
  if (n === 0) return 1;
  const lambda = (Math.sqrt(n) + 0.12 + 0.11 / Math.sqrt(n)) * ksStat;
  if (lambda < 0.18) return 1;
  // Series: 2 * Σ_{k=1}^∞ (-1)^(k-1) * exp(-2 k² λ²)
  let sum = 0;
  for (let k = 1; k <= 100; k++) {
    const term = Math.pow(-1, k - 1) * Math.exp(-2 * k * k * lambda * lambda);
    sum += term;
    if (Math.abs(term) < 1e-10) break;
  }
  return Math.max(0, Math.min(1, 2 * sum));
}

function computeGapDistributionForNumber(
  number: number,
  draws: number[][],  // array of draws, each draw is array of numbers containing this number or not
  p: number,          // probability of single number per draw (m_drawn / n_pool)
): GapDistributionResult {
  // Indices where this number appeared
  const appearances: number[] = [];
  draws.forEach((draw, idx) => {
    if (draw.includes(number)) appearances.push(idx);
  });

  // Gaps = draws between consecutive appearances minus 1 (gap of 0 = consecutive draws)
  const gaps: number[] = [];
  for (let i = 1; i < appearances.length; i++) {
    gaps.push(appearances[i] - appearances[i - 1] - 1);
  }

  const gapCount = gaps.length;
  const observedMeanGap = gapCount > 0 ? gaps.reduce((s, g) => s + g, 0) / gapCount : 0;
  const theoreticalMeanGap = (1 / p) - 1;

  // K-S test against geometric distribution
  // Geometric CDF: P(X <= k) = 1 - (1-p)^k for k >= 1
  let ksStatistic = 0;
  if (gapCount >= 5) {
    const sortedGaps = [...gaps].sort((a, b) => a - b);
    const n = sortedGaps.length;
    for (let i = 0; i < n; i++) {
      const shifted = sortedGaps[i] + 1;
      const empiricalCDF = (i + 1) / n;
      const theoreticalCDF = 1 - Math.pow(1 - p, shifted);
      const diff1 = Math.abs(empiricalCDF - theoreticalCDF);
      const diff2 = i > 0 ? Math.abs(i / n - theoreticalCDF) : 0;
      ksStatistic = Math.max(ksStatistic, diff1, diff2);
    }
  }

  const pValue = kolmogorovPValueApprox(ksStatistic, gapCount);
  const criticalValue05 = gapCount > 0 ? 1.36 / Math.sqrt(gapCount) : 0;
  const isConsistent = ksStatistic < criticalValue05;

  let interpretation: string;
  if (gapCount < 5) {
    interpretation = `Insufficient data (${gapCount} gaps observed)`;
  } else if (isConsistent) {
    interpretation = `Gap distribution is statistically consistent with the theoretical geometric distribution. Number behaves as expected under independent random draws.`;
  } else {
    interpretation = `Gap distribution deviates from geometric — possible anomaly (or just statistical noise).`;
  }

  return {
    number,
    gaps,
    gapCount,
    observedMeanGap,
    theoreticalMeanGap,
    ksStatistic,
    pValue,
    criticalValue05,
    isConsistentWithRandom: isConsistent,
    interpretation,
  };
}

export function computeGapDistribution(game: GameId = "powerball"): GapDistributionResult[] {
  const config = getGameConfig(game);
  const allNumbers = Array.from({ length: config.mainMax }, (_, i) => i + 1);
  const mainDraws = getMainDraws(game);
  const p = config.mainNumbersPerDraw / config.mainMax;
  return allNumbers.map((n) => computeGapDistributionForNumber(n, mainDraws, p));
}

export function computeSecondaryGapDistribution(game: GameId = "powerball"): GapDistributionResult[] {
  const config = getGameConfig(game);
  const secMax = config.hasPowerball ? config.powerballMax : config.supplementaryMax;
  const allNumbers = Array.from({ length: secMax }, (_, i) => i + 1);

  const secDraws: number[][] = getDraws(game).map((d) => {
    if (config.hasPowerball) {
      return d.powerball != null ? [d.powerball] : [];
    }
    return Array.isArray(d.supplementaryNumbers) ? d.supplementaryNumbers : [];
  });

  const appearancesPerDraw = config.hasPowerball ? 1 : config.supplementaryCount;
  const p = appearancesPerDraw / secMax;
  return allNumbers.map((n) => computeGapDistributionForNumber(n, secDraws, p));
}

// -----------------------------------------------------------------------------
// 3c. CONFIDENCE INTERVALS for frequency analysis
// -----------------------------------------------------------------------------
// For each number, compute the 95% confidence interval around the expected
// frequency. Numbers whose observed count falls outside this interval are
// statistical outliers (potentially biased, though rare in random draws).

export interface FrequencyWithCI extends FrequencyRecord {
  ciLower: number;       // expected - 1.96 * stdDev
  ciUpper: number;       // expected + 1.96 * stdDev
  stdDev: number;        // sqrt(T * p * (1-p)) where T = total appearances slots
  isOutlier: boolean;    // true if count falls outside CI
}

export function computeFrequencyWithCI(game: GameId = "powerball"): FrequencyWithCI[] {
  const config = getGameConfig(game);
  const freq = computeFrequency(game);
  const T = getDraws(game).length * config.mainNumbersPerDraw;
  const p = config.mainNumbersPerDraw / config.mainMax;
  const stdDev = Math.sqrt(T * p * (1 - p));
  return freq.map((r) => {
    const ciLower = r.expectedCount - 1.96 * stdDev;
    const ciUpper = r.expectedCount + 1.96 * stdDev;
    const isOutlier = r.count < ciLower || r.count > ciUpper;
    return { ...r, ciLower, ciUpper, stdDev, isOutlier };
  });
}

export function computeSecondaryFrequencyWithCI(game: GameId = "powerball"): FrequencyWithCI[] {
  const config = getGameConfig(game);
  const secMax = config.hasPowerball ? config.powerballMax : config.supplementaryMax;
  const freq = computeSecondaryFrequency(game);
  const appearancesPerDraw = config.hasPowerball ? 1 : config.supplementaryCount;
  const T = getDraws(game).length * appearancesPerDraw;
  const p = appearancesPerDraw / secMax;
  const stdDev = Math.sqrt(T * p * (1 - p));
  return freq.map((r) => {
    const ciLower = r.expectedCount - 1.96 * stdDev;
    const ciUpper = r.expectedCount + 1.96 * stdDev;
    const isOutlier = r.count < ciLower || r.count > ciUpper;
    return { ...r, ciLower, ciUpper, stdDev, isOutlier };
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
}

export function computeOddEven(game: GameId = "powerball"): OddEvenResult {
  let oddCount = 0;
  let evenCount = 0;
  for (const nums of getMainDraws(game)) {
    for (const n of nums) {
      if (n % 2 === 1) oddCount++;
      else evenCount++;
    }
  }
  const total = oddCount + evenCount;
  return {
    oddCount,
    evenCount,
    oddPercentage: total > 0 ? (oddCount / total) * 100 : 0,
    evenPercentage: total > 0 ? (evenCount / total) * 100 : 0,
  };
}

export interface HighLowResult {
  lowCount: number;
  highCount: number;
  lowPercentage: number;
  highPercentage: number;
}

export function computeHighLow(game: GameId = "powerball"): HighLowResult {
  const config = getGameConfig(game);
  const midPoint = Math.floor(config.mainMax / 2);
  let lowCount = 0;
  let highCount = 0;
  for (const nums of getMainDraws(game)) {
    for (const n of nums) {
      if (n <= midPoint) lowCount++;
      else highCount++;
    }
  }
  const total = lowCount + highCount;
  return {
    lowCount,
    highCount,
    lowPercentage: total > 0 ? (lowCount / total) * 100 : 0,
    highPercentage: total > 0 ? (highCount / total) * 100 : 0,
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

export function computeSums(game: GameId = "powerball"): SumResult {
  const config = getGameConfig(game);
  const draws = getDraws(game);
  const perDraw = draws.map((d) => ({
    drawNumber: d.drawNumber,
    sum: d.mainNumbers.reduce((s, n) => s + n, 0),
    dateLabel: d.dateLabel,
  }));
  const sums = perDraw.map((p) => p.sum);
  if (sums.length === 0) {
    return { perDraw, mean: 0, min: 0, max: 0, stdDev: 0, expectedMean: 0, expectedStdDev: 0 };
  }
  const mean = sums.reduce((s, x) => s + x, 0) / sums.length;
  const variance = sums.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / sums.length;
  const stdDev = Math.sqrt(variance);

  const k = config.mainNumbersPerDraw;
  const N = config.mainMax;
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

export function computeConsecutivePairs(game: GameId = "powerball"): ConsecutiveResult {
  const draws = getDraws(game);
  const perDraw = draws.map((d) => {
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
    percentageDrawsWithPair: draws.length > 0 ? (drawsWithPair / draws.length) * 100 : 0,
  };
}

// -----------------------------------------------------------------------------
// 6b. ADVANCED STATISTICAL BATTERY
// -----------------------------------------------------------------------------
// Additional statistical methods commonly applied to lottery analysis
// (entropy, runs test, autocorrelation, pair correlation, hypergeometric
// probability, coverage, skewness, kurtosis, coupon collector's problem).

// Standard normal CDF approximation (Abramowitz & Stegun formula 7.1.26)
function normalCdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  let prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - prob : prob;
}

// Binomial coefficient C(n, k)
function combinations(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k > n - k) k = n - k;
  let result = 1;
  for (let i = 0; i < k; i++) {
    result = result * (n - i) / (i + 1);
  }
  return result;
}

// (6b.1) Shannon entropy — measures randomness of the frequency distribution.
// H = -Σ p_i × log2(p_i). Max entropy for N uniform outcomes = log2(N).
export interface EntropyResult {
  entropy: number;
  maxEntropy: number;
  normalizedEntropy: number; // 0..1 (1 = perfectly uniform)
  interpretation: string;
}

export function computeEntropy(game: GameId = "powerball"): EntropyResult {
  const freq = computeFrequency(game);
  const totalCount = freq.reduce((s, f) => s + f.count, 0);
  let entropy = 0;
  if (totalCount > 0) {
    for (const f of freq) {
      if (f.count > 0) {
        const p = f.count / totalCount;
        entropy -= p * Math.log2(p);
      }
    }
  }
  const maxEntropy = Math.log2(freq.length || 1);
  const normalized = maxEntropy > 0 ? entropy / maxEntropy : 0;
  let interpretation: string;
  if (normalized > 0.95) {
    interpretation = "Near-maximum entropy — distribution is statistically consistent with uniform random draws (no exploitable bias).";
  } else if (normalized > 0.85) {
    interpretation = "High entropy with minor deviations from uniform — likely statistical noise.";
  } else {
    interpretation = "Reduced entropy — distribution deviates from uniform (could be bias or just small sample).";
  }
  return { entropy, maxEntropy, normalizedEntropy: normalized, interpretation };
}

// (6b.2) Wald-Wolfowitz runs test — tests randomness of binary sequences.
// We test whether per-draw sums are randomly above/below the median.
export interface RunsTestResult {
  n: number;
  n1: number;
  n2: number;
  observedRuns: number;
  expectedRuns: number;
  zScore: number;
  pValue: number;
  isRandom: boolean;
  interpretation: string;
}

export function computeRunsTest(game: GameId = "powerball"): RunsTestResult {
  const sums = getMainDraws(game).map(draw => draw.reduce((s, n) => s + n, 0));
  if (sums.length < 10) {
    return {
      n: sums.length, n1: 0, n2: 0, observedRuns: 0, expectedRuns: 0,
      zScore: 0, pValue: 1, isRandom: true,
      interpretation: "Insufficient data for runs test (need ≥10 draws).",
    };
  }
  const sorted = [...sums].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const binary = sums.map(s => (s > median ? 1 : 0));
  const n1 = binary.filter(b => b === 1).length;
  const n2 = binary.filter(b => b === 0).length;
  const n = n1 + n2;
  let observedRuns = 1;
  for (let i = 1; i < binary.length; i++) {
    if (binary[i] !== binary[i - 1]) observedRuns++;
  }
  const expectedRuns = n > 0 ? (2 * n1 * n2) / n + 1 : 0;
  const variance = n > 1 ? (2 * n1 * n2 * (2 * n1 * n2 - n)) / (n * n * (n - 1)) : 0;
  const stdDev = Math.sqrt(variance);
  const zScore = stdDev > 0 ? (observedRuns - expectedRuns) / stdDev : 0;
  const pValue = 2 * (1 - normalCdf(Math.abs(zScore)));
  const isRandom = Math.abs(zScore) < 1.96;
  return {
    n, n1, n2, observedRuns, expectedRuns, zScore, pValue, isRandom,
    interpretation: isRandom
      ? "Runs test passes — sequence of above/below-median sums is statistically random (no trend or clustering)."
      : "Runs test fails — possible non-randomness in the sum sequence (trend or clustering detected).",
  };
}

// (6b.3) Lag-1 autocorrelation of per-draw sums.
// Tests whether consecutive draws are correlated (they should NOT be, if random).
export interface AutocorrelationResult {
  lag: number;
  n: number;
  autocorrelation: number;
  criticalValue: number;
  isSignificant: boolean;
  interpretation: string;
}

export function computeAutocorrelation(game: GameId = "powerball", lag = 1): AutocorrelationResult {
  const sums = getMainDraws(game).map(draw => draw.reduce((s, n) => s + n, 0));
  const n = sums.length;
  if (n < lag + 4) {
    return { lag, n, autocorrelation: 0, criticalValue: 0, isSignificant: false, interpretation: "Insufficient data" };
  }
  const mean = sums.reduce((s, x) => s + x, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n - lag; i++) num += (sums[i] - mean) * (sums[i + lag] - mean);
  for (let i = 0; i < n; i++) den += Math.pow(sums[i] - mean, 2);
  const autocorr = den > 0 ? num / den : 0;
  const critical = 1.96 / Math.sqrt(n);
  const isSig = Math.abs(autocorr) > critical;
  return {
    lag, n, autocorrelation: autocorr, criticalValue: critical, isSignificant: isSig,
    interpretation: isSig
      ? `Significant lag-${lag} autocorrelation detected (|r| > ${critical.toFixed(3)}). Draws are NOT independent — anomaly worth investigating!`
      : `Lag-${lag} autocorrelation within statistical noise (|r| < ${critical.toFixed(3)}). Draws are independent (as expected).`,
  };
}

// (6b.4) Pair correlation — pairs that appear together MORE or LESS than expected.
export interface PairCorrelationResult {
  pair: [number, number];
  observedCount: number;
  expectedCount: number;
  deviation: number;
  zScore: number;
  isSignificant: boolean;
}

export interface PairCorrelationSummary {
  topOver: PairCorrelationResult[]; // pairs appearing MORE than expected
  topUnder: PairCorrelationResult[]; // pairs appearing LESS than expected
  totalPairsAnalyzed: number;
  significantPairs: number;
}

export function computePairCorrelation(game: GameId = "powerball", topN = 8): PairCorrelationSummary {
  const config = getGameConfig(game);
  const mainDraws = getMainDraws(game);
  const totalDraws = mainDraws.length;

  const pairCounts: Record<string, number> = {};
  for (const draw of mainDraws) {
    for (let i = 0; i < draw.length; i++) {
      for (let j = i + 1; j < draw.length; j++) {
        const a = Math.min(draw[i], draw[j]);
        const b = Math.max(draw[i], draw[j]);
        const key = `${a}-${b}`;
        pairCounts[key] = (pairCounts[key] || 0) + 1;
      }
    }
  }

  const comb7c2 = (config.mainNumbersPerDraw * (config.mainNumbersPerDraw - 1)) / 2;
  const combNc2 = (config.mainMax * (config.mainMax - 1)) / 2;
  const expectedPerPair = totalDraws > 0 ? (comb7c2 / combNc2) * totalDraws : 0;
  const p = combNc2 > 0 ? comb7c2 / combNc2 : 0;
  const variance = totalDraws * p * (1 - p);
  const stdDev = Math.sqrt(variance);

  const allPairs: PairCorrelationResult[] = [];
  for (let a = 1; a <= config.mainMax; a++) {
    for (let b = a + 1; b <= config.mainMax; b++) {
      const key = `${a}-${b}`;
      const observed = pairCounts[key] || 0;
      const z = stdDev > 0 ? (observed - expectedPerPair) / stdDev : 0;
      allPairs.push({
        pair: [a, b],
        observedCount: observed,
        expectedCount: expectedPerPair,
        deviation: observed - expectedPerPair,
        zScore: z,
        isSignificant: Math.abs(z) > 1.96,
      });
    }
  }

  const topOver = [...allPairs].sort((a, b) => b.zScore - a.zScore).slice(0, topN);
  const topUnder = [...allPairs].sort((a, b) => a.zScore - b.zScore).slice(0, topN);
  const significant = allPairs.filter(p => p.isSignificant).length;

  return {
    topOver,
    topUnder,
    totalPairsAnalyzed: allPairs.length,
    significantPairs: significant,
  };
}

// (6b.5) Hypergeometric probability — exact odds of matching k of K drawn
// numbers when picking n from a pool of N.
export interface HypergeometricResult {
  poolSize: number;
  drawnCount: number;
  ticketSize: number;
  totalCombinations: number;
  probabilityTable: { matchCount: number; probability: number; oneIn: number }[];
  interpretation: string;
}

export function computeHypergeometricProb(game: GameId = "powerball"): HypergeometricResult {
  const config = getGameConfig(game);
  const N = config.mainMax;
  const K = config.mainNumbersPerDraw;
  const n = config.mainNumbersPerDraw;
  const totalCombinations = combinations(N, n);
  const probabilityTable: { matchCount: number; probability: number; oneIn: number }[] = [];
  for (let k = 0; k <= Math.min(K, n); k++) {
    const c1 = combinations(K, k);
    const c2 = combinations(N - K, n - k);
    const prob = totalCombinations > 0 ? (c1 * c2) / totalCombinations : 0;
    probabilityTable.push({
      matchCount: k,
      probability: prob,
      oneIn: prob > 0 ? 1 / prob : Infinity,
    });
  }
  const allMatch = probabilityTable[Math.min(K, n)];
  return {
    poolSize: N,
    drawnCount: K,
    ticketSize: n,
    totalCombinations,
    probabilityTable,
    interpretation: `Matching all ${K} drawn numbers has probability ${(allMatch.probability * 100).toExponential(2)}% (1 in ${allMatch.oneIn.toLocaleString("en-US", { maximumFractionDigits: 0 })}).`,
  };
}

// (6b.6) Coverage analysis — what % of all possible numbers have appeared.
export interface CoverageResult {
  mainCoverage: number;
  mainAppeared: number;
  mainTotal: number;
  secondaryCoverage: number;
  secondaryAppeared: number;
  secondaryTotal: number;
  interpretation: string;
}

export function computeCoverage(game: GameId = "powerball"): CoverageResult {
  const config = getGameConfig(game);
  const mainFreq = computeFrequency(game);
  const secFreq = computeSecondaryFrequency(game);
  const mainAppeared = mainFreq.filter(f => f.count > 0).length;
  const mainTotal = mainFreq.length;
  const secAppeared = secFreq.filter(f => f.count > 0).length;
  const secTotal = secFreq.length;
  return {
    mainCoverage: mainTotal > 0 ? mainAppeared / mainTotal : 0,
    mainAppeared,
    mainTotal,
    secondaryCoverage: secTotal > 0 ? secAppeared / secTotal : 0,
    secondaryAppeared: secAppeared,
    secondaryTotal: secTotal,
    interpretation: `${mainAppeared}/${mainTotal} main numbers and ${secAppeared}/${secTotal} ${config.hasPowerball ? "Powerball" : "supplementary"} numbers have appeared at least once.`,
  };
}

// (6b.7) Skewness & kurtosis of the frequency distribution.
// Tests for asymmetry (skewness) and tailedness (kurtosis) in the distribution.
export interface DistributionShapeResult {
  mean: number;
  variance: number;
  stdDev: number;
  skewness: number;
  kurtosis: number; // excess kurtosis (0 = normal)
  skewInterpretation: string;
  kurtosisInterpretation: string;
}

export function computeDistributionShape(game: GameId = "powerball"): DistributionShapeResult {
  const freq = computeFrequency(game);
  const counts = freq.map(f => f.count);
  const n = counts.length;
  if (n < 3) {
    return {
      mean: 0, variance: 0, stdDev: 0, skewness: 0, kurtosis: 0,
      skewInterpretation: "Insufficient data",
      kurtosisInterpretation: "Insufficient data",
    };
  }
  const mean = counts.reduce((s, x) => s + x, 0) / n;
  const variance = counts.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  const skewness = stdDev > 0
    ? counts.reduce((s, x) => s + Math.pow((x - mean) / stdDev, 3), 0) / n
    : 0;
  const kurtosis = stdDev > 0
    ? counts.reduce((s, x) => s + Math.pow((x - mean) / stdDev, 4), 0) / n - 3
    : 0;
  const skewInterp = Math.abs(skewness) < 0.5
    ? "Approximately symmetric (skewness near 0) — consistent with uniform random."
    : skewness > 0
    ? "Right-skewed (long tail of high-frequency numbers) — slight anomaly."
    : "Left-skewed (long tail of low-frequency numbers) — slight anomaly.";
  const kurtInterp = Math.abs(kurtosis) < 0.5
    ? "Near-normal tailedness (excess kurtosis near 0) — consistent with uniform random."
    : kurtosis > 0
    ? "Leptokurtic (heavier tails than normal) — more outliers than expected."
    : "Platykurtic (lighter tails than normal) — fewer outliers than expected.";
  return {
    mean, variance, stdDev, skewness, kurtosis,
    skewInterpretation: skewInterp,
    kurtosisInterpretation: kurtInterp,
  };
}

// (6b.8) Coupon collector's problem — expected number of draws to see all N
// numbers at least once. E[T] = N × H_N where H_N is the Nth harmonic number.
export interface CouponCollectorResult {
  poolSize: number;
  drawnPerDraw: number;
  expectedDrawsToSeeAll: number;
  harmonicNumber: number;
  drawsObserved: number;
  coverageSoFar: number;
  interpretation: string;
}

export function computeCouponCollector(game: GameId = "powerball"): CouponCollectorResult {
  const config = getGameConfig(game);
  const N = config.mainMax;
  const m = config.mainNumbersPerDraw;
  // For drawing m balls from N per draw, expected draws to see all N:
  // E[T] = (N/m) × H_N where H_N = Σ 1/i for i=1..N
  let harmonic = 0;
  for (let i = 1; i <= N; i++) harmonic += 1 / i;
  const expectedDraws = (N / m) * harmonic;
  const observed = getDraws(game).length;
  const coverage = computeCoverage(game);
  const pct = (observed / expectedDraws) * 100;
  return {
    poolSize: N,
    drawnPerDraw: m,
    expectedDrawsToSeeAll: expectedDraws,
    harmonicNumber: harmonic,
    drawsObserved: observed,
    coverageSoFar: coverage.mainCoverage,
    interpretation: `Expected ~${expectedDraws.toFixed(0)} draws to see all ${N} numbers. Observed ${observed} draws (${pct.toFixed(1)}% of expected) — coverage at ${(coverage.mainCoverage * 100).toFixed(1)}%.`,
  };
}

// (6b.9) Birthday problem — probability of shared numbers between two draws.
// For two draws of m balls each from a pool of N, the probability they share
// at least one number is 1 - C(N-m, m) / C(N, m).
export interface BirthdayProblemResult {
  probabilityOfSharedNumber: number;
  expectedSharedNumbers: number;
  interpretation: string;
}

export function computeBirthdayProblem(game: GameId = "powerball"): BirthdayProblemResult {
  const config = getGameConfig(game);
  const N = config.mainMax;
  const m = config.mainNumbersPerDraw;
  // P(at least one shared) = 1 - C(N-m, m) / C(N, m)
  const total = combinations(N, m);
  const disjoint = combinations(N - m, m);
  const prob = total > 0 ? 1 - disjoint / total : 0;
  // Expected number of shared = m² / N (linearity of expectation)
  const expectedShared = (m * m) / N;
  return {
    probabilityOfSharedNumber: prob,
    expectedSharedNumbers: expectedShared,
    interpretation: `Two random draws share at least one number with probability ${(prob * 100).toFixed(1)}% (≈1 in ${prob > 0 ? (1 / prob).toFixed(1) : "∞"}). Expected shared count per pair of draws: ${expectedShared.toFixed(2)} numbers.`,
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

export function computeMarkov(game: GameId = "powerball"): MarkovResult {
  const config = getGameConfig(game);
  const N = config.mainMax;
  const cooccur = Array.from({ length: N + 1 }, () => new Array<number>(N + 1).fill(0));
  const marg = new Array<number>(N + 1).fill(0);
  for (const nums of getMainDraws(game)) {
    for (let i = 0; i < nums.length; i++) {
      marg[nums[i]]++;
      for (let j = 0; j < nums.length; j++) {
        if (i !== j) cooccur[nums[i]][nums[j]]++;
      }
    }
  }
  const transitionMatrix: number[][] = Array.from({ length: N + 1 }, () => new Array<number>(N + 1).fill(0));
  for (let a = 1; a <= N; a++) {
    if (marg[a] === 0) continue;
    for (let b = 1; b <= N; b++) {
      transitionMatrix[a][b] = cooccur[a][b] / marg[a];
    }
  }

  const latest = getLatestDraw(game);
  const seed = latest?.mainNumbers ?? [];
  const scores = new Array<number>(N + 1).fill(0);
  for (const a of seed) {
    for (let b = 1; b <= N; b++) {
      if (seed.includes(b)) continue;
      scores[b] += transitionMatrix[a][b];
    }
  }
  const allNumbers = Array.from({ length: N }, (_, i) => i + 1);
  const candidates = allNumbers
    .filter((n) => !seed.includes(n))
    .map((number) => ({ number, score: scores[number], rank: 0 }))
    .sort((a, b) => b.score - a.score)
    .map((c, i) => ({ ...c, rank: i + 1 }));

  const allTransitions: { from: number; to: number; prob: number }[] = [];
  for (let a = 1; a <= N; a++) {
    for (let b = 1; b <= N; b++) {
      if (a === b) continue;
      if (transitionMatrix[a][b] > 0) allTransitions.push({ from: a, to: b, prob: transitionMatrix[a][b] });
    }
  }
  allTransitions.sort((a, b) => b.prob - a.prob);
  const topTransitions = allTransitions.slice(0, 10);
  return { transitionMatrix, candidates, topTransitions };
}

// -----------------------------------------------------------------------------
// 8. BAYESIAN POSTERIOR — MAIN and SECONDARY
// -----------------------------------------------------------------------------
export interface BayesRecord {
  number: number;
  posteriorMean: number;
  credibleLower: number;
  credibleUpper: number;
  appearances: number;
  exceedsUniform: boolean;
}

export function computeBayes(game: GameId = "powerball"): BayesRecord[] {
  const config = getGameConfig(game);
  const freq = computeFrequency(game);
  const T = getDraws(game).length * config.mainNumbersPerDraw;
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
      exceedsUniform: mean > 1 / config.mainMax,
    };
  });
}

export function computeSecondaryBayes(game: GameId = "powerball"): BayesRecord[] {
  const config = getGameConfig(game);
  const secMax = config.hasPowerball ? config.powerballMax : config.supplementaryMax;
  const freq = computeSecondaryFrequency(game);
  const appearancesPerDraw = config.hasPowerball ? 1 : config.supplementaryCount;
  const T = getDraws(game).length * appearancesPerDraw;
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
      exceedsUniform: mean > 1 / secMax,
    };
  });
}

// -----------------------------------------------------------------------------
// 9. CHI-SQUARE — MAIN and SECONDARY
// -----------------------------------------------------------------------------
export interface ChiSquareResult {
  chiSquare: number;
  degreesOfFreedom: number;
  criticalValue95: number;
  isUniform: boolean;
  interpretation: string;
}

export function computeChiSquare(game: GameId = "powerball"): ChiSquareResult {
  const config = getGameConfig(game);
  const freq = computeFrequency(game);
  const expected = freq[0]?.expectedCount ?? 1;
  let chiSq = 0;
  for (const f of freq) chiSq += Math.pow(f.count - expected, 2) / Math.max(expected, 0.01);
  const dof = config.mainMax - 1;
  const criticalValue95 = dof > 30 ? 48.6 : 49.0;
  return {
    chiSquare: chiSq,
    degreesOfFreedom: dof,
    criticalValue95,
    isUniform: chiSq < criticalValue95,
    interpretation:
      chiSq < criticalValue95
        ? `${config.label} main-number distribution is statistically consistent with uniform random draws (no exploitable bias).`
        : `${config.label} main-number distribution deviates from uniform — some numbers appear more often than expected by chance.`,
  };
}

export function computeSecondaryChiSquare(game: GameId = "powerball"): ChiSquareResult {
  const config = getGameConfig(game);
  const secMax = config.hasPowerball ? config.powerballMax : config.supplementaryMax;
  const freq = computeSecondaryFrequency(game);
  const expected = freq[0]?.expectedCount ?? 1;
  let chiSq = 0;
  for (const f of freq) chiSq += Math.pow(f.count - expected, 2) / Math.max(expected, 0.01);
  const dof = secMax - 1;
  // Approximate 95% critical values for common df
  const criticalValue95 =
    dof === 19 ? 30.14 : dof === 46 ? 64.0 : dof === 34 ? 48.6 : 49.0;
  return {
    chiSquare: chiSq,
    degreesOfFreedom: dof,
    criticalValue95,
    isUniform: chiSq < criticalValue95,
    interpretation:
      chiSq < criticalValue95
        ? `${config.label} secondary distribution is consistent with uniform random draws.`
        : `${config.label} secondary distribution deviates from uniform.`,
  };
}

// -----------------------------------------------------------------------------
// 10. FIVE-STRATEGY ENSEMBLE PREDICTOR
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
  // For Powerball: powerball (single number)
  // For Oz Lotto: supplementaryNumbers (array of 3)
  powerball?: number;
  supplementaryNumbers?: number[];
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
  seed: number
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

export function computePredictions(game: GameId = "powerball", seed?: number): StrategyResult[] {
  const config = getGameConfig(game);
  const freq = computeFrequency(game);
  const gaps = computeGaps(game);
  const markov = computeMarkov(game);
  const pbFreq = computeSecondaryFrequency(game);
  const pbGaps = computeSecondaryGaps(game);
  const pickCount = config.mainNumbersPerDraw;

  const baseSeed = seed ?? 0;
  const resolveSeed = (offset: number, fallback: number) =>
    baseSeed === 0 ? fallback : baseSeed + offset;

  // ---- MAIN predictions ----
  const hotCandidates = freq.map((f) => ({ item: f.number, score: Math.max(f.count, 1) }));
  const mainHot = weightedPick(hotCandidates, pickCount, resolveSeed(101, 71401));

  const coldCandidates = gaps.map((g) => ({ item: g.number, score: Math.pow(g.dueScore, 2) + 0.5 }));
  const mainCold = weightedPick(coldCandidates, pickCount, resolveSeed(202, 91337));

  const balancedCandidates = freq.map((f) => {
    const g = gaps[f.number - 1];
    const hotRank = [...freq].sort((a, b) => b.count - a.count).findIndex(x => x.number === f.number) + 1;
    const coldRank = [...gaps].sort((a, b) => b.dueScore - a.dueScore).findIndex(x => x.number === g.number) + 1;
    const score = 1 / (hotRank + 2) + 1 / (coldRank + 2);
    return { item: f.number, score };
  });
  const mainBalanced = weightedPick(balancedCandidates, pickCount, resolveSeed(303, 424242));

  const markovCandidates = markov.candidates.map((c) => ({ item: c.number, score: c.score + 0.1 }));
  const mainMarkov = weightedPick(markovCandidates, pickCount, resolveSeed(404, 555555));

  // Strategy 5 — Monte-Carlo, sum + balance optimization
  const expectedSum = (pickCount * (config.mainMax + 1)) / 2;
  let bestSet: number[] = [];
  let bestScore = -Infinity;
  const mcSeed = resolveSeed(505, 20261022);
  const rng = mulberry32(mcSeed);
  for (let trial = 0; trial < 50_000; trial++) {
    const candidate: number[] = [];
    while (candidate.length < pickCount) {
      const n = 1 + Math.floor(rng() * config.mainMax);
      if (!candidate.includes(n)) candidate.push(n);
    }
    candidate.sort((a, b) => a - b);
    const sum = candidate.reduce((s, x) => s + x, 0);
    const oddCount = candidate.filter((n) => n % 2 === 1).length;
    const lowCount = candidate.filter((n) => n <= Math.floor(config.mainMax / 2)).length;
    const sumScore = -Math.abs(sum - expectedSum) / 10;
    const balanceScore = -Math.abs(oddCount - pickCount / 2) - Math.abs(lowCount - pickCount / 2);
    const score = sumScore + balanceScore + rng() * 0.01;
    if (score > bestScore) { bestScore = score; bestSet = candidate; }
  }

  // ---- SECONDARY predictions ----
  // For Powerball: single PB number; for Oz Lotto: 3 supplementary numbers
  const pbHotCands = pbFreq.map((f) => ({ item: f.number, score: Math.max(f.count, 1) }));
  const pbColdCands = pbGaps.map((g) => ({ item: g.number, score: Math.pow(g.dueScore, 2) + 0.5 }));
  const pbBalancedCands = pbFreq.map((f, i) => {
    const g = pbGaps[i];
    const hotRank = [...pbFreq].sort((a, b) => b.count - a.count).findIndex(x => x.number === f.number) + 1;
    const coldRank = [...pbGaps].sort((a, b) => b.dueScore - a.dueScore).findIndex(x => x.number === g.number) + 1;
    return { item: f.number, score: 1 / (hotRank + 2) + 1 / (coldRank + 2) };
  });
  const pbMarkovCands = pbFreq.map((f) => ({ item: f.number, score: Math.max(f.count, 0.5) }));
  const pbStatCands = Array.from({ length: config.hasPowerball ? config.powerballMax : config.supplementaryMax }, (_, i) => i + 1).map((n) => ({
    item: n,
    score: 1 / (1 + Math.abs(n - (config.hasPowerball ? config.powerballMax : config.supplementaryMax) / 2)),
  }));

  const secCount = config.hasPowerball ? 1 : config.supplementaryCount;
  const pbHot = weightedPick(pbHotCands, secCount, resolveSeed(601, 71401));
  const pbCold = weightedPick(pbColdCands, secCount, resolveSeed(702, 91337));
  const pbBalanced = weightedPick(pbBalancedCands, secCount, resolveSeed(803, 424242));
  const pbMarkov = weightedPick(pbMarkovCands, secCount, resolveSeed(904, 555555));
  const pbStatistical = weightedPick(pbStatCands, secCount, resolveSeed(1005, 20261022));

  return [
    {
      id: "frequency_weighted",
      name: "Hot Pursuit",
      tagline: "Frequency-weighted",
      description: `Numbers drawn most often in ${config.label}. ${config.hasPowerball ? "Powerball" : "Supplementaries"} = most frequent secondary.`,
      mainNumbers: mainHot,
      ...(config.hasPowerball ? { powerball: pbHot[0] } : { supplementaryNumbers: pbHot }),
    },
    {
      id: "cold_due",
      name: "Cold Snap",
      tagline: "Gap / Due",
      description: `Numbers whose dry spell most exceeds historical mean gap. ${config.hasPowerball ? "Powerball" : "Supplementaries"} = most overdue secondary.`,
      mainNumbers: mainCold,
      ...(config.hasPowerball ? { powerball: pbCold[0] } : { supplementaryNumbers: pbCold }),
    },
    {
      id: "balanced",
      name: "Equilibrium",
      tagline: "Rank fusion",
      description: "Inverse-rank fusion of hot and cold rankings — picks numbers that balance momentum with mean-reversion intuition.",
      mainNumbers: mainBalanced,
      ...(config.hasPowerball ? { powerball: pbBalanced[0] } : { supplementaryNumbers: pbBalanced }),
    },
    {
      id: "markov_informed",
      name: "Markov Chain",
      tagline: "Co-occurrence",
      description: `First-order Markov model: aggregates conditional co-occurrence probabilities of every other main number given the main numbers in the latest draw.`,
      mainNumbers: mainMarkov,
      ...(config.hasPowerball ? { powerball: pbMarkov[0] } : { supplementaryNumbers: pbMarkov }),
    },
    {
      id: "statistical_norm",
      name: "Statistical Norm",
      tagline: "Sum + balance",
      description: `Monte-Carlo search (50,000 trials) maximizing closeness to expected sum (${expectedSum.toFixed(0)}) and balanced odd/even & high/low.`,
      mainNumbers: bestSet,
      ...(config.hasPowerball ? { powerball: pbStatistical[0] } : { supplementaryNumbers: pbStatistical }),
    },
  ];
}

// -----------------------------------------------------------------------------
// 11. PER-METHOD PREDICTIONS — generate number picks from EACH statistical method individually
// -----------------------------------------------------------------------------
// Each method gets its own prediction: 7 main + 1 PB (Powerball) OR
// 7 main + 3 supp (Oz Lotto) OR 6 main + 2 supp (Saturday Lotto).
// Lets the user try picks derived from each method separately.

export interface MethodPrediction {
  id: string;
  methodName: string;
  methodTag: string;
  rationale: string;
  mainNumbers: number[];
  powerball?: number;
  supplementaryNumbers?: number[];
}

export function computeMethodPredictions(game: GameId = "powerball", seed?: number): MethodPrediction[] {
  const config = getGameConfig(game);
  const freq = computeFrequency(game);
  const gaps = computeGaps(game);
  const markov = computeMarkov(game);
  const gapDist = computeGapDistribution(game);
  const freqCI = computeFrequencyWithCI(game);
  const bayes = computeBayes(game);
  const secFreq = computeSecondaryFrequency(game);
  const secGaps = computeSecondaryGaps(game);
  const pairCorr = computePairCorrelation(game, 5);
  const pickCount = config.mainNumbersPerDraw;
  const secCount = config.hasPowerball ? 1 : config.supplementaryCount;

  const baseSeed = seed ?? 0;
  const r = (offset: number, fallback: number) => baseSeed === 0 ? fallback : baseSeed + offset;

  const predictions: MethodPrediction[] = [];

  // Helper to pick top N by some metric
  const topN = <T>(arr: T[], scoreFn: (x: T) => number, n: number, asc = false): T[] => {
    const sorted = [...arr].sort((a, b) => asc ? scoreFn(a) - scoreFn(b) : scoreFn(b) - scoreFn(a));
    return sorted.slice(0, n);
  };

  // Helper to extract just the number from a FrequencyRecord
  const pickMainNumbers = (records: { number: number }[]): number[] =>
    records.map(r => r.number).sort((a, b) => a - b);

  // Method 1: Pure Top Hot — 7 most frequent main numbers
  predictions.push({
    id: "pure-hot",
    methodName: "Pure Top Hot",
    methodTag: "Top 7 by frequency",
    rationale: "Simply the 7 numbers that have appeared most often in historical draws. Assumes any positive bias persists.",
    mainNumbers: pickMainNumbers(topN(freq, f => f.count, pickCount)),
    ...(config.hasPowerball
      ? { powerball: topN(secFreq, f => f.count, 1)[0].number }
      : { supplementaryNumbers: topN(secFreq, f => f.count, secCount).map(r => r.number).sort((a,b)=>a-b) }),
  });

  // Method 2: Pure Top Cold — 7 least frequent main numbers
  predictions.push({
    id: "pure-cold",
    methodName: "Pure Top Cold",
    methodTag: "Bottom 7 by frequency",
    rationale: "The 7 numbers that have appeared least often. Gambler's fallacy intuition: 'cold' numbers are 'due'.",
    mainNumbers: pickMainNumbers(topN(freq, f => f.count, pickCount, true)),
    ...(config.hasPowerball
      ? { powerball: topN(secFreq, f => f.count, 1, true)[0].number }
      : { supplementaryNumbers: topN(secFreq, f => f.count, secCount, true).map(r => r.number).sort((a,b)=>a-b) }),
  });

  // Method 3: Most Overdue — top 7 by dueScore
  predictions.push({
    id: "most-overdue",
    methodName: "Most Overdue",
    methodTag: "Top 7 by due index",
    rationale: "Numbers whose current dry spell most exceeds their historical mean gap. Largest currentGap / averageGap ratio.",
    mainNumbers: pickMainNumbers(topN(gaps, g => g.dueScore, pickCount)),
    ...(config.hasPowerball
      ? { powerball: topN(secGaps, g => g.dueScore, 1)[0].number }
      : { supplementaryNumbers: topN(secGaps, g => g.dueScore, secCount).map(r => r.number).sort((a,b)=>a-b) }),
  });

  // Method 4: K-S Top Consistent — numbers with lowest K-S statistic (most random)
  predictions.push({
    id: "ks-consistent",
    methodName: "K-S Most Random",
    methodTag: "Lowest K-S D statistic",
    rationale: "Numbers whose gap distribution most closely matches the theoretical geometric distribution. Numbers behaving most 'randomly'.",
    mainNumbers: pickMainNumbers(topN(gapDist.filter(g => g.gapCount >= 5), g => -g.ksStatistic, pickCount).map(g => ({ number: g.number }))),
    ...(config.hasPowerball
      ? { powerball: topN(secFreq, f => f.count, 1)[0].number }
      : { supplementaryNumbers: topN(secFreq, f => f.count, secCount).map(r => r.number).sort((a,b)=>a-b) }),
  });

  // Method 5: K-S Top Anomalous — numbers with highest K-S statistic
  predictions.push({
    id: "ks-anomalous",
    methodName: "K-S Most Anomalous",
    methodTag: "Highest K-S D statistic",
    rationale: "Numbers whose gap distribution most deviates from geometric. Potentially biased (though likely statistical noise).",
    mainNumbers: pickMainNumbers(topN(gapDist.filter(g => g.gapCount >= 5), g => g.ksStatistic, pickCount).map(g => ({ number: g.number }))),
    ...(config.hasPowerball
      ? { powerball: topN(secGaps, g => g.dueScore, 1)[0].number }
      : { supplementaryNumbers: topN(secGaps, g => g.dueScore, secCount).map(r => r.number).sort((a,b)=>a-b) }),
  });

  // Method 6: CI High Outliers — numbers above upper CI bound
  const highOutliers = freqCI.filter(f => f.isOutlier && f.count > f.expectedCount);
  if (highOutliers.length >= pickCount) {
    predictions.push({
      id: "ci-high",
      methodName: "CI High Outliers",
      methodTag: "Above 95% CI",
      rationale: "Numbers whose observed count exceeds the upper 95% confidence band — statistically significant high-frequency outliers.",
      mainNumbers: pickMainNumbers(topN(highOutliers, f => f.zScore, pickCount)),
      ...(config.hasPowerball
        ? { powerball: topN(secFreq, f => f.count, 1)[0].number }
        : { supplementaryNumbers: topN(secFreq, f => f.count, secCount).map(r => r.number).sort((a,b)=>a-b) }),
    });
  }

  // Method 7: CI Low Outliers — numbers below lower CI bound
  const lowOutliers = freqCI.filter(f => f.isOutlier && f.count < f.expectedCount);
  if (lowOutliers.length >= pickCount) {
    predictions.push({
      id: "ci-low",
      methodName: "CI Low Outliers",
      methodTag: "Below 95% CI",
      rationale: "Numbers whose observed count is below the lower 95% confidence band — statistically significant low-frequency outliers (possibly 'due').",
      mainNumbers: pickMainNumbers(topN(lowOutliers, f => -f.zScore, pickCount)),
      ...(config.hasPowerball
        ? { powerball: topN(secGaps, g => g.dueScore, 1)[0].number }
        : { supplementaryNumbers: topN(secGaps, g => g.dueScore, secCount).map(r => r.number).sort((a,b)=>a-b) }),
    });
  }

  // Method 8: Bayesian Top Posterior — top 7 by posterior mean
  predictions.push({
    id: "bayesian-top",
    methodName: "Bayesian Top Posterior",
    methodTag: "Highest P(θ)",
    rationale: "Numbers with the highest posterior mean probability after Beta-Binomial update. Most likely true-high-frequency numbers.",
    mainNumbers: pickMainNumbers(topN(bayes, b => b.posteriorMean, pickCount)),
    ...(config.hasPowerball
      ? { powerball: topN(secFreq, f => f.count, 1)[0].number }
      : { supplementaryNumbers: topN(secFreq, f => f.count, secCount).map(r => r.number).sort((a,b)=>a-b) }),
  });

  // Method 9: Markov Next-Likely — top 7 by Markov co-occurrence
  predictions.push({
    id: "markov-next",
    methodName: "Markov Next-Likely",
    methodTag: "Highest co-occurrence",
    rationale: "Numbers with the highest aggregated conditional co-occurrence probability given the latest draw's main numbers.",
    mainNumbers: pickMainNumbers(topN(markov.candidates, c => c.score, pickCount).map(c => ({ number: c.number }))),
    ...(config.hasPowerball
      ? { powerball: topN(secFreq, f => f.count, 1)[0].number }
      : { supplementaryNumbers: topN(secFreq, f => f.count, secCount).map(r => r.number).sort((a,b)=>a-b) }),
  });

  // Method 10: Pair Correlation Over — include top co-occurring pairs
  // Take the top co-occurring pairs and merge their numbers into a set of 7
  const overPairs = pairCorr.topOver.slice(0, 3);
  const overNumbers = new Set<number>();
  overPairs.forEach(p => { overNumbers.add(p.pair[0]); overNumbers.add(p.pair[1]); });
  // If we have fewer than 7, fill with top frequency
  if (overNumbers.size < pickCount) {
    for (const f of [...freq].sort((a, b) => b.count - a.count)) {
      if (overNumbers.size >= pickCount) break;
      overNumbers.add(f.number);
    }
  }
  predictions.push({
    id: "pair-over",
    methodName: "Pair Correlation Over",
    methodTag: "Co-occurring pairs",
    rationale: "Includes the top 3 pairs of numbers that appear together more often than expected by chance. Fills remaining slots with hot numbers.",
    mainNumbers: [...overNumbers].sort((a, b) => a - b).slice(0, pickCount),
    ...(config.hasPowerball
      ? { powerball: topN(secFreq, f => f.count, 1)[0].number }
      : { supplementaryNumbers: topN(secFreq, f => f.count, secCount).map(r => r.number).sort((a,b)=>a-b) }),
  });

  // Method 11: Pair Correlation Under — avoid under-occurring pairs
  // Pick top frequency numbers, but exclude any number from top under-pairs
  const underPairNumbers = new Set<number>();
  pairCorr.topUnder.slice(0, 3).forEach(p => { underPairNumbers.add(p.pair[0]); underPairNumbers.add(p.pair[1]); });
  const candidates = freq.filter(f => !underPairNumbers.has(f.number));
  const safePool = candidates.length >= pickCount ? candidates : freq;
  predictions.push({
    id: "pair-under-avoid",
    methodName: "Avoid Under-Pairs",
    methodTag: "Exclude low-co-occurrence",
    rationale: "Picks hot numbers but excludes any number from the top 3 pairs that appear together LESS than expected by chance.",
    mainNumbers: pickMainNumbers(topN(safePool, f => f.count, pickCount)),
    ...(config.hasPowerball
      ? { powerball: topN(secFreq, f => f.count, 1)[0].number }
      : { supplementaryNumbers: topN(secFreq, f => f.count, secCount).map(r => r.number).sort((a,b)=>a-b) }),
  });

  // Method 12: Coverage Seekers — numbers that have appeared 0 times (still missing)
  const zeroCount = freq.filter(f => f.count === 0);
  if (zeroCount.length >= pickCount) {
    predictions.push({
      id: "coverage-seekers",
      methodName: "Coverage Seekers",
      methodTag: "Numbers with 0 appearances",
      rationale: "Numbers that have never appeared in the historical data. Theoretically impossible to be 'due' but covers the long tail.",
      mainNumbers: pickMainNumbers(zeroCount.slice(0, pickCount)),
      ...(config.hasPowerball
        ? { powerball: topN(secGaps, g => g.dueScore, 1)[0].number }
        : { supplementaryNumbers: topN(secGaps, g => g.dueScore, secCount).map(r => r.number).sort((a,b)=>a-b) }),
    });
  }

  // Method 13: Balanced Sum Convergence — Monte Carlo optimizing expected sum + balance
  // (Reuses logic from Statistical Norm strategy)
  const expectedSum = (pickCount * (config.mainMax + 1)) / 2;
  const rng = mulberry32(r(505, 20261022));
  let bestSet: number[] = [];
  let bestScore = -Infinity;
  for (let trial = 0; trial < 20_000; trial++) {
    const cand: number[] = [];
    while (cand.length < pickCount) {
      const n = 1 + Math.floor(rng() * config.mainMax);
      if (!cand.includes(n)) cand.push(n);
    }
    cand.sort((a, b) => a - b);
    const sum = cand.reduce((s, x) => s + x, 0);
    const oddCount = cand.filter(n => n % 2 === 1).length;
    const lowCount = cand.filter(n => n <= Math.floor(config.mainMax / 2)).length;
    const sumScore = -Math.abs(sum - expectedSum) / 10;
    const balanceScore = -Math.abs(oddCount - pickCount / 2) - Math.abs(lowCount - pickCount / 2);
    const score = sumScore + balanceScore + rng() * 0.01;
    if (score > bestScore) { bestScore = score; bestSet = cand; }
  }
  predictions.push({
    id: "sum-balanced",
    methodName: "Sum-Balanced",
    methodTag: "Converge on expected sum",
    rationale: `Monte-Carlo pick (20k trials) optimizing closeness to theoretical expected sum (${expectedSum.toFixed(0)}) + balanced odd/even and high/low.`,
    mainNumbers: bestSet,
    ...(config.hasPowerball
      ? { powerball: topN(secFreq, f => f.count, 1)[0].number }
      : { supplementaryNumbers: topN(secFreq, f => f.count, secCount).map(r => r.number).sort((a,b)=>a-b) }),
  });

  // Method 14: Mid-range picks (numbers near the median — middle of the range)
  const midPoint = Math.floor(config.mainMax / 2);
  const midRange = freq.filter(f => Math.abs(f.number - midPoint) <= Math.floor(config.mainMax / 4));
  predictions.push({
    id: "mid-range",
    methodName: "Mid-Range Picks",
    methodTag: "Near middle of range",
    rationale: `Numbers clustered around the middle of the 1-${config.mainMax} range (within ±${Math.floor(config.mainMax / 4)} of ${midPoint}). Bet on regression to the mean.`,
    mainNumbers: pickMainNumbers(topN(midRange, f => f.count, pickCount)),
    ...(config.hasPowerball
      ? { powerball: Math.round(config.powerballMax / 2) }
      : { supplementaryNumbers: topN(secFreq, f => f.count, secCount).map(r => r.number).sort((a,b)=>a-b) }),
  });

  return predictions;
}


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
  hotSecondary: number[];
  coldSecondary: number[];
  mostOverdueMain: number;
  mostOverdueSecondary: number;
  chiSquareMain: ChiSquareResult;
  chiSquareSecondary: ChiSquareResult;
  sum: SumResult;
  oddEven: OddEvenResult;
  highLow: HighLowResult;
  consecutive: ConsecutiveResult;
}

export function computeAggregate(game: GameId = "powerball"): AggregateStats {
  const config = getGameConfig(game);
  const freq = computeFrequency(game);
  const gaps = computeGaps(game);
  const pbFreq = computeSecondaryFrequency(game);
  const pbGaps = computeSecondaryGaps(game);
  const sorted = [...getDraws(game)].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length === 0) {
    return {
      totalDraws: 0,
      totalMainNumbers: 0,
      latestDrawNumber: 0,
      latestDrawDate: "",
      earliestDrawNumber: 0,
      earliestDrawDate: "",
      meanPerDraw: 0,
      hotMainNumbers: [],
      coldMainNumbers: [],
      hotSecondary: [],
      coldSecondary: [],
      mostOverdueMain: 0,
      mostOverdueSecondary: 0,
      chiSquareMain: computeChiSquare(game),
      chiSquareSecondary: computeSecondaryChiSquare(game),
      sum: computeSums(game),
      oddEven: computeOddEven(game),
      highLow: computeHighLow(game),
      consecutive: computeConsecutivePairs(game),
    };
  }
  const earliest = sorted[0];
  const latest = sorted[sorted.length - 1];
  return {
    totalDraws: sorted.length,
    totalMainNumbers: sorted.length * config.mainNumbersPerDraw,
    latestDrawNumber: latest.drawNumber,
    latestDrawDate: latest.dateLabel,
    earliestDrawNumber: earliest.drawNumber,
    earliestDrawDate: earliest.dateLabel,
    meanPerDraw: freq.reduce((s, f) => s + f.count, 0) / sorted.length,
    hotMainNumbers: [...freq].sort((a, b) => b.count - a.count).slice(0, 5).map((f) => f.number),
    coldMainNumbers: [...freq].sort((a, b) => a.count - b.count).slice(0, 5).map((f) => f.number),
    hotSecondary: [...pbFreq].sort((a, b) => b.count - a.count).slice(0, 3).map((f) => f.number),
    coldSecondary: [...pbFreq].sort((a, b) => a.count - b.count).slice(0, 3).map((f) => f.number),
    mostOverdueMain: [...gaps].sort((a, b) => b.dueScore - a.dueScore)[0]?.number ?? 0,
    mostOverdueSecondary: [...pbGaps].sort((a, b) => b.dueScore - a.dueScore)[0]?.number ?? 0,
    chiSquareMain: computeChiSquare(game),
    chiSquareSecondary: computeSecondaryChiSquare(game),
    sum: computeSums(game),
    oddEven: computeOddEven(game),
    highLow: computeHighLow(game),
    consecutive: computeConsecutivePairs(game),
  };
}

// Re-exports for backward compat
export { getDraws, getLatestDraw, type UnifiedDraw };
export { getGameConfig, GAMES, GAME_IDS, type GameId, type GameConfig };
