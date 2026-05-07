import { parseFile } from "@fast-csv/parse";
import { eq } from "drizzle-orm";
import { db } from "../db.js";
import { clean, parseFrenchDate, parseFrenchNumber, parseInteger } from "../parse.js";
import { wineEnrichments, type NewWineEnrichment } from "../schema.js";
import { findWineForEnrichment } from "./wine-enrichment.service.js";

export type EnrichmentImportResult = {
  read: number;
  created: number;
  updated: number;
  skipped: number;
};

export async function importEnrichmentsCsv(filePath: string): Promise<EnrichmentImportResult> {
  const rows = await readCsvRows(filePath);
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const viniouId = clean(row["Identifiant"]);
    if (!viniouId) {
      skipped += 1;
      continue;
    }

    const now = new Date().toISOString();
    const existing = db.select({ id: wineEnrichments.id, createdAt: wineEnrichments.createdAt })
      .from(wineEnrichments)
      .where(eq(wineEnrichments.viniouId, viniouId))
      .get();
    const wine = findWineForEnrichment(viniouId);
    const enrichment = mapEnrichmentRow(row, viniouId, wine?.id ?? null, existing?.createdAt ?? now, now);

    if (existing) {
      db.update(wineEnrichments).set(enrichment).where(eq(wineEnrichments.id, existing.id)).run();
      updated += 1;
      continue;
    }

    db.insert(wineEnrichments).values(enrichment).run();
    created += 1;
  }

  return { read: rows.length, created, updated, skipped };
}

function mapEnrichmentRow(
  row: Record<string, string>,
  viniouId: string,
  wineId: number | null,
  createdAt: string,
  updatedAt: string
): NewWineEnrichment {
  return {
    wineId,
    viniouId,
    serviceTemperature: clean(row["Température Service"]),
    recommendedAeration: clean(row["Aération Recommandée"]),
    peakText: clean(row["Apogée (texte)"]),
    stockAmount: parseFrenchNumber(row["Montant Stock (€)"]),
    marketStockValue: parseFrenchNumber(row["Valeur Stock Marché (€)"]),
    addedValue: parseFrenchNumber(row["Plus-Value (€)"]),
    marketPriceMonth: clean(row["Mois Prix Marché"]),
    consumptionStatus: clean(row["Statut Consommation"]),
    consumedQuantity: parseInteger(row["Quantité Consommée"]) ?? null,
    foodPairing1Name: clean(row["Accord Plat 1 - Nom"]),
    foodPairing1Description: clean(row["Accord Plat 1 - Description"]),
    foodPairing2Name: clean(row["Accord Plat 2 - Nom"]),
    foodPairing2Description: clean(row["Accord Plat 2 - Description"]),
    foodPairing3Name: clean(row["Accord Plat 3 - Nom"]),
    foodPairing3Description: clean(row["Accord Plat 3 - Description"]),
    viniouReview: clean(row["Avis Viniou"]),
    viniouReviewDate: parseFrenchDate(row["Date Avis Viniou"]),
    imageUrl: clean(row["URL Image"]),
    attachedFiles: clean(row["Fichiers Associés"]),
    criticNotes: clean(row["Notes Critiques"]),
    viniouSheetUrl: clean(row["Lien Fiche VINOU"]),
    createdAt,
    updatedAt
  };
}

function readCsvRows(filePath: string): Promise<Array<Record<string, string>>> {
  const rows: Array<Record<string, string>> = [];

  return new Promise((resolve, reject) => {
    parseFile(filePath, {
      headers: (headers) => headers.map((header, index) => {
        const value = header ?? "";
        return index === 0 ? value.replace(/^\uFEFF/, "") : value;
      }),
      delimiter: ",",
      trim: true,
      ignoreEmpty: true,
      encoding: "utf8"
    })
      .on("error", reject)
      .on("data", (row) => rows.push(row))
      .on("end", () => resolve(rows));
  });
}
