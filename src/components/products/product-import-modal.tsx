'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { parseCsv } from '@/lib/csv';
import { useImportProducts } from '@/hooks/use-products';
import type { MarkupType, ProductFormValues, ProductType, ProductUnit } from '@/lib/types';

interface ProductImportModalProps {
  open: boolean;
  onClose: () => void;
}

const PRODUCT_TYPES: ProductType[] = ['HOTEL', 'TOUR', 'TRANSPORT', 'FLIGHT', 'INSURANCE', 'EXPERIENCE', 'OTHER'];
const PRODUCT_UNITS: ProductUnit[] = ['PER_SERVICE', 'PER_NIGHT', 'PER_PERSON'];
const MARKUP_TYPES: MarkupType[] = ['PERCENT', 'FIXED'];

function toNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return value && Number.isFinite(parsed) ? parsed : fallback;
}

function rowsToProducts(rows: string[][]): ProductFormValues[] {
  const [header, ...body] = rows;
  const index = (key: string) => header.findIndex((h) => h.trim().toLowerCase() === key);
  const col = {
    name: index('name'), type: index('type'), category: index('category'),
    netCost: index('netcost'), currency: index('currency'), unit: index('unit'),
    markupType: index('markuptype'), markupValue: index('markupvalue'), taxPct: index('taxpct'),
    tags: index('tags'), description: index('description'),
  };
  return body
    .filter((cells) => col.name >= 0 && cells[col.name]?.trim())
    .map((cells) => {
      const rawType = cells[col.type]?.trim().toUpperCase();
      const rawUnit = cells[col.unit]?.trim().toUpperCase();
      const rawMarkupType = cells[col.markupType]?.trim().toUpperCase();
      return {
        name: cells[col.name].trim(),
        type: (PRODUCT_TYPES as string[]).includes(rawType ?? '') ? (rawType as ProductType) : 'TOUR',
        category: col.category >= 0 ? cells[col.category]?.trim() || undefined : undefined,
        netCost: toNumber(cells[col.netCost], 0),
        currency: (cells[col.currency]?.trim().toUpperCase() || 'COP').slice(0, 3),
        unit: (PRODUCT_UNITS as string[]).includes(rawUnit ?? '') ? (rawUnit as ProductUnit) : 'PER_SERVICE',
        markupType: (MARKUP_TYPES as string[]).includes(rawMarkupType ?? '') ? (rawMarkupType as MarkupType) : 'PERCENT',
        markupValue: toNumber(cells[col.markupValue], 0),
        taxPct: toNumber(cells[col.taxPct], 0),
        tags: col.tags >= 0 ? (cells[col.tags]?.split(';').map((t) => t.trim()).filter(Boolean) ?? []) : [],
        description: col.description >= 0 ? cells[col.description]?.trim() || undefined : undefined,
        reservationMode: 'DAY',
        blockedDates: [],
        extras: [],
      } satisfies ProductFormValues;
    });
}

export function ProductImportModal({ open, onClose }: ProductImportModalProps) {
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState<ProductFormValues[]>([]);
  const [error, setError] = useState<string | null>(null);
  const importProducts = useImportProducts();

  async function handleFile(file: File) {
    setError(null);
    setFileName(file.name);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length < 2) { setError('El archivo no tiene filas de datos.'); setPreview([]); return; }
      setPreview(rowsToProducts(rows));
    } catch {
      setError('No se pudo leer el archivo. Verifica que sea un CSV válido.');
      setPreview([]);
    }
  }

  async function handleImport() {
    if (preview.length === 0) return;
    setError(null);
    try {
      await importProducts.mutateAsync(preview);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo importar los productos.');
    }
  }

  function handleClose() {
    setFileName('');
    setPreview([]);
    setError(null);
    onClose();
  }

  return (
    <Modal onClose={handleClose} open={open} subtitle="Carga masiva desde un archivo CSV." title="Importar Rápido">
      <div className="space-y-4">
        <div>
          <label className="label-caps mb-1.5 block text-ink-soft" htmlFor="import-file">Archivo CSV</label>
          <input
            accept=".csv,text/csv"
            className="w-full rounded-lg border border-ink/15 bg-paper px-3 py-2.5 text-sm text-ink outline-none file:mr-3 file:rounded-md file:border-0 file:bg-teal/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-teal"
            id="import-file"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            type="file"
          />
          <p className="mt-1.5 text-xs text-ink-soft/70">
            Columnas esperadas: name, type, category, netCost, currency, unit, markupType, markupValue, taxPct, tags, description.
            Usa <code>;</code> para separar varias etiquetas. Este import cubre los datos base — disponibilidad, capacidad y extras se editan después por producto.
          </p>
        </div>

        {fileName && preview.length > 0 ? (
          <div className="rounded-xl border border-ink/10 bg-paper p-4">
            <p className="label-caps text-ink-soft">Vista previa</p>
            <p className="mt-1 text-sm text-ink">{preview.length} producto(s) listos para importar desde <span className="font-semibold">{fileName}</span>.</p>
            <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-xs text-ink-soft">
              {preview.slice(0, 8).map((p, i) => <li key={i}>• {p.name}</li>)}
              {preview.length > 8 ? <li>… y {preview.length - 8} más</li> : null}
            </ul>
          </div>
        ) : null}

        {error ? <p className="text-sm text-red-600" role="alert">{error}</p> : null}

        <div className="flex justify-end gap-3 pt-2">
          <button className="button-secondary" onClick={handleClose} type="button">Cancelar</button>
          <button className="button-primary" disabled={preview.length === 0 || importProducts.isPending} onClick={handleImport} type="button">
            {importProducts.isPending ? 'Importando…' : `Importar ${preview.length || ''}`.trim()}
          </button>
        </div>
      </div>
    </Modal>
  );
}
