import { NextResponse } from 'next/server';
import { validateCredentials, createToken, setAuthCookie } from '@/lib/auth';
import { hasAdminAuthConfig } from '@/lib/auth-core';

const WINDOW_MS = 60 * 1000;
const MAX_ATTEMPTS = 8;
const attempts = new Map<string, { count: number; resetAt: number }>();

function getClientKey(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'local';
}

function hitRateLimit(key: string): boolean {
  const now = Date.now();
  const current = attempts.get(key);

  if (!current || current.resetAt <= now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }

  current.count += 1;
  return current.count > MAX_ATTEMPTS;
}

export async function POST(request: Request) {
  try {
    if (!hasAdminAuthConfig()) {
      return NextResponse.json(
        { error: 'Acesso administrativo não configurado' },
        { status: 500 }
      );
    }

    const clientKey = getClientKey(request);
    if (hitRateLimit(clientKey)) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Aguarde um pouco e tente novamente.' },
        { status: 429 }
      );
    }

    const { email, password } = await request.json();

    if (!validateCredentials(email, password)) {
      return NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      );
    }

    const token = await createToken();
    await setAuthCookie(token);
    attempts.delete(clientKey);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Erro ao fazer login' },
      { status: 500 }
    );
  }
}
