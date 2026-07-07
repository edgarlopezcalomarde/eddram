/**
 * Assembles the publishable `dist/` folder for the `eddram` CLI package:
 * the bundled server (already built by `bun build` before this script runs),
 * the drizzle migrations, the built web app, and a standalone package.json
 * with no workspace dependencies (everything is inlined into dist/cli.js).
 */
import { cpSync, existsSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const serverRoot = resolve(import.meta.dir, "..");
const repoRoot = resolve(serverRoot, "../..");
const distDir = resolve(serverRoot, "dist");

const cliBundle = resolve(distDir, "cli.js");
if (!existsSync(cliBundle)) {
  throw new Error("dist/cli.js no existe: ejecuta `bun build` antes de este script.");
}

const drizzleSrc = resolve(serverRoot, "drizzle");
cpSync(drizzleSrc, resolve(distDir, "drizzle"), { recursive: true });

const webDistSrc = resolve(serverRoot, "../web/dist");
if (!existsSync(webDistSrc)) {
  throw new Error(
    "apps/web/dist no existe: ejecuta `bun run --cwd apps/web build` primero.",
  );
}
cpSync(webDistSrc, resolve(distDir, "web"), { recursive: true });

cpSync(resolve(repoRoot, "LICENSE"), resolve(distDir, "LICENSE"));
cpSync(resolve(repoRoot, "README.md"), resolve(distDir, "README.md"));

const serverPkg = await Bun.file(resolve(serverRoot, "package.json")).json();

const publishedPkg = {
  name: "@edgarlopezcalomarde/eddram",
  version: serverPkg.version,
  description:
    "Constructor visual de esquemas y diagramas ASCII. Instala el paquete y ejecuta `eddram` para abrirlo en tu navegador.",
  license: "MIT",
  author: "Edgar Lopez Calomarde",
  type: "module",
  bin: { eddram: "./cli.js" },
  engines: { bun: ">=1.2" },
  keywords: ["ascii", "diagram", "cli", "elysia", "bun"],
};

writeFileSync(resolve(distDir, "package.json"), JSON.stringify(publishedPkg, null, 2) + "\n");

console.log("apps/server/dist/ listo para publicar (cli.js + drizzle/ + web/ + package.json).");
