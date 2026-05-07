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

export type WinesQuery = {
  page: number;
  pageSize: number;
  search?: string;
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

  return request<WinesResponse>(`/api/wines?${params.toString()}`);
}

export function getWine(id: number): Promise<Wine> {
  return request<Wine>(`/api/wines/${id}`);
}

export function consumeWine(id: number): Promise<Wine> {
  return request<Wine>(`/api/wines/${id}/consume`, { method: "POST" });
}

export function listTastingNotes(wineId: number): Promise<TastingNote[]> {
  return request<TastingNote[]>(`/api/wines/${wineId}/tasting-notes`);
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
