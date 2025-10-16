import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Grid,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  InputAdornment,
  Tooltip,
  LinearProgress,
  Card,
  CardContent,
  useTheme,
  alpha,
  SelectChangeEvent,
  Collapse,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridToolbar,
  GridValueGetterParams,
  GridRenderCellParams,
} from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Download,
  Search,
  FilterList,
  Refresh,
  MoreVert,
  CheckCircle,
  Cancel,
  Schedule,
  CreditCard,
  AccountBalanceWallet,
  PhoneAndroid,
  AccountBalance,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import apiClient from '../../config/api.config';
import { Transaction, TransactionFilter } from '../../types/transaction.types';
import { useAuth } from '../../contexts/AuthContext';
import { useDebounce } from '../../hooks/useDebounce';

const TransactionList: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<TransactionFilter>({
    page: 1,
    page_size: 100,  // Increased default page size for better data coverage
  });
  const [showFilters, setShowFilters] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  // Helper function to safely get amount from transaction (handles string values from API)
  const getTransactionAmount = (transaction: any): number => {
    // Try different field names that might contain the amount
    const possibleAmountFields = [
      'paid_amount',
      'paidAmount',
      'amount',
      'payee_amount',
      'payeeAmount',
      'transaction_amount',
      'transactionAmount',
      'txn_amount',
      'txnAmount'
    ];

    for (const field of possibleAmountFields) {
      const value = transaction[field];
      if (value !== undefined && value !== null && value !== '' && value !== 'null') {
        // Convert to string first to handle both string and number inputs
        const strValue = String(value).replace(/,/g, '').trim(); // Remove commas and trim
        const amount = parseFloat(strValue);
        if (!isNaN(amount) && amount >= 0) {
          return amount;
        }
      }
    }

    return 0;
  };

  // Summary stats
  const [summary, setSummary] = useState({
    totalAmount: 0,
    successCount: 0,
    failedCount: 0,
    pendingCount: 0,
  });

  const paymentModes = [
    'Credit Card',
    'BHIM UPI QR',
    'Rupay Card',
    'Debit Card',
    'Net Banking',
    'Wallet',
    'UPI',
    'CARD',
    'NET_BANKING',
    'WALLET'
  ];
  const statuses = ['SUCCESS', 'FAILED', 'PENDING', 'ABORTED'];

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      let endpoint = user?.role === 'ADMIN'
        ? '/transactions/admin-history/'
        : '/transactions/merchant-history/';

      // Format filters for backend - convert arrays to comma-separated strings
      const formattedFilters = {
        ...filters,
        // Convert payment_mode array to comma-separated string or single value
        payment_mode: Array.isArray(filters.payment_mode)
          ? filters.payment_mode.length === 1
            ? filters.payment_mode[0] // Single value without comma
            : filters.payment_mode.join(',') // Multiple values comma-separated
          : filters.payment_mode,
        // Convert status array to comma-separated string or single value
        status: Array.isArray(filters.status)
          ? filters.status.length === 1
            ? filters.status[0] // Single value without comma
            : filters.status.join(',') // Multiple values comma-separated
          : filters.status,
      };

      // Remove undefined or empty values
      Object.keys(formattedFilters).forEach(key => {
        if (formattedFilters[key] === undefined || formattedFilters[key] === '' ||
            (Array.isArray(formattedFilters[key]) && formattedFilters[key].length === 0)) {
          delete formattedFilters[key];
        }
      });

      try {
        const response = await apiClient.get(endpoint, { params: formattedFilters });

        if (response.data) {
          const results = response.data.results || [];

          // Debug logging
          console.log('API Response:', response.data);
          console.log('First transaction:', results[0]);
          if (results.length > 0) {
            console.log('Sample paid_amount values:', results.slice(0, 3).map(t => ({
              txn_id: t.txn_id,
              paid_amount: t.paid_amount,
              amount: t.amount,
              payee_amount: t.payee_amount
            })));
          }

          setTransactions(results);
          setTotalCount(response.data.count || 0);

          // Calculate summary
          const totalAmount = results.reduce((sum: number, t: any) => {
            return sum + getTransactionAmount(t);
          }, 0);

          console.log('Total Amount Calculated:', totalAmount);

          setSummary({
            totalAmount: totalAmount,
            successCount: results.filter((t: Transaction) => t.status === 'SUCCESS').length,
            failedCount: results.filter((t: Transaction) => t.status === 'FAILED').length,
            pendingCount: results.filter((t: Transaction) => t.status === 'PENDING').length,
          });
        }
      } catch (error: any) {
        // If merchant endpoint fails with 403, try admin endpoint as fallback
        if (error.response?.status === 403 && endpoint === '/transactions/merchant-history/') {
          console.log('Merchant endpoint failed, trying admin endpoint...');
          endpoint = '/transactions/admin-history/';

          const response = await apiClient.get(endpoint, { params: formattedFilters });

          if (response.data) {
            const results = response.data.results || [];

            // Debug logging - Enhanced to check date fields
            if (results.length > 0) {
              console.log('Sample transaction data:', {
                txn_id: results[0].txn_id,
                trans_date: results[0].trans_date,
                trans_complete_date: results[0].trans_complete_date,
                paid_amount: results[0].paid_amount,
                amount: results[0].amount,
                full_object: results[0]
              });
              console.log('Total transactions fetched:', results.length);
              console.log('Data structure check - first item keys:', Object.keys(results[0]));
            } else {
              console.log('No results found');
            }

            // Ensure each transaction has an id for DataGrid
            const transactionsWithId = results.map((t: any, index: number) => ({
              ...t,
              id: t.txn_id || t.id || `transaction-${index}`
            }));

            setTransactions(transactionsWithId);
            setTotalCount(response.data.count || 0);

            // Calculate summary
            const totalAmount = results.reduce((sum: number, t: any) => {
              return sum + getTransactionAmount(t);
            }, 0);

            setSummary({
              totalAmount: totalAmount,
              successCount: results.filter((t: any) => String(t.status).toUpperCase() === 'SUCCESS').length,
              failedCount: results.filter((t: any) => String(t.status).toUpperCase() === 'FAILED').length,
              pendingCount: results.filter((t: any) => String(t.status).toUpperCase() === 'PENDING').length,
            });
          }
        } else {
          // If admin endpoint also fails or other error, try generic endpoint
          console.log('Trying generic transactions endpoint...');
          const response = await apiClient.get('/transactions/', { params: formattedFilters });

          if (response.data) {
            const results = response.data.results || [];

            // Debug logging - Enhanced to check date fields
            if (results.length > 0) {
              console.log('Sample transaction data:', {
                txn_id: results[0].txn_id,
                trans_date: results[0].trans_date,
                trans_complete_date: results[0].trans_complete_date,
                paid_amount: results[0].paid_amount,
                amount: results[0].amount,
                full_object: results[0]
              });
              console.log('Total transactions fetched:', results.length);
              console.log('Data structure check - first item keys:', Object.keys(results[0]));
            } else {
              console.log('No results found');
            }

            // Ensure each transaction has an id for DataGrid
            const transactionsWithId = results.map((t: any, index: number) => ({
              ...t,
              id: t.txn_id || t.id || `transaction-${index}`
            }));

            setTransactions(transactionsWithId);
            setTotalCount(response.data.count || 0);

            // Calculate summary
            const totalAmount = results.reduce((sum: number, t: any) => {
              return sum + getTransactionAmount(t);
            }, 0);

            setSummary({
              totalAmount: totalAmount,
              successCount: results.filter((t: any) => String(t.status).toUpperCase() === 'SUCCESS').length,
              failedCount: results.filter((t: any) => String(t.status).toUpperCase() === 'FAILED').length,
              pendingCount: results.filter((t: any) => String(t.status).toUpperCase() === 'PENDING').length,
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      // Set empty data on error
      setTransactions([]);
      setTotalCount(0);
      setSummary({
        totalAmount: 0,
        successCount: 0,
        failedCount: 0,
        pendingCount: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  // Debounced search to reduce API calls
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Update filters when debounced search changes
  useEffect(() => {
    if (debouncedSearchTerm !== undefined) {
      setFilters(prev => ({ ...prev, search: debouncedSearchTerm, page: 1 }));
    }
  }, [debouncedSearchTerm]);

  const handleFilterChange = (key: keyof TransactionFilter, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  // Helper function to escape CSV values
  const escapeCSVValue = (value: string, isNumericId: boolean = false): string => {
    if (!value) return '""';

    // For numeric IDs, use ="value" format to prevent Excel from converting to scientific notation
    if (isNumericId && /^\d+$/.test(value)) {
      return `"=""${value}"""`;
    }

    // Regular CSV escaping
    const escaped = String(value).replace(/"/g, '""');
    return `"${escaped}"`;
  };

  // Generate CSV content from transactions
  const generateCSV = (data: Transaction[]): string => {
    if (!data || data.length === 0) {
      return 'No transactions available to export';
    }

    const headers = [
      'Transaction ID', 'Client Txn ID', 'Client Code', 'Client Name',
      'Transaction Date', 'Completion Date', 'Status', 'Payment Mode',
      'Amount', 'Payee Name', 'Payee Email', 'Payee Mobile',
      'PG Name', 'PG Txn ID', 'Bank Txn ID', 'Is Settled'
    ];

    const rows = data.map(txn => {
      return [
        escapeCSVValue(txn.txn_id || '', true),
        escapeCSVValue(txn.client_txn_id || '', true),
        escapeCSVValue(txn.client_code || ''),
        escapeCSVValue(txn.client_name || ''),
        escapeCSVValue(txn.trans_date || ''),
        escapeCSVValue(txn.trans_complete_date || ''),
        escapeCSVValue(txn.status || ''),
        escapeCSVValue(txn.payment_mode || ''),
        escapeCSVValue(String(getTransactionAmount(txn))),
        escapeCSVValue(txn.payee_name || ''),
        escapeCSVValue(txn.payee_email || ''),
        escapeCSVValue(txn.payee_mob || '', true),
        escapeCSVValue(txn.pg_name || ''),
        escapeCSVValue(txn.pg_txn_id || '', true),
        escapeCSVValue(txn.bank_txn_id || '', true),
        escapeCSVValue(txn.is_settled ? 'Yes' : 'No')
      ].join(',');
    });

    return [
      headers.map(h => `"${h}"`).join(','),
      ...rows
    ].join('\n');
  };

  const handleExport = async (exportFormat: 'excel' | 'csv') => {
    try {
      setLoading(true);

      // Determine which transactions to export
      let exportData: Transaction[];
      if (selectedRows.length > 0) {
        // Export only selected rows
        exportData = transactions.filter(txn => selectedRows.includes(txn.txn_id));
      } else {
        // Export all current transactions
        exportData = transactions;
      }

      if (exportData.length === 0) {
        alert('No transactions to export');
        setLoading(false);
        return;
      }

      // Generate CSV content
      const csvContent = generateCSV(exportData);

      // Create blob and download
      const BOM = '\uFEFF'; // UTF-8 BOM for proper Excel encoding
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
      const filename = selectedRows.length > 0
        ? `Transactions_Selected_${timestamp}.${exportFormat === 'excel' ? 'csv' : 'csv'}`
        : `Transactions_All_${timestamp}.${exportFormat === 'excel' ? 'csv' : 'csv'}`;

      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log(`Exported ${exportData.length} transactions`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export transactions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentModeIcon = (mode: string) => {
    const upperMode = mode?.toUpperCase() || '';
    switch (upperMode) {
      case 'UPI':
      case 'BHIM UPI QR':
        return <PhoneAndroid fontSize="small" />;
      case 'CARD':
      case 'CC':
      case 'DC':
      case 'CREDIT CARD':
      case 'DEBIT CARD':
      case 'RUPAY CARD':
        return <CreditCard fontSize="small" />;
      case 'NET_BANKING':
      case 'NET BANKING':
      case 'NB':
        return <AccountBalance fontSize="small" />;
      case 'WALLET':
        return <AccountBalanceWallet fontSize="small" />;
      default:
        return <CreditCard fontSize="small" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle fontSize="small" sx={{ color: theme.palette.success.main }} />;
      case 'FAILED':
        return <Cancel fontSize="small" sx={{ color: theme.palette.error.main }} />;
      case 'PENDING':
        return <Schedule fontSize="small" sx={{ color: theme.palette.warning.main }} />;
      default:
        return null;
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'txn_id',
      headerName: 'Transaction ID',
      width: 180,
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title={params.value}>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
            {params.value}
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: 'client_txn_id',
      headerName: 'Client Txn ID',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'client_code',
      headerName: 'Client Code',
      width: 100,
    },
    {
      field: 'client_name',
      headerName: 'Client Name',
      width: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title={params.value}>
          <Typography variant="body2" noWrap>
            {params.value || '-'}
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: 'trans_date',
      headerName: 'Transaction Date',
      width: 160,
      renderCell: (params: GridRenderCellParams) => {
        // Handle string values from API
        const rawValue = params.value || params.row?.trans_date || params.row?.transDate || params.row?.transaction_date;

        // Convert to string and trim
        const dateValue = rawValue ? String(rawValue).trim() : '';

        if (!dateValue || dateValue === 'null' || dateValue === 'undefined' || dateValue === '') {
          return <Typography variant="body2">-</Typography>;
        }

        try {
          // Handle string dates with timezone (e.g., "2024-07-22T03:56:11+05:30")
          let parsedDate: Date;

          // Try parseISO first (handles ISO format with timezone)
          parsedDate = parseISO(String(dateValue));

          // If parseISO returns invalid date, try Date constructor
          if (isNaN(parsedDate.getTime())) {
            parsedDate = new Date(dateValue);
          }

          // Check if the date is valid
          if (isNaN(parsedDate.getTime())) {
            // Return the original value if we can't parse it
            return (
              <Typography variant="body2">
                {String(dateValue).substring(0, 19).replace('T', ' ')}
              </Typography>
            );
          }

          return (
            <Typography variant="body2">
              {format(parsedDate, 'dd MMM yyyy HH:mm')}
            </Typography>
          );
        } catch (error) {
          // Try to display something meaningful
          return (
            <Typography variant="body2">
              {String(dateValue).substring(0, 19).replace('T', ' ') || '-'}
            </Typography>
          );
        }
      },
    },
    {
      field: 'trans_complete_date',
      headerName: 'Completion Date',
      width: 160,
      renderCell: (params: GridRenderCellParams) => {
        // Handle string values from API
        const rawValue = params.value || params.row?.trans_complete_date || params.row?.transCompleteDate || params.row?.complete_date;

        // Convert to string and trim
        const dateValue = rawValue ? String(rawValue).trim() : '';

        if (!dateValue || dateValue === 'null' || dateValue === 'undefined' || dateValue === '') {
          return <Typography variant="body2">-</Typography>;
        }

        try {
          // Handle string dates with timezone (e.g., "2024-07-22T03:56:11+05:30")
          let parsedDate: Date;

          // Try parseISO first (handles ISO format with timezone)
          parsedDate = parseISO(String(dateValue));

          // If parseISO returns invalid date, try Date constructor
          if (isNaN(parsedDate.getTime())) {
            parsedDate = new Date(dateValue);
          }

          // Check if the date is valid
          if (isNaN(parsedDate.getTime())) {
            // Return the original value if we can't parse it
            return (
              <Typography variant="body2">
                {String(dateValue).substring(0, 19).replace('T', ' ')}
              </Typography>
            );
          }

          return (
            <Typography variant="body2">
              {format(parsedDate, 'dd MMM yyyy HH:mm')}
            </Typography>
          );
        } catch (error) {
          // Try to display something meaningful
          return (
            <Typography variant="body2">
              {String(dateValue).substring(0, 19).replace('T', ' ') || '-'}
            </Typography>
          );
        }
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          icon={getStatusIcon(params.value)}
          label={params.value}
          size="small"
          color={
            params.value === 'SUCCESS' ? 'success' :
            params.value === 'FAILED' ? 'error' :
            params.value === 'PENDING' ? 'warning' : 'default'
          }
        />
      ),
    },
    {
      field: 'payment_mode',
      headerName: 'Payment Mode',
      width: 140,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          icon={getPaymentModeIcon(params.value)}
          label={params.value}
          size="small"
          variant="outlined"
          sx={{ borderColor: theme.palette.primary.main }}
        />
      ),
    },
    {
      field: 'paid_amount',
      headerName: 'Amount (₹)',
      width: 120,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams) => {
        let amount = 0;

        // Handle string values from API - convert to number
        if (params.value !== undefined && params.value !== null && params.value !== '') {
          const strValue = String(params.value).replace(/,/g, '').trim(); // Remove commas and trim
          const parsedAmount = parseFloat(strValue);
          if (!isNaN(parsedAmount)) {
            amount = parsedAmount;
          }
        }

        // Fallback to helper function if params.value didn't work
        if (amount === 0 && params.row) {
          amount = getTransactionAmount(params.row);
        }

        // Debug log for transactions with 0 amount
        if (amount === 0 && params.row?.txn_id) {
          console.warn('Amount showing as 0 for transaction:', {
            txn_id: params.row.txn_id,
            params_value: params.value,
            computed_amount: amount,
            paid_amount: params.row?.paid_amount,
            amount_field: params.row?.amount
          });
        }

        return (
          <Typography variant="body2" align="right" sx={{ fontWeight: 'medium' }}>
            ₹{amount.toLocaleString('en-IN')}
          </Typography>
        );
      },
    },
    {
      field: 'payee_name',
      headerName: 'Payee Name',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2">
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'payee_email',
      headerName: 'Payee Email',
      width: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title={params.value}>
          <Typography variant="body2" noWrap>
            {params.value || '-'}
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: 'payee_mob',
      headerName: 'Mobile',
      width: 120,
    },
    {
      field: 'pg_name',
      headerName: 'Payment Gateway',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2">
          {params.value || 'SabPaisa'}
        </Typography>
      ),
    },
    {
      field: 'pg_txn_id',
      headerName: 'PG Transaction ID',
      width: 180,
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title={params.value}>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }} noWrap>
            {params.value || '-'}
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: 'bank_txn_id',
      headerName: 'Bank Transaction ID',
      width: 180,
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title={params.value}>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }} noWrap>
            {params.value || '-'}
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: 'settlement_status',
      headerName: 'Settlement',
      width: 120,
      renderCell: (params: GridRenderCellParams) => {
        const isSettled = params.row.is_settled;
        return (
          <Chip
            label={isSettled ? 'SETTLED' : 'PENDING'}
            size="small"
            color={isSettled ? 'success' : 'warning'}
            variant="outlined"
          />
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 80,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <IconButton
          size="small"
          onClick={(e) => {
            setAnchorEl(e.currentTarget);
          }}
        >
          <MoreVert fontSize="small" />
        </IconButton>
      ),
    },
  ];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Transaction History
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View and manage all payment transactions
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={() => fetchTransactions()}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={() => handleExport('excel')}
            disabled={loading || transactions.length === 0}
          >
            Export {selectedRows.length > 0 ? `(${selectedRows.length})` : 'All'}
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Amount
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                ₹{summary.totalAmount.toLocaleString('en-IN')}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: alpha(theme.palette.success.main, 0.05) }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Successful
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="success.main">
                {summary.successCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: alpha(theme.palette.error.main, 0.05) }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Failed
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="error.main">
                {summary.failedCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: alpha(theme.palette.warning.main, 0.05) }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Pending
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="warning.main">
                {summary.pendingCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Filters</Typography>
          <IconButton onClick={() => setShowFilters(!showFilters)}>
            {showFilters ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>

        <Collapse in={showFilters}>
          <Box>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={6} md={2}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start Date"
                    value={filters.date_from ? parseISO(filters.date_from) : null}
                    onChange={(date) => {
                      handleFilterChange('date_from', date ? format(date, 'yyyy-MM-dd') : undefined);
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                      },
                    }}
                  />
                </LocalizationProvider>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="End Date"
                    value={filters.date_to ? parseISO(filters.date_to) : null}
                    onChange={(date) => {
                      handleFilterChange('date_to', date ? format(date, 'yyyy-MM-dd') : undefined);
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: 'small',
                      },
                    }}
                  />
                </LocalizationProvider>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel shrink={false} sx={{ backgroundColor: 'white', px: 0.5 }}>
                    Payment Mode
                  </InputLabel>
                  <Select
                    multiple
                    value={filters.payment_mode || []}
                    onChange={(e: SelectChangeEvent<string[]>) => {
                      handleFilterChange('payment_mode', e.target.value);
                    }}
                    input={<OutlinedInput label="Payment Mode" />}
                    displayEmpty
                    renderValue={(selected) => {
                      if (!selected || (selected as string[]).length === 0) {
                        return <Typography variant="body2" color="text.secondary">Select Payment Mode</Typography>;
                      }
                      return (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(selected as string[]).map((value) => (
                            <Chip key={value} label={value} size="small" />
                          ))}
                        </Box>
                      );
                    }}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 300,
                        },
                      },
                    }}
                  >
                    {paymentModes.map((mode) => (
                      <MenuItem key={mode} value={mode}>
                        {mode}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel shrink={false} sx={{ backgroundColor: 'white', px: 0.5 }}>
                    Status
                  </InputLabel>
                  <Select
                    multiple
                    value={filters.status || []}
                    onChange={(e: SelectChangeEvent<string[]>) => {
                      handleFilterChange('status', e.target.value);
                    }}
                    input={<OutlinedInput label="Status" />}
                    displayEmpty
                    renderValue={(selected) => {
                      if (!selected || (selected as string[]).length === 0) {
                        return <Typography variant="body2" color="text.secondary">Select Status</Typography>;
                      }
                      return (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(selected as string[]).map((value) => (
                            <Chip key={value} label={value} size="small" />
                          ))}
                        </Box>
                      );
                    }}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 300,
                        },
                      },
                    }}
                  >
                    {statuses.map((status) => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Min Amount"
                  type="number"
                  value={filters.min_amount || ''}
                  onChange={(e) => handleFilterChange('min_amount', e.target.value ? Number(e.target.value) : undefined)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Max Amount"
                  type="number"
                  value={filters.max_amount || ''}
                  onChange={(e) => handleFilterChange('max_amount', e.target.value ? Number(e.target.value) : undefined)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search"
                  placeholder="Transaction ID, Email, Mobile"
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => setFilters({ page: 1, page_size: 100 })}
                  sx={{ height: 40 }}
                >
                  Clear Filters
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Collapse>
      </Paper>

      {/* Data Grid */}
      <Paper sx={{ height: 600 }}>
        {loading && <LinearProgress />}
        <DataGrid
          rows={transactions}
          columns={columns}
          getRowId={(row) => row.id || row.txn_id || `row-${Math.random()}`}
          pageSizeOptions={[25, 50, 100]}
          paginationModel={{
            page: (filters.page || 1) - 1,
            pageSize: filters.page_size || 50,
          }}
          onPaginationModelChange={(model) => {
            setFilters(prev => ({
              ...prev,
              page: model.page + 1,
              page_size: model.pageSize,
            }));
          }}
          checkboxSelection
          onRowSelectionModelChange={(selection) => {
            setSelectedRows(selection as string[]);
          }}
          rowCount={totalCount}
          paginationMode="server"
          loading={loading}
          slots={{
            toolbar: GridToolbar,
          }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
            },
          }}
          // Performance optimizations
          rowHeight={52}
          columnHeaderHeight={56}
          disableRowSelectionOnClick
          disableColumnMenu
          density="standard"
          // Enable virtual scrolling for better performance
          rowBuffer={10}
          columnBuffer={2}
          sx={{
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
            '& .MuiDataGrid-row:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.04),
            },
            '& .MuiDataGrid-virtualScroller': {
              overflow: 'auto',
            },
          }}
        />
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => setAnchorEl(null)}>View Details</MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>View Receipt</MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>Initiate Refund</MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>Download Invoice</MenuItem>
      </Menu>
    </Box>
  );
};

export default TransactionList;