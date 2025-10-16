import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Chip,
  Tabs,
  Tab,
  Alert,
} from '@mui/material';
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import DownloadIcon from '@mui/icons-material/Download';
import qwikformsService, { QwikFormsTransaction, QwikFormsFilters } from '../../services/qwikformsService';
import { format } from 'date-fns';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settlements-tabpanel-${index}`}
      aria-labelledby={`settlements-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const QwikFormsSettlements: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [transactions, setTransactions] = useState<QwikFormsTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Pagination
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  });

  // Filters
  const [filters, setFilters] = useState<QwikFormsFilters>({
    date_from: '',
    date_to: '',
    trans_paymode: '',
    client_id: '',
    search: '',
  });

  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);

  const paymentModeOptions = ['UPI', 'CARD', 'NETBANKING', 'WALLET', 'EMI'];

  // Load transactions based on tab
  const loadTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      let response;
      const requestFilters = {
        ...filters,
        page: paginationModel.page + 1,
        page_size: paginationModel.pageSize,
      };

      if (tabValue === 0) {
        // Settled
        response = await qwikformsService.getSettledTransactions(requestFilters);
      } else if (tabValue === 1) {
        // Pending
        response = await qwikformsService.getPendingSettlements(requestFilters);
      } else {
        // Refunds
        response = await qwikformsService.getRefunds(requestFilters);
      }

      setTransactions(response.results || []);
      setTotalCount(response.count || 0);
    } catch (err: any) {
      // Only show error for actual failures, not for empty results
      if (err.response?.status && err.response.status !== 404) {
        setError(err.response?.data?.message || 'Failed to load settlements');
      }
      // For 404 or no results, just set empty data
      setTransactions([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [paginationModel, tabValue]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setPaginationModel({ ...paginationModel, page: 0 });
  };

  // Handle filter change
  const handleFilterChange = (field: string, value: any) => {
    setFilters({ ...filters, [field]: value });
  };

  // Handle date changes
  const handleDateFromChange = (date: Date | null) => {
    setDateFrom(date);
    setFilters({
      ...filters,
      date_from: date ? format(date, 'yyyy-MM-dd') : '',
    });
  };

  const handleDateToChange = (date: Date | null) => {
    setDateTo(date);
    setFilters({
      ...filters,
      date_to: date ? format(date, 'yyyy-MM-dd') : '',
    });
  };

  // Apply filters
  const handleApplyFilters = () => {
    setPaginationModel({ ...paginationModel, page: 0 });
    loadTransactions();
  };

  // Clear filters
  const handleClearFilters = () => {
    setFilters({
      date_from: '',
      date_to: '',
      trans_paymode: '',
      client_id: '',
      search: '',
    });
    setDateFrom(null);
    setDateTo(null);
    setPaginationModel({ ...paginationModel, page: 0 });
  };

  // Export
  const handleExport = async (format: 'excel' | 'csv') => {
    try {
      if (format === 'excel') {
        await qwikformsService.generateExcelReport(filters);
      } else {
        await qwikformsService.generateCSVReport(filters);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to generate ${format.toUpperCase()} report`);
    }
  };

  // Status chip color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS':
      case 'COMPLETED':
        return 'success';
      case 'FAILED':
        return 'error';
      case 'PENDING':
      case 'PROCESSING':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Common columns
  const baseColumns: GridColDef[] = [
    {
      field: 'trans_id',
      headerName: 'Transaction ID',
      width: 150,
      sortable: false,
      valueFormatter: (params) => params ? String(params.value || '') : '',
    },
    {
      field: 'trans_date',
      headerName: 'Date',
      width: 180,
      sortable: false,
      valueFormatter: (params) => {
        return params?.value ? format(new Date(params.value), 'dd MMM yyyy HH:mm') : '-';
      },
    },
    {
      field: 'customer_name',
      headerName: 'Customer',
      width: 180,
      sortable: false,
      valueFormatter: (params) => params ? String(params.value || '') : '',
    },
    {
      field: 'trans_amount',
      headerName: 'Amount',
      width: 120,
      sortable: false,
      valueFormatter: (params) => params?.value ? `₹${parseFloat(params.value).toFixed(2)}` : '₹0.00',
    },
    {
      field: 'trans_paymode',
      headerName: 'Payment Mode',
      width: 130,
      sortable: false,
      valueFormatter: (params) => params ? String(params.value || '') : '',
    },
    {
      field: 'client_name',
      headerName: 'Client',
      width: 200,
      sortable: false,
      valueFormatter: (params) => params ? String(params.value || '') : '',
    },
  ];

  // Settled columns
  const settledColumns: GridColDef[] = [
    ...baseColumns,
    {
      field: 'settlement_date',
      headerName: 'Settlement Date',
      width: 150,
      sortable: false,
      valueFormatter: (params) => {
        return params?.value ? format(new Date(params.value), 'dd MMM yyyy') : '-';
      },
    },
    {
      field: 'settlement_amount',
      headerName: 'Settlement Amount',
      width: 150,
      sortable: false,
      valueFormatter: (params) => params?.value ? `₹${parseFloat(params.value).toFixed(2)}` : '₹0.00',
    },
    {
      field: 'settlement_status',
      headerName: 'Status',
      width: 130,
      sortable: false,
      renderCell: (params) => (
        <Chip label={String(params?.value || '')} color={getStatusColor(params?.value)} size="small" />
      ),
    },
  ];

  // Pending columns
  const pendingColumns: GridColDef[] = [
    ...baseColumns,
    {
      field: 'settlement_status',
      headerName: 'Status',
      width: 130,
      sortable: false,
      renderCell: (params) => (
        <Chip label={String(params?.value || '')} color={getStatusColor(params?.value)} size="small" />
      ),
    },
    {
      field: 'trans_charges',
      headerName: 'Charges',
      width: 120,
      sortable: false,
      valueFormatter: (params) => params?.value ? `₹${parseFloat(params.value).toFixed(2)}` : '₹0.00',
    },
    {
      field: 'act_amount',
      headerName: 'Net Amount',
      width: 120,
      sortable: false,
      valueFormatter: (params) => params?.value ? `₹${parseFloat(params.value).toFixed(2)}` : '₹0.00',
    },
  ];

  // Refund columns
  const refundColumns: GridColDef[] = [
    ...baseColumns,
    {
      field: 'refund_id',
      headerName: 'Refund ID',
      width: 150,
      sortable: false,
      valueFormatter: (params) => params ? String(params.value || '') : '',
    },
    {
      field: 'refund_amount',
      headerName: 'Refund Amount',
      width: 130,
      sortable: false,
      valueFormatter: (params) => params?.value ? `₹${parseFloat(params.value).toFixed(2)}` : '-',
    },
    {
      field: 'refund_submit_date',
      headerName: 'Submit Date',
      width: 150,
      sortable: false,
      valueFormatter: (params) => {
        return params?.value ? format(new Date(params.value), 'dd MMM yyyy') : '-';
      },
    },
    {
      field: 'refund_close_date',
      headerName: 'Close Date',
      width: 150,
      sortable: false,
      valueFormatter: (params) => {
        return params?.value ? format(new Date(params.value), 'dd MMM yyyy') : '-';
      },
    },
  ];

  const getColumns = () => {
    switch (tabValue) {
      case 0:
        return settledColumns;
      case 1:
        return pendingColumns;
      case 2:
        return refundColumns;
      default:
        return baseColumns;
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          QwikForms Settlements
        </Typography>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Settled" />
            <Tab label="Pending" />
            <Tab label="Refunds" />
          </Tabs>
        </Box>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Filters
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="Date From"
                  value={dateFrom}
                  onChange={handleDateFromChange}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <DatePicker
                  label="Date To"
                  value={dateTo}
                  onChange={handleDateToChange}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: 'small',
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Payment Mode"
                  value={filters.trans_paymode}
                  onChange={(e) => handleFilterChange('trans_paymode', e.target.value)}
                  SelectProps={{
                    MenuProps: {
                      PaperProps: {
                        style: {
                          maxHeight: 300,
                        },
                      },
                    },
                  }}
                >
                  <MenuItem value="">All</MenuItem>
                  {paymentModeOptions.map((mode) => (
                    <MenuItem key={mode} value={mode}>
                      {mode}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Client ID"
                  value={filters.client_id}
                  onChange={(e) => handleFilterChange('client_id', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search"
                  placeholder="Trans ID, Customer..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={<SearchIcon />}
                    onClick={handleApplyFilters}
                  >
                    Apply Filters
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<ClearIcon />}
                    onClick={handleClearFilters}
                  >
                    Clear
                  </Button>
                  <Box sx={{ flexGrow: 1 }} />
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleExport('excel')}
                  >
                    Excel
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleExport('csv')}
                  >
                    CSV
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Tab Panels */}
        <TabPanel value={tabValue} index={0}>
          <Card>
            <CardContent>
              <DataGrid
                rows={transactions}
                columns={getColumns()}
                getRowId={(row) => row.transaction_id}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[10, 25, 50, 100]}
                rowCount={totalCount}
                paginationMode="server"
                loading={loading}
                disableColumnMenu
                disableRowSelectionOnClick
                autoHeight
                sx={{
                  '& .MuiDataGrid-cell': {
                    borderBottom: '1px solid #f0f0f0',
                  },
                }}
              />
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Card>
            <CardContent>
              <DataGrid
                rows={transactions}
                columns={getColumns()}
                getRowId={(row) => row.transaction_id}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[10, 25, 50, 100]}
                rowCount={totalCount}
                paginationMode="server"
                loading={loading}
                disableColumnMenu
                disableRowSelectionOnClick
                autoHeight
                sx={{
                  '& .MuiDataGrid-cell': {
                    borderBottom: '1px solid #f0f0f0',
                  },
                }}
              />
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Card>
            <CardContent>
              <DataGrid
                rows={transactions}
                columns={getColumns()}
                getRowId={(row) => row.transaction_id}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[10, 25, 50, 100]}
                rowCount={totalCount}
                paginationMode="server"
                loading={loading}
                disableColumnMenu
                disableRowSelectionOnClick
                autoHeight
                sx={{
                  '& .MuiDataGrid-cell': {
                    borderBottom: '1px solid #f0f0f0',
                  },
                }}
              />
            </CardContent>
          </Card>
        </TabPanel>
      </Box>
    </LocalizationProvider>
  );
};

export default QwikFormsSettlements;