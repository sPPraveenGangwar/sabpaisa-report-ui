/**
 * Optimized Admin Dashboard with Proper Loading States
 * Ensures UI renders ONLY AFTER data is fully loaded
 * Handles heavy API calculations gracefully
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  Avatar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  useTheme,
  alpha,
  Alert,
  Button,
  CircularProgress,
} from '@mui/material';
import {
  TrendingUp,
  AttachMoney,
  People,
  Receipt,
  CheckCircle,
  Cancel,
  Schedule,
  Refresh,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import apiClient from '../../config/api.config';
import { DashboardSkeleton } from '../../components/common/SkeletonLoader';

interface MetricCard {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactElement;
  color: string;
  trend: 'up' | 'down';
}

interface DashboardData {
  metrics: MetricCard[];
  chartData: {
    paymentModes: any[];
    topMerchants: any[];
    transactionVolume: any[];
    recentTransactions: any[];
  };
}

const AdminDashboardOptimized: React.FC = () => {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState('today');

  // Loading states
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Data state
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  // Error state
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch dashboard data with progress tracking
   */
  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    try {
      // Set appropriate loading state
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsInitialLoad(true);
      }

      setError(null);
      setLoadingProgress(0);

      console.log('🔄 Fetching dashboard data...', {
        timeRange,
        timestamp: new Date().toISOString(),
        isRefresh
      });

      // Simulate progress (20%)
      setLoadingProgress(20);

      // Make API call with extended timeout for heavy calculations
      const startTime = Date.now();
      const response = await apiClient.get('/analytics/executive-dashboard/', {
        params: {
          date_filter: timeRange
        },
        timeout: 300000, // 5 minutes timeout for heavy calculations
        onDownloadProgress: (progressEvent) => {
          // Update progress based on download
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              20 + (progressEvent.loaded / progressEvent.total) * 60
            );
            setLoadingProgress(percentCompleted);
          }
        }
      });

      const apiDuration = Date.now() - startTime;
      console.log(`✅ API Response received in ${apiDuration}ms`);

      // Progress: 80%
      setLoadingProgress(80);

      // Validate response structure
      if (!response?.data?.success || !response?.data?.data) {
        throw new Error('Invalid API response structure');
      }

      const apiData = response.data.data;
      const rangeData = apiData.selected_range || apiData.month_to_date;

      if (!rangeData) {
        throw new Error('No range data available in API response');
      }

      console.log('📊 Processing dashboard data...', {
        transactions: rangeData.transactions,
        volume: rangeData.volume,
        merchants: apiData.merchants?.active
      });

      // Process metrics
      const metrics: MetricCard[] = [
        {
          title: 'Total Revenue',
          value: rangeData.volume > 0
            ? `₹${rangeData.volume.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
            : '₹0',
          change: 0,
          icon: <AttachMoney />,
          color: theme.palette.success.main,
          trend: 'up',
        },
        {
          title: 'Total Transactions',
          value: rangeData.transactions?.toLocaleString('en-IN') || '0',
          change: 0,
          icon: <Receipt />,
          color: theme.palette.primary.main,
          trend: 'up',
        },
        {
          title: 'Active Merchants',
          value: apiData.merchants?.active?.toString() || '0',
          change: 0,
          icon: <People />,
          color: theme.palette.warning.main,
          trend: 'up',
        },
        {
          title: 'Success Rate',
          value: `${rangeData.success_rate?.toFixed(2) || 0}%`,
          change: 0,
          icon: <CheckCircle />,
          color: theme.palette.info.main,
          trend: 'up',
        },
      ];

      // Process payment mode data
      const paymentModes = apiData.payment_mode_performance || [];
      const totalTransactions = paymentModes.reduce((sum: number, mode: any) =>
        sum + (mode.total || 0), 0
      );

      const paymentModeChartData = paymentModes.map((mode: any, index: number) => ({
        name: mode.mode || 'Unknown',
        value: totalTransactions > 0
          ? Math.round((mode.total / totalTransactions) * 100)
          : 0,
        count: mode.total || 0,
        color: [
          theme.palette.primary.main,
          theme.palette.secondary.main,
          theme.palette.success.main,
          theme.palette.warning.main,
          theme.palette.info.main,
          theme.palette.error.main,
        ][index % 6],
      }));

      // Process daily trend data
      const dailyTrend = apiData.daily_trend || [];
      let transactionVolumeChartData = dailyTrend.map((item: any) => ({
        date: item.date
          ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : '',
        volume: item.volume || 0,
        transactions: item.transactions || 0
      }));

      // Fallback to single data point if no daily trend
      if (transactionVolumeChartData.length === 0 && rangeData) {
        const dateLabel = timeRange === 'today' ? 'Today' :
                        timeRange === 'week' ? 'This Week' :
                        timeRange === 'month' ? 'This Month' : 'This Year';

        transactionVolumeChartData = [{
          date: dateLabel,
          volume: rangeData.volume || 0,
          transactions: rangeData.transactions || 0
        }];
      }

      // Progress: 90%
      setLoadingProgress(90);

      // Set dashboard data - THIS WILL TRIGGER UI RENDER
      const newDashboardData: DashboardData = {
        metrics,
        chartData: {
          paymentModes: paymentModeChartData,
          topMerchants: apiData.top_merchants || [],
          transactionVolume: transactionVolumeChartData,
          recentTransactions: apiData.recent_transactions || []
        }
      };

      setDashboardData(newDashboardData);

      // Progress: 100%
      setLoadingProgress(100);

      console.log('✅ Dashboard data processed successfully', {
        metricsCount: metrics.length,
        chartDataKeys: Object.keys(newDashboardData.chartData),
        processingTime: Date.now() - startTime
      });

    } catch (err: any) {
      console.error('❌ Dashboard data fetch error:', err);

      const errorMessage = err.response?.status === 401
        ? 'Unauthorized. Please log in again.'
        : err.response?.status === 403
        ? 'Access denied. Admin access required.'
        : err.response?.status === 500
        ? 'Server error. Please try again later.'
        : err.message || 'Failed to load dashboard data';

      setError(errorMessage);

    } finally {
      // IMPORTANT: Only set loading to false after data is ready
      setIsInitialLoad(false);
      setIsRefreshing(false);
      setLoadingProgress(0);
    }
  }, [timeRange, theme]);

  /**
   * Initial data fetch on mount
   */
  useEffect(() => {
    fetchDashboardData(false);
  }, [fetchDashboardData]);

  /**
   * Handle time range change
   */
  const handleTimeRangeChange = (newRange: string) => {
    setTimeRange(newRange);
    // Data will be refetched automatically due to useEffect dependency
  };

  /**
   * Manual refresh
   */
  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  /**
   * Show skeleton loader during initial load
   */
  if (isInitialLoad || !dashboardData) {
    return (
      <Box sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Admin Dashboard</Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <CircularProgress size={24} />
            <Typography variant="body2" color="text.secondary">
              Loading dashboard data... {loadingProgress}%
            </Typography>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} action={
            <Button color="inherit" size="small" onClick={() => fetchDashboardData(false)}>
              Retry
            </Button>
          }>
            {error}
          </Alert>
        )}

        <DashboardSkeleton />
      </Box>
    );
  }

  /**
   * Render dashboard with data
   */
  const { metrics, chartData } = dashboardData;

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Admin Dashboard</Typography>
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={(e) => handleTimeRangeChange(e.target.value)}
              disabled={isRefreshing}
            >
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={isRefreshing ? <CircularProgress size={16} /> : <Refresh />}
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Metric Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {metrics.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card elevation={2}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {metric.title}
                    </Typography>
                    <Typography variant="h4" sx={{ mb: 1 }}>
                      {metric.value}
                    </Typography>
                    {metric.change !== 0 && (
                      <Chip
                        size="small"
                        icon={metric.trend === 'up' ? <TrendingUp /> : <TrendingUp />}
                        label={`${Math.abs(metric.change)}%`}
                        color={metric.trend === 'up' ? 'success' : 'error'}
                        sx={{ height: 24 }}
                      />
                    )}
                  </Box>
                  <Avatar sx={{ bgcolor: alpha(metric.color, 0.1), color: metric.color }}>
                    {metric.icon}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Transaction Volume Chart */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Transaction Volume
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={chartData.transactionVolume}>
                  <defs>
                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="volume"
                    stroke={theme.palette.primary.main}
                    fillOpacity={1}
                    fill="url(#colorVolume)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Payment Mode Distribution */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Payment Modes
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={chartData.paymentModes}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.paymentModes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Merchants */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top Merchants
              </Typography>
              <List>
                {chartData.topMerchants.slice(0, 5).map((merchant: any, index: number) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                          {index + 1}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={merchant.name || merchant.client_code}
                        secondary={`${merchant.transactions || 0} transactions`}
                      />
                      <Chip
                        label={`₹${(merchant.volume || 0).toLocaleString('en-IN')}`}
                        color="primary"
                        variant="outlined"
                      />
                    </ListItem>
                    {index < chartData.topMerchants.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Transactions */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Transactions
              </Typography>
              <List>
                {chartData.recentTransactions.slice(0, 5).map((txn: any, index: number) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor:
                              txn.status === 'SUCCESS'
                                ? theme.palette.success.light
                                : txn.status === 'FAILED'
                                ? theme.palette.error.light
                                : theme.palette.warning.light,
                          }}
                        >
                          {txn.status === 'SUCCESS' ? (
                            <CheckCircle />
                          ) : txn.status === 'FAILED' ? (
                            <Cancel />
                          ) : (
                            <Schedule />
                          )}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={txn.txn_id || 'N/A'}
                        secondary={txn.client_name || txn.client_code}
                      />
                      <Box textAlign="right">
                        <Typography variant="body2" fontWeight="bold">
                          ₹{(txn.amount || 0).toLocaleString('en-IN')}
                        </Typography>
                        <Chip
                          label={txn.status}
                          size="small"
                          color={
                            txn.status === 'SUCCESS'
                              ? 'success'
                              : txn.status === 'FAILED'
                              ? 'error'
                              : 'warning'
                          }
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    </ListItem>
                    {index < chartData.recentTransactions.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Refreshing Overlay */}
      {isRefreshing && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}
        >
          <Box textAlign="center">
            <CircularProgress size={60} />
            <Typography variant="h6" sx={{ mt: 2 }}>
              Refreshing data... {loadingProgress}%
            </Typography>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default AdminDashboardOptimized;
