import { useQuery } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { listWines, type Wine } from "../api/client";
import { Search } from "../components/icons";

const pageSize = 10;
type StockFilter = "all" | "inStock" | "outOfStock";
type SortOption = "regionAsc" | "vintageDesc" | "vintageAsc" | "quantityDesc";

const sortOptions: Record<SortOption, { label: string; sortBy: "region" | "vintage" | "quantity"; sortOrder: "asc" | "desc" }> = {
  regionAsc: { label: "Region A-Z", sortBy: "region", sortOrder: "asc" },
  vintageDesc: { label: "Millesime recent", sortBy: "vintage", sortOrder: "desc" },
  vintageAsc: { label: "Millesime ancien", sortBy: "vintage", sortOrder: "asc" },
  quantityDesc: { label: "Stock eleve", sortBy: "quantity", sortOrder: "desc" }
};

type WinesListProps = {
  onSelectWine: (id: number) => void;
};

export function WinesList({ onSelectWine }: WinesListProps) {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("regionAsc");
  const sort = sortOptions[sortOption];
  const winesQuery = useQuery({
    queryKey: ["wines", { page, pageSize, search, sortOption }],
    queryFn: () => listWines({ page, pageSize, search, sortBy: sort.sortBy, sortOrder: sort.sortOrder })
  });

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  function clearSearch() {
    setSearch("");
    setSearchInput("");
    setPage(1);
  }

  const totalPages = winesQuery.data?.totalPages ?? 1;
  const items = winesQuery.data?.items ?? [];
  const filteredItems = items.filter((wine) => {
    if (stockFilter === "inStock") return wine.quantity > 0;
    if (stockFilter === "outOfStock") return wine.quantity <= 0;
    return true;
  });
  const hasActiveSearch = search.length > 0;
  const hasVisibleItems = filteredItems.length > 0;

  return (
    <section className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-4">
        <form onSubmit={submitSearch} className="space-y-3">
          <label className="relative block">
            <span className="sr-only">Rechercher un vin</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              className="h-11 w-full rounded-md border border-slate-300 bg-white pl-10 pr-10 text-base text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-red-600 focus:ring-2 focus:ring-red-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-red-400 dark:focus:ring-red-950"
              placeholder="Bordeaux, domaine, cuvee..."
            />
            {searchInput ? (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-md text-sm font-semibold text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Vider la recherche"
                title="Vider"
              >
                x
              </button>
            ) : null}
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="submit"
              className="h-10 rounded-md bg-red-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-600 dark:hover:bg-red-500 dark:focus:ring-offset-slate-950"
            >
              Rechercher
            </button>
            {hasActiveSearch ? (
              <button
                type="button"
                onClick={clearSearch}
                className="h-10 rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Reinitialiser
              </button>
            ) : null}
          </div>
        </form>

        {hasActiveSearch ? (
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Recherche active : <span className="font-semibold text-slate-900 dark:text-slate-100">{search}</span>
          </p>
        ) : null}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Tri</span>
            <select
              value={sortOption}
              onChange={(event) => {
                setSortOption(event.target.value as SortOption);
                setPage(1);
              }}
              className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              {Object.entries(sortOptions).map(([value, option]) => (
                <option key={value} value={value}>{option.label}</option>
              ))}
            </select>
          </label>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Stock affiche</p>
            <div className="mt-1 grid grid-cols-3 gap-1 rounded-md bg-slate-100 p-1 dark:bg-slate-950">
              <FilterButton active={stockFilter === "all"} onClick={() => setStockFilter("all")}>Tous</FilterButton>
              <FilterButton active={stockFilter === "inStock"} onClick={() => setStockFilter("inStock")}>En stock</FilterButton>
              <FilterButton active={stockFilter === "outOfStock"} onClick={() => setStockFilter("outOfStock")}>Epuises</FilterButton>
            </div>
            {stockFilter !== "all" ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Filtre applique aux resultats affiches sur cette page.</p> : null}
          </div>
        </div>
      </div>

      {winesQuery.isLoading ? <StatusMessage>Chargement des vins...</StatusMessage> : null}
      {winesQuery.isError ? <StatusMessage>Impossible de charger les vins. Verifiez que le backend est demarre.</StatusMessage> : null}
      {winesQuery.data && items.length === 0 ? <StatusMessage>{hasActiveSearch ? "Aucun vin ne correspond a cette recherche." : "Aucun vin trouve."}</StatusMessage> : null}
      {winesQuery.data && items.length > 0 && !hasVisibleItems ? <StatusMessage>Aucun vin ne correspond au filtre de stock sur cette page.</StatusMessage> : null}

      <div className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300 sm:flex-row sm:items-center sm:justify-between">
        <span>{winesQuery.data ? `${winesQuery.data.total} vins au total` : "Chargement"}</span>
        <span>Page {page} / {totalPages || 1} - {filteredItems.length} affiche{filteredItems.length > 1 ? "s" : ""}</span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map((wine) => (
          <WineCard key={wine.id} wine={wine} onSelect={() => onSelectWine(wine.id)} />
        ))}
      </div>

      <nav className="flex items-center justify-between gap-3 pt-2" aria-label="Pagination">
        <button
          type="button"
          onClick={() => setPage((value) => Math.max(1, value - 1))}
          disabled={page <= 1 || winesQuery.isFetching}
          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          Precedent
        </button>
        <span className="text-sm text-slate-600 dark:text-slate-300">
          Page {page} / {totalPages || 1}
        </span>
        <button
          type="button"
          onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
          disabled={page >= totalPages || winesQuery.isFetching}
          className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          Suivant
        </button>
      </nav>
    </section>
  );
}

function WineCard({ wine, onSelect }: { wine: Wine; onSelect: () => void }) {
  const title = [wine.estate, wine.cuvee].filter(Boolean).join(" - ") || wine.appellation || "Vin sans nom";
  const appellation = wine.appellation && !title.includes(wine.appellation) ? wine.appellation : null;
  const origin = [wine.region, wine.country].filter(Boolean).join(" - ");
  const price = wine.marketUnitPrice !== null ? displayCurrency(wine.marketUnitPrice) : displayCurrency(wine.totalValue);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="rounded-lg border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-red-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-red-700"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="line-clamp-2 text-sm font-semibold leading-5 text-slate-950 dark:text-slate-50">{title}</h2>
          {appellation ? <p className="mt-0.5 line-clamp-1 text-xs text-slate-600 dark:text-slate-300">{appellation}</p> : null}
          <p className="mt-1 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">{origin || "Origine non renseignee"}</p>
        </div>
        <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-100">
          {wine.vintage ?? "NV"}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
        <Chip>{wine.color ?? wine.wineType ?? "Type non renseigne"}</Chip>
        {wine.agingPhases ? <Chip>{wine.agingPhases}</Chip> : null}
      </div>
      <div className="mt-3 flex items-end justify-between gap-2 text-sm">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{wine.marketUnitPrice !== null ? "Prix marche" : "Valeur"}</p>
          <p className="font-medium text-slate-800 dark:text-slate-100">{price}</p>
        </div>
        <span className={`font-semibold ${wine.quantity > 0 ? "text-red-700 dark:text-red-300" : "text-slate-500 dark:text-slate-400"}`}>
          {wine.quantity} bouteille{wine.quantity > 1 ? "s" : ""}
        </span>
      </div>
    </button>
  );
}

function FilterButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 rounded px-2 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-red-500 ${
        active
          ? "bg-white text-red-700 shadow-sm dark:bg-slate-800 dark:text-red-300"
          : "text-slate-600 hover:bg-white/70 dark:text-slate-300 dark:hover:bg-slate-800"
      }`}
    >
      {children}
    </button>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-slate-100 px-2 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
      {children}
    </span>
  );
}

function StatusMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
      {children}
    </div>
  );
}

function displayCurrency(value: number | null) {
  if (value === null || value === 0) return "Non renseigne";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value);
}
