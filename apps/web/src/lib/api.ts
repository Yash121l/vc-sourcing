import type {
  Company, CreateCompanyInput, CompanyFilters,
  Screening, ScreeningFilters,
  Signal, Contact,
  AIPreScreenOutput, AIScoreOutput, AIOnePagerOutput,
  PaginatedResponse,
} from '@vc/types'

const BASE = import.meta.env['VITE_API_URL'] ?? ''

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: { message?: string } }
    throw new Error(body.error?.message ?? `Request failed: ${res.status}`)
  }
  const json = await res.json() as { data: T }
  return json.data
}

// ─── Companies ────────────────────────────────────────────────────────────────

export const companiesApi = {
  list: (filters?: CompanyFilters) => {
    const params = new URLSearchParams()
    if (filters?.status?.length) params.set('status', filters.status.join(','))
    if (filters?.sector?.length) params.set('sector', filters.sector.join(','))
    if (filters?.stage?.length) params.set('stage', filters.stage.join(','))
    if (filters?.search) params.set('search', filters.search)
    if (filters?.page) params.set('page', String(filters.page))
    if (filters?.per_page) params.set('per_page', String(filters.per_page))
    return request<PaginatedResponse<Company>['data']>(`/api/companies?${params}`)
  },
  get: (id: string) => request<Company>(`/api/companies/${id}`),
  create: (data: CreateCompanyInput) => request<Company>('/api/companies', {
    method: 'POST', body: JSON.stringify(data),
  }),
  update: (id: string, data: Partial<Company>) => request<Company>(`/api/companies/${id}`, {
    method: 'PATCH', body: JSON.stringify(data),
  }),
  updateStatus: (id: string, status: Company['status'], pass_reason?: string) =>
    companiesApi.update(id, { status, ...(pass_reason ? { pass_reason } : {}) }),
  getContacts: (id: string) => request<Contact[]>(`/api/companies/${id}/contacts`),
  getSignals: (id: string) => request<Signal[]>(`/api/companies/${id}/signals`),
}

// ─── Screenings ───────────────────────────────────────────────────────────────

export const screeningsApi = {
  list: (filters?: ScreeningFilters) => {
    const params = new URLSearchParams()
    if (filters?.status?.length) params.set('status', filters.status.join(','))
    return request<Screening[]>(`/api/screenings?${params}`)
  },
  get: (id: string) => request<Screening>(`/api/screenings/${id}`),
  create: (company_id: string) => request<Screening>('/api/screenings', {
    method: 'POST', body: JSON.stringify({ company_id }),
  }),
  update: (id: string, data: Partial<Screening>) => request<Screening>(`/api/screenings/${id}`, {
    method: 'PATCH', body: JSON.stringify(data),
  }),
  decide: (id: string, decision: 'pass' | 'proceed' | 'watch', rationale: string) =>
    request<Screening>(`/api/screenings/${id}/decide`, {
      method: 'POST', body: JSON.stringify({ decision, decision_rationale: rationale }),
    }),
}

// ─── Signals ──────────────────────────────────────────────────────────────────

export const signalsApi = {
  list: () => request<Signal[]>('/api/signals'),
  markRead: (id: string) => request<{ ok: boolean }>(`/api/signals/${id}/read`, { method: 'POST' }),
}

// ─── AI Agents ────────────────────────────────────────────────────────────────

export const agentsApi = {
  preScreen: (input: { name: string; website?: string; description?: string; sector?: string; stage?: string }) =>
    request<AIPreScreenOutput>('/api/agents/pre-screen', { method: 'POST', body: JSON.stringify(input) }),

  score: (company_id: string, screening_id?: string, meeting_notes?: string) =>
    request<AIScoreOutput>('/api/agents/score', {
      method: 'POST', body: JSON.stringify({ company_id, screening_id, meeting_notes }),
    }),

  onePager: (company_id: string) =>
    request<AIOnePagerOutput>('/api/agents/one-pager', { method: 'POST', body: JSON.stringify({ company_id }) }),

  enrich: (company_id: string) =>
    request<{ description: string; sector: string; key_facts: string[] }>('/api/agents/enrich', {
      method: 'POST', body: JSON.stringify({ company_id }),
    }),

  streamICMemo: (company_id: string, screening_id?: string, onChunk?: (chunk: string) => void) => {
    return new Promise<string>((resolve, reject) => {
      const body = JSON.stringify({ company_id, screening_id })
      fetch(`${BASE}/api/agents/ic-memo/stream`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body,
      }).then(async (res) => {
        if (!res.body) return reject(new Error('No response body'))
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let full = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const text = decoder.decode(value)
          const lines = text.split('\n').filter(l => l.startsWith('data: '))
          for (const line of lines) {
            const chunk = line.slice(6)
            if (chunk === '[DONE]') { resolve(full); return }
            full += chunk
            onChunk?.(chunk)
          }
        }
        resolve(full)
      }).catch(reject)
    })
  },
}
