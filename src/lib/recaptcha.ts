const SCRIPT_ID = 'grecaptcha-v3';
// Read at module top level (matching lib/api.ts's NEXT_PUBLIC_API_URL) — Next's build-time inlining
// of NEXT_PUBLIC_* vars doesn't reliably reach a process.env access nested inside a function body.
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

function loadScript(siteKey: string): Promise<void> {
  if (document.getElementById(SCRIPT_ID)) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar reCAPTCHA'));
    document.head.appendChild(script);
  });
}

/**
 * Invisible reCAPTCHA v3. If no site key is configured (local dev), resolves to an empty token —
 * the backend skips verification the same way when RECAPTCHA_SECRET_KEY is unset.
 */
export async function getRecaptchaToken(action: string): Promise<string> {
  if (!RECAPTCHA_SITE_KEY) return '';
  await loadScript(RECAPTCHA_SITE_KEY);
  return new Promise((resolve, reject) => {
    window.grecaptcha!.ready(() => {
      window.grecaptcha!.execute(RECAPTCHA_SITE_KEY, { action }).then(resolve).catch(reject);
    });
  });
}
