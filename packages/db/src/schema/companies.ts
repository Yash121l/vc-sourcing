import { text, integer, real, sqliteTable } from 'drizzle-orm/sqlite-core'

export const companies = sqliteTable('companies', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  website: text('website'),
  description: text('description'),
  logo_url: text('logo_url'),
  stage: text('stage', {
    enum: ['pre_seed', 'seed', 'series_a', 'series_b', 'growth', 'unknown'],
  }).notNull().default('unknown'),
  sector: text('sector', {
    enum: ['fintech', 'saas', 'consumer', 'deeptech', 'healthtech', 'edtech',
           'ecommerce', 'climate', 'agritech', 'logistics', 'proptech',
           'hrtech', 'legaltech', 'other'],
  }).notNull().default('other'),
  subsector: text('subsector'),
  geography: text('geography'),
  city: text('city'),
  founded_year: integer('founded_year'),
  team_size: integer('team_size'),
  funding_total_usd: real('funding_total_usd'),
  last_funding_date: text('last_funding_date'),
  last_funding_amount_usd: real('last_funding_amount_usd'),
  last_funding_type: text('last_funding_type'),
  arr_usd: real('arr_usd'),
  mrr_usd: real('mrr_usd'),
  growth_rate_pct: real('growth_rate_pct'),
  status: text('status', {
    enum: ['radar', 'contacted', 'engaged', 'screening', 'passed', 'watch', 'proceeding'],
  }).notNull().default('radar'),
  source_type: text('source_type', {
    enum: ['inbound_portal', 'outbound_search', 'scout_referral', 'co_investor',
           'demo_day', 'conference', 'newsletter', 'linkedin', 'angellist', 'warm_intro'],
  }).notNull().default('inbound_portal'),
  source_detail: text('source_detail'),
  assigned_to: text('assigned_to'),
  ai_pre_score: real('ai_pre_score'),
  ai_pre_summary: text('ai_pre_summary'),
  pass_reason: text('pass_reason'),
  crunchbase_url: text('crunchbase_url'),
  linkedin_url: text('linkedin_url'),
  angellist_url: text('angellist_url'),
  github_url: text('github_url'),
  created_at: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updated_at: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
})

export const contacts = sqliteTable('contacts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  company_id: text('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  role: text('role', {
    enum: ['founder', 'co_founder', 'cto', 'coo', 'advisor', 'investor', 'other'],
  }).notNull().default('founder'),
  title: text('title'),
  linkedin_url: text('linkedin_url'),
  twitter_url: text('twitter_url'),
  email: text('email'),
  background: text('background'),
  education: text('education'),
  is_founder: integer('is_founder', { mode: 'boolean' }).notNull().default(true),
  created_at: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updated_at: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
})

export const outreach = sqliteTable('outreach', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  company_id: text('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  contact_id: text('contact_id').references(() => contacts.id),
  type: text('type', { enum: ['email', 'linkedin', 'intro', 'event', 'phone'] }).notNull(),
  status: text('status', {
    enum: ['planned', 'sent', 'replied', 'meeting_scheduled', 'no_response', 'bounced'],
  }).notNull().default('planned'),
  sent_at: text('sent_at'),
  replied_at: text('replied_at'),
  notes: text('notes'),
  template_used: text('template_used'),
  created_at: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updated_at: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
})
