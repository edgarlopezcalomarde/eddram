/**
 * The ASCII rendering engine lives in `packages/shared` (pure, framework-free
 * and unit-tested with `bun test`) so the server can reuse it to render the
 * template previews. This module re-exports it for app-local imports.
 */
export * from "@workspace/shared/ascii-engine"
