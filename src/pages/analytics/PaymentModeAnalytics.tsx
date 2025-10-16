import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  useTheme,
  alpha,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ToggleButton,
  ToggleButtonGroup,
  Rating,
} from '@mui/material';
import {
  CreditCard,
  AccountBalance,
  PhoneAndroid,
  AccountBalanceWallet,
  TrendingUp,
  TrendingDown,
  AttachMoney,
  Receipt,
  CheckCircle,
  Cancel,
  Schedule,
  Refresh,
  Download,
  Speed,
  Timeline,
  ShowChart,
  PieChart as PieChartIcon,
  DateRange,
  NavigateNext,
  NavigateBefore,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Treemap,
} from 'recharts';
import { format, parseISO, subDays } from 'date-fns';
import apiClient from '../../config/api.config';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PaymentModeData {
  name: string;
  value: number;
  transactions: number;
  revenue: number;
  successRate: number;
  avgTransactionValue: number;
  icon?: React.ReactNode;
  color?: string;
}

interface PaymentTrend {
  date: string;
  CreditCard: number;
  DebitCard: number;
  UPI: number;
  NetBanking: number;
  Wallet: number;
  Others: number;
}

interface PaymentModeKPIs {
  totalRevenue: number;
  totalTransactions: number;
  dominantMode: string;
  dominantModePercentage: number;
  highestSuccessRate: string;
  highestSuccessRateValue: number;
  avgTransactionValue: number;
  growthRate: number;
}

const PaymentModeAnalytics: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [timeRange, setTimeRange] = useState('1d'); // Default to today
  const [viewType, setViewType] = useState<'distribution' | 'trends' | 'performance'>('distribution');

  const [filters, setFilters] = useState({
    date_from: format(new Date(), 'yyyy-MM-dd'),
    date_to: format(new Date(), 'yyyy-MM-dd'),
    page: 1,
    page_size: 10000,
  });

  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const [data, setData] = useState({
    paymentModes: [] as PaymentModeData[],
    paymentTrends: [] as PaymentTrend[],
    kpis: {
      totalRevenue: 0,
      totalTransactions: 0,
      dominantMode: '',
      dominantModePercentage: 0,
      highestSuccessRate: '',
      highestSuccessRateValue: 0,
      avgTransactionValue: 0,
      growthRate: 0,
    } as PaymentModeKPIs,
    performanceMetrics: [] as any[],
  });

  const timeRanges = [
    { value: '1d', label: 'Today' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: 'custom', label: 'Custom' },
  ];

  const paymentModeIcons: { [key: string]: React.ReactNode } = {
    'Credit Card': <CreditCard />,
    'Debit Card': <CreditCard />,
    'UPI': <PhoneAndroid />,
    'Net Banking': <AccountBalance />,
    'Wallet': <AccountBalanceWallet />,
    'CARD': <CreditCard />,
  };

  const paymentModeColors: { [key: string]: string } = {
    'Credit Card': theme.palette.primary.main,
    'Debit Card': theme.palette.secondary.main,
    'UPI': theme.palette.success.main,
    'Net Banking': theme.palette.info.main,
    'Wallet': theme.palette.warning.main,
    'Others': theme.palette.grey[500],
  };

  useEffect(() => {
    fetchPaymentModeData();
  }, [filters]);

  const fetchPaymentModeData = async () => {
    try {
      setLoading(true);

      const params = {
        date_from: filters.date_from,
        date_to: filters.date_to,
        page: filters.page,
        page_size: filters.page_size,
      };

      console.log('Fetching payment mode data with params:', params);

      // Try to fetch from transaction history endpoint
      try {
        let response;
        try {
          response = await apiClient.get('/transactions/admin-history/', { params });
        } catch (adminError: any) {
          if (adminError.response?.status === 429) {
            console.warn('Rate limited. Using smaller page size...');
            params.page_size = 500;
          }
          // Fallback to merchant endpoint
          response = await apiClient.get('/transactions/merchant-history/', { params });
        }

        console.log('Payment Mode API Response:', {
          dataLength: response.data?.results?.length || response.data?.length || 0,
          totalCount: response.data?.count || 0,
          sampleData: response.data?.results?.[0] || response.data?.[0],
        });

        if (response.data) {
          const transactions = response.data.results || response.data || [];
          const totalCount = response.data.count || 0;

          setTotalRecords(totalCount);
          setCurrentPage(filters.page);

          processPaymentModeData(transactions);
        }
      } catch (error: any) {
        console.error('Error fetching payment mode data:', error);
        if (error.response?.status === 429) {
          console.warn('Rate limited.');
        }
        // Show empty state on error
        setData({
          paymentModes: [],
          paymentTrends: [],
          kpis: {
            totalRevenue: 0,
            totalTransactions: 0,
            dominantMode: 'N/A',
            dominantModePercentage: 0,
            highestSuccessRate: 'N/A',
            highestSuccessRateValue: 0,
            avgTransactionValue: 0,
            growthRate: 0,
          },
          performanceMetrics: [],
        });
      }
    } catch (error) {
      console.error('Error in fetchPaymentModeData:', error);
      // Show empty state on error
      setData({
        paymentModes: [],
        paymentTrends: [],
        kpis: {
          totalRevenue: 0,
          totalTransactions: 0,
          dominantMode: 'N/A',
          dominantModePercentage: 0,
          highestSuccessRate: 'N/A',
          highestSuccessRateValue: 0,
          avgTransactionValue: 0,
          growthRate: 0,
        },
        performanceMetrics: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const processPaymentModeData = (transactions: any[]) => {
    console.log('Processing payment mode data for', transactions.length, 'transactions');

    if (!transactions || transactions.length === 0) {
      console.warn('No transactions to process, showing empty state');
      setData({
        paymentModes: [],
        paymentTrends: [],
        kpis: {
          totalRevenue: 0,
          totalTransactions: 0,
          dominantMode: 'N/A',
          dominantModePercentage: 0,
          highestSuccessRate: 'N/A',
          highestSuccessRateValue: 0,
          avgTransactionValue: 0,
          growthRate: 0,
        },
        performanceMetrics: [],
      });
      return;
    }

    // Group transactions by payment mode
    const modeMap = new Map<string, {
      count: number;
      revenue: number;
      successCount: number;
      failedCount: number;
    }>();

    let totalRevenue = 0;
    let totalTransactions = 0;

    transactions.forEach((transaction, index) => {
      // Debug first few transactions
      if (index < 3) {
        console.log(`Transaction ${index}:`, {
          payment_mode: transaction.payment_mode,
          amount: transaction.paid_amount || transaction.amount,
          status: transaction.status,
        });
      }

      // Get payment mode
      const rawMode = transaction.payment_mode || transaction.paymentMode || 'Unknown';
      const mode = normalizePaymentMode(String(rawMode));

      // Get amount
      const amountValue = transaction.paid_amount ||
                         transaction.amount ||
                         transaction.payee_amount ||
                         transaction.transaction_amount || 0;
      const amount = typeof amountValue === 'string' ?
                    parseFloat(String(amountValue).replace(/,/g, '')) :
                    parseFloat(String(amountValue));

      if (!modeMap.has(mode)) {
        modeMap.set(mode, {
          count: 0,
          revenue: 0,
          successCount: 0,
          failedCount: 0,
        });
      }

      const modeData = modeMap.get(mode)!;
      modeData.count++;

      if (!isNaN(amount) && amount > 0) {
        modeData.revenue += amount;
        totalRevenue += amount;
      }

      const status = String(transaction.status || '').toUpperCase();
      if (status === 'SUCCESS' || status === 'COMPLETED') {
        modeData.successCount++;
      } else if (status === 'FAILED') {
        modeData.failedCount++;
      }

      totalTransactions++;
    });

    console.log('Payment mode grouping results:', {
      modes: Array.from(modeMap.keys()),
      totalRevenue,
      totalTransactions,
    });

    // Convert to array and calculate percentages
    const paymentModes: PaymentModeData[] = [];
    let dominantMode = '';
    let dominantModePercentage = 0;
    let highestSuccessRate = '';
    let highestSuccessRateValue = 0;

    modeMap.forEach((data, mode) => {
      const percentage = totalTransactions > 0 ?
        (data.count / totalTransactions) * 100 : 0;

      const successRate = data.count > 0 ?
        (data.successCount / data.count) * 100 : 0;

      const avgValue = data.count > 0 ?
        data.revenue / data.count : 0;

      paymentModes.push({
        name: mode,
        value: percentage,
        transactions: data.count,
        revenue: data.revenue,
        successRate: successRate,
        avgTransactionValue: avgValue,
        icon: paymentModeIcons[mode],
        color: paymentModeColors[mode] || theme.palette.grey[500],
      });

      // Track dominant mode
      if (percentage > dominantModePercentage) {
        dominantMode = mode;
        dominantModePercentage = percentage;
      }

      // Track highest success rate
      if (successRate > highestSuccessRateValue) {
        highestSuccessRate = mode;
        highestSuccessRateValue = successRate;
      }
    });

    // Sort by transaction count
    paymentModes.sort((a, b) => b.transactions - a.transactions);

    // Calculate payment trends over time
    const paymentTrends = calculatePaymentTrends(transactions);

    // Set final data
    setData({
      paymentModes,
      paymentTrends,
      kpis: {
        totalRevenue,
        totalTransactions,
        dominantMode,
        dominantModePercentage: Math.round(dominantModePercentage * 10) / 10,
        highestSuccessRate,
        highestSuccessRateValue: Math.round(highestSuccessRateValue * 10) / 10,
        avgTransactionValue: totalTransactions > 0 ? totalRevenue / totalTransactions : 0,
        growthRate: 12.5, // Calculate from actual data comparison
      },
      performanceMetrics: paymentModes.map(mode => ({
        mode: mode.name,
        successRate: mode.successRate,
        avgValue: mode.avgTransactionValue,
        volume: mode.transactions,
      })),
    });
  };

  const normalizePaymentMode = (mode: string): string => {
    const normalized = mode.toUpperCase().replace(/_/g, ' ');

    const mappings: { [key: string]: string } = {
      'CC': 'Credit Card',
      'DC': 'Debit Card',
      'CREDIT CARD': 'Credit Card',
      'DEBIT CARD': 'Debit Card',
      'UPI': 'UPI',
      'BHIM UPI QR': 'UPI',
      'NET BANKING': 'Net Banking',
      'NB': 'Net Banking',
      'NETBANKING': 'Net Banking',
      'WALLET': 'Wallet',
      'CARD': 'Card',
    };

    return mappings[normalized] || mode;
  };

  const calculatePaymentTrends = (transactions: any[]): PaymentTrend[] => {
    const dailyData = new Map<string, any>();

    transactions.forEach(transaction => {
      const dateValue = transaction.trans_date || transaction.date || transaction.created_at;
      if (!dateValue) return;

      try {
        const date = typeof dateValue === 'string' ? parseISO(dateValue) : dateValue;
        const dateStr = format(date, 'yyyy-MM-dd');

        if (!dailyData.has(dateStr)) {
          dailyData.set(dateStr, {
            date: dateStr,
            CreditCard: 0,
            DebitCard: 0,
            UPI: 0,
            NetBanking: 0,
            Wallet: 0,
            Others: 0,
          });
        }

        const dayData = dailyData.get(dateStr);
        const mode = normalizePaymentMode(String(transaction.payment_mode || 'Others'));
        const amount = parseFloat(String(transaction.paid_amount || transaction.amount || 0).replace(/,/g, ''));

        switch (mode) {
          case 'Credit Card':
            dayData.CreditCard += amount;
            break;
          case 'Debit Card':
            dayData.DebitCard += amount;
            break;
          case 'UPI':
            dayData.UPI += amount;
            break;
          case 'Net Banking':
            dayData.NetBanking += amount;
            break;
          case 'Wallet':
            dayData.Wallet += amount;
            break;
          default:
            dayData.Others += amount;
            break;
        }
      } catch (error) {
        // Skip invalid dates
      }
    });

    // Convert to array and sort by date
    const trends = Array.from(dailyData.values())
      .map(item => ({
        ...item,
        date: format(parseISO(item.date), 'MMM dd'),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return trends;
  };

  const generateMockData = () => {
    console.log('Generating mock data for payment modes');

    const paymentModes: PaymentModeData[] = [
      {
        name: 'Credit Card',
        value: 35,
        transactions: 3500,
        revenue: 1750000,
        successRate: 92,
        avgTransactionValue: 500,
        icon: <CreditCard />,
        color: theme.palette.primary.main,
      },
      {
        name: 'Debit Card',
        value: 28,
        transactions: 2800,
        revenue: 1400000,
        successRate: 94,
        avgTransactionValue: 500,
        icon: <CreditCard />,
        color: theme.palette.secondary.main,
      },
      {
        name: 'UPI',
        value: 25,
        transactions: 2500,
        revenue: 1250000,
        successRate: 96,
        avgTransactionValue: 500,
        icon: <PhoneAndroid />,
        color: theme.palette.success.main,
      },
      {
        name: 'Net Banking',
        value: 8,
        transactions: 800,
        revenue: 400000,
        successRate: 90,
        avgTransactionValue: 500,
        icon: <AccountBalance />,
        color: theme.palette.info.main,
      },
      {
        name: 'Wallet',
        value: 4,
        transactions: 400,
        revenue: 200000,
        successRate: 88,
        avgTransactionValue: 500,
        icon: <AccountBalanceWallet />,
        color: theme.palette.warning.main,
      },
    ];

    setData({
      paymentModes,
      paymentTrends: [],
      kpis: {
        totalRevenue: 5000000,
        totalTransactions: 10000,
        dominantMode: 'Credit Card',
        dominantModePercentage: 35,
        highestSuccessRate: 'UPI',
        highestSuccessRateValue: 96,
        avgTransactionValue: 500,
        growthRate: 15.3,
      },
      performanceMetrics: [],
    });
  };

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
    let days = 0;
    switch (range) {
      case '1d':
        days = 0;
        break;
      case '7d':
        days = 6;
        break;
      case '30d':
        days = 29;
        break;
      case '90d':
        days = 89;
        break;
    }
    if (range !== 'custom') {
      const startDate = days === 0 ? new Date() : subDays(new Date(), days);
      setFilters({
        ...filters,
        date_from: format(startDate, 'yyyy-MM-dd'),
        date_to: format(new Date(), 'yyyy-MM-dd'),
        page: 1,
      });
    }
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

  const handleExportPDF = async () => {
    try {
      setExporting(true);

      // Create PDF with proper sizing
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;

      // Add header
      pdf.setFontSize(18);
      pdf.setTextColor(33, 33, 33);
      pdf.text('Payment Mode Analytics Report', margin, 20);

      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Generated on: ${format(new Date(), 'dd MMM yyyy HH:mm')}`, margin, 27);
      pdf.text(`Period: ${filters.date_from} to ${filters.date_to}`, margin, 32);

      // Add KPI Summary
      let yPos = 40;
      pdf.setFontSize(14);
      pdf.setTextColor(33, 33, 33);
      pdf.text('Key Performance Indicators', margin, yPos);

      yPos += 7;
      pdf.setFontSize(10);
      pdf.setTextColor(66, 66, 66);
      pdf.text(`Total Revenue: ₹${data.kpis.totalRevenue.toLocaleString('en-IN')}`, margin, yPos);
      yPos += 5;
      pdf.text(`Total Transactions: ${data.kpis.totalTransactions.toLocaleString('en-IN')}`, margin, yPos);
      yPos += 5;
      pdf.text(`Dominant Mode: ${data.kpis.dominantMode} (${data.kpis.dominantModePercentage.toFixed(1)}%)`, margin, yPos);
      yPos += 5;
      pdf.text(`Highest Success Rate: ${data.kpis.highestSuccessRate} (${data.kpis.highestSuccessRateValue.toFixed(1)}%)`, margin, yPos);
      yPos += 5;
      pdf.text(`Avg Transaction Value: ₹${data.kpis.avgTransactionValue.toFixed(2)}`, margin, yPos);

      // Payment Mode Breakdown
      yPos += 10;
      if (data.paymentModes.length > 0) {
        pdf.setFontSize(12);
        pdf.setTextColor(33, 33, 33);
        pdf.text('Payment Mode Breakdown', margin, yPos);
        yPos += 7;

        pdf.setFontSize(10);
        pdf.setTextColor(66, 66, 66);

        // Table header
        pdf.setFont(undefined, 'bold');
        pdf.text('Payment Mode', margin + 5, yPos);
        pdf.text('Transactions', margin + 60, yPos);
        pdf.text('Revenue', margin + 95, yPos);
        pdf.text('Success %', margin + 130, yPos);
        pdf.text('Avg Value', margin + 160, yPos);
        yPos += 5;
        pdf.setFont(undefined, 'normal');

        // Table rows
        data.paymentModes.forEach(mode => {
          if (yPos > pageHeight - 20) {
            pdf.addPage();
            yPos = margin;
          }
          pdf.text(mode.name, margin + 5, yPos);
          pdf.text(mode.transactions.toLocaleString('en-IN'), margin + 60, yPos);
          pdf.text(`₹${mode.revenue.toLocaleString('en-IN')}`, margin + 95, yPos);
          pdf.text(`${mode.successRate.toFixed(1)}%`, margin + 130, yPos);
          pdf.text(`₹${mode.avgTransactionValue.toFixed(0)}`, margin + 160, yPos);
          yPos += 5;
        });
      }

      // Capture chart if available
      yPos += 5;
      const chartElement = document.querySelector('.payment-mode-chart-container');
      if (chartElement) {
        try {
          const canvas = await html2canvas(chartElement as HTMLElement, {
            scale: 2,
            backgroundColor: '#ffffff',
            logging: false
          });
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = pageWidth - (2 * margin);
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          // Add new page if needed
          if (yPos + imgHeight > pageHeight - margin) {
            pdf.addPage();
            yPos = margin;
          }

          pdf.addImage(imgData, 'PNG', margin, yPos, imgWidth, imgHeight);
        } catch (error) {
          console.error('Error capturing chart:', error);
        }
      }

      // Add footer
      const pageCount = pdf.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(
          `Page ${i} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 5,
          { align: 'center' }
        );
      }

      // Save the PDF
      const fileName = `Payment_Mode_Analytics_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 1.5 }}>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            {label}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Typography key={index} variant="body2" sx={{ color: entry.color }}>
              {entry.name}: ₹{entry.value.toLocaleString('en-IN')}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  const KPICard = ({ title, value, subtitle, icon, color }: any) => (
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
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar
            sx={{
              bgcolor: alpha(color || theme.palette.primary.main, 0.1),
              color: color || theme.palette.primary.main,
            }}
          >
            {icon}
          </Avatar>
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
            Payment Mode Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Analyze payment method performance and distribution
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchPaymentModeData}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={handleExportPDF}
            disabled={exporting || loading}
          >
            {exporting ? 'Exporting...' : 'Export'}
          </Button>
        </Box>
      </Box>

      {/* Time Range Selector */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <DateRange />
          <ToggleButtonGroup
            value={timeRange}
            exclusive
            onChange={(e, value) => value && handleTimeRangeChange(value)}
            size="small"
          >
            {timeRanges.map((range) => (
              <ToggleButton key={range.value} value={range.value}>
                {range.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          {timeRange === 'custom' && (
            <>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Start Date"
                  value={parseISO(filters.date_from)}
                  onChange={(date) => {
                    if (date) {
                      setFilters({ ...filters, date_from: format(date, 'yyyy-MM-dd'), page: 1 });
                    }
                  }}
                  slotProps={{ textField: { size: 'small' } }}
                  maxDate={new Date()}
                />
              </LocalizationProvider>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="End Date"
                  value={parseISO(filters.date_to)}
                  onChange={(date) => {
                    if (date) {
                      setFilters({ ...filters, date_to: format(date, 'yyyy-MM-dd'), page: 1 });
                    }
                  }}
                  slotProps={{ textField: { size: 'small' } }}
                  maxDate={new Date()}
                />
              </LocalizationProvider>
            </>
          )}
        </Box>
      </Paper>

      {/* Pagination Controls */}
      {totalRecords > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Showing {getRecordRange().start}-{getRecordRange().end} of {totalRecords.toLocaleString('en-IN')} transactions
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

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total Revenue"
            value={`₹${(data.kpis.totalRevenue / 100000).toFixed(1)}L`}
            subtitle="across all modes"
            icon={<AttachMoney />}
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Dominant Mode"
            value={data.kpis.dominantMode}
            subtitle={`${data.kpis.dominantModePercentage}% of transactions`}
            icon={<CreditCard />}
            color={theme.palette.secondary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Best Success Rate"
            value={data.kpis.highestSuccessRate}
            subtitle={`${data.kpis.highestSuccessRateValue}% success`}
            icon={<CheckCircle />}
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Avg Transaction"
            value={`₹${data.kpis.avgTransactionValue.toLocaleString('en-IN')}`}
            subtitle="per transaction"
            icon={<ShowChart />}
            color={theme.palette.warning.main}
          />
        </Grid>
      </Grid>

      {loading && <LinearProgress />}

      {/* View Type Selector */}
      <Box sx={{ mb: 2 }}>
        <ToggleButtonGroup
          value={viewType}
          exclusive
          onChange={(e, value) => value && setViewType(value)}
          size="small"
        >
          <ToggleButton value="distribution">
            <PieChartIcon sx={{ mr: 1 }} /> Distribution
          </ToggleButton>
          <ToggleButton value="trends">
            <Timeline sx={{ mr: 1 }} /> Trends
          </ToggleButton>
          <ToggleButton value="performance">
            <Speed sx={{ mr: 1 }} /> Performance
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Main Content based on View Type */}
      {viewType === 'distribution' && (
        <Grid container spacing={3} className="payment-mode-chart-container">
          {/* Payment Mode Distribution Chart */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Payment Mode Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={data.paymentModes}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value.toFixed(1)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.paymentModes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || theme.palette.grey[500]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Payment Mode List */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Payment Mode Details
              </Typography>
              <List>
                {data.paymentModes.map((mode) => (
                  <ListItem key={mode.name}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: alpha(mode.color || theme.palette.grey[500], 0.1) }}>
                        {mode.icon || <CreditCard />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={mode.name}
                      secondary={
                        <Box>
                          <Typography variant="body2">
                            Transactions: {mode.transactions.toLocaleString('en-IN')}
                          </Typography>
                          <Typography variant="body2">
                            Revenue: ₹{(mode.revenue / 100000).toFixed(2)}L
                          </Typography>
                          <Typography variant="body2">
                            Success Rate: {mode.successRate.toFixed(1)}%
                          </Typography>
                        </Box>
                      }
                    />
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h6" color="primary">
                        {mode.value.toFixed(1)}%
                      </Typography>
                      <Chip
                        label={`₹${mode.avgTransactionValue.toFixed(0)}/txn`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      )}

      {viewType === 'trends' && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Payment Mode Trends
          </Typography>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={data.paymentTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <RechartsTooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="CreditCard"
                stackId="1"
                stroke={paymentModeColors['Credit Card']}
                fill={paymentModeColors['Credit Card']}
                name="Credit Card"
              />
              <Area
                type="monotone"
                dataKey="DebitCard"
                stackId="1"
                stroke={paymentModeColors['Debit Card']}
                fill={paymentModeColors['Debit Card']}
                name="Debit Card"
              />
              <Area
                type="monotone"
                dataKey="UPI"
                stackId="1"
                stroke={paymentModeColors['UPI']}
                fill={paymentModeColors['UPI']}
                name="UPI"
              />
              <Area
                type="monotone"
                dataKey="NetBanking"
                stackId="1"
                stroke={paymentModeColors['Net Banking']}
                fill={paymentModeColors['Net Banking']}
                name="Net Banking"
              />
              <Area
                type="monotone"
                dataKey="Wallet"
                stackId="1"
                stroke={paymentModeColors['Wallet']}
                fill={paymentModeColors['Wallet']}
                name="Wallet"
              />
            </AreaChart>
          </ResponsiveContainer>
        </Paper>
      )}

      {viewType === 'performance' && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Payment Mode Performance Metrics
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Payment Mode</TableCell>
                      <TableCell align="center">Transactions</TableCell>
                      <TableCell align="center">Revenue</TableCell>
                      <TableCell align="center">Success Rate</TableCell>
                      <TableCell align="center">Avg Value</TableCell>
                      <TableCell align="center">Performance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.paymentModes.map((mode) => (
                      <TableRow key={mode.name}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ bgcolor: alpha(mode.color || theme.palette.grey[500], 0.1), width: 32, height: 32 }}>
                              {mode.icon || <CreditCard />}
                            </Avatar>
                            {mode.name}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          {mode.transactions.toLocaleString('en-IN')}
                        </TableCell>
                        <TableCell align="center">
                          ₹{(mode.revenue / 100000).toFixed(2)}L
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={`${mode.successRate.toFixed(1)}%`}
                            size="small"
                            color={mode.successRate > 90 ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell align="center">
                          ₹{mode.avgTransactionValue.toFixed(0)}
                        </TableCell>
                        <TableCell align="center">
                          <Rating
                            value={mode.successRate / 20}
                            readOnly
                            size="small"
                            precision={0.5}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default PaymentModeAnalytics;