import type { QuoteRef, QuoteSpecialStatus, QuoteStatus, SubscriptionStatus } from '@/lib/types';

export interface ManagerSubscriptionSummary {
  status: SubscriptionStatus;
  planCode: string | null;
  trialEnd: string | null;
  agreedPrice: string | null;
  currency: string | null;
}

export interface AdvisorSummary {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  createdAt: string;
  owner: { name: string; email: string } | null;
  subscription: ManagerSubscriptionSummary | null;
}

export interface ManagerDashboardSummary {
  totalAdvisors: number;
  byStatus: Record<SubscriptionStatus | 'NONE', number>;
  recentAdvisors: AdvisorSummary[];
}

export interface ManagerSubscriptionRow {
  agencyId: string;
  agencyName: string;
  owner: { name: string; email: string } | null;
  subscription: ManagerSubscriptionSummary | null;
}

export interface ManagerClientRow {
  id: string;
  name: string;
  type: string;
  phone: string;
  phoneCountry: string;
  email: string | null;
  document: string | null;
  country: string | null;
  city: string | null;
  active: boolean;
  createdAt: string;
  seller: { id: string; name: string } | null;
  agency: { id: string; name: string };
}

export interface ManagerQuoteRow {
  id: string;
  number: string;
  clientId: string;
  client?: QuoteRef;
  sellerId: string;
  seller?: QuoteRef;
  destination: string | null;
  startDate: string | null;
  endDate: string | null;
  status: QuoteStatus;
  statusLabel: string;
  specialStatus: QuoteSpecialStatus | null;
  specialStatusLabel: string | null;
  currency: string;
  total: string;
  createdAt: string;
  updatedAt: string;
  agency: { id: string; name: string };
}

export interface ManagerOperationCard {
  id: string;
  number: string;
  status: QuoteStatus;
  statusLabel: string;
  specialStatus: QuoteSpecialStatus | null;
  specialStatusLabel: string | null;
  client?: QuoteRef;
  seller?: QuoteRef;
  agency: { id: string; name: string };
  destination: string | null;
  total: string;
  currency: string;
  createdAt: string;
  startDate: string | null;
  validUntil: string | null;
}

export interface ManagerOperationColumn {
  status: QuoteStatus;
  cards: ManagerOperationCard[];
}

export interface AnalyticsGeneral {
  totalAdvisors: number;
  totalClients: number;
  totalQuotes: number;
  salesValue: number;
  conversion: number;
  avgTicket: number;
  funnel: { status: QuoteStatus; count: number }[];
  specialStatusBreakdown: { code: string; count: number }[];
  growth: { quotesCountPct: number | null; salesValuePct: number | null } | null;
}

export interface AnalyticsByAdvisor {
  agencyId: string;
  agencyName: string;
  quotesCount: number;
  sentCount: number;
  wonCount: number;
  paidCount: number;
  salesValue: number;
  clientsCount: number;
  destinationsSold: number;
  hotelsSold: number;
  conversion: number;
  avgTicket: number;
}

export interface AnalyticsHotel {
  hotelId: string;
  hotelName: string;
  quotesCount: number;
  sentCount: number;
  wonCount: number;
  salesValue: number;
  totalPeople: number;
  totalNights: number;
  advisorsSelling: number;
  conversion: number;
  avgTicket: number;
}

export interface AnalyticsAccommodation {
  accommodationId: string;
  accommodationName: string;
  hotelName: string;
  quotesCount: number;
  wonCount: number;
  salesValue: number;
  totalPeople: number;
  conversion: number;
}

export interface AnalyticsDestination {
  destination: string | null;
  quotesCount: number;
  sentCount: number;
  wonCount: number;
  salesValue: number;
  totalPeople: number;
  share: number;
  conversion: number;
}
