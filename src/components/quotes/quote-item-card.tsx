'use client';

import { CalendarDays, Plus, Trash2 } from 'lucide-react';
import { inputClass, labelClass } from '@/components/ui/form';
import type { PriceTier, ProductUnit, QuoteItemDraft, QuoteItemExtra, QuoteItemView } from '@/lib/types';

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

  function addExtra() {
    onChange({ extras: [...extras, { title: '', quantity: 1, price: 0 }] });
  }

  function updateExtra(index: number, patch: Partial<QuoteItemExtra>) {
    onChange({ extras: extras.map((extra, i) => (i === index ? { ...extra, ...patch } : extra)) });
  }

  function removeExtra(index: number) {
    onChange({ extras: extras.filter((_, i) => i !== index) });
  }

  return (
    <div className="space-y-3 rounded-xl border border-ink/10 p-4">
      <div className="flex items-start justify-between gap-2">
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
          {item.description ? <p className="mt-0.5 truncate text-xs text-ink-soft">{item.description}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <p className="text-right font-mono text-sm font-bold text-ink">{formatMoney(line?.sellPrice, currency)}</p>
          {editable ? (
            <button aria-label="Quitar" className="rounded-lg p-1.5 text-ink-soft hover:bg-red-50 hover:text-red-600" onClick={onRemove} type="button">
              <Trash2 className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label className={labelClass}>Cant.</label>
          <input
            className={`${inputClass} py-1.5`}
            disabled={!editable}
            min={0}
            onChange={(e) => onChange({ quantity: e.target.value })}
            step="1"
            type="number"
            value={Number(item.quantity)}
          />
        </div>
        <div>
          <label className={labelClass}>Adultos</label>
          <input
            className={`${inputClass} py-1.5`}
            disabled={!editable}
            min={0}
            onChange={(e) => onChange({ adults: Number(e.target.value) })}
            type="number"
            value={item.adults ?? 1}
          />
        </div>
        <div>
          <label className={labelClass}>Niños</label>
          <input
            className={`${inputClass} py-1.5`}
            disabled={!editable}
            min={0}
            onChange={(e) => onChange({ children: Number(e.target.value) })}
            type="number"
            value={item.children ?? 0}
          />
        </div>
        {showsNights ? (
          <div>
            <label className={labelClass}>Noches</label>
            <input
              className={`${inputClass} py-1.5`}
              disabled={!editable}
              min={0}
              onChange={(e) => onChange({ nights: Number(e.target.value) })}
              type="number"
              value={item.nights ?? 1}
            />
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>{showsNights ? 'Check-in' : 'Fecha del Servicio'}</label>
          <input
            className={`${inputClass} py-1.5`}
            disabled={!editable}
            onChange={(e) => onChange({ serviceDate: e.target.value || null })}
            type="date"
            value={item.serviceDate ?? ''}
          />
        </div>
        {showsNights ? (
          <div>
            <label className={labelClass}>Check-out</label>
            <input
              className={`${inputClass} py-1.5`}
              disabled={!editable}
              onChange={(e) => onChange({ serviceEndDate: e.target.value || null })}
              type="date"
              value={item.serviceEndDate ?? ''}
            />
          </div>
        ) : null}
      </div>

      {canEditPricing ? (
        <div>
          <label className={labelClass}>Nivel de Precio</label>
          <div className="grid grid-cols-4 gap-1.5">
            {(Object.keys(TIER_LABELS) as PriceTier[]).map((t) => (
              <button
                className={`rounded-lg border px-2 py-1.5 text-xs font-semibold transition ${
                  tier === t ? 'border-teal bg-teal/10 text-teal' : 'border-ink/15 text-ink-soft hover:border-ink/30'
                }`}
                disabled={!editable}
                key={t}
                onClick={() => onChange({ priceTier: t })}
                type="button"
              >
                {TIER_LABELS[t]}
              </button>
            ))}
          </div>
          {tier === 'CUSTOM' ? (
            <input
              className={`${inputClass} mt-2 py-1.5`}
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
      ) : null}

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

      {canViewFinancial && line?.marginItem ? (
        <p className="flex items-center gap-1 text-xs text-status-accepted">
          <CalendarDays className="h-3 w-3" /> Margen: {formatMoney(line.marginItem, currency)}
        </p>
      ) : null}
    </div>
  );
}

export type { ProductUnit };
