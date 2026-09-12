'use client';

import { AppShell } from '@/components/app-shell';
import { useManagerAdvisors } from '@/hooks/use-manager';
import { formatMoneyFull } from '@/lib/format';
import { SUBSCRIPTION_CHIP, SUBSCRIPTION_LABEL } from '@/lib/manager-status-colors';

export default function ManagerAdvisorsPage() {
  const { data: advisors } = useManagerAdvisors();

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-content space-y-6 px-5 pb-28 pt-8 sm:px-7 lg:px-10 lg:pb-10">
        <header>
          <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">Asesores</h1>
          <p className="mt-2 text-sm text-ink-soft">Todas las agencias On Vacation registradas.</p>
        </header>

        <article className="overflow-hidden rounded-2xl" style={{ background: 'var(--paper-card)', border: '1px solid var(--border)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-faint)' }}>
                  <th className="label-caps px-6 py-3 text-ink-muted">Agencia</th>
                  <th className="label-caps px-6 py-3 text-ink-muted">Propietario</th>
                  <th className="label-caps px-6 py-3 text-ink-muted">Plan</th>
                  <th className="label-caps px-6 py-3 text-ink-muted">Estatus</th>
                  <th className="label-caps px-6 py-3 text-ink-muted">Precio acordado</th>
                  <th className="label-caps px-6 py-3 text-ink-muted">Registrado</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
                {(advisors?.length ?? 0) === 0 ? (
                  <tr><td className="px-6 py-10 text-center text-ink-soft" colSpan={6}>Aún no hay asesores registrados.</td></tr>
                ) : (
                  advisors!.map((advisor) => (
                    <tr key={advisor.id}>
                      <td className="px-6 py-4">
                        <p className="font-medium text-ink">{advisor.name}</p>
                        <p className="text-xs text-ink-soft">{advisor.active ? 'Activa' : 'Inactiva'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-ink">{advisor.owner?.name ?? '—'}</p>
                        <p className="text-xs text-ink-soft">{advisor.owner?.email ?? '—'}</p>
                      </td>
                      <td className="px-6 py-4 text-ink">{advisor.subscription?.planCode ?? '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`${SUBSCRIPTION_CHIP[advisor.subscription?.status ?? 'NONE']} rounded-full px-2.5 py-1 text-xs font-semibold`}>
                          {SUBSCRIPTION_LABEL[advisor.subscription?.status ?? 'NONE']}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-ink">
                        {advisor.subscription?.agreedPrice
                          ? formatMoneyFull(Number(advisor.subscription.agreedPrice), advisor.subscription.currency ?? 'USD')
                          : '—'}
                      </td>
                      <td className="px-6 py-4 text-ink-soft">{new Date(advisor.createdAt).toLocaleDateString('es-CO')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </AppShell>
  );
}
