'use client';

import { type ClipboardEvent, useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { useImportProducts } from '@/hooks/use-products';
import type { ProductFormValues } from '@/lib/types';

interface ProductImportModalProps {
  open: boolean;
  onClose: () => void;
}

interface Row {
  name: string;
  category: string;
  cost: string;
  margin: string;
  shortDesc: string;
  details: string;
  imageUrl: string;
}

const COLUMNS: { key: keyof Row; label: string }[] = [
  { key: 'name', label: 'Nombre *' },
  { key: 'category', label: 'Categoría' },
  { key: 'cost', label: 'Costo' },
  { key: 'margin', label: 'Margen (%)' },
  { key: 'shortDesc', label: 'Desc. Corta' },
  { key: 'details', label: 'Detalles' },
  { key: 'imageUrl', label: 'URL Imagen' },
];

const INITIAL_ROWS = 10;
const MAX_ROWS = 500;

function emptyRow(): Row {
  return { name: '', category: '', cost: '', margin: '', shortDesc: '', details: '', imageUrl: '' };
}

function withTrailingRow(rows: Row[]): Row[] {
  const last = rows[rows.length - 1];
  if (last.name.trim().length > 0 && rows.length < MAX_ROWS) return [...rows, emptyRow()];
  return rows;
}

export function ProductImportModal({ open, onClose }: ProductImportModalProps) {
  const [rows, setRows] = useState<Row[]>(() => Array.from({ length: INITIAL_ROWS }, emptyRow));
  const [error, setError] = useState<string | null>(null);
  const importProducts = useImportProducts();

  const readyCount = rows.filter((row) => row.name.trim().length > 0).length;

  function updateCell(rowIndex: number, key: keyof Row, value: string) {
    setRows((prev) => withTrailingRow(prev.map((row, i) => (i === rowIndex ? { ...row, [key]: value } : row))));
  }

  function handlePaste(rowIndex: number, colIndex: number, event: ClipboardEvent<HTMLInputElement>) {
    const text = event.clipboardData.getData('text/plain');
    if (!text.includes('\t') && !text.includes('\n')) return;
    event.preventDefault();
    const lines = text.replace(/\r/g, '').split('\n').filter((line, i, arr) => !(i === arr.length - 1 && line === ''));
    setRows((prev) => {
      const next = prev.map((row) => ({ ...row }));
      lines.forEach((line, lineIndex) => {
        const cells = line.split('\t');
        const targetRow = rowIndex + lineIndex;
        while (next.length <= targetRow) next.push(emptyRow());
        cells.forEach((cell, cellIndex) => {
          const column = COLUMNS[colIndex + cellIndex];
          if (column) next[targetRow][column.key] = cell.trim();
        });
      });
      return withTrailingRow(next);
    });
  }

  function reset() {
    setRows(Array.from({ length: INITIAL_ROWS }, emptyRow));
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleImport() {
    setError(null);
    const payload: ProductFormValues[] = rows
      .filter((row) => row.name.trim().length > 0)
      .map((row) => ({
        name: row.name.trim(),
        type: 'TOUR',
        category: row.category.trim() || undefined,
        tags: [],
        netCost: Number(row.cost) || 0,
        currency: 'COP',
        unit: 'PER_SERVICE',
        markupType: 'PERCENT',
        markupValue: Number(row.margin) || 0,
        taxPct: 0,
        description: row.shortDesc.trim() || undefined,
        longDescription: row.details.trim() || undefined,
        imageUrl: row.imageUrl.trim() || undefined,
        reservationMode: 'DAY',
        blockedDates: [],
        extras: [],
      }));
    if (payload.length === 0) return;
    try {
      await importProducts.mutateAsync(payload);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo importar los productos.');
    }
  }

  return (
    <Modal onClose={handleClose} open={open} subtitle="Carga masiva de tu catálogo de productos." title="Importar Productos" xl>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="label-caps text-ink-soft">Tabla de Datos</p>
          <p className="text-sm font-semibold text-teal">{readyCount} producto{readyCount === 1 ? '' : 's'} listos</p>
        </div>

        <div className="max-h-[26rem] overflow-auto rounded-xl border border-ink/10">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-paper-card">
              <tr>
                <th className="w-10 border-b border-ink/10 px-2 py-2 text-left text-xs font-semibold text-ink-soft">#</th>
                {COLUMNS.map((column) => (
                  <th className="border-b border-l border-ink/10 px-2 py-2 text-left text-xs font-semibold text-ink-soft" key={column.key}>
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td className="border-b border-ink/5 px-2 py-1 text-center text-xs text-ink-soft/60">{rowIndex + 1}</td>
                  {COLUMNS.map((column, colIndex) => (
                    <td className="border-b border-l border-ink/5 p-0" key={column.key}>
                      <input
                        className="w-full bg-transparent px-2 py-1.5 text-sm text-ink outline-none focus:bg-teal/5"
                        onChange={(e) => updateCell(rowIndex, column.key, e.target.value)}
                        onPaste={(e) => handlePaste(rowIndex, colIndex, e)}
                        type="text"
                        value={row[column.key]}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-ink-soft/70">
          Escribe directamente o pega filas copiadas desde Excel/Numbers/Google Sheets. La fila se agrega sola al completar el nombre de la última.
          Este import cubre los datos base — disponibilidad, capacidad y extras se editan después por producto.
        </p>

        {error ? <p className="text-sm text-red-600" role="alert">{error}</p> : null}

        <div className="flex justify-end gap-3 pt-2">
          <button className="button-secondary" onClick={handleClose} type="button">Cancelar</button>
          <button className="button-primary" disabled={readyCount === 0 || importProducts.isPending} onClick={handleImport} type="button">
            {importProducts.isPending ? 'Importando…' : `Importar ${readyCount} producto${readyCount === 1 ? '' : 's'}`}
          </button>
        </div>
      </div>
    </Modal>
  );
}
