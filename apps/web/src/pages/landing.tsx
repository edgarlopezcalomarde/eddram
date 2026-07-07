import { ArrowRight, LayoutTemplate } from "lucide-react"
import { Link } from "react-router"

import { Button } from "@workspace/ui/components/button"

const HERO = String.raw`
┌──────────┐      ╭───────────╮      ╔════════════╗
│  Cajas   │─────▶│ Conectores│─────▶║  Markdown  ║
└──────────┘      ╰───────────╯      ╚════════════╝
`.trim()

export function LandingPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-8 px-6 py-20 text-center">
      <pre className="text-muted-foreground overflow-x-auto text-xs leading-relaxed sm:text-sm">
        {HERO}
      </pre>
      <div className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">EDDRAM</h1>
        <p className="text-muted-foreground max-w-xl text-balance">
          Constructor visual de esquemas y diagramas ASCII. Dibuja cajas,
          flechas, árboles y tablas sobre una rejilla monoespaciada y pega el
          resultado en tus READMEs, documentación o prompts de IA.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button size="lg" asChild>
          <Link to="/editor">
            Crear esquema <ArrowRight />
          </Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link to="/templates">
            <LayoutTemplate /> Ver plantillas
          </Link>
        </Button>
      </div>
    </div>
  )
}
