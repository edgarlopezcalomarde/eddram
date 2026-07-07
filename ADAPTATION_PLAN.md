# Plan de Adaptación del Monorepo EDDRAM

## Estado Actual ✅

El monorepo está bien estructurado como una aplicación Bun fullstack publicable como CLI:

- **Arquitectura**: TypeScript · Bun · Elysia · React 19 · Tailwind 4 · Turbo
- **Publicación**: `@edgarlopezcalomarde/eddram` en npm via `bun publish`
- **Configuración actualizada**: versiones sincronizadas (0.1.0), metadatos coherentes, ESLint 9+ configurado
- **Soporte de múltiples hojas**: ya implementado en `editor-state.ts` con acciones completas

---

## Especificaciones a Implementar

### 1. CLI Publishing ✅ (Prácticamente Listo)
**Referencia**: `openspecs/specs/cmd-command/spec.md`

**Estado**:
- ✅ `apps/server/src/cli.ts` tiene shebang y argumentos (`--port`, `--no-open`)
- ✅ `apps/server/scripts/prepare-dist.ts` prepara `dist/` correctamente
- ✅ `release:build` bundlea todo en `dist/cli.js`
- ✅ Package.json publicable generado automáticamente

**Próximos pasos**:
1. Testear `bun run release:build` localmente
2. Asegurar que `~/.eddram/eddram.db` se crea y persiste
3. Validar que `bunx @edgarlopezcalomarde/eddram` funciona

---

### 2. Playground de Múltiples Hojas y Restricciones
**Referencia**: `openspecs/specs/playground-changes/spec.md`

**Requisitos**:
- No se puede agregar elementos fuera de la hoja
- Soporte para múltiples hojas
- Espaciado adaptado a la hoja (sin scroll en la miniatura)
- Minimap que muestre toda la hoja

**Estado Actual**:
- ✅ `EditorState` soporta `sheets: Sheet[]` con todas las acciones
- ✅ `clampElementToSheet()` en `editor-state.ts` limita posiciones
- ⚠️ UI necesita actualización para mostrar tabs de hojas
- ⚠️ Canvas necesita mostrar solo elementos de la hoja activa
- ⚠️ Minimap necesita ajustarse al contenido real

**Implementación Necesaria**:

#### A. UI de Gestión de Hojas
```typescript
// apps/web/src/editor/sheet-tabs.tsx (ya existe)
// Necesita:
- Tabs para cada hoja
- Botón de agregar hoja
- Menú de contexto (renombrar, eliminar)
- Mostrar indicador de hoja activa
```

#### B. Canvas Responsivo a Hoja Activa
```typescript
// En canvas.tsx:
- Filtrar elementos por `activeSheetId`
- Clamping automático al agregar/mover elementos
- Mostrar límites visuales de la hoja (gridlines opcionales)
```

#### C. Minimap Inteligente
```typescript
// apps/web/src/editor/minimap.tsx (ya existe)
// Necesita:
- Escalar contenido a la ventana sin scroll
- Mostrar ambos ejes (x, y) si el contenido es mayor
- Highlight de viewport actual
- Indicador de hoja activa
```

#### D. Inspector de Límites
```typescript
// Mostrar en el inspector:
- Tamaño de hoja: 120x48 chars
- Espacio disponible para elemento seleccionado
- Advertencia si elemento está en el borde
```

---

## Archivos a Revisar/Modificar

### Priority 1: UI de Hojas
- `apps/web/src/editor/sheet-tabs.tsx` — ✅ Ya existe, revisar implementación
- `apps/web/src/editor/canvas.tsx` — Filtrar elementos activos por hoja
- `apps/web/src/editor/minimap.tsx` — Escalar a viewport

### Priority 2: Validación y Límites
- `apps/web/src/editor/canvas.tsx` — Ampliar clamping visual
- `apps/web/src/editor/inspector.tsx` — Mostrar límites y espacio
- `packages/shared/src/ascii-engine/` — Validación en renderizado

### Priority 3: Templates y Server
- `apps/server/src/routes/templates.ts` — Serializar sheets completas
- `apps/server/src/db/seed.ts` — Cargar templates con múltiples hojas

---

## Cambios Realizados en Esta Sesión

### ✅ Configuración del Monorepo

1. **package.json raíz**:
   - Versión: `0.0.1` → `0.1.0`
   - Agregado: `description`, `license`, `engines.bun`

2. **apps/server/package.json**:
   - Nombre: `server` → `@edgarlopezcalomarde/eddram` (publicable)
   - Versión: `0.1.0`
   - Agregado: `description`, `license`, `author`

3. **apps/web, packages/ui, packages/shared**:
   - Versiones sincronizadas a `0.1.0`
   - Descripción y licencia agregadas

4. **Raíz**:
   - `eslint.config.js` — Configuración ESLint 9+ centralizada
   - `.gitignore` — Agregado `.eddram/` y `apps/server/data/`

---

## Próximos Pasos Recomendados

### Corto Plazo (Esta Semana)
1. Implementar/revisar `sheet-tabs.tsx` para UI de hojas
2. Asegurar que `canvas.tsx` filtra elementos por `activeSheetId`
3. Mejorar `minimap.tsx` para mostrar límites reales

### Mediano Plazo (Próximas 2 Semanas)
1. Testear build y publicación: `bun run release:build`
2. Publicar v0.1.0 en npm
3. Validar experiencia de CLI en sistemas locales

### Largo Plazo (Feature Backlog)
- Exportación/importación de hojas individuales
- Plantillas con múltiples hojas pre-configuradas
- Colaboración en tiempo real (si aplica)

---

## Comandos Útiles

```sh
# Desarrollo
bun run dev                              # Server + Web

# Build y publicación
bun run build                            # Build todo
bun run release:build                    # Preparar dist/ para npm
bun run db:migrate                       # Aplicar migraciones
bun run typecheck                        # Validar tipos TS
bun run test                             # Tests del motor

# Testing local del CLI
cd apps/server/dist
cat package.json  # Verificar name, bin, version
```

---

## Resumen

El monorepo está **bien posicionado** para ser publicado como CLI. Los cambios de configuración hechos aseguran:

✅ Versionado coherente  
✅ Metadatos correctos para publicación  
✅ ESLint centralizado  
✅ Infraestructura de hojas implementada  

⏳ Falta: UI e integración completa de múltiples hojas en el editor visual.
