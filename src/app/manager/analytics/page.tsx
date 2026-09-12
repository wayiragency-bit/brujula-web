'use client';

import { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import {
  useManagerAnalyticsAccommodations,
  useManagerAnalyticsAdvisors,
  useManagerAnalyticsDestinations,
  useManagerAnalyticsGeneral,
  useManagerAnalyticsHotels,
} from '@/hooks/use-manager';
import { formatMoneyFull } from '@/lib/format';
import { quoteStatusLabel } from '@/lib/on-vacation-status';

type Tab = 'general' | 'advisors' | 'hotels' | 'accommodations' | 'destinations';

const TABS: { key: Tab; label: string }[] = [
  { key: 'general', label: 'General' },
  { key: 'advisors', label: 'Asesores' },
  { key: 'hotels', label: 'Hoteles' },
  { key: 'accommodations', label: 'Acomodaciones' },
  { key: 'destinations', label: 'Destinos' },
];

function Table({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-faint)' }}>
            {headers.map((h) => <th className="label-caps px-6 py-3 text-ink-muted" key={h}>{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
          {rows.length === 0 ? (
            <tr><td className="px-6 py-10 text-center text-ink-soft" colSpan={headers.length}>Sin datos para este rango.</td></tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => <td className="px-6 py-4 text-ink" key={j}>{cell}</td>)}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function ManagerAnalyticsPage() {
  const [tab, setTab] = useState<Tab>('general');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const range = { from: from || undefined, to: to || undefined };

  const { data: general } = useManagerAnalyticsGeneral(range);
  const { data: advisors } = useManagerAnalyticsAdvisors(range);
  const { data: hotels } = useManagerAnalyticsHotels(range);
  const { data: accommodations } = useManagerAnalyticsAccommodations(range);
  const { data: destinations } = useManagerAnalyticsDestinations(range);

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-content space-y-6 px-5 pb-28 pt-8 sm:px-7 lg:px-10 lg:pb-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">Analítica</h1>
            <p className="mt-2 text-sm text-ink-soft">Desempeño de toda la red On Vacation.</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              className="h-9 rounded-lg px-3 text-sm text-ink"
              onChange={(e) => setFrom(e.target.value)}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              type="date"
              value={from}
            />
            <span className="text-ink-soft">→</span>
            <input
              className="h-9 rounded-lg px-3 text-sm text-ink"
              onChange={(e) => setTo(e.target.value)}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              type="date"
              value={to}
            />
          </div>
        </header>

        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                tab === t.key ? 'bg-amber text-[var(--sidebar-bg)]' : 'text-ink-soft hover:bg-white/8'
              }`}
              key={t.key}
              onClick={() => setTab(t.key)}
              style={tab === t.key ? {} : { border: '1px solid var(--border)' }}
              type="button"
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'general' ? (
          <section className="grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-5">
            {[
              { label: 'Asesores', value: general?.totalAdvisors ?? '—' },
              { label: 'Clientes', value: general?.totalClients ?? '—' },
              { label: 'Cotizaciones', value: general?.totalQuotes ?? '—' },
              { label: 'Ventas', value: general ? formatMoneyFull(general.salesValue, 'COP') : '—' },
              { label: 'Conversión', value: general ? `${general.conversion}%` : '—' },
              { label: 'Ticket promedio', value: general ? formatMoneyFull(general.avgTicket, 'COP') : '—' },
            ].map((m) => (
              <article className="glass-card rounded-2xl p-5" key={m.label}>
                <p className="label-caps text-[11px] text-ink-soft">{m.label}</p>
                <strong className="font-mono text-2xl font-bold text-ink">{m.value}</strong>
              </article>
            ))}
          </section>
        ) : null}

        <article className="overflow-hidden rounded-2xl" style={{ background: 'var(--paper-card)', border: '1px solid var(--border)' }}>
          {tab === 'general' ? (
            <Table
              headers={['Estatus', 'Cotizaciones']}
              rows={(general?.funnel ?? []).map((f) => [quoteStatusLabel(f.status, 'ON_VACATION'), f.count])}
            />
          ) : null}
          {tab === 'advisors' ? (
            <Table
              headers={['Agencia', 'Cotizaciones', 'Ganadas', 'Ventas', 'Conversión', 'Ticket prom.']}
              rows={(advisors ?? []).map((a) => [
                a.agencyName, a.quotesCount, a.wonCount, formatMoneyFull(a.salesValue, 'COP'), `${a.conversion}%`, formatMoneyFull(a.avgTicket, 'COP'),
              ])}
            />
          ) : null}
          {tab === 'hotels' ? (
            <Table
              headers={['Hotel', 'Cotizaciones', 'Ganadas', 'Ventas', 'Asesores que lo venden', 'Conversión']}
              rows={(hotels ?? []).map((h) => [
                h.hotelName, h.quotesCount, h.wonCount, formatMoneyFull(h.salesValue, 'COP'), h.advisorsSelling, `${h.conversion}%`,
              ])}
            />
          ) : null}
          {tab === 'accommodations' ? (
            <Table
              headers={['Acomodación', 'Hotel', 'Cotizaciones', 'Ganadas', 'Ventas']}
              rows={(accommodations ?? []).map((a) => [
                a.accommodationName, a.hotelName, a.quotesCount, a.wonCount, formatMoneyFull(a.salesValue, 'COP'),
              ])}
            />
          ) : null}
          {tab === 'destinations' ? (
            <Table
              headers={['Destino', 'Cotizaciones', 'Ganadas', 'Ventas', '% del total', 'Conversión']}
              rows={(destinations ?? []).map((d) => [
                d.destination ?? '—', d.quotesCount, d.wonCount, formatMoneyFull(d.salesValue, 'COP'), `${d.share}%`, `${d.conversion}%`,
              ])}
            />
          ) : null}
        </article>
      </div>
    </AppShell>
  );
}
