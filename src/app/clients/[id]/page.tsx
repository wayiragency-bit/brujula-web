'use client';

import { ArrowLeft, Mail, MapPin, Phone, SquarePen } from 'lucide-react';
import Link from 'next/link';
import { use, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { ClientFormModal } from '@/components/clients/client-form-modal';
import { useClient, useUpdateClient } from '@/hooks/use-clients';
import { countryLabel } from '@/lib/countries';
import type { ClientFormValues } from '@/lib/types';

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: client, isLoading } = useClient(id);
  const updateClient = useUpdateClient(id);
  const [editing, setEditing] = useState(false);
  const [modalKey, setModalKey] = useState(0);

  if (isLoading || !client) {
    return (
      <AppShell>
        <div className="mx-auto w-full max-w-content px-4 py-10 sm:px-6 lg:px-8">
          <p className="text-ink-soft">Cargando cliente…</p>
        </div>
      </AppShell>
    );
  }

  async function handleSubmit(values: ClientFormValues) {
    await updateClient.mutateAsync(values);
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-content space-y-6 px-4 pb-28 pt-7 sm:px-6 lg:px-8 lg:pb-10">
        <Link className="inline-flex items-center gap-2 text-sm font-semibold text-teal hover:underline" href="/clients">
          <ArrowLeft className="h-4 w-4" /> Volver a Clientes
        </Link>

        <div className="flex flex-col gap-4 rounded-2xl border border-ink/10 bg-paper-card p-6 shadow-card sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-display text-2xl font-extrabold text-ink">{client.name}</h1>
              <span className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase ${
                client.type === 'AGENCY' ? 'bg-amber/15 text-amber' : 'bg-teal/10 text-teal'
              }`}>
                {client.type === 'AGENCY' ? 'Agencia Partner' : 'Viajero Directo'}
              </span>
              {!client.active ? (
                <span className="rounded-full bg-red-100 px-2.5 py-1 font-mono text-[10px] font-bold uppercase text-red-600">Inactivo</span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-ink-soft">
              Cliente desde {new Date(client.createdAt).toLocaleDateString('es-CO')}
              {client.seller ? ` · Vendedor: ${client.seller.name}` : ''}
            </p>
          </div>
          <button className="button-secondary inline-flex items-center gap-2 self-start" onClick={() => { setModalKey((k) => k + 1); setEditing(true); }} type="button">
            <SquarePen className="h-4 w-4" /> Editar
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-1">
            <article className="metric-card">
              <span className="label-caps text-ink-soft">Total Facturado</span>
              <strong className="font-mono text-2xl text-ink">—</strong>
              <p className="mt-1 text-xs text-ink-soft">Disponible cuando exista historial de cotizaciones</p>
            </article>
            <article className="metric-card">
              <span className="label-caps text-ink-soft">Cotizaciones</span>
              <strong className="font-mono text-2xl text-ink">—</strong>
            </article>
          </div>

          <div className="space-y-4 rounded-2xl border border-ink/10 bg-paper-card p-6 shadow-card lg:col-span-2">
            <h2 className="font-display text-lg font-extrabold text-ink">Información de Contacto</h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 text-ink-soft/70" />
                <div>
                  <dt className="label-caps text-ink-soft">Correo Electrónico</dt>
                  <dd className="text-sm text-ink">{client.email || 'No registrado'}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 text-ink-soft/70" />
                <div>
                  <dt className="label-caps text-ink-soft">Teléfono</dt>
                  <dd className="font-mono text-sm text-ink">{client.phone}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 text-ink-soft/70" />
                <div>
                  <dt className="label-caps text-ink-soft">Ubicación</dt>
                  <dd className="text-sm text-ink">{[client.city, countryLabel(client.country)].filter(Boolean).join(', ') || 'No registrada'}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <dt className="label-caps text-ink-soft">Documento</dt>
                  <dd className="font-mono text-sm text-ink">{client.document || 'No registrado'}</dd>
                </div>
              </div>
            </dl>
            {client.notes ? (
              <div className="border-t border-ink/10 pt-4">
                <dt className="label-caps text-ink-soft">Notas Internas</dt>
                <dd className="mt-1 text-sm text-ink">{client.notes}</dd>
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-ink/10 bg-paper-card p-6 shadow-card">
          <h2 className="font-display text-lg font-extrabold text-ink">Historial de Cotizaciones</h2>
          <p className="mt-2 text-sm text-ink-soft">Aún no tiene cotizaciones registradas.</p>
        </div>
      </div>

      <ClientFormModal initial={client} key={modalKey} onClose={() => setEditing(false)} onSubmit={handleSubmit} open={editing} />
    </AppShell>
  );
}
