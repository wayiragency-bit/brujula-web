'use client';

import { Plus, SquarePen, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { SupplierFormModal } from '@/components/suppliers/supplier-form-modal';
import { useCreateSupplier, useDeactivateSupplier, useSuppliers, useUpdateSupplier } from '@/hooks/use-suppliers';
import type { Supplier, SupplierFormValues } from '@/lib/types';

function formatPercent(value: number | string): string {
  return `${Number(Number(value).toFixed(2))}%`;
}

export default function SuppliersPage() {
  const { data, isLoading } = useSuppliers();
  const createSupplier = useCreateSupplier();
  const deactivateSupplier = useDeactivateSupplier();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const updateSupplier = useUpdateSupplier(editing?.id ?? 'none');

  function openCreate() {
    setEditing(null);
    setModalKey((k) => k + 1);
    setModalOpen(true);
  }

  function openEdit(supplier: Supplier) {
    setEditing(supplier);
    setModalKey((k) => k + 1);
    setModalOpen(true);
  }

  async function handleSubmit(values: SupplierFormValues) {
    if (editing) await updateSupplier.mutateAsync(values);
    else await createSupplier.mutateAsync(values);
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-content space-y-6 px-4 pb-28 pt-7 sm:px-6 lg:px-8 lg:pb-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-ink">Directorio de Proveedores</h1>
            <p className="mt-1 text-sm text-ink-soft">Gestiona los dueños de productos y servicios y su comisión.</p>
          </div>
          <button className="button-primary inline-flex items-center gap-2" onClick={openCreate} type="button">
            <Plus className="h-4 w-4" /> Nuevo Proveedor
          </button>
        </header>

        <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-paper-card shadow-card">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-ink/10 text-left">
                <th className="label-caps px-4 py-3 text-ink-soft">Proveedor</th>
                <th className="label-caps px-4 py-3 text-ink-soft">Contacto</th>
                <th className="label-caps px-4 py-3 text-right text-ink-soft">Productos</th>
                <th className="label-caps px-4 py-3 text-right text-ink-soft">Comisión</th>
                <th className="label-caps px-4 py-3 text-right text-ink-soft">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td className="px-4 py-8 text-center text-ink-soft" colSpan={5}>Cargando proveedores…</td></tr>
              ) : data?.data.length === 0 ? (
                <tr><td className="px-4 py-8 text-center text-ink-soft" colSpan={5}>Aún no registras proveedores.</td></tr>
              ) : (
                data?.data.map((supplier) => (
                  <tr className="border-b border-ink/5 last:border-0 hover:bg-ink/[0.02]" key={supplier.id}>
                    <td className="px-4 py-3 font-semibold text-ink">{supplier.name}</td>
                    <td className="px-4 py-3 text-ink-soft">
                      <p>{supplier.contact || '—'}</p>
                      <p className="text-xs">{supplier.email || supplier.phone || ''}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-ink">{supplier.productsCount}</td>
                    <td className="px-4 py-3 text-right font-mono text-ink">{formatPercent(supplier.commissionPct)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button aria-label="Editar" className="rounded-lg p-2 text-ink-soft transition hover:bg-ink/5 hover:text-teal" onClick={() => openEdit(supplier)} type="button">
                          <SquarePen className="h-4 w-4" />
                        </button>
                        <button
                          aria-label="Desactivar"
                          className="rounded-lg p-2 text-ink-soft transition hover:bg-red-50 hover:text-red-600"
                          onClick={() => {
                            if (window.confirm(`¿Desactivar a ${supplier.name}?`)) deactivateSupplier.mutate(supplier.id);
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
        {data ? <p className="text-sm text-ink-soft">Total registrados: {data.meta.total} proveedores</p> : null}
      </div>

      <SupplierFormModal key={modalKey} initial={editing ?? undefined} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} open={modalOpen} />
    </AppShell>
  );
}
