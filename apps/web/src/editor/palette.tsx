import type { SchemaElement } from "@workspace/shared"
import {
  ArrowLeftRight,
  ArrowRight,
  CornerDownRight,
  FolderTree,
  Minus,
  MoveVertical,
  Square,
  Table,
  Type,
} from "lucide-react"
import type { ComponentType } from "react"

import { Button } from "@workspace/ui/components/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

import type { EditorAction } from "./editor-state"

type Factory = (id: string, x: number, y: number) => SchemaElement

interface PaletteItem {
  label: string
  icon: ComponentType<{ className?: string }>
  create: Factory
}

const ITEMS: PaletteItem[] = [
  {
    label: "Caja",
    icon: Square,
    create: (id, x, y) => ({
      id,
      type: "box",
      x,
      y,
      width: 14,
      height: 5,
      text: "Texto",
      borderStyle: "single",
      textAlign: "center",
    }),
  },
  {
    label: "Flecha",
    icon: ArrowRight,
    create: (id, x, y) => ({
      id,
      type: "line",
      x,
      y,
      x2: x + 10,
      y2: y,
      bend: "h-first",
      arrowStart: false,
      arrowEnd: true,
    }),
  },
  {
    label: "Flecha doble",
    icon: ArrowLeftRight,
    create: (id, x, y) => ({
      id,
      type: "line",
      x,
      y,
      x2: x + 10,
      y2: y,
      bend: "h-first",
      arrowStart: true,
      arrowEnd: true,
    }),
  },
  {
    label: "Línea vertical",
    icon: MoveVertical,
    create: (id, x, y) => ({
      id,
      type: "line",
      x,
      y,
      x2: x,
      y2: y + 6,
      bend: "v-first",
      arrowStart: false,
      arrowEnd: true,
    }),
  },
  {
    label: "Conector en L",
    icon: CornerDownRight,
    create: (id, x, y) => ({
      id,
      type: "line",
      x,
      y,
      x2: x + 10,
      y2: y + 5,
      bend: "v-first",
      arrowStart: false,
      arrowEnd: true,
    }),
  },
  {
    label: "Árbol de directorios",
    icon: FolderTree,
    create: (id, x, y) => ({
      id,
      type: "tree",
      x,
      y,
      text: "proyecto/\n  src/\n    index.ts\n  package.json",
    }),
  },
  {
    label: "Tabla",
    icon: Table,
    create: (id, x, y) => ({
      id,
      type: "table",
      x,
      y,
      rows: [
        ["Columna A", "Columna B"],
        ["valor 1", "valor 2"],
      ],
      tableStyle: "box",
      headerRow: true,
    }),
  },
  {
    label: "Separador / título",
    icon: Minus,
    create: (id, x, y) => ({
      id,
      type: "divider",
      x,
      y,
      width: 30,
      lineChar: "=",
      title: "Sección",
    }),
  },
  {
    label: "Texto libre",
    icon: Type,
    create: (id, x, y) => ({ id, type: "text", x, y, text: "Texto libre" }),
  },
]

let dropCount = 0

export function Palette({
  dispatch,
}: {
  dispatch: React.Dispatch<EditorAction>
}) {
  const add = (item: PaletteItem) => {
    // cascade new elements so consecutive inserts don't stack exactly
    const offset = (dropCount++ % 6) * 2
    dispatch({
      type: "add",
      element: item.create(crypto.randomUUID(), 2 + offset, 1 + offset),
    })
  }

  return (
    <TooltipProvider delayDuration={300}>
      <aside className="flex w-14 shrink-0 flex-col items-center gap-1 overflow-y-auto border-r p-2">
        {ITEMS.map((item) => (
          <Tooltip key={item.label}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={item.label}
                onClick={() => add(item)}
              >
                <item.icon className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        ))}
      </aside>
    </TooltipProvider>
  )
}
