import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
  LinearProgress,
  Divider,
  FormControlLabel,
  Checkbox,
  Link,
  Grid,
  useTheme,
  alpha,
  Paper,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  AccountCircle,
  Lock,
  Login as LoginIcon,
  BusinessCenter,
  AdminPanelSettings,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { LoginCredentials } from '../../types/auth.types';
import logo from '../../assets/logo.png';

const Login: React.FC = () => {
  const theme = useTheme();
  const { login, isLoading } = useAuth();
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginType, setLoginType] = useState<'username' | 'login_master_id'>('username');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const loginData = {
        password: credentials.password,
        ...(loginType === 'username'
          ? { username: credentials.username }
          : { login_master_id: credentials.username }
        ),
      };
      await login(loginData);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  const toggleLoginType = () => {
    setLoginType(prev => prev === 'username' ? 'login_master_id' : 'username');
    setCredentials({ username: '', password: '' });
    setError(null);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decoration */}
      <Box
        sx={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: alpha(theme.palette.primary.main, 0.1),
          filter: 'blur(60px)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -150,
          left: -150,
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: alpha(theme.palette.secondary.main, 0.1),
          filter: 'blur(60px)',
        }}
      />

      <Card
        sx={{
          maxWidth: 480,
          width: '100%',
          m: 2,
          borderRadius: 4,
          boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
          position: 'relative',
          overflow: 'visible',
        }}
      >
        {isLoading && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0 }} />}

        <CardContent sx={{ p: 6 }}>
          {/* Logo and Title */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                margin: '0 auto',
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              }}
            >
              <Typography variant="h3" sx={{ color: 'white', fontWeight: 'bold' }}>
                SP
              </Typography>
            </Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Welcome Back
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to SabPaisa Reports Portal
            </Typography>
          </Box>

          {/* Login Type Selector */}
          <Paper
            elevation={0}
            sx={{
              display: 'flex',
              mb: 3,
              p: 0.5,
              backgroundColor: theme.palette.grey[100],
              borderRadius: 2,
            }}
          >
            <Button
              fullWidth
              variant={loginType === 'username' ? 'contained' : 'text'}
              onClick={() => setLoginType('username')}
              sx={{
                borderRadius: 1.5,
                boxShadow: loginType === 'username' ? 2 : 0,
              }}
            >
              Username
            </Button>
            <Button
              fullWidth
              variant={loginType === 'login_master_id' ? 'contained' : 'text'}
              onClick={() => setLoginType('login_master_id')}
              sx={{
                borderRadius: 1.5,
                boxShadow: loginType === 'login_master_id' ? 2 : 0,
              }}
            >
              Login Master ID
            </Button>
          </Paper>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label={loginType === 'username' ? 'Username or Email' : 'Login Master ID'}
              name="username"
              value={credentials.username}
              onChange={handleChange}
              margin="normal"
              required
              disabled={isLoading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AccountCircle color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={credentials.password}
              onChange={handleChange}
              margin="normal"
              required
              disabled={isLoading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      disabled={isLoading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading}
                  />
                }
                label="Remember me"
              />
              <Link href="#" variant="body2" sx={{ textDecoration: 'none' }}>
                Forgot password?
              </Link>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isLoading}
              startIcon={<LoginIcon />}
              sx={{
                py: 1.5,
                mb: 2,
                borderRadius: 2,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                '&:hover': {
                  background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                },
              }}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>

            <Divider sx={{ my: 3 }}>OR</Divider>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<BusinessCenter />}
                  sx={{ py: 1, borderRadius: 2 }}
                  disabled={isLoading}
                >
                  Merchant Demo
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AdminPanelSettings />}
                  sx={{ py: 1, borderRadius: 2 }}
                  disabled={isLoading}
                >
                  Admin Demo
                </Button>
              </Grid>
            </Grid>
          </form>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              By signing in, you agree to our{' '}
              <Link href="#" sx={{ textDecoration: 'none' }}>
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="#" sx={{ textDecoration: 'none' }}>
                Privacy Policy
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;