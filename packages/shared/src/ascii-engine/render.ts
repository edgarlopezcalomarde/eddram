import type {
  BoxElement,
  Charset,
  DividerElement,
  LineElement,
  SchemaElement,
  TableElement,
  TextElement,
  TreeElement,
} from "../types";
import { ARROW_HEADS, BOX_CHARS, E, N, S, W } from "./charsets";
import { CharGrid } from "./grid";
import { renderTableLines } from "./table";
import { renderTreeLines } from "./tree";

/* ------------------------------------------------------------------ */
/* Painters — one per element type                                      */
/* ------------------------------------------------------------------ */

/** Word-wrap `text` to `width` columns, hard-breaking words that overflow. */
export function wrapText(text: string, width: number): string[] {
  if (width <= 0) return [];
  const out: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      let w = word;
      while (w.length > width) {
        // hard-break oversized words
        if (line) {
          out.push(line);
          line = "";
        }
        out.push(w.slice(0, width));
        w = w.slice(width);
      }
      if (!line) line = w;
      else if (line.length + 1 + w.length <= width) line += " " + w;
      else {
        out.push(line);
        line = w;
      }
    }
    out.push(line);
  }
  // drop a single trailing empty line produced by empty input
  while (out.length > 0 && out[out.length - 1] === "" && out.length > text.split("\n").length)
    out.pop();
  return out;
}

function paintBox(grid: CharGrid, el: BoxElement, charset: Charset): void {
  const { x, y } = el;
  const w = Math.max(2, el.width);
  const h = Math.max(2, el.height);
  const c = BOX_CHARS[charset][el.borderStyle];
  const right = x + w - 1;
  const bottom = y + h - 1;

  // interior first (plain spaces wipe whatever is underneath)
  for (let cy = y + 1; cy < bottom; cy++)
    for (let cx = x + 1; cx < right; cx++) grid.set(cx, cy, " ");

  // borders keep a connectivity mask so lines drawn later merge into them
  for (let cx = x + 1; cx < right; cx++) {
    grid.setBorder(cx, y, c.h, E | W);
    grid.setBorder(cx, bottom, c.h, E | W);
  }
  for (let cy = y + 1; cy < bottom; cy++) {
    grid.setBorder(x, cy, c.v, N | S);
    grid.setBorder(right, cy, c.v, N | S);
  }
  grid.setBorder(x, y, c.tl, E | S);
  grid.setBorder(right, y, c.tr, S | W);
  grid.setBorder(x, bottom, c.bl, N | E);
  grid.setBorder(right, bottom, c.br, N | W);

  // text: 1-cell padding inside the border, vertically centered
  const innerW = w - 4;
  const innerH = h - 2;
  if (innerW <= 0 || innerH <= 0 || !el.text) return;
  const lines = wrapText(el.text, innerW).slice(0, innerH);
  const startY = y + 1 + Math.floor((innerH - lines.length) / 2);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!;
    const offset =
      el.textAlign === "center" ? Math.floor((innerW - line.length) / 2) : 0;
    grid.writeText(x + 2 + offset, startY + i, line);
  }
}

function paintLine(grid: CharGrid, el: LineElement, charset: Charset): void {
  const { x, y, x2, y2 } = el;
  // per-cell connectivity masks for the whole polyline (OR-ed at the corner)
  const cells = new Map<string, number>();
  const add = (cx: number, cy: number, mask: number) => {
    const key = `${cx},${cy}`;
    cells.set(key, (cells.get(key) ?? 0) | mask);
  };
  const addH = (fromX: number, toX: number, cy: number) => {
    const [a, b] = fromX <= toX ? [fromX, toX] : [toX, fromX];
    for (let cx = a; cx <= b; cx++) {
      if (a === b) add(cx, cy, E | W);
      else add(cx, cy, (cx > a ? W : 0) | (cx < b ? E : 0));
    }
  };
  const addV = (fromY: number, toY: number, cx: number) => {
    const [a, b] = fromY <= toY ? [fromY, toY] : [toY, fromY];
    for (let cy = a; cy <= b; cy++) {
      if (a === b) add(cx, cy, N | S);
      else add(cx, cy, (cy > a ? N : 0) | (cy < b ? S : 0));
    }
  };

  if (y === y2) addH(x, x2, y);
  else if (x === x2) addV(y, y2, x);
  else if (el.bend === "h-first") {
    addH(x, x2, y);
    addV(y, y2, x2);
  } else {
    addV(y, y2, x);
    addH(x, x2, y2);
  }

  for (const [key, mask] of cells) {
    const [cx, cy] = key.split(",").map(Number) as [number, number];
    grid.setLine(cx, cy, mask, charset);
  }

  // arrowheads overwrite the end cells (they don't participate in junctions)
  const heads = ARROW_HEADS[charset];
  if (el.arrowEnd) {
    // points along the direction of the last segment, into (x2, y2)
    const lastHorizontal = x !== x2 && (y === y2 || el.bend === "v-first");
    grid.set(
      x2,
      y2,
      lastHorizontal ? (x2 > x ? heads.right : heads.left) : y2 >= y ? heads.down : heads.up,
    );
  }
  if (el.arrowStart) {
    // points away from the first segment, out of (x, y)
    const firstHorizontal = x !== x2 && (y === y2 || el.bend === "h-first");
    grid.set(
      x,
      y,
      firstHorizontal ? (x2 > x ? heads.left : heads.right) : y2 >= y ? heads.up : heads.down,
    );
  }
}

function paintText(grid: CharGrid, el: TextElement): void {
  el.text.split("\n").forEach((line, i) => grid.writeText(el.x, el.y + i, line));
}

function paintTree(grid: CharGrid, el: TreeElement, charset: Charset): void {
  renderTreeLines(el.text, charset).forEach((line, i) =>
    grid.writeText(el.x, el.y + i, line),
  );
}

function paintTable(grid: CharGrid, el: TableElement, charset: Charset): void {
  renderTableLines(el, charset).forEach((line, i) =>
    grid.writeText(el.x, el.y + i, line),
  );
}

function paintDivider(grid: CharGrid, el: DividerElement): void {
  const width = Math.max(1, el.width);
  let line: string;
  if (el.title && el.title.trim()) {
    const label = ` ${el.title.trim()} `;
    if (label.length >= width) line = label.slice(0, width);
    else {
      const left = Math.floor((width - label.length) / 2);
      const right = width - label.length - left;
      line = el.lineChar.repeat(left) + label + el.lineChar.repeat(right);
    }
  } else {
    line = el.lineChar.repeat(width);
  }
  grid.writeText(el.x, el.y, line);
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

function paintElement(grid: CharGrid, el: SchemaElement, charset: Charset): void {
  switch (el.type) {
    case "box":
      return paintBox(grid, el, charset);
    case "line":
      return paintLine(grid, el, charset);
    case "text":
      return paintText(grid, el);
    case "tree":
      return paintTree(grid, el, charset);
    case "table":
      return paintTable(grid, el, charset);
    case "divider":
      return paintDivider(grid, el);
  }
}

/**
 * Render a list of elements to the final plain-text output.
 * Array order is z-order: later elements paint over earlier ones.
 */
export function renderElements(elements: SchemaElement[], charset: Charset): string {
  const grid = new CharGrid();
  for (const el of elements) paintElement(grid, el, charset);
  return grid.toString();
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Bounding box of a single element, in grid cells (used by the editor overlay). */
export function getElementBounds(el: SchemaElement, charset: Charset): Bounds {
  switch (el.type) {
    case "box":
      return { x: el.x, y: el.y, width: Math.max(2, el.width), height: Math.max(2, el.height) };
    case "line": {
      const x = Math.min(el.x, el.x2);
      const y = Math.min(el.y, el.y2);
      return {
        x,
        y,
        width: Math.abs(el.x2 - el.x) + 1,
        height: Math.abs(el.y2 - el.y) + 1,
      };
    }
    case "text": {
      const lines = el.text.split("\n");
      return {
        x: el.x,
        y: el.y,
        width: Math.max(1, ...lines.map((l) => l.length)),
        height: lines.length,
      };
    }
    case "tree": {
      const lines = renderTreeLines(el.text, charset);
      return {
        x: el.x,
        y: el.y,
        width: Math.max(1, ...lines.map((l) => l.length)),
        height: Math.max(1, lines.length),
      };
    }
    case "table": {
      const lines = renderTableLines(el, charset);
      return {
        x: el.x,
        y: el.y,
        width: Math.max(1, ...lines.map((l) => l.length)),
        height: lines.length,
      };
    }
    case "divider":
      return { x: el.x, y: el.y, width: Math.max(1, el.width), height: 1 };
  }
}
