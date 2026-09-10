import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CatalogProduct, Paginated, Quote, QuoteHeaderDraft, QuoteItemDraft, QuoteListSummaryRow, QuoteRef, QuoteStatus } from '@/lib/types';

export interface QuotesFilters {
  q?: string;
  status?: QuoteStatus;
  statuses?: QuoteStatus[];
  sort?: 'createdAt' | 'startDate' | 'total' | 'number' | 'updatedAt';
  order?: 'ASC' | 'DESC';
  page: number;
  limit: number;
}

function buildQuery(filters: QuotesFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  return params.toString();
}

export function useQuotes(filters: QuotesFilters) {
  return useQuery({
    queryKey: ['quotes', filters],
    queryFn: () => api.get<Paginated<Quote> & { summary: QuoteListSummaryRow[] }>(`/quotes?${buildQuery(filters)}`),
    placeholderData: (previous) => previous,
  });
}

export function useQuote(id: string | undefined) {
  return useQuery({
    queryKey: ['quotes', id],
    queryFn: () => api.get<Quote>(`/quotes/${id}`),
    enabled: Boolean(id),
  });
}

export function useQuoteCatalog(q: string) {
  return useQuery({
    queryKey: ['quotes', 'catalog', q],
    queryFn: () => api.get<CatalogProduct[]>(`/quotes/catalog?q=${encodeURIComponent(q)}`),
  });
}

export function useQuoteClientOptions(q: string) {
  return useQuery({
    queryKey: ['quotes', 'client-options', q],
    queryFn: () => api.get<QuoteRef[]>(`/quotes/client-options?q=${encodeURIComponent(q)}`),
  });
}

export function useQuoteSellers() {
  return useQuery({
    queryKey: ['quotes', 'sellers'],
    queryFn: () => api.get<QuoteRef[]>('/quotes/sellers'),
  });
}

export interface QuotePayload extends QuoteHeaderDraft {
  items?: QuoteItemDraft[];
}

export function usePreviewQuote() {
  return useMutation({
    mutationFn: (payload: QuotePayload & { quoteId?: string }) => api.post<Quote>('/quotes/preview', payload),
  });
}

export function useCreateQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: QuotePayload) => api.post<Quote>('/quotes', payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quotes'] }),
  });
}

export function useUpdateQuote(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: QuotePayload & { version: number }) => api.patch<Quote>(`/quotes/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
}

export function useChangeQuoteStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { version: number; status: QuoteStatus }) => api.post<Quote>(`/quotes/${id}/status`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quotes'] }),
  });
}

export function useRecordPayment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { version: number; amount: string; idempotencyKey: string }) => api.post<Quote>(`/quotes/${id}/payments`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quotes'] }),
  });
}
