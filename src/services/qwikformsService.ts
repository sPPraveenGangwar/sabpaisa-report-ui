/**
 * QwikForms API Service
 * Handles all QwikForms API calls (Admin only)
 */

import apiClient from '../config/api.config';

// Types
export interface QwikFormsTransaction {
  transaction_id: number;
  trans_id: string;
  sp_trans_id: string;
  trans_date: string;
  trans_amount: number;
  trans_status: string;
  trans_paymode: string;
  pg_trans_id: string;
  pg_resp_code: string;
  bank_reference_no: string;
  customer_name: string;
  customer_email: string;
  customer_contact: string;
  act_amount: number;
  trans_charges: number;
  trans_other_chrg: number;
  settlement_status: string;
  settlement_date: string;
  settlement_amount: number;
  is_settled: string;
  refund_id: string | null;
  refund_amount: string | null;
  refund_submit_date: string | null;
  refund_close_date: string | null;
  form_id: number;
  form_fee_name: string;
  client_id: string;
  client_code: string;
  client_name: string;
  bank_name: string;
  bid: string;
  cid: string;
  form_data: any;
}

export interface QwikFormsFilters {
  date_from?: string;
  date_to?: string;
  trans_status?: string;
  trans_paymode?: string;
  client_code?: string;
  client_id?: string;
  form_id?: number;
  settlement_status?: string;
  trans_id?: string;
  sp_trans_id?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface QwikFormsAnalytics {
  summary: {
    total_transactions: number;
    successful_transactions: number;
    failed_transactions: number;
    pending_transactions: number;
    success_rate: number;
    total_volume: number;
    total_settled_amount: number;
    pending_settlement_amount: number;
    avg_transaction_value: number;
  };
  by_payment_mode: {
    [key: string]: {
      count: number;
      volume: number;
      success_rate: number;
    };
  };
  by_form: Array<{
    form_id: number;
    fee_name: string;
    count: number;
    volume: number;
  }>;
  by_client: Array<{
    client_id: string;
    client_name: string;
    count: number;
    volume: number;
  }>;
  daily_trend: Array<{
    date: string;
    count: number;
    volume: number;
    success_rate: number;
  }>;
}

class QwikFormsService {
  private baseUrl = '/qwikforms';

  /**
   * Get all QwikForms transactions with filters
   */
  async getTransactions(filters?: QwikFormsFilters) {
    try {
      const params = new URLSearchParams();

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            params.append(key, String(value));
          }
        });
      }

      const response = await apiClient.get(
        `${this.baseUrl}/transactions/?${params.toString()}`
      );

      // Handle different response formats
      if (response.data) {
        // If response has 'data' property, use it
        if (response.data.data) {
          return {
            results: response.data.data.results || response.data.data || [],
            count: response.data.data.count || 0,
            success: true
          };
        }
        // If response has 'results' directly
        if (response.data.results !== undefined) {
          return {
            results: response.data.results || [],
            count: response.data.count || 0,
            success: true
          };
        }
        // If response is an array
        if (Array.isArray(response.data)) {
          return {
            results: response.data,
            count: response.data.length,
            success: true
          };
        }
      }

      // Default empty response
      return {
        results: [],
        count: 0,
        success: true
      };
    } catch (error) {
      console.error('Error fetching QwikForms transactions:', error);
      // Return empty results instead of throwing
      return {
        results: [],
        count: 0,
        success: false,
        error: error
      };
    }
  }

  /**
   * Get single transaction detail
   */
  async getTransactionDetail(id: number) {
    try {
      const response = await apiClient.get(`${this.baseUrl}/transactions/${id}/`);
      // Handle response format
      if (response.data?.data) {
        return response.data.data;
      }
      return response.data || {};
    } catch (error) {
      console.error('Error fetching transaction detail:', error);
      throw error;
    }
  }

  /**
   * Get all clients and their forms
   */
  async getClientsAndForms() {
    try {
      const response = await apiClient.get(`${this.baseUrl}/transactions/clients-and-forms/`);
      // Handle response format
      if (response.data) {
        return response.data;
      }
      return { success: false, data: { clients: [] } };
    } catch (error) {
      console.error('Error fetching clients and forms:', error);
      // Return empty data instead of throwing
      return { success: false, data: { clients: [] } };
    }
  }

  /**
   * Get settled transactions
   */
  async getSettledTransactions(filters?: QwikFormsFilters) {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const response = await apiClient.get(
      `${this.baseUrl}/settlements/settled/?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Get pending settlements
   */
  async getPendingSettlements(filters?: QwikFormsFilters) {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const response = await apiClient.get(
      `${this.baseUrl}/settlements/pending/?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Get refund transactions
   */
  async getRefunds(filters?: QwikFormsFilters) {
    const params = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    const response = await apiClient.get(
      `${this.baseUrl}/settlements/refunds/?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Get analytics dashboard
   */
  async getAnalyticsDashboard(filters?: QwikFormsFilters) {
    const params = new URLSearchParams();

    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);

    const response = await apiClient.get(
      `${this.baseUrl}/analytics/dashboard/?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Get form-wise analytics
   */
  async getFormAnalytics(filters?: QwikFormsFilters) {
    const params = new URLSearchParams();

    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);

    const response = await apiClient.get(
      `${this.baseUrl}/analytics/by-form/?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Get client-wise analytics
   */
  async getClientAnalytics(filters?: QwikFormsFilters) {
    const params = new URLSearchParams();

    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);

    const response = await apiClient.get(
      `${this.baseUrl}/analytics/by-client/?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Get payment mode analytics
   */
  async getPaymentModeAnalytics(filters?: QwikFormsFilters) {
    const params = new URLSearchParams();

    if (filters?.date_from) params.append('date_from', filters.date_from);
    if (filters?.date_to) params.append('date_to', filters.date_to);

    const response = await apiClient.get(
      `${this.baseUrl}/analytics/payment-mode/?${params.toString()}`
    );
    return response.data;
  }

  /**
   * Generate Excel report
   */
  async generateExcelReport(filters?: QwikFormsFilters) {
    const response = await apiClient.post(
      `${this.baseUrl}/reports/generate-excel/`,
      { filters },
      {
        responseType: 'blob',
      }
    );

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `qwikforms_report_${new Date().toISOString().split('T')[0]}.xlsx`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { success: true, message: 'Excel report downloaded successfully' };
  }

  /**
   * Generate CSV report
   */
  async generateCSVReport(filters?: QwikFormsFilters) {
    const response = await apiClient.post(
      `${this.baseUrl}/reports/generate-csv/`,
      { filters },
      {
        responseType: 'blob',
      }
    );

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `qwikforms_report_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { success: true, message: 'CSV report downloaded successfully' };
  }

  /**
   * Generate PDF report (HTML)
   */
  async generatePDFReport(filters?: QwikFormsFilters) {
    const response = await apiClient.post(
      `${this.baseUrl}/reports/generate-pdf/`,
      { filters },
      {
        responseType: 'blob',
      }
    );

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `qwikforms_report_${new Date().toISOString().split('T')[0]}.html`
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { success: true, message: 'PDF report downloaded successfully' };
  }
}

export default new QwikFormsService();