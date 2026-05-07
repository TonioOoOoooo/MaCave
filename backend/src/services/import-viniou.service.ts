import { parseFile } from "@fast-csv/parse";
import { eq } from "drizzle-orm";
import { db } from "../db.js";
import { mapViniouRow } from "../parse.js";
import { wines } from "../schema.js";
import { importedWineSchema } from "../validation.js";

export type ImportResult = {
  read: number;
  created: number;
  updated: number;
};

export async function importViniouCsv(filePath: string): Promise<ImportResult> {
  const rows = await readCsvRows(filePath);
  let created = 0;
  let updated = 0;

  for (const row of rows) {
    const wine = importedWineSchema.parse(mapViniouRow(row));

    if (wine.viniouId) {
      const existing = db.select({ id: wines.id }).from(wines).where(eq(wines.viniouId, wine.viniouId)).get();

      if (existing) {
        const { createdAt: _createdAt, ...updateData } = wine;

        db.update(wines)
          .set({ ...updateData, updatedAt: new Date().toISOString() })
          .where(eq(wines.id, existing.id))
          .run();

        updated += 1;
        continue;
      }
    }

    db.insert(wines).values(wine).run();
    created += 1;
  }

  return { read: rows.length, created, updated };
}

function readCsvRows(filePath: string): Promise<Array<Record<string, string>>> {
  const rows: Array<Record<string, string>> = [];

  return new Promise((resolve, reject) => {
    parseFile(filePath, {
      headers: true,
      delimiter: ";",
      trim: true,
      ignoreEmpty: true
    })
      .on("error", reject)
      .on("data", (row) => rows.push(row))
      .on("end", () => resolve(rows));
  });
}
