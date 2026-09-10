'use client';

import { ChevronLeft, ChevronRight, Download, Plus, Search, SquarePen, Trash2, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { ClientFormModal } from '@/components/clients/client-form-modal';
import { useClients, useCreateClient, useDeactivateClient, useUpdateClient } from '@/hooks/use-clients';
import { API_BASE, getAccessToken } from '@/lib/api';
import { countryLabel } from '@/lib/countries';
import type { Client, ClientFormValues } from '@/lib/types';

const PAGE_SIZE = 10;

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

async function downloadExport() {
  const res = await fetch(`${API_BASE}/clients/export`, {
    headers: { Authorization: `Bearer ${getAccessToken() ?? ''}` },
    credentials: 'include',
  });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'clientes.csv';
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState<'ALL' | 'DIRECT' | 'AGENCY'>('ALL');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounced(search, 350);

  const { data, isLoading, isFetching } = useClients({
    q: debouncedSearch || undefined,
    type: type === 'ALL' ? undefined : type,
    page,
    limit: PAGE_SIZE,
  });

  const createClient = useCreateClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const updateClient = useUpdateClient(editing?.id ?? 'none');
  const deactivateClient = useDeactivateClient();

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(client: Client) {
    setEditing(client);
    setModalOpen(true);
  }

  async function handleSubmit(values: ClientFormValues) {
    if (editing) {
      await updateClient.mutateAsync(values);
    } else {
      await createClient.mutateAsync(values);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-content space-y-6 px-4 pb-28 pt-7 sm:px-6 lg:px-8 lg:pb-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-ink">Cartera de Clientes</h1>
            <p className="mt-1 text-sm text-ink-soft">Gestiona tus relaciones comerciales y prospectos.</p>
          </div>
          <div className="flex gap-3">
            <button className="button-secondary inline-flex items-center gap-2" onClick={downloadExport} type="button">
              <Download className="h-4 w-4" /> Exportar
            </button>
            <button className="button-primary inline-flex items-center gap-2" onClick={openCreate} type="button">
              <Plus className="h-4 w-4" /> Nuevo Cliente
            </button>
          </div>
        </header>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft/60" />
            <input
              className="w-full rounded-lg border border-ink/15 bg-paper-card py-2.5 pl-9 pr-3 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar por nombre, ID, correo, teléfono…"
              value={search}
            />
          </div>
          <div className="flex gap-2">
            {(['ALL', 'DIRECT', 'AGENCY'] as const).map((option) => (
              <button
                className={`rounded-lg px-3 py-2 text-xs font-bold uppercase tracking-wide transition ${
                  type === option ? 'bg-teal text-paper' : 'bg-paper-card text-ink-soft hover:bg-ink/5'
                }`}
                key={option}
                onClick={() => { setType(option); setPage(1); }}
                type="button"
              >
                {option === 'ALL' ? 'Todos' : option === 'DIRECT' ? 'Directos' : 'Agencias'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-paper-card shadow-card">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-left">
                <th className="label-caps px-4 py-3 text-ink-soft">Cliente</th>
                <th className="label-caps px-4 py-3 text-ink-soft">Tipo</th>
                <th className="label-caps px-4 py-3 text-ink-soft">Ubicación</th>
                <th className="label-caps px-4 py-3 text-ink-soft">Vendedor</th>
                <th className="label-caps px-4 py-3 text-right text-ink-soft">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="px-4 py-8 text-center text-ink-soft" colSpan={5}>Cargando clientes…</td></tr>
              ) : data?.data.length === 0 ? (
                <tr><td className="px-4 py-8 text-center text-ink-soft" colSpan={5}>No se encontraron clientes.</td></tr>
              ) : (
                data?.data.map((client) => (
                  <tr className="border-b border-ink/5 last:border-0 hover:bg-ink/[0.02]" key={client.id}>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink">{client.name}</p>
                      <p className="font-mono text-xs text-ink-soft">{client.document || '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase ${
                        client.type === 'AGENCY' ? 'bg-amber/15 text-amber' : 'bg-teal/10 text-teal'
                      }`}>
                        {client.type === 'AGENCY' ? 'Agencia' : 'Directo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {[client.city, countryLabel(client.country)].filter(Boolean).join(', ') || '—'}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">{client.seller?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          aria-label="Ver perfil"
                          className="rounded-lg p-2 text-ink-soft transition hover:bg-ink/5 hover:text-teal"
                          href={`/clients/${client.id}`}
                        >
                          <UserRound className="h-4 w-4" />
                        </Link>
                        <button
                          aria-label="Editar"
                          className="rounded-lg p-2 text-ink-soft transition hover:bg-ink/5 hover:text-teal"
                          onClick={() => openEdit(client)}
                          type="button"
                        >
                          <SquarePen className="h-4 w-4" />
                        </button>
                        <button
                          aria-label="Desactivar"
                          className="rounded-lg p-2 text-ink-soft transition hover:bg-red-50 hover:text-red-600"
                          onClick={() => {
                            if (window.confirm(`¿Desactivar a ${client.name}? Podrás seguir viéndolo en el historial.`)) {
                              deactivateClient.mutate(client.id);
                            }
                          }}
                          type="button"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data && data.meta.totalPages > 1 ? (
          <div className="flex items-center justify-between text-sm text-ink-soft">
            <p>Total registrados: {data.meta.total} clientes</p>
            <div className="flex items-center gap-2">
              <button
                className="rounded-lg p-2 disabled:opacity-30"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                type="button"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-mono text-xs">Página {page} de {data.meta.totalPages}</span>
              <button
                className="rounded-lg p-2 disabled:opacity-30"
                disabled={page >= data.meta.totalPages || isFetching}
                onClick={() => setPage((p) => p + 1)}
                type="button"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : data ? (
          <p className="text-sm text-ink-soft">Total registrados: {data.meta.total} clientes</p>
        ) : null}
      </div>

      <ClientFormModal
        initial={editing ?? undefined}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        open={modalOpen}
      />
    </AppShell>
  );
}
