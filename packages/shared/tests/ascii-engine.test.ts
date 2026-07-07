import { describe, expect, test } from "bun:test";

import {
  renderElements,
  renderTreeLines,
  getElementBounds,
  TEMPLATE_DEFINITIONS,
} from "../src";
import type { BoxElement, LineElement, SchemaElement } from "../src";

const box = (partial: Partial<BoxElement>): BoxElement => ({
  id: "b",
  type: "box",
  x: 0,
  y: 0,
  width: 7,
  height: 3,
  text: "",
  borderStyle: "single",
  textAlign: "left",
  ...partial,
});

const line = (partial: Partial<LineElement>): LineElement => ({
  id: "l",
  type: "line",
  x: 0,
  y: 0,
  x2: 0,
  y2: 0,
  bend: "h-first",
  arrowStart: false,
  arrowEnd: false,
  ...partial,
});

describe("boxes", () => {
  test("unicode single box with centered text", () => {
    expect(
      renderElements([box({ width: 9, height: 3, text: "hey", textAlign: "center" })], "unicode"),
    ).toBe(["┌───────┐", "│  hey  │", "└───────┘"].join("\n"));
  });

  test("ascii double box", () => {
    expect(renderElements([box({ borderStyle: "double", width: 6, height: 3 })], "ascii")).toBe(
      ["+====+", "|    |", "+====+"].join("\n"),
    );
  });

  test("unicode rounded box", () => {
    expect(renderElements([box({ borderStyle: "rounded", width: 5, height: 3 })], "unicode")).toBe(
      ["╭───╮", "│   │", "╰───╯"].join("\n"),
    );
  });

  test("later boxes paint over earlier ones (z-order)", () => {
    const out = renderElements(
      [box({ width: 8, height: 4, text: "under" }), box({ x: 2, y: 1, width: 8, height: 4 })],
      "unicode",
    );
    // the second box's interior wipes the first box's right border
    expect(out).toContain("┌─────");
    expect(out.split("\n")[2]).toBe("│ │      │");
  });
});

describe("lines and junctions", () => {
  test("crossing lines produce ┼ in unicode", () => {
    const out = renderElements(
      [line({ x: 0, y: 1, x2: 4, y2: 1 }), line({ x: 2, y: 0, x2: 2, y2: 2, bend: "v-first" })],
      "unicode",
    );
    expect(out.split("\n")[1]).toBe("──┼──");
  });

  test("crossing lines produce + in ascii", () => {
    const out = renderElements(
      [line({ x: 0, y: 1, x2: 4, y2: 1 }), line({ x: 2, y: 0, x2: 2, y2: 2, bend: "v-first" })],
      "ascii",
    );
    expect(out.split("\n")[1]).toBe("--+--");
  });

  test("line ending on another line forms a tee", () => {
    const out = renderElements(
      [line({ x: 2, y: 0, x2: 2, y2: 2, bend: "v-first" }), line({ x: 2, y: 1, x2: 5, y2: 1 })],
      "unicode",
    );
    expect(out.split("\n")[1]).toBe("  ├───");
  });

  test("line merging into a box border forms a tee", () => {
    const out = renderElements(
      [box({ width: 5, height: 3 }), line({ x: 4, y: 1, x2: 8, y2: 1 })],
      "unicode",
    );
    expect(out.split("\n")[1]).toBe("│   ├────");
  });

  test("L-shaped connector, h-first, with arrow", () => {
    const out = renderElements([line({ x: 0, y: 0, x2: 3, y2: 2, arrowEnd: true })], "unicode");
    expect(out).toBe(["───┐", "   │", "   ▼"].join("\n"));
  });

  test("double-headed horizontal arrow in ascii", () => {
    const out = renderElements(
      [line({ x: 0, y: 0, x2: 4, y2: 0, arrowStart: true, arrowEnd: true })],
      "ascii",
    );
    expect(out).toBe("<--->");
  });
});

describe("trees", () => {
  test("renders branch/last prefixes with nesting", () => {
    const lines = renderTreeLines("root/\n  a/\n    a1\n  b", "unicode");
    expect(lines).toEqual(["root/", "├── a/", "│   └── a1", "└── b"]);
  });

  test("ascii charset uses pipe/backtick prefixes", () => {
    const lines = renderTreeLines("root/\n  a\n  b", "ascii");
    expect(lines).toEqual(["root/", "|-- a", "`-- b"]);
  });
});

describe("tables", () => {
  test("markdown style with header separator", () => {
    const out = renderElements(
      [
        {
          id: "t",
          type: "table",
          x: 0,
          y: 0,
          rows: [
            ["col", "value"],
            ["a", "1"],
          ],
          tableStyle: "markdown",
          headerRow: true,
        },
      ],
      "unicode",
    );
    expect(out).toBe(["| col | value |", "|-----|-------|", "| a   | 1     |"].join("\n"));
  });

  test("box style uses junction characters", () => {
    const out = renderElements(
      [
        {
          id: "t",
          type: "table",
          x: 0,
          y: 0,
          rows: [
            ["a", "b"],
            ["1", "2"],
          ],
          tableStyle: "box",
          headerRow: true,
        },
      ],
      "unicode",
    );
    expect(out.split("\n")[0]).toBe("┌─────┬─────┐");
    expect(out.split("\n")[2]).toBe("├─────┼─────┤");
    expect(out.split("\n")[4]).toBe("└─────┴─────┘");
  });
});

describe("dividers and output trimming", () => {
  test("divider with centered title", () => {
    const out = renderElements(
      [{ id: "d", type: "divider", x: 0, y: 0, width: 14, lineChar: "=", title: "Fin" }],
      "ascii",
    );
    expect(out).toBe("==== Fin =====");
  });

  test("trailing spaces and empty rows are trimmed, interior rows kept", () => {
    const elements: SchemaElement[] = [
      { id: "t1", type: "text", x: 0, y: 0, text: "top" },
      { id: "t2", type: "text", x: 2, y: 3, text: "bottom" },
    ];
    expect(renderElements(elements, "ascii")).toBe("top\n\n\n  bottom");
  });
});

describe("bounds", () => {
  test("line bounds normalize direction", () => {
    expect(getElementBounds(line({ x: 5, y: 4, x2: 1, y2: 0 }), "unicode")).toEqual({
      x: 1,
      y: 0,
      width: 5,
      height: 5,
    });
  });

  test("tree bounds match rendered lines", () => {
    const b = getElementBounds({ id: "t", type: "tree", x: 2, y: 1, text: "a/\n  b" }, "unicode");
    expect(b).toEqual({ x: 2, y: 1, width: 5, height: 2 });
  });
});

describe("templates", () => {
  test("every template renders non-empty output in both charsets", () => {
    for (const tpl of TEMPLATE_DEFINITIONS) {
      for (const charset of ["ascii", "unicode"] as const) {
        const out = renderElements(tpl.elements, charset);
        expect(out.length).toBeGreaterThan(0);
      }
    }
  });
});
