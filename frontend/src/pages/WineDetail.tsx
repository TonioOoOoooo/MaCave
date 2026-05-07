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
  const title = wine.estate || wine.cuvee || wine.appellation || "Vin sans nom";
  const origin = [wine.region, wine.appellation, wine.country].filter(Boolean).join(" - ") || "Origine non renseignée";
  const grapes = splitGrapes(wine.grapes);
  const phases = [
    { key: "youth", label: "Jeunesse", value: displayRange(wine.youthMin, wine.youthMax) },
    { key: "maturity", label: "Maturité", value: displayRange(wine.maturityMin, wine.maturityMax) },
    { key: "peak", label: "Apogée", value: displayRange(wine.peakMin, wine.peakMax) },
    { key: "decline", label: "Déclin", value: displayRange(wine.declineMin, wine.declineMax) }
  ];

  return (
    <section className="space-y-4">
      <BackButton onBack={onBack} />

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-red-700 dark:text-red-300">{origin}</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-normal text-slate-950 dark:text-slate-50 sm:text-3xl">{title}</h2>
            <p className="mt-2 text-base text-slate-700 dark:text-slate-200">{displayValue(wine.cuvee)}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge>{displayYear(wine.vintage)}</Badge>
              <Badge>{wine.quantity} bouteille{wine.quantity > 1 ? "s" : ""}</Badge>
              <Badge>{displayValue(wine.agingPhases)}</Badge>
            </div>
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
          <Fact label="Stock restant" value={`${wine.quantity}`} />
          <Fact label="Prix marché" value={displayCurrency(wine.marketUnitPrice)} />
          <Fact label="Valeur stock" value={displayCurrency(wine.totalValue)} />
          <Fact label="Apogée" value={displayRange(wine.peakMin, wine.peakMax)} />
        </dl>
      </div>

      <InfoPanel title="Phases de vieillissement">
        <div className="grid gap-3 sm:grid-cols-4">
          {phases.map((phase) => (
            <div
              key={phase.key}
              className={`rounded-md border p-3 ${
                isCurrentPhase(wine.agingPhases, phase.key, phase.label)
                  ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40"
                  : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950"
              }`}
            >
              <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">{phase.label}</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{phase.value}</p>
            </div>
          ))}
        </div>
      </InfoPanel>

      <div className="grid gap-4 lg:grid-cols-2">
        <InfoPanel title="Informations vin">
          <InfoGrid>
            <InfoRow label="Conditionnement" value={wine.packagingType} />
            <InfoRow label="Type" value={wine.wineType} />
            <InfoRow label="Couleur" value={wine.color} />
            <InfoRow label="Pays" value={wine.country} />
            <InfoRow label="Type d'appellation" value={wine.appellationType} />
            <InfoRow label="Appellation" value={wine.appellation} />
            <InfoRow label="Région" value={wine.region} />
            <InfoRow label="Sous-région" value={wine.subRegion} />
            <InfoRow label="Classification" value={wine.classification} />
            <InfoRow label="Domaine" value={wine.estate} />
            <InfoRow label="Cuvée" value={wine.cuvee} />
            <InfoRow label="Millésime" value={displayYear(wine.vintage)} />
            <InfoRow label="Alcool" value={displayAlcohol(wine.alcohol)} />
          </InfoGrid>
        </InfoPanel>

        <InfoPanel title="Détails">
          <InfoGrid>
            <InfoRow label="Gamme" value={wine.range} />
            <InfoRow label="Phase de vieillissement" value={wine.agingPhases} />
            <InfoRow label="Tendance prix" value={wine.priceTrend} />
            <InfoRow label="Champ personnalisé" value={wine.customField} />
            <InfoRow label="Mes listes" value={wine.myLists} />
            <InfoRow label="Listes" value={wine.lists} />
          </InfoGrid>
        </InfoPanel>

        <InfoPanel title="Cépages">
          {grapes.length > 0 ? (
            <div className="space-y-2">
              {grapes.map((grape) => (
                <div key={grape} className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-800 dark:bg-slate-800 dark:text-slate-100">
                  {grape}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-300">Non renseigné</p>
          )}
        </InfoPanel>

        <InfoPanel title="Stockage">
          <InfoGrid>
            <InfoRow label="Cave" value={wine.cellar} />
            <InfoRow label="Emplacement" value={wine.location} />
            <InfoRow label="Position" value={wine.position} />
            <InfoRow label="Quantité" value={wine.quantity} />
          </InfoGrid>
        </InfoPanel>

        <InfoPanel title="Achat et prix marché">
          <InfoGrid>
            <InfoRow label="Dernier achat" value={wine.lastPurchaseDate} />
            <InfoRow label="Prix unitaire achat" value={displayCurrency(wine.lastPurchaseUnitPrice)} />
            <InfoRow label="Prix total achat" value={displayCurrency(wine.purchaseTotalPrice)} />
            <InfoRow label="Prix unitaire marché" value={displayCurrency(wine.marketUnitPrice)} />
            <InfoRow label="Valeur totale" value={displayCurrency(wine.totalValue)} />
            <InfoRow label="Type d'achat" value={wine.purchaseType} />
            <InfoRow label="Lieu d'achat" value={wine.purchasePlace} />
          </InfoGrid>
        </InfoPanel>

        <InfoPanel title="Dernière sortie">
          {wine.lastOutDate || wine.lastOutNote ? (
            <InfoGrid>
              <InfoRow label="Date" value={wine.lastOutDate} />
              <InfoRow label="Note" value={wine.lastOutNote} />
            </InfoGrid>
          ) : (
            <p className="text-sm text-slate-600 dark:text-slate-300">Aucune sortie renseignée.</p>
          )}
        </InfoPanel>

        <InfoPanel title="Commentaires">
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200">
            {wine.comments || "Aucun commentaire."}
          </p>
        </InfoPanel>

        <InfoPanel title="Notes de dégustation">
          {notesQuery.isLoading ? <p className="text-sm text-slate-600 dark:text-slate-300">Chargement...</p> : null}
          {notesQuery.data?.length === 0 ? <p className="text-sm text-slate-600 dark:text-slate-300">Aucune note de dégustation.</p> : null}
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

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-slate-100 px-2.5 py-1 text-sm font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-100">
      {children}
    </span>
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

function InfoGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2">{children}</div>;
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
  return value === null || value === undefined || value === "" ? "Non renseigné" : String(value);
}

function displayYear(value: number | null) {
  return value === null || value === 0 ? "Non renseigné" : String(value);
}

function displayRange(min: number | null, max: number | null) {
  const normalizedMin = min === 0 ? null : min;
  const normalizedMax = max === 0 ? null : max;

  if (normalizedMin === null && normalizedMax === null) return "Non renseigné";
  if (normalizedMin === normalizedMax || normalizedMax === null) return String(normalizedMin);
  if (normalizedMin === null) return String(normalizedMax);
  return `${normalizedMin} - ${normalizedMax}`;
}

function displayCurrency(value: number | null) {
  if (value === null || value === 0) return "Non renseigné";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value);
}

function displayAlcohol(value: number | null) {
  if (value === null || value === 0) return "Non renseigné";
  return `${value}%`;
}

function splitGrapes(value: string | null) {
  if (!value?.trim()) return [];

  return value
    .split(",")
    .map((grape) => grape.trim())
    .filter(Boolean);
}

function isCurrentPhase(agingPhases: string | null, key: string, label: string) {
  const normalized = agingPhases?.toLowerCase() ?? "";
  if (!normalized) return false;

  const aliases: Record<string, string[]> = {
    youth: ["youth", "jeunesse"],
    maturity: ["maturity", "maturité", "maturite"],
    peak: ["peak", "apogée", "apogee"],
    decline: ["decline", "déclin", "declin"]
  };

  return [label.toLowerCase(), ...(aliases[key] ?? [])].some((value) => normalized.includes(value));
}
