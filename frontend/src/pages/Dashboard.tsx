import { useQuery } from "@tanstack/react-query";
import { type FormEvent, useState } from "react";
import { getDashboard, type DashboardCount, type DashboardWine } from "../api/client";
import heroVineyard from "../assets/hero-vineyard.png";

const panelClass = "rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition duration-150 hover:shadow-md dark:border-slate-800 dark:bg-slate-900";
const subtitleClass = "text-xs font-medium text-slate-500 dark:text-slate-400";

type DashboardProps = {
  onSelectWine: (id: number) => void;
  onOpenWines: (opts?: { search?: string; phase?: string }) => void;
};

export function Dashboard({ onSelectWine, onOpenWines }: DashboardProps) {
  const dashboardQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboard
  });

  if (dashboardQuery.isLoading) {
    return <StatusCard>Chargement du tableau de bord...</StatusCard>;
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return <StatusCard>Impossible de charger le tableau de bord. Vérifiez que le backend est démarré.</StatusCard>;
  }

  const dashboard = dashboardQuery.data;

  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(320px,0.95fr)_minmax(380px,1fr)_minmax(320px,0.95fr)]">
      <div className="space-y-3">
        <HeroStockCard
          bottles={dashboard.totals.bottles}
          wines={dashboard.totals.wines}
          value={dashboard.totals.value}
          ready={dashboard.drinkReadyWines.length}
          onOpenWines={onOpenWines}
        />
        <SearchWidget onSearch={(search) => onOpenWines({ search })} />
        <QuickActions />
        <PhaseDistribution counts={dashboard.phaseCounts} onPhaseClick={(phase) => onOpenWines({ phase })} />
        <ValueWidget total={dashboard.totals.value} stock={dashboard.totals.stockValue} added={dashboard.totals.addedValue} avgPurchasePrice={dashboard.totals.avgPurchasePrice} />
        <RegionTable rows={dashboard.regionCounts} drilldown={dashboard.regionDrilldown} />
        <StockEvolution total={dashboard.totals.bottles} />
      </div>

      <div className="space-y-3">
        <WineListWidget title="Mes dernières sorties" wines={dashboard.latestOutputs} dateKind="out" empty="Aucune sortie récente." onSelectWine={onSelectWine} />
        <ColorWidget rows={dashboard.colorCounts} total={dashboard.totals.bottles} />
        <EffervescentPanel rows={dashboard.colorCounts} />
        <WineListWidget title="Prêts à déguster" wines={dashboard.drinkReadyWines} dateKind="phase" empty="Aucun vin en maturité ou apogée." onSelectWine={onSelectWine} />
        <ProgressTable title="Mes vins à déguster par année" rows={dashboard.peakYearCounts} total={dashboard.totals.bottles} emptyText="Données de vieillissement non renseignées." />
        <CompactTable title="Mes vins par cépage" rows={dashboard.grapeCounts} />
      </div>

      <div className="space-y-3">
        <WineListWidget title="Mes dernières entrées" wines={dashboard.latestEntries.length ? dashboard.latestEntries : dashboard.recentWines} dateKind="entry" empty="Aucune entrée récente." onSelectWine={onSelectWine} />
        <CompactTable title="Mes vins par cave" rows={dashboard.cellarCounts} />
        <ProgressTable title="Mes vins par millésime" rows={dashboard.vintageRanges} total={dashboard.totals.bottles} />
        <CompactTable title="Mes vins par gamme" rows={dashboard.rangeCounts} />
        <CompactTable title="Mes vins par conditionnement" rows={dashboard.packagingCounts} />
        <CompactTable title="Mes vins par type d'achat" rows={dashboard.purchaseTypeCounts} />
      </div>
    </div>
  );
}

function HeroStockCard({ bottles, wines, value, ready, onOpenWines }: { bottles: number; wines: number; value: number; ready: number; onOpenWines: () => void }) {
  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition duration-150 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="relative h-32 sm:h-36">
        <img src={heroVineyard} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/25 via-slate-950/35 to-slate-950/70" />
        <div className="relative flex h-full flex-col justify-end p-4 text-white">
          <p className="text-sm font-semibold tracking-wide">Bonjour</p>
          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <p className="text-5xl font-light leading-none">{bottles}</p>
              <p className="text-sm text-slate-200">bouteilles en cave</p>
            </div>
            <div className="space-y-1 text-right text-xs text-slate-200">
              <p><span className="font-semibold text-white">{wines}</span> références</p>
              <p><span className="font-semibold text-white">{formatCurrency(value)}</span></p>
              <p><span className="font-semibold text-white">{ready}</span> prêts</p>
            </div>
          </div>
        </div>
      </div>
      <button type="button" onClick={onOpenWines} className="flex w-full items-center justify-between bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white transition duration-150 hover:bg-slate-950 dark:bg-slate-950 dark:hover:bg-slate-800">
        Voir tous mes vins
        <span aria-hidden="true">›</span>
      </button>
    </section>
  );
}

function SearchWidget({ onSearch }: { onSearch: (query: string) => void }) {
  const [value, setValue] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = value.trim();
    if (trimmed) onSearch(trimmed);
  }

  return (
    <Panel title="Rechercher un vin dans ma cave">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Bordeaux, domaine, cuvée..."
          className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition duration-150 focus:border-red-600 focus:ring-2 focus:ring-red-100 dark:border-slate-700 dark:bg-slate-950 dark:focus:ring-red-950"
        />
        <button type="submit" className="h-10 shrink-0 rounded-md bg-red-700 px-3 text-sm font-semibold text-white transition duration-150 hover:bg-red-800">
          Chercher
        </button>
      </form>
    </Panel>
  );
}

function QuickActions() {
  return (
    <Panel title="Action">
      <div className="flex flex-wrap gap-2">
        <ActionButton tone="primary">Ajouter un vin</ActionButton>
        <ActionButton tone="secondary">Nouvelle entrée</ActionButton>
        <ActionButton tone="danger">Sortir une bouteille</ActionButton>
      </div>
    </Panel>
  );
}

function PhaseDistribution({ counts, onPhaseClick }: { counts: { youth: number; maturity: number; peak: number; decline: number }; onPhaseClick: (phase: string) => void }) {
  return (
    <Panel title="Répartition des bouteilles par phase">
      <div className="grid grid-cols-2 divide-x divide-y divide-slate-200 overflow-hidden rounded-md border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
        <PhaseCell label="Jeunesse" value={counts.youth} tone="youth" onClick={() => onPhaseClick("Jeunesse")} />
        <PhaseCell label="Maturité" value={counts.maturity} tone="maturity" onClick={() => onPhaseClick("Maturité")} />
        <PhaseCell label="Apogée" value={counts.peak} tone="peak" onClick={() => onPhaseClick("Apogée")} />
        <PhaseCell label="Déclin" value={counts.decline} tone="decline" onClick={() => onPhaseClick("Déclin")} />
      </div>
    </Panel>
  );
}

function PhaseCell({ label, value, tone, onClick }: { label: string; value: number; tone: PhaseTone; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="p-3 text-center transition duration-150 hover:bg-slate-50 dark:hover:bg-slate-800">
      <p className="text-xl font-semibold">{value}</p>
      <PhaseBadge label={label} tone={tone} />
    </button>
  );
}

function ValueWidget({ total, stock, added, avgPurchasePrice }: { total: number; stock: number; added: number; avgPurchasePrice: number }) {
  return (
    <Panel title="Valeur de ma cave" subtitle={new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(new Date())}>
      <div className="grid grid-cols-3 divide-x divide-slate-200 border-b border-slate-200 pb-3 text-center dark:divide-slate-800 dark:border-slate-800">
        <Metric label="Prix achat" value={formatCurrency(stock)} />
        <Metric label="Moy. / btl." value={formatCurrency(avgPurchasePrice)} />
        <Metric label="Plus-value" value={formatCurrency(added)} />
      </div>
      <div className="py-4 text-center">
        <p className="text-2xl font-semibold">{formatCurrency(total)}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">Prix marché</p>
      </div>
      <MiniBars values={[stock, total]} />
    </Panel>
  );
}

function WineListWidget({
  title,
  wines,
  dateKind,
  empty,
  onSelectWine
}: {
  title: string;
  wines: DashboardWine[];
  dateKind: "entry" | "out" | "phase";
  empty: string;
  onSelectWine: (id: number) => void;
}) {
  return (
    <Panel title={title}>
      {wines.length === 0 ? <EmptyText>{empty}</EmptyText> : null}
      <div className="divide-y divide-slate-200 dark:divide-slate-800">
        {wines.slice(0, 5).map((wine) => (
          <button key={wine.id} type="button" onClick={() => onSelectWine(wine.id)} className="grid w-full grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-3 rounded-md px-1 py-2.5 text-left transition duration-150 hover:bg-slate-50 dark:hover:bg-slate-950">
            <WineThumb wine={wine} />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-sm font-semibold text-slate-950 dark:text-slate-50">{wineTitle(wine)}</p>
              <p className="line-clamp-1 text-xs text-slate-600 dark:text-slate-300">{wine.estate || wine.appellation || "Origine non renseignée"}</p>
              <div className="mt-1">
                {dateKind === "phase" && wine.agingPhases ? (
                  <PhaseBadge label={wine.agingPhases} tone={phaseTone(wine.agingPhases)} />
                ) : (
                  <p className="line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                    {dateKind === "entry" ? displayDate(wine.lastPurchaseDate) : displayDate(wine.lastOutDate)}
                  </p>
                )}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">{wine.vintage ?? "NV"}</span>
              <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">{wine.quantity} btl.</p>
            </div>
          </button>
        ))}
      </div>
    </Panel>
  );
}

function ColorWidget({ rows, total }: { rows: DashboardCount[]; total: number }) {
  const colorMap = new Map(rows.map((row) => [row.label, row.count]));
  const items = ["Rouge", "Blanc", "Rosé"];

  return (
    <Panel title="Mes vins" subtitle="Par couleur">
      <div className="grid grid-cols-3 divide-x divide-slate-200 text-center dark:divide-slate-800">
        {items.map((item) => (
          <div key={item} className="p-3">
            <BottleGlyph color={item} />
            <p className="mt-1 text-lg font-semibold">{colorMap.get(item) ?? 0}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{item}</p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">{total} bouteilles au total</p>
    </Panel>
  );
}

function EffervescentPanel({ rows }: { rows: DashboardCount[] }) {
  const count = rows.find((r) => r.label === "Effervescent")?.count ?? 0;
  return (
    <Panel title="Vins effervescents" subtitle="Champagnes & pétillants">
      <div className="flex items-center gap-5 py-1">
        <BottleGlyph color="Effervescent" />
        <div>
          <p className="text-3xl font-light">{count}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">bouteilles</p>
        </div>
      </div>
    </Panel>
  );
}

function CompactTable({ title, rows }: { title: string; rows: DashboardCount[] }) {
  return (
    <Panel title={title} subtitle="Par nombre de bouteilles">
      <div className="divide-y divide-slate-200 dark:divide-slate-800">
        {rows.slice(0, 8).map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3 py-1.5 text-sm">
            <span className="min-w-0 truncate text-slate-700 dark:text-slate-200">{row.label}</span>
            <span className="font-semibold">{row.count}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function ProgressTable({ title, rows, total, emptyText }: { title: string; rows: DashboardCount[]; total: number; emptyText?: string }) {
  return (
    <Panel title={title}>
      {rows.length === 0 && emptyText ? (
        <EmptyText>{emptyText}</EmptyText>
      ) : (
        <div className="space-y-1.5">
          {rows.map((row) => (
            <div key={row.label} className="grid grid-cols-[90px_42px_1fr] items-center gap-3 text-sm">
              <span className="truncate text-slate-700 dark:text-slate-200">{row.label}</span>
              <span className="text-right font-semibold">{row.count}</span>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-2 rounded-full bg-slate-800 dark:bg-slate-200" style={{ width: `${Math.min(100, total ? (row.count / total) * 100 : 0)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function RegionTable({ rows, drilldown }: { rows: DashboardCount[]; drilldown: Record<string, DashboardCount[]> }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <Panel title="Mes vins par région" subtitle="Par nombre de bouteilles">
      <div className="divide-y divide-slate-200 dark:divide-slate-800">
        {rows.slice(0, 8).map((row) => (
          <div key={row.label}>
            <button
              type="button"
              onClick={() => setExpanded(expanded === row.label ? null : row.label)}
              className="flex w-full items-center justify-between gap-3 rounded px-1 py-1.5 text-sm transition duration-150 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <span className="min-w-0 truncate text-slate-700 dark:text-slate-200">{row.label}</span>
              <div className="flex shrink-0 items-center gap-2">
                <span className="font-semibold">{row.count}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">{expanded === row.label ? "▲" : "▼"}</span>
              </div>
            </button>
            {expanded === row.label && drilldown[row.label] && (
              <div className="mb-1.5 ml-2 space-y-0.5 border-l-2 border-slate-200 pl-3 dark:border-slate-700">
                {drilldown[row.label].map((sub) => (
                  <div key={sub.label} className="flex items-center justify-between gap-3 py-0.5 text-xs text-slate-500 dark:text-slate-400">
                    <span className="min-w-0 truncate">{sub.label}</span>
                    <span className="font-medium">{sub.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </Panel>
  );
}

function StockEvolution({ total }: { total: number }) {
  const values = [total + 8, total + 3, total, total + 1];
  const max = Math.max(...values);
  const min = Math.min(...values);
  const points = values.map((value, index) => {
    const x = 8 + index * 28;
    const y = 78 - ((value - min) / Math.max(1, max - min)) * 52;
    return `${x},${y}`;
  }).join(" ");

  return (
    <Panel title="Évolution de mon stock">
      <svg viewBox="0 0 100 88" className="h-44 w-full">
        <path d={`M ${points} L 92,82 L 8,82 Z`} className="fill-slate-100 dark:fill-slate-900" />
        <polyline points={points} fill="none" className="stroke-slate-800 dark:stroke-slate-200" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="8" x2="92" y1="82" y2="82" className="stroke-slate-200 dark:stroke-slate-800" />
      </svg>
    </Panel>
  );
}

function MiniBars({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex h-28 items-end justify-center gap-8 border-t border-slate-200 pt-3 dark:border-slate-800">
      {values.map((value, index) => (
        <div key={index} className="w-16 rounded-t bg-slate-300 dark:bg-slate-700" style={{ height: `${Math.max(8, (value / max) * 90)}px` }}>
          <div className="h-4 rounded-t bg-slate-800 dark:bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className={panelClass}>
      <div className="mb-2">
        <h2 className="text-base font-semibold text-slate-950 dark:text-slate-50">{title}</h2>
        {subtitle ? <p className={subtitleClass}>{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

function ActionButton({ children, tone }: { children: React.ReactNode; tone: "primary" | "secondary" | "danger" }) {
  const className = {
    primary: "bg-slate-800 text-white hover:bg-slate-950 dark:bg-red-700 dark:hover:bg-red-600",
    secondary: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900",
    danger: "border border-red-200 bg-red-50 text-red-800 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200 dark:hover:bg-red-950/50"
  }[tone];

  return (
    <button type="button" className={`rounded-md px-3 py-2 text-sm font-semibold shadow-sm transition duration-150 ${className}`}>
      {children}
    </button>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-base font-semibold">{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

function WineThumb({ wine }: { wine: DashboardWine }) {
  return wine.imageUrl ? (
    <img src={wine.imageUrl} alt="" className="h-16 w-12 shrink-0 rounded object-cover ring-1 ring-slate-200 dark:ring-slate-800" loading="lazy" />
  ) : (
    <div className="flex h-16 w-12 shrink-0 items-center justify-center rounded bg-slate-100 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
      Vin
    </div>
  );
}

type PhaseTone = "youth" | "maturity" | "peak" | "decline" | "neutral";

function PhaseBadge({ label, tone }: { label: string; tone: PhaseTone }) {
  const className = {
    youth: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/30 dark:text-amber-200 dark:ring-amber-900",
    maturity: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950/30 dark:text-blue-200 dark:ring-blue-900",
    peak: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-200 dark:ring-emerald-900",
    decline: "bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/30 dark:text-red-200 dark:ring-red-900",
    neutral: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700"
  }[tone];

  return <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ${className}`}>{label}</span>;
}

function phaseTone(value: string | null): PhaseTone {
  const normalized = value?.toLowerCase() ?? "";
  if (normalized.includes("jeunesse")) return "youth";
  if (normalized.includes("matur")) return "maturity";
  if (normalized.includes("apog")) return "peak";
  if (normalized.includes("déclin") || normalized.includes("declin")) return "decline";
  return "neutral";
}

function BottleGlyph({ color }: { color: string }) {
  const fill = color === "Rouge" ? "#7f1d1d" : color === "Blanc" ? "#d9b45f" : color === "Rosé" ? "#f3a6a6" : "#64748b";
  return (
    <svg className="mx-auto h-8 w-7" viewBox="0 0 24 48" aria-hidden="true">
      <path d="M9 2h6v11l3 5v25a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V18l3-5V2Z" fill={fill} />
      <rect x="7" y="25" width="10" height="10" rx="1" fill="#f8fafc" opacity="0.75" />
    </svg>
  );
}

function StatusCard({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">{children}</div>;
}

function EmptyText({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-slate-500 dark:text-slate-400">{children}</p>;
}

function wineTitle(wine: DashboardWine) {
  return [wine.region, wine.appellation, wine.vintage].filter(Boolean).join(" - ") || wine.estate || "Vin sans nom";
}

function displayDate(value: string | null) {
  if (!value) return "Date non renseignée";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(value));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value);
}
