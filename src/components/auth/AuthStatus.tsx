import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Alert,
  Grid,
  Divider,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  Refresh,
  ExpandMore,
  ExpandLess,
  Key,
  Timer,
  Person,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../config/api.config';

const AuthStatus: React.FC = () => {
  const { user, refreshToken } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const accessToken = localStorage.getItem('access_token');
  const refreshTokenValue = localStorage.getItem('refresh_token');

  const checkTokenValidity = () => {
    if (!accessToken) return 'No Token';

    try {
      // Decode JWT without verification (for display purposes only)
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();

      if (exp > now) {
        const timeLeft = exp - now;
        const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        return `Valid (${hoursLeft}h ${minutesLeft}m remaining)`;
      } else {
        return 'Expired';
      }
    } catch (error) {
      return 'Invalid Token';
    }
  };

  const testAPICall = async () => {
    try {
      setTestResult({ loading: true });
      const response = await apiClient.get('/auth/profile/');
      setTestResult({
        success: true,
        message: 'Authentication successful!',
        data: response.data,
      });
    } catch (error: any) {
      setTestResult({
        success: false,
        message: `Authentication failed: ${error.response?.status || 'Network Error'}`,
        error: error.response?.data || error.message,
      });
    }
  };

  const handleRefreshToken = async () => {
    try {
      setIsRefreshing(true);
      await refreshToken();
      setTestResult({
        success: true,
        message: 'Token refreshed successfully!',
      });
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Token refresh failed',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const tokenStatus = checkTokenValidity();
  const isTokenValid = tokenStatus.includes('Valid');

  return (
    <Card sx={{ maxWidth: 800, margin: 'auto', mt: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Authentication Status</Typography>
          <IconButton onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>

        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Person color="primary" />
              <Typography variant="body2" color="text.secondary">
                User:
              </Typography>
              <Typography variant="body1" fontWeight="medium">
                {user?.username || 'Not logged in'}
              </Typography>
              {user?.role && (
                <Chip label={user.role} size="small" color="primary" variant="outlined" />
              )}
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Key color={isTokenValid ? 'success' : 'error'} />
              <Typography variant="body2" color="text.secondary">
                Access Token:
              </Typography>
              <Chip
                label={tokenStatus}
                size="small"
                color={isTokenValid ? 'success' : 'error'}
                icon={isTokenValid ? <CheckCircle /> : <Cancel />}
              />
            </Box>
          </Grid>
        </Grid>

        <Collapse in={expanded}>
          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Token Details:
              </Typography>
              <Box sx={{ bgcolor: 'grey.100', p: 1, borderRadius: 1, mb: 2 }}>
                <Typography variant="caption" sx={{ wordBreak: 'break-all', fontFamily: 'monospace' }}>
                  Access Token: {accessToken ? `${accessToken.substring(0, 50)}...` : 'None'}
                </Typography>
              </Box>
              <Box sx={{ bgcolor: 'grey.100', p: 1, borderRadius: 1, mb: 2 }}>
                <Typography variant="caption" sx={{ wordBreak: 'break-all', fontFamily: 'monospace' }}>
                  Refresh Token: {refreshTokenValue ? `${refreshTokenValue.substring(0, 50)}...` : 'None'}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Timer />}
                  onClick={testAPICall}
                  disabled={!accessToken}
                >
                  Test API Call
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Refresh />}
                  onClick={handleRefreshToken}
                  disabled={!refreshTokenValue || isRefreshing}
                >
                  Refresh Token
                </Button>
              </Box>

              {testResult && !testResult.loading && (
                <Alert
                  severity={testResult.success ? 'success' : 'error'}
                  onClose={() => setTestResult(null)}
                  sx={{ mb: 2 }}
                >
                  <Typography variant="body2" fontWeight="medium">
                    {testResult.message}
                  </Typography>
                  {testResult.error && (
                    <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                      {JSON.stringify(testResult.error, null, 2)}
                    </Typography>
                  )}
                  {testResult.data && (
                    <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
                      Response: {JSON.stringify(testResult.data, null, 2).substring(0, 200)}...
                    </Typography>
                  )}
                </Alert>
              )}
            </Grid>

            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">
                Note: Check the browser console for detailed authentication logs. The access token is valid for 24 hours
                and the refresh token is valid for 7 days. The system will automatically refresh the access token when
                it expires using the refresh token.
              </Typography>
            </Grid>
          </Grid>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default AuthStatus;