# Prompt: Constructor de Esquemas ASCII

Actúa como un ingeniero de software senior full-stack. Quiero que construyas una aplicación web completa llamada **EDDRAM**: un constructor visual de esquemas y diagramas ASCII, pensado para generar diagramas de texto plano listos para pegar en Markdown, READMEs, documentación técnica, comentarios de código y prompts de IA.

## Stack tecnológico
Typescript + BunJS + Elysia + Drizzle + Sqlite(bun:sqlite) + Vite8 + React19 + Tailwind4.0 + react-router + Tanstack Query (queries, mutations, invalidación de caché, optimistic updates) + Axios + satteri (para interpretar/previsualizar markdown) + react-call (para crear modales)

**Estructura del proyecto:** monorepo con `apps/server` y `apps/web`, la estructura por defecto, esta creada usando shadcn/create.

## Funcionalidad principal

### 1. Editor de esquemas ASCII
- Un lienzo/editor central donde el usuario construye diagramas ASCII de forma visual (no escribiendo caracteres a mano).
- Elementos disponibles (paleta lateral):
  - **Cajas** con texto (bordes simples `+--+ | |`, dobles `╔══╗`, redondeados `╭──╮`, seleccionables por el usuario)
  - **Flechas y conectores**: `-->`, `<--`, `<-->`, `───▶`, `│`, `└──`, `├──`, verticales, horizontales y en L
  - **Árboles de directorios** (estilo `tree`: `├──`, `└──`, `│`)
  - **Tablas ASCII** (estilo Markdown y estilo box-drawing)
  - **Líneas de separación y títulos** (`====`, `----`, texto centrado)
  - **Texto libre**
- Los elementos se colocan sobre una **rejilla monoespaciada** (grid de caracteres): el usuario arrastra, mueve, redimensiona y edita el texto de cada elemento; la app renderiza todo como caracteres.
- **Vista previa en vivo** del resultado en texto plano dentro de un bloque `<pre>` con fuente monoespaciada, sincronizada con el lienzo.
- Selección de **charset**: ASCII puro (`+-|`) vs Unicode box-drawing (`┌─┐│└┘├┤┬┴┼`), con conversión entre ambos.
- Deshacer / rehacer (Ctrl+Z / Ctrl+Shift+Z).

### 2. Exportación
- Botón **"Copiar como Markdown"**: copia el diagrama envuelto en un bloque de código (``` ```) al portapapeles.
- Copiar como texto plano (sin fences).
- Descargar como `.md` o `.txt`.
- Opción de añadir un comentario de atribución opcional.

### 3. Plantillas
- Galería de plantillas predefinidas: arquitectura cliente-servidor, flujo de datos, árbol de carpetas de un proyecto, diagrama de secuencia simple, pipeline CI/CD, esquema de base de datos (tablas y relaciones).
- Al elegir una plantilla, se carga en el editor y es totalmente editable.

### 4. Persistencia (CRUD completo)
- Guardar, listar, abrir, renombrar, duplicar y eliminar esquemas.
- Autoguardado con debounce (~2 s) usando una mutation de TanStack Query con `useOptimistic` o `onMutate` para UI optimista.
- Página "Mis esquemas" con grid de tarjetas (shadcn `Card`), vista previa en miniatura del ASCII, fecha de modificación, búsqueda por nombre y ordenación.

## Modelo de datos (Drizzle + bun:sqlite)

```ts
// Tablas sugeridas
schemas: {
  id: texto (uuid o nanoid), pk
  name: texto, notNull
  description: texto, opcional
  content: texto (JSON serializado con los elementos del lienzo: tipo, posición x/y, tamaño, texto, estilo de borde)
  renderedOutput: texto (el ASCII final renderizado, para previews rápidas)
  charset: texto ('ascii' | 'unicode')
  createdAt / updatedAt: integer timestamp
}

templates: {
  id, name, category, content, renderedOutput
}
```

Incluye el archivo de configuración de Drizzle (`drizzle.config.ts`), el esquema en `src/db/schema.ts` y las migraciones con `drizzle-kit`. Usa el driver `drizzle-orm/bun-sqlite`.

## API (Elysia)

Endpoints REST bajo `/api`:
- `GET /api/schemas` — listar (con query params: `search`, `sort`)
- `GET /api/schemas/:id`
- `POST /api/schemas`
- `PUT /api/schemas/:id`
- `POST /api/schemas/:id/duplicate`
- `DELETE /api/schemas/:id`
- `GET /api/templates`

Requisitos:
- Validación de body y params con los schemas de tipos de Elysia (`t.Object`).
- Manejo de errores centralizado (`onError`) con respuestas JSON consistentes `{ error, message }`.
- CORS habilitado para el cliente en desarrollo (`@elysiajs/cors`).
- En producción, servir el build estático del frontend desde Elysia (`@elysiajs/static`).

## Frontend: rutas y arquitectura

Rutas con react-router:
- `/` — landing simple + botón "Crear esquema"
- `/schemas` — listado de esquemas guardados
- `/editor/:id?` — el editor (nuevo si no hay id)
- `/templates` — galería de plantillas

Arquitectura:
- Capa `src/api/` con la instancia de axios y funciones tipadas por recurso (`schemasApi.ts`, `templatesApi.ts`).
- Hooks de TanStack Query por recurso: `useSchemas()`, `useSchema(id)`, `useSaveSchema()`, `useDeleteSchema()`, con invalidación correcta de queries tras cada mutation.
- El estado del lienzo (elementos, selección, historial de undo/redo) vive en el cliente (useReducer o Zustand ligero si lo prefieres); TanStack Query solo gestiona persistencia.
- El **motor de renderizado ASCII** debe ser un módulo puro y testeable (`src/lib/ascii-engine/`): recibe la lista de elementos y devuelve el string final. Sepáralo completamente de React.
- Componentes shadcn a usar: `Button`, `Card`, `Dialog`, `DropdownMenu`, `Input`, `Tooltip`, `Tabs`, `Toaster` (react-hot-toast) para notificaciones, `Command` para búsqueda rápida.

## Detalles del motor ASCII (importante)

- Representa el lienzo como una matriz 2D de caracteres.
- Al renderizar, "pinta" cada elemento en la matriz respetando el orden z (los últimos pisan a los primeros).
- Resolución de intersecciones de líneas: cuando dos líneas se cruzan en modo Unicode, sustituir por el carácter de unión correcto (`┼`, `├`, `┬`, etc.).
- Recortar espacios sobrantes a la derecha y filas vacías al final del output.

## Calidad y entregables

1. Instrucciones de instalación y ejecución (`bun install`, `bun run dev` para server y client, script de migración).
2. Tipos compartidos entre cliente y servidor (carpeta `shared/` o export de tipos del server).
3. Diseño limpio, tema claro/oscuro con el toggle de shadcn, layout responsive (el editor puede requerir desktop; en móvil mostrar aviso amable).
4. Código comentado en las partes no triviales (motor ASCII, autoguardado, undo/redo).

Empieza mostrando la estructura de carpetas completa del proyecto, luego el backend (schema de Drizzle → API Elysia), después el motor ASCII, y finalmente el frontend. No omitas archivos de configuración (tsconfig, tailwind, vite/bunfig).