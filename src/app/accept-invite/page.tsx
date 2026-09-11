'use client';

import { Compass } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState, type FormEvent } from 'react';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { inputClass, labelClass } from '@/components/ui/form';

function AcceptInviteForm() {
  const { acceptInvite, status } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') router.replace('/');
  }, [status, router]);

  if (status === 'authenticated') return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!token) {
      setError('El enlace de invitación no es válido.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setSubmitting(true);
    try {
      await acceptInvite({ token, password });
      router.replace('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'El enlace de invitación venció o ya fue usado.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div
        className="w-full max-w-sm rounded-2xl bg-paper-card p-8 shadow-card"
        style={{ border: '1px solid var(--border)' }}
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div
            className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
            style={{ background: 'rgba(17,67,63,0.15)', border: '1px solid rgba(254,178,59,0.3)' }}
          >
            <Compass className="h-6 w-6 text-amber" />
          </div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Brújula</h1>
          <p className="mt-1 text-sm text-ink-soft">Crea tu contraseña para activar tu cuenta.</p>
        </div>

        {!token ? (
          <p className="rounded-lg px-3 py-2 text-sm" role="alert" style={{ background: 'rgba(239,68,68,0.12)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)' }}>
            Este enlace de invitación no es válido. Pide a tu administrador que te envíe uno nuevo.
          </p>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className={labelClass} htmlFor="password">Nueva Contraseña</label>
              <input
                autoComplete="new-password"
                className={inputClass}
                id="password"
                minLength={10}
                onChange={(e) => setPassword(e.target.value)}
                required
                type="password"
                value={password}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="confirmPassword">Confirmar Contraseña</label>
              <input
                autoComplete="new-password"
                className={inputClass}
                id="confirmPassword"
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                type="password"
                value={confirmPassword}
              />
            </div>
            <p className="text-xs text-ink-muted">Mínimo 10 caracteres, con mayúscula, minúscula y número.</p>

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
              {submitting ? 'Activando cuenta…' : 'Crear mi Contraseña'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-xs text-ink-muted">
          ¿Ya tienes contraseña? <Link className="font-semibold text-amber hover:underline" href="/login">Inicia sesión</Link>
        </p>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={null}>
      <AcceptInviteForm />
    </Suspense>
  );
}
