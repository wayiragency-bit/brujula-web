'use client';

import { Clock, Plus, Trash2 } from 'lucide-react';
import { inputClass, labelClass } from '@/components/ui/form';
import type { PriceTier, QuoteItemDraft, QuoteItemExtra, QuoteItemView } from '@/lib/types';

const TIER_LABELS: Record<PriceTier, string> = {
  BASE: 'Base',
  INTERMEDIATE: 'Intermedio',
  IDEAL: 'Ideal',
  CUSTOM: 'Personalizado',
};

function formatMoney(value: string | number | undefined, currency: string): string {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
}

function formatTime12h(time: string): string {
  const [hStr, m] = time.split(':');
  let h = parseInt(hStr, 10) % 24;
  const period = h >= 12 ? 'p.m.' : 'a.m.';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${m} ${period}`;
}

function formatDuration(hours: string): string {
  const n = Number(hours);
  return `${Number.isInteger(n) ? n : n.toFixed(1)} Horas`;
}

interface QuoteItemCardProps {
  item: QuoteItemDraft & { key: string };
  line?: QuoteItemView;
  currency: string;
  editable: boolean;
  canEditPricing: boolean;
  canViewFinancial: boolean;
  onChange: (patch: Partial<QuoteItemDraft>) => void;
  onRemove: () => void;
}

export function QuoteItemCard({ item, line, currency, editable, canEditPricing, canViewFinancial, onChange, onRemove }: QuoteItemCardProps) {
  const extras = item.extras ?? [];
  const tier = item.priceTier ?? 'IDEAL';
  const showsNights = item.unit === 'PER_NIGHT';
  const isTimedTour = item.reservationMode === 'HOUR' && !!item.durationHours && !!item.startTime && !!item.endTime;
  const quantity = Number(item.quantity) || 0;
  const total = Number(line?.sellPrice ?? 0);
  const unitPrice = quantity > 0 ? total / quantity : total;

  function addExtra() {
    onChange({ extras: [...extras, { title: '', quantity: 1, price: 0 }] });
  }

  function updateExtra(index: number, patch: Partial<QuoteItemExtra>) {
    onChange({ extras: extras.map((extra, i) => (i === index ? { ...extra, ...patch } : extra)) });
  }

  function removeExtra(index: number) {
    onChange({ extras: extras.filter((_, i) => i !== index) });
  }

  function updateCheckIn(value: string) {
    const v = value || null;
    onChange(isTimedTour ? { serviceDate: v, serviceEndDate: v } : { serviceDate: v });
  }

  return (
    <div className="space-y-3 rounded-xl border border-ink/10 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" src={item.imageUrl} />
          ) : (
            <div className="h-12 w-12 shrink-0 rounded-lg bg-ink/5" />
          )}
          <div className="min-w-0">
            {item.productId ? (
              <p className="font-medium text-ink">{item.name}</p>
            ) : (
              <input
                className={`${inputClass} font-medium`}
                disabled={!editable}
                onChange={(e) => onChange({ name: e.target.value })}
                placeholder="Nombre del ítem"
                value={item.name}
              />
            )}
            {item.description ? <p className="mt-0.5 text-xs text-ink-soft">{item.description}</p> : null}
            <div className="mt-2 flex flex-wrap gap-2">
              <label className="inline-flex items-center gap-1.5 rounded-lg border border-ink/10 px-2 py-1 text-xs text-ink-soft">
                Adultos
                <input
                  className="w-8 border-0 bg-transparent p-0 text-xs font-semibold text-ink focus:outline-none"
                  disabled={!editable}
                  min={0}
                  onChange={(e) => onChange({ adults: Number(e.target.value) })}
                  type="number"
                  value={item.adults ?? 1}
                />
              </label>
              <label className="inline-flex items-center gap-1.5 rounded-lg border border-ink/10 px-2 py-1 text-xs text-ink-soft">
                Niños
                <input
                  className="w-8 border-0 bg-transparent p-0 text-xs font-semibold text-ink focus:outline-none"
                  disabled={!editable}
                  min={0}
                  onChange={(e) => onChange({ children: Number(e.target.value) })}
                  type="number"
                  value={item.children ?? 0}
                />
              </label>
              {showsNights ? (
                <label className="inline-flex items-center gap-1.5 rounded-lg border border-ink/10 px-2 py-1 text-xs text-ink-soft">
                  Noches
                  <input
                    className="w-8 border-0 bg-transparent p-0 text-xs font-semibold text-ink focus:outline-none"
                    disabled={!editable}
                    min={0}
                    onChange={(e) => onChange({ nights: Number(e.target.value) })}
                    type="number"
                    value={item.nights ?? 1}
                  />
                </label>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <div className="flex items-center gap-1.5">
            {canEditPricing ? (
              <select
                className="rounded-lg border border-ink/15 bg-transparent px-2 py-1 text-xs font-semibold text-ink-soft"
                disabled={!editable}
                onChange={(e) => onChange({ priceTier: e.target.value as PriceTier })}
                value={tier}
              >
                {(Object.keys(TIER_LABELS) as PriceTier[]).map((t) => (
                  <option key={t} value={t}>{TIER_LABELS[t]}</option>
                ))}
              </select>
            ) : null}
            <input
              className={`${inputClass} w-14 py-1 text-center`}
              disabled={!editable}
              min={0}
              onChange={(e) => onChange({ quantity: e.target.value })}
              step="1"
              type="number"
              value={quantity}
            />
            {editable ? (
              <button aria-label="Quitar" className="rounded-lg p-1.5 text-ink-soft hover:bg-red-50 hover:text-red-600" onClick={onRemove} type="button">
                <Trash2 className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          <div className="text-right">
            <p className="font-mono text-sm font-bold text-ink">{formatMoney(total, currency)}</p>
            {quantity > 1 ? <p className="font-mono text-xs text-ink-soft">{formatMoney(unitPrice, currency)} c/u</p> : null}
          </div>
          {canEditPricing && tier === 'CUSTOM' ? (
            <input
              className={`${inputClass} w-24 py-1 text-right`}
              disabled={!editable}
              min={0}
              onChange={(e) => onChange({ markupValue: e.target.value })}
              placeholder="Margen %"
              step="0.01"
              type="number"
              value={item.markupValue ?? '0'}
            />
          ) : null}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className={labelClass}>Extras y Adicionales</label>
          {editable ? (
            <button className="inline-flex items-center gap-1 text-xs font-semibold text-teal" onClick={addExtra} type="button">
              <Plus className="h-3.5 w-3.5" /> Añadir Extra
            </button>
          ) : null}
        </div>
        {extras.length === 0 ? (
          <p className="text-xs text-ink-soft/70">Sin extras en este ítem.</p>
        ) : (
          <div className="space-y-1.5">
            {extras.map((extra, index) => (
              <div className="grid grid-cols-[1fr_60px_90px_auto] items-center gap-1.5" key={index}>
                <input
                  className={`${inputClass} py-1`}
                  disabled={!editable}
                  onChange={(e) => updateExtra(index, { title: e.target.value })}
                  placeholder="Ej. Silla para bebé"
                  value={extra.title}
                />
                <input
                  className={`${inputClass} py-1`}
                  disabled={!editable}
                  min={1}
                  onChange={(e) => updateExtra(index, { quantity: Number(e.target.value) })}
                  type="number"
                  value={extra.quantity}
                />
                <input
                  className={`${inputClass} py-1`}
                  disabled={!editable}
                  min={0}
                  onChange={(e) => updateExtra(index, { price: Number(e.target.value) })}
                  type="number"
                  value={extra.price}
                />
                {editable ? (
                  <button aria-label="Quitar extra" onClick={() => removeExtra(index)} type="button">
                    <Trash2 className="h-3.5 w-3.5 text-ink-soft hover:text-red-600" />
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className={labelClass}>Check-in</label>
          <input
            className={`${inputClass} py-1.5`}
            disabled={!editable}
            onChange={(e) => updateCheckIn(e.target.value)}
            type="date"
            value={item.serviceDate ?? ''}
          />
        </div>
        {showsNights || isTimedTour ? (
          <div>
            <label className={labelClass}>{isTimedTour ? 'Check-out (auto)' : 'Check-out'}</label>
            <input
              className={`${inputClass} py-1.5`}
              disabled={!editable || isTimedTour}
              onChange={(e) => onChange({ serviceEndDate: e.target.value || null })}
              type="date"
              value={item.serviceEndDate ?? ''}
            />
          </div>
        ) : null}
        {isTimedTour ? (
          <div className="flex items-center gap-1.5 rounded-lg bg-ink/5 px-2.5 py-1.5 text-xs text-ink-soft">
            <Clock className="h-3.5 w-3.5" />
            {formatDuration(item.durationHours!)}
            <span>•</span>
            {formatTime12h(item.startTime!)} — {formatTime12h(item.endTime!)}
          </div>
        ) : null}
      </div>

      {canViewFinancial && line?.marginItem ? (
        <p className="text-xs text-status-accepted">Margen: {formatMoney(line.marginItem, currency)}</p>
      ) : null}
    </div>
  );
}
