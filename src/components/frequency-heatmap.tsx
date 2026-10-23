"use client";

import { cn } from "@/lib/utils";
import type { FrequencyRecord } from "@/lib/analytics";

interface FrequencyHeatmapProps {
  data: FrequencyRecord[];
  maxCount: number;
  minCount: number;
}

export function FrequencyHeatmap({ data, maxCount, minCount }: FrequencyHeatmapProps) {
  const range = Math.max(maxCount - minCount, 1);

  const getColor = (count: number) => {
    // 0 = cold (deep cyan), 1 = hot (rose/orange)
    const t = (count - minCount) / range;
    if (t > 0.75) {
      // hot — rose/red
      const intensity = (t - 0.75) / 0.25;
      const opacity = 0.45 + intensity * 0.55;
      return `rgba(244, 63, 94, ${opacity.toFixed(2)})`;
    } else if (t < 0.25) {
      // cold — cyan
      const intensity = (0.25 - t) / 0.25;
      const opacity = 0.4 + intensity * 0.55;
      return `rgba(34, 211, 238, ${opacity.toFixed(2)})`;
    } else {
      // neutral — slate
      const opacity = 0.35 + (t - 0.25) * 1.4;
      return `rgba(71, 85, 105, ${Math.min(0.7, opacity).toFixed(2)})`;
    }
  };

  return (
    <div className="grid grid-cols-7 sm:grid-cols-9 md:grid-cols-12 gap-2">
      {data.map((record) => {
        const color = getColor(record.count);
        const isHot = record.deviation > 0 && record.zScore > 0.5;
        const isCold = record.deviation < 0 && record.zScore < -0.5;
        return (
          <div
            key={record.number}
            className={cn(
              "relative aspect-square rounded-lg flex flex-col items-center justify-center font-mono border transition-all hover:scale-105 cursor-pointer group",
              "border-slate-700/60"
            )}
            style={{ backgroundColor: color }}
            title={`Number ${record.number}: ${record.count} appearances (${record.percentage.toFixed(2)}%) | z=${record.zScore.toFixed(2)}`}
          >
            <span className="text-sm font-bold text-white drop-shadow-md">
              {record.number.toString().padStart(2, "0")}
            </span>
            <span className="text-[10px] text-white/80 mt-0.5 tabular-nums">
              {record.count}x
            </span>
            {isHot && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
            )}
            {isCold && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400" />
            )}
          </div>
        );
      })}
    </div>
  );
}
