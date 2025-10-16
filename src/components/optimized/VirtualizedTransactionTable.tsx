/**
 * Virtualized Transaction Table for handling 100K+ records efficiently
 * Uses react-window for virtual scrolling and windowing
 * Minimal memory footprint - only renders visible rows
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import InfiniteLoader from 'react-window-infinite-loader';
import {
  CheckCircle,
  Cancel,
  Schedule,
  Visibility,
  GetApp,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';

interface Transaction {
  txn_id: string;
  client_txn_id?: string;
  trans_date: string;
  status: string;
  client_code: string;
  client_name?: string;
  payment_mode: string;
  paid_amount: number;
  payee_email?: string;
  payee_mob?: string;
  pg_name?: string;
  bank_txn_id?: string;
  is_settled?: boolean;
}

interface VirtualizedTransactionTableProps {
  transactions: Transaction[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onRowClick?: (transaction: Transaction) => void;
  height?: number;
}

const VirtualizedTransactionTable: React.FC<VirtualizedTransactionTableProps> = ({
  transactions,
  loading = false,
  hasMore = false,
  onLoadMore,
  onRowClick,
  height = 600,
}) => {
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  // Calculate total item count (add 1 for loading indicator if has more)
  const itemCount = hasMore ? transactions.length + 1 : transactions.length;

  // Check if a particular item is loaded
  const isItemLoaded = useCallback(
    (index: number) => !hasMore || index < transactions.length,
    [hasMore, transactions.length]
  );

  // Load more items when scrolling
  const loadMoreItems = useCallback(
    (startIndex: number, stopIndex: number) => {
      if (onLoadMore && !loading) {
        return onLoadMore();
      }
      return Promise.resolve();
    },
    [onLoadMore, loading]
  );

  // Format amount with commas
  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  // Get status icon and color
  const getStatusDisplay = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'SUCCESS':
        return {
          icon: <CheckCircle fontSize="small" />,
          color: 'success' as const,
          label: 'Success',
        };
      case 'FAILED':
        return {
          icon: <Cancel fontSize="small" />,
          color: 'error' as const,
          label: 'Failed',
        };
      case 'PENDING':
        return {
          icon: <Schedule fontSize="small" />,
          color: 'warning' as const,
          label: 'Pending',
        };
      default:
        return {
          icon: <Schedule fontSize="small" />,
          color: 'default' as const,
          label: status || 'Unknown',
        };
    }
  };

  // Row renderer
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    // Show loading indicator for unloaded rows
    if (!isItemLoaded(index)) {
      return (
        <div style={style}>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
            sx={{ backgroundColor: '#f5f5f5' }}
          >
            <CircularProgress size={24} />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Loading more transactions...
            </Typography>
          </Box>
        </div>
      );
    }

    const transaction = transactions[index];
    if (!transaction) return null;

    const statusDisplay = getStatusDisplay(transaction.status);
    const isSelected = selectedRowId === transaction.txn_id;

    return (
      <div
        style={{
          ...style,
          borderBottom: '1px solid #e0e0e0',
          cursor: 'pointer',
          backgroundColor: isSelected ? '#e3f2fd' : index % 2 === 0 ? '#fafafa' : '#fff',
        }}
        onClick={() => {
          setSelectedRowId(transaction.txn_id);
          onRowClick?.(transaction);
        }}
      >
        <Box
          display="grid"
          gridTemplateColumns="140px 150px 120px 100px 150px 120px 150px 100px 80px"
          gap={1}
          alignItems="center"
          px={2}
          height="100%"
          sx={{
            '&:hover': {
              backgroundColor: '#f0f0f0',
            },
          }}
        >
          {/* Transaction Date */}
          <Typography variant="body2" noWrap>
            {format(parseISO(transaction.trans_date), 'dd MMM yyyy HH:mm')}
          </Typography>

          {/* Transaction ID */}
          <Tooltip title={transaction.txn_id}>
            <Typography variant="body2" noWrap fontWeight="medium">
              {transaction.txn_id?.substring(0, 18)}...
            </Typography>
          </Tooltip>

          {/* Client Transaction ID */}
          <Typography variant="body2" noWrap>
            {transaction.client_txn_id || '-'}
          </Typography>

          {/* Status */}
          <Chip
            icon={statusDisplay.icon}
            label={statusDisplay.label}
            color={statusDisplay.color}
            size="small"
            sx={{ height: 24 }}
          />

          {/* Payment Mode */}
          <Typography variant="body2" noWrap>
            {transaction.payment_mode || '-'}
          </Typography>

          {/* Amount */}
          <Typography variant="body2" noWrap fontWeight="bold" color="primary">
            {formatAmount(transaction.paid_amount)}
          </Typography>

          {/* Customer Info */}
          <Tooltip title={transaction.payee_email || transaction.payee_mob || ''}>
            <Typography variant="body2" noWrap>
              {transaction.payee_email?.substring(0, 20) ||
                transaction.payee_mob ||
                '-'}
            </Typography>
          </Tooltip>

          {/* PG Name */}
          <Typography variant="body2" noWrap>
            {transaction.pg_name || '-'}
          </Typography>

          {/* Settlement Status */}
          <Chip
            label={transaction.is_settled ? 'Settled' : 'Pending'}
            size="small"
            color={transaction.is_settled ? 'success' : 'default'}
            variant="outlined"
            sx={{ height: 24 }}
          />
        </Box>
      </div>
    );
  };

  // Header component
  const TableHeader = () => (
    <Box
      display="grid"
      gridTemplateColumns="140px 150px 120px 100px 150px 120px 150px 100px 80px"
      gap={1}
      px={2}
      py={1.5}
      sx={{
        backgroundColor: '#1976d2',
        color: 'white',
        fontWeight: 'bold',
        borderBottom: '2px solid #1565c0',
        position: 'sticky',
        top: 0,
        zIndex: 1,
      }}
    >
      <Typography variant="subtitle2" fontWeight="bold">
        Date & Time
      </Typography>
      <Typography variant="subtitle2" fontWeight="bold">
        Transaction ID
      </Typography>
      <Typography variant="subtitle2" fontWeight="bold">
        Client Txn ID
      </Typography>
      <Typography variant="subtitle2" fontWeight="bold">
        Status
      </Typography>
      <Typography variant="subtitle2" fontWeight="bold">
        Payment Mode
      </Typography>
      <Typography variant="subtitle2" fontWeight="bold">
        Amount
      </Typography>
      <Typography variant="subtitle2" fontWeight="bold">
        Customer
      </Typography>
      <Typography variant="subtitle2" fontWeight="bold">
        Gateway
      </Typography>
      <Typography variant="subtitle2" fontWeight="bold">
        Settlement
      </Typography>
    </Box>
  );

  if (transactions.length === 0 && !loading) {
    return (
      <Paper>
        <TableHeader />
        <Box p={4} textAlign="center">
          <Alert severity="info">No transactions found</Alert>
        </Box>
      </Paper>
    );
  }

  return (
    <Paper elevation={2}>
      <TableHeader />
      <Box height={height}>
        <InfiniteLoader
          isItemLoaded={isItemLoaded}
          itemCount={itemCount}
          loadMoreItems={loadMoreItems}
          threshold={15} // Start loading 15 items before reaching the end
          minimumBatchSize={50} // Load at least 50 items at a time
        >
          {({ onItemsRendered, ref }) => (
            <AutoSizer>
              {({ height: autoHeight, width }) => (
                <List
                  height={autoHeight || height}
                  itemCount={itemCount}
                  itemSize={60} // Height of each row
                  width={width || 1200}
                  onItemsRendered={onItemsRendered}
                  ref={ref}
                  overscanCount={10} // Render 10 extra items above/below viewport
                >
                  {Row}
                </List>
              )}
            </AutoSizer>
          )}
        </InfiniteLoader>
      </Box>

      {/* Loading overlay */}
      {loading && (
        <Box
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          p={2}
          display="flex"
          justifyContent="center"
          sx={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
        >
          <CircularProgress size={24} />
          <Typography variant="body2" sx={{ ml: 2 }}>
            Loading transactions...
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default VirtualizedTransactionTable;
