import { ApiError } from './errors'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000'

// Token getter — injected at auth setup
let getTokenFn: (() => Promise<string | null>) | null = null
let onUnauthorizedFn: (() => void) | null = null

export function setTokenGetter(fn: () => Promise<string | null>) {
  getTokenFn = fn
}

export function setOnUnauthorized(fn: () => void) {
  onUnauthorizedFn = fn
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  if (!getTokenFn) return {}
  const token = await getTokenFn()
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

async function parseError(response: Response): Promise<ApiError> {
  let message = `HTTP ${response.status}`
  let details: Record<string, string[]> | undefined

  try {
    const body = await response.json()
    message = body.detail ?? body.title ?? body.message ?? message
    if (body.errors) {
      details = body.errors
    }
  } catch {
    // ignore json parse error
  }

  const codeMap: Record<number, ApiError['code']> = {
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'NotFound',
    409: 'Conflict',
    400: 'ValidationError',
    422: 'ValidationError',
  }

  return new ApiError(
    response.status,
    codeMap[response.status] ?? 'ServerError',
    message,
    details
  )
}

type RequestInit = {
  method?: string
  body?: unknown
  params?: Record<string, string | number | boolean | undefined>
  signal?: AbortSignal
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { method = 'GET', body, params, signal } = options

  let url = `${BASE_URL}${path}`
  if (params) {
    const searchParams = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.set(key, String(value))
      }
    }
    const qs = searchParams.toString()
    if (qs) url += `?${qs}`
  }

  const authHeaders = await getAuthHeaders()
  const headers: Record<string, string> = {
    ...authHeaders,
    ...(body ? { 'Content-Type': 'application/json' } : {}),
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  })

  if (response.status === 401) {
    onUnauthorizedFn?.()
    throw await parseError(response)
  }

  if (!response.ok) {
    throw await parseError(response)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export const api = {
  get: <T>(path: string, params?: Record<string, string | number | boolean | undefined>, signal?: AbortSignal) =>
    request<T>(path, { method: 'GET', params, signal }),

  post: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
    request<T>(path, { method: 'POST', body, signal }),

  put: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
    request<T>(path, { method: 'PUT', body, signal }),

  patch: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
    request<T>(path, { method: 'PATCH', body, signal }),

  delete: <T = void>(path: string, signal?: AbortSignal) =>
    request<T>(path, { method: 'DELETE', signal }),
}

export { BASE_URL }
