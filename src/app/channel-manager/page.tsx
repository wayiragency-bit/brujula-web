'use client';

import { Globe, Plus, ExternalLink, Wifi } from 'lucide-react';
import { AppShell } from '@/components/app-shell';

const CHANNELS = [
  { name: 'Airbnb',       color: '#FF5A5F', bg: 'rgba(255,90,95,0.12)',  logo: '🏠' },
  { name: 'Booking.com',  color: '#003580', bg: 'rgba(0,53,128,0.25)',   logo: '📅' },
  { name: 'Expedia',      color: '#FBCC33', bg: 'rgba(251,204,51,0.15)', logo: '✈️' },
  { name: 'VRBO',         color: '#1565C0', bg: 'rgba(21,101,192,0.20)', logo: '🏡' },
  { name: 'TripAdvisor',  color: '#00AA6C', bg: 'rgba(0,170,108,0.15)', logo: '🦉' },
];

export default function ChannelManagerPage() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-content space-y-6 px-4 pb-28 pt-7 sm:px-6 lg:px-8 lg:pb-10">

        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-amber" />
              <h1 className="font-display text-3xl font-extrabold text-ink">Channel Manager</h1>
            </div>
            <p className="mt-1 text-sm text-ink-soft">Centraliza y sincroniza tu disponibilidad con portales externos.</p>
          </div>
          <button
            className="button-primary inline-flex items-center gap-2"
            type="button"
          >
            <Plus className="h-4 w-4" /> Conectar Canal
          </button>
        </header>

        {/* Info banner */}
        <div
          className="flex items-start gap-3 rounded-xl p-4 text-sm"
          style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', color: '#7dd3fc' }}
        >
          <Wifi className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            ¿Cómo funciona? Añade la URL iCal de tu portal (Airbnb, Booking.com, etc.) para importar sus bloqueos al
            Calendario PMS. También puedes copiar tu URL privada de Brújula y pegarla en el portal externo para
            mantenerlos sincronizados.
          </p>
        </div>

        {/* Empty state */}
        <article
          className="rounded-2xl p-12 text-center"
          style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            <Globe className="h-8 w-8 text-ink-soft" />
          </div>
          <h2 className="font-display text-xl font-bold text-ink">No hay canales conectados</h2>
          <p className="mt-2 text-sm text-ink-soft">
            Conecta tus calendarios de Airbnb, Booking.com y otros<br />
            para evitar sobreventas y automatizar tu operación.
          </p>

          {/* Platform chips */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {CHANNELS.map((ch) => (
              <span
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
                key={ch.name}
                style={{ background: ch.bg, color: ch.color, border: `1px solid ${ch.color}30` }}
              >
                <span>{ch.logo}</span>
                {ch.name}
              </span>
            ))}
          </div>

          <button
            className="button-primary mx-auto mt-8 inline-flex items-center gap-2"
            type="button"
          >
            <Plus className="h-4 w-4" /> Conectar mi primer canal
          </button>
        </article>

        {/* How it works */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { step: '01', title: 'Copia la URL iCal', desc: 'Desde tu portal externo (Airbnb, Booking, etc.) copia la URL de exportación iCal.' },
            { step: '02', title: 'Pega en Brújula', desc: 'Añade la URL al canal correspondiente y Brújula importará los bloqueos automáticamente.' },
            { step: '03', title: 'Sincronización automática', desc: 'Los calendarios se mantienen actualizados. Evita sobreventas sin esfuerzo.' },
          ].map((item) => (
            <div
              className="rounded-xl p-5"
              key={item.step}
              style={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <p className="font-mono text-3xl font-bold text-amber/30">{item.step}</p>
              <h3 className="mt-2 font-semibold text-ink">{item.title}</h3>
              <p className="mt-1 text-sm text-ink-soft">{item.desc}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <ExternalLink className="h-3 w-3" />
          <span>Próximamente: sincronización bidireccional en tiempo real con Airbnb y Booking.com</span>
        </div>

      </div>
    </AppShell>
  );
}
