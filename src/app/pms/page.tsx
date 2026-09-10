'use client';

import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { useState, useMemo } from 'react';
import { AppShell } from '@/components/app-shell';
import { useProducts } from '@/hooks/use-products';

const DAY_LABELS = ['LU', 'MA', 'MI', 'JU', 'VI', 'SÁ', 'DO'];
const VIEW_OPTIONS = [12, 24, 48, 100] as const;

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getDayLabel(year: number, month: number, day: number) {
  const dow = new Date(year, month, day).getDay();
  return DAY_LABELS[dow === 0 ? 6 : dow - 1];
}

const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function PmsPage() {
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [view, setView]   = useState<(typeof VIEW_OPTIONS)[number]>(12);

  const { data: productsData, isLoading } = useProducts({ page: 1, limit: 20 });
  const products = useMemo(() => (productsData?.data ?? []).slice(0, 20), [productsData]);

  const totalDays = getDaysInMonth(year, month);
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);
  const visibleDays = days.slice(0, view);

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  const isToday = (d: number) => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  const isWeekend = (d: number) => { const dow = new Date(year, month, d).getDay(); return dow === 0 || dow === 6; };

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-content space-y-6 px-4 pb-28 pt-7 sm:px-6 lg:px-8 lg:pb-10">

        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-amber" />
              <h1 className="font-display text-3xl font-extrabold text-ink">Calendario PMS</h1>
            </div>
            <p className="mt-1 text-sm text-ink-soft">Gestiona la ocupación y reservas de tus servicios.</p>
          </div>

          {/* Month nav */}
          <div className="flex items-center gap-3">
            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg transition"
              onClick={prevMonth}
              style={{ background: 'var(--border-faint)', border: '1px solid rgba(255,255,255,0.1)' }}
              type="button"
            >
              <ChevronLeft className="h-4 w-4 text-ink" />
            </button>
            <span className="min-w-[140px] text-center font-semibold text-ink">
              {MONTH_NAMES[month]} {year}
            </span>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-lg transition"
              onClick={nextMonth}
              style={{ background: 'var(--border-faint)', border: '1px solid rgba(255,255,255,0.1)' }}
              type="button"
            >
              <ChevronRight className="h-4 w-4 text-ink" />
            </button>
            <button
              className="rounded-lg px-3 py-1.5 text-sm font-semibold text-amber transition"
              onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); }}
              style={{ background: 'rgba(254,178,59,0.10)', border: '1px solid rgba(254,178,59,0.2)' }}
              type="button"
            >
              Hoy
            </button>
          </div>
        </header>

        {/* View selector */}
        <div className="flex items-center gap-2">
          <span className="label-caps text-ink-soft">VER:</span>
          {VIEW_OPTIONS.map((v) => (
            <button
              className="rounded-lg px-3 py-1 text-sm font-semibold transition"
              key={v}
              onClick={() => setView(v)}
              style={
                view === v
                  ? { background: '#feb23b', color: '#0d1117' }
                  : { background: 'var(--border-faint)', color: 'var(--ink-soft)', border: '1px solid var(--border)' }
              }
              type="button"
            >
              {v}
            </button>
          ))}
        </div>

        {/* Calendar grid */}
        <div
          className="overflow-x-auto rounded-2xl"
          style={{ background: 'var(--paper-card)', border: '1px solid var(--border)' }}
        >
          <table className="w-full min-w-max border-collapse text-sm">
            <thead>
              <tr>
                <th
                  className="sticky left-0 z-10 px-4 py-3 text-left label-caps text-ink-soft"
                  style={{ background: 'var(--paper-card)', borderBottom: '1px solid var(--border)', minWidth: '200px' }}
                >
                  PRODUCTO / SERVICIO
                </th>
                {visibleDays.map((d) => (
                  <th
                    className="px-2 py-3 text-center label-caps"
                    key={d}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      borderLeft: '1px solid var(--border-faint)',
                      minWidth: '42px',
                      color: isToday(d) ? '#feb23b' : isWeekend(d) ? '#3d5070' : 'var(--ink-soft)',
                    }}
                  >
                    <div>{getDayLabel(year, month, d)}</div>
                    <div
                      className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full mx-auto font-mono text-xs font-bold"
                      style={isToday(d) ? { background: '#feb23b', color: '#0d1117' } : {}}
                    >
                      {d}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="px-4 py-8 text-center text-ink-soft" colSpan={visibleDays.length + 1}>Cargando productos…</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-ink-soft" colSpan={visibleDays.length + 1}>No hay productos configurados.</td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr
                    key={product.id}
                    style={{ borderBottom: '1px solid var(--border-faint)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ''; }}
                  >
                    <td
                      className="sticky left-0 z-10 px-4 py-3"
                      style={{ background: 'inherit' }}
                    >
                      <p className="font-medium text-ink">{product.name}</p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span className="label-caps text-ink-muted">Producto / Servicio</span>
                        <span
                          className="rounded-full px-2 py-0.5 label-caps"
                          style={{ background: 'rgba(14,165,233,0.12)', color: '#38bdf8' }}
                        >
                          Ilimitado
                        </span>
                      </div>
                    </td>
                    {visibleDays.map((d) => (
                      <td
                        key={d}
                        style={{
                          borderLeft: '1px solid var(--surface)',
                          background: isWeekend(d) ? 'rgba(255,255,255,0.01)' : undefined,
                        }}
                      />
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Reservas web pendientes */}
        <article
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--paper-card)', border: '1px solid var(--border)' }}
        >
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: '1px solid var(--border-faint)' }}
          >
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-amber" />
              <h2 className="font-semibold text-ink">Reservas Web Pendientes</h2>
            </div>
            <span
              className="rounded-full px-2.5 py-1 label-caps"
              style={{ background: 'rgba(254,178,59,0.12)', color: '#feb23b' }}
            >
              0 Pendiente
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px] text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-faint)' }}>
                  {['CLIENTE', 'PRODUCTO', 'FECHAS', 'TOTAL', 'ACCIONES'].map((h) => (
                    <th className="label-caps px-6 py-3 text-left text-ink-soft" key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-6 py-10 text-center text-ink-soft" colSpan={5}>
                    <CalendarDays className="mx-auto mb-2 h-8 w-8 opacity-20" />
                    No hay solicitudes de reserva web pendientes.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>

      </div>
    </AppShell>
  );
}
