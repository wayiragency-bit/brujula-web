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
  sellerId?: string;
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
}

export type QuoteStatus = 'BORRADOR' | 'ENVIADA' | 'ACEPTADA' | 'ABONADA' | 'PAGADA' | 'RECHAZADA' | 'VENCIDA';

export interface QuoteItemDraft {
  id?: string;
  productId?: string;
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
}

export interface QuoteItemView extends QuoteItemDraft {
  id: string;
  sellPrice: string;
  preTax: string;
  tax: string;
  marginItem?: string;
  base?: string;
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
  destination: string;
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
  payments?: { id: string; amount: string; createdAt: string }[];
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
  sellerId?: string;
  destination: string;
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
  client?: QuoteRef;
  seller?: QuoteRef;
  destination: string;
  total: string;
  currency: string;
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

export interface Agency {
  id: string;
  name: string;
  slug: string;
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
