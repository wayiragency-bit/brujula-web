import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { PipelineCard, PipelineColumn } from '@/lib/types';

export function usePipelineKanban() {
  return useQuery({
    queryKey: ['pipeline', 'kanban'],
    queryFn: () => api.get<{ data: PipelineColumn[] }>('/pipeline/kanban?limit=200'),
  });
}

export function usePipelineCalendar(month: number, year: number) {
  return useQuery({
    queryKey: ['pipeline', 'calendar', month, year],
    queryFn: () => api.get<{ data: PipelineCard[] }>(`/pipeline/calendar?month=${month}&year=${year}&limit=200`),
  });
}
