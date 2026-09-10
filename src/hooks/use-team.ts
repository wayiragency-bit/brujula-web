import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { TeamMember, TeamRole } from '@/lib/types';

export function useTeam() {
  return useQuery({
    queryKey: ['team'],
    queryFn: () => api.get<TeamMember[]>('/team'),
  });
}

export function useTeamRoles() {
  return useQuery({
    queryKey: ['team', 'roles'],
    queryFn: () => api.get<TeamRole[]>('/team/roles'),
  });
}

export interface InviteMemberValues {
  name: string;
  email: string;
  password: string;
  roleId: string;
  phone?: string;
}

export function useInviteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: InviteMemberValues) => api.post<TeamMember>('/team', values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team'] }),
  });
}

export interface UpdateMemberValues {
  name?: string;
  phone?: string;
  roleId?: string;
  active?: boolean;
}

export function useUpdateMember(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: UpdateMemberValues) => api.patch<TeamMember>(`/team/${id}`, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team'] }),
  });
}

export function useDeleteMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/team/${id}`),
    onMutate: (id: string) => {
      queryClient.setQueryData<TeamMember[]>(['team'], (old) => old?.filter((m) => m.id !== id) ?? []);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['team'] }),
  });
}
