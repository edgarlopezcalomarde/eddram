import type { Charset } from "../types";
import { TREE_CHARS } from "./charsets";

interface TreeItem {
  depth: number;
  label: string;
}

/**
 * Parse the tree element's raw text: one item per line, nesting given by
 * two leading spaces (or one tab) per level. Depths are clamped so a line
 * can nest at most one level deeper than the previous one.
 */
export function parseTreeText(text: string): TreeItem[] {
  const items: TreeItem[] = [];
  for (const rawLine of text.split("\n")) {
    if (rawLine.trim() === "") continue;
    const indent = rawLine.match(/^[\t ]*/)?.[0] ?? "";
    let depth = 0;
    for (let i = 0; i < indent.length; i++) {
      if (indent[i] === "\t") depth += 1;
      else {
        // count pairs of spaces
        const spaces = indent.slice(i).length;
        depth += Math.floor(spaces / 2);
        break;
      }
    }
    const prev = items[items.length - 1];
    const maxDepth = prev ? prev.depth + 1 : 0;
    items.push({ depth: Math.min(depth, maxDepth), label: rawLine.trim() });
  }
  return items;
}

/**
 * Render tree items into display lines with `├──`/`└──` prefixes.
 * An item is "last" among its siblings when no later item shares its depth
 * before the depth drops below it.
 */
export function renderTreeLines(text: string, charset: Charset): string[] {
  const items = parseTreeText(text);
  const chars = TREE_CHARS[charset];
  const lines: string[] = [];
  // lastAtDepth[d] = true when the current branch at depth d has no more siblings
  const lastAtDepth: boolean[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i]!;
    let isLast = true;
    for (let j = i + 1; j < items.length; j++) {
      const next = items[j]!;
      if (next.depth < item.depth) break;
      if (next.depth === item.depth) {
        isLast = false;
        break;
      }
    }
    lastAtDepth[item.depth] = isLast;

    if (item.depth === 0) {
      lines.push(item.label);
      continue;
    }
    let prefix = "";
    for (let d = 1; d < item.depth; d++) {
      prefix += lastAtDepth[d] ? chars.blank : chars.pipe;
    }
    prefix += isLast ? chars.last : chars.branch;
    lines.push(prefix + item.label);
  }
  return lines;
}
