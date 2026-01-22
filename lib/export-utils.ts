import ExcelJS from 'exceljs';

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
export async function exportToExcel<T>(
  data: T[],
  config: ExportConfig<T>
): Promise<void> {
  // Create workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(config.sheetName);

  // Add header row
  const headerRow = config.columns.map((col) => col.header);
  worksheet.addRow(headerRow);

  // Style header row
  const headerRowObj = worksheet.getRow(1);
  headerRowObj.font = { bold: true };
  headerRowObj.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

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
        const day = String(value.getDate()).padStart(2, '0');
        const month = String(value.getMonth() + 1).padStart(2, '0');
        const year = value.getFullYear();
        return `${day}/${month}/${year}`;
      }

      return value as string | number | boolean | null | undefined;
    });
    worksheet.addRow(row);
  });

  // Auto-size columns
  worksheet.columns.forEach((column, idx) => {
    const maxLength = Math.max(
      config.columns[idx].header.length,
      ...data.map((item) => {
        const col = config.columns[idx];
        let value: unknown;
        if (typeof col.accessor === 'function') {
          value = col.accessor(item);
        } else {
          value = item[col.accessor];
        }
        return value != null ? String(value).length : 0;
      })
    );
    column.width = Math.min(maxLength + 2, 50);
  });

  // Generate file and trigger download
  const timestamp = new Date().toISOString().split('T')[0];
  const buffer = await workbook.xlsx.writeBuffer();
  
  // Create blob and download
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${config.filename}_${timestamp}.xlsx`;
  link.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Format date for export in dd/MM/yyyy format
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format datetime for export in dd/MM/yyyy HH:mm:ss format
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
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
