import * as XLSX from 'xlsx';

export type ExportColumn<T> = {
  header: string;
  accessor: keyof T | ((item: T) => string | number | boolean | null | undefined);
  format?: (value: unknown) => string;
};

export type ExportConfig<T> = {
  filename: string;
  sheetName: string;
  columns: ExportColumn<T>[];
};

/**
 * Export data to Excel file
 */
export function exportToExcel<T>(
  data: T[],
  config: ExportConfig<T>
): void {
  // Create worksheet data
  const worksheetData: (string | number | boolean | null | undefined)[][] = [];

  // Add header row
  const headerRow = config.columns.map((col) => col.header);
  worksheetData.push(headerRow);

  // Add data rows
  data.forEach((item) => {
    const row = config.columns.map((col) => {
      let value: unknown;

      if (typeof col.accessor === 'function') {
        value = col.accessor(item);
      } else {
        value = item[col.accessor];
      }

      // Apply format if provided
      if (col.format && value !== null && value !== undefined) {
        return col.format(value);
      }

      // Format dates
      if (value instanceof Date) {
        return value.toLocaleDateString();
      }

      return value as string | number | boolean | null | undefined;
    });
    worksheetData.push(row);
  });

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Auto-size columns
  const colWidths = config.columns.map((col, idx) => {
    const maxLength = Math.max(
      col.header.length,
      ...worksheetData.slice(1).map((row) => {
        const cell = row[idx];
        return cell != null ? String(cell).length : 0;
      })
    );
    return { wch: Math.min(maxLength + 2, 50) };
  });
  worksheet['!cols'] = colWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, config.sheetName);

  // Generate file and trigger download
  const timestamp = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `${config.filename}_${timestamp}.xlsx`);
}

/**
 * Format date for export
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString();
}

/**
 * Format datetime for export
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
}

/**
 * Format currency for export
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return '';
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Format boolean for export
 */
export function formatBoolean(value: boolean | null | undefined): string {
  if (value == null) return '';
  return value ? 'Yes' : 'No';
}
