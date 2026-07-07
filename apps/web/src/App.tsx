import { Route, Routes } from "react-router"

import { Layout } from "@/components/layout"
import { EditorPage } from "@/pages/editor"
import { LandingPage } from "@/pages/landing"
import { SchemasPage } from "@/pages/schemas"
import { TemplatesPage } from "@/pages/templates"

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<LandingPage />} />
        <Route path="schemas" element={<SchemasPage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="editor/:id?" element={<EditorPage />} />
      </Route>
    </Routes>
  )
}
