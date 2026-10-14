import posthog from 'posthog-js'

// Public PostHog project key (phc_ keys are write-only client keys and safe to ship).
// VITE_POSTHOG_KEY overrides it and also enables capture on localhost / dev builds.
const ENV_KEY = import.meta.env['VITE_POSTHOG_KEY'] as string | undefined
const POSTHOG_KEY = ENV_KEY || 'phc_oLm8fb7L4CXDqGdJcc7a6boCtR8rVjf6dNx7G995eGdy'
export const APP_SLUG = 'vc-sourcing'

export function initPostHog() {
  const isLocalhost = ['localhost', '127.0.0.1', '[::1]'].includes(window.location.hostname)
  const explicitlyEnabled = Boolean(ENV_KEY) && !ENV_KEY!.startsWith('phc_placeholder')
  if (!explicitlyEnabled && (!import.meta.env.PROD || isLocalhost)) return

  posthog.init(POSTHOG_KEY, {
    // Same-origin reverse proxy (functions/ingest/[[path]].ts) so ad blockers don't drop events.
    api_host: '/ingest',
    ui_host: 'https://us.posthog.com',
    defaults: '2026-08-30',
    persistence: 'localStorage',
    capture_pageview: 'history_change',
    capture_pageleave: true,
    autocapture: true,
    enable_heatmaps: true,
    capture_dead_clicks: true,
    capture_exceptions: true,
    capture_performance: { web_vitals: true },
    // Founder and deal data is sensitive: mask every input and all text in replays,
    // and keep element text and attributes out of autocapture events.
    mask_all_text: true,
    mask_all_element_attributes: true,
    session_recording: { maskAllInputs: true, maskTextSelector: '*' },
  })
  posthog.register({ app: APP_SLUG })
}

/** Fire-and-forget capture. Never pass company names, founder names or free text. */
export function captureEvent(event: string, props?: Record<string, unknown>) {
  if (!posthog.__loaded) return
  posthog.capture(event, props)
}

/** Identify by internal user id only: no email or name person properties (sensitive app). */
export function identifyUser(id: string, traits?: { organization_id?: string }) {
  if (!posthog.__loaded) return
  posthog.identify(id, traits?.organization_id ? { organization_id: traits.organization_id } : undefined)
}

export function resetUser() {
  if (!posthog.__loaded) return
  posthog.reset()
}

export function isFeatureEnabled(flag: string): boolean {
  return posthog.isFeatureEnabled(flag) ?? false
}

export function getFeatureFlag(flag: string) {
  return posthog.getFeatureFlag(flag)
}

// A/B test helper — returns variant key for this user
export function getVariant(flag: string): string {
  const value = posthog.getFeatureFlag(flag)
  return typeof value === 'string' ? value : 'control'
}

export { posthog }
