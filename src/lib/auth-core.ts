import { SignJWT, jwtVerify } from 'jose';

export const AUTH_COOKIE_NAME = 'auth-token';

class MissingEnvError extends Error {
  constructor(name: string) {
    super(`${name} não configurado`);
    this.name = 'MissingEnvError';
  }
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value || !value.trim()) throw new MissingEnvError(name);
  return value;
}

function getJwtSecret(): Uint8Array {
  return new TextEncoder().encode(requiredEnv('JWT_SECRET'));
}

export function hasAdminAuthConfig(): boolean {
  return Boolean(
    process.env.JWT_SECRET?.trim() &&
    process.env.ADMIN_EMAIL?.trim() &&
    process.env.ADMIN_PASSWORD
  );
}

export function validateAdminCredentials(email: unknown, password: unknown): boolean {
  if (typeof email !== 'string' || typeof password !== 'string') return false;
  if (!hasAdminAuthConfig()) return false;

  return (
    email.trim().toLowerCase() === process.env.ADMIN_EMAIL!.trim().toLowerCase() &&
    password === process.env.ADMIN_PASSWORD
  );
}

export async function createAdminToken(): Promise<string> {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .setIssuedAt()
    .sign(getJwtSecret());
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, getJwtSecret());
    return true;
  } catch {
    return false;
  }
}
