import type { CanvasContent, SchemaDto, SchemaElement, Sheet } from "@workspace/shared"
import { renderElements } from "@workspace/shared"
import { Monitor, Redo2, Undo2 } from "lucide-react"
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react"
import { useLocation, useNavigate, useParams } from "react-router"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Tabs, TabsList, TabsTrigger } from "@workspace/ui/components/tabs"

import { Canvas } from "@/editor/canvas"
import {
  editorReducer,
  initialEditorState,
  type EditorState,
} from "@/editor/editor-state"
import { ExportMenu } from "@/editor/export-menu"
import { Inspector } from "@/editor/inspector"
import { Palette } from "@/editor/palette"
import { PreviewPanel } from "@/editor/preview-panel"
import { SheetTabs } from "@/editor/sheet-tabs"
import { useAutosave, type SaveStatus } from "@/editor/use-autosave"
import { useSchema } from "@/hooks/use-schemas"

/** Pre-multi-sheet schemas serialized a flat `{ elements }`; templates still do. */
interface LegacyCanvasContent {
  elements: SchemaElement[]
}

function newSheet(elements: SchemaElement[] = []): Sheet {
  return { id: crypto.randomUUID(), name: "Hoja 1", elements }
}

function parseContent(content: string): CanvasContent {
  try {
    const parsed = JSON.parse(content) as CanvasContent | LegacyCanvasContent
    if ("sheets" in parsed && Array.isArray(parsed.sheets)) return parsed
    if ("elements" in parsed && Array.isArray(parsed.elements)) {
      return { sheets: [newSheet(parsed.elements)] }
    }
    return { sheets: [newSheet()] }
  } catch {
    return { sheets: [newSheet()] }
  }
}

const STATUS_LABEL: Record<SaveStatus, string> = {
  idle: "",
  dirty: "Cambios sin guardar…",
  saving: "Guardando…",
  saved: "Guardado",
  error: "Error al guardar",
}

interface TemplateNavState {
  template?: { name: string; content: string }
}

export function EditorPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const { data: schema, isLoading, isError, error } = useSchema(id)
  const [state, dispatch] = useReducer(editorReducer, initialEditorState)

  // Which document the reducer currently holds, so background refetches of
  // the schema query never clobber unsaved editor state.
  const loadedRef = useRef<string | null>(null)
  const justCreatedRef = useRef<string | null>(null)

  useEffect(() => {
    if (!id) {
      const key = `new:${location.key}`
      if (loadedRef.current === key) return
      loadedRef.current = key
      const template = (location.state as TemplateNavState | null)?.template
      if (template) {
        // fresh sheet/element ids so duplicated template uses don't collide
        const { sheets } = parseContent(template.content)
        dispatch({
          type: "load",
          sheets: sheets.map((sheet) => ({
            ...sheet,
            id: crypto.randomUUID(),
            elements: sheet.elements.map((el) => ({ ...el, id: crypto.randomUUID() })),
          })),
          charset: "unicode",
          name: template.name,
          description: null,
          markDirty: true,
        })
      } else {
        dispatch({
          type: "load",
          sheets: [newSheet()],
          charset: "unicode",
          name: "Sin título",
          description: null,
        })
      }
      return
    }
    // right after autosave created the schema the reducer already has the
    // latest state; only the URL changed
    if (justCreatedRef.current === id) {
      loadedRef.current = id
      return
    }
    if (schema && loadedRef.current !== id) {
      loadedRef.current = id
      dispatch({
        type: "load",
        sheets: parseContent(schema.content).sheets,
        charset: schema.charset,
        name: schema.name,
        description: schema.description,
      })
    }
  }, [id, schema, location.key, location.state])

  const onCreated = useCallback(
    (created: SchemaDto) => {
      justCreatedRef.current = created.id
      void navigate(`/editor/${created.id}`, { replace: true })
    },
    [navigate],
  )

  const { status, saveNow } = useAutosave(id, state, onCreated)

  // global shortcuts: undo/redo/save (skipped while typing in a field)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey
      if (!mod) return
      const key = e.key.toLowerCase()
      const editing =
        e.target instanceof HTMLElement &&
        !!e.target.closest("input, textarea, [contenteditable='true']")
      if (key === "s") {
        e.preventDefault()
        saveNow()
      } else if (!editing && key === "z") {
        e.preventDefault()
        dispatch({ type: e.shiftKey ? "redo" : "undo" })
      } else if (!editing && key === "y") {
        e.preventDefault()
        dispatch({ type: "redo" })
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [saveNow])

  const activeElements = useMemo(
    () => state.sheets.find((s) => s.id === state.activeSheetId)?.elements ?? [],
    [state.sheets, state.activeSheetId],
  )
  const output = useMemo(
    () => renderElements(activeElements, state.charset),
    [activeElements, state.charset],
  )
  const selected = activeElements.find((el) => el.id === state.selectedId)

  if (id && isLoading) {
    return <p className="text-muted-foreground p-8 text-center">Cargando…</p>
  }
  if (id && isError) {
    return <p className="text-destructive p-8 text-center">{error.message}</p>
  }

  return (
    <div className="h-full">
      {/* the editor needs a keyboard + pointer: friendly notice on mobile */}
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center md:hidden">
        <Monitor className="text-muted-foreground size-10" />
        <p className="font-medium">El editor necesita una pantalla grande</p>
        <p className="text-muted-foreground text-sm text-balance">
          Abre EDDRAM en un ordenador para arrastrar y editar elementos. Tus
          esquemas guardados sí se pueden consultar desde el móvil.
        </p>
      </div>

      <div className="hidden h-full flex-col md:flex">
        <EditorToolbar
          state={state}
          dispatch={dispatch}
          status={status}
          output={output}
        />
        <SheetTabs state={state} dispatch={dispatch} />
        <div className="flex min-h-0 flex-1">
          <Palette dispatch={dispatch} />
          <Canvas state={state} dispatch={dispatch} />
          <aside className="flex w-80 shrink-0 flex-col overflow-y-auto border-l">
            {selected ? (
              <>
                <div className="border-b">
                  <p className="text-muted-foreground px-3 pt-3 text-xs font-medium uppercase">
                    Elemento: {selected.type}
                  </p>
                  <Inspector element={selected} dispatch={dispatch} />
                </div>
                <PreviewPanel output={output} />
              </>
            ) : (
              <PreviewPanel output={output} />
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}

function EditorToolbar({
  state,
  dispatch,
  status,
  output,
}: {
  state: EditorState
  dispatch: React.Dispatch<Parameters<typeof editorReducer>[1]>
  status: SaveStatus
  output: string
}) {
  return (
    <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2">
      <Input
        aria-label="Nombre del esquema"
        className="w-56 font-medium"
        value={state.name}
        onChange={(e) => dispatch({ type: "set-name", name: e.target.value })}
      />
      <Tabs
        value={state.charset}
        onValueChange={(v) =>
          dispatch({ type: "set-charset", charset: v as "ascii" | "unicode" })
        }
      >
        <TabsList>
          <TabsTrigger value="unicode">Unicode ┌─┐</TabsTrigger>
          <TabsTrigger value="ascii">ASCII +-+</TabsTrigger>
        </TabsList>
      </Tabs>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Deshacer (Ctrl+Z)"
        disabled={state.past.length === 0}
        onClick={() => dispatch({ type: "undo" })}
      >
        <Undo2 />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Rehacer (Ctrl+Shift+Z)"
        disabled={state.future.length === 0}
        onClick={() => dispatch({ type: "redo" })}
      >
        <Redo2 />
      </Button>
      <span className="text-muted-foreground ml-auto text-xs">
        {STATUS_LABEL[status]}
      </span>
      <ExportMenu output={output} name={state.name} />
    </div>
  )
}
