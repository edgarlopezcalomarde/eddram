import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { resolve } from "node:path";

import { db } from "./index";

export function runMigrations(): void {
  const migrationsFolder = process.env.MIGRATIONS_DIR
    ? resolve(process.env.MIGRATIONS_DIR)
    : resolve(import.meta.dir, "../../drizzle");
  migrate(db, { migrationsFolder });
}

if (import.meta.main) {
  runMigrations();
  console.log("Migrations applied.");
}
