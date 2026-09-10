'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  wide?: boolean;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, subtitle, wide, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 py-10 backdrop-blur-sm"
    >
      <div
        className={`w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} rounded-2xl bg-paper-card p-6 shadow-floating sm:p-8`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-extrabold text-ink">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm text-ink-soft">{subtitle}</p> : null}
          </div>
          <button
            aria-label="Cerrar"
            className="rounded-lg p-1 text-ink-soft transition hover:bg-ink/5"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
