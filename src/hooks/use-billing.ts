import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AgencySubscriptionDetail, AgencyType, Plan } from '@/lib/types';

export function usePlans(businessType?: AgencyType) {
  return useQuery({
    queryKey: ['plans', businessType ?? null],
    queryFn: () => api.get<Plan[]>(`/plans${businessType ? `?businessType=${businessType}` : ''}`),
  });
}

export function useSubscription() {
  return useQuery({
    queryKey: ['settings', 'subscription'],
    queryFn: () => api.get<AgencySubscriptionDetail | null>('/settings/subscription'),
  });
}
