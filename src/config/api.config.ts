import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, CancelTokenSource } from 'axios';

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api/v1',
  TIMEOUT: 180000, // 3 minutes timeout for large datasets with page_size=10000
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

// Request cancellation tracking
const pendingRequests = new Map<string, CancelTokenSource>();

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for authentication and request cancellation
apiClient.interceptors.request.use(
  (config: AxiosRequestConfig): any => {
    const token = localStorage.getItem('access_token');

    // Debug logging
    console.log('API Request:', {
      url: config.url,
      method: config.method,
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'No token',
    });

    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('Authorization header set:', config.headers['Authorization'].substring(0, 30) + '...');
    } else {
      console.warn('No access token found for request:', config.url);
    }

    // Add request cancellation support for GET requests (search, list operations)
    if (config.method === 'get' && config.url) {
      const requestKey = `${config.method}:${config.url}`;

      // Cancel previous pending request for the same endpoint
      if (pendingRequests.has(requestKey)) {
        const source = pendingRequests.get(requestKey);
        source?.cancel('Request cancelled due to new request');
        pendingRequests.delete(requestKey);
      }

      // Create new cancel token
      const cancelSource = axios.CancelToken.source();
      config.cancelToken = cancelSource.token;
      pendingRequests.set(requestKey, cancelSource);
    }

    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('API Response Success:', {
      url: response.config.url,
      status: response.status,
    });

    // Remove from pending requests on success
    if (response.config.method === 'get' && response.config.url) {
      const requestKey = `${response.config.method}:${response.config.url}`;
      pendingRequests.delete(requestKey);
    }

    return response;
  },
  async (error) => {
    // Handle request cancellation
    if (axios.isCancel(error)) {
      console.log('Request cancelled:', error.message);
      return Promise.reject(error);
    }

    const originalRequest = error.config;

    // Remove from pending requests on error
    if (originalRequest?.method === 'get' && originalRequest?.url) {
      const requestKey = `${originalRequest.method}:${originalRequest.url}`;
      pendingRequests.delete(requestKey);
    }

    console.error('API Response Error:', {
      url: originalRequest?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
    });

    // Handle 401 errors - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('401 Unauthorized - Attempting to refresh token...');
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          console.log('Refresh token found, attempting refresh...');

          const response = await axios.post(
            `${API_CONFIG.BASE_URL}/auth/refresh/`,
            { refresh: refreshToken },
            { headers: { 'Content-Type': 'application/json' } }
          );

          if (response.data && response.data.data && response.data.data.access) {
            const { access } = response.data.data;
            console.log('Token refreshed successfully');
            localStorage.setItem('access_token', access);

            // Retry original request with new token
            originalRequest.headers['Authorization'] = `Bearer ${access}`;
            return apiClient(originalRequest);
          } else if (response.data && response.data.access) {
            // Handle direct access token response
            const access = response.data.access;
            console.log('Token refreshed successfully (direct response)');
            localStorage.setItem('access_token', access);

            // Retry original request with new token
            originalRequest.headers['Authorization'] = `Bearer ${access}`;
            return apiClient(originalRequest);
          }
        } else {
          console.warn('No refresh token available');
        }
      } catch (refreshError: any) {
        console.error('Token refresh failed:', refreshError);
        // Refresh failed, redirect to login
        localStorage.clear();
        window.location.href = '/login';
      }
    }

    // Handle 403 errors - Permission denied
    if (error.response?.status === 403) {
      console.warn('403 Forbidden - Permission denied for:', originalRequest?.url);
      // Don't redirect to login for 403, just log the error
    }

    // Handle other errors
    if (error.response?.status === 429) {
      // Rate limiting
      const retryAfter = error.response.headers['retry-after'] || 60;
      error.message = `Too many requests. Please try again after ${retryAfter} seconds.`;
      console.warn('Rate limited:', error.message);
    }

    return Promise.reject(error);
  }
);

export default apiClient;