// Australian Oz Lotto historical draws — scraped from national-lottery.com
// Format: 7 main numbers (1-47) + 3 supplementary numbers (1-47)
// Generated: 2026-10-23

export interface OzLottoDraw {
  drawNumber: number;
  date: string;
  dateLabel: string;
  mainNumbers: number[]; // 7 numbers, range 1-47
  supplementaryNumbers: number[]; // 3 numbers, range 1-47
}

export const OZLOTTO_DRAWS: OzLottoDraw[] = [
  { drawNumber: 1680, date: "2026-04-28", dateLabel: "Tue, 28 Apr 2026", mainNumbers: [9, 13, 23, 25, 28, 32, 33], supplementaryNumbers: [11, 21, 34] },
  { drawNumber: 1681, date: "2026-05-05", dateLabel: "Tue, 5 May 2026", mainNumbers: [1, 2, 4, 6, 14, 24, 39], supplementaryNumbers: [7, 19, 40] },
  { drawNumber: 1682, date: "2026-05-12", dateLabel: "Tue, 12 May 2026", mainNumbers: [10, 13, 18, 22, 24, 34, 43], supplementaryNumbers: [25, 36, 41] },
  { drawNumber: 1683, date: "2026-05-19", dateLabel: "Tue, 19 May 2026", mainNumbers: [6, 17, 18, 21, 30, 35, 40], supplementaryNumbers: [8, 24, 42] },
  { drawNumber: 1684, date: "2026-05-26", dateLabel: "Tue, 26 May 2026", mainNumbers: [10, 16, 25, 26, 34, 44, 45], supplementaryNumbers: [15, 21, 32] },
  { drawNumber: 1685, date: "2026-06-02", dateLabel: "Tue, 2 Jun 2026", mainNumbers: [4, 9, 10, 30, 31, 40, 43], supplementaryNumbers: [15, 16, 44] },
  { drawNumber: 1686, date: "2026-06-09", dateLabel: "Tue, 9 Jun 2026", mainNumbers: [2, 9, 19, 26, 33, 36, 43], supplementaryNumbers: [29, 44, 45] },
  { drawNumber: 1687, date: "2026-06-16", dateLabel: "Tue, 16 Jun 2026", mainNumbers: [4, 10, 28, 30, 39, 41, 47], supplementaryNumbers: [3, 7, 15] },
  { drawNumber: 1688, date: "2026-06-23", dateLabel: "Tue, 23 Jun 2026", mainNumbers: [4, 13, 21, 26, 27, 31, 43], supplementaryNumbers: [11, 19, 38] },
  { drawNumber: 1689, date: "2026-06-30", dateLabel: "Tue, 30 Jun 2026", mainNumbers: [2, 8, 17, 19, 24, 41, 43], supplementaryNumbers: [7, 12, 26] },
  { drawNumber: 1690, date: "2026-07-07", dateLabel: "Tue, 7 Jul 2026", mainNumbers: [3, 26, 28, 30, 32, 35, 38], supplementaryNumbers: [14, 31, 41] },
  { drawNumber: 1691, date: "2026-07-14", dateLabel: "Tue, 14 Jul 2026", mainNumbers: [10, 16, 22, 27, 29, 30, 38], supplementaryNumbers: [11, 21, 36] },
  { drawNumber: 1692, date: "2026-07-21", dateLabel: "Tue, 21 Jul 2026", mainNumbers: [6, 7, 8, 19, 20, 33, 47], supplementaryNumbers: [3, 15, 41] },
  { drawNumber: 1693, date: "2026-07-28", dateLabel: "Tue, 28 Jul 2026", mainNumbers: [17, 30, 35, 37, 40, 42, 47], supplementaryNumbers: [31, 39, 43] },
  { drawNumber: 1694, date: "2026-08-04", dateLabel: "Tue, 4 Aug 2026", mainNumbers: [4, 11, 15, 18, 29, 35, 46], supplementaryNumbers: [28, 33, 43] },
  { drawNumber: 1695, date: "2026-08-11", dateLabel: "Tue, 11 Aug 2026", mainNumbers: [2, 7, 19, 22, 27, 30, 35], supplementaryNumbers: [32, 37, 41] },
  { drawNumber: 1696, date: "2026-08-18", dateLabel: "Tue, 18 Aug 2026", mainNumbers: [9, 13, 21, 38, 39, 40, 41], supplementaryNumbers: [6, 44, 46] },
  { drawNumber: 1697, date: "2026-08-25", dateLabel: "Tue, 25 Aug 2026", mainNumbers: [2, 4, 21, 27, 33, 43, 47], supplementaryNumbers: [12, 17, 19] },
  { drawNumber: 1698, date: "2026-09-01", dateLabel: "Tue, 1 Sep 2026", mainNumbers: [1, 8, 21, 34, 38, 44, 45], supplementaryNumbers: [15, 18, 46] },
  { drawNumber: 1699, date: "2026-09-08", dateLabel: "Tue, 8 Sep 2026", mainNumbers: [8, 9, 17, 22, 29, 30, 32], supplementaryNumbers: [23, 40, 45] },
  { drawNumber: 1700, date: "2026-09-15", dateLabel: "Tue, 15 Sep 2026", mainNumbers: [8, 14, 24, 29, 40, 42, 45], supplementaryNumbers: [36, 37, 43] },
  { drawNumber: 1701, date: "2026-09-22", dateLabel: "Tue, 22 Sep 2026", mainNumbers: [4, 7, 14, 21, 35, 36, 41], supplementaryNumbers: [20, 26, 32] },
  { drawNumber: 1702, date: "2026-09-29", dateLabel: "Tue, 29 Sep 2026", mainNumbers: [2, 6, 18, 35, 41, 43, 45], supplementaryNumbers: [3, 9, 23] },
  { drawNumber: 1703, date: "2026-10-06", dateLabel: "Tue, 6 Oct 2026", mainNumbers: [1, 13, 14, 25, 38, 40, 41], supplementaryNumbers: [28, 30, 47] },
  { drawNumber: 1704, date: "2026-10-13", dateLabel: "Tue, 13 Oct 2026", mainNumbers: [5, 17, 29, 32, 35, 36, 46], supplementaryNumbers: [7, 24, 30] },
  { drawNumber: 1705, date: "2026-10-20", dateLabel: "Tue, 20 Oct 2026", mainNumbers: [6, 12, 13, 19, 22, 33, 36], supplementaryNumbers: [10, 27, 38] },
];

export const OZLOTTO_CONFIG = {
  game: "oz-lotto",
  mainNumbersPerDraw: 7,
  mainMin: 1,
  mainMax: 47,
  supplementaryCount: 3,
  supplementaryMin: 1,
  supplementaryMax: 47,
  totalDraws: OZLOTTO_DRAWS.length,
  drawDay: "Tuesday",
  sourceUrl: "https://australia.national-lottery.com/oz-lotto/past-results",
} as const;
