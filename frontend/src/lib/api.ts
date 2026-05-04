import { API_BASE } from './api-base';

const TOKEN_KEY = 'ldh_token';
/** Respaldo si localStorage está bloqueado o lleno (misma pestaña, sobrevive a F5). */
const TOKEN_SESSION_FALLBACK = 'ldh_token_ss';

let memoryToken: string | null = null;

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  if (memoryToken) return memoryToken;
  try {
    const fromLocal = localStorage.getItem(TOKEN_KEY);
    if (fromLocal) return fromLocal;
  } catch {
    /* quota / bloqueo */
  }
  try {
    return sessionStorage.getItem(TOKEN_SESSION_FALLBACK);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  if (typeof window === 'undefined') return;
  memoryToken = token;
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    /* seguir con sessionStorage */
  }
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_SESSION_FALLBACK, token);
    } else {
      sessionStorage.removeItem(TOKEN_SESSION_FALLBACK);
    }
  } catch {
    /* ignorar */
  }
}

type FetchOpts = RequestInit & { skipAuth?: boolean };

/** GET/POST públicos sin JWT. */
export async function publicApiFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
  return apiFetch<T>(path, { ...opts, skipAuth: true });
}

export async function apiFetch<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const headers = new Headers(opts.headers);
  if (!headers.has('Content-Type') && opts.body && !(opts.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (!opts.skipAuth) {
    const t = getToken();
    if (t) headers.set('Authorization', `Bearer ${t}`);
  }
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const msg =
      typeof data?.detail === 'string' ? data.detail : res.statusText || 'Error de API';
    throw new Error(msg);
  }
  return data as T;
}
