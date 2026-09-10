'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PagerProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pager({ page, totalPages, onChange }: PagerProps) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center gap-1.5">
      <button
        aria-label="Página anterior"
        className="flex h-6 w-6 items-center justify-center rounded-md text-ink-soft transition hover:bg-white/8 disabled:opacity-30"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        type="button"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>
      <span className="label-caps min-w-[2.5rem] text-center text-ink-muted">{page}/{totalPages}</span>
      <button
        aria-label="Página siguiente"
        className="flex h-6 w-6 items-center justify-center rounded-md text-ink-soft transition hover:bg-white/8 disabled:opacity-30"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        type="button"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
