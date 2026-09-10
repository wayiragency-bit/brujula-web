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
