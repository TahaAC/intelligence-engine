"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { NumberBall } from "@/components/number-ball";
import type { Draw } from "@/lib/lottery-data";
import { ScrollArea } from "@/components/ui/scroll-area";

export function DrawHistoryTable({ draws }: { draws: Draw[] }) {
  const sorted = [...draws].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
      <ScrollArea className="h-[460px]">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-slate-950/95 backdrop-blur">
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="w-[80px] text-slate-400 font-mono text-xs">Draw</TableHead>
              <TableHead className="w-[140px] text-slate-400 font-mono text-xs">Date</TableHead>
              <TableHead className="text-slate-400 font-mono text-xs">Main Numbers (7)</TableHead>
              <TableHead className="w-[80px] text-center text-red-400 font-mono text-xs">Powerball</TableHead>
              <TableHead className="w-[60px] text-right text-slate-400 font-mono text-xs">Sum</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((draw) => {
              const sum = draw.mainNumbers.reduce((s, n) => s + n, 0);
              return (
                <TableRow
                  key={draw.drawNumber}
                  className="border-slate-800/70 hover:bg-slate-900/60 transition-colors"
                >
                  <TableCell className="font-mono text-xs text-cyan-400">
                    #{draw.drawNumber}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-400">
                    {draw.dateLabel}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5 py-1">
                      {draw.mainNumbers.map((n, i) => (
                        <NumberBall key={i} value={n} size="sm" variant="default" />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center py-1">
                      <NumberBall value={draw.powerball} size="sm" variant="powerball" />
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-slate-300">
                    {sum}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
