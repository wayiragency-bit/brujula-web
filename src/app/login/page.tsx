'use client';

import { Compass } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { inputClass, labelClass } from '@/components/ui/form';

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
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      {/* Card */}
      <div
        className="w-full max-w-sm rounded-2xl bg-paper-card p-8 shadow-card"
        style={{ border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div
            className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: 'rgba(17,67,63,0.15)', border: '1px solid rgba(254,178,59,0.3)' }}
          >
            <Compass className="h-6 w-6 text-amber" />
          </div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Brújula</h1>
          <p className="mt-1 text-sm text-ink-soft">Inicia sesión en tu cuenta de agencia.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className={labelClass} htmlFor="email">Correo electrónico</label>
            <input
              autoComplete="email"
              className={inputClass}
              id="email"
              onChange={(e) => setEmail(e.target.value)}
              required
              type="email"
              value={email}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="password">Contraseña</label>
            <input
              autoComplete="current-password"
              className={inputClass}
              id="password"
              onChange={(e) => setPassword(e.target.value)}
              required
              type="password"
              value={password}
            />
          </div>

          {error ? (
            <p
              className="rounded-lg px-3 py-2 text-sm"
              role="alert"
              style={{ background: 'rgba(239,68,68,0.12)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              {error}
            </p>
          ) : null}

          <button className="button-primary mt-2 w-full" disabled={submitting} type="submit">
            {submitting ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-ink-muted">
          ¿No tienes cuenta? <Link className="font-semibold text-amber hover:underline" href="/register">Crea la tuya gratis</Link>
        </p>
      </div>
    </div>
  );
}
