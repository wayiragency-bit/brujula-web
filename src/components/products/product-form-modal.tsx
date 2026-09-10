'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useProductCategories } from '@/hooks/use-products';
import { useSuppliers } from '@/hooks/use-suppliers';
import type { MarkupType, Product, ProductFormValues, ProductType, ProductUnit } from '@/lib/types';
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
};

function formatMoney(value: number, currency: string): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
}

export function ProductFormModal({ open, onClose, onSubmit, initial }: ProductFormModalProps) {
  const { data: categories } = useProductCategories();
  const { data: suppliers } = useSuppliers();
  const [values, setValues] = useState<ProductFormValues>(EMPTY);
  const [tagsInput, setTagsInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (initial) {
      setValues({
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
      });
      setTagsInput(initial.tags.join(', '));
    } else {
      setValues(EMPTY);
      setTagsInput('');
    }
  }, [open, initial]);

  function set<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
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
          <textarea className={inputClass} id="description" onChange={(e) => set('description', e.target.value)} rows={2} value={values.description} />
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
