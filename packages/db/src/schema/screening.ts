import { text, real, sqliteTable } from 'drizzle-orm/sqlite-core'
import { companies } from './companies'

export const screenings = sqliteTable('screenings', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  company_id: text('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  screened_by: text('screened_by'),
  screening_date: text('screening_date'),

  // 6-dimension scorecard (1-10)
  score_team: real('score_team'),
  score_market: real('score_market'),
  score_product: real('score_product'),
  score_traction: real('score_traction'),
  score_business_model: real('score_business_model'),
  score_investment_fit: real('score_investment_fit'),
  overall_score: real('overall_score'),

  // AI-generated rationale per dimension (JSON)
  ai_score_rationale: text('ai_score_rationale'),

  // Decision
  decision: text('decision', { enum: ['pass', 'proceed', 'watch'] }),
  decision_rationale: text('decision_rationale'),

  // Notes and AI content
  meeting_notes: text('meeting_notes'),
  ai_summary: text('ai_summary'),
  ai_flags: text('ai_flags'),         // JSON: RedFlag[]
  ai_one_pager: text('ai_one_pager'), // markdown
  ic_memo_draft: text('ic_memo_draft'), // markdown

  status: text('status', { enum: ['queued', 'in_progress', 'completed'] })
    .notNull()
    .default('queued'),

  created_at: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updated_at: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
})
