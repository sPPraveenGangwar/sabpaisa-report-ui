import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Download,
  Delete,
  Refresh,
  Visibility,
  FileDownload,
  PictureAsPdf,
  TableChart,
  Description,
  Assessment,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import apiClient from '../../config/api.config';

interface Report {
  id: string;
  name: string;
  type: string;
  format?: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
  fileUrl?: string;
  fileSize?: number;
}

const ReportHistory: React.FC = () => {
  const theme = useTheme();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      // For now, use localStorage only since API endpoint is not available
      // TODO: Enable API when /api/v1/reports/history endpoint is implemented
      const USE_API = false; // Set to true when backend endpoint is ready

      // Only try API if enabled
      if (USE_API) {
        try {
          const response = await apiClient.get('/reports/history');
          setReports(response.data.reports || []);
          setLoading(false);
          return;
        } catch (apiErr: any) {
          // If API fails, fall back to localStorage
          console.log('Report history API failed, using localStorage fallback');
        }
      }

      // Load from localStorage (primary source for now)
      const storedReports = localStorage.getItem('report_history');
      if (storedReports) {
        const parsedReports = JSON.parse(storedReports);
        setReports(parsedReports);
      } else {
        setReports([]);
      }
    } catch (err: any) {
      console.error('Error loading reports:', err);
      setError('Failed to load report history.');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (report: Report) => {
    if (!report.fileUrl) return;

    try {
      const response = await apiClient.get(report.fileUrl, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${report.name}.${report.format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setError('Failed to download report');
    }
  };

  const handleDelete = async (reportId: string) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;

    try {
      const USE_API = false; // Match the setting in fetchReports

      // Only try API if enabled
      if (USE_API) {
        try {
          await apiClient.delete(`/reports/${reportId}`);
        } catch (apiErr: any) {
          console.log('Report delete API failed, proceeding with local deletion');
        }
      }

      // Delete from local state and localStorage
      const updatedReports = reports.filter(r => r.id !== reportId);
      setReports(updatedReports);
      localStorage.setItem('report_history', JSON.stringify(updatedReports));
    } catch (err: any) {
      setError('Failed to delete report');
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getFormatIcon = (format?: string) => {
    if (!format) return <Description />;
    switch (format.toLowerCase()) {
      case 'pdf':
        return <PictureAsPdf />;
      case 'csv':
      case 'xlsx':
      case 'excel':
        return <TableChart />;
      default:
        return <Description />;
    }
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(2)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Report History
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View and download previously generated reports
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchReports}
            disabled={loading}
          >
            Refresh
          </Button>
        </Box>
      </Paper>

      {error && !error.includes('No reports available') && (
        <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                <TableCell>Report Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Format</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>File Size</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Box sx={{ py: 6, textAlign: 'center' }}>
                      <Assessment sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No Report History
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Generate your first report to see it here.
                      </Typography>
                      <Button
                        variant="contained"
                        href="/reports/generate"
                        sx={{ mt: 2 }}
                      >
                        Generate Report
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                reports
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((report) => (
                    <TableRow key={report.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getFormatIcon(report.format)}
                          <Typography variant="body2">{report.name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" textTransform="capitalize">
                          {report.type}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={report.format ? report.format.toUpperCase() : 'N/A'}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={report.status}
                          size="small"
                          color={getStatusColor(report.status)}
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {format(parseISO(report.createdAt), 'MMM dd, yyyy HH:mm')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatFileSize(report.fileSize)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Tooltip title="Download">
                            <span>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleDownload(report)}
                                disabled={report.status !== 'completed'}
                              >
                                <FileDownload />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(report.id)}
                            >
                              <Delete />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={reports.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

export default ReportHistory;