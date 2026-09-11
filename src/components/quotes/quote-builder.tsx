'use client';

import { ArrowLeft, ExternalLink, Lock, Plus, Search, UserPlus, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  useChangeQuoteStatus,
  useCreateQuote,
  usePreviewQuote,
  useQuoteAccess,
  useQuoteClientOptions,
  useRecordPayment,
  useRevokeQuoteAccess,
  useUpdateQuote,
} from '@/hooks/use-quotes';
import { useCreateClient } from '@/hooks/use-clients';
import type { CatalogProduct, ClientFormValues, Quote, QuoteHeaderDraft, QuoteItemDraft, QuoteStatus } from '@/lib/types';
import { inputClass, labelClass } from '@/components/ui/form';
import { QuoteItemCard } from '@/components/quotes/quote-item-card';
import { QuoteItinerary } from '@/components/quotes/quote-itinerary';
import { QuoteCatalogModal } from '@/components/quotes/quote-catalog-modal';
import { QuoteShareModal } from '@/components/quotes/quote-share-modal';
import { ClientFormModal } from '@/components/clients/client-form-modal';

interface DraftItem extends QuoteItemDraft {
  key: string;
}

const STATUS_LABELS: Record<QuoteStatus, string> = {
  BORRADOR: 'Borrador',
  ENVIADA: 'Enviada',
  ACEPTADA: 'Aceptada',
  ABONADA: 'Abonada',
  PAGADA: 'Pagada',
  RECHAZADA: 'Rechazada',
  VENCIDA: 'Vencida',
};

// Mirrors assertEditable() in the API's quote-policy.ts — a sent/accepted/partially-paid booking can
// still need a date or product change; only PAGADA (paidAt set) locks the historical cost basis, and
// RECHAZADA/VENCIDA must be reopened first.
const EDITABLE_STATUSES: QuoteStatus[] = ['BORRADOR', 'ENVIADA', 'ACEPTADA', 'ABONADA'];

const STATUS_COLORS: Record<QuoteStatus, string> = {
  BORRADOR: 'bg-ink/10 text-ink-soft',
  ENVIADA: 'bg-amber/15 text-amber',
  ACEPTADA: 'bg-status-accepted/15 text-status-accepted',
  ABONADA: 'bg-amber/15 text-amber',
  PAGADA: 'bg-status-accepted/15 text-status-accepted',
  RECHAZADA: 'bg-red-100 text-red-600',
  VENCIDA: 'bg-status-expired/15 text-status-expired',
};

function formatMoney(value: string | number | undefined, currency: string): string {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
}

function newKey(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

/** The API rejects unknown properties, so only DTO fields may travel. */
function toPayloadItem(item: DraftItem): QuoteItemDraft {
  return {
    id: item.id,
    productId: item.productId,
    name: item.name,
    description: item.description,
    unit: item.unit,
    quantity: item.quantity,
    nights: item.nights,
    adults: item.adults,
    children: item.children,
    currency: item.currency,
    fxRate: item.fxRate,
    netCost: item.netCost,
    markupType: item.markupType,
    markupValue: item.markupValue,
    discountItem: item.discountItem,
    taxPct: item.taxPct,
    serviceDate: item.serviceDate,
    serviceEndDate: item.serviceEndDate,
    priceTier: item.priceTier,
    extras: item.extras,
  };
}

function draftFromQuote(quote?: Quote): { header: QuoteHeaderDraft; items: DraftItem[] } {
  if (!quote) {
    return {
      header: { clientId: '', adults: 1, children: 0, validityDays: 7, notes: '', globalDiscount: '0', commissionBase: 'MARGIN', commissionPct: '0' },
      items: [],
    };
  }
  return {
    header: {
      clientId: quote.clientId,
      startDate: quote.startDate ?? undefined,
      endDate: quote.endDate ?? undefined,
      adults: quote.adults,
      children: quote.children,
      validityDays: quote.validityDays,
      currency: quote.currency,
      notes: quote.notes,
      internalNotes: quote.internalNotes,
      globalDiscount: quote.globalDiscount,
      commissionBase: quote.commissionBase,
      commissionPct: quote.commissionPct,
    },
    items: quote.items.map((item) => ({ ...item, key: item.id })),
  };
}

export function QuoteBuilder({ initial }: { initial?: Quote }) {
  const router = useRouter();
  const { user, hasPermission } = useAuth();
  const canViewFinancial = hasPermission('quotes.view_financial');
  const canEditPricing = hasPermission('quotes.edit_pricing');
  const canManageAccess = Boolean(initial && (initial.sellerId === user?.id || hasPermission('quotes.manage_access')));

  const isNew = !initial;
  const editable = !initial || (EDITABLE_STATUSES.includes(initial.status) && !initial.paidAt);

  const [header, setHeader] = useState<QuoteHeaderDraft>(() => draftFromQuote(initial).header);
  const [items, setItems] = useState<DraftItem[]>(() => draftFromQuote(initial).items);
  const [preview, setPreview] = useState<Quote | null>(initial ?? null);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [clientSearch, setClientSearch] = useState(initial?.client?.name ?? '');
  const [clientSearchFocused, setClientSearchFocused] = useState(false);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientModalKey, setNewClientModalKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [paymentReference, setPaymentReference] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const { data: clientOptions, isLoading: clientOptionsLoading } = useQuoteClientOptions(clientSearch);
  const previewQuote = usePreviewQuote();
  const createQuote = useCreateQuote();
  const createClient = useCreateClient();
  const updateQuote = useUpdateQuote(initial?.id ?? 'none');
  const changeStatus = useChangeQuoteStatus(initial?.id ?? 'none');
  const recordPayment = useRecordPayment(initial?.id ?? 'none');
  const { data: sharedAccess } = useQuoteAccess(initial?.id);
  const revokeAccess = useRevokeQuoteAccess(initial?.id ?? 'none');

  useEffect(() => {
    if (!editable) return;
    if (items.length === 0) return;
    const timer = setTimeout(() => {
      previewQuote.mutate(
        { ...header, quoteId: initial?.id, items: items.map(toPayloadItem) },
        { onSuccess: (data) => setPreview(data) },
      );
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [header, items, editable]);

  function setHeaderField<K extends keyof QuoteHeaderDraft>(key: K, value: QuoteHeaderDraft[K]) {
    setHeader((prev) => ({ ...prev, [key]: value }));
  }

  function addProductItems(selections: { product: CatalogProduct; quantity: number }[]) {
    setItems((prev) => [
      ...prev,
      ...selections.map(({ product, quantity }) => ({
        key: newKey(),
        productId: product.id,
        name: product.name,
        description: product.description ?? undefined,
        imageUrl: product.imageUrl,
        unit: product.unit,
        quantity: String(quantity),
        adults: header.adults ?? 1,
        children: header.children ?? 0,
        priceTier: 'IDEAL' as const,
        extras: [],
        reservationMode: product.reservationMode,
        durationHours: product.durationHours,
        startTime: product.startTime,
        endTime: product.endTime,
      })),
    ]);
    setShowCatalogModal(false);
  }

  async function handleCreateClient(values: ClientFormValues) {
    const created = await createClient.mutateAsync(values);
    setHeaderField('clientId', created.id);
    setClientSearch(created.name);
  }

  function updateItem(key: string, patch: Partial<DraftItem>) {
    setItems((prev) => prev.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((item) => item.key !== key));
  }

  const previewItemByKey = useMemo(() => {
    const map = new Map<string, Quote['items'][number]>();
    if (!preview) return map;
    items.forEach((item, index) => {
      const line = preview.items[index];
      if (line) map.set(item.key, line);
    });
    return map;
  }, [preview, items]);

  async function handleSave() {
    setError(null);
    setSubmitting(true);
    try {
      const payload = { ...header, items: items.map(toPayloadItem) };
      if (isNew) {
        const created = await createQuote.mutateAsync(payload);
        router.push(`/quotes/${created.id}`);
      } else {
        // Adopt the saved snapshot so persisted item ids replace the client-side drafts.
        const saved = await updateQuote.mutateAsync({ ...payload, version: initial.version });
        const draft = draftFromQuote(saved);
        setHeader(draft.header);
        setItems(draft.items);
        setPreview(saved);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la cotización.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatus(status: QuoteStatus) {
    if (!initial) return;
    setError(null);
    try {
      await changeStatus.mutateAsync({ version: initial.version, status });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar el estado.');
    }
  }

  async function handlePayment() {
    if (!initial || !paymentAmount) return;
    setError(null);
    try {
      await recordPayment.mutateAsync({
        version: initial.version,
        amount: paymentAmount,
        idempotencyKey: newKey(),
        paymentDate,
        reference: paymentReference || undefined,
      });
      setPaymentAmount('');
      setPaymentReference('');
      setPaymentDate(new Date().toISOString().slice(0, 10));
      setShowPaymentForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el abono.');
    }
  }

  const currency = header.currency ?? initial?.currency ?? 'COP';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-1 text-sm font-medium text-ink-soft transition hover:text-ink" onClick={() => router.push('/quotes')} type="button">
            <ArrowLeft className="h-4 w-4" /> Volver
          </button>
          <span className="text-ink/15">|</span>
          <h1 className="font-display text-2xl font-extrabold uppercase text-ink">{initial ? initial.number : 'Nueva Cotización'}</h1>
          {initial ? <span className={`rounded-full px-3 py-1 font-mono text-[11px] font-bold uppercase ${STATUS_COLORS[initial.status]}`}>{STATUS_LABELS[initial.status]}</span> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {initial?.publicId ? (
            <a
              className="button-secondary inline-flex items-center gap-1.5"
              href={`/q/${initial.publicId}`}
              rel="noreferrer"
              target="_blank"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Página del cliente
            </a>
          ) : null}
          {editable ? (
            <button className="button-primary" disabled={submitting} onClick={handleSave} type="button">
              {submitting ? 'Guardando…' : 'Guardar Cotización'}
            </button>
          ) : null}
          {initial?.status === 'BORRADOR' ? (
            <>
              <button className="button-secondary" onClick={() => handleStatus('ENVIADA')} type="button">Enviar</button>
              <button className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700" onClick={() => handleStatus('RECHAZADA')} type="button">Rechazar</button>
            </>
          ) : null}
          {initial?.status === 'ENVIADA' ? (
            <>
              <button className="button-primary" onClick={() => handleStatus('ACEPTADA')} type="button">Marcar Aceptada</button>
              <button className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700" onClick={() => handleStatus('RECHAZADA')} type="button">Rechazar</button>
            </>
          ) : null}
        </div>
      </div>

      {error ? <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600" role="alert">{error}</p> : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <section className="space-y-4 rounded-2xl border border-ink/10 bg-paper-card p-6 shadow-card">
            <h2 className="label-caps text-ink-soft">Información del Cliente</h2>
            {editable ? (
              <div className="relative">
                <label className={labelClass} htmlFor="client-search">Buscar Cliente</label>
                <input
                  className={inputClass}
                  id="client-search"
                  onBlur={() => setTimeout(() => setClientSearchFocused(false), 150)}
                  onChange={(e) => { setClientSearch(e.target.value); setHeaderField('clientId', ''); }}
                  onFocus={() => setClientSearchFocused(true)}
                  placeholder="Nombre del cliente…"
                  value={clientSearch}
                />
                {clientSearchFocused && !header.clientId ? (
                  <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-ink/10 bg-paper-card shadow-floating">
                    {clientOptionsLoading ? (
                      <p className="px-3 py-2 text-sm text-ink-soft">Buscando…</p>
                    ) : clientOptions && clientOptions.length > 0 ? (
                      <ul>
                        {clientOptions.map((client) => (
                          <li key={client.id}>
                            <button
                              className="w-full px-3 py-2 text-left text-sm hover:bg-ink/5"
                              onClick={() => { setHeaderField('clientId', client.id); setClientSearch(client.name); setClientSearchFocused(false); }}
                              onMouseDown={(e) => e.preventDefault()}
                              type="button"
                            >
                              {client.name}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="px-3 py-2 text-sm text-ink-soft">
                        {clientSearch ? `No se encontraron clientes con "${clientSearch}".` : 'Aún no tienes clientes registrados.'}
                      </p>
                    )}
                    <button
                      className="w-full border-t border-ink/10 px-3 py-2 text-left text-sm font-semibold text-teal hover:bg-ink/5"
                      onClick={() => { setNewClientModalKey((k) => k + 1); setShowNewClientForm(true); setClientSearchFocused(false); }}
                      onMouseDown={(e) => e.preventDefault()}
                      type="button"
                    >
                      + Crear Nuevo Cliente
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-ink">{initial?.client?.name}</p>
            )}
          </section>

          <section className="space-y-4 rounded-2xl border border-ink/10 bg-paper-card p-6 shadow-card">
            <h2 className="label-caps text-ink-soft">Detalles de la Cotización</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass}>Asesor Propietario</label>
                <div
                  className="flex h-10 items-center gap-2 rounded-lg px-3 text-sm text-ink-soft"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <span className="flex-1">{initial ? initial.seller?.name ?? '—' : user?.name}</span>
                  <Lock className="h-3.5 w-3.5 shrink-0" />
                </div>

                {initial ? (
                  <div className="mt-2 space-y-1.5">
                    {sharedAccess?.map((row) => (
                      <div className="flex items-center justify-between rounded-lg px-3 py-1.5 text-sm" key={row.userId} style={{ background: 'var(--surface)' }}>
                        <span className="text-ink-soft">{row.name ?? row.userId}</span>
                        {canManageAccess ? (
                          <button
                            aria-label="Quitar acceso"
                            className="rounded-lg p-1 text-ink-soft transition hover:bg-red-50 hover:text-red-600"
                            disabled={revokeAccess.isPending}
                            onClick={() => revokeAccess.mutate(row.userId)}
                            type="button"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        ) : null}
                      </div>
                    ))}
                    {canManageAccess ? (
                      <button className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal" onClick={() => setShowShareModal(true)} type="button">
                        <UserPlus className="h-3.5 w-3.5" /> Agregar Asesor
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <div>
                <label className={labelClass} htmlFor="pax">Número de Pax</label>
                <input className={inputClass} disabled={!editable} id="pax" min={0} onChange={(e) => setHeaderField('adults', Number(e.target.value))} type="number" value={header.adults ?? 1} />
              </div>
              <div>
                <label className={labelClass} htmlFor="validityDays">Válido por (días)</label>
                <input className={inputClass} disabled={!editable} id="validityDays" min={1} onChange={(e) => setHeaderField('validityDays', Number(e.target.value))} type="number" value={header.validityDays ?? 7} />
              </div>
            </div>
            <div>
              <label className={labelClass} htmlFor="notes">Notas para el Cliente</label>
              <textarea className={inputClass} disabled={!editable} id="notes" onChange={(e) => setHeaderField('notes', e.target.value)} rows={2} value={header.notes ?? ''} />
            </div>
            {canViewFinancial ? (
              <div>
                <label className={labelClass} htmlFor="internalNotes">Notas Internas</label>
                <textarea className={inputClass} disabled={!editable} id="internalNotes" onChange={(e) => setHeaderField('internalNotes', e.target.value)} rows={2} value={header.internalNotes ?? ''} />
              </div>
            ) : null}
          </section>

        </div>

        <div className="space-y-6 lg:col-span-2">
          <section className="space-y-4 rounded-2xl border border-ink/10 bg-paper-card p-6 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="label-caps text-ink-soft">Itinerario de Servicios</h2>
              {editable ? (
                <button className="button-primary inline-flex items-center gap-1.5 text-xs" onClick={() => setShowCatalogModal(true)} type="button">
                  <Search className="h-3.5 w-3.5" /> Agregar Servicio
                </button>
              ) : null}
            </div>

            {items.length === 0 ? (
              <div className="py-6 text-center text-sm text-ink-soft">
                <p>No hay servicios agregados.</p>
                {editable ? (
                  <button className="mt-1 font-semibold text-teal hover:underline" onClick={() => setShowCatalogModal(true)} type="button">
                    Agregar el primero
                  </button>
                ) : null}
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <QuoteItemCard
                    canEditPricing={canEditPricing}
                    canViewFinancial={canViewFinancial}
                    currency={currency}
                    editable={editable}
                    item={item}
                    key={item.key}
                    line={previewItemByKey.get(item.key)}
                    onChange={(patch) => updateItem(item.key, patch)}
                    onRemove={() => removeItem(item.key)}
                  />
                ))}
              </div>
            )}

            <div className="border-t border-ink/10 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="label-caps text-ink-soft">Abonos / Depósitos</h3>
                {initial && (initial.status === 'ACEPTADA' || initial.status === 'ABONADA') && hasPermission('quotes.record_payment') ? (
                  <button className="button-secondary inline-flex items-center gap-1.5 text-xs" onClick={() => setShowPaymentForm((v) => !v)} type="button">
                    <Plus className="h-3.5 w-3.5" /> Añadir Abono
                  </button>
                ) : null}
              </div>

              {showPaymentForm && initial ? (
                <div className="mt-3 grid gap-3 rounded-xl border border-ink/10 p-3 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label className={labelClass}>Monto</label>
                    <div className="flex gap-2">
                      <input className={inputClass} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="Monto" type="number" value={paymentAmount} />
                      <button
                        className="button-secondary shrink-0 whitespace-nowrap text-xs"
                        onClick={() => setPaymentAmount(initial.balanceDue)}
                        type="button"
                      >
                        Saldo completo
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Fecha</label>
                    <input className={inputClass} onChange={(e) => setPaymentDate(e.target.value)} type="date" value={paymentDate} />
                  </div>
                  <div>
                    <label className={labelClass}>Referencia</label>
                    <input className={inputClass} onChange={(e) => setPaymentReference(e.target.value)} placeholder="N.º comprobante" value={paymentReference} />
                  </div>
                  <button className="button-primary sm:col-span-2" disabled={!paymentAmount} onClick={handlePayment} type="button">Registrar Pago</button>
                </div>
              ) : null}
            </div>

            <dl className="space-y-2 border-t border-ink/10 pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd className="font-mono text-ink">{formatMoney(preview?.subtotal, currency)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-soft">Impuestos</dt><dd className="font-mono text-ink">{formatMoney(preview?.taxTotal, currency)}</dd></div>
              <div className="flex justify-between border-t border-ink/10 pt-2 text-base font-bold"><dt className="text-ink">Total</dt><dd className="font-mono text-ink">{formatMoney(preview?.total, currency)}</dd></div>
              {canViewFinancial ? (
                <div className="flex justify-between border-t border-ink/10 pt-2"><dt className="text-ink-soft">Ganancia Estimada</dt><dd className="font-mono text-status-accepted">{formatMoney(preview?.marginTotal, currency)}</dd></div>
              ) : null}
              {initial ? (
                <>
                  <div className="flex justify-between border-t border-ink/10 pt-2"><dt className="text-ink-soft">Abonado</dt><dd className="font-mono text-ink">{formatMoney(initial.depositAmount, currency)}</dd></div>
                  <div className="flex justify-between"><dt className="text-ink-soft">Saldo</dt><dd className="font-mono text-ink">{formatMoney(initial.balanceDue, currency)}</dd></div>
                </>
              ) : null}
            </dl>
          </section>

          <QuoteItinerary items={items} />
        </div>
      </div>

      <QuoteCatalogModal onClose={() => setShowCatalogModal(false)} onConfirm={addProductItems} open={showCatalogModal} />
      {initial && showShareModal ? <QuoteShareModal onClose={() => setShowShareModal(false)} quote={initial} /> : null}
      <ClientFormModal
        initialName={clientSearch}
        key={newClientModalKey}
        onClose={() => setShowNewClientForm(false)}
        onSubmit={handleCreateClient}
        open={showNewClientForm}
      />
    </div>
  );
}
