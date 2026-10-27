// One-off: extract Oz Lotto historical draws from /tmp/ozlotto.html
// into /home/z/my-project/src/lib/lottery-data-ozlotto.ts

import * as cheerio from "cheerio";
import { readFileSync, writeFileSync } from "fs";

const html = readFileSync("/tmp/ozlotto.html", "utf8");
const $ = cheerio.load(html);

interface Draw {
  drawNumber: number;
  date: string;
  dateLabel: string;
  mainNumbers: number[];
  supplementaryNumbers: number[];
}

const draws: Draw[] = [];

function buildDateLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getUTCDay()];
  const monthAbbr = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getUTCMonth()];
  return `${dayName}, ${d.getUTCDate()} ${monthAbbr} ${d.getUTCFullYear()}`;
}

$('a[href*="/oz-lotto/results/"]').each((_, el) => {
  const $a = $(el);
  const href = $a.attr("href") || "";
  const match = href.match(/\/oz-lotto\/results\/(\d{2})-(\d{2})-(\d{4})/);
  if (!match) return;
  const title = $a.attr("title") || "";
  const drawMatch = title.match(/Draw\s+(\d+)/i);
  if (!drawMatch) return;
  const drawNumber = parseInt(drawMatch[1], 10);

  const $row = $a.closest("tr");
  const $balls = $row.find('ul.balls li');
  if ($balls.length < 10) return;

  const mainNumbers: number[] = [];
  const supplementaryNumbers: number[] = [];

  $balls.each((_, ball) => {
    const $ball = $(ball);
    const classes = $ball.attr("class") || "";
    const value = parseInt($ball.text().trim(), 10);
    if (Number.isNaN(value)) return;
    if (classes.includes("supplementary")) {
      supplementaryNumbers.push(value);
    } else {
      mainNumbers.push(value);
    }
  });

  if (mainNumbers.length !== 7 || supplementaryNumbers.length !== 3) return;

  const [, dd, mm, yyyy] = match;
  const iso = `${yyyy}-${mm}-${dd}`;
  draws.push({ drawNumber, date: iso, dateLabel: buildDateLabel(iso), mainNumbers, supplementaryNumbers });
});

draws.sort((a, b) => a.drawNumber - b.drawNumber);

const lines: string[] = [];
lines.push(`// Australian Oz Lotto historical draws — scraped from national-lottery.com`);
lines.push(`// Format: 7 main numbers (1-47) + 3 supplementary numbers (1-47)`);
lines.push(`// Generated: ${new Date().toISOString().slice(0, 10)}`);
lines.push(``);
lines.push(`export interface OzLottoDraw {`);
lines.push(`  drawNumber: number;`);
lines.push(`  date: string;`);
lines.push(`  dateLabel: string;`);
lines.push(`  mainNumbers: number[]; // 7 numbers, range 1-47`);
lines.push(`  supplementaryNumbers: number[]; // 3 numbers, range 1-47`);
lines.push(`}`);
lines.push(``);
lines.push(`export const OZLOTTO_DRAWS: OzLottoDraw[] = [`);
for (const d of draws) {
  lines.push(`  { drawNumber: ${d.drawNumber}, date: "${d.date}", dateLabel: "${d.dateLabel}", mainNumbers: [${d.mainNumbers.join(", ")}], supplementaryNumbers: [${d.supplementaryNumbers.join(", ")}] },`);
}
lines.push(`];`);
lines.push(``);
lines.push(`export const OZLOTTO_CONFIG = {`);
lines.push(`  game: "oz-lotto",`);
lines.push(`  mainNumbersPerDraw: 7,`);
lines.push(`  mainMin: 1,`);
lines.push(`  mainMax: 47,`);
lines.push(`  supplementaryCount: 3,`);
lines.push(`  supplementaryMin: 1,`);
lines.push(`  supplementaryMax: 47,`);
lines.push(`  totalDraws: OZLOTTO_DRAWS.length,`);
lines.push(`  drawDay: "Tuesday",`);
lines.push(`  sourceUrl: "https://australia.national-lottery.com/oz-lotto/past-results",`);
lines.push(`} as const;`);
lines.push(``);

writeFileSync("/home/z/my-project/src/lib/lottery-data-ozlotto.ts", lines.join("\n"));
console.log(`Wrote ${draws.length} Oz Lotto draws`);
console.log(`First: Draw ${draws[0]?.drawNumber} (${draws[0]?.dateLabel})`);
console.log(`Last:  Draw ${draws[draws.length - 1]?.drawNumber} (${draws[draws.length - 1]?.dateLabel})`);
