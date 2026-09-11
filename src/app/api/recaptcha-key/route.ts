import { NextResponse } from 'next/server';

/**
 * Serves the reCAPTCHA site key to the browser at request time.
 *
 * The bracket lookup is deliberate: Next inlines `process.env.NEXT_PUBLIC_*` at build time
 * everywhere — server code included — and that substitution was landing as `undefined` in this
 * project's production builds. A dynamic lookup is explicitly *not* inlined, so this reads the
 * real runtime environment instead. The site key is public by design.
 */
export async function GET() {
  const siteKey = process.env['NEXT_PUBLIC_RECAPTCHA_SITE_KEY'] ?? null;
  return NextResponse.json({ siteKey });
}
