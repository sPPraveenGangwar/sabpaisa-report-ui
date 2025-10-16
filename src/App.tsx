import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, CircularProgress, Box } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { CustomThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

// Lazy load pages for better performance
const Login = lazy(() => import('./components/auth/Login'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const MerchantDashboard = lazy(() => import('./pages/merchant/MerchantDashboard'));
const TransactionList = lazy(() => import('./pages/transactions/TransactionList'));
const SettlementList = lazy(() => import('./pages/settlements/SettlementList'));
const RefundList = lazy(() => import('./pages/settlements/RefundList'));
const ChargebackList = lazy(() => import('./pages/settlements/ChargebackList'));
const Analytics = lazy(() => import('./pages/analytics/Analytics'));
const PaymentModeAnalytics = lazy(() => import('./pages/analytics/PaymentModeAnalytics'));
const SettlementAnalytics = lazy(() => import('./pages/analytics/SettlementAnalytics'));
const ReportGeneration = lazy(() => import('./pages/reports/ReportGeneration'));
const ReportHistory = lazy(() => import('./pages/reports/ReportHistory'));
const MerchantList = lazy(() => import('./pages/admin/MerchantList'));
const Settings = lazy(() => import('./pages/settings/Settings'));
const Profile = lazy(() => import('./pages/profile/Profile'));

// QwikForms pages (Admin only)
const QwikFormsTransactions = lazy(() => import('./pages/qwikforms/QwikFormsTransactions'));
const QwikFormsSettlements = lazy(() => import('./pages/qwikforms/QwikFormsSettlements'));
const QwikFormsAnalytics = lazy(() => import('./pages/qwikforms/QwikFormsAnalytics'));
const QwikFormsReports = lazy(() => import('./pages/qwikforms/QwikFormsReports'));

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Loading component
const Loading = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
    }}
  >
    <CircularProgress />
  </Box>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CustomThemeProvider>
        <CssBaseline />
        <NotificationProvider>
          <Router>
            <AuthProvider>
              <Suspense fallback={<Loading />}>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<Login />} />

                {/* Protected routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  {/* Redirect root to appropriate dashboard */}
                  <Route index element={<Navigate to="/dashboard" replace />} />

                  {/* Dashboard routes */}
                  <Route path="dashboard" element={<Navigate to="/admin/dashboard" replace />} />
                  <Route path="admin/dashboard" element={<AdminDashboard />} />
                  <Route path="merchant/dashboard" element={<MerchantDashboard />} />

                  {/* Transaction routes */}
                  <Route path="transactions">
                    <Route index element={<Navigate to="all" replace />} />
                    <Route path="all" element={<TransactionList />} />
                    <Route path="search" element={<TransactionList />} />
                    <Route path="success-graph" element={<Analytics />} />
                  </Route>

                  {/* Settlement routes */}
                  <Route path="settlements">
                    <Route index element={<Navigate to="settled" replace />} />
                    <Route path="settled" element={<SettlementList />} />
                    <Route path="refunds" element={<RefundList />} />
                    <Route path="chargebacks" element={<ChargebackList />} />
                  </Route>

                  {/* Analytics routes */}
                  <Route path="analytics">
                    <Route index element={<Navigate to="overview" replace />} />
                    <Route path="overview" element={<Analytics />} />
                    <Route path="payment-modes" element={<PaymentModeAnalytics />} />
                    <Route path="settlements" element={<SettlementAnalytics />} />
                  </Route>

                  {/* Report routes */}
                  <Route path="reports">
                    <Route index element={<Navigate to="generate" replace />} />
                    <Route path="generate" element={<ReportGeneration />} />
                    <Route path="history" element={<ReportHistory />} />
                  </Route>

                  {/* QwikForms routes (Admin only) */}
                  <Route path="qwikforms">
                    <Route index element={<Navigate to="transactions" replace />} />
                    <Route path="transactions" element={<QwikFormsTransactions />} />
                    <Route path="settlements" element={<QwikFormsSettlements />} />
                    <Route path="analytics" element={<QwikFormsAnalytics />} />
                    <Route path="reports" element={<QwikFormsReports />} />
                  </Route>

                  {/* Admin-only routes */}
                  <Route path="merchants" element={<MerchantList />} />
                  <Route path="security" element={<Settings />} />

                  {/* Common routes */}
                  <Route path="settings" element={<Settings />} />
                  <Route path="profile" element={<Profile />} />
                </Route>

                {/* Catch all - redirect to login */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </Router>
        </NotificationProvider>
      </CustomThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
