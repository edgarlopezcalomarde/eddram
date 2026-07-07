#!/usr/bin/env bun
/**
 * Published bin entry (`eddram`): boots the server against a per-user data
 * dir and opens it in the default browser. Only used by the packaged CLI —
 * local dev keeps running `src/index.ts` directly.
 */
import { homedir } from "node:os";
import { resolve } from "node:path";

const HELP = `EDDRAM — constructor visual de esquemas ASCII

Uso: eddram [opciones]

Opciones:
  --port <numero>   Puerto en el que arrancar el servidor (por defecto 3000)
  --no-open         No abrir el navegador automáticamente
  -h, --help        Muestra esta ayuda
`;

function parseArgs(argv: string[]): { port?: number; open: boolean } {
  let port: number | undefined;
  let open = true;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--no-open") open = false;
    else if (arg === "--port") port = Number(argv[++i]);
    else if (arg?.startsWith("--port=")) port = Number(arg.slice("--port=".length));
    else if (arg === "-h" || arg === "--help") {
      console.log(HELP);
      process.exit(0);
    }
  }
  return { port, open };
}

async function openBrowser(url: string): Promise<void> {
  const cmd =
    process.platform === "win32"
      ? ["cmd", "/c", "start", "", url]
      : process.platform === "darwin"
        ? ["open", url]
        : ["xdg-open", url];
  try {
    Bun.spawn(cmd, { stdio: ["ignore", "ignore", "ignore"] });
  } catch {
    // best-effort: the URL is already printed, the user can open it by hand
  }
}

const { port, open } = parseArgs(process.argv.slice(2));

process.env.NODE_ENV ??= "production";
process.env.DB_FILE ??= resolve(homedir(), ".eddram", "eddram.db");
process.env.MIGRATIONS_DIR ??= resolve(import.meta.dir, "drizzle");
process.env.WEB_DIST_DIR ??= resolve(import.meta.dir, "web");
if (port) process.env.PORT = String(port);

const { startServer } = await import("./index");
startServer();

if (open) {
  const finalPort = Number(process.env.PORT ?? 3000);
  await openBrowser(`http://localhost:${finalPort}`);
}
