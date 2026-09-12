'use client';

import {
  AlertCircle, BarChart3, Calendar, CheckCircle2, ChevronLeft, ChevronRight,
  Circle, Clock, DollarSign, FileText, Filter, Plus, Search, Send, Trash2, TrendingUp, UserRound, XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Sparkline } from '@/components/dashboard/sparkline';
import { QuoteActionsMenu } from '@/components/quotes/quote-actions-menu';
import { QuoteShareModal } from '@/components/quotes/quote-share-modal';
import { useDeleteQuote, useQuoteSellers, useQuotes } from '@/hooks/use-quotes';
import { useAuth } from '@/lib/auth-context';
import { quoteStatusLabel } from '@/lib/on-vacation-status';
import type { Quote, QuoteStatus } from '@/lib/types';

const SPARKLINES = [
  [10, 18, 14, 24, 20, 30],
  [20, 16, 28, 22, 32, 27],
  [12, 20, 16, 24, 18, 26],
  [8,  22, 18, 30, 26, 34],
  [16, 24, 14, 28, 20, 32],
];

const PAGE_SIZE = 24;

const STATUS_COLORS: Record<QuoteStatus, { dot: string; bg: string; text: string }> = {
  BORRADOR:  { dot: '#94a3b8', bg: 'rgba(148,163,184,0.15)', text: '#94a3b8' },
  ENVIADA:   { dot: '#3b82f6', bg: 'rgba(59,130,246,0.15)',  text: '#3b82f6' },
  ACEPTADA:  { dot: '#10b981', bg: 'rgba(16,185,129,0.15)',  text: '#10b981' },
  ABONADA:   { dot: '#0ea5e9', bg: 'rgba(14,165,233,0.15)',  text: '#0ea5e9' },
  PAGADA:    { dot: '#06b6d4', bg: 'rgba(6,182,212,0.15)',   text: '#06b6d4' },
  RECHAZADA: { dot: '#ef4444', bg: 'rgba(239,68,68,0.15)',   text: '#ef4444' },
  VENCIDA:   { dot: '#f59e0b', bg: 'rgba(245,158,11,0.15)',  text: '#f59e0b' },
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
    iconBg: '#10b981',
    iconShadow: 'rgba(16,185,129,0.35)',
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
    iconBg: '#f59e0b',
    iconShadow: 'rgba(245,158,11,0.35)',
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

function formatFull(value: string | number, currency: string): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency, maximumFractionDigits: 0,
  }).format(Number(value));
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function QuotesPage() {
  const { user } = useAuth();
  const agencyType = user?.agency?.type;
  const [search, setSearch]   = useState('');
  const [status, setStatus]   = useState<QuoteStatus | undefined>(undefined);
  const [page, setPage]       = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [sellerId, setSellerId] = useState('');
  const { data: sellers } = useQuoteSellers();
  const [emisionOpen, setEmisionOpen] = useState(false);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');
  const [checkinFrom, setCheckinFrom] = useState('');
  const [checkinTo, setCheckinTo] = useState('');
  const hasEmisionFilter = Boolean(createdFrom || createdTo);
  const hasCheckinFilter = Boolean(checkinFrom || checkinTo);

  const { data, isLoading } = useQuotes({
    q: search || undefined, status, page, limit: pageSize, sellerId: sellerId || undefined,
    createdFrom: createdFrom || undefined, createdTo: createdTo || undefined,
    from: checkinFrom || undefined, to: checkinTo || undefined,
  });
  const [confirmDelete, setConfirmDelete] = useState<Quote | null>(null);
  const [shareQuote, setShareQuote] = useState<Quote | null>(null);
  const deleteQuote = useDeleteQuote();

  function clearEmisionFilter() {
    setCreatedFrom(''); setCreatedTo(''); setPage(1);
  }

  function clearCheckinFilter() {
    setCheckinFrom(''); setCheckinTo(''); setPage(1);
  }

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
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {METRIC_DEFS.filter((def) => agencyType !== 'ON_VACATION' || def.key !== 'ganancia').map((def) => {
            const Icon = def.icon;
            const val  = getMetricValue(def);
            return (
              <div
                className="glass-card rounded-2xl p-5"
                key={def.key}
              >
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
                    style={{ background: def.iconBg, boxShadow: `0 4px 10px ${def.iconShadow}` }}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <p
                    className="min-w-0 flex-1 font-black uppercase leading-tight text-ink-soft"
                    style={{ fontSize: '11px', letterSpacing: '1.5px' }}
                  >
                    {def.label}
                  </p>
                </div>
                <p
                  className="font-black text-ink leading-none"
                  style={{ fontSize: '27px', letterSpacing: '-1.2px' }}
                >
                  {val > 0 ? formatFull(val, baseCurrency) : '—'}
                </p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span
                    className="inline-block shrink-0 rounded-md px-1.5 py-0.5 text-ink-soft"
                    style={{ background: 'var(--surface)', fontSize: '12px', fontWeight: 700 }}
                  >
                    {def.trend === 'down' ? '↘' : '↗'} {def.footnote}
                  </span>
                  <Sparkline color={def.iconBg} points={def.spark} />
                </div>
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
                  <p className="label-caps text-ink-soft" style={{ fontSize: '10px', letterSpacing: '1.5px' }}>{quoteStatusLabel(s, agencyType)}</p>
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

        {/* Search + date filter */}
        <div className="flex flex-wrap items-center gap-3">
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

          <div className="relative">
            <button
              className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition"
              onClick={() => setEmisionOpen((o) => !o)}
              style={{
                border: `1px solid ${hasEmisionFilter ? '#8b5cf6' : 'var(--border)'}`,
                color: hasEmisionFilter ? '#8b5cf6' : 'var(--ink)',
                background: hasEmisionFilter ? 'rgba(139,92,246,0.08)' : 'var(--surface)',
              }}
              type="button"
            >
              <Calendar className="h-4 w-4" /> Fecha de Emisión
            </button>

            {emisionOpen ? (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setEmisionOpen(false)} />
                <div
                  className="absolute left-0 top-full z-50 mt-2 w-64 space-y-3 rounded-2xl p-4 shadow-floating"
                  onClick={(e) => e.stopPropagation()}
                  style={{ background: 'var(--paper-card)', border: '1px solid var(--border)' }}
                >
                  <div>
                    <p className="label-caps mb-2 text-ink-soft" style={{ fontSize: '10px', letterSpacing: '1.5px' }}>Fecha de Emisión</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        className="w-full rounded-lg px-2 py-1.5 text-sm text-ink outline-none focus:ring-1 focus:ring-teal/40"
                        onChange={(e) => { setCreatedFrom(e.target.value); setPage(1); }}
                        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                        type="date"
                        value={createdFrom}
                      />
                      <input
                        className="w-full rounded-lg px-2 py-1.5 text-sm text-ink outline-none focus:ring-1 focus:ring-teal/40"
                        onChange={(e) => { setCreatedTo(e.target.value); setPage(1); }}
                        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                        type="date"
                        value={createdTo}
                      />
                    </div>
                  </div>
                  {hasEmisionFilter ? (
                    <button className="text-xs font-semibold text-ink-soft hover:text-ink" onClick={clearEmisionFilter} type="button">
                      Limpiar
                    </button>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>

          <div className="relative">
            <button
              className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition"
              onClick={() => setCheckinOpen((o) => !o)}
              style={{
                border: `1px solid ${hasCheckinFilter ? '#8b5cf6' : 'var(--border)'}`,
                color: hasCheckinFilter ? '#8b5cf6' : 'var(--ink)',
                background: hasCheckinFilter ? 'rgba(139,92,246,0.08)' : 'var(--surface)',
              }}
              type="button"
            >
              <Calendar className="h-4 w-4" /> Fecha de Check-in
            </button>

            {checkinOpen ? (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setCheckinOpen(false)} />
                <div
                  className="absolute left-0 top-full z-50 mt-2 w-64 space-y-3 rounded-2xl p-4 shadow-floating"
                  onClick={(e) => e.stopPropagation()}
                  style={{ background: 'var(--paper-card)', border: '1px solid var(--border)' }}
                >
                  <div>
                    <p className="label-caps mb-2 text-ink-soft" style={{ fontSize: '10px', letterSpacing: '1.5px' }}>Fecha de Check-in</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        className="w-full rounded-lg px-2 py-1.5 text-sm text-ink outline-none focus:ring-1 focus:ring-teal/40"
                        onChange={(e) => { setCheckinFrom(e.target.value); setPage(1); }}
                        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                        type="date"
                        value={checkinFrom}
                      />
                      <input
                        className="w-full rounded-lg px-2 py-1.5 text-sm text-ink outline-none focus:ring-1 focus:ring-teal/40"
                        onChange={(e) => { setCheckinTo(e.target.value); setPage(1); }}
                        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                        type="date"
                        value={checkinTo}
                      />
                    </div>
                  </div>
                  {hasCheckinFilter ? (
                    <button className="text-xs font-semibold text-ink-soft hover:text-ink" onClick={clearCheckinFilter} type="button">
                      Limpiar
                    </button>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>

          <label className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <span className="text-ink-soft">Mostrar:</span>
            <select
              className="bg-transparent font-semibold text-ink outline-none"
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              value={pageSize}
            >
              {[12, 24, 48, 96].map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
          </label>

          <label className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <Filter className="h-4 w-4 text-ink-soft" />
            <select
              className="bg-transparent font-semibold text-ink outline-none"
              onChange={(e) => { setStatus((e.target.value || undefined) as QuoteStatus | undefined); setPage(1); }}
              value={status ?? ''}
            >
              <option value="">Todos Los Estados</option>
              {ALL_STATUSES.map((s) => <option key={s} value={s}>{quoteStatusLabel(s, agencyType)}</option>)}
            </select>
          </label>

          <label className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <UserRound className="h-4 w-4 text-ink-soft" />
            <select
              className="bg-transparent font-semibold text-ink outline-none"
              onChange={(e) => { setSellerId(e.target.value); setPage(1); }}
              value={sellerId}
            >
              <option value="">Todos Los Agentes</option>
              {sellers?.map((seller) => <option key={seller.id} value={seller.id}>{seller.name}</option>)}
            </select>
          </label>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl" style={{ border: '1px solid var(--border)', background: 'var(--paper-card)' }}>
          <table className="w-full min-w-[900px]">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['ID', 'Cliente', 'Agente', 'Emisión', 'Válido Hasta', 'Total', 'Depósito', 'Estado', 'Acciones'].map((col, i) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-ink"
                    style={{ fontSize: '14px', fontWeight: 700, textAlign: i >= 5 && i <= 6 ? 'right' : col === 'Acciones' ? 'center' : 'left' }}
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
                          {quote.statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <QuoteActionsMenu onDelete={() => setConfirmDelete(quote)} onShare={() => setShareQuote(quote)} quote={quote} />
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

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)} style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()} style={{ background: 'var(--paper-card)', border: '1px solid var(--border)' }}>
            <div>
              <p className="label-caps text-red-400">Eliminar cotización</p>
              <h3 className="font-display text-lg font-extrabold text-ink mt-1">{confirmDelete.number}</h3>
              <p className="text-sm text-ink-soft mt-1">Esta acción eliminará la cotización permanentemente. No podrás deshacerla.</p>
            </div>
            <div className="flex gap-2 justify-end">
              <button className="button-secondary" onClick={() => setConfirmDelete(null)} type="button">Cancelar</button>
              <button
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition disabled:opacity-50"
                disabled={deleteQuote.isPending}
                onClick={() => {
                  const target = confirmDelete;
                  setConfirmDelete(null);
                  deleteQuote.mutate({ id: target.id, version: target.version });
                }}
                type="button"
              >
                <Trash2 className="h-3.5 w-3.5" /> {deleteQuote.isPending ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {shareQuote && <QuoteShareModal onClose={() => setShareQuote(null)} quote={shareQuote} />}
    </AppShell>
  );
}
