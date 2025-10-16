import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Avatar,
  IconButton,
  Grid,
  Card,
  CardContent,
  Alert,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Person,
  Security,
  Notifications,
  Payment,
  Business,
  Settings as SettingsIcon,
  Save,
  Edit,
  PhotoCamera,
} from '@mui/icons-material';
import apiClient from '../../config/api.config';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const Settings: React.FC = () => {
  const theme = useTheme();
  const [currentTab, setCurrentTab] = useState(0);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Profile settings
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    avatar: '',
  });

  // Security settings
  const [securityData, setSecurityData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactorEnabled: false,
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    transactionAlerts: true,
    settlementAlerts: true,
    chargebackAlerts: true,
    weeklyReports: true,
  });

  // Business settings
  const [businessData, setBusinessData] = useState({
    businessName: '',
    businessType: '',
    gst: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleProfileSave = async () => {
    try {
      await apiClient.put('/user/profile', profileData);
      setSuccess('Profile updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError('Failed to update profile');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleSecuritySave = async () => {
    if (securityData.newPassword !== securityData.confirmPassword) {
      setError('Passwords do not match');
      setTimeout(() => setError(null), 3000);
      return;
    }

    try {
      await apiClient.put('/user/security', {
        currentPassword: securityData.currentPassword,
        newPassword: securityData.newPassword,
        twoFactorEnabled: securityData.twoFactorEnabled,
      });
      setSuccess('Security settings updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError('Failed to update security settings');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleNotificationSave = async () => {
    try {
      await apiClient.put('/user/notifications', notificationSettings);
      setSuccess('Notification preferences updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError('Failed to update notification preferences');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleBusinessSave = async () => {
    try {
      await apiClient.put('/user/business', businessData);
      setSuccess('Business information updated successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError('Failed to update business information');
      setTimeout(() => setError(null), 3000);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={0} sx={{ p: 3, mb: 3, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <SettingsIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Settings
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your account settings and preferences
            </Typography>
          </Box>
        </Box>
      </Paper>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper elevation={2}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab icon={<Person />} label="Profile" iconPosition="start" />
          <Tab icon={<Security />} label="Security" iconPosition="start" />
          <Tab icon={<Notifications />} label="Notifications" iconPosition="start" />
          <Tab icon={<Business />} label="Business" iconPosition="start" />
        </Tabs>

        {/* Profile Tab */}
        <TabPanel value={currentTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar
                    src={profileData.avatar}
                    sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
                  />
                  <IconButton color="primary" component="label">
                    <PhotoCamera />
                    <input type="file" hidden accept="image/*" />
                  </IconButton>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Change profile picture
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={8}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleProfileSave}
                  >
                    Save Changes
                  </Button>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Security Tab */}
        <TabPanel value={currentTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Change Password
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    type="password"
                    value={securityData.currentPassword}
                    onChange={(e) =>
                      setSecurityData({ ...securityData, currentPassword: e.target.value })
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="New Password"
                    type="password"
                    value={securityData.newPassword}
                    onChange={(e) =>
                      setSecurityData({ ...securityData, newPassword: e.target.value })
                    }
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    type="password"
                    value={securityData.confirmPassword}
                    onChange={(e) =>
                      setSecurityData({ ...securityData, confirmPassword: e.target.value })
                    }
                  />
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Two-Factor Authentication
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={securityData.twoFactorEnabled}
                    onChange={(e) =>
                      setSecurityData({ ...securityData, twoFactorEnabled: e.target.checked })
                    }
                  />
                }
                label="Enable two-factor authentication"
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Add an extra layer of security to your account
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleSecuritySave}
              >
                Update Security Settings
              </Button>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Notifications Tab */}
        <TabPanel value={currentTab} index={2}>
          <Typography variant="h6" gutterBottom>
            Notification Preferences
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.emailNotifications}
                    onChange={(e) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        emailNotifications: e.target.checked,
                      })
                    }
                  />
                }
                label="Email Notifications"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.smsNotifications}
                    onChange={(e) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        smsNotifications: e.target.checked,
                      })
                    }
                  />
                }
                label="SMS Notifications"
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" gutterBottom>
                Alert Types
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.transactionAlerts}
                    onChange={(e) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        transactionAlerts: e.target.checked,
                      })
                    }
                  />
                }
                label="Transaction Alerts"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.settlementAlerts}
                    onChange={(e) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        settlementAlerts: e.target.checked,
                      })
                    }
                  />
                }
                label="Settlement Alerts"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.chargebackAlerts}
                    onChange={(e) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        chargebackAlerts: e.target.checked,
                      })
                    }
                  />
                }
                label="Chargeback Alerts"
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notificationSettings.weeklyReports}
                    onChange={(e) =>
                      setNotificationSettings({
                        ...notificationSettings,
                        weeklyReports: e.target.checked,
                      })
                    }
                  />
                }
                label="Weekly Reports"
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleNotificationSave}
              >
                Save Preferences
              </Button>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Business Tab */}
        <TabPanel value={currentTab} index={3}>
          <Typography variant="h6" gutterBottom>
            Business Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Business Name"
                value={businessData.businessName}
                onChange={(e) =>
                  setBusinessData({ ...businessData, businessName: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Business Type"
                value={businessData.businessType}
                onChange={(e) =>
                  setBusinessData({ ...businessData, businessType: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="GST Number"
                value={businessData.gst}
                onChange={(e) => setBusinessData({ ...businessData, gst: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                multiline
                rows={2}
                value={businessData.address}
                onChange={(e) => setBusinessData({ ...businessData, address: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="City"
                value={businessData.city}
                onChange={(e) => setBusinessData({ ...businessData, city: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="State"
                value={businessData.state}
                onChange={(e) => setBusinessData({ ...businessData, state: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Pincode"
                value={businessData.pincode}
                onChange={(e) => setBusinessData({ ...businessData, pincode: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                startIcon={<Save />}
                onClick={handleBusinessSave}
              >
                Save Business Information
              </Button>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default Settings;