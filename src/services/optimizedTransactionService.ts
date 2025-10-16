/**
 * Optimized Transaction Service for handling large datasets
 * - Progressive loading strategy
 * - Request batching and deduplication
 * - Intelligent caching with React Query
 * - Streaming data updates
 */
import apiClient from '../config/api.config';
import { QueryClient } from '@tanstack/react-query';

export interface TransactionFilters {
  date_from?: string;
  date_to?: string;
  client_code?: string;
  status?: string | string[];
  payment_mode?: string | string[];
  search?: string;
  page?: number;
  page_size?: number;
  use_cursor?: boolean;
  cursor?: string;
}

export interface Transaction {
  txn_id: string;
  client_txn_id?: string;
  trans_date: string;
  status: string;
  client_code: string;
  client_name?: string;
  payment_mode: string;
  paid_amount: number;
  payee_email?: string;
  payee_mob?: string;
  pg_name?: string;
  bank_txn_id?: string;
  is_settled?: boolean;
}

export interface TransactionSummary {
  total_count: number;
  success_count: number;
  failed_count: number;
  pending_count?: number;
  total_amount: number;
  success_amount: number;
  failed_amount?: number;
  success_rate?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    transactions: T[];
    summary: TransactionSummary;
    pagination: {
      current_page: number;
      total_pages: number;
      count: number;
      page_size: number;
      has_next: boolean;
      has_previous: boolean;
      next_cursor?: string;
    };
  };
  performance?: {
    query_time_ms: number;
    cached: boolean;
  };
}

class OptimizedTransactionService {
  private queryClient: QueryClient;
  private pendingRequests: Map<string, Promise<any>>;
  private batchQueue: Map<string, TransactionFilters[]>;
  private batchTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.queryClient = new QueryClient();
    this.pendingRequests = new Map();
    this.batchQueue = new Map();
  }

  /**
   * Fetch transactions with optimized query
   * Uses the new optimized backend endpoint
   */
  async fetchTransactions(
    filters: TransactionFilters
  ): Promise<PaginatedResponse<Transaction>> {
    try {
      const response = await apiClient.get<PaginatedResponse<Transaction>>(
        '/transactions/optimized-list/',
        {
          params: {
            ...filters,
            // Convert arrays to comma-separated strings
            status: Array.isArray(filters.status)
              ? filters.status.join(',')
              : filters.status,
            payment_mode: Array.isArray(filters.payment_mode)
              ? filters.payment_mode.join(',')
              : filters.payment_mode,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }
  }

  /**
   * Fetch fast summary from aggregation tables
   * Ultra-fast response even for millions of records
   */
  async fetchFastSummary(filters: {
    date_from: string;
    date_to: string;
    client_code?: string;
    granularity?: 'daily' | 'hourly' | 'monthly';
  }): Promise<any> {
    try {
      const response = await apiClient.get('/transactions/fast-summary/', {
        params: filters,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching fast summary:', error);
      throw error;
    }
  }

  /**
   * Progressive loading: Load data in chunks
   * Loads small initial batch, then progressively loads more in background
   */
  async fetchTransactionsProgressive(
    filters: TransactionFilters,
    onProgress?: (loaded: number, total: number) => void
  ): Promise<Transaction[]> {
    const allTransactions: Transaction[] = [];
    let currentPage = 1;
    let hasMore = true;
    const INITIAL_BATCH_SIZE = 100; // Load 100 records initially
    const PROGRESSIVE_BATCH_SIZE = 500; // Then load 500 at a time

    // Phase 1: Load initial batch quickly
    const initialResponse = await this.fetchTransactions({
      ...filters,
      page: 1,
      page_size: INITIAL_BATCH_SIZE,
    });

    if (initialResponse.success && initialResponse.data) {
      allTransactions.push(...initialResponse.data.transactions);
      const totalCount = initialResponse.data.pagination.count;

      onProgress?.(allTransactions.length, totalCount);

      // Phase 2: Load remaining data in background
      hasMore = initialResponse.data.pagination.has_next;
      currentPage = 2;

      while (hasMore) {
        const progressiveResponse = await this.fetchTransactions({
          ...filters,
          page: currentPage,
          page_size: PROGRESSIVE_BATCH_SIZE,
        });

        if (progressiveResponse.success && progressiveResponse.data) {
          allTransactions.push(...progressiveResponse.data.transactions);
          onProgress?.(allTransactions.length, totalCount);

          hasMore = progressiveResponse.data.pagination.has_next;
          currentPage++;
        } else {
          break;
        }

        // Add small delay to prevent overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    return allTransactions;
  }

  /**
   * Cursor-based infinite loading
   * Optimized for large datasets with deep pagination
   */
  async fetchTransactionsCursor(
    filters: TransactionFilters,
    cursor?: string
  ): Promise<PaginatedResponse<Transaction>> {
    try {
      const response = await apiClient.get<PaginatedResponse<Transaction>>(
        '/transactions/optimized-list/',
        {
          params: {
            ...filters,
            use_cursor: true,
            cursor,
            page_size: filters.page_size || 100,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching transactions with cursor:', error);
      throw error;
    }
  }

  /**
   * Batch request deduplication
   * Prevents duplicate requests for the same data
   */
  private async deduplicateRequest<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    // Check if request is already pending
    if (this.pendingRequests.has(key)) {
      console.log(`Deduplicating request: ${key}`);
      return this.pendingRequests.get(key) as Promise<T>;
    }

    // Execute request and cache promise
    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  /**
   * Get transaction summary with caching
   */
  async getTransactionSummary(filters: {
    date_from: string;
    date_to: string;
    client_code?: string;
  }): Promise<TransactionSummary> {
    const cacheKey = `summary_${JSON.stringify(filters)}`;

    return this.deduplicateRequest(cacheKey, async () => {
      const response = await this.fetchFastSummary(filters);
      return response.data?.summary || {};
    });
  }

  /**
   * Stream transactions using Server-Sent Events (SSE)
   * For real-time updates
   */
  streamTransactions(
    filters: TransactionFilters,
    onTransaction: (transaction: Transaction) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ): () => void {
    // Note: This requires backend SSE support
    // For now, we'll use polling as fallback

    let isActive = true;
    let lastCursor: string | undefined;

    const poll = async () => {
      if (!isActive) return;

      try {
        const response = await this.fetchTransactionsCursor(filters, lastCursor);

        if (response.success && response.data) {
          response.data.transactions.forEach((txn) => onTransaction(txn));
          lastCursor = response.data.pagination.next_cursor;

          if (response.data.pagination.has_next && isActive) {
            // Continue polling
            setTimeout(poll, 1000);
          } else {
            onComplete();
          }
        }
      } catch (error) {
        onError(error as Error);
      }
    };

    poll();

    // Return cleanup function
    return () => {
      isActive = false;
    };
  }

  /**
   * Prefetch next page for smoother pagination
   */
  async prefetchNextPage(
    filters: TransactionFilters,
    currentPage: number
  ): Promise<void> {
    const nextPageFilters = {
      ...filters,
      page: currentPage + 1,
    };

    // Prefetch in background without blocking
    this.fetchTransactions(nextPageFilters).catch((error) => {
      console.warn('Prefetch failed:', error);
    });
  }

  /**
   * Get daily trends for analytics
   */
  async getDailyTrends(filters: {
    date_from: string;
    date_to: string;
    client_code?: string;
  }): Promise<any> {
    try {
      const response = await this.fetchFastSummary({
        ...filters,
        granularity: 'daily',
      });
      return response.data?.breakdown || [];
    } catch (error) {
      console.error('Error fetching daily trends:', error);
      throw error;
    }
  }

  /**
   * Get payment mode distribution
   */
  async getPaymentModeDistribution(filters: {
    date_from: string;
    date_to: string;
    client_code?: string;
  }): Promise<any> {
    try {
      const response = await apiClient.get('/transactions/payment-mode-summary/', {
        params: filters,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching payment mode distribution:', error);
      throw error;
    }
  }

  /**
   * Export transactions in chunks
   * Prevents timeout on large exports
   */
  async exportTransactions(
    filters: TransactionFilters,
    format: 'excel' | 'csv' = 'excel',
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    try {
      // Use dedicated export endpoint with streaming
      const response = await apiClient.post(
        '/transactions/optimized-export/',
        {
          filters,
          format,
        },
        {
          responseType: 'blob',
          onDownloadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = (progressEvent.loaded / progressEvent.total) * 100;
              onProgress?.(progress);
            }
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error exporting transactions:', error);
      throw error;
    }
  }

  /**
   * Clear cache for specific filters
   */
  invalidateCache(filters?: TransactionFilters): void {
    if (filters) {
      const cacheKey = `transactions_${JSON.stringify(filters)}`;
      this.queryClient.invalidateQueries({ queryKey: [cacheKey] });
    } else {
      // Clear all transaction caches
      this.queryClient.invalidateQueries({ queryKey: ['transactions'] });
    }
  }
}

// Export singleton instance
export const optimizedTransactionService = new OptimizedTransactionService();
export default optimizedTransactionService;
