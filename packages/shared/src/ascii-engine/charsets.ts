import type { BoxBorderStyle, Charset } from "../types";

/**
 * Line connectivity is a 4-bit mask: which neighbours a cell connects to.
 * Merging two lines at a cell is a bitwise OR of their masks, and the
 * resulting mask picks the right junction character (`┼`, `├`, `┬`, ...).
 */
export const N = 1;
export const E = 2;
export const S = 4;
export const W = 8;

/** mask (index) -> box-drawing character, single-line Unicode set. */
const UNICODE_BY_MASK: readonly string[] = [
  " ", //  0: nothing
  "│", //  1: N          (stub end, render as vertical)
  "─", //  2: E
  "└", //  3: N|E
  "│", //  4: S
  "│", //  5: N|S
  "┌", //  6: E|S
  "├", //  7: N|E|S
  "─", //  8: W
  "┘", //  9: N|W
  "─", // 10: E|W
  "┴", // 11: N|E|W
  "┐", // 12: S|W
  "┤", // 13: N|S|W
  "┬", // 14: E|S|W
  "┼", // 15: N|E|S|W
];

/** ASCII fallback: straight runs keep -/|, anything else becomes +. */
const ASCII_BY_MASK: readonly string[] = [
  " ",
  "|", "-", "+", "|", "|", "+", "+",
  "-", "+", "-", "+", "+", "+", "+", "+",
];

export function maskToChar(mask: number, charset: Charset): string {
  const table = charset === "unicode" ? UNICODE_BY_MASK : ASCII_BY_MASK;
  return table[mask & 15] ?? " ";
}

export interface BoxChars {
  tl: string;
  tr: string;
  bl: string;
  br: string;
  h: string;
  v: string;
}

export const BOX_CHARS: Record<Charset, Record<BoxBorderStyle, BoxChars>> = {
  unicode: {
    single: { tl: "┌", tr: "┐", bl: "└", br: "┘", h: "─", v: "│" },
    rounded: { tl: "╭", tr: "╮", bl: "╰", br: "╯", h: "─", v: "│" },
    double: { tl: "╔", tr: "╗", bl: "╚", br: "╝", h: "═", v: "║" },
  },
  ascii: {
    single: { tl: "+", tr: "+", bl: "+", br: "+", h: "-", v: "|" },
    rounded: { tl: "+", tr: "+", bl: "+", br: "+", h: "-", v: "|" },
    double: { tl: "+", tr: "+", bl: "+", br: "+", h: "=", v: "|" },
  },
};

export const ARROW_HEADS: Record<
  Charset,
  { up: string; down: string; left: string; right: string }
> = {
  unicode: { up: "▲", down: "▼", left: "◀", right: "▶" },
  ascii: { up: "^", down: "v", left: "<", right: ">" },
};

export interface TreeChars {
  branch: string; // "├── "
  last: string; //   "└── "
  pipe: string; //   "│   "
  blank: string; //  "    "
}

export const TREE_CHARS: Record<Charset, TreeChars> = {
  unicode: { branch: "├── ", last: "└── ", pipe: "│   ", blank: "    " },
  ascii: { branch: "|-- ", last: "`-- ", pipe: "|   ", blank: "    " },
};
