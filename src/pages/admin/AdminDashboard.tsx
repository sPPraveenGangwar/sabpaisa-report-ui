import React, { useState, useEffect } from 'react';
import AuthStatus from '../../components/auth/AuthStatus';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  Avatar,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  LinearProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';
import {
  AttachMoney,
  People,
  Receipt,
  AccountBalance,
  MoreVert,
  ArrowUpward,
  ArrowDownward,
  CheckCircle,
  CreditCard,
  AccountBalanceWallet,
  PhoneAndroid,
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

interface MetricCard {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactElement;
  color: string;
  trend: 'up' | 'down';
}

const AdminDashboard: React.FC = () => {
  const theme = useTheme();
  const [timeRange, setTimeRange] = useState('today');
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [chartData, setChartData] = useState<any>({});

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);

        console.log('=== STARTING API CALL ===');
        console.log('TimeRange:', timeRange);
        console.log('Timestamp:', new Date().toISOString());

        // Fetch executive dashboard data with date filter
        const response = await apiClient.get('/analytics/executive-dashboard/', {
          params: {
            date_filter: timeRange,
          },
          timeout: 180000 // 180 second timeout for large datasets
        });

        console.log('=== API RESPONSE RECEIVED ===');
        console.log('Response Status:', response.status);
        console.log('Response Data:', JSON.stringify(response.data, null, 2));

        // Check if request was cancelled before updating state
        if (cancelled) {
          console.log('Request cancelled, skipping state update');
          return;
        }

        if (response?.data?.success && response?.data?.data) {
          const apiData = response.data.data;

          // Process metrics data from API - use selected_range data
          // Fallback chain: selected_range -> month_to_date -> today -> year_to_date
          const rangeData = apiData.selected_range ||
                           apiData.month_to_date ||
                           apiData.today ||
                           apiData.year_to_date ||
                           { volume: 0, transactions: 0, success_rate: 0 };

          console.log('Range Data:', rangeData);
          console.log('Available data keys:', Object.keys(apiData));

          if (!rangeData || (rangeData.volume === 0 && rangeData.transactions === 0)) {
            console.warn('⚠️ No transaction data in selected date range');
            console.warn('This could mean:');
            console.warn('1. No transactions exist for this date range');
            console.warn('2. Database is empty');
            console.warn('3. Date filter is too restrictive');
            console.warn('Try changing the time range filter to "This Month" or "This Year"');
          }

          const metricsFromAPI: MetricCard[] = [
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
              value: `${rangeData.success_rate || 0}%`,
              change: 0,
              icon: <CheckCircle />,
              color: theme.palette.info.main,
              trend: 'up',
            },
          ];

          console.log('Metrics to set:', metricsFromAPI);

          // Process payment mode data
          const paymentModes = apiData.payment_mode_performance || [];
          const totalTransactions = paymentModes.reduce((sum: number, mode: any) => sum + (mode.total || 0), 0);

          const paymentModeChartData = paymentModes.map((mode: any, index: number) => ({
            name: mode.mode,
            value: totalTransactions > 0 ? Math.round((mode.total / totalTransactions) * 100) : 0,
            count: mode.total,
            color: [
              theme.palette.primary.main,
              theme.palette.secondary.main,
              theme.palette.success.main,
              theme.palette.warning.main,
              theme.palette.info.main,
              theme.palette.error.main,
            ][index % 6],
          }));

          console.log('Chart Data to set:', {
            paymentModes: paymentModeChartData,
            topMerchants: apiData.top_merchants || [],
          });

          // Process daily trend data for chart
          const dailyTrend = apiData.daily_trend || [];
          console.log('Daily Trend Data:', dailyTrend);

          let transactionVolumeChartData = dailyTrend.map((item: any) => ({
            date: item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
            volume: item.volume || 0,
            transactions: item.transactions || 0
          }));

          // If no daily trend data available, create single data point from range data
          if (transactionVolumeChartData.length === 0 && rangeData) {
            console.log('No daily trend, creating chart data from range data');
            const dateLabel = timeRange === 'today' ? 'Today' :
                            timeRange === 'week' ? 'This Week' :
                            timeRange === 'month' ? 'This Month' : 'This Year';

            transactionVolumeChartData = [{
              date: dateLabel,
              volume: rangeData.volume || 0,
              transactions: rangeData.transactions || 0
            }];
          }

          console.log('Transaction Volume Chart Data:', transactionVolumeChartData);

          // Update state in batch
          setMetrics(metricsFromAPI);
          setChartData({
            paymentModes: paymentModeChartData,
            topMerchants: apiData.top_merchants || [],
            transactionVolume: transactionVolumeChartData,
            recentTransactions: apiData.recent_transactions || []
          });

          console.log('=== STATE UPDATED SUCCESSFULLY ===');
        } else {
          console.error('Invalid response structure:', response.data);
        }
      } catch (error: any) {
        console.error('=== API ERROR ===');
        console.error('Error:', error);
        console.error('Error Message:', error.message);
        if (error.response) {
          console.error('Response Status:', error.response.status);
          console.error('Response Data:', error.response.data);
        }
        if (error.request) {
          console.error('Request:', error.request);
        }
      } finally {
        if (!cancelled) {
          console.log('=== SETTING LOADING TO FALSE ===');
          setLoading(false);
        }
      }
    };

    // Execute immediately (no debounce)
    fetchData();

    // Cleanup function
    return () => {
      cancelled = true;
      console.log('=== CLEANUP: Request cancelled ===');
    };
  }, [timeRange]);

  const fetchDashboardData = async () => {
    // This function is kept for potential manual refresh
    try {
      setLoading(true);
      console.log('Manual fetch with timeRange:', timeRange);

      const response = await apiClient.get('/analytics/executive-dashboard/', {
        params: {
          date_filter: timeRange,
        }
      });

      if (response.data.success && response.data.data) {
        const apiData = response.data.data;
        const rangeData = apiData.selected_range || apiData.month_to_date;

        const metricsFromAPI: MetricCard[] = [
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
            value: rangeData.transactions.toLocaleString('en-IN'),
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
            value: `${rangeData.success_rate || 0}%`,
            change: 0,
            icon: <CheckCircle />,
            color: theme.palette.info.main,
            trend: 'up',
          },
        ];

        setMetrics(metricsFromAPI);

        const paymentModes = apiData.payment_mode_performance || [];
        const totalTransactions = paymentModes.reduce((sum: number, mode: any) => sum + mode.total, 0);

        const paymentModeChartData = paymentModes.map((mode: any, index: number) => ({
          name: mode.mode,
          value: totalTransactions > 0 ? Math.round((mode.total / totalTransactions) * 100) : 0,
          count: mode.total,
          color: [
            theme.palette.primary.main,
            theme.palette.secondary.main,
            theme.palette.success.main,
            theme.palette.warning.main,
            theme.palette.info.main,
            theme.palette.error.main,
          ][index % 6],
        }));

        // Process daily trend for chart
        const dailyTrend = apiData.daily_trend || [];
        let transactionVolumeChartData = dailyTrend.map((item: any) => ({
          date: item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
          volume: item.volume || 0,
          transactions: item.transactions || 0
        }));

        // If no daily trend, use range data
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

        setChartData({
          paymentModes: paymentModeChartData,
          topMerchants: apiData.top_merchants || [],
          transactionVolume: transactionVolumeChartData,
          recentTransactions: apiData.recent_transactions || []
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Use state-based data instead of hardcoded values
  const metricsData: MetricCard[] = metrics.length > 0 ? metrics : [
    {
      title: 'Total Revenue',
      value: '₹0',
      change: 0,
      icon: <AttachMoney />,
      color: theme.palette.success.main,
      trend: 'up',
    },
    {
      title: 'Total Transactions',
      value: '0',
      change: 0,
      icon: <Receipt />,
      color: theme.palette.primary.main,
      trend: 'up',
    },
    {
      title: 'Active Merchants',
      value: '0',
      change: 0,
      icon: <People />,
      color: theme.palette.warning.main,
      trend: 'up',
    },
    {
      title: 'Success Rate',
      value: '0%',
      change: 0,
      icon: <CheckCircle />,
      color: theme.palette.info.main,
      trend: 'up',
    },
  ];

  const paymentModeData = chartData.paymentModes || [];
  const topMerchants = chartData.topMerchants || [];
  const transactionVolumeData = chartData.transactionVolume || [];
  const recentTransactions = chartData.recentTransactions || [];

  const MetricCard = ({ metric }: { metric: MetricCard }) => (
    <Card
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${alpha(metric.color, 0.1)} 0%, ${alpha(metric.color, 0.05)} 100%)`,
        border: `1px solid ${alpha(metric.color, 0.2)}`,
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="text.secondary" variant="body2" gutterBottom>
              {metric.title}
            </Typography>
            <Typography variant="h4" fontWeight="bold" sx={{ color: metric.color }}>
              {metric.value}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              {metric.trend === 'up' ? (
                <ArrowUpward sx={{ fontSize: 16, color: theme.palette.success.main }} />
              ) : (
                <ArrowDownward sx={{ fontSize: 16, color: theme.palette.error.main }} />
              )}
              <Typography
                variant="body2"
                sx={{
                  color: metric.trend === 'up' ? theme.palette.success.main : theme.palette.error.main,
                  ml: 0.5,
                }}
              >
                {metric.change}%
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                vs last period
              </Typography>
            </Box>
          </Box>
          <Avatar
            sx={{
              bgcolor: alpha(metric.color, 0.1),
              color: metric.color,
              width: 48,
              height: 48,
            }}
          >
            {metric.icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      {/* Authentication Status (for debugging) */}
      <AuthStatus />

      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Executive Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Welcome back! Here's your system overview.
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            displayEmpty
          >
            <MenuItem value="today">Today</MenuItem>
            <MenuItem value="week">This Week</MenuItem>
            <MenuItem value="month">This Month</MenuItem>
            <MenuItem value="year">This Year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Metrics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {metricsData.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <MetricCard metric={metric} />
          </Grid>
        ))}
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Transaction Volume Chart */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, height: 400, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              Transaction Volume & Count
            </Typography>
            <Box sx={{ flexGrow: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={transactionVolumeData}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorTransactions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme.palette.secondary.main} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={theme.palette.secondary.main} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="volume"
                  name="Volume"
                  stroke={theme.palette.primary.main}
                  fillOpacity={1}
                  fill="url(#colorVolume)"
                />
                <Area
                  type="monotone"
                  dataKey="transactions"
                  name="Transactions"
                  stroke={theme.palette.secondary.main}
                  fillOpacity={1}
                  fill="url(#colorTransactions)"
                />
              </AreaChart>
            </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Payment Mode Distribution */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, height: 400, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              Payment Mode Distribution
            </Typography>
            <Box sx={{ flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={paymentModeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="value"
                    label={false}
                  >
                    {paymentModeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any, props: any) => [`${value}%`, props.payload.name]}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #ccc',
                      borderRadius: '4px',
                      padding: '8px',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 0.5,
                mt: 2,
                px: 1
              }}>
                {paymentModeData.map((mode, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      fontSize: '0.75rem'
                    }}
                  >
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '2px',
                        bgcolor: mode.color,
                        flexShrink: 0
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '0.75rem',
                        color: 'text.secondary',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {mode.name}: {mode.value}%
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Tables Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Top Merchants */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, height: 400, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexShrink: 0 }}>
              <Typography variant="h6">Top Merchants</Typography>
              <IconButton size="small">
                <MoreVert />
              </IconButton>
            </Box>
            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
              {topMerchants.length > 0 ? (
                <List>
                  {topMerchants.map((merchant: any, index: number) => (
                  <React.Fragment key={index}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                          {merchant.name ? merchant.name[0] : merchant.code ? merchant.code[0] : 'M'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={merchant.name || merchant.code || 'Unknown'}
                        secondary={`${merchant.transactions || 0} transactions`}
                      />
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          ₹{(merchant.volume || 0).toLocaleString('en-IN')}
                        </Typography>
                      </Box>
                    </ListItem>
                    {index < topMerchants.length - 1 && <Divider />}
                  </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No merchant data available
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Recent Transactions */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3, height: 400, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexShrink: 0 }}>
              <Typography variant="h6">Recent Transactions</Typography>
              <IconButton size="small">
                <MoreVert />
              </IconButton>
            </Box>
            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
              {recentTransactions.length > 0 ? (
                <List>
                  {recentTransactions.map((transaction: any, index: number) => (
                  <React.Fragment key={index}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                          {transaction.mode === 'UPI' && <PhoneAndroid />}
                          {transaction.mode === 'CC' && <CreditCard />}
                          {transaction.mode === 'DC' && <CreditCard />}
                          {transaction.mode === 'NB' && <AccountBalance />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={transaction.id}
                        secondary={transaction.merchant}
                      />
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          ₹{transaction.amount.toLocaleString('en-IN')}
                        </Typography>
                        <Chip
                          label={transaction.status}
                          size="small"
                          color={
                            transaction.status === 'SUCCESS'
                              ? 'success'
                              : transaction.status === 'FAILED'
                              ? 'error'
                              : 'warning'
                          }
                          sx={{ minWidth: 70 }}
                        />
                      </Box>
                    </ListItem>
                    {index < recentTransactions.length - 1 && <Divider />}
                  </React.Fragment>
                  ))}
                </List>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No recent transactions available
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminDashboard;