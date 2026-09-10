import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Agency, AgencyFormValues } from '@/lib/types';

export function useAgency() {
  return useQuery({
    queryKey: ['settings', 'agency'],
    queryFn: () => api.get<Agency>('/settings/agency'),
  });
}

export function useUpdateAgency() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: AgencyFormValues) => api.patch<Agency>('/settings/agency', values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings', 'agency'] }),
  });
}
