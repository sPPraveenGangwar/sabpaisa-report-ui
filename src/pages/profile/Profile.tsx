import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Typography,
  Avatar,
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  FormControlLabel,
  Alert,
  IconButton,
  Paper,
  Chip,
  InputAdornment,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Person,
  Email,
  Phone,
  Business,
  LocationOn,
  Edit,
  Save,
  Cancel,
  Security,
  Notifications,
  Language,
  ColorLens,
  Key,
  History,
  DevicesOther,
  CheckCircle,
  Warning,
  VpnKey,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme as useThemeMode } from '../../contexts/ThemeContext';
import apiClient from '../../config/api.config';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Profile: React.FC = () => {
  const theme = useTheme();
  const { user, updateProfile } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const [tabValue, setTabValue] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Form states
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
  });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [preferences, setPreferences] = useState({
    email_notifications: true,
    sms_notifications: false,
    two_factor_auth: false,
    api_access: true,
    webhook_notifications: true,
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
        company: user.company || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        zip_code: user.zip_code || '',
      });
    }
  }, [user]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handlePreferenceChange = (name: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setPreferences({ ...preferences, [name]: event.target.checked });
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      await updateProfile(profileData);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    try {
      setLoading(true);
      await apiClient.post('/auth/change-password/', {
        old_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to change password' });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setLoading(true);
      await apiClient.put('/auth/preferences/', preferences);
      setMessage({ type: 'success', text: 'Preferences updated successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update preferences' });
    } finally {
      setLoading(false);
    }
  };

  const loginHistory = [
    { date: '2024-01-15 10:30 AM', ip: '192.168.1.1', location: 'Mumbai, India', status: 'success' },
    { date: '2024-01-14 03:45 PM', ip: '192.168.1.2', location: 'Delhi, India', status: 'success' },
    { date: '2024-01-13 09:15 AM', ip: '192.168.1.3', location: 'Unknown', status: 'failed' },
    { date: '2024-01-12 02:20 PM', ip: '192.168.1.1', location: 'Mumbai, India', status: 'success' },
  ];

  const activeSessions = [
    { device: 'Chrome on Windows', location: 'Mumbai, India', lastActive: '2 minutes ago', current: true },
    { device: 'Mobile App (Android)', location: 'Mumbai, India', lastActive: '1 hour ago', current: false },
    { device: 'Firefox on MacOS', location: 'Delhi, India', lastActive: '3 days ago', current: false },
  ];

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Profile Settings
      </Typography>

      {message && (
        <Alert severity={message.type} onClose={() => setMessage(null)} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar
              sx={{
                width: 100,
                height: 100,
                bgcolor: theme.palette.primary.main,
                fontSize: '2.5rem',
              }}
            >
              {user?.first_name?.charAt(0) || user?.username?.charAt(0) || 'U'}
            </Avatar>
            <Box sx={{ ml: 3 }}>
              <Typography variant="h5">
                {user?.first_name && user?.last_name
                  ? `${user.first_name} ${user.last_name}`
                  : user?.username}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.email}
              </Typography>
              <Chip
                label={user?.role || 'User'}
                size="small"
                color="primary"
                sx={{ mt: 1 }}
              />
            </Box>
          </Box>

          <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
            <Tab icon={<Person />} label="Personal Info" />
            <Tab icon={<Security />} label="Security" />
            <Tab icon={<Notifications />} label="Preferences" />
            <Tab icon={<History />} label="Activity" />
          </Tabs>

          <Divider />

          {/* Personal Information Tab */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              {!isEditing ? (
                <Button startIcon={<Edit />} onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    startIcon={<Save />}
                    variant="contained"
                    onClick={handleSaveProfile}
                    disabled={loading}
                  >
                    Save
                  </Button>
                  <Button
                    startIcon={<Cancel />}
                    variant="outlined"
                    onClick={() => setIsEditing(false)}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </Box>
              )}
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="first_name"
                  value={profileData.first_name}
                  onChange={handleProfileChange}
                  disabled={!isEditing}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  name="last_name"
                  value={profileData.last_name}
                  onChange={handleProfileChange}
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  disabled={!isEditing}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleProfileChange}
                  disabled={!isEditing}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Company"
                  name="company"
                  value={profileData.company}
                  onChange={handleProfileChange}
                  disabled={!isEditing}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Business />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  value={profileData.address}
                  onChange={handleProfileChange}
                  disabled={!isEditing}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOn />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="City"
                  name="city"
                  value={profileData.city}
                  onChange={handleProfileChange}
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="State"
                  name="state"
                  value={profileData.state}
                  onChange={handleProfileChange}
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="ZIP Code"
                  name="zip_code"
                  value={profileData.zip_code}
                  onChange={handleProfileChange}
                  disabled={!isEditing}
                />
              </Grid>
            </Grid>
          </TabPanel>

          {/* Security Tab */}
          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" gutterBottom>
              Change Password
            </Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Current Password"
                  name="current_password"
                  type={showPassword ? 'text' : 'password'}
                  value={passwordData.current_password}
                  onChange={handlePasswordChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Key />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="New Password"
                  name="new_password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.new_password}
                  onChange={handlePasswordChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <VpnKey />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowNewPassword(!showNewPassword)}>
                          {showNewPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Confirm New Password"
                  name="confirm_password"
                  type="password"
                  value={passwordData.confirm_password}
                  onChange={handlePasswordChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <VpnKey />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  onClick={handleChangePassword}
                  disabled={loading}
                >
                  Change Password
                </Button>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Active Sessions
            </Typography>
            <List>
              {activeSessions.map((session, index) => (
                <ListItem
                  key={index}
                  secondaryAction={
                    !session.current && (
                      <Button size="small" color="error">
                        Revoke
                      </Button>
                    )
                  }
                >
                  <ListItemIcon>
                    <DevicesOther color={session.current ? 'primary' : 'action'} />
                  </ListItemIcon>
                  <ListItemText
                    primary={session.device}
                    secondary={`${session.location} • ${session.lastActive}`}
                  />
                  {session.current && (
                    <Chip label="Current" size="small" color="primary" />
                  )}
                </ListItem>
              ))}
            </List>
          </TabPanel>

          {/* Preferences Tab */}
          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>
              Notifications
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <Email />
                </ListItemIcon>
                <ListItemText
                  primary="Email Notifications"
                  secondary="Receive transaction alerts via email"
                />
                <Switch
                  checked={preferences.email_notifications}
                  onChange={handlePreferenceChange('email_notifications')}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Phone />
                </ListItemIcon>
                <ListItemText
                  primary="SMS Notifications"
                  secondary="Receive transaction alerts via SMS"
                />
                <Switch
                  checked={preferences.sms_notifications}
                  onChange={handlePreferenceChange('sms_notifications')}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Notifications />
                </ListItemIcon>
                <ListItemText
                  primary="Webhook Notifications"
                  secondary="Send transaction events to your webhook URL"
                />
                <Switch
                  checked={preferences.webhook_notifications}
                  onChange={handlePreferenceChange('webhook_notifications')}
                />
              </ListItem>
            </List>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Security
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <Security />
                </ListItemIcon>
                <ListItemText
                  primary="Two-Factor Authentication"
                  secondary="Add an extra layer of security to your account"
                />
                <Switch
                  checked={preferences.two_factor_auth}
                  onChange={handlePreferenceChange('two_factor_auth')}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <VpnKey />
                </ListItemIcon>
                <ListItemText
                  primary="API Access"
                  secondary="Enable API access for third-party integrations"
                />
                <Switch
                  checked={preferences.api_access}
                  onChange={handlePreferenceChange('api_access')}
                />
              </ListItem>
            </List>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              Appearance
            </Typography>
            <List>
              <ListItem>
                <ListItemIcon>
                  <ColorLens />
                </ListItemIcon>
                <ListItemText
                  primary="Dark Mode"
                  secondary="Toggle between light and dark theme"
                />
                <Switch
                  checked={mode === 'dark'}
                  onChange={toggleTheme}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Language />
                </ListItemIcon>
                <ListItemText
                  primary="Language"
                  secondary="English (US)"
                />
              </ListItem>
            </List>

            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                onClick={handleSavePreferences}
                disabled={loading}
              >
                Save Preferences
              </Button>
            </Box>
          </TabPanel>

          {/* Activity Tab */}
          <TabPanel value={tabValue} index={3}>
            <Typography variant="h6" gutterBottom>
              Login History
            </Typography>
            <Paper variant="outlined">
              <List>
                {loginHistory.map((login, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      {login.status === 'success' ? (
                        <CheckCircle color="success" />
                      ) : (
                        <Warning color="error" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={`${login.date} • ${login.ip}`}
                      secondary={login.location}
                    />
                    <Chip
                      label={login.status}
                      size="small"
                      color={login.status === 'success' ? 'success' : 'error'}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </TabPanel>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Profile;