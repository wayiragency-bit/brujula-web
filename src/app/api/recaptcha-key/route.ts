import { NextResponse } from 'next/server';

/**
 * Serves the reCAPTCHA site key at request time instead of relying on build-time inlining of
 * NEXT_PUBLIC_RECAPTCHA_SITE_KEY — that inlining wasn't reliably reaching this one variable in
 * production Turbopack builds. A route handler reads process.env at runtime, sidestepping it
 * entirely (the site key isn't sensitive; it's meant to be public).
 */
export async function GET() {
  return NextResponse.json({ siteKey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? null });
}
