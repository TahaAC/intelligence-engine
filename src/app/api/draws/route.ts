// /api/draws — return all draws from the database for a given game.
// Usage: GET /api/draws?game=powerball  (default) or ?game=oz-lotto

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { GameId } from "@/lib/game-config";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isValidGame(game: string | null): game is GameId {
  return game === "powerball" || game === "oz-lotto" || game === "saturday-lotto" || game === "set-for-life";
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const gameParam = url.searchParams.get("game");
  const game: GameId = isValidGame(gameParam) ? gameParam : "powerball";

  const rows = await db.draw.findMany({
    where: { game },
    orderBy: { drawNumber: "desc" },
  });

  return NextResponse.json({
    ok: true,
    game,
    count: rows.length,
    draws: rows.map((r) => ({
      game: r.game,
      drawNumber: r.drawNumber,
      date: r.date.toISOString().slice(0, 10),
      dateLabel: r.dateLabel,
      mainNumbers: JSON.parse(r.mainNumbers) as number[],
      powerball: r.powerball,
      supplementaryNumbers: r.supplementaryNumbers ? JSON.parse(r.supplementaryNumbers) as number[] : null,
      source: r.source,
    })),
  });
}
