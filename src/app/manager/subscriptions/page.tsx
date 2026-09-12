'use client';

import { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { useManagerSubscriptions } from '@/hooks/use-manager';
import { formatMoneyFull } from '@/lib/format';
import { SUBSCRIPTION_CHIP, SUBSCRIPTION_LABEL } from '@/lib/manager-status-colors';

const STATUS_OPTIONS = ['', 'TRIAL', 'ACTIVE', 'EXPIRED', 'PAST_DUE', 'CANCELLED'];

export default function ManagerSubscriptionsPage() {
  const [status, setStatus] = useState('');
  const { data: subscriptions } = useManagerSubscriptions(status || undefined);

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-content space-y-6 px-5 pb-28 pt-8 sm:px-7 lg:px-10 lg:pb-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">Suscripciones</h1>
            <p className="mt-2 text-sm text-ink-soft">Estado de facturación de cada asesor.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((option) => (
              <button
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  status === option ? 'bg-amber text-[var(--sidebar-bg)]' : 'text-ink-soft hover:bg-white/8'
                }`}
                key={option || 'all'}
                onClick={() => setStatus(option)}
                style={status === option ? {} : { border: '1px solid var(--border)' }}
                type="button"
              >
                {option ? (SUBSCRIPTION_LABEL[option] ?? option) : 'Todas'}
              </button>
            ))}
          </div>
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
                  <th className="label-caps px-6 py-3 text-ink-muted">Fin de prueba</th>
                  <th className="label-caps px-6 py-3 text-ink-muted">Precio acordado</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
                {(subscriptions?.length ?? 0) === 0 ? (
                  <tr><td className="px-6 py-10 text-center text-ink-soft" colSpan={6}>No hay suscripciones que coincidan con el filtro.</td></tr>
                ) : (
                  subscriptions!.map((row) => (
                    <tr key={row.agencyId}>
                      <td className="px-6 py-4 font-medium text-ink">{row.agencyName}</td>
                      <td className="px-6 py-4">
                        <p className="text-ink">{row.owner?.name ?? '—'}</p>
                        <p className="text-xs text-ink-soft">{row.owner?.email ?? '—'}</p>
                      </td>
                      <td className="px-6 py-4 text-ink">{row.subscription?.planCode ?? '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`${SUBSCRIPTION_CHIP[row.subscription?.status ?? 'NONE']} rounded-full px-2.5 py-1 text-xs font-semibold`}>
                          {SUBSCRIPTION_LABEL[row.subscription?.status ?? 'NONE']}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-ink-soft">
                        {row.subscription?.trialEnd ? new Date(row.subscription.trialEnd).toLocaleDateString('es-CO') : '—'}
                      </td>
                      <td className="px-6 py-4 font-mono text-ink">
                        {row.subscription?.agreedPrice
                          ? formatMoneyFull(Number(row.subscription.agreedPrice), row.subscription.currency ?? 'USD')
                          : '—'}
                      </td>
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
