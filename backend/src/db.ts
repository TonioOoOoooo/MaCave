import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { resolveDatabasePath } from "./config.js";
import { initSql } from "./migrations.js";
import * as schema from "./schema.js";

const databasePath = resolveDatabasePath();

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

export const sqlite = new Database(databasePath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

export function migrate() {
  sqlite.exec(initSql);
}
