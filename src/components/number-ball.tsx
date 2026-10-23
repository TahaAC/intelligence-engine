"use client";

import { cn } from "@/lib/utils";

interface NumberBallProps {
  value: number;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "hot" | "cold" | "neutral" | "prediction" | "latest" | "powerball" | "powerball_pred";
  index?: number;
  className?: string;
  showLeading?: boolean;
}

const sizeMap = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-2xl",
};

const variantMap = {
  default: "bg-slate-800/70 text-slate-100 border border-slate-700",
  hot: "bg-gradient-to-br from-rose-500/90 to-orange-600/90 text-white shadow-[0_0_12px_rgba(244,63,94,0.45)] border border-rose-400/50",
  cold: "bg-gradient-to-br from-cyan-500/90 to-emerald-600/90 text-white shadow-[0_0_12px_rgba(34,211,238,0.45)] border border-cyan-400/50",
  neutral: "bg-slate-700/70 text-slate-200 border border-slate-600",
  prediction: "bg-gradient-to-br from-amber-400/95 to-yellow-500/95 text-slate-950 font-bold shadow-[0_0_16px_rgba(251,191,36,0.55)] border border-amber-300/60",
  latest: "bg-gradient-to-br from-fuchsia-500/95 to-purple-600/95 text-white shadow-[0_0_14px_rgba(217,70,239,0.5)] border border-fuchsia-400/60",
  powerball: "bg-gradient-to-br from-red-600/95 to-rose-700/95 text-white shadow-[0_0_16px_rgba(220,38,38,0.55)] border-2 border-red-400/70 ring-2 ring-red-400/30",
  powerball_pred: "bg-gradient-to-br from-red-500/95 to-rose-600/95 text-white shadow-[0_0_18px_rgba(239,68,68,0.65)] border-2 border-red-300/70 ring-2 ring-red-300/40",
};

export function NumberBall({
  value,
  size = "md",
  variant = "default",
  index,
  className,
  showLeading = true,
}: NumberBallProps) {
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center font-mono font-semibold tabular-nums select-none transition-transform hover:scale-110",
        sizeMap[size],
        variantMap[variant],
        className
      )}
      title={index !== undefined ? `Position ${index + 1}` : undefined}
    >
      {showLeading ? value.toString().padStart(2, "0") : value.toString()}
    </div>
  );
}
