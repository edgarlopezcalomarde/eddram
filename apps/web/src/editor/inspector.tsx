import type {
  BoxBorderStyle,
  LineBend,
  SchemaElement,
  TableStyle,
} from "@workspace/shared"
import { BringToFront, Copy, SendToBack, Trash2 } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import { Switch } from "@workspace/ui/components/switch"
import { Textarea } from "@workspace/ui/components/textarea"

import type { EditorAction } from "./editor-state"

interface InspectorProps {
  element: SchemaElement
  dispatch: React.Dispatch<EditorAction>
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

export function Inspector({ element, dispatch }: InspectorProps) {
  // Text edits are "transform" (transient) updates bracketed by focus/blur,
  // so a whole typing session collapses into a single undo step.
  const textSession = {
    onFocus: () => dispatch({ type: "begin-transform" }),
    onBlur: () => dispatch({ type: "end-transform" }),
  }
  const patch = (p: Partial<SchemaElement>) =>
    dispatch({ type: "update", id: element.id, patch: p })
  const patchTransient = (p: Partial<SchemaElement>) =>
    dispatch({ type: "transform", id: element.id, patch: p })

  const numberField = (label: string, value: number, key: string, min = 0) => (
    <Field label={label}>
      <Input
        type="number"
        min={min}
        value={value}
        onChange={(e) =>
          patch({
            [key]: Math.max(min, Number(e.target.value) || 0),
          } as Partial<SchemaElement>)
        }
      />
    </Field>
  )

  return (
    <div className="space-y-4 p-3">
      <div className="grid grid-cols-2 gap-2">
        {numberField("X", element.x, "x")}
        {numberField("Y", element.y, "y")}
      </div>

      {element.type === "box" && (
        <>
          <div className="grid grid-cols-2 gap-2">
            {numberField("Ancho", element.width, "width", 4)}
            {numberField("Alto", element.height, "height", 3)}
          </div>
          <Field label="Texto">
            <Textarea
              rows={3}
              value={element.text}
              {...textSession}
              onChange={(e) => patchTransient({ text: e.target.value })}
            />
          </Field>
          <Field label="Borde">
            <Select
              value={element.borderStyle}
              onValueChange={(v) => patch({ borderStyle: v as BoxBorderStyle })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Simple ┌─┐</SelectItem>
                <SelectItem value="double">Doble ╔═╗</SelectItem>
                <SelectItem value="rounded">Redondeado ╭─╮</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Alineación del texto">
            <Select
              value={element.textAlign}
              onValueChange={(v) =>
                patch({ textAlign: v as "left" | "center" })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Izquierda</SelectItem>
                <SelectItem value="center">Centrado</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </>
      )}

      {element.type === "line" && (
        <>
          <div className="grid grid-cols-2 gap-2">
            {numberField("X final", element.x2, "x2")}
            {numberField("Y final", element.y2, "y2")}
          </div>
          <Field label="Codo (para conectores en L)">
            <Select
              value={element.bend}
              onValueChange={(v) => patch({ bend: v as LineBend })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="h-first">Horizontal primero</SelectItem>
                <SelectItem value="v-first">Vertical primero</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Punta al inicio</Label>
            <Switch
              checked={element.arrowStart}
              onCheckedChange={(v) => patch({ arrowStart: v })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Punta al final</Label>
            <Switch
              checked={element.arrowEnd}
              onCheckedChange={(v) => patch({ arrowEnd: v })}
            />
          </div>
        </>
      )}

      {(element.type === "text" || element.type === "tree") && (
        <Field
          label={
            element.type === "tree"
              ? "Elementos (2 espacios = un nivel, Tab indenta)"
              : "Texto"
          }
        >
          <Textarea
            rows={8}
            className="font-mono text-xs"
            value={element.text}
            {...textSession}
            onChange={(e) => patchTransient({ text: e.target.value })}
            onKeyDown={(e) => {
              if (e.key !== "Tab") return
              e.preventDefault()
              const ta = e.currentTarget
              const { selectionStart: s, selectionEnd: end, value } = ta
              const indent = "  "
              if (s === end && element.type === "tree") {
                const atLineStart =
                  s - (value.slice(0, s).match(/[^\n]*$/)?.index ?? s) === 0
                const insertion = atLineStart ? indent : " "
                const next = value.slice(0, s) + insertion + value.slice(end)
                patchTransient({ text: next })
                requestAnimationFrame(() => {
                  ta.selectionStart = ta.selectionEnd = s + insertion.length
                })
              } else {
                const next = value.slice(0, s) + indent + value.slice(end)
                patchTransient({ text: next })
                requestAnimationFrame(() => {
                  ta.selectionStart = ta.selectionEnd = s + indent.length
                })
              }
            }}
          />
        </Field>
      )}

      {element.type === "table" && (
        <>
          <Field label="Celdas (columnas con «|», filas por línea)">
            <Textarea
              rows={6}
              className="font-mono text-xs"
              value={element.rows.map((r) => r.join(" | ")).join("\n")}
              {...textSession}
              onChange={(e) =>
                patchTransient({
                  rows: e.target.value
                    .split("\n")
                    .map((line) => line.split("|").map((c) => c.trim())),
                })
              }
            />
          </Field>
          <Field label="Estilo">
            <Select
              value={element.tableStyle}
              onValueChange={(v) => patch({ tableStyle: v as TableStyle })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="box">Box-drawing ┌─┬─┐</SelectItem>
                <SelectItem value="markdown">Markdown | --- |</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="flex items-center justify-between">
            <Label className="text-xs">Primera fila como cabecera</Label>
            <Switch
              checked={element.headerRow}
              onCheckedChange={(v) => patch({ headerRow: v })}
            />
          </div>
        </>
      )}

      {element.type === "divider" && (
        <>
          {numberField("Ancho", element.width, "width", 3)}
          <Field label="Título (opcional)">
            <Input
              value={element.title ?? ""}
              {...textSession}
              onChange={(e) => patchTransient({ title: e.target.value })}
            />
          </Field>
          <Field label="Carácter">
            <Select
              value={element.lineChar}
              onValueChange={(v) => patch({ lineChar: v as "=" | "-" })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="=">= = =</SelectItem>
                <SelectItem value="-">- - -</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </>
      )}

      <div className="flex flex-wrap gap-1.5 border-t pt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            dispatch({
              type: "duplicate",
              id: element.id,
              newId: crypto.randomUUID(),
            })
          }
        >
          <Copy /> Duplicar
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Traer al frente"
          onClick={() => dispatch({ type: "bring-to-front", id: element.id })}
        >
          <BringToFront />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Enviar al fondo"
          onClick={() => dispatch({ type: "send-to-back", id: element.id })}
        >
          <SendToBack />
        </Button>
        <Button
          variant="destructive"
          size="icon-sm"
          aria-label="Eliminar"
          className="ml-auto"
          onClick={() => dispatch({ type: "remove", id: element.id })}
        >
          <Trash2 />
        </Button>
      </div>
    </div>
  )
}
