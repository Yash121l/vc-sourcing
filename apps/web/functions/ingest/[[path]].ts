// Cloudflare Pages Function: same-origin reverse proxy for PostHog (US cloud).
// /ingest/static/* and /ingest/array/* -> us-assets.i.posthog.com, everything else -> us.i.posthog.com.
const API_HOST = 'us.i.posthog.com'
const ASSET_HOST = 'us-assets.i.posthog.com'

export const onRequest = async ({ request }: { request: Request }): Promise<Response> => {
  const url = new URL(request.url)
  const path = url.pathname.replace(/^\/ingest/, '') || '/'
  const host = path.startsWith('/static/') || path.startsWith('/array/') ? ASSET_HOST : API_HOST

  const headers = new Headers(request.headers)
  headers.delete('cookie')
  headers.set('host', host)
  const clientIp = request.headers.get('cf-connecting-ip')
  if (clientIp) headers.set('x-forwarded-for', clientIp)

  const init: RequestInit = { method: request.method, headers, redirect: 'manual' }
  if (request.method !== 'GET' && request.method !== 'HEAD') init.body = request.body
  return fetch(`https://${host}${path}${url.search}`, init)
}
