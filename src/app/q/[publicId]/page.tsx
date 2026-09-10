'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, MapPin, Calendar, Users, CheckCircle, Clock, XCircle } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface PublicItem {
  id: string;
  name: string;
  description: string;
  unit: string;
  quantity: string;
  nights: number;
  adults: number;
  children: number;
  currency: string;
  sellPrice: string;
  preTax: string;
  tax: string;
  imageUrl: string | null;
}

interface PublicAgency {
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  contactEmail: string | null;
  contactPhone: string | null;
  taxId: string | null;
  taxName: string | null;
  taxPct: number;
  paymentMethod: string;
  bankName: string | null;
  bankAccount: string | null;
  bankAccountHolder: string | null;
  termsText: string | null;
}

interface PublicQuote {
  number: string;
  publicId: string;
  status: string;
  destination: string;
  startDate: string | null;
  endDate: string | null;
  adults: number;
  children: number;
  validityDays: number;
  validUntil: string | null;
  currency: string;
  notes: string;
  subtotal: string;
  discountTotal: string;
  taxTotal: string;
  total: string;
  depositAmount: string;
  balanceDue: string;
  client: { name: string; email: string | null; phone: string };
  seller: { name: string };
  agency: PublicAgency;
  items: PublicItem[];
}

function fmt(value: string | number, currency: string) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(value));
}

function fmtDate(value: string | null) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

function unitLabel(unit: string) {
  const map: Record<string, string> = { PERSON: 'pers.', ROOM: 'hab.', VEHICLE: 'veh.', PACKAGE: 'paq.', UNIT: 'und.' };
  return map[unit] ?? unit;
}

function pmLabel(pm: string) {
  const map: Record<string, string> = { BANK_TRANSFER: 'Transferencia Bancaria', CARD: 'Tarjeta', CASH: 'Efectivo' };
  return map[pm] ?? pm;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  BORRADOR:  { label: 'Borrador',   color: '#888',    icon: <Clock className="h-4 w-4" /> },
  ENVIADA:   { label: 'Pendiente',  color: '#d97706', icon: <Clock className="h-4 w-4" /> },
  ACEPTADA:  { label: 'Aceptada',   color: '#059669', icon: <CheckCircle className="h-4 w-4" /> },
  ABONADA:   { label: 'Con anticipo', color: '#0284c7', icon: <CheckCircle className="h-4 w-4" /> },
  PAGADA:    { label: 'Pagada',     color: '#059669', icon: <CheckCircle className="h-4 w-4" /> },
  RECHAZADA: { label: 'Rechazada',  color: '#dc2626', icon: <XCircle className="h-4 w-4" /> },
  VENCIDA:   { label: 'Vencida',    color: '#dc2626', icon: <XCircle className="h-4 w-4" /> },
};

export default function PublicQuotePage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = use(params);

  const { data: quote, isLoading, isError } = useQuery<PublicQuote>({
    queryKey: ['public-quote', publicId],
    queryFn: async () => {
      const res = await fetch(`${API}/public/quotes/${publicId}`);
      if (!res.ok) throw new Error('Cotización no encontrada');
      return res.json() as Promise<PublicQuote>;
    },
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">Cargando cotización…</p>
      </div>
    );
  }

  if (isError || !quote) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 p-8 text-center">
        <XCircle className="h-12 w-12 text-red-400" />
        <h1 className="text-xl font-bold text-gray-800">Cotización no encontrada</h1>
        <p className="text-gray-500">Este enlace puede haber expirado o no es válido.</p>
      </div>
    );
  }

  const color = quote.agency.primaryColor || '#0C4A6E';
  const statusCfg = STATUS_CONFIG[quote.status] ?? STATUS_CONFIG.ENVIADA;
  const hasDiscount = Number(quote.discountTotal) > 0;
  const hasTax = Number(quote.taxTotal) > 0;
  const hasDeposit = Number(quote.depositAmount) > 0;
  const hasBankInfo = quote.agency.bankName || quote.agency.bankAccount;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="mx-auto max-w-3xl space-y-4">

        {/* HEADER CARD */}
        <div className="overflow-hidden rounded-2xl shadow-lg">
          <div className="flex items-center justify-between px-8 py-7" style={{ background: color }}>
            <div>
              {quote.agency.logoUrl && (
                <img alt={quote.agency.name} className="mb-2 h-10 object-contain" src={quote.agency.logoUrl} />
              )}
              <h1 className="text-2xl font-extrabold text-white">{quote.agency.name}</h1>
              {quote.agency.taxId && <p className="mt-0.5 text-sm text-white/70">NIT/RFC: {quote.agency.taxId}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/60">Cotización</p>
              <p className="text-3xl font-extrabold text-white">{quote.number}</p>
            </div>
          </div>

          {/* STRIP */}
          <div className="flex flex-wrap gap-6 border-b border-gray-100 bg-white px-8 py-4">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 shrink-0" style={{ color }} />
              <span className="font-semibold text-gray-800">{quote.destination}</span>
            </div>
            {quote.startDate && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 shrink-0 text-gray-400" />
                <span className="text-gray-600">{fmtDate(quote.startDate)} → {fmtDate(quote.endDate)}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 shrink-0 text-gray-400" />
              <span className="text-gray-600">
                {quote.adults} adulto{quote.adults !== 1 ? 's' : ''}
                {quote.children > 0 ? ` · ${quote.children} niño${quote.children !== 1 ? 's' : ''}` : ''}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-1.5 text-sm font-semibold" style={{ color: statusCfg.color }}>
              {statusCfg.icon}
              {statusCfg.label}
            </div>
          </div>

          {/* CLIENT + VALIDITY */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white px-8 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Preparado para</p>
              <p className="font-semibold text-gray-800">{quote.client.name}</p>
              <p className="text-sm text-gray-500">{quote.client.phone}{quote.client.email ? ` · ${quote.client.email}` : ''}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Asesor</p>
              <p className="font-semibold text-gray-800">{quote.seller.name}</p>
              {quote.validUntil && (
                <p className="text-xs text-gray-400">Válida hasta {fmtDate(quote.validUntil)}</p>
              )}
            </div>
          </div>
        </div>

        {/* ITEMS */}
        <div className="rounded-2xl bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="font-bold text-gray-800">Servicios Incluidos</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {quote.items.map((item) => (
              <div className="flex items-start gap-4 px-6 py-4" key={item.id}>
                {item.imageUrl && (
                  <img alt={item.name} className="h-16 w-24 shrink-0 rounded-lg object-cover" src={item.imageUrl} />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-800">{item.name}</p>
                  {item.description && <p className="mt-0.5 text-sm text-gray-500">{item.description}</p>}
                  <p className="mt-1 text-xs text-gray-400">
                    {Number(item.quantity)} {unitLabel(item.unit)}
                    {item.nights > 1 ? ` · ${item.nights} noches` : ''}
                    {item.adults > 0 ? ` · ${item.adults} adultos` : ''}
                    {item.children > 0 ? ` · ${item.children} niños` : ''}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-bold text-gray-800">{fmt(item.sellPrice, item.currency)}</p>
                  {Number(item.tax) > 0 && (
                    <p className="text-xs text-gray-400">{fmt(item.preTax, item.currency)} + {fmt(item.tax, item.currency)} imp.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TOTALS */}
        <div className="rounded-2xl bg-white px-6 py-5 shadow-sm">
          <div className="ml-auto max-w-xs space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span><span>{fmt(quote.subtotal, quote.currency)}</span>
            </div>
            {hasDiscount && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Descuentos</span><span>- {fmt(quote.discountTotal, quote.currency)}</span>
              </div>
            )}
            {hasTax && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>{quote.agency.taxName ?? 'Impuestos'} ({quote.agency.taxPct}%)</span>
                <span>{fmt(quote.taxTotal, quote.currency)}</span>
              </div>
            )}
            <div className="flex justify-between border-t-2 pt-3 text-lg font-extrabold" style={{ borderColor: color, color }}>
              <span>TOTAL</span><span>{fmt(quote.total, quote.currency)}</span>
            </div>
            {hasDeposit && (
              <>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Anticipo requerido</span><span>{fmt(quote.depositAmount, quote.currency)}</span>
                </div>
                <div className="flex justify-between font-semibold text-gray-800">
                  <span>Saldo pendiente</span><span>{fmt(quote.balanceDue, quote.currency)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* NOTES */}
        {quote.notes && (
          <div className="rounded-2xl bg-amber-50 px-6 py-4 shadow-sm" style={{ borderLeft: `3px solid ${color}` }}>
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-400">Notas</p>
            <p className="text-sm text-gray-700 whitespace-pre-line">{quote.notes}</p>
          </div>
        )}

        {/* BANK INFO */}
        {hasBankInfo && (
          <div className="rounded-2xl bg-white px-6 py-5 shadow-sm">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-400">
              Datos de Pago · {pmLabel(quote.agency.paymentMethod)}
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {quote.agency.bankName && (
                <div><p className="text-xs text-gray-400">Banco</p><p className="font-semibold text-gray-800">{quote.agency.bankName}</p></div>
              )}
              {quote.agency.bankAccount && (
                <div><p className="text-xs text-gray-400">Cuenta</p><p className="font-semibold text-gray-800">{quote.agency.bankAccount}</p></div>
              )}
              {quote.agency.bankAccountHolder && (
                <div><p className="text-xs text-gray-400">Titular</p><p className="font-semibold text-gray-800">{quote.agency.bankAccountHolder}</p></div>
              )}
            </div>
          </div>
        )}

        {/* CONTACT */}
        {(quote.agency.contactEmail || quote.agency.contactPhone) && (
          <div className="rounded-2xl bg-white px-6 py-5 shadow-sm">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Contacto</p>
            <div className="flex flex-wrap gap-4 text-sm">
              {quote.agency.contactEmail && (
                <a className="font-medium hover:underline" href={`mailto:${quote.agency.contactEmail}`} style={{ color }}>
                  {quote.agency.contactEmail}
                </a>
              )}
              {quote.agency.contactPhone && (
                <a className="font-medium text-gray-700 hover:underline" href={`tel:${quote.agency.contactPhone}`}>
                  {quote.agency.contactPhone}
                </a>
              )}
            </div>
          </div>
        )}

        {/* TERMS */}
        {quote.agency.termsText && (
          <div className="rounded-2xl bg-white px-6 py-5 shadow-sm">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-400">Términos y Condiciones</p>
            <p className="text-xs leading-relaxed text-gray-400 whitespace-pre-line">{quote.agency.termsText}</p>
          </div>
        )}

        {/* DOWNLOAD PDF */}
        <div className="flex justify-center pb-4">
          <a
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:opacity-90"
            href={`${API}/public/quotes/${publicId}/pdf`}
            rel="noreferrer"
            style={{ background: color }}
            target="_blank"
          >
            <Download className="h-4 w-4" />
            Descargar PDF
          </a>
        </div>

        <p className="pb-8 text-center text-xs text-gray-400">
          {quote.agency.name} · Powered by Brújula
        </p>
      </div>
    </div>
  );
}
