'use client';

import { useQuery } from '@tanstack/react-query';
import { FileText, Package, Plus, TrendingUp, UserPlus, Users } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Pager } from '@/components/dashboard/pager';
import { QuotesAnalyticsChart } from '@/components/dashboard/quotes-analytics-chart';
import { SalesGoalEditor } from '@/components/dashboard/sales-goal-editor';
import { useAgency } from '@/hooks/use-agency';
import { useTeam } from '@/hooks/use-team';
import { useQuotes } from '@/hooks/use-quotes';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { formatMoney, formatMoneyFull } from '@/lib/format';
import type { Paginated, Product, ProductType, Quote, QuoteListSummaryRow, QuoteStatus } from '@/lib/types';

const ACCEPTED_LIKE = new Set<QuoteStatus>(['ACEPTADA', 'ABONADA', 'PAGADA']);
const IN_PROGRESS: QuoteStatus[] = ['ENVIADA', 'ACEPTADA', 'ABONADA'];

const PRODUCT_TYPE_LABEL: Record<ProductType, string> = {
  HOTEL: 'Hotel', TOUR: 'Tour', TRANSPORT: 'Traslado', FLIGHT: 'Vuelo',
  INSURANCE: 'Seguro', EXPERIENCE: 'Experiencia', OTHER: 'Servicio',
};

const RANK_COLORS = ['#f59e0b', '#94a3b8', '#fb923c'];

/* Decorative mini area line — takes 6 relative y-values 0-40, smooth curve with soft fill */
function Sparkline({ points, color = '#feb23b' }: { points: number[]; color?: string }) {
  const w = 96; const h = 40; const n = points.length;
  const xs = points.map((_, i) => (i / (n - 1)) * w);
  const ys = points.map((v) => h - v);

  let linePath = `M ${xs[0]},${ys[0]}`;
  for (let i = 1; i < n; i++) {
    const midX = (xs[i - 1] + xs[i]) / 2;
    linePath += ` C ${midX},${ys[i - 1]} ${midX},${ys[i]} ${xs[i]},${ys[i]}`;
  }
  const areaPath = `${linePath} L ${xs[n - 1]},${h} L ${xs[0]},${h} Z`;

  return (
    <svg className="shrink-0" fill="none" height={h} viewBox={`0 0 ${w} ${h}`} width={w}>
      <path className="metric-area" d={areaPath} fill={color} stroke="none" />
      <path className="metric-line" d={linePath} fill="none" pathLength={100} stroke={color} strokeLinecap="round" strokeWidth={2} />
      <circle cx={xs[n - 1]} cy={ys[n - 1]} fill={color} r={3} />
    </svg>
  );
}

const SPARKLINES = [
  [10, 18, 14, 24, 20, 30],
  [20, 16, 28, 22, 32, 27],
  [12, 20, 16, 24, 18, 26],
  [8,  22, 18, 30, 26, 34],
  [16, 24, 14, 28, 20, 32],
];

const STATUS_LABEL: Record<string, string> = {
  ENVIADA: 'Enviada', ACEPTADA: 'Aceptada', ABONADA: 'Abonada',
  PAGADA: 'Pagada', RECHAZADA: 'Rechazada', VENCIDA: 'Vencida', BORRADOR: 'Borrador',
};
const STATUS_COLOR: Record<string, string> = {
  ENVIADA: 'chip-enviada', ACEPTADA: 'chip-aceptada', ABONADA: 'chip-abonada',
  PAGADA: 'chip-pagada', RECHAZADA: 'chip-rechazada', VENCIDA: 'chip-vencida', BORRADOR: 'chip-borrador',
};

function startOfMonthIso(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '—';
}

const AVATAR_COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#a855f7', '#ec4899', '#6366f1'];

export default function DashboardPage() {
  const { user, hasPermission } = useAuth();
  const { data: agency } = useAgency();

  const { data: leads } = useQuery({
    queryKey: ['dashboard', 'leads'],
    queryFn: () => api.get<Paginated<unknown>>(`/clients?limit=1&createdFrom=${encodeURIComponent(startOfMonthIso())}`),
  });
  const { data: clients } = useQuery({ queryKey: ['dashboard', 'clients'], queryFn: () => api.get<Paginated<unknown>>('/clients?limit=1') });
  const { data: products } = useQuery({ queryKey: ['dashboard', 'products'], queryFn: () => api.get<Paginated<Product>>('/products?limit=50') });
  const { data: quotes } = useQuery({
    queryKey: ['dashboard', 'quotes'],
    queryFn: () => api.get<Paginated<Quote> & { summary: QuoteListSummaryRow[] }>('/quotes?limit=1'),
  });

  const [inProgressPage, setInProgressPage] = useState(1);
  const { data: inProgressQuotes } = useQuotes({ statuses: IN_PROGRESS, sort: 'updatedAt', order: 'DESC', page: inProgressPage, limit: 4 });

  const [recentPage, setRecentPage] = useState(1);
  const { data: recentQuotes } = useQuotes({ sort: 'updatedAt', order: 'DESC', page: recentPage, limit: 4 });

  const [agentsPage, setAgentsPage] = useState(1);
  const { data: team } = useTeam();

  const currency = agency?.baseCurrency ?? 'COP';
  const summaryInCurrency = (quotes?.summary ?? []).filter((row) => row.currency === currency);
  const totalQuoted   = summaryInCurrency.reduce((sum, row) => sum + Number(row.total), 0);
  const totalAccepted = summaryInCurrency.filter((r) => ACCEPTED_LIKE.has(r.status)).reduce((sum, row) => sum + Number(row.total), 0);
  const pendingCount  = summaryInCurrency.find((r) => r.status === 'ENVIADA')?.count ?? 0;
  const acceptedCount = summaryInCurrency.filter((r) => ACCEPTED_LIKE.has(r.status)).reduce((s, r) => s + r.count, 0);
  const totalMargin   = hasPermission('quotes.view_financial')
    ? summaryInCurrency.filter((r) => ACCEPTED_LIKE.has(r.status)).reduce((sum, row) => sum + Number(row.marginTotal ?? 0), 0)
    : null;
  const totalLeads    = leads?.meta.total ?? 0;
  const totalClients  = clients?.meta.total ?? 0;
  const totalQuoteCount = quotes?.meta.total ?? 0;

  const topProducts = [...(products?.data ?? [])].sort((a, b) => b.timesQuoted - a.timesQuoted).slice(0, 3);

  const goal = Number(agency?.monthlySalesGoal ?? 0);
  const pct = goal > 0 ? Math.min(100, (totalAccepted / goal) * 100) : 0;

  const sortedAgents = [...(team ?? [])].sort((a, b) => b.sold - a.sold);
  const agentsPerPage = 4;
  const agentsTotalPages = Math.max(1, Math.ceil(sortedAgents.length / agentsPerPage));
  const visibleAgents = sortedAgents.slice((agentsPage - 1) * agentsPerPage, agentsPage * agentsPerPage);

  const metrics = [
    { label: 'Nuevos Leads', value: String(totalLeads),    icon: UserPlus, spark: SPARKLINES[0], iconBg: '#06b6d4', iconShadow: 'rgba(6,182,212,0.4)', sub: 'Este mes' },
    { label: 'Total Clientes', value: String(totalClients), icon: Users,   spark: SPARKLINES[1], iconBg: '#10b981', iconShadow: 'rgba(16,185,129,0.4)', sub: 'Cartera activa' },
    { label: 'Cotizaciones',  value: String(totalQuoteCount), icon: FileText, spark: SPARKLINES[2], iconBg: '#f59e0b', iconShadow: 'rgba(245,158,11,0.4)', sub: `${pendingCount} enviadas` },
    ...(totalMargin !== null
      ? [{ label: 'Ganancia', value: formatMoney(totalMargin, currency), icon: TrendingUp, spark: SPARKLINES[4], iconBg: '#ec4899', iconShadow: 'rgba(236,72,153,0.4)', sub: 'Cotizaciones aceptadas' }]
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
        <section
          aria-label="Indicadores principales"
          className={`grid grid-cols-2 gap-5 sm:grid-cols-3 ${metrics.length === 4 ? 'xl:grid-cols-4' : 'xl:grid-cols-3'}`}
        >
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <article className="glass-card rounded-2xl p-6 transition hover:brightness-110" key={metric.label}>
                <div className="mb-4 flex items-center gap-4">
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white transition-transform duration-300 hover:scale-110"
                    style={{ background: metric.iconBg, boxShadow: `0 4px 12px ${metric.iconShadow}` }}
                  >
                    <Icon className="h-7 w-7" />
                  </div>
                  <div className="min-w-0">
                    <p className="label-caps text-[11px] text-ink-soft">{metric.label}</p>
                    <strong className="font-mono text-3xl font-bold leading-tight text-ink">{metric.value}</strong>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-md px-2 py-1 text-xs font-semibold text-ink-soft" style={{ background: 'var(--surface)' }}>
                    ↗ {metric.sub}
                  </span>
                  <Sparkline color={metric.iconBg} points={metric.spark} />
                </div>
              </article>
            );
          })}
        </section>

        {/* Cuerpo principal: columna izquierda (ventas/gráfico/en curso) + derecha (productos/cotizaciones/agentes) */}
        <section className="grid items-start gap-6 xl:grid-cols-[1fr_1.6fr]">

          {/* Columna izquierda */}
          <div className="space-y-6">

            {/* Ventas del mes */}
            <article
              className="relative rounded-2xl p-6 sm:p-7"
              style={{ background: 'var(--paper-card)', border: '1px solid var(--border)' }}
            >
              <div className="pr-32 sm:pr-36">
                <p className="label-caps text-ink-soft">
                  VENTAS DE {new Date().toLocaleDateString('es-CO', { month: 'long' }).toUpperCase()}
                </p>
                <p className="mt-2 font-mono text-3xl font-extrabold text-ink">{formatMoneyFull(totalAccepted, currency)}</p>
                <p className="mt-1 text-sm text-ink-soft">de {formatMoneyFull(totalQuoted, currency)} cotizados</p>
              </div>

              <SalesGoalEditor canEdit={hasPermission('settings.edit_agency')} currency={currency} goal={goal} />

              {/* Progress bar */}
              <div className="mt-5">
                <div className="h-2.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--border-faint)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899)' }}
                  />
                </div>
                <div className="mt-2 flex justify-between">
                  <span className="font-mono text-xs font-bold" style={{ color: '#a855f7' }}>{pct.toFixed(1)}% de la meta</span>
                  <span className="label-caps text-ink-muted">{acceptedCount} aceptadas · {pendingCount} enviadas</span>
                </div>
              </div>
            </article>

            {/* Análisis de cotizaciones */}
            <QuotesAnalyticsChart />

            {/* En Curso */}
            <article className="overflow-hidden rounded-2xl" style={{ background: 'var(--paper-card)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border-faint)' }}>
                <h2 className="font-semibold text-ink">En Curso</h2>
                <Pager onChange={setInProgressPage} page={inProgressPage} totalPages={inProgressQuotes?.meta.totalPages ?? 1} />
              </div>
              <div className="divide-y" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
                {(inProgressQuotes?.data.length ?? 0) === 0 ? (
                  <p className="px-6 py-8 text-center text-sm text-ink-soft">No hay cotizaciones en curso.</p>
                ) : (
                  inProgressQuotes!.data.map((q) => (
                    <Link
                      className="flex items-center justify-between gap-3 px-6 py-3.5 transition hover:bg-white/[0.03]"
                      href={`/quotes/${q.id}`}
                      key={q.id}
                      style={{ borderColor: 'var(--border-faint)' }}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{q.number} · {q.client?.name ?? '—'}</p>
                        <p className="truncate text-xs text-ink-soft">{q.destination}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-ink">{formatMoneyFull(Number(q.total), q.currency)}</span>
                        <span className={`${STATUS_COLOR[q.status] ?? 'chip-borrador'} rounded-full px-2 py-0.5 text-[10px] font-semibold`}>
                          {STATUS_LABEL[q.status] ?? q.status}
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
              <div className="flex items-center justify-between px-6 py-3.5" style={{ borderTop: '1px solid var(--border-faint)', background: 'var(--surface)' }}>
                <span className="label-caps text-ink-muted">Total en curso</span>
                <span className="font-mono text-sm font-bold text-ink">
                  {formatMoneyFull(summaryInCurrency.filter((r) => IN_PROGRESS.includes(r.status)).reduce((s, r) => s + Number(r.total), 0), currency)}
                </span>
              </div>
            </article>
          </div>

          {/* Columna derecha */}
          <div className="space-y-6">

            {/* Top productos */}
            <article className="overflow-hidden rounded-2xl" style={{ background: 'var(--paper-card)', border: '1px solid var(--border)' }}>
              <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border-faint)' }}>
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-ink">Top 3 Productos del Mes</h2>
                  <Link className="label-caps text-amber" href="/products">Ver Inventario</Link>
                </div>
                <p className="mt-1 text-xs text-ink-soft">Los servicios más solicitados en tus cotizaciones.</p>
              </div>
              <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
                {topProducts.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-ink-soft">Aún no hay productos cotizados.</p>
                ) : (
                  topProducts.map((product, i) => (
                    <div className="rounded-xl p-3" key={product.id} style={{ background: 'var(--surface)', border: '1px solid var(--border-faint)' }}>
                      <div className="mb-2 flex min-w-0 items-center gap-2">
                        <span
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                          style={{ background: RANK_COLORS[i] ?? RANK_COLORS[2] }}
                        >
                          #{i + 1}
                        </span>
                        <span className="label-caps truncate text-ink-muted">{PRODUCT_TYPE_LABEL[product.type] ?? 'Servicio'}</span>
                      </div>
                      <div className="relative h-24 w-full overflow-hidden rounded-lg" style={{ background: 'var(--paper-elevated)' }}>
                        {product.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img alt={product.name} className="h-full w-full object-cover" src={product.imageUrl} />
                        ) : (
                          <div className="flex h-full items-center justify-center"><Package className="h-6 w-6 text-ink-muted" /></div>
                        )}
                      </div>
                      <p className="mt-3 truncate text-sm font-medium text-ink">{product.name}</p>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-xs text-ink-soft">{product.timesQuoted} Ventas</span>
                        <span className="font-mono text-sm font-bold text-ink">{formatMoney(product.sellPrice, product.currency)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>

            {/* Últimas cotizaciones + Top agentes */}
            <div className="grid gap-6 sm:grid-cols-2">

              {/* Últimas cotizaciones */}
              <article className="overflow-hidden rounded-2xl" style={{ background: 'var(--paper-card)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border-faint)' }}>
                  <h2 className="font-semibold text-ink">Últimas Cotizaciones</h2>
                  <Pager onChange={setRecentPage} page={recentPage} totalPages={recentQuotes?.meta.totalPages ?? 1} />
                </div>
                <div className="divide-y" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
                  {(recentQuotes?.data.length ?? 0) === 0 ? (
                    <p className="px-6 py-8 text-center text-sm text-ink-soft">Aún no hay cotizaciones.</p>
                  ) : (
                    recentQuotes!.data.map((q) => (
                      <Link
                        className="flex items-center gap-3 px-6 py-3.5 transition hover:bg-white/[0.03]"
                        href={`/quotes/${q.id}`}
                        key={q.id}
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: 'var(--surface)' }}>
                          <FileText className="h-4 w-4 text-ink-soft" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink">{q.client?.name ?? '—'}</p>
                          <p className="text-xs text-ink-soft">{q.number} · {new Date(q.updatedAt).toLocaleDateString('es-CO')}</p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <span className="font-mono text-sm font-semibold text-ink">{formatMoneyFull(Number(q.total), q.currency)}</span>
                          <span className={`${STATUS_COLOR[q.status] ?? 'chip-borrador'} rounded-full px-2 py-0.5 text-[10px] font-semibold`}>
                            {STATUS_LABEL[q.status] ?? q.status}
                          </span>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </article>

              {/* Top agentes */}
              <article className="overflow-hidden rounded-2xl" style={{ background: 'var(--paper-card)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border-faint)' }}>
                  <h2 className="font-semibold text-ink">Top Agentes</h2>
                  <Pager onChange={setAgentsPage} page={agentsPage} totalPages={agentsTotalPages} />
                </div>
                <div className="divide-y" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
                  {visibleAgents.length === 0 ? (
                    <p className="px-6 py-8 text-center text-sm text-ink-soft">Aún no hay agentes con ventas.</p>
                  ) : (
                    visibleAgents.map((agent, i) => (
                      <div className="flex items-center gap-3 px-6 py-3" key={agent.id}>
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{ background: AVATAR_COLORS[(agentsPage - 1) * agentsPerPage + i] ?? AVATAR_COLORS[0] }}
                        >
                          {initials(agent.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-ink">{agent.name}</p>
                          <p className="text-xs text-ink-soft">Agente</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="font-mono text-sm font-bold" style={{ color: '#22c55e' }}>{formatMoney(agent.sold, currency)}</p>
                          <p className="label-caps text-ink-muted">Generado</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </article>
            </div>
          </div>
        </section>

      </div>
    </AppShell>
  );
}
