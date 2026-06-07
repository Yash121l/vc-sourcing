import { BaseAgent } from './base-agent'

interface EnrichmentInput {
  name: string
  website?: string | undefined
  description?: string | undefined
}

interface EnrichmentOutput {
  description: string
  sector: string
  stage: string
  founded_year: number | null
  team_size: number | null
  business_model: string
  key_facts: string[]
  suggested_contacts: Array<{ name: string; role: string; linkedin_query: string }>
}

const SYSTEM = `You are a startup research analyst. Given minimal information about a startup,
infer and structure what is publicly knowable. Be factual and conservative — flag uncertainty clearly.
Return valid JSON only.`

export class EnrichmentAgent extends BaseAgent {
  async enrich(input: EnrichmentInput): Promise<EnrichmentOutput> {
    const user = `Enrich this startup with structured data. Return JSON matching this schema:
{
  "description": "<clear 2-sentence description of what they do>",
  "sector": "<one of: fintech|saas|consumer|deeptech|healthtech|edtech|ecommerce|climate|agritech|logistics|proptech|hrtech|legaltech|other>",
  "stage": "<one of: pre_seed|seed|series_a|series_b|growth|unknown>",
  "founded_year": <year or null>,
  "team_size": <estimated headcount or null>,
  "business_model": "<B2B SaaS | B2C | Marketplace | etc.>",
  "key_facts": ["<fact 1>", "<fact 2>", "<fact 3>"],
  "suggested_contacts": [
    { "name": "<likely founder name if known>", "role": "founder", "linkedin_query": "<search query>" }
  ]
}

Company: ${input.name}
Website: ${input.website ?? 'unknown'}
Description: ${input.description ?? 'unknown'}

Return ONLY the JSON.`

    const response = await this.run(SYSTEM, user)
    return this.parseJSON<EnrichmentOutput>(response)
  }
}
