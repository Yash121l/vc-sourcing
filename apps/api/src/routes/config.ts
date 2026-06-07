import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { eq } from 'drizzle-orm'
import { fundConfig } from '@vc/db'
import type { AppEnv } from '../env'

const config = new Hono<AppEnv>()

const configUpdateSchema = z.object({
  fund_name: z.string().min(1).optional(),
  fund_thesis: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  target_stages: z.array(z.string()).optional(),
  target_sectors: z.array(z.string()).optional(),
  target_geographies: z.array(z.string()).optional(),
  min_check_usd: z.number().int().positive().optional(),
  max_check_usd: z.number().int().positive().optional(),
  pre_screen_pass_threshold: z.number().int().min(0).max(100).optional(),
  pre_screen_advance_threshold: z.number().int().min(0).max(100).optional(),
  score_weights: z.object({
    team: z.number().positive(),
    market: z.number().positive(),
    product: z.number().positive(),
    traction: z.number().positive(),
    business_model: z.number().positive(),
    investment_fit: z.number().positive(),
  }).optional(),
  analyst_review_sla_hours: z.number().int().positive().optional(),
  ic_review_sla_hours: z.number().int().positive().optional(),
  analyst_emails: z.array(z.string().email()).optional(),
  ic_member_emails: z.array(z.string().email()).optional(),
  partner_emails: z.array(z.string().email()).optional(),
  primary_currency: z.string().optional(),
  timezone: z.string().optional(),
  auto_pass_email_enabled: z.boolean().optional(),
  auto_ack_email_enabled: z.boolean().optional(),
})

config.get('/', async (c) => {
  const db = c.get('db')
  const user = c.get('user')
  const orgId = user?.organizationId ?? 'org-dev'

  let cfg = await db.query.fundConfig.findFirst({ where: eq(fundConfig.org_id, orgId) })
  if (!cfg) {
    const [created] = await db.insert(fundConfig).values({ org_id: orgId }).returning()
    cfg = created
  }
  if (!cfg) return c.json({ error: { code: 'NOT_FOUND', message: 'Config not found' } }, 404)

  return c.json({
    data: {
      ...cfg,
      target_stages: JSON.parse(cfg.target_stages) as string[],
      target_sectors: JSON.parse(cfg.target_sectors) as string[],
      target_geographies: JSON.parse(cfg.target_geographies) as string[],
      score_weights: JSON.parse(cfg.score_weights) as Record<string, number>,
      analyst_emails: JSON.parse(cfg.analyst_emails) as string[],
      ic_member_emails: JSON.parse(cfg.ic_member_emails) as string[],
      partner_emails: JSON.parse(cfg.partner_emails) as string[],
    },
  })
})

config.patch('/', zValidator('json', configUpdateSchema), async (c) => {
  const db = c.get('db')
  const user = c.get('user')
  const orgId = user?.organizationId ?? 'org-dev'
  const body = c.req.valid('json')

  let cfg = await db.query.fundConfig.findFirst({ where: eq(fundConfig.org_id, orgId) })
  if (!cfg) {
    const [created] = await db.insert(fundConfig).values({ org_id: orgId }).returning()
    cfg = created!
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.fund_name !== undefined) update['fund_name'] = body.fund_name
  if (body.fund_thesis !== undefined) update['fund_thesis'] = body.fund_thesis
  if (body.website !== undefined) update['website'] = body.website
  if (body.target_stages !== undefined) update['target_stages'] = JSON.stringify(body.target_stages)
  if (body.target_sectors !== undefined) update['target_sectors'] = JSON.stringify(body.target_sectors)
  if (body.target_geographies !== undefined) update['target_geographies'] = JSON.stringify(body.target_geographies)
  if (body.min_check_usd !== undefined) update['min_check_usd'] = body.min_check_usd
  if (body.max_check_usd !== undefined) update['max_check_usd'] = body.max_check_usd
  if (body.pre_screen_pass_threshold !== undefined) update['pre_screen_pass_threshold'] = body.pre_screen_pass_threshold
  if (body.pre_screen_advance_threshold !== undefined) update['pre_screen_advance_threshold'] = body.pre_screen_advance_threshold
  if (body.score_weights !== undefined) update['score_weights'] = JSON.stringify(body.score_weights)
  if (body.analyst_review_sla_hours !== undefined) update['analyst_review_sla_hours'] = body.analyst_review_sla_hours
  if (body.ic_member_emails !== undefined) update['ic_member_emails'] = JSON.stringify(body.ic_member_emails)
  if (body.partner_emails !== undefined) update['partner_emails'] = JSON.stringify(body.partner_emails)
  if (body.primary_currency !== undefined) update['primary_currency'] = body.primary_currency
  if (body.timezone !== undefined) update['timezone'] = body.timezone
  if (body.auto_pass_email_enabled !== undefined) update['auto_pass_email_enabled'] = body.auto_pass_email_enabled
  if (body.auto_ack_email_enabled !== undefined) update['auto_ack_email_enabled'] = body.auto_ack_email_enabled

  const [updated] = await db.update(fundConfig).set(update).where(eq(fundConfig.id, cfg.id)).returning()
  return c.json({ data: updated })
})

export { config as configRoute }
