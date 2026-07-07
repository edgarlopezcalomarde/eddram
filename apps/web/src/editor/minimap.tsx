import type { Charset, SchemaElement } from "@workspace/shared"
import { renderElements } from "@workspace/shared"
import { useLayoutEffect, useMemo, useRef, useState } from "react"

import { CANVAS_COLS, CANVAS_ROWS } from "./editor-state"

const BOX_WIDTH = 192
const BOX_HEIGHT = 84

/**
 * Always-visible overview of the whole active sheet: rendered at a tiny
 * base font size, then scaled (independently on each axis, so it never
 * needs to scroll) to fit exactly inside a small fixed box.
 */
export function Minimap({
  elements,
  charset,
}: {
  elements: SchemaElement[]
  charset: Charset
}) {
  const measureRef = useRef<HTMLSpanElement>(null)
  const [scale, setScale] = useState({ x: 1, y: 1 })

  const output = useMemo(() => renderElements(elements, charset), [elements, charset])

  useLayoutEffect(() => {
    const el = measureRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const cellW = rect.width / 10
    const cellH = rect.height
    setScale({
      x: BOX_WIDTH / (CANVAS_COLS * cellW),
      y: BOX_HEIGHT / (CANVAS_ROWS * cellH),
    })
  }, [])

  return (
    <div
      className="bg-background/90 pointer-events-none absolute right-3 bottom-3 z-20 overflow-hidden rounded-md border shadow-md backdrop-blur-sm"
      style={{ width: BOX_WIDTH, height: BOX_HEIGHT }}
    >
      <span
        ref={measureRef}
        aria-hidden
        className="invisible absolute top-0 left-0 font-mono text-[4px] leading-[5px] whitespace-pre"
      >
        MMMMMMMMMM
      </span>
      <pre
        className="text-foreground absolute top-0 left-0 m-0 origin-top-left font-mono text-[4px] leading-[5px]"
        style={{ transform: `scale(${scale.x}, ${scale.y})` }}
      >
        {output}
      </pre>
    </div>
  )
}
