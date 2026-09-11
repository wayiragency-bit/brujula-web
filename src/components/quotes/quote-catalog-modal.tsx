'use client';

import { Minus, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { inputClass } from '@/components/ui/form';
import { useQuoteCatalog } from '@/hooks/use-quotes';
import type { CatalogProduct } from '@/lib/types';

function formatMoney(value: string, currency: string): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(value));
}

interface QuoteCatalogModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (selections: { product: CatalogProduct; quantity: number }[]) => void;
}

export function QuoteCatalogModal({ open, onClose, onConfirm }: QuoteCatalogModalProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todos');
  const [selected, setSelected] = useState<Record<string, { product: CatalogProduct; quantity: number }>>({});
  const { data: catalog } = useQuoteCatalog(search);

  const categories = useMemo(() => {
    const set = new Set<string>();
    catalog?.forEach((p) => { if (p.category) set.add(p.category); });
    return ['Todos', ...Array.from(set).sort()];
  }, [catalog]);

  const filtered = useMemo(() => {
    if (category === 'Todos') return catalog ?? [];
    return (catalog ?? []).filter((p) => p.category === category);
  }, [catalog, category]);

  function toggle(product: CatalogProduct) {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[product.id]) delete next[product.id];
      else next[product.id] = { product, quantity: 1 };
      return next;
    });
  }

  function setQuantity(productId: string, quantity: number) {
    setSelected((prev) => (prev[productId] ? { ...prev, [productId]: { ...prev[productId], quantity: Math.max(1, quantity) } } : prev));
  }

  function reset() {
    setSelected({});
    setSearch('');
    setCategory('Todos');
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleConfirm() {
    onConfirm(Object.values(selected));
    reset();
    onClose();
  }

  const count = Object.keys(selected).length;

  return (
    <Modal onClose={handleClose} open={open} subtitle="Busca y añade ítems a tu cotización." title="Seleccionar Productos y Servicios" xl>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <input
              autoFocus
              className={`${inputClass} pl-9`}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Busca hotel, tour, transporte…"
              value={search}
            />
          </div>
          {count > 0 ? (
            <span className="shrink-0 rounded-full bg-teal/10 px-3 py-1.5 text-xs font-bold text-teal">{count} seleccionados</span>
          ) : null}
        </div>

        {categories.length > 1 ? (
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {categories.map((c) => (
              <button
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  category === c ? 'bg-teal text-white' : 'bg-ink/5 text-ink-soft hover:bg-ink/10'
                }`}
                key={c}
                onClick={() => setCategory(c)}
                type="button"
              >
                {c}
              </button>
            ))}
          </div>
        ) : null}

        <div className="grid max-h-[55vh] grid-cols-1 gap-3 overflow-y-auto sm:grid-cols-2">
          {filtered.length === 0 ? (
            <p className="col-span-2 py-10 text-center text-sm text-ink-soft">Sin resultados.</p>
          ) : (
            filtered.map((product) => {
              const selection = selected[product.id];
              const isSelected = Boolean(selection);
              return (
                <div
                  className={`overflow-hidden rounded-xl border transition ${isSelected ? 'border-teal ring-1 ring-teal' : 'border-ink/10'}`}
                  key={product.id}
                >
                  <div className="relative h-32 w-full bg-ink/5">
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt="" className="h-full w-full object-cover" src={product.imageUrl} />
                    ) : null}
                    <span className="absolute left-2 top-2 rounded-md bg-ink/70 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                      {product.type}
                    </span>
                  </div>
                  <div className="space-y-2 p-3">
                    <p className="text-sm font-semibold text-ink">{product.name}</p>
                    {product.description ? <p className="line-clamp-2 text-xs text-ink-soft">{product.description}</p> : null}
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-mono text-sm font-bold text-teal">{formatMoney(product.sellPrice, product.currency)}</p>
                      {isSelected ? (
                        <div className="flex items-center gap-2 rounded-lg border border-ink/10 px-1.5 py-0.5">
                          <button
                            aria-label="Restar"
                            className="text-ink-soft hover:text-ink"
                            onClick={() => setQuantity(product.id, selection.quantity - 1)}
                            type="button"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-4 text-center text-xs font-bold text-ink">{selection.quantity}</span>
                          <button
                            aria-label="Sumar"
                            className="text-ink-soft hover:text-ink"
                            onClick={() => setQuantity(product.id, selection.quantity + 1)}
                            type="button"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          aria-label="Agregar"
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal text-white shadow-sm transition hover:bg-teal/90"
                          onClick={() => toggle(product)}
                          type="button"
                        >
                          <Plus className="h-4 w-4" strokeWidth={2.5} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex justify-end border-t border-ink/10 pt-4">
          <button className="button-primary" disabled={count === 0} onClick={handleConfirm} type="button">
            Listo, volver a cotización{count > 0 ? ` (${count})` : ''}
          </button>
        </div>
      </div>
    </Modal>
  );
}
