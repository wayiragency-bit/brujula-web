'use client';

import { ArrowLeft, Plus, Star, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { inputClass, labelClass } from '@/components/ui/form';
import {
  useAddHotelImage, useAttachHotelService, useCatalogHotel, useCatalogServices,
  useCreateAccommodation, useDetachHotelService, useRemoveHotelImage, useSetPrimaryHotelImage, useUpdateHotel,
} from '@/hooks/use-catalog';

export default function ManagerHotelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: hotel } = useCatalogHotel(id);
  const { data: allServices } = useCatalogServices();
  const updateHotel = useUpdateHotel(id);
  const addImage = useAddHotelImage(id);
  const removeImage = useRemoveHotelImage(id);
  const setPrimaryImage = useSetPrimaryHotelImage(id);
  const attachService = useAttachHotelService(id);
  const detachService = useDetachHotelService(id);
  const createAccommodation = useCreateAccommodation(id);

  const [imageUrl, setImageUrl] = useState('');
  const [accName, setAccName] = useState('');
  const [accAdults, setAccAdults] = useState('2');
  const [accChildren, setAccChildren] = useState('0');
  const [accBed, setAccBed] = useState('');

  if (!hotel) {
    return (
      <AppShell>
        <div className="mx-auto w-full max-w-content px-5 pt-8">
          <p className="text-sm text-ink-soft">Cargando…</p>
        </div>
      </AppShell>
    );
  }

  const attachedServiceIds = new Set(hotel.services.map((s) => s.id));

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-content space-y-8 px-5 pb-28 pt-8 sm:px-7 lg:px-10 lg:pb-10">
        <Link className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink" href="/manager/catalog">
          <ArrowLeft className="h-4 w-4" /> Catálogo
        </Link>

        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">{hotel.name}</h1>
            <p className="mt-1 text-sm text-ink-soft">{hotel.destination?.name}, {hotel.destination?.country}</p>
          </div>
          <button
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${hotel.active ? 'chip-pagada' : 'chip-borrador'}`}
            onClick={() => updateHotel.mutate({ active: !hotel.active })}
            type="button"
          >
            {hotel.active ? 'Activo' : 'Inactivo'}
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
            {hotel.images.map((img) => (
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
            {hotel.images.length === 0 ? <p className="col-span-full text-sm text-ink-soft">Sin imágenes todavía.</p> : null}
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

        {/* Acomodaciones */}
        <section className="space-y-3">
          <h2 className="font-semibold text-ink">Acomodaciones</h2>
          <form
            className="grid gap-3 rounded-2xl p-5 sm:grid-cols-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!accName.trim()) return;
              createAccommodation.mutate(
                { name: accName.trim(), capacityAdults: Number(accAdults), capacityChildren: Number(accChildren), bedConfiguration: accBed.trim() || undefined },
                { onSuccess: () => { setAccName(''); setAccAdults('2'); setAccChildren('0'); setAccBed(''); } },
              );
            }}
            style={{ background: 'var(--paper-card)', border: '1px solid var(--border)' }}
          >
            <div className="sm:col-span-2">
              <label className={labelClass}>Nombre (ej. Doble, Suite Familiar)</label>
              <input className={inputClass} onChange={(e) => setAccName(e.target.value)} value={accName} />
            </div>
            <div>
              <label className={labelClass}>Adultos</label>
              <input className={inputClass} min={0} onChange={(e) => setAccAdults(e.target.value)} type="number" value={accAdults} />
            </div>
            <div>
              <label className={labelClass}>Niños</label>
              <input className={inputClass} min={0} onChange={(e) => setAccChildren(e.target.value)} type="number" value={accChildren} />
            </div>
            <div className="sm:col-span-3">
              <label className={labelClass}>Configuración de camas (opcional)</label>
              <input className={inputClass} onChange={(e) => setAccBed(e.target.value)} placeholder="1 cama king" value={accBed} />
            </div>
            <div className="flex items-end">
              <button className="button-primary" disabled={createAccommodation.isPending} type="submit"><Plus className="h-4 w-4" /> Agregar</button>
            </div>
          </form>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {hotel.accommodations.length === 0 ? (
              <p className="text-sm text-ink-soft">Sin acomodaciones todavía.</p>
            ) : (
              hotel.accommodations.map((a) => (
                <Link
                  className="rounded-xl p-4 transition hover:brightness-110"
                  href={`/manager/catalog/accommodations/${a.id}`}
                  key={a.id}
                  style={{ background: 'var(--surface)', border: '1px solid var(--border-faint)' }}
                >
                  <p className="font-medium text-ink">{a.name}</p>
                  <p className="text-xs text-ink-soft">{a.capacityAdults} adultos · {a.capacityChildren} niños</p>
                  {!a.active ? <span className="chip-borrador mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold">Inactivo</span> : null}
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
