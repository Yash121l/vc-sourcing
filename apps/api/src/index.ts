import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { streamSSE } from 'hono/streaming'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq, desc, like, inArray, and } from 'drizzle-orm'
import { db, companies, contacts, screenings, signals } from '@vc/db'
import { SourcingAgent } from './agents/sourcing-agent'
import { ScreeningAgent } from './agents/screening-agent'
import { EnrichmentAgent } from './agents/enrichment-agent'

const app = new Hono()

app.use('*', logger())
app.use('*', cors({ origin: process.env['WEB_URL'] ?? 'http://localhost:5173', credentials: true }))

// ─── Health ──────────────────────────────────────────────────────────────────

app.get('/health', (c) => c.json({ status: 'ok', ts: new Date().toISOString() }))

// ─── Companies ───────────────────────────────────────────────────────────────

const companiesRoute = new Hono()

companiesRoute.get('/', async (c) => {
  const { status, sector, stage, search, page = '1', per_page = '20' } = c.req.query()
  const p = Math.max(1, parseInt(page))
  const pp = Math.min(100, Math.max(1, parseInt(per_page)))
  const offset = (p - 1) * pp

  let query = db.select().from(companies).$dynamic()
  const conditions = []

  if (status) conditions.push(inArray(companies.status, status.split(',') as never[]))
  if (sector) conditions.push(inArray(companies.sector, sector.split(',') as never[]))
  if (stage) conditions.push(inArray(companies.stage, stage.split(',') as never[]))
  if (search) conditions.push(like(companies.name, `%${search}%`))
  if (conditions.length) query = query.where(and(...conditions))

  const data = await query.orderBy(desc(companies.created_at)).limit(pp).offset(offset)
  const total = data.length // simplified — use COUNT(*) in production

  return c.json({ data, meta: { page: p, per_page: pp, total, total_pages: Math.ceil(total / pp) } })
})

companiesRoute.get('/:id', async (c) => {
  const company = await db.query.companies.findFirst({
    where: eq(companies.id, c.req.param('id')),
  })
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
  const body = c.req.valid('json')
  const [company] = await db.update(companies)
    .set({ ...body, updated_at: new Date().toISOString() })
    .where(eq(companies.id, c.req.param('id')))
    .returning()
  if (!company) return c.json({ error: { code: 'NOT_FOUND', message: 'Company not found' } }, 404)
  return c.json({ data: company })
})

companiesRoute.get('/:id/contacts', async (c) => {
  const data = await db.query.contacts.findMany({
    where: eq(contacts.company_id, c.req.param('id')),
  })
  return c.json({ data })
})

companiesRoute.get('/:id/signals', async (c) => {
  const data = await db.query.signals.findMany({
    where: eq(signals.company_id, c.req.param('id')),
    orderBy: desc(signals.detected_at),
  })
  return c.json({ data })
})

app.route('/api/companies', companiesRoute)

// ─── Screenings ───────────────────────────────────────────────────────────────

const screeningsRoute = new Hono()

screeningsRoute.get('/', async (c) => {
  const { status } = c.req.query()
  let query = db.select().from(screenings).$dynamic()
  if (status) query = query.where(inArray(screenings.status, status.split(',') as never[]))
  const data = await query.orderBy(desc(screenings.created_at))
  return c.json({ data })
})

screeningsRoute.post('/', zValidator('json', z.object({ company_id: z.string() })), async (c) => {
  const { company_id } = c.req.valid('json')
  const [screening] = await db.insert(screenings).values({ company_id, status: 'queued' }).returning()
  await db.update(companies).set({ status: 'screening', updated_at: new Date().toISOString() })
    .where(eq(companies.id, company_id))
  return c.json({ data: screening }, 201)
})

screeningsRoute.get('/:id', async (c) => {
  const screening = await db.query.screenings.findFirst({
    where: eq(screenings.id, c.req.param('id')),
  })
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

// ─── Signals ─────────────────────────────────────────────────────────────────

app.get('/api/signals', async (c) => {
  const data = await db.query.signals.findMany({
    orderBy: desc(signals.detected_at),
    limit: 50,
  })
  return c.json({ data })
})

app.post('/api/signals/:id/read', async (c) => {
  await db.update(signals).set({ is_read: true }).where(eq(signals.id, c.req.param('id')))
  return c.json({ data: { ok: true } })
})

// ─── AI Agents ────────────────────────────────────────────────────────────────

const agentsRoute = new Hono()

agentsRoute.post('/pre-screen', zValidator('json', z.object({
  name: z.string(),
  website: z.string().optional(),
  description: z.string().optional(),
  sector: z.string().optional(),
  stage: z.string().optional(),
  team_info: z.string().optional(),
})), async (c) => {
  const input = c.req.valid('json')
  const agent = new SourcingAgent()
  const result = await agent.preScreen(input)
  return c.json({ data: result })
})

agentsRoute.post('/pre-screen/stream', zValidator('json', z.object({
  name: z.string(),
  description: z.string().optional(),
  sector: z.string().optional(),
  stage: z.string().optional(),
})), async (c) => {
  const input = c.req.valid('json')
  const agent = new SourcingAgent()
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
  const { company_id, screening_id, meeting_notes } = c.req.valid('json')
  const company = await db.query.companies.findFirst({ where: eq(companies.id, company_id) })
  if (!company) return c.json({ error: { code: 'NOT_FOUND', message: 'Company not found' } }, 404)
  const companyContacts = await db.query.contacts.findMany({ where: eq(contacts.company_id, company_id) })

  const agent = new ScreeningAgent()
  const result = await agent.generateScore({ company, contacts: companyContacts, meeting_notes })

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
      ai_score_rationale: JSON.stringify(result.rationale),
      status: 'in_progress',
      updated_at: new Date().toISOString(),
    }).where(eq(screenings.id, screening_id))
  }
  return c.json({ data: result })
})

agentsRoute.post('/one-pager', zValidator('json', z.object({ company_id: z.string() })), async (c) => {
  const { company_id } = c.req.valid('json')
  const company = await db.query.companies.findFirst({ where: eq(companies.id, company_id) })
  if (!company) return c.json({ error: { code: 'NOT_FOUND', message: 'Company not found' } }, 404)
  const companyContacts = await db.query.contacts.findMany({ where: eq(contacts.company_id, company_id) })
  const agent = new ScreeningAgent()
  const result = await agent.generateOnePager({ company, contacts: companyContacts })
  return c.json({ data: result })
})

agentsRoute.post('/ic-memo/stream', zValidator('json', z.object({
  company_id: z.string(),
  screening_id: z.string().optional(),
})), async (c) => {
  const { company_id, screening_id } = c.req.valid('json')
  const company = await db.query.companies.findFirst({ where: eq(companies.id, company_id) })
  if (!company) return c.json({ error: { code: 'NOT_FOUND', message: 'Company not found' } }, 404)
  const companyContacts = await db.query.contacts.findMany({ where: eq(contacts.company_id, company_id) })

  const agent = new ScreeningAgent()
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

agentsRoute.post('/enrich', zValidator('json', z.object({
  company_id: z.string(),
})), async (c) => {
  const { company_id } = c.req.valid('json')
  const company = await db.query.companies.findFirst({ where: eq(companies.id, company_id) })
  if (!company) return c.json({ error: { code: 'NOT_FOUND', message: 'Company not found' } }, 404)
  const agent = new EnrichmentAgent()
  const result = await agent.enrich({ name: company.name, website: company.website ?? undefined, description: company.description ?? undefined })
  await db.update(companies).set({
    description: company.description ?? result.description,
    updated_at: new Date().toISOString(),
  }).where(eq(companies.id, company_id))
  return c.json({ data: result })
})

app.route('/api/agents', agentsRoute)

// ─── Server ───────────────────────────────────────────────────────────────────

const port = parseInt(process.env['PORT'] ?? '3001')

serve({ fetch: app.fetch, port }, () => {
  console.log(`VC Sourcing API running on http://localhost:${port}`)
})

export default app
