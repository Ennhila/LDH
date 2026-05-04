import { apiFetch, getToken, setToken } from './api';
import type { AuthResponse, Role, UserMe } from '../types/api';

export async function login(email: string, password: string): Promise<AuthResponse> {
  const r = await apiFetch<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    skipAuth: true,
  });
  setToken(r.token);
  return r;
}

export async function register(payload: {
  email: string;
  password: string;
  fullName: string;
  postalCode: string;
}): Promise<AuthResponse> {
  const r = await apiFetch<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
    skipAuth: true,
  });
  setToken(r.token);
  return r;
}

export async function fetchMe(): Promise<UserMe> {
  return apiFetch<UserMe>('/api/auth/me');
}

export function logout() {
  setToken(null);
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export function homeForRole(role: Role): string {
  switch (role) {
    case 'ADMIN':
      return '/admin';
    case 'REPARTIDOR':
      return '/repartidor';
    default:
      return '/';
  }
}
