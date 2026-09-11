'use client';

import { Plus, SquarePen, Trash2, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { TeamMemberFormModal } from '@/components/team/team-member-form-modal';
import { useDeleteMember, useInviteMember, useTeam, useUpdateMember } from '@/hooks/use-team';
import type { InviteMemberValues, UpdateMemberValues } from '@/hooks/use-team';
import type { TeamMember } from '@/lib/types';

function formatMoney(value: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
}

const AVATAR_COLORS = [
  { bg: 'rgba(17,67,63,0.9)', text: '#feb23b' },
  { bg: 'rgba(14,165,233,0.2)', text: '#38bdf8' },
  { bg: 'rgba(192,132,252,0.2)', text: '#c084fc' },
  { bg: 'rgba(34,197,94,0.2)', text: '#4ade80' },
  { bg: 'rgba(249,115,22,0.2)', text: '#fb923c' },
];

export default function TeamPage() {
  const { data: members, isLoading } = useTeam();
  const inviteMember = useInviteMember();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const updateMember = useUpdateMember(editing?.id ?? 'none');
  const deleteMember = useDeleteMember();
  const [confirmDelete, setConfirmDelete] = useState<TeamMember | null>(null);

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
            members?.map((member, idx) => {
              const avatarStyle = AVATAR_COLORS[idx % AVATAR_COLORS.length];
              const winRate = member.quotesCount > 0 ? ((member.wonCount / member.quotesCount) * 100).toFixed(0) : '0';
              return (
                <article
                  className="flex flex-col rounded-2xl overflow-hidden transition"
                  key={member.id}
                  style={{ background: 'var(--paper-card)', border: '1px solid var(--border)' }}
                >
                  {/* Card header */}
                  <div
                    className="flex flex-col items-center px-6 pb-5 pt-7"
                    style={{ borderBottom: '1px solid var(--border-faint)' }}
                  >
                    {/* Avatar */}
                    <div
                      className="flex h-16 w-16 items-center justify-center rounded-full font-mono text-xl font-bold ring-4"
                      style={{
                        background: avatarStyle.bg,
                        color: avatarStyle.text,
                        boxShadow: '0 0 0 4px var(--border-faint)',
                      }}
                    >
                      {initials(member.name)}
                    </div>
                    <h2 className="mt-3 font-semibold text-ink">{member.name}</h2>
                    <span
                      className="mt-1 rounded-full px-2.5 py-0.5 label-caps"
                      style={{ background: 'rgba(14,165,233,0.12)', color: '#38bdf8' }}
                    >
                      {member.roles[0]?.name ?? 'Agente'}
                    </span>
                    {!member.active && (
                      <span
                        className="mt-2 rounded-full px-2.5 py-0.5 label-caps"
                        style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}
                      >
                        Inactivo
                      </span>
                    )}
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 gap-0 flex-1">
                    {[
                      { label: 'COTIZACIONES', value: String(member.quotesCount) },
                      { label: 'GANADAS',       value: String(member.wonCount),   accent: '#4ade80' },
                      { label: 'COMISIÓN',      value: `${winRate}%` },
                      { label: 'VENDIDO',       value: formatMoney(member.sold) },
                    ].map((stat, i) => (
                      <div
                        className="flex flex-col items-center justify-center py-4"
                        key={stat.label}
                        style={{
                          borderRight: i % 2 === 0 ? '1px solid var(--border-faint)' : undefined,
                          borderBottom: i < 2 ? '1px solid var(--border-faint)' : undefined,
                        }}
                      >
                        <p
                          className="font-mono text-2xl font-bold"
                          style={{ color: stat.accent ?? 'var(--ink)' }}
                        >
                          {stat.value}
                        </p>
                        <p className="label-caps text-ink-muted">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Commission earned */}
                  <div
                    className="flex items-center justify-between px-5 py-3"
                    style={{ borderTop: '1px solid var(--border-faint)', background: 'rgba(34,197,94,0.05)' }}
                  >
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-green-400" />
                      <span className="label-caps text-green-400">COMISIÓN GENERADA</span>
                    </div>
                    <span className="font-mono text-sm font-bold text-green-400">{formatMoney(member.commission)}</span>
                  </div>

                  {/* Actions */}
                  <div className="px-4 py-3 flex gap-2" style={{ borderTop: '1px solid var(--border-faint)' }}>
                    <button
                      className="button-secondary flex-1 inline-flex items-center justify-center gap-2"
                      onClick={() => openEdit(member)}
                      type="button"
                    >
                      <SquarePen className="h-3.5 w-3.5" /> Editar
                    </button>
                    <button
                      className="inline-flex items-center justify-center rounded-lg px-3 py-2 text-red-400 transition hover:bg-red-400/10"
                      onClick={() => setConfirmDelete(member)}
                      style={{ border: '1px solid var(--border)' }}
                      title="Eliminar asesor"
                      type="button"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>

      <TeamMemberFormModal key={modalKey} initial={editing ?? undefined} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} open={modalOpen} />

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setConfirmDelete(null)}>
          <div className="w-full max-w-sm rounded-2xl p-6 space-y-4" style={{ background: 'var(--paper-card)', border: '1px solid var(--border)' }} onClick={(e) => e.stopPropagation()}>
            <div>
              <p className="label-caps text-red-400">Eliminar asesor</p>
              <h3 className="font-display text-lg font-extrabold text-ink mt-1">{confirmDelete.name}</h3>
              <p className="text-sm text-ink-soft mt-1">Esta acción eliminará al asesor permanentemente. Sus cotizaciones se conservarán.</p>
            </div>
            <div className="flex gap-2 justify-end">
              <button className="button-secondary" onClick={() => setConfirmDelete(null)} type="button">Cancelar</button>
              <button
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition disabled:opacity-50"
                disabled={deleteMember.isPending}
                onClick={() => {
                  const id = confirmDelete.id;
                  setConfirmDelete(null);
                  deleteMember.mutate(id);
                }}
                type="button"
              >
                <Trash2 className="h-3.5 w-3.5" /> {deleteMember.isPending ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
