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
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  useTheme,
  alpha,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
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
  GridActionsCellItem,
} from '@mui/x-data-grid';
import {
  CreditCard,
  CheckCircle,
  Cancel,
  Schedule,
  Info,
  Edit,
  Visibility,
  AttachMoney,
  TrendingUp,
  Warning,
  AssignmentReturn,
  History,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import apiClient from '../../config/api.config';
import { Refund } from '../../types/transaction.types';

const RefundList: React.FC = () => {
  const theme = useTheme();
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [refundAction, setRefundAction] = useState<'view' | 'process'>('view');
  const [filters, setFilters] = useState({
    refund_status: 'ALL',
    date_from: '',
    date_to: '',
  });

  const [summary, setSummary] = useState({
    totalRefunds: 0,
    pendingRefunds: 0,
    completedRefunds: 0,
    totalAmount: 0,
    avgProcessingTime: '2.5 days',
  });

  useEffect(() => {
    fetchRefunds();
  }, [filters]);

  const fetchRefunds = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/settlements/refund-history/', {
        params: {
          ...filters,
          refund_status: filters.refund_status === 'ALL' ? undefined : filters.refund_status,
        },
      });

      if (response.data) {
        const results = response.data.results || [];
        setRefunds(results);

        // Calculate summary
        setSummary({
          totalRefunds: results.length,
          pendingRefunds: results.filter((r: Refund) => r.refund_status === 'PENDING').length,
          completedRefunds: results.filter((r: Refund) => r.refund_status === 'COMPLETED').length,
          totalAmount: results.reduce((sum: number, r: Refund) => sum + (r.refund_amount || 0), 0),
          avgProcessingTime: '2.5 days',
        });
      }
    } catch (error) {
      console.error('Error fetching refunds:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewRefund = (refund: Refund) => {
    setSelectedRefund(refund);
    setRefundAction('view');
    setDialogOpen(true);
  };

  const handleProcessRefund = (refund: Refund) => {
    setSelectedRefund(refund);
    setRefundAction('process');
    setDialogOpen(true);
  };

  const getRefundStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'PROCESSING':
        return 'info';
      case 'FAILED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getRefundStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle fontSize="small" />;
      case 'PENDING':
        return <Schedule fontSize="small" />;
      case 'PROCESSING':
        return <History fontSize="small" />;
      case 'FAILED':
        return <Cancel fontSize="small" />;
      default:
        return null;
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'refund_track_id',
      headerName: 'Refund ID',
      width: 150,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
          {params.value || params.row.txn_id}
        </Typography>
      ),
    },
    {
      field: 'original_txn_id',
      headerName: 'Original Txn ID',
      width: 150,
    },
    {
      field: 'client_name',
      headerName: 'Merchant',
      width: 180,
    },
    {
      field: 'refund_initiated_date',
      headerName: 'Initiated Date',
      width: 130,
      valueGetter: (value: any) => {
        return value ? format(parseISO(value), 'dd MMM yyyy') : 'N/A';
      },
    },
    {
      field: 'original_amount',
      headerName: 'Original Amount',
      width: 130,
      align: 'right',
      valueGetter: (value: any) => {
        const amount = value || 0;
        return `₹${amount.toLocaleString('en-IN')}`;
      },
    },
    {
      field: 'refund_amount',
      headerName: 'Refund Amount',
      width: 130,
      align: 'right',
      renderCell: (params: GridRenderCellParams) => (
        <Typography fontWeight="bold" color="primary">
          ₹{params.value?.toLocaleString('en-IN')}
        </Typography>
      ),
    },
    {
      field: 'refund_type',
      headerName: 'Type',
      width: 100,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          label={params.value || 'FULL'}
          size="small"
          variant="outlined"
          color={params.value === 'PARTIAL' ? 'warning' : 'primary'}
        />
      ),
    },
    {
      field: 'refund_status',
      headerName: 'Status',
      width: 130,
      renderCell: (params: GridRenderCellParams) => (
        <Chip
          icon={getRefundStatusIcon(params.value)}
          label={params.value}
          size="small"
          color={getRefundStatusColor(params.value) as any}
        />
      ),
    },
    {
      field: 'refund_reason',
      headerName: 'Reason',
      width: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ whiteSpace: 'normal' }}>
          {params.value || 'Customer request'}
        </Typography>
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<Visibility />}
          label="View"
          onClick={() => handleViewRefund(params.row)}
        />,
        <GridActionsCellItem
          icon={<Edit />}
          label="Process"
          onClick={() => handleProcessRefund(params.row)}
          disabled={params.row.refund_status === 'COMPLETED'}
        />,
      ],
    },
  ];

  const RefundTimeline = ({ refund }: { refund: Refund }) => (
    <Timeline position="alternate">
      <TimelineItem>
        <TimelineOppositeContent color="text.secondary">
          {refund.refund_initiated_date ? format(parseISO(refund.refund_initiated_date), 'dd MMM yyyy HH:mm') : 'N/A'}
        </TimelineOppositeContent>
        <TimelineSeparator>
          <TimelineDot color="primary">
            <AssignmentReturn />
          </TimelineDot>
          <TimelineConnector />
        </TimelineSeparator>
        <TimelineContent>
          <Typography variant="h6">Refund Initiated</Typography>
          <Typography variant="body2">Request submitted by {refund.refund_request_from || 'Customer'}</Typography>
        </TimelineContent>
      </TimelineItem>

      {refund.refund_processed_date && (
        <TimelineItem>
          <TimelineOppositeContent color="text.secondary">
            {format(parseISO(refund.refund_processed_date), 'dd MMM yyyy HH:mm')}
          </TimelineOppositeContent>
          <TimelineSeparator>
            <TimelineDot color="info">
              <History />
            </TimelineDot>
            <TimelineConnector />
          </TimelineSeparator>
          <TimelineContent>
            <Typography variant="h6">Processing</Typography>
            <Typography variant="body2">Refund being processed</Typography>
          </TimelineContent>
        </TimelineItem>
      )}

      {refund.refund_completed_date && (
        <TimelineItem>
          <TimelineOppositeContent color="text.secondary">
            {format(parseISO(refund.refund_completed_date), 'dd MMM yyyy HH:mm')}
          </TimelineOppositeContent>
          <TimelineSeparator>
            <TimelineDot color="success">
              <CheckCircle />
            </TimelineDot>
          </TimelineSeparator>
          <TimelineContent>
            <Typography variant="h6">Completed</Typography>
            <Typography variant="body2">Refund credited to customer</Typography>
          </TimelineContent>
        </TimelineItem>
      )}
    </Timeline>
  );

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Refund Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Process and track all refund requests
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={fetchRefunds}>
            Refresh
          </Button>
          <Button variant="contained" startIcon={<AssignmentReturn />}>
            Initiate Refund
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: alpha(theme.palette.info.main, 0.05) }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Refunds
                  </Typography>
                  <Typography variant="h4" fontWeight="bold">
                    {summary.totalRefunds}
                  </Typography>
                </Box>
                <AssignmentReturn sx={{ fontSize: 40, color: theme.palette.info.main, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: alpha(theme.palette.warning.main, 0.05) }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Pending
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {summary.pendingRefunds}
                  </Typography>
                </Box>
                <Schedule sx={{ fontSize: 40, color: theme.palette.warning.main, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: alpha(theme.palette.success.main, 0.05) }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Completed
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {summary.completedRefunds}
                  </Typography>
                </Box>
                <CheckCircle sx={{ fontSize: 40, color: theme.palette.success.main, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Amount
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" color="primary.main">
                    ₹{(summary.totalAmount / 1000).toFixed(1)}K
                  </Typography>
                </Box>
                <AttachMoney sx={{ fontSize: 40, color: theme.palette.primary.main, opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alert */}
      {summary.pendingRefunds > 10 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2">
            You have {summary.pendingRefunds} pending refunds requiring attention. Average processing time is {summary.avgProcessingTime}.
          </Typography>
        </Alert>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Refund Status</InputLabel>
              <Select
                value={filters.refund_status}
                onChange={(e) => setFilters({ ...filters, refund_status: e.target.value })}
                label="Refund Status"
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                    },
                  },
                }}
              >
                <MenuItem value="ALL">All Status</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="PROCESSING">Processing</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
                <MenuItem value="FAILED">Failed</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="From Date"
              value={filters.date_from}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              size="small"
              type="date"
              label="To Date"
              value={filters.date_to}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Data Grid */}
      <Paper sx={{ height: 600, position: 'relative' }}>
        {loading && (
          <LinearProgress
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 10,
              height: 4
            }}
          />
        )}
        <DataGrid
          rows={refunds}
          columns={columns}
          getRowId={(row) => row.refund_track_id || row.txn_id}
          pageSizeOptions={[25, 50, 100]}
          checkboxSelection
          disableRowSelectionOnClick
          loading={loading}
        />
      </Paper>

      {/* Refund Details Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {refundAction === 'view' ? 'Refund Details' : 'Process Refund'}
        </DialogTitle>
        <DialogContent>
          {selectedRefund && refundAction === 'view' && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Refund ID
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {selectedRefund.refund_track_id || selectedRefund.txn_id}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Status
                  </Typography>
                  <Box>
                    <Chip
                      icon={getRefundStatusIcon(selectedRefund.refund_status)}
                      label={selectedRefund.refund_status}
                      color={getRefundStatusColor(selectedRefund.refund_status) as any}
                    />
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Original Amount
                  </Typography>
                  <Typography variant="body1">
                    ₹{selectedRefund.original_amount?.toLocaleString('en-IN')}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">
                    Refund Amount
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" color="primary">
                    ₹{selectedRefund.refund_amount?.toLocaleString('en-IN')}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    Reason
                  </Typography>
                  <Typography variant="body1">
                    {selectedRefund.refund_reason || 'Customer request'}
                  </Typography>
                </Grid>
              </Grid>

              <Typography variant="h6" gutterBottom>
                Refund Timeline
              </Typography>
              <RefundTimeline refund={selectedRefund} />
            </Box>
          )}

          {selectedRefund && refundAction === 'process' && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                Processing refund for transaction {selectedRefund.original_txn_id}
              </Alert>
              <Stepper activeStep={1} orientation="vertical">
                <Step>
                  <StepLabel>Verify Transaction</StepLabel>
                  <StepContent>
                    <Typography>Transaction verified and eligible for refund.</Typography>
                  </StepContent>
                </Step>
                <Step>
                  <StepLabel>Approve Refund</StepLabel>
                  <StepContent>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Approval Notes"
                      placeholder="Enter approval notes..."
                      sx={{ mb: 2 }}
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button variant="contained" color="success">
                        Approve
                      </Button>
                      <Button variant="outlined" color="error">
                        Reject
                      </Button>
                    </Box>
                  </StepContent>
                </Step>
                <Step>
                  <StepLabel>Process Payment</StepLabel>
                  <StepContent>
                    <Typography>Refund will be processed to customer's original payment method.</Typography>
                  </StepContent>
                </Step>
              </Stepper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
          {refundAction === 'process' && (
            <Button variant="contained" color="primary">
              Process Refund
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RefundList;