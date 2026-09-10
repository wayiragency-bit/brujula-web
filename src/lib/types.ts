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
