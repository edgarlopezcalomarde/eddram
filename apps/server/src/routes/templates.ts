import type { TemplateDto } from "@workspace/shared";
import { asc } from "drizzle-orm";
import { Elysia } from "elysia";

import { db } from "../db";
import { templates } from "../db/schema";

export const templatesRoutes = new Elysia({ prefix: "/api/templates" }).get(
  "/",
  (): TemplateDto[] =>
    db.select().from(templates).orderBy(asc(templates.category), asc(templates.name)).all(),
);
