import type { AIScoreInput, AIScoreOutput, AIOnePagerOutput, AIMemoOutput } from '@vc/types'
import { BaseAgent } from './base-agent'

const SYSTEM = `You are a senior investment analyst at a premier Indian VC fund.
You conduct rigorous screening evaluations of startups for Series A and Seed investments.
You score companies on 6 dimensions (1-10) and generate professional IC memos.
Be analytical, precise, and honest. Flag risks clearly. Never inflate scores.`

export class ScreeningAgent extends BaseAgent {
  async generateScore(input: AIScoreInput): Promise<AIScoreOutput> {
    const founderText = input.contacts?.map(c =>
      `${c.name} (${c.role}): ${c.background ?? 'No background info'}`
    ).join('\n') ?? 'No founder info provided'

    const user = `Score this startup on 6 dimensions and return JSON matching this schema exactly:
{
  "scores": {
    "team": <1-10>,
    "market": <1-10>,
    "product": <1-10>,
    "traction": <1-10>,
    "business_model": <1-10>,
    "investment_fit": <1-10>
  },
  "rationale": {
    "team": "<2 sentence rationale>",
    "market": "<2 sentence rationale>",
    "product": "<2 sentence rationale>",
    "traction": "<2 sentence rationale>",
    "business_model": "<2 sentence rationale>",
    "investment_fit": "<2 sentence rationale>"
  },
  "flags": [
    { "dimension": "<team|market|product|traction|business_model|investment_fit|general>", "severity": "<low|medium|high|critical>", "description": "<flag description>" }
  ],
  "overall_score": <weighted average, business_model and team weighted 1.5x>,
  "summary": "<3-4 sentence executive summary>"
}

Company: ${input.company.name}
Sector: ${input.company.sector}
Stage: ${input.company.stage}
Website: ${input.company.website ?? 'N/A'}
Description: ${input.company.description ?? 'N/A'}
ARR: ${input.company.arr_usd ? `$${(input.company.arr_usd / 1000).toFixed(0)}K` : 'N/A'}
MoM Growth: ${input.company.growth_rate_pct ? `${input.company.growth_rate_pct}%` : 'N/A'}

Founders:
${founderText}

Meeting Notes:
${input.meeting_notes ?? 'No meeting notes provided'}

Return ONLY the JSON object.`

    const response = await this.run(SYSTEM, user)
    return this.parseJSON<AIScoreOutput>(response)
  }

  async generateOnePager(input: AIScoreInput): Promise<AIOnePagerOutput> {
    const user = `Generate a concise one-pager for IC review of ${input.company.name}.

Use this markdown structure:
# ${input.company.name} — Investment One-Pager

**Sector:** | **Stage:** | **Geography:** | **Ask:**

## Problem
[2-3 sentences]

## Solution
[2-3 sentences]

## Market Opportunity
[TAM/SAM/SOM with methodology]

## Team
[Key founders and why they are uniquely suited]

## Traction
[Key metrics, growth, customers]

## Business Model
[Revenue model, unit economics snapshot]

## Competitive Advantage
[Moat, differentiation]

## Key Risks
- Risk 1
- Risk 2
- Risk 3

## Investment Thesis
[Why now, why this team, why this market]

Company info:
${JSON.stringify(input.company, null, 2)}
Founders: ${input.contacts?.map(c => `${c.name} - ${c.background}`).join('; ') ?? 'N/A'}
Notes: ${input.meeting_notes ?? 'N/A'}`

    const markdown = await this.run(SYSTEM, user)
    return { markdown }
  }

  async generateICMemo(input: AIScoreInput): Promise<AIMemoOutput> {
    const user = `Write a detailed IC Screening Memo for ${input.company.name}.

Format as professional markdown with these sections:
1. Executive Summary & Recommendation
2. Company Overview
3. Market Analysis (TAM/SAM/SOM, growth drivers, timing)
4. Team Assessment (founders, advisors, key hires)
5. Product & Technology (what they've built, differentiation, tech risk)
6. Traction & Key Metrics
7. Business Model & Unit Economics
8. Competitive Landscape (direct/indirect, why they win)
9. Risk Register (categorized: market, execution, technology, regulatory)
10. Investment Thesis & Value Creation
11. Due Diligence Checklist (top 10 open questions for DD)
12. Recommendation: Pass | Watch | Proceed to DD

Company: ${input.company.name} | ${input.company.sector} | ${input.company.stage}
Description: ${input.company.description ?? 'N/A'}
ARR: ${input.company.arr_usd ?? 'N/A'} | Growth: ${input.company.growth_rate_pct ?? 'N/A'}%
Founders: ${input.contacts?.map(c => `${c.name} (${c.role}): ${c.background}`).join('; ') ?? 'N/A'}
Meeting Notes: ${input.meeting_notes ?? 'N/A'}`

    const markdown = await this.run(SYSTEM, user)
    return { markdown }
  }

  async *streamICMemo(input: AIScoreInput): AsyncGenerator<string> {
    const user = `Write a detailed IC Screening Memo for ${input.company.name} (${input.company.sector}, ${input.company.stage}).
Description: ${input.company.description ?? 'N/A'}
Founders: ${input.contacts?.map(c => c.name).join(', ') ?? 'N/A'}
Include: executive summary, market analysis, team assessment, traction, risks, and recommendation.`

    yield* this.stream(SYSTEM, user)
  }
}
