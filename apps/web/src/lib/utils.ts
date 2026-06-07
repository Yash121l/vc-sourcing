import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { LucideIcon } from 'lucide-react'
import {
  CreditCard, Cloud, ShoppingBag, Microscope, Heart, BookOpen,
  ShoppingCart, Leaf, Sprout, Truck, Building2, Users, Scale, Layers,
  Newspaper, DollarSign, UserPlus, Package, MessageSquare, Shield,
} from 'lucide-react'
import type { CompanyStatus, CompanySector, CompanyStage, SignalType } from '@vc/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | undefined | null, opts?: { compact?: boolean }): string {
  if (value == null) return '—'
  if (opts?.compact) {
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

export function formatNumber(value: number | undefined | null): string {
  if (value == null) return '—'
  return new Intl.NumberFormat('en-US', { notation: 'compact' }).format(value)
}

export function formatDate(date: string | undefined | null): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date))
}

export function formatRelativeTime(date: string | undefined | null): string {
  if (!date) return '—'
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  const diff = (new Date(date).getTime() - Date.now()) / 1000
  if (Math.abs(diff) < 60) return rtf.format(Math.round(diff), 'second')
  if (Math.abs(diff) < 3600) return rtf.format(Math.round(diff / 60), 'minute')
  if (Math.abs(diff) < 86400) return rtf.format(Math.round(diff / 3600), 'hour')
  return rtf.format(Math.round(diff / 86400), 'day')
}

export const STATUS_CONFIG: Record<CompanyStatus, { label: string; color: string; bg: string }> = {
  radar:      { label: 'Radar',      color: '#64748b', bg: '#64748b18' },
  contacted:  { label: 'Contacted',  color: '#3b82f6', bg: '#3b82f618' },
  engaged:    { label: 'Engaged',    color: '#8b5cf6', bg: '#8b5cf618' },
  screening:  { label: 'Screening',  color: '#6366f1', bg: '#6366f118' },
  passed:     { label: 'Passed',     color: '#ef4444', bg: '#ef444418' },
  watch:      { label: 'Watch',      color: '#f59e0b', bg: '#f59e0b18' },
  proceeding: { label: 'Proceeding', color: '#10b981', bg: '#10b98118' },
}

export const SECTOR_CONFIG: Record<CompanySector, { label: string; icon: LucideIcon }> = {
  fintech:    { label: 'Fintech',    icon: CreditCard },
  saas:       { label: 'SaaS',       icon: Cloud },
  consumer:   { label: 'Consumer',   icon: ShoppingBag },
  deeptech:   { label: 'DeepTech',   icon: Microscope },
  healthtech: { label: 'HealthTech', icon: Heart },
  edtech:     { label: 'EdTech',     icon: BookOpen },
  ecommerce:  { label: 'eCommerce',  icon: ShoppingCart },
  climate:    { label: 'Climate',    icon: Leaf },
  agritech:   { label: 'AgriTech',   icon: Sprout },
  logistics:  { label: 'Logistics',  icon: Truck },
  proptech:   { label: 'PropTech',   icon: Building2 },
  hrtech:     { label: 'HRTech',     icon: Users },
  legaltech:  { label: 'LegalTech',  icon: Scale },
  other:      { label: 'Other',      icon: Layers },
}

export const STAGE_CONFIG: Record<CompanyStage, { label: string; color: string }> = {
  pre_seed: { label: 'Pre-Seed', color: '#94a3b8' },
  seed:     { label: 'Seed',     color: '#818cf8' },
  series_a: { label: 'Series A', color: '#60a5fa' },
  series_b: { label: 'Series B', color: '#34d399' },
  growth:   { label: 'Growth',   color: '#fbbf24' },
  unknown:  { label: 'Unknown',  color: '#64748b' },
}

export const SIGNAL_CONFIG: Record<SignalType, { label: string; color: string; icon: LucideIcon }> = {
  news:       { label: 'News',       color: '#60a5fa', icon: Newspaper },
  funding:    { label: 'Funding',    color: '#34d399', icon: DollarSign },
  hiring:     { label: 'Hiring',     color: '#818cf8', icon: UserPlus },
  product:    { label: 'Product',    color: '#f59e0b', icon: Package },
  social:     { label: 'Social',     color: '#f472b6', icon: MessageSquare },
  regulatory: { label: 'Regulatory', color: '#ef4444', icon: Shield },
}

export const SCORECARD_DIMENSIONS = [
  { key: 'team',           label: 'Team & Founders',   description: 'Founder-market fit, pedigree, coachability' },
  { key: 'market',         label: 'Market Size',       description: 'TAM/SAM/SOM, growth rate, timing' },
  { key: 'product',        label: 'Product & Tech',    description: 'Moat, differentiation, tech quality' },
  { key: 'traction',       label: 'Traction',          description: 'ARR, growth, NPS, retention' },
  { key: 'business_model', label: 'Business Model',    description: 'Unit economics, payback, capital efficiency' },
  { key: 'investment_fit', label: 'Investment Fit',    description: 'Thesis alignment, portfolio synergy' },
] as const

export function computeOverallScore(scores: Record<string, number | undefined | null>): number {
  const weights = { team: 1.5, market: 1, product: 1, traction: 1, business_model: 1.5, investment_fit: 1 }
  let total = 0, totalWeight = 0
  for (const [key, weight] of Object.entries(weights)) {
    const val = scores[key]
    if (val != null && val > 0) { total += val * weight; totalWeight += weight }
  }
  return totalWeight ? Math.round((total / totalWeight) * 10) / 10 : 0
}

export function scoreColor(score: number): string {
  if (score >= 8) return '#10b981'
  if (score >= 6) return '#f59e0b'
  if (score >= 4) return '#f97316'
  return '#ef4444'
}
