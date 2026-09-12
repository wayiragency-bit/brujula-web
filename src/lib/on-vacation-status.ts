import type { AgencyType, QuoteSpecialStatus, QuoteStatus } from './types';

// Mirrors the backend's quoteStatusLabel() exactly (src/modules/quotes/on-vacation-status.ts) —
// needed here too because a few components (pipeline drag validation, the history chart) label a
// raw status value without an already-labeled Quote/card object from the API. Every quote/card the
// API returns already carries the correct `statusLabel` — prefer that where it's available, and
// use this only when building a label from a bare status + the current agency type.
const GENERIC_STATUS_LABELS: Record<QuoteStatus, string> = {
  BORRADOR: 'Borrador', ENVIADA: 'Enviada', ACEPTADA: 'Aceptada', ABONADA: 'Abonada',
  PAGADA: 'Pagada', RECHAZADA: 'Rechazada', VENCIDA: 'Vencida',
};

const ON_VACATION_STATUS_LABELS: Record<QuoteStatus, string> = {
  BORRADOR: 'Borrador', ENVIADA: 'Cotizada', ACEPTADA: 'Preconfirmada', ABONADA: 'Confirmada',
  PAGADA: 'Reconfirmada', RECHAZADA: 'Cancelada', VENCIDA: 'Vencida',
};

export function quoteStatusLabel(status: QuoteStatus, agencyType: AgencyType | null | undefined): string {
  return agencyType === 'ON_VACATION' ? ON_VACATION_STATUS_LABELS[status] : GENERIC_STATUS_LABELS[status];
}

export const QUOTE_SPECIAL_STATUS_LABELS: Record<QuoteSpecialStatus, string> = {
  NO_PAGO_INICIAL: 'Cotizada — No pagó inicial',
  NO_PAGO_TOTAL: 'Cotizada — No pagó total',
  FECHA_ABIERTA: 'Fecha abierta',
  PROTECCION_CUPOS: 'Protección de cupos',
  NO_SHOW: 'No Show',
};

// Display order fixed by ON-VACATION-PIPELINE-Y-ESTATUS.md §2.
export const QUOTE_SPECIAL_STATUS_ORDER: QuoteSpecialStatus[] = [
  'NO_PAGO_INICIAL', 'NO_PAGO_TOTAL', 'FECHA_ABIERTA', 'PROTECCION_CUPOS', 'NO_SHOW',
];
