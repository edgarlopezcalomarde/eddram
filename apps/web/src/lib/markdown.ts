/** Wrap the raw diagram in a fenced code block. */
export function toMarkdown(output: string, attribution: boolean): string {
  const attributionLine = attribution ? "<!-- Generado con EDDRAM -->\n" : ""
  return `${attributionLine}\`\`\`\n${output}\n\`\`\``
}
