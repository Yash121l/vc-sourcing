# VC Sourcing Platform — AI Development Guide

> This project is built entirely by AI agents. This file is the canonical reference.
> Read this completely before touching any file.

---

## 1. Project Mission

A production-grade platform for VC teams to automate and streamline:
- **Module 01 — Deal Sourcing**: Inbound portal, AI pre-screening, analyst queue, outbound scouting pipeline
- **Module 02 — Initial Screening**: Founder intro workflow, market sizing, scorecard (6 dims × 10pts), IC memo generation

The reference VC workflow (`/Users/yashlunawat/Downloads/vc-workflow.jsx`) defines the exact process.
Phases beyond 01–02 exist in the workflow but are **out of scope for this sprint**.

---

## 2. Tech Stack (VoidZero Stack)

| Layer | Technology | Notes |
|---|---|---|
| Build | **Vite 6** | `@tailwindcss/vite` plugin, `vite-tsconfig-paths` |
| Test | **Vitest 3** | `@vitest/ui`, `@testing-library/react` |
| Lint | **oxlint** + **ESLint** | `eslint-plugin-oxlint` bridges the two |
| Bundler | Rolldown-ready | Vite 6 → upgrade to Vite 8/Rolldown when stable |
| Language | TypeScript 5.7 (strict) | `verbatimModuleSyntax`, `noUncheckedIndexedAccess` |
| Framework | React 19 | Concurrent features, `use()` hook |
| Routing | TanStack Router | Code-based definitions in `apps/web/src/routes.tsx` |
| Server State | TanStack Query v5 | `queryOptions()` pattern |
| Client State | Zustand + `persist` | Theme, sidebar, filters only |
| Tables | TanStack Table v8 | Column visibility, sorting, filtering |
| Forms | React Hook Form + Zod | `zodResolver()` everywhere |
| UI Base | Radix UI primitives | Shadcn/ui pattern (copy components, not a dep) |
| Styling | **Tailwind CSS v4** | `@tailwindcss/vite`, CSS-first config |
| Icons | Lucide React | Only import what's used |
| Charts | Recharts | Responsive containers, custom tooltips |
| Animations | Framer Motion | Layout animations, page transitions |
| API | **Hono** | `@hono/node-server`, RPC-style types |
| Database | **Drizzle ORM** + LibSQL | `.db` file locally, Turso in production |
| AI Agents | **Anthropic SDK** | Model: `claude-sonnet-4-6`, streaming |
| Auth | **Better Auth** | (future sprint — scaffold routes now) |

---

## 3. Monorepo Structure

```
vc-sourcing/
├── apps/
│   ├── web/                   # React 19 frontend (port 5173)
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── routes.tsx     # All route definitions (TanStack Router)
│   │       ├── styles/
│   │       │   └── globals.css
│   │       ├── components/
│   │       │   ├── layout/    # AppShell, Sidebar, TopBar
│   │       │   └── ui/        # Button, Card, Badge, Input, Dialog, Tabs...
│   │       ├── pages/
│   │       │   ├── DashboardPage.tsx
│   │       │   ├── sourcing/
│   │       │   │   ├── SourcingPipelinePage.tsx   # Kanban + list view
│   │       │   │   ├── DiscoverPage.tsx            # Company search + import
│   │       │   │   ├── SignalsPage.tsx             # Real-time signal feed
│   │       │   │   └── CompanyDetailPage.tsx       # Full company profile
│   │       │   └── screening/
│   │       │       ├── ScreeningQueuePage.tsx      # Screening queue
│   │       │       └── ScreeningDetailPage.tsx     # 6-dim scorecard + AI
│   │       ├── stores/
│   │       │   ├── theme.ts   # dark/light/system + persist
│   │       │   └── pipeline.ts
│   │       ├── hooks/
│   │       │   ├── useCompanies.ts
│   │       │   └── useScreening.ts
│   │       └── lib/
│   │           ├── utils.ts   # cn(), formatCurrency(), etc.
│   │           ├── api.ts     # Hono RPC client
│   │           └── constants.ts
│   └── api/                   # Hono backend (port 3001)
│       └── src/
│           ├── index.ts       # App entry + middleware
│           ├── routes/
│           │   ├── companies.ts
│           │   ├── screening.ts
│           │   ├── signals.ts
│           │   └── agents.ts
│           └── agents/
│               ├── base-agent.ts
│               ├── sourcing-agent.ts   # AI deal discovery
│               ├── screening-agent.ts  # Scorecard generation
│               └── enrichment-agent.ts # Data enrichment
├── packages/
│   ├── db/                    # Drizzle schema + migrations
│   │   └── src/schema/
│   │       ├── companies.ts
│   │       ├── screening.ts
│   │       ├── signals.ts
│   │       └── index.ts
│   └── types/                 # Shared TypeScript types
│       └── src/index.ts
├── CLAUDE.md                  ← YOU ARE HERE
├── package.json
└── pnpm-workspace.yaml
```

---

## 4. Module 01 — Deal Sourcing (Exact Spec)

### Process (from vc-workflow.jsx)
1. **Inbound Portal Submission** — Founder submits pitch. Auto-ack within 24h. Sector + stage auto-tagged.
2. **AI Pre-Screening** — Claude scores deck: sector fit, team pedigree, TAM signal, traction stage. Below threshold → auto-pass email sent.
3. **Analyst First Review (48–72hr SLA)** — Manual review: market size, business model, team. Decision in CRM.
4. **Outbound & Scouting** — Thesis-driven hunting via AngelList, demo days, LinkedIn, scout network.

### Pipeline Status States
```typescript
type CompanyStatus = 
  | 'radar'       // discovered, not yet contacted
  | 'contacted'   // outreach sent
  | 'engaged'     // in conversation with founder
  | 'screening'   // moved to Module 02
  | 'passed'      // decided not to proceed
  | 'watch'       // not now, revisit later
  | 'proceeding'  // advancing to DD (Phase 03)
```

### Source Types
```typescript
type SourceType = 
  | 'inbound_portal'   // founder submitted
  | 'outbound_search'  // analyst found
  | 'scout_referral'   // scout network
  | 'co_investor'      // VC co-investment network
  | 'demo_day'         // accelerator demo day
  | 'conference'       // event/conference
  | 'newsletter'       // sector newsletter
  | 'linkedin'         // LinkedIn scouting
  | 'angellist'        // AngelList
  | 'warm_intro'       // personal introduction
```

### Outputs to Build
- Weekly Pipeline Dashboard (metrics: total in funnel, by stage, by sector, by source)
- Screened Deal Log (filterable table with all pass decisions)
- Pass Rationale on File (structured reason required before marking passed)
- Outreach tracking (status of each contact attempt)

### UI: Kanban Board Columns (left → right)
Radar → Contacted → Engaged → Screening → [Passed | Watch | Proceeding] (last 3 are collapsed/filtered)

---

## 5. Module 02 — Initial Screening (Exact Spec)

### Process (from vc-workflow.jsx)
1. **Founder Intro Call (30 min)** — Assess founder-market fit, vision clarity, coachability, team dynamics.
2. **Market Sizing (TAM/SAM/SOM)** — Independent research from third-party sources. Validate founder assumptions.
3. **Competitive Landscape** — Map direct/indirect competitors. Moat, differentiation, timing, winner analysis.
4. **Business Model Review** — Unit economics, pricing power, payback period, path to profitability.
5. **Internal Scorecard Submission** — 6-dimensional score (1–10 each). Team vote. Advance to DD or close with feedback.

### Scorecard: 6 Dimensions (1–10 each)
```typescript
interface ScorecardDimensions {
  team: number           // Team & Founders — pedigree, coachability, founder-market fit
  market: number         // Market Size — TAM/SAM/SOM, growth rate, timing
  product: number        // Product & Technology — moat, differentiation, tech debt
  traction: number       // Traction & Metrics — ARR, MoM growth, NPS, cohort retention
  business_model: number // Business Model — unit economics, payback, capital efficiency
  investment_fit: number // Investment Fit — thesis alignment, check size, portfolio synergy
}
```

### Screening Statuses
```typescript
type ScreeningStatus = 'queued' | 'in_progress' | 'completed'
type ScreeningDecision = 'pass' | 'proceed' | 'watch' | null
```

### Outputs to Build
- IC Screening Memo (structured markdown, exportable to PDF)
- Deal Scorecard (visual radar chart + dimension breakdown)
- Pipeline CRM Updated (auto-update company status after decision)
- One-Pager (AI-generated, editable, downloadable)

### AI Screening Agent Capabilities
1. **Score Generation** — Given company info, generate scores + rationale per dimension
2. **Red Flag Detection** — Identify 3–5 potential red flags with severity
3. **One-Pager Generation** — Concise 1-page company summary (problem, solution, market, team, traction, ask)
4. **IC Memo Draft** — Full IC screening memo (problem, market, team, product, financials, risks, recommendation)
5. **Market Analysis** — TAM/SAM/SOM breakdown with sources and methodology

---

## 6. Database Schema Overview

### `companies` table
```typescript
id, name, website, description, logo_url,
stage,           // 'pre_seed' | 'seed' | 'series_a' | 'series_b' | 'growth'
sector,          // 'fintech' | 'saas' | 'consumer' | 'deeptech' | 'healthtech' | 'edtech' | 'ecommerce' | 'other'
subsector,       // free text
geography,       // country code
city,
founded_year,
team_size,
funding_total_usd,
last_funding_date,
last_funding_amount_usd,
last_funding_type,
arr_usd,         // Annual Recurring Revenue
mrr_usd,         // Monthly Recurring Revenue
growth_rate_pct, // MoM % growth
status,          // CompanyStatus above
source_type,     // SourceType above
source_detail,   // free text (e.g., scout name, link)
assigned_to,     // analyst user ID
ai_pre_score,    // 0–100, from AI pre-screening
ai_pre_summary,  // brief AI rationale
pass_reason,     // required when status = 'passed'
crunchbase_url,
linkedin_url,
angellist_url,
github_url,
created_at, updated_at
```

### `contacts` table (founders + team)
```typescript
id, company_id, name, role, title,
linkedin_url, twitter_url, email,
background, education, is_founder,
created_at, updated_at
```

### `screenings` table
```typescript
id, company_id,
screened_by,       // user
screening_date,
score_team,        score_market,    score_product,
score_traction,    score_business_model, score_investment_fit,
overall_score,     // weighted average
decision,          // 'pass' | 'proceed' | 'watch' | null
decision_rationale,
meeting_notes,     // markdown
ai_summary,        // AI-generated summary
ai_flags,          // JSON array of red flags
ai_one_pager,      // AI-generated one-pager markdown
ic_memo_draft,     // AI-generated IC memo markdown
status,            // 'queued' | 'in_progress' | 'completed'
created_at, updated_at
```

### `signals` table
```typescript
id, company_id,
type,              // 'news' | 'funding' | 'hiring' | 'product' | 'social' | 'regulatory'
title, description, url,
source_name,
published_at, detected_at,
is_read,
sentiment,         // 'positive' | 'neutral' | 'negative'
created_at
```

### `outreach` table
```typescript
id, company_id, contact_id,
type,              // 'email' | 'linkedin' | 'intro' | 'event'
status,            // 'planned' | 'sent' | 'replied' | 'meeting_scheduled' | 'no_response'
sent_at, replied_at,
notes, template_used,
created_at, updated_at
```

---

## 7. API Routes

### Companies
```
GET    /api/companies              # list with filters & pagination
POST   /api/companies              # create new company
GET    /api/companies/:id          # get company detail
PATCH  /api/companies/:id          # update company
DELETE /api/companies/:id          # soft delete
POST   /api/companies/:id/status   # update pipeline status
GET    /api/companies/:id/signals  # company signals
GET    /api/companies/:id/contacts # company contacts
```

### Screening
```
GET    /api/screenings             # screening queue
POST   /api/screenings             # start screening
GET    /api/screenings/:id         # screening detail
PATCH  /api/screenings/:id         # update scorecard
POST   /api/screenings/:id/decide  # submit decision
```

### AI Agents
```
POST   /api/agents/pre-screen      # AI pre-screen a company
POST   /api/agents/score           # generate scorecard with AI
POST   /api/agents/one-pager       # generate one-pager
POST   /api/agents/ic-memo         # generate IC memo
POST   /api/agents/enrich          # enrich company data
POST   /api/agents/flags           # detect red flags
```

### Signals
```
GET    /api/signals                # all signals feed
POST   /api/signals/:id/read       # mark as read
```

---

## 8. Design System & UI Guidelines

### Theme Strategy (Tailwind v4 + CSS Variables)
- Dark mode via `.dark` class on `<html>` element
- Theme stored in Zustand + `localStorage` (`vc-theme` key)
- System preference detection on first load
- Toggle in TopBar

### Color Palette
```css
/* Phase colors (consistent across app) */
--color-sourcing: #7c3aed;    /* violet */
--color-screening: #6366f1;   /* indigo */
--color-dd: #f59e0b;          /* amber */
--color-ic: #ef4444;          /* red */
--color-closing: #10b981;     /* emerald */

/* Status pill colors */
--color-status-radar: #64748b;
--color-status-contacted: #3b82f6;
--color-status-engaged: #8b5cf6;
--color-status-screening: #6366f1;
--color-status-passed: #ef4444;
--color-status-watch: #f59e0b;
--color-status-proceeding: #10b981;
```

### Typography
- Display / Headings: `Fraunces` (serif, italic for emphasis) — mirrors vc-workflow.jsx design
- Body / UI: `DM Sans` (clean, modern)
- Mono: `JetBrains Mono`

### Layout
- Sidebar: 240px fixed, collapsible to 64px (icon-only), stores state in Zustand
- TopBar: 56px height, sticky
- Content area: full width - sidebar, scrollable
- Max content width: 1400px, centered with `mx-auto px-6`

### Responsive Breakpoints
- Mobile (<640px): Sidebar hidden, bottom nav instead
- Tablet (640–1024px): Sidebar collapsed (icon-only)
- Desktop (>1024px): Sidebar expanded

### Component Patterns
```tsx
// All UI components use this cn() utility
import { cn } from '@/lib/utils'

// Variant pattern using CVA
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
  'base-classes',
  { variants: { variant: { default: '...', destructive: '...' } } }
)
```

---

## 9. AI Agent Architecture

### Base Agent Pattern
```typescript
// apps/api/src/agents/base-agent.ts
import Anthropic from '@anthropic-ai/sdk'

export abstract class BaseAgent {
  protected client: Anthropic
  protected model = 'claude-sonnet-4-6' as const

  constructor() {
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }

  protected async run(system: string, user: string): Promise<string>
  protected async stream(system: string, user: string): AsyncIterable<string>
  protected async runWithTools(system: string, user: string, tools: Tool[]): Promise<ToolResult>
}
```

### Agent: SourcingAgent
```typescript
// Uses: generate deal quality score (0-100), given company name + description + sector + website
// Input: { name, website, description, sector, stage }
// Output: { score: number, rationale: string, flags: string[], recommendation: 'advance' | 'pass' }
```

### Agent: ScreeningAgent
```typescript
// Uses: generate 6-dimension scorecard + IC memo + one-pager
// Input: Company + Contact + existing notes
// Output: { scores: ScorecardDimensions, rationale: Record<dim, string>, flags: RedFlag[], one_pager: string, ic_memo: string }
```

### Agent: EnrichmentAgent
```typescript
// Uses: extract structured data from company website + description
// Input: { website, name }
// Output: { description, sector, stage, team_size, founded_year, key_facts: string[] }
```

### Streaming Pattern (for long operations)
```typescript
// API route streams SSE, frontend uses EventSource
app.post('/api/agents/score', async (c) => {
  return streamSSE(c, async (stream) => {
    const agent = new ScreeningAgent()
    for await (const chunk of agent.streamScore(input)) {
      await stream.writeSSE({ data: chunk })
    }
  })
})
```

---

## 10. Coding Conventions

### TypeScript
- `verbatimModuleSyntax` — always use `import type` for type-only imports
- `noUncheckedIndexedAccess` — always null-check array/object access
- Prefer `satisfies` over `as` for type assertions
- All API responses validated with Zod schemas
- Shared types live in `packages/types/src/index.ts`

### React
- Functional components only
- `use client` not needed (no Next.js — this is Vite)
- Custom hooks in `src/hooks/` prefixed with `use`
- All data fetching via TanStack Query `queryOptions()` pattern
- Error boundaries on all route segments
- Suspense boundaries for data loading

### File Organization
- One component per file
- Co-locate tests: `ComponentName.test.tsx` next to `ComponentName.tsx`
- Barrel exports via `index.ts` only for `components/ui/`

### CSS / Tailwind v4
- Use `@apply` sparingly (only for utility class sets repeated 3+ times)
- CSS variables for semantic colors, Tailwind classes for spacing/layout
- No inline `style=` unless truly dynamic (framer-motion values)

### API
- All routes return `{ data, error, meta }` envelope
- Errors: `{ error: { code, message, details } }`
- Pagination: `{ data: T[], meta: { page, per_page, total, total_pages } }`
- All inputs validated with Zod before hitting the DB

---

## 11. Environment Variables

```bash
# apps/api/.env
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=file:./local.db          # local SQLite via libsql
PORT=3001

# apps/web/.env  
VITE_API_URL=http://localhost:3001
```

---

## 12. Development Commands

```bash
# Install all dependencies
pnpm install

# Run everything (web + api in parallel)
pnpm dev

# Run only frontend
pnpm --filter @vc/web dev

# Run only API
pnpm --filter @vc/api dev

# Database
pnpm db:generate     # generate Drizzle migrations
pnpm db:migrate      # apply migrations
pnpm db:studio       # open Drizzle Studio

# Testing
pnpm test            # all packages
pnpm --filter @vc/web test --ui   # vitest UI

# Linting
pnpm lint            # oxlint + eslint
```

---

## 13. Current Build Status

### ✅ Completed (scaffold)
- Monorepo structure with pnpm workspaces
- Root TypeScript config
- packages/types — shared types
- packages/db — Drizzle schema
- apps/api — Hono API with all routes + AI agents
- apps/web — Full React app:
  - Vite + Tailwind v4 config
  - AppShell, Sidebar, TopBar (responsive, dark/light)
  - Theme system (Zustand + CSS variables)
  - TanStack Router setup
  - All core UI components (Button, Card, Badge, Input, Dialog, Tabs, etc.)
  - DashboardPage — metrics overview
  - SourcingPipelinePage — Kanban + list toggle
  - DiscoverPage — company search + add
  - SignalsPage — signal feed
  - ScreeningQueuePage — screening queue
  - ScreeningDetailPage — 6-dim scorecard + AI panel

### 🔲 Next Sprint (AI to build)
- `CompanyDetailPage` — full profile with signals, contacts, outreach timeline
- `AgentsPage` — AI agent activity log and manual triggers
- Outreach tracking UI (`/sourcing/outreach`)
- PDF export for IC memo and one-pager
- Network/relationship map (`/sourcing/network`)
- Batch import from CSV / Crunchbase
- Auth (Better Auth) — login, team management
- Email notifications (Resend) for pipeline updates
- Webhooks for real-time signal ingestion
- Modules 03–09 (DD through Exit) — detailed UI for each phase

### 🔲 Integration Targets
- Crunchbase API — company data enrichment
- LinkedIn API — founder research
- AngelList API — deal sourcing
- Clearbit / Apollo — contact enrichment
- News APIs (NewsAPI, Bing News) — signal detection
- Resend — transactional email
- Firecrawl — website scraping for enrichment
- Cal.com — founder intro call scheduling

---

## 14. Seed Data

Seed the database with 20 realistic Indian startup companies across sectors.
Use `packages/db/src/seed.ts` for this.
Run: `pnpm --filter @vc/db run seed`

---

## 15. AI Agent Instructions for Continuation

When building new features:
1. Check this CLAUDE.md for context
2. Read the relevant existing code before writing new code
3. Follow the existing patterns exactly (same imports, same structure)
4. Add tests for all business logic
5. Update this CLAUDE.md when you add new features
6. Keep API routes in sync with the Hono RPC types (shared via packages/types)
7. Never break existing TypeScript types
8. Always handle loading + error states in UI components
9. Every new page must support dark mode from day one
10. Run `pnpm type-check` before considering a task complete
