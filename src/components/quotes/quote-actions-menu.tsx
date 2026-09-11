'use client';

import { Download, Link2, Mail, MoreVertical, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { API_BASE } from '@/lib/api';
import { useResendQuoteEmail } from '@/hooks/use-quotes';
import type { Quote } from '@/lib/types';

interface QuoteActionsMenuProps {
  quote: Quote;
  onDelete: () => void;
}

export function QuoteActionsMenu({ quote, onDelete }: QuoteActionsMenuProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const resendEmail = useResendQuoteEmail();

  function open() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition({ top: rect.top - 8, left: rect.right });
    setCopied(false);
    resendEmail.reset();
  }

  function close() {
    setPosition(null);
  }

  useEffect(() => {
    if (!position) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') close();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [position]);

  async function handleCopyLink() {
    const url = `${window.location.origin}/q/${quote.publicId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
  }

  const feedback = copied ? 'Link copiado' : resendEmail.isSuccess ? 'Correo enviado' : resendEmail.isError ? 'No se pudo enviar' : null;

  return (
    <>
      <button
        aria-label="Acciones"
        className="rounded-lg p-1.5 text-ink-soft transition hover:bg-ink/5"
        onClick={() => (position ? close() : open())}
        ref={buttonRef}
        type="button"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {position && typeof document !== 'undefined'
        ? createPortal(
            <>
              <div className="fixed inset-0 z-40" onClick={close} />
              <div
                className="fixed z-50 flex -translate-x-full -translate-y-full flex-col items-end gap-1.5"
                style={{ top: position.top, left: position.left }}
              >
                {feedback ? (
                  <div className="whitespace-nowrap rounded-lg bg-ink px-2.5 py-1 text-[11px] font-semibold text-white">{feedback}</div>
                ) : null}
                <div className="flex items-center gap-1 rounded-xl border border-ink/10 bg-paper-card p-1.5 shadow-floating">
                  <a
                    aria-label="Descargar PDF"
                    className="rounded-lg p-1.5 text-ink-soft transition hover:bg-ink/5 hover:text-teal"
                    href={`${API_BASE}/public/quotes/${quote.publicId}/pdf`}
                    onClick={close}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  <button
                    aria-label="Enviar por correo"
                    className="rounded-lg p-1.5 text-ink-soft transition hover:bg-ink/5 hover:text-teal disabled:opacity-50"
                    disabled={resendEmail.isPending}
                    onClick={() => resendEmail.mutate(quote.id)}
                    type="button"
                  >
                    <Mail className="h-4 w-4" />
                  </button>
                  <button
                    aria-label="Copiar link"
                    className="rounded-lg p-1.5 text-ink-soft transition hover:bg-ink/5 hover:text-teal"
                    onClick={handleCopyLink}
                    type="button"
                  >
                    <Link2 className="h-4 w-4" />
                  </button>
                  <button
                    aria-label="Eliminar"
                    className="rounded-lg p-1.5 text-ink-soft transition hover:bg-red-50 hover:text-red-600"
                    onClick={() => { close(); onDelete(); }}
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>,
            document.body,
          )
        : null}
    </>
  );
}
