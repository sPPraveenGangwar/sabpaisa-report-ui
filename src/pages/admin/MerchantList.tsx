import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  IconButton,
  Button,
  Chip,
  Avatar,
  Tooltip,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Search,
  FilterList,
  Edit,
  Delete,
  Add,
  Refresh,
  MoreVert,
  Visibility,
  Block,
  CheckCircle,
  Business,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import apiClient from '../../config/api.config';

interface Merchant {
  id: string;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  totalTransactions?: number;
  totalVolume?: number;
}

const MerchantList: React.FC = () => {
  const theme = useTheme();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);

  useEffect(() => {
    fetchMerchants();
  }, []);

  const fetchMerchants = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/merchants');
      setMerchants(response.data.merchants || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch merchants');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleStatusChange = async (merchantId: string, newStatus: string) => {
    try {
      await apiClient.patch(`/merchants/${merchantId}/status`, { status: newStatus });
      setMerchants(merchants.map(m =>
        m.id === merchantId ? { ...m, status: newStatus as Merchant['status'] } : m
      ));
    } catch (err: any) {
      setError('Failed to update merchant status');
    }
  };

  const handleDelete = async (merchantId: string) => {
    if (!window.confirm('Are you sure you want to delete this merchant?')) return;

    try {
      await apiClient.delete(`/merchants/${merchantId}`);
      setMerchants(merchants.filter(m => m.id !== merchantId));
    } catch (err: any) {
      setError('Failed to delete merchant');
    }
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'warning';
      case 'suspended':
        return 'error';
      default:
        return 'default';
    }
  };

  const filteredMerchants = merchants.filter(merchant => {
    const matchesSearch =
      merchant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      merchant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      merchant.businessName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterStatus === 'all' || merchant.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Merchant Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage and monitor merchant accounts
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchMerchants}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpenDialog(true)}
            >
              Add Merchant
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <TextField
            size="small"
            placeholder="Search merchants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filterStatus}
              label="Status"
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="suspended">Suspended</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper elevation={2}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                <TableCell>Merchant</TableCell>
                <TableCell>Business Name</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Transactions</TableCell>
                <TableCell>Volume</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredMerchants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                      No merchants found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMerchants
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((merchant) => (
                    <TableRow key={merchant.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                            <Business />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {merchant.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {merchant.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{merchant.businessName}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{merchant.phone}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={merchant.status}
                          size="small"
                          color={getStatusColor(merchant.status)}
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {merchant.totalTransactions?.toLocaleString() || 0}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          ₹{(merchant.totalVolume || 0).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {format(parseISO(merchant.createdAt), 'MMM dd, yyyy')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => {
                                setSelectedMerchant(merchant);
                                setOpenDialog(true);
                              }}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit">
                            <IconButton size="small" color="primary">
                              <Edit />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={merchant.status === 'active' ? 'Suspend' : 'Activate'}>
                            <IconButton
                              size="small"
                              color={merchant.status === 'active' ? 'error' : 'success'}
                              onClick={() =>
                                handleStatusChange(
                                  merchant.id,
                                  merchant.status === 'active' ? 'suspended' : 'active'
                                )
                              }
                            >
                              {merchant.status === 'active' ? <Block /> : <CheckCircle />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(merchant.id)}
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
          count={filteredMerchants.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Merchant Details/Add Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedMerchant ? 'Merchant Details' : 'Add New Merchant'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Merchant management features coming soon...
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MerchantList;