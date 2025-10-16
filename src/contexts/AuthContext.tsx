import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../config/api.config';
import { User, LoginCredentials, AuthContextType, AuthResponse } from '../types/auth.types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          // Verify token is still valid
          const response = await apiClient.get('/auth/profile/');
          if (response.data.success) {
            setUser(response.data.data);
            localStorage.setItem('user', JSON.stringify(response.data.data));
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          localStorage.clear();
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      const response = await apiClient.post<AuthResponse>('/auth/login/', credentials);

      if (response.data.success && response.data.data) {
        const { access, refresh, user } = response.data.data;

        // Store tokens and user data
        localStorage.setItem('access_token', access);
        localStorage.setItem('refresh_token', refresh);
        localStorage.setItem('user', JSON.stringify(user));

        setUser(user);

        // Navigate based on role
        if (user.role === 'ADMIN') {
          navigate('/admin/dashboard');
        } else {
          navigate('/merchant/dashboard');
        }
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      throw new Error(error.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await apiClient.post('/auth/logout/', { refresh: refreshToken });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage and state
      localStorage.clear();
      setUser(null);
      navigate('/login');
    }
  }, [navigate]);

  const refreshToken = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) throw new Error('No refresh token');

      const response = await apiClient.post('/auth/refresh/', {
        refresh: refreshToken
      });

      if (response.data.success && response.data.data) {
        const { access } = response.data.data;
        localStorage.setItem('access_token', access);
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      await logout();
    }
  }, [logout]);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    try {
      const response = await apiClient.put('/auth/profile/', data);
      if (response.data.success) {
        const updatedUser = { ...user, ...response.data.data };
        setUser(updatedUser as User);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  }, [user]);

  const contextValue: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshToken,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};