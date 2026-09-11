'use client';

import { Plus, Trash2 } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { useProductCategories } from '@/hooks/use-products';
import { useSuppliers } from '@/hooks/use-suppliers';
import type { MarkupType, Product, ProductExtra, ProductFormValues, ProductType, ProductUnit, ReservationMode } from '@/lib/types';
import { Modal } from '@/components/ui/modal';
import { inputClass, labelClass, selectClass } from '@/components/ui/form';

interface ProductFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: ProductFormValues) => Promise<unknown>;
  initial?: Product;
}

const TYPE_LABELS: Record<ProductType, string> = {
  HOTEL: 'Alojamiento',
  TOUR: 'Tour',
  TRANSPORT: 'Transporte',
  FLIGHT: 'Boleto Aéreo',
  INSURANCE: 'Seguro',
  EXPERIENCE: 'Experiencia',
  OTHER: 'Otro',
};

const UNIT_LABELS: Record<ProductUnit, string> = {
  PER_SERVICE: 'Por servicio',
  PER_NIGHT: 'Por noche',
  PER_PERSON: 'Por persona',
};

const RESERVATION_MODE_LABELS: Record<ReservationMode, string> = {
  DAY: 'Por Día (Tours/Actividades)',
  NIGHT: 'Por Noches (Hoteles/Alojamientos)',
  HOUR: 'Por Hora (Traslados/Servicios)',
};

const EMPTY: ProductFormValues = {
  name: '',
  description: '',
  imageUrl: '',
  type: 'TOUR',
  category: '',
  tags: [],
  netCost: 0,
  currency: 'COP',
  unit: 'PER_SERVICE',
  markupType: 'PERCENT',
  markupValue: 0,
  taxPct: 0,
  supplierId: '',
  longDescription: '',
  reservationMode: 'DAY',
  durationHours: undefined,
  startTime: '',
  endTime: '',
  capacityTotal: undefined,
  capacityAdults: undefined,
  capacityChildren: undefined,
  pmsEnabled: false,
  blockedDates: [],
  stockPerDayEnabled: false,
  stockPerDayMax: undefined,
  extras: [],
};

function formatMoney(value: number, currency: string): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
}

function valuesFrom(initial?: Product): ProductFormValues {
  if (!initial) return EMPTY;
  return {
    name: initial.name,
    description: initial.description ?? '',
    imageUrl: initial.imageUrl ?? '',
    type: initial.type,
    category: initial.category ?? '',
    tags: initial.tags,
    netCost: initial.netCost,
    currency: initial.currency,
    unit: initial.unit,
    markupType: initial.markupType,
    markupValue: initial.markupValue,
    taxPct: initial.taxPct,
    supplierId: initial.supplierId ?? '',
    longDescription: initial.longDescription ?? '',
    reservationMode: initial.reservationMode,
    durationHours: initial.durationHours ?? undefined,
    startTime: initial.startTime ?? '',
    endTime: initial.endTime ?? '',
    capacityTotal: initial.capacityTotal ?? undefined,
    capacityAdults: initial.capacityAdults ?? undefined,
    capacityChildren: initial.capacityChildren ?? undefined,
    pmsEnabled: initial.pmsEnabled,
    blockedDates: initial.blockedDates,
    stockPerDayEnabled: initial.stockPerDayEnabled,
    stockPerDayMax: initial.stockPerDayMax ?? undefined,
    extras: initial.extras,
  };
}

export function ProductFormModal({ open, onClose, onSubmit, initial }: ProductFormModalProps) {
  const { data: categories } = useProductCategories();
  const { data: suppliers } = useSuppliers();
  const [values, setValues] = useState<ProductFormValues>(() => valuesFrom(initial));
  const [tagsInput, setTagsInput] = useState(() => initial?.tags.join(', ') ?? '');
  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function addExtra() {
    setValues((prev) => ({ ...prev, extras: [...prev.extras, { title: '', quantity: 1, price: 0 }] }));
  }

  function updateExtra(index: number, patch: Partial<ProductExtra>) {
    setValues((prev) => ({
      ...prev,
      extras: prev.extras.map((extra, i) => (i === index ? { ...extra, ...patch } : extra)),
    }));
  }

  function removeExtra(index: number) {
    setValues((prev) => ({ ...prev, extras: prev.extras.filter((_, i) => i !== index) }));
  }

  function addBlockedDate() {
    if (!newBlockedDate || values.blockedDates.includes(newBlockedDate)) return;
    setValues((prev) => ({ ...prev, blockedDates: [...prev.blockedDates, newBlockedDate].sort() }));
    setNewBlockedDate('');
  }

  function removeBlockedDate(date: string) {
    setValues((prev) => ({ ...prev, blockedDates: prev.blockedDates.filter((d) => d !== date) }));
  }

  const preview = useMemo(() => {
    const markup = values.markupType === 'PERCENT' ? (values.netCost * values.markupValue) / 100 : values.markupValue;
    const preTax = Math.max(0, values.netCost + markup);
    const tax = (preTax * values.taxPct) / 100;
    const sellPrice = preTax + tax;
    const marginAmount = preTax - values.netCost;
    const marginPct = sellPrice > 0 ? (marginAmount / sellPrice) * 100 : 0;
    return { sellPrice, marginAmount, marginPct };
  }, [values.netCost, values.markupType, values.markupValue, values.taxPct]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
      await onSubmit({
        ...values,
        tags,
        description: values.description || undefined,
        imageUrl: values.imageUrl || undefined,
        category: values.category || undefined,
        supplierId: values.supplierId || undefined,
        longDescription: values.longDescription || undefined,
        startTime: values.startTime || undefined,
        endTime: values.endTime || undefined,
        durationHours: values.reservationMode === 'HOUR' ? values.durationHours : undefined,
        extras: values.extras.filter((extra) => extra.title.trim().length > 0),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el producto.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      onClose={onClose}
      open={open}
      subtitle="Gestión de inventario y precios."
      title={initial ? 'Editar Producto' : 'Nuevo Producto'}
      wide
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="name">Nombre del Ítem</label>
            <input className={inputClass} id="name" onChange={(e) => set('name', e.target.value)} required value={values.name} />
          </div>
          <div>
            <label className={labelClass} htmlFor="type">Categoría</label>
            <select className={selectClass} id="type" onChange={(e) => set('type', e.target.value as ProductType)} value={values.type}>
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="category">Subcategoría</label>
            <input className={inputClass} id="category" list="category-options" onChange={(e) => set('category', e.target.value)} placeholder="Ej. Hotel, Fullday, Yate…" value={values.category} />
            <datalist id="category-options">
              {categories?.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div>
            <label className={labelClass} htmlFor="supplierId">Proveedor / Operador</label>
            <select className={selectClass} id="supplierId" onChange={(e) => set('supplierId', e.target.value)} value={values.supplierId}>
              <option value="">-- Producto Interno (Sin proveedor) --</option>
              {suppliers?.data.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>

        <div className="rounded-xl border border-ink/10 bg-paper p-4">
          <p className="label-caps mb-3 text-ink-soft">Estructura de Precios</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={labelClass} htmlFor="netCost">Costo Base</label>
              <input className={inputClass} id="netCost" min={0} onChange={(e) => set('netCost', Number(e.target.value))} step="0.01" type="number" value={values.netCost} />
            </div>
            <div>
              <label className={labelClass} htmlFor="markupType">Margen</label>
              <div className="flex gap-2">
                <select className={`${selectClass} w-24`} id="markupType" onChange={(e) => set('markupType', e.target.value as MarkupType)} value={values.markupType}>
                  <option value="PERCENT">%</option>
                  <option value="FIXED">$</option>
                </select>
                <input className={inputClass} min={0} onChange={(e) => set('markupValue', Number(e.target.value))} step="0.01" type="number" value={values.markupValue} />
              </div>
            </div>
            <div>
              <label className={labelClass} htmlFor="taxPct">Impuesto (%)</label>
              <input className={inputClass} id="taxPct" min={0} onChange={(e) => set('taxPct', Number(e.target.value))} step="0.01" type="number" value={values.taxPct} />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 border-t border-ink/10 pt-4 font-mono text-sm">
            <div>
              <p className="label-caps text-ink-soft">Precio Ideal</p>
              <p className="font-bold text-ink">{formatMoney(preview.sellPrice, values.currency)}</p>
            </div>
            <div>
              <p className="label-caps text-ink-soft">Ganancia Estimada</p>
              <p className="font-bold text-status-accepted">{formatMoney(preview.marginAmount, values.currency)}</p>
            </div>
            <div>
              <p className="label-caps text-ink-soft">Margen</p>
              <p className="font-bold text-ink">{preview.marginPct.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-ink/10 bg-paper p-4 space-y-4">
          <p className="label-caps text-ink-soft">Duración del Servicio</p>
          <div>
            <label className={labelClass}>Modalidad de Reserva</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(RESERVATION_MODE_LABELS) as [ReservationMode, string][]).map(([mode, label]) => (
                <button
                  className={`rounded-lg border px-2 py-2.5 text-center text-xs font-semibold transition ${
                    values.reservationMode === mode
                      ? 'border-teal bg-teal/10 text-teal'
                      : 'border-ink/15 text-ink-soft hover:border-ink/30'
                  }`}
                  key={mode}
                  onClick={() => set('reservationMode', mode)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {values.reservationMode === 'HOUR' ? (
            <div>
              <label className={labelClass} htmlFor="durationHours">Duración (Horas)</label>
              <input className={inputClass} id="durationHours" min={0} onChange={(e) => set('durationHours', Number(e.target.value))} step="0.5" type="number" value={values.durationHours ?? ''} />
            </div>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="startTime">Hora de Inicio</label>
              <input className={inputClass} id="startTime" onChange={(e) => set('startTime', e.target.value)} type="time" value={values.startTime} />
            </div>
            <div>
              <label className={labelClass} htmlFor="endTime">Hora de Finalización</label>
              <input className={inputClass} id="endTime" onChange={(e) => set('endTime', e.target.value)} type="time" value={values.endTime} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={labelClass} htmlFor="capacityTotal">Capacidad Total</label>
              <input className={inputClass} id="capacityTotal" min={0} onChange={(e) => set('capacityTotal', Number(e.target.value))} placeholder="Ej. 4" type="number" value={values.capacityTotal ?? ''} />
            </div>
            <div>
              <label className={labelClass} htmlFor="capacityAdults">Adultos</label>
              <input className={inputClass} id="capacityAdults" min={0} onChange={(e) => set('capacityAdults', Number(e.target.value))} type="number" value={values.capacityAdults ?? ''} />
            </div>
            <div>
              <label className={labelClass} htmlFor="capacityChildren">Niños</label>
              <input className={inputClass} id="capacityChildren" min={0} onChange={(e) => set('capacityChildren', Number(e.target.value))} type="number" value={values.capacityChildren ?? ''} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-ink/10 bg-paper p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="label-caps text-ink-soft">Gestión de Inventario (PMS)</p>
              <p className="text-xs text-ink-soft/70">Define si este producto utilizará el sistema de control de disponibilidad y reservas.</p>
            </div>
            <input checked={values.pmsEnabled} onChange={(e) => set('pmsEnabled', e.target.checked)} type="checkbox" />
          </div>
          {values.pmsEnabled ? (
            <div className="space-y-2 border-t border-ink/10 pt-3">
              <label className={labelClass}>Días No Laborables</label>
              <div className="flex gap-2">
                <input className={inputClass} onChange={(e) => setNewBlockedDate(e.target.value)} type="date" value={newBlockedDate} />
                <button className="button-secondary shrink-0" onClick={addBlockedDate} type="button">Bloquear</button>
              </div>
              {values.blockedDates.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {values.blockedDates.map((date) => (
                    <span className="inline-flex items-center gap-1 rounded-full bg-ink/5 px-2 py-1 font-mono text-[11px] text-ink-soft" key={date}>
                      {date}
                      <button aria-label={`Quitar ${date}`} onClick={() => removeBlockedDate(date)} type="button">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-ink-soft/70">No hay fechas bloqueadas.</p>
              )}
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-ink/10 bg-paper p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="label-caps text-ink-soft">Stock por Día</p>
              <p className="text-xs text-ink-soft/70">Limita el número máximo de reservas aceptadas por día para evitar saturación.</p>
            </div>
            <input checked={values.stockPerDayEnabled} onChange={(e) => set('stockPerDayEnabled', e.target.checked)} type="checkbox" />
          </div>
          {values.stockPerDayEnabled ? (
            <div className="border-t border-ink/10 pt-3">
              <label className={labelClass} htmlFor="stockPerDayMax">Máximo por Día</label>
              <input className={inputClass} id="stockPerDayMax" min={0} onChange={(e) => set('stockPerDayMax', Number(e.target.value))} type="number" value={values.stockPerDayMax ?? ''} />
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-ink/10 bg-paper p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="label-caps text-ink-soft">Extras y Adicionales</p>
            <button className="inline-flex items-center gap-1 text-xs font-semibold text-teal" onClick={addExtra} type="button">
              <Plus className="h-3.5 w-3.5" /> Añadir Extra
            </button>
          </div>
          {values.extras.length === 0 ? (
            <p className="text-xs text-ink-soft/70">No hay extras personalizados. Añade uno si el producto tiene costos adicionales opcionales.</p>
          ) : (
            <div className="space-y-2">
              {values.extras.map((extra, index) => (
                <div className="grid grid-cols-[1fr_80px_100px_auto] items-center gap-2" key={index}>
                  <input className={inputClass} onChange={(e) => updateExtra(index, { title: e.target.value })} placeholder="Ej. Desayuno Buffet" value={extra.title} />
                  <input className={inputClass} min={1} onChange={(e) => updateExtra(index, { quantity: Number(e.target.value) })} type="number" value={extra.quantity} />
                  <input className={inputClass} min={0} onChange={(e) => updateExtra(index, { price: Number(e.target.value) })} step="0.01" type="number" value={extra.price} />
                  <button aria-label="Eliminar extra" onClick={() => removeExtra(index)} type="button">
                    <Trash2 className="h-4 w-4 text-ink-soft hover:text-red-600" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="unit">Modalidad de Cobro</label>
            <select className={selectClass} id="unit" onChange={(e) => set('unit', e.target.value as ProductUnit)} value={values.unit}>
              {Object.entries(UNIT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="currency">Moneda</label>
            <input className={inputClass} id="currency" maxLength={3} onChange={(e) => set('currency', e.target.value.toUpperCase())} value={values.currency} />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="tags">Etiquetas (separadas por coma)</label>
          <input className={inputClass} id="tags" onChange={(e) => setTagsInput(e.target.value)} placeholder="familiar, aventura, todo incluido" value={tagsInput} />
        </div>

        <div>
          <label className={labelClass} htmlFor="imageUrl">URL de Imagen</label>
          <input className={inputClass} id="imageUrl" onChange={(e) => set('imageUrl', e.target.value)} placeholder="https://…" value={values.imageUrl} />
        </div>

        <div>
          <label className={labelClass} htmlFor="description">Descripción Corta</label>
          <textarea className={inputClass} id="description" maxLength={100} onChange={(e) => set('description', e.target.value)} rows={2} value={values.description} />
        </div>

        <div>
          <label className={labelClass} htmlFor="longDescription">Detalles Extendidos</label>
          <textarea className={inputClass} id="longDescription" onChange={(e) => set('longDescription', e.target.value)} placeholder="Agrega información detallada sobre el producto, itinerario, inclusiones, etc." rows={4} value={values.longDescription} />
        </div>

        {error ? <p className="text-sm text-red-600" role="alert">{error}</p> : null}

        <div className="flex justify-end gap-3 pt-2">
          <button className="button-secondary" onClick={onClose} type="button">Cancelar</button>
          <button className="button-primary" disabled={submitting} type="submit">
            {submitting ? 'Guardando…' : initial ? 'Guardar Cambios' : 'Crear Producto'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
