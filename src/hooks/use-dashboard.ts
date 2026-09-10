import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AnalyticsGranularity, QuoteAnalytics } from '@/lib/types';

export interface AnalyticsFilters {
  granularity: AnalyticsGranularity;
  window: number;
}

export function useQuoteAnalytics(filters: AnalyticsFilters) {
  return useQuery({
    queryKey: ['dashboard', 'quotes-analytics', filters],
    queryFn: () => api.get<QuoteAnalytics>(`/quotes/analytics?granularity=${filters.granularity}&window=${filters.window}`),
    placeholderData: (previous) => previous,
  });
}
