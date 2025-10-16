import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Alert,
  CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import qwikformsService, { QwikFormsAnalytics as QwikFormsAnalyticsData, QwikFormsFilters } from '../../services/qwikformsService';
import { format } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const QwikFormsAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<QwikFormsAnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);

  // Load analytics
  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: QwikFormsFilters = {};
      if (dateFrom) filters.date_from = format(dateFrom, 'yyyy-MM-dd');
      if (dateTo) filters.date_to = format(dateTo, 'yyyy-MM-dd');

      const response = await qwikformsService.getAnalyticsDashboard(filters);
      // Extract data from {success: true, data: {...}} structure
      const data = response.data || response;
      setAnalytics(data);
    } catch (err: any) {
      // Only show error for actual failures, not for empty results
      if (err.response?.status && err.response.status !== 404) {
        setError(err.response?.data?.message || 'Failed to load analytics');
      }
      // For 404 or no results, just set null/empty data
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [dateFrom, dateTo]);

  // Format currency
  const formatCurrency = (value: number) => {
    return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  };

  // Format number
  const formatNumber = (value: number) => {
    return value.toLocaleString('en-IN');
  };

  // Metric Card Component
  const MetricCard = ({
    title,
    value,
    icon,
    color,
    trend,
  }: {
    title: string;
    value: string;
    icon: React.ReactNode;
    color: string;
    trend?: number;
  }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              bgcolor: `${color}20`,
              borderRadius: 2,
              p: 1,
              mr: 2,
              color: color,
            }}
          >
            {icon}
          </Box>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
        </Box>
        <Typography variant="h4" gutterBottom>
          {value}
        </Typography>
        {trend !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {trend >= 0 ? (
              <TrendingUpIcon color="success" fontSize="small" />
            ) : (
              <TrendingDownIcon color="error" fontSize="small" />
            )}
            <Typography
              variant="body2"
              color={trend >= 0 ? 'success.main' : 'error.main'}
              sx={{ ml: 0.5 }}
            >
              {Math.abs(trend)}%
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  // Payment mode chart data
  const getPaymentModeData = () => {
    if (!analytics?.by_payment_mode) return [];
    return Object.entries(analytics.by_payment_mode).map(([mode, data]) => ({
      name: mode,
      count: data.count,
      volume: data.volume,
    }));
  };

  if (loading && !analytics) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h4">QwikForms Analytics</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <DatePicker
              label="Date From"
              value={dateFrom}
              onChange={setDateFrom}
              slotProps={{
                textField: {
                  size: 'small',
                },
              }}
            />
            <DatePicker
              label="Date To"
              value={dateTo}
              onChange={setDateTo}
              slotProps={{
                textField: {
                  size: 'small',
                },
              }}
            />
          </Box>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {analytics && analytics.summary && (
          <>
            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard
                  title="Total Transactions"
                  value={formatNumber(analytics.summary.total_transactions || 0)}
                  icon={<AccountBalanceIcon />}
                  color="#0088FE"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard
                  title="Successful"
                  value={formatNumber(analytics.summary.successful_transactions || 0)}
                  icon={<CheckCircleIcon />}
                  color="#00C49F"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard
                  title="Failed"
                  value={formatNumber(analytics.summary.failed_transactions || 0)}
                  icon={<CancelIcon />}
                  color="#FF8042"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <MetricCard
                  title="Pending"
                  value={formatNumber(analytics.summary.pending_transactions || 0)}
                  icon={<PendingActionsIcon />}
                  color="#FFBB28"
                />
              </Grid>
            </Grid>

            {/* Financial Metrics */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Total Volume
                    </Typography>
                    <Typography variant="h5">
                      {formatCurrency(analytics.summary.total_volume || 0)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Settled Amount
                    </Typography>
                    <Typography variant="h5">
                      {formatCurrency(analytics.summary.total_settled_amount || 0)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Pending Settlement
                    </Typography>
                    <Typography variant="h5">
                      {formatCurrency(analytics.summary.pending_settlement_amount || 0)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Success Rate
                    </Typography>
                    <Typography variant="h5">
                      {(analytics.summary.success_rate || 0).toFixed(2)}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Charts */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              {/* Payment Mode Distribution */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Payment Mode Distribution
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={getPaymentModeData()}
                          dataKey="count"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label
                        >
                          {getPaymentModeData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Payment Mode Volume */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Payment Mode Volume
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={getPaymentModeData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value: any) => formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey="volume" fill="#0088FE" name="Volume" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>

              {/* Daily Trend */}
              {analytics.daily_trend && analytics.daily_trend.length > 0 && (
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Daily Transaction Trend
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={analytics.daily_trend}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="date"
                            tickFormatter={(value) => format(new Date(value), 'dd MMM')}
                          />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip
                            labelFormatter={(value) => format(new Date(value), 'dd MMM yyyy')}
                            formatter={(value: any, name: string) => {
                              if (name === 'volume') return formatCurrency(value);
                              return value;
                            }}
                          />
                          <Legend />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="count"
                            stroke="#0088FE"
                            name="Count"
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="volume"
                            stroke="#00C49F"
                            name="Volume"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Top Forms */}
              {analytics.by_form && analytics.by_form.length > 0 && (
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Top Forms by Transaction Count
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics.by_form.slice(0, 10)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="fee_name" angle={-45} textAnchor="end" height={100} />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#8884D8" name="Transactions" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Top Clients */}
              {analytics.by_client && analytics.by_client.length > 0 && (
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Top Clients by Volume
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics.by_client.slice(0, 10)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="client_name" angle={-45} textAnchor="end" height={100} />
                          <YAxis />
                          <Tooltip formatter={(value: any) => formatCurrency(value)} />
                          <Bar dataKey="volume" fill="#82CA9D" name="Volume" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
              )}
            </Grid>
          </>
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default QwikFormsAnalytics;