'use client';

import {
  AlertCircle, BarChart3, CheckCircle2, ChevronLeft, ChevronRight,
  Circle, Clock, DollarSign, FileText, Plus, Search, Send, TrendingUp, XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Sparkline } from '@/components/dashboard/sparkline';
import { useQuotes } from '@/hooks/use-quotes';
import type { QuoteStatus } from '@/lib/types';

const SPARKLINES = [
  [10, 18, 14, 24, 20, 30],
  [20, 16, 28, 22, 32, 27],
  [12, 20, 16, 24, 18, 26],
  [8,  22, 18, 30, 26, 34],
  [16, 24, 14, 28, 20, 32],
];

const PAGE_SIZE = 24;

const STATUS_LABELS: Record<QuoteStatus, string> = {
  BORRADOR: 'Borrador', ENVIADA: 'Enviada', ACEPTADA: 'Aceptada', ABONADA: 'Abonada',
  PAGADA: 'Pagada', RECHAZADA: 'Rechazada', VENCIDA: 'Vencida',
};

const STATUS_COLORS: Record<QuoteStatus, { dot: string; bg: string; text: string }> = {
  BORRADOR:  { dot: '#94a3b8', bg: 'rgba(148,163,184,0.15)', text: '#94a3b8' },
  ENVIADA:   { dot: '#feb23b', bg: 'rgba(254,178,59,0.15)',  text: '#feb23b' },
  ACEPTADA:  { dot: '#22c55e', bg: 'rgba(34,197,94,0.15)',   text: '#22c55e' },
  ABONADA:   { dot: '#0ea5e9', bg: 'rgba(14,165,233,0.15)',  text: '#0ea5e9' },
  PAGADA:    { dot: '#06b6d4', bg: 'rgba(6,182,212,0.15)',   text: '#06b6d4' },
  RECHAZADA: { dot: '#ef4444', bg: 'rgba(239,68,68,0.15)',   text: '#ef4444' },
  VENCIDA:   { dot: '#f97316', bg: 'rgba(249,115,22,0.15)',  text: '#f97316' },
};

const STATUS_ICONS: Record<QuoteStatus, React.ElementType> = {
  BORRADOR:  Circle,
  ENVIADA:   Send,
  ACEPTADA:  CheckCircle2,
  ABONADA:   Clock,
  PAGADA:    CheckCircle2,
  RECHAZADA: XCircle,
  VENCIDA:   AlertCircle,
};

const ALL_STATUSES: QuoteStatus[] = ['BORRADOR', 'ENVIADA', 'ACEPTADA', 'ABONADA', 'PAGADA', 'RECHAZADA', 'VENCIDA'];

const METRIC_DEFS = [
  {
    key: 'cotizado',
    label: 'Total Cotizado',
    footnote: 'Histórico general',
    trend: 'up' as const,
    icon: FileText,
    iconBg: '#3b82f6',
    iconShadow: 'rgba(59,130,246,0.35)',
    statuses: ALL_STATUSES,
    field: 'total' as const,
    spark: SPARKLINES[0],
  },
  {
    key: 'aceptado',
    label: 'Total Aceptado',
    footnote: 'Ganancias',
    trend: 'up' as const,
    icon: CheckCircle2,
    iconBg: '#22c55e',
    iconShadow: 'rgba(34,197,94,0.35)',
    statuses: ['ACEPTADA', 'ABONADA', 'PAGADA'] as QuoteStatus[],
    field: 'total' as const,
    spark: SPARKLINES[1],
  },
  {
    key: 'rechazado',
    label: 'Total Rechazado',
    footnote: 'Pérdidas',
    trend: 'down' as const,
    icon: XCircle,
    iconBg: '#ef4444',
    iconShadow: 'rgba(239,68,68,0.35)',
    statuses: ['RECHAZADA'] as QuoteStatus[],
    field: 'total' as const,
    spark: SPARKLINES[2],
  },
  {
    key: 'vencido',
    label: 'Total Vencido',
    footnote: 'Expiradas',
    trend: 'down' as const,
    icon: AlertCircle,
    iconBg: '#f97316',
    iconShadow: 'rgba(249,115,22,0.35)',
    statuses: ['VENCIDA'] as QuoteStatus[],
    field: 'total' as const,
    spark: SPARKLINES[3],
  },
  {
    key: 'ganancia',
    label: 'Ganancia Total',
    footnote: 'De cot. aceptadas',
    trend: 'up' as const,
    icon: TrendingUp,
    iconBg: '#8b5cf6',
    iconShadow: 'rgba(139,92,246,0.35)',
    statuses: ['ACEPTADA', 'ABONADA', 'PAGADA'] as QuoteStatus[],
    field: 'marginTotal' as const,
    spark: SPARKLINES[4],
  },
];

function formatCompact(value: number, currency: string): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency, notation: 'compact', maximumFractionDigits: 0,
  }).format(value);
}

function formatFull(value: string, currency: string): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency, maximumFractionDigits: 0,
  }).format(Number(value));
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function QuotesPage() {
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState<QuoteStatus | undefined>(undefined);
  const [page, setPage]       = useState(1);

  const { data, isLoading } = useQuotes({ q: search || undefined, status, page, limit: PAGE_SIZE });

  const { counts, totals } = useMemo(() => {
    const c = new Map<QuoteStatus, number>();
    const t = new Map<string, number>();
    data?.summary.forEach((row) => {
      c.set(row.status, (c.get(row.status) ?? 0) + row.count);
      const key = `${row.status}-total`;
      t.set(key, (t.get(key) ?? 0) + Number(row.total));
      if (row.marginTotal) {
        const mk = `${row.status}-margin`;
        t.set(mk, (t.get(mk) ?? 0) + Number(row.marginTotal));
      }
    });
    return { counts: c, totals: t };
  }, [data]);

  const totalCount = Array.from(counts.values()).reduce((a, b) => a + b, 0);

  function getMetricValue(def: typeof METRIC_DEFS[0]): number {
    return def.statuses.reduce((acc, s) => {
      const key = def.field === 'marginTotal' ? `${s}-margin` : `${s}-total`;
      return acc + (totals.get(key) ?? 0);
    }, 0);
  }

  const baseCurrency = data?.data[0]?.currency ?? 'COP';

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-content space-y-5 px-4 pb-28 pt-7 sm:px-6 lg:px-8 lg:pb-10">

        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ink">Gestión de Cotizaciones</h1>
            <p className="mt-1 text-base text-ink-soft">Controla el ciclo de vida de tus ventas.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link className="button-primary inline-flex items-center gap-2" href="/quotes/new">
              <Plus className="h-4 w-4" /> Nueva Cotización
            </Link>
          </div>
        </header>

        {/* Metric summary cards */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {METRIC_DEFS.map((def) => {
            const Icon = def.icon;
            const val  = getMetricValue(def);
            return (
              <div
                className="glass-card relative overflow-hidden rounded-2xl p-4"
                key={def.key}
              >
                <div className="absolute right-3 top-3 opacity-90">
                  <Sparkline color={def.iconBg} points={def.spark} />
                </div>
                <div className="mb-3 flex items-center gap-3 pr-20">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                    style={{ background: def.iconBg, boxShadow: `0 4px 10px ${def.iconShadow}` }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <p
                    className="font-black uppercase leading-tight text-ink-soft"
                    style={{ fontSize: '10px', letterSpacing: '1.5px' }}
                  >
                    {def.label}
                  </p>
                </div>
                <p
                  className="font-black text-ink leading-none"
                  style={{ fontSize: '24px', letterSpacing: '-1.2px' }}
                >
                  {val > 0 ? formatCompact(val, baseCurrency) : '—'}
                </p>
                <span
                  className="mt-2 inline-block rounded-md px-1.5 py-0.5 text-ink-soft"
                  style={{ background: 'var(--surface)', fontSize: '11px', fontWeight: 700 }}
                >
                  {def.trend === 'down' ? '↘' : '↗'} {def.footnote}
                </span>
              </div>
            );
          })}
        </div>

        {/* Status tabs */}
        <div className="flex flex-wrap gap-3">
          {/* Todos tab */}
          <button
            className={`flex min-w-[150px] flex-1 items-center justify-between gap-3 rounded-2xl p-4 transition-all ${
              !status ? 'ring-1 ring-teal/40' : 'glass-card hover:brightness-110'
            }`}
            onClick={() => { setStatus(undefined); setPage(1); }}
            style={!status ? { background: 'rgba(13,148,136,0.10)' } : {}}
            type="button"
          >
            <div className="min-w-0 text-left">
              <p className="label-caps text-ink-soft" style={{ fontSize: '10px', letterSpacing: '1.5px' }}>Total Cot</p>
              <p className="mt-1 font-black leading-none" style={{ fontSize: '22px', color: !status ? '#0d9488' : 'var(--ink)' }}>
                {totalCount}
              </p>
            </div>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: 'rgba(13,148,136,0.15)' }}>
              <BarChart3 className="h-4 w-4" style={{ color: '#0d9488' }} />
            </div>
          </button>

          {ALL_STATUSES.map((s) => {
            const active = status === s;
            const col    = STATUS_COLORS[s];
            const Icon   = STATUS_ICONS[s];
            return (
              <button
                className={`flex min-w-[150px] flex-1 items-center justify-between gap-3 rounded-2xl p-4 transition-all ${
                  active ? 'ring-1' : 'glass-card hover:brightness-110'
                }`}
                key={s}
                onClick={() => { setStatus(s); setPage(1); }}
                style={active ? { background: col.bg, boxShadow: `0 0 0 1px ${col.dot}` } : {}}
                type="button"
              >
                <div className="min-w-0 text-left">
                  <p className="label-caps text-ink-soft" style={{ fontSize: '10px', letterSpacing: '1.5px' }}>{STATUS_LABELS[s]}</p>
                  <p className="mt-1 font-black leading-none" style={{ fontSize: '22px', color: active ? col.text : 'var(--ink)' }}>
                    {counts.get(s) ?? 0}
                  </p>
                </div>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: col.bg }}>
                  <Icon className="h-4 w-4" style={{ color: col.dot }} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            className="w-full rounded-xl py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-teal/40"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            placeholder="Buscar por número, destino o cliente…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl" style={{ border: '1px solid var(--border)', background: 'var(--paper-card)' }}>
          <table className="w-full min-w-[900px]">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['ID', 'Cliente', 'Agente', 'Emisión', 'Válido Hasta', 'Destino', 'Total', 'Depósito', 'Estado'].map((col, i) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-ink"
                    style={{ fontSize: '14px', fontWeight: 700, textAlign: i >= 6 && i <= 7 ? 'right' : 'left' }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="px-4 py-8 text-center text-sm text-ink-soft" colSpan={9}>
                    Cargando cotizaciones…
                  </td>
                </tr>
              ) : data?.data.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-sm text-ink-soft" colSpan={9}>
                    No se encontraron cotizaciones.
                  </td>
                </tr>
              ) : (
                data?.data.map((quote) => {
                  const col = STATUS_COLORS[quote.status];
                  return (
                    <tr
                      key={quote.id}
                      style={{ borderBottom: '1px solid var(--border-faint)' }}
                      className="hover:bg-[var(--surface-hover)] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/quotes/${quote.id}`}
                          className="hover:underline"
                          style={{ fontSize: '14px', fontWeight: 700, color: '#0ea5e9' }}
                        >
                          {quote.number}
                        </Link>
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ink)' }}>
                        {quote.client?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: '14px', fontWeight: 400, color: 'var(--ink-soft)' }}>
                        {quote.seller?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: '14px', fontWeight: 400, color: 'var(--ink-soft)' }}>
                        {formatDate(quote.createdAt)}
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: '14px', fontWeight: 400, color: 'var(--ink-soft)' }}>
                        {formatDate(quote.validUntil)}
                      </td>
                      <td className="px-4 py-3" style={{ fontSize: '14px', fontWeight: 400, color: 'var(--ink-soft)' }}>
                        {quote.destination}
                      </td>
                      <td className="px-4 py-3 text-right" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>
                        {formatFull(quote.total, quote.currency)}
                      </td>
                      <td className="px-4 py-3 text-right" style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ink-soft)' }}>
                        {Number(quote.depositAmount) > 0 ? formatFull(quote.depositAmount, quote.currency) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                          style={{ background: col.bg, color: col.text }}
                        >
                          <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: col.dot }} />
                          {STATUS_LABELS[quote.status]}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.meta.totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-ink-soft">
            <p>Total: {data.meta.total} cotizaciones</p>
            <div className="flex items-center gap-2">
              <button
                className="rounded-lg p-2 disabled:opacity-30 hover:bg-surface transition"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                type="button"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-mono text-xs">Página {page} de {data.meta.totalPages}</span>
              <button
                className="rounded-lg p-2 disabled:opacity-30 hover:bg-surface transition"
                disabled={page >= data.meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                type="button"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
