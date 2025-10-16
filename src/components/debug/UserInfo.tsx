import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

const UserInfo: React.FC = () => {
  const { user } = useAuth();

  return (
    <Paper sx={{ p: 2, m: 2 }}>
      <Typography variant="h6">Debug: User Information</Typography>
      <Box sx={{ mt: 1 }}>
        <Typography><strong>Username:</strong> {user?.username || 'Not logged in'}</Typography>
        <Typography><strong>Role:</strong> {user?.role || 'No role'}</Typography>
        <Typography><strong>Merchant Name:</strong> {user?.merchant_name || 'N/A'}</Typography>
        <Typography><strong>Is Admin:</strong> {user?.role === 'ADMIN' ? 'YES' : 'NO'}</Typography>
        <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
          Full user object: {JSON.stringify(user, null, 2)}
        </Typography>
      </Box>
    </Paper>
  );
};

export default UserInfo;