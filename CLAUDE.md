# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

MaCave ("Ma Cave" = My Cellar in French) is a personal wine cellar management app. It's an npm workspaces monorepo with a React frontend and Express backend, deployed as a Docker container to a VPS via GitHub Actions.

## Environment

- **OS**: Windows 11 — use **PowerShell only** for local commands. Never use Bash with Windows paths (`c:\Dev\MaCave`).
- **Shell commands**: `npm`, `git`, `netstat`, `Invoke-RestMethod`, etc. must go through the PowerShell tool.

## Commands

Run from the repo root unless noted.

```powershell
# Development (run in two separate terminals)
npm run dev              # Backend: tsx watch, PORT=3015 (via cross-env)
npm run dev:frontend     # Frontend: Vite dev server (proxies /api → localhost:3015)

# Build
npm run build            # Builds both backend (tsc → dist/) and frontend (tsc + vite → dist/)
npm run typecheck        # Type-check both workspaces without emitting

# Tests (frontend only — no backend tests)
npm test -w frontend     # Run all Vitest tests once

# Data import scripts (require built backend or tsx)
npm run import:viniou:dev       # Import wines from imports/viniou.csv
npm run import:enrichments:dev  # Import enrichment data from data/macave_enrichments.csv

# Production
npm start                # node dist/index.js in backend workspace

# API testing (backend must be running on :3015)
Invoke-RestMethod -Uri "http://localhost:3015/api/health"
Invoke-RestMethod -Uri "http://localhost:3015/api/dashboard"

# Database audit (SQLite via Node — no sqlite3 CLI available)
node scripts/audit-dashboard.cjs
```

## Port notes

- **Port 3000** is permanently occupied by another local process — do not attempt to use it or kill it.
- The backend `dev` script uses `cross-env PORT=3015` to force port 3015.
- `backend/src/index.ts` reads `process.env.PORT ?? 3000` — never change the default; change the script instead.
- The Vite dev proxy (`frontend/vite.config.ts`) forwards `/api/*` to `localhost:3015`.
- After killing/restarting the backend, wait ~7s before testing the API. `tsx watch` does not reload automatically when started as a detached process — kill and restart if code changes aren't reflected.

## Architecture

### Monorepo layout

- **`backend/src/`** — Express REST API, TypeScript, compiled to `backend/dist/`
- **`frontend/src/`** — React 19 SPA, built by Vite to `frontend/dist/`
- **`data/`** — SQLite database (`cave.db`) + backups, wine images, enrichment CSV cache
- **`imports/`** — Source CSV files for bulk wine import (`viniou.csv`)
- **`scripts/`** — Utility CJS scripts (e.g. `audit-dashboard.cjs` for DB inspection)

### Backend

Entry point: `backend/src/index.ts`. Routing is split across:
- `routes/wines.routes.ts` — CRUD for wines, tasting notes, and enrichment
- `routes/dashboard.routes.ts` — Aggregated stats endpoint

Data layer uses **Drizzle ORM** over **better-sqlite3** (synchronous, no async required). Schema is in `schema.ts`; three tables: `wines`, `tasting_notes`, `wine_enrichments`. Migrations run on startup from `migrations.ts`.

Zod validation (`validation.ts`) guards all request bodies. Errors flow through `http.ts` middleware.

The backend serves the built frontend static files in production (serves `frontend/dist/`).

### Frontend

Entry: `frontend/src/main.tsx`. Single-page app with manual hash/search-param routing in `App.tsx` (no router library). Three pages: `Dashboard`, `WinesList`, `WineDetail`.

API calls go through `frontend/src/api/client.ts`, which wraps fetch with React Query hooks. Vite dev proxy forwards `/api/*` to the backend.

Styling is pure **Tailwind CSS** with class-based dark mode (`dark:` prefix, toggled via `Layout.tsx`). No component library.

### Key data flow

1. Wines are imported from `imports/viniou.csv` via the import script → stored in `wines` table
2. Enrichment data (food pairings, market prices, images) is imported from `data/macave_enrichments.csv` → stored in `wine_enrichments`, linked to wines by `viniouId`
3. The frontend fetches `/api/wines`, `/api/dashboard`, and enrichment/tasting-note sub-resources per wine

### Deployment

Docker multi-stage build: `node:22-bookworm-slim` base, python3/make/g++ added for better-sqlite3 native compilation. Container runs on port 3015.

GitHub Actions (`.github/workflows/deploy-macave.yml`) rsync-deploys source to VPS, builds on the server, then restarts `macave.service` via systemd. The `data/` and `imports/` volumes are mounted to persist the SQLite database across deploys.

## Dashboard service (`backend/src/services/dashboard.service.ts`)

`getDashboard()` runs synchronous SQLite queries and returns a single aggregated response. Key computed fields:

| Field | Source | Notes |
|---|---|---|
| `totals.bottles` | `sum(wine.quantity)` | All wines including quantity=0 rows |
| `totals.value` | `enrichment.marketStockValue ?? wine.totalValue` | Uses enrichment value when available — **can be stale** if enrichments were exported at a different stock level than current |
| `totals.stockValue` | `enrichment.stockAmount ?? wine.purchaseTotalPrice` | Purchase cost — sparse, most wines have 0 |
| `totals.avgPurchasePrice` | `purchaseTotalPriceSum / bottlesWithPurchasePrice` | Denominator = bottles where `purchaseTotalPrice > 0` only (~9 bottles); matches Viniou 12.89 € |
| `totals.addedValue` | `sum(enrichment.addedValue)` | Enrichment-only |
| `tranquilleColorCounts` | `wine.wineType` not containing "Effervescent" | Rouge / Blanc / Rosé |
| `effervescentCounts` | `wine.wineType` containing "Effervescent" | Color breakdown of sparkling wines |
| `peakYearCounts` | `wine.peakMin` (bucket only) | 5 fixed buckets: `<Y`, `Y`, `Y+1`, `Y+2`, `>Y+2` where Y = current year |
| `rangeCounts` | `wine.range` | Gamme: Intermédiaire / Accessibles / Premium |
| `regionDrilldown` | `wine.region` → `wine.appellation` | Record keyed by region, top 8 appellations each |

Helper limits: `countBy` returns top 12, `countGrapes` top 10, `regionDrilldown` top 8 appellations per region.

### Critical: color classification

**Discriminant is `wine.wineType`, not `wine.color`.**  
Effervescent wines have `color = "Blanc"` and `wine_type = "Vins Effervescent"`. Using `normalizeColor(wine.color)` alone would classify them as "Blanc" tranquille. Always use `isEffervescent(wine)` (checks `wineType`) to split tranquilles from effervescents before aggregating colors.

### Critical: avgPurchasePrice denominator

Use `sum(purchaseTotalPrice) / sum(quantity WHERE purchaseTotalPrice > 0)`, **not** `stockValue / totalBottles`. Most wines have no purchase price recorded — dividing by all bottles produces a near-zero result (~1.47 €). Correct result: ~12.89 €.

### Critical: peakYearCounts logic

Each wine is placed into **exactly one bucket** based on `peakMin` alone:
- `peakMin < currentYear` → `<Y` (peak started before this year)
- `peakMin === currentYear` → `Y`
- `peakMin === currentYear + 1` → `Y+1`
- `peakMin === currentYear + 2` → `Y+2`
- `peakMin > currentYear + 2` → `>Y+2`

Do **not** iterate over all years in `[peakMin, peakMax]` — that inflates every bucket.

## CSV field mapping (`backend/src/parse.ts`)

Key Viniou CSV columns → `wines` table fields (SQLite column names are snake_case):

| CSV column | TypeScript field | SQLite column |
|---|---|---|
| `Gamme du vin` | `range` | `range` |
| `Apogée Min` / `Apogée Max` | `peakMin` / `peakMax` | `peak_min` / `peak_max` |
| `Phases de vieillissement` | `agingPhases` | `aging_phases` |
| `Type de Vin` | `wineType` | `wine_type` |
| `Couleur` | `color` | `color` |
| `Quantité en Stock` | `quantity` | `quantity` |
| `Prix Total Achat` | `purchaseTotalPrice` | `purchase_total_price` |
| `Prix Marché Unitaire Actuelle` | `marketUnitPrice` | `market_unit_price` |
| `Valeur Totale` | `totalValue` | `total_value` |
| `Cépages` | `grapes` | `grapes` (comma-separated, may include `%`) |
| `Identifiant` | `viniouId` | `viniou_id` (links to `wine_enrichments`) |

Enrichments CSV columns → `wine_enrichments` table (key fields):

| CSV column | Field |
|---|---|
| `Montant Stock (€)` | `stockAmount` |
| `Valeur Stock Marché (€)` | `marketStockValue` |
| `Plus-Value (€)` | `addedValue` |
| `Statut Consommation` | `consumptionStatus` |
| `Quantité Consommée` | `consumedQuantity` |

## Data model limitations (known, do not attempt to fix in code)

- **No movement history**: the `wines` table stores only `last_out_date` and `last_out_note` (last event only). There is no `stock_movements` table. Sorties that happened in Viniou but weren't re-imported via CSV are invisible to MaCave.
- **Enrichments can be stale**: `marketStockValue` in `wine_enrichments` is computed at CSV export time (quantity × price at that moment). If stock changed since the last enrichment import, the dashboard `totals.value` will be incorrect. The correct real-time value is `sum(wine.quantity × wine.marketUnitPrice)`.
- **Viniou vs MaCave sync gap**: the CSV export is a point-in-time snapshot. Any bottle consumed or added in Viniou after the last export will not be reflected in MaCave until a new import. Do not try to close this gap in dashboard calculations — it requires a reimport.
- **Viniou reference figures** (as of 2026-05-09, for comparison): 80 bottles, 1815 € market, 116 € purchase, 12.89 € avg, 1699 € added value, Rouge 66 / Blanc 1 / Rosé 0 tranquilles, Blanc 13 effervescents.

## Dashboard frontend (`frontend/src/pages/Dashboard.tsx`)

3-column grid (`xl:grid-cols-[0.95fr_1fr_0.95fr]`). All sub-components are local to the file.

**Column 1** — overview & filters  
`HeroStockCard` → `SearchWidget` → `QuickActions` → `PhaseDistribution` → `ValueWidget` → `RegionTable` (expandable drill-down) → `StockEvolution`

**Column 2** — outputs & color analysis  
`WineListWidget` (sorties) → `ColorWidget` (tranquilles: Rouge/Blanc/Rosé) → `EffervescentPanel` (effervescents) → `WineListWidget` (prêts) → `ProgressTable` (à boire par année / `peakYearCounts`) → `CompactTable` (cépages)

**Column 3** — entries & breakdowns  
`WineListWidget` (entrées) → `CompactTable` (caves) → `ProgressTable` (millésimes / `vintageRanges`) → `CompactTable` (gamme) → `CompactTable` (conditionnement) → `CompactTable` (type achat)

Notable component behaviors:
- `RegionTable` — `useState` to toggle one expanded region at a time; shows appellation sub-rows with a left border
- `ProgressTable` — accepts optional `emptyText` prop for empty state
- `ColorWidget` — receives `tranquilleColorCounts` (not `colorCounts`), shows Rouge/Blanc/Rosé in 3-column grid
- `EffervescentPanel` — receives `effervescentCounts`, sums all entries for the total display
- `StockEvolution` — static SVG approximation (no real historical data stored)

## TypeScript config notes

- Backend: `NodeNext` module resolution, emits to `dist/`, strict mode
- Frontend: `Bundler` module resolution, no emit (Vite handles it), strict mode
- No ESLint or Prettier configured — TypeScript strict mode is the quality gate
- Run `npm run typecheck` after every backend or frontend change
