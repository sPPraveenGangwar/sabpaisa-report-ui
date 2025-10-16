import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Alert,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Chip,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import DownloadIcon from '@mui/icons-material/Download';
import DescriptionIcon from '@mui/icons-material/Description';
import qwikformsService, { QwikFormsFilters } from '../../services/qwikformsService';
import { format } from 'date-fns';

const QwikFormsReports: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Report Type
  const [reportType, setReportType] = useState<'excel' | 'csv' | 'pdf'>('excel');

  // Filters
  const [filters, setFilters] = useState<QwikFormsFilters>({
    date_from: '',
    date_to: '',
    trans_status: '',
    trans_paymode: '',
    client_id: '',
    form_id: undefined,
    settlement_status: '',
    search: '',
  });

  const [dateFrom, setDateFrom] = useState<Date | null>(null);
  const [dateTo, setDateTo] = useState<Date | null>(null);

  // Options
  const statusOptions = ['SUCCESS', 'FAILED', 'PENDING', 'PROCESSING'];
  const paymentModeOptions = ['UPI', 'CARD', 'NETBANKING', 'WALLET', 'EMI'];
  const settlementStatusOptions = ['COMPLETED', 'PENDING', 'PROCESSING', 'FAILED'];

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

  // Generate report
  const handleGenerateReport = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (reportType === 'excel') {
        await qwikformsService.generateExcelReport(filters);
        setSuccess('Excel report downloaded successfully');
      } else if (reportType === 'csv') {
        await qwikformsService.generateCSVReport(filters);
        setSuccess('CSV report downloaded successfully');
      } else if (reportType === 'pdf') {
        await qwikformsService.generatePDFReport(filters);
        setSuccess('PDF report downloaded successfully');
      }
    } catch (err: any) {
      // Only show error for actual failures, not for empty results
      if (err.response?.status && err.response.status !== 404) {
        setError(err.response?.data?.message || `Failed to generate ${reportType.toUpperCase()} report`);
      } else {
        setError('No data available for the selected criteria');
      }
    } finally {
      setLoading(false);
    }
  };

  // Clear filters
  const handleClearFilters = () => {
    setFilters({
      date_from: '',
      date_to: '',
      trans_status: '',
      trans_paymode: '',
      client_id: '',
      form_id: undefined,
      settlement_status: '',
      search: '',
    });
    setDateFrom(null);
    setDateTo(null);
    setError(null);
    setSuccess(null);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          QwikForms Reports
        </Typography>

        {/* Report Type Selection */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Report Format
            </Typography>
            <FormControl component="fieldset">
              <RadioGroup
                row
                value={reportType}
                onChange={(e) => setReportType(e.target.value as 'excel' | 'csv' | 'pdf')}
              >
                <FormControlLabel
                  value="excel"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <DescriptionIcon sx={{ mr: 1, color: '#217346' }} />
                      Excel (.xlsx)
                      <Chip label="5000 rows max" size="small" sx={{ ml: 1 }} />
                    </Box>
                  }
                />
                <FormControlLabel
                  value="csv"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <DescriptionIcon sx={{ mr: 1, color: '#0088FE' }} />
                      CSV (.csv)
                      <Chip label="10000 rows max" size="small" sx={{ ml: 1 }} />
                    </Box>
                  }
                />
                <FormControlLabel
                  value="pdf"
                  control={<Radio />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <DescriptionIcon sx={{ mr: 1, color: '#FF0000' }} />
                      PDF/HTML (.html)
                      <Chip label="1000 rows max" size="small" sx={{ ml: 1 }} />
                    </Box>
                  }
                />
              </RadioGroup>
            </FormControl>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Report Filters
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
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
              <Grid item xs={12} sm={6} md={3}>
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
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Transaction Status"
                  value={filters.trans_status}
                  onChange={(e) => handleFilterChange('trans_status', e.target.value)}
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
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Payment Mode"
                  value={filters.trans_paymode}
                  onChange={(e) => handleFilterChange('trans_paymode', e.target.value)}
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
                  label="Settlement Status"
                  value={filters.settlement_status}
                  onChange={(e) => handleFilterChange('settlement_status', e.target.value)}
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
                  {settlementStatusOptions.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Client ID"
                  value={filters.client_id}
                  onChange={(e) => handleFilterChange('client_id', e.target.value)}
                  placeholder="e.g., COLL001"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Form ID"
                  type="number"
                  value={filters.form_id || ''}
                  onChange={(e) =>
                    handleFilterChange('form_id', e.target.value ? parseInt(e.target.value) : undefined)
                  }
                  placeholder="e.g., 456"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Search"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Trans ID, Customer, Email..."
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card sx={{ mb: 3, bgcolor: '#E3F2FD' }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              <strong>Note:</strong> Reports will be generated based on the selected filters. If no filters
              are applied, all transactions will be included (subject to row limits). Large reports may take
              a few moments to generate.
            </Typography>
          </CardContent>
        </Card>

        {/* Success Alert */}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Action Buttons */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                size="large"
                startIcon={<DownloadIcon />}
                onClick={handleGenerateReport}
                disabled={loading}
              >
                {loading ? 'Generating...' : `Generate ${reportType.toUpperCase()} Report`}
              </Button>
              <Button variant="outlined" size="large" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Report Info */}
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Report Details
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Box sx={{ p: 2, bgcolor: '#F5F5F5', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    Excel Report (.xlsx)
                  </Typography>
                  <Typography variant="body2">
                    • Maximum 5,000 transactions
                    <br />
                    • Formatted with headers and styling
                    <br />
                    • Opens in Excel, Google Sheets, etc.
                    <br />• Best for data analysis and pivot tables
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ p: 2, bgcolor: '#F5F5F5', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    CSV Report (.csv)
                  </Typography>
                  <Typography variant="body2">
                    • Maximum 10,000 transactions
                    <br />
                    • Plain text format
                    <br />
                    • Universal compatibility
                    <br />• Best for large exports and imports
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ p: 2, bgcolor: '#F5F5F5', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="primary" gutterBottom>
                    PDF Report (.html)
                  </Typography>
                  <Typography variant="body2">
                    • Maximum 1,000 transactions
                    <br />
                    • HTML format (viewable as PDF)
                    <br />
                    • Professional formatting
                    <br />• Best for printing and sharing
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </LocalizationProvider>
  );
};

export default QwikFormsReports;