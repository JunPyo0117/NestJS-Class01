import api from './client';
import type { AuthTokens, User } from '@/types';

/** Basic Auth: email:password 를 base64 인코딩 */
function basicToken(email: string, password: string): string {
  return btoa(`${email}:${password}`);
}

export async function register(email: string, password: string): Promise<AuthTokens> {
  const { data } = await api.post<AuthTokens>('/auth/register', undefined, {
    headers: { Authorization: `Basic ${basicToken(email, password)}` },
  });
  return data;
}

export async function login(email: string, password: string): Promise<AuthTokens> {
  const { data } = await api.post<AuthTokens>('/auth/login', undefined, {
    headers: { Authorization: `Basic ${basicToken(email, password)}` },
  });
  return data;
}

export async function logout(accessToken: string): Promise<void> {
  await api.post('/auth/token/block', { token: accessToken });
}

export async function getPrivate(): Promise<User> {
  const { data } = await api.get<User>('/auth/private');
  return data;
}
