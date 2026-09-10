'use client';

import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { useQuotes } from '@/hooks/use-quotes';
import type { QuoteStatus } from '@/lib/types';

const PAGE_SIZE = 20;

const STATUS_LABELS: Record<QuoteStatus, string> = {
  BORRADOR: 'Borrador', ENVIADA: 'Enviada', ACEPTADA: 'Aceptada', ABONADA: 'Abonada',
  PAGADA: 'Pagada', RECHAZADA: 'Rechazada', VENCIDA: 'Vencida',
};

const STATUS_COLORS: Record<QuoteStatus, string> = {
  BORRADOR: 'bg-ink/10 text-ink-soft', ENVIADA: 'bg-amber/15 text-amber', ACEPTADA: 'bg-status-accepted/15 text-status-accepted',
  ABONADA: 'bg-amber/15 text-amber', PAGADA: 'bg-status-accepted/15 text-status-accepted',
  RECHAZADA: 'bg-red-100 text-red-600', VENCIDA: 'bg-status-expired/15 text-status-expired',
};

const ALL_STATUSES: QuoteStatus[] = ['BORRADOR', 'ENVIADA', 'ACEPTADA', 'ABONADA', 'PAGADA', 'RECHAZADA', 'VENCIDA'];

function formatMoney(value: string, currency: string): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency, notation: 'compact', maximumFractionDigits: 1 }).format(Number(value));
}

export default function QuotesPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<QuoteStatus | undefined>(undefined);
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuotes({ q: search || undefined, status, page, limit: PAGE_SIZE });

  const counts = useMemo(() => {
    const map = new Map<QuoteStatus, number>();
    data?.summary.forEach((row) => map.set(row.status, (map.get(row.status) ?? 0) + row.count));
    return map;
  }, [data]);

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-content space-y-6 px-4 pb-28 pt-7 sm:px-6 lg:px-8 lg:pb-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-ink">Gestión de Cotizaciones</h1>
            <p className="mt-1 text-sm text-ink-soft">Controla el ciclo de vida de tus ventas.</p>
          </div>
          <Link className="button-primary inline-flex items-center gap-2" href="/quotes/new">
            <Plus className="h-4 w-4" /> Nueva Cotización
          </Link>
        </header>

        <div className="flex flex-wrap gap-2">
          <button
            className={`rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wide transition ${!status ? 'bg-teal text-paper' : 'bg-paper-card text-ink-soft hover:bg-ink/5'}`}
            onClick={() => { setStatus(undefined); setPage(1); }}
            type="button"
          >
            Todos
          </button>
          {ALL_STATUSES.map((s) => (
            <button
              className={`rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wide transition ${status === s ? 'bg-teal text-paper' : 'bg-paper-card text-ink-soft hover:bg-ink/5'}`}
              key={s}
              onClick={() => { setStatus(s); setPage(1); }}
              type="button"
            >
              {STATUS_LABELS[s]} ({counts.get(s) ?? 0})
            </button>
          ))}
        </div>

        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft/60" />
          <input
            className="w-full rounded-lg border border-ink/15 bg-paper-card py-2.5 pl-9 pr-3 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar por número, destino o cliente…"
            value={search}
          />
        </div>

        <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-paper-card shadow-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-left">
                <th className="label-caps px-4 py-3 text-ink-soft">ID</th>
                <th className="label-caps px-4 py-3 text-ink-soft">Cliente</th>
                <th className="label-caps px-4 py-3 text-ink-soft">Destino</th>
                <th className="label-caps px-4 py-3 text-right text-ink-soft">Total</th>
                <th className="label-caps px-4 py-3 text-ink-soft">Estado</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="px-4 py-8 text-center text-ink-soft" colSpan={5}>Cargando cotizaciones…</td></tr>
              ) : data?.data.length === 0 ? (
                <tr><td className="px-4 py-8 text-center text-ink-soft" colSpan={5}>No se encontraron cotizaciones.</td></tr>
              ) : (
                data?.data.map((quote) => (
                  <tr className="border-b border-ink/5 last:border-0 hover:bg-ink/[0.02]" key={quote.id}>
                    <td className="px-4 py-3">
                      <Link className="font-mono text-xs font-bold text-teal hover:underline" href={`/quotes/${quote.id}`}>{quote.number}</Link>
                    </td>
                    <td className="px-4 py-3 text-ink">{quote.client?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-ink-soft">{quote.destination}</td>
                    <td className="px-4 py-3 text-right font-mono text-ink">{formatMoney(quote.total, quote.currency)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase ${STATUS_COLORS[quote.status]}`}>
                        {STATUS_LABELS[quote.status]}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && data.meta.totalPages > 1 ? (
          <div className="flex items-center justify-between text-sm text-ink-soft">
            <p>Total: {data.meta.total} cotizaciones</p>
            <div className="flex items-center gap-2">
              <button className="rounded-lg p-2 disabled:opacity-30" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} type="button">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-mono text-xs">Página {page} de {data.meta.totalPages}</span>
              <button className="rounded-lg p-2 disabled:opacity-30" disabled={page >= data.meta.totalPages} onClick={() => setPage((p) => p + 1)} type="button">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
