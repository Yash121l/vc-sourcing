import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const fundConfig = sqliteTable('fund_config', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  org_id: text('org_id').notNull().default('default'),
  fund_name: text('fund_name').notNull().default('My VC Fund'),
  fund_thesis: text('fund_thesis'),
  website: text('website'),

  // Investment parameters
  target_stages: text('target_stages').notNull().default('["seed","series_a"]'),
  target_sectors: text('target_sectors').notNull().default('["fintech","saas","healthtech"]'),
  target_geographies: text('target_geographies').notNull().default('["IN","US"]'),
  min_check_usd: integer('min_check_usd').default(500_000),
  max_check_usd: integer('max_check_usd').default(5_000_000),

  // Screening thresholds
  pre_screen_pass_threshold: integer('pre_screen_pass_threshold').default(40),
  pre_screen_advance_threshold: integer('pre_screen_advance_threshold').default(70),

  // Scorecard dimension weights (JSON: { team, market, product, traction, business_model, investment_fit })
  score_weights: text('score_weights').notNull().default(
    '{"team":1.5,"market":1.0,"product":1.0,"traction":1.0,"business_model":1.0,"investment_fit":1.5}'
  ),

  // SLA settings (in hours)
  analyst_review_sla_hours: integer('analyst_review_sla_hours').default(72),
  ic_review_sla_hours: integer('ic_review_sla_hours').default(168),

  // Team configuration (JSON arrays)
  analyst_emails: text('analyst_emails').notNull().default('[]'),
  ic_member_emails: text('ic_member_emails').notNull().default('[]'),
  partner_emails: text('partner_emails').notNull().default('[]'),

  // Customization
  primary_currency: text('primary_currency').default('USD'),
  date_format: text('date_format').default('MMM d, yyyy'),
  timezone: text('timezone').default('Asia/Kolkata'),

  // Email templates
  auto_pass_email_enabled: integer('auto_pass_email_enabled', { mode: 'boolean' }).default(false),
  auto_ack_email_enabled: integer('auto_ack_email_enabled', { mode: 'boolean' }).default(false),
  resend_api_key: text('resend_api_key'),

  created_at: text('created_at').$defaultFn(() => new Date().toISOString()),
  updated_at: text('updated_at').$defaultFn(() => new Date().toISOString()),
})

export type FundConfig = typeof fundConfig.$inferSelect
export type FundConfigInsert = typeof fundConfig.$inferInsert
