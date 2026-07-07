import { Plus, X } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { Prompt } from "@/components/modals"

import type { EditorAction, EditorState } from "./editor-state"

/** Tabs to switch between the schema's sheets, plus add/rename/close. */
export function SheetTabs({
  state,
  dispatch,
}: {
  state: EditorState
  dispatch: React.Dispatch<EditorAction>
}) {
  const rename = async (id: string, currentName: string) => {
    const name = await Prompt.call({
      title: "Renombrar hoja",
      defaultValue: currentName,
      submitLabel: "Renombrar",
    })
    if (name && name !== currentName) dispatch({ type: "rename-sheet", id, name })
  }

  return (
    <div className="bg-muted/20 flex shrink-0 items-center gap-1 overflow-x-auto border-b px-2 py-1">
      {state.sheets.map((sheet) => {
        const active = sheet.id === state.activeSheetId
        return (
          <div
            key={sheet.id}
            className={cn(
              "group flex shrink-0 items-center gap-1.5 rounded-t-md border border-b-0 px-2.5 py-1 text-xs",
              active
                ? "bg-background font-medium"
                : "text-muted-foreground border-transparent hover:bg-muted/60",
            )}
          >
            <button
              className="max-w-40 truncate"
              onClick={() => dispatch({ type: "select-sheet", id: sheet.id })}
              onDoubleClick={() => rename(sheet.id, sheet.name)}
              title="Doble clic para renombrar"
            >
              {sheet.name}
            </button>
            {state.sheets.length > 1 && (
              <button
                aria-label={`Eliminar ${sheet.name}`}
                className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  dispatch({ type: "remove-sheet", id: sheet.id })
                }}
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        )
      })}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Añadir hoja"
        onClick={() => dispatch({ type: "add-sheet" })}
      >
        <Plus className="size-4" />
      </Button>
    </div>
  )
}
