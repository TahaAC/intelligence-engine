// One-off: extract ALL 2026 Set for Life draws from the archive page.
// Format: 7 main (1-44) + 2 bonus (1-44), drawn daily.

import * as cheerio from "cheerio";
import { readFileSync, writeFileSync } from "fs";

const html = readFileSync("/tmp/sfl-archive.html", "utf8");
const $ = cheerio.load(html);

interface Draw {
  drawNumber: number;
  date: string;
  dateLabel: string;
  mainNumbers: number[];
  supplementaryNumbers: number[]; // bonus numbers in Set for Life
}

const draws: Draw[] = [];

function buildDateLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getUTCDay()];
  const monthAbbr = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getUTCMonth()];
  return `${dayName}, ${d.getUTCDate()} ${monthAbbr} ${d.getUTCFullYear()}`;
}

$('a[href*="/set-for-life/results/"]').each((_, el) => {
  const $a = $(el);
  const href = $a.attr("href") || "";
  const match = href.match(/\/set-for-life\/results\/(\d{2})-(\d{2})-(\d{4})/);
  if (!match) return;
  // Try strong text first (archive page), fall back to title (past-results page)
  const strongText = $a.find("strong").first().text().trim();
  const strongMatch = strongText.match(/Draw\s+(\d+)/i);
  const title = $a.attr("title") || "";
  const titleMatch = title.match(/Draw\s+(\d+)/i);
  const drawNum = strongMatch ? parseInt(strongMatch[1], 10) : (titleMatch ? parseInt(titleMatch[1], 10) : null);
  if (drawNum === null) return;
  const drawNumber = drawNum;

  const $row = $a.closest("tr");
  const $balls = $row.find("ul.balls li");
  if ($balls.length < 9) return; // 7 main + 2 bonus = 9 balls

  const mainNumbers: number[] = [];
  const supplementaryNumbers: number[] = [];

  $balls.each((_, ball) => {
    const $ball = $(ball);
    const classes = $ball.attr("class") || "";
    const value = parseInt($ball.text().trim(), 10);
    if (Number.isNaN(value)) return;
    // Set for Life uses 'bonus-ball' class for bonus numbers (not 'supplementary')
    if (classes.includes("bonus-ball") || classes.includes("supplementary")) {
      supplementaryNumbers.push(value);
    } else {
      mainNumbers.push(value);
    }
  });

  if (mainNumbers.length !== 7 || supplementaryNumbers.length !== 2) return;

  const [, dd, mm, yyyy] = match;
  const iso = `${yyyy}-${mm}-${dd}`;
  draws.push({ drawNumber, date: iso, dateLabel: buildDateLabel(iso), mainNumbers, supplementaryNumbers });
});

// De-duplicate
const unique = new Map<number, Draw>();
for (const d of draws) {
  if (!unique.has(d.drawNumber)) unique.set(d.drawNumber, d);
}
const finalDraws = Array.from(unique.values()).sort((a, b) => a.drawNumber - b.drawNumber);

const lines: string[] = [];
lines.push(`// Australian Set for Life historical draws — scraped from national-lottery.com`);
lines.push(`// Format: 7 main numbers (1-44) + 2 bonus numbers (1-44), drawn daily.`);
lines.push(`// Source: 2026 archive page`);
lines.push(`// Generated: ${new Date().toISOString().slice(0, 10)}`);
lines.push(``);
lines.push(`export interface SetForLifeDraw {`);
lines.push(`  drawNumber: number;`);
lines.push(`  date: string;`);
lines.push(`  dateLabel: string;`);
lines.push(`  mainNumbers: number[]; // 7 numbers, range 1-44`);
lines.push(`  supplementaryNumbers: number[]; // 2 bonus numbers, range 1-44`);
lines.push(`}`);
lines.push(``);
lines.push(`export const SETFORLIFE_DRAWS: SetForLifeDraw[] = [`);
for (const d of finalDraws) {
  lines.push(`  { drawNumber: ${d.drawNumber}, date: "${d.date}", dateLabel: "${d.dateLabel}", mainNumbers: [${d.mainNumbers.join(", ")}], supplementaryNumbers: [${d.supplementaryNumbers.join(", ")}] },`);
}
lines.push(`];`);
lines.push(``);
lines.push(`export const SETFORLIFE_CONFIG = {`);
lines.push(`  game: "set-for-life",`);
lines.push(`  mainNumbersPerDraw: 7,`);
lines.push(`  mainMin: 1,`);
lines.push(`  mainMax: 44,`);
lines.push(`  supplementaryCount: 2,`);
lines.push(`  supplementaryMin: 1,`);
lines.push(`  supplementaryMax: 44,`);
lines.push(`  totalDraws: SETFORLIFE_DRAWS.length,`);
lines.push(`  drawDay: "Daily",`);
lines.push(`  sourceUrl: "https://australia.national-lottery.com/set-for-life/past-results",`);
lines.push(`} as const;`);
lines.push(``);

writeFileSync("/home/z/my-project/src/lib/lottery-data-setforlife.ts", lines.join("\n"));
console.log(`Wrote ${finalDraws.length} Set for Life draws`);
console.log(`Range: Draw ${finalDraws[0]?.drawNumber} (${finalDraws[0]?.dateLabel}) → Draw ${finalDraws[finalDraws.length - 1]?.drawNumber} (${finalDraws[finalDraws.length - 1]?.dateLabel})`);
