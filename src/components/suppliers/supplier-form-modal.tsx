'use client';

import { useState, type FormEvent } from 'react';
import type { Supplier, SupplierFormValues } from '@/lib/types';
import { Modal } from '@/components/ui/modal';
import { inputClass, labelClass } from '@/components/ui/form';

interface SupplierFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: SupplierFormValues) => Promise<unknown>;
  initial?: Supplier;
}

const EMPTY: SupplierFormValues = { name: '', contact: '', email: '', phone: '', commissionPct: 0, notes: '' };

function valuesFrom(initial?: Supplier): SupplierFormValues {
  if (!initial) return EMPTY;
  return {
    name: initial.name,
    contact: initial.contact ?? '',
    email: initial.email ?? '',
    phone: initial.phone ?? '',
    commissionPct: Number(initial.commissionPct),
    notes: initial.notes ?? '',
  };
}

export function SupplierFormModal({ open, onClose, onSubmit, initial }: SupplierFormModalProps) {
  const [values, setValues] = useState<SupplierFormValues>(() => valuesFrom(initial));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof SupplierFormValues>(key: K, value: SupplierFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        ...values,
        contact: values.contact || undefined,
        email: values.email || undefined,
        phone: values.phone || undefined,
        notes: values.notes || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el proveedor.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal onClose={onClose} open={open} subtitle="Datos de contacto y comisión del operador." title={initial ? 'Editar Proveedor' : 'Nuevo Proveedor'}>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className={labelClass} htmlFor="name">Nombre del Proveedor</label>
          <input className={inputClass} id="name" onChange={(e) => set('name', e.target.value)} required value={values.name} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="contact">Contacto</label>
            <input className={inputClass} id="contact" onChange={(e) => set('contact', e.target.value)} placeholder="Nombre y cargo" value={values.contact} />
          </div>
          <div>
            <label className={labelClass} htmlFor="commissionPct">Comisión (%)</label>
            <input className={inputClass} id="commissionPct" min={0} onChange={(e) => set('commissionPct', Number(e.target.value))} step="0.01" type="number" value={values.commissionPct} />
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="email">Correo</label>
            <input className={inputClass} id="email" onChange={(e) => set('email', e.target.value)} type="email" value={values.email} />
          </div>
          <div>
            <label className={labelClass} htmlFor="phone">Teléfono</label>
            <input className={inputClass} id="phone" onChange={(e) => set('phone', e.target.value)} placeholder="+573001234567" value={values.phone} />
          </div>
        </div>
        <div>
          <label className={labelClass} htmlFor="notes">Notas</label>
          <textarea className={inputClass} id="notes" onChange={(e) => set('notes', e.target.value)} rows={2} value={values.notes} />
        </div>

        {error ? <p className="text-sm text-red-600" role="alert">{error}</p> : null}

        <div className="flex justify-end gap-3 pt-2">
          <button className="button-secondary" onClick={onClose} type="button">Cancelar</button>
          <button className="button-primary" disabled={submitting} type="submit">
            {submitting ? 'Guardando…' : initial ? 'Guardar Cambios' : 'Registrar Proveedor'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
