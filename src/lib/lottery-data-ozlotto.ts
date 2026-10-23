// Australian Oz Lotto historical draws — scraped from national-lottery.com
// Format: 7 main numbers (1-47) + 3 supplementary numbers (1-47)
// Source: 2026 archive page
// Generated: 2026-10-23

export interface OzLottoDraw {
  drawNumber: number;
  date: string;
  dateLabel: string;
  mainNumbers: number[]; // 7 numbers, range 1-47
  supplementaryNumbers: number[]; // 3 numbers, range 1-47
}

export const OZLOTTO_DRAWS: OzLottoDraw[] = [
  { drawNumber: 1664, date: "2026-01-06", dateLabel: "Tue, 6 Jan 2026", mainNumbers: [2, 13, 14, 17, 19, 30, 45], supplementaryNumbers: [4, 8, 33] },
  { drawNumber: 1665, date: "2026-01-13", dateLabel: "Tue, 13 Jan 2026", mainNumbers: [17, 23, 31, 35, 38, 39, 42], supplementaryNumbers: [7, 24, 29] },
  { drawNumber: 1666, date: "2026-01-20", dateLabel: "Tue, 20 Jan 2026", mainNumbers: [3, 11, 14, 22, 27, 32, 33], supplementaryNumbers: [31, 37, 40] },
  { drawNumber: 1667, date: "2026-01-27", dateLabel: "Tue, 27 Jan 2026", mainNumbers: [1, 15, 17, 22, 23, 28, 41], supplementaryNumbers: [5, 12, 18] },
  { drawNumber: 1668, date: "2026-02-03", dateLabel: "Tue, 3 Feb 2026", mainNumbers: [4, 10, 19, 27, 29, 41, 46], supplementaryNumbers: [7, 20, 25] },
  { drawNumber: 1669, date: "2026-02-10", dateLabel: "Tue, 10 Feb 2026", mainNumbers: [4, 20, 23, 26, 27, 31, 44], supplementaryNumbers: [2, 24, 35] },
  { drawNumber: 1670, date: "2026-02-17", dateLabel: "Tue, 17 Feb 2026", mainNumbers: [9, 23, 32, 36, 39, 42, 44], supplementaryNumbers: [18, 24, 30] },
  { drawNumber: 1671, date: "2026-02-24", dateLabel: "Tue, 24 Feb 2026", mainNumbers: [2, 5, 7, 25, 27, 33, 43], supplementaryNumbers: [28, 31, 42] },
  { drawNumber: 1672, date: "2026-03-03", dateLabel: "Tue, 3 Mar 2026", mainNumbers: [5, 7, 18, 21, 33, 39, 47], supplementaryNumbers: [14, 26, 27] },
  { drawNumber: 1673, date: "2026-03-10", dateLabel: "Tue, 10 Mar 2026", mainNumbers: [12, 16, 17, 33, 34, 41, 42], supplementaryNumbers: [23, 24, 29] },
  { drawNumber: 1674, date: "2026-03-17", dateLabel: "Tue, 17 Mar 2026", mainNumbers: [2, 6, 18, 24, 25, 45, 47], supplementaryNumbers: [3, 10, 22] },
  { drawNumber: 1675, date: "2026-03-24", dateLabel: "Tue, 24 Mar 2026", mainNumbers: [6, 9, 22, 24, 25, 27, 34], supplementaryNumbers: [1, 14, 40] },
  { drawNumber: 1676, date: "2026-03-31", dateLabel: "Tue, 31 Mar 2026", mainNumbers: [8, 17, 18, 31, 35, 43, 44], supplementaryNumbers: [6, 29, 45] },
  { drawNumber: 1677, date: "2026-04-07", dateLabel: "Tue, 7 Apr 2026", mainNumbers: [3, 10, 17, 20, 24, 37, 39], supplementaryNumbers: [12, 22, 38] },
  { drawNumber: 1678, date: "2026-04-14", dateLabel: "Tue, 14 Apr 2026", mainNumbers: [2, 5, 19, 25, 30, 36, 39], supplementaryNumbers: [13, 40, 43] },
  { drawNumber: 1679, date: "2026-04-21", dateLabel: "Tue, 21 Apr 2026", mainNumbers: [6, 15, 20, 32, 33, 38, 47], supplementaryNumbers: [12, 25, 28] },
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
