// /api/draws — return all draws from the database, newest first.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const rows = await db.draw.findMany({
    orderBy: { drawNumber: "desc" },
  });

  return NextResponse.json({
    ok: true,
    count: rows.length,
    draws: rows.map((r) => ({
      drawNumber: r.drawNumber,
      date: r.date.toISOString().slice(0, 10),
      dateLabel: r.dateLabel,
      mainNumbers: JSON.parse(r.mainNumbers) as number[],
      powerball: r.powerball,
      source: r.source,
    })),
  });
}
