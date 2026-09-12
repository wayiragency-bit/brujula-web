'use client';

import { Search } from 'lucide-react';
import { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { Pager } from '@/components/dashboard/pager';
import { useManagerClients } from '@/hooks/use-manager';

export default function ManagerClientsPage() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const { data } = useManagerClients({ q: q || undefined, page, limit: 12 });

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-content space-y-6 px-5 pb-28 pt-8 sm:px-7 lg:px-10 lg:pb-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">Clientes</h1>
            <p className="mt-2 text-sm text-ink-soft">Clientes de todas las agencias On Vacation.</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input
              className="h-10 w-full rounded-xl pl-9 pr-3 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-1 focus:ring-amber/30"
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="Buscar cliente…"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              type="search"
              value={q}
            />
          </div>
        </header>

        <article className="overflow-hidden rounded-2xl" style={{ background: 'var(--paper-card)', border: '1px solid var(--border)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-faint)' }}>
                  <th className="label-caps px-6 py-3 text-ink-muted">Cliente</th>
                  <th className="label-caps px-6 py-3 text-ink-muted">Agencia</th>
                  <th className="label-caps px-6 py-3 text-ink-muted">Vendedor</th>
                  <th className="label-caps px-6 py-3 text-ink-muted">Contacto</th>
                  <th className="label-caps px-6 py-3 text-ink-muted">Ciudad</th>
                  <th className="label-caps px-6 py-3 text-ink-muted">Registrado</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ '--tw-divide-opacity': 1 } as React.CSSProperties}>
                {(data?.data.length ?? 0) === 0 ? (
                  <tr><td className="px-6 py-10 text-center text-ink-soft" colSpan={6}>No se encontraron clientes.</td></tr>
                ) : (
                  data!.data.map((client) => (
                    <tr key={client.id}>
                      <td className="px-6 py-4 font-medium text-ink">{client.name}</td>
                      <td className="px-6 py-4 text-ink">{client.agency.name}</td>
                      <td className="px-6 py-4 text-ink-soft">{client.seller?.name ?? '—'}</td>
                      <td className="px-6 py-4 text-ink-soft">{client.phone}</td>
                      <td className="px-6 py-4 text-ink-soft">{client.city ?? '—'}</td>
                      <td className="px-6 py-4 text-ink-soft">{new Date(client.createdAt).toLocaleDateString('es-CO')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: '1px solid var(--border-faint)' }}>
            <span className="label-caps text-ink-muted">{data?.meta.total ?? 0} clientes</span>
            <Pager onChange={setPage} page={page} totalPages={data?.meta.totalPages ?? 1} />
          </div>
        </article>
      </div>
    </AppShell>
  );
}
