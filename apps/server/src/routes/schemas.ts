import type { SchemaDto } from "@workspace/shared";
import { asc, desc, eq, like } from "drizzle-orm";
import { Elysia, t } from "elysia";
import { nanoid } from "nanoid";

import { db } from "../db";
import { schemas } from "../db/schema";
import { notFound } from "../http-error";

const schemaBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 200 }),
  description: t.Optional(t.Nullable(t.String({ maxLength: 2000 }))),
  content: t.String(),
  renderedOutput: t.String(),
  charset: t.Union([t.Literal("ascii"), t.Literal("unicode")]),
});

const idParams = t.Object({ id: t.String() });

const toDto = (row: typeof schemas.$inferSelect): SchemaDto => row;

function getSchemaOr404(id: string) {
  const row = db.select().from(schemas).where(eq(schemas.id, id)).get();
  if (!row) throw notFound("Esquema");
  return row;
}

export const schemasRoutes = new Elysia({ prefix: "/api/schemas" })
  .get(
    "/",
    ({ query }) => {
      const sort = query.sort ?? "updatedAt";
      const order =
        sort === "name"
          ? asc(schemas.name)
          : sort === "createdAt"
            ? desc(schemas.createdAt)
            : desc(schemas.updatedAt);
      let q = db.select().from(schemas).orderBy(order).$dynamic();
      if (query.search) {
        // escape LIKE wildcards so the search is a literal substring match
        const escaped = query.search.replace(/[%_\\]/g, (m) => `\\${m}`);
        q = q.where(like(schemas.name, `%${escaped}%`));
      }
      return q.all().map(toDto);
    },
    {
      query: t.Object({
        search: t.Optional(t.String()),
        sort: t.Optional(
          t.Union([t.Literal("updatedAt"), t.Literal("createdAt"), t.Literal("name")]),
        ),
      }),
    },
  )
  .get("/:id", ({ params }) => toDto(getSchemaOr404(params.id)), { params: idParams })
  .post(
    "/",
    ({ body, set }) => {
      const now = Date.now();
      const row = {
        id: nanoid(12),
        name: body.name,
        description: body.description ?? null,
        content: body.content,
        renderedOutput: body.renderedOutput,
        charset: body.charset,
        createdAt: now,
        updatedAt: now,
      };
      db.insert(schemas).values(row).run();
      set.status = 201;
      return toDto(row);
    },
    { body: schemaBody },
  )
  .put(
    "/:id",
    ({ params, body }) => {
      const existing = getSchemaOr404(params.id);
      const row = {
        ...existing,
        name: body.name,
        description: body.description ?? null,
        content: body.content,
        renderedOutput: body.renderedOutput,
        charset: body.charset,
        updatedAt: Date.now(),
      };
      db.update(schemas).set(row).where(eq(schemas.id, params.id)).run();
      return toDto(row);
    },
    { params: idParams, body: schemaBody },
  )
  .post(
    "/:id/duplicate",
    ({ params, set }) => {
      const source = getSchemaOr404(params.id);
      const now = Date.now();
      const copy = {
        ...source,
        id: nanoid(12),
        name: `${source.name} (copia)`,
        createdAt: now,
        updatedAt: now,
      };
      db.insert(schemas).values(copy).run();
      set.status = 201;
      return toDto(copy);
    },
    { params: idParams },
  )
  .delete(
    "/:id",
    ({ params }) => {
      getSchemaOr404(params.id);
      db.delete(schemas).where(eq(schemas.id, params.id)).run();
      return { ok: true };
    },
    { params: idParams },
  );
