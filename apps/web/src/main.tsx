import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { Toaster } from "react-hot-toast"
import { BrowserRouter } from "react-router"

import "@workspace/ui/globals.css"
import { App } from "./App.tsx"
import { Confirm, Prompt } from "@/components/modals.tsx"
import { ThemeProvider } from "@/components/theme-provider.tsx"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
})

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
        <Toaster position="bottom-right" toastOptions={{ duration: 2500 }} />
        <Confirm.Root />
        <Prompt.Root />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>
)
