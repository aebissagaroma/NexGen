// Cross-origin write protection for the API (defense in depth).
//
// Sessions ride on cookies, so a malicious site could try to fire
// state-changing requests at us with a signed-in visitor's cookies attached.
// SameSite (lax/strict) already blocks most of that in modern browsers; this
// check closes the rest: a browser always attaches an Origin header to
// cross-site fetch/XHR/form POSTs, so any write whose Origin doesn't match the
// site itself is rejected outright.
//
// Requests WITHOUT an Origin header pass — that's the mobile app (native fetch
// sends none), curl, and server-to-server calls. They don't carry ambient
// browser credentials, which is what this guard is about.
import { NextResponse, type NextRequest } from 'next/server';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function middleware(req: NextRequest) {
  if (!WRITE_METHODS.has(req.method)) return NextResponse.next();

  const origin = req.headers.get('origin');
  if (!origin) return NextResponse.next();

  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return block();
  }

  // Compare against the Host the request was addressed to (covers the Vercel
  // deployment URL and any custom domain without hardcoding either).
  if (originHost !== req.nextUrl.host) return block();

  return NextResponse.next();
}

function block(): NextResponse {
  return NextResponse.json({ error: 'Cross-origin request rejected.' }, { status: 403 });
}

export const config = { matcher: '/api/:path*' };
