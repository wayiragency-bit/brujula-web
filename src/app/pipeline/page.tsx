'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle, BadgeCheck, BarChart3, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight,
  FileEdit, History, Send, Wallet, X, XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { PipelineHistoryView } from '@/components/pipeline/history-view';
import { usePipelineCalendar, usePipelineKanban } from '@/hooks/use-pipeline';
import { api } from '@/lib/api';
import type { PipelineCard, QuoteStatus } from '@/lib/types';

const STATUS_LABELS: Record<QuoteStatus, string> = {
  BORRADOR: 'Borrador', ENVIADA: 'Enviada', ACEPTADA: 'Aceptada', ABONADA: 'Abonada',
  PAGADA: 'Pagada', RECHAZADA: 'Rechazada', VENCIDA: 'Vencida',
};

const STATUS_COLORS: Record<QuoteStatus, { dot: string; badge: string; text: string }> = {
  BORRADOR:  { dot: '#94a3b8', badge: 'rgba(148,163,184,0.15)', text: '#94a3b8' },
  ENVIADA:   { dot: '#3b82f6', badge: 'rgba(59,130,246,0.15)',  text: '#3b82f6' },
  ACEPTADA:  { dot: '#10b981', badge: 'rgba(16,185,129,0.15)',  text: '#10b981' },
  ABONADA:   { dot: '#0ea5e9', badge: 'rgba(14,165,233,0.15)',  text: '#0ea5e9' },
  PAGADA:    { dot: '#06b6d4', badge: 'rgba(6,182,212,0.15)',   text: '#06b6d4' },
  RECHAZADA: { dot: '#ef4444', badge: 'rgba(239,68,68,0.15)',   text: '#ef4444' },
  VENCIDA:   { dot: '#f59e0b', badge: 'rgba(245,158,11,0.15)',  text: '#f59e0b' },
};

const STATUS_ICONS: Record<QuoteStatus, React.ElementType> = {
  BORRADOR: FileEdit, ENVIADA: Send, ACEPTADA: CheckCircle2, ABONADA: Wallet,
  PAGADA: BadgeCheck, RECHAZADA: XCircle, VENCIDA: AlertTriangle,
};

function ColumnHeader({ status, count }: { status: QuoteStatus; count: number }) {
  const sc = STATUS_COLORS[status];
  const Icon = STATUS_ICONS[status];
  return (
    <div
      className="flex items-center justify-between rounded-t-2xl px-3 py-2.5"
      style={{ background: sc.badge, borderBottom: `4px solid ${sc.dot}` }}
    >
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 shrink-0" style={{ color: sc.dot }} />
        <h3 className="text-sm font-bold uppercase tracking-wide" style={{ color: 'var(--ink)' }}>{STATUS_LABELS[status]}</h3>
      </div>
      <span
        className="flex h-5 min-w-[22px] shrink-0 items-center justify-center rounded-full px-2 text-xs font-bold"
        style={{ background: 'var(--paper-card)', color: 'var(--ink-soft)' }}
      >
        {count}
      </span>
    </div>
  );
}

function clientInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '?';
}

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${day}.${month}.${d.getUTCFullYear()}`;
}

function formatMoney(value: string, currency: string): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(value));
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
    mutationFn: ({ id, version, amount }: { id: string; version: number; amount: string }) => {
      const idempotencyKey = `pay-${id}-${Date.now()}`;
      return api.post(`/quotes/${id}/payments`, { version, amount, idempotencyKey });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pipeline'] }),
  });
}

const MAIN_STATUSES: QuoteStatus[] = ['ENVIADA', 'ACEPTADA', 'ABONADA', 'PAGADA', 'RECHAZADA'];

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
  const clientName = card.client?.name ?? 'Sin cliente';
  const agentName  = (card as unknown as { agent?: { name: string } }).agent?.name;
  const sc         = STATUS_COLORS[card.status];

  return (
    <Link
      className="relative block cursor-grab overflow-hidden rounded-xl p-4 transition hover:-translate-y-0.5 active:cursor-grabbing"
      style={{ background: 'var(--paper-card)', border: '1px solid var(--border-faint)' }}
      draggable
      href={`/quotes/${card.id}`}
      onDragStart={(e) => { e.dataTransfer.setData('text/plain', card.id); onDragStart(card); }}
    >
      {/* Colored left stripe */}
      <span className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: sc.dot }} />

      {/* Quote number + issue date */}
      <div className="flex items-center justify-between gap-1 pl-2">
        <p className="text-[11px] font-bold" style={{ color: sc.text }}>{card.number}</p>
        <span className="text-[10px] font-medium" style={{ color: 'var(--ink-muted)' }}>
          Emisión {formatShortDate(card.createdAt)}
        </span>
      </div>

      {/* Reservation date — the one advisors need to track */}
      {card.startDate && (
        <div className="mt-1 flex items-center gap-1 pl-2">
          <CalendarDays className="h-3 w-3 shrink-0" style={{ color: 'var(--ink-soft)' }} />
          <span className="text-[11px] font-bold" style={{ color: 'var(--ink)' }}>
            Reserva {formatShortDate(card.startDate)}
          </span>
        </div>
      )}

      {/* Client row */}
      <div className="mt-2 flex items-center gap-2 pl-2">
        <div
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
          style={{ background: 'var(--paper-elevated)', color: 'var(--ink-soft)' }}
        >
          {clientInitials(clientName).charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold leading-tight" style={{ color: 'var(--ink)' }}>{clientName}</p>
          {agentName && <p className="truncate text-[10px] font-medium leading-tight" style={{ color: 'var(--ink-soft)' }}>{agentName}</p>}
        </div>
      </div>

      {/* Destination */}
      {card.destination && <p className="mt-1 truncate pl-2 text-[10px]" style={{ color: 'var(--ink-muted)' }}>{card.destination}</p>}

      {/* Amount */}
      <p className="mt-2 pl-2 text-[11px] font-semibold" style={{ color: 'var(--ink-soft)' }}>{formatMoney(card.total, card.currency)}</p>
    </Link>
  );
}

function SidePanel({
  status, label, totalLabel, cards, onClose,
}: { status: QuoteStatus; label: string; totalLabel: string; cards: PipelineCard[]; onClose: () => void }) {
  const total    = cards.reduce((sum, c) => sum + Number(c.total), 0);
  const currency = cards[0]?.currency ?? 'COP';
  const sc       = STATUS_COLORS[status];
  const Icon     = STATUS_ICONS[status];
  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="flex-1" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />
      <div
        className="flex h-full w-full max-w-sm flex-col overflow-hidden"
        style={{ background: 'var(--paper-card)', borderLeft: '1px solid var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ background: sc.badge, borderBottom: `4px solid ${sc.dot}` }}>
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 shrink-0" style={{ color: sc.dot }} />
            <h3 className="text-sm font-bold uppercase tracking-wide" style={{ color: 'var(--ink)' }}>{label}</h3>
            <span
              className="flex h-5 min-w-[22px] items-center justify-center rounded-full px-2 text-xs font-bold"
              style={{ background: 'var(--paper-card)', color: 'var(--ink-soft)' }}
            >
              {cards.length}
            </span>
          </div>
          <button
            aria-label="Cerrar"
            className="rounded-lg p-1.5 transition hover:bg-black/10"
            onClick={onClose}
            style={{ color: 'var(--ink-soft)' }}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {/* Cards list */}
        <div className="flex-1 overflow-y-auto space-y-2 p-3">
          {cards.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-muted">Sin cotizaciones</p>
          ) : (
            cards.map((card) => <KanbanCard card={card} key={card.id} onDragStart={() => {}} />)
          )}
        </div>
        {/* Total */}
        <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
          <p className="label-caps text-ink-muted">{totalLabel}</p>
          <p className="font-mono text-sm font-bold text-ink">{formatMoney(String(total), currency)}</p>
        </div>
      </div>
    </div>
  );
}

function KanbanBoard() {
  const { data, isLoading } = usePipelineKanban();
  const changeStatus   = useChangeStatusMutation();
  const recordPayment  = useRecordPaymentMutation();
  const [dragging, setDragging]             = useState<PipelineCard | null>(null);
  const [error, setError]                   = useState<string | null>(null);
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

  const mainColumns   = (data?.data ?? []).filter((c) => MAIN_STATUSES.includes(c.status));
  const vencidasCards = data?.data.find((c) => c.status === 'VENCIDA')?.cards ?? [];

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

      <div className="grid grid-cols-5 gap-4">
        {mainColumns.map((column) => {
          const total    = column.cards.reduce((sum, c) => sum + Number(c.total), 0);
          const currency = column.cards[0]?.currency ?? 'COP';
          return (
            <div className="flex min-w-0 flex-col" key={column.status}>
              <div
                className="flex flex-1 flex-col overflow-hidden rounded-2xl"
                style={{ border: '1px solid var(--border-faint)' }}
              >
                <ColumnHeader count={column.cards.length} status={column.status} />

                {/* Cards area */}
                <div
                  className="flex flex-1 flex-col gap-2 p-2 min-h-[200px]"
                  style={{ background: 'var(--paper)' }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDrop(column.status)}
                >
                  {column.cards.length === 0 ? (
                    <p className="rounded-lg border border-dashed py-6 text-center text-xs text-ink-muted" style={{ borderColor: 'var(--border)' }}>Arrastra aquí</p>
                  ) : (
                    column.cards.map((card) => <KanbanCard card={card} key={card.id} onDragStart={setDragging} />)
                  )}
                </div>
              </div>

              {/* Column total — floats below the card, no box */}
              <p className="mt-2.5 px-1 font-mono text-base font-bold text-ink">{formatMoney(String(total), currency)}</p>
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
  const [view, setView]                 = useState<'kanban' | 'calendar' | 'history'>('kanban');
  const [showVencidas, setShowVencidas] = useState(false);
  const [showBorrador, setShowBorrador] = useState(false);
  const { data: pipelineData }          = usePipelineKanban();
  const vencidasCards = pipelineData?.data.find((c) => c.status === 'VENCIDA')?.cards  ?? [];
  const borradorCards = pipelineData?.data.find((c) => c.status === 'BORRADOR')?.cards ?? [];
  const scV = STATUS_COLORS['VENCIDA'];
  const scB = STATUS_COLORS['BORRADOR'];

  return (
    <AppShell>
      <div className="w-full space-y-5 px-4 pb-28 pt-7 lg:pl-6 lg:pr-10 lg:pb-10">
        {showVencidas && (
          <SidePanel
            cards={vencidasCards}
            label="Vencidas"
            onClose={() => setShowVencidas(false)}
            status="VENCIDA"
            totalLabel="Total vencidas"
          />
        )}
        {showBorrador && (
          <SidePanel
            cards={borradorCards}
            label="Borrador"
            onClose={() => setShowBorrador(false)}
            status="BORRADOR"
            totalLabel="Total en borrador"
          />
        )}

        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-ink">Estatus de Cotización</h1>
            <p className="mt-1 text-base text-ink-soft">Visualización estructurada del flujo y Seguimiento detallado.</p>
          </div>
          <div className="flex gap-1 rounded-xl p-1" style={{ border: '1px solid var(--border)' }}>
            <button
              className="inline-flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-medium transition"
              style={view === 'kanban'
                ? { background: 'var(--teal)', color: '#ffffff' }
                : { background: 'transparent', color: '#94a3b8' }}
              onClick={() => setView('kanban')}
              type="button"
            >
              <BarChart3 size={18} />
              Tablero
            </button>
            <button
              className="inline-flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-medium transition"
              style={view === 'calendar'
                ? { background: 'var(--teal)', color: '#ffffff' }
                : { background: 'transparent', color: '#94a3b8' }}
              onClick={() => setView('calendar')}
              type="button"
            >
              <CalendarDays size={18} />
              Calendario
            </button>
            <button
              className="inline-flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-medium transition"
              style={view === 'history'
                ? { background: 'var(--teal)', color: '#ffffff' }
                : { background: 'transparent', color: '#94a3b8' }}
              onClick={() => setView('history')}
              type="button"
            >
              <History size={18} />
              Histórico
            </button>
          </div>
        </header>

        {/* Secondary toolbar — hidden statuses */}
        {view !== 'history' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowBorrador(true)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition hover:brightness-110"
              style={{ background: scB.badge, color: scB.text, border: `1px solid ${scB.dot}40` }}
            >
              <STATUS_ICONS.BORRADOR className="h-3.5 w-3.5" />
              Borrador
              {borradorCards.length > 0 && (
                <span className="ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold" style={{ background: scB.dot + '33', color: scB.text }}>
                  {borradorCards.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowVencidas(true)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition hover:brightness-110"
              style={{ background: scV.badge, color: scV.text, border: `1px solid ${scV.dot}40` }}
            >
              <STATUS_ICONS.VENCIDA className="h-3.5 w-3.5" />
              Vencidas
              {vencidasCards.length > 0 && (
                <span className="ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold" style={{ background: scV.dot + '33', color: scV.text }}>
                  {vencidasCards.length}
                </span>
              )}
            </button>
          </div>
        )}

        {view === 'kanban' ? <KanbanBoard /> : view === 'calendar' ? <CalendarView /> : <PipelineHistoryView />}
      </div>
    </AppShell>
  );
}
