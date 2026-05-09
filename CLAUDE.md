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
npm test                 # Run all Vitest tests once
cd frontend && npx vitest run src/api/client.test.ts  # Run a single test file

# Data import scripts (require built backend or tsx)
npm run import:viniou:dev       # Import wines from imports/viniou.csv
npm run import:enrichments:dev  # Import enrichment data from data/macave_enrichments.csv

# Production
npm start                # node dist/index.js in backend workspace

# API testing (backend must be running on :3015)
Invoke-RestMethod -Uri "http://localhost:3015/api/health"
Invoke-RestMethod -Uri "http://localhost:3015/api/dashboard"
```

## Port notes

- **Port 3000** is permanently occupied by another local process — do not attempt to use it or kill it.
- The backend `dev` script uses `cross-env PORT=3015` to force port 3015.
- `backend/src/index.ts` reads `process.env.PORT ?? 3000` — never change the default; change the script instead.
- The Vite dev proxy (`frontend/vite.config.ts`) forwards `/api/*` to `localhost:3015`.

## Architecture

### Monorepo layout

- **`backend/src/`** — Express REST API, TypeScript, compiled to `backend/dist/`
- **`frontend/src/`** — React 19 SPA, built by Vite to `frontend/dist/`
- **`data/`** — SQLite database (`cave.db`) + backups, wine images, enrichment CSV cache
- **`imports/`** — Source CSV files for bulk wine import (`viniou.csv`)

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
| `totals.bottles` | `sum(wine.quantity)` | All wines incl. zero-stock |
| `totals.value` | `enrichment.marketStockValue ?? wine.totalValue` | Market value |
| `totals.stockValue` | `enrichment.stockAmount ?? wine.purchaseTotalPrice` | Purchase cost — often sparse |
| `totals.avgPurchasePrice` | `stockValue / bottles` | Low if `purchaseTotalPrice` not set in CSV |
| `totals.addedValue` | `enrichment.addedValue` | Enrichment-only, may be 0 |
| `peakYearCounts` | `wine.peakMin` / `wine.peakMax` | Bottles drinkable per year, window: `[currentYear-1, currentYear+14]` |
| `rangeCounts` | `wine.range` | Gamme: Intermédiaire / Accessibles / Premium |
| `regionDrilldown` | `wine.region` → `wine.appellation` | Record keyed by region, top 8 appellations each |
| `colorCounts` | `normalizeColor(wine.color ?? wine.wineType)` | Rouge / Blanc / Rosé / Effervescent |

Helper limits: `countBy` returns top 12, `countGrapes` top 10, `regionDrilldown` top 8 appellations per region.

## CSV field mapping (`backend/src/parse.ts`)

Key Viniou CSV columns → `wines` table fields:

| CSV column | Field |
|---|---|
| `Gamme du vin` | `range` |
| `Apogée Min` / `Apogée Max` | `peakMin` / `peakMax` |
| `Phases de vieillissement` | `agingPhases` (e.g. "Apogée", "Maturité") |
| `Quantité en Stock` | `quantity` |
| `Prix Total Achat` | `purchaseTotalPrice` |
| `Prix Marché Unitaire Actuelle` | `marketUnitPrice` |
| `Cépages` | `grapes` (comma-separated, may include `%`) |
| `Identifiant` | `viniouId` (links to `wine_enrichments`) |

## Dashboard frontend (`frontend/src/pages/Dashboard.tsx`)

3-column grid (`xl:grid-cols-[0.95fr_1fr_0.95fr]`). All sub-components are local to the file.

**Column 1** — overview & filters  
`HeroStockCard` → `SearchWidget` → `QuickActions` → `PhaseDistribution` → `ValueWidget` → `RegionTable` (expandable drill-down) → `StockEvolution`

**Column 2** — outputs & color analysis  
`WineListWidget` (sorties) → `ColorWidget` (Rouge/Blanc/Rosé) → `EffervescentPanel` → `WineListWidget` (prêts) → `ProgressTable` (par année / `peakYearCounts`) → `CompactTable` (cépages)

**Column 3** — entries & breakdowns  
`WineListWidget` (entrées) → `CompactTable` (caves) → `ProgressTable` (millésimes / `vintageRanges`) → `CompactTable` (gamme) → `CompactTable` (conditionnement) → `CompactTable` (type achat)

Notable component behaviors:
- `RegionTable` — `useState` to toggle one expanded region at a time; shows appellation sub-rows with a left border
- `ProgressTable` — accepts optional `emptyText` prop for empty state (used for `peakYearCounts`)
- `ColorWidget` — shows only Rouge/Blanc/Rosé (3-column); Effervescent is a separate `EffervescentPanel`
- `StockEvolution` — static SVG approximation (no real historical data stored)

## TypeScript config notes

- Backend: `NodeNext` module resolution, emits to `dist/`, strict mode
- Frontend: `Bundler` module resolution, no emit (Vite handles it), strict mode
- No ESLint or Prettier configured — TypeScript strict mode is the quality gate
- Run `npm run typecheck` after every backend or frontend change
