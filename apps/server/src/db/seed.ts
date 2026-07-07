import { renderElements, TEMPLATE_DEFINITIONS } from "@workspace/shared";

import { db } from "./index";
import { templates } from "./schema";

/**
 * Idempotent template seeding: templates have stable ids, so re-running
 * simply refreshes name/category/content/preview.
 */
export function seedTemplates(): void {
  for (const tpl of TEMPLATE_DEFINITIONS) {
    const row = {
      id: tpl.id,
      name: tpl.name,
      category: tpl.category,
      content: JSON.stringify({ elements: tpl.elements }),
      renderedOutput: renderElements(tpl.elements, "unicode"),
    };
    db.insert(templates)
      .values(row)
      .onConflictDoUpdate({ target: templates.id, set: row })
      .run();
  }
}

if (import.meta.main) {
  seedTemplates();
  console.log(`Seeded ${TEMPLATE_DEFINITIONS.length} templates.`);
}
