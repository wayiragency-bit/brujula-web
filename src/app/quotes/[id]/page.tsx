'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';
import { AppShell } from '@/components/app-shell';
import { QuoteBuilder } from '@/components/quotes/quote-builder';
import { useQuote } from '@/hooks/use-quotes';

export default function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: quote, isLoading } = useQuote(id);

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-content space-y-6 px-4 pb-28 pt-7 sm:px-6 lg:px-8 lg:pb-10">
        <Link className="inline-flex items-center gap-2 text-sm font-semibold text-teal hover:underline" href="/quotes">
          <ArrowLeft className="h-4 w-4" /> Volver
        </Link>
        {isLoading || !quote ? <p className="text-ink-soft">Cargando cotización…</p> : <QuoteBuilder initial={quote} />}
      </div>
    </AppShell>
  );
}
