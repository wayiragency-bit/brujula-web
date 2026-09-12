'use client';

import { ArrowLeft, BedDouble, Building2, MapPin } from 'lucide-react';
import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { inputClass, labelClass } from '@/components/ui/form';
import { useCatalogDestinations, useCatalogHotel, useCatalogHotels } from '@/hooks/use-catalog';
import type { CatalogAccommodationListItem, CatalogHotelListItem, CatalogDestination } from '@/lib/catalog-types';

type Step = 'destination' | 'hotel' | 'accommodation' | 'cost';

interface QuoteCatalogAccommodationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (selection: {
    accommodation: CatalogAccommodationListItem;
    hotel: CatalogHotelListItem;
    netCost: string;
  }) => void;
}

export function QuoteCatalogAccommodationModal({ open, onClose, onConfirm }: QuoteCatalogAccommodationModalProps) {
  const [step, setStep] = useState<Step>('destination');
  const [destination, setDestination] = useState<CatalogDestination | null>(null);
  const [hotel, setHotel] = useState<CatalogHotelListItem | null>(null);
  const [accommodation, setAccommodation] = useState<CatalogAccommodationListItem | null>(null);
  const [netCost, setNetCost] = useState('');

  const { data: destinations } = useCatalogDestinations();
  const { data: hotels } = useCatalogHotels({ destinationId: destination?.id, active: true });
  const { data: hotelDetail } = useCatalogHotel(hotel?.id);

  function reset() {
    setStep('destination');
    setDestination(null);
    setHotel(null);
    setAccommodation(null);
    setNetCost('');
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleConfirm() {
    if (!accommodation || !hotel || !netCost.trim()) return;
    onConfirm({ accommodation, hotel, netCost: netCost.trim() });
    reset();
    onClose();
  }

  const activeAccommodations = (hotelDetail?.accommodations ?? []).filter((a) => a.active);
  const primaryImage = hotelDetail?.images.find((img) => img.isPrimary) ?? hotelDetail?.images[0];

  return (
    <Modal onClose={handleClose} open={open} subtitle="Elige un hotel y acomodación del catálogo oficial." title="Agregar del Catálogo Oficial" xl>
      <div className="space-y-4">
        {step !== 'destination' ? (
          <button
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft hover:text-ink"
            onClick={() => {
              if (step === 'hotel') { setDestination(null); setStep('destination'); }
              else if (step === 'accommodation') { setHotel(null); setStep('hotel'); }
              else if (step === 'cost') { setAccommodation(null); setStep('accommodation'); }
            }}
            type="button"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Atrás
          </button>
        ) : null}

        {step === 'destination' ? (
          <div className="grid max-h-[55vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
            {(destinations ?? []).filter((d) => d.active).length === 0 ? (
              <p className="col-span-full py-10 text-center text-sm text-ink-soft">El Manager aún no ha agregado destinos al catálogo.</p>
            ) : (
              destinations!.filter((d) => d.active).map((d) => (
                <button
                  className="flex flex-col items-center gap-2 rounded-xl border border-ink/10 p-4 text-center transition hover:border-teal hover:bg-teal/5"
                  key={d.id}
                  onClick={() => { setDestination(d); setStep('hotel'); }}
                  type="button"
                >
                  <MapPin className="h-6 w-6 text-teal" />
                  <span className="text-sm font-semibold text-ink">{d.name}</span>
                  <span className="text-xs text-ink-soft">{d.country}</span>
                </button>
              ))
            )}
          </div>
        ) : null}

        {step === 'hotel' ? (
          <div className="grid max-h-[55vh] grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
            {(hotels?.length ?? 0) === 0 ? (
              <p className="col-span-full py-10 text-center text-sm text-ink-soft">No hay hoteles para este destino todavía.</p>
            ) : (
              hotels!.map((h) => (
                <button
                  className="overflow-hidden rounded-xl border border-ink/10 text-left transition hover:border-teal"
                  key={h.id}
                  onClick={() => { setHotel(h); setStep('accommodation'); }}
                  type="button"
                >
                  <div className="flex h-20 w-full items-center justify-center bg-ink/5">
                    <Building2 className="h-6 w-6 text-ink-soft" />
                  </div>
                  <div className="p-2">
                    <p className="truncate text-sm font-semibold text-ink">{h.name}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        ) : null}

        {step === 'accommodation' ? (
          <div className="max-h-[55vh] space-y-2 overflow-y-auto">
            {hotelDetail && primaryImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt={hotel?.name} className="mb-2 h-32 w-full rounded-xl object-cover" src={primaryImage.url} />
            ) : null}
            {activeAccommodations.length === 0 ? (
              <p className="py-10 text-center text-sm text-ink-soft">Este hotel aún no tiene acomodaciones cargadas.</p>
            ) : (
              activeAccommodations.map((a) => (
                <button
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-ink/10 p-3 text-left transition hover:border-teal hover:bg-teal/5"
                  key={a.id}
                  onClick={() => { setAccommodation(a); setStep('cost'); }}
                  type="button"
                >
                  <div className="flex items-center gap-2">
                    <BedDouble className="h-4 w-4 shrink-0 text-teal" />
                    <div>
                      <p className="text-sm font-semibold text-ink">{a.name}</p>
                      <p className="text-xs text-ink-soft">{a.capacityAdults} adultos · {a.capacityChildren} niños{a.bedConfiguration ? ` · ${a.bedConfiguration}` : ''}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        ) : null}

        {step === 'cost' && accommodation && hotel ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-ink/10 p-3">
              <p className="text-sm font-semibold text-ink">{hotel.name} — {accommodation.name}</p>
              <p className="text-xs text-ink-soft">{destination?.name}, {destination?.country}</p>
            </div>
            <div>
              <label className={labelClass}>Costo neto (lo que te cobra el hotel)</label>
              <input
                autoFocus
                className={inputClass}
                inputMode="decimal"
                onChange={(e) => setNetCost(e.target.value)}
                placeholder="0"
                value={netCost}
              />
              <p className="mt-1 text-xs text-ink-soft">El catálogo oficial no trae precios — tú defines tu costo y tu margen, igual que con cualquier otro ítem.</p>
            </div>
            <div className="flex justify-end border-t border-ink/10 pt-4">
              <button className="button-primary" disabled={!netCost.trim()} onClick={handleConfirm} type="button">
                Agregar a la cotización
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
