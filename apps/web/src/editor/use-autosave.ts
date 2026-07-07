import type { CanvasContent, SchemaDto, SchemaInput } from "@workspace/shared"
import { renderElements } from "@workspace/shared"
import { useCallback, useEffect, useRef, useState } from "react"
import toast from "react-hot-toast"

import type { EditorState } from "./editor-state"
import { useCreateSchema, useUpdateSchema } from "@/hooks/use-schemas"

export type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error"

const AUTOSAVE_DELAY = 2000

interface SaveInfo {
  phase: "idle" | "saving" | "saved" | "error"
  /** `state.version` captured when the save started. */
  version: number
}

/**
 * Debounced autosave (~2 s after the last change).
 *
 * - Watches `state.version`, which the reducer bumps on every persistable
 *   change (element edits, renames, charset switches, undo/redo).
 * - Without an id the first save POSTs a new schema and reports it via
 *   `onCreated` (the page then rewrites the URL to /editor/:id).
 * - Updates go through `useUpdateSchema`, which patches the query cache
 *   optimistically in its onMutate.
 */
export function useAutosave(
  schemaId: string | undefined,
  state: EditorState,
  onCreated: (schema: SchemaDto) => void,
) {
  const createSchema = useCreateSchema()
  const updateSchema = useUpdateSchema()
  const [saveInfo, setSaveInfo] = useState<SaveInfo>({
    phase: "idle",
    version: 0,
  })

  // guards against double-POST while the create request is in flight
  const creatingRef = useRef(false)
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  })

  const save = useCallback(() => {
    const current = stateRef.current
    const input: SchemaInput = {
      name: current.name.trim() || "Sin título",
      description: current.description,
      content: JSON.stringify({
        sheets: current.sheets,
      } satisfies CanvasContent),
      // list previews only need a representative preview: the first sheet
      renderedOutput: renderElements(current.sheets[0]?.elements ?? [], current.charset),
      charset: current.charset,
    }
    const version = current.version
    setSaveInfo({ phase: "saving", version })
    if (schemaId) {
      updateSchema.mutate(
        { id: schemaId, input },
        {
          onSuccess: () => setSaveInfo({ phase: "saved", version }),
          onError: (err) => {
            setSaveInfo({ phase: "error", version })
            toast.error(`No se pudo guardar: ${err.message}`)
          },
        },
      )
    } else {
      if (creatingRef.current) return
      creatingRef.current = true
      createSchema.mutate(input, {
        onSuccess: (created) => {
          setSaveInfo({ phase: "saved", version })
          onCreated(created)
        },
        onError: (err) => {
          creatingRef.current = false
          setSaveInfo({ phase: "error", version })
          toast.error(`No se pudo guardar: ${err.message}`)
        },
      })
    }
    // mutation objects are stable; schemaId/onCreated are the real inputs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schemaId, onCreated])

  useEffect(() => {
    if (state.version === 0) return
    const timer = setTimeout(save, AUTOSAVE_DELAY)
    return () => clearTimeout(timer)
  }, [state.version, save])

  // Derived instead of stored: any version bump past the last save is "dirty".
  const status: SaveStatus =
    saveInfo.phase === "saving"
      ? "saving"
      : state.version === 0
        ? "idle"
        : saveInfo.phase !== "idle" && state.version <= saveInfo.version
          ? saveInfo.phase
          : "dirty"

  return { status, saveNow: save }
}
