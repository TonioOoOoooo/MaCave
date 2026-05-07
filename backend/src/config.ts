import path from "node:path";

export const projectRoot = process.env.PROJECT_ROOT
  ? path.resolve(process.env.PROJECT_ROOT)
  : path.basename(process.cwd()) === "backend"
    ? path.resolve(process.cwd(), "..")
    : process.cwd();

export const dataDir = path.resolve(projectRoot, "data");
export const importsDir = path.resolve(projectRoot, "imports");

export function resolveDatabasePath() {
  const databaseUrl = process.env.DATABASE_URL ?? "file:./data/cave.db";
  const rawPath = databaseUrl.replace(/^file:/, "");

  if (path.isAbsolute(rawPath)) {
    return rawPath;
  }

  return path.resolve(projectRoot, rawPath);
}
