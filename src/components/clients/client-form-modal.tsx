'use client';

import { Lock } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useAuth } from '@/lib/auth-context';
import { COUNTRIES } from '@/lib/countries';
import type { Client, ClientFormValues } from '@/lib/types';
import { Modal } from '@/components/ui/modal';
import { inputClass, labelClass, selectClass } from '@/components/ui/form';

interface ClientFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: ClientFormValues) => Promise<unknown>;
  initial?: Client;
  /** Pre-fills the name field when creating a new client (e.g. from a search box that found no match). Ignored when `initial` is set. */
  initialName?: string;
}

const EMPTY: ClientFormValues = {
  name: '',
  type: 'DIRECT',
  phone: '',
  phoneCountry: 'CO',
  email: '',
  document: '',
  country: '',
  city: '',
  notes: '',
};

function valuesFrom(initial?: Client): ClientFormValues {
  if (!initial) return EMPTY;
  return {
    name: initial.name,
    type: initial.type,
    phone: initial.phone,
    phoneCountry: initial.phoneCountry,
    email: initial.email ?? '',
    document: initial.document ?? '',
    country: initial.country ?? '',
    city: initial.city ?? '',
    notes: initial.notes ?? '',
  };
}

export function ClientFormModal({ open, onClose, onSubmit, initial, initialName }: ClientFormModalProps) {
  const { user } = useAuth();
  const [values, setValues] = useState<ClientFormValues>(() => (initial ? valuesFrom(initial) : { ...EMPTY, name: initialName ?? '' }));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof ClientFormValues>(key: K, value: ClientFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload: ClientFormValues = {
        ...values,
        email: values.email || undefined,
        document: values.document || undefined,
        country: values.country || undefined,
        city: values.city || undefined,
        notes: values.notes || undefined,
      };
      await onSubmit(payload);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el cliente.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      onClose={onClose}
      open={open}
      subtitle={initial ? 'Actualiza los datos de este contacto.' : 'Registra un nuevo contacto en tu base de datos.'}
      title={initial ? 'Editar Cliente' : 'Nuevo Cliente'}
      wide
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label className={labelClass}>Asesor Propietario</label>
          <div
            className="flex h-10 items-center gap-2 rounded-lg px-3 text-sm text-ink-soft"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <span className="flex-1">{initial ? initial.seller?.name ?? '—' : user?.name}</span>
            <Lock className="h-3.5 w-3.5 shrink-0" />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="name">Nombre Completo / Razón Social</label>
            <input
              className={inputClass}
              id="name"
              onChange={(e) => set('name', e.target.value)}
              placeholder="Ej. Juan Pérez o Viajes S.A."
              required
              value={values.name}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="document">ID / Pasaporte / Cédula</label>
            <input
              className={inputClass}
              id="document"
              onChange={(e) => set('document', e.target.value)}
              placeholder="Ej. 123456789"
              value={values.document}
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="type">Tipo de Cliente</label>
            <select className={selectClass} id="type" onChange={(e) => set('type', e.target.value as ClientFormValues['type'])} value={values.type}>
              <option value="DIRECT">Viajero Directo</option>
              <option value="AGENCY">Agencia Partner</option>
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="country">País</label>
            <select className={selectClass} id="country" onChange={(e) => set('country', e.target.value)} value={values.country}>
              <option value="">Seleccionar país</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="city">Ciudad</label>
            <input className={inputClass} id="city" onChange={(e) => set('city', e.target.value)} placeholder="Ej. Cartagena" value={values.city} />
          </div>
          <div>
            <label className={labelClass} htmlFor="email">Correo Electrónico</label>
            <input className={inputClass} id="email" onChange={(e) => set('email', e.target.value)} placeholder="cliente@email.com" type="email" value={values.email} />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-[120px_1fr]">
          <div>
            <label className={labelClass} htmlFor="phoneCountry">Código</label>
            <select className={selectClass} id="phoneCountry" onChange={(e) => set('phoneCountry', e.target.value)} value={values.phoneCountry}>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass} htmlFor="phone">Teléfono (formato internacional)</label>
            <input
              className={inputClass}
              id="phone"
              onChange={(e) => set('phone', e.target.value)}
              placeholder="+573001234567"
              required
              value={values.phone}
            />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="notes">Notas Internas</label>
          <textarea
            className={inputClass}
            id="notes"
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Preferencias, alergias, detalles importantes…"
            rows={3}
            value={values.notes}
          />
        </div>

        {error ? <p className="text-sm text-red-600" role="alert">{error}</p> : null}

        <div className="flex justify-end gap-3 pt-2">
          <button className="button-secondary" onClick={onClose} type="button">Cancelar</button>
          <button className="button-primary" disabled={submitting} type="submit">
            {submitting ? 'Guardando…' : initial ? 'Guardar Cambios' : 'Registrar Cliente'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
