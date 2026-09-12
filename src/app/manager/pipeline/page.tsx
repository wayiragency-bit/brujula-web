'use client';

import { AppShell } from '@/components/app-shell';
import { useManagerOperation } from '@/hooks/use-manager';
import { formatMoneyFull } from '@/lib/format';
import { STATUS_CHIP } from '@/lib/manager-status-colors';
import { quoteStatusLabel } from '@/lib/on-vacation-status';

export default function ManagerPipelinePage() {
  const { data } = useManagerOperation();
  const columns = data?.data ?? [];

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-content space-y-6 px-5 pb-28 pt-8 sm:px-7 lg:px-10 lg:pb-10">
        <header>
          <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">Pipeline</h1>
          <p className="mt-2 text-sm text-ink-soft">Vista global de solo lectura — no se pueden mover ni editar cotizaciones aquí.</p>
        </header>

        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((column) => (
            <div className="w-72 shrink-0 rounded-2xl" key={column.status} style={{ background: 'var(--paper-card)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border-faint)' }}>
                <span className={`${STATUS_CHIP[column.status]} rounded-full px-2.5 py-1 text-xs font-semibold`}>
                  {quoteStatusLabel(column.status, 'ON_VACATION')}
                </span>
                <span className="label-caps text-ink-muted">{column.cards.length}</span>
              </div>
              <div className="max-h-[70vh] space-y-2 overflow-y-auto p-3">
                {column.cards.length === 0 ? (
                  <p className="px-2 py-6 text-center text-xs text-ink-soft">Sin cotizaciones.</p>
                ) : (
                  column.cards.map((card) => (
                    <div className="rounded-xl p-3" key={card.id} style={{ background: 'var(--surface)', border: '1px solid var(--border-faint)' }}>
                      <p className="truncate text-sm font-medium text-ink">{card.number} · {card.client?.name ?? '—'}</p>
                      <p className="truncate text-xs text-ink-soft">{card.agency.name}</p>
                      <p className="truncate text-xs text-ink-soft">{card.destination ?? '—'}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="font-mono text-sm font-semibold text-ink">{formatMoneyFull(Number(card.total), card.currency)}</span>
                        {card.specialStatusLabel ? (
                          <span className="chip-vencida rounded-full px-2 py-0.5 text-[10px] font-semibold">{card.specialStatusLabel}</span>
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
