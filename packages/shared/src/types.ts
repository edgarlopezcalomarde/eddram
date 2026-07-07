/**
 * Shared types between server and web client.
 * The canvas is a character grid: all positions/sizes are in character cells.
 */

export type Charset = "ascii" | "unicode";

export type BoxBorderStyle = "single" | "double" | "rounded";

export type TableStyle = "markdown" | "box";

/** For L-shaped connectors: which segment is drawn first from the start point. */
export type LineBend = "h-first" | "v-first";

export interface BaseElement {
  id: string;
  /** Top-left cell (for lines: the start point). */
  x: number;
  y: number;
}

export interface BoxElement extends BaseElement {
  type: "box";
  width: number;
  height: number;
  text: string;
  borderStyle: BoxBorderStyle;
  textAlign: "left" | "center";
}

/**
 * Straight or L-shaped connector between (x, y) and (x2, y2),
 * with optional arrowheads on either end.
 */
export interface LineElement extends BaseElement {
  type: "line";
  x2: number;
  y2: number;
  bend: LineBend;
  arrowStart: boolean;
  arrowEnd: boolean;
}

export interface TextElement extends BaseElement {
  type: "text";
  text: string;
}

/**
 * Directory tree. `text` holds one item per line; nesting is expressed
 * with two leading spaces per depth level (tabs also count as one level).
 */
export interface TreeElement extends BaseElement {
  type: "tree";
  text: string;
}

export interface TableElement extends BaseElement {
  type: "table";
  rows: string[][];
  tableStyle: TableStyle;
  /** When true the first row is a header (markdown separator / heavier separation). */
  headerRow: boolean;
}

export interface DividerElement extends BaseElement {
  type: "divider";
  width: number;
  lineChar: "=" | "-";
  /** Optional centered title, e.g. `===== Deploy =====`. */
  title?: string;
}

export type SchemaElement =
  | BoxElement
  | LineElement
  | TextElement
  | TreeElement
  | TableElement
  | DividerElement;

export type ElementType = SchemaElement["type"];

/** One page of the editor: its own bounded grid of elements. */
export interface Sheet {
  id: string;
  name: string;
  elements: SchemaElement[];
}

/** What gets JSON-serialized into `schemas.content`. */
export interface CanvasContent {
  sheets: Sheet[];
}

/* ------------------------------------------------------------------ */
/* API DTOs                                                            */
/* ------------------------------------------------------------------ */

export interface SchemaDto {
  id: string;
  name: string;
  description: string | null;
  /** JSON-serialized CanvasContent. */
  content: string;
  /** Pre-rendered ASCII output, for fast list previews. */
  renderedOutput: string;
  charset: Charset;
  createdAt: number;
  updatedAt: number;
}

export interface SchemaInput {
  name: string;
  description?: string | null;
  content: string;
  renderedOutput: string;
  charset: Charset;
}

export type SchemaSort = "updatedAt" | "createdAt" | "name";

export interface TemplateDto {
  id: string;
  name: string;
  category: string;
  /** JSON-serialized CanvasContent. */
  content: string;
  renderedOutput: string;
}

export interface ApiError {
  error: string;
  message: string;
}
