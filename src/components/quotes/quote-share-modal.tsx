'use client';

import { Trash2, UserPlus, X } from 'lucide-react';
import { useState } from 'react';
import { useGrantQuoteAccess, useQuoteAccess, useRevokeQuoteAccess } from '@/hooks/use-quotes';
import { useTeam } from '@/hooks/use-team';
import type { Quote } from '@/lib/types';

interface QuoteShareModalProps {
  quote: Quote;
  onClose: () => void;
}

export function QuoteShareModal({ quote, onClose }: QuoteShareModalProps) {
  const { data: access, isLoading } = useQuoteAccess(quote.id);
  const { data: team } = useTeam();
  const grant = useGrantQuoteAccess(quote.id);
  const revoke = useRevokeQuoteAccess(quote.id);
  const [selected, setSelected] = useState('');

  const sharedIds = new Set(access?.map((row) => row.userId));
  const candidates = team?.filter((member) => member.id !== quote.sellerId && !sharedIds.has(member.id)) ?? [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'var(--paper-card)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="label-caps text-ink-soft">Compartir cotización</p>
            <h3 className="font-display text-lg font-extrabold text-ink mt-1">{quote.number}</h3>
          </div>
          <button aria-label="Cerrar" className="rounded-lg p-1.5 text-ink-soft transition hover:bg-ink/5" onClick={onClose} type="button">
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm text-ink-soft">
          El agente compartido podrá ver y editar esta cotización, sin volverse su propietario.
        </p>

        <div className="flex gap-2">
          <select
            className="flex-1 rounded-lg px-3 py-2 text-sm text-ink outline-none"
            onChange={(e) => setSelected(e.target.value)}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            value={selected}
          >
            <option value="">Seleccionar agente…</option>
            {candidates.map((member) => (
              <option key={member.id} value={member.id}>{member.name}</option>
            ))}
          </select>
          <button
            className="button-primary inline-flex items-center gap-1.5 px-3"
            disabled={!selected || grant.isPending}
            onClick={() => { grant.mutate(selected); setSelected(''); }}
            type="button"
          >
            <UserPlus className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-1.5">
          {isLoading ? <p className="text-sm text-ink-soft">Cargando…</p> : null}
          {access && access.length === 0 ? <p className="text-sm text-ink-soft">Nadie más tiene acceso a esta cotización.</p> : null}
          {access?.map((row) => (
            <div
              className="flex items-center justify-between rounded-lg px-3 py-2"
              key={row.userId}
              style={{ background: 'var(--surface)' }}
            >
              <span className="text-sm text-ink">{row.name ?? row.userId}</span>
              <button
                aria-label="Quitar acceso"
                className="rounded-lg p-1 text-ink-soft transition hover:bg-red-50 hover:text-red-600"
                disabled={revoke.isPending}
                onClick={() => revoke.mutate(row.userId)}
                type="button"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
