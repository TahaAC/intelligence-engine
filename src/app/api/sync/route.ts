// /api/sync — scrape national-lottery.com for new draws of a given game.
// Usage: POST /api/sync?game=powerball  (default) or ?game=oz-lotto

import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { db } from "@/lib/db";
import { GAMES, type GameId } from "@/lib/game-config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

function isValidGame(game: string | null): game is GameId {
  return game === "powerball" || game === "oz-lotto" || game === "saturday-lotto";
}

interface ScrapedDraw {
  drawNumber: number;
  date: string;
  dateLabel: string;
  mainNumbers: number[];
  powerball: number | null; // for powerball
  supplementaryNumbers: number[] | null; // for oz-lotto
}

function buildDateLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getUTCDay()];
  const monthAbbr = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getUTCMonth()];
  return `${dayName}, ${d.getUTCDate()} ${monthAbbr} ${d.getUTCFullYear()}`;
}

function parsePage(html: string, game: GameId): ScrapedDraw[] {
  const config = GAMES[game];
  const $ = cheerio.load(html);
  const draws: ScrapedDraw[] = [];

  $(`a[href*="${config.resultsPathPrefix}"]`).each((_, el) => {
    const $a = $(el);
    const href = $a.attr("href") || "";
    const match = href.match(new RegExp(config.resultsPathPrefix.replace(/\//g, "\\/") + "(\\d{2})-(\\d{2})-(\\d{4})"));
    if (!match) return;
    const title = $a.attr("title") || "";
    const drawMatch = title.match(/Draw\s+(\d+)/i);
    if (!drawMatch) return;
    const drawNumber = parseInt(drawMatch[1], 10);

    const $row = $a.closest("tr");
    const $balls = $row.find("ul.balls li");
    if ($balls.length < config.ballCount) return;

    const mainNumbers: number[] = [];
    const secondaryNumbers: number[] = [];

    $balls.each((_, ball) => {
      const $ball = $(ball);
      const classes = $ball.attr("class") || "";
      const value = parseInt($ball.text().trim(), 10);
      if (Number.isNaN(value)) return;
      if (classes.includes(config.secondaryClass)) {
        secondaryNumbers.push(value);
      } else {
        mainNumbers.push(value);
      }
    });

    if (mainNumbers.length !== config.mainNumbersPerDraw) return;
    if (config.hasPowerball && secondaryNumbers.length !== 1) return;
    if (!config.hasPowerball && secondaryNumbers.length !== config.supplementaryCount) return;

    const [, dd, mm, yyyy] = match;
    const iso = `${yyyy}-${mm}-${dd}`;
    const dateLabel = buildDateLabel(iso);

    draws.push({
      drawNumber,
      date: iso,
      dateLabel,
      mainNumbers,
      powerball: config.hasPowerball ? secondaryNumbers[0] : null,
      supplementaryNumbers: config.hasPowerball ? null : secondaryNumbers,
    });
  });

  return draws;
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const gameParam = url.searchParams.get("game");
  const game: GameId = isValidGame(gameParam) ? gameParam : "powerball";
  const config = GAMES[game];

  const startedAt = new Date();
  const logEntry = await db.syncLog.create({
    data: { startedAt, game, source: config.sourceUrl, status: "running" },
  });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    const res = await fetch(config.sourceUrl, {
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
    const scraped = parsePage(html, game);

    const existing = await db.draw.findMany({
      where: {
        game,
        drawNumber: { in: scraped.map((d) => d.drawNumber) },
      },
      select: { drawNumber: true },
    });
    const existingSet = new Set(existing.map((e) => e.drawNumber));
    const newDraws = scraped.filter((d) => !existingSet.has(d.drawNumber));

    let inserted = 0;
    for (const d of newDraws) {
      try {
        await db.draw.create({
          data: {
            game,
            drawNumber: d.drawNumber,
            date: new Date(d.date + "T00:00:00Z"),
            dateLabel: d.dateLabel,
            mainNumbers: JSON.stringify(d.mainNumbers),
            powerball: d.powerball,
            supplementaryNumbers: d.supplementaryNumbers ? JSON.stringify(d.supplementaryNumbers) : null,
            source: "sync",
          },
        });
        inserted++;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (!msg.includes("Unique constraint")) {
          console.error(`Failed to insert ${game} draw ${d.drawNumber}:`, msg);
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
      game,
      source: config.sourceUrl,
      fetchedAt: startedAt.toISOString(),
      drawsFound: scraped.length,
      drawsAdded: inserted,
      drawsAlreadyInDb: scraped.length - newDraws.length,
      totalInDb: await db.draw.count({ where: { game } }),
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
      { ok: false, game, error: msg, fetchedAt: startedAt.toISOString() },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  return POST(req);
}
