'use client';

import { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { useAgency, useUpdateAgency } from '@/hooks/use-agency';
import { useAuth } from '@/lib/auth-context';
import type { Agency, AgencyFormValues, PaymentMethod } from '@/lib/types';
import { inputClass, labelClass, selectClass } from '@/components/ui/form';

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  BANK_TRANSFER: 'Transferencia Bancaria',
  CARD: 'Tarjeta de Crédito/Débito',
  CASH: 'Efectivo',
};

function valuesFrom(agency: Agency): AgencyFormValues {
  return {
    name: agency.name, logoUrl: agency.logoUrl ?? '', primaryColor: agency.primaryColor, baseCurrency: agency.baseCurrency,
    taxId: agency.taxId ?? '', contactEmail: agency.contactEmail ?? '', contactPhone: agency.contactPhone ?? '', address: agency.address ?? '',
    taxName: agency.taxName ?? '', taxPct: Number(agency.taxPct),
    paymentMethod: agency.paymentMethod, bankName: agency.bankName ?? '', bankAccount: agency.bankAccount ?? '', bankAccountHolder: agency.bankAccountHolder ?? '',
    termsText: agency.termsText ?? '',
  };
}

export default function SettingsPage() {
  const { data: agency, isLoading } = useAgency();

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-content space-y-6 px-4 pb-28 pt-7 sm:px-6 lg:px-8 lg:pb-10">
        <header>
          <h1 className="font-display text-3xl font-extrabold text-ink">Configuración</h1>
          <p className="mt-1 text-sm text-ink-soft">Gestiona tu cuenta, empresa y datos de facturación.</p>
        </header>
        {isLoading || !agency ? (
          <p className="text-ink-soft">Cargando configuración…</p>
        ) : (
          <AgencySettingsForm agency={agency} key={agency.id} />
        )}
      </div>
    </AppShell>
  );
}

function AgencySettingsForm({ agency }: { agency: Agency }) {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission('settings.edit_agency');
  const updateAgency = useUpdateAgency();
  const [values, setValues] = useState<AgencyFormValues>(() => valuesFrom(agency));
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof AgencyFormValues>(key: K, value: AgencyFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setError(null);
    setSubmitting(true);
    try {
      await updateAgency.mutateAsync({
        ...values,
        logoUrl: values.logoUrl || undefined,
        taxId: values.taxId || undefined,
        contactEmail: values.contactEmail || undefined,
        contactPhone: values.contactPhone || undefined,
        address: values.address || undefined,
        taxName: values.taxName || undefined,
        bankName: values.bankName || undefined,
        bankAccount: values.bankAccount || undefined,
        bankAccountHolder: values.bankAccountHolder || undefined,
        termsText: values.termsText || undefined,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la configuración.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {!canEdit ? (
          <p className="rounded-lg bg-amber/10 px-4 py-3 text-sm text-amber">Tu rol solo permite ver esta configuración. Pide a un administrador que la edite.</p>
        ) : null}

        <section className="space-y-4 rounded-2xl border border-ink/10 bg-paper-card p-6 shadow-card">
          <div>
            <h2 className="font-display text-lg font-extrabold text-ink">Información General</h2>
            <p className="text-xs text-ink-soft">Datos públicos que aparecerán en tus cotizaciones.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="name">Nombre de la Empresa</label>
              <input className={inputClass} disabled={!canEdit} id="name" onChange={(e) => set('name', e.target.value)} value={values.name} />
            </div>
            <div>
              <label className={labelClass} htmlFor="taxId">Identificación Fiscal (RFC/NIT)</label>
              <input className={inputClass} disabled={!canEdit} id="taxId" onChange={(e) => set('taxId', e.target.value)} value={values.taxId} />
            </div>
            <div>
              <label className={labelClass} htmlFor="contactEmail">Correo de Contacto</label>
              <input className={inputClass} disabled={!canEdit} id="contactEmail" onChange={(e) => set('contactEmail', e.target.value)} type="email" value={values.contactEmail} />
            </div>
            <div>
              <label className={labelClass} htmlFor="contactPhone">Teléfono</label>
              <input className={inputClass} disabled={!canEdit} id="contactPhone" onChange={(e) => set('contactPhone', e.target.value)} placeholder="+573001234567" value={values.contactPhone} />
            </div>
            <div>
              <label className={labelClass} htmlFor="logoUrl">Logo (URL)</label>
              <input className={inputClass} disabled={!canEdit} id="logoUrl" onChange={(e) => set('logoUrl', e.target.value)} placeholder="https://…" value={values.logoUrl} />
            </div>
            <div>
              <label className={labelClass} htmlFor="primaryColor">Color de Marca</label>
              <div className="flex items-center gap-2">
                <input className="h-10 w-14 rounded-lg border border-ink/15" disabled={!canEdit} onChange={(e) => set('primaryColor', e.target.value)} type="color" value={values.primaryColor} />
                <input className={inputClass} disabled={!canEdit} onChange={(e) => set('primaryColor', e.target.value)} value={values.primaryColor} />
              </div>
            </div>
          </div>
          <div>
            <label className={labelClass} htmlFor="address">Dirección Fiscal</label>
            <textarea className={inputClass} disabled={!canEdit} id="address" onChange={(e) => set('address', e.target.value)} rows={2} value={values.address} />
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-ink/10 bg-paper-card p-6 shadow-card">
          <div>
            <h2 className="font-display text-lg font-extrabold text-ink">Configuración Fiscal</h2>
            <p className="text-xs text-ink-soft">Moneda e impuestos aplicados por defecto.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={labelClass} htmlFor="baseCurrency">Moneda Principal</label>
              <input className={inputClass} disabled={!canEdit} id="baseCurrency" maxLength={3} onChange={(e) => set('baseCurrency', e.target.value.toUpperCase())} value={values.baseCurrency} />
            </div>
            <div>
              <label className={labelClass} htmlFor="taxName">Nombre del Impuesto</label>
              <input className={inputClass} disabled={!canEdit} id="taxName" onChange={(e) => set('taxName', e.target.value)} placeholder="IVA" value={values.taxName} />
            </div>
            <div>
              <label className={labelClass} htmlFor="taxPct">Tasa (%)</label>
              <input className={inputClass} disabled={!canEdit} id="taxPct" min={0} onChange={(e) => set('taxPct', Number(e.target.value))} type="number" value={values.taxPct} />
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-ink/10 bg-paper-card p-6 shadow-card">
          <div>
            <h2 className="font-display text-lg font-extrabold text-ink">Datos Bancarios</h2>
            <p className="text-xs text-ink-soft">Para recibir transferencias de tus clientes.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass} htmlFor="paymentMethod">Método Preferido</label>
              <select className={selectClass} disabled={!canEdit} id="paymentMethod" onChange={(e) => set('paymentMethod', e.target.value as PaymentMethod)} value={values.paymentMethod}>
                {Object.entries(PAYMENT_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="bankName">Banco</label>
              <input className={inputClass} disabled={!canEdit} id="bankName" onChange={(e) => set('bankName', e.target.value)} value={values.bankName} />
            </div>
            <div>
              <label className={labelClass} htmlFor="bankAccount">Número de Cuenta</label>
              <input className={inputClass} disabled={!canEdit} id="bankAccount" onChange={(e) => set('bankAccount', e.target.value)} value={values.bankAccount} />
            </div>
            <div>
              <label className={labelClass} htmlFor="bankAccountHolder">Titular de la Cuenta</label>
              <input className={inputClass} disabled={!canEdit} id="bankAccountHolder" onChange={(e) => set('bankAccountHolder', e.target.value)} value={values.bankAccountHolder} />
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-ink/10 bg-paper-card p-6 shadow-card">
          <div>
            <h2 className="font-display text-lg font-extrabold text-ink">Términos y Condiciones</h2>
            <p className="text-xs text-ink-soft">Se adjuntarán al final de cada cotización.</p>
          </div>
          <textarea className={inputClass} disabled={!canEdit} onChange={(e) => set('termsText', e.target.value)} rows={5} value={values.termsText} />
        </section>

        {error ? <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}
        {saved ? <p className="rounded-lg bg-status-accepted/10 px-4 py-3 text-sm text-status-accepted">Cambios guardados.</p> : null}

      {canEdit ? (
        <div className="flex justify-end">
          <button className="button-primary" disabled={submitting} onClick={handleSave} type="button">
            {submitting ? 'Guardando…' : 'Guardar Cambios'}
          </button>
        </div>
      ) : null}
    </>
  );
}
