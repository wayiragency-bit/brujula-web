'use client';

import { ChevronLeft, ChevronRight, Plus, Search, SquarePen, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { ProductFormModal } from '@/components/products/product-form-modal';
import { useCreateProduct, useDeactivateProduct, useProducts, useUpdateProduct } from '@/hooks/use-products';
import type { Product, ProductFormValues } from '@/lib/types';

const PAGE_SIZE = 12;

function formatMoney(value: number, currency: string): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
}

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useProducts({ q: search || undefined, page, limit: PAGE_SIZE, active: true });

  const createProduct = useCreateProduct();
  const deactivateProduct = useDeactivateProduct();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [editing, setEditing] = useState<Product | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);
  const updateProduct = useUpdateProduct(editing?.id ?? 'none');

  function openCreate() {
    setEditing(null);
    setModalKey((k) => k + 1);
    setModalOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setModalKey((k) => k + 1);
    setModalOpen(true);
  }

  async function handleSubmit(values: ProductFormValues) {
    if (editing) await updateProduct.mutateAsync(values);
    else await createProduct.mutateAsync(values);
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-content space-y-6 px-4 pb-28 pt-7 sm:px-6 lg:px-8 lg:pb-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-ink">Productos y Servicios</h1>
            <p className="mt-1 text-sm text-ink-soft">Administra tu inventario de hoteles, tours y transportes.</p>
          </div>
          <button className="button-primary inline-flex items-center gap-2" onClick={openCreate} type="button">
            <Plus className="h-4 w-4" /> Nuevo Producto
          </button>
        </header>

        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft/60" />
          <input
            className="w-full rounded-lg border border-ink/15 bg-paper-card py-2.5 pl-9 pr-3 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Buscar producto, categoría o proveedor…"
            value={search}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {isLoading ? (
            <p className="text-ink-soft">Cargando productos…</p>
          ) : data?.data.length === 0 ? (
            <p className="text-ink-soft">No se encontraron productos.</p>
          ) : (
            data?.data.map((product) => (
              <article className="flex flex-col gap-3 rounded-2xl border border-ink/10 bg-paper-card p-5 shadow-card" key={product.id}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-ink">{product.name}</h3>
                    <p className="line-clamp-2 text-xs text-ink-soft">{product.description || 'Sin descripción'}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button aria-label="Editar" className="rounded-lg p-1.5 text-ink-soft transition hover:bg-ink/5 hover:text-teal" onClick={() => openEdit(product)} type="button">
                      <SquarePen className="h-4 w-4" />
                    </button>
                    <button
                      aria-label="Desactivar"
                      className="rounded-lg p-1.5 text-ink-soft transition hover:bg-red-50 hover:text-red-600"
                      onClick={() => setConfirmDelete(product)}
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {product.category ? <span className="rounded-full bg-teal/10 px-2 py-0.5 font-mono text-[10px] font-bold text-teal">{product.category}</span> : null}
                  {product.tags.slice(0, 3).map((tag) => (
                    <span className="rounded-full bg-ink/5 px-2 py-0.5 font-mono text-[10px] text-ink-soft" key={tag}>{tag}</span>
                  ))}
                </div>
                <div className="mt-auto grid grid-cols-3 gap-2 border-t border-ink/10 pt-3 font-mono text-xs">
                  <div>
                    <p className="label-caps text-ink-soft">Cotiz.</p>
                    <p className="font-bold text-ink">{product.timesQuoted}</p>
                  </div>
                  <div>
                    <p className="label-caps text-ink-soft">Margen</p>
                    <p className="font-bold text-status-accepted">+{product.marginPct.toFixed(0)}%</p>
                  </div>
                  <div className="text-right">
                    <p className="label-caps text-ink-soft">P. Venta</p>
                    <p className="font-bold text-ink">{formatMoney(product.sellPrice, product.currency)}</p>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        {data && data.meta.totalPages > 1 ? (
          <div className="flex items-center justify-between text-sm text-ink-soft">
            <p>Total registrados: {data.meta.total} productos</p>
            <div className="flex items-center gap-2">
              <button className="rounded-lg p-2 disabled:opacity-30" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} type="button">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="font-mono text-xs">Página {page} de {data.meta.totalPages}</span>
              <button className="rounded-lg p-2 disabled:opacity-30" disabled={page >= data.meta.totalPages} onClick={() => setPage((p) => p + 1)} type="button">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : data ? (
          <p className="text-sm text-ink-soft">Total registrados: {data.meta.total} productos</p>
        ) : null}
      </div>

      <ProductFormModal key={modalKey} initial={editing ?? undefined} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} open={modalOpen} />

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setConfirmDelete(null)}>
          <div className="w-full max-w-sm rounded-2xl p-6 space-y-4" style={{ background: 'var(--paper-card)', border: '1px solid var(--border)' }} onClick={(e) => e.stopPropagation()}>
            <div>
              <p className="label-caps text-red-400">Desactivar producto</p>
              <h3 className="font-display text-lg font-extrabold text-ink mt-1">{confirmDelete.name}</h3>
              <p className="text-sm text-ink-soft mt-1">El producto dejará de aparecer en tu catálogo y no podrá agregarse a nuevas cotizaciones. Las cotizaciones existentes no se ven afectadas.</p>
            </div>
            <div className="flex gap-2 justify-end">
              <button className="button-secondary" onClick={() => setConfirmDelete(null)} type="button">Cancelar</button>
              <button
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition disabled:opacity-50"
                disabled={deactivateProduct.isPending}
                onClick={() => {
                  const id = confirmDelete.id;
                  setConfirmDelete(null);
                  deactivateProduct.mutate(id);
                }}
                type="button"
              >
                <Trash2 className="h-3.5 w-3.5" /> {deactivateProduct.isPending ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
