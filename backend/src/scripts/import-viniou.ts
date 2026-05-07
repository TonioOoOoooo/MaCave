import path from "node:path";
import { importsDir } from "../config.js";
import { migrate } from "../db.js";
import { importViniouCsv } from "../services/import-viniou.service.js";

migrate();

const filePath = process.argv[2] ?? path.resolve(importsDir, "viniou.csv");

importViniouCsv(filePath)
  .then((result) => {
    console.log(`Import terminé: ${result.read} lignes lues, ${result.created} créées, ${result.updated} mises à jour.`);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
