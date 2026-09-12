'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useQuotes } from '@/hooks/use-quotes';
import { useAuth } from '@/lib/auth-context';
import { quoteStatusLabel } from '@/lib/on-vacation-status';
import type { AgencyType, QuoteStatus } from '@/lib/types';

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const ALL_STATUSES: QuoteStatus[] = ['BORRADOR', 'ENVIADA', 'ACEPTADA', 'ABONADA', 'PAGADA', 'RECHAZADA', 'VENCIDA'];
const ACCEPTED_LIKE: QuoteStatus[] = ['ACEPTADA', 'ABONADA', 'PAGADA'];

const STATUS_COLORS: Record<QuoteStatus, string> = {
  BORRADOR: '#94a3b8', ENVIADA: '#3b82f6', ACEPTADA: '#10b981', ABONADA: '#0ea5e9',
  PAGADA: '#06b6d4', RECHAZADA: '#ef4444', VENCIDA: '#f59e0b',
};

function formatMoney(value: number, currency: string): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
}

function pad(n: number): string { return String(n).padStart(2, '0'); }

function StatTile({ label, count, value, currency, color }: { label: string; count: number; value: number; currency: string; color: string }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--paper-card)', border: '1px solid var(--border-faint)' }}>
      <p className="label-caps text-ink-soft" style={{ fontSize: '10px' }}>{label}</p>
      <p className="mt-1 font-mono text-lg font-extrabold" style={{ color }}>{formatMoney(value, currency)}</p>
      <p className="mt-0.5 text-xs text-ink-muted">{count} cotización{count === 1 ? '' : 'es'}</p>
    </div>
  );
}

function ChartTooltip({ active, payload, currency, agencyType }: { active?: boolean; payload?: { payload: { status: QuoteStatus; count: number; total: number } }[]; currency: string; agencyType: AgencyType | null | undefined }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-lg p-3 text-xs" style={{ background: 'var(--paper-elevated)', border: '1px solid var(--border)' }}>
      <p className="label-caps mb-1 text-ink-soft">{quoteStatusLabel(row.status, agencyType)}</p>
      <p className="font-mono font-semibold text-ink">{formatMoney(row.total, currency)}</p>
      <p className="text-ink-muted">{row.count} cotización{row.count === 1 ? '' : 'es'}</p>
    </div>
  );
}

export function PipelineHistoryView() {
  const { user } = useAuth();
  const agencyType = user?.agency?.type;
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const lastDay = new Date(year, month, 0).getDate();
  const createdFrom = `${year}-${pad(month)}-01`;
  const createdTo = `${year}-${pad(month)}-${pad(lastDay)}`;

  const { data, isLoading } = useQuotes({ page: 1, limit: 1, createdFrom, createdTo });

  function shiftMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m > 12) { m = 1; y += 1; }
    if (m < 1) { m = 12; y -= 1; }
    setMonth(m);
    setYear(y);
  }

  const { rows, currency, totalCount, totalValue, acceptedValue, acceptedCount, rejectedValue, rejectedCount, expiredValue, expiredCount } = useMemo(() => {
    const summary = data?.summary ?? [];
    const currency = summary[0]?.currency ?? 'COP';
    const byStatus = new Map<QuoteStatus, { count: number; total: number }>();
    ALL_STATUSES.forEach((s) => byStatus.set(s, { count: 0, total: 0 }));
    summary.forEach((row) => {
      const entry = byStatus.get(row.status) ?? { count: 0, total: 0 };
      entry.count += row.count;
      entry.total += Number(row.total);
      byStatus.set(row.status, entry);
    });
    const rows = ALL_STATUSES.map((status) => ({ status, ...byStatus.get(status)! }));
    const totalCount = rows.reduce((a, r) => a + r.count, 0);
    const totalValue = rows.reduce((a, r) => a + r.total, 0);
    const acceptedRows = rows.filter((r) => ACCEPTED_LIKE.includes(r.status));
    const acceptedValue = acceptedRows.reduce((a, r) => a + r.total, 0);
    const acceptedCount = acceptedRows.reduce((a, r) => a + r.count, 0);
    const rejected = byStatus.get('RECHAZADA')!;
    const expired = byStatus.get('VENCIDA')!;
    return {
      rows, currency, totalCount, totalValue,
      acceptedValue, acceptedCount,
      rejectedValue: rejected.total, rejectedCount: rejected.count,
      expiredValue: expired.total, expiredCount: expired.count,
    };
  }, [data]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-center gap-3">
        <button className="rounded-lg p-2 hover:bg-ink/5" onClick={() => shiftMonth(-1)} type="button">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h3 className="font-display text-lg font-bold text-ink" style={{ minWidth: '180px', textAlign: 'center' }}>
          {MONTH_NAMES[month - 1]} {year}
        </h3>
        <button className="rounded-lg p-2 hover:bg-ink/5" disabled={year === now.getFullYear() && month === now.getMonth() + 1} onClick={() => shiftMonth(1)} type="button">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {isLoading ? (
        <p className="text-center text-ink-soft">Cargando…</p>
      ) : totalCount === 0 ? (
        <p className="text-center text-ink-soft">No hubo cotizaciones en {MONTH_NAMES[month - 1]} {year}.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile color="var(--ink)" count={totalCount} currency={currency} label="Total Cotizado" value={totalValue} />
            <StatTile color={STATUS_COLORS.ACEPTADA} count={acceptedCount} currency={currency} label="Total Aceptado" value={acceptedValue} />
            <StatTile color={STATUS_COLORS.RECHAZADA} count={rejectedCount} currency={currency} label="Total Rechazado" value={rejectedValue} />
            <StatTile color={STATUS_COLORS.VENCIDA} count={expiredCount} currency={currency} label="Total Vencido" value={expiredValue} />
          </div>

          <div className="rounded-2xl p-5" style={{ background: 'var(--paper-card)', border: '1px solid var(--border-faint)' }}>
            <p className="mb-4 text-sm font-bold text-ink">Valor cotizado por estado</p>
            <div className="h-64 w-full">
              <ResponsiveContainer height="100%" width="100%">
                <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke="var(--border-faint)" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    axisLine={false}
                    dataKey="status"
                    tick={{ fill: 'var(--ink-muted)', fontSize: 11 }}
                    tickFormatter={(s: QuoteStatus) => quoteStatusLabel(s, agencyType)}
                    tickLine={false}
                  />
                  <YAxis axisLine={false} tick={{ fill: 'var(--ink-muted)', fontSize: 11 }} tickFormatter={(v: number) => formatMoney(v, currency)} tickLine={false} width={64} />
                  <Tooltip content={<ChartTooltip agencyType={agencyType} currency={currency} />} cursor={{ fill: 'var(--surface)' }} />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                    {rows.map((row) => <Cell fill={STATUS_COLORS[row.status]} key={row.status} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
