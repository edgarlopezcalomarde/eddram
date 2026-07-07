import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // satteri ships a WASM/WASI build that esbuild pre-bundling breaks
  optimizeDeps: {
    exclude: ["satteri"],
  },
  server: {
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
})
