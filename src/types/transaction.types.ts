export interface Transaction {
  txn_id: string;
  client_txn_id: string;
  client_code: string;
  client_name: string;
  client_id?: number;
  act_amount?: number;
  paid_amount: number;
  payee_amount?: number;
  settlement_amount?: number;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'ABORTED';
  payment_mode: 'UPI' | 'CARD' | 'NET_BANKING' | 'WALLET' | 'CC' | 'DC' | 'NB' | 'Credit Card' | 'BHIM UPI QR' | 'Rupay Card' | 'Debit Card' | 'Net Banking' | 'Wallet' | string;
  payment_mode_id?: number;
  trans_date: string;
  trans_complete_date?: string;
  trans_init_date?: string;
  payee_name?: string;
  payee_email?: string;
  payee_mob?: string;
  payee_first_name?: string;
  payee_lst_name?: string;
  payee_address?: string;
  payee_city?: string;
  payee_state?: string;
  payee_pincode?: string;
  pg_name?: string;
  pg_txn_id?: string;
  pg_response_code?: string;
  bank_txn_id?: string;
  bank_name?: string;
  bank_message?: string;
  bank_status?: string;
  auth_code?: string;
  arn?: string;
  card_brand?: string;
  vpa?: string;
  is_settled?: boolean;
  settlement_date?: string;
  settlement_status?: 'COMPLETED' | 'PENDING' | 'PROCESSING' | 'FAILED';
  settlement_utr?: string;
  convcharges?: number;
  gst?: number;
  refund_amount?: number;
  charge_back_amount?: number;
  device_name?: string;
  browser_details?: string;
  client_request_ip?: string;
  channel_id?: string;
  business_ctg_code?: string;
  referral_code?: string;
}

export interface TransactionFilter {
  date_from?: string;
  date_to?: string;
  status?: string[];
  payment_mode?: string[];
  min_amount?: number;
  max_amount?: number;
  search?: string;
  client_txn_id?: string;
  payee_mobile?: string;
  payee_email?: string;
  client_code?: string;
  settlement_status?: string;
  page?: number;
  page_size?: number;
  order_by?: string;
}

export interface TransactionResponse {
  count: number;
  total_pages: number;
  current_page: number;
  next: string | null;
  previous: string | null;
  page_size: number;
  results: Transaction[];
}

export interface TransactionSummary {
  total_transactions: number;
  successful_transactions: number;
  failed_transactions: number;
  pending_transactions?: number;
  total_amount: number;
  successful_amount?: number;
  failed_amount?: number;
  average_transaction_amount: number;
  success_rate: number;
  payment_mode_distribution?: {
    [key: string]: number;
  };
}

export interface Settlement {
  txn_id: string;
  client_txn_id: string;
  client_code: string;
  client_name: string;
  paid_amount: number;
  settlement_amount: number;
  effective_settlement_amount?: number;
  settlement_date: string;
  settlement_status: 'COMPLETED' | 'PENDING' | 'FAILED';
  settlement_by?: string;
  settlement_bank_ref?: string;
  settlement_utr: string;
  trans_date: string;
  payment_mode: string;
  status: string;
}

export interface Refund {
  refund_id?: string;
  txn_id: string;
  original_txn_id?: string;
  client_code: string;
  client_name?: string;
  original_amount: number;
  refund_amount: number;
  refunded_amount?: number;
  refund_type?: 'FULL' | 'PARTIAL';
  refund_status: string;
  refund_status_code?: string;
  refund_initiated_date?: string;
  refund_processed_date?: string;
  refund_completed_date?: string;
  refund_reason?: string;
  refund_message?: string;
  refund_request_from?: string;
  refund_method?: string;
  refund_reference?: string;
  refund_track_id?: string;
}

export interface Chargeback {
  chargeback_id?: string;
  txn_id: string;
  original_txn_id?: string;
  client_code: string;
  client_name?: string;
  paid_amount: number;
  charge_back_amount: number;
  charge_back_debit_amount?: number;
  charge_back_date?: string;
  charge_back_status: 'DISPUTED' | 'RESOLVED' | 'PENDING' | 'LOST';
  charge_back_remarks?: string;
  dispute_reason?: string;
  dispute_code?: string;
  card_network?: string;
  liability?: 'MERCHANT' | 'BANK' | 'PAYMENT_GATEWAY';
  due_date?: string;
  arn?: string;
  is_charge_back?: boolean;
}