'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { usePipelineCalendar, usePipelineKanban } from '@/hooks/use-pipeline';
import { api } from '@/lib/api';
import type { PipelineCard, QuoteStatus } from '@/lib/types';

const STATUS_LABELS: Record<QuoteStatus, string> = {
  BORRADOR: 'Borrador', ENVIADA: 'Enviada', ACEPTADA: 'Aceptada', ABONADA: 'Abonada',
  PAGADA: 'Pagada', RECHAZADA: 'Rechazada', VENCIDA: 'Vencida',
};

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function formatMoney(value: string, currency: string): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency, notation: 'compact', maximumFractionDigits: 1 }).format(Number(value));
}

function useChangeStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version, status }: { id: string; version: number; status: QuoteStatus }) =>
      api.post(`/quotes/${id}/status`, { version, status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pipeline'] }),
  });
}

function useRecordPaymentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, version, amount }: { id: string; version: number; amount: string }) =>
      api.post(`/quotes/${id}/payments`, { version, amount }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pipeline'] }),
  });
}

type PaymentPending = { card: PipelineCard; prefill: string };

function PaymentModal({
  pending, onClose, onConfirm, loading,
}: {
  pending: PaymentPending;
  onClose: () => void;
  onConfirm: (amount: string) => void;
  loading: boolean;
}) {
  const [amount, setAmount] = useState(pending.prefill);
  const isToPayada = pending.prefill === pending.card.balanceDue;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 space-y-4"
        style={{ background: 'var(--paper-card)', border: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <p className="label-caps text-ink-muted">Registrar pago</p>
          <h3 className="font-display text-lg font-extrabold text-ink mt-1">{pending.card.number} · {pending.card.client?.name ?? '—'}</h3>
          <p className="text-xs text-ink-soft mt-0.5">
            {isToPayada ? 'Saldo pendiente completo — quedará como PAGADA.' : 'Monto del anticipo — quedará como ABONADA.'}
          </p>
        </div>
        <div>
          <label className="label-caps text-ink-soft block mb-1">Monto ({pending.card.currency})</label>
          <input
            autoFocus
            className="h-10 w-full rounded-lg px-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-amber/50"
            inputMode="decimal"
            onChange={(e) => setAmount(e.target.value)}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            type="text"
            value={amount}
          />
        </div>
        <div className="flex gap-2 justify-end">
          <button className="button-secondary" onClick={onClose} type="button">Cancelar</button>
          <button
            className="button-primary"
            disabled={loading || !amount || Number(amount) <= 0}
            onClick={() => onConfirm(amount)}
            type="button"
          >
            {loading ? 'Guardando…' : 'Confirmar Pago'}
          </button>
        </div>
      </div>
    </div>
  );
}

function KanbanCard({ card, onDragStart }: { card: PipelineCard; onDragStart: (card: PipelineCard) => void }) {
  return (
    <Link
      className="block cursor-grab rounded-xl border border-ink/10 bg-paper p-3 shadow-card transition hover:-translate-y-0.5 active:cursor-grabbing"
      draggable
      href={`/quotes/${card.id}`}
      onDragStart={(e) => { e.dataTransfer.setData('text/plain', card.id); onDragStart(card); }}
    >
      <p className="font-mono text-[11px] font-bold text-teal">{card.number}</p>
      <p className="truncate text-sm font-semibold text-ink">{card.client?.name ?? 'Sin cliente'}</p>
      <p className="truncate text-xs text-ink-soft">{card.destination}</p>
      <p className="mt-2 font-mono text-sm font-bold text-ink">{formatMoney(card.total, card.currency)}</p>
    </Link>
  );
}

function KanbanBoard() {
  const { data, isLoading } = usePipelineKanban();
  const changeStatus   = useChangeStatusMutation();
  const recordPayment  = useRecordPaymentMutation();
  const [dragging, setDragging]         = useState<PipelineCard | null>(null);
  const [error, setError]               = useState<string | null>(null);
  const [paymentPending, setPaymentPending] = useState<PaymentPending | null>(null);

  const PAYMENT_TARGETS = new Set<QuoteStatus>(['ABONADA', 'PAGADA']);

  function handleDrop(status: QuoteStatus) {
    if (!dragging) return;
    if (dragging.status === status) { setDragging(null); return; }

    // Financial transitions go through the payment endpoint
    if (PAYMENT_TARGETS.has(status) && dragging.canRecordPayment) {
      const prefill = status === 'PAGADA' ? dragging.balanceDue : '';
      setPaymentPending({ card: dragging, prefill });
      setDragging(null);
      return;
    }

    if (!dragging.availableTransitions.includes(status)) {
      setError(`No se puede mover ${dragging.number} de ${STATUS_LABELS[dragging.status]} a ${STATUS_LABELS[status]}.`);
      setDragging(null);
      return;
    }
    changeStatus.mutate({ id: dragging.id, version: dragging.version, status });
    setDragging(null);
  }

  function handlePaymentConfirm(amount: string) {
    if (!paymentPending) return;
    recordPayment.mutate(
      { id: paymentPending.card.id, version: paymentPending.card.version, amount },
      { onSuccess: () => setPaymentPending(null), onError: (e) => { setError(e instanceof Error ? e.message : 'Error al registrar pago'); setPaymentPending(null); } },
    );
  }

  if (isLoading) return <p className="text-ink-soft">Cargando pipeline…</p>;

  return (
    <div>
      {paymentPending && (
        <PaymentModal
          loading={recordPayment.isPending}
          onClose={() => setPaymentPending(null)}
          onConfirm={handlePaymentConfirm}
          pending={paymentPending}
        />
      )}
      {error ? <p className="mb-3 rounded-lg px-4 py-2 text-sm text-red-400" style={{ background: 'rgba(248,113,113,0.10)' }} onClick={() => setError(null)}>{error} ✕</p> : null}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {data?.data.map((column) => {
          const total = column.cards.reduce((sum, c) => sum + Number(c.total), 0);
          const currency = column.cards[0]?.currency ?? 'COP';
          return (
            <div
              className="flex w-72 shrink-0 flex-col gap-3 rounded-2xl border border-ink/10 bg-paper-card p-4"
              key={column.status}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(column.status)}
            >
              <div className="flex items-center justify-between">
                <h3 className="label-caps text-ink-soft">{STATUS_LABELS[column.status]}</h3>
                <span className="font-mono text-xs font-bold text-ink">{column.cards.length}</span>
              </div>
              <p className="font-mono text-xs text-ink-soft">{formatMoney(String(total), currency)}</p>
              <div className="flex min-h-[80px] flex-col gap-2">
                {column.cards.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-ink/15 py-6 text-center text-xs text-ink-soft">Arrastra aquí</p>
                ) : (
                  column.cards.map((card) => <KanbanCard card={card} key={card.id} onDragStart={setDragging} />)
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CalendarView() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const { data, isLoading } = usePipelineCalendar(month, year);

  const grid = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const leadingBlanks = firstDay.getDay();
    const cells: Array<number | null> = [...Array(leadingBlanks).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [month, year]);

  const cardsByDay = useMemo(() => {
    const map = new Map<number, PipelineCard[]>();
    data?.data.forEach((card) => {
      if (!card.startDate) return;
      const day = Number(card.startDate.slice(8, 10));
      map.set(day, [...(map.get(day) ?? []), card]);
    });
    return map;
  }, [data]);

  function shiftMonth(delta: number) {
    let m = month + delta;
    let y = year;
    if (m > 12) { m = 1; y += 1; }
    if (m < 1) { m = 12; y -= 1; }
    setMonth(m);
    setYear(y);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button className="rounded-lg p-2 hover:bg-ink/5" onClick={() => shiftMonth(-1)} type="button"><ChevronLeft className="h-5 w-5" /></button>
        <h3 className="font-display text-lg font-bold text-ink">{MONTH_NAMES[month - 1]} {year}</h3>
        <button className="rounded-lg p-2 hover:bg-ink/5" onClick={() => shiftMonth(1)} type="button"><ChevronRight className="h-5 w-5" /></button>
      </div>
      {isLoading ? (
        <p className="text-ink-soft">Cargando calendario…</p>
      ) : (
        <div className="grid grid-cols-7 gap-1.5 text-xs">
          {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((d) => (
            <div className="label-caps py-1 text-center text-ink-soft" key={d}>{d}</div>
          ))}
          {grid.map((day, index) => (
            <div className={`min-h-[76px] rounded-lg border p-1.5 ${day ? 'border-ink/10 bg-paper-card' : 'border-transparent'}`} key={index}>
              {day ? (
                <>
                  <p className="font-mono text-[11px] text-ink-soft">{day}</p>
                  <div className="mt-1 space-y-1">
                    {(cardsByDay.get(day) ?? []).slice(0, 2).map((card) => (
                      <Link className="block truncate rounded bg-teal/10 px-1 py-0.5 text-[10px] font-semibold text-teal" href={`/quotes/${card.id}`} key={card.id}>
                        {card.client?.name ?? card.number}
                      </Link>
                    ))}
                    {(cardsByDay.get(day) ?? []).length > 2 ? (
                      <p className="text-[10px] text-ink-soft">+{(cardsByDay.get(day) ?? []).length - 2} más</p>
                    ) : null}
                  </div>
                </>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PipelinePage() {
  const [view, setView] = useState<'kanban' | 'calendar'>('kanban');

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-content space-y-6 px-4 pb-28 pt-7 sm:px-6 lg:px-8 lg:pb-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-ink">Estatus de Cotización</h1>
            <p className="mt-1 text-sm text-ink-soft">Visualización estructurada del flujo y seguimiento detallado.</p>
          </div>
          <div className="flex gap-2">
            <button className={`rounded-lg px-3 py-2 text-xs font-bold uppercase transition ${view === 'kanban' ? 'bg-teal text-paper' : 'bg-paper-card text-ink-soft'}`} onClick={() => setView('kanban')} type="button">Tablero</button>
            <button className={`rounded-lg px-3 py-2 text-xs font-bold uppercase transition ${view === 'calendar' ? 'bg-teal text-paper' : 'bg-paper-card text-ink-soft'}`} onClick={() => setView('calendar')} type="button">Calendario</button>
          </div>
        </header>

        {view === 'kanban' ? <KanbanBoard /> : <CalendarView />}
      </div>
    </AppShell>
  );
}
