'use client';

import { ArrowLeft, Plus, Star, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { inputClass, labelClass } from '@/components/ui/form';
import {
  useAddAccommodationImage, useAttachAccommodationService, useCatalogAccommodation, useCatalogServices,
  useDetachAccommodationService, useRemoveAccommodationImage, useSetPrimaryAccommodationImage, useUpdateAccommodation,
} from '@/hooks/use-catalog';

export default function ManagerAccommodationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: accommodation } = useCatalogAccommodation(id);
  const { data: allServices } = useCatalogServices();
  const updateAccommodation = useUpdateAccommodation(id);
  const addImage = useAddAccommodationImage(id);
  const removeImage = useRemoveAccommodationImage(id);
  const setPrimaryImage = useSetPrimaryAccommodationImage(id);
  const attachService = useAttachAccommodationService(id);
  const detachService = useDetachAccommodationService(id);

  const [imageUrl, setImageUrl] = useState('');

  if (!accommodation) {
    return (
      <AppShell>
        <div className="mx-auto w-full max-w-content px-5 pt-8">
          <p className="text-sm text-ink-soft">Cargando…</p>
        </div>
      </AppShell>
    );
  }

  const attachedServiceIds = new Set(accommodation.services.map((s) => s.id));

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-content space-y-8 px-5 pb-28 pt-8 sm:px-7 lg:px-10 lg:pb-10">
        <Link className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink" href={`/manager/catalog/hotels/${accommodation.hotelId}`}>
          <ArrowLeft className="h-4 w-4" /> Volver al hotel
        </Link>

        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">{accommodation.name}</h1>
            <p className="mt-1 text-sm text-ink-soft">{accommodation.capacityAdults} adultos · {accommodation.capacityChildren} niños{accommodation.bedConfiguration ? ` · ${accommodation.bedConfiguration}` : ''}</p>
          </div>
          <button
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${accommodation.active ? 'chip-pagada' : 'chip-borrador'}`}
            onClick={() => updateAccommodation.mutate({ active: !accommodation.active })}
            type="button"
          >
            {accommodation.active ? 'Activa' : 'Inactiva'}
          </button>
        </header>

        {/* Imágenes */}
        <section className="space-y-3">
          <h2 className="font-semibold text-ink">Imágenes</h2>
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!imageUrl.trim()) return;
              addImage.mutate({ url: imageUrl.trim() }, { onSuccess: () => setImageUrl('') });
            }}
          >
            <div className="flex-1 min-w-[240px]">
              <label className={labelClass}>URL de la imagen</label>
              <input className={inputClass} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" value={imageUrl} />
            </div>
            <button className="button-primary" disabled={addImage.isPending} type="submit"><Plus className="h-4 w-4" /> Agregar</button>
          </form>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {accommodation.images.map((img) => (
              <div className="relative overflow-hidden rounded-xl" key={img.id} style={{ border: '1px solid var(--border)' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="" className="h-28 w-full object-cover" src={img.url} />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/60 px-2 py-1">
                  <button onClick={() => setPrimaryImage.mutate(img.id)} title="Marcar como principal" type="button">
                    <Star className={`h-4 w-4 ${img.isPrimary ? 'fill-amber text-amber' : 'text-white'}`} />
                  </button>
                  <button onClick={() => removeImage.mutate(img.id)} title="Eliminar" type="button">
                    <Trash2 className="h-4 w-4 text-white" />
                  </button>
                </div>
              </div>
            ))}
            {accommodation.images.length === 0 ? <p className="col-span-full text-sm text-ink-soft">Sin imágenes todavía.</p> : null}
          </div>
        </section>

        {/* Servicios */}
        <section className="space-y-3">
          <h2 className="font-semibold text-ink">Servicios</h2>
          <div className="flex flex-wrap gap-2">
            {(allServices ?? []).map((s) => {
              const attached = attachedServiceIds.has(s.id);
              return (
                <button
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${attached ? 'chip-pagada' : 'text-ink-soft'}`}
                  key={s.id}
                  onClick={() => (attached ? detachService.mutate(s.id) : attachService.mutate(s.id))}
                  style={attached ? {} : { border: '1px solid var(--border)' }}
                  type="button"
                >
                  {s.name}
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
