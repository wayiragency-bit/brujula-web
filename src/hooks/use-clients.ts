import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Client, ClientFormValues, Paginated } from '@/lib/types';

export interface ClientsFilters {
  q?: string;
  type?: 'DIRECT' | 'AGENCY';
  active?: boolean;
  page: number;
  limit: number;
}

function buildQuery(filters: ClientsFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  if (filters.type) params.set('type', filters.type);
  if (filters.active !== undefined) params.set('active', String(filters.active));
  params.set('page', String(filters.page));
  params.set('limit', String(filters.limit));
  return params.toString();
}

export function useClients(filters: ClientsFilters) {
  return useQuery({
    queryKey: ['clients', filters],
    queryFn: () => api.get<Paginated<Client>>(`/clients?${buildQuery(filters)}`),
    placeholderData: (previous) => previous,
  });
}

export function useClient(id: string | undefined) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: () => api.get<Client>(`/clients/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: ClientFormValues) => api.post<Client>('/clients', values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });
}

export function useUpdateClient(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: Partial<ClientFormValues>) => api.patch<Client>(`/clients/${id}`, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}

export function useDeactivateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/clients/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients'] }),
  });
}
