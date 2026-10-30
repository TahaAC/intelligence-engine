// /api/manual-entry — accept manual draw submissions.
// Lets the user add a draw by hand when auto-sync fails (geo-block, Cloudflare, etc.).

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { GAMES, type GameId } from "@/lib/game-config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isValidGame(game: string | null): game is GameId {
  return game === "powerball" || game === "oz-lotto" || game === "saturday-lotto" || game === "set-for-life";
}

function buildDateLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  if (isNaN(d.getTime())) return iso;
  const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getUTCDay()];
  const monthAbbr = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getUTCMonth()];
  return `${dayName}, ${d.getUTCDate()} ${monthAbbr} ${d.getUTCFullYear()}`;
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const game: GameId = isValidGame(body?.game) ? body.game : "powerball";
  const config = GAMES[game];

  const drawNumber = parseInt(body?.drawNumber, 10);
  if (!Number.isFinite(drawNumber) || drawNumber <= 0) {
    return NextResponse.json({ ok: false, error: "Invalid drawNumber" }, { status: 400 });
  }

  const dateStr: string = body?.date || "";
  // Accept yyyy-mm-dd OR dd/mm/yyyy
  let isoDate = dateStr;
  const dmMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmMatch) {
    const [, dd, mm, yyyy] = dmMatch;
    isoDate = `${yyyy}-${String(parseInt(mm, 10)).padStart(2, "0")}-${String(parseInt(dd, 10)).padStart(2, "0")}`;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return NextResponse.json({ ok: false, error: "Invalid date format (use yyyy-mm-dd or dd/mm/yyyy)" }, { status: 400 });
  }

  // Validate main numbers
  const mainNumbers: number[] = Array.isArray(body?.mainNumbers)
    ? body.mainNumbers.map((n: any) => parseInt(n, 10)).filter((n: number) => Number.isFinite(n))
    : [];
  if (mainNumbers.length !== config.mainNumbersPerDraw) {
    return NextResponse.json({
      ok: false,
      error: `Expected ${config.mainNumbersPerDraw} main numbers, got ${mainNumbers.length}`,
    }, { status: 400 });
  }
  for (const n of mainNumbers) {
    if (n < config.mainMin || n > config.mainMax) {
      return NextResponse.json({
        ok: false,
        error: `Main number ${n} out of range (${config.mainMin}-${config.mainMax})`,
      }, { status: 400 });
    }
  }
  const mainSet = new Set(mainNumbers);
  if (mainSet.size !== mainNumbers.length) {
    return NextResponse.json({ ok: false, error: "Duplicate main numbers not allowed" }, { status: 400 });
  }

  // Validate secondary
  let powerball: number | null = null;
  let supplementaryNumbers: number[] | null = null;

  if (config.hasPowerball) {
    const pb = parseInt(body?.powerball, 10);
    if (!Number.isFinite(pb) || pb < 1 || pb > config.powerballMax) {
      return NextResponse.json({
        ok: false,
        error: `Powerball must be 1-${config.powerballMax}`,
      }, { status: 400 });
    }
    powerball = pb;
  } else {
    supplementaryNumbers = Array.isArray(body?.supplementaryNumbers)
      ? body.supplementaryNumbers.map((n: any) => parseInt(n, 10)).filter((n: number) => Number.isFinite(n))
      : [];
    if (supplementaryNumbers.length !== config.supplementaryCount) {
      return NextResponse.json({
        ok: false,
        error: `Expected ${config.supplementaryCount} supplementary numbers, got ${supplementaryNumbers.length}`,
      }, { status: 400 });
    }
    for (const n of supplementaryNumbers) {
      if (n < config.supplementaryMin || n > config.supplementaryMax) {
        return NextResponse.json({
          ok: false,
          error: `Supplementary number ${n} out of range (${config.supplementaryMin}-${config.supplementaryMax})`,
        }, { status: 400 });
      }
    }
  }

  // Check for existing draw
  const existing = await db.draw.findUnique({
    where: { game_drawNumber: { game, drawNumber } },
  });
  if (existing) {
    return NextResponse.json({
      ok: false,
      error: `Draw #${drawNumber} for ${config.label} already exists in the database`,
      existing: true,
    }, { status: 409 });
  }

  // Insert
  const created = await db.draw.create({
    data: {
      game,
      drawNumber,
      date: new Date(isoDate + "T00:00:00Z"),
      dateLabel: buildDateLabel(isoDate),
      mainNumbers: JSON.stringify(mainNumbers.sort((a, b) => a - b)),
      powerball,
      supplementaryNumbers: supplementaryNumbers ? JSON.stringify(supplementaryNumbers.sort((a, b) => a - b)) : null,
      source: "manual",
    },
  });

  return NextResponse.json({
    ok: true,
    draw: {
      id: created.id,
      game: created.game,
      drawNumber: created.drawNumber,
      date: created.date.toISOString().slice(0, 10),
      dateLabel: created.dateLabel,
      mainNumbers: JSON.parse(created.mainNumbers),
      powerball: created.powerball,
      supplementaryNumbers: created.supplementaryNumbers ? JSON.parse(created.supplementaryNumbers) : null,
      source: created.source,
    },
    totalInDb: await db.draw.count({ where: { game } }),
  });
}
