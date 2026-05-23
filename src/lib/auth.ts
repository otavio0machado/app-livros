import { cookies } from 'next/headers';
import {
  AUTH_COOKIE_NAME,
  createAdminToken,
  validateAdminCredentials,
  verifyAdminToken,
} from './auth-core';

export async function createToken(): Promise<string> {
  return createAdminToken();
}

export async function verifyToken(token: string): Promise<boolean> {
  return verifyAdminToken(token);
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export async function removeAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

export async function getAuthCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value;
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthCookie();
  if (!token) return false;
  return verifyToken(token);
}

export function validateCredentials(email: string, password: string): boolean {
  return validateAdminCredentials(email, password);
}
