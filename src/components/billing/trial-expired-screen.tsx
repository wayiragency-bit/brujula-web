'use client';

import { AlertTriangle, Compass, LogOut } from 'lucide-react';
import { usePlans, useSubscription } from '@/hooks/use-billing';
import { useAuth } from '@/lib/auth-context';
import { PlanList } from '@/components/billing/plan-list';

/**
 * Full-screen block shown once the trial/subscription has expired. Reuses the same PlanList and
 * subscription data as Settings → Historial de Pago instead of duplicating that UI — there's no
 * checkout yet (Bold isn't integrated), so this is informational plus logout.
 */
export function TrialExpiredScreen() {
  const { user, logout } = useAuth();
  const { data: subscription } = useSubscription();
  const { data: plans, isLoading: plansLoading } = usePlans();
  const cancelled = subscription?.status === 'CANCELLED';

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-10">
      <div
        className="w-full max-w-lg rounded-2xl bg-paper-card p-8 shadow-card"
        style={{ border: '1px solid var(--border)' }}
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <AlertTriangle className="h-6 w-6" style={{ color: '#b45309' }} />
          </div>
          <h1 className="font-display text-xl font-extrabold text-ink">
            {cancelled ? 'Tu suscripción está cancelada' : 'Tu prueba gratis terminó'}
          </h1>
          <p className="mt-1 text-sm text-ink-soft">
            {user?.agency?.name ?? 'Tu empresa'} no tiene acceso operativo hasta activar un plan de pago.
          </p>
        </div>

        {subscription?.plan ? (
          <div
            className="mb-6 flex items-center justify-between gap-3 rounded-xl p-4"
            style={{ background: 'rgba(254,178,59,0.06)', border: '1px solid rgba(254,178,59,0.2)' }}
          >
            <div className="flex items-center gap-3">
              <Compass className="h-5 w-5 text-amber" />
              <div>
                <p className="text-sm font-bold text-ink">Plan {subscription.plan.name}</p>
                <p className="text-xs text-ink-soft">
                  {subscription.agreedPrice ? `${subscription.currency} $${subscription.agreedPrice}/mes` : ''}
                </p>
              </div>
            </div>
            <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ background: 'rgba(248,113,113,0.12)', color: '#dc2626' }}>
              {cancelled ? 'Cancelado' : 'Vencido'}
            </span>
          </div>
        ) : null}

        <p className="mb-3 text-xs font-semibold text-ink-soft">Planes disponibles</p>
        {plansLoading || !plans ? (
          <p className="text-sm text-ink-soft">Cargando planes…</p>
        ) : (
          <PlanList plans={plans} selectedPlanId={subscription?.plan?.id ?? null} />
        )}

        <p className="mt-4 text-xs text-ink-muted">
          Los pagos en línea estarán disponibles próximamente. Mientras tanto, contacta a soporte para reactivar tu cuenta.
        </p>

        <button
          className="button-secondary mt-6 flex w-full items-center justify-center gap-2"
          onClick={() => logout()}
          type="button"
        >
          <LogOut className="h-4 w-4" /> Cerrar sesión
        </button>
      </div>
    </div>
  );
}
