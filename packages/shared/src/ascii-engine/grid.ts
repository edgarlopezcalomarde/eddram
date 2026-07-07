import type { Charset } from "../types";
import { maskToChar } from "./charsets";

interface Cell {
  ch: string;
  /**
   * Line-connectivity mask (N|E|S|W bits) when this cell belongs to a line
   * or a box border. 0 means "plain character": lines drawn later will
   * overwrite it instead of merging with it.
   */
  mask: number;
}

/**
 * A sparse, auto-growing 2D character matrix. Elements are painted onto it
 * in z-order (later paints win); line-vs-line collisions merge connectivity
 * masks so crossings resolve to the correct junction character.
 */
export class CharGrid {
  private rows: (Cell | undefined)[][] = [];

  private ensureRow(y: number): (Cell | undefined)[] {
    let row = this.rows[y];
    if (!row) {
      row = [];
      this.rows[y] = row;
    }
    return row;
  }

  /** Plain overwrite: clears any line metadata at the cell. */
  set(x: number, y: number, ch: string): void {
    if (x < 0 || y < 0) return;
    this.ensureRow(y)[x] = { ch, mask: 0 };
  }

  /**
   * Paint a line cell. If the target cell already holds a line, the masks
   * are OR-ed together and the char is recomputed (junction resolution).
   * Otherwise the line simply overwrites what is there.
   *
   * `ch` is optional: when given (box borders with double/rounded styles)
   * it is used as-is for the non-merged case, so styles are preserved
   * except at actual junction points.
   */
  setLine(x: number, y: number, mask: number, charset: Charset, ch?: string): void {
    if (x < 0 || y < 0) return;
    const row = this.ensureRow(y);
    const existing = row[x];
    if (existing && existing.mask !== 0) {
      const merged = existing.mask | mask;
      row[x] = { ch: maskToChar(merged, charset), mask: merged };
    } else {
      row[x] = { ch: ch ?? maskToChar(mask, charset), mask };
    }
  }

  /** Overwrite a cell but keep it "mergeable" by later lines (box borders). */
  setBorder(x: number, y: number, ch: string, mask: number): void {
    if (x < 0 || y < 0) return;
    this.ensureRow(y)[x] = { ch, mask };
  }

  /** Write a horizontal run of text starting at (x, y). Clips negative x. */
  writeText(x: number, y: number, text: string): void {
    for (let i = 0; i < text.length; i++) {
      const ch = text[i]!;
      this.set(x + i, y, ch);
    }
  }

  /**
   * Serialize the grid. Trailing spaces on each row and empty rows at the
   * end are trimmed; interior empty rows are preserved.
   */
  toString(): string {
    // Array.from (unlike .map) visits holes in sparse arrays, so untouched
    // cells become spaces instead of silently collapsing.
    const lines = Array.from(this.rows, (row) =>
      Array.from(row ?? [], (cell) => cell?.ch ?? " ")
        .join("")
        .replace(/\s+$/, ""),
    );
    while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
    return lines.join("\n");
  }
}
