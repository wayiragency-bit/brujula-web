'use client';

import { AppShell } from '@/components/app-shell';
import { QuoteBuilder } from '@/components/quotes/quote-builder';

export default function NewQuotePage() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-content space-y-6 px-4 pb-28 pt-7 sm:px-6 lg:px-8 lg:pb-10">
        <QuoteBuilder />
      </div>
    </AppShell>
  );
}
