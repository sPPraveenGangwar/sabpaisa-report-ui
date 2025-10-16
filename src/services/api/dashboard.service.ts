import apiClient from '../../config/api.config';
import { DashboardMetrics, UserRole } from '../../types/api.types';

class DashboardService {
  private readonly BASE_URL = '/dashboard';

  /**
   * Get dashboard metrics based on user role
   */
  async getDashboardMetrics(role: UserRole, clientCode?: string): Promise<DashboardMetrics> {
    try {
      const endpoint = role === 'ADMIN' ? `${this.BASE_URL}/admin/` : `${this.BASE_URL}/merchant/`;
      const params = clientCode ? { client_code: clientCode } : {};
      const response = await apiClient.get(endpoint, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      throw error;
    }
  }

  /**
   * Get today's statistics
   */
  async getTodayStats(clientCode?: string): Promise<any> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/today-stats/`, {
        params: clientCode ? { client_code: clientCode } : {}
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching today stats:', error);
      throw error;
    }
  }

  /**
   * Get monthly statistics
   */
  async getMonthlyStats(clientCode?: string): Promise<any> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/monthly-stats/`, {
        params: clientCode ? { client_code: clientCode } : {}
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching monthly stats:', error);
      throw error;
    }
  }

  /**
   * Get real-time metrics (updates every 30 seconds)
   */
  async getRealTimeMetrics(clientCode?: string): Promise<any> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/realtime/`, {
        params: clientCode ? { client_code: clientCode } : {}
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching real-time metrics:', error);
      throw error;
    }
  }

  /**
   * Get payment mode distribution
   */
  async getPaymentModeDistribution(params: {
    period?: 'today' | 'week' | 'month';
    client_code?: string;
  }): Promise<any> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/payment-mode-distribution/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching payment mode distribution:', error);
      throw error;
    }
  }

  /**
   * Get hourly trend data
   */
  async getHourlyTrend(date?: string, clientCode?: string): Promise<any> {
    try {
      const params: any = {};
      if (date) params.date = date;
      if (clientCode) params.client_code = clientCode;

      const response = await apiClient.get(`${this.BASE_URL}/hourly-trend/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching hourly trend:', error);
      throw error;
    }
  }

  /**
   * Get recent transactions
   */
  async getRecentTransactions(params: {
    limit?: number;
    client_code?: string;
  }): Promise<any> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/recent-transactions/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
      throw error;
    }
  }

  /**
   * Get top merchants (Admin only)
   */
  async getTopMerchants(params: {
    period?: 'today' | 'week' | 'month';
    limit?: number;
  }): Promise<any> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/top-merchants/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching top merchants:', error);
      throw error;
    }
  }

  /**
   * Get alerts and notifications
   */
  async getAlerts(clientCode?: string): Promise<any> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/alerts/`, {
        params: clientCode ? { client_code: clientCode } : {}
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching alerts:', error);
      throw error;
    }
  }

  /**
   * Get quick stats summary
   */
  async getQuickStats(clientCode?: string): Promise<any> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/quick-stats/`, {
        params: clientCode ? { client_code: clientCode } : {}
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching quick stats:', error);
      throw error;
    }
  }
}

export default new DashboardService();