'use client';

import { Plus, Search, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  useChangeQuoteStatus,
  useCreateQuote,
  usePreviewQuote,
  useQuoteCatalog,
  useQuoteClientOptions,
  useQuoteSellers,
  useRecordPayment,
  useUpdateQuote,
} from '@/hooks/use-quotes';
import type { MarkupType, ProductUnit, Quote, QuoteHeaderDraft, QuoteItemDraft, QuoteStatus } from '@/lib/types';
import { inputClass, labelClass, selectClass } from '@/components/ui/form';

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

const STATUS_COLORS: Record<QuoteStatus, string> = {
  BORRADOR: 'bg-ink/10 text-ink-soft',
  ENVIADA: 'bg-amber/15 text-amber',
  ACEPTADA: 'bg-status-accepted/15 text-status-accepted',
  ABONADA: 'bg-amber/15 text-amber',
  PAGADA: 'bg-status-accepted/15 text-status-accepted',
  RECHAZADA: 'bg-red-100 text-red-600',
  VENCIDA: 'bg-status-expired/15 text-status-expired',
};

const UNIT_LABELS: Record<ProductUnit, string> = {
  PER_SERVICE: 'Servicio',
  PER_NIGHT: 'Noche',
  PER_PERSON: 'Persona',
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
  };
}

function draftFromQuote(quote?: Quote): { header: QuoteHeaderDraft; items: DraftItem[] } {
  if (!quote) {
    return {
      header: { clientId: '', destination: '', adults: 1, children: 0, validityDays: 7, notes: '', globalDiscount: '0', commissionBase: 'MARGIN', commissionPct: '0' },
      items: [],
    };
  }
  return {
    header: {
      clientId: quote.clientId,
      sellerId: quote.sellerId,
      destination: quote.destination,
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
  const { hasPermission } = useAuth();
  const canViewFinancial = hasPermission('quotes.view_financial');
  const canEditPricing = hasPermission('quotes.edit_pricing');

  const isNew = !initial;
  const editable = !initial || initial.status === 'BORRADOR';

  const [header, setHeader] = useState<QuoteHeaderDraft>(() => draftFromQuote(initial).header);
  const [items, setItems] = useState<DraftItem[]>(() => draftFromQuote(initial).items);
  const [preview, setPreview] = useState<Quote | null>(initial ?? null);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [showCatalog, setShowCatalog] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manual, setManual] = useState({ name: '', netCost: '0', markupType: 'PERCENT' as MarkupType, markupValue: '0', taxPct: '0' });
  const [clientSearch, setClientSearch] = useState(initial?.client?.name ?? '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');

  const { data: sellers } = useQuoteSellers();
  const { data: clientOptions } = useQuoteClientOptions(clientSearch);
  const { data: catalog } = useQuoteCatalog(catalogSearch);
  const previewQuote = usePreviewQuote();
  const createQuote = useCreateQuote();
  const updateQuote = useUpdateQuote(initial?.id ?? 'none');
  const changeStatus = useChangeQuoteStatus(initial?.id ?? 'none');
  const recordPayment = useRecordPayment(initial?.id ?? 'none');

  useEffect(() => {
    if (!editable) return;
    if (!header.clientId || !header.destination.trim()) return;
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

  function addProductItem(product: { id: string; name: string; unit: ProductUnit; currency: string; imageUrl: string | null }) {
    setItems((prev) => [...prev, { key: newKey(), productId: product.id, name: product.name, unit: product.unit, quantity: '1' }]);
    setShowCatalog(false);
    setCatalogSearch('');
  }

  function addManualItem() {
    if (!manual.name.trim()) return;
    setItems((prev) => [...prev, {
      key: newKey(), name: manual.name, unit: 'PER_SERVICE', quantity: '1',
      netCost: manual.netCost, markupType: manual.markupType, markupValue: manual.markupValue, taxPct: manual.taxPct,
    }]);
    setManual({ name: '', netCost: '0', markupType: 'PERCENT', markupValue: '0', taxPct: '0' });
    setShowManualForm(false);
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
      await recordPayment.mutateAsync({ version: initial.version, amount: paymentAmount, idempotencyKey: newKey() });
      setPaymentAmount('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el abono.');
    }
  }

  const currency = header.currency ?? initial?.currency ?? 'COP';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-extrabold text-ink">{initial ? initial.number : 'Nueva Cotización'}</h1>
          {initial ? <span className={`rounded-full px-3 py-1 font-mono text-[11px] font-bold uppercase ${STATUS_COLORS[initial.status]}`}>{STATUS_LABELS[initial.status]}</span> : null}
        </div>
        <div className="flex flex-wrap gap-2">
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
        <div className="space-y-6 lg:col-span-2">
          <section className="space-y-4 rounded-2xl border border-ink/10 bg-paper-card p-6 shadow-card">
            <h2 className="label-caps text-ink-soft">Información del Cliente</h2>
            {editable ? (
              <div className="relative">
                <label className={labelClass} htmlFor="client-search">Buscar Cliente</label>
                <input
                  className={inputClass}
                  id="client-search"
                  onChange={(e) => { setClientSearch(e.target.value); setHeaderField('clientId', ''); }}
                  placeholder="Nombre del cliente…"
                  value={clientSearch}
                />
                {clientSearch && !header.clientId && clientOptions && clientOptions.length > 0 ? (
                  <ul className="absolute z-10 mt-1 w-full rounded-lg border border-ink/10 bg-paper-card shadow-floating">
                    {clientOptions.map((client) => (
                      <li key={client.id}>
                        <button
                          className="w-full px-3 py-2 text-left text-sm hover:bg-ink/5"
                          onClick={() => { setHeaderField('clientId', client.id); setClientSearch(client.name); }}
                          type="button"
                        >
                          {client.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-ink">{initial?.client?.name}</p>
            )}
          </section>

          <section className="space-y-4 rounded-2xl border border-ink/10 bg-paper-card p-6 shadow-card">
            <h2 className="label-caps text-ink-soft">Detalles de la Cotización</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="destination">Destino</label>
                <input className={inputClass} disabled={!editable} id="destination" onChange={(e) => setHeaderField('destination', e.target.value)} value={header.destination} />
              </div>
              <div>
                <label className={labelClass} htmlFor="sellerId">Agente Responsable</label>
                <select className={selectClass} disabled={!editable} id="sellerId" onChange={(e) => setHeaderField('sellerId', e.target.value)} value={header.sellerId ?? ''}>
                  <option value="">Sin asignar</option>
                  {sellers?.map((seller) => <option key={seller.id} value={seller.id}>{seller.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass} htmlFor="startDate">Check-in</label>
                <input className={inputClass} disabled={!editable} id="startDate" onChange={(e) => setHeaderField('startDate', e.target.value)} type="date" value={header.startDate ?? ''} />
              </div>
              <div>
                <label className={labelClass} htmlFor="endDate">Check-out</label>
                <input className={inputClass} disabled={!editable} id="endDate" onChange={(e) => setHeaderField('endDate', e.target.value)} type="date" value={header.endDate ?? ''} />
              </div>
              <div>
                <label className={labelClass} htmlFor="adults">Adultos</label>
                <input className={inputClass} disabled={!editable} id="adults" min={0} onChange={(e) => setHeaderField('adults', Number(e.target.value))} type="number" value={header.adults ?? 1} />
              </div>
              <div>
                <label className={labelClass} htmlFor="children">Niños</label>
                <input className={inputClass} disabled={!editable} id="children" min={0} onChange={(e) => setHeaderField('children', Number(e.target.value))} type="number" value={header.children ?? 0} />
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

          <section className="space-y-4 rounded-2xl border border-ink/10 bg-paper-card p-6 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="label-caps text-ink-soft">Itinerario de Servicios</h2>
              {editable ? (
                <div className="flex gap-2">
                  <button className="button-secondary inline-flex items-center gap-1.5 text-xs" onClick={() => setShowCatalog((v) => !v)} type="button">
                    <Search className="h-3.5 w-3.5" /> Catálogo
                  </button>
                  <button className="button-primary inline-flex items-center gap-1.5 text-xs" onClick={() => setShowManualForm((v) => !v)} type="button">
                    <Plus className="h-3.5 w-3.5" /> Ítem Manual
                  </button>
                </div>
              ) : null}
            </div>

            {showCatalog ? (
              <div className="rounded-xl border border-ink/10 p-3">
                <input
                  autoFocus
                  className={inputClass}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Buscar producto…"
                  value={catalogSearch}
                />
                <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
                  {catalog?.map((product) => (
                    <li key={product.id}>
                      <button className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:bg-ink/5" onClick={() => addProductItem(product)} type="button">
                        <span>{product.name}</span>
                        <span className="text-xs text-ink-soft">{UNIT_LABELS[product.unit]}</span>
                      </button>
                    </li>
                  ))}
                  {catalog?.length === 0 ? <li className="px-3 py-2 text-sm text-ink-soft">Sin resultados.</li> : null}
                </ul>
              </div>
            ) : null}

            {showManualForm ? (
              <div className="grid gap-3 rounded-xl border border-ink/10 p-3 sm:grid-cols-5">
                <input className={`${inputClass} sm:col-span-2`} onChange={(e) => setManual((m) => ({ ...m, name: e.target.value }))} placeholder="Nombre del ítem" value={manual.name} />
                <input className={inputClass} onChange={(e) => setManual((m) => ({ ...m, netCost: e.target.value }))} placeholder="Costo" type="number" value={manual.netCost} />
                <input className={inputClass} onChange={(e) => setManual((m) => ({ ...m, markupValue: e.target.value }))} placeholder="Margen %" type="number" value={manual.markupValue} />
                <button className="button-primary" onClick={addManualItem} type="button">Añadir</button>
              </div>
            ) : null}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-ink/10 text-left">
                    <th className="label-caps py-2 text-ink-soft">Concepto</th>
                    <th className="label-caps py-2 text-ink-soft">Cant.</th>
                    <th className="label-caps py-2 text-right text-ink-soft">Total</th>
                    {editable ? <th className="py-2" /> : null}
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td className="py-6 text-center text-ink-soft" colSpan={4}>No hay servicios agregados.</td></tr>
                  ) : (
                    items.map((item) => {
                      const line = previewItemByKey.get(item.key);
                      return (
                        <tr className="border-b border-ink/5 last:border-0" key={item.key}>
                          <td className="py-2 pr-2">
                            <p className="font-medium text-ink">{item.name}</p>
                            {canViewFinancial && line?.marginItem ? <p className="text-xs text-status-accepted">Margen: {formatMoney(line.marginItem, currency)}</p> : null}
                          </td>
                          <td className="py-2 pr-2">
                            <input
                              className={`${inputClass} w-20 py-1`}
                              disabled={!editable}
                              min={0}
                              onChange={(e) => updateItem(item.key, { quantity: e.target.value })}
                              step="1"
                              type="number"
                              value={Number(item.quantity)}
                            />
                          </td>
                          <td className="py-2 text-right font-mono text-ink">{formatMoney(line?.sellPrice, currency)}</td>
                          {editable ? (
                            <td className="py-2 text-right">
                              <button aria-label="Quitar" className="rounded-lg p-1.5 text-ink-soft hover:bg-red-50 hover:text-red-600" onClick={() => removeItem(item.key)} type="button">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          ) : null}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="space-y-3 rounded-2xl border border-ink/10 bg-paper-card p-6 shadow-card">
            <h2 className="label-caps text-ink-soft">Resumen</h2>
            <dl className="space-y-2 text-sm">
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
          </div>

          {canViewFinancial && editable ? (
            <div className="space-y-3 rounded-2xl border border-ink/10 bg-paper-card p-6 shadow-card">
              <h2 className="label-caps text-ink-soft">Comisión</h2>
              <div className="grid grid-cols-2 gap-3">
                <select className={selectClass} disabled={!canEditPricing} onChange={(e) => setHeaderField('commissionBase', e.target.value as 'MARGIN' | 'TOTAL')} value={header.commissionBase ?? 'MARGIN'}>
                  <option value="MARGIN">Sobre margen</option>
                  <option value="TOTAL">Sobre total</option>
                </select>
                <input className={inputClass} disabled={!canEditPricing} min={0} onChange={(e) => setHeaderField('commissionPct', e.target.value)} placeholder="%" type="number" value={header.commissionPct ?? '0'} />
              </div>
              {preview?.commissionAmount ? <p className="text-xs text-ink-soft">Comisión estimada: {formatMoney(preview.commissionAmount, currency)}</p> : null}
            </div>
          ) : null}

          {initial && (initial.status === 'ACEPTADA' || initial.status === 'ABONADA') && hasPermission('quotes.record_payment') ? (
            <div className="space-y-3 rounded-2xl border border-ink/10 bg-paper-card p-6 shadow-card">
              <h2 className="label-caps text-ink-soft">Registrar Abono</h2>
              <input className={inputClass} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="Monto" type="number" value={paymentAmount} />
              <button className="button-primary w-full" disabled={!paymentAmount} onClick={handlePayment} type="button">Registrar Pago</button>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
