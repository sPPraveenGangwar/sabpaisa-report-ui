import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  useTheme,
  alpha,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Download,
  FileDownload,
  PictureAsPdf,
  TableChart,
  Description,
  Schedule,
  CheckCircle,
  Error,
  Delete,
  Refresh,
  Assessment,
  Receipt,
  AccountBalance,
  TrendingUp,
  NavigateBefore,
  NavigateNext,
} from '@mui/icons-material';
import { format, parseISO, subDays, startOfMonth, endOfMonth } from 'date-fns';
import apiClient from '../../config/api.config';

interface Report {
  id: string;
  name: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  fileSize?: string;
  downloadUrl?: string;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  type: 'transaction' | 'settlement' | 'reconciliation' | 'analytics';
  formats: string[];
}

const ReportGeneration: React.FC = () => {
  const theme = useTheme();
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [downloadMode, setDownloadMode] = useState<'single' | 'all'>('single');
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [downloadProgress, setDownloadProgress] = useState<{
    currentPage: number;
    totalPages: number;
    totalRecords: number;
    fetchedRecords: number;
  } | null>(null);
  const [filters, setFilters] = useState({
    date_from: format(new Date(), 'yyyy-MM-dd'), // Default to today to avoid rate limiting
    date_to: format(new Date(), 'yyyy-MM-dd'),
    report_type: 'transaction',
    format: 'csv',
    status_filter: '',
    payment_mode: '',
    client_code: '',
  });

  // Helper function to escape CSV values and preserve numeric IDs
  const escapeCSVValue = (value: string, isNumericId: boolean = false): string => {
    if (!value) return '""';

    // For numeric IDs, prepend with = and wrap in quotes to force text format in Excel
    // This prevents Excel from converting to scientific notation
    if (isNumericId && /^\d+$/.test(value)) {
      // Use ="value" format which forces Excel to treat as text
      return `"=""${value}"""`;
    }

    // Regular CSV escaping for other values
    const escaped = String(value).replace(/"/g, '""');
    return `"${escaped}"`;
  };

  // Helper function to generate CSV
  const generateCSV = (data: any[], type: string): string => {
    if (!data || data.length === 0) {
      return 'No data available for the selected criteria';
    }

    let headers: string[] = [];
    let rows: string[][] = [];

    if (type === 'transaction') {
      headers = [
        'Transaction ID', 'Client Txn ID', 'Client Code', 'Client Name',
        'Transaction Date', 'Completion Date', 'Status', 'Payment Mode',
        'Amount', 'Payee Name', 'Payee Email', 'Payee Mobile',
        'PG Name', 'PG Txn ID', 'Bank Txn ID'
      ];

      // Build rows with proper escaping for numeric IDs
      const csvRows = data.map(item => {
        return [
          escapeCSVValue(item.txn_id || '', true),           // Transaction ID - treat as text
          escapeCSVValue(item.client_txn_id || '', true),    // Client Txn ID - treat as text
          escapeCSVValue(item.client_code || ''),
          escapeCSVValue(item.client_name || ''),
          escapeCSVValue(item.trans_date || ''),
          escapeCSVValue(item.trans_complete_date || ''),
          escapeCSVValue(item.status || ''),
          escapeCSVValue(item.payment_mode || ''),
          escapeCSVValue(String(item.paid_amount || 0)),
          escapeCSVValue(item.payee_name || ''),
          escapeCSVValue(item.payee_email || ''),
          escapeCSVValue(item.payee_mob || '', true),        // Mobile - treat as text
          escapeCSVValue(item.pg_name || ''),
          escapeCSVValue(item.pg_txn_id || '', true),        // PG Txn ID - treat as text
          escapeCSVValue(item.bank_txn_id || '', true)       // Bank Txn ID - treat as text
        ].join(',');
      });

      // Build CSV content
      const csvContent = [
        headers.map(h => `"${h}"`).join(','),
        ...csvRows
      ].join('\n');

      return csvContent;

    } else if (type === 'settlement') {
      headers = [
        'Transaction ID', 'Client Txn ID', 'Client Code', 'Client Name',
        'Transaction Date', 'Settlement Date', 'Transaction Amount',
        'Settlement Amount', 'Charges', 'GST', 'Status', 'Settlement Status',
        'UTR Number', 'Payment Mode', 'Settled By'
      ];

      const csvRows = data.map(item => {
        return [
          escapeCSVValue(item.txn_id || '', true),           // Transaction ID - treat as text
          escapeCSVValue(item.client_txn_id || '', true),    // Client Txn ID - treat as text
          escapeCSVValue(item.client_code || ''),
          escapeCSVValue(item.client_name || ''),
          escapeCSVValue(item.trans_date || ''),
          escapeCSVValue(item.settlement_date || ''),
          escapeCSVValue(String(item.paid_amount || 0)),
          escapeCSVValue(String(item.settlement_amount || 0)),
          escapeCSVValue(String(item.ep_charges || 0)),
          escapeCSVValue(String(item.gst || 0)),
          escapeCSVValue(item.status || ''),
          escapeCSVValue(item.settlement_status || ''),
          escapeCSVValue(item.settlement_utr || '', true),   // UTR - treat as text
          escapeCSVValue(item.payment_mode || ''),
          escapeCSVValue(item.settlement_by || '')
        ].join(',');
      });

      const csvContent = [
        headers.map(h => `"${h}"`).join(','),
        ...csvRows
      ].join('\n');

      return csvContent;

    } else {
      // Generic CSV for other types
      if (data.length > 0) {
        headers = Object.keys(data[0]);
        rows = data.map(item => headers.map(h => String(item[h] || '')));

        const csvContent = [
          headers.map(h => `"${h}"`).join(','),
          ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        return csvContent;
      }
    }

    return '';
  };

  // Helper function to generate Excel (as CSV with BOM for proper Excel compatibility)
  const generateExcel = (data: any[], type: string): string => {
    // Generate CSV with UTF-8 BOM for Excel compatibility
    const csvContent = generateCSV(data, type);
    // Add UTF-8 BOM at the beginning for Excel to recognize UTF-8 encoding
    return '\uFEFF' + csvContent;
  };

  // Helper function to generate HTML report for PDF
  const generateHTMLReport = (data: any[], type: string): string => {
    if (!data || data.length === 0) {
      return '<html><body><h1>No data available for the selected criteria</h1></body></html>';
    }

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #1976d2; border-bottom: 3px solid #1976d2; padding-bottom: 10px; }
          .info { background: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #1976d2; color: white; padding: 10px; text-align: left; font-weight: bold; }
          td { padding: 8px; border-bottom: 1px solid #ddd; }
          tr:hover { background: #f5f5f5; }
          .status-success { color: #4caf50; font-weight: bold; }
          .status-failed { color: #f44336; font-weight: bold; }
          .status-pending { color: #ff9800; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
    `;

    if (type === 'transaction') {
      const totalAmount = data.reduce((sum, item) => sum + (parseFloat(item.paid_amount) || 0), 0);
      const successCount = data.filter(item => item.status?.toUpperCase() === 'SUCCESS').length;

      html += `
        <h1>Transaction Report</h1>
        <div class="info">
          <p><strong>Generated:</strong> ${format(new Date(), 'dd MMM yyyy HH:mm:ss')}</p>
          <p><strong>Date Range:</strong> ${filters.date_from} to ${filters.date_to}</p>
          <p><strong>Total Records:</strong> ${data.length}</p>
          <p><strong>Total Amount:</strong> ₹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
          <p><strong>Success Rate:</strong> ${data.length > 0 ? ((successCount / data.length) * 100).toFixed(2) : 0}%</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Transaction ID</th>
              <th>Client</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Payment Mode</th>
            </tr>
          </thead>
          <tbody>
      `;

      data.forEach((item, index) => {
        const statusClass = item.status?.toUpperCase() === 'SUCCESS' ? 'status-success' :
                          item.status?.toUpperCase() === 'FAILED' ? 'status-failed' :
                          'status-pending';
        html += `
          <tr>
            <td>${index + 1}</td>
            <td>${item.txn_id || 'N/A'}</td>
            <td>${item.client_name || 'N/A'} (${item.client_code || 'N/A'})</td>
            <td>${item.trans_date ? format(new Date(item.trans_date), 'dd MMM yyyy') : 'N/A'}</td>
            <td>₹${(item.paid_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            <td class="${statusClass}">${item.status || 'N/A'}</td>
            <td>${item.payment_mode || 'N/A'}</td>
          </tr>
        `;
      });

      html += `
          </tbody>
        </table>
      `;
    } else if (type === 'settlement') {
      const totalSettlement = data.reduce((sum, item) => sum + (parseFloat(item.settlement_amount) || 0), 0);

      html += `
        <h1>Settlement Report</h1>
        <div class="info">
          <p><strong>Generated:</strong> ${format(new Date(), 'dd MMM yyyy HH:mm:ss')}</p>
          <p><strong>Date Range:</strong> ${filters.date_from} to ${filters.date_to}</p>
          <p><strong>Total Records:</strong> ${data.length}</p>
          <p><strong>Total Settlement Amount:</strong> ₹${totalSettlement.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>Transaction ID</th>
              <th>Client</th>
              <th>Settlement Date</th>
              <th>Transaction Amount</th>
              <th>Settlement Amount</th>
              <th>Status</th>
              <th>UTR</th>
            </tr>
          </thead>
          <tbody>
      `;

      data.forEach((item, index) => {
        html += `
          <tr>
            <td>${index + 1}</td>
            <td>${item.txn_id || 'N/A'}</td>
            <td>${item.client_name || 'N/A'}</td>
            <td>${item.settlement_date ? format(new Date(item.settlement_date), 'dd MMM yyyy') : 'N/A'}</td>
            <td>₹${(item.paid_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            <td>₹${(item.settlement_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            <td>${item.settlement_status || 'N/A'}</td>
            <td>${item.settlement_utr || 'N/A'}</td>
          </tr>
        `;
      });

      html += `
          </tbody>
        </table>
      `;
    }

    html += `
        <div class="footer">
          <p>Generated by SabPaisa Payment Gateway Platform</p>
          <p>This is a system-generated report</p>
        </div>
      </body>
      </html>
    `;

    return html;
  };

  const reportTemplates: ReportTemplate[] = [
    {
      id: 'transaction_report',
      name: 'Transaction Report',
      description: 'Detailed transaction history with all payment information',
      icon: <Receipt />,
      type: 'transaction',
      formats: ['excel', 'csv', 'pdf'],
    },
    {
      id: 'settlement_report',
      name: 'Settlement Report',
      description: 'Settlement status and reconciliation details',
      icon: <AccountBalance />,
      type: 'settlement',
      formats: ['excel', 'csv', 'pdf'],
    },
    {
      id: 'reconciliation_report',
      name: 'Reconciliation Report',
      description: 'Bank reconciliation and mismatch analysis',
      icon: <Assessment />,
      type: 'reconciliation',
      formats: ['excel', 'pdf'],
    },
    {
      id: 'analytics_report',
      name: 'Analytics Report',
      description: 'Payment trends, success rates, and insights',
      icon: <TrendingUp />,
      type: 'analytics',
      formats: ['excel', 'pdf'],
    },
  ];

  // Helper function to fetch all records with pagination
  const fetchAllRecordsWithPagination = async (
    endpoint: string,
    params: any
  ): Promise<any[]> => {
    const allRecords: any[] = [];
    let currentPage = 1;
    let totalPages = 1;
    const pageSize = 10000; // Fetch 10K records per page

    try {
      // Fetch first page to get total count
      const firstResponse = await apiClient.get(endpoint, {
        params: { ...params, page: 1, page_size: pageSize },
      });

      const totalCount = firstResponse.data.count || 0;
      totalPages = Math.ceil(totalCount / pageSize);

      // Add first page results
      allRecords.push(...(firstResponse.data.results || []));

      // Update progress
      setDownloadProgress({
        currentPage: 1,
        totalPages,
        totalRecords: totalCount,
        fetchedRecords: allRecords.length,
      });

      // Fetch remaining pages
      for (currentPage = 2; currentPage <= totalPages; currentPage++) {
        const response = await apiClient.get(endpoint, {
          params: { ...params, page: currentPage, page_size: pageSize },
        });

        allRecords.push(...(response.data.results || []));

        // Update progress
        setDownloadProgress({
          currentPage,
          totalPages,
          totalRecords: totalCount,
          fetchedRecords: allRecords.length,
        });

        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return allRecords;
    } catch (error) {
      console.error('Error fetching paginated data:', error);
      throw error;
    } finally {
      setDownloadProgress(null);
    }
  };

  const handleGenerateReport = async (templateId: string) => {
    try {
      setGenerating(true);
      const template = reportTemplates.find(t => t.id === templateId);
      if (!template) return;

      let response: any = null;
      let filename = `${template.name.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd_HHmmss')}`;

      // First, try fetching the data based on the report type
      switch (template.type) {
        case 'transaction':
          // Fetch transaction data
          const transactionParams: any = {
            date_from: filters.date_from,
            date_to: filters.date_to,
          };

          if (filters.status_filter) {
            transactionParams.status = filters.status_filter;
          }
          if (filters.payment_mode) {
            transactionParams.payment_mode = filters.payment_mode;
          }
          if (filters.client_code) {
            transactionParams.client_code = filters.client_code;
          }

          let transactionData: any[] = [];

          // Check download mode
          if (downloadMode === 'all') {
            // Fetch all records with pagination
            transactionData = await fetchAllRecordsWithPagination(
              '/transactions/admin-history/',
              transactionParams
            );
          } else {
            // Fetch single batch (10K records max) from specified page
            const txnResponse = await apiClient.get('/transactions/admin-history/', {
              params: { ...transactionParams, page: pageNumber, page_size: 10000 },
            });
            transactionData = txnResponse.data.results || [];
          }

          // Format data based on selected format
          if (filters.format === 'csv') {
            response = generateCSV(transactionData, 'transaction');
            filename += '.csv';
          } else if (filters.format === 'excel') {
            response = generateExcel(transactionData, 'transaction');
            filename += '.xlsx';
          } else if (filters.format === 'pdf') {
            // For PDF, generate HTML that can be printed/saved as PDF
            response = generateHTMLReport(transactionData, 'transaction');
            filename += '.html';
          }
          break;

        case 'settlement':
          // Fetch settlement data
          const settlementParams: any = {
            date_from: filters.date_from,
            date_to: filters.date_to,
            use_settlement_date: true,
          };

          if (filters.status_filter) {
            settlementParams.settlement_status = filters.status_filter;
          }

          let settlementData: any[] = [];

          // Check download mode
          if (downloadMode === 'all') {
            // Fetch all records with pagination
            settlementData = await fetchAllRecordsWithPagination(
              '/settlements/settled-history/',
              settlementParams
            );
          } else {
            // Fetch single batch (10K records max) from specified page
            const settlementResponse = await apiClient.get('/settlements/settled-history/', {
              params: { ...settlementParams, page: pageNumber, page_size: 10000 },
            });
            settlementData = settlementResponse.data.results || [];
          }

          // Format data based on selected format
          if (filters.format === 'csv') {
            response = generateCSV(settlementData, 'settlement');
            filename += '.csv';
          } else if (filters.format === 'excel') {
            response = generateExcel(settlementData, 'settlement');
            filename += '.xlsx';
          } else if (filters.format === 'pdf') {
            response = generateHTMLReport(settlementData, 'settlement');
            filename += '.html';
          }
          break;

        case 'reconciliation':
        case 'analytics':
          // For now, generate a sample report for these types
          const sampleData = [{
            message: `${template.name} - Feature coming soon`,
            date_range: `${filters.date_from} to ${filters.date_to}`,
            generated_at: new Date().toISOString(),
          }];

          if (filters.format === 'csv') {
            response = generateCSV(sampleData, 'info');
            filename += '.csv';
          } else if (filters.format === 'pdf') {
            response = generateHTMLReport(sampleData, 'info');
            filename += '.html';
          }
          break;
      }

      if (response) {
        // Determine MIME type based on format
        let mimeType = 'text/plain';
        if (filters.format === 'csv') {
          mimeType = 'text/csv;charset=utf-8;';
        } else if (filters.format === 'excel') {
          mimeType = 'text/csv;charset=utf-8;';
        } else if (filters.format === 'pdf') {
          mimeType = 'text/html;charset=utf-8;';
        }

        // Create download link with proper encoding
        const blob = new Blob([response], { type: mimeType });
        const url = window.URL.createObjectURL(blob);

        // For HTML reports (PDF), open in new window for printing
        if (filters.format === 'pdf' && filename.endsWith('.html')) {
          const printWindow = window.open(url, '_blank');
          if (printWindow) {
            printWindow.onload = () => {
              // Add print instructions
              setTimeout(() => {
                printWindow.document.title = filename.replace('.html', '');
                // Optionally auto-trigger print dialog
                // printWindow.print();
              }, 500);
            };
          }
          // Also provide download link
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', filename);
          document.body.appendChild(link);
          link.click();
          link.remove();
        } else {
          // Regular download for CSV and Excel
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', filename);
          document.body.appendChild(link);
          link.click();
          link.remove();
        }

        // Clean up URL after a delay
        setTimeout(() => window.URL.revokeObjectURL(url), 100);
      }

      // Add to recent reports
      const newReport: Report = {
        id: Date.now().toString(),
        name: filename,
        type: template.type,
        status: 'completed',
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        fileSize: response ? `${(response.length / 1024).toFixed(2)} KB` : '0 KB',
      };
      const updatedReports = [newReport, ...recentReports].slice(0, 10);
      setRecentReports(updatedReports);

      // Save to localStorage for report history
      try {
        const existingHistory = localStorage.getItem('report_history');
        const history = existingHistory ? JSON.parse(existingHistory) : [];
        const updatedHistory = [newReport, ...history].slice(0, 50); // Keep last 50 reports
        localStorage.setItem('report_history', JSON.stringify(updatedHistory));
      } catch (storageErr) {
        console.error('Failed to save report to history:', storageErr);
      }
    } catch (error: any) {
      console.error('Error generating report:', error);
      let errorMessage = 'Failed to generate report';

      if (error.response?.status === 429) {
        errorMessage = 'Rate limited - Please try with a smaller date range or wait a moment';
      } else if (error.response?.status === 404) {
        errorMessage = 'Report endpoint not available';
      }

      const failedReport: Report = {
        id: Date.now().toString(),
        name: `${errorMessage} - ${templateId}`,
        type: 'transaction',
        status: 'failed',
        createdAt: new Date().toISOString(),
      };
      const updatedReports = [failedReport, ...recentReports].slice(0, 10);
      setRecentReports(updatedReports);

      // Save failed report to localStorage as well
      try {
        const existingHistory = localStorage.getItem('report_history');
        const history = existingHistory ? JSON.parse(existingHistory) : [];
        const updatedHistory = [failedReport, ...history].slice(0, 50);
        localStorage.setItem('report_history', JSON.stringify(updatedHistory));
      } catch (storageErr) {
        console.error('Failed to save failed report to history:', storageErr);
      }

      // Show alert for rate limiting
      if (error.response?.status === 429) {
        alert('Too many requests. Please try with today\'s data only or wait a moment before trying again.');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleQuickDateRange = (range: string) => {
    const today = new Date();
    let startDate = today;

    switch (range) {
      case 'today':
        startDate = today;
        break;
      case 'week':
        startDate = subDays(today, 7);
        break;
      case 'month':
        startDate = startOfMonth(today);
        break;
      case '3months':
        startDate = subDays(today, 90);
        break;
    }

    setFilters(prev => ({
      ...prev,
      date_from: format(startDate, 'yyyy-MM-dd'),
      date_to: format(today, 'yyyy-MM-dd'),
    }));
  };

  const getStatusIcon = (status: Report['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle color="success" />;
      case 'processing':
        return <Schedule color="warning" />;
      case 'failed':
        return <Error color="error" />;
      default:
        return <Schedule />;
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf':
        return <PictureAsPdf />;
      case 'excel':
      case 'xlsx':
        return <TableChart />;
      case 'csv':
        return <Description />;
      default:
        return <Description />;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Report Generation
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Generate and download various reports for transactions, settlements, and analytics
        </Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Report Parameters
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleQuickDateRange('today')}
            >
              Today
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleQuickDateRange('week')}
            >
              Last 7 Days
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleQuickDateRange('month')}
            >
              This Month
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleQuickDateRange('3months')}
            >
              Last 3 Months
            </Button>
          </Box>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={parseISO(filters.date_from)}
                onChange={(date) => setFilters(prev => ({
                  ...prev,
                  date_from: date ? format(date, 'yyyy-MM-dd') : '',
                }))}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="End Date"
                value={parseISO(filters.date_to)}
                onChange={(date) => setFilters(prev => ({
                  ...prev,
                  date_to: date ? format(date, 'yyyy-MM-dd') : '',
                }))}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Format</InputLabel>
              <Select
                value={filters.format}
                onChange={(e) => setFilters(prev => ({ ...prev, format: e.target.value }))}
                label="Format"
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                    },
                  },
                }}
              >
                <MenuItem value="excel">Excel (.xlsx)</MenuItem>
                <MenuItem value="csv">CSV</MenuItem>
                <MenuItem value="pdf">PDF</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={filters.status_filter}
                onChange={(e) => setFilters(prev => ({ ...prev, status_filter: e.target.value }))}
                label="Status Filter"
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                    },
                  },
                }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="SUCCESS">Success</MenuItem>
                <MenuItem value="FAILED">Failed</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <FormControl component="fieldset" fullWidth>
              <FormLabel component="legend">Download Mode</FormLabel>
              <RadioGroup
                row
                value={downloadMode}
                onChange={(e) => {
                  setDownloadMode(e.target.value as 'single' | 'all');
                  if (e.target.value === 'all') {
                    setPageNumber(1); // Reset to page 1 when switching to all records mode
                  }
                }}
              >
                <FormControlLabel
                  value="single"
                  control={<Radio />}
                  label="Single Batch (Max 10,000 records)"
                />
                <FormControlLabel
                  value="all"
                  control={<Radio />}
                  label="Download All Records (Fetches all pages)"
                />
              </RadioGroup>
              {downloadMode === 'single' && (
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<NavigateBefore />}
                      onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
                      disabled={pageNumber <= 1}
                    >
                      Previous
                    </Button>
                    <TextField
                      type="number"
                      label="Page Number"
                      value={pageNumber}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (value >= 1) {
                          setPageNumber(value);
                        }
                      }}
                      InputProps={{
                        inputProps: { min: 1 }
                      }}
                      size="small"
                      sx={{ width: 150 }}
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      endIcon={<NavigateNext />}
                      onClick={() => setPageNumber(prev => prev + 1)}
                    >
                      Next
                    </Button>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Page {pageNumber}: Records {((pageNumber - 1) * 10000 + 1).toLocaleString()} - {(pageNumber * 10000).toLocaleString()}
                  </Typography>
                </Box>
              )}
              {downloadMode === 'all' && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  This mode will fetch all records across multiple pages. For large datasets (100K+ records),
                  this may take several minutes. Progress will be shown during download.
                </Alert>
              )}
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Progress Indicator */}
      {downloadProgress && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CircularProgress size={24} sx={{ mr: 2 }} />
            <Typography variant="h6">
              Downloading All Records...
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Fetching page {downloadProgress.currentPage} of {downloadProgress.totalPages}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Records fetched: {downloadProgress.fetchedRecords.toLocaleString()} / {downloadProgress.totalRecords.toLocaleString()}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={(downloadProgress.fetchedRecords / downloadProgress.totalRecords) * 100}
            sx={{ mt: 2 }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {((downloadProgress.fetchedRecords / downloadProgress.totalRecords) * 100).toFixed(1)}% complete
          </Typography>
        </Paper>
      )}

      {/* Report Templates */}
      <Typography variant="h6" gutterBottom>
        Available Reports
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {reportTemplates.map((template) => (
          <Grid item xs={12} sm={6} md={3} key={template.id}>
            <Card
              sx={{
                height: '100%',
                '&:hover': {
                  boxShadow: theme.shadows[8],
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s',
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: theme.palette.primary.main,
                      mr: 2,
                    }}
                  >
                    {template.icon}
                  </Box>
                  <Typography variant="h6" component="div">
                    {template.name}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {template.description}
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {template.formats.map(format => (
                    <Chip
                      key={format}
                      label={format.toUpperCase()}
                      size="small"
                      variant="outlined"
                      icon={getFormatIcon(format)}
                    />
                  ))}
                </Box>
              </CardContent>
              <CardActions>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<FileDownload />}
                  onClick={() => handleGenerateReport(template.id)}
                  disabled={generating}
                >
                  Generate Report
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Reports */}
      {recentReports.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Recent Reports
            </Typography>
            <Button
              startIcon={<Refresh />}
              onClick={() => setRecentReports([])}
              size="small"
            >
              Clear History
            </Button>
          </Box>
          <List>
            {recentReports.map((report, index) => (
              <React.Fragment key={report.id}>
                {index > 0 && <Divider />}
                <ListItem>
                  <Box sx={{ mr: 2 }}>
                    {getStatusIcon(report.status)}
                  </Box>
                  <ListItemText
                    primary={report.name}
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          Generated: {format(parseISO(report.createdAt), 'dd MMM yyyy HH:mm')}
                        </Typography>
                        {report.fileSize && (
                          <Typography variant="caption" display="block">
                            Size: {report.fileSize}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    {report.status === 'completed' && (
                      <IconButton edge="end" aria-label="download">
                        <Download />
                      </IconButton>
                    )}
                  </ListItemSecondaryAction>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </Paper>
      )}

      {generating && <LinearProgress sx={{ mt: 2 }} />}
    </Box>
  );
};

export default ReportGeneration;