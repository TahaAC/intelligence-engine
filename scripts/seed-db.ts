// Seed the database with all historical Powerball + Oz Lotto + Saturday Lotto draws.

import { db } from "../src/lib/db";
import { LOTTERY_DRAWS } from "../src/lib/lottery-data";
import { OZLOTTO_DRAWS } from "../src/lib/lottery-data-ozlotto";
import { SATURDAYLOTTO_DRAWS } from "../src/lib/lottery-data-saturdaylotto";

async function main() {
  console.log(`\nSeeding ${LOTTERY_DRAWS.length} Powerball + ${OZLOTTO_DRAWS.length} Oz Lotto + ${SATURDAYLOTTO_DRAWS.length} Saturday Lotto draws...\n`);

  let insertedPb = 0;
  let skippedPb = 0;
  for (const draw of LOTTERY_DRAWS) {
    const existing = await db.draw.findUnique({
      where: { game_drawNumber: { game: "powerball", drawNumber: draw.drawNumber } },
    });
    if (existing) {
      skippedPb++;
      continue;
    }
    await db.draw.create({
      data: {
        game: "powerball",
        drawNumber: draw.drawNumber,
        date: new Date(draw.date),
        dateLabel: draw.dateLabel,
        mainNumbers: JSON.stringify(draw.mainNumbers),
        powerball: draw.powerball,
        supplementaryNumbers: null,
        source: "seed",
      },
    });
    insertedPb++;
  }

  let insertedOz = 0;
  let skippedOz = 0;
  for (const draw of OZLOTTO_DRAWS) {
    const existing = await db.draw.findUnique({
      where: { game_drawNumber: { game: "oz-lotto", drawNumber: draw.drawNumber } },
    });
    if (existing) {
      skippedOz++;
      continue;
    }
    await db.draw.create({
      data: {
        game: "oz-lotto",
        drawNumber: draw.drawNumber,
        date: new Date(draw.date),
        dateLabel: draw.dateLabel,
        mainNumbers: JSON.stringify(draw.mainNumbers),
        powerball: null,
        supplementaryNumbers: JSON.stringify(draw.supplementaryNumbers),
        source: "seed",
      },
    });
    insertedOz++;
  }

  let insertedSat = 0;
  let skippedSat = 0;
  for (const draw of SATURDAYLOTTO_DRAWS) {
    const existing = await db.draw.findUnique({
      where: { game_drawNumber: { game: "saturday-lotto", drawNumber: draw.drawNumber } },
    });
    if (existing) {
      skippedSat++;
      continue;
    }
    await db.draw.create({
      data: {
        game: "saturday-lotto",
        drawNumber: draw.drawNumber,
        date: new Date(draw.date),
        dateLabel: draw.dateLabel,
        mainNumbers: JSON.stringify(draw.mainNumbers),
        powerball: null,
        supplementaryNumbers: JSON.stringify(draw.supplementaryNumbers),
        source: "seed",
      },
    });
    insertedSat++;
  }

  const totalPb = await db.draw.count({ where: { game: "powerball" } });
  const totalOz = await db.draw.count({ where: { game: "oz-lotto" } });
  const totalSat = await db.draw.count({ where: { game: "saturday-lotto" } });

  console.log(`  Powerball:      ${insertedPb} inserted, ${skippedPb} skipped, ${totalPb} total`);
  console.log(`  Oz Lotto:       ${insertedOz} inserted, ${skippedOz} skipped, ${totalOz} total`);
  console.log(`  Saturday Lotto: ${insertedSat} inserted, ${skippedSat} skipped, ${totalSat} total`);
  console.log(`  Grand total in DB: ${totalPb + totalOz + totalSat}\n`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
