# PROJECT HANDOFF PROMPT — Lotto Intelligence Engine

## Project context

I'm working on a Next.js 16 dashboard called **"Lotto Intelligence Engine"** — a multi-game statistical analysis tool for Australian lotteries. It currently supports **Powerball** (Thursday draws) and **Oz Lotto** (Tuesday draws), with the architecture in place to add more games.

**Honest constraint**: Lottery draws are physically random. Each draw is statistically independent of every previous one — the chi-square tests in the dashboard already confirm the data is consistent with uniform random draws (no exploitable bias). So this tool produces **statistical candidates**, not "predictions" in the literal sense. No algorithm (including neural nets, EWMA, weighted Markov) can predict random outcomes. The disclaimer in the dashboard footer makes this clear.

## GitHub repo

- URL: https://github.com/TahaAC/intelligence-engine
- Latest commit: `1173b4d` (Ignore SQLite database — regenerated from seed script)
- Branch: `main`
- 90 files committed
- The repo is **private** — to push, I need a GitHub Personal Access Token (fine-grained) with `Contents: Read and write` permission on this specific repo. **Always revoke the PAT after pushing.**

## Tech stack

- **Framework**: Next.js 16 with App Router (TypeScript 5)
- **Styling**: Tailwind CSS 4 with shadcn/ui (New York style)
- **Database**: Prisma ORM with SQLite (file at `db/custom.db`, gitignored)
- **HTML scraping**: cheerio
- **UI aesthetic**: dark slate-950 with cyan/emerald/rose accents, monospace data fonts, glowing number balls
- **Package manager**: bun (or npm — both work)

## How to run locally (after `git clone`)

```bash
cd intelligence-engine
npm install           # or: bun install
npx prisma generate
npx prisma db push --accept-data-loss   # creates SQLite tables (game field, supplementaryNumbers)
bun run scripts/seed-db.ts              # seeds DB with 43 Powerball + 42 Oz Lotto historical draws
npx next dev -p 3000                   # dev server at http://localhost:3000
```

Open `http://localhost:3000` — you'll see two tabs at the top (Powerball | Oz Lotto). Click either to switch the entire dashboard.

## Project structure

```
intelligence-engine/
├── prisma/
│   └── schema.prisma              # Draw model (game, drawNumber, mainNumbers, powerball, supplementaryNumbers) + SyncLog
├── src/
│   ├── app/
│   │   ├── page.tsx               # Main dashboard — tab switcher + all sections
│   │   ├── layout.tsx             # Root layout
│   │   ├── globals.css            # Tailwind + theme variables
│   │   └── api/
│   │       ├── draws/route.ts     # GET /api/draws?game=powerball|oz-lotto — returns JSON
│   │       └── sync/route.ts      # POST /api/sync?game=X — scrapes national-lottery.com, inserts new draws
│   ├── lib/
│   │   ├── lottery-data.ts        # Powerball: 43 hardcoded draws (1546-1588) — fallback seed
│   │   ├── lottery-data-ozlotto.ts # Oz Lotto: 42 hardcoded draws (1664-1705) — fallback seed
│   │   ├── game-config.ts         # Per-game config: ranges, source URLs, ball counts
│   │   ├── draw-store.ts          # Mutable in-memory draw store, game-aware
│   │   ├── analytics.ts           # All 9 statistical modules + 5-strategy predictor
│   │   ├── db.ts                  # Prisma client
│   │   └── utils.ts                # cn() className helper
│   └── components/
│       ├── number-ball.tsx         # Reusable glowing number ball (8 variants)
│       ├── frequency-heatmap.tsx   # Color-graded tile grid (cyan=cold → rose=hot)
│       ├── strategy-card.tsx       # Prediction strategy display (game-aware)
│       └── draw-history-table.tsx  # Sticky-header scrollable table (game-aware)
├── scripts/
│   ├── seed-db.ts                  # Seeds DB with both games' historical draws
│   ├── extract-ozlotto.ts         # One-off: scraped recent 26 Oz Lotto draws
│   └── extract-ozlotto-full.ts    # One-off: scraped all 42 Oz Lotto draws from 2026 archive
└── package.json                   # Scripts use Windows-compatible commands (no tee/cp)
```

## Game configurations

| Game | Draw day | Main range | Main count | Secondary range | Secondary count | Source URL |
|------|----------|-----------|-----------|-----------------|-----------------|------------|
| Powerball | Thursday | 1-35 | 7 | 1-20 (Powerball) | 1 | national-lottery.com/powerball/past-results |
| Oz Lotto | Tuesday | 1-47 | 7 | 1-47 (supplementary) | 3 | national-lottery.com/oz-lotto/past-results |
| Saturday Lotto (not yet added) | Saturday | 1-45 | 6 | 1-45 (supplementary) | 2 | national-lottery.com/saturday-lotto/past-results |

To add a new game, just add an entry to `GAMES` in `src/lib/game-config.ts` — the rest of the architecture automatically picks it up.

## Statistical modules (all in `src/lib/analytics.ts`)

All functions take a `game: GameId` parameter (default `"powerball"`):

1. **Frequency analysis** (empirical PMF) — `computeFrequency(game)` and `computeSecondaryFrequency(game)`
2. **Hot/Cold ranking** — `computeHotCold(game, topN)` and `computeSecondaryHotCold(game, topN)`
3. **Gap / Due analysis** — `computeGaps(game)` and `computeSecondaryGaps(game)`
4. **Odd/Even & High/Low distribution** — `computeOddEven(game)` and `computeHighLow(game)`
5. **Sum-range analysis** — `computeSums(game)` (compares observed mean to theoretical k(N+1)/2)
6. **Consecutive-pair detection** — `computeConsecutivePairs(game)`
7. **First-order Markov transition** — `computeMarkov(game)` (co-occurrence matrix)
8. **Bayesian posterior** (Beta-Binomial) — `computeBayes(game)` and `computeSecondaryBayes(game)`
9. **Chi-square goodness-of-fit** — `computeChiSquare(game)` and `computeSecondaryChiSquare(game)`

Plus an aggregator: `computeAggregate(game)` returns everything in one object.

## Five prediction strategies (`computePredictions(game, seed?)`)

Each produces 7 main numbers + 1 Powerball (Powerball game) OR 7 main + 3 supplementary (Oz Lotto):

1. **Hot Pursuit** (`frequency_weighted`) — frequency-weighted random pick, biased toward hot numbers
2. **Cold Snap** (`cold_due`) — gap/due weighted, biased toward overdue numbers
3. **Equilibrium** (`balanced`) — inverse-rank fusion of hot+cold rankings
4. **Markov Chain** (`markov_informed`) — aggregates conditional co-occurrence probs given the latest draw
5. **Statistical Norm** (`statistical_norm`) — Monte-Carlo search (50,000 trials) optimizing closeness to expected sum + balanced odd/even & high/low

The `seed` parameter controls re-randomization:
- `seed` undefined or 0 → uses fixed default seeds (deterministic baseline)
- `seed > 0` → uses `seed + offset` per strategy (fresh randomization each click of "Generate New Numbers")

## Dashboard sections (in `src/app/page.tsx`)

1. **Tab switcher** (Powerball | Oz Lotto) at top
2. **Auto-Sync panel** with "Sync Now" button (status messages: scraping → loaded X draws)
3. **Hero** — latest draw with 7 main balls + secondary ball(s) + sum
4. **4 metric cards** — draws analyzed, most overdue main, most overdue secondary, mean sum
5. **Ensemble Predictions** — 5 strategy cards, each with 7 main + secondary picks + "Generate New Numbers" button
6. **Frequency Heatmaps** — Main (1-N) and Secondary (1-M) side by side, color-graded by count
7. **Hot/Cold/Due leaderboards** — separate panels for MAIN and SECONDARY tracks
8. **Pattern Analysis** — Odd/Even, High/Low, Sum range, Consecutive pairs
9. **Markov + Bayesian panels** — 3 cards (Markov main, Bayesian main, Bayesian secondary)
10. **Chi-Square** — 2 cards (main H0:uniform, secondary H0:uniform)
11. **Full Draw History** — sticky-header scrollable table
12. **Honest Disclaimer footer** — explains random independence + responsible gambling

## Auto-sync architecture

- **POST /api/sync?game=X** — scrapes `GAMES[game].sourceUrl` using cheerio, parses draw rows, inserts new draws into SQLite via Prisma. 30s timeout via AbortController. Logs every attempt to `SyncLog` table.
- **GET /api/draws?game=X** — returns JSON of all draws for that game, newest first.
- The dashboard calls `refreshDraws(game)` on mount and after each sync — updates the in-memory store via `setDraws()`, which forces all `useMemo` to recompute via a `drawsVersion` state counter.

## Database schema (Prisma)

```prisma
model Draw {
  id                   Int      @id @default(autoincrement())
  game                 String   @default("powerball") // "powerball" | "oz-lotto"
  drawNumber           Int
  date                 DateTime
  dateLabel            String
  mainNumbers          String   // JSON array of 7 numbers
  powerball            Int?     // For Powerball only
  supplementaryNumbers String?  // For Oz Lotto only (JSON array)
  source               String   @default("seed") // "seed" | "sync"
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt
  @@unique([game, drawNumber])
  @@index([game])
}

model SyncLog {
  id           Int      @id @default(autoincrement())
  game         String   @default("powerball")
  startedAt    DateTime @default(now())
  finishedAt   DateTime?
  source       String
  drawsFound   Int      @default(0)
  drawsAdded   Int      @default(0)
  status       String   @default("running")
  error        String?
}
```

## How to add new draws

1. **Manual**: Edit `src/lib/lottery-data.ts` (Powerball) or `src/lib/lottery-data-ozlotto.ts` (Oz Lotto) — add a new line at the bottom of the array. The dashboard will pick it up on next reload (after re-running `seed-db.ts`).
2. **Auto-sync**: Click "Sync Now" button — the /api/sync endpoint scrapes the source URL and inserts any draws not yet in the DB. Run this every Thursday (Powerball) or Tuesday (Oz Lotto) after the draw.
3. **Programmatic**: `curl -X POST https://your-app.vercel.app/api/sync?game=powerball`

## For auto-sync on schedule (Vercel deployment)

Add `vercel.json` at repo root:
```json
{
  "crons": [
    { "path": "/api/sync?game=powerball", "schedule": "0 22 * * 4" },
    { "path": "/api/sync?game=oz-lotto", "schedule": "0 22 * * 2" }
  ]
}
```

This triggers Powerball sync every Thursday 22:00 UTC (after the 8:30pm AEST draw) and Oz Lotto sync every Tuesday 22:00 UTC. Free Vercel tier supports 2 cron jobs.

## Important constraints

1. **PAT security**: Never share a Personal Access Token in chat logs that could persist. Always revoke immediately after pushing. Use fine-grained PATs with `Contents: Read and write` on the specific repo only.
2. **Windows compatibility**: `package.json` scripts must NOT use Linux commands like `tee` or `cp` — the user is on Windows. Use plain `next dev` / `next build` / `next start`.
3. **No indigo/blue**: TailwindCSS indigo/blue is forbidden — use cyan/emerald/rose/amber accents instead.
4. **No internal labels**: Don't mention "Type 1/2/3/4" routing categories to the user.
5. **Source URL blocking**: `thelott.com` blocks non-Australian IPs. Use `australia.national-lottery.com` instead (it's an independent results service, not geo-blocked).
6. **Cheerio HTML structure**: Each draw row uses `<ul class="balls">` containing `<li class="result medium {game} ball dark ball">N</li>` for main numbers and `<li class="result medium {game} ball dark powerball|supplementary">N</li>` for secondary numbers.
7. **File paths**: All generated files MUST live under `/home/z/my-project/`. Final deliverables go in `/home/z/my-project/download/`. Scripts in `/home/z/my-project/scripts/`.
8. **Single user route**: User can only see `/` route (no other routes defined).

## Optional next steps (the user's open questions)

These were offered as the next direction:

**Option A — Add Saturday Lotto as third tab** (recommended, ~30 min)
- Add `saturday-lotto` to `GAMES` in `game-config.ts`
- Scrape `australia.national-lottery.com/saturday-lotto/past-results` (use the existing extract pattern)
- Add `lottery-data-saturday-lotto.ts` with historical draws
- Update `seed-db.ts` to include Saturday Lotto
- Tab switcher automatically picks up the new game (no UI changes needed)

**Option B — Improve prediction algorithms** (NOT recommended)
- EWMA, neural net, weighted Markov — these add complexity without accuracy
- Chi-square already proves draws are uniform random, so no algorithm helps

**Option C — Honest utility features**
- "Save prediction" — track which sets you played and compare against actual results
- Prize calculator — input a ticket, see potential payouts based on historical dividends
- Hot/cold streak tracker — visualize how a number's frequency changes over rolling 10-draw windows

## What "done" looks like for any new feature

1. Implement the feature in code (under `src/`)
2. Run `bun run lint` — must pass with zero errors
3. Verify in browser via Agent Browser (`agent-browser open http://localhost:3000/` + `snapshot -i -d 2` to confirm new sections render)
4. Commit with descriptive message
5. Push to GitHub (requires a fresh PAT from the user)
6. Remind user to revoke the PAT
