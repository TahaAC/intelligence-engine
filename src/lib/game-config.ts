// Game configuration for multi-game support.
// Each game has its own number range and source URL for scraping.

export type GameId = "powerball" | "oz-lotto";

export interface GameConfig {
  game: GameId;
  label: string;
  shortLabel: string;
  // Main numbers
  mainNumbersPerDraw: number;
  mainMin: number;
  mainMax: number;
  // Secondary track (Powerball OR supplementary numbers)
  hasPowerball: boolean; // true: single PB number; false: multiple supp numbers
  powerballMax: number; // only used when hasPowerball=true
  supplementaryCount: number; // only used when hasPowerball=false
  supplementaryMin: number;
  supplementaryMax: number;
  // Metadata
  drawDay: string;
  sourceUrl: string;
  // For sync scraping
  resultsPathPrefix: string; // e.g. "/powerball/results/" or "/oz-lotto/results/"
  ballCount: number; // total balls per row (7 main + 1 PB OR 7 main + 3 supp)
  secondaryClass: string; // CSS class to identify secondary numbers ("powerball" or "supplementary")
}

export const GAMES: Record<GameId, GameConfig> = {
  powerball: {
    game: "powerball",
    label: "Powerball",
    shortLabel: "PB",
    mainNumbersPerDraw: 7,
    mainMin: 1,
    mainMax: 35,
    hasPowerball: true,
    powerballMax: 20,
    supplementaryCount: 0,
    supplementaryMin: 0,
    supplementaryMax: 0,
    drawDay: "Thursday",
    sourceUrl: "https://australia.national-lottery.com/powerball/past-results",
    resultsPathPrefix: "/powerball/results/",
    ballCount: 8,
    secondaryClass: "powerball",
  },
  "oz-lotto": {
    game: "oz-lotto",
    label: "Oz Lotto",
    shortLabel: "OZ",
    mainNumbersPerDraw: 7,
    mainMin: 1,
    mainMax: 47,
    hasPowerball: false,
    powerballMax: 0,
    supplementaryCount: 3,
    supplementaryMin: 1,
    supplementaryMax: 47,
    drawDay: "Tuesday",
    sourceUrl: "https://australia.national-lottery.com/oz-lotto/past-results",
    resultsPathPrefix: "/oz-lotto/results/",
    ballCount: 10,
    secondaryClass: "supplementary",
  },
};

export function getGameConfig(game: GameId): GameConfig {
  return GAMES[game];
}

export const GAME_IDS = Object.keys(GAMES) as GameId[];
