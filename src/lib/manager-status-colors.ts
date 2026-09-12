import type { QuoteStatus } from '@/lib/types';

export const STATUS_CHIP: Record<QuoteStatus, string> = {
  BORRADOR: 'chip-borrador',
  ENVIADA: 'chip-enviada',
  ACEPTADA: 'chip-aceptada',
  ABONADA: 'chip-abonada',
  PAGADA: 'chip-pagada',
  RECHAZADA: 'chip-rechazada',
  VENCIDA: 'chip-vencida',
};

export const SUBSCRIPTION_LABEL: Record<string, string> = {
  TRIAL: 'Prueba', ACTIVE: 'Activa', EXPIRED: 'Vencida', PAST_DUE: 'Pago pendiente', CANCELLED: 'Cancelada', NONE: 'Sin plan',
};

export const SUBSCRIPTION_CHIP: Record<string, string> = {
  TRIAL: 'chip-enviada', ACTIVE: 'chip-pagada', EXPIRED: 'chip-vencida', PAST_DUE: 'chip-vencida', CANCELLED: 'chip-rechazada', NONE: 'chip-borrador',
};
