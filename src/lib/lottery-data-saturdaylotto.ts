// Australian Saturday Lotto historical draws — scraped from national-lottery.com
// Format: 6 main numbers (1-45) + 2 supplementary numbers (1-45)
// Source: 2026 archive page
// Generated: 2026-10-27

export interface SaturdayLottoDraw {
  drawNumber: number;
  date: string;
  dateLabel: string;
  mainNumbers: number[]; // 6 numbers, range 1-45
  supplementaryNumbers: number[]; // 2 numbers, range 1-45
}

export const SATURDAYLOTTO_DRAWS: SaturdayLottoDraw[] = [
  { drawNumber: 4639, date: "2026-01-03", dateLabel: "Sat, 3 Jan 2026", mainNumbers: [9, 10, 13, 19, 21, 36], supplementaryNumbers: [2, 39] },
  { drawNumber: 4641, date: "2026-01-10", dateLabel: "Sat, 10 Jan 2026", mainNumbers: [1, 8, 23, 25, 30, 41], supplementaryNumbers: [32, 37] },
  { drawNumber: 4643, date: "2026-01-17", dateLabel: "Sat, 17 Jan 2026", mainNumbers: [8, 9, 19, 35, 38, 44], supplementaryNumbers: [23, 33] },
  { drawNumber: 4645, date: "2026-01-24", dateLabel: "Sat, 24 Jan 2026", mainNumbers: [8, 22, 24, 28, 29, 33], supplementaryNumbers: [19, 27] },
  { drawNumber: 4647, date: "2026-01-31", dateLabel: "Sat, 31 Jan 2026", mainNumbers: [9, 20, 33, 34, 42, 45], supplementaryNumbers: [7, 29] },
  { drawNumber: 4649, date: "2026-02-07", dateLabel: "Sat, 7 Feb 2026", mainNumbers: [3, 8, 9, 27, 33, 41], supplementaryNumbers: [15, 25] },
  { drawNumber: 4651, date: "2026-02-14", dateLabel: "Sat, 14 Feb 2026", mainNumbers: [3, 6, 7, 12, 14, 22], supplementaryNumbers: [20, 43] },
  { drawNumber: 4653, date: "2026-02-21", dateLabel: "Sat, 21 Feb 2026", mainNumbers: [4, 11, 26, 30, 42, 43], supplementaryNumbers: [27, 29] },
  { drawNumber: 4655, date: "2026-02-28", dateLabel: "Sat, 28 Feb 2026", mainNumbers: [7, 13, 21, 31, 35, 44], supplementaryNumbers: [30, 34] },
  { drawNumber: 4657, date: "2026-03-07", dateLabel: "Sat, 7 Mar 2026", mainNumbers: [16, 17, 24, 33, 35, 36], supplementaryNumbers: [6, 19] },
  { drawNumber: 4659, date: "2026-03-14", dateLabel: "Sat, 14 Mar 2026", mainNumbers: [14, 21, 27, 34, 36, 40], supplementaryNumbers: [5, 33] },
  { drawNumber: 4661, date: "2026-03-21", dateLabel: "Sat, 21 Mar 2026", mainNumbers: [11, 16, 20, 27, 43, 45], supplementaryNumbers: [22, 39] },
  { drawNumber: 4663, date: "2026-03-28", dateLabel: "Sat, 28 Mar 2026", mainNumbers: [1, 2, 3, 25, 29, 30], supplementaryNumbers: [15, 17] },
  { drawNumber: 4665, date: "2026-04-04", dateLabel: "Sat, 4 Apr 2026", mainNumbers: [2, 4, 5, 13, 14, 37], supplementaryNumbers: [21, 22] },
  { drawNumber: 4667, date: "2026-04-11", dateLabel: "Sat, 11 Apr 2026", mainNumbers: [8, 11, 15, 32, 33, 44], supplementaryNumbers: [35, 41] },
  { drawNumber: 4669, date: "2026-04-18", dateLabel: "Sat, 18 Apr 2026", mainNumbers: [3, 8, 18, 39, 40, 41], supplementaryNumbers: [13, 32] },
  { drawNumber: 4671, date: "2026-04-25", dateLabel: "Sat, 25 Apr 2026", mainNumbers: [3, 11, 12, 14, 17, 45], supplementaryNumbers: [21, 32] },
  { drawNumber: 4673, date: "2026-05-02", dateLabel: "Sat, 2 May 2026", mainNumbers: [9, 18, 19, 29, 34, 45], supplementaryNumbers: [8, 28] },
  { drawNumber: 4675, date: "2026-05-09", dateLabel: "Sat, 9 May 2026", mainNumbers: [2, 11, 12, 17, 33, 37], supplementaryNumbers: [36, 41] },
  { drawNumber: 4677, date: "2026-05-16", dateLabel: "Sat, 16 May 2026", mainNumbers: [3, 10, 23, 32, 33, 39], supplementaryNumbers: [37, 42] },
  { drawNumber: 4679, date: "2026-05-23", dateLabel: "Sat, 23 May 2026", mainNumbers: [11, 19, 20, 28, 31, 40], supplementaryNumbers: [1, 39] },
  { drawNumber: 4681, date: "2026-05-30", dateLabel: "Sat, 30 May 2026", mainNumbers: [8, 10, 12, 19, 28, 36], supplementaryNumbers: [3, 5] },
  { drawNumber: 4683, date: "2026-06-06", dateLabel: "Sat, 6 Jun 2026", mainNumbers: [10, 25, 30, 31, 43, 44], supplementaryNumbers: [4, 38] },
  { drawNumber: 4685, date: "2026-06-13", dateLabel: "Sat, 13 Jun 2026", mainNumbers: [12, 16, 30, 31, 40, 43], supplementaryNumbers: [25, 26] },
  { drawNumber: 4687, date: "2026-06-20", dateLabel: "Sat, 20 Jun 2026", mainNumbers: [3, 6, 9, 14, 21, 22], supplementaryNumbers: [20, 38] },
  { drawNumber: 4689, date: "2026-06-27", dateLabel: "Sat, 27 Jun 2026", mainNumbers: [15, 17, 24, 28, 36, 37], supplementaryNumbers: [12, 18] },
  { drawNumber: 4691, date: "2026-07-04", dateLabel: "Sat, 4 Jul 2026", mainNumbers: [4, 8, 15, 32, 43, 44], supplementaryNumbers: [22, 23] },
  { drawNumber: 4693, date: "2026-07-11", dateLabel: "Sat, 11 Jul 2026", mainNumbers: [13, 14, 16, 21, 29, 41], supplementaryNumbers: [10, 17] },
  { drawNumber: 4695, date: "2026-07-18", dateLabel: "Sat, 18 Jul 2026", mainNumbers: [5, 7, 13, 24, 30, 41], supplementaryNumbers: [23, 33] },
  { drawNumber: 4697, date: "2026-07-25", dateLabel: "Sat, 25 Jul 2026", mainNumbers: [2, 6, 8, 12, 22, 43], supplementaryNumbers: [13, 28] },
  { drawNumber: 4699, date: "2026-08-01", dateLabel: "Sat, 1 Aug 2026", mainNumbers: [3, 11, 15, 30, 32, 42], supplementaryNumbers: [38, 43] },
  { drawNumber: 4701, date: "2026-08-08", dateLabel: "Sat, 8 Aug 2026", mainNumbers: [6, 22, 26, 28, 33, 36], supplementaryNumbers: [12, 32] },
  { drawNumber: 4703, date: "2026-08-15", dateLabel: "Sat, 15 Aug 2026", mainNumbers: [2, 13, 17, 25, 31, 33], supplementaryNumbers: [1, 23] },
  { drawNumber: 4705, date: "2026-08-22", dateLabel: "Sat, 22 Aug 2026", mainNumbers: [1, 2, 9, 11, 13, 20], supplementaryNumbers: [28, 45] },
  { drawNumber: 4707, date: "2026-08-29", dateLabel: "Sat, 29 Aug 2026", mainNumbers: [17, 23, 25, 27, 33, 45], supplementaryNumbers: [26, 43] },
  { drawNumber: 4709, date: "2026-09-05", dateLabel: "Sat, 5 Sep 2026", mainNumbers: [5, 17, 27, 38, 40, 43], supplementaryNumbers: [2, 39] },
  { drawNumber: 4711, date: "2026-09-12", dateLabel: "Sat, 12 Sep 2026", mainNumbers: [3, 9, 20, 27, 30, 38], supplementaryNumbers: [4, 42] },
  { drawNumber: 4713, date: "2026-09-19", dateLabel: "Sat, 19 Sep 2026", mainNumbers: [1, 10, 27, 32, 33, 39], supplementaryNumbers: [13, 26] },
  { drawNumber: 4715, date: "2026-09-26", dateLabel: "Sat, 26 Sep 2026", mainNumbers: [2, 6, 25, 27, 31, 40], supplementaryNumbers: [24, 35] },
  { drawNumber: 4717, date: "2026-10-03", dateLabel: "Sat, 3 Oct 2026", mainNumbers: [9, 18, 20, 32, 39, 45], supplementaryNumbers: [19, 24] },
  { drawNumber: 4719, date: "2026-10-10", dateLabel: "Sat, 10 Oct 2026", mainNumbers: [2, 15, 16, 33, 41, 43], supplementaryNumbers: [5, 28] },
  { drawNumber: 4721, date: "2026-10-17", dateLabel: "Sat, 17 Oct 2026", mainNumbers: [1, 11, 15, 22, 30, 32], supplementaryNumbers: [13, 43] },
  { drawNumber: 4723, date: "2026-10-24", dateLabel: "Sat, 24 Oct 2026", mainNumbers: [13, 18, 32, 40, 42, 44], supplementaryNumbers: [27, 37] },
];

export const SATURDAYLOTTO_CONFIG = {
  game: "saturday-lotto",
  mainNumbersPerDraw: 6,
  mainMin: 1,
  mainMax: 45,
  supplementaryCount: 2,
  supplementaryMin: 1,
  supplementaryMax: 45,
  totalDraws: SATURDAYLOTTO_DRAWS.length,
  drawDay: "Saturday",
  sourceUrl: "https://australia.national-lottery.com/saturday-lotto/past-results",
} as const;
