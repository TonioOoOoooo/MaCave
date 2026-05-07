import path from "node:path";
import { dataDir } from "../config.js";
import { migrate } from "../db.js";
import { importEnrichmentsCsv } from "../services/import-enrichments.service.js";

migrate();

const filePath = process.argv[2] ?? path.resolve(dataDir, "macave_enrichments.csv");

importEnrichmentsCsv(filePath)
  .then((result) => {
    console.log(`Import enrichissements terminé: ${result.read} lignes lues, ${result.created} créées, ${result.updated} mises à jour, ${result.skipped} ignorées.`);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
