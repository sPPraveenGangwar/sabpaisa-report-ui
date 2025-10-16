/**
 * Skeleton Loader Components
 * Used to show loading states while API data is being fetched
 */
import React from 'react';
import { Box, Card, CardContent, Skeleton, Grid } from '@mui/material';

/**
 * Skeleton loader for metric cards (dashboard cards)
 */
export const MetricCardSkeleton: React.FC = () => {
  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Skeleton variant="text" width="60%" height={24} />
            <Skeleton variant="text" width="80%" height={40} sx={{ mt: 1 }} />
            <Skeleton variant="text" width="40%" height={20} sx={{ mt: 0.5 }} />
          </Box>
          <Skeleton variant="circular" width={48} height={48} />
        </Box>
      </CardContent>
    </Card>
  );
};

/**
 * Skeleton loader for charts
 */
export const ChartSkeleton: React.FC<{ height?: number }> = ({ height = 300 }) => {
  return (
    <Card>
      <CardContent>
        <Skeleton variant="text" width="40%" height={28} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" width="100%" height={height} />
      </CardContent>
    </Card>
  );
};

/**
 * Skeleton loader for table rows
 */
export const TableRowSkeleton: React.FC<{ columns?: number }> = ({ columns = 5 }) => {
  return (
    <Box display="flex" gap={2} py={1.5} borderBottom="1px solid #f0f0f0">
      {Array.from({ length: columns }).map((_, index) => (
        <Skeleton key={index} variant="text" width={`${100 / columns}%`} height={24} />
      ))}
    </Box>
  );
};

/**
 * Skeleton loader for list items
 */
export const ListItemSkeleton: React.FC = () => {
  return (
    <Box display="flex" alignItems="center" gap={2} py={1.5}>
      <Skeleton variant="circular" width={40} height={40} />
      <Box flex={1}>
        <Skeleton variant="text" width="60%" height={20} />
        <Skeleton variant="text" width="40%" height={16} />
      </Box>
      <Skeleton variant="text" width={80} height={24} />
    </Box>
  );
};

/**
 * Full dashboard skeleton - shows while entire dashboard is loading
 */
export const DashboardSkeleton: React.FC = () => {
  return (
    <Box>
      {/* Metric Cards Skeleton */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[1, 2, 3, 4].map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item}>
            <MetricCardSkeleton />
          </Grid>
        ))}
      </Grid>

      {/* Charts Skeleton */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <ChartSkeleton height={350} />
        </Grid>
        <Grid item xs={12} md={4}>
          <ChartSkeleton height={350} />
        </Grid>
        <Grid item xs={12} md={6}>
          <ChartSkeleton height={300} />
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Skeleton variant="text" width="40%" height={28} sx={{ mb: 2 }} />
              {[1, 2, 3, 4, 5].map((item) => (
                <ListItemSkeleton key={item} />
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

/**
 * Loading overlay - shows on top of existing content during refresh
 */
export const LoadingOverlay: React.FC<{ message?: string }> = ({
  message = 'Loading data...'
}) => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Box className="spinner" sx={{ mb: 2 }}>
          <Box
            sx={{
              width: 60,
              height: 60,
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #1976d2',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              },
            }}
          />
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Skeleton variant="text" width={200} height={24} sx={{ mb: 1 }} />
          <Skeleton variant="text" width={300} height={20} />
        </Box>
      </Box>
    </Box>
  );
};

export default {
  MetricCardSkeleton,
  ChartSkeleton,
  TableRowSkeleton,
  ListItemSkeleton,
  DashboardSkeleton,
  LoadingOverlay,
};
