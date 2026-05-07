import { relations } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const wines = sqliteTable("wines", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  viniouId: text("viniou_id"),
  wineType: text("wine_type"),
  country: text("country"),
  region: text("region"),
  subRegion: text("sub_region"),
  appellation: text("appellation"),
  appellationType: text("appellation_type"),
  classification: text("classification"),
  estate: text("estate"),
  cuvee: text("cuvee"),
  vintage: integer("vintage"),
  alcohol: real("alcohol"),
  quantity: integer("quantity").notNull().default(0),
  cellar: text("cellar"),
  location: text("location"),
  position: text("position"),
  color: text("color"),
  youthMin: integer("youth_min"),
  youthMax: integer("youth_max"),
  maturityMin: integer("maturity_min"),
  maturityMax: integer("maturity_max"),
  peakMin: integer("peak_min"),
  peakMax: integer("peak_max"),
  declineMin: integer("decline_min"),
  declineMax: integer("decline_max"),
  agingPhases: text("aging_phases"),
  range: text("range"),
  comments: text("comments"),
  lastPurchaseDate: text("last_purchase_date"),
  lastPurchaseUnitPrice: real("last_purchase_unit_price"),
  purchaseTotalPrice: real("purchase_total_price"),
  marketUnitPrice: real("market_unit_price"),
  totalValue: real("total_value"),
  priceTrend: text("price_trend"),
  packagingType: text("packaging_type"),
  purchaseType: text("purchase_type"),
  purchasePlace: text("purchase_place"),
  lastOutDate: text("last_out_date"),
  lastOutNote: text("last_out_note"),
  myLists: text("my_lists"),
  grapes: text("grapes"),
  lists: text("lists"),
  customField: text("custom_field"),
  bottleImagePath: text("bottle_image_path"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const tastingNotes = sqliteTable("tasting_notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  wineId: integer("wine_id")
    .notNull()
    .references(() => wines.id, { onDelete: "cascade" }),
  tastingDate: text("tasting_date"),
  rating: real("rating"),
  note: text("note").notNull(),
  context: text("context"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const wineEnrichments = sqliteTable("wine_enrichments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  wineId: integer("wine_id").references(() => wines.id, { onDelete: "set null" }),
  viniouId: text("viniou_id").notNull(),
  serviceTemperature: text("service_temperature"),
  recommendedAeration: text("recommended_aeration"),
  peakText: text("peak_text"),
  stockAmount: real("stock_amount"),
  marketStockValue: real("market_stock_value"),
  addedValue: real("added_value"),
  marketPriceMonth: text("market_price_month"),
  consumptionStatus: text("consumption_status"),
  consumedQuantity: integer("consumed_quantity"),
  foodPairing1Name: text("food_pairing_1_name"),
  foodPairing1Description: text("food_pairing_1_description"),
  foodPairing2Name: text("food_pairing_2_name"),
  foodPairing2Description: text("food_pairing_2_description"),
  foodPairing3Name: text("food_pairing_3_name"),
  foodPairing3Description: text("food_pairing_3_description"),
  viniouReview: text("viniou_review"),
  viniouReviewDate: text("viniou_review_date"),
  imageUrl: text("image_url"),
  attachedFiles: text("attached_files"),
  criticNotes: text("critic_notes"),
  viniouSheetUrl: text("viniou_sheet_url"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const winesRelations = relations(wines, ({ many }) => ({
  tastingNotes: many(tastingNotes),
  enrichments: many(wineEnrichments)
}));

export const tastingNotesRelations = relations(tastingNotes, ({ one }) => ({
  wine: one(wines, {
    fields: [tastingNotes.wineId],
    references: [wines.id]
  })
}));

export const wineEnrichmentsRelations = relations(wineEnrichments, ({ one }) => ({
  wine: one(wines, {
    fields: [wineEnrichments.wineId],
    references: [wines.id]
  })
}));

export type Wine = typeof wines.$inferSelect;
export type NewWine = typeof wines.$inferInsert;
export type TastingNote = typeof tastingNotes.$inferSelect;
export type NewTastingNote = typeof tastingNotes.$inferInsert;
export type WineEnrichment = typeof wineEnrichments.$inferSelect;
export type NewWineEnrichment = typeof wineEnrichments.$inferInsert;
