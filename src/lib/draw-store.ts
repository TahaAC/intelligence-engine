// Mutable draw store — lets the dashboard use draws fetched from the API
// (e.g. after a sync) instead of just the seeded constants.
// Now supports multiple games.

import { LOTTERY_DRAWS, type Draw as PowerballDraw } from "./lottery-data";
import { OZLOTTO_DRAWS, type OzLottoDraw } from "./lottery-data-ozlotto";
import type { GameId } from "./game-config";

export interface UnifiedDraw {
  game: GameId;
  drawNumber: number;
  date: string; // ISO yyyy-mm-dd
  dateLabel: string;
  mainNumbers: number[];
  powerball?: number | null; // for powerball game
  supplementaryNumbers?: number[] | null; // for oz-lotto game
}

const stores: Record<GameId, UnifiedDraw[]> = {
  powerball: LOTTERY_DRAWS.map((d) => ({
    game: "powerball",
    drawNumber: d.drawNumber,
    date: d.date,
    dateLabel: d.dateLabel,
    mainNumbers: d.mainNumbers,
    powerball: d.powerball,
    supplementaryNumbers: null,
  })),
  "oz-lotto": OZLOTTO_DRAWS.map((d: OzLottoDraw) => ({
    game: "oz-lotto",
    drawNumber: d.drawNumber,
    date: d.date,
    dateLabel: d.dateLabel,
    mainNumbers: d.mainNumbers,
    powerball: null,
    supplementaryNumbers: d.supplementaryNumbers,
  })),
};

export function getDraws(game: GameId = "powerball"): UnifiedDraw[] {
  return stores[game];
}

export function setDraws(game: GameId, draws: UnifiedDraw[]): void {
  stores[game] = [...draws].sort((a, b) => a.drawNumber - b.drawNumber);
}

export function getLatestDraw(game: GameId = "powerball"): UnifiedDraw | null {
  const list = stores[game];
  if (list.length === 0) return null;
  return [...list].sort((a, b) => a.date.localeCompare(b.date)).reverse()[0];
}

export function getAllDraws(): UnifiedDraw[] {
  return [...stores.powerball, ...stores["oz-lotto"]];
}
