import { and, asc, count, desc, eq, like, or, type SQL } from "drizzle-orm";
import { db } from "../db.js";
import { HttpError } from "../http.js";
import { wines, type NewWine, type Wine } from "../schema.js";
import type { wineCreateSchema, wineQuerySchema, wineUpdateSchema } from "../validation.js";
import type { z } from "zod";

type WineQuery = z.infer<typeof wineQuerySchema>;
type WineCreateInput = z.infer<typeof wineCreateSchema>;
type WineUpdateInput = z.infer<typeof wineUpdateSchema>;

const filterColumns = {
  country: wines.country,
  region: wines.region,
  appellation: wines.appellation,
  color: wines.color,
  vintage: wines.vintage,
  agingPhases: wines.agingPhases,
  range: wines.range,
  cellar: wines.cellar,
  location: wines.location
} as const;

const sortColumns = {
  vintage: wines.vintage,
  totalValue: wines.totalValue,
  region: wines.region,
  quantity: wines.quantity,
  peakMin: wines.peakMin,
  createdAt: wines.createdAt
} as const;

export function listWines(query: WineQuery) {
  const where = buildWhere(query);
  const offset = (query.page - 1) * query.pageSize;
  const orderColumn = sortColumns[query.sortBy];
  const orderBy = query.sortOrder === "desc" ? desc(orderColumn) : asc(orderColumn);

  const items = db.select().from(wines).where(where).orderBy(orderBy).limit(query.pageSize).offset(offset).all();
  const total = db.select({ value: count() }).from(wines).where(where).get()?.value ?? 0;

  return {
    items,
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages: Math.ceil(total / query.pageSize),
    sortBy: query.sortBy,
    sortOrder: query.sortOrder
  };
}

export function getWineById(id: number) {
  const wine = db.select().from(wines).where(eq(wines.id, id)).get();
  if (!wine) throw new HttpError(404, "Wine not found");
  return wine;
}

export function createWine(input: WineCreateInput) {
  const now = new Date().toISOString();
  const values = normalizeWineInput(input, now, now);
  return db.insert(wines).values(values).returning().get();
}

export function updateWine(id: number, input: WineUpdateInput) {
  const current = getWineById(id);
  const next = normalizeWineInput({ ...current, ...input }, current.createdAt, new Date().toISOString());

  return db.update(wines).set(next).where(eq(wines.id, id)).returning().get();
}

export function deleteWine(id: number) {
  getWineById(id);
  db.delete(wines).where(eq(wines.id, id)).run();
}

export function consumeWine(id: number) {
  const wine = getWineById(id);
  if (wine.quantity <= 0) throw new HttpError(409, "No bottle left in stock");

  const quantity = wine.quantity - 1;
  const totalValue = wine.marketUnitPrice !== null ? wine.marketUnitPrice * quantity : wine.totalValue;

  return db.update(wines)
    .set({
      quantity,
      totalValue,
      lastOutDate: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString()
    })
    .where(eq(wines.id, id))
    .returning()
    .get();
}

function buildWhere(query: WineQuery) {
  const clauses: SQL[] = [];

  if (query.search) {
    const pattern = `%${query.search}%`;
    const searchClause = or(
      like(wines.estate, pattern),
      like(wines.cuvee, pattern),
      like(wines.appellation, pattern),
      like(wines.region, pattern),
      like(wines.country, pattern),
      like(wines.grapes, pattern),
      like(wines.comments, pattern)
    );

    if (searchClause) clauses.push(searchClause);
  }

  for (const [key, value] of Object.entries(query.filters)) {
    if (value === "" || value === null || value === undefined) continue;
    if (!(key in filterColumns)) continue;

    const column = filterColumns[key as keyof typeof filterColumns];
    clauses.push(eq(column as never, (key === "vintage" ? Number(value) : String(value)) as never));
  }

  return clauses.length ? and(...clauses) : undefined;
}

function normalizeWineInput(input: WineCreateInput | (Wine & WineUpdateInput), createdAt: string, updatedAt: string): NewWine {
  const quantity = Number(input.quantity ?? 0);
  const marketUnitPrice = input.marketUnitPrice ?? null;
  const totalValue = input.totalValue ?? (marketUnitPrice !== null ? marketUnitPrice * quantity : null);

  return {
    viniouId: input.viniouId ?? null,
    wineType: input.wineType ?? null,
    country: input.country ?? null,
    region: input.region ?? null,
    subRegion: input.subRegion ?? null,
    appellation: input.appellation ?? null,
    appellationType: input.appellationType ?? null,
    classification: input.classification ?? null,
    estate: input.estate ?? null,
    cuvee: input.cuvee ?? null,
    vintage: normalizeYear(input.vintage ?? null),
    alcohol: input.alcohol ?? null,
    quantity,
    cellar: input.cellar ?? null,
    location: input.location ?? null,
    position: input.position ?? null,
    color: input.color ?? null,
    youthMin: normalizeYear(input.youthMin ?? null),
    youthMax: normalizeYear(input.youthMax ?? null),
    maturityMin: normalizeYear(input.maturityMin ?? null),
    maturityMax: normalizeYear(input.maturityMax ?? null),
    peakMin: normalizeYear(input.peakMin ?? null),
    peakMax: normalizeYear(input.peakMax ?? null),
    declineMin: normalizeYear(input.declineMin ?? null),
    declineMax: normalizeYear(input.declineMax ?? null),
    agingPhases: input.agingPhases ?? null,
    range: input.range ?? null,
    comments: input.comments ?? null,
    lastPurchaseDate: input.lastPurchaseDate ?? null,
    lastPurchaseUnitPrice: input.lastPurchaseUnitPrice ?? null,
    purchaseTotalPrice: input.purchaseTotalPrice ?? null,
    marketUnitPrice,
    totalValue,
    priceTrend: input.priceTrend ?? null,
    packagingType: input.packagingType ?? null,
    purchaseType: input.purchaseType ?? null,
    purchasePlace: input.purchasePlace ?? null,
    lastOutDate: input.lastOutDate ?? null,
    lastOutNote: input.lastOutNote ?? null,
    myLists: input.myLists ?? null,
    grapes: input.grapes ?? null,
    lists: input.lists ?? null,
    customField: input.customField ?? null,
    bottleImagePath: input.bottleImagePath ?? null,
    createdAt,
    updatedAt
  };
}

function normalizeYear(value: number | null) {
  return value === 0 ? null : value;
}
