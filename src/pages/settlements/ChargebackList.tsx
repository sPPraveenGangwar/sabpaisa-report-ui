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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  Badge,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
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
  Warning,
  Gavel,
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
  CreditCardOff,
  Report,
  Security,
  AttachFile,
  Send,
  History,
  AccountBalance,
  PriorityHigh,
  Info,
} from '@mui/icons-material';
import { format, parseISO, subDays, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';
import apiClient from '../../config/api.config';
import { Chargeback } from '../../types/transaction.types';

const ChargebackList: React.FC = () => {
  const theme = useTheme();
  const [chargebacks, setChargebacks] = useState<Chargeback[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedChargeback, setSelectedChargeback] = useState<Chargeback | null>(null);
  const [disputeDialog, setDisputeDialog] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [filters, setFilters] = useState({
    date_from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    date_to: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    status: 'ALL',
    priority: 'ALL',
  });

  const [summary, setSummary] = useState({
    totalChargebacks: 0,
    openDisputes: 0,
    wonCases: 0,
    lostCases: 0,
    totalAmount: 0,
    avgResolutionTime: 0,
    winRate: 0,
    pendingResponse: 0,
  });

  const chargebackStatuses = ['ALL', 'INITIATED', 'DISPUTED', 'ACCEPTED', 'REJECTED', 'PENDING'];
  const priorities = ['ALL', 'HIGH', 'MEDIUM', 'LOW'];

  const disputeSteps = [
    'Review Chargeback Details',
    'Gather Transaction Evidence',
    'Prepare Dispute Documents',
    'Submit Response',
    'Await Decision'
  ];

  useEffect(() => {
    fetchChargebacks();
  }, [filters]);

  const fetchChargebacks = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration
      const mockData: Chargeback[] = [
        {
          id: 'CB001',
          txn_id: 'TXN2024001',
          client_name: 'ABC Merchants Ltd',
          trans_date: '2024-01-15',
          chargeback_date: '2024-01-20',
          amount: 15000,
          reason: 'Fraudulent Transaction',
          reason_code: 'FR1',
          status: 'DISPUTED',
          priority: 'HIGH',
          due_date: '2024-02-05',
          payment_mode: 'Credit Card',
          card_number: '**** **** **** 1234',
          customer_name: 'John Doe',
          customer_email: 'john@example.com',
        },
        {
          id: 'CB002',
          txn_id: 'TXN2024002',
          client_name: 'XYZ Enterprises',
          trans_date: '2024-01-10',
          chargeback_date: '2024-01-18',
          amount: 8500,
          reason: 'Product Not Received',
          reason_code: 'NR2',
          status: 'PENDING',
          priority: 'MEDIUM',
          due_date: '2024-02-01',
          payment_mode: 'Debit Card',
          card_number: '**** **** **** 5678',
          customer_name: 'Jane Smith',
          customer_email: 'jane@example.com',
        },
        {
          id: 'CB003',
          txn_id: 'TXN2024003',
          client_name: 'Global Trading Co',
          trans_date: '2024-01-05',
          chargeback_date: '2024-01-12',
          amount: 25000,
          reason: 'Duplicate Processing',
          reason_code: 'DP3',
          status: 'ACCEPTED',
          priority: 'LOW',
          due_date: '2024-01-28',
          payment_mode: 'Credit Card',
          card_number: '**** **** **** 9012',
          customer_name: 'Robert Brown',
          customer_email: 'robert@example.com',
        },
      ];

      setChargebacks(mockData);

      // Calculate summary
      const disputed = mockData.filter(c => c.status === 'DISPUTED').length;
      const accepted = mockData.filter(c => c.status === 'ACCEPTED').length;
      const rejected = mockData.filter(c => c.status === 'REJECTED').length;
      const pending = mockData.filter(c => c.status === 'PENDING').length;
      const total = mockData.reduce((sum, c) => sum + c.amount, 0);

      setSummary({
        totalChargebacks: mockData.length,
        openDisputes: disputed + pending,
        wonCases: rejected,
        lostCases: accepted,
        totalAmount: total,
        avgResolutionTime: 7.5,
        winRate: rejected > 0 ? (rejected / (rejected + accepted)) * 100 : 0,
        pendingResponse: pending,
      });
    } catch (error) {
      console.error('Error fetching chargebacks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleQuickFilter = (days: number) => {
    const endDate = new Date();
    const startDate = subDays(endDate, days);
    setFilters(prev => ({
      ...prev,
      date_from: format(startDate, 'yyyy-MM-dd'),
      date_to: format(endDate, 'yyyy-MM-dd'),
    }));
  };

  const handleDisputeChargeback = (chargeback: Chargeback) => {
    setSelectedChargeback(chargeback);
    setDisputeDialog(true);
    setActiveStep(0);
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      // Export logic here
      console.log('Exporting chargebacks...');
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'error';
      case 'MEDIUM':
        return 'warning';
      case 'LOW':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DISPUTED':
        return 'warning';
      case 'ACCEPTED':
        return 'error';
      case 'REJECTED':
        return 'success';
      case 'PENDING':
        return 'info';
      default:
        return 'default';
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'Chargeback ID',
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'txn_id',
      headerName: 'Transaction ID',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title="View transaction details">
          <Typography variant="body2" sx={{ fontFamily: 'monospace', cursor: 'pointer', color: theme.palette.primary.main }}>
            {params.value}
          </Typography>
        </Tooltip>
      ),
    },
    {
      field: 'client_name',
      headerName: 'Merchant',
      width: 200,
    },
    {
      field: 'chargeback_date',
      headerName: 'Chargeback Date',
      width: 140,
      valueGetter: (params: GridValueGetterParams) => {
        return params.value ? format(parseISO(params.value), 'dd MMM yyyy') : '';
      },
    },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 120,
      align: 'right',
      renderCell: (params: GridRenderCellParams) => (
        <Typography fontWeight="bold" color="error">
          ₹{params.value?.toLocaleString('en-IN')}
        </Typography>
      ),
    },
    {
      field: 'reason',
      headerName: 'Reason',
      width: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Box>
          <Typography variant="body2">{params.value}</Typography>
          <Typography variant="caption" color="text.secondary">
            Code: {params.row.reason_code}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'priority',
      headerName: 'Priority',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          size="small"
          color={getPriorityColor(params.value)}
          icon={params.value === 'HIGH' ? <PriorityHigh /> : undefined}
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value}
          size="small"
          color={getStatusColor(params.value)}
          variant={params.value === 'PENDING' ? 'outlined' : 'filled'}
        />
      ),
    },
    {
      field: 'due_date',
      headerName: 'Due Date',
      width: 140,
      renderCell: (params: GridRenderCellParams) => {
        const dueDate = parseISO(params.value);
        const daysRemaining = differenceInDays(dueDate, new Date());
        const isOverdue = daysRemaining < 0;
        const isUrgent = daysRemaining <= 3 && daysRemaining >= 0;

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {isOverdue && <Warning sx={{ color: theme.palette.error.main, fontSize: 18 }} />}
            {isUrgent && <Schedule sx={{ color: theme.palette.warning.main, fontSize: 18 }} />}
            <Box>
              <Typography variant="body2">
                {format(dueDate, 'dd MMM yyyy')}
              </Typography>
              <Typography variant="caption" color={isOverdue ? 'error' : isUrgent ? 'warning.main' : 'text.secondary'}>
                {isOverdue ? `Overdue by ${Math.abs(daysRemaining)} days` : `${daysRemaining} days remaining`}
              </Typography>
            </Box>
          </Box>
        );
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          {params.row.status === 'PENDING' && (
            <Button
              size="small"
              variant="contained"
              color="warning"
              startIcon={<Gavel />}
              onClick={() => handleDisputeChargeback(params.row)}
            >
              Dispute
            </Button>
          )}
          <IconButton size="small">
            <MoreVert />
          </IconButton>
        </Box>
      ),
    },
  ];

  const SummaryCard = ({ title, value, subtitle, icon, trend, color }: any) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="bold" color={color}>
              {value}
            </Typography>
            {subtitle && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {trend === 'up' && <TrendingUp sx={{ fontSize: 16, color: theme.palette.error.main, mr: 0.5 }} />}
                {trend === 'down' && <TrendingDown sx={{ fontSize: 16, color: theme.palette.success.main, mr: 0.5 }} />}
                <Typography variant="body2" color={trend === 'up' ? 'error.main' : 'success.main'}>
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
              bgcolor: alpha(color || theme.palette.primary.main, 0.1),
              color: color || theme.palette.primary.main,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  const ChargebackTimeline = () => (
    <Timeline position="alternate">
      <TimelineItem>
        <TimelineOppositeContent color="text.secondary">
          {format(parseISO(selectedChargeback?.trans_date || ''), 'dd MMM yyyy')}
        </TimelineOppositeContent>
        <TimelineSeparator>
          <TimelineDot color="success">
            <CheckCircle />
          </TimelineDot>
          <TimelineConnector />
        </TimelineSeparator>
        <TimelineContent>
          <Typography variant="h6">Transaction Completed</Typography>
          <Typography variant="body2">Amount: ₹{selectedChargeback?.amount}</Typography>
        </TimelineContent>
      </TimelineItem>

      <TimelineItem>
        <TimelineOppositeContent color="text.secondary">
          {format(parseISO(selectedChargeback?.chargeback_date || ''), 'dd MMM yyyy')}
        </TimelineOppositeContent>
        <TimelineSeparator>
          <TimelineDot color="error">
            <CreditCardOff />
          </TimelineDot>
          <TimelineConnector />
        </TimelineSeparator>
        <TimelineContent>
          <Typography variant="h6">Chargeback Initiated</Typography>
          <Typography variant="body2">{selectedChargeback?.reason}</Typography>
        </TimelineContent>
      </TimelineItem>

      <TimelineItem>
        <TimelineOppositeContent color="text.secondary">
          {format(new Date(), 'dd MMM yyyy')}
        </TimelineOppositeContent>
        <TimelineSeparator>
          <TimelineDot color="warning">
            <Gavel />
          </TimelineDot>
          <TimelineConnector />
        </TimelineSeparator>
        <TimelineContent>
          <Typography variant="h6">Dispute in Progress</Typography>
          <Typography variant="body2">Awaiting evidence submission</Typography>
        </TimelineContent>
      </TimelineItem>

      <TimelineItem>
        <TimelineOppositeContent color="text.secondary">
          Expected: {format(parseISO(selectedChargeback?.due_date || ''), 'dd MMM yyyy')}
        </TimelineOppositeContent>
        <TimelineSeparator>
          <TimelineDot color="grey">
            <Schedule />
          </TimelineDot>
        </TimelineSeparator>
        <TimelineContent>
          <Typography variant="h6">Final Decision</Typography>
          <Typography variant="body2">Pending resolution</Typography>
        </TimelineContent>
      </TimelineItem>
    </Timeline>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Chargeback Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monitor and dispute chargeback cases
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchChargebacks}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={handleExport}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Alert Banner */}
      <Alert severity="warning" sx={{ mb: 3 }} icon={<Warning />}>
        <Typography variant="subtitle2" fontWeight="bold">
          {summary.pendingResponse} chargebacks require immediate response
        </Typography>
        <Typography variant="body2">
          Average resolution time: {summary.avgResolutionTime} days | Win rate: {summary.winRate.toFixed(1)}%
        </Typography>
      </Alert>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Total Chargebacks"
            value={summary.totalChargebacks}
            subtitle="+15% vs last month"
            icon={<CreditCardOff />}
            trend="up"
            color={theme.palette.error.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Open Disputes"
            value={summary.openDisputes}
            subtitle="Requiring action"
            icon={<Gavel />}
            color={theme.palette.warning.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Won Cases"
            value={summary.wonCases}
            subtitle={`${summary.winRate.toFixed(1)}% win rate`}
            icon={<CheckCircle />}
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Total Amount"
            value={`₹${(summary.totalAmount / 1000).toFixed(1)}K`}
            subtitle="At risk"
            icon={<AccountBalance />}
            color={theme.palette.error.main}
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
            <Button size="small" variant="outlined" onClick={() => handleQuickFilter(7)}>
              Last 7 Days
            </Button>
            <Button size="small" variant="outlined" onClick={() => handleQuickFilter(30)}>
              Last 30 Days
            </Button>
            <Button size="small" variant="outlined" onClick={() => handleQuickFilter(90)}>
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
              <InputLabel>Status</InputLabel>
              <Select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                label="Status"
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                    },
                  },
                }}
              >
                {chargebackStatuses.map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Priority</InputLabel>
              <Select
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                label="Priority"
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                    },
                  },
                }}
              >
                {priorities.map((priority) => (
                  <MenuItem key={priority} value={priority}>
                    {priority}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Data Grid */}
      <Paper sx={{ height: 600 }}>
        {loading && <LinearProgress />}
        <DataGrid
          rows={chargebacks}
          columns={columns}
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

      {/* Dispute Dialog */}
      <Dialog
        open={disputeDialog}
        onClose={() => setDisputeDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Gavel />
            <Typography variant="h6">Dispute Chargeback</Typography>
            <Chip
              label={selectedChargeback?.id}
              size="small"
              sx={{ ml: 'auto' }}
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {/* Transaction Details */}
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight="bold">
                Transaction: {selectedChargeback?.txn_id}
              </Typography>
              <Typography variant="body2">
                Amount: ₹{selectedChargeback?.amount?.toLocaleString('en-IN')} |
                Date: {selectedChargeback?.trans_date} |
                Reason: {selectedChargeback?.reason}
              </Typography>
            </Alert>

            {/* Timeline */}
            <Typography variant="h6" gutterBottom>
              Chargeback Timeline
            </Typography>
            <ChargebackTimeline />

            {/* Dispute Steps */}
            <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>
              Dispute Process
            </Typography>
            <Stepper activeStep={activeStep} orientation="vertical">
              {disputeSteps.map((step, index) => (
                <Step key={step}>
                  <StepLabel>{step}</StepLabel>
                  <StepContent>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {index === 0 && 'Review all chargeback details and understand the reason code.'}
                      {index === 1 && 'Collect transaction records, receipts, and communication logs.'}
                      {index === 2 && 'Compile evidence and create a comprehensive dispute package.'}
                      {index === 3 && 'Submit the dispute response to the card network.'}
                      {index === 4 && 'Monitor the case and await the final decision.'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => setActiveStep(index + 1)}
                        disabled={index === disputeSteps.length - 1}
                      >
                        Continue
                      </Button>
                      {index > 0 && (
                        <Button
                          size="small"
                          onClick={() => setActiveStep(index - 1)}
                        >
                          Back
                        </Button>
                      )}
                    </Box>
                  </StepContent>
                </Step>
              ))}
            </Stepper>

            {/* Evidence Upload */}
            <Paper sx={{ p: 2, mt: 3, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Evidence Documents
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: theme.palette.success.main }}>
                      <AttachFile />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Transaction Receipt"
                    secondary="receipt_20240115.pdf - Uploaded"
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: theme.palette.warning.main }}>
                      <AttachFile />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Delivery Confirmation"
                    secondary="Pending upload"
                  />
                </ListItem>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: theme.palette.warning.main }}>
                      <AttachFile />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Customer Communication"
                    secondary="Pending upload"
                  />
                </ListItem>
              </List>
              <Button
                variant="outlined"
                startIcon={<AttachFile />}
                sx={{ mt: 2 }}
                fullWidth
              >
                Upload Additional Evidence
              </Button>
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setDisputeDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="warning"
            startIcon={<Send />}
            disabled={activeStep < disputeSteps.length - 1}
          >
            Submit Dispute
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChargebackList;