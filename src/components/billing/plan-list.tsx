'use client';

import { Check, Sparkles } from 'lucide-react';
import type { Plan } from '@/lib/types';

export function formatPlanPrice(price: string, currency: string): string {
  const value = Number(price);
  return `${currency} $${Number.isInteger(value) ? value : value.toFixed(2)}`;
}

interface PlanListProps {
  plans: Plan[];
  selectedPlanId?: string | null;
  onSelect?: (planId: string) => void;
}

/** Shared plan-picker UI — used by /register (step 2) and the trial-expired screen, so the catalog is never rendered twice. */
export function PlanList({ plans, selectedPlanId, onSelect }: PlanListProps) {
  return (
    <div className="space-y-3">
      {plans.map((plan) => {
        const selected = plan.id === selectedPlanId;
        return (
          <button
            className="w-full rounded-xl p-4 text-left transition-all disabled:cursor-default"
            disabled={!onSelect}
            key={plan.id}
            onClick={() => onSelect?.(plan.id)}
            style={{
              background: selected ? 'rgba(254,178,59,0.08)' : 'var(--surface)',
              border: selected ? '1.5px solid var(--amber)' : '1px solid var(--border)',
            }}
            type="button"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-display text-sm font-extrabold text-ink">{plan.name}</span>
                {plan.recommended ? (
                  <span className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-amber" style={{ background: 'rgba(254,178,59,0.15)' }}>
                    <Sparkles className="h-2.5 w-2.5" /> Recomendado
                  </span>
                ) : null}
              </div>
              <span className="font-mono text-sm font-bold text-ink">
                {formatPlanPrice(plan.price, plan.currency)}<span className="text-xs font-normal text-ink-soft">/mes</span>
              </span>
            </div>
            {plan.description ? <p className="mt-1 text-xs text-ink-soft">{plan.description}</p> : null}
            {plan.features?.length ? (
              <ul className="mt-2 space-y-1">
                {plan.features.map((feature) => (
                  <li className="flex items-center gap-1.5 text-xs text-ink-soft" key={feature}>
                    <Check className="h-3 w-3 shrink-0 text-teal" /> {feature}
                  </li>
                ))}
              </ul>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
