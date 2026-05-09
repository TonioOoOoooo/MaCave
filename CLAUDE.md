# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

MaCave ("Ma Cave" = My Cellar in French) is a personal wine cellar management app. It's an npm workspaces monorepo with a React frontend and Express backend, deployed as a Docker container to a VPS via GitHub Actions.

## Commands

Run from the repo root unless noted.

```bash
# Development (run concurrently in two terminals)
npm run dev              # Backend: tsx watch on port 3015
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
```

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

## TypeScript config notes

- Backend: `NodeNext` module resolution, emits to `dist/`, strict mode
- Frontend: `Bundler` module resolution, no emit (Vite handles it), strict mode
- No ESLint or Prettier configured — TypeScript strict mode is the quality gate
