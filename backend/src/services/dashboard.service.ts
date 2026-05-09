import { desc } from "drizzle-orm";
import { db } from "../db.js";
import { wineEnrichments, wines, type Wine, type WineEnrichment } from "../schema.js";

type DashboardWine = {
  id: number;
  estate: string | null;
  cuvee: string | null;
  appellation: string | null;
  region: string | null;
  country: string | null;
  vintage: number | null;
  quantity: number;
  color: string | null;
  wineType: string | null;
  agingPhases: string | null;
  grapes: string | null;
  cellar: string | null;
  packagingType: string | null;
  purchaseType: string | null;
  lastPurchaseDate: string | null;
  lastOutDate: string | null;
  lastOutNote: string | null;
  totalValue: number | null;
  marketUnitPrice: number | null;
  imageUrl: string | null;
};

export function getDashboard() {
  const allWines = db.select().from(wines).all();
  const enrichments = db.select().from(wineEnrichments).all();
  const enrichmentsByViniouId = new Map(enrichments.map((enrichment) => [enrichment.viniouId, enrichment]));
  const enrichedWines = allWines.map((wine) => ({
    wine,
    enrichment: wine.viniouId ? enrichmentsByViniouId.get(wine.viniouId) ?? null : null
  }));

  const totalBottles = sum(enrichedWines.map(({ wine }) => wine.quantity));
  const totalValue = sum(enrichedWines.map(({ wine, enrichment }) => enrichment?.marketStockValue ?? wine.totalValue ?? 0));
  const stockValue = sum(enrichedWines.map(({ wine, enrichment }) => enrichment?.stockAmount ?? wine.purchaseTotalPrice ?? 0));
  const addedValue = sum(enrichedWines.map(({ enrichment }) => enrichment?.addedValue ?? 0));
  const purchaseTotalPriceSum = sum(allWines.map((wine) => wine.purchaseTotalPrice ?? 0));
  const bottlesWithPurchasePrice = sum(allWines.map((wine) => (wine.purchaseTotalPrice != null && wine.purchaseTotalPrice > 0) ? wine.quantity : 0));
  const avgPurchasePrice = bottlesWithPurchasePrice > 0 ? purchaseTotalPriceSum / bottlesWithPurchasePrice : 0;

  return {
    totals: {
      bottles: totalBottles,
      wines: allWines.length,
      value: totalValue,
      stockValue,
      addedValue,
      avgPurchasePrice
    },
    phaseCounts: countByPhase(allWines),
    latestEntries: enrichedWines
      .filter(({ wine }) => Boolean(wine.lastPurchaseDate))
      .sort((a, b) => compareDateDesc(a.wine.lastPurchaseDate, b.wine.lastPurchaseDate))
      .slice(0, 5)
      .map(({ wine, enrichment }) => toDashboardWine(wine, enrichment)),
    latestOutputs: enrichedWines
      .filter(({ wine }) => Boolean(wine.lastOutDate))
      .sort((a, b) => compareDateDesc(a.wine.lastOutDate, b.wine.lastOutDate))
      .slice(0, 5)
      .map(({ wine, enrichment }) => toDashboardWine(wine, enrichment)),
    drinkReadyWines: enrichedWines
      .filter(({ wine }) => isDrinkReady(wine.agingPhases) && wine.quantity > 0)
      .sort((a, b) => b.wine.quantity - a.wine.quantity)
      .slice(0, 8)
      .map(({ wine, enrichment }) => toDashboardWine(wine, enrichment)),
    tranquilleColorCounts: countBy(allWines.filter((w) => !isEffervescent(w)), (wine) => normalizeColor(wine.color ?? wine.wineType)),
    effervescentCounts: countBy(allWines.filter((w) => isEffervescent(w)), (wine) => normalizeColor(wine.color ?? wine.wineType)),
    regionCounts: countBy(allWines, (wine) => wine.region ?? "Non renseignée"),
    regionDrilldown: buildRegionDrilldown(allWines),
    grapeCounts: countGrapes(allWines),
    vintageRanges: countVintageRanges(allWines),
    peakYearCounts: countPeakYears(allWines),
    rangeCounts: countBy(allWines, (wine) => wine.range ?? "Non renseignée"),
    cellarCounts: countBy(allWines, (wine) => wine.cellar ?? "Non renseignée"),
    packagingCounts: countBy(allWines, (wine) => wine.packagingType ?? "Non renseigné"),
    purchaseTypeCounts: countBy(allWines, (wine) => wine.purchaseType ?? "Non renseigné"),
    recentWines: db.select().from(wines).orderBy(desc(wines.createdAt)).limit(6).all().map((wine) => {
      const enrichment = wine.viniouId ? enrichmentsByViniouId.get(wine.viniouId) ?? null : null;
      return toDashboardWine(wine, enrichment);
    })
  };
}

function toDashboardWine(wine: Wine, enrichment: WineEnrichment | null): DashboardWine {
  return {
    id: wine.id,
    estate: wine.estate,
    cuvee: wine.cuvee,
    appellation: wine.appellation,
    region: wine.region,
    country: wine.country,
    vintage: wine.vintage,
    quantity: wine.quantity,
    color: wine.color,
    wineType: wine.wineType,
    agingPhases: wine.agingPhases,
    grapes: wine.grapes,
    cellar: wine.cellar,
    packagingType: wine.packagingType,
    purchaseType: wine.purchaseType,
    lastPurchaseDate: wine.lastPurchaseDate,
    lastOutDate: wine.lastOutDate,
    lastOutNote: wine.lastOutNote,
    totalValue: wine.totalValue,
    marketUnitPrice: wine.marketUnitPrice,
    imageUrl: getUsableImageUrl(enrichment?.imageUrl ?? null)
  };
}

function countByPhase(allWines: Wine[]) {
  const counts = {
    youth: 0,
    maturity: 0,
    peak: 0,
    decline: 0
  };

  for (const wine of allWines) {
    const phase = wine.agingPhases?.toLowerCase() ?? "";
    if (phase.includes("jeunesse")) counts.youth += wine.quantity;
    else if (phase.includes("matur")) counts.maturity += wine.quantity;
    else if (phase.includes("apog")) counts.peak += wine.quantity;
    else if (phase.includes("déclin") || phase.includes("declin")) counts.decline += wine.quantity;
  }

  return counts;
}

function countBy(allWines: Wine[], getKey: (wine: Wine) => string) {
  const counts = new Map<string, number>();
  for (const wine of allWines) {
    const key = getKey(wine);
    counts.set(key, (counts.get(key) ?? 0) + wine.quantity);
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "fr"))
    .slice(0, 12);
}

function countGrapes(allWines: Wine[]) {
  const counts = new Map<string, number>();
  for (const wine of allWines) {
    for (const grape of splitGrapes(wine.grapes)) {
      counts.set(grape, (counts.get(grape) ?? 0) + wine.quantity);
    }
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "fr"))
    .slice(0, 10);
}

function countVintageRanges(allWines: Wine[]) {
  const ranges = [
    { label: "<2000", count: 0 },
    { label: "2000-2010", count: 0 },
    { label: "2010-2020", count: 0 },
    { label: ">2020", count: 0 },
    { label: "Non millésimé", count: 0 }
  ];

  for (const wine of allWines) {
    if (!wine.vintage) ranges[4].count += wine.quantity;
    else if (wine.vintage < 2000) ranges[0].count += wine.quantity;
    else if (wine.vintage <= 2010) ranges[1].count += wine.quantity;
    else if (wine.vintage <= 2020) ranges[2].count += wine.quantity;
    else ranges[3].count += wine.quantity;
  }

  return ranges;
}

function splitGrapes(value: string | null) {
  if (!value) return [];
  return value.split(",").map((grape) => grape.trim().replace(/\s+\d+%$/, "")).filter(Boolean);
}

function isEffervescent(wine: Wine) {
  return (wine.wineType ?? "").toLowerCase().includes("effervescent");
}

function normalizeColor(value: string | null) {
  const normalized = value?.toLowerCase() ?? "";
  if (normalized.includes("rouge")) return "Rouge";
  if (normalized.includes("blanc")) return "Blanc";
  if (normalized.includes("rosé") || normalized.includes("rose")) return "Rosé";
  if (normalized.includes("champagne") || normalized.includes("effervescent")) return "Effervescent";
  return value ?? "Non renseigné";
}

function isDrinkReady(value: string | null) {
  const normalized = value?.toLowerCase() ?? "";
  return normalized.includes("matur") || normalized.includes("apog");
}

function compareDateDesc(a: string | null, b: string | null) {
  return new Date(b ?? 0).getTime() - new Date(a ?? 0).getTime();
}

function getUsableImageUrl(value: string | null) {
  return value?.startsWith("http://") || value?.startsWith("https://") ? value : null;
}

function countPeakYears(allWines: Wine[]): Array<{ label: string; count: number }> {
  const y0 = new Date().getFullYear();
  const y1 = y0 + 1;
  const y2 = y0 + 2;

  const buckets = [
    { label: `<${y0}`, count: 0 },
    { label: String(y0), count: 0 },
    { label: String(y1), count: 0 },
    { label: String(y2), count: 0 },
    { label: `>${y2}`, count: 0 }
  ];

  for (const wine of allWines) {
    if (wine.peakMax == null || wine.quantity <= 0) continue;
    if (wine.peakMax < y0) buckets[0].count += wine.quantity;
    else if (wine.peakMax === y0) buckets[1].count += wine.quantity;
    else if (wine.peakMax === y1) buckets[2].count += wine.quantity;
    else if (wine.peakMax === y2) buckets[3].count += wine.quantity;
    else buckets[4].count += wine.quantity;
  }

  return buckets;
}

function buildRegionDrilldown(allWines: Wine[]): Record<string, Array<{ label: string; count: number }>> {
  const regionMap = new Map<string, Map<string, number>>();

  for (const wine of allWines) {
    const region = wine.region ?? "Non renseignée";
    if (!regionMap.has(region)) regionMap.set(region, new Map());
    const appellationMap = regionMap.get(region)!;
    const appellation = wine.appellation ?? "Non renseignée";
    appellationMap.set(appellation, (appellationMap.get(appellation) ?? 0) + wine.quantity);
  }

  const result: Record<string, Array<{ label: string; count: number }>> = {};
  for (const [region, appellationMap] of regionMap.entries()) {
    result[region] = [...appellationMap.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "fr"))
      .slice(0, 8);
  }

  return result;
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}
