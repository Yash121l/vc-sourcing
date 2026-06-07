// DB package exports the schema only.
// The Drizzle client is created per-request in apps/api/src/index.ts
// using the D1 binding: drizzle(c.env.DB, { schema })
export * from './schema'
export type { InferSelectModel, InferInsertModel } from 'drizzle-orm'
