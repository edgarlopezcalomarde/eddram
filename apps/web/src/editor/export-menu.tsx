import { Check, ClipboardCopy, Download, Share } from "lucide-react"
import { useState } from "react"
import toast from "react-hot-toast"

import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

import { downloadText } from "@/lib/download"
import { toMarkdown } from "@/lib/markdown"

const ATTRIBUTION_KEY = "eddram:attribution"

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "esquema"
  )
}

export function ExportMenu({ output, name }: { output: string; name: string }) {
  const [attribution, setAttribution] = useState(
    () => localStorage.getItem(ATTRIBUTION_KEY) === "1",
  )

  const setAttributionPersisted = (value: boolean) => {
    setAttribution(value)
    localStorage.setItem(ATTRIBUTION_KEY, value ? "1" : "0")
  }

  const plainText = attribution
    ? `${output}\n\nGenerado con EDDRAM`
    : output

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(label)
    } catch {
      toast.error("No se pudo acceder al portapapeles")
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm">
          <Share /> Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuItem
          onClick={() =>
            copy(toMarkdown(output, attribution), "Markdown copiado")
          }
        >
          <ClipboardCopy /> Copiar como Markdown
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => copy(plainText, "Texto plano copiado")}
        >
          <Check /> Copiar texto plano
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() =>
            downloadText(`${slugify(name)}.md`, toMarkdown(output, attribution))
          }
        >
          <Download /> Descargar .md
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => downloadText(`${slugify(name)}.txt`, plainText)}
        >
          <Download /> Descargar .txt
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-muted-foreground text-xs">
          Opciones
        </DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          checked={attribution}
          onCheckedChange={setAttributionPersisted}
        >
          Añadir atribución
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
