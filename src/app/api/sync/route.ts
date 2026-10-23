// /api/sync — scrape national-lottery.com for new Australian Powerball draws
// and insert any that aren't yet in the database.

import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SOURCE_URL = "https://australia.national-lottery.com/powerball/past-results";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

// Parse "22 October, 2026" → ISO date "2026-10-22"
function parseDateLabel(raw: string): string {
  const cleaned = raw.replace(/,/g, "").trim();
  const match = cleaned.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (!match) throw new Error(`Unparseable date: ${raw}`);
  const [, dayStr, monthStr, yearStr] = match;
  const months: Record<string, number> = {
    january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
    july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  };
  const monthIdx = months[monthStr.toLowerCase()];
  if (!monthIdx) throw new Error(`Unknown month: ${monthStr}`);
  return `${yearStr}-${String(monthIdx).padStart(2, "0")}-${String(parseInt(dayStr, 10)).padStart(2, "0")}`;
}

function buildDateLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getUTCDay()];
  const monthAbbr = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getUTCMonth()];
  return `${dayName}, ${d.getUTCDate()} ${monthAbbr} ${d.getUTCFullYear()}`;
}

interface ScrapedDraw {
  drawNumber: number;
  date: string;
  dateLabel: string;
  mainNumbers: number[];
  powerball: number;
}

function parsePage(html: string): ScrapedDraw[] {
  const $ = cheerio.load(html);
  const draws: ScrapedDraw[] = [];

  $('a[href*="/powerball/results/"]').each((_, el) => {
    const $a = $(el);
    const href = $a.attr("href") || "";
    const match = href.match(/\/powerball\/results\/(\d{2})-(\d{2})-(\d{4})/);
    if (!match) return;
    const title = $a.attr("title") || "";
    const drawMatch = title.match(/Draw\s+(\d+)/i);
    if (!drawMatch) return;
    const drawNumber = parseInt(drawMatch[1], 10);

    const $row = $a.closest("tr");
    const $balls = $row.find('ul.balls li');
    if ($balls.length < 8) return;

    const mainNumbers: number[] = [];
    let powerball: number | null = null;

    $balls.each((_, ball) => {
      const $ball = $(ball);
      const classes = $ball.attr("class") || "";
      const value = parseInt($ball.text().trim(), 10);
      if (Number.isNaN(value)) return;
      if (classes.includes("powerball")) {
        powerball = value;
      } else {
        mainNumbers.push(value);
      }
    });

    if (mainNumbers.length !== 7 || powerball === null) return;

    const [, dd, mm, yyyy] = match;
    const iso = `${yyyy}-${mm}-${dd}`;
    const dateLabel = buildDateLabel(iso);

    draws.push({ drawNumber, date: iso, dateLabel, mainNumbers, powerball: powerball as number });
  });

  return draws;
}

export async function POST(_req: Request) {
  const startedAt = new Date();
  const logEntry = await db.syncLog.create({
    data: { startedAt, source: SOURCE_URL, status: "running" },
  });

  try {
    // Use AbortController with a generous 30s timeout — Node's fetch
    // can hang on slow networks and we want to give it room to breathe.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    const res = await fetch(SOURCE_URL, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-AU,en;q=0.9",
        "Cache-Control": "no-cache",
      },
      cache: "no-store",
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Source returned ${res.status} ${res.statusText}`);
    }
    const html = await res.text();
    const scraped = parsePage(html);

    const existing = await db.draw.findMany({
      where: { drawNumber: { in: scraped.map((d) => d.drawNumber) } },
      select: { drawNumber: true },
    });
    const existingSet = new Set(existing.map((e) => e.drawNumber));
    const newDraws = scraped.filter((d) => !existingSet.has(d.drawNumber));

    let inserted = 0;
    for (const d of newDraws) {
      try {
        await db.draw.create({
          data: {
            drawNumber: d.drawNumber,
            date: new Date(d.date + "T00:00:00Z"),
            dateLabel: d.dateLabel,
            mainNumbers: JSON.stringify(d.mainNumbers),
            powerball: d.powerball,
            source: "sync",
          },
        });
        inserted++;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (!msg.includes("Unique constraint")) {
          console.error(`Failed to insert draw ${d.drawNumber}:`, msg);
        }
      }
    }

    await db.syncLog.update({
      where: { id: logEntry.id },
      data: {
        finishedAt: new Date(),
        drawsFound: scraped.length,
        drawsAdded: inserted,
        status: "success",
      },
    });

    return NextResponse.json({
      ok: true,
      source: SOURCE_URL,
      fetchedAt: startedAt.toISOString(),
      drawsFound: scraped.length,
      drawsAdded: inserted,
      drawsAlreadyInDb: scraped.length - newDraws.length,
      totalInDb: await db.draw.count(),
      latestDraw: scraped[0] || null,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await db.syncLog.update({
      where: { id: logEntry.id },
      data: {
        finishedAt: new Date(),
        status: "error",
        error: msg,
      },
    });
    return NextResponse.json(
      { ok: false, error: msg, fetchedAt: startedAt.toISOString() },
      { status: 500 }
    );
  }
}

export async function GET() {
  return POST(new Request("http://localhost/api/sync", { method: "POST" }));
}
