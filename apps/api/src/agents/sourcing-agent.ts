import type { AIPreScreenInput, AIPreScreenOutput } from '@vc/types'
import { BaseAgent } from './base-agent'

const SYSTEM = `You are an expert VC analyst at a top-tier Indian venture capital firm.
Your job is to rapidly pre-screen startup pitches and score them across key investment criteria.
You are rigorous, data-driven, and direct. Score only on the information given — do not inflate scores.
Always respond with valid JSON matching the exact schema requested.`

export class SourcingAgent extends BaseAgent {
  async preScreen(input: AIPreScreenInput): Promise<AIPreScreenOutput> {
    const user = `Pre-screen this startup and return a JSON object with this exact schema:
{
  "score": <number 0-100 overall pre-screen score>,
  "rationale": "<2-3 sentence overall assessment>",
  "flags": ["<red flag 1>", "<red flag 2>"],
  "recommendation": "<'advance' | 'pass' | 'watch'>",
  "sector_fit": <number 0-10>,
  "team_signal": <number 0-10>,
  "tam_signal": <number 0-10>,
  "traction_signal": <number 0-10>
}

Startup info:
Name: ${input.name}
Website: ${input.website ?? 'N/A'}
Sector: ${input.sector ?? 'N/A'}
Stage: ${input.stage ?? 'N/A'}
Description: ${input.description ?? 'N/A'}
Team: ${input.team_info ?? 'N/A'}

Scoring guide:
- sector_fit: Does this align with a VC fund investing in Indian B2B/consumer/fintech/deeptech?
- team_signal: Evidence of strong founding team (IIT/IIM, domain expertise, prior exits)?
- tam_signal: Is the addressable market large enough (>$1B)?
- traction_signal: Early revenue, growth metrics, or strong user signals?
- score >70: advance to analyst review; 50-70: watch; <50: pass

Return ONLY the JSON object, no other text.`

    const response = await this.run(SYSTEM, user)
    return this.parseJSON<AIPreScreenOutput>(response)
  }

  async *streamPreScreen(input: AIPreScreenInput): AsyncGenerator<string> {
    const user = `Provide a detailed pre-screening analysis for:
Name: ${input.name}
Sector: ${input.sector ?? 'N/A'}
Description: ${input.description ?? 'N/A'}
Stage: ${input.stage ?? 'N/A'}

Cover: team assessment, market opportunity, competitive landscape, key risks, and recommendation.
Be concise, specific, and actionable — like you're briefing a senior partner.`

    yield* this.stream(SYSTEM, user)
  }
}
