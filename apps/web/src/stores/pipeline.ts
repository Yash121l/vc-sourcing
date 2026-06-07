import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CompanyStatus, CompanySector, CompanyStage } from '@vc/types'

interface PipelineFilters {
  status: CompanyStatus[]
  sector: CompanySector[]
  stage: CompanyStage[]
  search: string
}

type ViewMode = 'kanban' | 'list'

interface PipelineStore {
  filters: PipelineFilters
  viewMode: ViewMode
  sidebarCollapsed: boolean
  setFilters: (filters: Partial<PipelineFilters>) => void
  clearFilters: () => void
  setViewMode: (mode: ViewMode) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
}

const DEFAULT_FILTERS: PipelineFilters = {
  status: [],
  sector: [],
  stage: [],
  search: '',
}

export const usePipelineStore = create<PipelineStore>()(
  persist(
    (set) => ({
      filters: DEFAULT_FILTERS,
      viewMode: 'kanban',
      sidebarCollapsed: false,
      setFilters: (filters) => set((s) => ({ filters: { ...s.filters, ...filters } })),
      clearFilters: () => set({ filters: DEFAULT_FILTERS }),
      setViewMode: (viewMode) => set({ viewMode }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
    }),
    { name: 'vc-pipeline', partialize: (s) => ({ viewMode: s.viewMode, sidebarCollapsed: s.sidebarCollapsed }) }
  )
)
