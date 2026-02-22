import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Production-grade security headers: CSP and HSTS.
 * Applied to all responses to protect user sessions and mitigate XSS/clickjacking.
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Only apply strict security headers in production
  if (process.env.NODE_ENV === "production") {
    // HSTS: force HTTPS for 2 years, include subdomains
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );

    // CSP: restrict script/style origins; allow your app, Next.js, and trusted CDNs
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires these in dev/build; tighten with nonces in future
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://api.dicebear.com https://images.unsplash.com https://cdn.rapidrole.gg https://*.cdninstagram.com",
      "connect-src 'self' https://*.mongodb.net wss:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");
    response.headers.set("Content-Security-Policy", csp);

    // Additional hardening
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files and Next.js internals
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:ico|png|jpg|jpeg|gif|webp|avif|svg)$).*)",
  ],
};
