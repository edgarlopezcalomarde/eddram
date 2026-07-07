import type { SchemaElement } from "@workspace/shared"
import { getElementBounds, renderElements } from "@workspace/shared"
import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"

import { cn } from "@workspace/ui/lib/utils"

import {
  CANVAS_COLS,
  CANVAS_ROWS,
  type EditorAction,
  type EditorState,
} from "./editor-state"
import { Minimap } from "./minimap"

type DragMode = "move" | "resize" | "line-start" | "line-end"

interface DragInfo {
  mode: DragMode
  /** Element as it was when the drag started. */
  origin: SchemaElement
  startClientX: number
  startClientY: number
}

const clampCol = (v: number) => Math.max(0, Math.min(CANVAS_COLS - 1, v))
const clampRow = (v: number) => Math.max(0, Math.min(CANVAS_ROWS - 1, v))

/** Apply a drag delta (in cells) to the origin element according to the mode. */
function transformFor(
  origin: SchemaElement,
  mode: DragMode,
  dc: number,
  dr: number,
): Partial<SchemaElement> {
  switch (mode) {
    case "move": {
      const patch: Record<string, number> = {
        x: clampCol(origin.x + dc),
        y: clampRow(origin.y + dr),
      }
      if (origin.type === "line") {
        // keep the segment shape: shift both endpoints by the applied delta
        const appliedDc = patch.x! - origin.x
        const appliedDr = patch.y! - origin.y
        patch.x2 = clampCol(origin.x2 + appliedDc)
        patch.y2 = clampRow(origin.y2 + appliedDr)
      }
      return patch as Partial<SchemaElement>
    }
    case "resize":
      if (origin.type === "box") {
        return {
          width: Math.max(4, origin.width + dc),
          height: Math.max(3, origin.height + dr),
        }
      }
      if (origin.type === "divider") {
        return { width: Math.max(3, origin.width + dc) }
      }
      return {}
    case "line-start":
      return origin.type === "line"
        ? { x: clampCol(origin.x + dc), y: clampRow(origin.y + dr) }
        : {}
    case "line-end":
      return origin.type === "line"
        ? { x2: clampCol(origin.x2 + dc), y2: clampRow(origin.y2 + dr) }
        : {}
  }
}

export function Canvas({
  state,
  dispatch,
}: {
  state: EditorState
  dispatch: React.Dispatch<EditorAction>
}) {
  const [cell, setCell] = useState({ w: 8.4, h: 20 })
  const measureRef = useRef<HTMLSpanElement>(null)
  const dragRef = useRef<DragInfo | null>(null)

  const elements = useMemo(
    () => state.sheets.find((s) => s.id === state.activeSheetId)?.elements ?? [],
    [state.sheets, state.activeSheetId],
  )

  // Measure the real size of one monospace cell (font metrics vary per OS).
  useLayoutEffect(() => {
    const el = measureRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setCell({ w: rect.width / 10, h: rect.height })
  }, [])

  const output = useMemo(
    () => renderElements(elements, state.charset),
    [elements, state.charset],
  )

  const onDragMove = useCallback(
    (e: PointerEvent) => {
      const drag = dragRef.current
      if (!drag) return
      const dc = Math.round((e.clientX - drag.startClientX) / cell.w)
      const dr = Math.round((e.clientY - drag.startClientY) / cell.h)
      dispatch({
        type: "transform",
        id: drag.origin.id,
        patch: transformFor(drag.origin, drag.mode, dc, dr),
      })
    },
    [cell, dispatch],
  )

  const startDrag = useCallback(
    (e: React.PointerEvent, element: SchemaElement, mode: DragMode) => {
      if (e.button !== 0) return
      e.preventDefault()
      e.stopPropagation()
      dispatch({ type: "select", id: element.id })
      dispatch({ type: "begin-transform" })
      dragRef.current = {
        mode,
        origin: element,
        startClientX: e.clientX,
        startClientY: e.clientY,
      }
      const onUp = () => {
        dragRef.current = null
        window.removeEventListener("pointermove", onDragMove)
        dispatch({ type: "end-transform" })
      }
      window.addEventListener("pointermove", onDragMove)
      window.addEventListener("pointerup", onUp, { once: true })
    },
    [dispatch, onDragMove],
  )

  const onKeyDown = (e: React.KeyboardEvent) => {
    const id = state.selectedId
    if (!id) return
    const el = elements.find((it) => it.id === id)
    if (!el) return

    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault()
      dispatch({ type: "remove", id })
      return
    }
    if (e.key === "Escape") {
      dispatch({ type: "select", id: null })
      return
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
      e.preventDefault()
      dispatch({ type: "duplicate", id, newId: crypto.randomUUID() })
      return
    }
    const arrows: Record<string, [number, number]> = {
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
    }
    const delta = arrows[e.key]
    if (delta) {
      e.preventDefault()
      dispatch({
        type: "update",
        id,
        patch: transformFor(el, "move", delta[0], delta[1]),
      })
    }
  }

  return (
    <div className="bg-muted/30 relative flex-1" role="application">
      <div className="absolute inset-0 overflow-auto">
        <div
          className="relative m-4 cursor-default border font-mono text-sm leading-5 shadow-xs outline-none"
          style={{
            width: CANVAS_COLS * cell.w,
            height: CANVAS_ROWS * cell.h,
            backgroundImage:
              "radial-gradient(circle, var(--border) 1px, transparent 1px)",
            backgroundSize: `${cell.w * 4}px ${cell.h * 2}px`,
            backgroundColor: "var(--background)",
          }}
          tabIndex={0}
          onKeyDown={onKeyDown}
          onPointerDown={() => dispatch({ type: "select", id: null })}
        >
          {/* hidden probe to measure the width/height of one character cell */}
          <span
            ref={measureRef}
            aria-hidden
            className="invisible absolute top-0 left-0 whitespace-pre"
          >
            MMMMMMMMMM
          </span>

          {/* the actual diagram, always rendered by the shared ASCII engine */}
          <pre className="pointer-events-none absolute top-0 left-0 m-0 font-[inherit] text-[inherit] leading-[inherit]">
            {output}
          </pre>

          {/* interaction overlays, one per element (in z-order) */}
          {elements.map((el) => {
            const b = getElementBounds(el, state.charset)
            const selected = el.id === state.selectedId
            return (
              <div
                key={el.id}
                className={cn(
                  "absolute cursor-move rounded-xs",
                  selected
                    ? "ring-primary bg-primary/5 z-10 ring-2"
                    : "hover:ring-primary/40 hover:ring-1",
                )}
                style={{
                  left: b.x * cell.w - 2,
                  top: b.y * cell.h - 2,
                  width: b.width * cell.w + 4,
                  height: b.height * cell.h + 4,
                }}
                onPointerDown={(e) => startDrag(e, el, "move")}
              >
                {selected && (el.type === "box" || el.type === "divider") && (
                  <div
                    className="bg-primary absolute -right-1.5 -bottom-1.5 size-3 cursor-nwse-resize rounded-xs"
                    onPointerDown={(e) => startDrag(e, el, "resize")}
                  />
                )}
                {selected && el.type === "line" && (
                  <>
                    <div
                      className="bg-primary absolute size-3 cursor-crosshair rounded-full"
                      style={{
                        left: (el.x - b.x) * cell.w + cell.w / 2 - 6,
                        top: (el.y - b.y) * cell.h + cell.h / 2 - 6,
                      }}
                      onPointerDown={(e) => startDrag(e, el, "line-start")}
                    />
                    <div
                      className="bg-primary absolute size-3 cursor-crosshair rounded-full"
                      style={{
                        left: (el.x2 - b.x) * cell.w + cell.w / 2 - 6,
                        top: (el.y2 - b.y) * cell.h + cell.h / 2 - 6,
                      }}
                      onPointerDown={(e) => startDrag(e, el, "line-end")}
                    />
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <Minimap elements={elements} charset={state.charset} />
    </div>
  )
}
