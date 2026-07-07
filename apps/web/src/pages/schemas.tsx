import type { SchemaDto, SchemaInput, SchemaSort } from "@workspace/shared"
import { Copy, FileText, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { Link, useNavigate } from "react-router"

import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardFooter,
} from "@workspace/ui/components/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { Input } from "@workspace/ui/components/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"

import { Confirm, Prompt } from "@/components/modals"
import {
  useDeleteSchema,
  useDuplicateSchema,
  useSchemas,
  useUpdateSchema,
} from "@/hooks/use-schemas"

const dateFormat = new Intl.DateTimeFormat("es", {
  dateStyle: "medium",
  timeStyle: "short",
})

function SchemaCard({ schema }: { schema: SchemaDto }) {
  const navigate = useNavigate()
  const deleteSchema = useDeleteSchema()
  const duplicateSchema = useDuplicateSchema()
  const updateSchema = useUpdateSchema()

  const onRename = async () => {
    const name = await Prompt.call({
      title: "Renombrar esquema",
      defaultValue: schema.name,
      submitLabel: "Renombrar",
    })
    if (!name || name === schema.name) return
    const input: SchemaInput = {
      name,
      description: schema.description,
      content: schema.content,
      renderedOutput: schema.renderedOutput,
      charset: schema.charset,
    }
    updateSchema.mutate(
      { id: schema.id, input },
      { onError: (err) => toast.error(err.message) },
    )
  }

  const onDelete = async () => {
    const ok = await Confirm.call({
      title: `¿Eliminar «${schema.name}»?`,
      description: "Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar",
      destructive: true,
    })
    if (ok) deleteSchema.mutate(schema.id)
  }

  return (
    <Card className="group gap-3 overflow-hidden py-4">
      <CardContent
        className="cursor-pointer px-4"
        onClick={() => navigate(`/editor/${schema.id}`)}
      >
        <pre className="bg-muted/40 text-muted-foreground h-36 overflow-hidden rounded-md p-3 text-[9px] leading-[13px]">
          {schema.renderedOutput || "(vacío)"}
        </pre>
      </CardContent>
      <CardFooter className="flex items-center gap-2 px-4">
        <div className="min-w-0 flex-1">
          <Link
            to={`/editor/${schema.id}`}
            className="block truncate text-sm font-medium hover:underline"
          >
            {schema.name}
          </Link>
          <p className="text-muted-foreground text-xs">
            {dateFormat.format(schema.updatedAt)}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Acciones">
              <MoreVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/editor/${schema.id}`)}>
              <Pencil /> Abrir
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onRename}>
              <FileText /> Renombrar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => duplicateSchema.mutate(schema.id)}>
              <Copy /> Duplicar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <Trash2 /> Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  )
}

export function SchemasPage() {
  const [search, setSearch] = useState("")
  const [debounced, setDebounced] = useState("")
  const [sort, setSort] = useState<SchemaSort>("updatedAt")

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const { data: schemas, isLoading, isError, error } = useSchemas({
    search: debounced || undefined,
    sort,
  })

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Mis esquemas</h1>
        <div className="ml-auto flex items-center gap-2">
          <Input
            placeholder="Buscar por nombre…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56"
          />
          <Select value={sort} onValueChange={(v) => setSort(v as SchemaSort)}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updatedAt">Última modificación</SelectItem>
              <SelectItem value="createdAt">Fecha de creación</SelectItem>
              <SelectItem value="name">Nombre</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && (
        <p className="text-muted-foreground py-12 text-center">Cargando…</p>
      )}
      {isError && (
        <p className="text-destructive py-12 text-center">{error.message}</p>
      )}
      {schemas && schemas.length === 0 && (
        <div className="text-muted-foreground flex flex-col items-center gap-4 py-16 text-center">
          <p>
            {debounced
              ? "No hay esquemas que coincidan con la búsqueda."
              : "Todavía no tienes esquemas guardados."}
          </p>
          <Button asChild>
            <Link to="/editor">
              <Plus /> Crear el primero
            </Link>
          </Button>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {schemas?.map((s) => <SchemaCard key={s.id} schema={s} />)}
      </div>
    </div>
  )
}
