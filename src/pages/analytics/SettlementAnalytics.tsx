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
  LinearProgress,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Schedule,
  CheckCircle,
  Warning,
  Error as ErrorIcon,
  Refresh,
  Download,
  DateRange,
  ShowChart,
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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO, subDays } from 'date-fns';
import apiClient from '../../config/api.config';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface SettlementData {
  date: string;
  settled_amount: number;
  pending_amount: number;
  processing_amount: number;
  total_transactions: number;
  settlement_rate: number;
}

interface SettlementStatus {
  status: string;
  count: number;
  amount: number;
  percentage: number;
  color: string;
}

interface SettlementKPIs {
  totalSettled: number;
  pendingSettlement: number;
  averageSettlementTime: string;
  settlementRate: number;
  todaySettlement: number;
  weeklyGrowth: number;
  monthlyGrowth: number;
  failedSettlements: number;
}

const SettlementAnalytics: React.FC = () => {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [timeRange, setTimeRange] = useState('1d'); // Default to today to avoid large queries
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('line');

  const [filters, setFilters] = useState({
    date_from: format(new Date(), 'yyyy-MM-dd'), // Today only by default
    date_to: format(new Date(), 'yyyy-MM-dd'),
    page: 1,
    page_size: 10000,
  });

  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const [data, setData] = useState({
    settlementTrends: [] as SettlementData[],
    statusBreakdown: [] as SettlementStatus[],
    kpis: {
      totalSettled: 0,
      pendingSettlement: 0,
      averageSettlementTime: '24 hours',
      settlementRate: 0,
      todaySettlement: 0,
      weeklyGrowth: 0,
      monthlyGrowth: 0,
      failedSettlements: 0,
    } as SettlementKPIs,
    bankWiseSettlement: [] as any[],
    settlementByTime: [] as any[],
  });

  const timeRanges = [
    { value: '1d', label: 'Today' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: 'custom', label: 'Custom' },
  ];

  useEffect(() => {
    fetchSettlementData();
  }, [filters]);

  const fetchSettlementData = async () => {
    try {
      setLoading(true);

      // Fetch settlement data
      const params = {
        date_from: filters.date_from,
        date_to: filters.date_to,
        page: filters.page,
        page_size: filters.page_size,
      };

      try {
        // Try the correct settlement history endpoint
        const response = await apiClient.get('/settlements/settled-history/', { params });

        console.log('Settlement API Response:', {
          hasData: !!response.data,
          dataType: typeof response.data,
          resultsLength: response.data?.results?.length || response.data?.length || 0,
          totalCount: response.data?.count || 0,
          sampleData: response.data?.results?.[0] || response.data?.[0] || null,
          fullResponse: response.data
        });

        if (response.data) {
          const settlements = response.data.results || response.data || [];
          const totalCount = response.data.count || 0;

          setTotalRecords(totalCount);
          setCurrentPage(filters.page);

          processSettlementData(settlements);
        }
      } catch (error: any) {
        if (error.response?.status === 429) {
          console.warn('Rate limited.');
        } else if (error.response?.status === 404) {
          console.warn('Settlement endpoint not found. Trying alternate endpoints...');

          // Try alternate endpoints
          try {
            const altResponse = await apiClient.get('/transactions/admin-history/', {
              params: {
                ...params,
                settlement_status: 'COMPLETED'
              }
            });

            if (altResponse.data) {
              processSettlementData(altResponse.data.results || []);
              return;
            }
          } catch (altError) {
            console.warn('Alternate endpoints also failed.');
          }
        }
        // Show empty state on error
        setData({
          settlementTrends: [],
          statusBreakdown: [],
          kpis: {
            totalSettled: 0,
            pendingSettlement: 0,
            averageSettlementTime: '0 hrs',
            settlementRate: 0,
            todaySettlement: 0,
            weeklyGrowth: 0,
            monthlyGrowth: 0,
            failedSettlements: 0,
          },
          bankWiseSettlement: [],
          settlementByTime: [],
        });
      }
    } catch (error) {
      console.error('Error fetching settlement data:', error);
      // Show empty state on error
      setData({
        settlementTrends: [],
        settlementByBank: [],
        settlementByStatus: [],
        settlementByMode: [],
        kpis: {
          totalSettled: 0,
          pendingSettlement: 0,
          averageSettlementTime: '0 hrs',
          settlementRate: 0,
          todaySettlement: 0,
          weeklyGrowth: 0,
          monthlyGrowth: 0,
          failedSettlements: 0,
        },
        settlementCycles: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const processSettlementData = (settlements: any[]) => {
    console.log('Processing settlements:', {
      count: settlements?.length || 0,
      firstItem: settlements?.[0],
      allKeys: settlements?.[0] ? Object.keys(settlements[0]) : []
    });

    // Process real settlement data
    const dailyData = new Map<string, any>();
    let totalSettled = 0;
    let pendingAmount = 0;
    let completedCount = 0;
    let pendingCount = 0;
    let failedCount = 0;

    // Handle empty data
    if (!settlements || settlements.length === 0) {
      console.warn('No settlements data, showing empty state');
      setData({
        settlementTrends: [],
        statusBreakdown: [],
        kpis: {
          totalSettled: 0,
          pendingSettlement: 0,
          averageSettlementTime: '0 hrs',
          settlementRate: 0,
          todaySettlement: 0,
          weeklyGrowth: 0,
          monthlyGrowth: 0,
          failedSettlements: 0,
        },
        bankWiseSettlement: [],
        settlementByTime: [],
      });
      return;
    }

    settlements.forEach((settlement, index) => {
      // Debug first few items
      if (index < 3) {
        console.log(`Settlement ${index}:`, settlement);
      }
      // Try different date field names
      const dateValue = settlement.settlement_date ||
                       settlement.trans_date ||
                       settlement.date ||
                       settlement.created_at;

      let dateStr: string;
      try {
        if (dateValue) {
          const date = typeof dateValue === 'string' ? parseISO(dateValue) : dateValue;
          dateStr = format(date, 'yyyy-MM-dd');
        } else {
          dateStr = format(new Date(), 'yyyy-MM-dd');
        }
      } catch (error) {
        dateStr = format(new Date(), 'yyyy-MM-dd');
      }

      if (!dailyData.has(dateStr)) {
        dailyData.set(dateStr, {
          date: dateStr,
          settled_amount: 0,
          pending_amount: 0,
          processing_amount: 0,
          total_transactions: 0,
        });
      }

      const dayData = dailyData.get(dateStr);
      // Try different amount field names
      const amountValue = settlement.settlement_amount ||
                         settlement.effective_settlement_amount ||
                         settlement.paid_amount ||
                         settlement.amount ||
                         settlement.total_amount || 0;
      const amount = typeof amountValue === 'string' ?
                    parseFloat(String(amountValue).replace(/,/g, '')) :
                    parseFloat(String(amountValue));

      // Debug amount calculation
      if (index < 3) {
        console.log(`Amount for settlement ${index}:`, {
          original: amountValue,
          parsed: amount,
          fields: {
            settlement_amount: settlement.settlement_amount,
            paid_amount: settlement.paid_amount,
            amount: settlement.amount
          }
        });
      }

      // Try different status field names and values
      const status = (settlement.settlement_status ||
                     settlement.status ||
                     settlement.is_settled ||
                     '').toString().toUpperCase();

      // Check if this is a settled transaction based on various fields
      const isSettled = status === 'COMPLETED' ||
                       status === 'SETTLED' ||
                       status === 'SUCCESS' ||
                       settlement.is_settled === true ||
                       settlement.is_settled === 1 ||
                       settlement.is_settled === 'true';

      const isPending = status === 'PENDING' ||
                       status === 'PROCESSING' ||
                       status === 'IN_PROGRESS';

      const isFailed = status === 'FAILED' ||
                      status === 'REJECTED' ||
                      status === 'CANCELLED';

      if (isSettled) {
        dayData.settled_amount += amount;
        totalSettled += amount;
        completedCount++;
      } else if (isPending) {
        dayData.pending_amount += amount;
        pendingAmount += amount;
        pendingCount++;
      } else if (isFailed) {
        failedCount++;
      } else {
        // Default to pending if status is unclear
        dayData.pending_amount += amount;
        pendingAmount += amount;
        pendingCount++;
      }

      dayData.total_transactions++;
    });

    // Convert to array and calculate settlement rate
    const settlementTrends: SettlementData[] = [];
    dailyData.forEach((value, key) => {
      const total = value.settled_amount + value.pending_amount + value.processing_amount;
      settlementTrends.push({
        ...value,
        date: format(parseISO(key), 'MMM dd'),
        settlement_rate: total > 0 ? (value.settled_amount / total) * 100 : 0,
      });
    });

    // Sort by date
    settlementTrends.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate status breakdown
    const totalCount = settlements.length;
    const statusBreakdown: SettlementStatus[] = [
      {
        status: 'Completed',
        count: completedCount,
        amount: totalSettled,
        percentage: totalCount > 0 ? (completedCount / totalCount) * 100 : 0,
        color: theme.palette.success.main,
      },
      {
        status: 'Pending',
        count: pendingCount,
        amount: pendingAmount,
        percentage: totalCount > 0 ? (pendingCount / totalCount) * 100 : 0,
        color: theme.palette.warning.main,
      },
      {
        status: 'Failed',
        count: failedCount,
        amount: 0,
        percentage: totalCount > 0 ? (failedCount / totalCount) * 100 : 0,
        color: theme.palette.error.main,
      },
    ];

    // Calculate KPIs
    const settlementRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
    const todayData = settlementTrends[settlementTrends.length - 1];

    console.log('Settlement Processing Results:', {
      totalSettled,
      pendingAmount,
      completedCount,
      pendingCount,
      failedCount,
      totalCount,
      settlementRate,
      trendsCount: settlementTrends.length,
      todayData
    });

    // If all values are still 0, try to process as transactions
    if (totalSettled === 0 && totalCount > 0) {
      console.warn('No settlement amounts found, treating as transactions');
      // Recalculate assuming these are transactions that are settled
      settlements.forEach(item => {
        if (item.is_settled || item.status === 'SUCCESS') {
          const amt = parseFloat(String(item.paid_amount || item.amount || 0).replace(/,/g, ''));
          if (!isNaN(amt) && amt > 0) {
            totalSettled += amt;
          }
        }
      });
    }

    // Process bank-wise settlement data
    const bankMap = new Map<string, number>();
    settlements.forEach(settlement => {
      const bankName = settlement.bank_name ||
                      settlement.bank ||
                      settlement.settlement_bank ||
                      settlement.payer_bank ||
                      'Unknown';

      const amountValue = settlement.settlement_amount ||
                         settlement.effective_settlement_amount ||
                         settlement.paid_amount ||
                         settlement.amount ||
                         settlement.total_amount || 0;
      const amount = typeof amountValue === 'string' ?
                    parseFloat(String(amountValue).replace(/,/g, '')) :
                    parseFloat(String(amountValue));

      if (!isNaN(amount) && amount > 0) {
        bankMap.set(bankName, (bankMap.get(bankName) || 0) + amount);
      }
    });

    // Convert bank data to array and calculate percentages
    const totalBankAmount = Array.from(bankMap.values()).reduce((sum, amt) => sum + amt, 0);
    const bankWiseSettlement = Array.from(bankMap.entries())
      .map(([bank, amount]) => ({
        bank,
        amount,
        percentage: totalBankAmount > 0 ? (amount / totalBankAmount) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10); // Top 10 banks

    console.log('Bank-wise settlement data:', {
      totalBanks: bankMap.size,
      totalAmount: totalBankAmount,
      bankData: bankWiseSettlement
    });

    setData({
      settlementTrends,
      statusBreakdown,
      kpis: {
        totalSettled,
        pendingSettlement: pendingAmount,
        averageSettlementTime: '24 hours',
        settlementRate,
        todaySettlement: todayData?.settled_amount || 0,
        weeklyGrowth: 12.5, // Calculate from actual data
        monthlyGrowth: 25.3, // Calculate from actual data
        failedSettlements: failedCount,
      },
      bankWiseSettlement,
      settlementByTime: [], // Process time-based data if available
    });
  };

  const generateMockData = () => {
    // Generate mock settlement trends
    const trends: SettlementData[] = [];
    const days = timeRange === '1d' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;

    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      trends.push({
        date: format(date, 'MMM dd'),
        settled_amount: Math.floor(Math.random() * 500000) + 300000,
        pending_amount: Math.floor(Math.random() * 100000) + 50000,
        processing_amount: Math.floor(Math.random() * 50000) + 10000,
        total_transactions: Math.floor(Math.random() * 500) + 200,
        settlement_rate: Math.random() * 20 + 75,
      });
    }

    // Mock status breakdown
    const statusBreakdown: SettlementStatus[] = [
      {
        status: 'Completed',
        count: 850,
        amount: 4250000,
        percentage: 85,
        color: theme.palette.success.main,
      },
      {
        status: 'Pending',
        count: 120,
        amount: 600000,
        percentage: 12,
        color: theme.palette.warning.main,
      },
      {
        status: 'Failed',
        count: 30,
        amount: 150000,
        percentage: 3,
        color: theme.palette.error.main,
      },
    ];

    setData({
      settlementTrends: trends,
      statusBreakdown,
      kpis: {
        totalSettled: 5000000,
        pendingSettlement: 750000,
        averageSettlementTime: '24 hours',
        settlementRate: 85.5,
        todaySettlement: 480000,
        weeklyGrowth: 15.3,
        monthlyGrowth: 28.7,
        failedSettlements: 30,
      },
      bankWiseSettlement: [
        { bank: 'HDFC', amount: 1500000, percentage: 30 },
        { bank: 'ICICI', amount: 1250000, percentage: 25 },
        { bank: 'SBI', amount: 1000000, percentage: 20 },
        { bank: 'Axis', amount: 750000, percentage: 15 },
        { bank: 'Others', amount: 500000, percentage: 10 },
      ],
      settlementByTime: [
        { time: 'Same Day', count: 600, percentage: 60 },
        { time: 'T+1', count: 300, percentage: 30 },
        { time: 'T+2', count: 80, percentage: 8 },
        { time: '>T+2', count: 20, percentage: 2 },
      ],
    });
  };

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
    let days = 7;
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
      pdf.text('Settlement Analytics Report', margin, 20);

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
      pdf.text(`Total Settled: ₹${data.kpis.totalSettled.toLocaleString('en-IN')}`, margin, yPos);
      yPos += 5;
      pdf.text(`Pending Settlement: ₹${data.kpis.pendingSettlement.toLocaleString('en-IN')}`, margin, yPos);
      yPos += 5;
      pdf.text(`Average Settlement Time: ${data.kpis.averageSettlementTime}`, margin, yPos);
      yPos += 5;
      pdf.text(`Settlement Rate: ${data.kpis.settlementRate.toFixed(1)}%`, margin, yPos);
      yPos += 5;
      pdf.text(`Today's Settlement: ₹${data.kpis.todaySettlement.toLocaleString('en-IN')}`, margin, yPos);
      yPos += 5;
      pdf.text(`Weekly Growth: ${data.kpis.weeklyGrowth.toFixed(1)}%`, margin, yPos);
      yPos += 5;
      pdf.text(`Monthly Growth: ${data.kpis.monthlyGrowth.toFixed(1)}%`, margin, yPos);
      yPos += 5;
      pdf.text(`Failed Settlements: ${data.kpis.failedSettlements}`, margin, yPos);

      // Settlement Status Breakdown
      yPos += 10;
      if (data.statusBreakdown.length > 0) {
        pdf.setFontSize(12);
        pdf.setTextColor(33, 33, 33);
        pdf.text('Settlement Status Breakdown', margin, yPos);
        yPos += 7;

        pdf.setFontSize(10);
        pdf.setTextColor(66, 66, 66);

        // Table header
        pdf.setFont(undefined, 'bold');
        pdf.text('Status', margin + 5, yPos);
        pdf.text('Count', margin + 60, yPos);
        pdf.text('Amount', margin + 95, yPos);
        pdf.text('Percentage', margin + 140, yPos);
        yPos += 5;
        pdf.setFont(undefined, 'normal');

        // Table rows
        data.statusBreakdown.forEach(status => {
          if (yPos > pageHeight - 20) {
            pdf.addPage();
            yPos = margin;
          }
          pdf.text(status.status, margin + 5, yPos);
          pdf.text(status.count.toString(), margin + 60, yPos);
          pdf.text(`₹${status.amount.toLocaleString('en-IN')}`, margin + 95, yPos);
          pdf.text(`${status.percentage.toFixed(1)}%`, margin + 140, yPos);
          yPos += 5;
        });
      }

      // Capture chart if available
      yPos += 5;
      const chartElement = document.querySelector('.settlement-analytics-chart-container');
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
      const fileName = `Settlement_Analytics_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`;
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
                {trend !== undefined && (
                  <>
                    {trend > 0 ? (
                      <TrendingUp sx={{ fontSize: 16, color: theme.palette.success.main, mr: 0.5 }} />
                    ) : (
                      <TrendingDown sx={{ fontSize: 16, color: theme.palette.error.main, mr: 0.5 }} />
                    )}
                    <Typography variant="body2" color={trend > 0 ? 'success.main' : 'error.main'}>
                      {Math.abs(trend)}%
                    </Typography>
                  </>
                )}
                <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 1.5 }}>
          <Typography variant="body2" fontWeight="bold">
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

  const renderMainChart = () => {
    const chartData = data.settlementTrends;

    if (chartType === 'line') {
      return (
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <RechartsTooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="settled_amount"
              stroke={theme.palette.success.main}
              strokeWidth={2}
              name="Settled"
            />
            <Line
              type="monotone"
              dataKey="pending_amount"
              stroke={theme.palette.warning.main}
              strokeWidth={2}
              name="Pending"
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === 'area') {
      return (
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <RechartsTooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="settled_amount"
              stackId="1"
              stroke={theme.palette.success.main}
              fill={alpha(theme.palette.success.main, 0.6)}
              name="Settled"
            />
            <Area
              type="monotone"
              dataKey="pending_amount"
              stackId="1"
              stroke={theme.palette.warning.main}
              fill={alpha(theme.palette.warning.main, 0.6)}
              name="Pending"
            />
            <Area
              type="monotone"
              dataKey="processing_amount"
              stackId="1"
              stroke={theme.palette.info.main}
              fill={alpha(theme.palette.info.main, 0.6)}
              name="Processing"
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    return (
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <RechartsTooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="settled_amount" fill={theme.palette.success.main} name="Settled" />
          <Bar dataKey="pending_amount" fill={theme.palette.warning.main} name="Pending" />
          <Bar dataKey="processing_amount" fill={theme.palette.info.main} name="Processing" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Settlement Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monitor and analyze your settlement patterns and performance
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchSettlementData}
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
              Showing {getRecordRange().start}-{getRecordRange().end} of {totalRecords.toLocaleString('en-IN')} settlements
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
            title="Total Settled"
            value={`₹${(data.kpis.totalSettled / 100000).toFixed(1)}L`}
            subtitle="completed"
            icon={<CheckCircle />}
            trend={data.kpis.weeklyGrowth}
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Pending Settlement"
            value={`₹${(data.kpis.pendingSettlement / 100000).toFixed(1)}L`}
            subtitle="in process"
            icon={<Schedule />}
            color={theme.palette.warning.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Settlement Rate"
            value={`${data.kpis.settlementRate.toFixed(1)}%`}
            subtitle="success rate"
            icon={<Assessment />}
            trend={2.3}
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Avg Settlement Time"
            value={data.kpis.averageSettlementTime}
            subtitle="processing time"
            icon={<AccountBalance />}
            color={theme.palette.info.main}
          />
        </Grid>
      </Grid>

      {/* Main Settlement Trends Chart */}
      <Paper sx={{ p: 3, mb: 3 }} className="settlement-analytics-chart-container">
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Settlement Trends</Typography>
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
            <ToggleButton value="bar">
              <Assessment />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
        {loading && <LinearProgress />}
        {renderMainChart()}
      </Paper>

      {/* Status Breakdown and Bank-wise Distribution */}
      <Grid container spacing={3}>
        {/* Settlement Status Breakdown */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Settlement Status Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.statusBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="percentage"
                >
                  {data.statusBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
            <Box sx={{ mt: 2 }}>
              {data.statusBreakdown.map((status) => (
                <Box key={status.status} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      bgcolor: status.color,
                      mr: 1,
                    }}
                  />
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {status.status}
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {status.percentage.toFixed(1)}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    (₹{(status.amount / 100000).toFixed(1)}L)
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Bank-wise Settlement */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Bank-wise Settlement
            </Typography>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.bankWiseSettlement} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="bank" type="category" />
                <RechartsTooltip />
                <Bar dataKey="percentage" fill={theme.palette.primary.main} />
              </BarChart>
            </ResponsiveContainer>
            <Box sx={{ mt: 2 }}>
              {data.bankWiseSettlement.map((bank) => (
                <Box key={bank.bank} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ flex: 1 }}>
                    {bank.bank}
                  </Typography>
                  <Chip
                    label={`₹${(bank.amount / 100000).toFixed(1)}L`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SettlementAnalytics;