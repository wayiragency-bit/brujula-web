'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, BarChart3, BriefcaseBusiness, FileText, Package, Plus, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import type { Paginated, Product, Quote, QuoteListSummaryRow } from '@/lib/types';

const ACCEPTED_LIKE = new Set(['ACEPTADA', 'ABONADA', 'PAGADA']);
const IN_PROGRESS   = new Set(['ENVIADA', 'ACEPTADA', 'ABONADA']);

function formatMoney(value: number, currency = 'COP'): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency, notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

function formatMoneyFull(value: number, currency = 'COP'): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
}

/* Simple decorative SVG sparkline — takes 6 relative y-values 0-40 */
function Sparkline({ points, color = '#feb23b' }: { points: number[]; color?: string }) {
  const w = 80; const h = 36; const n = points.length;
  const xs = points.map((_, i) => (i / (n - 1)) * w);
  const ys = points.map((v) => h - v);
  const path = xs.map((x, i) => `${i === 0 ? 'M' : 'L'}${x},${ys[i]}`).join(' ');
  return (
    <svg className="shrink-0 opacity-70" fill="none" height={h} viewBox={`0 0 ${w} ${h}`} width={w}>
      <polyline fill="none" points={xs.map((x, i) => `${x},${ys[i]}`).join(' ')} stroke={color} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

const SPARKLINES = [
  [10, 18, 14, 24, 20, 30],
  [20, 16, 28, 22, 32, 27],
  [12, 20, 16, 24, 18, 26],
  [8,  22, 18, 30, 26, 34],
];

const STATUS_LABEL: Record<string, string> = {
  ENVIADA: 'Enviada', ACEPTADA: 'Aceptada', ABONADA: 'Abonada',
  PAGADA: 'Pagada', RECHAZADA: 'Rechazada', VENCIDA: 'Vencida', BORRADOR: 'Borrador',
};
const STATUS_COLOR: Record<string, string> = {
  ENVIADA: 'chip-enviada', ACEPTADA: 'chip-aceptada', ABONADA: 'chip-abonada',
  PAGADA: 'chip-pagada', RECHAZADA: 'chip-rechazada', VENCIDA: 'chip-vencida', BORRADOR: 'chip-borrador',
};

export default function DashboardPage() {
  const { user, hasPermission } = useAuth();

  const { data: clients } = useQuery({ queryKey: ['dashboard', 'clients'], queryFn: () => api.get<Paginated<unknown>>('/clients?limit=1') });
  const { data: products } = useQuery({ queryKey: ['dashboard', 'products'], queryFn: () => api.get<Paginated<Product>>('/products?limit=50') });
  const { data: quotes } = useQuery({
    queryKey: ['dashboard', 'quotes'],
    queryFn: () => api.get<Paginated<Quote> & { summary: QuoteListSummaryRow[] }>('/quotes?limit=1'),
  });
  const { data: recentQuotes } = useQuery({
    queryKey: ['dashboard', 'recent'],
    queryFn: () => api.get<Paginated<Quote>>('/quotes?limit=5&sortBy=updatedAt&order=DESC'),
  });

  const currency      = quotes?.summary[0]?.currency ?? 'COP';
  const totalQuoted   = quotes?.summary.reduce((sum, row) => sum + Number(row.total), 0) ?? 0;
  const totalAccepted = quotes?.summary.filter((r) => ACCEPTED_LIKE.has(r.status)).reduce((sum, row) => sum + Number(row.total), 0) ?? 0;
  const pendingCount  = quotes?.summary.find((r) => r.status === 'ENVIADA')?.count ?? 0;
  const totalMargin   = hasPermission('quotes.view_financial')
    ? quotes?.summary.filter((r) => ACCEPTED_LIKE.has(r.status)).reduce((sum, row) => sum + Number(row.marginTotal ?? 0), 0) ?? 0
    : null;
  const totalClients  = clients?.meta.total ?? 0;
  const totalProducts = products?.meta.total ?? 0;
  const totalQuoteCount = quotes?.meta.total ?? 0;

  const topProducts = [...(products?.data ?? [])].sort((a, b) => b.timesQuoted - a.timesQuoted).slice(0, 3);
  const inProgressQuotes = (recentQuotes?.data ?? []).filter((q) => IN_PROGRESS.has(q.status)).slice(0, 4);

  const pct = totalQuoted > 0 ? Math.min(100, (totalAccepted / totalQuoted) * 100) : 0;

  const metrics = [
    { label: 'Clientes',      value: String(totalClients),    icon: BriefcaseBusiness, spark: SPARKLINES[0] },
    { label: 'Cotizaciones',  value: String(totalQuoteCount), icon: FileText,           spark: SPARKLINES[1] },
    { label: 'Inventario',    value: String(totalProducts),   icon: Package,            spark: SPARKLINES[2] },
    ...(totalMargin !== null
      ? [{ label: 'Ganancia', value: formatMoney(totalMargin, currency), icon: TrendingUp, spark: SPARKLINES[3], accent: true }]
      : []),
  ];

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-content space-y-8 px-4 pb-28 pt-7 sm:px-6 lg:px-8 lg:pb-10">

        {/* Header */}
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="label-caps mb-2 text-ink-soft">
              {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}
            </p>
            <h1 className="font-display text-[2rem] font-extrabold leading-tight text-ink sm:text-4xl">
              Hola, {user?.name.split(' ')[0] ?? ''}
            </h1>
            <p className="mt-2 text-sm text-ink-soft">Panel de control · {new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="flex gap-3">
            <Link className="button-secondary" href="/clients"><Plus className="h-4 w-4" /> Nuevo cliente</Link>
            <Link className="button-primary" href="/quotes/new"><Plus className="h-4 w-4" /> Nueva cotización</Link>
          </div>
        </header>

        {/* Metric cards */}
        <section aria-label="Indicadores principales" className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {metrics.map((metric, i) => {
            const Icon = metric.icon;
            return (
              <article className="metric-card" key={metric.label}>
                <div className="flex items-start justify-between">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{ background: 'rgba(254,178,59,0.12)' }}
                  >
                    <Icon className="h-4 w-4 text-amber" />
                  </div>
                  <Sparkline
                    color={'accent' in metric && metric.accent ? '#22c55e' : '#feb23b'}
                    points={metric.spark}
                  />
                </div>
                <div className="mt-3">
                  <strong
                    className={`font-mono text-3xl font-bold ${'accent' in metric && metric.accent ? 'text-status-accepted' : 'text-ink'}`}
                  >
                    {metric.value}
                  </strong>
                  <p className="mt-0.5 label-caps text-ink-soft">{metric.label}</p>
                </div>
              </article>
            );
          })}
        </section>

        {/* Sales goal + pulse */}
        <section className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">

          {/* Cotizado vs Aceptado */}
          <article
            className="rounded-2xl p-6 sm:p-7"
            style={{ background: 'var(--paper-card)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="label-caps text-ink-soft">VENTAS DEL MES</p>
                <p className="mt-2 font-mono text-3xl font-extrabold text-ink">{formatMoneyFull(totalAccepted, currency)}</p>
                <p className="mt-1 text-sm text-ink-soft">de {formatMoneyFull(totalQuoted, currency)} cotizados</p>
              </div>
              <Link
                className="shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-amber transition"
                href="/quotes"
                style={{ background: 'rgba(254,178,59,0.10)' }}
              >
                Ver todo <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Progress bar */}
            <div className="mt-5">
              <div
                className="h-2.5 w-full overflow-hidden rounded-full"
                style={{ background: 'var(--border-faint)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: 'linear-gradient(90deg, #11433f, #feb23b)',
                  }}
                />
              </div>
              <div className="mt-2 flex justify-between">
                <span className="font-mono text-xs font-bold text-amber">{pct.toFixed(1)}% aceptado</span>
                <span className="label-caps text-ink-muted">cotizado vs aceptado</span>
              </div>
            </div>

            {/* Mini stats */}
            <div
              className="mt-5 grid grid-cols-3 gap-3 rounded-xl p-3"
              style={{ background: 'var(--surface)' }}
            >
              {[
                { label: 'Enviadas', value: String(pendingCount), color: '#feb23b' },
                { label: 'Aceptadas', value: String(quotes?.summary.filter(r => ACCEPTED_LIKE.has(r.status)).reduce((s, r) => s + r.count, 0) ?? 0), color: '#22c55e' },
                { label: 'Total', value: String(totalQuoteCount), color: '#e2e8f0' },
              ].map((stat) => (
                <div className="text-center" key={stat.label}>
                  <p className="font-mono text-xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                  <p className="label-caps text-ink-muted">{stat.label}</p>
                </div>
              ))}
            </div>
          </article>

          {/* Pulso comercial */}
          <article
            className="flex flex-col justify-between rounded-2xl p-6 sm:p-7"
            style={{ background: 'linear-gradient(135deg, #11433f 0%, #0d2e2b 100%)', border: '1px solid var(--border)' }}
          >
            <div>
              <p className="label-caps" style={{ color: 'rgba(160,208,202,0.8)' }}>PULSO COMERCIAL</p>
              <h2 className="mt-3 font-display text-3xl font-extrabold text-ink">
                {pendingCount}
              </h2>
              <p className="text-sm" style={{ color: 'rgba(160,208,202,0.9)' }}>
                {pendingCount === 1 ? 'cotización esperando' : 'cotizaciones esperando'} respuesta del cliente
              </p>
            </div>
            <Link
              className="mt-6 inline-flex items-center gap-2 font-mono text-sm font-bold"
              href="/pipeline"
              style={{ color: '#feb23b' }}
            >
              <BarChart3 className="h-4 w-4" /> Ver pipeline <ArrowUpRight className="h-4 w-4" />
            </Link>
          </article>
        </section>

        {/* En Curso + Top Products */}
        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">

          {/* En Curso */}
          <article
            className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--paper-card)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border-faint)' }}>
              <h2 className="font-semibold text-ink">En Curso</h2>
              <Link className="label-caps text-amber" href="/quotes">Ver todas</Link>
            </div>
            <div className="divide-y" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
              {inProgressQuotes.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-ink-soft">No hay cotizaciones en curso.</p>
              ) : (
                inProgressQuotes.map((q) => (
                  <Link
                    className="flex items-center justify-between gap-3 px-6 py-3.5 transition"
                    href={`/quotes/${q.id}`}
                    key={q.id}
                    style={{ borderColor: 'var(--border-faint)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink text-sm">{q.number} · {(q as unknown as { client?: { name: string } }).client?.name ?? '—'}</p>
                      <p className="text-xs text-ink-soft truncate">{(q as unknown as { destination?: string }).destination ?? ''}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`${STATUS_COLOR[q.status] ?? 'chip-borrador'} rounded-full px-2 py-0.5 text-[10px] font-semibold`}>
                        {STATUS_LABEL[q.status] ?? q.status}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </article>

          {/* Top productos */}
          <article
            className="rounded-2xl overflow-hidden"
            style={{ background: 'var(--paper-card)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border-faint)' }}>
              <h2 className="font-semibold text-ink">Más Cotizados</h2>
              <Link className="label-caps text-amber" href="/products">Ver todos</Link>
            </div>
            <div className="space-y-1 p-3">
              {topProducts.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-ink-soft">Aún no hay productos cotizados.</p>
              ) : (
                topProducts.map((product) => (
                  <div
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition"
                    key={product.id}
                    style={{ cursor: 'default' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--surface)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold text-amber"
                      style={{ background: 'rgba(17,67,63,0.8)' }}
                    >
                      {product.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{product.name}</p>
                      <p className="text-xs text-ink-soft">{product.timesQuoted} veces cotizado</p>
                    </div>
                    <span className="shrink-0 font-mono text-sm font-bold text-ink">
                      {formatMoney(product.sellPrice, product.currency)}
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
