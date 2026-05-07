import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { consumeWine, getWine, listTastingNotes, type Wine } from "../api/client";
import { ArrowLeft, Minus } from "../components/icons";

type WineDetailProps = {
  wineId: number;
  onBack: () => void;
};

export function WineDetail({ wineId, onBack }: WineDetailProps) {
  const queryClient = useQueryClient();
  const wineQuery = useQuery({
    queryKey: ["wine", wineId],
    queryFn: () => getWine(wineId)
  });
  const notesQuery = useQuery({
    queryKey: ["tasting-notes", wineId],
    queryFn: () => listTastingNotes(wineId)
  });
  const consumeMutation = useMutation({
    mutationFn: () => consumeWine(wineId),
    onSuccess: (wine) => {
      queryClient.setQueryData(["wine", wineId], wine);
      queryClient.invalidateQueries({ queryKey: ["wines"] });
    }
  });

  if (wineQuery.isLoading) {
    return <StatusMessage>Chargement du detail...</StatusMessage>;
  }

  if (wineQuery.isError || !wineQuery.data) {
    return (
      <section className="space-y-4">
        <BackButton onBack={onBack} />
        <StatusMessage>Impossible de charger ce vin.</StatusMessage>
      </section>
    );
  }

  const wine = wineQuery.data;
  const title = [wine.estate, wine.cuvee].filter(Boolean).join(" - ") || wine.appellation || "Vin sans nom";

  return (
    <section className="space-y-4">
      <BackButton onBack={onBack} />

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-red-700 dark:text-red-300">{[wine.region, wine.country].filter(Boolean).join(" - ") || "Origine non renseignee"}</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-normal text-slate-950 dark:text-slate-50">{title}</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{[wine.appellation, wine.classification, wine.color].filter(Boolean).join(" - ") || "Informations principales non renseignees"}</p>
          </div>
          <button
            type="button"
            onClick={() => consumeMutation.mutate()}
            disabled={wine.quantity <= 0 || consumeMutation.isPending}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-red-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-600 dark:hover:bg-red-500 dark:focus:ring-offset-slate-950"
          >
            <Minus />
            Consommer
          </button>
        </div>

        {consumeMutation.isError ? <p className="mt-3 text-sm font-medium text-red-700 dark:text-red-300">{consumeMutation.error.message}</p> : null}

        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Fact label="Stock" value={`${wine.quantity}`} />
          <Fact label="Millesime" value={displayValue(wine.vintage)} />
          <Fact label="Apogee" value={displayRange(wine.peakMin, wine.peakMax)} />
          <Fact label="Valeur" value={displayCurrency(wine.totalValue)} />
        </dl>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <InfoPanel title="Cave">
          <InfoRow label="Emplacement" value={[wine.cellar, wine.location, wine.position].filter(Boolean).join(" - ")} />
          <InfoRow label="Cepages" value={wine.grapes} />
          <InfoRow label="Commentaires" value={wine.comments} />
        </InfoPanel>

        <InfoPanel title="Notes de degustation">
          {notesQuery.isLoading ? <p className="text-sm text-slate-600 dark:text-slate-300">Chargement...</p> : null}
          {notesQuery.data?.length === 0 ? <p className="text-sm text-slate-600 dark:text-slate-300">Aucune note.</p> : null}
          <div className="space-y-3">
            {notesQuery.data?.map((note) => (
              <article key={note.id} className="border-t border-slate-200 pt-3 first:border-t-0 first:pt-0 dark:border-slate-800">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-slate-800 dark:text-slate-100">{note.tastingDate ?? "Date non renseignee"}</span>
                  {note.rating !== null ? <span className="font-semibold text-red-700 dark:text-red-300">{note.rating}/20</span> : null}
                </div>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{note.note}</p>
              </article>
            ))}
          </div>
        </InfoPanel>
      </div>
    </section>
  );
}

function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      <ArrowLeft />
      Retour
    </button>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-slate-100 p-3 dark:bg-slate-800">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-50">{value}</dd>
    </div>
  );
}

function InfoPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-base font-semibold text-slate-950 dark:text-slate-50">{title}</h3>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: Wine[keyof Wine] | string | null }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{displayValue(value)}</p>
    </div>
  );
}

function StatusMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
      {children}
    </div>
  );
}

function displayValue(value: unknown) {
  return value === null || value === undefined || value === "" ? "Non renseigne" : String(value);
}

function displayRange(min: number | null, max: number | null) {
  if (min === null && max === null) return "Non renseigne";
  if (min === max || max === null) return String(min);
  if (min === null) return String(max);
  return `${min} - ${max}`;
}

function displayCurrency(value: number | null) {
  if (value === null) return "Non renseigne";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value);
}
