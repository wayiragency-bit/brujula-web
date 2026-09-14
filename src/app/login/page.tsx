'use client';

import { BarChart3, Compass, FileText, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { inputClass, labelClass } from '@/components/ui/form';

const FEATURES: { icon: React.ElementType; label: string }[] = [
  { icon: FileText, label: 'Cotizaciones con seguimiento en tiempo real' },
  { icon: Users, label: 'Clientes y ventas de tu equipo, siempre al día' },
  { icon: BarChart3, label: 'Dashboard de ventas y comisiones por agente' },
];

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
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-10">
      <div
        className="flex w-full max-w-4xl overflow-hidden rounded-2xl shadow-card"
        style={{ border: '1px solid var(--border)' }}
      >
        {/* Marketing panel */}
        <div
          className="hidden w-[42%] flex-col justify-between p-10 lg:flex"
          style={{ background: 'linear-gradient(160deg, rgba(17,67,63,0.92), rgba(10,22,40,0.96))' }}
        >
          <div>
            <div className="mb-8 flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(254,178,59,0.3)' }}>
                <Compass className="h-5 w-5 text-amber" />
              </div>
              <span className="font-display text-xl font-extrabold text-white">Brújula</span>
            </div>
            <h1 className="font-display text-2xl font-extrabold leading-tight text-white">
              Tu operación comercial, siempre a la mano.
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              Cotizaciones, clientes y ventas de tu equipo en un solo lugar — al día y desde donde estés.
            </p>
          </div>
          <ul className="space-y-3">
            {FEATURES.map(({ icon: Icon, label }) => (
              <li className="flex items-center gap-3 rounded-xl px-3 py-2.5" key={label} style={{ background: 'rgba(255,255,255,0.08)' }}>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: 'rgba(254,178,59,0.2)' }}>
                  <Icon className="h-3.5 w-3.5 text-amber" />
                </span>
                <span className="text-xs font-medium text-white/80">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Form panel */}
        <div className="flex w-full flex-col justify-center bg-paper-card p-8 sm:p-10 lg:w-[58%]">
          <div className="mb-8 flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl lg:hidden" style={{ background: 'rgba(17,67,63,0.15)', border: '1px solid rgba(254,178,59,0.3)' }}>
              <Compass className="h-6 w-6 text-amber" />
            </div>
            <h2 className="font-display text-2xl font-extrabold text-ink">Bienvenido de nuevo</h2>
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

          <p className="mt-6 text-center text-xs text-ink-muted lg:text-left">
            ¿No tienes cuenta? <Link className="font-semibold text-amber hover:underline" href="/register">Crea la tuya gratis</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
