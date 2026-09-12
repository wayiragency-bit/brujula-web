'use client';

import { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { useManagerOperation } from '@/hooks/use-manager';
import type { ManagerOperationCard } from '@/lib/manager-types';
import { formatMoneyFull } from '@/lib/format';
import { STATUS_CHIP } from '@/lib/manager-status-colors';
import { quoteStatusLabel, QUOTE_SPECIAL_STATUS_LABELS, QUOTE_SPECIAL_STATUS_ORDER } from '@/lib/on-vacation-status';
import type { QuoteStatus } from '@/lib/types';

// ON-VACATION-ESTADOS-PIPELINE-IMPORTANTE.md: the Pipeline itself is ONLY these 5 — Borrador,
// Vencida and the 5 "estatus especiales" are a separate concept ("Estatus de Cotización"), never
// rendered as Pipeline columns.
const PIPELINE_STATUSES: QuoteStatus[] = ['ENVIADA', 'ACEPTADA', 'ABONADA', 'PAGADA', 'RECHAZADA'];

function CardItem({ card }: { card: ManagerOperationCard }) {
  return (
    <div className="rounded-xl p-3" style={{ background: 'var(--surface)', border: '1px solid var(--border-faint)' }}>
      <p className="truncate text-sm font-medium text-ink">{card.number} · {card.client?.name ?? '—'}</p>
      <p className="truncate text-xs text-ink-soft">{card.agency.name}</p>
      <p className="truncate text-xs text-ink-soft">{card.destination ?? '—'}</p>
      <div className="mt-2 flex items-center justify-between">
        <span className="font-mono text-sm font-semibold text-ink">{formatMoneyFull(Number(card.total), card.currency)}</span>
      </div>
    </div>
  );
}

export default function ManagerPipelinePage() {
  const { data } = useManagerOperation();
  const columns = data?.data ?? [];
  const pipelineColumns = columns.filter((c) => PIPELINE_STATUSES.includes(c.status));
  const borradorCards = columns.find((c) => c.status === 'BORRADOR')?.cards ?? [];
  const vencidaCards = columns.find((c) => c.status === 'VENCIDA')?.cards ?? [];
  const allCards = columns.flatMap((c) => c.cards);

  const [openStatus, setOpenStatus] = useState<'BORRADOR' | 'VENCIDA' | string | null>(null);

  const specialGroups = QUOTE_SPECIAL_STATUS_ORDER.map((code) => ({
    code,
    label: QUOTE_SPECIAL_STATUS_LABELS[code],
    cards: allCards.filter((card) => card.specialStatus === code),
  }));

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-content space-y-8 px-5 pb-28 pt-8 sm:px-7 lg:px-10 lg:pb-10">
        <header>
          <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">Pipeline</h1>
          <p className="mt-2 text-sm text-ink-soft">Vista global de solo lectura — no se pueden mover ni editar cotizaciones aquí.</p>
        </header>

        <div className="flex gap-4 overflow-x-auto pb-4">
          {pipelineColumns.map((column) => (
            <div className="w-72 shrink-0 rounded-2xl" key={column.status} style={{ background: 'var(--paper-card)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border-faint)' }}>
                <span className={`${STATUS_CHIP[column.status]} rounded-full px-2.5 py-1 text-xs font-semibold`}>
                  {quoteStatusLabel(column.status, 'ON_VACATION')}
                </span>
                <span className="label-caps text-ink-muted">{column.cards.length}</span>
              </div>
              <div className="max-h-[70vh] space-y-2 overflow-y-auto p-3">
                {column.cards.length === 0 ? (
                  <p className="px-2 py-6 text-center text-xs text-ink-soft">Sin cotizaciones.</p>
                ) : (
                  column.cards.map((card) => <CardItem card={card} key={card.id} />)
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Estatus de Cotización — deliberately separate from the Pipeline above, per
            ON-VACATION-ESTADOS-PIPELINE-IMPORTANTE.md: Borrador, Vencida and the 5 special
            statuses never mix with the 5 Pipeline stages. */}
        <section>
          <h2 className="font-display text-xl font-bold text-ink">Estatus de Cotización</h2>
          <p className="mt-1 text-sm text-ink-soft">Borrador, vencidas y los 5 estatus especiales — independientes del Pipeline.</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className={`chip-borrador rounded-full px-3 py-1.5 text-xs font-semibold transition ${openStatus === 'BORRADOR' ? 'ring-2 ring-amber/40' : ''}`}
              onClick={() => setOpenStatus(openStatus === 'BORRADOR' ? null : 'BORRADOR')}
              type="button"
            >
              Borrador · {borradorCards.length}
            </button>
            <button
              className={`chip-vencida rounded-full px-3 py-1.5 text-xs font-semibold transition ${openStatus === 'VENCIDA' ? 'ring-2 ring-amber/40' : ''}`}
              onClick={() => setOpenStatus(openStatus === 'VENCIDA' ? null : 'VENCIDA')}
              type="button"
            >
              Vencida · {vencidaCards.length}
            </button>
            {specialGroups.map((group) => (
              <button
                className={`chip-vencida rounded-full px-3 py-1.5 text-xs font-semibold transition ${openStatus === group.code ? 'ring-2 ring-amber/40' : ''}`}
                key={group.code}
                onClick={() => setOpenStatus(openStatus === group.code ? null : group.code)}
                type="button"
              >
                {group.label} · {group.cards.length}
              </button>
            ))}
          </div>

          {openStatus ? (
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {(openStatus === 'BORRADOR' ? borradorCards
                : openStatus === 'VENCIDA' ? vencidaCards
                : specialGroups.find((g) => g.code === openStatus)?.cards ?? []
              ).length === 0 ? (
                <p className="text-sm text-ink-soft">Sin cotizaciones en este estatus.</p>
              ) : (
                (openStatus === 'BORRADOR' ? borradorCards
                  : openStatus === 'VENCIDA' ? vencidaCards
                  : specialGroups.find((g) => g.code === openStatus)?.cards ?? []
                ).map((card) => <CardItem card={card} key={card.id} />)
              )}
            </div>
          ) : null}
        </section>
      </div>
    </AppShell>
  );
}
