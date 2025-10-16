import apiClient from '../../config/api.config';
import {
  TransactionSearchRequest,
  TransactionResponse,
  TransactionDetail,
  PaginatedResponse,
  ExportFormat
} from '../../types/api.types';

class TransactionService {
  // Base URLs for different transaction endpoints
  private readonly BASE_URL = '/transactions';
  private readonly REPORTS_URL = '/reports';

  /**
   * Search transactions with advanced filtering
   * Implements all 6 search cases from the API documentation
   */
  async searchTransactions(params: TransactionSearchRequest): Promise<PaginatedResponse<TransactionDetail>> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/search/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error searching transactions:', error);
      throw error;
    }
  }

  /**
   * Get single transaction detail by transaction ID
   */
  async getTransactionDetail(txnId: string): Promise<TransactionDetail> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/detail/${txnId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction detail:', error);
      throw error;
    }
  }

  /**
   * Get transaction summary statistics
   */
  async getTransactionSummary(params: {
    date_from: string;
    date_to: string;
    client_code?: string;
  }): Promise<any> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/summary/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction summary:', error);
      throw error;
    }
  }

  /**
   * Get daily transaction report
   */
  async getDailyTransactionReport(params: {
    date: string;
    client_code?: string;
    payment_mode?: string;
  }): Promise<any> {
    try {
      const response = await apiClient.get(`${this.REPORTS_URL}/daily-transactions/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching daily transaction report:', error);
      throw error;
    }
  }

  /**
   * Get transaction history with pagination
   */
  async getTransactionHistory(params: {
    date_from: string;
    date_to: string;
    page?: number;
    page_size?: number;
    client_code?: string;
    status?: string;
  }): Promise<PaginatedResponse<TransactionDetail>> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/history/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      throw error;
    }
  }

  /**
   * Get success rate statistics
   */
  async getSuccessRate(params: {
    date_from: string;
    date_to: string;
    granularity: 'hourly' | 'daily' | 'weekly' | 'monthly';
    client_code?: string;
  }): Promise<any> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/success-rate/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching success rate:', error);
      throw error;
    }
  }

  /**
   * Get failed transactions with detailed reasons
   */
  async getFailedTransactions(params: {
    date_from: string;
    date_to: string;
    client_code?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<TransactionDetail>> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/failed/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching failed transactions:', error);
      throw error;
    }
  }

  /**
   * Export transactions in various formats
   */
  async exportTransactions(params: {
    date_from: string;
    date_to: string;
    format: ExportFormat;
    client_code?: string;
    status?: string;
  }): Promise<Blob> {
    try {
      const response = await apiClient.post(`${this.BASE_URL}/export/`, params, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting transactions:', error);
      throw error;
    }
  }

  /**
   * Get duplicate transactions
   */
  async getDuplicateTransactions(params: {
    date_from: string;
    date_to: string;
    client_code?: string;
  }): Promise<any> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/duplicates/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching duplicate transactions:', error);
      throw error;
    }
  }

  /**
   * Validate transaction
   */
  async validateTransaction(txnId: string): Promise<any> {
    try {
      const response = await apiClient.post(`${this.BASE_URL}/validate/${txnId}/`);
      return response.data;
    } catch (error) {
      console.error('Error validating transaction:', error);
      throw error;
    }
  }

  /**
   * Get hourly transaction summary
   */
  async getHourlyTransactionSummary(params: {
    date: string;
    client_code?: string;
  }): Promise<any> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/hourly-summary/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching hourly summary:', error);
      throw error;
    }
  }

  /**
   * Get payment mode wise summary
   */
  async getPaymentModeSummary(params: {
    date_from: string;
    date_to: string;
    client_code?: string;
  }): Promise<any> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/payment-mode-summary/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching payment mode summary:', error);
      throw error;
    }
  }

  /**
   * Get transaction trends
   */
  async getTransactionTrends(params: {
    date_from: string;
    date_to: string;
    metric: 'count' | 'amount' | 'success_rate';
    granularity: 'hourly' | 'daily' | 'weekly' | 'monthly';
    client_code?: string;
  }): Promise<any> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/trends/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching transaction trends:', error);
      throw error;
    }
  }

  /**
   * Reconcile transactions
   */
  async reconcileTransactions(params: {
    date: string;
    client_code?: string;
  }): Promise<any> {
    try {
      const response = await apiClient.post(`${this.BASE_URL}/reconcile/`, params);
      return response.data;
    } catch (error) {
      console.error('Error reconciling transactions:', error);
      throw error;
    }
  }

  /**
   * Get transaction stats by merchant
   */
  async getMerchantTransactionStats(params: {
    date_from: string;
    date_to: string;
    client_code: string;
  }): Promise<any> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/merchant-stats/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching merchant stats:', error);
      throw error;
    }
  }
}

export default new TransactionService();