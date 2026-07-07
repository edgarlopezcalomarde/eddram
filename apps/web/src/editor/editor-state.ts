import type { Charset, SchemaElement, Sheet } from "@workspace/shared"

/** Canvas size in character cells — shared by every sheet. */
export const CANVAS_COLS = 120
export const CANVAS_ROWS = 48

const MAX_HISTORY = 100

export interface EditorState {
  sheets: Sheet[]
  activeSheetId: string
  selectedId: string | null
  charset: Charset
  name: string
  description: string | null
  /** Undo/redo stacks: snapshots of `sheets`. */
  past: Sheet[][]
  future: Sheet[][]
  /**
   * Snapshot taken at `begin-transform` (drag start / text-edit focus).
   * It is only pushed to `past` when a `transform` actually happens, so a
   * plain click never creates an empty undo step.
   */
  pendingSnapshot: Sheet[] | null
  /** True once a transform happened since the last `begin-transform`. */
  didTransform: boolean
  /** Bumped on every persistable change; the autosave hook watches it. */
  version: number
}

function makeSheet(name: string): Sheet {
  return { id: crypto.randomUUID(), name, elements: [] }
}

export const initialEditorState: EditorState = {
  sheets: [{ id: "sheet-1", name: "Hoja 1", elements: [] }],
  activeSheetId: "sheet-1",
  selectedId: null,
  charset: "unicode",
  name: "Sin título",
  description: null,
  past: [],
  future: [],
  pendingSnapshot: null,
  didTransform: false,
  version: 0,
}

export type EditorAction =
  | {
      type: "load"
      sheets: Sheet[]
      charset: Charset
      name: string
      description: string | null
      /** When true (templates) the content counts as unsaved changes. */
      markDirty?: boolean
    }
  | { type: "add"; element: SchemaElement }
  | { type: "update"; id: string; patch: Partial<SchemaElement> }
  | { type: "remove"; id: string }
  | { type: "duplicate"; id: string; newId: string }
  | { type: "bring-to-front"; id: string }
  | { type: "send-to-back"; id: string }
  | { type: "select"; id: string | null }
  | { type: "begin-transform" }
  | { type: "transform"; id: string; patch: Partial<SchemaElement> }
  | { type: "end-transform" }
  | { type: "set-charset"; charset: Charset }
  | { type: "set-name"; name: string }
  | { type: "add-sheet" }
  | { type: "remove-sheet"; id: string }
  | { type: "rename-sheet"; id: string; name: string }
  | { type: "select-sheet"; id: string }
  | { type: "undo" }
  | { type: "redo" }

/**
 * Keep an element fully inside the sheet's grid: clamps its origin, then
 * shrinks width/height (for boxes/dividers) or the line's end point so
 * nothing can be placed or resized outside the bounds.
 */
export function clampElementToSheet(el: SchemaElement): SchemaElement {
  const clampX = (v: number) => Math.max(0, Math.min(CANVAS_COLS - 1, v))
  const clampY = (v: number) => Math.max(0, Math.min(CANVAS_ROWS - 1, v))
  const next = { ...el, x: clampX(el.x), y: clampY(el.y) }
  if ("width" in next) next.width = Math.max(1, Math.min(next.width, CANVAS_COLS - next.x))
  if ("height" in next) next.height = Math.max(1, Math.min(next.height, CANVAS_ROWS - next.y))
  if (next.type === "line") {
    next.x2 = clampX(next.x2)
    next.y2 = clampY(next.y2)
  }
  return next
}

function activeElements(state: EditorState): SchemaElement[] {
  return state.sheets.find((s) => s.id === state.activeSheetId)?.elements ?? []
}

function withActiveElements(state: EditorState, elements: SchemaElement[]): Sheet[] {
  return state.sheets.map((s) =>
    s.id === state.activeSheetId ? { ...s, elements } : s,
  )
}

/** Push the current sheets onto the undo stack and apply `sheets`. */
function commit(state: EditorState, sheets: Sheet[]): EditorState {
  return {
    ...state,
    sheets,
    past: [...state.past.slice(-(MAX_HISTORY - 1)), state.sheets],
    future: [],
    version: state.version + 1,
  }
}

function applyPatch(
  elements: SchemaElement[],
  id: string,
  patch: Partial<SchemaElement>,
): SchemaElement[] {
  return elements.map((el) =>
    el.id === id ? clampElementToSheet({ ...el, ...patch } as SchemaElement) : el,
  )
}

export function editorReducer(
  state: EditorState,
  action: EditorAction,
): EditorState {
  switch (action.type) {
    case "load":
      return {
        ...initialEditorState,
        sheets: action.sheets,
        activeSheetId: action.sheets[0]?.id ?? initialEditorState.activeSheetId,
        charset: action.charset,
        name: action.name,
        description: action.description,
        version: action.markDirty ? 1 : 0,
      }

    case "add":
      return {
        ...commit(
          state,
          withActiveElements(state, [
            ...activeElements(state),
            clampElementToSheet(action.element),
          ]),
        ),
        selectedId: action.element.id,
      }

    case "update":
      return commit(
        state,
        withActiveElements(state, applyPatch(activeElements(state), action.id, action.patch)),
      )

    case "remove":
      return {
        ...commit(
          state,
          withActiveElements(
            state,
            activeElements(state).filter((el) => el.id !== action.id),
          ),
        ),
        selectedId: state.selectedId === action.id ? null : state.selectedId,
      }

    case "duplicate": {
      const elements = activeElements(state)
      const source = elements.find((el) => el.id === action.id)
      if (!source) return state
      const copy = clampElementToSheet({
        ...source,
        id: action.newId,
        x: source.x + 2,
        y: source.y + 1,
        ...("x2" in source ? { x2: source.x2 + 2, y2: source.y2 + 1 } : {}),
      } as SchemaElement)
      return {
        ...commit(state, withActiveElements(state, [...elements, copy])),
        selectedId: copy.id,
      }
    }

    case "bring-to-front": {
      const elements = activeElements(state)
      const el = elements.find((e) => e.id === action.id)
      if (!el || elements[elements.length - 1] === el) return state
      return commit(
        state,
        withActiveElements(state, [
          ...elements.filter((e) => e.id !== action.id),
          el,
        ]),
      )
    }

    case "send-to-back": {
      const elements = activeElements(state)
      const el = elements.find((e) => e.id === action.id)
      if (!el || elements[0] === el) return state
      return commit(
        state,
        withActiveElements(state, [
          el,
          ...elements.filter((e) => e.id !== action.id),
        ]),
      )
    }

    case "select":
      if (state.selectedId === action.id) return state
      return { ...state, selectedId: action.id }

    case "begin-transform":
      return { ...state, pendingSnapshot: state.sheets, didTransform: false }

    // Transient change (mid-drag / mid-typing): the snapshot from
    // `begin-transform` becomes the single undo step for the whole gesture.
    case "transform": {
      const past = state.pendingSnapshot
        ? [...state.past.slice(-(MAX_HISTORY - 1)), state.pendingSnapshot]
        : state.past
      return {
        ...state,
        sheets: withActiveElements(
          state,
          applyPatch(activeElements(state), action.id, action.patch),
        ),
        past,
        future: state.pendingSnapshot ? [] : state.future,
        pendingSnapshot: null,
        didTransform: true,
      }
    }

    case "end-transform":
      return {
        ...state,
        pendingSnapshot: null,
        didTransform: false,
        version: state.didTransform ? state.version + 1 : state.version,
      }

    case "set-charset":
      if (state.charset === action.charset) return state
      return { ...state, charset: action.charset, version: state.version + 1 }

    case "set-name":
      return { ...state, name: action.name, version: state.version + 1 }

    // Sheet structure changes (add/remove/rename) aren't undoable steps —
    // same treatment as the charset toggle above.
    case "add-sheet": {
      const sheet = makeSheet(`Hoja ${state.sheets.length + 1}`)
      return {
        ...state,
        sheets: [...state.sheets, sheet],
        activeSheetId: sheet.id,
        selectedId: null,
        version: state.version + 1,
      }
    }

    case "remove-sheet": {
      if (state.sheets.length <= 1) return state
      const index = state.sheets.findIndex((s) => s.id === action.id)
      if (index === -1) return state
      const sheets = state.sheets.filter((s) => s.id !== action.id)
      const activeSheetId =
        state.activeSheetId === action.id
          ? (sheets[Math.max(0, index - 1)]?.id ?? sheets[0]!.id)
          : state.activeSheetId
      return {
        ...state,
        sheets,
        activeSheetId,
        selectedId: state.activeSheetId === action.id ? null : state.selectedId,
        version: state.version + 1,
      }
    }

    case "rename-sheet":
      if (!action.name.trim()) return state
      return {
        ...state,
        sheets: state.sheets.map((s) =>
          s.id === action.id ? { ...s, name: action.name.trim() } : s,
        ),
        version: state.version + 1,
      }

    case "select-sheet":
      if (state.activeSheetId === action.id) return state
      return { ...state, activeSheetId: action.id, selectedId: null }

    case "undo": {
      const previous = state.past[state.past.length - 1]
      if (!previous) return state
      return {
        ...state,
        sheets: previous,
        past: state.past.slice(0, -1),
        future: [state.sheets, ...state.future],
        version: state.version + 1,
      }
    }

    case "redo": {
      const next = state.future[0]
      if (!next) return state
      return {
        ...state,
        sheets: next,
        past: [...state.past, state.sheets],
        future: state.future.slice(1),
        version: state.version + 1,
      }
    }
  }
}
