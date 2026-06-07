// Shared Hono environment types for CF Workers
export type Bindings = {
  DB: D1Database
  ANTHROPIC_API_KEY: string
  WORKOS_API_KEY: string
  WORKOS_CLIENT_ID: string
  WEB_URL: string
  REQUIRE_AUTH: string
}

export type AuthUser = {
  id: string
  email: string
  firstName?: string | undefined
  lastName?: string | undefined
  organizationId?: string | undefined
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AppDB = any

export type Variables = {
  db: AppDB
  user: AuthUser | null
}

export type AppEnv = {
  Bindings: Bindings
  Variables: Variables
}
