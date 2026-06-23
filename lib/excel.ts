/**
 * Excel Export Helper
 *
 * Helper untuk generate file Excel (.xlsx) dari array of objects.
 * Reusable untuk semua entitas (warga, surat, bantuan, dll).
 *
 * Cara pakai di API route:
 *   import { exportToExcel, sendExcelResponse } from '@/lib/excel';
 *
 *   const buffer = exportToExcel({
 *     sheetName: 'Data Warga',
 *     columns: [
 *       { header: 'NIK', key: 'nik', width: 20 },
 *       { header: 'Nama', key: 'nama_lengkap', width: 30 },
 *     ],
 *     rows: data,
 *   });
 *   return sendExcelResponse(buffer, 'data-warga.xlsx');
 */

import * as XLSX from 'xlsx';

export interface ExcelColumn {
  header: string; // Judul kolom di header row
  key: string; // Key dari object untuk ambil value
  width?: number; // Lebar kolom (dalam karakter)
  format?: (value: any, row: any, rowIndex: number) => string | number; // Custom formatter
}

export interface ExportOptions {
  sheetName: string;
  columns: ExcelColumn[];
  rows: any[];
  /** Kalau true, tambah metadata row di atas (judul, tanggal export) */
  title?: string;
}

/**
 * Generate Excel file sebagai ArrayBuffer.
 * File punya 1 sheet dengan header bold + auto-width.
 */
export function exportToExcel(options: ExportOptions): ArrayBuffer {
  const { sheetName, columns, rows, title } = options;

  // Build array-of-arrays (aoa) untuk kontrol penuh atas layout
  const aoa: any[][] = [];

  // Optional title row
  let headerRowIndex = 0;
  if (title) {
    aoa.push([title]);
    aoa.push([`Diexport pada: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`]);
    aoa.push([]); // empty row
    headerRowIndex = aoa.length;
  }

  // Header row
  aoa.push(columns.map((c) => c.header));

  // Data rows
  rows.forEach((row, rowIdx) => {
    const rowData = columns.map((col) => {
      const raw = row[col.key];
      if (col.format) return col.format(raw, row, rowIdx);
      // Format default: null/undefined jadi ''
      return raw === null || raw === undefined ? '' : raw;
    });
    aoa.push(rowData);
  });

  // Buat worksheet dari aoa
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Set lebar kolom
  ws['!cols'] = columns.map((c) => ({ wch: c.width || 15 }));

  // Merge title row (kalau ada) supaya judul span ke semua kolom
  if (title && headerRowIndex > 0) {
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: columns.length - 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: columns.length - 1 } },
    ];
  }

  // Buat workbook dan tambah sheet
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31)); // max 31 char

  // Export sebagai buffer (bookType xlsx)
  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  return buffer;
}

/**
 * Response wrapper untuk download file Excel.
 * Set header Content-Type dan Content-Disposition yang benar.
 */
export function sendExcelResponse(buffer: ArrayBuffer, filename: string): Response {
  return new Response(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(buffer.byteLength),
    },
  });
}
