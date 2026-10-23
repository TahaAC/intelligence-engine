// Lottery historical draw data — 43 draws from Draw 1546 (1 Jan 2026) to Draw 1588 (22 Oct 2026)
// Format: Australian Powerball — 7 main numbers (1-35) + 1 Powerball (1-20)

export interface Draw {
  drawNumber: number;
  date: string; // ISO yyyy-mm-dd
  dateLabel: string; // human-readable
  mainNumbers: number[]; // 7 numbers, range 1-35
  powerball: number; // 1 number, range 1-20
}

export const LOTTERY_DRAWS: Draw[] = [
  { drawNumber: 1546, date: "2026-01-01", dateLabel: "Thu, 1 Jan 2026", mainNumbers: [30, 9, 7, 27, 18, 15, 29], powerball: 3 },
  { drawNumber: 1547, date: "2026-01-08", dateLabel: "Thu, 8 Jan 2026", mainNumbers: [16, 25, 17, 15, 27, 7, 26], powerball: 9 },
  { drawNumber: 1548, date: "2026-01-15", dateLabel: "Thu, 15 Jan 2026", mainNumbers: [35, 24, 25, 1, 27, 2, 4], powerball: 14 },
  { drawNumber: 1549, date: "2026-01-22", dateLabel: "Thu, 22 Jan 2026", mainNumbers: [21, 9, 20, 6, 30, 22, 34], powerball: 5 },
  { drawNumber: 1550, date: "2026-01-29", dateLabel: "Thu, 29 Jan 2026", mainNumbers: [27, 4, 14, 6, 34, 25, 18], powerball: 6 },
  { drawNumber: 1551, date: "2026-02-05", dateLabel: "Thu, 5 Feb 2026", mainNumbers: [18, 12, 15, 9, 25, 33, 22], powerball: 8 },
  { drawNumber: 1552, date: "2026-02-12", dateLabel: "Thu, 12 Feb 2026", mainNumbers: [20, 30, 21, 18, 11, 14, 12], powerball: 7 },
  { drawNumber: 1553, date: "2026-02-19", dateLabel: "Thu, 19 Feb 2026", mainNumbers: [26, 7, 30, 28, 15, 17, 12], powerball: 9 },
  { drawNumber: 1554, date: "2026-02-26", dateLabel: "Thu, 26 Feb 2026", mainNumbers: [8, 25, 6, 27, 18, 26, 12], powerball: 5 },
  { drawNumber: 1555, date: "2026-03-05", dateLabel: "Thu, 5 Mar 2026", mainNumbers: [1, 9, 34, 20, 22, 23, 5], powerball: 17 },
  { drawNumber: 1556, date: "2026-03-12", dateLabel: "Thu, 12 Mar 2026", mainNumbers: [5, 6, 18, 9, 14, 4, 13], powerball: 14 },
  { drawNumber: 1557, date: "2026-03-19", dateLabel: "Thu, 19 Mar 2026", mainNumbers: [18, 35, 22, 25, 4, 9, 20], powerball: 15 },
  { drawNumber: 1558, date: "2026-03-26", dateLabel: "Thu, 26 Mar 2026", mainNumbers: [5, 20, 28, 24, 9, 22, 25], powerball: 20 },
  { drawNumber: 1559, date: "2026-04-02", dateLabel: "Thu, 2 Apr 2026", mainNumbers: [23, 27, 20, 35, 34, 30, 32], powerball: 18 },
  { drawNumber: 1560, date: "2026-04-09", dateLabel: "Thu, 9 Apr 2026", mainNumbers: [26, 15, 32, 3, 17, 33, 27], powerball: 20 },
  { drawNumber: 1561, date: "2026-04-16", dateLabel: "Thu, 16 Apr 2026", mainNumbers: [27, 13, 15, 19, 14, 3, 7], powerball: 18 },
  { drawNumber: 1562, date: "2026-04-23", dateLabel: "Thu, 23 Apr 2026", mainNumbers: [11, 34, 30, 35, 28, 4, 29], powerball: 3 },
  { drawNumber: 1563, date: "2026-04-30", dateLabel: "Thu, 30 Apr 2026", mainNumbers: [16, 4, 17, 13, 27, 24, 21], powerball: 17 },
  { drawNumber: 1564, date: "2026-05-07", dateLabel: "Thu, 7 May 2026", mainNumbers: [28, 30, 31, 17, 15, 7, 23], powerball: 18 },
  { drawNumber: 1565, date: "2026-05-14", dateLabel: "Thu, 14 May 2026", mainNumbers: [2, 19, 1, 16, 22, 3, 25], powerball: 18 },
  { drawNumber: 1566, date: "2026-05-21", dateLabel: "Thu, 21 May 2026", mainNumbers: [34, 16, 15, 13, 29, 32, 1], powerball: 6 },
  { drawNumber: 1567, date: "2026-05-28", dateLabel: "Thu, 28 May 2026", mainNumbers: [26, 30, 10, 34, 16, 5, 12], powerball: 11 },
  { drawNumber: 1568, date: "2026-06-04", dateLabel: "Thu, 4 Jun 2026", mainNumbers: [27, 5, 3, 34, 33, 12, 32], powerball: 10 },
  { drawNumber: 1569, date: "2026-06-11", dateLabel: "Thu, 11 Jun 2026", mainNumbers: [25, 17, 24, 9, 11, 8, 2], powerball: 18 },
  { drawNumber: 1570, date: "2026-06-18", dateLabel: "Thu, 18 Jun 2026", mainNumbers: [20, 28, 21, 6, 26, 29, 1], powerball: 19 },
  { drawNumber: 1571, date: "2026-06-25", dateLabel: "Thu, 25 Jun 2026", mainNumbers: [7, 29, 25, 18, 26, 23, 17], powerball: 16 },
  { drawNumber: 1572, date: "2026-07-02", dateLabel: "Thu, 2 Jul 2026", mainNumbers: [6, 30, 12, 22, 17, 32, 24], powerball: 2 },
  { drawNumber: 1573, date: "2026-07-09", dateLabel: "Thu, 9 Jul 2026", mainNumbers: [22, 1, 5, 15, 27, 14, 4], powerball: 18 },
  { drawNumber: 1574, date: "2026-07-16", dateLabel: "Thu, 16 Jul 2026", mainNumbers: [28, 4, 15, 22, 13, 5, 14], powerball: 13 },
  { drawNumber: 1575, date: "2026-07-23", dateLabel: "Thu, 23 Jul 2026", mainNumbers: [12, 27, 7, 18, 30, 11, 34], powerball: 16 },
  { drawNumber: 1576, date: "2026-07-30", dateLabel: "Thu, 30 Jul 2026", mainNumbers: [35, 31, 18, 22, 34, 26, 20], powerball: 18 },
  { drawNumber: 1577, date: "2026-08-06", dateLabel: "Thu, 6 Aug 2026", mainNumbers: [15, 16, 30, 26, 35, 13, 9], powerball: 7 },
  { drawNumber: 1578, date: "2026-08-13", dateLabel: "Thu, 13 Aug 2026", mainNumbers: [27, 6, 35, 17, 11, 15, 26], powerball: 11 },
  { drawNumber: 1579, date: "2026-08-20", dateLabel: "Thu, 20 Aug 2026", mainNumbers: [11, 14, 22, 29, 13, 3, 9], powerball: 20 },
  { drawNumber: 1580, date: "2026-08-27", dateLabel: "Thu, 27 Aug 2026", mainNumbers: [23, 21, 3, 28, 13, 17, 34], powerball: 11 },
  { drawNumber: 1581, date: "2026-09-03", dateLabel: "Thu, 3 Sep 2026", mainNumbers: [19, 10, 1, 14, 11, 32, 16], powerball: 11 },
  { drawNumber: 1582, date: "2026-09-10", dateLabel: "Thu, 10 Sep 2026", mainNumbers: [2, 34, 32, 29, 24, 28, 11], powerball: 13 },
  { drawNumber: 1583, date: "2026-09-17", dateLabel: "Thu, 17 Sep 2026", mainNumbers: [22, 15, 34, 17, 1, 8, 19], powerball: 2 },
  { drawNumber: 1584, date: "2026-09-24", dateLabel: "Thu, 24 Sep 2026", mainNumbers: [32, 1, 3, 22, 18, 2, 7], powerball: 12 },
  { drawNumber: 1585, date: "2026-10-01", dateLabel: "Thu, 1 Oct 2026", mainNumbers: [16, 3, 10, 24, 2, 11, 6], powerball: 14 },
  { drawNumber: 1586, date: "2026-10-08", dateLabel: "Thu, 8 Oct 2026", mainNumbers: [20, 15, 7, 8, 10, 19, 12], powerball: 7 },
  { drawNumber: 1587, date: "2026-10-15", dateLabel: "Thu, 15 Oct 2026", mainNumbers: [14, 24, 15, 3, 27, 32, 30], powerball: 16 },
  { drawNumber: 1588, date: "2026-10-22", dateLabel: "Thu, 22 Oct 2026", mainNumbers: [4, 26, 22, 13, 34, 20, 33], powerball: 13 },
];

export const LOTTERY_CONFIG = {
  mainNumbersPerDraw: 7,
  mainMin: 1,
  mainMax: 35,
  powerballMin: 1,
  powerballMax: 20,
  totalDraws: LOTTERY_DRAWS.length,
} as const;

// Most recent draw is the latest by date
export const LATEST_DRAW = [...LOTTERY_DRAWS].sort((a, b) => a.date.localeCompare(b.date)).reverse()[0];
export const EARLIEST_DRAW = [...LOTTERY_DRAWS].sort((a, b) => a.date.localeCompare(b.date))[0];
