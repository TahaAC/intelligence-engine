"use client";

import { NumberBall } from "@/components/number-ball";
import { cn } from "@/lib/utils";
import type { StrategyResult } from "@/lib/analytics";
import type { GameId } from "@/lib/game-config";
import { getGameConfig } from "@/lib/analytics";

const accentMap: Record<string, string> = {
  frequency_weighted: "from-rose-500/20 to-orange-500/10 border-rose-500/40",
  cold_due: "from-cyan-500/20 to-emerald-500/10 border-cyan-500/40",
  balanced: "from-amber-500/20 to-yellow-500/10 border-amber-500/40",
  markov_informed: "from-fuchsia-500/20 to-purple-500/10 border-fuchsia-500/40",
  statistical_norm: "from-teal-500/20 to-cyan-500/10 border-teal-500/40",
  smartplay_simulator: "from-slate-400/20 to-slate-600/10 border-slate-400/60 shadow-[0_0_20px_rgba(148,163,184,0.25)]",
};

const iconMap: Record<string, string> = {
  frequency_weighted: "▲",
  cold_due: "❄",
  balanced: "⚖",
  markov_informed: "⇄",
  statistical_norm: "∑",
  smartplay_simulator: "🎰",
};

interface StrategyCardProps {
  strategy: StrategyResult;
  game: GameId;
  onSave?: (pick: { label: string; source: string; mainNumbers: number[]; powerball?: number | null; supplementaryNumbers?: number[] | null }) => void;
  saved?: boolean;
  mixing?: boolean;
}

export function StrategyCard({ strategy, game, onSave, saved, mixing }: StrategyCardProps) {
  const config = getGameConfig(game);
  const secLabel = config.hasPowerball ? "Powerball" : "Supplementary";
  const secNumbers = config.hasPowerball
    ? (strategy.powerball != null ? [strategy.powerball] : [])
    : (strategy.supplementaryNumbers ?? []);

  return (
    <div
      className={cn(
        "relative rounded-xl border bg-gradient-to-br p-5 backdrop-blur-sm transition-all hover:scale-[1.02]",
        accentMap[strategy.id] || "border-slate-700 bg-slate-900/50",
        mixing && "animate-pulse"
      )}
    >
      {/* Mixing animation overlay — only shows on Smartplay card when mixing=true */}
      {mixing && (
        <div className="absolute inset-0 z-20 rounded-xl bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
          <div className="text-3xl animate-bounce">🎰</div>
          <div className="text-xs font-mono text-slate-300 uppercase tracking-widest">Mixing balls...</div>
          <div className="flex gap-1.5">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-full bg-slate-600 border border-slate-400/40"
                style={{
                  animation: `smartplay-bounce 0.6s ease-in-out ${i * 0.08}s infinite alternate`,
                }}
              />
            ))}
          </div>
          <div className="text-[9px] font-mono text-slate-500 mt-1">crypto.getRandomValues()</div>
        </div>
      )}
      <div className="flex items-start gap-3 mb-3">
        <div className="text-2xl leading-none font-mono">{iconMap[strategy.id]}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-white">{strategy.name}</h3>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">{strategy.tagline}</span>
          </div>
        </div>
        {onSave && (
          <button
            onClick={() => onSave({
              label: strategy.name,
              source: strategy.id,
              mainNumbers: strategy.mainNumbers,
              powerball: strategy.powerball ?? null,
              supplementaryNumbers: strategy.supplementaryNumbers ?? null,
            })}
            disabled={saved || mixing}
            title={saved ? "Saved" : "Save this pick"}
            className={`shrink-0 w-8 h-8 rounded-md border font-mono text-sm transition-all flex items-center justify-center ${
              saved
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 cursor-default"
                : "border-slate-600 bg-slate-900/40 text-slate-300 hover:border-cyan-500/60 hover:bg-cyan-500/10 hover:text-cyan-200"
            }`}
          >
            {saved ? "✓" : "💾"}
          </button>
        )}
      </div>
      <p className="text-xs text-slate-300/90 leading-relaxed mb-4 min-h-[3rem]">{strategy.description}</p>
      <div className="border-t border-slate-700/50 pt-3">
        <div className="mb-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-amber-400" />
            Main numbers (7) · range 1-{config.mainMax}
          </div>
          <div className="flex flex-wrap gap-1.5 justify-center py-1">
            {strategy.mainNumbers.map((n, i) => (
              <NumberBall key={i} value={n} size="md" variant="prediction" />
            ))}
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <div className="text-[10px] font-mono uppercase tracking-wider text-rose-400 mb-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            {secLabel} · {config.hasPowerball ? `1 number · range 1-${config.powerballMax}` : `${config.supplementaryCount} numbers · range 1-${config.supplementaryMax}`}
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {secNumbers.map((n, i) => (
              <NumberBall key={i} value={n} size={config.hasPowerball ? "lg" : "md"} variant="powerball_pred" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
