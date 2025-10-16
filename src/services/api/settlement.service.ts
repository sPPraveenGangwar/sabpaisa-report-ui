import apiClient from '../../config/api.config';
import {
  Settlement,
  SettlementResponse,
  RefundRequest,
  RefundResponse,
  ChargebackResponse,
  PaginatedResponse,
  ExportFormat
} from '../../types/api.types';

class SettlementService {
  private readonly BASE_URL = '/settlements';
  private readonly REFUND_URL = '/refunds';
  private readonly CHARGEBACK_URL = '/chargebacks';

  /**
   * Get settled transaction history
   */
  async getSettledHistory(params: {
    date_from: string;
    date_to: string;
    settlement_status?: 'ALL' | 'COMPLETED' | 'PENDING' | 'PROCESSING' | 'FAILED';
    use_settlement_date?: boolean;
    client_code?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<Settlement>> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/settled-history/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching settled history:', error);
      throw error;
    }
  }

  /**
   * Get pending settlements
   */
  async getPendingSettlements(params: {
    client_code?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<Settlement>> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/pending/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching pending settlements:', error);
      throw error;
    }
  }

  /**
   * Get settlement summary
   */
  async getSettlementSummary(params: {
    date_from: string;
    date_to: string;
    client_code?: string;
  }): Promise<any> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/summary/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching settlement summary:', error);
      throw error;
    }
  }

  /**
   * Process settlement
   */
  async processSettlement(settlementData: {
    txn_ids: string[];
    settlement_date: string;
    settlement_amount: number;
    settlement_utr?: string;
    remarks?: string;
  }): Promise<SettlementResponse> {
    try {
      const response = await apiClient.post(`${this.BASE_URL}/process/`, settlementData);
      return response.data;
    } catch (error) {
      console.error('Error processing settlement:', error);
      throw error;
    }
  }

  /**
   * Export settled transactions
   */
  async exportSettledTransactions(params: {
    date_from: string;
    date_to: string;
    format: ExportFormat;
    settlement_status?: string;
    client_code?: string;
  }): Promise<Blob> {
    try {
      const response = await apiClient.post(`${this.BASE_URL}/settled-excel/`, params, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting settled transactions:', error);
      throw error;
    }
  }

  /**
   * Get refund transaction history
   */
  async getRefundHistory(params: {
    date_from: string;
    date_to: string;
    refund_status?: 'ALL' | 'INITIATED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    client_code?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<RefundResponse>> {
    try {
      const response = await apiClient.get(`${this.REFUND_URL}/history/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching refund history:', error);
      throw error;
    }
  }

  /**
   * Initiate refund
   */
  async initiateRefund(refundData: RefundRequest): Promise<RefundResponse> {
    try {
      const response = await apiClient.post(`${this.REFUND_URL}/initiate/`, refundData);
      return response.data;
    } catch (error) {
      console.error('Error initiating refund:', error);
      throw error;
    }
  }

  /**
   * Process refund
   */
  async processRefund(refundId: string, action: 'approve' | 'reject', remarks?: string): Promise<RefundResponse> {
    try {
      const response = await apiClient.post(`${this.REFUND_URL}/process/${refundId}/`, {
        action,
        remarks
      });
      return response.data;
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  }

  /**
   * Get refund status
   */
  async getRefundStatus(refundId: string): Promise<RefundResponse> {
    try {
      const response = await apiClient.get(`${this.REFUND_URL}/status/${refundId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching refund status:', error);
      throw error;
    }
  }

  /**
   * Export refund transactions
   */
  async exportRefunds(params: {
    date_from: string;
    date_to: string;
    format: ExportFormat;
    refund_status?: string;
    client_code?: string;
  }): Promise<Blob> {
    try {
      const response = await apiClient.post(`${this.REFUND_URL}/export/`, params, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting refunds:', error);
      throw error;
    }
  }

  /**
   * Get chargeback list
   */
  async getChargebacks(params: {
    date_from: string;
    date_to: string;
    status?: 'ALL' | 'INITIATED' | 'DISPUTED' | 'ACCEPTED' | 'REJECTED' | 'PENDING';
    client_code?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<ChargebackResponse>> {
    try {
      const response = await apiClient.get(`${this.CHARGEBACK_URL}/list/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching chargebacks:', error);
      throw error;
    }
  }

  /**
   * Dispute chargeback
   */
  async disputeChargeback(chargebackId: string, disputeData: {
    dispute_reason: string;
    evidence_documents?: File[];
    remarks?: string;
  }): Promise<ChargebackResponse> {
    try {
      const formData = new FormData();
      formData.append('dispute_reason', disputeData.dispute_reason);
      if (disputeData.remarks) {
        formData.append('remarks', disputeData.remarks);
      }
      if (disputeData.evidence_documents) {
        disputeData.evidence_documents.forEach((file, index) => {
          formData.append(`evidence_${index}`, file);
        });
      }

      const response = await apiClient.post(`${this.CHARGEBACK_URL}/dispute/${chargebackId}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error disputing chargeback:', error);
      throw error;
    }
  }

  /**
   * Get settlement reconciliation report
   */
  async getSettlementReconciliation(params: {
    date: string;
    client_code?: string;
  }): Promise<any> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/reconciliation/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching reconciliation:', error);
      throw error;
    }
  }

  /**
   * Get settlement TAT (Turn Around Time) report
   */
  async getSettlementTAT(params: {
    date_from: string;
    date_to: string;
    client_code?: string;
  }): Promise<any> {
    try {
      const response = await apiClient.get(`${this.BASE_URL}/tat-report/`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching TAT report:', error);
      throw error;
    }
  }

  /**
   * Bulk update settlement status
   */
  async bulkUpdateSettlementStatus(data: {
    txn_ids: string[];
    status: 'COMPLETED' | 'FAILED';
    settlement_utr?: string;
    remarks?: string;
  }): Promise<any> {
    try {
      const response = await apiClient.post(`${this.BASE_URL}/bulk-update/`, data);
      return response.data;
    } catch (error) {
      console.error('Error bulk updating settlements:', error);
      throw error;
    }
  }
}

export default new SettlementService();