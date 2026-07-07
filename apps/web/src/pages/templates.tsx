import type { TemplateDto } from "@workspace/shared"
import { ArrowRight } from "lucide-react"
import { useNavigate } from "react-router"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardFooter,
} from "@workspace/ui/components/card"

import { useTemplates } from "@/hooks/use-templates"

function TemplateCard({ template }: { template: TemplateDto }) {
  const navigate = useNavigate()
  const use = () =>
    // the editor picks this up from location.state and starts a new schema
    navigate("/editor", {
      state: { template: { name: template.name, content: template.content } },
    })

  return (
    <Card className="gap-3 overflow-hidden py-4">
      <CardContent className="px-4">
        <pre className="bg-muted/40 text-muted-foreground h-44 overflow-hidden rounded-md p-3 text-[9px] leading-[13px]">
          {template.renderedOutput}
        </pre>
      </CardContent>
      <CardFooter className="flex items-center gap-2 px-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{template.name}</p>
          <Badge variant="secondary" className="mt-1">
            {template.category}
          </Badge>
        </div>
        <Button size="sm" onClick={use}>
          Usar <ArrowRight />
        </Button>
      </CardFooter>
    </Card>
  )
}

export function TemplatesPage() {
  const { data: templates, isLoading, isError, error } = useTemplates()

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Plantillas</h1>
        <p className="text-muted-foreground text-sm">
          Elige un punto de partida: todo es editable después.
        </p>
      </div>
      {isLoading && (
        <p className="text-muted-foreground py-12 text-center">Cargando…</p>
      )}
      {isError && (
        <p className="text-destructive py-12 text-center">{error.message}</p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates?.map((t) => <TemplateCard key={t.id} template={t} />)}
      </div>
    </div>
  )
}
