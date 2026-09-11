'use client';

import { ChevronLeft, ChevronRight, Download, LayoutGrid, List, Plus, Search, SquarePen, Trash2, Upload } from 'lucide-react';
import { useState } from 'react';
import { AppShell } from '@/components/app-shell';
import { ProductFormModal } from '@/components/products/product-form-modal';
import { ProductImportModal } from '@/components/products/product-import-modal';
import { useCreateProduct, useDeactivateProduct, useProductCategories, useProducts, useUpdateProduct } from '@/hooks/use-products';
import { API_BASE, getAccessToken } from '@/lib/api';
import type { Product, ProductFormValues } from '@/lib/types';

const PAGE_SIZE_OPTIONS = [12, 48, 108];

function formatMoney(value: number, currency: string): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
}

async function downloadExport() {
  const res = await fetch(`${API_BASE}/products/export`, {
    headers: { Authorization: `Bearer ${getAccessToken() ?? ''}` },
    credentials: 'include',
  });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `productos_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importOpen, setImportOpen] = useState(false);

  const { data, isLoading } = useProducts({ q: search || undefined, category: category || undefined, page, limit: pageSize, active: true });
  const { data: categories } = useProductCategories();

  const createProduct = useCreateProduct();
  const deactivateProduct = useDeactivateProduct();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [editing, setEditing] = useState<Product | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Product | Product[] | null>(null);
  const updateProduct = useUpdateProduct(editing?.id ?? 'none');

  const products = data?.data ?? [];
  const allSelected = products.length > 0 && products.every((p) => selected.has(p.id));

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

  function toggleSelectAll() {
    setSelected(allSelected ? new Set() : new Set(products.map((p) => p.id)));
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleConfirmedDelete() {
    if (!confirmDelete) return;
    const targets = Array.isArray(confirmDelete) ? confirmDelete : [confirmDelete];
    setConfirmDelete(null);
    for (const product of targets) await deactivateProduct.mutateAsync(product.id);
    setSelected(new Set());
  }

  const confirmTargets = confirmDelete ? (Array.isArray(confirmDelete) ? confirmDelete : [confirmDelete]) : [];

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-content space-y-6 px-4 pb-28 pt-7 sm:px-6 lg:px-8 lg:pb-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-ink">Productos y Servicios</h1>
            <p className="mt-1 text-sm text-ink-soft">Administra tu inventario de hoteles, tours y transportes.</p>
          </div>
          <div className="flex gap-3">
            <button className="button-secondary inline-flex items-center gap-2" onClick={downloadExport} type="button">
              <Download className="h-4 w-4" /> Exportar
            </button>
            <button className="button-secondary inline-flex items-center gap-2" onClick={() => setImportOpen(true)} type="button">
              <Upload className="h-4 w-4" /> Importar Rápido
            </button>
            <button className="button-primary inline-flex items-center gap-2" onClick={openCreate} type="button">
              <Plus className="h-4 w-4" /> Nuevo Producto
            </button>
          </div>
        </header>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft/60" />
            <input
              className="w-full rounded-lg border border-ink/15 bg-paper-card py-2.5 pl-9 pr-3 text-sm text-ink outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar producto, categoría o proveedor…"
              value={search}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-ink-soft">
              Mostrar:
              <select
                className="rounded-lg border border-ink/15 bg-paper-card px-2 py-1.5 text-sm text-ink outline-none focus:border-teal"
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                value={pageSize}
              >
                {PAGE_SIZE_OPTIONS.map((size) => <option key={size} value={size}>{size}</option>)}
              </select>
            </label>
            <select
              className="rounded-lg border border-ink/15 bg-paper-card px-3 py-1.5 text-sm text-ink outline-none focus:border-teal"
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              value={category}
            >
              <option value="">Todas las categorías</option>
              {categories?.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="flex overflow-hidden rounded-lg border border-ink/15">
              <button
                aria-label="Vista lista"
                className={`p-2 transition ${view === 'list' ? 'bg-teal text-white' : 'bg-paper-card text-ink-soft hover:bg-ink/5'}`}
                onClick={() => setView('list')}
                type="button"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                aria-label="Vista cuadrícula"
                className={`p-2 transition ${view === 'grid' ? 'bg-teal text-white' : 'bg-paper-card text-ink-soft hover:bg-ink/5'}`}
                onClick={() => setView('grid')}
                type="button"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {selected.size > 0 ? (
          <div className="flex items-center justify-between rounded-xl border border-teal/30 bg-teal/5 px-4 py-2.5">
            <p className="text-sm font-semibold text-ink">{selected.size} producto(s) seleccionados</p>
            <button
              className="inline-flex items-center gap-2 text-sm font-semibold text-red-600 hover:text-red-700"
              onClick={() => setConfirmDelete(products.filter((p) => selected.has(p.id)))}
              type="button"
            >
              <Trash2 className="h-4 w-4" /> Eliminar seleccionados
            </button>
          </div>
        ) : null}

        {isLoading ? (
          <p className="text-ink-soft">Cargando productos…</p>
        ) : products.length === 0 ? (
          <p className="text-ink-soft">No se encontraron productos.</p>
        ) : view === 'list' ? (
          <div className="overflow-x-auto rounded-2xl border border-ink/10 bg-paper-card shadow-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink/10 text-left text-xs uppercase tracking-wide text-ink-soft">
                  <th className="w-10 px-4 py-3"><input checked={allSelected} onChange={toggleSelectAll} type="checkbox" /></th>
                  <th className="px-2 py-3">Producto</th>
                  <th className="px-2 py-3">Categoría</th>
                  <th className="px-2 py-3">Etiquetas</th>
                  <th className="px-2 py-3 text-right">Cotiz.</th>
                  <th className="px-2 py-3 text-right">Costo / Margen</th>
                  <th className="px-2 py-3 text-right">P. Venta</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr className="border-b border-ink/5 last:border-0 hover:bg-ink/[0.02]" key={product.id}>
                    <td className="px-4 py-3"><input checked={selected.has(product.id)} onChange={() => toggleSelect(product.id)} type="checkbox" /></td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-3">
                        {product.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" src={product.imageUrl} />
                        ) : (
                          <div className="h-10 w-10 shrink-0 rounded-lg bg-ink/5" />
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-ink">{product.name}</p>
                          <p className="line-clamp-1 text-xs text-ink-soft">{product.description || 'Sin descripción'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      {product.category ? (
                        <span className="rounded-full bg-teal/10 px-2 py-0.5 font-mono text-[10px] font-bold text-teal">{product.category}</span>
                      ) : <span className="text-ink-soft">—</span>}
                    </td>
                    <td className="px-2 py-3 text-ink-soft">{product.tags.length > 0 ? product.tags.join(', ') : '—'}</td>
                    <td className="px-2 py-3 text-right font-mono">{product.timesQuoted}</td>
                    <td className="px-2 py-3 text-right font-mono">
                      <p>{formatMoney(product.netCost, product.currency)}</p>
                      <p className="text-status-accepted">+{product.marginPct.toFixed(0)}%</p>
                    </td>
                    <td className="px-2 py-3 text-right font-mono font-bold text-ink">{formatMoney(product.sellPrice, product.currency)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button aria-label="Editar" className="rounded-lg p-1.5 text-ink-soft transition hover:bg-ink/5 hover:text-teal" onClick={() => openEdit(product)} type="button">
                          <SquarePen className="h-4 w-4" />
                        </button>
                        <button aria-label="Desactivar" className="rounded-lg p-1.5 text-ink-soft transition hover:bg-red-50 hover:text-red-600" onClick={() => setConfirmDelete(product)} type="button">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
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
                    <button aria-label="Desactivar" className="rounded-lg p-1.5 text-ink-soft transition hover:bg-red-50 hover:text-red-600" onClick={() => setConfirmDelete(product)} type="button">
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
            ))}
          </div>
        )}

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
      <ProductImportModal onClose={() => setImportOpen(false)} open={importOpen} />

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} onClick={() => setConfirmDelete(null)}>
          <div className="w-full max-w-sm rounded-2xl p-6 space-y-4" style={{ background: 'var(--paper-card)', border: '1px solid var(--border)' }} onClick={(e) => e.stopPropagation()}>
            <div>
              <p className="label-caps text-red-400">Desactivar producto{confirmTargets.length > 1 ? 's' : ''}</p>
              <h3 className="font-display text-lg font-extrabold text-ink mt-1">
                {confirmTargets.length > 1 ? `${confirmTargets.length} productos seleccionados` : confirmTargets[0]?.name}
              </h3>
              <p className="text-sm text-ink-soft mt-1">
                {confirmTargets.length > 1 ? 'Estos productos' : 'El producto'} dejará{confirmTargets.length > 1 ? 'n' : ''} de aparecer en tu catálogo y no podrá{confirmTargets.length > 1 ? 'n' : ''} agregarse a nuevas cotizaciones. Las cotizaciones existentes no se ven afectadas.
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <button className="button-secondary" onClick={() => setConfirmDelete(null)} type="button">Cancelar</button>
              <button
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition disabled:opacity-50"
                disabled={deactivateProduct.isPending}
                onClick={handleConfirmedDelete}
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
