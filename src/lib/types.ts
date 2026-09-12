export type ClientType = 'DIRECT' | 'AGENCY';

export interface TeamMemberSummary {
  id: string;
  name: string;
  email: string;
}

export interface Client {
  id: string;
  agencyId: string;
  name: string;
  type: ClientType;
  phone: string;
  phoneCountry: string;
  email: string | null;
  document: string | null;
  country: string | null;
  city: string | null;
  sellerId: string | null;
  seller: TeamMemberSummary | null;
  notes: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface ClientFormValues {
  name: string;
  type: ClientType;
  phone: string;
  phoneCountry: string;
  email?: string;
  document?: string;
  country?: string;
  city?: string;
  notes?: string;
}

export interface TeamRole {
  id: string;
  name: string;
  slug: string;
}

export type ProductType = 'HOTEL' | 'TOUR' | 'TRANSPORT' | 'FLIGHT' | 'INSURANCE' | 'EXPERIENCE' | 'OTHER';
export type ProductUnit = 'PER_PERSON' | 'PER_NIGHT' | 'PER_SERVICE';
export type MarkupType = 'PERCENT' | 'FIXED';
export type ReservationMode = 'DAY' | 'NIGHT' | 'HOUR';

export interface ProductExtra {
  title: string;
  quantity: number;
  price: number;
}

export interface Supplier {
  id: string;
  agencyId: string;
  name: string;
  type: ProductType | null;
  contact: string | null;
  email: string | null;
  phone: string | null;
  commissionPct: number;
  notes: string | null;
  active: boolean;
  createdAt: string;
  productsCount: number;
}

export interface SupplierFormValues {
  name: string;
  type?: ProductType;
  contact?: string;
  email?: string;
  phone?: string;
  commissionPct?: number;
  notes?: string;
}

export interface Product {
  id: string;
  agencyId: string;
  supplierId: string | null;
  supplier: Supplier | null;
  name: string;
  description: string | null;
  imageUrl: string | null;
  type: ProductType;
  category: string | null;
  tags: string[];
  netCost: number;
  currency: string;
  unit: ProductUnit;
  markupType: MarkupType;
  markupValue: number;
  taxPct: number;
  active: boolean;
  timesQuoted: number;
  sellPrice: number;
  marginAmount: number;
  marginPct: number;
  createdAt: string;
  longDescription: string | null;
  reservationMode: ReservationMode;
  durationHours: number | null;
  startTime: string | null;
  endTime: string | null;
  capacityTotal: number | null;
  capacityAdults: number | null;
  capacityChildren: number | null;
  pmsEnabled: boolean;
  blockedDates: string[];
  stockPerDayEnabled: boolean;
  stockPerDayMax: number | null;
  extras: ProductExtra[];
}

export interface ProductFormValues {
  name: string;
  description?: string;
  imageUrl?: string;
  type: ProductType;
  category?: string;
  tags: string[];
  netCost: number;
  currency: string;
  unit: ProductUnit;
  markupType: MarkupType;
  markupValue: number;
  taxPct: number;
  supplierId?: string;
  longDescription?: string;
  reservationMode: ReservationMode;
  durationHours?: number;
  startTime?: string;
  endTime?: string;
  capacityTotal?: number;
  capacityAdults?: number;
  capacityChildren?: number;
  pmsEnabled?: boolean;
  blockedDates: string[];
  stockPerDayEnabled?: boolean;
  stockPerDayMax?: number;
  extras: ProductExtra[];
}

export type QuoteStatus = 'BORRADOR' | 'ENVIADA' | 'ACEPTADA' | 'ABONADA' | 'PAGADA' | 'RECHAZADA' | 'VENCIDA';

// On Vacation only — a manual tag layered on top of QuoteStatus, never inferred automatically.
export type QuoteSpecialStatus = 'NO_PAGO_INICIAL' | 'NO_PAGO_TOTAL' | 'FECHA_ABIERTA' | 'PROTECCION_CUPOS' | 'NO_SHOW';

export type PriceTier = 'BASE' | 'INTERMEDIATE' | 'IDEAL' | 'CUSTOM';

export interface QuoteItemExtra {
  title: string;
  quantity: number;
  price: number;
}

export interface QuoteItemDraft {
  id?: string;
  productId?: string;
  // On Vacation only — a snapshot reference into the official catalog. The backend recomputes
  // name/description/imageUrl from the accommodation itself when this is present; catalogHotelId
  // is local-only display context and is never sent to the API (not a whitelisted DTO field).
  catalogAccommodationId?: string;
  catalogHotelId?: string;
  // Informational only — never sent to the API (not a DTO field): infants don't affect pricing,
  // the advisor just wants to keep track of them alongside adults/children.
  infants?: number;
  name: string;
  description?: string;
  imageUrl?: string | null;
  unit: ProductUnit;
  quantity: string;
  nights?: number;
  adults?: number;
  children?: number;
  currency?: string;
  fxRate?: string;
  netCost?: string;
  markupType?: MarkupType;
  markupValue?: string;
  discountItem?: string;
  taxPct?: string;
  serviceDate?: string | null;
  serviceEndDate?: string | null;
  priceTier?: PriceTier;
  extras?: QuoteItemExtra[];
  reservationMode?: ReservationMode | null;
  durationHours?: string | null;
  startTime?: string | null;
  endTime?: string | null;
}

export interface QuoteItemView extends QuoteItemDraft {
  id: string;
  sellPrice: string;
  preTax: string;
  tax: string;
  marginItem?: string;
  base?: string;
  originalMarkupValue?: string;
}

export interface QuoteRef { id: string; name: string }

export interface Quote {
  id: string;
  number: string;
  publicId: string;
  clientId: string;
  client?: QuoteRef;
  sellerId: string;
  seller?: QuoteRef;
  destination: string | null;
  startDate: string | null;
  endDate: string | null;
  adults: number;
  children: number;
  validityDays: number;
  validUntil: string | null;
  paidAt: string | null;
  currency: string;
  notes: string;
  internalNotes?: string;
  status: QuoteStatus;
  statusLabel: string;
  specialStatus: QuoteSpecialStatus | null;
  specialStatusLabel: string | null;
  version: number;
  subtotal: string;
  taxTotal: string;
  total: string;
  globalDiscount: string;
  discountTotal: string;
  depositAmount: string;
  balanceDue: string;
  costTotal?: string;
  marginTotal?: string;
  marginPct?: string;
  commissionAmount?: string;
  commissionBase?: 'MARGIN' | 'TOTAL';
  commissionPct?: string;
  createdAt: string;
  updatedAt: string;
  items: QuoteItemView[];
  events?: { id: string; type: string; fromStatus: QuoteStatus | null; toStatus: QuoteStatus | null; createdAt: string }[];
  payments?: { id: string; amount: string; createdAt: string; paymentDate: string; reference: string | null }[];
}

export interface QuoteListSummaryRow {
  currency: string;
  status: QuoteStatus;
  count: number;
  total: string;
  marginTotal?: string;
}

export interface QuoteHeaderDraft {
  clientId: string;
  startDate?: string;
  endDate?: string;
  adults?: number;
  children?: number;
  validityDays?: number;
  currency?: string;
  notes?: string;
  internalNotes?: string;
  globalDiscount?: string;
  commissionBase?: 'MARGIN' | 'TOTAL';
  commissionPct?: string;
}

export interface CatalogProduct {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  unit: ProductUnit;
  currency: string;
  type: ProductType;
  category: string | null;
  sellPrice: string;
  reservationMode: ReservationMode;
  durationHours: string | null;
  startTime: string | null;
  endTime: string | null;
  netCost?: string;
  markupType?: MarkupType;
  markupValue?: string;
  taxPct?: string;
}

export interface PipelineCard {
  id: string;
  version: number;
  number: string;
  status: QuoteStatus;
  statusLabel: string;
  specialStatus: QuoteSpecialStatus | null;
  specialStatusLabel: string | null;
  client?: QuoteRef;
  seller?: QuoteRef;
  destination: string;
  total: string;
  currency: string;
  createdAt: string;
  startDate: string | null;
  validUntil: string | null;
  depositAmount: string;
  balanceDue: string;
  availableTransitions: QuoteStatus[];
  canRecordPayment: boolean;
  canReopen: boolean;
}

export interface PipelineColumn {
  status: QuoteStatus;
  cards: PipelineCard[];
}

export type PaymentMethod = 'BANK_TRANSFER' | 'CARD' | 'CASH';
export type AgencyType = 'AGENCIA_VIAJES' | 'OPERADOR_TURISTICO' | 'HOTEL' | 'COMERCIALIZADOR_TURISTICO' | 'OTRO' | 'ON_VACATION';

export const AGENCY_TYPE_LABELS: Record<AgencyType, string> = {
  AGENCIA_VIAJES: 'Agencia de Viajes',
  OPERADOR_TURISTICO: 'Operador Turístico',
  HOTEL: 'Hotel',
  COMERCIALIZADOR_TURISTICO: 'Comercializador Turístico',
  OTRO: 'Otro',
  ON_VACATION: 'On Vacation',
};

// ON_VACATION only registers through its own dedicated flow (/register/on-vacation) — never an
// option a regular signup picks from the generic business-type dropdown.
export const GENERIC_AGENCY_TYPES = (Object.keys(AGENCY_TYPE_LABELS) as AgencyType[]).filter(
  (type) => type !== 'ON_VACATION',
);

export interface Agency {
  id: string;
  name: string;
  slug: string;
  type: AgencyType;
  logoUrl: string | null;
  primaryColor: string;
  baseCurrency: string;
  taxId: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  taxName: string | null;
  taxPct: number;
  paymentMethod: PaymentMethod;
  bankName: string | null;
  bankAccount: string | null;
  bankAccountHolder: string | null;
  termsText: string | null;
  monthlySalesGoal: number;
}

export interface AgencyFormValues {
  name?: string;
  type?: AgencyType;
  logoUrl?: string;
  primaryColor?: string;
  baseCurrency?: string;
  taxId?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  taxName?: string;
  taxPct?: number;
  paymentMethod?: PaymentMethod;
  bankName?: string;
  bankAccount?: string;
  bankAccountHolder?: string;
  termsText?: string;
  monthlySalesGoal?: number;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  phone: string | null;
  active: boolean;
  roles: TeamRole[];
  quotesCount: number;
  wonCount: number;
  sold: number;
  commission: number;
}

export type AnalyticsGranularity = 'day' | 'month';

export interface QuoteAnalyticsBucket {
  date: string;
  cotizado: number;
  aceptado: number;
  enCurso: number;
}

export interface QuoteAnalytics {
  currency: string;
  granularity: AnalyticsGranularity;
  window: number;
  buckets: QuoteAnalyticsBucket[];
}

export interface QuoteAccessRow {
  userId: string;
  name: string | null;
  accessType: string;
  grantedBy: string;
  createdAt: string;
}

export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'PAST_DUE' | 'CANCELLED';
export type BillingPeriod = 'MONTHLY';

export interface SubscriptionSummary {
  status: SubscriptionStatus;
  trialStart: string | null;
  trialEnd: string | null;
}

export interface Plan {
  id: string;
  code: string;
  name: string;
  description: string | null;
  price: string;
  currency: string;
  billingPeriod: BillingPeriod;
  trialDays: number;
  features: string[];
  recommended: boolean;
}

export interface AgencySubscriptionDetail {
  status: SubscriptionStatus;
  plan: { id: string; name: string; features: string[] } | null;
  agreedPrice: string | null;
  currency: string | null;
  billingPeriod: BillingPeriod | null;
  trialStart: string | null;
  trialEnd: string | null;
}

export type BillingPaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'EXPIRED';

export interface BillingPayment {
  id: string;
  boldLinkId: string;
  boldTransactionId: string | null;
  reference: string;
  amount: string;
  currency: string;
  status: BillingPaymentStatus;
  createdAt: string;
  updatedAt: string;
}
