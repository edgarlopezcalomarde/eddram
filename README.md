# EDDRAM

Constructor visual de esquemas y diagramas **ASCII**: dibuja cajas, flechas,
árboles de directorios, tablas y separadores sobre una rejilla monoespaciada
y copia el resultado listo para pegar en Markdown, READMEs, documentación
técnica, comentarios de código o prompts de IA.

```
┌──────────┐      ╭───────────╮      ╔════════════╗
│  Cajas   │─────▶│ Conectores│─────▶║  Markdown  ║
└──────────┘      ╰───────────╯      ╚════════════╝
```

## Stack

TypeScript · Bun · Elysia · Drizzle (bun:sqlite) · Vite 8 · React 19 ·
Tailwind 4 · react-router · TanStack Query · Axios · satteri · react-call ·
shadcn/ui

## Estructura

```
eddram/
├── apps/
│   ├── server/          # API Elysia + Drizzle + SQLite
│   │   ├── drizzle/     # migraciones generadas por drizzle-kit
│   │   └── src/
│   │       ├── db/      # schema, conexión, migrate, seed
│   │       └── routes/  # /api/schemas, /api/templates
│   └── web/             # SPA React
│       └── src/
│           ├── api/     # axios + funciones tipadas por recurso
│           ├── hooks/   # TanStack Query (queries/mutations optimistas)
│           ├── editor/  # lienzo, paleta, inspector, autoguardado, undo/redo
│           └── pages/   # /, /schemas, /editor/:id?, /templates
├── packages/
│   ├── shared/          # tipos compartidos + motor ASCII (puro, con tests)
│   └── ui/              # componentes shadcn/ui
└── turbo.json
```

## Uso como CLI

EDDRAM se publica como paquete de npm bajo licencia MIT. Instálalo de forma
global y ejecuta `eddram` desde cualquier terminal: arranca el servidor y
abre la aplicación en tu navegador por defecto.

```sh
bun add -g @edgarlopezcalomarde/eddram
eddram
```

También puede ejecutarse sin instalar con `bunx @edgarlopezcalomarde/eddram`.

Opciones: `eddram --port 4000` (puerto distinto) y `eddram --no-open` (no
abrir el navegador). Los esquemas se guardan en `~/.eddram/eddram.db`.

### Publicar una nueva versión (mantenedores)

```sh
bun run --cwd apps/server release:build   # build del web + bundle del cli + assets en apps/server/dist
cd apps/server/dist
bun publish --access public
```

`release:build` bundlea el servidor y sus dependencias (incluido
`@workspace/shared`) en un único `dist/cli.js` con `bun build --target bun`,
así que el paquete publicado no depende de los workspaces del monorepo.

## Puesta en marcha

Requiere [Bun](https://bun.sh) ≥ 1.2.

```sh
bun install

# base de datos (se crea en apps/server/data/eddram.db)
bun run db:migrate   # aplica migraciones
bun run db:seed      # carga las plantillas

# desarrollo: server (http://localhost:3000) + web (http://localhost:5173)
bun run dev
```

El cliente de Vite proxya `/api` hacia el servidor, así que basta con abrir
<http://localhost:5173>. Las migraciones y el seed también se ejecutan
automáticamente al arrancar el servidor (son idempotentes).

### Otros comandos

```sh
bun run test        # tests del motor ASCII (bun test)
bun run typecheck   # tsc en todos los workspaces
bun run lint        # eslint
bun run db:generate # regenerar migraciones tras cambiar el schema de Drizzle
```

### Producción

```sh
bun run build                                  # build del frontend
cd apps/server && NODE_ENV=production bun run start
```

En producción Elysia sirve el build estático de `apps/web/dist` (con
fallback SPA) además de la API en el mismo puerto.

## Notas de diseño

- **Motor ASCII** (`packages/shared/src/ascii-engine/`): módulo puro y
  testeable, separado por completo de React. Pinta cada elemento en una
  matriz de caracteres respetando el orden z; las intersecciones de líneas
  se resuelven mediante máscaras de conectividad (`┼`, `├`, `┬`…) y el
  output recorta espacios a la derecha y filas vacías finales. El servidor
  reutiliza el mismo motor para renderizar las previews de las plantillas.
- **Charsets**: cada esquema se guarda como lista de elementos, no como
  texto, por lo que alternar entre ASCII puro (`+-|`) y Unicode
  box-drawing (`┌─┐`) es una conversión sin pérdida.
- **Autoguardado**: debounce de ~2 s sobre un contador de versión del
  reducer; los updates usan mutations de TanStack Query con actualización
  optimista de caché (`onMutate`) y rollback en caso de error.
- **Undo/redo**: pilas de snapshots en el reducer del editor; los gestos de
  arrastre y las sesiones de escritura colapsan en un único paso de
  deshacer (Ctrl+Z / Ctrl+Shift+Z).
- **Dependencia WASM**: la preview de Markdown usa el build WASM de satteri
  (`@bruits/satteri-wasm32-wasi`), instalado vía tarball porque el paquete
  declara `cpu: none` y bun lo omitiría en una instalación normal.
