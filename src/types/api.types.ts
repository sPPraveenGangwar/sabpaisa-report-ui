// Common Types
export type ExportFormat = 'excel' | 'csv' | 'pdf';
export type UserRole = 'ADMIN' | 'MERCHANT';
export type TransactionStatus = 'SUCCESS' | 'FAILED' | 'PENDING' | 'CANCELLED';
export type PaymentMode = 'CREDIT_CARD' | 'DEBIT_CARD' | 'UPI' | 'NET_BANKING' | 'WALLET' | 'CASH' | 'OTHERS';
export type ReportType = 'transaction' | 'settlement' | 'refund' | 'chargeback' | 'reconciliation' | 'financial' | 'gst' | 'mis' | 'custom';

// Pagination Response
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
  page: number;
  page_size: number;
  total_pages: number;
}

// Transaction Types
export interface TransactionDetail {
  txn_id: string;
  client_txn_id?: string;
  client_code: string;
  client_name: string;
  trans_date: string;
  trans_time?: string;
  paid_amount: number;
  payee_name?: string;
  payee_email?: string;
  payee_mobile?: string;
  payment_mode: PaymentMode;
  status: TransactionStatus;
  status_code?: string;
  status_message?: string;
  bank_name?: string;
  bank_ref_no?: string;
  bank_message1?: string;
  bank_message2?: string;
  card_number?: string;
  card_type?: string;
  card_brand?: string;
  upi_id?: string;
  wallet_name?: string;
  settlement_date?: string;
  settlement_amount?: number;
  settlement_status?: string;
  settlement_utr?: string;
  refund_status?: string;
  refund_amount?: number;
  refund_date?: string;
  refund_reason?: string;
  commission_amount?: number;
  tax_amount?: number;
  net_amount?: number;
  created_at?: string;
  updated_at?: string;
  // Additional fields from database
  sabpaisa_txn_id?: string;
  program_id?: string;
  payment_option?: string;
  auth_code?: string;
  auth_status?: string;
  issuer_ref_no?: string;
  bin_number?: string;
  mandate_number?: string;
  account_holder_name?: string;
  ifsc_code?: string;
  merchant_order_id?: string;
  product_info?: string;
  additional_charges?: number;
  discount?: number;
  convenience_fee?: number;
  ip_address?: string;
  user_agent?: string;
  device_type?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  session_id?: string;
  risk_score?: number;
  fraud_status?: string;
  kyc_status?: string;
  remarks?: string;
}

export interface TransactionSearchRequest {
  search_query?: string;
  search_case?: 1 | 2 | 3 | 4 | 5 | 6;
  date_from?: string;
  date_to?: string;
  client_code?: string;
  status?: TransactionStatus;
  payment_mode?: PaymentMode;
  min_amount?: number;
  max_amount?: number;
  page?: number;
  page_size?: number;
}

export interface TransactionResponse {
  success: boolean;
  message: string;
  data: TransactionDetail | TransactionDetail[];
  metadata?: {
    total_count?: number;
    total_amount?: number;
    success_count?: number;
    failed_count?: number;
  };
}

// Settlement Types
export interface Settlement {
  id?: string;
  txn_id: string;
  client_txn_id?: string;
  client_code: string;
  client_name: string;
  trans_date: string;
  paid_amount: number;
  settlement_date?: string;
  settlement_amount: number;
  settlement_status: 'COMPLETED' | 'PENDING' | 'PROCESSING' | 'FAILED';
  settlement_utr?: string;
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  payment_mode: PaymentMode;
  commission_amount?: number;
  tax_amount?: number;
  net_amount?: number;
  tat_hours?: number;
  remarks?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SettlementResponse {
  success: boolean;
  message: string;
  data: Settlement | Settlement[];
  summary?: {
    total_amount: number;
    total_transactions: number;
    pending_amount: number;
    completed_amount: number;
    average_tat: number;
  };
}

// Refund Types
export interface RefundRequest {
  txn_id: string;
  refund_amount: number;
  refund_reason: string;
  refund_type: 'FULL' | 'PARTIAL';
  customer_notification?: boolean;
  remarks?: string;
}

export interface RefundResponse {
  id: string;
  txn_id: string;
  original_amount: number;
  refund_amount: number;
  refund_status: 'INITIATED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  refund_reason: string;
  refund_date?: string;
  refund_reference?: string;
  approved_by?: string;
  approved_date?: string;
  bank_ref_no?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
}

// Chargeback Types
export interface ChargebackResponse {
  id: string;
  txn_id: string;
  client_name: string;
  trans_date: string;
  chargeback_date: string;
  amount: number;
  reason: string;
  reason_code: string;
  status: 'INITIATED' | 'DISPUTED' | 'ACCEPTED' | 'REJECTED' | 'PENDING';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  due_date: string;
  payment_mode: string;
  card_number?: string;
  customer_name?: string;
  customer_email?: string;
  dispute_evidence?: string[];
  resolution_date?: string;
  resolution_remarks?: string;
  created_at: string;
  updated_at: string;
}

// Analytics Types
export interface AnalyticsMetric {
  label: string;
  value: number;
  change?: number;
  change_percentage?: number;
  trend?: 'up' | 'down' | 'stable';
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    fill?: boolean;
  }[];
}

export interface KPIData {
  totalRevenue: number;
  totalTransactions: number;
  successRate: number;
  avgTransactionValue: number;
  revenueGrowth?: number;
  transactionGrowth?: number;
  topMerchant?: string;
  peakHour?: string;
}

// Bank Integration Types
export interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  ifsc_code: string;
  account_type: 'CURRENT' | 'SAVINGS';
  account_holder: string;
  balance?: number;
  status: 'ACTIVE' | 'INACTIVE';
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export interface BankTransaction {
  id: string;
  account_id: string;
  transaction_type: 'CREDIT' | 'DEBIT';
  amount: number;
  balance_after: number;
  reference_number: string;
  description: string;
  transaction_date: string;
  value_date: string;
  channel?: string;
  remarks?: string;
}

// User & Auth Types
export interface User {
  id: string;
  login_master_id: string;
  username: string;
  email: string;
  role: UserRole;
  merchant_name?: string;
  client_code?: string;
  permissions?: string[];
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  login_master_id?: string;
  username?: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    access: string;
    refresh: string;
    user: User;
  };
}

// Dashboard Types
export interface DashboardMetrics {
  todayTransactions: number;
  todayRevenue: number;
  monthTransactions: number;
  monthRevenue: number;
  successRate: number;
  avgTransactionValue: number;
  pendingSettlements: number;
  pendingRefunds: number;
  activeChargebacks: number;
  topPaymentModes: {
    mode: string;
    count: number;
    amount: number;
  }[];
  hourlyTrend: {
    hour: string;
    count: number;
    amount: number;
  }[];
  recentTransactions: TransactionDetail[];
}

// Error Response
export interface ErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  error_code?: string;
  details?: string;
}

// File Upload Types
export interface FileUploadResponse {
  success: boolean;
  message: string;
  file_id?: string;
  file_url?: string;
  file_name?: string;
  file_size?: number;
}