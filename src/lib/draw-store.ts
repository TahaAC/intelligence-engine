// Mutable draw store — lets the dashboard use draws fetched from the API
// (e.g. after a sync) instead of just the seeded LOTTERY_DRAWS constant.

import { LOTTERY_DRAWS, type Draw } from "./lottery-data";

let store: Draw[] = [...LOTTERY_DRAWS];

export function getDraws(): Draw[] {
  return store;
}

export function setDraws(draws: Draw[]): void {
  // Always sort ascending by drawNumber for consistent analytics
  store = [...draws].sort((a, b) => a.drawNumber - b.drawNumber);
}

export function getLatestDraw(): Draw | null {
  if (store.length === 0) return null;
  return [...store].sort((a, b) => a.date.localeCompare(b.date)).reverse()[0];
}
