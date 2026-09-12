'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { inputClass, labelClass } from '@/components/ui/form';
import {
  useCatalogDestinations, useCatalogHotels, useCatalogServices,
  useCreateDestination, useCreateHotel, useCreateService, useUpdateDestination, useUpdateService,
} from '@/hooks/use-catalog';

type Tab = 'destinations' | 'hotels' | 'services';
const TABS: { key: Tab; label: string }[] = [
  { key: 'destinations', label: 'Destinos' },
  { key: 'hotels', label: 'Hoteles' },
  { key: 'services', label: 'Servicios' },
];

function DestinationsTab() {
  const { data: destinations } = useCatalogDestinations();
  const createDestination = useCreateDestination();
  const updateDestination = useUpdateDestination();
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');

  return (
    <div className="space-y-6">
      <form
        className="flex flex-wrap items-end gap-3 rounded-2xl p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim() || !country.trim()) return;
          createDestination.mutate({ name: name.trim(), country: country.trim() }, { onSuccess: () => { setName(''); setCountry(''); } });
        }}
        style={{ background: 'var(--paper-card)', border: '1px solid var(--border)' }}
      >
        <div className="flex-1 min-w-[180px]">
          <label className={labelClass}>Nombre del destino</label>
          <input className={inputClass} onChange={(e) => setName(e.target.value)} placeholder="Cartagena" value={name} />
        </div>
        <div className="flex-1 min-w-[140px]">
          <label className={labelClass}>País</label>
          <input className={inputClass} onChange={(e) => setCountry(e.target.value)} placeholder="Colombia" value={country} />
        </div>
        <button className="button-primary" disabled={createDestination.isPending} type="submit">
          <Plus className="h-4 w-4" /> Agregar destino
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl" style={{ background: 'var(--paper-card)', border: '1px solid var(--border)' }}>
        <table className="w-full text-left text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-faint)' }}>
              <th className="label-caps px-6 py-3 text-ink-muted">Destino</th>
              <th className="label-caps px-6 py-3 text-ink-muted">País</th>
              <th className="label-caps px-6 py-3 text-ink-muted">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
            {(destinations?.length ?? 0) === 0 ? (
              <tr><td className="px-6 py-10 text-center text-ink-soft" colSpan={3}>Aún no hay destinos.</td></tr>
            ) : (
              destinations!.map((d) => (
                <tr key={d.id}>
                  <td className="px-6 py-4 font-medium text-ink">{d.name}</td>
                  <td className="px-6 py-4 text-ink-soft">{d.country}</td>
                  <td className="px-6 py-4">
                    <button
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${d.active ? 'chip-pagada' : 'chip-borrador'}`}
                      onClick={() => updateDestination.mutate({ id: d.id, active: !d.active })}
                      type="button"
                    >
                      {d.active ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function HotelsTab() {
  const { data: destinations } = useCatalogDestinations();
  const { data: hotels } = useCatalogHotels();
  const createHotel = useCreateHotel();
  const [destinationId, setDestinationId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  return (
    <div className="space-y-6">
      <form
        className="grid gap-3 rounded-2xl p-5 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!destinationId || !name.trim()) return;
          createHotel.mutate(
            { destinationId, name: name.trim(), description: description.trim() || undefined },
            { onSuccess: () => { setName(''); setDescription(''); } },
          );
        }}
        style={{ background: 'var(--paper-card)', border: '1px solid var(--border)' }}
      >
        <div>
          <label className={labelClass}>Destino</label>
          <select className={inputClass} onChange={(e) => setDestinationId(e.target.value)} value={destinationId}>
            <option value="">Selecciona un destino…</option>
            {(destinations ?? []).map((d) => <option key={d.id} value={d.id}>{d.name}, {d.country}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Nombre del hotel</label>
          <input className={inputClass} onChange={(e) => setName(e.target.value)} placeholder="Hotel Las Islas" value={name} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Descripción (opcional)</label>
          <input className={inputClass} onChange={(e) => setDescription(e.target.value)} value={description} />
        </div>
        <div className="sm:col-span-2">
          <button className="button-primary" disabled={createHotel.isPending || !destinationId} type="submit">
            <Plus className="h-4 w-4" /> Agregar hotel
          </button>
        </div>
      </form>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(hotels?.length ?? 0) === 0 ? (
          <p className="text-sm text-ink-soft">Aún no hay hoteles.</p>
        ) : (
          hotels!.map((h) => (
            <Link
              className="rounded-2xl p-5 transition hover:brightness-110"
              href={`/manager/catalog/hotels/${h.id}`}
              key={h.id}
              style={{ background: 'var(--paper-card)', border: '1px solid var(--border)' }}
            >
              <p className="font-semibold text-ink">{h.name}</p>
              <p className="text-xs text-ink-soft">{h.destination?.name}, {h.destination?.country}</p>
              {!h.active ? <span className="chip-borrador mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold">Inactivo</span> : null}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

function ServicesTab() {
  const { data: services } = useCatalogServices();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  return (
    <div className="space-y-6">
      <form
        className="flex flex-wrap items-end gap-3 rounded-2xl p-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          createService.mutate({ name: name.trim(), description: description.trim() || undefined }, { onSuccess: () => { setName(''); setDescription(''); } });
        }}
        style={{ background: 'var(--paper-card)', border: '1px solid var(--border)' }}
      >
        <div className="flex-1 min-w-[180px]">
          <label className={labelClass}>Servicio</label>
          <input className={inputClass} onChange={(e) => setName(e.target.value)} placeholder="WiFi gratis" value={name} />
        </div>
        <div className="flex-1 min-w-[220px]">
          <label className={labelClass}>Descripción (opcional)</label>
          <input className={inputClass} onChange={(e) => setDescription(e.target.value)} value={description} />
        </div>
        <button className="button-primary" disabled={createService.isPending} type="submit">
          <Plus className="h-4 w-4" /> Agregar servicio
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {(services?.length ?? 0) === 0 ? (
          <p className="text-sm text-ink-soft">Aún no hay servicios.</p>
        ) : (
          services!.map((s) => (
            <button
              className="chip-pagada rounded-full px-3 py-1.5 text-xs font-semibold"
              key={s.id}
              onClick={() => updateService.mutate({ id: s.id, active: false })}
              title="Clic para desactivar"
              type="button"
            >
              {s.name}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export default function ManagerCatalogPage() {
  const [tab, setTab] = useState<Tab>('destinations');

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-content space-y-6 px-5 pb-28 pt-8 sm:px-7 lg:px-10 lg:pb-10">
        <header>
          <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">Catálogo Oficial</h1>
          <p className="mt-2 text-sm text-ink-soft">Destinos, hoteles y acomodaciones que los asesores pueden usar en sus cotizaciones. Sin precios — cada asesor pone su propio costo y margen.</p>
        </header>

        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${tab === t.key ? 'bg-amber text-[var(--sidebar-bg)]' : 'text-ink-soft hover:bg-white/8'}`}
              key={t.key}
              onClick={() => setTab(t.key)}
              style={tab === t.key ? {} : { border: '1px solid var(--border)' }}
              type="button"
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'destinations' ? <DestinationsTab /> : null}
        {tab === 'hotels' ? <HotelsTab /> : null}
        {tab === 'services' ? <ServicesTab /> : null}
      </div>
    </AppShell>
  );
}
