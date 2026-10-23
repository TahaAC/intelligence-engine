"use client";

import { NumberBall } from "@/components/number-ball";
import { cn } from "@/lib/utils";
import type { StrategyResult } from "@/lib/analytics";

const accentMap: Record<string, string> = {
  frequency_weighted: "from-rose-500/20 to-orange-500/10 border-rose-500/40",
  cold_due: "from-cyan-500/20 to-emerald-500/10 border-cyan-500/40",
  balanced: "from-amber-500/20 to-yellow-500/10 border-amber-500/40",
  markov_informed: "from-fuchsia-500/20 to-purple-500/10 border-fuchsia-500/40",
  statistical_norm: "from-teal-500/20 to-cyan-500/10 border-teal-500/40",
};

const iconMap: Record<string, string> = {
  frequency_weighted: "▲",
  cold_due: "❄",
  balanced: "⚖",
  markov_informed: "⇄",
  statistical_norm: "∑",
};

export function StrategyCard({ strategy }: { strategy: StrategyResult }) {
  return (
    <div
      className={cn(
        "relative rounded-xl border bg-gradient-to-br p-5 backdrop-blur-sm transition-all hover:scale-[1.02]",
        accentMap[strategy.id] || "border-slate-700 bg-slate-900/50"
      )}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="text-2xl leading-none font-mono">{iconMap[strategy.id]}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-white">{strategy.name}</h3>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono">
              {strategy.tagline}
            </span>
          </div>
        </div>
      </div>
      <p className="text-xs text-slate-300/90 leading-relaxed mb-4 min-h-[3rem]">
        {strategy.description}
      </p>
      <div className="border-t border-slate-700/50 pt-3">
        {/* Main numbers */}
        <div className="mb-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-amber-400" />
            Main numbers (7) · range 1-35
          </div>
          <div className="flex flex-wrap gap-1.5 justify-center py-1">
            {strategy.mainNumbers.map((n, i) => (
              <NumberBall key={i} value={n} size="md" variant="prediction" />
            ))}
          </div>
        </div>
        {/* Powerball */}
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <div className="text-[10px] font-mono uppercase tracking-wider text-red-400 mb-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Powerball · range 1-20
          </div>
          <div className="flex justify-center">
            <NumberBall value={strategy.powerball} size="lg" variant="powerball_pred" />
          </div>
        </div>
      </div>
    </div>
  );
}
