'use client';

import { BarChart3, Compass, FileText, ShieldCheck, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { usePlans } from '@/hooks/use-billing';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { getRecaptchaToken } from '@/lib/recaptcha';
import { AGENCY_TYPE_LABELS } from '@/lib/types';
import type { AgencyType } from '@/lib/types';
import { inputClass, labelClass, selectClass } from '@/components/ui/form';
import { PlanList } from '@/components/billing/plan-list';

const FEATURES: { icon: React.ElementType; label: string }[] = [
  { icon: FileText, label: 'Cotizaciones con seguimiento en tiempo real' },
  { icon: Users, label: 'Clientes privados por asesor, compartibles cuando lo necesites' },
  { icon: ShieldCheck, label: 'Roles y permisos para Administrador, Supervisor y Agente' },
  { icon: BarChart3, label: 'Dashboard de ventas y comisiones por equipo' },
];

const TRIAL_DAYS = 7;

export default function RegisterPage() {
  const { register, status } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);

  const [agencyName, setAgencyName] = useState('');
  const [type, setType] = useState<AgencyType>('AGENCIA_VIAJES');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [manualPlanId, setManualPlanId] = useState<string | null>(null);

  const [stepOneError, setStepOneError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: plans, isLoading: plansLoading } = usePlans(type);

  // Default to the plan recommended for the chosen business type, unless the user picked one manually.
  const selectedPlanId = manualPlanId && plans?.some((p) => p.id === manualPlanId)
    ? manualPlanId
    : (plans?.find((p) => p.recommended)?.id ?? plans?.[0]?.id ?? null);

  useEffect(() => {
    if (status === 'authenticated') router.replace('/');
  }, [status, router]);

  if (status === 'authenticated') return null;

  function handleStepOneSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStepOneError(null);
    if (password !== confirmPassword) {
      setStepOneError('Las contraseñas no coinciden.');
      return;
    }
    setStep(2);
  }

  async function handleCreateAccount() {
    if (!selectedPlanId) return;
    setError(null);
    setSubmitting(true);
    try {
      const recaptchaToken = await getRecaptchaToken('register');
      await register({ agencyName, type, planId: selectedPlanId, name, email, password, recaptchaToken });
      router.replace('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear la cuenta. Intenta de nuevo.');
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
              Lleva tu agencia al siguiente nivel.
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              Cotizador y operación comercial para agencias, operadores y hoteles — con roles, permisos
              y visibilidad de ventas por asesor desde el primer día.
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
        <div className="w-full bg-paper-card p-8 sm:p-10 lg:w-[58%]">
          <div className="mb-6 flex flex-col items-center text-center lg:hidden">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: 'rgba(17,67,63,0.15)', border: '1px solid rgba(254,178,59,0.3)' }}>
              <Compass className="h-6 w-6 text-amber" />
            </div>
            <h1 className="font-display text-2xl font-extrabold text-ink">Brújula</h1>
          </div>

          <div className="mb-6 flex items-center gap-2">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${step === 1 ? 'bg-amber text-[#0a1628]' : 'bg-teal/20 text-teal'}`}>1</span>
            <span className={`text-xs font-semibold ${step === 1 ? 'text-ink' : 'text-ink-soft'}`}>Tu empresa</span>
            <span className="h-px flex-1" style={{ background: 'var(--border)' }} />
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${step === 2 ? 'bg-amber text-[#0a1628]' : 'bg-ink/10 text-ink-soft'}`}>2</span>
            <span className={`text-xs font-semibold ${step === 2 ? 'text-ink' : 'text-ink-soft'}`}>Tu plan</span>
          </div>

          {step === 1 ? (
            <>
              <div className="mb-6">
                <h2 className="font-display text-xl font-extrabold text-ink">Empieza tu prueba gratis</h2>
                <p className="mt-1 text-sm text-ink-soft">Registro rápido para tu agencia — sin tarjeta de crédito.</p>
              </div>

              <form className="space-y-4" onSubmit={handleStepOneSubmit}>
                <div>
                  <label className={labelClass} htmlFor="agencyName">Nombre de la Empresa</label>
                  <input
                    className={inputClass}
                    id="agencyName" onChange={(e) => setAgencyName(e.target.value)}
                    placeholder="Ej. Viajes del Caribe" required value={agencyName}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor="name">Tu Nombre</label>
                    <input
                      autoComplete="name"
                      className={inputClass}
                      id="name" onChange={(e) => setName(e.target.value)}
                      placeholder="Juan Pérez" required value={name}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="type">Tipo de Empresa</label>
                    <select
                      className={selectClass}
                      id="type" onChange={(e) => setType(e.target.value as AgencyType)} value={type}
                    >
                      {Object.entries(AGENCY_TYPE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className={labelClass} htmlFor="email">Correo Electrónico</label>
                  <input
                    autoComplete="email"
                    className={inputClass}
                    id="email" onChange={(e) => setEmail(e.target.value)}
                    placeholder="tucorreo@ejemplo.com" required type="email" value={email}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor="password">Contraseña</label>
                    <input
                      autoComplete="new-password"
                      className={inputClass}
                      id="password" minLength={10} onChange={(e) => setPassword(e.target.value)}
                      required type="password" value={password}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="confirmPassword">Confirmar Contraseña</label>
                    <input
                      autoComplete="new-password"
                      className={inputClass}
                      id="confirmPassword" onChange={(e) => setConfirmPassword(e.target.value)}
                      required type="password" value={confirmPassword}
                    />
                  </div>
                </div>
                <p className="text-xs text-ink-muted">Mínimo 10 caracteres, con mayúscula, minúscula y número.</p>

                {stepOneError ? (
                  <p className="rounded-lg px-3 py-2 text-sm" role="alert" style={{ background: 'rgba(239,68,68,0.12)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)' }}>
                    {stepOneError}
                  </p>
                ) : null}

                <button className="button-primary mt-2 w-full" type="submit">Continuar</button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="font-display text-xl font-extrabold text-ink">Elige tu plan</h2>
                <p className="mt-1 text-sm text-ink-soft">
                  {TRIAL_DAYS} días gratis, sin cobro durante la prueba. Cancela cuando quieras.
                </p>
              </div>

              {plansLoading || !plans ? (
                <p className="text-sm text-ink-soft">Cargando planes…</p>
              ) : (
                <PlanList onSelect={setManualPlanId} plans={plans} selectedPlanId={selectedPlanId} />
              )}

              <p className="mt-4 text-xs text-ink-muted">
                Hoy no se realiza ningún cobro. Al finalizar los {TRIAL_DAYS} días de prueba podrás elegir un método de pago para continuar.
              </p>

              {error ? (
                <p className="mt-4 rounded-lg px-3 py-2 text-sm" role="alert" style={{ background: 'rgba(239,68,68,0.12)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)' }}>
                  {error}
                </p>
              ) : null}

              <div className="mt-6 flex gap-3">
                <button className="button-secondary" disabled={submitting} onClick={() => setStep(1)} type="button">
                  Atrás
                </button>
                <button
                  className="button-primary flex-1"
                  disabled={submitting || !selectedPlanId}
                  onClick={handleCreateAccount}
                  type="button"
                >
                  {submitting ? 'Creando cuenta…' : 'Crear mi Cuenta Gratis'}
                </button>
              </div>
            </>
          )}

          <p className="mt-6 text-center text-xs text-ink-muted">
            ¿Ya tienes cuenta? <Link className="font-semibold text-amber hover:underline" href="/login">Inicia sesión</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
