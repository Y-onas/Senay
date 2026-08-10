/**
 * Thin API client.
 * Dev: Vite proxies `/api` → backend :4000 (same origin).
 * Set VITE_USE_MOCK=true only for offline UI work.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export const USE_MOCK = (import.meta.env.VITE_USE_MOCK ?? 'false') === 'true'

const MOCK_LATENCY_MS = 350

export function delay(ms = MOCK_LATENCY_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function mockResolve<T>(data: T, ms?: number): Promise<T> {
  await delay(ms)
  return data
}

export interface RequestOptions extends RequestInit {
  json?: unknown
  token?: string | null
  /** Abort slow requests on poor connections (default 12s). Pass `null` to disable. */
  timeoutMs?: number | null
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { json, headers, token, timeoutMs = 12_000, ...rest } = options
  const locale =
    typeof window !== 'undefined'
      ? (localStorage.getItem('senay_locale') ?? document.documentElement.lang ?? 'en')
      : 'en'

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    signal:
      rest.signal ??
      (timeoutMs != null && timeoutMs > 0 ? AbortSignal.timeout(timeoutMs) : undefined),
    headers: {
      'Content-Type': 'application/json',
      'x-lang': locale.toLowerCase() === 'am' ? 'am' : 'en',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  })

  if (response.status === 401 && path.startsWith('/admin') && !path.includes('/auth/login')) {
    localStorage.removeItem('senay-cms-token')
    localStorage.removeItem('senay-cms-admin')
    const base = (import.meta.env.VITE_CMS_PATH || 'st-hq').replace(/^\/+|\/+$/g, '')
    if (!window.location.pathname.includes(`/${base}/login`)) {
      window.location.assign(`/${base}/login`)
    }
  }

  if (!response.ok) {
    let message = `API error ${response.status}`
    try {
      const err = (await response.json()) as { error?: string }
      if (err.error) message = err.error
    } catch {
      /* ignore */
    }
    throw new Error(message)
  }

  return (await response.json()) as T
}

export function makeReference(prefix = 'ST'): string {
  const code = Math.random().toString(36).slice(2, 7).toUpperCase()
  return `${prefix}-${code}`
}

export function unwrapData<T>(payload: { data: T } | T): T {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as { data: T }).data
  }
  return payload as T
}
