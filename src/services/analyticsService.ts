import apiClient from '../config/api.config';
import { format, subDays, startOfDay, endOfDay, parseISO } from 'date-fns';
import existingAnalyticsService from './api/analytics.service';

export interface AnalyticsFilters {
  date_from: string;
  date_to: string;
  granularity?: 'hourly' | 'daily' | 'weekly' | 'monthly';
  client_code?: string;
  payment_mode?: string;
  page?: number;
  page_size?: number;
}

export interface AnalyticsKPIs {
  totalRevenue: number;
  totalTransactions: number;
  successRate: number;
  avgTransactionValue: number;
  revenueGrowth: number;
  transactionGrowth: number;
  peakHour: string;
  topMerchant: string;
  failureRate: number;
  pendingRate: number;
}

export interface TransactionTrend {
  date: string;
  revenue: number;
  transactions: number;
  success_rate: number;
  avg_value: number;
  success_count: number;
  failed_count: number;
  pending_count: number;
}

export interface PaymentModeDistribution {
  name: string;
  value: number;
  transactions: number;
  revenue: number;
  percentage: number;
}

export interface HourlyDistribution {
  hour: string;
  transactions: number;
  revenue: number;
  success_rate: number;
}

export interface GeographicData {
  name: string;
  value: number;
  transactions?: number;
  revenue?: number;
  children?: GeographicData[];
}

export interface MerchantPerformance {
  metric: string;
  [key: string]: number | string;
}

export interface ConversionFunnel {
  name: string;
  value: number;
  percentage?: number;
  fill?: string;
}

export interface StatusBreakdown {
  name: string;
  value: number;
  count: number;
  color: string;
}

export interface AnalyticsData {
  transactionTrends: TransactionTrend[];
  paymentModes: PaymentModeDistribution[];
  hourlyDistribution: HourlyDistribution[];
  geographicData: GeographicData[];
  merchantPerformance: MerchantPerformance[];
  conversionFunnel: ConversionFunnel[];
  statusBreakdown: StatusBreakdown[];
  kpis: AnalyticsKPIs;
  totalCount?: number;
  currentPage?: number;
}

class AnalyticsService {
  /**
   * Fetch comprehensive analytics data based on date range
   */
  async fetchAnalyticsData(filters: AnalyticsFilters): Promise<AnalyticsData> {
    try {
      // Disable analytics API for now since endpoints return 404
      const useAnalyticsAPI = false; // Disabled - endpoints don't exist

      if (useAnalyticsAPI) {
        try {
          // Fetch data from multiple analytics endpoints in parallel
          const [
            overview,
            paymentModeData,
            volumeData,
            revenueData,
            conversionData,
            currentPeriodData,
            previousPeriodData
          ] = await Promise.all([
            existingAnalyticsService.getAnalyticsOverview({
              date_from: filters.date_from,
              date_to: filters.date_to,
              client_code: filters.client_code
            }).catch(() => null),
            existingAnalyticsService.getPaymentModeAnalytics({
              date_from: filters.date_from,
              date_to: filters.date_to,
              client_code: filters.client_code
            }).catch(() => null),
            existingAnalyticsService.getVolumeAnalytics({
              date_from: filters.date_from,
              date_to: filters.date_to,
              granularity: filters.granularity || 'daily',
              client_code: filters.client_code
            }).catch(() => null),
            existingAnalyticsService.getRevenueAnalytics({
              date_from: filters.date_from,
              date_to: filters.date_to,
              granularity: (filters.granularity === 'hourly' ? 'daily' : filters.granularity) || 'daily',
              client_code: filters.client_code
            }).catch(() => null),
            existingAnalyticsService.getConversionFunnel({
              date_from: filters.date_from,
              date_to: filters.date_to,
              client_code: filters.client_code
            }).catch(() => null),
            this.fetchTransactionData(filters),
            this.fetchPreviousPeriodData(filters)
          ]);

          // If we got data from analytics endpoints, use it
          if (overview && overview.success) {
            return this.processAnalyticsAPIData(
              overview,
              paymentModeData,
              volumeData,
              revenueData,
              conversionData,
              currentPeriodData,
              previousPeriodData,
              filters
            );
          }
        } catch (error) {
          console.log('Analytics API failed, falling back to transaction data processing');
        }
      }

      // Fetch transactions data for the specified period with pagination
      const { transactions: currentPeriodData, totalCount } = await this.fetchTransactionData(filters);

      // Don't fetch previous period data to avoid duplicate API calls
      // Growth metrics will be calculated as 0 or skipped
      const previousPeriodData: any[] = [];

      // Process and calculate all analytics metrics from raw transaction data
      const kpis = this.calculateKPIs(currentPeriodData, previousPeriodData, totalCount);
      const transactionTrends = this.calculateTransactionTrends(currentPeriodData, filters);
      const paymentModes = this.calculatePaymentModeDistribution(currentPeriodData);
      const hourlyDistribution = this.calculateHourlyDistribution(currentPeriodData);
      const statusBreakdown = this.calculateStatusBreakdown(currentPeriodData);
      const geographicData = this.calculateGeographicDistribution(currentPeriodData);
      const merchantPerformance = this.calculateMerchantPerformance(currentPeriodData);
      const conversionFunnel = this.calculateConversionFunnel(currentPeriodData);

      return {
        kpis,
        transactionTrends,
        paymentModes,
        hourlyDistribution,
        statusBreakdown,
        geographicData,
        merchantPerformance,
        conversionFunnel,
        totalCount,
        currentPage: filters.page || 1
      };
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      throw error;
    }
  }

  /**
   * Fetch raw transaction data for the specified period - with pagination support
   */
  private async fetchTransactionData(filters: AnalyticsFilters): Promise<{ transactions: any[], totalCount: number }> {
    try {
      const params = {
        date_from: filters.date_from,
        date_to: filters.date_to,
        page_size: filters.page_size || 10000,
        page: filters.page || 1,
      };

      // Try admin endpoint first, then merchant endpoint
      let response;
      try {
        response = await apiClient.get('/transactions/admin-history/', { params });
      } catch (adminError: any) {
        // Handle rate limiting (429)
        if (adminError.response?.status === 429) {
          console.warn('Rate limited on admin endpoint. Please wait before retrying.');
          return []; // Return empty data when rate limited
        }

        if (adminError.response?.status === 403 || adminError.response?.status === 404) {
          // Fallback to merchant endpoint
          try {
            response = await apiClient.get('/transactions/merchant-history/', { params });
          } catch (merchantError: any) {
            // Handle rate limiting on merchant endpoint
            if (merchantError.response?.status === 429) {
              console.warn('Rate limited on merchant endpoint. Please wait before retrying.');
              return [];
            }
            // If both fail, try the generic endpoint as last resort
            try {
              response = await apiClient.get('/transactions/', { params });
            } catch (finalError: any) {
              if (finalError.response?.status === 429) {
                console.warn('Rate limited on all endpoints. Please wait before retrying.');
              }
              return [];
            }
          }
        } else {
          throw adminError;
        }
      }

      const transactions = response.data.results || [];
      const totalCount = response.data.count || 0;

      console.log(`📄 Fetched ${transactions.length} transactions (Page ${params.page}). Total available: ${totalCount}`);

      return { transactions, totalCount };
    } catch (error) {
      console.error('Error fetching transaction data:', error);
      return { transactions: [], totalCount: 0 };
    }
  }

  /**
   * Fetch data from the previous period for comparison
   */
  private async fetchPreviousPeriodData(filters: AnalyticsFilters): Promise<any[]> {
    const startDate = parseISO(filters.date_from);
    const endDate = parseISO(filters.date_to);
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    const previousStartDate = format(subDays(startDate, daysDiff), 'yyyy-MM-dd');
    const previousEndDate = format(subDays(endDate, daysDiff), 'yyyy-MM-dd');

    return this.fetchTransactionData({
      ...filters,
      date_from: previousStartDate,
      date_to: previousEndDate
    });
  }

  /**
   * Calculate Key Performance Indicators
   */
  private calculateKPIs(currentData: any[], previousData: any[], totalCount?: number): AnalyticsKPIs {
    // Current period metrics
    const totalRevenue = currentData.reduce((sum, t) => {
      const amount = this.getTransactionAmount(t);
      return sum + amount;
    }, 0);

    // Use current page data length (not total count)
    const totalTransactions = currentData.length;
    const successTransactions = currentData.filter(t => String(t.status).toUpperCase() === 'SUCCESS').length;
    const failedTransactions = currentData.filter(t => String(t.status).toUpperCase() === 'FAILED').length;
    const pendingTransactions = currentData.filter(t => String(t.status).toUpperCase() === 'PENDING').length;

    const successRate = totalTransactions > 0 ? (successTransactions / totalTransactions) * 100 : 0;
    const failureRate = totalTransactions > 0 ? (failedTransactions / totalTransactions) * 100 : 0;
    const pendingRate = totalTransactions > 0 ? (pendingTransactions / totalTransactions) * 100 : 0;
    const avgTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    // Previous period metrics for growth calculation
    const prevRevenue = previousData.reduce((sum, t) => sum + this.getTransactionAmount(t), 0);
    const prevTransactions = previousData.length;

    const revenueGrowth = prevRevenue > 0
      ? ((totalRevenue - prevRevenue) / prevRevenue) * 100
      : 0;
    const transactionGrowth = prevTransactions > 0
      ? ((totalTransactions - prevTransactions) / prevTransactions) * 100
      : 0;

    // Find peak hour
    const hourlyData = this.groupByHour(currentData);
    const peakHour = this.findPeakHour(hourlyData);

    // Find top merchant
    const topMerchant = this.findTopMerchant(currentData);

    return {
      totalRevenue,
      totalTransactions,
      successRate: Math.round(successRate * 10) / 10,
      avgTransactionValue: Math.round(avgTransactionValue),
      revenueGrowth: Math.round(revenueGrowth * 10) / 10,
      transactionGrowth: Math.round(transactionGrowth * 10) / 10,
      peakHour,
      topMerchant,
      failureRate: Math.round(failureRate * 10) / 10,
      pendingRate: Math.round(pendingRate * 10) / 10
    };
  }

  /**
   * Calculate transaction trends over time
   */
  private calculateTransactionTrends(data: any[], filters: AnalyticsFilters): TransactionTrend[] {
    const groupedData = this.groupByDate(data);
    const trends: TransactionTrend[] = [];

    // Generate dates for the period
    const startDate = parseISO(filters.date_from);
    const endDate = parseISO(filters.date_to);
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      const dayData = groupedData[dateStr] || [];

      const revenue = dayData.reduce((sum, t) => sum + this.getTransactionAmount(t), 0);
      const transactions = dayData.length;
      const successCount = dayData.filter(t => String(t.status).toUpperCase() === 'SUCCESS').length;
      const failedCount = dayData.filter(t => String(t.status).toUpperCase() === 'FAILED').length;
      const pendingCount = dayData.filter(t => String(t.status).toUpperCase() === 'PENDING').length;
      const successRate = transactions > 0 ? (successCount / transactions) * 100 : 0;
      const avgValue = transactions > 0 ? revenue / transactions : 0;

      trends.push({
        date: format(currentDate, 'MMM dd'),
        revenue,
        transactions,
        success_rate: Math.round(successRate * 10) / 10,
        avg_value: Math.round(avgValue),
        success_count: successCount,
        failed_count: failedCount,
        pending_count: pendingCount
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return trends;
  }

  /**
   * Calculate payment mode distribution
   */
  private calculatePaymentModeDistribution(data: any[]): PaymentModeDistribution[] {
    const modeMap = new Map<string, { count: number; revenue: number }>();

    data.forEach(t => {
      const mode = String(t.payment_mode || 'UNKNOWN').toUpperCase();
      const normalizedMode = this.normalizePaymentMode(mode);
      const current = modeMap.get(normalizedMode) || { count: 0, revenue: 0 };
      modeMap.set(normalizedMode, {
        count: current.count + 1,
        revenue: current.revenue + this.getTransactionAmount(t)
      });
    });

    const total = data.length;
    const distribution: PaymentModeDistribution[] = [];

    modeMap.forEach((value, mode) => {
      const percentage = total > 0 ? (value.count / total) * 100 : 0;
      distribution.push({
        name: mode,
        value: Math.round(percentage * 10) / 10,
        transactions: value.count,
        revenue: value.revenue,
        percentage
      });
    });

    return distribution.sort((a, b) => b.transactions - a.transactions);
  }

  /**
   * Calculate hourly distribution
   */
  private calculateHourlyDistribution(data: any[]): HourlyDistribution[] {
    const hourlyData = this.groupByHour(data);
    const distribution: HourlyDistribution[] = [];

    for (let hour = 0; hour < 24; hour++) {
      const hourStr = `${hour.toString().padStart(2, '0')}:00`;
      const hourTransactions = hourlyData[hour] || [];
      const revenue = hourTransactions.reduce((sum, t) => sum + this.getTransactionAmount(t), 0);
      const successCount = hourTransactions.filter(t => String(t.status).toUpperCase() === 'SUCCESS').length;
      const successRate = hourTransactions.length > 0
        ? (successCount / hourTransactions.length) * 100
        : 0;

      distribution.push({
        hour: hourStr,
        transactions: hourTransactions.length,
        revenue,
        success_rate: Math.round(successRate * 10) / 10
      });
    }

    return distribution;
  }

  /**
   * Calculate status breakdown
   */
  private calculateStatusBreakdown(data: any[]): StatusBreakdown[] {
    const statusMap = new Map<string, number>();

    data.forEach(t => {
      const status = String(t.status || 'UNKNOWN').toUpperCase();
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });

    const total = data.length;
    const breakdown: StatusBreakdown[] = [];

    const statusColors: { [key: string]: string } = {
      'SUCCESS': '#4caf50',
      'FAILED': '#f44336',
      'PENDING': '#ff9800',
      'ABORTED': '#9e9e9e',
      'CANCELLED': '#757575'
    };

    statusMap.forEach((count, status) => {
      const percentage = total > 0 ? (count / total) * 100 : 0;
      breakdown.push({
        name: status,
        value: Math.round(percentage * 10) / 10,
        count,
        color: statusColors[status] || '#bdbdbd'
      });
    });

    return breakdown.sort((a, b) => b.count - a.count);
  }

  /**
   * Calculate geographic distribution (simplified - using client data)
   */
  private calculateGeographicDistribution(data: any[]): GeographicData[] {
    // Group by state/city if available in the data
    // For now, return a simplified version based on available data
    const stateMap = new Map<string, { count: number; revenue: number }>();

    data.forEach(t => {
      const state = t.payee_state || t.state || 'Unknown';
      const current = stateMap.get(state) || { count: 0, revenue: 0 };
      stateMap.set(state, {
        count: current.count + 1,
        revenue: current.revenue + this.getTransactionAmount(t)
      });
    });

    const distribution: GeographicData[] = [];
    const total = data.length;

    stateMap.forEach((value, state) => {
      const percentage = total > 0 ? (value.count / total) * 100 : 0;
      distribution.push({
        name: state,
        value: Math.round(percentage * 10) / 10,
        transactions: value.count,
        revenue: value.revenue
      });
    });

    return distribution.sort((a, b) => (b.transactions || 0) - (a.transactions || 0)).slice(0, 10);
  }

  /**
   * Calculate merchant performance metrics
   */
  private calculateMerchantPerformance(data: any[]): MerchantPerformance[] {
    // Group by client/merchant
    const merchantMap = new Map<string, any[]>();

    data.forEach(t => {
      const merchant = t.client_name || t.client_code || 'Unknown';
      const current = merchantMap.get(merchant) || [];
      current.push(t);
      merchantMap.set(merchant, current);
    });

    // Get top 3 merchants by transaction volume
    const topMerchants = Array.from(merchantMap.entries())
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 3);

    // Calculate performance metrics
    const metrics = ['Revenue', 'Volume', 'Success Rate', 'Avg Value', 'Growth'];
    const performance: MerchantPerformance[] = [];

    metrics.forEach(metric => {
      const row: MerchantPerformance = { metric };

      topMerchants.forEach(([merchantName, transactions], index) => {
        const letter = String.fromCharCode(65 + index); // A, B, C
        let value = 0;

        switch (metric) {
          case 'Revenue':
            const totalRevenue = transactions.reduce((sum, t) => sum + this.getTransactionAmount(t), 0);
            const maxRevenue = Math.max(...topMerchants.map(([_, txns]) =>
              txns.reduce((sum, t) => sum + this.getTransactionAmount(t), 0)
            ));
            value = maxRevenue > 0 ? (totalRevenue / maxRevenue) * 100 : 0;
            break;
          case 'Volume':
            const maxVolume = Math.max(...topMerchants.map(([_, txns]) => txns.length));
            value = maxVolume > 0 ? (transactions.length / maxVolume) * 100 : 0;
            break;
          case 'Success Rate':
            const successCount = transactions.filter(t => String(t.status).toUpperCase() === 'SUCCESS').length;
            value = transactions.length > 0 ? (successCount / transactions.length) * 100 : 0;
            break;
          case 'Avg Value':
            const avgValue = transactions.reduce((sum, t) => sum + this.getTransactionAmount(t), 0) / transactions.length;
            const maxAvg = Math.max(...topMerchants.map(([_, txns]) =>
              txns.reduce((sum, t) => sum + this.getTransactionAmount(t), 0) / txns.length
            ));
            value = maxAvg > 0 ? (avgValue / maxAvg) * 100 : 0;
            break;
          case 'Growth':
            // Growth cannot be calculated without historical data
            value = 0;
            break;
        }

        row[letter] = Math.round(value);
        row.fullMark = 100;
      });

      performance.push(row);
    });

    return performance;
  }

  /**
   * Calculate conversion funnel
   */
  private calculateConversionFunnel(data: any[]): ConversionFunnel[] {
    const total = data.length;
    const initiated = data.filter(t => t.trans_init_date).length;
    const completed = data.filter(t => t.trans_complete_date).length;
    const successful = data.filter(t => String(t.status).toUpperCase() === 'SUCCESS').length;

    const funnel: ConversionFunnel[] = [
      {
        name: 'Initiated',
        value: total,
        percentage: 100,
        fill: 'rgba(33, 150, 243, 0.9)'
      },
      {
        name: 'Processing',
        value: initiated,
        percentage: total > 0 ? (initiated / total) * 100 : 0,
        fill: 'rgba(33, 150, 243, 0.7)'
      },
      {
        name: 'Completed',
        value: completed,
        percentage: total > 0 ? (completed / total) * 100 : 0,
        fill: 'rgba(33, 150, 243, 0.5)'
      },
      {
        name: 'Successful',
        value: successful,
        percentage: total > 0 ? (successful / total) * 100 : 0,
        fill: 'rgba(33, 150, 243, 0.3)'
      }
    ];

    return funnel;
  }

  /**
   * Process data from Analytics API endpoints
   */
  private processAnalyticsAPIData(
    overview: any,
    paymentModeData: any,
    volumeData: any,
    revenueData: any,
    conversionData: any,
    currentPeriodData: any[],
    previousPeriodData: any[],
    filters: AnalyticsFilters
  ): AnalyticsData {
    // Extract KPIs from overview or calculate from transaction data
    const kpis = overview?.data ? {
      totalRevenue: overview.data.total_revenue || 0,
      totalTransactions: overview.data.total_transactions || 0,
      successRate: overview.data.success_rate || 0,
      avgTransactionValue: overview.data.avg_transaction_value || 0,
      revenueGrowth: overview.data.revenue_growth || 0,
      transactionGrowth: overview.data.transaction_growth || 0,
      peakHour: overview.data.peak_hour || '',
      topMerchant: overview.data.top_merchant || '',
      failureRate: overview.data.failure_rate || 0,
      pendingRate: overview.data.pending_rate || 0
    } : this.calculateKPIs(currentPeriodData, previousPeriodData);

    // Process payment mode distribution
    const paymentModes = paymentModeData?.data?.payment_modes ||
      this.calculatePaymentModeDistribution(currentPeriodData);

    // Process volume/trends data
    const transactionTrends = volumeData?.data?.trends ||
      revenueData?.data?.trends ||
      this.calculateTransactionTrends(currentPeriodData, filters);

    // Process hourly distribution
    const hourlyDistribution = volumeData?.data?.hourly_distribution ||
      this.calculateHourlyDistribution(currentPeriodData);

    // Process conversion funnel
    const conversionFunnel = conversionData?.data?.funnel ||
      this.calculateConversionFunnel(currentPeriodData);

    // Calculate remaining metrics from transaction data
    const statusBreakdown = this.calculateStatusBreakdown(currentPeriodData);
    const geographicData = this.calculateGeographicDistribution(currentPeriodData);
    const merchantPerformance = this.calculateMerchantPerformance(currentPeriodData);

    return {
      kpis,
      transactionTrends,
      paymentModes,
      hourlyDistribution,
      statusBreakdown,
      geographicData,
      merchantPerformance,
      conversionFunnel
    };
  }

  // Helper methods

  private getTransactionAmount(transaction: any): number {
    const possibleFields = ['paid_amount', 'amount', 'payee_amount', 'transaction_amount'];
    for (const field of possibleFields) {
      const value = transaction[field];
      if (value !== undefined && value !== null && value !== '') {
        const amount = parseFloat(String(value).replace(/,/g, ''));
        if (!isNaN(amount)) return amount;
      }
    }
    return 0;
  }

  private normalizePaymentMode(mode: string): string {
    const modeMap: { [key: string]: string } = {
      'CC': 'Credit Card',
      'DC': 'Debit Card',
      'CREDIT_CARD': 'Credit Card',
      'DEBIT_CARD': 'Debit Card',
      'UPI': 'UPI',
      'BHIM_UPI_QR': 'UPI',
      'NET_BANKING': 'Net Banking',
      'NB': 'Net Banking',
      'WALLET': 'Wallet',
      'CARD': 'Card'
    };
    return modeMap[mode] || mode;
  }

  private groupByDate(data: any[]): { [key: string]: any[] } {
    const grouped: { [key: string]: any[] } = {};
    data.forEach(t => {
      if (t.trans_date) {
        const dateStr = String(t.trans_date).substring(0, 10);
        if (!grouped[dateStr]) grouped[dateStr] = [];
        grouped[dateStr].push(t);
      }
    });
    return grouped;
  }

  private groupByHour(data: any[]): { [key: number]: any[] } {
    const grouped: { [key: number]: any[] } = {};
    data.forEach(t => {
      if (t.trans_date) {
        try {
          const date = parseISO(String(t.trans_date));
          const hour = date.getHours();
          if (!grouped[hour]) grouped[hour] = [];
          grouped[hour].push(t);
        } catch (error) {
          // Skip invalid dates
        }
      }
    });
    return grouped;
  }

  private findPeakHour(hourlyData: { [key: number]: any[] }): string {
    let maxTransactions = 0;
    let peakHour = 0;

    Object.entries(hourlyData).forEach(([hour, transactions]) => {
      if (transactions.length > maxTransactions) {
        maxTransactions = transactions.length;
        peakHour = parseInt(hour);
      }
    });

    const nextHour = (peakHour + 1) % 24;
    return `${peakHour.toString().padStart(2, '0')}:00 - ${nextHour.toString().padStart(2, '0')}:00`;
  }

  private findTopMerchant(data: any[]): string {
    const merchantMap = new Map<string, number>();

    data.forEach(t => {
      const merchant = t.client_name || t.client_code || 'Unknown';
      merchantMap.set(merchant, (merchantMap.get(merchant) || 0) + 1);
    });

    let topMerchant = '';
    let maxTransactions = 0;

    merchantMap.forEach((count, merchant) => {
      if (count > maxTransactions) {
        maxTransactions = count;
        topMerchant = merchant;
      }
    });

    return topMerchant || 'N/A';
  }
}

export default new AnalyticsService();