import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { CatalogProduct, Paginated, Quote, QuoteAccessRow, QuoteHeaderDraft, QuoteItemDraft, QuoteListSummaryRow, QuoteRef, QuoteStatus } from '@/lib/types';

export interface QuotesFilters {
  q?: string;
  status?: QuoteStatus;
  statuses?: QuoteStatus[];
  sellerId?: string;
  from?: string;
  to?: string;
  createdFrom?: string;
  createdTo?: string;
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

export function useResendQuoteEmail() {
  return useMutation({
    mutationFn: (id: string) => api.post<{ sent: true }>(`/quotes/${id}/resend-email`),
  });
}

export function useDeleteQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) => api.delete<void>(`/quotes/${id}?version=${version}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quotes'] }),
  });
}

export function useQuoteAccess(id: string | undefined) {
  return useQuery({
    queryKey: ['quotes', id, 'access'],
    queryFn: () => api.get<QuoteAccessRow[]>(`/quotes/${id}/access`),
    enabled: Boolean(id),
  });
}

export function useGrantQuoteAccess(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.post<QuoteAccessRow[]>(`/quotes/${id}/access`, { userId }),
    onSuccess: (rows) => queryClient.setQueryData(['quotes', id, 'access'], rows),
  });
}

export function useRevokeQuoteAccess(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.delete<QuoteAccessRow[]>(`/quotes/${id}/access/${userId}`),
    onSuccess: (rows) => queryClient.setQueryData(['quotes', id, 'access'], rows),
  });
}

export function useRecordPayment(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { version: number; amount: string; idempotencyKey: string; paymentDate?: string; reference?: string }) =>
      api.post<Quote>(`/quotes/${id}/payments`, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['quotes'] }),
  });
}
