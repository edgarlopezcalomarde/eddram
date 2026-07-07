import type { Charset, TableElement } from "../types";

/** Column widths: the widest cell in each column (min 3 for md separators). */
function columnWidths(rows: string[][]): number[] {
  const cols = Math.max(1, ...rows.map((r) => r.length));
  const widths: number[] = [];
  for (let c = 0; c < cols; c++) {
    let w = 3;
    for (const row of rows) w = Math.max(w, (row[c] ?? "").length);
    widths.push(w);
  }
  return widths;
}

function pad(s: string, width: number): string {
  return s + " ".repeat(Math.max(0, width - s.length));
}

/** Render a table element into display lines (markdown or box-drawing style). */
export function renderTableLines(el: TableElement, charset: Charset): string[] {
  const rows = el.rows.length > 0 ? el.rows : [[""]];
  const widths = columnWidths(rows);
  const lines: string[] = [];

  if (el.tableStyle === "markdown") {
    const renderRow = (row: string[]) =>
      "| " + widths.map((w, c) => pad(row[c] ?? "", w)).join(" | ") + " |";
    rows.forEach((row, i) => {
      lines.push(renderRow(row));
      if (i === 0 && el.headerRow) {
        lines.push("|" + widths.map((w) => "-".repeat(w + 2)).join("|") + "|");
      }
    });
    return lines;
  }

  // box style
  const u = charset === "unicode";
  const [h, v] = u ? ["─", "│"] : ["-", "|"];
  const rule = (l: string, m: string, r: string) =>
    l + widths.map((w) => h.repeat(w + 2)).join(m) + r;
  const top = u ? rule("┌", "┬", "┐") : rule("+", "+", "+");
  const mid = u ? rule("├", "┼", "┤") : rule("+", "+", "+");
  const bottom = u ? rule("└", "┴", "┘") : rule("+", "+", "+");
  const renderRow = (row: string[]) =>
    v + widths.map((w, c) => " " + pad(row[c] ?? "", w) + " ").join(v) + v;

  lines.push(top);
  rows.forEach((row, i) => {
    lines.push(renderRow(row));
    if (i === 0 && el.headerRow && rows.length > 1) lines.push(mid);
  });
  lines.push(bottom);
  return lines;
}
