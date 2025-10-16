import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Alert, AlertColor, Slide, SlideProps } from '@mui/material';

interface Notification {
  id: string;
  message: string;
  severity: AlertColor;
  duration?: number;
}

interface NotificationContextType {
  showNotification: (message: string, severity?: AlertColor, duration?: number) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
  hideNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="up" />;
}

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((
    message: string,
    severity: AlertColor = 'info',
    duration: number = 5000
  ) => {
    const id = `notification-${Date.now()}-${Math.random()}`;
    const notification: Notification = {
      id,
      message,
      severity,
      duration,
    };

    setNotifications((prev) => [...prev, notification]);

    // Auto-hide after duration
    if (duration > 0) {
      setTimeout(() => {
        hideNotification(id);
      }, duration);
    }
  }, []);

  const hideNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const showSuccess = useCallback((message: string) => {
    showNotification(message, 'success');
  }, [showNotification]);

  const showError = useCallback((message: string) => {
    showNotification(message, 'error', 7000); // Errors stay longer
  }, [showNotification]);

  const showWarning = useCallback((message: string) => {
    showNotification(message, 'warning');
  }, [showNotification]);

  const showInfo = useCallback((message: string) => {
    showNotification(message, 'info');
  }, [showNotification]);

  const contextValue = {
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideNotification,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      {notifications.map((notification, index) => (
        <Snackbar
          key={notification.id}
          open={true}
          autoHideDuration={notification.duration}
          onClose={() => hideNotification(notification.id)}
          TransitionComponent={SlideTransition}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          sx={{ bottom: `${(index * 70) + 24}px !important` }}
        >
          <Alert
            onClose={() => hideNotification(notification.id)}
            severity={notification.severity}
            variant="filled"
            sx={{ width: '100%', minWidth: '300px' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </NotificationContext.Provider>
  );
};