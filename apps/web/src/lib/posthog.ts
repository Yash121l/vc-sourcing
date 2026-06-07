import posthog from 'posthog-js'

export function initPostHog() {
  const key = import.meta.env['VITE_POSTHOG_KEY']
  const host = import.meta.env['VITE_POSTHOG_HOST'] ?? 'https://us.posthog.com'
  if (!key || key.startsWith('phc_placeholder')) return
  posthog.init(key, {
    api_host: host,
    capture_pageview: false, // TanStack Router handles this
    persistence: 'localStorage',
    autocapture: true,
    session_recording: { maskAllInputs: true },
    loaded(ph) {
      if (import.meta.env['VITE_APP_ENV'] !== 'production') {
        ph.opt_out_capturing()
      }
    },
  })
}

export function captureEvent(event: string, props?: Record<string, unknown>) {
  posthog.capture(event, props)
}

export function identifyUser(id: string, traits?: Record<string, unknown>) {
  posthog.identify(id, traits)
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
