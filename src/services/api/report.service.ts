import apiClient from '../../config/api.config';
import { ExportFormat, ReportType, PaginatedResponse } from '../../types/api.types';

interface ReportRequest {
  report_type: ReportType;
  date_from: string;
  date_to: string;
  format: ExportFormat;
  client_code?: string;
  filters?: Record<string, any>;
}

interface ReportHistory {
  id: string;
  report_type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
  file_url?: string;
  file_size?: number;
  error_message?: string;
  parameters: Record<string, any>;
}

class ReportService {
  private readonly BASE_URL = '/reports';

  /**
   * Generate comprehensive transaction report
   */
  async generateTransactionReport(params: {
    date_from: string;
    date_to: string;
    format: ExportFormat;
    include_failed?: boolean;
    include_pending?: boolean;
    client_code?: string;
    payment_modes?: string[];
  }): Promise<Blob> {
    try {
      const response = await apiClient.post(`${this.BASE_URL}/transaction-report/`, params, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error generating transaction report:', error);
      throw error;
    }
  }

  /**
   * Generate settlement report
   */
  async generateSettlementReport(params: {
    date_from: string;
    date_to: string;
    format: ExportFormat;
    settlement_status?: string;
    client_code?: string;
  }): Promise<Blob> {
    try {
      const response = await apiClient.post(`${this.BASE_URL}/settlement-report/`, params, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error generating settlement report:', error);
      throw error;
    }
  }

  /**
   * Generate refund report
   */
  async generateRefundReport(params: {
    date_from: string;
    date_to: string;
    format: ExportFormat;
    refund_status?: string;
    client_code?: string;
  }): Promise<Blob> {
    try {
      const response = await apiClient.post(`${this.BASE_URL}/refund-report/`, params, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error generating refund report:', error);
      throw error;
    }
  }

  /**
   * Generate chargeback report
   */
  async generateChargebackReport(params: {
    date_from: string;
    date_to: string;
    format: ExportFormat;
    status?: string;
    client_code?: string;
  }): Promise<Blob> {
    try {
      const response = await apiClient.post(`${this.BASE_URL}/chargeback-report/`, params, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error generating chargeback report:', error);
      throw error;
    }
  }

  /**
   * Generate reconciliation report
   */
  async generateReconciliationReport(params: {
    date: string;
    format: ExportFormat;
    include_mismatched?: boolean;
    client_code?: string;
  }): Promise<Blob> {
    try {
      const response = await apiClient.post(`${this.BASE_URL}/reconciliation-report/`, params, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error generating reconciliation report:', error);
      throw error;
    }
  }

  /**
   * Generate financial summary report
   */
  async generateFinancialSummary(params: {
    date_from: string;
    date_to: string;
    format: ExportFormat;
    group_by?: 'day' | 'week' | 'month';
    client_code?: string;
  }): Promise<Blob> {
    try {
      const response = await apiClient.post(`${this.BASE_URL}/financial-summary/`, params, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error generating financial summary:', error);
      throw error;
    }
  }

  /**
   * Generate GST report
   */
  async generateGSTReport(params: {
    date_from: string;
    date_to: string;
    format: ExportFormat;
    gst_type: 'GSTR1' | 'GSTR3B';
    client_code?: string;
  }): Promise<Blob> {
    try {
      const response = await apiClient.post(`${this.BASE_URL}/gst-report/`, params, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error generating GST report:', error);
      throw error;
    }
  }

  /**
   * Generate MIS report
   */
  async generateMISReport(params: {
    date_from: string;
    date_to: string;
    format: ExportFormat;
    report_level: 'summary' | 'detailed';
    client_code?: string;
  }): Promise<Blob> {
    try {
      const response = await apiClient.post(`${this.BASE_URL}/mis-report/`, params, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error generating MIS report:', error);
      throw error;
    }
  }

  /**
   * Generate bank statement
   */
  async generateBankStatement(params: {
    date_from: string;
    date_to: string;
    format: ExportFormat;
    bank_name?: string;
    account_number?: string;
    client_code?: string;
  }): Promise<Blob> {
    try {
      const response = await apiClient.post(`${this.BASE_URL}/bank-statement/`, params, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error generating bank statement:', error);
      throw error;
    }
  }

  /**
   * Generate custom report
   */
  async generateCustomReport(params: ReportRequest): Promise<Blob> {
    try {
      const response = await apiClient.post(`${this.BASE_URL}/custom/`, params, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error generating custom report:', error);
      throw error;
    }
  }

  /**
   * Schedule report generation
   */
  async scheduleReport(params: {
    report_type: ReportType;
    schedule_type: 'daily' | 'weekly' | 'monthly';
    format: ExportFormat;
    email_recipients?: string[];
    parameters: Record<string, any>;
  }): Promise<any> {
    try {
      const response = await apiClient.post(`${this.BASE_URL}/schedule/`, params);
      return response.data;
    } catch (error) {
      console.error('Error scheduling report:', error);
      throw error;
    }
  }

  /**
   * Get report generation history
   */
  async getReportHistory(params: {
    date_from?: string;
    date_to?: string;
    status?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<ReportHistory>> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/history/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching report history:', error);
      throw error;
    }
  }

  /**
   * Get report status
   */
  async getReportStatus(reportId: string): Promise<ReportHistory> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/status/${reportId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching report status:', error);
      throw error;
    }
  }

  /**
   * Download report
   */
  async downloadReport(reportId: string): Promise<Blob> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/download/${reportId}/`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error downloading report:', error);
      throw error;
    }
  }

  /**
   * Delete report
   */
  async deleteReport(reportId: string): Promise<any> {
    try {
      const response = await apiClient.delete(`${this.BASE_URL}/delete/${reportId}/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  }

  /**
   * Get available report templates
   */
  async getReportTemplates(): Promise<any> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/templates/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching report templates:', error);
      throw error;
    }
  }

  /**
   * Export all reports as ZIP
   */
  async exportAllReports(params: {
    date_from: string;
    date_to: string;
    report_types: ReportType[];
    format: ExportFormat;
    client_code?: string;
  }): Promise<Blob> {
    try {
      const response = await apiClient.post(`${this.BASE_URL}/export-all/`, params, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting all reports:', error);
      throw error;
    }
  }
}

export default new ReportService();