/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Turbopack's automatic NEXT_PUBLIC_* inlining wasn't reaching this one reliably in production
  // builds — the `env` config is the older but always-guaranteed-to-inline mechanism.
  env: {
    NEXT_PUBLIC_RECAPTCHA_SITE_KEY: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
  },
};

export default nextConfig;
