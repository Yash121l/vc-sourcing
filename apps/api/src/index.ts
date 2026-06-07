import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { streamSSE } from 'hono/streaming'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, desc, like, inArray, and } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { companies, contacts, screenings, signals, fundConfig } from '@vc/db'
import type { AppEnv } from './env'
import { authMiddleware } from './middleware/auth'
import { errorHandler, rateLimiter } from './middleware/validate'
import { authRoute } from './routes/auth'
import { configRoute } from './routes/config'
import { SourcingAgent } from './agents/sourcing-agent'
import { ScreeningAgent } from './agents/screening-agent'
import { EnrichmentAgent } from './agents/enrichment-agent'

const schema = { companies, contacts, screenings, signals, fundConfig }

const app = new Hono<AppEnv>()

// ─── Global middleware ──────────────────────────────────────────────────────
app.use('*', errorHandler())
app.use('*', rateLimiter({ windowMs: 60_000, max: 300 }))
app.use('*', logger())
app.use('*', cors({
  origin: (origin, c) => c.env.WEB_URL ?? 'http://localhost:5173',
  credentials: true,
}))

// Initialise D1 database per-request
app.use('*', async (c, next) => {
  c.set('db', drizzle(c.env.DB, { schema }))
  return next()
})

// ─── Auth routes (no auth required) ────────────────────────────────────────
app.route('/api/auth', authRoute)

// ─── Auth middleware for all other /api/* routes ────────────────────────────
app.use('/api/*', authMiddleware)

// ─── Fund config routes ─────────────────────────────────────────────────────
app.route('/api/config', configRoute)

// ─── Health ─────────────────────────────────────────────────────────────────
app.get('/health', (c) => c.json({ status: 'ok', ts: new Date().toISOString() }))

// ─── Companies ──────────────────────────────────────────────────────────────
const companiesRoute = new Hono<AppEnv>()

companiesRoute.get('/', async (c) => {
  const { status, sector, stage, search, page = '1', per_page = '20' } = c.req.query()
  const p = Math.max(1, parseInt(page))
  const pp = Math.min(100, Math.max(1, parseInt(per_page)))
  const offset = (p - 1) * pp
  const db = c.get('db')

  let query = db.select().from(companies).$dynamic()
  const conditions = []
  if (status) conditions.push(inArray(companies.status, status.split(',') as never[]))
  if (sector) conditions.push(inArray(companies.sector, sector.split(',') as never[]))
  if (stage) conditions.push(inArray(companies.stage, stage.split(',') as never[]))
  if (search) conditions.push(like(companies.name, `%${search}%`))
  if (conditions.length) query = query.where(and(...conditions))

  const data = await query.orderBy(desc(companies.created_at)).limit(pp).offset(offset)
  return c.json({ data, meta: { page: p, per_page: pp, total: data.length, total_pages: Math.ceil(data.length / pp) } })
})

companiesRoute.get('/:id', async (c) => {
  const db = c.get('db')
  const company = await db.query.companies.findFirst({ where: eq(companies.id, c.req.param('id')) })
  if (!company) return c.json({ error: { code: 'NOT_FOUND', message: 'Company not found' } }, 404)
  return c.json({ data: company })
})

companiesRoute.post('/', zValidator('json', z.object({
  name: z.string().min(1),
  website: z.string().url().optional(),
  description: z.string().optional(),
  stage: z.enum(['pre_seed', 'seed', 'series_a', 'series_b', 'growth', 'unknown']).optional(),
  sector: z.enum(['fintech', 'saas', 'consumer', 'deeptech', 'healthtech', 'edtech',
    'ecommerce', 'climate', 'agritech', 'logistics', 'proptech', 'hrtech', 'legaltech', 'other']).optional(),
  source_type: z.enum(['inbound_portal', 'outbound_search', 'scout_referral', 'co_investor',
    'demo_day', 'conference', 'newsletter', 'linkedin', 'angellist', 'warm_intro']),
  source_detail: z.string().optional(),
  geography: z.string().optional(),
  city: z.string().optional(),
})), async (c) => {
  const db = c.get('db')
  const body = c.req.valid('json')
  const [company] = await db.insert(companies).values(body).returning()
  return c.json({ data: company }, 201)
})

companiesRoute.patch('/:id', zValidator('json', z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['radar', 'contacted', 'engaged', 'screening', 'passed', 'watch', 'proceeding']).optional(),
  pass_reason: z.string().optional(),
  arr_usd: z.number().optional(),
  mrr_usd: z.number().optional(),
  growth_rate_pct: z.number().optional(),
  team_size: z.number().optional(),
  assigned_to: z.string().optional(),
}).passthrough()), async (c) => {
  const db = c.get('db')
  const body = c.req.valid('json')
  const [company] = await db.update(companies)
    .set({ ...body, updated_at: new Date().toISOString() })
    .where(eq(companies.id, c.req.param('id')))
    .returning()
  if (!company) return c.json({ error: { code: 'NOT_FOUND', message: 'Company not found' } }, 404)
  return c.json({ data: company })
})

companiesRoute.get('/:id/contacts', async (c) => {
  const db = c.get('db')
  const data = await db.query.contacts.findMany({ where: eq(contacts.company_id, c.req.param('id')) })
  return c.json({ data })
})

companiesRoute.get('/:id/signals', async (c) => {
  const db = c.get('db')
  const data = await db.query.signals.findMany({
    where: eq(signals.company_id, c.req.param('id')),
    orderBy: desc(signals.detected_at),
  })
  return c.json({ data })
})

app.route('/api/companies', companiesRoute)

// ─── Screenings ─────────────────────────────────────────────────────────────
const screeningsRoute = new Hono<AppEnv>()

screeningsRoute.get('/', async (c) => {
  const db = c.get('db')
  const { status } = c.req.query()
  let query = db.select().from(screenings).$dynamic()
  if (status) query = query.where(inArray(screenings.status, status.split(',') as never[]))
  const data = await query.orderBy(desc(screenings.created_at))
  return c.json({ data })
})

screeningsRoute.post('/', zValidator('json', z.object({ company_id: z.string() })), async (c) => {
  const db = c.get('db')
  const { company_id } = c.req.valid('json')
  const [screening] = await db.insert(screenings).values({ company_id, status: 'queued' }).returning()
  await db.update(companies).set({ status: 'screening', updated_at: new Date().toISOString() })
    .where(eq(companies.id, company_id))
  return c.json({ data: screening }, 201)
})

screeningsRoute.get('/:id', async (c) => {
  const db = c.get('db')
  const screening = await db.query.screenings.findFirst({ where: eq(screenings.id, c.req.param('id')) })
  if (!screening) return c.json({ error: { code: 'NOT_FOUND', message: 'Screening not found' } }, 404)
  return c.json({ data: screening })
})

screeningsRoute.patch('/:id', zValidator('json', z.object({
  score_team: z.number().min(1).max(10).optional(),
  score_market: z.number().min(1).max(10).optional(),
  score_product: z.number().min(1).max(10).optional(),
  score_traction: z.number().min(1).max(10).optional(),
  score_business_model: z.number().min(1).max(10).optional(),
  score_investment_fit: z.number().min(1).max(10).optional(),
  overall_score: z.number().optional(),
  meeting_notes: z.string().optional(),
  status: z.enum(['queued', 'in_progress', 'completed']).optional(),
}).passthrough()), async (c) => {
  const db = c.get('db')
  const body = c.req.valid('json')
  const [screening] = await db.update(screenings)
    .set({ ...body, updated_at: new Date().toISOString() })
    .where(eq(screenings.id, c.req.param('id')))
    .returning()
  return c.json({ data: screening })
})

screeningsRoute.post('/:id/decide', zValidator('json', z.object({
  decision: z.enum(['pass', 'proceed', 'watch']),
  decision_rationale: z.string().min(10),
})), async (c) => {
  const db = c.get('db')
  const { decision, decision_rationale } = c.req.valid('json')
  const [screening] = await db.update(screenings)
    .set({ decision, decision_rationale, status: 'completed', updated_at: new Date().toISOString() })
    .where(eq(screenings.id, c.req.param('id')))
    .returning()
  if (!screening) return c.json({ error: { code: 'NOT_FOUND', message: 'Screening not found' } }, 404)
  const newStatus = decision === 'proceed' ? 'proceeding' : decision === 'watch' ? 'watch' : 'passed'
  await db.update(companies)
    .set({ status: newStatus, updated_at: new Date().toISOString() })
    .where(eq(companies.id, screening.company_id))
  return c.json({ data: screening })
})

app.route('/api/screenings', screeningsRoute)

// ─── Signals ────────────────────────────────────────────────────────────────
app.get('/api/signals', async (c) => {
  const db = c.get('db')
  const data = await db.query.signals.findMany({ orderBy: desc(signals.detected_at), limit: 50 })
  return c.json({ data })
})

app.post('/api/signals/:id/read', async (c) => {
  const db = c.get('db')
  await db.update(signals).set({ is_read: true }).where(eq(signals.id, c.req.param('id')))
  return c.json({ data: { ok: true } })
})

// ─── AI Agents ───────────────────────────────────────────────────────────────
const agentsRoute = new Hono<AppEnv>()

agentsRoute.use('/*', async (c, next) => {
  const key = c.env.ANTHROPIC_API_KEY
  if (!key || key.startsWith('sk-ant-api03-REPLACE')) {
    return c.json({ error: { code: 'AI_NOT_CONFIGURED', message: 'ANTHROPIC_API_KEY not set in .dev.vars' } }, 503)
  }
  return next()
})

agentsRoute.post('/pre-screen', zValidator('json', z.object({
  name: z.string(),
  website: z.string().optional(),
  description: z.string().optional(),
  sector: z.string().optional(),
  stage: z.string().optional(),
  team_info: z.string().optional(),
})), async (c) => {
  const input = c.req.valid('json')
  const result = await new SourcingAgent(c.env.ANTHROPIC_API_KEY).preScreen(input)
  return c.json({ data: result })
})

agentsRoute.post('/pre-screen/stream', zValidator('json', z.object({
  name: z.string(),
  description: z.string().optional(),
  sector: z.string().optional(),
  stage: z.string().optional(),
})), async (c) => {
  const input = c.req.valid('json')
  const agent = new SourcingAgent(c.env.ANTHROPIC_API_KEY)
  return streamSSE(c, async (stream) => {
    for await (const chunk of agent.streamPreScreen(input)) {
      await stream.writeSSE({ data: chunk })
    }
    await stream.writeSSE({ data: '[DONE]' })
  })
})

agentsRoute.post('/score', zValidator('json', z.object({
  company_id: z.string(),
  screening_id: z.string().optional(),
  meeting_notes: z.string().optional(),
})), async (c) => {
  const db = c.get('db')
  const { company_id, screening_id, meeting_notes } = c.req.valid('json')
  const company = await db.query.companies.findFirst({ where: eq(companies.id, company_id) })
  if (!company) return c.json({ error: { code: 'NOT_FOUND', message: 'Company not found' } }, 404)
  const companyContacts = await db.query.contacts.findMany({ where: eq(contacts.company_id, company_id) })
  const result = await new ScreeningAgent(c.env.ANTHROPIC_API_KEY).generateScore({ company, contacts: companyContacts, meeting_notes })
  if (screening_id) {
    await db.update(screenings).set({
      score_team: result.scores.team,
      score_market: result.scores.market,
      score_product: result.scores.product,
      score_traction: result.scores.traction,
      score_business_model: result.scores.business_model,
      score_investment_fit: result.scores.investment_fit,
      overall_score: result.overall_score,
      ai_summary: result.summary,
      ai_flags: JSON.stringify(result.flags),
      status: 'in_progress',
      updated_at: new Date().toISOString(),
    }).where(eq(screenings.id, screening_id))
  }
  return c.json({ data: result })
})

agentsRoute.post('/one-pager', zValidator('json', z.object({ company_id: z.string() })), async (c) => {
  const db = c.get('db')
  const { company_id } = c.req.valid('json')
  const company = await db.query.companies.findFirst({ where: eq(companies.id, company_id) })
  if (!company) return c.json({ error: { code: 'NOT_FOUND', message: 'Company not found' } }, 404)
  const companyContacts = await db.query.contacts.findMany({ where: eq(contacts.company_id, company_id) })
  const result = await new ScreeningAgent(c.env.ANTHROPIC_API_KEY).generateOnePager({ company, contacts: companyContacts })
  return c.json({ data: result })
})

agentsRoute.post('/ic-memo/stream', zValidator('json', z.object({
  company_id: z.string(),
  screening_id: z.string().optional(),
})), async (c) => {
  const db = c.get('db')
  const { company_id, screening_id } = c.req.valid('json')
  const company = await db.query.companies.findFirst({ where: eq(companies.id, company_id) })
  if (!company) return c.json({ error: { code: 'NOT_FOUND', message: 'Company not found' } }, 404)
  const companyContacts = await db.query.contacts.findMany({ where: eq(contacts.company_id, company_id) })
  const agent = new ScreeningAgent(c.env.ANTHROPIC_API_KEY)
  let fullMemo = ''
  return streamSSE(c, async (stream) => {
    for await (const chunk of agent.streamICMemo({ company, contacts: companyContacts })) {
      fullMemo += chunk
      await stream.writeSSE({ data: chunk })
    }
    if (screening_id) {
      await db.update(screenings)
        .set({ ic_memo_draft: fullMemo, updated_at: new Date().toISOString() })
        .where(eq(screenings.id, screening_id))
    }
    await stream.writeSSE({ data: '[DONE]' })
  })
})

agentsRoute.post('/enrich', zValidator('json', z.object({ company_id: z.string() })), async (c) => {
  const db = c.get('db')
  const { company_id } = c.req.valid('json')
  const company = await db.query.companies.findFirst({ where: eq(companies.id, company_id) })
  if (!company) return c.json({ error: { code: 'NOT_FOUND', message: 'Company not found' } }, 404)
  const result = await new EnrichmentAgent(c.env.ANTHROPIC_API_KEY).enrich({
    name: company.name,
    website: company.website ?? undefined,
    description: company.description ?? undefined,
  })
  await db.update(companies).set({ description: company.description ?? result.description, updated_at: new Date().toISOString() })
    .where(eq(companies.id, company_id))
  return c.json({ data: result })
})

app.route('/api/agents', agentsRoute)

// ─── CF Workers export ───────────────────────────────────────────────────────
export default app
