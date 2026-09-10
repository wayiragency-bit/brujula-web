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
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm rounded-2xl border border-ink/10 bg-paper-card p-8 shadow-floating">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-teal text-[#feb23b]">
            <Compass className="h-6 w-6" />
          </div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Brújula</h1>
          <p className="mt-1 text-sm text-ink-soft">Inicia sesión en tu cuenta de agencia.</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="label-caps mb-1.5 block text-ink-soft" htmlFor="email">Correo electrónico</label>
            <input
              autoComplete="email"
              className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
              id="email"
              onChange={(e) => setEmail(e.target.value)}
              required
              type="email"
              value={email}
            />
          </div>
          <div>
            <label className="label-caps mb-1.5 block text-ink-soft" htmlFor="password">Contraseña</label>
            <input
              autoComplete="current-password"
              className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
              id="password"
              onChange={(e) => setPassword(e.target.value)}
              required
              type="password"
              value={password}
            />
          </div>

          {error ? <p className="text-sm text-red-600" role="alert">{error}</p> : null}

          <button className="button-primary w-full" disabled={submitting} type="submit">
            {submitting ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
