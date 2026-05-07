import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  consumeWine,
  getWine,
  getWineEnrichment,
  listTastingNotes,
  updateWine,
  type Wine,
  type WineEnrichment
} from "../api/client";
import heroVineyard from "../assets/hero-vineyard.png";
import { ArrowLeft, Minus } from "../components/icons";

type WineDetailProps = {
  wineId: number;
  onBack: () => void;
};

type DisplayValue = string | number | null | undefined;

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
  const enrichmentQuery = useQuery({
    queryKey: ["wine-enrichment", wineId],
    queryFn: () => getWineEnrichment(wineId)
  });
  const consumeMutation = useMutation({
    mutationFn: () => consumeWine(wineId),
    onSuccess: (wine) => {
      queryClient.setQueryData(["wine", wineId], wine);
      queryClient.invalidateQueries({ queryKey: ["wines"] });
    }
  });
  const addBottleMutation = useMutation({
    mutationFn: (wine: Wine) => {
      const quantity = wine.quantity + 1;
      const totalValue = calculateTotalValue(wine, quantity);
      return updateWine(wine.id, { quantity, totalValue });
    },
    onSuccess: (wine) => {
      queryClient.setQueryData(["wine", wineId], wine);
      queryClient.invalidateQueries({ queryKey: ["wines"] });
    }
  });

  if (wineQuery.isLoading) {
    return <StatusMessage>Chargement du détail...</StatusMessage>;
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
  const enrichment = enrichmentQuery.data ?? null;
  const title = wine.estate || wine.cuvee || wine.appellation || "Vin sans nom";
  const origin = [wine.region, wine.appellation, wine.country].filter(Boolean).join(" - ") || "Origine non renseignée";
  const imageUrl = getUsableImageUrl(enrichment?.imageUrl ?? null);
  const foodPairings = getFoodPairings(enrichment);
  const grapes = splitGrapes(wine.grapes);
  const phases = [
    { key: "youth", label: "Jeunesse", value: displayRange(wine.youthMin, wine.youthMax), min: wine.youthMin, max: wine.youthMax },
    { key: "maturity", label: "Maturité", value: displayRange(wine.maturityMin, wine.maturityMax), min: wine.maturityMin, max: wine.maturityMax },
    { key: "peak", label: "Apogée", value: displayRange(wine.peakMin, wine.peakMax), min: wine.peakMin, max: wine.peakMax },
    { key: "decline", label: "Déclin", value: displayRange(wine.declineMin, wine.declineMax), min: wine.declineMin, max: wine.declineMax }
  ];
  const currentPhase = wine.agingPhases;

  return (
    <section className="space-y-5">
      <BackButton onBack={onBack} />

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="relative h-40 bg-slate-900 sm:h-48">
          <img src={heroVineyard} alt="" className="absolute inset-0 h-full w-full object-cover" aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-950/10 to-slate-950/45" />
        </div>

        <div className="px-5 pb-5 sm:px-7 sm:pb-7">
          <div className="relative -mt-20 flex justify-center">
            <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-lg dark:border-slate-900 dark:bg-slate-950 sm:h-44 sm:w-44">
              {imageUrl ? (
                <img src={imageUrl} alt={title} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <div className="px-4 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Ma Cave</p>
                  <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{wine.color || wine.wineType || "Profil vin"}</p>
                </div>
              )}
            </div>
          </div>

          <div className="mx-auto mt-4 max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">{origin}</p>
            <h2 className="mt-2 text-3xl font-semibold leading-tight text-slate-950 dark:text-slate-50 sm:text-4xl">{title}</h2>
            {wine.cuvee ? <p className="mt-2 text-lg text-slate-700 dark:text-slate-200">{wine.cuvee}</p> : null}
            <p className="mt-1 text-2xl font-semibold text-slate-600 dark:text-slate-300">{displayYear(wine.vintage)}</p>
          </div>

          <WineStatusBand wine={wine} currentPhase={currentPhase} consumedQuantity={enrichment?.consumedQuantity ?? null} />

          <div className="mx-auto mt-5 grid max-w-lg gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
            <button
              type="button"
              onClick={() => addBottleMutation.mutate(wine)}
              disabled={addBottleMutation.isPending}
              className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              Nouvelle entrée
            </button>
            <div className="hidden h-9 w-px bg-slate-200 dark:bg-slate-800 sm:block" />
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Confirmer la sortie d'une bouteille ? Cette action modifie le stock.")) {
                  consumeMutation.mutate();
                }
              }}
              disabled={wine.quantity <= 0 || consumeMutation.isPending}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-800 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-red-700 dark:hover:bg-red-600 dark:focus:ring-offset-slate-950"
            >
              <Minus />
              Sortir une bouteille
            </button>
          </div>
          {consumeMutation.isError ? <p className="mt-3 text-center text-sm font-medium text-red-700 dark:text-red-300">{consumeMutation.error.message}</p> : null}
          {addBottleMutation.isError ? <p className="mt-3 text-center text-sm font-medium text-red-700 dark:text-red-300">{addBottleMutation.error.message}</p> : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <RecommendationCard enrichment={enrichment} wine={wine} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard label="Valeur stock" value={displayCurrency(enrichment?.stockAmount ?? wine.purchaseTotalPrice ?? wine.totalValue)} />
          <MetricCard label="Valeur marché" value={displayCurrency(enrichment?.marketStockValue ?? wine.totalValue)} />
          <MetricCard label="Plus-value" value={displayCurrency(enrichment?.addedValue ?? null)} />
          <MetricCard label="Prix marché" value={displayCurrency(wine.marketUnitPrice)} />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)] lg:items-start">
        <div className="space-y-5">
          <Panel title="Profil du vin">
            <InfoList>
              <InfoRow label="Domaine" value={wine.estate} />
              <InfoRow label="Cuvée" value={wine.cuvee} />
              <InfoRow label="Appellation" value={wine.appellation} />
              <InfoRow label="Classification" value={wine.classification} />
              <InfoRow label="Région" value={wine.region} />
              <InfoRow label="Sous-région" value={wine.subRegion} />
              <InfoRow label="Pays" value={wine.country} />
              <InfoRow label="Type" value={wine.wineType} />
              <InfoRow label="Couleur" value={wine.color} />
              <InfoRow label="Millésime" value={displayYear(wine.vintage)} />
              <InfoRow label="Alcool" value={displayAlcohol(wine.alcohol)} />
              <InfoRow label="Conditionnement" value={wine.packagingType} />
              <InfoRow label="Gamme" value={wine.range} />
              <InfoRow label="Tendance prix" value={wine.priceTrend} />
              <InfoRow label="Champ personnalisé" value={wine.customField} />
            </InfoList>
          </Panel>

          <Panel title="Cépages">
            {grapes.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {grapes.map((grape) => (
                  <span key={grape} className="rounded-full bg-red-50 px-3 py-1.5 text-sm font-medium text-red-900 dark:bg-red-950/50 dark:text-red-100">
                    {grape}
                  </span>
                ))}
              </div>
            ) : (
              <EmptyMessage>Aucun cépage renseigné.</EmptyMessage>
            )}
          </Panel>

          <Panel title="Stockage">
            <InfoList>
              <InfoRow label="Cave" value={wine.cellar} />
              <InfoRow label="Emplacement" value={wine.location} />
              <InfoRow label="Position" value={wine.position} />
              <InfoRow label="Quantité restante" value={wine.quantity} essential />
            </InfoList>
          </Panel>

          <Panel title="Achat et marché">
            <InfoList>
              <InfoRow label="Dernier achat" value={wine.lastPurchaseDate} />
              <InfoRow label="Prix unitaire achat" value={displayCurrency(wine.lastPurchaseUnitPrice)} />
              <InfoRow label="Prix total achat" value={displayCurrency(wine.purchaseTotalPrice)} />
              <InfoRow label="Prix unitaire marché" value={displayCurrency(wine.marketUnitPrice)} />
              <InfoRow label="Valeur stock marché" value={displayCurrency(enrichment?.marketStockValue ?? wine.totalValue)} />
              <InfoRow label="Plus-value" value={displayCurrency(enrichment?.addedValue ?? null)} />
              <InfoRow label="Mois prix marché" value={enrichment?.marketPriceMonth} />
              <InfoRow label="Type d'achat" value={wine.purchaseType} />
              <InfoRow label="Lieu d'achat" value={wine.purchasePlace} />
            </InfoList>
          </Panel>

          <Panel title="Accords plats">
            {foodPairings.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-3">
                {foodPairings.map((pairing) => (
                  <article key={pairing.name} className="rounded-lg border border-red-100 bg-red-50/60 p-4 dark:border-red-950 dark:bg-red-950/20">
                    <h3 className="text-base font-semibold text-slate-950 dark:text-slate-50">{pairing.name}</h3>
                    {pairing.description ? <p className="mt-2 text-sm leading-6 text-slate-700 dark:text-slate-200">{pairing.description}</p> : null}
                  </article>
                ))}
              </div>
            ) : (
              <EmptyMessage>Aucun accord plat renseigné.</EmptyMessage>
            )}
          </Panel>

          <Panel title="Avis Viniou">
            {enrichment?.viniouReview ? (
              <div className="max-w-3xl space-y-4">
                <p className="whitespace-pre-wrap text-base leading-8 text-slate-700 dark:text-slate-200">{enrichment.viniouReview}</p>
                <div className="flex flex-col gap-2 border-t border-slate-200 pt-4 text-sm dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                  {enrichment.viniouSheetUrl ? (
                    <a className="font-semibold text-red-700 hover:underline dark:text-red-300" href={enrichment.viniouSheetUrl} target="_blank" rel="noreferrer">
                      Ouvrir la fiche Viniou
                    </a>
                  ) : <span />}
                  {enrichment.viniouReviewDate ? <span className="text-slate-500 dark:text-slate-400">Avis du {enrichment.viniouReviewDate}</span> : null}
                </div>
              </div>
            ) : (
              <EmptyMessage>Aucun avis Viniou renseigné.</EmptyMessage>
            )}
          </Panel>
        </div>

        <aside className="space-y-5">
          <Panel title="Sorties">
            {wine.lastOutDate || wine.lastOutNote || enrichment?.consumptionStatus || enrichment?.consumedQuantity !== null ? (
              <InfoList>
                <InfoRow label="Statut" value={enrichment?.consumptionStatus} />
                <InfoRow label="Quantité consommée" value={enrichment?.consumedQuantity} />
                <InfoRow label="Dernière sortie" value={wine.lastOutDate} />
                <InfoRow label="Note de sortie" value={wine.lastOutNote} />
              </InfoList>
            ) : (
              <EmptyMessage>Aucune sortie renseignée.</EmptyMessage>
            )}
          </Panel>

          <Panel title="Phases de vieillissement">
            <AgingCurve phases={phases} agingPhases={wine.agingPhases} />
          </Panel>

          <Panel title="Image et critiques">
            {imageUrl ? (
              <a className="mb-4 block overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800" href={imageUrl} target="_blank" rel="noreferrer">
                <img src={imageUrl} alt={title} className="max-h-72 w-full object-cover" loading="lazy" />
              </a>
            ) : null}
            {enrichment?.criticNotes || enrichment?.attachedFiles ? (
              <div className="space-y-3">
                {enrichment.criticNotes ? <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200">{enrichment.criticNotes}</p> : null}
                <InfoList>
                  <InfoRow label="Fichiers associés" value={enrichment.attachedFiles} />
                </InfoList>
              </div>
            ) : (
              <EmptyMessage>Aucune note critique renseignée.</EmptyMessage>
            )}
          </Panel>

          <Panel title="Commentaires">
            {wine.comments ? (
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200">{wine.comments}</p>
            ) : (
              <EmptyMessage>Aucun commentaire.</EmptyMessage>
            )}
          </Panel>

          <Panel title="Notes de dégustation">
            {notesQuery.isLoading ? <EmptyMessage>Chargement...</EmptyMessage> : null}
            {notesQuery.data?.length === 0 ? <EmptyMessage>Aucune note de dégustation.</EmptyMessage> : null}
            <div className="space-y-3">
              {notesQuery.data?.map((note) => (
                <article key={note.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-slate-800 dark:text-slate-100">{note.tastingDate ?? "Date non renseignée"}</span>
                    {note.rating !== null ? <span className="font-semibold text-red-700 dark:text-red-300">{note.rating}/20</span> : null}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{note.note}</p>
                </article>
              ))}
            </div>
          </Panel>
        </aside>
      </div>
    </section>
  );
}

function RecommendationCard({ enrichment, wine }: { enrichment: WineEnrichment | null; wine: Wine }) {
  const hasRecommendation = Boolean(enrichment?.serviceTemperature || enrichment?.recommendedAeration || enrichment?.peakText || enrichment?.consumptionStatus);

  return (
    <Panel title="Recommandation de service" elevated>
      {hasRecommendation ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <RecommendationItem label="Température" value={enrichment?.serviceTemperature} />
          <RecommendationItem label="Aération" value={enrichment?.recommendedAeration} />
          <RecommendationItem label="Apogée" value={enrichment?.peakText || displayRange(wine.peakMin, wine.peakMax)} />
          <RecommendationItem label="Statut" value={enrichment?.consumptionStatus || wine.agingPhases} />
        </div>
      ) : (
        <EmptyMessage>Aucune recommandation enrichie disponible.</EmptyMessage>
      )}
    </Panel>
  );
}

function RecommendationItem({ label, value }: { label: string; value: DisplayValue }) {
  return (
    <div className="rounded-lg bg-red-50 p-3 dark:bg-red-950/30">
      <p className="text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-50">{displayValue(value)}</p>
    </div>
  );
}

function WineStatusBand({
  wine,
  currentPhase,
  consumedQuantity
}: {
  wine: Wine;
  currentPhase: string | null;
  consumedQuantity: number | null;
}) {
  return (
    <div className="mx-auto mt-6 grid max-w-4xl overflow-hidden rounded-md bg-slate-800 text-center text-white shadow-sm dark:bg-slate-950 sm:grid-cols-3">
      <StatusCell label="Restantes" value={`${wine.quantity}`} helper={`bouteille${wine.quantity > 1 ? "s" : ""}`} />
      <StatusCell label="Phase actuelle" value={currentPhase || "Non renseigné"} strong />
      <StatusCell label="Consommées" value={consumedQuantity ?? "Non renseigné"} />
    </div>
  );
}

function StatusCell({ label, value, helper, strong = false }: { label: string; value: DisplayValue; helper?: string; strong?: boolean }) {
  return (
    <div className="border-b border-white/10 px-4 py-4 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <p className={`${strong ? "text-sm" : "text-3xl"} font-semibold leading-tight`}>{displayValue(value)}</p>
      <p className="mt-1 text-xs font-medium text-slate-200">{label}</p>
      {helper ? <p className="mt-0.5 text-xs text-slate-300">{helper}</p> : null}
    </div>
  );
}

function AgingCurve({
  phases,
  agingPhases
}: {
  phases: Array<{ key: string; label: string; value: string; min: number | null; max: number | null }>;
  agingPhases: string | null;
}) {
  const years = phases.flatMap((phase) => [normalizeYear(phase.min), normalizeYear(phase.max)]).filter((year): year is number => year !== null);
  const currentYear = new Date().getFullYear();
  const minYear = years.length ? Math.min(...years, currentYear) : currentYear - 2;
  const maxYear = years.length ? Math.max(...years, currentYear) : currentYear + 8;
  const span = Math.max(1, maxYear - minYear);
  const currentX = 8 + ((currentYear - minYear) / span) * 84;
  const points = [
    { x: 8, y: 76 },
    { x: 30, y: 46 },
    { x: 54, y: 24 },
    { x: 72, y: 28 },
    { x: 92, y: 70 }
  ];
  const path = `M ${points.map((point) => `${point.x} ${point.y}`).join(" L ")}`;

  return (
    <div className="space-y-4">
      <svg className="h-36 w-full text-red-700 dark:text-red-300" viewBox="0 0 100 100" role="img" aria-label="Courbe de vieillissement du vin" preserveAspectRatio="none">
        <path d="M 8 82 L 92 82" className="stroke-slate-200 dark:stroke-slate-800" fill="none" strokeWidth="1.5" />
        <path d={`${path} L 92 82 L 8 82 Z`} className="fill-red-100/70 dark:fill-red-950/40" />
        <path d={path} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <line x1={currentX} x2={currentX} y1="16" y2="86" className="stroke-slate-900 dark:stroke-slate-100" strokeWidth="1.2" strokeDasharray="3 3" />
        <circle cx={currentX} cy="20" r="2.3" className="fill-slate-900 dark:fill-slate-100" />
        <text x={currentX} y="12" textAnchor="middle" className="fill-slate-700 text-[6px] font-semibold dark:fill-slate-200">
          {currentYear}
        </text>
      </svg>
      <div className="grid gap-2 sm:grid-cols-2">
        {phases.map((phase) => {
          const active = isCurrentPhase(agingPhases, phase.key, phase.label);
          return (
            <div
              key={phase.key}
              className={`rounded-md border px-3 py-2 ${
                active
                  ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40"
                  : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-950 dark:text-slate-50">{phase.label}</p>
                {active ? <span className="rounded-full bg-red-700 px-2 py-0.5 text-xs font-semibold text-white dark:bg-red-600">Actuel</span> : null}
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{phase.value}</p>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">Courbe indicative basée sur les plages d'années disponibles.</p>
    </div>
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

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-50">{value}</p>
    </div>
  );
}

function Panel({ title, children, elevated = false }: { title: string; children: React.ReactNode; elevated?: boolean }) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5 ${elevated ? "ring-1 ring-red-100 dark:ring-red-950" : ""}`}>
      <h3 className="text-lg font-semibold text-slate-950 dark:text-slate-50">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function InfoList({ children }: { children: React.ReactNode }) {
  return <dl className="grid gap-x-4 gap-y-3 sm:grid-cols-2">{children}</dl>;
}

function InfoRow({ label, value, essential = false }: { label: string; value: DisplayValue; essential?: boolean }) {
  if (!essential && isEmpty(value)) return null;

  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="mt-1 text-sm text-slate-800 dark:text-slate-100">{displayValue(value)}</dd>
    </div>
  );
}

function EmptyMessage({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-slate-600 dark:text-slate-300">{children}</p>;
}

function StatusMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
      {children}
    </div>
  );
}

function isEmpty(value: DisplayValue) {
  return value === null || value === undefined || value === "" || value === "Non renseigné";
}

function displayValue(value: DisplayValue) {
  return isEmpty(value) ? "Non renseigné" : String(value);
}

function displayYear(value: number | null) {
  return value === null || value === 0 ? "Non renseigné" : String(value);
}

function normalizeYear(value: number | null) {
  return value === null || value === 0 ? null : value;
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

function calculateTotalValue(wine: Wine, quantity: number) {
  const unitPrice = wine.marketUnitPrice ?? wine.lastPurchaseUnitPrice;
  return unitPrice !== null ? unitPrice * quantity : wine.totalValue;
}

function splitGrapes(value: string | null) {
  if (!value?.trim()) return [];

  return value
    .split(",")
    .map((grape) => grape.trim())
    .filter(Boolean);
}

function getFoodPairings(enrichment: WineEnrichment | null) {
  if (!enrichment) return [];

  return [
    { name: enrichment.foodPairing1Name, description: enrichment.foodPairing1Description },
    { name: enrichment.foodPairing2Name, description: enrichment.foodPairing2Description },
    { name: enrichment.foodPairing3Name, description: enrichment.foodPairing3Description }
  ].filter((pairing): pairing is { name: string; description: string | null } => Boolean(pairing.name));
}

function getUsableImageUrl(value: string | null) {
  return value?.startsWith("http://") || value?.startsWith("https://") ? value : null;
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
