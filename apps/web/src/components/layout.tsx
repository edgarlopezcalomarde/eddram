import { Moon, Plus, Search, Sun } from "lucide-react"
import { useEffect, useState } from "react"
import { Link, Outlet, useNavigate } from "react-router"

import { Button } from "@workspace/ui/components/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@workspace/ui/components/command"

import { useSchemas } from "@/hooks/use-schemas"
import { useTheme } from "@/components/theme-provider"

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches)
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Cambiar tema"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  )
}

/** Ctrl/Cmd+K quick search over saved schemas + shortcuts. */
function QuickSearch() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { data: schemas } = useSchemas({})

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const go = (to: string) => {
    setOpen(false)
    navigate(to)
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="text-muted-foreground hidden gap-2 sm:inline-flex"
        onClick={() => setOpen(true)}
      >
        <Search className="size-3.5" />
        Buscar…
        <kbd className="bg-muted pointer-events-none rounded px-1.5 font-mono text-[10px]">
          Ctrl K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Buscar esquemas o acciones…" />
        <CommandList>
          <CommandEmpty>Sin resultados.</CommandEmpty>
          <CommandGroup heading="Acciones">
            <CommandItem onSelect={() => go("/editor")}>
              Crear esquema nuevo
            </CommandItem>
            <CommandItem onSelect={() => go("/templates")}>
              Explorar plantillas
            </CommandItem>
            <CommandItem onSelect={() => go("/schemas")}>
              Ver mis esquemas
            </CommandItem>
          </CommandGroup>
          {schemas && schemas.length > 0 && (
            <CommandGroup heading="Esquemas">
              {schemas.map((s) => (
                <CommandItem key={s.id} onSelect={() => go(`/editor/${s.id}`)}>
                  {s.name}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}

export function Layout() {
  return (
    <div className="flex h-svh flex-col">
      <header className="flex h-14 shrink-0 items-center gap-4 border-b px-4">
        <Link to="/" className="font-mono text-lg font-bold tracking-tight">
          <span className="text-primary">▦</span> EDDRAM
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/schemas">Mis esquemas</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/templates">Plantillas</Link>
          </Button>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <QuickSearch />
          <ThemeToggle />
          <Button size="sm" asChild>
            <Link to="/editor">
              <Plus /> Crear esquema
            </Link>
          </Button>
        </div>
      </header>
      <main className="min-h-0 flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
