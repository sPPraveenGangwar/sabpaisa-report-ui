import apiClient from '../../config/api.config';
import { ExportFormat } from '../../types/api.types';

class AnalyticsService {
  private readonly BASE_URL = '/analytics';
  private readonly REPORTS_URL = '/reports';

  /**
   * Get comprehensive analytics overview
   */
  async getAnalyticsOverview(params: {
    date_from: string;
    date_to: string;
    client_code?: string;
  }): Promise<any> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/overview/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching analytics overview:', error);
      throw error;
    }
  }

  /**
   * Get payment mode analytics
   */
  async getPaymentModeAnalytics(params: {
    date_from: string;
    date_to: string;
    client_code?: string;
    group_by?: 'day' | 'week' | 'month';
  }): Promise<any> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/payment-modes/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching payment mode analytics:', error);
      throw error;
    }
  }

  /**
   * Get transaction volume analytics
   */
  async getVolumeAnalytics(params: {
    date_from: string;
    date_to: string;
    granularity: 'hourly' | 'daily' | 'weekly' | 'monthly';
    client_code?: string;
  }): Promise<any> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/volume/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching volume analytics:', error);
      throw error;
    }
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(params: {
    date_from: string;
    date_to: string;
    granularity: 'daily' | 'weekly' | 'monthly';
    client_code?: string;
  }): Promise<any> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/revenue/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching revenue analytics:', error);
      throw error;
    }
  }

  /**
   * Get conversion funnel analytics
   */
  async getConversionFunnel(params: {
    date_from: string;
    date_to: string;
    client_code?: string;
  }): Promise<any> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/conversion-funnel/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching conversion funnel:', error);
      throw error;
    }
  }

  /**
   * Get geographic distribution
   */
  async getGeographicDistribution(params: {
    date_from: string;
    date_to: string;
    client_code?: string;
  }): Promise<any> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/geographic/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching geographic distribution:', error);
      throw error;
    }
  }

  /**
   * Get merchant performance metrics
   */
  async getMerchantPerformance(params: {
    date_from: string;
    date_to: string;
    client_code?: string;
    top_n?: number;
  }): Promise<any> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/merchant-performance/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching merchant performance:', error);
      throw error;
    }
  }

  /**
   * Get bank performance analytics
   */
  async getBankPerformance(params: {
    date_from: string;
    date_to: string;
    client_code?: string;
  }): Promise<any> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/bank-performance/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching bank performance:', error);
      throw error;
    }
  }

  /**
   * Get failure reason analytics
   */
  async getFailureAnalytics(params: {
    date_from: string;
    date_to: string;
    client_code?: string;
    payment_mode?: string;
  }): Promise<any> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/failure-reasons/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching failure analytics:', error);
      throw error;
    }
  }

  /**
   * Get hourly transaction pattern
   */
  async getHourlyPattern(params: {
    date_from: string;
    date_to: string;
    client_code?: string;
  }): Promise<any> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/hourly-pattern/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching hourly pattern:', error);
      throw error;
    }
  }

  /**
   * Get customer behavior analytics
   */
  async getCustomerBehavior(params: {
    date_from: string;
    date_to: string;
    client_code?: string;
  }): Promise<any> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/customer-behavior/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching customer behavior:', error);
      throw error;
    }
  }

  /**
   * Get comparative analytics
   */
  async getComparativeAnalytics(params: {
    date_from: string;
    date_to: string;
    compare_date_from: string;
    compare_date_to: string;
    metrics: string[];
    client_code?: string;
  }): Promise<any> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/comparative/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching comparative analytics:', error);
      throw error;
    }
  }

  /**
   * Get predictive analytics
   */
  async getPredictiveAnalytics(params: {
    date_from: string;
    date_to: string;
    prediction_days: number;
    client_code?: string;
  }): Promise<any> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/predictive/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching predictive analytics:', error);
      throw error;
    }
  }

  /**
   * Get real-time analytics dashboard data
   */
  async getRealTimeAnalytics(params: {
    client_code?: string;
  }): Promise<any> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/realtime/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching real-time analytics:', error);
      throw error;
    }
  }

  /**
   * Export analytics report
   */
  async exportAnalyticsReport(params: {
    date_from: string;
    date_to: string;
    report_type: 'overview' | 'detailed' | 'executive';
    format: ExportFormat;
    client_code?: string;
  }): Promise<Blob> {
    try {
      const response = await apiClient.post(`${this.BASE_URL}/export/`, params, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting analytics report:', error);
      throw error;
    }
  }
}

export default new AnalyticsService();