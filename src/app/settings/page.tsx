'use client';

import { useState } from 'react';
import {
  Settings, User, Palette, Mail, CreditCard,
  Building2, CheckCircle, Shield, Globe2,
  Download, Receipt,
} from 'lucide-react';
import { useTheme } from '@/lib/theme-context';
import type { Theme } from '@/lib/theme-context';
import { AppShell } from '@/components/app-shell';
import { useAgency, useUpdateAgency } from '@/hooks/use-agency';
import { useAuth } from '@/lib/auth-context';
import type { Agency, AgencyFormValues, AgencyType, PaymentMethod } from '@/lib/types';
import { inputClass, labelClass, selectClass } from '@/components/ui/form';

/* ─── Tabs ─────────────────────────────────────────────────── */
type Tab = 'empresa' | 'perfil' | 'apariencia' | 'correo' | 'pagos';
const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'empresa',     label: 'Empresa',          icon: Building2   },
  { id: 'perfil',      label: 'Perfil',            icon: User        },
  { id: 'apariencia',  label: 'Apariencia',        icon: Palette     },
  { id: 'correo',      label: 'Correo',            icon: Mail        },
  { id: 'pagos',       label: 'Historial de Pago', icon: CreditCard  },
];

/* ─── Agency helpers ─────────────────────────────────────────── */
const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  BANK_TRANSFER: 'Transferencia Bancaria',
  CARD: 'Tarjeta de Crédito/Débito',
  CASH: 'Efectivo',
};

const AGENCY_TYPE_LABELS: Record<AgencyType, string> = {
  AGENCIA_VIAJES: 'Agencia de Viajes',
  OPERADOR_TURISTICO: 'Operador Turístico',
  HOTEL: 'Hotel',
  COMERCIALIZADOR_TURISTICO: 'Comercializador Turístico',
  OTRO: 'Otro',
};

function valuesFrom(agency: Agency): AgencyFormValues {
  return {
    name: agency.name, type: agency.type, logoUrl: agency.logoUrl ?? '', primaryColor: agency.primaryColor, baseCurrency: agency.baseCurrency,
    taxId: agency.taxId ?? '', contactEmail: agency.contactEmail ?? '', contactPhone: agency.contactPhone ?? '', address: agency.address ?? '',
    taxName: agency.taxName ?? '', taxPct: Number(agency.taxPct),
    paymentMethod: agency.paymentMethod, bankName: agency.bankName ?? '', bankAccount: agency.bankAccount ?? '', bankAccountHolder: agency.bankAccountHolder ?? '',
    termsText: agency.termsText ?? '',
  };
}

/* ─── Card wrapper ───────────────────────────────────────────── */
function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4 rounded-2xl bg-paper-card p-6 shadow-card" style={{ border: '1px solid var(--border)' }}>
      <div>
        <h2 className="font-display text-lg font-extrabold text-ink">{title}</h2>
        {subtitle && <p className="text-xs text-ink-soft">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

/* ─── Toggle row ─────────────────────────────────────────────── */
function ToggleRow({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3" style={{ borderBottom: '1px solid var(--border-faint)' }}>
      <div>
        <p className="text-sm font-medium text-ink">{label}</p>
        {desc && <p className="text-xs text-ink-soft">{desc}</p>}
      </div>
      <button
        className="relative flex h-6 w-11 shrink-0 items-center rounded-full transition-all"
        onClick={() => onChange(!checked)}
        style={{ background: checked ? '#feb23b' : 'var(--border)' }}
        type="button"
      >
        <span
          className="absolute h-4 w-4 rounded-full bg-white shadow transition-all"
          style={{ left: checked ? '26px' : '4px' }}
        />
      </button>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function SettingsPage() {
  const { data: agency, isLoading } = useAgency();
  const { hasPermission } = useAuth();
  const canEditAgency = hasPermission('settings.edit_agency');
  // Supervisor/Agente only manage their own profile and appearance; company config and billing stay with Administrador/Propietario.
  const visibleTabs = TABS.filter((t) => canEditAgency || t.id === 'perfil' || t.id === 'apariencia');
  const [tab, setTab] = useState<Tab>(canEditAgency ? 'empresa' : 'perfil');

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-content px-4 pb-28 pt-7 sm:px-6 lg:px-8 lg:pb-10">
        <header className="mb-6">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-amber" />
            <h1 className="font-display text-3xl font-extrabold text-ink">Configuración</h1>
          </div>
          <p className="mt-1 text-sm text-ink-soft">Gestiona tu cuenta, empresa y datos de facturación.</p>
        </header>

        {/* Tab bar */}
        <div
          className="mb-6 flex gap-1 overflow-x-auto rounded-xl p-1"
          style={{ background: 'var(--surface)', border: '1px solid var(--border-faint)' }}
        >
          {visibleTabs.map(({ id, label, icon: Icon }) => (
            <button
              className="flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all"
              key={id}
              onClick={() => setTab(id)}
              style={
                tab === id
                  ? { background: 'var(--paper-card)', color: '#feb23b', border: '1px solid rgba(254,178,59,0.2)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }
                  : { color: 'var(--ink-soft)', border: '1px solid transparent' }
              }
              type="button"
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="space-y-4">
          {tab === 'empresa' && canEditAgency && (
            isLoading || !agency
              ? <p className="text-ink-soft">Cargando configuración…</p>
              : <AgencySettingsForm agency={agency} key={agency.id} />
          )}
          {tab === 'perfil'     && <ProfileTab />}
          {tab === 'apariencia' && <AparienciaTab />}
          {tab === 'correo'     && canEditAgency && <CorreoTab />}
          {tab === 'pagos'      && canEditAgency && <PagosTab />}
        </div>
      </div>
    </AppShell>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB: EMPRESA (existing logic, unchanged)
══════════════════════════════════════════════════════════════ */
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
      {!canEdit && (
        <p className="rounded-lg px-4 py-3 text-sm text-amber" style={{ background: 'rgba(254,178,59,0.10)' }}>
          Tu rol solo permite ver esta configuración. Pide a un administrador que la edite.
        </p>
      )}

      <Card title="Información General" subtitle="Datos públicos que aparecerán en tus cotizaciones.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="name">Nombre de la Empresa</label>
            <input className={inputClass} disabled={!canEdit} id="name" onChange={(e) => set('name', e.target.value)} value={values.name} />
          </div>
          <div>
            <label className={labelClass} htmlFor="agencyType">Tipo de Empresa</label>
            <select className={selectClass} disabled={!canEdit} id="agencyType" onChange={(e) => set('type', e.target.value as AgencyType)} value={values.type}>
              {Object.entries(AGENCY_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
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
              <input className="h-10 w-14 rounded-lg" disabled={!canEdit} onChange={(e) => set('primaryColor', e.target.value)} style={{ border: '1px solid rgba(255,255,255,0.1)' }} type="color" value={values.primaryColor} />
              <input className={inputClass} disabled={!canEdit} onChange={(e) => set('primaryColor', e.target.value)} value={values.primaryColor} />
            </div>
          </div>
        </div>
        <div>
          <label className={labelClass} htmlFor="address">Dirección Fiscal</label>
          <textarea className={inputClass} disabled={!canEdit} id="address" onChange={(e) => set('address', e.target.value)} rows={2} value={values.address} />
        </div>
      </Card>

      <Card title="Configuración Fiscal" subtitle="Moneda e impuestos aplicados por defecto.">
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
      </Card>

      <Card title="Datos Bancarios" subtitle="Para recibir transferencias de tus clientes.">
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
      </Card>

      <Card title="Términos y Condiciones" subtitle="Se adjuntarán al final de cada cotización.">
        <textarea className={inputClass} disabled={!canEdit} onChange={(e) => set('termsText', e.target.value)} rows={5} value={values.termsText} />
      </Card>

      {error && <p className="rounded-lg px-4 py-3 text-sm text-red-400" style={{ background: 'rgba(248,113,113,0.10)' }}>{error}</p>}
      {saved && <p className="rounded-lg px-4 py-3 text-sm text-green-400" style={{ background: 'rgba(74,222,128,0.10)' }}>Cambios guardados.</p>}

      {canEdit && (
        <div className="flex justify-end">
          <button className="button-primary" disabled={submitting} onClick={handleSave} type="button">
            {submitting ? 'Guardando…' : 'Guardar Cambios'}
          </button>
        </div>
      )}
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB: PERFIL
══════════════════════════════════════════════════════════════ */
function ProfileTab() {
  const { user, updateProfile } = useAuth();
  const [name, setName]         = useState(user?.name ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [email, setEmail]       = useState(user?.email ?? '');
  const [phone, setPhone]       = useState(user?.phone ?? '');
  const [saved, setSaved]       = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwSaved, setPwSaved]     = useState(false);
  const [pwError, setPwError]     = useState<string | null>(null);
  const [pwSubmitting, setPwSubmitting] = useState(false);

  function initials(n: string) {
    const p = n.trim().split(/\s+/);
    return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase() || '??';
  }

  async function handleSaveProfile() {
    setError(null);
    setSubmitting(true);
    try {
      await updateProfile({ name, lastName, email, phone: phone || undefined });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el perfil.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleChangePassword() {
    setPwError(null);
    setPwSubmitting(true);
    try {
      await updateProfile({ currentPassword: currentPw, newPassword: newPw });
      setCurrentPw(''); setNewPw(''); setConfirmPw(''); setPwSaved(true);
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'No se pudo actualizar la contraseña.');
    } finally {
      setPwSubmitting(false);
    }
  }

  return (
    <>
      <Card title="Información Personal" subtitle="Así te ven tus clientes y compañeros de equipo.">
        {/* Avatar preview */}
        <div className="flex items-center gap-4">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full font-mono text-xl font-bold"
            style={{ background: 'rgba(17,67,63,0.9)', color: '#feb23b', boxShadow: '0 0 0 3px rgba(254,178,59,0.25)' }}
          >
            {initials(`${name} ${lastName}`.trim())}
          </div>
          <div>
            <p className="font-semibold text-ink">{[name, lastName].filter(Boolean).join(' ') || '—'}</p>
            <p className="text-sm text-ink-soft">{user?.roles[0]?.name ?? 'Miembro'}</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="pf-name">Nombre</label>
            <input className={inputClass} id="pf-name" onChange={(e) => { setName(e.target.value); setSaved(false); }} value={name} />
          </div>
          <div>
            <label className={labelClass} htmlFor="pf-lastname">Apellido</label>
            <input className={inputClass} id="pf-lastname" onChange={(e) => { setLastName(e.target.value); setSaved(false); }} value={lastName} />
          </div>
          <div>
            <label className={labelClass} htmlFor="pf-email">Correo electrónico</label>
            <input className={inputClass} id="pf-email" onChange={(e) => { setEmail(e.target.value); setSaved(false); }} type="email" value={email} />
          </div>
          <div>
            <label className={labelClass} htmlFor="pf-phone">Número de teléfono</label>
            <input className={inputClass} id="pf-phone" onChange={(e) => { setPhone(e.target.value); setSaved(false); }} placeholder="+573001234567" value={phone ?? ''} />
          </div>
          <div>
            <label className={labelClass}>Rol</label>
            <div
              className="flex h-10 items-center rounded-lg px-3 text-sm text-ink-soft"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              {user?.roles[0]?.name ?? 'Sin rol asignado'}
            </div>
          </div>
          <div>
            <label className={labelClass}>Empresa</label>
            <div
              className="flex h-10 items-center rounded-lg px-3 text-sm text-ink-soft"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              {user?.agency?.name ?? '—'}
            </div>
          </div>
        </div>

        {error && <p className="rounded-lg px-4 py-3 text-sm text-red-400" style={{ background: 'rgba(248,113,113,0.10)' }}>{error}</p>}
        {saved && <p className="rounded-lg px-4 py-3 text-sm text-green-400" style={{ background: 'rgba(74,222,128,0.10)' }}>Perfil actualizado.</p>}

        <div className="flex justify-end">
          <button
            className="button-primary"
            disabled={submitting}
            onClick={handleSaveProfile}
            type="button"
          >
            {submitting ? 'Guardando…' : 'Guardar Perfil'}
          </button>
        </div>
      </Card>

      <Card title="Cambiar Contraseña" subtitle="Usa una contraseña fuerte de al menos 10 caracteres.">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass} htmlFor="pw-current">Contraseña actual</label>
            <input className={inputClass} id="pw-current" onChange={(e) => { setCurrentPw(e.target.value); setPwSaved(false); }} placeholder="••••••••" type="password" value={currentPw} />
          </div>
          <div>
            <label className={labelClass} htmlFor="pw-new">Nueva contraseña</label>
            <input className={inputClass} id="pw-new" onChange={(e) => { setNewPw(e.target.value); setPwSaved(false); }} placeholder="••••••••" type="password" value={newPw} />
          </div>
          <div>
            <label className={labelClass} htmlFor="pw-confirm">Confirmar nueva</label>
            <input className={inputClass} id="pw-confirm" onChange={(e) => { setConfirmPw(e.target.value); setPwSaved(false); }} placeholder="••••••••" type="password" value={confirmPw} />
          </div>
        </div>
        {newPw && confirmPw && newPw !== confirmPw && (
          <p className="rounded-lg px-4 py-3 text-sm text-red-400" style={{ background: 'rgba(248,113,113,0.10)' }}>Las contraseñas no coinciden.</p>
        )}
        {pwError && <p className="rounded-lg px-4 py-3 text-sm text-red-400" style={{ background: 'rgba(248,113,113,0.10)' }}>{pwError}</p>}
        {pwSaved && <p className="rounded-lg px-4 py-3 text-sm text-green-400" style={{ background: 'rgba(74,222,128,0.10)' }}>Contraseña actualizada.</p>}
        <div className="flex justify-end">
          <button
            className="button-secondary"
            disabled={!currentPw || !newPw || newPw !== confirmPw || pwSubmitting}
            onClick={handleChangePassword}
            type="button"
          >
            <Shield className="h-3.5 w-3.5" /> {pwSubmitting ? 'Actualizando…' : 'Actualizar Contraseña'}
          </button>
        </div>
      </Card>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB: APARIENCIA
══════════════════════════════════════════════════════════════ */
function AparienciaTab() {
  const { theme, setTheme } = useTheme();
  const [compactMode, setCompactMode] = useState(false);
  const [animations, setAnimations]   = useState(true);
  const [lang, setLang]               = useState('es');

  const THEMES: { id: Theme; label: string; preview: string }[] = [
    { id: 'dark',  label: 'Oscuro',  preview: '#0d1117' },
    { id: 'light', label: 'Claro',   preview: '#f1f5f9' },
    { id: 'auto',  label: 'Sistema', preview: 'linear-gradient(135deg,#0d1117 50%,#f1f5f9 50%)' },
  ];

  return (
    <>
      <Card title="Tema y Visualización" subtitle="Personaliza cómo se ve Brújula en tu pantalla.">

        {/* Theme selector */}
        <div className="mb-2">
          <p className={labelClass}>Tema de color</p>
          <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {THEMES.map((t) => {
              const active = theme === t.id;
              return (
                <button
                  className="flex items-center gap-3 rounded-xl p-3 text-sm font-medium transition"
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  style={
                    active
                      ? { background: 'var(--paper-card)', border: '1px solid #feb23b', color: '#feb23b' }
                      : { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--ink-soft)' }
                  }
                  type="button"
                >
                  <span
                    className="h-8 w-8 shrink-0 rounded-lg"
                    style={{ background: t.preview, border: '1px solid var(--border)' }}
                  />
                  {t.label}
                  {active && <CheckCircle className="ml-auto h-4 w-4" />}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-faint)', paddingTop: 16 }}>
          <ToggleRow
            label="Modo compacto"
            desc="Reduce el espaciado para ver más contenido por pantalla."
            checked={compactMode}
            onChange={setCompactMode}
          />
          <ToggleRow
            label="Animaciones"
            desc="Transiciones y efectos visuales en la interfaz."
            checked={animations}
            onChange={setAnimations}
          />
        </div>
      </Card>

      <Card title="Idioma y Región" subtitle="Configura el idioma y formato de fechas.">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="lang">
              <Globe2 className="mr-1.5 inline h-3 w-3" />Idioma
            </label>
            <select className={selectClass} id="lang" onChange={(e) => setLang(e.target.value)} value={lang}>
              <option value="es">Español</option>
              <option value="en">English</option>
              <option value="pt">Português</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Zona horaria</label>
            <div
              className="flex h-10 items-center rounded-lg px-3 text-sm text-ink-soft"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              America/Bogota (UTC-5)
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button className="button-primary" type="button">Guardar Preferencias</button>
        </div>
      </Card>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB: CORREO
══════════════════════════════════════════════════════════════ */
function CorreoTab() {
  const [notifs, setNotifs] = useState({
    cotizacionAceptada: true,
    cotizacionVencida: true,
    nuevoCliente: false,
    resumenSemanal: true,
    actividadEquipo: false,
    pagoRecibido: true,
  });

  function toggle(key: keyof typeof notifs) {
    setNotifs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <>
      <Card title="Cuenta de Envío" subtitle="Correo desde el que se envían tus cotizaciones a clientes.">
        <div className="flex items-center gap-3 rounded-xl p-4" style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)' }}>
          <Mail className="h-5 w-5 shrink-0 text-sky-400" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-ink">brujula-noreply@resend.dev</p>
            <p className="text-xs text-ink-soft">Dominio personalizado próximamente disponible.</p>
          </div>
          <span className="rounded-full px-2.5 py-1 text-xs font-bold text-green-400" style={{ background: 'rgba(74,222,128,0.12)' }}>
            Activo
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="email-from-name">Nombre del remitente</label>
            <input className={inputClass} defaultValue="Brújula" id="email-from-name" />
          </div>
          <div>
            <label className={labelClass} htmlFor="email-reply">Correo de respuesta (reply-to)</label>
            <input className={inputClass} defaultValue="" id="email-reply" placeholder="hola@tuempresa.com" type="email" />
          </div>
        </div>

        <div className="flex justify-end">
          <button className="button-primary" type="button">Guardar</button>
        </div>
      </Card>

      <Card title="Notificaciones por Correo" subtitle="Elige qué eventos te notifican por email.">
        <ToggleRow
          label="Cotización aceptada"
          desc="Recibe un aviso cuando un cliente acepta tu cotización."
          checked={notifs.cotizacionAceptada}
          onChange={() => toggle('cotizacionAceptada')}
        />
        <ToggleRow
          label="Cotización vencida"
          desc="Alerta cuando una cotización enviada supera su fecha de validez."
          checked={notifs.cotizacionVencida}
          onChange={() => toggle('cotizacionVencida')}
        />
        <ToggleRow
          label="Pago recibido"
          desc="Notificación cuando un cliente registra un anticipo o pago."
          checked={notifs.pagoRecibido}
          onChange={() => toggle('pagoRecibido')}
        />
        <ToggleRow
          label="Nuevo cliente registrado"
          desc="Aviso cuando se crea un nuevo cliente en el CRM."
          checked={notifs.nuevoCliente}
          onChange={() => toggle('nuevoCliente')}
        />
        <ToggleRow
          label="Actividad del equipo"
          desc="Resumen de lo que hacen tus agentes (cotizaciones, clientes)."
          checked={notifs.actividadEquipo}
          onChange={() => toggle('actividadEquipo')}
        />
        <ToggleRow
          label="Resumen semanal"
          desc="Informe de rendimiento los lunes a las 8 AM."
          checked={notifs.resumenSemanal}
          onChange={() => toggle('resumenSemanal')}
        />

        <div className="flex justify-end pt-2">
          <button className="button-primary" type="button">Guardar Preferencias</button>
        </div>
      </Card>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════
   TAB: HISTORIAL DE PAGO
══════════════════════════════════════════════════════════════ */
const MOCK_PLAN = {
  name: 'Pro',
  price: '$49 USD/mes',
  renewsOn: '10 Oct 2026',
  seats: 5,
  usedSeats: 2,
};

export function PagosTab() {
  return (
    <>
      {/* Current plan */}
      <Card title="Plan Actual">
        <div
          className="flex flex-wrap items-center justify-between gap-4 rounded-xl p-5"
          style={{ background: 'rgba(254,178,59,0.06)', border: '1px solid rgba(254,178,59,0.2)' }}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: 'rgba(254,178,59,0.15)' }}>
              <CreditCard className="h-5 w-5 text-amber" />
            </div>
            <div>
              <p className="font-display text-lg font-extrabold text-amber">Plan {MOCK_PLAN.name}</p>
              <p className="text-sm text-ink-soft">{MOCK_PLAN.price} · Renueva el {MOCK_PLAN.renewsOn}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="button-secondary text-sm" type="button">Cambiar Plan</button>
            <button className="rounded-lg px-4 py-2 text-sm font-semibold text-red-400 transition" style={{ background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.2)' }} type="button">Cancelar</button>
          </div>
        </div>

        {/* Seats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Usuarios activos', value: `${MOCK_PLAN.usedSeats} / ${MOCK_PLAN.seats}` },
            { label: 'Cotizaciones / mes', value: 'Ilimitadas' },
            { label: 'Almacenamiento', value: '5 GB' },
            { label: 'Soporte', value: 'Prioritario' },
          ].map((s) => (
            <div
              className="rounded-xl p-4 text-center"
              key={s.label}
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-faint)' }}
            >
              <p className="font-mono text-lg font-bold text-ink">{s.value}</p>
              <p className="text-xs text-ink-soft">{s.label}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Billing history */}
      <Card title="Historial de Facturación" subtitle="Descarga los comprobantes de tus pagos anteriores.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-faint)' }}>
                {['FECHA', 'DESCRIPCIÓN', 'MONTO', 'ESTADO', 'COMPROBANTE'].map((h) => (
                  <th className="label-caps pb-3 text-left text-ink-soft" key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { date: '10 Sep 2026', desc: 'Plan Pro · Septiembre 2026', amount: '$49.00 USD', status: 'Pagado' },
                { date: '10 Ago 2026', desc: 'Plan Pro · Agosto 2026',     amount: '$49.00 USD', status: 'Pagado' },
                { date: '10 Jul 2026', desc: 'Plan Pro · Julio 2026',      amount: '$49.00 USD', status: 'Pagado' },
              ].map((row, i) => (
                <tr
                  key={i}
                  style={{ borderBottom: '1px solid var(--border-faint)' }}
                >
                  <td className="py-3 text-ink-soft">{row.date}</td>
                  <td className="py-3 text-ink">{row.desc}</td>
                  <td className="py-3 font-mono font-semibold text-ink">{row.amount}</td>
                  <td className="py-3">
                    <span className="rounded-full px-2.5 py-1 text-xs font-bold text-green-400" style={{ background: 'rgba(74,222,128,0.12)' }}>
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3">
                    <button className="flex items-center gap-1.5 text-xs font-semibold text-ink-soft transition hover:text-ink" type="button">
                      <Download className="h-3.5 w-3.5" /> PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          className="mt-2 flex items-start gap-3 rounded-xl p-4 text-xs text-ink-soft"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-faint)' }}
        >
          <Receipt className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
          <span>Los comprobantes se emiten automáticamente y se envían a tu correo de facturación. Para cambiar el correo de facturación contacta a soporte.</span>
        </div>
      </Card>
    </>
  );
}
