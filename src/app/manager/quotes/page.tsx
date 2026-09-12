'use client';

import { Search } from 'lucide-react';
import { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Pager } from '@/components/dashboard/pager';
import { useManagerQuotes } from '@/hooks/use-manager';
import { formatMoneyFull } from '@/lib/format';
import { STATUS_CHIP } from '@/lib/manager-status-colors';

export default function ManagerQuotesPage() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const { data } = useManagerQuotes({ q: q || undefined, page, limit: 20 });

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-content space-y-6 px-5 pb-28 pt-8 sm:px-7 lg:px-10 lg:pb-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">Cotizaciones</h1>
            <p className="mt-2 text-sm text-ink-soft">Todas las cotizaciones de agencias On Vacation.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              className="h-10 w-full rounded-xl pl-9 pr-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-amber/30"
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="Buscar por número, cliente…"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              type="search"
              value={q}
            />
          </div>
        </header>

        <article className="overflow-hidden rounded-2xl" style={{ background: 'var(--paper-card)', border: '1px solid var(--border)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-faint)' }}>
                  <th className="label-caps px-6 py-3 text-ink-muted">Cotización</th>
                  <th className="label-caps px-6 py-3 text-ink-muted">Agencia</th>
                  <th className="label-caps px-6 py-3 text-ink-muted">Cliente</th>
                  <th className="label-caps px-6 py-3 text-ink-muted">Destino</th>
                  <th className="label-caps px-6 py-3 text-ink-muted">Estatus</th>
                  <th className="label-caps px-6 py-3 text-ink-muted">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
                {(data?.data.length ?? 0) === 0 ? (
                  <tr><td className="px-6 py-10 text-center text-ink-soft" colSpan={6}>No se encontraron cotizaciones.</td></tr>
                ) : (
                  data!.data.map((quote) => (
                    <tr key={quote.id}>
                      <td className="px-6 py-4 font-medium text-ink">{quote.number}</td>
                      <td className="px-6 py-4 text-ink">{quote.agency.name}</td>
                      <td className="px-6 py-4 text-ink-soft">{quote.client?.name ?? '—'}</td>
                      <td className="px-6 py-4 text-ink-soft">{quote.destination ?? '—'}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          <span className={`${STATUS_CHIP[quote.status]} rounded-full px-2.5 py-1 text-xs font-semibold`}>
                            {quote.statusLabel}
                          </span>
                          {quote.specialStatusLabel ? (
                            <span className="chip-vencida rounded-full px-2.5 py-1 text-xs font-semibold">{quote.specialStatusLabel}</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-ink">{formatMoneyFull(Number(quote.total), quote.currency)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: '1px solid var(--border-faint)' }}>
            <span className="label-caps text-ink-muted">{data?.meta.total ?? 0} cotizaciones</span>
            <Pager onChange={setPage} page={page} totalPages={data?.meta.totalPages ?? 1} />
          </div>
        </article>
      </div>
    </AppShell>
  );
}
