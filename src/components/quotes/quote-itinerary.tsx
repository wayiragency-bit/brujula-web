'use client';

import { CalendarClock, MapPin } from 'lucide-react';
import type { QuoteItemDraft } from '@/lib/types';

const MONTH_LABELS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function formatDay(iso: string): { day: string; month: string } {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return { day: String(date.getUTCDate()).padStart(2, '0'), month: MONTH_LABELS[date.getUTCMonth()] };
}

interface TimelineItem extends QuoteItemDraft {
  key: string;
}

export function QuoteItinerary({ items, destination }: { items: TimelineItem[]; destination?: string }) {
  if (items.length === 0) return null;

  const dated = items
    .filter((item) => item.serviceDate)
    .sort((a, b) => (a.serviceDate! < b.serviceDate! ? -1 : a.serviceDate! > b.serviceDate! ? 1 : 0));
  const undated = items.filter((item) => !item.serviceDate);

  return (
    <section className="space-y-4 rounded-2xl border border-ink/10 bg-paper-card p-6 shadow-card">
      <h2 className="label-caps text-ink-soft">Itinerario de Viaje</h2>

      {dated.length === 0 ? (
        <p className="text-sm text-ink-soft">Asigna fechas a los servicios para ver el itinerario.</p>
      ) : (
        <ol className="relative space-y-4 border-l-2 border-teal/20 pl-6">
          {dated.map((item) => {
            const { day, month } = formatDay(item.serviceDate!);
            return (
              <li className="relative" key={item.key}>
                <span className="absolute -left-[31px] top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-teal text-[10px] font-bold text-white">
                  <CalendarClock className="h-3 w-3" />
                </span>
                <div className="flex items-baseline gap-2">
                  <p className="font-mono text-xs font-bold uppercase text-teal">{day} {month}</p>
                  {item.serviceEndDate ? (
                    <p className="text-xs text-ink-soft">
                      → {formatDay(item.serviceEndDate).day} {formatDay(item.serviceEndDate).month}
                    </p>
                  ) : null}
                </div>
                <p className="text-sm font-medium text-ink">{item.name}</p>
                {destination ? (
                  <p className="flex items-center gap-1 text-xs text-ink-soft">
                    <MapPin className="h-3 w-3" /> {destination}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}

      {undated.length > 0 ? (
        <div className="rounded-xl border border-dashed border-ink/15 p-3">
          <p className="label-caps mb-1 text-ink-soft/70">Fechas por Definir</p>
          <ul className="space-y-1">
            {undated.map((item) => (
              <li className="text-sm text-ink-soft" key={item.key}>{item.name}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
