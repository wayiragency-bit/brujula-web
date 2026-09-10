import { ArrowUpRight, BarChart3, BriefcaseBusiness, UsersRound } from 'lucide-react';
import { AppShell } from '@/components/app-shell';

const metrics = [
  { label: 'Leads', value: '124', detail: '+12%', trend: 'up' },
  { label: 'Clientes', value: '850', detail: '+5%', trend: 'up' },
  { label: 'Cotizaciones', value: '42', detail: '0%', trend: 'flat' },
  { label: 'Inventario', value: '1.2k', detail: 'SKUs activos', trend: 'neutral' },
] as const;

const products = [
  { initials: 'SK', name: 'Safari Premium Kenya', quotes: 12, amount: 'COP 12.5M', trend: '↑ 4%' },
  { initials: 'BM', name: 'Boutique Hotel Maldivas', quotes: 8, amount: 'COP 18.2M', trend: '—' },
  { initials: 'JP', name: 'Expedición Cultural Japón', quotes: 5, amount: 'COP 9.8M', trend: '↑ 2%' },
];

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-content space-y-8 px-4 pb-28 pt-7 sm:px-6 lg:px-8 lg:pb-10">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="label-caps mb-2 text-ink-soft">DOMINGO, 10 DE AGOSTO DE 2026</p>
            <h1 className="font-display text-[2rem] font-extrabold leading-tight text-ink sm:text-4xl">
              Hola, Juan <span aria-hidden>👋</span>
            </h1>
            <p className="mt-2 text-sm text-ink-soft">Tu agencia está lista para una nueva jornada.</p>
          </div>
          <div className="flex gap-3">
            <button className="button-secondary">Nuevo cliente</button>
            <button className="button-primary">Nueva cotización</button>
          </div>
        </header>

        <section aria-label="Indicadores principales" className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {metrics.map((metric, index) => (
            <article className="metric-card" key={metric.label}>
              <div className="flex items-start justify-between">
                <span className="label-caps text-ink-soft">{metric.label}</span>
                {index === 0 ? <UsersRound className="h-4 w-4 text-ink-soft/60" /> : null}
                {index === 1 ? <BriefcaseBusiness className="h-4 w-4 text-ink-soft/60" /> : null}
                {index === 2 ? <BarChart3 className="h-4 w-4 text-ink-soft/60" /> : null}
              </div>
              <div>
                <strong className="font-mono text-3xl font-bold text-ink">{metric.value}</strong>
                <p
                  className={`mt-1 font-mono text-[11px] font-bold ${
                    metric.trend === 'up'
                      ? 'text-status-accepted'
                      : metric.trend === 'flat'
                        ? 'text-status-expired'
                        : 'uppercase text-ink-soft/60'
                  }`}
                >
                  {metric.trend === 'up' ? '↗ ' : metric.trend === 'flat' ? '→ ' : ''}
                  {metric.detail}
                </p>
              </div>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <article className="boarding-pass overflow-hidden rounded-2xl border border-ink/10 bg-paper-card shadow-floating">
            <div className="p-6 sm:p-8">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="label-caps text-ink-soft">META DE VENTAS</p>
                  <h2 className="mt-2 font-display text-2xl font-extrabold text-ink">Agosto 2026</h2>
                </div>
                <div className="text-right">
                  <p className="label-caps text-ink-soft">PROGRESO</p>
                  <strong className="mt-2 block font-mono text-2xl text-amber">9.6%</strong>
                </div>
              </div>
              <div className="mt-7 h-4 rounded-full border border-ink/10 bg-[#eee9dc] p-0.5">
                <div className="h-full w-[9.6%] min-w-8 rounded-full bg-[#feb23b]" />
              </div>
              <div className="mt-4 flex justify-between gap-4 font-mono text-xs font-bold text-ink">
                <span>COP 4.8M</span>
                <span className="text-ink-soft/60">META: COP 50M</span>
              </div>
            </div>
            <div className="border-t-2 border-dashed border-ink/10 bg-amber/5 px-6 py-5 text-center">
              <button className="button-secondary inline-flex items-center gap-2">
                <BarChart3 className="h-4 w-4" /> Ver reporte detallado
              </button>
            </div>
          </article>

          <article className="rounded-2xl bg-teal p-6 text-paper shadow-card sm:p-8">
            <p className="label-caps text-[#a0d0ca]">PULSO COMERCIAL</p>
            <h2 className="mt-3 font-display text-2xl font-extrabold">3 oportunidades requieren seguimiento</h2>
            <p className="mt-3 text-sm leading-6 text-paper/70">
              Dos cotizaciones vencen hoy y una fue vista por el cliente hace 40 minutos.
            </p>
            <button className="mt-7 inline-flex items-center gap-2 font-mono text-xs font-bold uppercase text-[#feb23b]">
              Abrir pipeline <ArrowUpRight className="h-4 w-4" />
            </button>
          </article>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="label-caps text-ink-soft">INVENTARIO</p>
              <h2 className="mt-1 font-display text-2xl font-extrabold text-ink">Más cotizados</h2>
            </div>
            <button className="font-mono text-xs font-bold text-amber underline underline-offset-4">Ver todos</button>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-3">
            {products.map((product) => (
              <article className="product-row" key={product.name}>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#d9e5df] font-mono text-xs font-bold text-teal">
                  {product.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-ink">{product.name}</h3>
                  <p className="text-sm text-ink-soft">{product.quotes} cotizaciones esta semana</p>
                </div>
                <div className="text-right">
                  <strong className="whitespace-nowrap font-mono text-sm text-ink">{product.amount}</strong>
                  <p className="mt-1 font-mono text-[10px] text-status-accepted">{product.trend}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
