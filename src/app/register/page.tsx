'use client';

import { BarChart3, Compass, FileText, ShieldCheck, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { AGENCY_TYPE_LABELS } from '@/lib/types';
import type { AgencyType } from '@/lib/types';

const FEATURES: { icon: React.ElementType; label: string }[] = [
  { icon: FileText, label: 'Cotizaciones con seguimiento en tiempo real' },
  { icon: Users, label: 'Clientes privados por asesor, compartibles cuando lo necesites' },
  { icon: ShieldCheck, label: 'Roles y permisos para Administrador, Supervisor y Agente' },
  { icon: BarChart3, label: 'Dashboard de ventas y comisiones por equipo' },
];

const fieldStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.12)',
};

function focusField(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = '#feb23b';
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(254,178,59,0.12)';
}
function blurField(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) {
  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
  e.currentTarget.style.boxShadow = 'none';
}

export default function RegisterPage() {
  const { register, status } = useAuth();
  const router = useRouter();
  const [agencyName, setAgencyName] = useState('');
  const [type, setType] = useState<AgencyType>('AGENCIA_VIAJES');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
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
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setSubmitting(true);
    try {
      await register({ agencyName, type, name, email, password });
      router.replace('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear la cuenta. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-10"
      style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(17,67,63,0.35) 0%, #0d1117 70%)',
      }}
    >
      <div className="flex w-full max-w-4xl overflow-hidden rounded-2xl" style={{ border: '1px solid rgba(255,255,255,0.10)', boxShadow: '0 24px 48px -12px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)' }}>
        {/* Marketing panel */}
        <div className="hidden w-[42%] flex-col justify-between p-10 lg:flex" style={{ background: '#0a1628' }}>
          <div>
            <div className="mb-8 flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'rgba(17,67,63,0.8)', border: '1px solid rgba(254,178,59,0.3)' }}>
                <Compass className="h-5 w-5 text-amber" />
              </div>
              <span className="font-display text-xl font-extrabold text-ink">Brújula</span>
            </div>
            <h1 className="font-display text-2xl font-extrabold leading-tight text-ink">
              Lleva tu agencia al siguiente nivel.
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              Cotizador y operación comercial para agencias, operadores y hoteles — con roles, permisos
              y visibilidad de ventas por asesor desde el primer día.
            </p>
          </div>
          <ul className="space-y-3">
            {FEATURES.map(({ icon: Icon, label }) => (
              <li className="flex items-center gap-3 rounded-xl px-3 py-2.5" key={label} style={{ background: 'rgba(255,255,255,0.04)' }}>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: 'rgba(254,178,59,0.15)' }}>
                  <Icon className="h-3.5 w-3.5 text-amber" />
                </span>
                <span className="text-xs font-medium text-ink-soft">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Form panel */}
        <div className="w-full p-8 sm:p-10 lg:w-[58%]" style={{ background: '#111827' }}>
          <div className="mb-6 flex flex-col items-center text-center lg:hidden">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: 'rgba(17,67,63,0.8)', border: '1px solid rgba(254,178,59,0.3)' }}>
              <Compass className="h-6 w-6 text-amber" />
            </div>
            <h1 className="font-display text-2xl font-extrabold text-ink">Brújula</h1>
          </div>
          <div className="mb-6">
            <h2 className="font-display text-xl font-extrabold text-ink">Empieza tu prueba gratis</h2>
            <p className="mt-1 text-sm text-ink-soft">Registro rápido para tu agencia — sin tarjeta de crédito.</p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="label-caps mb-1.5 block text-ink-soft" htmlFor="agencyName">Nombre de la Empresa</label>
              <input
                className="w-full rounded-lg px-3 py-2.5 text-sm text-ink outline-none transition"
                id="agencyName" onBlur={blurField} onChange={(e) => setAgencyName(e.target.value)} onFocus={focusField}
                placeholder="Ej. Viajes del Caribe" required style={fieldStyle} value={agencyName}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label-caps mb-1.5 block text-ink-soft" htmlFor="name">Tu Nombre</label>
                <input
                  autoComplete="name"
                  className="w-full rounded-lg px-3 py-2.5 text-sm text-ink outline-none transition"
                  id="name" onBlur={blurField} onChange={(e) => setName(e.target.value)} onFocus={focusField}
                  placeholder="Juan Pérez" required style={fieldStyle} value={name}
                />
              </div>
              <div>
                <label className="label-caps mb-1.5 block text-ink-soft" htmlFor="type">Tipo de Empresa</label>
                <select
                  className="w-full rounded-lg px-3 py-2.5 text-sm text-ink outline-none transition"
                  id="type" onBlur={blurField} onChange={(e) => setType(e.target.value as AgencyType)} onFocus={focusField}
                  style={fieldStyle} value={type}
                >
                  {Object.entries(AGENCY_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} style={{ background: '#111827' }} value={value}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label-caps mb-1.5 block text-ink-soft" htmlFor="email">Correo Electrónico</label>
              <input
                autoComplete="email"
                className="w-full rounded-lg px-3 py-2.5 text-sm text-ink outline-none transition"
                id="email" onBlur={blurField} onChange={(e) => setEmail(e.target.value)} onFocus={focusField}
                placeholder="tucorreo@ejemplo.com" required style={fieldStyle} type="email" value={email}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label-caps mb-1.5 block text-ink-soft" htmlFor="password">Contraseña</label>
                <input
                  autoComplete="new-password"
                  className="w-full rounded-lg px-3 py-2.5 text-sm text-ink outline-none transition"
                  id="password" minLength={10} onBlur={blurField} onChange={(e) => setPassword(e.target.value)} onFocus={focusField}
                  required style={fieldStyle} type="password" value={password}
                />
              </div>
              <div>
                <label className="label-caps mb-1.5 block text-ink-soft" htmlFor="confirmPassword">Confirmar Contraseña</label>
                <input
                  autoComplete="new-password"
                  className="w-full rounded-lg px-3 py-2.5 text-sm text-ink outline-none transition"
                  id="confirmPassword" onBlur={blurField} onChange={(e) => setConfirmPassword(e.target.value)} onFocus={focusField}
                  required style={fieldStyle} type="password" value={confirmPassword}
                />
              </div>
            </div>
            <p className="text-xs text-ink-muted">Mínimo 10 caracteres, con mayúscula, minúscula y número.</p>

            {error ? (
              <p className="rounded-lg px-3 py-2 text-sm" role="alert" style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
                {error}
              </p>
            ) : null}

            <button className="button-primary mt-2 w-full" disabled={submitting} type="submit">
              {submitting ? 'Creando cuenta…' : 'Crear mi Cuenta Gratis'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-ink-muted">
            ¿Ya tienes cuenta? <Link className="font-semibold text-amber hover:underline" href="/login">Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
