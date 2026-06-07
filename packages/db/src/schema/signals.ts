import { text, integer, sqliteTable } from 'drizzle-orm/sqlite-core'
import { companies } from './companies'

export const signals = sqliteTable('signals', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  company_id: text('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  type: text('type', {
    enum: ['news', 'funding', 'hiring', 'product', 'social', 'regulatory'],
  }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  url: text('url'),
  source_name: text('source_name'),
  published_at: text('published_at'),
  detected_at: text('detected_at').notNull().$defaultFn(() => new Date().toISOString()),
  is_read: integer('is_read', { mode: 'boolean' }).notNull().default(false),
  sentiment: text('sentiment', { enum: ['positive', 'neutral', 'negative'] })
    .notNull()
    .default('neutral'),
  created_at: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
})
