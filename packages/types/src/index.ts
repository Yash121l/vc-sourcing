// ─── Company ──────────────────────────────────────────────────────────────────

export type CompanyStage =
  | 'pre_seed' | 'seed' | 'series_a' | 'series_b' | 'growth' | 'unknown'

export type CompanySector =
  | 'fintech' | 'saas' | 'consumer' | 'deeptech' | 'healthtech'
  | 'edtech' | 'ecommerce' | 'climate' | 'agritech' | 'logistics'
  | 'proptech' | 'hrtech' | 'legaltech' | 'other'

export type CompanyStatus =
  | 'radar'        // discovered, not yet contacted
  | 'contacted'    // outreach sent
  | 'engaged'      // in active conversation
  | 'screening'    // in Module 02 screening
  | 'passed'       // no-go decision
  | 'watch'        // revisit later
  | 'proceeding'   // advancing to DD

export type SourceType =
  | 'inbound_portal' | 'outbound_search' | 'scout_referral'
  | 'co_investor' | 'demo_day' | 'conference'
  | 'newsletter' | 'linkedin' | 'angellist' | 'warm_intro'

export interface Company {
  id: string
  name: string
  website?: string | undefined
  description?: string | undefined
  logo_url?: string | undefined
  stage: CompanyStage
  sector: CompanySector
  subsector?: string | undefined
  geography?: string | undefined
  city?: string | undefined
  founded_year?: number | undefined
  team_size?: number | undefined
  funding_total_usd?: number | undefined
  last_funding_date?: string | undefined
  last_funding_amount_usd?: number | undefined
  last_funding_type?: string | undefined
  arr_usd?: number | undefined
  mrr_usd?: number | undefined
  growth_rate_pct?: number | undefined
  status: CompanyStatus
  source_type: SourceType
  source_detail?: string | undefined
  assigned_to?: string | undefined
  ai_pre_score?: number | undefined
  ai_pre_summary?: string | undefined
  pass_reason?: string | undefined
  crunchbase_url?: string | undefined
  linkedin_url?: string | undefined
  angellist_url?: string | undefined
  github_url?: string | undefined
  created_at: string
  updated_at: string
}

export interface CreateCompanyInput {
  name: string
  website?: string | undefined
  description?: string | undefined
  stage?: CompanyStage | undefined
  sector?: CompanySector | undefined
  subsector?: string | undefined
  geography?: string | undefined
  city?: string | undefined
  founded_year?: number | undefined
  team_size?: number | undefined
  source_type: SourceType
  source_detail?: string | undefined
  crunchbase_url?: string | undefined
  linkedin_url?: string | undefined
}

// ─── Contact ──────────────────────────────────────────────────────────────────

export interface Contact {
  id: string
  company_id: string
  name: string
  role: 'founder' | 'co_founder' | 'cto' | 'coo' | 'advisor' | 'investor' | 'other'
  title?: string | undefined
  linkedin_url?: string | undefined
  twitter_url?: string | undefined
  email?: string | undefined
  background?: string | undefined
  education?: string | undefined
  is_founder: boolean
  created_at: string
  updated_at: string
}

// ─── Screening ────────────────────────────────────────────────────────────────

export type ScreeningStatus = 'queued' | 'in_progress' | 'completed'
export type ScreeningDecision = 'pass' | 'proceed' | 'watch'

export interface ScorecardDimensions {
  team: number
  market: number
  product: number
  traction: number
  business_model: number
  investment_fit: number
}

export interface RedFlag {
  dimension: keyof ScorecardDimensions | 'general'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
}

export interface Screening {
  id: string
  company_id: string
  company?: Company | undefined
  screened_by?: string | undefined
  screening_date?: string | undefined
  score_team?: number | undefined
  score_market?: number | undefined
  score_product?: number | undefined
  score_traction?: number | undefined
  score_business_model?: number | undefined
  score_investment_fit?: number | undefined
  overall_score?: number | undefined
  decision?: ScreeningDecision | undefined
  decision_rationale?: string | undefined
  meeting_notes?: string | undefined
  ai_summary?: string | undefined
  ai_flags?: RedFlag[] | undefined
  ai_score_rationale?: Record<keyof ScorecardDimensions, string> | undefined
  ai_one_pager?: string | undefined
  ic_memo_draft?: string | undefined
  status: ScreeningStatus
  created_at: string
  updated_at: string
}

// ─── Signal ───────────────────────────────────────────────────────────────────

export type SignalType = 'news' | 'funding' | 'hiring' | 'product' | 'social' | 'regulatory'
export type SignalSentiment = 'positive' | 'neutral' | 'negative'

export interface Signal {
  id: string
  company_id: string
  company?: Pick<Company, 'id' | 'name' | 'logo_url' | 'sector'> | undefined
  type: SignalType
  title: string
  description?: string | undefined
  url?: string | undefined
  source_name?: string | undefined
  published_at?: string | undefined
  detected_at: string
  is_read: boolean
  sentiment: SignalSentiment
  created_at: string
}

// ─── Outreach ─────────────────────────────────────────────────────────────────

export type OutreachType = 'email' | 'linkedin' | 'intro' | 'event' | 'phone'
export type OutreachStatus =
  | 'planned' | 'sent' | 'replied' | 'meeting_scheduled' | 'no_response' | 'bounced'

export interface Outreach {
  id: string
  company_id: string
  contact_id?: string | undefined
  contact?: Contact | undefined
  type: OutreachType
  status: OutreachStatus
  sent_at?: string | undefined
  replied_at?: string | undefined
  notes?: string | undefined
  template_used?: string | undefined
  created_at: string
  updated_at: string
}

// ─── AI Agent Payloads ────────────────────────────────────────────────────────

export interface AIPreScreenInput {
  name: string
  website?: string | undefined
  description?: string | undefined
  sector?: string | undefined
  stage?: string | undefined
  team_info?: string | undefined
}

export interface AIPreScreenOutput {
  score: number               // 0-100
  rationale: string
  flags: string[]
  recommendation: 'advance' | 'pass' | 'watch'
  sector_fit: number          // 0-10
  team_signal: number         // 0-10
  tam_signal: number          // 0-10
  traction_signal: number     // 0-10
}

export interface AIScoreInput {
  company: Pick<Company, 'name' | 'description' | 'sector' | 'stage' | 'website' | 'arr_usd' | 'growth_rate_pct'>
  contacts?: Pick<Contact, 'name' | 'role' | 'background' | 'education'>[] | undefined
  meeting_notes?: string | undefined
}

export interface AIScoreOutput {
  scores: ScorecardDimensions
  rationale: Record<keyof ScorecardDimensions, string>
  flags: RedFlag[]
  overall_score: number
  summary: string
}

export interface AIOnePagerOutput {
  markdown: string
}

export interface AIMemoOutput {
  markdown: string
}

// ─── API Response Envelope ────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T
  error?: undefined
}

export interface ApiError {
  data?: undefined
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export type ApiResult<T> = ApiResponse<T> | ApiError

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    per_page: number
    total: number
    total_pages: number
  }
}

// ─── Filter/Query types ───────────────────────────────────────────────────────

export interface CompanyFilters {
  status?: CompanyStatus[] | undefined
  sector?: CompanySector[] | undefined
  stage?: CompanyStage[] | undefined
  source_type?: SourceType[] | undefined
  assigned_to?: string | undefined
  search?: string | undefined
  page?: number | undefined
  per_page?: number | undefined
}

export interface ScreeningFilters {
  status?: ScreeningStatus[] | undefined
  decision?: ScreeningDecision[] | undefined
  screened_by?: string | undefined
  page?: number | undefined
  per_page?: number | undefined
}
