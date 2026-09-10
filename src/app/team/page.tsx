'use client';

import { Plus, SquarePen } from 'lucide-react';
import { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { TeamMemberFormModal } from '@/components/team/team-member-form-modal';
import { useInviteMember, useTeam, useUpdateMember } from '@/hooks/use-team';
import type { InviteMemberValues, UpdateMemberValues } from '@/hooks/use-team';
import type { TeamMember } from '@/lib/types';

function formatMoney(value: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
}

export default function TeamPage() {
  const { data: members, isLoading } = useTeam();
  const inviteMember = useInviteMember();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const updateMember = useUpdateMember(editing?.id ?? 'none');

  function openCreate() {
    setEditing(null);
    setModalKey((k) => k + 1);
    setModalOpen(true);
  }

  function openEdit(member: TeamMember) {
    setEditing(member);
    setModalKey((k) => k + 1);
    setModalOpen(true);
  }

  async function handleSubmit(values: InviteMemberValues | UpdateMemberValues) {
    if (editing) await updateMember.mutateAsync(values as UpdateMemberValues);
    else await inviteMember.mutateAsync(values as InviteMemberValues);
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-content space-y-6 px-4 pb-28 pt-7 sm:px-6 lg:px-8 lg:pb-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-ink">Equipo de Ventas</h1>
            <p className="mt-1 text-sm text-ink-soft">Gestiona los accesos, comisiones y rendimiento de tus agentes.</p>
          </div>
          <button className="button-primary inline-flex items-center gap-2" onClick={openCreate} type="button">
            <Plus className="h-4 w-4" /> Nuevo Agente
          </button>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {isLoading ? (
            <p className="text-ink-soft">Cargando equipo…</p>
          ) : (
            members?.map((member) => (
              <article className="flex flex-col gap-4 rounded-2xl border border-ink/10 bg-paper-card p-5 shadow-card" key={member.id}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal font-mono text-xs font-bold text-[#a0d0ca]">
                      {initials(member.name)}
                    </div>
                    <div>
                      <p className="font-semibold text-ink">{member.name}</p>
                      <p className="label-caps text-ink-soft">{member.roles[0]?.name ?? 'Sin rol'}</p>
                    </div>
                  </div>
                  <button aria-label="Editar" className="rounded-lg p-1.5 text-ink-soft transition hover:bg-ink/5 hover:text-teal" onClick={() => openEdit(member)} type="button">
                    <SquarePen className="h-4 w-4" />
                  </button>
                </div>
                {!member.active ? (
                  <span className="w-fit rounded-full bg-red-100 px-2.5 py-1 font-mono text-[10px] font-bold uppercase text-red-600">Inactivo</span>
                ) : null}
                <div className="grid grid-cols-4 gap-2 border-t border-ink/10 pt-4 font-mono text-xs">
                  <div>
                    <p className="label-caps text-ink-soft">Cotiz.</p>
                    <p className="font-bold text-ink">{member.quotesCount}</p>
                  </div>
                  <div>
                    <p className="label-caps text-ink-soft">Ganadas</p>
                    <p className="font-bold text-ink">{member.wonCount}</p>
                  </div>
                  <div>
                    <p className="label-caps text-ink-soft">Vendido</p>
                    <p className="font-bold text-ink">{formatMoney(member.sold)}</p>
                  </div>
                  <div>
                    <p className="label-caps text-ink-soft">Comisión</p>
                    <p className="font-bold text-status-accepted">{formatMoney(member.commission)}</p>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      <TeamMemberFormModal key={modalKey} initial={editing ?? undefined} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} open={modalOpen} />
    </AppShell>
  );
}
