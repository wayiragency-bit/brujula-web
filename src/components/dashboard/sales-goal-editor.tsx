'use client';

import { Plus, Trophy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useUpdateAgency } from '@/hooks/use-agency';
import { formatMoneyFull } from '@/lib/format';

interface SalesGoalEditorProps {
  goal: number;
  currency: string;
  canEdit: boolean;
}

export function SalesGoalEditor({ goal, currency, canEdit }: SalesGoalEditorProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(String(goal));
  const containerRef = useRef<HTMLDivElement>(null);
  const updateAgency = useUpdateAgency();

  function toggle() {
    setOpen((wasOpen) => {
      if (!wasOpen) setValue(String(goal));
      return !wasOpen;
    });
  }

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  async function save() {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return;
    await updateAgency.mutateAsync({ monthlySalesGoal: parsed });
    setOpen(false);
  }

  if (!canEdit) {
    return (
      <span
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
        style={{ background: 'rgba(139,92,246,0.12)', color: '#a855f7' }}
      >
        META: {formatMoneyFull(goal, currency)}
      </span>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition hover:brightness-110"
        onClick={toggle}
        style={{ background: 'rgba(139,92,246,0.12)', color: '#a855f7' }}
        type="button"
      >
        META: {formatMoneyFull(goal, currency)} <Plus className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-20 mt-2 w-64 rounded-xl p-3"
          style={{ background: 'var(--paper-card)', border: '1px solid var(--border)', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)' }}
        >
          <label className="label-caps mb-1.5 block text-ink-soft" htmlFor="monthly-goal-input">Nueva Meta Mensual</label>
          <div className="flex items-center gap-2">
            <input
              className="h-10 w-full rounded-lg px-3 text-sm text-ink focus:outline-none focus:ring-1 focus:ring-amber/30"
              id="monthly-goal-input"
              inputMode="decimal"
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void save(); }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              type="number"
              value={value}
            />
            <button
              aria-label="Guardar meta"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white transition disabled:opacity-50"
              disabled={updateAgency.isPending}
              onClick={() => void save()}
              style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}
              type="button"
            >
              <Trophy className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
