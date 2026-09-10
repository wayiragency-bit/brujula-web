'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, BarChart3, BriefcaseBusiness, FileText } from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import type { Paginated, Product, Quote, QuoteListSummaryRow } from '@/lib/types';

const ACCEPTED_LIKE = new Set(['ACEPTADA', 'ABONADA', 'PAGADA']);

function formatMoney(value: number, currency = 'COP'): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency, notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

export default function DashboardPage() {
  const { user, hasPermission } = useAuth();

  const { data: clients } = useQuery({ queryKey: ['dashboard', 'clients'], queryFn: () => api.get<Paginated<unknown>>('/clients?limit=1') });
  const { data: products } = useQuery({ queryKey: ['dashboard', 'products'], queryFn: () => api.get<Paginated<Product>>('/products?limit=50') });
  const { data: quotes } = useQuery({
    queryKey: ['dashboard', 'quotes'],
    queryFn: () => api.get<Paginated<Quote> & { summary: QuoteListSummaryRow[] }>('/quotes?limit=1'),
  });

  const currency = quotes?.summary[0]?.currency ?? 'COP';
  const totalQuoted = quotes?.summary.reduce((sum, row) => sum + Number(row.total), 0) ?? 0;
  const totalAccepted = quotes?.summary.filter((r) => ACCEPTED_LIKE.has(r.status)).reduce((sum, row) => sum + Number(row.total), 0) ?? 0;
  const pendingCount = quotes?.summary.find((r) => r.status === 'ENVIADA')?.count ?? 0;
  const totalMargin = hasPermission('quotes.view_financial')
    ? quotes?.summary.filter((r) => ACCEPTED_LIKE.has(r.status)).reduce((sum, row) => sum + Number(row.marginTotal ?? 0), 0) ?? 0
    : null;

  const topProducts = [...(products?.data ?? [])].sort((a, b) => b.timesQuoted - a.timesQuoted).slice(0, 3);

  const metrics = [
    { label: 'Clientes', value: String(clients?.meta.total ?? '—') },
    { label: 'Cotizaciones', value: String(quotes?.meta.total ?? '—') },
    { label: 'Inventario', value: String(products?.meta.total ?? '—'), detail: 'SKUs activos' },
    ...(totalMargin !== null ? [{ label: 'Ganancia Estimada', value: formatMoney(totalMargin, currency), accent: true }] : []),
  ];

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-content space-y-8 px-4 pb-28 pt-7 sm:px-6 lg:px-8 lg:pb-10">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="label-caps mb-2 text-ink-soft">{new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}</p>
            <h1 className="font-display text-[2rem] font-extrabold leading-tight text-ink sm:text-4xl">
              Hola, {user?.name.split(' ')[0] ?? ''} <span aria-hidden>👋</span>
            </h1>
            <p className="mt-2 text-sm text-ink-soft">Tu agencia está lista para una nueva jornada.</p>
          </div>
          <div className="flex gap-3">
            <Link className="button-secondary" href="/clients">Nuevo cliente</Link>
            <Link className="button-primary" href="/quotes/new">Nueva cotización</Link>
          </div>
        </header>

        <section aria-label="Indicadores principales" className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {metrics.map((metric, index) => (
            <article className="metric-card" key={metric.label}>
              <div className="flex items-start justify-between">
                <span className="label-caps text-ink-soft">{metric.label}</span>
                {index === 0 ? <BriefcaseBusiness className="h-4 w-4 text-ink-soft/60" /> : null}
                {index === 1 ? <FileText className="h-4 w-4 text-ink-soft/60" /> : null}
                {index === 2 ? <BarChart3 className="h-4 w-4 text-ink-soft/60" /> : null}
              </div>
              <strong className={`font-mono text-3xl font-bold ${'accent' in metric && metric.accent ? 'text-status-accepted' : 'text-ink'}`}>{metric.value}</strong>
              {'detail' in metric && metric.detail ? <p className="mt-1 font-mono text-[11px] font-bold uppercase text-ink-soft/60">{metric.detail}</p> : null}
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <article className="overflow-hidden rounded-2xl border border-ink/10 bg-paper-card shadow-floating">
            <div className="p-6 sm:p-8">
              <p className="label-caps text-ink-soft">DESEMPEÑO COMERCIAL</p>
              <h2 className="mt-2 font-display text-2xl font-extrabold text-ink">Cotizado vs. Aceptado</h2>
              <div className="mt-7 h-4 rounded-full border border-ink/10 bg-[#eee9dc] p-0.5">
                <div className="h-full min-w-8 rounded-full bg-[#feb23b]" style={{ width: `${totalQuoted > 0 ? Math.min(100, (totalAccepted / totalQuoted) * 100) : 0}%` }} />
              </div>
              <div className="mt-4 flex justify-between gap-4 font-mono text-xs font-bold text-ink">
                <span>{formatMoney(totalAccepted, currency)} aceptado</span>
                <span className="text-ink-soft/60">DE {formatMoney(totalQuoted, currency)} COTIZADO</span>
              </div>
            </div>
            <div className="border-t-2 border-dashed border-ink/10 bg-amber/5 px-6 py-5 text-center">
              <Link className="button-secondary inline-flex items-center gap-2" href="/quotes">
                <BarChart3 className="h-4 w-4" /> Ver todas las cotizaciones
              </Link>
            </div>
          </article>

          <article className="rounded-2xl bg-teal p-6 text-paper shadow-card sm:p-8">
            <p className="label-caps text-[#a0d0ca]">PULSO COMERCIAL</p>
            <h2 className="mt-3 font-display text-2xl font-extrabold">
              {pendingCount} {pendingCount === 1 ? 'cotización enviada' : 'cotizaciones enviadas'}
            </h2>
            <p className="mt-3 text-sm leading-6 text-paper/70">Esperando respuesta del cliente. Da seguimiento desde el pipeline.</p>
            <Link className="mt-7 inline-flex items-center gap-2 font-mono text-xs font-bold uppercase text-[#feb23b]" href="/pipeline">
              Abrir pipeline <ArrowUpRight className="h-4 w-4" />
            </Link>
          </article>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="label-caps text-ink-soft">INVENTARIO</p>
              <h2 className="mt-1 font-display text-2xl font-extrabold text-ink">Más cotizados</h2>
            </div>
            <Link className="font-mono text-xs font-bold text-amber underline underline-offset-4" href="/products">Ver todos</Link>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-3">
            {topProducts.length === 0 ? (
              <p className="text-sm text-ink-soft">Aún no hay productos cotizados.</p>
            ) : (
              topProducts.map((product) => (
                <article className="product-row" key={product.id}>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#d9e5df] font-mono text-xs font-bold text-teal">
                    {product.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-ink">{product.name}</h3>
                    <p className="text-sm text-ink-soft">{product.timesQuoted} cotizaciones totales</p>
                  </div>
                  <div className="text-right">
                    <strong className="whitespace-nowrap font-mono text-sm text-ink">{formatMoney(product.sellPrice, product.currency)}</strong>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
