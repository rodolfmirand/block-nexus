import type { Hono } from "hono";

import { getDatabasePool } from "../lib/db.js";

type SearchModRow = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
};

type ErrorWithMetadata = {
  message?: string;
  code?: string;
  errno?: string | number;
  syscall?: string;
};

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message.length > 0 ? error.message : error.name;
  }

  if (typeof error === "string" && error.length > 0) {
    return error;
  }

  if (error && typeof error === "object") {
    const metadata = error as ErrorWithMetadata;
    const parts: string[] = [];

    if (typeof metadata.message === "string" && metadata.message.length > 0) {
      parts.push(metadata.message);
    }

    if (typeof metadata.code === "string" && metadata.code.length > 0) {
      parts.push(`code=${metadata.code}`);
    }

    if (metadata.errno !== undefined) {
      parts.push(`errno=${String(metadata.errno)}`);
    }

    if (typeof metadata.syscall === "string" && metadata.syscall.length > 0) {
      parts.push(`syscall=${metadata.syscall}`);
    }

    if (parts.length > 0) {
      return parts.join(" | ");
    }
  }

  return "Unknown search error.";
}

function isDatabaseUnavailable(errorMessage: string): boolean {
  const lowered = errorMessage.toLowerCase();

  return (
    lowered.includes("econnrefused")
    || lowered.includes("connection terminated")
    || lowered.includes("timeout")
    || lowered.includes("connect")
  );
}

function parseLimit(limitParam: string | undefined): number {
  if (!limitParam) {
    return 20;
  }

  const parsed = Number(limitParam);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return 20;
  }

  return Math.min(parsed, 100);
}

function nonEmpty(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

export function registerModsRoutes(app: Hono): void {
  app.get("/mods/search", async (context) => {
    const q = nonEmpty(context.req.query("q"));
    const name = nonEmpty(context.req.query("name"));
    const slug = nonEmpty(context.req.query("slug"));
    const limit = parseLimit(context.req.query("limit"));

    if (!q && !name && !slug) {
      return context.json(
        {
          error: "Invalid query.",
          details: ["At least one filter is required: q, name or slug."]
        },
        400
      );
    }

    const conditions: string[] = [];
    const values: Array<string | number> = [];

    if (q) {
      values.push(`%${q}%`);
      const parameterIndex = values.length;
      conditions.push(`(m.slug ilike $${parameterIndex} or m.title ilike $${parameterIndex})`);
    }

    if (name) {
      values.push(`%${name}%`);
      const parameterIndex = values.length;
      conditions.push(`m.title ilike $${parameterIndex}`);
    }

    if (slug) {
      values.push(`%${slug}%`);
      const parameterIndex = values.length;
      conditions.push(`m.slug ilike $${parameterIndex}`);
    }

    values.push(limit);
    const limitIndex = values.length;

    const query = `
      select
        m.id,
        m.slug,
        m.title,
        m.summary
      from mods m
      where ${conditions.join(" and ")}
      order by m.title asc
      limit $${limitIndex}
    `;

    try {
      const result = await getDatabasePool().query<SearchModRow>(query, values);

      return context.json(
        {
          total: result.rowCount ?? result.rows.length,
          items: result.rows
        },
        200
      );
    } catch (error: unknown) {
      const errorMessage = formatError(error);
      const databaseUnavailable = isDatabaseUnavailable(errorMessage);

      return context.json(
        {
          error: databaseUnavailable ? "Database is unavailable for search." : "Search failed.",
          details: errorMessage
        },
        databaseUnavailable ? 503 : 500
      );
    }
  });
}
