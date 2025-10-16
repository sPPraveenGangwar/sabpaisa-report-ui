import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Chip,
  LinearProgress,
  Button,
  IconButton,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  TrendingUp,
  AccountBalance,
  Receipt,
  Warning,
  ArrowUpward,
  ArrowDownward,
  MoreVert,
  CreditCard,
  ShoppingCart,
  Assessment,
  AttachMoney,
  CheckCircle,
  Cancel,
  Schedule,
  Refresh,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
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
import { format, formatDistanceToNow } from 'date-fns';
import dashboardService, { DashboardData } from '../../services/dashboardService';
import { useAuth } from '../../contexts/AuthContext';

const MerchantDashboard: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setError(null);
      const data = await dashboardService.getMerchantDashboard();
      setDashboardData(data);
    } catch (err: any) {
      setError('Failed to load dashboard data. Please try again.');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
  };

  useEffect(() => {
    fetchDashboardData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format number with commas
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'SUCCESS':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'FAILED':
        return 'error';
      default:
        return 'default';
    }
  };

  // Get payment method colors
  const getPaymentMethodColors = () => {
    return [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
    ];
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return dateString;
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <Box sx={{ flexGrow: 1 }}>
        <Box sx={{ mb: 3 }}>
          <Skeleton variant="text" width={300} height={40} />
          <Skeleton variant="text" width={400} height={20} />
        </Box>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((item) => (
            <Grid item xs={12} sm={6} md={3} key={item}>
              <Skeleton variant="rectangular" height={150} />
            </Grid>
          ))}
        </Grid>
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={8}>
            <Skeleton variant="rectangular" height={400} />
          </Grid>
          <Grid item xs={12} md={4}>
            <Skeleton variant="rectangular" height={400} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  // Error state
  if (error && !dashboardData) {
    return (
      <Box sx={{ flexGrow: 1 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={handleRefresh}>
          Retry
        </Button>
      </Box>
    );
  }

  // Default data if API fails
  const data = dashboardData || dashboardService['getDefaultDashboardData']();

  // Prepare stats cards
  const statsCards = [
    {
      title: "Today's Revenue",
      value: formatCurrency(data.stats.todayRevenue),
      change: `${data.stats.revenueChange >= 0 ? '+' : ''}${data.stats.revenueChange.toFixed(1)}%`,
      isPositive: data.stats.revenueChange >= 0,
      icon: <AttachMoney />,
      color: theme.palette.primary.main,
    },
    {
      title: 'Total Transactions',
      value: formatNumber(data.stats.totalTransactions),
      change: `${data.stats.transactionChange >= 0 ? '+' : ''}${data.stats.transactionChange.toFixed(1)}%`,
      isPositive: data.stats.transactionChange >= 0,
      icon: <Receipt />,
      color: theme.palette.secondary.main,
    },
    {
      title: 'Success Rate',
      value: `${data.stats.successRate.toFixed(1)}%`,
      change: `${data.stats.successRateChange >= 0 ? '+' : ''}${data.stats.successRateChange.toFixed(1)}%`,
      isPositive: data.stats.successRateChange >= 0,
      icon: <CheckCircle />,
      color: theme.palette.success.main,
    },
    {
      title: 'Pending Settlements',
      value: formatCurrency(data.stats.pendingSettlements),
      change: `${data.stats.settlementChange >= 0 ? '+' : ''}${data.stats.settlementChange.toFixed(1)}%`,
      isPositive: data.stats.settlementChange <= 0,
      icon: <Schedule />,
      color: theme.palette.warning.main,
    },
  ];

  // Prepare chart data
  const salesChartData = data.weeklySales.map((item) => ({
    date: item.date,
    sales: item.amount,
  }));

  const paymentMethodChartData = data.paymentMethods.map((method, index) => ({
    name: method.name,
    value: method.value,
    color: getPaymentMethodColors()[index],
  }));

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Welcome Message */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Merchant Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back, {user?.first_name || user?.username}! Here's your business overview for today ({format(new Date(), 'dd MMM yyyy')}).
          </Typography>
        </Box>
        <Button
          startIcon={<Refresh />}
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outlined"
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {statsCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ position: 'relative', overflow: 'visible' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography color="text.secondary" variant="body2" sx={{ mb: 1 }}>
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" sx={{ mb: 1, fontWeight: 'bold' }}>
                      {stat.value}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {stat.isPositive ? (
                        <ArrowUpward sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                      ) : (
                        <ArrowDownward sx={{ fontSize: 16, color: 'error.main', mr: 0.5 }} />
                      )}
                      <Typography
                        variant="body2"
                        sx={{
                          color: stat.isPositive ? 'success.main' : 'error.main',
                          fontWeight: 'medium',
                        }}
                      >
                        {stat.change}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                        vs yesterday
                      </Typography>
                    </Box>
                  </Box>
                  <Avatar
                    sx={{
                      bgcolor: `${stat.color}15`,
                      color: stat.color,
                      width: 56,
                      height: 56,
                    }}
                  >
                    {stat.icon}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Sales Trend */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">Weekly Sales Trend</Typography>
              <IconButton size="small">
                <MoreVert />
              </IconButton>
            </Box>
            {salesChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={salesChartData}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="date" stroke={theme.palette.text.secondary} />
                  <YAxis stroke={theme.palette.text.secondary} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke={theme.palette.primary.main}
                    fill="url(#salesGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Typography variant="body2" color="text.secondary" align="center">
                No data available for the selected period
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Payment Methods */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">Payment Methods</Typography>
              <IconButton size="small">
                <MoreVert />
              </IconButton>
            </Box>
            {paymentMethodChartData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={paymentMethodChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {paymentMethodChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <Box sx={{ mt: 2 }}>
                  {paymentMethodChartData.map((method, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 1,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: method.color,
                            mr: 1,
                          }}
                        />
                        <Typography variant="body2">{method.name}</Typography>
                      </Box>
                      <Typography variant="body2" fontWeight="medium">
                        {method.value}%
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary" align="center">
                No payment data available
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Transactions and Quick Actions */}
      <Grid container spacing={3}>
        {/* Recent Transactions */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Recent Transactions</Typography>
              <Button size="small" href="/transactions/all">View All</Button>
            </Box>
            {data.recentTransactions.length > 0 ? (
              <List>
                {data.recentTransactions.map((transaction, index) => (
                  <ListItem
                    key={transaction.txn_id}
                    sx={{
                      borderBottom: index < data.recentTransactions.length - 1 ? 1 : 0,
                      borderColor: 'divider',
                      px: 0,
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: theme.palette.primary.light }}>
                        {transaction.payee_name?.charAt(0) || 'U'}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body1">
                            {transaction.payee_name || transaction.payee_email || 'Unknown'}
                          </Typography>
                          <Typography variant="h6" fontWeight="medium">
                            {formatCurrency(transaction.paid_amount)}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              {transaction.txn_id}
                            </Typography>
                            <Chip
                              label={transaction.status}
                              size="small"
                              color={getStatusColor(transaction.status)}
                              sx={{ height: 20 }}
                            />
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {formatTimeAgo(transaction.trans_date)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                No recent transactions found
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<CreditCard />}
                  sx={{ py: 2, flexDirection: 'column' }}
                  href="/transactions/all"
                >
                  <Typography variant="caption">Transactions</Typography>
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AccountBalance />}
                  sx={{ py: 2, flexDirection: 'column' }}
                  href="/settlements/settled"
                >
                  <Typography variant="caption">Settlements</Typography>
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Assessment />}
                  sx={{ py: 2, flexDirection: 'column' }}
                  href="/reports/generate"
                >
                  <Typography variant="caption">Reports</Typography>
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Warning />}
                  sx={{ py: 2, flexDirection: 'column' }}
                  href="/settlements/chargebacks"
                >
                  <Typography variant="caption">Disputes</Typography>
                </Button>
              </Grid>
            </Grid>

            {/* Settlement Status */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Settlement Status
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Today's Settlement
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {formatCurrency(data.settlementStatus.todaySettlement)}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={data.settlementStatus.processed}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                  {data.settlementStatus.processed.toFixed(0)}% processed
                </Typography>
              </Box>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Pending Review
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {data.settlementStatus.pendingReview} transactions
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mt: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: theme.palette.primary.light + '20' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Amount Today
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {formatCurrency(data.transactionSummary.totalAmount)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: theme.palette.success.light + '20' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Successful
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="success.main">
                {data.transactionSummary.successCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: theme.palette.error.light + '20' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Failed
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="error.main">
                {data.transactionSummary.failedCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: theme.palette.warning.light + '20' }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Pending
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="warning.main">
                {data.transactionSummary.pendingCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MerchantDashboard;