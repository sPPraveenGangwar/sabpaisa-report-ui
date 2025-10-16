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
  IconButton,
  Tooltip,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  Receipt,
  CheckCircle,
  Cancel,
  Schedule,
  Refresh,
  Download,
  FullscreenOutlined,
  DateRange,
  ShowChart,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Timeline,
  Assessment,
  NavigateNext,
  NavigateBefore,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
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
  ComposedChart,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Treemap,
  Sankey,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Brush,
} from 'recharts';
import { format, parseISO, subDays, startOfMonth, endOfMonth } from 'date-fns';
import apiClient from '../../config/api.config';
import analyticsService, { AnalyticsData } from '../../services/analyticsService';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const Analytics: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [timeRange, setTimeRange] = useState('1d'); // Default to today to avoid rate limiting
  const [chartType, setChartType] = useState('line');
  const [selectedMetrics, setSelectedMetrics] = useState(['revenue', 'transactions']);

  // Add CSS animation for spinning icon
  React.useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const [filters, setFilters] = useState({
    date_from: format(new Date(), 'yyyy-MM-dd'), // Today only by default
    date_to: format(new Date(), 'yyyy-MM-dd'),
    granularity: 'daily' as 'hourly' | 'daily' | 'weekly' | 'monthly',
    page: 1,
    page_size: 10000,
  });

  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAllRecords, setShowAllRecords] = useState(false);
  const [allRecordsData, setAllRecordsData] = useState<AnalyticsData | null>(null);
  const [loadingAllRecords, setLoadingAllRecords] = useState(false);

  const [data, setData] = useState<AnalyticsData>({
    transactionTrends: [],
    paymentModes: [],
    hourlyDistribution: [],
    geographicData: [],
    merchantPerformance: [],
    conversionFunnel: [],
    statusBreakdown: [],
    kpis: {
      totalRevenue: 0,
      totalTransactions: 0,
      successRate: 0,
      avgTransactionValue: 0,
      revenueGrowth: 0,
      transactionGrowth: 0,
      peakHour: '',
      topMerchant: '',
      failureRate: 0,
      pendingRate: 0,
    },
  });

  const timeRanges = [
    { value: '1d', label: 'Today' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: 'custom', label: 'Custom' },
  ];

  const metrics = [
    { value: 'revenue', label: 'Revenue', color: theme.palette.primary.main },
    { value: 'transactions', label: 'Transactions', color: theme.palette.secondary.main },
    { value: 'success_rate', label: 'Success Rate', color: theme.palette.success.main },
    { value: 'avg_value', label: 'Avg Value', color: theme.palette.warning.main },
  ];

  // Consistent color mapping for payment modes - matching AdminDashboard
  const getPaymentModeColor = (modeName: string): string => {
    const colorMap: { [key: string]: string } = {
      'BHIM UPI QR': '#1976d2',       // Blue
      'UPI': '#9c27b0',               // Purple/Magenta
      'Credit Card': '#2e7d32',       // Dark Green
      'UPI INTENT': '#0288d1',        // Light Blue
      'Rupay Card': '#1976d2',        // Blue
      'WALLET': '#388e3c',            // Green
      'RuPayCreditCard': '#ed6c02',   // Orange
      'Debit Card': '#d32f2f',        // Red
      'Net Banking': '#7b1fa2',       // Purple
      'CASH': '#f57c00',              // Orange
      'Card': '#0288d1',              // Light Blue
      'Wallet': '#388e3c',            // Green
      'NET_BANKING': '#7b1fa2',       // Purple
      'Unknown': '#757575',           // Gray
      'UNKNOWN': '#757575',           // Gray
    };

    return colorMap[modeName] || colorMap['Unknown'];
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [filters]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      console.log('Fetching analytics data for period:', filters);

      // Fetch real data from the analytics service
      const analyticsData = await analyticsService.fetchAnalyticsData(filters);

      console.log('Analytics data received:', {
        trends: analyticsData.transactionTrends.length,
        kpis: analyticsData.kpis,
        paymentModes: analyticsData.paymentModes.length,
        totalCount: analyticsData.totalCount,
        currentPage: analyticsData.currentPage
      });

      setData(analyticsData);
      setTotalRecords(analyticsData.totalCount || 0);
      setCurrentPage(analyticsData.currentPage || 1);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Show empty state on error
      setData({
        transactionTrends: [],
        paymentModes: [],
        hourlyDistribution: [],
        geographicData: [],
        merchantPerformance: [],
        conversionFunnel: [],
        statusBreakdown: [],
        kpis: {
          totalRevenue: 0,
          totalTransactions: 0,
          successRate: 0,
          avgTransactionValue: 0,
          revenueGrowth: 0,
          transactionGrowth: 0,
          peakHour: 'N/A',
          topMerchant: 'N/A',
          failureRate: 0,
          pendingRate: 0,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllRecordsAnalytics = async () => {
    try {
      // Calculate date range
      const startDate = parseISO(filters.date_from);
      const endDate = parseISO(filters.date_to);
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      // Warn user for large date ranges
      if (daysDiff > 30) {
        const confirmMessage = `You are about to load analytics for ${daysDiff} days (${filters.date_from} to ${filters.date_to}).\n\n` +
          `This may take 1-3 minutes to process depending on transaction volume.\n\n` +
          `For better performance, consider selecting a smaller date range (30 days or less).\n\n` +
          `Do you want to continue?`;

        if (!window.confirm(confirmMessage)) {
          return;
        }
      }

      setLoadingAllRecords(true);
      console.log('Fetching ALL records analytics for period:', filters.date_from, 'to', filters.date_to);
      console.log(`📊 Fetching complete analytics for ${daysDiff} days. This may take 1-3 minutes for large datasets...`);

      // Fetch complete analytics from backend endpoint without pagination
      const response = await apiClient.get('/analytics/merchant-analytics/', {
        params: {
          date_from: filters.date_from,
          date_to: filters.date_to,
          client_code: filters.client_code
        },
        timeout: 180000 // 180 seconds (3 minutes) timeout for large datasets
      });

      if (response.data.success && response.data.data) {
        const backendData = response.data.data;

        // Transform backend response to match frontend format
        const transformedData: AnalyticsData = {
          kpis: {
            totalRevenue: backendData.kpis.total_volume || 0,
            totalTransactions: backendData.kpis.total_transactions || 0,
            successRate: backendData.kpis.success_rate || 0,
            avgTransactionValue: backendData.kpis.avg_transaction_value || 0,
            revenueGrowth: 0,
            transactionGrowth: 0,
            peakHour: backendData.period?.peak_hour || 'N/A',
            topMerchant: 'N/A',
            failureRate: ((backendData.kpis.failed_transactions / backendData.kpis.total_transactions) * 100) || 0,
            pendingRate: 0
          },
          transactionTrends: (backendData.daily_trend || []).map((dt: any) => ({
            date: format(parseISO(dt.date), 'MMM dd'),
            revenue: dt.volume || 0,
            transactions: dt.total || 0,
            success_rate: dt.successful && dt.total ? (dt.successful / dt.total) * 100 : 0,
            avg_value: dt.total ? (dt.volume / dt.total) : 0,
            success_count: dt.successful || 0,
            failed_count: (dt.total - dt.successful) || 0,
            pending_count: 0
          })),
          paymentModes: (backendData.payment_mode_distribution || []).map((pm: any) => ({
            name: pm.mode || 'Unknown',
            value: (pm.count / backendData.kpis.total_transactions * 100) || 0,
            transactions: pm.count || 0,
            revenue: pm.volume || 0,
            percentage: (pm.count / backendData.kpis.total_transactions * 100) || 0
          })),
          hourlyDistribution: (backendData.hourly_distribution || []).map((hd: any) => ({
            hour: `${String(hd.hour).padStart(2, '0')}:00`,
            transactions: hd.count || 0,
            revenue: 0,
            success_rate: 0
          })),
          statusBreakdown: [
            {
              name: 'Success',
              value: backendData.kpis.success_rate || 0,
              count: backendData.kpis.successful_transactions || 0,
              color: theme.palette.success.main
            },
            {
              name: 'Failed',
              value: ((backendData.kpis.failed_transactions / backendData.kpis.total_transactions) * 100) || 0,
              count: backendData.kpis.failed_transactions || 0,
              color: theme.palette.error.main
            }
          ],
          geographicData: [],
          merchantPerformance: [],
          conversionFunnel: []
        };

        setAllRecordsData(transformedData);
        setShowAllRecords(true);

        console.log('✅ All records analytics loaded successfully:', {
          totalTransactions: transformedData.kpis.totalTransactions,
          successRate: transformedData.kpis.successRate,
          totalRevenue: transformedData.kpis.totalRevenue,
          period: `${filters.date_from} to ${filters.date_to}`
        });
      }
    } catch (error: any) {
      console.error('❌ Error fetching all records analytics:', error);

      let errorMessage = 'Failed to load complete analytics. ';

      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage += 'The request timed out. The date range is too large. Please try a smaller date range (e.g., 30 days or less).';
      } else if (error.response?.status === 429) {
        errorMessage += 'Too many requests. Please wait a moment and try again.';
      } else if (error.response?.status === 500) {
        errorMessage += 'Server error. The dataset might be too large. Please try a smaller date range.';
      } else {
        errorMessage += 'Please try again or select a smaller date range.';
      }

      alert(errorMessage);
    } finally {
      setLoadingAllRecords(false);
    }
  };

  const generateMockData = () => {
    // Transaction trends data
    const trends = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      trends.push({
        date: format(date, 'MMM dd'),
        revenue: Math.floor(Math.random() * 500000) + 300000,
        transactions: Math.floor(Math.random() * 1000) + 500,
        success_rate: Math.random() * 20 + 75,
        avg_value: Math.floor(Math.random() * 2000) + 500,
      });
    }

    // Payment modes data
    const paymentModes = [
      { name: 'Credit Card', value: 45, transactions: 4500, revenue: 2250000 },
      { name: 'Debit Card', value: 25, transactions: 2500, revenue: 1250000 },
      { name: 'UPI', value: 20, transactions: 2000, revenue: 1000000 },
      { name: 'Net Banking', value: 8, transactions: 800, revenue: 400000 },
      { name: 'Wallet', value: 2, transactions: 200, revenue: 100000 },
    ];

    // Hourly distribution
    const hourlyDistribution = [];
    for (let hour = 0; hour < 24; hour++) {
      hourlyDistribution.push({
        hour: `${hour}:00`,
        transactions: Math.floor(Math.random() * 100) + 20,
        revenue: Math.floor(Math.random() * 50000) + 10000,
      });
    }

    // Geographic data (for treemap)
    const geographicData = [
      { name: 'Maharashtra', value: 35, children: [
        { name: 'Mumbai', value: 20 },
        { name: 'Pune', value: 10 },
        { name: 'Nagpur', value: 5 },
      ]},
      { name: 'Karnataka', value: 25, children: [
        { name: 'Bangalore', value: 18 },
        { name: 'Mysore', value: 7 },
      ]},
      { name: 'Delhi NCR', value: 20, children: [
        { name: 'Delhi', value: 12 },
        { name: 'Gurgaon', value: 8 },
      ]},
      { name: 'Tamil Nadu', value: 15, children: [
        { name: 'Chennai', value: 10 },
        { name: 'Coimbatore', value: 5 },
      ]},
      { name: 'Others', value: 5 },
    ];

    // Merchant performance (for radar chart)
    const merchantPerformance = [
      { metric: 'Revenue', A: 85, B: 72, C: 68, fullMark: 100 },
      { metric: 'Volume', A: 78, B: 82, C: 90, fullMark: 100 },
      { metric: 'Success Rate', A: 92, B: 88, C: 85, fullMark: 100 },
      { metric: 'Avg Value', A: 65, B: 70, C: 75, fullMark: 100 },
      { metric: 'Growth', A: 88, B: 65, C: 72, fullMark: 100 },
    ];

    // Conversion funnel
    const conversionFunnel = [
      { name: 'Page Views', value: 10000, fill: alpha(theme.palette.primary.main, 0.9) },
      { name: 'Initiated', value: 7500, fill: alpha(theme.palette.primary.main, 0.7) },
      { name: 'Completed', value: 6000, fill: alpha(theme.palette.primary.main, 0.5) },
      { name: 'Successful', value: 5400, fill: alpha(theme.palette.primary.main, 0.3) },
    ];

    // Status breakdown
    const statusBreakdown = [
      { name: 'Success', value: 75, color: theme.palette.success.main },
      { name: 'Failed', value: 15, color: theme.palette.error.main },
      { name: 'Pending', value: 7, color: theme.palette.warning.main },
      { name: 'Cancelled', value: 3, color: theme.palette.grey[500] },
    ];

    setData({
      transactionTrends: trends,
      paymentModes,
      hourlyDistribution,
      geographicData,
      merchantPerformance,
      conversionFunnel,
      statusBreakdown,
      kpis: {
        totalRevenue: 5000000,
        totalTransactions: 10000,
        successRate: 85.5,
        avgTransactionValue: 500,
        revenueGrowth: 15.3,
        transactionGrowth: 12.7,
        peakHour: '14:00 - 15:00',
        topMerchant: 'ABC Merchants Ltd',
      },
    });
  };

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
    let days = 7;
    switch (range) {
      case '1d':
        days = 0; // Today only
        break;
      case '7d':
        days = 7;
        break;
      case '30d':
        days = 30;
        break;
      case '90d':
        days = 90;
        break;
    }
    if (range !== 'custom') {
      // Adjusted date calculation to be inclusive of today
      const startDate = days === 0 ? new Date() : subDays(new Date(), days);
      setFilters({
        ...filters,
        date_from: format(startDate, 'yyyy-MM-dd'),
        date_to: format(new Date(), 'yyyy-MM-dd'),
        granularity: days <= 7 ? 'daily' : days <= 30 ? 'daily' : 'weekly',
        page: 1
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

  // Helper to get the current display data
  const getDisplayData = () => {
    return showAllRecords && allRecordsData ? allRecordsData : data;
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);

      // Create a container element for the PDF content
      const content = document.getElementById('analytics-content');
      if (!content) {
        console.error('Analytics content not found');
        return;
      }

      // Create PDF with proper sizing
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;

      // Add header
      pdf.setFontSize(18);
      pdf.setTextColor(33, 33, 33);
      pdf.text('Analytics Report', margin, 20);

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
      pdf.text(`Success Rate: ${data.kpis.successRate}%`, margin, yPos);
      yPos += 5;
      pdf.text(`Avg Transaction Value: ₹${data.kpis.avgTransactionValue}`, margin, yPos);
      yPos += 5;
      pdf.text(`Revenue Growth: ${data.kpis.revenueGrowth}%`, margin, yPos);
      yPos += 5;
      pdf.text(`Transaction Growth: ${data.kpis.transactionGrowth}%`, margin, yPos);

      // Capture charts as images
      yPos += 10;

      // Capture main chart
      const mainChartElement = document.querySelector('.main-chart-container');
      if (mainChartElement) {
        const canvas = await html2canvas(mainChartElement as HTMLElement, {
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
        yPos += imgHeight + 10;
      }

      // Payment Mode Distribution
      if (data.paymentModes.length > 0) {
        if (yPos + 50 > pageHeight - margin) {
          pdf.addPage();
          yPos = margin;
        }

        pdf.setFontSize(12);
        pdf.setTextColor(33, 33, 33);
        pdf.text('Payment Mode Distribution', margin, yPos);
        yPos += 7;

        pdf.setFontSize(10);
        pdf.setTextColor(66, 66, 66);
        data.paymentModes.forEach(mode => {
          pdf.text(`${mode.name}: ${mode.value}% (${mode.transactions} transactions)`, margin + 5, yPos);
          yPos += 5;
        });
      }

      // Status Breakdown
      if (data.statusBreakdown.length > 0) {
        yPos += 5;
        if (yPos + 50 > pageHeight - margin) {
          pdf.addPage();
          yPos = margin;
        }

        pdf.setFontSize(12);
        pdf.setTextColor(33, 33, 33);
        pdf.text('Transaction Status Breakdown', margin, yPos);
        yPos += 7;

        pdf.setFontSize(10);
        pdf.setTextColor(66, 66, 66);
        data.statusBreakdown.forEach(status => {
          pdf.text(`${status.name}: ${status.value}% (${status.count} transactions)`, margin + 5, yPos);
          yPos += 5;
        });
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
      const fileName = `Analytics_Report_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const KPICard = ({ title, value, subtitle, icon, trend, color }: any) => (
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
                {trend > 0 ? (
                  <TrendingUp sx={{ fontSize: 16, color: theme.palette.success.main, mr: 0.5 }} />
                ) : (
                  <TrendingDown sx={{ fontSize: 16, color: theme.palette.error.main, mr: 0.5 }} />
                )}
                <Typography variant="body2" color={trend > 0 ? 'success.main' : 'error.main'}>
                  {Math.abs(trend)}% {subtitle}
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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 1.5 }}>
          <Typography variant="body2" fontWeight="bold">
            {label}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Typography
              key={index}
              variant="body2"
              sx={{ color: entry.color }}
            >
              {entry.name}: {typeof entry.value === 'number' ?
                (entry.name.includes('Rate') ? `${entry.value.toFixed(1)}%` :
                 entry.name.includes('Revenue') ? `₹${entry.value.toLocaleString('en-IN')}` :
                 entry.value.toLocaleString('en-IN')) : entry.value}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  const renderMainChart = () => {
    const displayData = getDisplayData();

    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={displayData.transactionTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <RechartsTooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="revenue"
              stroke={theme.palette.primary.main}
              strokeWidth={2}
              name="Revenue"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="transactions"
              stroke={theme.palette.secondary.main}
              strokeWidth={2}
              name="Transactions"
            />
            <Brush dataKey="date" height={30} stroke={theme.palette.primary.main} />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'area') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={displayData.transactionTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <RechartsTooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="revenue"
              stackId="1"
              stroke={theme.palette.primary.main}
              fill={alpha(theme.palette.primary.main, 0.6)}
              name="Revenue"
            />
            <Area
              type="monotone"
              dataKey="transactions"
              stackId="2"
              stroke={theme.palette.secondary.main}
              fill={alpha(theme.palette.secondary.main, 0.6)}
              name="Transactions"
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={displayData.transactionTrends}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <RechartsTooltip content={<CustomTooltip />} />
          <Legend />
          <Bar
            yAxisId="left"
            dataKey="revenue"
            fill={alpha(theme.palette.primary.main, 0.6)}
            name="Revenue"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="success_rate"
            stroke={theme.palette.success.main}
            strokeWidth={2}
            name="Success Rate %"
          />
        </ComposedChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Box id="analytics-content" sx={{ position: 'relative' }}>
      {/* Loading Overlay for All Records */}
      {loadingAllRecords && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bgcolor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3
          }}
        >
          <Box
            sx={{
              bgcolor: 'background.paper',
              p: 4,
              borderRadius: 2,
              boxShadow: 24,
              textAlign: 'center',
              maxWidth: 500
            }}
          >
            <Schedule sx={{ fontSize: 64, color: 'primary.main', mb: 2, animation: 'spin 2s linear infinite' }} />
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Loading Complete Analytics
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Analyzing all transactions for the selected date range...
            </Typography>
            <LinearProgress sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              This may take 1-3 minutes for large datasets.
              <br />
              Please do not close this window.
            </Typography>
            <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block' }}>
              Estimated time remaining: {(() => {
                const startDate = parseISO(filters.date_from);
                const endDate = parseISO(filters.date_to);
                const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                if (daysDiff <= 7) return "30-60 seconds";
                if (daysDiff <= 30) return "1-2 minutes";
                return "2-3 minutes";
              })()}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Analytics Overview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Comprehensive insights into your payment ecosystem
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchAnalyticsData}
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
            {exporting ? 'Exporting...' : 'Export Report'}
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
                  minDate={parseISO(filters.date_from)}
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
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="body2" color="text.secondary">
                {showAllRecords
                  ? `Showing ALL ${allRecordsData?.kpis.totalTransactions.toLocaleString('en-IN') || 0} transactions`
                  : `Showing ${getRecordRange().start}-${getRecordRange().end} of ${totalRecords.toLocaleString('en-IN')} transactions (${filters.page_size.toLocaleString('en-IN')} per page)`}
              </Typography>
              {(() => {
                const startDate = parseISO(filters.date_from);
                const endDate = parseISO(filters.date_to);
                const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                if (!showAllRecords && daysDiff > 30) {
                  const estimatedTime = daysDiff <= 60 ? "1-2 min" : "2-3 min";
                  return (
                    <Chip
                      label={`${daysDiff} days selected - "All Records" may take ${estimatedTime}`}
                      size="small"
                      color="warning"
                      variant="outlined"
                      icon={<Schedule />}
                    />
                  );
                }
                return null;
              })()}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {!showAllRecords && (
                <Typography variant="body2" color="text.secondary">
                  Page {currentPage} of {getTotalPages()}
                </Typography>
              )}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<NavigateBefore />}
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1 || loading || showAllRecords || loadingAllRecords}
                >
                  Previous
                </Button>
                <Tooltip
                  title={
                    loadingAllRecords
                      ? "Loading complete analytics... This may take 1-3 minutes for large datasets"
                      : showAllRecords
                      ? "Return to paginated view"
                      : "Load complete analytics for entire date range (may take 1-3 minutes for large datasets)"
                  }
                  arrow
                >
                  <span>
                    <Button
                      variant={showAllRecords ? "contained" : "outlined"}
                      size="small"
                      onClick={() => {
                        if (showAllRecords) {
                          setShowAllRecords(false);
                        } else {
                          fetchAllRecordsAnalytics();
                        }
                      }}
                      disabled={loading || loadingAllRecords}
                      color={showAllRecords ? "primary" : "inherit"}
                      startIcon={loadingAllRecords ? <Schedule className="rotating-icon" /> : <Assessment />}
                    >
                      {loadingAllRecords
                        ? "Loading..."
                        : showAllRecords
                        ? "Exit All Records"
                        : "All Records"}
                    </Button>
                  </span>
                </Tooltip>
                <Button
                  variant="outlined"
                  size="small"
                  endIcon={<NavigateNext />}
                  onClick={handleNextPage}
                  disabled={currentPage >= getTotalPages() || loading || showAllRecords || loadingAllRecords}
                >
                  Next
                </Button>
              </Box>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Visual Indicator for All Records Mode */}
      {showAllRecords && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: alpha(theme.palette.info.main, 0.1), border: `2px solid ${theme.palette.info.main}` }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Assessment sx={{ color: theme.palette.info.main }} />
            <Typography variant="body1" fontWeight="bold" color="info.main">
              Viewing Complete Analytics - All {allRecordsData?.kpis.totalTransactions.toLocaleString('en-IN')} records for period {filters.date_from} to {filters.date_to}
            </Typography>
          </Box>
        </Paper>
      )}

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total Revenue"
            value={getDisplayData().kpis.totalRevenue >= 100000
              ? `₹${(getDisplayData().kpis.totalRevenue / 100000).toFixed(1)}L`
              : `₹${getDisplayData().kpis.totalRevenue.toLocaleString('en-IN')}`}
            subtitle="vs last period"
            icon={<AttachMoney />}
            trend={getDisplayData().kpis.revenueGrowth}
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total Transactions"
            value={getDisplayData().kpis.totalTransactions.toLocaleString('en-IN')}
            subtitle="vs last period"
            icon={<Receipt />}
            trend={getDisplayData().kpis.transactionGrowth}
            color={theme.palette.secondary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Success Rate"
            value={`${getDisplayData().kpis.successRate.toFixed(2)}%`}
            subtitle="performance"
            icon={<CheckCircle />}
            trend={0}
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Avg Transaction"
            value={`₹${getDisplayData().kpis.avgTransactionValue.toFixed(0)}`}
            subtitle="per transaction"
            icon={<ShowChart />}
            trend={0}
            color={theme.palette.warning.main}
          />
        </Grid>
      </Grid>

      {/* Main Chart */}
      <Paper sx={{ p: 3, mb: 3 }} className="main-chart-container">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Transaction Trends</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <ToggleButtonGroup
              value={chartType}
              exclusive
              onChange={(e, value) => value && setChartType(value)}
              size="small"
            >
              <ToggleButton value="line">
                <ShowChart />
              </ToggleButton>
              <ToggleButton value="area">
                <Timeline />
              </ToggleButton>
              <ToggleButton value="composed">
                <BarChartIcon />
              </ToggleButton>
            </ToggleButtonGroup>
            <IconButton size="small">
              <FullscreenOutlined />
            </IconButton>
          </Box>
        </Box>
        {loading && <LinearProgress />}
        {renderMainChart()}
      </Paper>

      {/* Secondary Charts Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Payment Modes Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              Payment Mode Distribution
            </Typography>
            <Box sx={{ flexGrow: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={getDisplayData().paymentModes}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="value"
                    label={false}
                  >
                    {getDisplayData().paymentModes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getPaymentModeColor(entry.name)} />
                    ))}
                  </Pie>
                  <RechartsTooltip
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
                {getDisplayData().paymentModes.map((mode, index) => (
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
                        bgcolor: getPaymentModeColor(mode.name),
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
                      {mode.name}: {mode.value.toFixed(1)}%
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Hourly Transaction Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: 400, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              Hourly Transaction Pattern
            </Typography>
            <Box sx={{ flexGrow: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getDisplayData().hourlyDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar dataKey="transactions" fill={alpha(theme.palette.primary.main, 0.7)} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Advanced Visualizations Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Merchant Performance Radar */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Merchant Performance Comparison
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={data.merchantPerformance}>
                <PolarGrid />
                <PolarAngleAxis dataKey="metric" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar
                  name="Merchant A"
                  dataKey="A"
                  stroke={theme.palette.primary.main}
                  fill={alpha(theme.palette.primary.main, 0.6)}
                />
                <Radar
                  name="Merchant B"
                  dataKey="B"
                  stroke={theme.palette.secondary.main}
                  fill={alpha(theme.palette.secondary.main, 0.6)}
                />
                <Radar
                  name="Merchant C"
                  dataKey="C"
                  stroke={theme.palette.warning.main}
                  fill={alpha(theme.palette.warning.main, 0.6)}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Conversion Funnel */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Transaction Conversion Funnel
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={data.conversionFunnel}
                layout="horizontal"
                margin={{ left: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <RechartsTooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill={theme.palette.primary.main}>
                  {data.conversionFunnel.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Status Breakdown and Geographic Distribution */}
      <Grid container spacing={3}>
        {/* Status Breakdown */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Transaction Status Breakdown
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={getDisplayData().statusBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {getDisplayData().statusBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
            <Box sx={{ mt: 2 }}>
              {getDisplayData().statusBreakdown.map((status) => (
                <Box key={status.name} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: status.color,
                      mr: 1,
                    }}
                  />
                  <Typography variant="body2">
                    {status.name}: {status.value.toFixed(2)}% ({status.count.toLocaleString('en-IN')})
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Geographic Treemap */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Geographic Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={350}>
              <Treemap
                data={data.geographicData}
                dataKey="value"
                aspectRatio={4 / 3}
                stroke="#fff"
                fill={theme.palette.primary.main}
              >
                <RechartsTooltip content={<CustomTooltip />} />
              </Treemap>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Analytics;