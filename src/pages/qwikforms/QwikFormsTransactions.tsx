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
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
} from '@mui/material';
import { DataGrid, GridColDef, GridPaginationModel } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DescriptionIcon from '@mui/icons-material/Description';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import DownloadIcon from '@mui/icons-material/Download';
import qwikformsService, { QwikFormsTransaction, QwikFormsFilters } from '../../services/qwikformsService';
import { format } from 'date-fns';

const QwikFormsTransactions: React.FC = () => {
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
    trans_status: '',
    trans_paymode: '',
    client_code: '',
    form_id: undefined,
    search: '',
  });

  // Client and Form dropdowns state
  const [clients, setClients] = useState<any[]>([]);
  const [allForms, setAllForms] = useState<any[]>([]);
  const [filteredForms, setFilteredForms] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);

  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);

  // Detail Dialog
  const [selectedTransaction, setSelectedTransaction] = useState<QwikFormsTransaction | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Form Data Dialog
  const [selectedFormData, setSelectedFormData] = useState<any>(null);
  const [formDialogOpen, setFormDialogOpen] = useState(false);

  // Status options
  const statusOptions = ['SUCCESS', 'FAILED', 'PENDING', 'PROCESSING'];
  const paymentModeOptions = ['UPI', 'CARD', 'NETBANKING', 'WALLET', 'EMI'];

  // Load clients and forms
  const loadClientsAndForms = async () => {
    try {
      const response = await qwikformsService.getClientsAndForms();
      if (response.success && response.data) {
        setClients(response.data.clients || []);

        // Extract all forms from all clients
        const allFormsArray: any[] = [];
        response.data.clients.forEach((client: any) => {
          if (client.forms && client.forms.length > 0) {
            client.forms.forEach((form: any) => {
              allFormsArray.push({
                ...form,
                client_id: client.college_id,
                client_code: client.college_code,
                client_name: client.college_name
              });
            });
          }
        });
        setAllForms(allFormsArray);
      }
    } catch (err: any) {
      console.error('Error loading clients and forms:', err);
    }
  };

  // Load transactions
  const loadTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Loading QwikForms transactions with filters:', filters);
      const response = await qwikformsService.getTransactions({
        ...filters,
        page: paginationModel.page + 1,
        page_size: paginationModel.pageSize,
      });

      console.log('QwikForms API Response:', response);

      if (response && response.success !== false) {
        setTransactions(response.results || []);
        setTotalCount(response.count || 0);
      } else {
        // Service returned error
        setTransactions([]);
        setTotalCount(0);
        if (response.error) {
          console.error('QwikForms API Error:', response.error);
          // Only show user-friendly errors
          if (response.error.response?.status === 401) {
            setError('Unauthorized. Please log in as admin.');
          } else if (response.error.response?.status === 403) {
            setError('Access denied. QwikForms is admin-only.');
          } else if (response.error.response?.status === 500) {
            setError('Server error. Please try again later.');
          }
        }
      }
    } catch (err: any) {
      console.error('Unexpected error loading transactions:', err);
      setTransactions([]);
      setTotalCount(0);
      // Only show error for actual failures, not for empty results
      if (err.response?.status && err.response.status !== 404) {
        if (err.response.status === 401) {
          setError('Unauthorized. Please log in as admin.');
        } else if (err.response.status === 403) {
          setError('Access denied. QwikForms is admin-only.');
        } else {
          setError(err.response?.data?.message || 'Failed to load transactions');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientsAndForms();
  }, []);

  useEffect(() => {
    loadTransactions();
  }, [paginationModel]);

  // Handle client code selection (cascading dropdown logic)
  const handleClientCodeChange = (clientCode: string) => {
    setFilters({ ...filters, client_code: clientCode, form_id: undefined });

    if (clientCode) {
      // Find the selected client
      const selectedClient = clients.find(c => c.college_code === clientCode);
      if (selectedClient) {
        setSelectedClientId(selectedClient.college_id);
        // Filter forms for this client
        setFilteredForms(selectedClient.forms || []);
      } else {
        setSelectedClientId(null);
        setFilteredForms([]);
      }
    } else {
      // No client selected, show all forms
      setSelectedClientId(null);
      setFilteredForms([]);
    }
  };

  // Handle form selection
  const handleFormChange = (formId: number | undefined) => {
    setFilters({ ...filters, form_id: formId });
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
      trans_status: '',
      trans_paymode: '',
      client_code: '',
      form_id: undefined,
      search: '',
    });
    setDateFrom(null);
    setDateTo(null);
    setSelectedClientId(null);
    setFilteredForms([]);
    setPaginationModel({ ...paginationModel, page: 0 });
  };

  // View transaction detail
  const handleViewDetail = async (transactionId: number) => {
    try {
      const transaction = await qwikformsService.getTransactionDetail(transactionId);
      setSelectedTransaction(transaction);
      setDetailOpen(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load transaction detail');
    }
  };

  // View form data
  const handleViewForm = (formData: any) => {
    setSelectedFormData(formData);
    setFormDialogOpen(true);
  };

  // Parse form_data string to display fields
  const parseFormData = (formDataString: string) => {
    if (!formDataString) return [];

    try {
      // Format: "18~College Code=CGECB$13,19~APPLICANT_NAME=TEST$17,..."
      const fields = formDataString.split(',');
      return fields.map(field => {
        const parts = field.split('~');
        if (parts.length >= 2) {
          const labelValue = parts[1].split('=');
          return {
            label: labelValue[0] || '',
            value: labelValue[1]?.split('$')[0] || ''
          };
        }
        return null;
      }).filter(Boolean);
    } catch (e) {
      return [];
    }
  };

  // Export transactions
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

  // DataGrid columns
  const columns: GridColDef[] = [
    {
      field: 'client_code',
      headerName: 'Client Code',
      width: 120,
      sortable: false,
      valueGetter: (value, row) => row.client_code || '',
    },
    {
      field: 'client_name',
      headerName: 'Client Name',
      width: 250,
      sortable: false,
      valueGetter: (value, row) => row.client_name || '',
    },
    {
      field: 'bank_name',
      headerName: 'Bank',
      width: 120,
      sortable: false,
      valueGetter: (value, row) => row.bank_name || '',
    },
    {
      field: 'form_number',
      headerName: 'Form Number',
      width: 180,
      sortable: false,
      valueGetter: (value, row) => row.form_data?.form_number || row.form_number || '-',
    },
    {
      field: 'trans_id',
      headerName: 'Transaction ID',
      width: 180,
      sortable: false,
      valueGetter: (value, row) => row.trans_id || '',
    },
    {
      field: 'sp_trans_id',
      headerName: 'SP Trans ID',
      width: 180,
      sortable: false,
      valueGetter: (value, row) => row.sp_trans_id || '',
    },
    {
      field: 'trans_paymode',
      headerName: 'Payment Mode',
      width: 130,
      sortable: false,
      valueGetter: (value, row) => row.trans_paymode || '',
    },
    {
      field: 'trans_status',
      headerName: 'Status',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Chip
          label={String(params?.value || '')}
          color={getStatusColor(params?.value)}
          size="small"
        />
      ),
    },
    {
      field: 'trans_date',
      headerName: 'Date',
      width: 160,
      sortable: false,
      valueGetter: (value, row) => {
        return row.trans_date ? format(new Date(row.trans_date), 'dd MMM yyyy HH:mm') : '-';
      },
    },
    {
      field: 'trans_amount',
      headerName: 'Amount',
      width: 120,
      sortable: false,
      valueGetter: (value, row) => row.trans_amount ? `₹${parseFloat(row.trans_amount).toFixed(2)}` : '₹0.00',
    },
    {
      field: 'name',
      headerName: 'Customer Name',
      width: 180,
      sortable: false,
      valueGetter: (value, row) => row.form_data?.name || row.name || '-',
    },
    {
      field: 'contact',
      headerName: 'Contact',
      width: 120,
      sortable: false,
      valueGetter: (value, row) => row.form_data?.contact || row.contact || '-',
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 200,
      sortable: false,
      valueGetter: (value, row) => row.form_data?.email || row.email || '-',
    },
    {
      field: 'pg_trans_id',
      headerName: 'PG Trans ID',
      width: 150,
      sortable: false,
      valueGetter: (value, row) => row.pg_trans_id || '-',
    },
    {
      field: 'challanno',
      headerName: 'Challan No',
      width: 150,
      sortable: false,
      valueGetter: (value, row) => row.challanno || '-',
    },
    {
      field: 'settlement_status',
      headerName: 'Settlement Status',
      width: 140,
      sortable: false,
      valueGetter: (value, row) => row.settlement_status || 'Pending',
    },
    {
      field: 'settlement_date',
      headerName: 'Settlement Date',
      width: 150,
      sortable: false,
      valueGetter: (value, row) => {
        return row.settlement_date ? format(new Date(row.settlement_date), 'dd MMM yyyy') : '-';
      },
    },
    {
      field: 'settlement_amount',
      headerName: 'Settlement Amount',
      width: 140,
      sortable: false,
      valueGetter: (value, row) => row.settlement_amount ? `₹${parseFloat(row.settlement_amount).toFixed(2)}` : '-',
    },
    {
      field: 'is_settled',
      headerName: 'Is Settled',
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <Chip
          label={params?.value ? 'Yes' : 'No'}
          color={params?.value ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'refund_id',
      headerName: 'Refund Status',
      width: 120,
      sortable: false,
      valueGetter: (value, row) => row.refund_id ? 'Refunded' : '-',
    },
    {
      field: 'refund_submit_date',
      headerName: 'Refund Date',
      width: 150,
      sortable: false,
      valueGetter: (value, row) => {
        return row.refund_submit_date ? format(new Date(row.refund_submit_date), 'dd MMM yyyy') : '-';
      },
    },
    {
      field: 'refund_amount',
      headerName: 'Refund Amount',
      width: 130,
      sortable: false,
      valueGetter: (value, row) => row.refund_amount ? `₹${parseFloat(row.refund_amount).toFixed(2)}` : '-',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            size="small"
            onClick={() => handleViewDetail(params.row.transaction_id)}
            color="primary"
            title="View Transaction Details"
          >
            <VisibilityIcon fontSize="small" />
          </IconButton>
          {params.row.form_data && (
            <IconButton
              size="small"
              onClick={() => handleViewForm(params.row.form_data)}
              color="secondary"
              title="View Form Details"
            >
              <DescriptionIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      ),
    },
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          QwikForms Transactions
        </Typography>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Filters
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={2.4}>
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
              <Grid item xs={12} sm={6} md={2.4}>
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
              <Grid item xs={12} sm={6} md={3.6}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Transaction Status"
                  value={filters.trans_status}
                  onChange={(e) => handleFilterChange('trans_status', e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                    style: { whiteSpace: 'nowrap' }
                  }}
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
                  {statusOptions.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={3.6}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Payment Mode"
                  value={filters.trans_paymode}
                  onChange={(e) => handleFilterChange('trans_paymode', e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                    style: { whiteSpace: 'nowrap' }
                  }}
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
                  select
                  fullWidth
                  size="small"
                  label="Client Code"
                  value={filters.client_code || ''}
                  onChange={(e) => handleClientCodeChange(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                    style: { whiteSpace: 'nowrap' }
                  }}
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
                  <MenuItem value="">All Clients</MenuItem>
                  {clients.map((client) => (
                    <MenuItem key={client.college_id} value={client.college_code}>
                      {client.college_code} - {client.college_name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Form Name"
                  value={filters.form_id || ''}
                  onChange={(e) => handleFormChange(e.target.value ? parseInt(e.target.value) : undefined)}
                  disabled={!filters.client_code}
                  InputLabelProps={{
                    shrink: true,
                    style: { whiteSpace: 'nowrap' }
                  }}
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
                  <MenuItem value="">All Forms</MenuItem>
                  {filteredForms.map((form) => (
                    <MenuItem key={form.id} value={form.id}>
                      {form.form_name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Transaction ID"
                  placeholder="Transaction ID"
                  value={filters.trans_id || ''}
                  onChange={(e) => handleFilterChange('trans_id', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="SP Trans ID"
                  placeholder="SP Trans ID"
                  value={filters.sp_trans_id || ''}
                  onChange={(e) => handleFilterChange('sp_trans_id', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search"
                  placeholder="Name, Email, Contact..."
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

        {/* Transactions Table */}
        <Card>
          <CardContent>
            <DataGrid
              rows={transactions}
              columns={columns}
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

        {/* Transaction Detail Dialog */}
        <Dialog
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Transaction Detail</DialogTitle>
          <DialogContent dividers>
            {selectedTransaction && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Transaction Information
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Transaction ID
                  </Typography>
                  <Typography variant="body1">{selectedTransaction.trans_id}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    SabPaisa Trans ID
                  </Typography>
                  <Typography variant="body1">{selectedTransaction.sp_trans_id}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Date
                  </Typography>
                  <Typography variant="body1">
                    {format(new Date(selectedTransaction.trans_date), 'dd MMM yyyy HH:mm:ss')}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Amount
                  </Typography>
                  <Typography variant="body1">₹{selectedTransaction.trans_amount.toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={selectedTransaction.trans_status}
                    color={getStatusColor(selectedTransaction.trans_status)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Payment Mode
                  </Typography>
                  <Typography variant="body1">{selectedTransaction.trans_paymode}</Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Customer Information
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Name
                  </Typography>
                  <Typography variant="body1">{selectedTransaction.customer_name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Email
                  </Typography>
                  <Typography variant="body1">{selectedTransaction.customer_email}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Contact
                  </Typography>
                  <Typography variant="body1">{selectedTransaction.customer_contact}</Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Payment Gateway Details
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    PG Trans ID
                  </Typography>
                  <Typography variant="body1">{selectedTransaction.pg_trans_id || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Response Code
                  </Typography>
                  <Typography variant="body1">{selectedTransaction.pg_resp_code || '-'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Bank Reference No
                  </Typography>
                  <Typography variant="body1">{selectedTransaction.bank_reference_no || '-'}</Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Financial Details
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">
                    Transaction Amount
                  </Typography>
                  <Typography variant="body1">₹{selectedTransaction.trans_amount.toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">
                    Charges
                  </Typography>
                  <Typography variant="body1">₹{selectedTransaction.trans_charges.toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="body2" color="text.secondary">
                    Actual Amount
                  </Typography>
                  <Typography variant="body1">₹{selectedTransaction.act_amount.toFixed(2)}</Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Settlement Details
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Settlement Status
                  </Typography>
                  <Chip
                    label={selectedTransaction.settlement_status}
                    color={getStatusColor(selectedTransaction.settlement_status)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Is Settled
                  </Typography>
                  <Typography variant="body1">{selectedTransaction.is_settled === 'Y' ? 'Yes' : 'No'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Settlement Date
                  </Typography>
                  <Typography variant="body1">
                    {selectedTransaction.settlement_date
                      ? format(new Date(selectedTransaction.settlement_date), 'dd MMM yyyy')
                      : '-'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Settlement Amount
                  </Typography>
                  <Typography variant="body1">
                    {selectedTransaction.settlement_amount
                      ? `₹${selectedTransaction.settlement_amount.toFixed(2)}`
                      : '-'}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Client & Form Details
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Client ID
                  </Typography>
                  <Typography variant="body1">{selectedTransaction.client_id}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Client Code
                  </Typography>
                  <Typography variant="body1">{selectedTransaction.client_code || '-'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Client Name
                  </Typography>
                  <Typography variant="body1">{selectedTransaction.client_name || '-'}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Bank Name
                  </Typography>
                  <Typography variant="body1">{selectedTransaction.bank_name || '-'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Form ID
                  </Typography>
                  <Typography variant="body1">{selectedTransaction.form_id}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Form Fee Name
                  </Typography>
                  <Typography variant="body1">{selectedTransaction.form_fee_name}</Typography>
                </Grid>

                {selectedTransaction.form_data && (
                  <>
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                        Form Data
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Box
                        sx={{
                          bgcolor: '#f5f5f5',
                          p: 2,
                          borderRadius: 1,
                          maxHeight: 300,
                          overflow: 'auto',
                        }}
                      >
                        <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                          {JSON.stringify(selectedTransaction.form_data, null, 2)}
                        </pre>
                      </Box>
                    </Grid>
                  </>
                )}
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Form Data Dialog */}
        <Dialog
          open={formDialogOpen}
          onClose={() => setFormDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Form Details</DialogTitle>
          <DialogContent dividers>
            {selectedFormData && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6" sx={{ mt: 1, mb: 1, borderBottom: '2px solid #1976d2', pb: 1 }}>
                  Key Information
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #e0e0e0' }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>Form Number:</Typography>
                  <Typography variant="body2" fontWeight={600}>{selectedFormData.form_number || '-'}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #e0e0e0' }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>Form Transaction ID:</Typography>
                  <Typography variant="body2" fontWeight={600}>{selectedFormData.form_trans_id || '-'}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #e0e0e0' }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>SP Trans ID:</Typography>
                  <Typography variant="body2" fontWeight={600}>{selectedFormData.sp_trans_id || '-'}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #e0e0e0' }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>Transaction Amount:</Typography>
                  <Typography variant="body2" fontWeight={600} color="primary">
                    {selectedFormData.trans_amount ? `₹${parseFloat(selectedFormData.trans_amount).toFixed(2)}` : '-'}
                  </Typography>
                </Box>

                {selectedFormData.form_data && (
                  <>
                    <Typography variant="h6" sx={{ mt: 2, mb: 1, borderBottom: '2px solid #1976d2', pb: 1 }}>
                      Form Data (Raw)
                    </Typography>
                    <Box
                      sx={{
                        bgcolor: '#f5f5f5',
                        p: 2,
                        borderRadius: 1,
                        maxHeight: 200,
                        overflow: 'auto',
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                      }}
                    >
                      {selectedFormData.form_data}
                    </Box>
                  </>
                )}

                <Typography variant="h6" sx={{ mt: 2, mb: 1, borderBottom: '2px solid #1976d2', pb: 1 }}>
                  Additional Information
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #e0e0e0' }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>Form ID:</Typography>
                  <Typography variant="body2">{selectedFormData.form_id || '-'}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #e0e0e0' }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>Form Fee Name:</Typography>
                  <Typography variant="body2">{selectedFormData.form_fee_name || '-'}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #e0e0e0' }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>Form Date:</Typography>
                  <Typography variant="body2">
                    {selectedFormData.form_date ? format(new Date(selectedFormData.form_date), 'dd MMM yyyy HH:mm') : '-'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #e0e0e0' }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>Date of Birth:</Typography>
                  <Typography variant="body2">
                    {selectedFormData.dob_date ? format(new Date(selectedFormData.dob_date), 'dd MMM yyyy') : '-'}
                  </Typography>
                </Box>

                <Typography variant="h6" sx={{ mt: 2, mb: 1, borderBottom: '2px solid #1976d2', pb: 1 }}>
                  Applicant Information
                </Typography>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #e0e0e0' }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>Name:</Typography>
                  <Typography variant="body2">{selectedFormData.name || '-'}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #e0e0e0' }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>Email:</Typography>
                  <Typography variant="body2">{selectedFormData.email || '-'}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #e0e0e0' }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>Contact:</Typography>
                  <Typography variant="body2">{selectedFormData.contact || '-'}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #e0e0e0' }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>Form Template ID:</Typography>
                  <Typography variant="body2">{selectedFormData.form_template_id || '-'}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #e0e0e0' }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>Payer ID:</Typography>
                  <Typography variant="body2">{selectedFormData.payer_id || '-'}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 1, borderBottom: '1px solid #e0e0e0' }}>
                  <Typography variant="body2" color="text.secondary" fontWeight={600}>Code:</Typography>
                  <Typography variant="body2">{selectedFormData.code || '-'}</Typography>
                </Box>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFormDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default QwikFormsTransactions;