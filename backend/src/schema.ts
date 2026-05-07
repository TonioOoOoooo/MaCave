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

export const winesRelations = relations(wines, ({ many }) => ({
  tastingNotes: many(tastingNotes)
}));

export const tastingNotesRelations = relations(tastingNotes, ({ one }) => ({
  wine: one(wines, {
    fields: [tastingNotes.wineId],
    references: [wines.id]
  })
}));

export type Wine = typeof wines.$inferSelect;
export type NewWine = typeof wines.$inferInsert;
export type TastingNote = typeof tastingNotes.$inferSelect;
export type NewTastingNote = typeof tastingNotes.$inferInsert;
