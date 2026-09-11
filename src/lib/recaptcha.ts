const SCRIPT_ID = 'grecaptcha-v3';

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

let siteKeyPromise: Promise<string | null> | null = null;

/** Fetched at request time (not build-time inlined) — see src/app/api/recaptcha-key/route.ts. */
function fetchSiteKey(): Promise<string | null> {
  siteKeyPromise ??= fetch('/api/recaptcha-key')
    .then((res) => res.json())
    .then((data: { siteKey: string | null }) => data.siteKey)
    .catch(() => null);
  return siteKeyPromise;
}

/**
 * Invisible reCAPTCHA v3. If no site key is configured (local dev), resolves to an empty token —
 * the backend skips verification the same way when RECAPTCHA_SECRET_KEY is unset.
 */
export async function getRecaptchaToken(action: string): Promise<string> {
  const siteKey = await fetchSiteKey();
  if (!siteKey) return '';
  await loadScript(siteKey);
  return new Promise((resolve, reject) => {
    window.grecaptcha!.ready(() => {
      window.grecaptcha!.execute(siteKey, { action }).then(resolve).catch(reject);
    });
  });
}
