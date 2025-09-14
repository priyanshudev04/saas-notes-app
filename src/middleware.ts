// File: src/middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'your-super-secret-key');

export async function middleware(req: NextRequest) {
  const token = req.headers.get('authorization')?.split(' ')[1];

  if (!token) {
    return new NextResponse(
      JSON.stringify({ message: 'Authentication token is required.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    // Attach the decoded user payload to the request headers
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-payload', JSON.stringify(payload));

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

  } catch (error) {
    return new NextResponse(
      JSON.stringify({ message: 'Invalid or expired token.' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/api/notes/:path*', '/api/tenants/:path*'],
};