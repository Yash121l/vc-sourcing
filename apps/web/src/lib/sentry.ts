import * as Sentry from '@sentry/react'

export function initSentry() {
  const dsn = import.meta.env['VITE_SENTRY_DSN']
  if (!dsn) return
  Sentry.init({
    dsn,
    environment: import.meta.env['VITE_APP_ENV'] ?? 'development',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
    ],
    tracesSampleRate: import.meta.env['VITE_APP_ENV'] === 'production' ? 0.1 : 1.0,
    replaysSessionSampleRate: 0.05,
    replaysOnErrorSampleRate: 1.0,
  })
}

export function captureError(err: unknown, context?: Record<string, unknown>) {
  if (context) Sentry.setContext('details', context)
  Sentry.captureException(err)
}

export { Sentry }
