import { useQuery } from "@tanstack/react-query";
import { FormEvent, useState } from "react";
import { listWines, type Wine } from "../api/client";
import { Search } from "../components/icons";

const pageSize = 10;

type WinesListProps = {
  onSelectWine: (id: number) => void;
};

export function WinesList({ onSelectWine }: WinesListProps) {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const winesQuery = useQuery({
    queryKey: ["wines", { page, pageSize, search }],
    queryFn: () => listWines({ page, pageSize, search })
  });

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput);
  }

  const totalPages = winesQuery.data?.totalPages ?? 1;

  return (
    <section className="space-y-4">
      <form onSubmit={submitSearch} className="flex gap-2">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Rechercher un vin</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className="h-11 w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 text-base text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-red-600 focus:ring-2 focus:ring-red-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-red-400 dark:focus:ring-red-950"
            placeholder="Bordeaux, domaine, cuvee..."
          />
        </label>
        <button
          type="submit"
          className="h-11 rounded-md bg-red-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:bg-red-600 dark:hover:bg-red-500 dark:focus:ring-offset-slate-950"
        >
          Rechercher
        </button>
      </form>

      <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
        <span>{winesQuery.data ? `${winesQuery.data.total} vins` : "Chargement"}</span>
        {search ? <button type="button" onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }} className="font-medium text-red-700 dark:text-red-300">Effacer</button> : null}
      </div>

      {winesQuery.isLoading ? <StatusMessage>Chargement des vins...</StatusMessage> : null}
      {winesQuery.isError ? <StatusMessage>Impossible de charger les vins.</StatusMessage> : null}
      {winesQuery.data?.items.length === 0 ? <StatusMessage>Aucun vin trouve.</StatusMessage> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {winesQuery.data?.items.map((wine) => (
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
  const subtitle = [wine.region, wine.appellation, wine.country].filter(Boolean).join(" - ");

  return (
    <button
      type="button"
      onClick={onSelect}
      className="rounded-lg border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-red-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-red-700"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="line-clamp-2 text-base font-semibold text-slate-950 dark:text-slate-50">{title}</h2>
          <p className="mt-1 line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{subtitle || "Origine non renseignee"}</p>
        </div>
        <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-sm font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-100">
          {wine.vintage ?? "NV"}
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-slate-600 dark:text-slate-300">{wine.color ?? wine.wineType ?? "Type non renseigne"}</span>
        <span className="font-semibold text-red-700 dark:text-red-300">{wine.quantity} bouteille{wine.quantity > 1 ? "s" : ""}</span>
      </div>
    </button>
  );
}

function StatusMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
      {children}
    </div>
  );
}
