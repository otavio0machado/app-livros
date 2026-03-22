import { NextResponse } from 'next/server';
import { validateCredentials, createToken, setAuthCookie } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!validateCredentials(email, password)) {
      return NextResponse.json(
        { error: 'Email ou senha incorretos' },
        { status: 401 }
      );
    }

    const token = await createToken();
    await setAuthCookie(token);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Erro ao fazer login' },
      { status: 500 }
    );
  }
}
