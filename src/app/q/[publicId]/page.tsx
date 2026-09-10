'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, MapPin, Calendar, Users, CheckCircle, Clock, XCircle, Compass } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

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

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  BORRADOR:  { label: 'Borrador',     color: '#8899b8', bg: 'rgba(136,153,184,0.12)', icon: <Clock className="h-4 w-4" /> },
  ENVIADA:   { label: 'Pendiente',    color: '#feb23b', bg: 'rgba(254,178,59,0.12)',  icon: <Clock className="h-4 w-4" /> },
  ACEPTADA:  { label: 'Aceptada',     color: '#4ade80', bg: 'rgba(74,222,128,0.12)',  icon: <CheckCircle className="h-4 w-4" /> },
  ABONADA:   { label: 'Con anticipo', color: '#38bdf8', bg: 'rgba(56,189,248,0.12)',  icon: <CheckCircle className="h-4 w-4" /> },
  PAGADA:    { label: 'Pagada',       color: '#4ade80', bg: 'rgba(74,222,128,0.12)',  icon: <CheckCircle className="h-4 w-4" /> },
  RECHAZADA: { label: 'Rechazada',    color: '#f87171', bg: 'rgba(248,113,113,0.12)', icon: <XCircle className="h-4 w-4" /> },
  VENCIDA:   { label: 'Vencida',      color: '#f87171', bg: 'rgba(248,113,113,0.12)', icon: <XCircle className="h-4 w-4" /> },
};

const card: React.CSSProperties = {
  background: '#111827',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: '16px',
};

const divider: React.CSSProperties = { borderBottom: '1px solid rgba(255,255,255,0.07)' };

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
      <div style={{ minHeight: '100vh', background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
        <Compass style={{ width: 32, height: 32, color: '#feb23b', animation: 'pulse 2s infinite' }} />
        <p style={{ color: '#8899b8', fontSize: 14, fontFamily: 'Inter, sans-serif' }}>Cargando cotización…</p>
      </div>
    );
  }

  if (isError || !quote) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px', padding: '32px', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(248,113,113,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <XCircle style={{ width: 28, height: 28, color: '#f87171' }} />
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#e2e8f0', fontFamily: 'Inter, sans-serif', margin: 0 }}>Cotización no encontrada</h1>
        <p style={{ color: '#8899b8', fontSize: 14, fontFamily: 'Inter, sans-serif', margin: 0 }}>Este enlace puede haber expirado o no es válido.</p>
      </div>
    );
  }

  const color = quote.agency.primaryColor || '#feb23b';
  const statusCfg = STATUS_CONFIG[quote.status] ?? STATUS_CONFIG.ENVIADA;
  const hasDiscount = Number(quote.discountTotal) > 0;
  const hasTax = Number(quote.taxTotal) > 0;
  const hasDeposit = Number(quote.depositAmount) > 0;
  const hasBankInfo = quote.agency.bankName || quote.agency.bankAccount;

  const base: React.CSSProperties = { fontFamily: 'Inter, system-ui, sans-serif', color: '#e2e8f0' };
  const soft: React.CSSProperties = { color: '#8899b8' };
  const muted: React.CSSProperties = { color: '#3d5070', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' };

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', padding: '32px 16px', ...base }}>
      <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* HEADER CARD */}
        <div style={{ ...card, overflow: 'hidden' }}>
          {/* Brand bar */}
          <div style={{ background: color, padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              {quote.agency.logoUrl && (
                <img alt={quote.agency.name} style={{ height: 40, objectFit: 'contain', marginBottom: 8, display: 'block' }} src={quote.agency.logoUrl} />
              )}
              <h1 style={{ fontSize: 22, fontWeight: 800, color: '#fff', margin: 0 }}>{quote.agency.name}</h1>
              {quote.agency.taxId && <p style={{ marginTop: 4, fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: 0 }}>NIT/RFC: {quote.agency.taxId}</p>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.55)', margin: '0 0 4px' }}>Cotización</p>
              <p style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: 0 }}>{quote.number}</p>
            </div>
          </div>

          {/* Info strip */}
          <div style={{ padding: '16px 32px', ...divider, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
              <MapPin style={{ width: 16, height: 16, color }} />
              <span style={{ fontWeight: 600 }}>{quote.destination}</span>
            </div>
            {quote.startDate && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, ...soft }}>
                <Calendar style={{ width: 16, height: 16 }} />
                <span>{fmtDate(quote.startDate)} → {fmtDate(quote.endDate)}</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, ...soft }}>
              <Users style={{ width: 16, height: 16 }} />
              <span>
                {quote.adults} adulto{quote.adults !== 1 ? 's' : ''}
                {quote.children > 0 ? ` · ${quote.children} niño${quote.children !== 1 ? 's' : ''}` : ''}
              </span>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: statusCfg.color, background: statusCfg.bg, borderRadius: 999, padding: '4px 12px' }}>
              {statusCfg.icon}
              {statusCfg.label}
            </div>
          </div>

          {/* Client + validity */}
          <div style={{ padding: '16px 32px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <p style={{ ...muted, marginBottom: 4 }}>Preparado para</p>
              <p style={{ fontWeight: 600, margin: '0 0 2px' }}>{quote.client.name}</p>
              <p style={{ fontSize: 13, ...soft, margin: 0 }}>{quote.client.phone}{quote.client.email ? ` · ${quote.client.email}` : ''}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ ...muted, marginBottom: 4 }}>Asesor</p>
              <p style={{ fontWeight: 600, margin: '0 0 2px' }}>{quote.seller.name}</p>
              {quote.validUntil && (
                <p style={{ fontSize: 12, ...soft, margin: 0 }}>Válida hasta {fmtDate(quote.validUntil)}</p>
              )}
            </div>
          </div>
        </div>

        {/* ITEMS */}
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', ...divider }}>
            <h2 style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>Servicios Incluidos</h2>
          </div>
          <div>
            {quote.items.map((item, i) => (
              <div
                key={item.id}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 16, padding: '16px 24px',
                  borderBottom: i < quote.items.length - 1 ? '1px solid rgba(255,255,255,0.05)' : undefined,
                }}
              >
                {item.imageUrl && (
                  <img alt={item.name} style={{ width: 80, height: 56, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} src={item.imageUrl} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, margin: '0 0 4px' }}>{item.name}</p>
                  {item.description && <p style={{ fontSize: 13, ...soft, margin: '0 0 4px' }}>{item.description}</p>}
                  <p style={{ fontSize: 12, color: '#3d5070', margin: 0 }}>
                    {Number(item.quantity)} {unitLabel(item.unit)}
                    {item.nights > 1 ? ` · ${item.nights} noches` : ''}
                    {item.adults > 0 ? ` · ${item.adults} adultos` : ''}
                    {item.children > 0 ? ` · ${item.children} niños` : ''}
                  </p>
                </div>
                <div style={{ flexShrink: 0, textAlign: 'right' }}>
                  <p style={{ fontWeight: 700, margin: '0 0 2px' }}>{fmt(item.sellPrice, item.currency)}</p>
                  {Number(item.tax) > 0 && (
                    <p style={{ fontSize: 12, color: '#3d5070', margin: 0 }}>{fmt(item.preTax, item.currency)} + {fmt(item.tax, item.currency)} imp.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TOTALS */}
        <div style={{ ...card, padding: '20px 24px' }}>
          <div style={{ marginLeft: 'auto', maxWidth: 280, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, ...soft }}>
              <span>Subtotal</span><span>{fmt(quote.subtotal, quote.currency)}</span>
            </div>
            {hasDiscount && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#4ade80' }}>
                <span>Descuentos</span><span>- {fmt(quote.discountTotal, quote.currency)}</span>
              </div>
            )}
            {hasTax && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, ...soft }}>
                <span>{quote.agency.taxName ?? 'Impuestos'} ({quote.agency.taxPct}%)</span>
                <span>{fmt(quote.taxTotal, quote.currency)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800, color, borderTop: `2px solid ${color}40`, paddingTop: 12, marginTop: 2 }}>
              <span>TOTAL</span><span>{fmt(quote.total, quote.currency)}</span>
            </div>
            {hasDeposit && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, ...soft }}>
                  <span>Anticipo requerido</span><span>{fmt(quote.depositAmount, quote.currency)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600 }}>
                  <span>Saldo pendiente</span><span>{fmt(quote.balanceDue, quote.currency)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* NOTES */}
        {quote.notes && (
          <div style={{ ...card, padding: '16px 24px', borderLeft: `3px solid ${color}` }}>
            <p style={{ ...muted, marginBottom: 8 }}>Notas</p>
            <p style={{ fontSize: 14, ...soft, whiteSpace: 'pre-line', margin: 0 }}>{quote.notes}</p>
          </div>
        )}

        {/* BANK INFO */}
        {hasBankInfo && (
          <div style={{ ...card, padding: '20px 24px' }}>
            <p style={{ ...muted, marginBottom: 12 }}>Datos de Pago · {pmLabel(quote.agency.paymentMethod)}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {quote.agency.bankName && (
                <div>
                  <p style={{ ...muted, marginBottom: 2 }}>Banco</p>
                  <p style={{ fontWeight: 600, margin: 0, fontSize: 14 }}>{quote.agency.bankName}</p>
                </div>
              )}
              {quote.agency.bankAccount && (
                <div>
                  <p style={{ ...muted, marginBottom: 2 }}>Cuenta</p>
                  <p style={{ fontWeight: 600, margin: 0, fontSize: 14 }}>{quote.agency.bankAccount}</p>
                </div>
              )}
              {quote.agency.bankAccountHolder && (
                <div>
                  <p style={{ ...muted, marginBottom: 2 }}>Titular</p>
                  <p style={{ fontWeight: 600, margin: 0, fontSize: 14 }}>{quote.agency.bankAccountHolder}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CONTACT */}
        {(quote.agency.contactEmail || quote.agency.contactPhone) && (
          <div style={{ ...card, padding: '20px 24px' }}>
            <p style={{ ...muted, marginBottom: 10 }}>Contacto</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              {quote.agency.contactEmail && (
                <a href={`mailto:${quote.agency.contactEmail}`} style={{ fontSize: 14, fontWeight: 500, color, textDecoration: 'none' }}>
                  {quote.agency.contactEmail}
                </a>
              )}
              {quote.agency.contactPhone && (
                <a href={`tel:${quote.agency.contactPhone}`} style={{ fontSize: 14, fontWeight: 500, color: '#e2e8f0', textDecoration: 'none' }}>
                  {quote.agency.contactPhone}
                </a>
              )}
            </div>
          </div>
        )}

        {/* TERMS */}
        {quote.agency.termsText && (
          <div style={{ ...card, padding: '20px 24px' }}>
            <p style={{ ...muted, marginBottom: 8 }}>Términos y Condiciones</p>
            <p style={{ fontSize: 12, lineHeight: 1.6, color: '#3d5070', whiteSpace: 'pre-line', margin: 0 }}>{quote.agency.termsText}</p>
          </div>
        )}

        {/* DOWNLOAD PDF */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 4 }}>
          <a
            href={`${API}/public/quotes/${publicId}/pdf`}
            rel="noreferrer"
            target="_blank"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 28px', borderRadius: 12, fontSize: 14, fontWeight: 700,
              color: '#fff', background: color, textDecoration: 'none',
              boxShadow: `0 0 24px ${color}40`,
            }}
          >
            <Download style={{ width: 16, height: 16 }} />
            Descargar PDF
          </a>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#3d5070', paddingBottom: 24, margin: 0 }}>
          {quote.agency.name} · Powered by Brújula
        </p>
      </div>
    </div>
  );
}
