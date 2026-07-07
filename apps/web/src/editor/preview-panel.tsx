import { useEffect, useState } from "react"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"

import { toMarkdown } from "@/lib/markdown"

/**
 * Live preview of the diagram: plain text (what you copy) and the markdown
 * fence interpreted with satteri, i.e. how it will look once pasted in a
 * README.
 */
export function PreviewPanel({ output }: { output: string }) {
  const [html, setHtml] = useState("")

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const { markdownToHtml } = await import("satteri")
        const result = await Promise.resolve(
          markdownToHtml(toMarkdown(output, false)),
        )
        if (!cancelled) setHtml(result.html)
      } catch {
        if (!cancelled) setHtml("")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [output])

  return (
    <Tabs defaultValue="text" className="flex min-h-0 flex-1 flex-col gap-2 p-3">
      <TabsList className="w-full">
        <TabsTrigger value="text" className="flex-1">
          Texto plano
        </TabsTrigger>
        <TabsTrigger value="markdown" className="flex-1">
          Markdown
        </TabsTrigger>
      </TabsList>
      <TabsContent value="text" className="min-h-0 flex-1 overflow-auto">
        <pre className="bg-muted/40 min-h-full rounded-md p-3 text-[11px] leading-4">
          {output || "El lienzo está vacío."}
        </pre>
      </TabsContent>
      <TabsContent value="markdown" className="min-h-0 flex-1 overflow-auto">
        {html ? (
          <div
            className="[&_pre]:bg-muted/40 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-[11px] [&_pre]:leading-4"
            // markup comes from satteri over our own generated markdown
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <pre className="bg-muted/40 rounded-md p-3 text-[11px] leading-4">
            {toMarkdown(output, false)}
          </pre>
        )}
      </TabsContent>
    </Tabs>
  )
}
