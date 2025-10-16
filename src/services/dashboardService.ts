import apiClient from '../config/api.config';
import { format } from 'date-fns';

export interface DashboardStats {
  todayRevenue: number;
  totalTransactions: number;
  successRate: number;
  pendingSettlements: number;
  revenueChange: number;
  transactionChange: number;
  successRateChange: number;
  settlementChange: number;
}

export interface TransactionSummary {
  totalAmount: number;
  successCount: number;
  failedCount: number;
  pendingCount: number;
}

export interface PaymentMethodData {
  name: string;
  value: number;
  count: number;
}

export interface RecentTransaction {
  txn_id: string;
  client_txn_id?: string;
  payee_name?: string;
  payee_email?: string;
  payee_mob?: string;
  paid_amount: number;
  status: string;
  payment_mode: string;
  trans_date: string;
  is_settled: boolean;
}

export interface WeeklySalesData {
  date: string;
  amount: number;
  count: number;
}

export interface DashboardData {
  stats: DashboardStats;
  transactionSummary: TransactionSummary;
  recentTransactions: RecentTransaction[];
  paymentMethods: PaymentMethodData[];
  weeklySales: WeeklySalesData[];
  settlementStatus: {
    todaySettlement: number;
    pendingReview: number;
    processed: number;
  };
}

class DashboardService {
  // Get current date in YYYY-MM-DD format
  private getCurrentDate(): string {
    return format(new Date(), 'yyyy-MM-dd');
  }

  // Get date from 7 days ago
  private getWeekAgoDate(): string {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return format(date, 'yyyy-MM-dd');
  }

  // Fetch dashboard data for merchant
  async getMerchantDashboard(): Promise<DashboardData> {
    try {
      const currentDate = this.getCurrentDate();
      const weekAgoDate = this.getWeekAgoDate();

      // Fetch multiple endpoints in parallel - using correct API paths
      const [
        todayTransactions,
        weekTransactions,
        settlements
      ] = await Promise.allSettled([
        // Today's transactions - try admin-history first, then merchant-history
        apiClient.get('/transactions/admin-history/', {
          params: {
            date_from: currentDate,
            date_to: currentDate,
            page_size: 10000
          }
        }).catch(() =>
          apiClient.get('/transactions/merchant-history/', {
            params: {
              date_from: currentDate,
              date_to: currentDate,
              page_size: 10000
            }
          })
        ),
        // Week's transactions for trend
        apiClient.get('/transactions/admin-history/', {
          params: {
            date_from: weekAgoDate,
            date_to: currentDate,
            page_size: 10000
          }
        }).catch(() =>
          apiClient.get('/transactions/merchant-history/', {
            params: {
              date_from: weekAgoDate,
              date_to: currentDate,
              page_size: 10000
            }
          })
        ),
        // Settlement data
        apiClient.get('/settlements/settled-history/', {
          params: {
            date_from: currentDate,
            date_to: currentDate,
            use_settlement_date: true,
            page_size: 10000
          }
        })
      ]);

      // Process today's transactions
      let todayData = { results: [], count: 0 };
      if (todayTransactions.status === 'fulfilled') {
        todayData = todayTransactions.value.data;
      }

      // Process week's transactions
      let weekData = { results: [], count: 0 };
      if (weekTransactions.status === 'fulfilled') {
        weekData = weekTransactions.value.data;
      }

      // Calculate statistics
      const stats = this.calculateStats(todayData.results, weekData.results);
      const transactionSummary = this.calculateTransactionSummary(todayData.results);
      const paymentMethods = this.calculatePaymentMethods(todayData.results);
      const weeklySales = this.calculateWeeklySales(weekData.results);
      const recentTransactions = this.getRecentTransactions(todayData.results);

      // Process settlement data
      let settlementStatus = {
        todaySettlement: 0,
        pendingReview: 0,
        processed: 0
      };

      if (settlements.status === 'fulfilled' && settlements.value) {
        const settlementData = settlements.value.data;
        settlementStatus = this.processSettlements(settlementData);
      }

      return {
        stats,
        transactionSummary,
        recentTransactions,
        paymentMethods,
        weeklySales,
        settlementStatus
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Return default data on error
      return this.getDefaultDashboardData();
    }
  }

  // Calculate dashboard statistics
  private calculateStats(todayTransactions: any[], weekTransactions: any[]): DashboardStats {
    // Today's metrics
    const todayRevenue = todayTransactions.reduce((sum, t) => sum + (t.paid_amount || 0), 0);
    const totalTransactions = todayTransactions.length;
    const successTransactions = todayTransactions.filter(t => t.status === 'SUCCESS').length;
    const successRate = totalTransactions > 0 ? (successTransactions / totalTransactions) * 100 : 0;
    const pendingSettlements = todayTransactions
      .filter(t => !t.is_settled && t.status === 'SUCCESS')
      .reduce((sum, t) => sum + (t.paid_amount || 0), 0);

    // Yesterday's metrics for comparison
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = format(yesterday, 'yyyy-MM-dd');

    const yesterdayTransactions = weekTransactions.filter(t =>
      t.trans_date && t.trans_date.startsWith(yesterdayStr)
    );

    const yesterdayRevenue = yesterdayTransactions.reduce((sum, t) => sum + (t.paid_amount || 0), 0);
    const yesterdayCount = yesterdayTransactions.length;
    const yesterdaySuccess = yesterdayTransactions.filter(t => t.status === 'SUCCESS').length;
    const yesterdaySuccessRate = yesterdayCount > 0 ? (yesterdaySuccess / yesterdayCount) * 100 : 0;

    // Calculate changes
    const revenueChange = yesterdayRevenue > 0
      ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
      : 0;
    const transactionChange = yesterdayCount > 0
      ? ((totalTransactions - yesterdayCount) / yesterdayCount) * 100
      : 0;
    const successRateChange = successRate - yesterdaySuccessRate;

    return {
      todayRevenue,
      totalTransactions,
      successRate,
      pendingSettlements,
      revenueChange,
      transactionChange,
      successRateChange,
      settlementChange: 0 // Will be calculated from settlement API data
    };
  }

  // Calculate transaction summary
  private calculateTransactionSummary(transactions: any[]): TransactionSummary {
    return {
      totalAmount: transactions.reduce((sum, t) => sum + (t.paid_amount || 0), 0),
      successCount: transactions.filter(t => t.status === 'SUCCESS').length,
      failedCount: transactions.filter(t => t.status === 'FAILED').length,
      pendingCount: transactions.filter(t => t.status === 'PENDING').length
    };
  }

  // Calculate payment method distribution
  private calculatePaymentMethods(transactions: any[]): PaymentMethodData[] {
    const methodMap = new Map<string, { count: number; amount: number }>();

    transactions.forEach(t => {
      const method = t.payment_mode || 'UNKNOWN';
      const current = methodMap.get(method) || { count: 0, amount: 0 };
      methodMap.set(method, {
        count: current.count + 1,
        amount: current.amount + (t.paid_amount || 0)
      });
    });

    const total = transactions.length;
    const methods: PaymentMethodData[] = [];

    methodMap.forEach((data, method) => {
      methods.push({
        name: this.formatPaymentMethod(method),
        value: total > 0 ? Math.round((data.count / total) * 100) : 0,
        count: data.count
      });
    });

    // Sort by value descending
    return methods.sort((a, b) => b.value - a.value).slice(0, 4);
  }

  // Format payment method names
  private formatPaymentMethod(method: string): string {
    const methodMap: { [key: string]: string } = {
      'CC': 'Credit Card',
      'DC': 'Debit Card',
      'UPI': 'UPI',
      'NB': 'Net Banking',
      'WALLET': 'Wallet',
      'CARD': 'Card'
    };
    return methodMap[method] || method;
  }

  // Calculate weekly sales data
  private calculateWeeklySales(transactions: any[]): WeeklySalesData[] {
    const salesMap = new Map<string, { amount: number; count: number }>();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayName = days[date.getDay()];
      salesMap.set(dateStr, { amount: 0, count: 0 });
    }

    // Aggregate transactions by date
    transactions.forEach(t => {
      if (t.trans_date) {
        const dateStr = t.trans_date.substring(0, 10);
        const current = salesMap.get(dateStr);
        if (current) {
          current.amount += t.paid_amount || 0;
          current.count += 1;
        }
      }
    });

    // Convert to array
    const salesData: WeeklySalesData[] = [];
    salesMap.forEach((data, dateStr) => {
      const date = new Date(dateStr);
      salesData.push({
        date: days[date.getDay()],
        amount: data.amount,
        count: data.count
      });
    });

    return salesData;
  }

  // Get recent transactions (last 5)
  private getRecentTransactions(transactions: any[]): RecentTransaction[] {
    return transactions
      .sort((a, b) => {
        const dateA = new Date(a.trans_date || 0).getTime();
        const dateB = new Date(b.trans_date || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 5)
      .map(t => ({
        txn_id: t.txn_id || t.id,
        client_txn_id: t.client_txn_id,
        payee_name: t.payee_name || `${t.payee_fname || ''} ${t.payee_lname || ''}`.trim(),
        payee_email: t.payee_email,
        payee_mob: t.payee_mob,
        paid_amount: t.paid_amount || 0,
        status: t.status,
        payment_mode: t.payment_mode,
        trans_date: t.trans_date,
        is_settled: t.is_settled || false
      }));
  }

  // Process settlement data
  private processSettlements(settlementData: any): any {
    if (!settlementData || !settlementData.results) {
      return {
        todaySettlement: 0,
        pendingReview: 0,
        processed: 75
      };
    }

    const settlements = settlementData.results;
    const todaySettlement = settlements
      .filter((s: any) => s.status === 'COMPLETED')
      .reduce((sum: number, s: any) => sum + (s.amount || 0), 0);

    const pendingReview = settlements.filter((s: any) =>
      s.status === 'PENDING' || s.status === 'PROCESSING'
    ).length;

    const totalAmount = settlements.reduce((sum: number, s: any) => sum + (s.amount || 0), 0);
    const processedAmount = settlements
      .filter((s: any) => s.status === 'COMPLETED')
      .reduce((sum: number, s: any) => sum + (s.amount || 0), 0);

    const processed = totalAmount > 0 ? (processedAmount / totalAmount) * 100 : 0;

    return {
      todaySettlement,
      pendingReview,
      processed
    };
  }

  // Get default dashboard data when API fails
  private getDefaultDashboardData(): DashboardData {
    return {
      stats: {
        todayRevenue: 0,
        totalTransactions: 0,
        successRate: 0,
        pendingSettlements: 0,
        revenueChange: 0,
        transactionChange: 0,
        successRateChange: 0,
        settlementChange: 0
      },
      transactionSummary: {
        totalAmount: 0,
        successCount: 0,
        failedCount: 0,
        pendingCount: 0
      },
      recentTransactions: [],
      paymentMethods: [],
      weeklySales: [],
      settlementStatus: {
        todaySettlement: 0,
        pendingReview: 0,
        processed: 0
      }
    };
  }
}

export default new DashboardService();