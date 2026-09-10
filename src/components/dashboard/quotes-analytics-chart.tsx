'use client';

import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useQuoteAnalytics } from '@/hooks/use-dashboard';
import { formatMoney, formatMoneyFull } from '@/lib/format';
import type { AnalyticsGranularity } from '@/lib/types';

const WINDOW_OPTIONS = [2, 3, 6, 12] as const;

const SERIES = [
  { key: 'enCurso', label: 'En Curso', color: '#f59e0b' },
  { key: 'aceptado', label: 'Total Aceptado', color: '#10b981' },
  { key: 'cotizado', label: 'Total Cotizado', color: '#6366f1' },
] as const;

function bucketLabel(iso: string, granularity: AnalyticsGranularity): string {
  const d = new Date(iso);
  return granularity === 'day'
    ? d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
    : d.toLocaleDateString('es-CO', { month: 'short' }).toUpperCase();
}

function ChartTooltip({ active, payload, label, currency }: { active?: boolean; payload?: { dataKey: string; value: number }[]; label?: string; currency: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg p-3 text-xs" style={{ background: 'var(--paper-elevated)', border: '1px solid var(--border)' }}>
      <p className="label-caps mb-1.5 text-ink-soft">{label}</p>
      {SERIES.map((s) => {
        const row = payload.find((p) => p.dataKey === s.key);
        if (!row) return null;
        return (
          <p className="flex items-center justify-between gap-4" key={s.key}>
            <span className="flex items-center gap-1.5 text-ink-soft">
              <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
              {s.label}
            </span>
            <span className="font-mono font-semibold text-ink">{formatMoneyFull(row.value, currency)}</span>
          </p>
        );
      })}
    </div>
  );
}

export function QuotesAnalyticsChart() {
  const [granularity, setGranularity] = useState<AnalyticsGranularity>('month');
  const [window, setWindow] = useState<2 | 3 | 6 | 12>(2);
  const { data, isLoading } = useQuoteAnalytics({ granularity, window });

  const chartData = useMemo(
    () => (data?.buckets ?? []).map((bucket) => ({ ...bucket, label: bucketLabel(bucket.date, granularity) })),
    [data, granularity],
  );
  const currency = data?.currency ?? 'COP';

  return (
    <article className="rounded-2xl p-6 sm:p-7" style={{ background: 'var(--paper-card)', border: '1px solid var(--border)' }}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-ink">Análisis de Cotizaciones</h2>
          <p className="mt-1 text-xs text-ink-soft">Total Cotizado vs Aceptado ({window} meses)</p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex rounded-lg p-0.5" style={{ background: 'var(--surface)' }}>
            {(['day', 'month'] as const).map((g) => (
              <button
                className="rounded-md px-2.5 py-1 text-xs font-semibold transition"
                key={g}
                onClick={() => setGranularity(g)}
                style={granularity === g ? { background: 'var(--paper-elevated)', color: 'var(--ink)' } : { color: 'var(--ink-muted)' }}
                type="button"
              >
                {g === 'day' ? 'D' : 'M'}
              </button>
            ))}
          </div>
          <div className="flex rounded-lg p-0.5" style={{ background: 'var(--surface)' }}>
            {WINDOW_OPTIONS.map((w) => (
              <button
                className="rounded-md px-2.5 py-1 text-xs font-semibold transition"
                key={w}
                onClick={() => setWindow(w)}
                style={window === w ? { background: 'var(--paper-elevated)', color: 'var(--ink)' } : { color: 'var(--ink-muted)' }}
                type="button"
              >
                {w}M
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-4">
        {SERIES.map((s) => (
          <span className="flex items-center gap-1.5 text-xs text-ink-soft" key={s.key}>
            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
            {s.label}
          </span>
        ))}
      </div>

      <div className="mt-4 h-64 w-full">
        {isLoading ? (
          <div className="flex h-full items-center justify-center text-sm text-ink-soft">Cargando…</div>
        ) : chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-ink-soft">Aún no hay cotizaciones en este período.</div>
        ) : (
          <ResponsiveContainer height="100%" width="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                {SERIES.map((s) => (
                  <linearGradient id={`grad-${s.key}`} key={s.key} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor={s.color} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={s.color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid stroke="var(--border-faint)" strokeDasharray="3 3" vertical={false} />
              <XAxis axisLine={false} dataKey="label" tick={{ fill: 'var(--ink-muted)', fontSize: 11 }} tickLine={false} />
              <YAxis
                axisLine={false}
                tick={{ fill: 'var(--ink-muted)', fontSize: 11 }}
                tickFormatter={(v: number) => formatMoney(v, currency)}
                tickLine={false}
                width={56}
              />
              <Tooltip content={<ChartTooltip currency={currency} />} />
              {SERIES.map((s) => (
                <Area
                  dataKey={s.key}
                  fill={`url(#grad-${s.key})`}
                  key={s.key}
                  stroke={s.color}
                  strokeWidth={2}
                  type="monotone"
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </article>
  );
}
