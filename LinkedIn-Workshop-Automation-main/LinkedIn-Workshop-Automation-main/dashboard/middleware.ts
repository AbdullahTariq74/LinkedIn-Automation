import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASSWORD;

  if (!user || !pass) {
    // Fail closed: if credentials aren't configured, block access rather
    // than silently leaving the dashboard open.
    return new NextResponse('Dashboard auth is not configured.', { status: 503 });
  }

  const authHeader = request.headers.get('authorization');

  if (authHeader?.startsWith('Basic ')) {
    const decoded = Buffer.from(authHeader.slice(6), 'base64').toString('utf-8');
    const sepIndex = decoded.indexOf(':');
    const suppliedUser = decoded.slice(0, sepIndex);
    const suppliedPass = decoded.slice(sepIndex + 1);

    if (suppliedUser === user && suppliedPass === pass) {
      return NextResponse.next();
    }
  }

  return new NextResponse('Authentication required.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Michael Ohlmer Dashboard"' },
  });
}

export const config = {
  matcher: [
    // Protect every route except Next.js internals and the favicon.
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
