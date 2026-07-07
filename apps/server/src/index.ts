import { cors } from "@elysiajs/cors";
import { staticPlugin } from "@elysiajs/static";
import { Elysia } from "elysia";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { runMigrations } from "./db/migrate";
import { seedTemplates } from "./db/seed";
import { HttpError } from "./http-error";
import { schemasRoutes } from "./routes/schemas";
import { templatesRoutes } from "./routes/templates";

/**
 * Boots the server. Wrapped in a function (rather than run at import time)
 * so callers — the CLI bin in particular — can set env vars (DB_FILE,
 * WEB_DIST_DIR, ...) before any of this runs. Bundlers resolve local dynamic
 * imports eagerly, so relying on import-time side effects for ordering is
 * not safe once this file is bundled together with its caller.
 */
export function startServer(): void {
  const PORT = Number(process.env.PORT ?? 3000);

  // migrations + template seeding are idempotent, run them on boot
  runMigrations();
  seedTemplates();

  const app = new Elysia()
    .onError(({ error, code, set }) => {
      if (error instanceof HttpError) {
        set.status = error.statusCode;
        return { error: error.code, message: error.message };
      }
      if (code === "VALIDATION") {
        set.status = 422;
        // Elysia's ValidationError.message is a JSON dump; surface the summary
        const summary = error.all?.[0];
        return {
          error: "VALIDATION",
          message: (summary && "summary" in summary && summary.summary) || "Datos inválidos",
        };
      }
      if (code === "NOT_FOUND") {
        set.status = 404;
        return { error: "NOT_FOUND", message: "Ruta no encontrada" };
      }
      console.error(error);
      set.status = 500;
      return { error: "INTERNAL", message: "Error interno del servidor" };
    })
    .use(cors())
    .get("/api/health", () => ({ ok: true }))
    .use(schemasRoutes)
    .use(templatesRoutes);

  // When a built frontend is present (production/packaged runs; local dev
  // normally has no apps/web/dist), Elysia also serves it (SPA fallback
  // included). Deciding this from process.env.NODE_ENV instead is unsafe
  // once bundled: minifiers constant-fold NODE_ENV reads at bundle-init
  // time, so a later `process.env.NODE_ENV = ...` (e.g. from the CLI bin)
  // would never be observed here.
  const webDist = process.env.WEB_DIST_DIR
    ? resolve(process.env.WEB_DIST_DIR)
    : resolve(import.meta.dir, "../../web/dist");
  if (existsSync(webDist)) {
    app
      .use(staticPlugin({ assets: webDist, prefix: "/", indexHTML: true }))
      .get("*", () => Bun.file(resolve(webDist, "index.html")));
  }

  app.listen(PORT);

  console.log(`EDDRAM server escuchando en http://localhost:${PORT}`);
}

if (import.meta.main) startServer();
