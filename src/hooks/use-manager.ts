import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Paginated } from '@/lib/types';
import type {
  AdvisorSummary,
  AnalyticsAccommodation,
  AnalyticsByAdvisor,
  AnalyticsDestination,
  AnalyticsGeneral,
  AnalyticsHotel,
  ManagerClientRow,
  ManagerDashboardSummary,
  ManagerOperationColumn,
  ManagerQuoteRow,
  ManagerSubscriptionRow,
} from '@/lib/manager-types';

export function useManagerDashboard() {
  return useQuery({
    queryKey: ['manager', 'dashboard'],
    queryFn: () => api.get<ManagerDashboardSummary>('/manager/dashboard'),
  });
}

export function useManagerAdvisors() {
  return useQuery({
    queryKey: ['manager', 'advisors'],
    queryFn: () => api.get<AdvisorSummary[]>('/manager/advisors'),
  });
}

export function useManagerSubscriptions(status?: string) {
  return useQuery({
    queryKey: ['manager', 'subscriptions', status ?? 'all'],
    queryFn: () => api.get<ManagerSubscriptionRow[]>(`/manager/subscriptions${status ? `?status=${status}` : ''}`),
  });
}

export interface ManagerClientsFilters {
  page?: number;
  limit?: number;
  q?: string;
}

export function useManagerClients(filters: ManagerClientsFilters = {}) {
  const params = new URLSearchParams();
  params.set('page', String(filters.page ?? 1));
  params.set('limit', String(filters.limit ?? 12));
  if (filters.q) params.set('q', filters.q);
  return useQuery({
    queryKey: ['manager', 'clients', filters],
    queryFn: () => api.get<Paginated<ManagerClientRow>>(`/manager/clients?${params.toString()}`),
  });
}

export interface ManagerQuotesFilters {
  page?: number;
  limit?: number;
  q?: string;
  status?: string;
}

export function useManagerQuotes(filters: ManagerQuotesFilters = {}) {
  const params = new URLSearchParams();
  params.set('page', String(filters.page ?? 1));
  params.set('limit', String(filters.limit ?? 20));
  if (filters.q) params.set('q', filters.q);
  if (filters.status) params.set('status', filters.status);
  return useQuery({
    queryKey: ['manager', 'quotes', filters],
    queryFn: () => api.get<Paginated<ManagerQuoteRow>>(`/manager/quotes?${params.toString()}`),
  });
}

export function useManagerOperation() {
  return useQuery({
    queryKey: ['manager', 'operation'],
    queryFn: () => api.get<{ data: ManagerOperationColumn[] }>('/manager/operation?limit=200'),
  });
}

export interface AnalyticsRange {
  from?: string;
  to?: string;
}

function rangeQuery(range: AnalyticsRange): string {
  const params = new URLSearchParams();
  if (range.from) params.set('from', range.from);
  if (range.to) params.set('to', range.to);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function useManagerAnalyticsGeneral(range: AnalyticsRange = {}) {
  return useQuery({
    queryKey: ['manager', 'analytics', 'general', range],
    queryFn: () => api.get<AnalyticsGeneral>(`/manager/analytics/general${rangeQuery(range)}`),
  });
}

export function useManagerAnalyticsAdvisors(range: AnalyticsRange = {}) {
  return useQuery({
    queryKey: ['manager', 'analytics', 'advisors', range],
    queryFn: () => api.get<AnalyticsByAdvisor[]>(`/manager/analytics/advisors${rangeQuery(range)}`),
  });
}

export function useManagerAnalyticsHotels(range: AnalyticsRange = {}) {
  return useQuery({
    queryKey: ['manager', 'analytics', 'hotels', range],
    queryFn: () => api.get<AnalyticsHotel[]>(`/manager/analytics/hotels${rangeQuery(range)}`),
  });
}

export function useManagerAnalyticsAccommodations(range: AnalyticsRange = {}) {
  return useQuery({
    queryKey: ['manager', 'analytics', 'accommodations', range],
    queryFn: () => api.get<AnalyticsAccommodation[]>(`/manager/analytics/accommodations${rangeQuery(range)}`),
  });
}

export function useManagerAnalyticsDestinations(range: AnalyticsRange = {}) {
  return useQuery({
    queryKey: ['manager', 'analytics', 'destinations', range],
    queryFn: () => api.get<AnalyticsDestination[]>(`/manager/analytics/destinations${rangeQuery(range)}`),
  });
}
