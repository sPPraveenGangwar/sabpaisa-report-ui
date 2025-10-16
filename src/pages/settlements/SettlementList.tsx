import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Tooltip,
  useTheme,
  alpha,
  InputAdornment,
  ToggleButton,
  ToggleButtonGroup,
  Tab,
  Tabs,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridValueGetterParams,
} from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  AccountBalance,
  AttachMoney,
  Download,
  Refresh,
  CheckCircle,
  Schedule,
  Cancel,
  TrendingUp,
  TrendingDown,
  Receipt,
  Assessment,
  FilterList,
  MoreVert,
  NavigateNext,
  NavigateBefore,
} from '@mui/icons-material';
import { format, parseISO, subDays, startOfMonth, endOfMonth } from 'date-fns';
import apiClient from '../../config/api.config';
import { Settlement } from '../../types/transaction.types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const SettlementList: React.FC = () => {
  const theme = useTheme();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [filters, setFilters] = useState({
    date_from: format(new Date(), 'yyyy-MM-dd'), // Today only by default
    date_to: format(new Date(), 'yyyy-MM-dd'),
    settlement_status: 'ALL',
    use_settlement_date: true,
    page: 1,
    page_size: 10000,
  });

  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const [summary, setSummary] = useState({
    totalSettled: 0,
    totalPending: 0,
    totalAmount: 0,
    avgSettlementTime: 0,
    todaySettlement: 0,
  });

  const settlementStatuses = ['ALL', 'COMPLETED', 'PENDING', 'PROCESSING', 'FAILED'];

  useEffect(() => {
    fetchSettlements();
  }, [filters]);

  const fetchSettlements = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/settlements/settled-history/', {
        params: {
          ...filters,
          settlement_status: filters.settlement_status === 'ALL' ? undefined : filters.settlement_status,
          page: filters.page,
          page_size: filters.page_size,
        },
      });

      if (response.data) {
        const results = response.data.results || [];
        const totalCount = response.data.count || 0;

        setSettlements(results);
        setTotalRecords(totalCount);
        setCurrentPage(filters.page);

        // Calculate summary - handle both COMPLETED and SETTLED statuses
        const completed = results.filter((s: Settlement) =>
          s.settlement_status === 'COMPLETED' || s.settlement_status === 'SETTLED'
        );
        const pending = results.filter((s: Settlement) => s.settlement_status === 'PENDING');
        const totalAmount = results.reduce((sum: number, s: Settlement) => {
          const amount = s.settlement_amount || s.paid_amount || 0;
          return sum + (typeof amount === 'number' ? amount : parseFloat(String(amount)) || 0);
        }, 0);

        // Calculate average settlement time in hours from transaction date to settlement date
        let avgSettlementTime = 0;
        if (completed.length > 0) {
          const totalHours = completed.reduce((sum: number, s: Settlement) => {
            if (s.trans_date && s.settlement_date) {
              try {
                const transDate = parseISO(s.trans_date);
                const settleDate = parseISO(s.settlement_date);
                const hoursDiff = (settleDate.getTime() - transDate.getTime()) / (1000 * 60 * 60);
                return sum + (hoursDiff > 0 ? hoursDiff : 0);
              } catch {
                return sum;
              }
            }
            return sum;
          }, 0);
          avgSettlementTime = Math.round(totalHours / completed.length);
        }

        setSummary({
          totalSettled: completed.length,
          totalPending: pending.length,
          totalAmount,
          avgSettlementTime,
          todaySettlement: results.filter((s: Settlement) =>
            s.settlement_date === format(new Date(), 'yyyy-MM-dd')
          ).length,
        });
      }
    } catch (error: any) {
      console.error('Error fetching settlements:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });

      // Don't show alert for cancelled requests
      if (error.message === 'Request cancelled due to new request' || error.__CANCEL__) {
        console.log('Request was cancelled, skipping error handling');
        return;
      }

      if (error.response?.status === 429) {
        console.warn('Rate limited. Please wait before making more requests.');
      }

      // Show empty data on any error
      setSettlements([]);
      setSummary({
        totalSettled: 0,
        totalPending: 0,
        totalAmount: 0,
        avgSettlementTime: 0,
        todaySettlement: 0,
      });

      // Only show alert for actual errors, not cancellations
      if (error.response?.status) {
        console.error(`API Error ${error.response.status}:`, error.response.data?.message || error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));

    // Sync tab selection with settlement_status filter
    if (key === 'settlement_status') {
      let tabIndex = 0;
      switch(value) {
        case 'ALL': tabIndex = 0; break;
        case 'PENDING':
        case 'PROCESSING': tabIndex = 1; break;
        case 'COMPLETED':
        case 'SETTLED': tabIndex = 2; break;
        case 'FAILED': tabIndex = 3; break;
        default: tabIndex = 0;
      }
      setTabValue(tabIndex);
    }
  };

  const handleQuickFilter = (days: number) => {
    const endDate = new Date();
    const startDate = days === 0 ? endDate : subDays(endDate, days);
    setFilters(prev => ({
      ...prev,
      date_from: format(startDate, 'yyyy-MM-dd'),
      date_to: format(endDate, 'yyyy-MM-dd'),
      page: 1,
    }));
  };

  const handleNextPage = () => {
    if (currentPage * filters.page_size < totalRecords) {
      setFilters(prev => ({ ...prev, page: prev.page + 1 }));
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setFilters(prev => ({ ...prev, page: prev.page - 1 }));
    }
  };

  const getTotalPages = () => Math.ceil(totalRecords / filters.page_size);

  const getRecordRange = () => {
    const start = (currentPage - 1) * filters.page_size + 1;
    const end = Math.min(currentPage * filters.page_size, totalRecords);
    return { start, end };
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

  // Generate CSV content from settlements
  const generateSettlementCSV = (data: Settlement[]): string => {
    if (!data || data.length === 0) {
      return 'No settlements available to export';
    }

    const headers = [
      'Transaction ID', 'Client Txn ID', 'Client Code', 'Client Name',
      'Transaction Date', 'Settlement Date', 'Transaction Amount',
      'Settlement Amount', 'Charges', 'GST', 'Status', 'Settlement Status',
      'UTR Number', 'Payment Mode', 'Settled By', 'Bank Name', 'Account Number'
    ];

    const rows = data.map(settlement => {
      const amount = settlement.settlement_amount || settlement.paid_amount || 0;
      const txnAmount = settlement.paid_amount || 0;

      return [
        escapeCSVValue(settlement.txn_id || '', true),
        escapeCSVValue(settlement.client_txn_id || '', true),
        escapeCSVValue(settlement.client_code || ''),
        escapeCSVValue(settlement.client_name || ''),
        escapeCSVValue(settlement.trans_date || ''),
        escapeCSVValue(settlement.settlement_date || ''),
        escapeCSVValue(String(typeof txnAmount === 'number' ? txnAmount : parseFloat(String(txnAmount)) || 0)),
        escapeCSVValue(String(typeof amount === 'number' ? amount : parseFloat(String(amount)) || 0)),
        escapeCSVValue(String(settlement.ep_charges || 0)),
        escapeCSVValue(String(settlement.gst || 0)),
        escapeCSVValue(settlement.status || ''),
        escapeCSVValue(settlement.settlement_status || ''),
        escapeCSVValue(settlement.settlement_utr || '', true),
        escapeCSVValue(settlement.payment_mode || ''),
        escapeCSVValue(settlement.settlement_by || ''),
        escapeCSVValue(settlement.bank_name || ''),
        escapeCSVValue(settlement.account_number || '', true)
      ].join(',');
    });

    return [
      headers.map(h => `"${h}"`).join(','),
      ...rows
    ].join('\n');
  };

  const handleExport = async () => {
    try {
      setLoading(true);

      if (settlements.length === 0) {
        alert('No settlements to export');
        setLoading(false);
        return;
      }

      // Generate CSV content
      const csvContent = generateSettlementCSV(settlements);

      // Create blob and download
      const BOM = '\uFEFF'; // UTF-8 BOM for proper Excel encoding
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
      const statusText = filters.settlement_status === 'ALL' ? 'All' : filters.settlement_status;
      const filename = `Settlements_${statusText}_${timestamp}.csv`;

      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log(`Exported ${settlements.length} settlements`);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export settlements. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'txn_id',
      headerName: 'Transaction ID',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'client_txn_id',
      headerName: 'Client Txn ID',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2">
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
      headerName: 'Merchant',
      width: 200,
    },
    {
      field: 'trans_date',
      headerName: 'Transaction Date',
      width: 150,
      renderCell: (params: GridRenderCellParams) => {
        if (!params.row) return '-';
        const value = params.row.trans_date;
        if (!value) return '-';
        try {
          return format(parseISO(value), 'dd MMM yyyy HH:mm');
        } catch (error) {
          return value;
        }
      },
    },
    {
      field: 'trans_complete_date',
      headerName: 'Completion Date',
      width: 150,
      renderCell: (params: GridRenderCellParams) => {
        if (!params.row) return '-';
        const value = params.row.trans_complete_date;
        if (!value) return '-';
        try {
          return format(parseISO(value), 'dd MMM yyyy HH:mm');
        } catch (error) {
          return value;
        }
      },
    },
    {
      field: 'settlement_date',
      headerName: 'Settlement Date',
      width: 150,
      renderCell: (params: GridRenderCellParams) => {
        if (!params.row) return '-';
        const value = params.row.settlement_date;
        if (!value) return 'Pending';
        try {
          const date = format(parseISO(value), 'dd MMM yyyy');
          return (
            <Chip
              label={date}
              size="small"
              color="success"
              variant="outlined"
            />
          );
        } catch (error) {
          return value;
        }
      },
    },
    {
      field: 'paid_amount',
      headerName: 'Transaction Amount',
      width: 140,
      align: 'right',
      renderCell: (params: GridRenderCellParams) => {
        if (!params.row) return '₹0';
        const value = params.row.paid_amount;
        if (value === undefined || value === null || value === '') return '₹0';
        const amount = typeof value === 'number' ? value : parseFloat(String(value));
        return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      },
    },
    {
      field: 'settlement_amount',
      headerName: 'Settlement Amount',
      width: 140,
      align: 'right',
      renderCell: (params: GridRenderCellParams) => {
        if (!params.row) return '₹0';
        const value = params.row.settlement_amount;
        if (value === undefined || value === null || value === '') return '₹0';
        const amount = typeof value === 'number' ? value : parseFloat(String(value));
        return (
          <Typography fontWeight="bold" color="primary">
            ₹{amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Typography>
        );
      },
    },
    {
      field: 'convcharges',
      headerName: 'Conv. Charges',
      width: 100,
      align: 'right',
      renderCell: (params: GridRenderCellParams) => {
        if (!params.row) return '₹0';
        const value = params.row.convcharges;
        if (value === undefined || value === null || value === '') return '₹0';
        const amount = typeof value === 'number' ? value : parseFloat(String(value));
        return `₹${amount.toFixed(2)}`;
      },
    },
    {
      field: 'ep_charges',
      headerName: 'EP Charges',
      width: 100,
      align: 'right',
      renderCell: (params: GridRenderCellParams) => {
        if (!params.row) return '₹0';
        const value = params.row.ep_charges;
        if (value === undefined || value === null || value === '') return '₹0';
        const amount = typeof value === 'number' ? value : parseFloat(String(value));
        return `₹${amount.toFixed(2)}`;
      },
    },
    {
      field: 'gst',
      headerName: 'GST',
      width: 80,
      align: 'right',
      renderCell: (params: GridRenderCellParams) => {
        if (!params.row) return '₹0';
        const value = params.row.gst;
        if (value === undefined || value === null || value === '') return '₹0';
        const amount = typeof value === 'number' ? value : parseFloat(String(value));
        return `₹${amount.toFixed(2)}`;
      },
    },
    {
      field: 'status',
      headerName: 'Txn Status',
      width: 100,
      renderCell: (params: GridRenderCellParams) => {
        const status = params.value;
        let color: any = 'default';
        if (status === 'SUCCESS') color = 'success';
        else if (status === 'FAILED') color = 'error';
        else if (status === 'PENDING') color = 'warning';

        return (
          <Chip
            label={status || '-'}
            size="small"
            color={color}
            variant="outlined"
          />
        );
      },
    },
    {
      field: 'settlement_status',
      headerName: 'Settlement Status',
      width: 130,
      renderCell: (params: GridRenderCellParams) => {
        const status = params.value;
        let color: any = 'default';
        let icon = null;

        switch (status) {
          case 'SETTLED':
          case 'COMPLETED':
            color = 'success';
            icon = <CheckCircle fontSize="small" />;
            break;
          case 'PENDING':
            color = 'warning';
            icon = <Schedule fontSize="small" />;
            break;
          case 'FAILED':
            color = 'error';
            icon = <Cancel fontSize="small" />;
            break;
        }

        return (
          <Chip
            icon={icon}
            label={status || '-'}
            size="small"
            color={color}
          />
        );
      },
    },
    {
      field: 'payment_mode',
      headerName: 'Payment Mode',
      width: 120,
    },
    {
      field: 'payee_name',
      headerName: 'Payee Name',
      width: 150,
    },
    {
      field: 'pg_name',
      headerName: 'PG Name',
      width: 100,
    },
    {
      field: 'bank_txn_id',
      headerName: 'Bank Txn ID',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
          {params.value || '-'}
        </Typography>
      ),
    },
    {
      field: 'settlement_utr',
      headerName: 'UTR Number',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title={params.value || 'N/A'}>
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            {params.value || 'N/A'}
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: 'settlement_by',
      headerName: 'Settled By',
      width: 100,
    },
    {
      field: 'settlement_remarks',
      headerName: 'Remarks',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title={params.value || 'N/A'}>
          <Typography variant="body2">
            {params.value || 'N/A'}
          </Typography>
        </Tooltip>
      ),
    },
  ];

  const SummaryCard = ({ title, value, subtitle, icon, trend }: any) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold">
              {value}
            </Typography>
            {subtitle && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {trend === 'up' && <TrendingUp sx={{ fontSize: 16, color: theme.palette.success.main, mr: 0.5 }} />}
                {trend === 'down' && <TrendingDown sx={{ fontSize: 16, color: theme.palette.error.main, mr: 0.5 }} />}
                <Typography variant="body2" color={trend === 'up' ? 'success.main' : 'error.main'}>
                  {subtitle}
                </Typography>
              </Box>
            )}
          </Box>
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
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Settlement Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track and manage all settlement transactions
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, value) => value && setViewMode(value)}
            size="small"
          >
            <ToggleButton value="list">List</ToggleButton>
            <ToggleButton value="grid">Grid</ToggleButton>
          </ToggleButtonGroup>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchSettlements}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={handleExport}
            disabled={loading || settlements.length === 0}
          >
            Export ({settlements.length})
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <SummaryCard
            title="Total Settled"
            value={summary.totalSettled}
            subtitle="+12% vs last month"
            icon={<CheckCircle />}
            trend="up"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <SummaryCard
            title="Pending"
            value={summary.totalPending}
            subtitle="Awaiting settlement"
            icon={<Schedule />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <SummaryCard
            title="Total Amount"
            value={`₹${(summary.totalAmount / 1000).toFixed(1)}K`}
            subtitle="+8% growth"
            icon={<AttachMoney />}
            trend="up"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <SummaryCard
            title="Avg TAT"
            value={`${summary.avgSettlementTime}hrs`}
            subtitle="-2hrs improved"
            icon={<Assessment />}
            trend="up"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <SummaryCard
            title="Today's Settlements"
            value={summary.todaySettlement}
            subtitle="Processed today"
            icon={<Receipt />}
          />
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Filters
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleQuickFilter(0)}
            >
              Today
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleQuickFilter(7)}
            >
              Last 7 Days
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleQuickFilter(30)}
            >
              Last 30 Days
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleQuickFilter(90)}
            >
              Last 90 Days
            </Button>
          </Box>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={parseISO(filters.date_from)}
                onChange={(date) => handleFilterChange('date_from', date ? format(date, 'yyyy-MM-dd') : '')}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="End Date"
                value={parseISO(filters.date_to)}
                onChange={(date) => handleFilterChange('date_to', date ? format(date, 'yyyy-MM-dd') : '')}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Settlement Status</InputLabel>
              <Select
                value={filters.settlement_status}
                onChange={(e) => handleFilterChange('settlement_status', e.target.value)}
                label="Settlement Status"
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                    },
                  },
                }}
              >
                {settlementStatuses.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Date Type</InputLabel>
              <Select
                value={filters.use_settlement_date ? 'settlement' : 'transaction'}
                onChange={(e) => handleFilterChange('use_settlement_date', e.target.value === 'settlement')}
                label="Date Type"
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                    },
                  },
                }}
              >
                <MenuItem value="settlement">Settlement Date</MenuItem>
                <MenuItem value="transaction">Transaction Date</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Pagination Controls */}
      {totalRecords > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Showing {getRecordRange().start}-{getRecordRange().end} of {totalRecords.toLocaleString('en-IN')} settlements
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Page {currentPage} of {getTotalPages()}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<NavigateBefore />}
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1 || loading}
                >
                  Previous
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  endIcon={<NavigateNext />}
                  onClick={handleNextPage}
                  disabled={currentPage >= getTotalPages() || loading}
                >
                  Next
                </Button>
              </Box>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, v) => {
            setTabValue(v);
            // Map tab index to settlement status
            let status = 'ALL';
            switch(v) {
              case 0: status = 'ALL'; break;
              case 1: status = 'PENDING'; break;
              case 2: status = 'COMPLETED'; break;  // Will include both COMPLETED and SETTLED
              case 3: status = 'FAILED'; break;
            }
            handleFilterChange('settlement_status', status);
          }}
        >
          <Tab
            label={`All Settlements (${settlements.length})`}
            icon={<AccountBalance />}
            iconPosition="start"
          />
          <Tab
            label={`Pending (${settlements.filter(s => s.settlement_status === 'PENDING' || s.settlement_status === 'PROCESSING').length})`}
            icon={<Schedule />}
            iconPosition="start"
          />
          <Tab
            label={`Completed (${settlements.filter(s => s.settlement_status === 'COMPLETED' || s.settlement_status === 'SETTLED').length})`}
            icon={<CheckCircle />}
            iconPosition="start"
          />
          <Tab
            label={`Failed (${settlements.filter(s => s.settlement_status === 'FAILED').length})`}
            icon={<Cancel />}
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Data Grid */}
      <Paper sx={{ height: 600 }}>
        {loading && <LinearProgress />}
        <DataGrid
          rows={settlements}
          columns={columns}
          getRowId={(row) => row.txn_id}
          pageSizeOptions={[25, 50, 100]}
          checkboxSelection
          disableRowSelectionOnClick
          sx={{
            '& .MuiDataGrid-cell:focus': {
              outline: 'none',
            },
          }}
        />
      </Paper>
    </Box>
  );
};

export default SettlementList;