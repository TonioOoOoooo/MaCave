export type Wine = {
  id: number;
  viniouId: string | null;
  wineType: string | null;
  country: string | null;
  region: string | null;
  subRegion: string | null;
  appellation: string | null;
  appellationType: string | null;
  classification: string | null;
  estate: string | null;
  cuvee: string | null;
  vintage: number | null;
  alcohol: number | null;
  quantity: number;
  cellar: string | null;
  location: string | null;
  position: string | null;
  color: string | null;
  youthMin: number | null;
  youthMax: number | null;
  maturityMin: number | null;
  maturityMax: number | null;
  peakMin: number | null;
  peakMax: number | null;
  declineMin: number | null;
  declineMax: number | null;
  agingPhases: string | null;
  range: string | null;
  comments: string | null;
  lastPurchaseDate: string | null;
  lastPurchaseUnitPrice: number | null;
  purchaseTotalPrice: number | null;
  marketUnitPrice: number | null;
  totalValue: number | null;
  priceTrend: string | null;
  packagingType: string | null;
  purchaseType: string | null;
  purchasePlace: string | null;
  lastOutDate: string | null;
  lastOutNote: string | null;
  myLists: string | null;
  grapes: string | null;
  lists: string | null;
  customField: string | null;
  bottleImagePath: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TastingNote = {
  id: number;
  wineId: number;
  tastingDate: string | null;
  rating: number | null;
  note: string;
  context: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WineEnrichment = {
  id: number;
  wineId: number | null;
  viniouId: string;
  serviceTemperature: string | null;
  recommendedAeration: string | null;
  peakText: string | null;
  stockAmount: number | null;
  marketStockValue: number | null;
  addedValue: number | null;
  marketPriceMonth: string | null;
  consumptionStatus: string | null;
  consumedQuantity: number | null;
  foodPairing1Name: string | null;
  foodPairing1Description: string | null;
  foodPairing2Name: string | null;
  foodPairing2Description: string | null;
  foodPairing3Name: string | null;
  foodPairing3Description: string | null;
  viniouReview: string | null;
  viniouReviewDate: string | null;
  imageUrl: string | null;
  attachedFiles: string | null;
  criticNotes: string | null;
  viniouSheetUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DashboardWine = {
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

export type DashboardCount = {
  label: string;
  count: number;
};

export type DashboardResponse = {
  totals: {
    bottles: number;
    wines: number;
    value: number;
    stockValue: number;
    addedValue: number;
    avgPurchasePrice: number;
  };
  phaseCounts: {
    youth: number;
    maturity: number;
    peak: number;
    decline: number;
  };
  latestEntries: DashboardWine[];
  latestOutputs: DashboardWine[];
  drinkReadyWines: DashboardWine[];
  tranquilleColorCounts: DashboardCount[];
  effervescentCounts: DashboardCount[];
  regionCounts: DashboardCount[];
  regionDrilldown: Record<string, DashboardCount[]>;
  grapeCounts: DashboardCount[];
  vintageRanges: DashboardCount[];
  peakYearCounts: DashboardCount[];
  rangeCounts: DashboardCount[];
  cellarCounts: DashboardCount[];
  packagingCounts: DashboardCount[];
  purchaseTypeCounts: DashboardCount[];
  recentWines: DashboardWine[];
};

export type WinesQuery = {
  page: number;
  pageSize: number;
  search?: string;
  filters?: Record<string, string>;
  sortBy?: "region" | "vintage" | "quantity";
  sortOrder?: "asc" | "desc";
};

export type WinesResponse = {
  items: Wine[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  sortBy: string;
  sortOrder: string;
};

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "";

export async function listWines(query: WinesQuery): Promise<WinesResponse> {
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize)
  });

  if (query.search?.trim()) {
    params.set("search", query.search.trim());
  }

  if (query.filters && Object.keys(query.filters).length > 0) {
    params.set("filters", JSON.stringify(query.filters));
  }

  if (query.sortBy) {
    params.set("sortBy", query.sortBy);
  }

  if (query.sortOrder) {
    params.set("sortOrder", query.sortOrder);
  }

  return request<WinesResponse>(`/api/wines?${params.toString()}`);
}

export function getDashboard(): Promise<DashboardResponse> {
  return request<DashboardResponse>("/api/dashboard");
}

export function getWine(id: number): Promise<Wine> {
  return request<Wine>(`/api/wines/${id}`);
}

export function consumeWine(id: number): Promise<Wine> {
  return request<Wine>(`/api/wines/${id}/consume`, { method: "POST" });
}

export function updateWine(id: number, input: Partial<Pick<Wine, "quantity" | "totalValue">>): Promise<Wine> {
  return request<Wine>(`/api/wines/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });
}

export function listTastingNotes(wineId: number): Promise<TastingNote[]> {
  return request<TastingNote[]>(`/api/wines/${wineId}/tasting-notes`);
}

export function getWineEnrichment(wineId: number): Promise<WineEnrichment | null> {
  return request<WineEnrichment | null>(`/api/wines/${wineId}/enrichment`);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      Accept: "application/json",
      ...init?.headers
    },
    ...init
  });

  if (!response.ok) {
    const fallback = `HTTP ${response.status}`;
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error ?? fallback);
  }

  return response.json() as Promise<T>;
}
