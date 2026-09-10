'use client';

import { Megaphone, Mail, MousePointerClick, TrendingUp, Plus } from 'lucide-react';
import { AppShell } from '@/components/app-shell';

export default function MarketingPage() {
  const metrics = [
    { label: 'Correos Enviados', value: '0',  icon: Mail,             color: '#38bdf8', bg: 'rgba(14,165,233,0.12)' },
    { label: 'Tasa de Apertura', value: '0%', icon: TrendingUp,       color: '#4ade80', bg: 'rgba(34,197,94,0.12)' },
    { label: 'Campañas Activas', value: '0',  icon: MousePointerClick, color: '#c084fc', bg: 'rgba(192,132,252,0.12)' },
  ];

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-content space-y-6 px-4 pb-28 pt-7 sm:px-6 lg:px-8 lg:pb-10">

        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-amber" />
              <h1 className="font-display text-3xl font-extrabold text-ink">Email Marketing</h1>
            </div>
            <p className="mt-1 text-sm text-ink-soft">Crea campañas, notifica ofertas y fideliza a tus clientes.</p>
          </div>
          <button className="button-primary inline-flex items-center gap-2" type="button">
            <Plus className="h-4 w-4" /> Nueva Campaña
          </button>
        </header>

        {/* Metric cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {metrics.map((m) => {
            const Icon = m.icon;
            return (
              <article
                className="flex items-center gap-4 rounded-2xl p-5"
                key={m.label}
                style={{ background: 'var(--paper-card)', border: '1px solid var(--border)' }}
              >
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: m.bg }}
                >
                  <Icon className="h-5 w-5" style={{ color: m.color }} />
                </div>
                <div>
                  <p className="font-mono text-3xl font-bold text-ink">{m.value}</p>
                  <p className="label-caps text-ink-soft">{m.label}</p>
                </div>
              </article>
            );
          })}
        </section>

        {/* Campaign history */}
        <article
          className="overflow-hidden rounded-2xl"
          style={{ background: 'var(--paper-card)', border: '1px solid var(--border)' }}
        >
          <div
            className="px-6 py-4"
            style={{ borderBottom: '1px solid var(--border-faint)' }}
          >
            <h2 className="font-semibold text-ink">Historial de Campañas</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-faint)' }}>
                  {['CAMPAÑA', 'AUDIENCIA', 'ENVIADOS', 'APERTURA', 'CLICS', 'ESTADO', 'ACCIONES'].map((h) => (
                    <th className="label-caps px-6 py-3 text-left text-ink-soft" key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-6 py-12 text-center text-ink-soft" colSpan={7}>
                    <Megaphone className="mx-auto mb-3 h-10 w-10 opacity-15" />
                    <p className="font-medium">No hay campañas de marketing registradas.</p>
                    <p className="mt-1 text-xs text-ink-muted">Crea tu primera campaña para empezar a fidelizar clientes.</p>
                    <button
                      className="button-primary mx-auto mt-4 inline-flex items-center gap-2"
                      type="button"
                    >
                      <Plus className="h-4 w-4" /> Nueva Campaña
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>

        {/* Tips */}
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { icon: '📧', title: 'Campañas masivas', desc: 'Envía emails a todos tus clientes o segmentos específicos con un solo clic.' },
            { icon: '📊', title: 'Analítica en tiempo real', desc: 'Mide la tasa de apertura, clics y conversiones de cada campaña.' },
            { icon: '🎯', title: 'Segmentación', desc: 'Filtra por destino, fecha de viaje o estado de cotización para mensajes más relevantes.' },
            { icon: '🔄', title: 'Automatizaciones', desc: 'Envía recordatorios automáticos de cotizaciones vencidas o follow-ups post-viaje.' },
          ].map((tip) => (
            <div
              className="flex items-start gap-3 rounded-xl p-4"
              key={tip.title}
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-faint)' }}
            >
              <span className="text-2xl">{tip.icon}</span>
              <div>
                <p className="font-semibold text-ink">{tip.title}</p>
                <p className="mt-0.5 text-sm text-ink-soft">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </AppShell>
  );
}
