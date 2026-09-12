'use client';

import { BedDouble, Images, Palmtree, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { usePlans } from '@/hooks/use-billing';
import { ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { getRecaptchaToken } from '@/lib/recaptcha';
import { inputClass, labelClass } from '@/components/ui/form';
import { PlanList } from '@/components/billing/plan-list';

const FEATURES: { icon: React.ElementType; label: string }[] = [
  { icon: Images, label: 'Catálogo oficial de hoteles con galerías por acomodación' },
  { icon: BedDouble, label: 'Cotiza por acomodación — Doble, Triple, Suite, la que exista' },
  { icon: ShieldCheck, label: 'Tú administras tus propios clientes y cotizaciones' },
];

// On Vacation always registers as this business type — there is no dropdown here, unlike the
// generic /register. See AuthService.createBaseRoles on the backend: only an ON_VACATION agency's
// roles get catalog.view, which is what makes the rest of this flow useful at all.
const ON_VACATION_TYPE = 'ON_VACATION';

export default function RegisterOnVacationPage() {
  const { register, status } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);

  const [agencyName, setAgencyName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [stepOneError, setStepOneError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { data: allPlans, isLoading: plansLoading } = usePlans(ON_VACATION_TYPE);
  // On Vacation has one price, not a tier picker — show only the plan(s) actually meant for it.
  const plans = allPlans?.filter((plan) => plan.recommended) ?? [];
  const selectedPlanId = plans[0]?.id ?? null;
  const trialDays = plans[0]?.trialDays ?? 5;

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
      await register({ agencyName, type: ON_VACATION_TYPE, planId: selectedPlanId, name, email, password, recaptchaToken });
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
          style={{ background: 'linear-gradient(160deg, rgba(14,116,144,0.92), rgba(10,22,40,0.96))' }}
        >
          <div>
            <div className="mb-8 flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(254,178,59,0.3)' }}>
                <Palmtree className="h-5 w-5 text-amber" />
              </div>
              <span className="font-display text-xl font-extrabold text-white">On Vacation</span>
            </div>
            <h1 className="font-display text-2xl font-extrabold leading-tight text-white">
              Vende hoteles reales, sin armar tu propio catálogo.
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              Accede al catálogo oficial de hoteles y acomodaciones de On Vacation — con galerías de
              fotos por cada tipo de habitación — y cotiza directamente con tus clientes desde el
              primer día.
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
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: 'rgba(14,116,144,0.15)', border: '1px solid rgba(254,178,59,0.3)' }}>
              <Palmtree className="h-6 w-6 text-amber" />
            </div>
            <h1 className="font-display text-2xl font-extrabold text-ink">On Vacation</h1>
          </div>

          <div className="mb-6 flex items-center gap-2">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${step === 1 ? 'bg-amber text-[#0a1628]' : 'bg-teal/20 text-teal'}`}>1</span>
            <span className={`text-xs font-semibold ${step === 1 ? 'text-ink' : 'text-ink-soft'}`}>Tus datos</span>
            <span className="h-px flex-1" style={{ background: 'var(--border)' }} />
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${step === 2 ? 'bg-amber text-[#0a1628]' : 'bg-ink/10 text-ink-soft'}`}>2</span>
            <span className={`text-xs font-semibold ${step === 2 ? 'text-ink' : 'text-ink-soft'}`}>Confirmar</span>
          </div>

          {step === 1 ? (
            <>
              <div className="mb-6">
                <h2 className="font-display text-xl font-extrabold text-ink">Regístrate como asesor On Vacation</h2>
                <p className="mt-1 text-sm text-ink-soft">Crea tu cuenta — el catálogo oficial ya está listo para que empieces a cotizar.</p>
              </div>

              <form className="space-y-4" onSubmit={handleStepOneSubmit}>
                <div>
                  <label className={labelClass} htmlFor="agencyName">Nombre de tu agencia</label>
                  <input
                    className={inputClass}
                    id="agencyName" onChange={(e) => setAgencyName(e.target.value)}
                    placeholder="Ej. Viajes del Caribe" required value={agencyName}
                  />
                </div>

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
                <h2 className="font-display text-xl font-extrabold text-ink">Confirma tu cuenta</h2>
                <p className="mt-1 text-sm text-ink-soft">
                  {trialDays} días gratis, sin cobro durante la prueba. Cancela cuando quieras.
                </p>
              </div>

              {plansLoading ? (
                <p className="text-sm text-ink-soft">Cargando…</p>
              ) : plans.length ? (
                <PlanList plans={plans} selectedPlanId={selectedPlanId} />
              ) : (
                <p className="rounded-lg px-3 py-2 text-sm text-ink-soft" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  No hay un plan disponible para On Vacation en este momento. Contacta a soporte.
                </p>
              )}

              <p className="mt-4 text-xs text-ink-muted">
                Hoy no se realiza ningún cobro. Al finalizar los {trialDays} días de prueba podrás elegir un método de pago para continuar.
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
