import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

import * as schema from "./schema";

const dbFile = resolve(
  process.env.DB_FILE ?? resolve(import.meta.dir, "../../data/eddram.db"),
);
mkdirSync(dirname(dbFile), { recursive: true });

const sqlite = new Database(dbFile);
sqlite.exec("PRAGMA journal_mode = WAL;");

export const db = drizzle(sqlite, { schema });
