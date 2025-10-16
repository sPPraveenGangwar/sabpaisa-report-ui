import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { ExportFormat } from '../types/api.types';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

/**
 * Export utility functions for downloading data in various formats
 */
export class ExportUtils {
  /**
   * Download blob as file
   */
  static downloadBlob(blob: Blob, filename: string): void {
    saveAs(blob, filename);
  }

  /**
   * Export data to Excel format
   */
  static exportToExcel(
    data: any[],
    filename: string,
    sheetName: string = 'Sheet1'
  ): void {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Auto-size columns
    const maxWidth = 50;
    const cols = Object.keys(data[0] || {}).map(key => ({
      wch: Math.min(maxWidth, Math.max(key.length, ...data.map(row => String(row[key] || '').length)))
    }));
    worksheet['!cols'] = cols;

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${filename}.xlsx`);
  }

  /**
   * Export data to CSV format
   */
  static exportToCSV(data: any[], filename: string): void {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `${filename}.csv`);
  }

  /**
   * Export data to PDF format
   */
  static exportToPDF(
    data: any[],
    filename: string,
    title: string,
    options?: {
      orientation?: 'portrait' | 'landscape';
      fontSize?: number;
      headerColor?: string;
    }
  ): void {
    const doc = new jsPDF({
      orientation: options?.orientation || 'landscape',
      unit: 'pt',
      format: 'a4'
    });

    // Add title
    doc.setFontSize(16);
    doc.text(title, 40, 40);

    // Prepare table data
    const headers = Object.keys(data[0] || {});
    const rows = data.map(row => headers.map(header => row[header] || ''));

    // Add table
    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 60,
      theme: 'grid',
      styles: {
        fontSize: options?.fontSize || 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: options?.headerColor || [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      margin: { top: 60 },
    });

    // Add footer with timestamp
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(
        `Page ${i} of ${pageCount} | Generated on ${new Date().toLocaleString()}`,
        40,
        doc.internal.pageSize.height - 20
      );
    }

    doc.save(`${filename}.pdf`);
  }

  /**
   * Export multiple sheets to Excel
   */
  static exportMultipleToExcel(
    datasets: { data: any[]; sheetName: string }[],
    filename: string
  ): void {
    const workbook = XLSX.utils.book_new();

    datasets.forEach(({ data, sheetName }) => {
      const worksheet = XLSX.utils.json_to_sheet(data);

      // Auto-size columns
      const maxWidth = 50;
      const cols = Object.keys(data[0] || {}).map(key => ({
        wch: Math.min(maxWidth, Math.max(key.length, ...data.map(row => String(row[key] || '').length)))
      }));
      worksheet['!cols'] = cols;

      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${filename}.xlsx`);
  }

  /**
   * Format data for export
   */
  static formatDataForExport(data: any[], columns?: string[]): any[] {
    if (!columns) {
      return data;
    }

    return data.map(row => {
      const formattedRow: any = {};
      columns.forEach(col => {
        formattedRow[col] = row[col] || '';
      });
      return formattedRow;
    });
  }

  /**
   * Generate filename with timestamp
   */
  static generateFilename(prefix: string, extension?: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    return extension ? `${prefix}_${timestamp}.${extension}` : `${prefix}_${timestamp}`;
  }

  /**
   * Export based on format type
   */
  static exportData(
    data: any[],
    format: ExportFormat,
    filename: string,
    options?: {
      title?: string;
      columns?: string[];
      sheetName?: string;
    }
  ): void {
    const formattedData = options?.columns
      ? this.formatDataForExport(data, options.columns)
      : data;

    switch (format) {
      case 'excel':
        this.exportToExcel(formattedData, filename, options?.sheetName);
        break;
      case 'csv':
        this.exportToCSV(formattedData, filename);
        break;
      case 'pdf':
        this.exportToPDF(formattedData, filename, options?.title || 'Report');
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Convert HTML table to Excel
   */
  static exportTableToExcel(tableId: string, filename: string): void {
    const table = document.getElementById(tableId);
    if (!table) {
      console.error(`Table with id ${tableId} not found`);
      return;
    }

    const workbook = XLSX.utils.table_to_book(table);
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${filename}.xlsx`);
  }

  /**
   * Export chart as image
   */
  static exportChartAsImage(chartCanvas: HTMLCanvasElement, filename: string): void {
    chartCanvas.toBlob((blob) => {
      if (blob) {
        saveAs(blob, `${filename}.png`);
      }
    });
  }

  /**
   * Create and download JSON file
   */
  static exportToJSON(data: any, filename: string): void {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    saveAs(blob, `${filename}.json`);
  }

  /**
   * Handle API export response
   */
  static handleExportResponse(blob: Blob, format: ExportFormat, baseFilename: string): void {
    const extension = format === 'excel' ? 'xlsx' : format;
    const filename = this.generateFilename(baseFilename, extension);
    this.downloadBlob(blob, filename);
  }

  /**
   * Check if export is supported
   */
  static isExportSupported(): boolean {
    return typeof Blob !== 'undefined' && typeof saveAs === 'function';
  }

  /**
   * Get MIME type for format
   */
  static getMimeType(format: ExportFormat): string {
    const mimeTypes = {
      excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      csv: 'text/csv',
      pdf: 'application/pdf',
    };
    return mimeTypes[format] || 'application/octet-stream';
  }
}