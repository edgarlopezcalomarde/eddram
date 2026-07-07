import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const schemas = sqliteTable("schemas", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  /** JSON-serialized CanvasContent (element list). */
  content: text("content").notNull(),
  /** Pre-rendered ASCII output for fast list previews. */
  renderedOutput: text("rendered_output").notNull(),
  charset: text("charset", { enum: ["ascii", "unicode"] })
    .notNull()
    .default("unicode"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const templates = sqliteTable("templates", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  content: text("content").notNull(),
  renderedOutput: text("rendered_output").notNull(),
});

export type SchemaRow = typeof schemas.$inferSelect;
export type TemplateRow = typeof templates.$inferSelect;
