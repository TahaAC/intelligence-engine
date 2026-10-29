"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { NumberBall } from "@/components/number-ball";
import { FrequencyHeatmap } from "@/components/frequency-heatmap";
import { StrategyCard } from "@/components/strategy-card";
import { DrawHistoryTable } from "@/components/draw-history-table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  computeFrequency,
  computeSecondaryFrequency,
  computeFrequencyWithCI,
  computeSecondaryFrequencyWithCI,
  computeHotCold,
  computeSecondaryHotCold,
  computeGaps,
  computeSecondaryGaps,
  computeGapDistribution,
  computeSecondaryGapDistribution,
  computeSums,
  computeMarkov,
  computeBayes,
  computeSecondaryBayes,
  computeChiSquare,
  computeSecondaryChiSquare,
  computePredictions,
  computeMethodPredictions,
  computeRecommendedPick,
  computeSetForLifeOptimizedPick,
  computeAggregate,
  computeOddEven,
  computeHighLow,
  computeConsecutivePairs,
  computeEntropy,
  computeRunsTest,
  computeAutocorrelation,
  computePairCorrelation,
  computeHypergeometricProb,
  computeCoverage,
  computeDistributionShape,
  computeCouponCollector,
  computeBirthdayProblem,
  getGameConfig,
  type GameId,
} from "@/lib/analytics";
import { GAMES, GAME_IDS } from "@/lib/game-config";
import { getDraws, setDraws, getLatestDraw, type UnifiedDraw } from "@/lib/draw-store";
import { LOTTERY_DRAWS } from "@/lib/lottery-data";
import { OZLOTTO_DRAWS } from "@/lib/lottery-data-ozlotto";
import { useSavedPicks, type SavedPick } from "@/hooks/use-saved-picks";

export default function Home() {
  // Currently selected game
  const [game, setGame] = useState<GameId>("powerball");
  const config = getGameConfig(game);

  // Version counter — increments whenever the draw store is updated
  const [drawsVersion, setDrawsVersion] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string>("");
  const [lastSync, setLastSync] = useState<string>("");

  // Seed for re-randomizing predictions on button click
  const [predictionSeed, setPredictionSeed] = useState<number>(0);
  const [regenCount, setRegenCount] = useState(0);
  const [lastRegen, setLastRegen] = useState<string>("");

  // Compute analytics — all depend on `game` and `drawsVersion`
  const frequency = useMemo(() => computeFrequency(game), [game, drawsVersion]);
  const secFrequency = useMemo(() => computeSecondaryFrequency(game), [game, drawsVersion]);
  const hotCold = useMemo(() => computeHotCold(game, 7), [game, drawsVersion]);
  const secHotCold = useMemo(() => computeSecondaryHotCold(game, 5), [game, drawsVersion]);
  const gaps = useMemo(() => computeGaps(game), [game, drawsVersion]);
  const secGaps = useMemo(() => computeSecondaryGaps(game), [game, drawsVersion]);
  const sums = useMemo(() => computeSums(game), [game, drawsVersion]);
  const markov = useMemo(() => computeMarkov(game), [game, drawsVersion]);
  const bayes = useMemo(() => computeBayes(game), [game, drawsVersion]);
  const secBayes = useMemo(() => computeSecondaryBayes(game), [game, drawsVersion]);
  const chiSquare = useMemo(() => computeChiSquare(game), [game, drawsVersion]);
  const secChiSquare = useMemo(() => computeSecondaryChiSquare(game), [game, drawsVersion]);
  const oddEven = useMemo(() => computeOddEven(game), [game, drawsVersion]);
  const highLow = useMemo(() => computeHighLow(game), [game, drawsVersion]);
  const consecutive = useMemo(() => computeConsecutivePairs(game), [game, drawsVersion]);
  const aggregate = useMemo(() => computeAggregate(game), [game, drawsVersion]);

  // K-S gap distribution analysis + frequency with CI (more rigorous stats)
  const gapDistribution = useMemo(() => computeGapDistribution(game), [game, drawsVersion]);
  const secGapDistribution = useMemo(() => computeSecondaryGapDistribution(game), [game, drawsVersion]);
  const frequencyWithCI = useMemo(() => computeFrequencyWithCI(game), [game, drawsVersion]);
  const secFrequencyWithCI = useMemo(() => computeSecondaryFrequencyWithCI(game), [game, drawsVersion]);

  // Sort K-S results to show most-anomalous numbers first
  const sortedKsMain = useMemo(
    () => [...gapDistribution].sort((a, b) => b.ksStatistic - a.ksStatistic).slice(0, 8),
    [gapDistribution]
  );
  const sortedKsSec = useMemo(
    () => [...secGapDistribution].sort((a, b) => b.ksStatistic - a.ksStatistic).slice(0, 5),
    [secGapDistribution]
  );

  // Advanced Statistical Battery (additional methods from the internet)
  const entropy = useMemo(() => computeEntropy(game), [game, drawsVersion]);
  const runsTest = useMemo(() => computeRunsTest(game), [game, drawsVersion]);
  const autocorr = useMemo(() => computeAutocorrelation(game), [game, drawsVersion]);
  const pairCorrelation = useMemo(() => computePairCorrelation(game, 8), [game, drawsVersion]);
  const hypergeom = useMemo(() => computeHypergeometricProb(game), [game, drawsVersion]);
  const coverage = useMemo(() => computeCoverage(game), [game, drawsVersion]);
  const distShape = useMemo(() => computeDistributionShape(game), [game, drawsVersion]);
  const couponCollector = useMemo(() => computeCouponCollector(game), [game, drawsVersion]);
  const birthdayProblem = useMemo(() => computeBirthdayProblem(game), [game, drawsVersion]);

  const predictions = useMemo(
    () => computePredictions(game, predictionSeed || undefined),
    [game, predictionSeed, drawsVersion]
  );

  // Per-method predictions — one set per individual statistical method
  const methodPredictions = useMemo(
    () => computeMethodPredictions(game, predictionSeed || undefined),
    [game, predictionSeed, drawsVersion]
  );

  // Recommended best pick — consensus across ALL methods
  const recommendedPick = useMemo(
    () => computeRecommendedPick(game),
    [game, drawsVersion]
  );

  // Set for Life multi-draw optimized pick (only for set-for-life game)
  const sflOptimized = useMemo(
    () => computeSetForLifeOptimizedPick(game),
    [game, drawsVersion]
  );
  const isSetForLife = game === "set-for-life";

  // Saved picks (localStorage-backed)
  const { picks: savedPicks, savePick, deletePick, clearGame } = useSavedPicks();
  const savedPicksForGame = useMemo(
    () => savedPicks.filter((p) => p.game === game),
    [savedPicks, game]
  );

  // Helper: compute match counts between a saved pick and the latest draw
  const computeMatch = useCallback(
    (pick: SavedPick) => {
      const latest = getLatestDraw(pick.game);
      if (!latest) return { mainMatches: 0, secMatches: 0, mainTotal: pick.mainNumbers.length, secTotal: 0, matchedMain: [], matchedSec: [] };
      const config = getGameConfig(pick.game);
      const matchedMain = pick.mainNumbers.filter((n) => latest.mainNumbers?.includes(n));
      let matchedSec: number[] = [];
      let secTotal = 0;
      if (config.hasPowerball) {
        secTotal = 1;
        if (pick.powerball != null && latest.powerball === pick.powerball) {
          matchedSec = [pick.powerball];
        }
      } else {
        secTotal = config.supplementaryCount;
        const latestSupp = latest.supplementaryNumbers ?? [];
        matchedSec = (pick.supplementaryNumbers ?? []).filter((n) => latestSupp.includes(n));
      }
      return {
        mainMatches: matchedMain.length,
        secMatches: matchedSec.length,
        mainTotal: pick.mainNumbers.length,
        secTotal,
        matchedMain,
        matchedSec,
        latestDrawNumber: latest.drawNumber,
        latestDrawDate: latest.dateLabel,
      };
    },
    []
  );

  const maxCount = Math.max(...frequency.map((f) => f.count));
  const minCount = Math.min(...frequency.map((f) => f.count));
  const secMaxCount = Math.max(...secFrequency.map((f) => f.count));
  const secMinCount = Math.min(...secFrequency.map((f) => f.count));

  const sortedGaps = [...gaps].sort((a, b) => b.dueScore - a.dueScore).slice(0, 10);
  const maxDue = Math.max(...sortedGaps.map((g) => g.dueScore));

  const sortedSecGaps = [...secGaps].sort((a, b) => b.dueScore - a.dueScore);
  const secMaxDue = Math.max(...sortedSecGaps.map((g) => g.dueScore));

  const latestDraw = useMemo(() => getLatestDraw(game), [game, drawsVersion]);
  const currentDraws = useMemo(() => getDraws(game), [game, drawsVersion]);

  // Fetch draws from /api/draws?game=X
  const refreshDraws = useCallback(async (targetGame: GameId, opts?: { quiet?: boolean }) => {
    if (!opts?.quiet) {
      setSyncing(true);
      setSyncMsg(`Fetching latest ${GAMES[targetGame].label} draws from database...`);
    }
    try {
      const res = await fetch(`/api/draws?game=${targetGame}`, { cache: "no-store" });
      const data = await res.json();
      if (data.ok && Array.isArray(data.draws) && data.draws.length > 0) {
        const normalized: UnifiedDraw[] = data.draws.map((d: any) => ({
          game: d.game,
          drawNumber: d.drawNumber,
          date: d.date,
          dateLabel: d.dateLabel,
          mainNumbers: d.mainNumbers,
          powerball: d.powerball,
          supplementaryNumbers: d.supplementaryNumbers,
        }));
        setDraws(targetGame, normalized);
        setDrawsVersion((v) => v + 1);
        if (!opts?.quiet) {
          setSyncMsg(`Loaded ${normalized.length} ${GAMES[targetGame].label} draws from database`);
        }
      } else if (!opts?.quiet) {
        setSyncMsg(`No ${GAMES[targetGame].label} draws in database — using seeded data`);
      }
    } catch (e) {
      if (!opts?.quiet) {
        setSyncMsg(`Could not reach /api/draws?game=${targetGame} — using seeded data`);
      }
    } finally {
      if (!opts?.quiet) {
        setSyncing(false);
        setLastSync(new Date().toLocaleTimeString());
      }
    }
  }, []);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    setSyncMsg(`Scraping national-lottery.com for new ${config.label} draws...`);
    try {
      const res = await fetch(`/api/sync?game=${game}`, { method: "POST", cache: "no-store" });
      const data = await res.json();
      if (data.ok) {
        setSyncMsg(
          `Sync complete: ${data.drawsAdded} new, ${data.drawsAlreadyInDb} already in DB, ${data.totalInDb} total`
        );
        await refreshDraws(game, { quiet: true });
      } else {
        setSyncMsg(`Sync failed: ${data.error || "unknown error"}`);
      }
    } catch (e: any) {
      setSyncMsg(`Sync error: ${e?.message || String(e)}`);
    } finally {
      setSyncing(false);
      setLastSync(new Date().toLocaleTimeString());
    }
  }, [game, config.label, refreshDraws]);

  // Fetch draws for the selected game on mount + when game changes
  useEffect(() => {
    refreshDraws(game);
  }, [game, refreshDraws]);

  const handleRegenerate = () => {
    setPredictionSeed(Date.now() & 0x7fffffff);
    setRegenCount((c) => c + 1);
    setLastRegen(new Date().toLocaleTimeString());
  };

  const handleReset = () => {
    setPredictionSeed(0);
    setRegenCount(0);
    setLastRegen("");
  };

  const handleGameChange = (newGame: GameId) => {
    if (newGame === game) return;
    setGame(newGame);
    setPredictionSeed(0);
    setRegenCount(0);
    setLastRegen("");
    setSyncMsg("");
    setLastSync("");
  };

  const secLabel = config.hasPowerball ? "Powerball" : "Supplementary";
  const secShort = config.hasPowerball ? "PB" : "SUPP";
  const secMaxRange = config.hasPowerball ? config.powerballMax : config.supplementaryMax;
  const secCountPerDraw = config.hasPowerball ? 1 : config.supplementaryCount;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-cyan-500/30">
      {/* Ambient gradient */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -top-20 right-0 w-[500px] h-[500px] rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 w-[700px] h-[700px] rounded-full bg-emerald-500/5 blur-3xl" />
      </div>

      <div
        className="pointer-events-none fixed inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative z-10">
        {/* HEADER */}
        <header className="border-b border-slate-800/80 backdrop-blur-md bg-slate-950/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center font-mono font-bold text-white text-lg shadow-[0_0_20px_rgba(34,211,238,0.4)]">
                L
              </div>
              <div>
                <h1 className="text-base sm:text-lg font-bold tracking-tight leading-tight">
                  LOTTO INTELLIGENCE ENGINE
                </h1>
                <p className="text-[10px] sm:text-xs font-mono text-slate-400 uppercase tracking-wider">
                  Multi-game · {config.label} · 7 main ({config.mainMin}-{config.mainMax}) {config.hasPowerball ? `+ 1 ${secLabel} (1-${config.powerballMax})` : `+ ${config.supplementaryCount} supp (1-${config.supplementaryMax})`}
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="border-cyan-500/40 text-cyan-400 font-mono text-[10px] hidden sm:flex"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
              ENGINE ACTIVE
            </Badge>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
          {/* TAB SWITCHER */}
          <section>
            <div className="flex gap-2 flex-wrap">
              {GAME_IDS.map((g) => {
                const cfg = GAMES[g];
                const isActive = g === game;
                return (
                  <button
                    key={g}
                    onClick={() => handleGameChange(g)}
                    className={`px-4 py-2 rounded-lg border font-mono text-xs font-semibold transition-all flex items-center gap-2 ${
                      isActive
                        ? "border-cyan-500/60 bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 text-cyan-100 shadow-[0_0_20px_rgba(34,211,238,0.3)]"
                        : "border-slate-700 bg-slate-900/40 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                    }`}
                  >
                    <span className="text-base">{g === "powerball" ? "⚡" : "★"}</span>
                    <div className="text-left">
                      <div>{cfg.label}</div>
                      <div className="text-[9px] text-slate-500 font-mono">
                        {cfg.drawDay} · {cfg.mainMax}+{cfg.hasPowerball ? 1 : cfg.supplementaryCount} numbers
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* SYNC PANEL */}
          <section className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 to-slate-950/40 p-4 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-mono text-lg shrink-0">
                  ⟳
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-emerald-200 font-mono tracking-wide">
                    AUTO-SYNC · {config.label} · Source: {config.sourceUrl}
                  </div>
                  <div className="text-[11px] font-mono text-slate-400 mt-0.5 truncate">
                    {syncing ? (
                      <span className="text-amber-300 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        {syncMsg}
                      </span>
                    ) : syncMsg ? (
                      <span className="text-slate-300">{syncMsg}{lastSync && ` · ${lastSync}`}</span>
                    ) : (
                      <span className="text-slate-500">Idle — click Sync Now to fetch latest {config.label} draws</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="px-4 py-2 rounded-lg border border-emerald-500/50 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-emerald-200 font-mono text-xs font-semibold hover:from-emerald-500/30 hover:to-cyan-500/30 hover:text-white transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
              >
                <span className={syncing ? "animate-spin inline-block" : ""}>⟳</span>
                {syncing ? "Syncing..." : "Sync Now"}
              </button>
            </div>
          </section>

          {/* HERO */}
          <section className="relative">
            <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950/80 p-6 sm:p-10 backdrop-blur-md overflow-hidden">
              <div className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative grid lg:grid-cols-2 gap-8 items-center">
                <div>
                  <Badge className="mb-4 bg-cyan-500/10 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/15 font-mono">
                    DRAW #{latestDraw?.drawNumber ?? "—"} · {latestDraw?.dateLabel ?? "—"}
                  </Badge>
                  <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3 bg-gradient-to-r from-white via-cyan-100 to-cyan-300 bg-clip-text text-transparent">
                    Latest Draw · {config.mainNumbersPerDraw} Main + {secCountPerDraw} {secLabel}
                  </h2>
                  <p className="text-slate-300/80 text-sm sm:text-base leading-relaxed mb-6">
                    Crunched {aggregate.totalDraws} historical {config.label} draws
                    ({aggregate.totalMainNumbers.toLocaleString()} main number appearances
                    {config.hasPowerball ? ` + ${aggregate.totalDraws} ${secLabel} draws` : ` + ${aggregate.totalDraws * config.supplementaryCount} supplementary appearances`})
                    across two statistical tracks — main numbers (1-{config.mainMax}) and {secLabel} (1-{secMaxRange}).
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="border-slate-700 text-slate-300 font-mono text-xs">Frequency</Badge>
                    <Badge variant="outline" className="border-slate-700 text-slate-300 font-mono text-xs">Hot / Cold</Badge>
                    <Badge variant="outline" className="border-slate-700 text-slate-300 font-mono text-xs">Gap / Due</Badge>
                    <Badge variant="outline" className="border-slate-700 text-slate-300 font-mono text-xs">Markov Chain</Badge>
                    <Badge variant="outline" className="border-slate-700 text-slate-300 font-mono text-xs">Bayesian</Badge>
                    <Badge variant="outline" className="border-slate-700 text-slate-300 font-mono text-xs">Chi-Square</Badge>
                    <Badge variant="outline" className="border-rose-500/40 text-rose-300 font-mono text-xs">{secShort} Track</Badge>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center gap-5">
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    Main numbers
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {(latestDraw?.mainNumbers ?? []).map((n, i) => (
                      <NumberBall key={i} value={n} size="xl" variant="latest" index={i} />
                    ))}
                  </div>
                  <div className="text-[10px] font-mono text-rose-400 uppercase tracking-wider mt-2">
                    {secLabel}{config.hasPowerball ? "" : ` (${secCountPerDraw})`}
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {config.hasPowerball ? (
                      <NumberBall value={latestDraw?.powerball ?? 0} size="xl" variant="powerball" />
                    ) : (
                      (latestDraw?.supplementaryNumbers ?? []).map((n, i) => (
                        <NumberBall key={i} value={n} size="lg" variant="powerball" />
                      ))
                    )}
                  </div>
                  <div className="text-center text-xs font-mono text-slate-400">
                    Sum: <span className="text-cyan-400">{(latestDraw?.mainNumbers ?? []).reduce((s, n) => s + n, 0)}</span>
                    {" · "}
                    Expected: <span className="text-slate-300">{Math.round(sums.expectedMean)}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* KEY METRICS */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard label="Draws analyzed" value={aggregate.totalDraws.toString()} sub={`#${aggregate.earliestDrawNumber} → #${aggregate.latestDrawNumber}`} accent="cyan" />
            <MetricCard label="Most overdue main" value={`#${aggregate.mostOverdueMain}`} sub="Largest gap/mean ratio" accent="amber" />
            <MetricCard label={`Most overdue ${secShort}`} value={`#${aggregate.mostOverdueSecondary}`} sub={`${secLabel} due index`} accent="rose" />
            <MetricCard label="Mean sum" value={sums.mean.toFixed(1)} sub={`Expected ${sums.expectedMean.toFixed(1)} ± ${sums.expectedStdDev.toFixed(1)}`} accent="fuchsia" />
          </section>

          {/* PREDICTIONS */}
          <section>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Ensemble Predictions — Next {config.label} Draw
                </h2>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Five independent mathematical strategies. Each set is 7 main numbers (1-{config.mainMax}) {config.hasPowerball ? `+ 1 ${secLabel} (1-${config.powerballMax})` : `+ ${config.supplementaryCount} ${secLabel} (1-${config.supplementaryMax})`}.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {predictionSeed > 0 && (
                  <Badge variant="outline" className="border-amber-500/40 text-amber-300 font-mono text-[10px] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    SEED #{regenCount} · {lastRegen}
                  </Badge>
                )}
                {predictionSeed > 0 && (
                  <button onClick={handleReset} className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900/60 text-slate-300 font-mono text-[11px] hover:bg-slate-800 hover:text-white transition-colors">
                    ↺ Reset to default
                  </button>
                )}
                <button
                  onClick={handleRegenerate}
                  className="px-4 py-2 rounded-lg border border-cyan-500/50 bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 text-cyan-200 font-mono text-xs font-semibold hover:from-cyan-500/30 hover:to-emerald-500/30 hover:text-white transition-all shadow-[0_0_20px_rgba(34,211,238,0.25)] hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] active:scale-95 flex items-center gap-2"
                >
                  <span className="text-base">⚡</span>
                  Generate New Numbers
                </button>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
              {predictions.map((p) => {
                const isSaved = savedPicksForGame.some((sp) => sp.source === p.id && JSON.stringify(sp.mainNumbers) === JSON.stringify(p.mainNumbers));
                return (
                  <StrategyCard
                    key={p.id}
                    strategy={p}
                    game={game}
                    onSave={(pick) => savePick({ ...pick, game })}
                    saved={isSaved}
                  />
                );
              })}
            </div>

            <Disclaimer game={game} />
          </section>

          {/* PER-METHOD PREDICTIONS — one set per statistical method */}
          <section>
            <SectionHeader
              title={`Per-Method Predictions — ${config.label}`}
              subtitle="Each card uses a single statistical method to generate a candidate pick. Try them separately to see which approach you trust."
              badge={`${methodPredictions.length} METHODS`}
            />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-5">
              {methodPredictions.map((m) => {
                const secNumbers = config.hasPowerball
                  ? (m.powerball != null ? [m.powerball] : [])
                  : (m.supplementaryNumbers ?? []);
                const isSaved = savedPicksForGame.some((sp) => sp.source === m.id && JSON.stringify(sp.mainNumbers) === JSON.stringify(m.mainNumbers));
                return (
                  <div
                    key={m.id}
                    className="rounded-lg border border-slate-700/60 bg-slate-950/40 p-4 hover:border-cyan-500/40 transition-colors"
                  >
                    <div className="flex items-baseline justify-between mb-1.5">
                      <h3 className="text-sm font-semibold text-white">{m.methodName}</h3>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">
                          {m.methodTag}
                        </span>
                        <button
                          onClick={() => savePick({
                            game,
                            label: m.methodName,
                            source: m.id,
                            mainNumbers: m.mainNumbers,
                            powerball: m.powerball ?? null,
                            supplementaryNumbers: m.supplementaryNumbers ?? null,
                          })}
                          disabled={isSaved}
                          title={isSaved ? "Saved" : "Save this pick"}
                          className={`w-6 h-6 rounded text-xs font-mono transition-all flex items-center justify-center ${
                            isSaved
                              ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/40 cursor-default"
                              : "bg-slate-900/40 text-slate-300 border border-slate-600 hover:border-cyan-500/60 hover:bg-cyan-500/10 hover:text-cyan-200"
                          }`}
                        >
                          {isSaved ? "✓" : "💾"}
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-relaxed mb-3 min-h-[2rem]">
                      {m.rationale}
                    </p>
                    <div className="border-t border-slate-700/40 pt-2.5">
                      <div className="text-[9px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                        Main ({config.mainNumbersPerDraw})
                      </div>
                      <div className="flex flex-wrap gap-1 justify-center">
                        {m.mainNumbers.map((n, i) => (
                          <NumberBall key={i} value={n} size="sm" variant="prediction" />
                        ))}
                      </div>
                      <div className={`text-[9px] font-mono uppercase tracking-wider mt-2 mb-1.5 ${config.hasPowerball ? "text-rose-400" : "text-amber-400"}`}>
                        {secLabel}{config.hasPowerball ? "" : ` (${secCountPerDraw})`}
                      </div>
                      <div className="flex flex-wrap gap-1 justify-center">
                        {secNumbers.map((n, i) => (
                          <NumberBall key={i} value={n} size="sm" variant="powerball_pred" />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* FREQUENCY HEATMAPS */}
          <section>
            <SectionHeader
              title={`Frequency Heatmaps — Main + ${secLabel}`}
              subtitle={`Empirical PMF for the 7 main numbers (1-${config.mainMax}) and the ${secLabel} (1-${secMaxRange}). Hover any tile for z-score.`}
              badge="EMPIRICAL PMF"
            />
            <div className="grid lg:grid-cols-3 gap-4 mt-5">
              <Card className="lg:col-span-2 bg-slate-950/50 border-slate-800">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <CardTitle className="text-sm font-mono text-slate-300">
                      Main Numbers · 1-{config.mainMax}
                    </CardTitle>
                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span className="text-cyan-400">min: {minCount}×</span>
                      <span className="text-slate-500">|</span>
                      <span className="text-rose-400">max: {maxCount}×</span>
                      <span className="text-slate-500">|</span>
                      <span className="text-slate-400">expected: {frequency[0]?.expectedCount.toFixed(2) ?? "0"}×</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <FrequencyHeatmap data={frequency} maxCount={maxCount} minCount={minCount} />
                </CardContent>
              </Card>

              <Card className={`bg-slate-950/50 ${config.hasPowerball ? "border-rose-500/30" : "border-amber-500/30"}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <CardTitle className={`text-sm font-mono ${config.hasPowerball ? "text-rose-300" : "text-amber-300"}`}>
                      {secLabel} · 1-{secMaxRange}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-cyan-400">{secMinCount}×</span>
                      <span className="text-slate-500">|</span>
                      <span className="text-rose-400">{secMaxCount}×</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <FrequencyHeatmap data={secFrequency} maxCount={secMaxCount} minCount={secMinCount} />
                </CardContent>
              </Card>
            </div>
          </section>

          {/* HOT / COLD — MAIN + SECONDARY */}
          <section className="grid lg:grid-cols-2 gap-4">
            <div className="grid sm:grid-cols-3 gap-4">
              <Card className="bg-slate-950/50 border-rose-500/30">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <CardTitle className="text-xs font-mono text-rose-300 tracking-wider">
                      HOT MAIN · Top 7
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {hotCold.hot.map((r) => (
                      <RankRow key={r.number} number={r.number} count={r.count} pct={r.percentage} delta={r.deviation} max={maxCount} variant="hot" />
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-950/50 border-cyan-500/30">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-500" />
                    <CardTitle className="text-xs font-mono text-cyan-300 tracking-wider">
                      COLD MAIN · Bottom 7
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {hotCold.cold.map((r) => (
                      <RankRow key={r.number} number={r.number} count={r.count} pct={r.percentage} delta={r.deviation} max={maxCount} variant="cold" />
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-950/50 border-amber-500/30">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <CardTitle className="text-xs font-mono text-amber-300 tracking-wider">
                      MAIN DUE · Top 10
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                    {sortedGaps.map((g) => (
                      <div key={g.number} className="flex items-center gap-2">
                        <NumberBall value={g.number} size="sm" variant="cold" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between mb-0.5">
                            <span className="text-[10px] font-mono text-slate-400">{g.currentGap}/{g.averageGap.toFixed(1)}</span>
                            <span className="text-[10px] font-mono text-amber-400">×{g.dueScore.toFixed(2)}</span>
                          </div>
                          <Progress value={(g.dueScore / maxDue) * 100} className="h-1.5 bg-slate-800" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <Card className={`bg-slate-950/50 ${config.hasPowerball ? "border-rose-500/30" : "border-amber-500/30"}`}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${config.hasPowerball ? "bg-rose-500" : "bg-amber-500"} animate-pulse`} />
                    <CardTitle className={`text-xs font-mono tracking-wider ${config.hasPowerball ? "text-rose-300" : "text-amber-300"}`}>
                      HOT {secShort} · Top 5
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {secHotCold.hot.map((r) => (
                      <RankRow key={r.number} number={r.number} count={r.count} pct={r.percentage} delta={r.deviation} max={secMaxCount} variant={config.hasPowerball ? "powerball" : "cold"} showLeading={!config.hasPowerball} />
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className={`bg-slate-950/50 ${config.hasPowerball ? "border-rose-500/20" : "border-amber-500/20"}`}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-500" />
                    <CardTitle className="text-xs font-mono text-slate-300 tracking-wider">
                      COLD {secShort} · Bottom 5
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {secHotCold.cold.map((r) => (
                      <RankRow key={r.number} number={r.number} count={r.count} pct={r.percentage} delta={r.deviation} max={secMaxCount} variant={config.hasPowerball ? "powerball" : "cold"} showLeading={!config.hasPowerball} />
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className={`bg-slate-950/50 ${config.hasPowerball ? "border-rose-500/40" : "border-amber-500/40"}`}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${config.hasPowerball ? "bg-rose-500" : "bg-amber-500"} animate-pulse`} />
                    <CardTitle className={`text-xs font-mono tracking-wider ${config.hasPowerball ? "text-rose-300" : "text-amber-300"}`}>
                      {secShort} DUE · All {secMaxRange}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
                    {sortedSecGaps.map((g) => (
                      <div key={g.number} className="flex items-center gap-2">
                        <NumberBall value={g.number} size="sm" variant={config.hasPowerball ? "powerball" : "cold"} showLeading={!config.hasPowerball} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between mb-0.5">
                            <span className="text-[10px] font-mono text-slate-400">{g.currentGap}/{g.averageGap.toFixed(1)}</span>
                            <span className={`text-[10px] font-mono ${config.hasPowerball ? "text-rose-400" : "text-amber-400"}`}>×{g.dueScore.toFixed(2)}</span>
                          </div>
                          <Progress value={(g.dueScore / secMaxDue) * 100} className="h-1.5 bg-slate-800" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* PATTERN ANALYSIS */}
          <section>
            <SectionHeader
              title={`Pattern Analysis — Main Numbers (${config.label})`}
              subtitle="Odd/even, high/low, sum and consecutive distribution for the 7 main numbers per draw."
              badge="DESCRIPTIVE STATISTICS"
            />
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
              <Card className="bg-slate-950/50 border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-mono text-slate-300 tracking-wider">ODD / EVEN</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-2xl font-bold font-mono text-cyan-300">
                      {oddEven.oddCount}<span className="text-slate-500 text-base mx-1">/</span><span className="text-fuchsia-300">{oddEven.evenCount}</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">Expected: 50/50</div>
                  </div>
                  <div className="flex h-2 rounded-full overflow-hidden">
                    <div className="bg-cyan-500" style={{ width: `${oddEven.oddPercentage}%` }} />
                    <div className="bg-fuchsia-500" style={{ width: `${oddEven.evenPercentage}%` }} />
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] font-mono">
                    <span className="text-cyan-400">{oddEven.oddPercentage.toFixed(1)}% odd</span>
                    <span className="text-fuchsia-400">{oddEven.evenPercentage.toFixed(1)}% even</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-950/50 border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-mono text-slate-300 tracking-wider">
                    HIGH / LOW (1-{Math.floor(config.mainMax / 2)} / {Math.floor(config.mainMax / 2) + 1}-{config.mainMax})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-2xl font-bold font-mono text-emerald-300">
                      {highLow.lowCount}<span className="text-slate-500 text-base mx-1">/</span><span className="text-amber-300">{highLow.highCount}</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">Expected: 50/50</div>
                  </div>
                  <div className="flex h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500" style={{ width: `${highLow.lowPercentage}%` }} />
                    <div className="bg-amber-500" style={{ width: `${highLow.highPercentage}%` }} />
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] font-mono">
                    <span className="text-emerald-400">{highLow.lowPercentage.toFixed(1)}% low</span>
                    <span className="text-amber-400">{highLow.highPercentage.toFixed(1)}% high</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-950/50 border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-mono text-slate-300 tracking-wider">DRAW SUM RANGE</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono text-cyan-300 mb-1">{sums.mean.toFixed(1)}</div>
                  <div className="text-[10px] font-mono text-slate-400 mb-2">range {sums.min} – {sums.max}</div>
                  <div className="text-[10px] font-mono text-slate-400">
                    expected mean {sums.expectedMean.toFixed(1)} · σ = {sums.stdDev.toFixed(1)}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-950/50 border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-mono text-slate-300 tracking-wider">CONSECUTIVE PAIRS</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono text-fuchsia-300 mb-1">{consecutive.totalPairs}</div>
                  <div className="text-[10px] font-mono text-slate-400">across {consecutive.drawsWithPair}/{aggregate.totalDraws} draws</div>
                  <div className="text-[10px] font-mono text-slate-400 mt-2">{consecutive.percentageDrawsWithPair.toFixed(1)}% of draws had ≥1 pair</div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* K-S GAP DISTRIBUTION TEST (more rigorous statistical analysis) */}
          <section>
            <SectionHeader
              title={`K-S Gap Distribution Test — ${config.label}`}
              subtitle="Kolmogorov-Smirnov test of each number's gap sequence against the theoretical geometric distribution. Tests whether the gaps are statistically consistent with independent random draws."
              badge="KOLMOGOROV-SMIRNOV · GEOMETRIC"
            />
            <div className="grid lg:grid-cols-2 gap-4 mt-5">
              {/* MAIN K-S results */}
              <Card className="bg-slate-950/50 border-slate-800">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="text-lg font-mono text-fuchsia-400">D</div>
                    <CardTitle className="text-sm font-mono text-fuchsia-300 tracking-wider">
                      K-S · MAIN NUMBERS — Top 8 by D statistic
                    </CardTitle>
                  </div>
                  <CardDescription className="text-slate-400 text-xs">
                    H0: gaps follow geometric distribution with p = {config.mainNumbersPerDraw}/{config.mainMax} = {(config.mainNumbersPerDraw / config.mainMax).toFixed(3)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {sortedKsMain.map((r) => {
                      const ratio = r.criticalValue05 > 0 ? r.ksStatistic / r.criticalValue05 : 0;
                      const passColor = r.isConsistentWithRandom ? "bg-emerald-500" : "bg-rose-500";
                      return (
                        <div key={r.number} className="flex items-center gap-2 text-xs">
                          <NumberBall value={r.number} size="sm" variant="default" />
                          <div className="flex-1 min-w-0 grid grid-cols-3 gap-2 font-mono text-[10px]">
                            <div className="text-slate-300">
                              D=<span className="text-cyan-400">{r.ksStatistic.toFixed(3)}</span>
                            </div>
                            <div className="text-slate-400">
                              crit=<span className="text-slate-300">{r.criticalValue05.toFixed(3)}</span>
                            </div>
                            <div className={r.isConsistentWithRandom ? "text-emerald-400" : "text-rose-400"}>
                              p≈{r.pValue < 0.001 ? "<0.001" : r.pValue.toFixed(3)}
                            </div>
                          </div>
                          <div className="w-16 h-1.5 bg-slate-800 rounded overflow-hidden">
                            <div className={`h-full ${passColor}`} style={{ width: `${Math.min(100, ratio * 100)}%` }} />
                          </div>
                          <div className={`text-[10px] font-mono w-6 text-right ${r.isConsistentWithRandom ? "text-emerald-400" : "text-rose-400"}`}>
                            {r.isConsistentWithRandom ? "PASS" : "FAIL"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-[10px] font-mono text-slate-500 leading-relaxed">
                    Observed mean gap {gapDistribution.length > 0 ? (gapDistribution.reduce((s, r) => s + r.observedMeanGap, 0) / gapDistribution.length).toFixed(2) : "—"} vs theoretical mean {(1 / (config.mainNumbersPerDraw / config.mainMax) - 1).toFixed(2)}. A PASS verdict means the number's gap sequence is statistically consistent with random drawing.
                  </p>
                </CardContent>
              </Card>

              {/* SECONDARY K-S results */}
              <Card className={`bg-slate-950/50 ${config.hasPowerball ? "border-rose-500/30" : "border-amber-500/30"}`}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className={`text-lg font-mono ${config.hasPowerball ? "text-rose-400" : "text-amber-400"}`}>D</div>
                    <CardTitle className={`text-sm font-mono tracking-wider ${config.hasPowerball ? "text-rose-300" : "text-amber-300"}`}>
                      K-S · {secLabel.toUpperCase()} — Top 5 by D statistic
                    </CardTitle>
                  </div>
                  <CardDescription className="text-slate-400 text-xs">
                    H0: gaps follow geometric distribution with p = {secCountPerDraw}/{secMaxRange} = {(secCountPerDraw / secMaxRange).toFixed(3)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {sortedKsSec.map((r) => {
                      const ratio = r.criticalValue05 > 0 ? r.ksStatistic / r.criticalValue05 : 0;
                      const passColor = r.isConsistentWithRandom ? "bg-emerald-500" : "bg-rose-500";
                      return (
                        <div key={r.number} className="flex items-center gap-2 text-xs">
                          <NumberBall value={r.number} size="sm" variant={config.hasPowerball ? "powerball" : "cold"} showLeading={!config.hasPowerball} />
                          <div className="flex-1 min-w-0 grid grid-cols-3 gap-2 font-mono text-[10px]">
                            <div className="text-slate-300">
                              D=<span className="text-cyan-400">{r.ksStatistic.toFixed(3)}</span>
                            </div>
                            <div className="text-slate-400">
                              crit=<span className="text-slate-300">{r.criticalValue05.toFixed(3)}</span>
                            </div>
                            <div className={r.isConsistentWithRandom ? "text-emerald-400" : "text-rose-400"}>
                              p≈{r.pValue < 0.001 ? "<0.001" : r.pValue.toFixed(3)}
                            </div>
                          </div>
                          <div className="w-16 h-1.5 bg-slate-800 rounded overflow-hidden">
                            <div className={`h-full ${passColor}`} style={{ width: `${Math.min(100, ratio * 100)}%` }} />
                          </div>
                          <div className={`text-[10px] font-mono w-6 text-right ${r.isConsistentWithRandom ? "text-emerald-400" : "text-rose-400"}`}>
                            {r.isConsistentWithRandom ? "PASS" : "FAIL"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-[10px] font-mono text-slate-500 leading-relaxed">
                    Observed mean gap {secGapDistribution.length > 0 ? (secGapDistribution.reduce((s, r) => s + r.observedMeanGap, 0) / secGapDistribution.length).toFixed(2) : "—"} vs theoretical mean {(1 / (secCountPerDraw / secMaxRange) - 1).toFixed(2)}.
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* FREQUENCY WITH CONFIDENCE INTERVALS */}
          <section>
            <SectionHeader
              title={`Frequency with 95% Confidence Intervals — ${config.label}`}
              subtitle="Empirical count per number with the theoretical 95% confidence band. Numbers whose count falls outside the band are statistical outliers."
              badge="95% CI · BINOMIAL"
            />
            <div className="grid lg:grid-cols-3 gap-4 mt-5">
              <Card className="lg:col-span-2 bg-slate-950/50 border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-mono text-slate-300">
                    MAIN · CI band visualization
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
                    {frequencyWithCI.map((r) => {
                      const maxCount = Math.max(...frequencyWithCI.map(f => f.count));
                      const maxBar = Math.max(maxCount, r.ciUpper);
                      const countWidth = (r.count / maxBar) * 100;
                      const ciLowerWidth = (r.ciLower / maxBar) * 100;
                      const ciUpperWidth = (r.ciUpper / maxBar) * 100;
                      const expectedWidth = (r.expectedCount / maxBar) * 100;
                      return (
                        <div key={r.number} className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-400 w-6 text-right">{r.number.toString().padStart(2, "0")}</span>
                          <div className="flex-1 relative h-3 bg-slate-900/60 rounded overflow-hidden">
                            {/* CI band */}
                            <div
                              className="absolute h-full bg-amber-500/15"
                              style={{ left: `${ciLowerWidth}%`, width: `${ciUpperWidth - ciLowerWidth}%` }}
                              title={`95% CI: ${r.ciLower.toFixed(1)} - ${r.ciUpper.toFixed(1)}`}
                            />
                            {/* Expected line */}
                            <div
                              className="absolute top-0 h-full w-px bg-amber-400/80"
                              style={{ left: `${expectedWidth}%` }}
                              title={`Expected: ${r.expectedCount.toFixed(2)}`}
                            />
                            {/* Observed bar */}
                            <div
                              className={`relative h-full ${r.isOutlier ? "bg-rose-500" : "bg-cyan-500"}`}
                              style={{ width: `${countWidth}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-slate-300 w-10 text-right">{r.count}×</span>
                          <span className={`text-[10px] font-mono w-10 text-right ${r.isOutlier ? "text-rose-400 font-bold" : "text-emerald-400"}`}>
                            {r.isOutlier ? "OUT" : "ok"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-[10px] font-mono text-slate-500">
                    Cyan bar = observed count · Amber band = 95% CI · Amber line = expected count · Red = outlier (count outside CI)
                  </p>
                </CardContent>
              </Card>

              <Card className={`bg-slate-950/50 ${config.hasPowerball ? "border-rose-500/30" : "border-amber-500/30"}`}>
                <CardHeader className="pb-3">
                  <CardTitle className={`text-sm font-mono ${config.hasPowerball ? "text-rose-300" : "text-amber-300"}`}>
                    {secLabel.toUpperCase()} · CI band visualization
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
                    {secFrequencyWithCI.map((r) => {
                      const maxCount = Math.max(...secFrequencyWithCI.map(f => f.count));
                      const maxBar = Math.max(maxCount, r.ciUpper);
                      const countWidth = (r.count / maxBar) * 100;
                      const ciLowerWidth = (r.ciLower / maxBar) * 100;
                      const ciUpperWidth = (r.ciUpper / maxBar) * 100;
                      const expectedWidth = (r.expectedCount / maxBar) * 100;
                      return (
                        <div key={r.number} className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-slate-400 w-6 text-right">{r.number.toString().padStart(2, "0")}</span>
                          <div className="flex-1 relative h-3 bg-slate-900/60 rounded overflow-hidden">
                            <div
                              className="absolute h-full bg-amber-500/15"
                              style={{ left: `${ciLowerWidth}%`, width: `${ciUpperWidth - ciLowerWidth}%` }}
                              title={`95% CI: ${r.ciLower.toFixed(1)} - ${r.ciUpper.toFixed(1)}`}
                            />
                            <div
                              className="absolute top-0 h-full w-px bg-amber-400/80"
                              style={{ left: `${expectedWidth}%` }}
                              title={`Expected: ${r.expectedCount.toFixed(2)}`}
                            />
                            <div
                              className={`relative h-full ${r.isOutlier ? "bg-rose-500" : config.hasPowerball ? "bg-rose-500" : "bg-amber-500"}`}
                              style={{ width: `${countWidth}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-slate-300 w-10 text-right">{r.count}×</span>
                          <span className={`text-[10px] font-mono w-10 text-right ${r.isOutlier ? "text-rose-400 font-bold" : "text-emerald-400"}`}>
                            {r.isOutlier ? "OUT" : "ok"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* ADVANCED STATISTICAL BATTERY */}
          <section>
            <SectionHeader
              title={`Advanced Statistical Battery — ${config.label}`}
              subtitle="9 additional statistical methods commonly applied to lottery analysis: entropy, runs test, autocorrelation, pair correlation, hypergeometric odds, coverage, skewness/kurtosis, coupon collector's problem, birthday problem."
              badge="9 ADDITIONAL METHODS"
            />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
              {/* Shannon Entropy */}
              <Card className="bg-slate-950/50 border-fuchsia-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-mono text-fuchsia-300 tracking-wider">SHANNON ENTROPY</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono text-cyan-300 mb-1">{entropy.entropy.toFixed(3)} <span className="text-sm text-slate-500">/ {entropy.maxEntropy.toFixed(3)}</span></div>
                  <div className="text-[10px] font-mono text-slate-400 mb-2">bits (normalized: {(entropy.normalizedEntropy * 100).toFixed(2)}%)</div>
                  <div className="h-1.5 bg-slate-800 rounded overflow-hidden mb-2">
                    <div className="h-full bg-gradient-to-r from-fuchsia-500 to-cyan-500" style={{ width: `${entropy.normalizedEntropy * 100}%` }} />
                  </div>
                  <p className="text-[10px] font-mono text-slate-400 leading-relaxed">{entropy.interpretation}</p>
                </CardContent>
              </Card>

              {/* Runs Test */}
              <Card className={`bg-slate-950/50 border ${runsTest.isRandom ? "border-emerald-500/30" : "border-rose-500/30"}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-mono text-slate-300 tracking-wider">WALD-WOLFOWITZ RUNS TEST</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono text-cyan-300 mb-1">{runsTest.observedRuns} <span className="text-sm text-slate-500">obs</span> / {runsTest.expectedRuns.toFixed(1)} <span className="text-sm text-slate-500">exp</span></div>
                  <div className="text-[10px] font-mono text-slate-400 mb-2">z={runsTest.zScore.toFixed(3)} · p≈{runsTest.pValue < 0.001 ? "<0.001" : runsTest.pValue.toFixed(3)}</div>
                  <div className={`text-[10px] font-mono ${runsTest.isRandom ? "text-emerald-400" : "text-rose-400"} font-bold mb-1`}>
                    {runsTest.isRandom ? "✓ PASS — random sequence" : "✗ FAIL — non-random"}
                  </div>
                  <p className="text-[10px] font-mono text-slate-400 leading-relaxed">{runsTest.interpretation}</p>
                </CardContent>
              </Card>

              {/* Lag-1 Autocorrelation */}
              <Card className={`bg-slate-950/50 border ${autocorr.isSignificant ? "border-rose-500/30" : "border-emerald-500/30"}`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-mono text-slate-300 tracking-wider">LAG-1 AUTOCORRELATION</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono text-cyan-300 mb-1">r₁ = {autocorr.autocorrelation.toFixed(4)}</div>
                  <div className="text-[10px] font-mono text-slate-400 mb-2">critical ±{autocorr.criticalValue.toFixed(4)} (n={autocorr.n})</div>
                  <div className={`text-[10px] font-mono ${autocorr.isSignificant ? "text-rose-400" : "text-emerald-400"} font-bold mb-1`}>
                    {autocorr.isSignificant ? "✗ ANOMALY — draws not independent" : "✓ Draws are independent"}
                  </div>
                  <p className="text-[10px] font-mono text-slate-400 leading-relaxed">{autocorr.interpretation}</p>
                </CardContent>
              </Card>

              {/* Coverage */}
              <Card className="bg-slate-950/50 border-cyan-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-mono text-cyan-300 tracking-wider">COVERAGE ANALYSIS</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono text-cyan-300 mb-1">
                    {(coverage.mainCoverage * 100).toFixed(1)}% <span className="text-sm text-slate-500">main</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mb-2">{coverage.mainAppeared}/{coverage.mainTotal} main · {coverage.secondaryAppeared}/{coverage.secondaryTotal} {secLabel.toLowerCase()}</div>
                  <div className="h-1.5 bg-slate-800 rounded overflow-hidden mb-1">
                    <div className="h-full bg-cyan-500" style={{ width: `${coverage.mainCoverage * 100}%` }} />
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded overflow-hidden mb-2">
                    <div className={`h-full ${config.hasPowerball ? "bg-rose-500" : "bg-amber-500"}`} style={{ width: `${coverage.secondaryCoverage * 100}%` }} />
                  </div>
                  <p className="text-[10px] font-mono text-slate-400 leading-relaxed">{coverage.interpretation}</p>
                </CardContent>
              </Card>

              {/* Coupon Collector's Problem */}
              <Card className="bg-slate-950/50 border-amber-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-mono text-amber-300 tracking-wider">COUPON COLLECTOR'S PROBLEM</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono text-amber-300 mb-1">~{couponCollector.expectedDrawsToSeeAll.toFixed(0)}</div>
                  <div className="text-[10px] font-mono text-slate-400 mb-2">draws expected to see all {couponCollector.poolSize} numbers</div>
                  <div className="text-[10px] font-mono text-slate-400 mb-1">observed: {couponCollector.drawsObserved} draws ({((couponCollector.drawsObserved / couponCollector.expectedDrawsToSeeAll) * 100).toFixed(1)}%)</div>
                  <p className="text-[10px] font-mono text-slate-400 leading-relaxed">{couponCollector.interpretation}</p>
                </CardContent>
              </Card>

              {/* Birthday Problem */}
              <Card className="bg-slate-950/50 border-rose-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-mono text-rose-300 tracking-wider">BIRTHDAY PROBLEM</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono text-rose-300 mb-1">{(birthdayProblem.probabilityOfSharedNumber * 100).toFixed(1)}%</div>
                  <div className="text-[10px] font-mono text-slate-400 mb-2">prob. two random draws share ≥1 number</div>
                  <div className="text-[10px] font-mono text-slate-400 mb-1">expected shared per pair: {birthdayProblem.expectedSharedNumbers.toFixed(2)}</div>
                  <p className="text-[10px] font-mono text-slate-400 leading-relaxed">{birthdayProblem.interpretation}</p>
                </CardContent>
              </Card>

              {/* Distribution Shape */}
              <Card className="bg-slate-950/50 border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-mono text-slate-300 tracking-wider">SKEWNESS & KURTOSIS</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono text-cyan-300 mb-1">
                    skew {distShape.skewness.toFixed(3)} · kurt {distShape.kurtosis.toFixed(3)}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mb-2">mean={distShape.mean.toFixed(2)} σ={distShape.stdDev.toFixed(2)}</div>
                  <p className="text-[10px] font-mono text-slate-400 leading-relaxed">{distShape.skewInterpretation}</p>
                  <p className="text-[10px] font-mono text-slate-400 leading-relaxed mt-1">{distShape.kurtosisInterpretation}</p>
                </CardContent>
              </Card>

              {/* Hypergeometric Probability Table */}
              <Card className="bg-slate-950/50 border-emerald-500/30 md:col-span-2 lg:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-mono text-emerald-300 tracking-wider">HYPERGEOMETRIC ODDS · {config.label} MAIN</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-2">
                    {hypergeom.probabilityTable.map((row) => (
                      <div key={row.matchCount} className="text-center bg-slate-900/40 border border-slate-800 rounded p-2">
                        <div className="text-[10px] font-mono text-slate-400">Match {row.matchCount}</div>
                        <div className="text-xs font-mono font-bold text-emerald-300">
                          {(row.probability * 100).toExponential(1)}%
                        </div>
                        <div className="text-[9px] font-mono text-slate-500">
                          1 in {row.oneIn === Infinity ? "∞" : row.oneIn.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] font-mono text-slate-400 leading-relaxed mt-2">{hypergeom.interpretation}</p>
                </CardContent>
              </Card>
            </div>

            {/* Pair Correlation — Top Over/Under */}
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <Card className="bg-slate-950/50 border-rose-500/30">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    <CardTitle className="text-xs font-mono text-rose-300 tracking-wider">PAIRS APPEARING MORE THAN EXPECTED · Top 8</CardTitle>
                  </div>
                  <CardDescription className="text-slate-400 text-xs">
                    Expected count per pair: {pairCorrelation.topOver[0]?.expectedCount.toFixed(2) ?? "—"} · significant: {pairCorrelation.significantPairs}/{pairCorrelation.totalPairsAnalyzed}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {pairCorrelation.topOver.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-mono">
                        <span className="text-slate-400 w-12">{p.pair[0]}-{p.pair[1]}</span>
                        <div className="flex-1 min-w-0 relative h-3 bg-slate-900/60 rounded overflow-hidden">
                          <div className={`relative h-full ${p.isSignificant ? "bg-rose-500" : "bg-rose-500/60"}`} style={{ width: `${Math.min(100, (p.zScore / 2) * 100)}%` }} />
                        </div>
                        <span className="text-slate-300 w-12 text-right">{p.observedCount}×</span>
                        <span className={`w-12 text-right ${p.isSignificant ? "text-rose-400 font-bold" : "text-amber-400"}`}>z={p.zScore.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-950/50 border-cyan-500/30">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-cyan-500" />
                    <CardTitle className="text-xs font-mono text-cyan-300 tracking-wider">PAIRS APPEARING LESS THAN EXPECTED · Top 8</CardTitle>
                  </div>
                  <CardDescription className="text-slate-400 text-xs">
                    Pairs that have not co-occurred as often as random would predict
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5">
                    {pairCorrelation.topUnder.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs font-mono">
                        <span className="text-slate-400 w-12">{p.pair[0]}-{p.pair[1]}</span>
                        <div className="flex-1 min-w-0 relative h-3 bg-slate-900/60 rounded overflow-hidden">
                          <div className={`relative h-full ${p.isSignificant ? "bg-cyan-500" : "bg-cyan-500/60"}`} style={{ width: `${Math.min(100, (Math.abs(p.zScore) / 2) * 100)}%` }} />
                        </div>
                        <span className="text-slate-300 w-12 text-right">{p.observedCount}×</span>
                        <span className={`w-12 text-right ${p.isSignificant ? "text-cyan-400 font-bold" : "text-slate-400"}`}>z={p.zScore.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* MARKOV + BAYESIAN */}
          <section className="grid lg:grid-cols-3 gap-4">
            <Card className="bg-slate-950/50 border-fuchsia-500/30">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="text-lg font-mono text-fuchsia-400">⇄</div>
                  <CardTitle className="text-sm font-mono text-fuchsia-300 tracking-wider">MARKOV · MAIN</CardTitle>
                </div>
                <CardDescription className="text-slate-400 text-xs">Conditional co-occurrence given latest main numbers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {markov.candidates.slice(0, 8).map((c) => (
                    <div key={c.number} className="flex items-center gap-3">
                      <NumberBall value={c.number} size="sm" variant="default" />
                      <div className="flex-1 min-w-0">
                        <Progress value={(c.score / (markov.candidates[0]?.score || 1)) * 100} className="h-1.5 bg-slate-800" />
                      </div>
                      <span className="text-[10px] font-mono text-fuchsia-400 w-12 text-right">{c.score.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2">Top global transitions</div>
                  <div className="flex flex-wrap gap-1.5">
                    {markov.topTransitions.slice(0, 6).map((t, i) => (
                      <div key={i} className="text-[10px] font-mono text-slate-300 bg-slate-900/60 border border-slate-800 rounded px-1.5 py-0.5">
                        {t.from}→{t.to}: {(t.prob * 100).toFixed(0)}%
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-950/50 border-emerald-500/30">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="text-lg font-mono text-emerald-400">β</div>
                  <CardTitle className="text-sm font-mono text-emerald-300 tracking-wider">BAYESIAN · MAIN</CardTitle>
                </div>
                <CardDescription className="text-slate-400 text-xs">Posterior P(θ) per main number, 95% credible interval</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                  {[...bayes].sort((a, b) => b.posteriorMean - a.posteriorMean).map((r) => {
                    const uniform = 1 / config.mainMax;
                    const maxMean = Math.max(...bayes.map((b) => b.posteriorMean));
                    const width = (r.posteriorMean / maxMean) * 100;
                    return (
                      <div key={r.number} className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-400 w-6 text-right">{r.number.toString().padStart(2, "0")}</span>
                        <div className="flex-1 relative h-3 bg-slate-900/60 rounded overflow-hidden">
                          <div className={`h-full ${r.exceedsUniform ? "bg-emerald-500/80" : "bg-slate-600/80"}`} style={{ width: `${width}%` }} />
                          <div className="absolute top-0 h-full w-px bg-amber-400/80" style={{ left: `${(uniform / maxMean) * 100}%` }} title="uniform expected" />
                        </div>
                        <span className="text-[10px] font-mono text-slate-300 w-12 text-right">{(r.posteriorMean * 100).toFixed(1)}%</span>
                      </div>
                    );
                  })}
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-3">Amber line = uniform expected ({((1 / config.mainMax) * 100).toFixed(1)}%)</div>
              </CardContent>
            </Card>

            <Card className={`bg-slate-950/50 ${config.hasPowerball ? "border-rose-500/30" : "border-amber-500/30"}`}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className={`text-lg font-mono ${config.hasPowerball ? "text-rose-400" : "text-amber-400"}`}>β</div>
                  <CardTitle className={`text-sm font-mono tracking-wider ${config.hasPowerball ? "text-rose-300" : "text-amber-300"}`}>BAYESIAN · {secLabel}</CardTitle>
                </div>
                <CardDescription className="text-slate-400 text-xs">Posterior P(θ) per {secLabel} number, 95% credible interval</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                  {[...secBayes].sort((a, b) => b.posteriorMean - a.posteriorMean).map((r) => {
                    const uniform = 1 / secMaxRange;
                    const maxMean = Math.max(...secBayes.map((b) => b.posteriorMean));
                    const width = (r.posteriorMean / maxMean) * 100;
                    return (
                      <div key={r.number} className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-400 w-6 text-right">{r.number.toString().padStart(2, "0")}</span>
                        <div className="flex-1 relative h-3 bg-slate-900/60 rounded overflow-hidden">
                          <div className={`h-full ${r.exceedsUniform ? (config.hasPowerball ? "bg-rose-500/80" : "bg-amber-500/80") : "bg-slate-600/80"}`} style={{ width: `${width}%` }} />
                          <div className="absolute top-0 h-full w-px bg-cyan-400/80" style={{ left: `${(uniform / maxMean) * 100}%` }} title="uniform expected" />
                        </div>
                        <span className="text-[10px] font-mono text-slate-300 w-12 text-right">{(r.posteriorMean * 100).toFixed(1)}%</span>
                      </div>
                    );
                  })}
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-3">Cyan line = uniform expected ({((1 / secMaxRange) * 100).toFixed(1)}%)</div>
              </CardContent>
            </Card>
          </section>

          {/* CHI-SQUARE */}
          <section className="grid md:grid-cols-2 gap-4">
            <Card className="bg-slate-950/50 border-slate-800">
              <CardHeader>
                <CardTitle className="text-sm font-mono text-slate-200 tracking-wider">CHI-SQUARE · MAIN · H0: uniform random</CardTitle>
                <CardDescription className="text-slate-400 text-xs">Statistical test of whether observed main-number frequencies are consistent with uniform random draws</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <StatBlock label="χ² statistic" value={chiSquare.chiSquare.toFixed(2)} accent="cyan" />
                  <StatBlock label="Degrees of freedom" value={chiSquare.degreesOfFreedom.toString()} accent="slate" />
                  <StatBlock label="95% critical value" value={chiSquare.criticalValue95.toFixed(2)} accent="slate" />
                  <StatBlock label="Verdict" value={chiSquare.isUniform ? "PASS" : "FAIL"} accent={chiSquare.isUniform ? "emerald" : "rose"} />
                </div>
                <p className="mt-4 text-xs text-slate-400 leading-relaxed font-mono">{chiSquare.interpretation}</p>
              </CardContent>
            </Card>

            <Card className={`bg-slate-950/50 ${config.hasPowerball ? "border-rose-500/30" : "border-amber-500/30"}`}>
              <CardHeader>
                <CardTitle className={`text-sm font-mono tracking-wider ${config.hasPowerball ? "text-rose-200" : "text-amber-200"}`}>CHI-SQUARE · {secLabel} · H0: uniform random</CardTitle>
                <CardDescription className="text-slate-400 text-xs">Statistical test of whether observed {secLabel} frequencies are consistent with uniform random draws</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <StatBlock label="χ² statistic" value={secChiSquare.chiSquare.toFixed(2)} accent="cyan" />
                  <StatBlock label="Degrees of freedom" value={secChiSquare.degreesOfFreedom.toString()} accent="slate" />
                  <StatBlock label="95% critical value" value={secChiSquare.criticalValue95.toFixed(2)} accent="slate" />
                  <StatBlock label="Verdict" value={secChiSquare.isUniform ? "PASS" : "FAIL"} accent={secChiSquare.isUniform ? "emerald" : "rose"} />
                </div>
                <p className="mt-4 text-xs text-slate-400 leading-relaxed font-mono">{secChiSquare.interpretation}</p>
              </CardContent>
            </Card>
          </section>

          {/* DRAW HISTORY */}
          <section>
            <SectionHeader
              title={`Full ${config.label} Draw History`}
              subtitle={`${aggregate.totalDraws} draws · ${aggregate.earliestDrawDate} → ${aggregate.latestDrawDate}`}
              badge="RAW DATA"
            />
            <div className="mt-5">
              <DrawHistoryTable draws={currentDraws} game={game} />
            </div>
          </section>

          {/* RECOMMENDED BEST PICK — top consensus across ALL methods */}
          <section>
            <SectionHeader
              title={`★ Recommended Best Pick — ${config.label}`}
              subtitle={isSetForLife && sflOptimized
                ? "MULTI-DRAW OPTIMIZED — Set for Life tickets are valid for 7 consecutive daily draws. This pick is engineered to perform across a full week, not just one draw."
                : "The single best pick based on consensus across ALL 19 statistical methods. Numbers shown below appeared in the most method outputs."}
              badge={isSetForLife && sflOptimized ? "7-DRAW OPTIMIZED" : "TOP CONSENSUS"}
            />
            <Card className={`mt-5 border ${isSetForLife && sflOptimized ? "border-rose-500/50 bg-gradient-to-br from-rose-950/30 via-slate-950/60 to-amber-950/30 shadow-[0_0_30px_rgba(244,63,94,0.2)]" : "border-amber-500/50 bg-gradient-to-br from-amber-950/30 via-slate-950/60 to-cyan-950/30 shadow-[0_0_30px_rgba(251,191,36,0.15)]"}`}>
              <CardContent className="pt-6 pb-6">
                {isSetForLife && sflOptimized ? (
                  <>
                    {/* Set for Life multi-draw optimized pick */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="text-2xl">🔒</div>
                      <h3 className="text-lg font-bold text-rose-300 font-mono tracking-wide">
                        7-Draw Multi-Draw Optimized Pick
                      </h3>
                      <Badge className="bg-rose-500/20 text-rose-200 border border-rose-500/40 font-mono text-[10px] ml-2">
                        LOCKED IN · 7 CONSECUTIVE DRAWS
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-300/90 leading-relaxed mb-3">
                      {sflOptimized.rationale}
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
                      {sflOptimized.secondaryRationale}
                    </p>

                    {/* Composition grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                      <div className="bg-slate-900/40 border border-slate-700/50 rounded p-2 text-center">
                        <div className="text-[9px] font-mono uppercase text-slate-400">Odd / Even</div>
                        <div className="text-sm font-mono font-bold text-cyan-300">{sflOptimized.composition.oddCount} / {sflOptimized.composition.evenCount}</div>
                      </div>
                      <div className="bg-slate-900/40 border border-slate-700/50 rounded p-2 text-center">
                        <div className="text-[9px] font-mono uppercase text-slate-400">Low / High (1-22 / 23-44)</div>
                        <div className="text-sm font-mono font-bold text-emerald-300">{sflOptimized.composition.lowCount} / {sflOptimized.composition.highCount}</div>
                      </div>
                      <div className="bg-slate-900/40 border border-slate-700/50 rounded p-2 text-center">
                        <div className="text-[9px] font-mono uppercase text-slate-400">Sum (expected {sflOptimized.composition.expectedSum})</div>
                        <div className="text-sm font-mono font-bold text-amber-300">{sflOptimized.composition.sum}</div>
                      </div>
                      <div className="bg-slate-900/40 border border-slate-700/50 rounded p-2 text-center">
                        <div className="text-[9px] font-mono uppercase text-slate-400">Spread / Consecutive</div>
                        <div className="text-sm font-mono font-bold text-fuchsia-300">{sflOptimized.composition.spread} / {sflOptimized.composition.consecutivePairs}</div>
                      </div>
                    </div>

                    {/* The numbers */}
                    <div className="flex flex-col items-center gap-4 py-4 border-y border-slate-700/50 my-4">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        Main numbers ({config.mainNumbersPerDraw}) — used for all 7 draws
                      </div>
                      <div className="flex flex-wrap justify-center gap-2 max-w-md">
                        {sflOptimized.mainNumbers.map((n, i) => (
                          <NumberBall key={i} value={n} size="xl" variant="prediction" />
                        ))}
                      </div>
                      <div className="text-[10px] font-mono uppercase tracking-wider mt-2 text-amber-400">
                        Bonus ({config.supplementaryCount})
                      </div>
                      <div className="flex flex-wrap justify-center gap-2">
                        {sflOptimized.supplementaryNumbers.map((n, i) => (
                          <NumberBall key={i} value={n} size="lg" variant="powerball_pred" />
                        ))}
                      </div>
                    </div>

                    {/* Backtest results */}
                    <div className="bg-slate-900/40 border border-slate-700/50 rounded p-3 mb-4">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2">
                        📊 Backtest — how this pick would have performed against the last 7 historical draws
                      </div>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="text-center">
                          <div className="text-[9px] font-mono text-slate-500">Unique matches across 7 draws</div>
                          <div className="text-lg font-mono font-bold text-emerald-300">{sflOptimized.backtest.totalUniqueMatches}/{config.mainNumbersPerDraw}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[9px] font-mono text-slate-500">Avg matches per draw</div>
                          <div className="text-lg font-mono font-bold text-cyan-300">{sflOptimized.backtest.avgMatchesPerDraw.toFixed(2)}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-[9px] font-mono text-slate-500">Best single draw</div>
                          <div className="text-lg font-mono font-bold text-amber-300">{sflOptimized.backtest.bestDraw?.matchedCount ?? 0}</div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        {sflOptimized.backtest.last7Draws.map((d) => (
                          <div key={d.drawNumber} className="flex items-center gap-2 text-[10px] font-mono">
                            <span className="text-slate-400 w-16">#{d.drawNumber}</span>
                            <span className="text-slate-500 w-24 truncate">{d.dateLabel}</span>
                            <div className="flex-1 flex gap-1">
                              {sflOptimized.mainNumbers.map((n) => (
                                <div
                                  key={n}
                                  className={`w-5 h-5 rounded text-[9px] flex items-center justify-center font-mono ${
                                    d.matchedNumbers.includes(n)
                                      ? "bg-rose-500 text-white font-bold"
                                      : "bg-slate-800 text-slate-500"
                                  }`}
                                >
                                  {n}
                                </div>
                              ))}
                            </div>
                            <span className="text-slate-300 w-12 text-right">
                              {d.matchedCount}/7
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => savePick({
                        game,
                        label: "★ Set for Life 7-Draw Optimized",
                        source: "sfl-optimized",
                        mainNumbers: sflOptimized.mainNumbers,
                        powerball: null,
                        supplementaryNumbers: sflOptimized.supplementaryNumbers,
                      })}
                      className="px-4 py-2 rounded-lg border border-rose-500/60 bg-rose-500/15 text-rose-200 font-mono text-xs font-semibold hover:bg-rose-500/25 hover:text-white transition-all flex items-center gap-2"
                    >
                      <span className="text-base">💾</span>
                      Save this 7-draw pick
                    </button>
                  </>
                ) : (
                  /* Standard consensus pick (Powerball / Oz Lotto / Saturday Lotto) */
                  <div className="flex flex-col lg:flex-row gap-6 items-center">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="text-2xl">★</div>
                        <h3 className="text-lg font-bold text-amber-300 font-mono tracking-wide">
                          Top Consensus Pick
                        </h3>
                      </div>
                      <p className="text-xs text-slate-300/90 leading-relaxed mb-3">
                        {recommendedPick.rationale}
                      </p>
                      <p className="text-xs text-slate-400 leading-relaxed mb-4">
                        {recommendedPick.secondaryRationale}
                      </p>
                      <button
                        onClick={() => savePick({
                          game,
                          label: "★ Top Consensus Pick",
                          source: "recommended",
                          mainNumbers: recommendedPick.mainNumbers,
                          powerball: recommendedPick.powerball ?? null,
                          supplementaryNumbers: recommendedPick.supplementaryNumbers ?? null,
                        })}
                        className="px-4 py-2 rounded-lg border border-amber-500/60 bg-amber-500/15 text-amber-200 font-mono text-xs font-semibold hover:bg-amber-500/25 hover:text-white transition-all flex items-center gap-2"
                      >
                        <span className="text-base">💾</span>
                        Save this pick
                      </button>
                    </div>

                    <div className="flex flex-col items-center gap-4 lg:border-l lg:border-slate-700/50 lg:pl-6">
                      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                        Main numbers ({config.mainNumbersPerDraw})
                      </div>
                      <div className="flex flex-wrap justify-center gap-2 max-w-md">
                        {recommendedPick.mainNumbers.map((n, i) => (
                          <NumberBall key={i} value={n} size="xl" variant="prediction" />
                        ))}
                      </div>
                      <div className={`text-[10px] font-mono uppercase tracking-wider mt-2 ${config.hasPowerball ? "text-rose-400" : "text-amber-400"}`}>
                        {secLabel}{config.hasPowerball ? "" : ` (${secCountPerDraw})`}
                      </div>
                      <div className="flex flex-wrap justify-center gap-2">
                        {config.hasPowerball ? (
                          <NumberBall value={recommendedPick.powerball ?? 0} size="xl" variant="powerball_pred" />
                        ) : (
                          (recommendedPick.supplementaryNumbers ?? []).map((n, i) => (
                            <NumberBall key={i} value={n} size="lg" variant="powerball_pred" />
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Consensus votes table — only show for non-Set-For-Life (consensus mode) */}
                {!isSetForLife && (
                  <div className="mt-6 pt-5 border-t border-slate-700/50">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-3">
                      Consensus votes — top 12 numbers (of {recommendedPick.totalMethods} methods)
                    </div>
                    <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
                      {recommendedPick.consensusScores.map((s) => {
                        const isInPick = recommendedPick.mainNumbers.includes(s.number);
                        const votePct = (s.votes / recommendedPick.totalMethods) * 100;
                        return (
                          <div
                            key={s.number}
                            className={`text-center rounded p-2 border ${
                              isInPick
                                ? "bg-amber-500/15 border-amber-500/50"
                                : "bg-slate-900/40 border-slate-700/40"
                            }`}
                          >
                            <div className={`text-sm font-mono font-bold ${isInPick ? "text-amber-300" : "text-slate-300"}`}>
                              {s.number.toString().padStart(2, "0")}
                            </div>
                            <div className="text-[9px] font-mono text-slate-400 mt-0.5">
                              {s.votes}/{recommendedPick.totalMethods}
                            </div>
                            <div className="h-1 bg-slate-800 rounded mt-1 overflow-hidden">
                              <div
                                className={`h-full ${isInPick ? "bg-amber-500" : "bg-cyan-500/60"}`}
                                style={{ width: `${votePct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          {/* SAVED PICKS TRACKER */}
          <section>
            <SectionHeader
              title={`Saved Picks Tracker — ${config.label}`}
              subtitle="Save predictions you want to play, then check them against the actual draw results. Picks are stored in your browser (localStorage) and persist across sessions."
              badge={`${savedPicksForGame.length} SAVED`}
            />
            <div className="mt-5">
              {savedPicksForGame.length === 0 ? (
                <Card className="bg-slate-950/50 border-slate-800">
                  <CardContent className="py-8 text-center">
                    <div className="text-3xl mb-2">💾</div>
                    <div className="text-sm font-mono text-slate-400">
                      No saved picks for {config.label} yet.
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 mt-1">
                      Click the 💾 icon on any prediction card above to start tracking.
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-mono text-slate-400">
                      Comparing against latest {config.label} draw: #{latestDraw?.drawNumber ?? "—"} ({latestDraw?.dateLabel ?? "—"})
                    </div>
                    <button
                      onClick={() => clearGame(game)}
                      className="px-3 py-1 rounded border border-rose-500/30 bg-rose-950/20 text-rose-300 font-mono text-[10px] hover:bg-rose-950/40 transition-colors"
                    >
                      Clear all {config.label} picks
                    </button>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {savedPicksForGame.map((sp) => {
                      const match = computeMatch(sp);
                      const totalMatches = match.mainMatches + match.secMatches;
                      const isJackpot = match.mainMatches === match.mainTotal && match.secMatches === match.secTotal;
                      return (
                        <Card
                          key={sp.id}
                          className={`bg-slate-950/50 ${isJackpot ? "border-amber-500/60 shadow-[0_0_24px_rgba(251,191,36,0.3)]" : totalMatches >= 4 ? "border-emerald-500/40" : "border-slate-800"}`}
                        >
                          <CardContent className="pt-4 pb-4">
                            <div className="flex items-baseline justify-between mb-2">
                              <div>
                                <div className="text-sm font-semibold text-white">{sp.label}</div>
                                <div className="text-[10px] font-mono text-slate-500">
                                  Saved: {new Date(sp.savedAt).toLocaleDateString()} {new Date(sp.savedAt).toLocaleTimeString()}
                                </div>
                              </div>
                              <button
                                onClick={() => deletePick(sp.id)}
                                className="text-slate-500 hover:text-rose-400 text-xs font-mono px-1.5 py-0.5 rounded hover:bg-rose-950/20"
                                title="Delete this pick"
                              >
                                ✕
                              </button>
                            </div>

                            {/* Match summary */}
                            <div className={`text-center rounded py-1.5 mb-3 ${isJackpot ? "bg-amber-500/15 text-amber-300" : totalMatches >= 4 ? "bg-emerald-500/10 text-emerald-300" : "bg-slate-900/40 text-slate-300"}`}>
                              <div className="text-lg font-bold font-mono">
                                {match.mainMatches}/{match.mainTotal} main
                                {" + "}
                                {match.secMatches}/{match.secTotal} {secShort}
                              </div>
                              {isJackpot && (
                                <div className="text-[10px] font-mono uppercase tracking-wider">★ JACKPOT MATCH ★</div>
                              )}
                            </div>

                            {/* Main numbers with match highlights */}
                            <div className="mb-2">
                              <div className="text-[9px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">Main numbers</div>
                              <div className="flex flex-wrap gap-1 justify-center">
                                {sp.mainNumbers.map((n, i) => {
                                  const isMatch = match.matchedMain.includes(n);
                                  return (
                                    <NumberBall
                                      key={i}
                                      value={n}
                                      size="sm"
                                      variant={isMatch ? "hot" : "default"}
                                    />
                                  );
                                })}
                              </div>
                            </div>

                            {/* Secondary numbers with match highlights */}
                            <div>
                              <div className={`text-[9px] font-mono uppercase tracking-wider mb-1.5 ${config.hasPowerball ? "text-rose-400" : "text-amber-400"}`}>
                                {secLabel}
                              </div>
                              <div className="flex flex-wrap gap-1 justify-center">
                                {(config.hasPowerball
                                  ? (sp.powerball != null ? [sp.powerball] : [])
                                  : (sp.supplementaryNumbers ?? [])
                                ).map((n, i) => {
                                  const isMatch = match.matchedSec.includes(n);
                                  return (
                                    <NumberBall
                                      key={i}
                                      value={n}
                                      size="sm"
                                      variant={isMatch ? "hot" : "powerball"}
                                      showLeading={!config.hasPowerball}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </section>

          {/* FOOTER */}
          <footer className="mt-16 border-t border-slate-800/80 pt-8 pb-8">
            <Card className="bg-amber-950/10 border-amber-500/30">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">⚠</div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-amber-300 mb-2 font-mono tracking-wider">HONEST DISCLAIMER · READ THIS</h3>
                    <div className="space-y-2 text-xs text-slate-300/90 leading-relaxed">
                      <p>
                        Lottery draws are physically random events (balls tumbling in a chamber). Each draw is statistically <strong>independent</strong> of every previous draw — the machine has no memory. The chi-square tests above confirm that the main numbers AND the {secLabel} are both statistically consistent with uniform random draws, which means there is <strong>no exploitable bias</strong>.
                      </p>
                      <p>
                        The numbers shown above are not "predictions" in the literal sense — no algorithm can predict random outcomes. They are statistical <em>candidates</em> selected by different mathematical heuristics. Treat them as one input among many, never as a guarantee.
                      </p>
                      <p>
                        If you choose to play, do so for entertainment only, never stake money you cannot afford to lose, and consider supporting responsible-gambling resources.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6 text-center text-[10px] font-mono text-slate-500 tracking-wider">
              LOTTO INTELLIGENCE ENGINE · v3.0 · MULTI-GAME · {config.label} · {aggregate.totalDraws} draws analyzed
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function SectionHeader({ title, subtitle, badge }: { title: string; subtitle?: string; badge?: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{title}</h2>
        {subtitle && <p className="text-xs sm:text-sm text-slate-400 mt-1">{subtitle}</p>}
      </div>
      {badge && (
        <Badge variant="outline" className="border-slate-700 text-slate-400 font-mono text-[10px] tracking-wider self-start">{badge}</Badge>
      )}
    </div>
  );
}

function MetricCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: "cyan" | "amber" | "emerald" | "rose" | "fuchsia" }) {
  const accentMap = {
    cyan: "border-cyan-500/40 text-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.08)]",
    amber: "border-amber-500/40 text-amber-300 shadow-[0_0_24px_rgba(251,191,36,0.08)]",
    emerald: "border-emerald-500/40 text-emerald-300 shadow-[0_0_24px_rgba(16,185,129,0.08)]",
    rose: "border-rose-500/40 text-rose-300 shadow-[0_0_24px_rgba(244,63,94,0.08)]",
    fuchsia: "border-fuchsia-500/40 text-fuchsia-300 shadow-[0_0_24px_rgba(217,70,239,0.08)]",
  };
  return (
    <Card className={`bg-slate-950/50 ${accentMap[accent]}`}>
      <CardContent className="pt-5 pb-4">
        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">{label}</div>
        <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums">{value}</div>
        <div className="text-[10px] font-mono text-slate-500 mt-1">{sub}</div>
      </CardContent>
    </Card>
  );
}

function RankRow({ number, count, pct, delta, max, variant, showLeading = true }: { number: number; count: number; pct: number; delta: number; max: number; variant: "hot" | "cold" | "powerball"; showLeading?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <NumberBall value={number} size="sm" variant={variant} showLeading={showLeading} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between mb-0.5">
          <span className="text-[10px] font-mono text-slate-400">{count}× · {pct.toFixed(1)}%</span>
          <span className={`text-[10px] font-mono ${delta > 0 ? "text-rose-400" : "text-cyan-400"}`}>{delta > 0 ? "+" : ""}{delta.toFixed(1)}</span>
        </div>
        <Progress
          value={(count / max) * 100}
          className={`h-1.5 bg-slate-800 ${variant === "hot" ? "[&>div]:bg-rose-500" : variant === "cold" ? "[&>div]:bg-cyan-500" : "[&>div]:bg-rose-500"}`}
        />
      </div>
    </div>
  );
}

function StatBlock({ label, value, accent }: { label: string; value: string; accent: "cyan" | "emerald" | "rose" | "slate" }) {
  const map = { cyan: "text-cyan-300", emerald: "text-emerald-300", rose: "text-rose-300", slate: "text-slate-200" };
  return (
    <div>
      <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">{label}</div>
      <div className={`text-xl font-bold font-mono ${map[accent]}`}>{value}</div>
    </div>
  );
}

function Disclaimer({ game }: { game: GameId }) {
  const label = GAMES[game].label;
  return (
    <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-950/5 p-3">
      <p className="text-[11px] text-slate-400 leading-relaxed">
        <span className="text-amber-400 font-mono">NOTE</span> Each strategy produces 7 main numbers (1-{GAMES[game].mainMax}) + {GAMES[game].hasPowerball ? `1 ${label} (1-${GAMES[game].powerballMax})` : `${GAMES[game].supplementaryCount} supplementaries (1-${GAMES[game].supplementaryMax})`}. These are statistical candidates derived from historical frequency, gap, Markov co-occurrence and Bayesian inference. Past draws do not influence future draws — no method can truly predict a random lottery outcome. See full disclaimer at the bottom of this page.
      </p>
    </div>
  );
}
