import { api } from './api';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

/** RF1: POST /auth/register */
export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', payload);
  return data;
}

/** RF2: POST /auth/login */
export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', payload);
  return data;
}

export function saveSession(res: AuthResponse): void {
  localStorage.setItem('token', res.accessToken);
  localStorage.setItem('user', JSON.stringify(res.user));
}

export function clearSession(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem('user');
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}
