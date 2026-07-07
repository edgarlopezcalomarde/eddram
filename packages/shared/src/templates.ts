import type { SchemaElement } from "./types";

/**
 * Built-in template gallery. `renderedOutput` is computed at seed time by
 * the ASCII engine, so the previews always match what the editor renders.
 */
export interface TemplateDefinition {
  id: string;
  name: string;
  category: string;
  elements: SchemaElement[];
}

export const TEMPLATE_DEFINITIONS: TemplateDefinition[] = [
  {
    id: "tpl-client-server",
    name: "Cliente – Servidor",
    category: "Arquitectura",
    elements: [
      { id: "e1", type: "box", x: 0, y: 1, width: 14, height: 5, text: "Cliente", borderStyle: "single", textAlign: "center" },
      { id: "e2", type: "box", x: 30, y: 1, width: 14, height: 5, text: "Servidor", borderStyle: "single", textAlign: "center" },
      { id: "e3", type: "box", x: 60, y: 1, width: 18, height: 5, text: "Base de datos", borderStyle: "double", textAlign: "center" },
      { id: "e4", type: "line", x: 14, y: 3, x2: 29, y2: 3, bend: "h-first", arrowStart: true, arrowEnd: true },
      { id: "e5", type: "line", x: 44, y: 3, x2: 59, y2: 3, bend: "h-first", arrowStart: true, arrowEnd: true },
      { id: "e6", type: "text", x: 17, y: 0, text: "HTTP/JSON" },
      { id: "e7", type: "text", x: 49, y: 0, text: "SQL" },
    ],
  },
  {
    id: "tpl-data-flow",
    name: "Flujo de datos",
    category: "Flujo",
    elements: [
      { id: "e1", type: "box", x: 0, y: 0, width: 13, height: 5, text: "Entrada", borderStyle: "rounded", textAlign: "center" },
      { id: "e2", type: "box", x: 20, y: 0, width: 13, height: 5, text: "Proceso", borderStyle: "rounded", textAlign: "center" },
      { id: "e3", type: "box", x: 40, y: 0, width: 13, height: 5, text: "Salida", borderStyle: "rounded", textAlign: "center" },
      { id: "e4", type: "line", x: 13, y: 2, x2: 19, y2: 2, bend: "h-first", arrowStart: false, arrowEnd: true },
      { id: "e5", type: "line", x: 33, y: 2, x2: 39, y2: 2, bend: "h-first", arrowStart: false, arrowEnd: true },
      { id: "e6", type: "line", x: 26, y: 5, x2: 26, y2: 8, bend: "v-first", arrowStart: false, arrowEnd: true },
      { id: "e7", type: "box", x: 20, y: 9, width: 13, height: 4, text: "Logs", borderStyle: "rounded", textAlign: "center" },
    ],
  },
  {
    id: "tpl-folder-tree",
    name: "Árbol de proyecto",
    category: "Estructura",
    elements: [
      {
        id: "e1",
        type: "tree",
        x: 0,
        y: 0,
        text: [
          "mi-proyecto/",
          "  apps/",
          "    server/",
          "      src/",
          "      package.json",
          "    web/",
          "      src/",
          "      package.json",
          "  packages/",
          "    shared/",
          "  package.json",
          "  README.md",
        ].join("\n"),
      },
    ],
  },
  {
    id: "tpl-sequence",
    name: "Diagrama de secuencia",
    category: "Flujo",
    elements: [
      { id: "e1", type: "text", x: 0, y: 0, text: "Cliente" },
      { id: "e2", type: "text", x: 28, y: 0, text: "Servidor" },
      { id: "e3", type: "line", x: 3, y: 1, x2: 3, y2: 9, bend: "v-first", arrowStart: false, arrowEnd: false },
      { id: "e4", type: "line", x: 31, y: 1, x2: 31, y2: 9, bend: "v-first", arrowStart: false, arrowEnd: false },
      { id: "e5", type: "line", x: 4, y: 3, x2: 30, y2: 3, bend: "h-first", arrowStart: false, arrowEnd: true },
      { id: "e6", type: "text", x: 10, y: 2, text: "GET /datos" },
      { id: "e7", type: "line", x: 30, y: 6, x2: 4, y2: 6, bend: "h-first", arrowStart: false, arrowEnd: true },
      { id: "e8", type: "text", x: 12, y: 5, text: "200 OK" },
    ],
  },
  {
    id: "tpl-cicd",
    name: "Pipeline CI/CD",
    category: "DevOps",
    elements: [
      { id: "e1", type: "divider", x: 0, y: 0, width: 54, lineChar: "=", title: "Pipeline CI/CD" },
      { id: "e2", type: "box", x: 0, y: 2, width: 12, height: 5, text: "Commit", borderStyle: "single", textAlign: "center" },
      { id: "e3", type: "box", x: 15, y: 2, width: 11, height: 5, text: "Build", borderStyle: "single", textAlign: "center" },
      { id: "e4", type: "box", x: 29, y: 2, width: 10, height: 5, text: "Test", borderStyle: "single", textAlign: "center" },
      { id: "e5", type: "box", x: 42, y: 2, width: 12, height: 5, text: "Deploy", borderStyle: "single", textAlign: "center" },
      { id: "e6", type: "line", x: 12, y: 4, x2: 14, y2: 4, bend: "h-first", arrowStart: false, arrowEnd: true },
      { id: "e7", type: "line", x: 26, y: 4, x2: 28, y2: 4, bend: "h-first", arrowStart: false, arrowEnd: true },
      { id: "e8", type: "line", x: 39, y: 4, x2: 41, y2: 4, bend: "h-first", arrowStart: false, arrowEnd: true },
    ],
  },
  {
    id: "tpl-db-schema",
    name: "Esquema de base de datos",
    category: "Datos",
    elements: [
      {
        id: "e1",
        type: "table",
        x: 0,
        y: 0,
        rows: [["users"], ["id (pk)"], ["name"], ["email"]],
        tableStyle: "box",
        headerRow: true,
      },
      {
        id: "e2",
        type: "table",
        x: 30,
        y: 0,
        rows: [["posts"], ["id (pk)"], ["user_id (fk)"], ["title"]],
        tableStyle: "box",
        headerRow: true,
      },
      { id: "e3", type: "line", x: 11, y: 4, x2: 29, y2: 4, bend: "h-first", arrowStart: false, arrowEnd: true },
      { id: "e4", type: "text", x: 14, y: 2, text: "1 ── n" },
    ],
  },
];
