'use client';

import { Compass } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

export default function LoginPage() {
  const { login, status } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') router.replace('/');
  }, [status, router]);

  if (status === 'authenticated') return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo iniciar sesión. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(17,67,63,0.35) 0%, #0d1117 70%)',
      }}
    >
      {/* Card */}
      <div
        className="w-full max-w-sm rounded-2xl p-8"
        style={{
          background: '#111827',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0 24px 48px -12px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)',
        }}
      >
        {/* Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div
            className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: 'rgba(17,67,63,0.8)', border: '1px solid rgba(254,178,59,0.3)' }}
          >
            <Compass className="h-6 w-6 text-amber" />
          </div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Brújula</h1>
          <p className="mt-1 text-sm text-ink-soft">Inicia sesión en tu cuenta de agencia.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="label-caps mb-1.5 block text-ink-soft" htmlFor="email">
              Correo electrónico
            </label>
            <input
              autoComplete="email"
              className="w-full rounded-lg px-3 py-2.5 text-sm text-ink outline-none transition"
              id="email"
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
              type="email"
              value={email}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#feb23b'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(254,178,59,0.12)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>
          <div>
            <label className="label-caps mb-1.5 block text-ink-soft" htmlFor="password">
              Contraseña
            </label>
            <input
              autoComplete="current-password"
              className="w-full rounded-lg px-3 py-2.5 text-sm text-ink outline-none transition"
              id="password"
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
              type="password"
              value={password}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#feb23b'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(254,178,59,0.12)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.boxShadow = 'none'; }}
            />
          </div>

          {error ? (
            <p
              className="rounded-lg px-3 py-2 text-sm"
              role="alert"
              style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              {error}
            </p>
          ) : null}

          <button className="button-primary mt-2 w-full" disabled={submitting} type="submit">
            {submitting ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-ink-muted">
          Brújula · Sistema de cotizaciones
        </p>
      </div>
    </div>
  );
}
