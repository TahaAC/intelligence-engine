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
  computeHotCold,
  computeSecondaryHotCold,
  computeGaps,
  computeSecondaryGaps,
  computeSums,
  computeMarkov,
  computeBayes,
  computeSecondaryBayes,
  computeChiSquare,
  computeSecondaryChiSquare,
  computePredictions,
  computeAggregate,
  computeOddEven,
  computeHighLow,
  computeConsecutivePairs,
  getGameConfig,
  type GameId,
} from "@/lib/analytics";
import { GAMES, GAME_IDS } from "@/lib/game-config";
import { getDraws, setDraws, getLatestDraw, type UnifiedDraw } from "@/lib/draw-store";
import { LOTTERY_DRAWS } from "@/lib/lottery-data";
import { OZLOTTO_DRAWS } from "@/lib/lottery-data-ozlotto";

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

  const predictions = useMemo(
    () => computePredictions(game, predictionSeed || undefined),
    [game, predictionSeed, drawsVersion]
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
                    Latest Draw · 7 Main + {secCountPerDraw} {secLabel}
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
              {predictions.map((p) => (
                <StrategyCard key={p.id} strategy={p} game={game} />
              ))}
            </div>

            <Disclaimer game={game} />
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
