'use client';

import { FileText, TrendingUp, UsersRound } from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { useManagerAnalyticsGeneral, useManagerDashboard } from '@/hooks/use-manager';
import { useAuth } from '@/lib/auth-context';
import { formatMoneyFull } from '@/lib/format';
import { SUBSCRIPTION_CHIP, SUBSCRIPTION_LABEL } from '@/lib/manager-status-colors';

export default function ManagerDashboardPage() {
  const { user } = useAuth();
  const { data: dashboard } = useManagerDashboard();
  const { data: general } = useManagerAnalyticsGeneral();

  const byStatus: Record<string, number> = dashboard?.byStatus ?? {};

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-content space-y-9 px-5 pb-28 pt-8 sm:px-7 lg:px-10 lg:pb-10">

        <header>
          <h1 className="font-display text-[2rem] font-extrabold leading-tight text-ink sm:text-4xl">
            Hola, {user?.name.split(' ')[0] ?? ''}
          </h1>
          <p className="mt-2 text-sm text-ink-soft">Visión global de On Vacation · solo lectura</p>
        </header>

        <section className="grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-4">
          <article className="glass-card rounded-2xl p-6">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: '#06b6d4', boxShadow: '0 4px 12px rgba(6,182,212,0.4)' }}>
              <UsersRound className="h-6 w-6 text-white" />
            </div>
            <p className="label-caps text-[11px] text-ink-soft">Asesores</p>
            <strong className="font-mono text-3xl font-bold text-ink">{dashboard?.totalAdvisors ?? '—'}</strong>
          </article>
          <article className="glass-card rounded-2xl p-6">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: '#f59e0b', boxShadow: '0 4px 12px rgba(245,158,11,0.4)' }}>
              <FileText className="h-6 w-6 text-white" />
            </div>
            <p className="label-caps text-[11px] text-ink-soft">Cotizaciones (total)</p>
            <strong className="font-mono text-3xl font-bold text-ink">{general?.totalQuotes ?? '—'}</strong>
          </article>
          <article className="glass-card rounded-2xl p-6">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: '#10b981', boxShadow: '0 4px 12px rgba(16,185,129,0.4)' }}>
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <p className="label-caps text-[11px] text-ink-soft">Ventas (COP)</p>
            <strong className="font-mono text-3xl font-bold text-ink">{general ? formatMoneyFull(general.salesValue, 'COP') : '—'}</strong>
          </article>
          <article className="glass-card rounded-2xl p-6">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: '#a855f7', boxShadow: '0 4px 12px rgba(168,85,247,0.4)' }}>
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <p className="label-caps text-[11px] text-ink-soft">Conversión</p>
            <strong className="font-mono text-3xl font-bold text-ink">{general ? `${general.conversion}%` : '—'}</strong>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1.6fr]">

          <article className="overflow-hidden rounded-2xl" style={{ background: 'var(--paper-card)', border: '1px solid var(--border)' }}>
            <div className="px-7 py-5" style={{ borderBottom: '1px solid var(--border-faint)' }}>
              <h2 className="font-semibold text-ink">Suscripciones por estatus</h2>
            </div>
            <div className="divide-y p-4" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
              {Object.entries(byStatus).map(([status, count]) => (
                <div className="flex items-center justify-between px-3 py-2.5" key={status}>
                  <span className={`${SUBSCRIPTION_CHIP[status] ?? 'chip-borrador'} rounded-full px-2.5 py-1 text-xs font-semibold`}>
                    {SUBSCRIPTION_LABEL[status] ?? status}
                  </span>
                  <span className="font-mono text-sm font-bold text-ink">{count}</span>
                </div>
              ))}
              {Object.keys(byStatus).length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-ink-soft">Aún no hay asesores registrados.</p>
              ) : null}
            </div>
          </article>

          <article className="overflow-hidden rounded-2xl" style={{ background: 'var(--paper-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between px-7 py-5" style={{ borderBottom: '1px solid var(--border-faint)' }}>
              <h2 className="font-semibold text-ink">Asesores recientes</h2>
              <Link className="label-caps text-amber" href="/manager/advisors">Ver todos</Link>
            </div>
            <div className="divide-y" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
              {(dashboard?.recentAdvisors.length ?? 0) === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-ink-soft">Aún no hay asesores registrados.</p>
              ) : (
                dashboard!.recentAdvisors.map((advisor) => (
                  <div className="flex items-center justify-between gap-3 px-7 py-4" key={advisor.id}>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{advisor.name}</p>
                      <p className="truncate text-xs text-ink-soft">{advisor.owner?.email ?? '—'}</p>
                    </div>
                    <span className={`${SUBSCRIPTION_CHIP[advisor.subscription?.status ?? 'NONE']} rounded-full px-2.5 py-1 text-xs font-semibold`}>
                      {SUBSCRIPTION_LABEL[advisor.subscription?.status ?? 'NONE']}
                    </span>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>
      </div>
    </AppShell>
  );
}
