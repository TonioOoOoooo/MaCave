import { eq, or } from "drizzle-orm";
import { db } from "../db.js";
import { wineEnrichments, wines } from "../schema.js";
import { getWineById } from "./wine.service.js";

export function getWineEnrichment(wineId: number) {
  const wine = getWineById(wineId);

  const conditions = [eq(wineEnrichments.wineId, wineId)];
  if (wine.viniouId) conditions.push(eq(wineEnrichments.viniouId, wine.viniouId));

  return db.select().from(wineEnrichments).where(or(...conditions)).get() ?? null;
}

export function findWineForEnrichment(viniouId: string) {
  return db.select({ id: wines.id }).from(wines).where(eq(wines.viniouId, viniouId)).get() ?? null;
}
