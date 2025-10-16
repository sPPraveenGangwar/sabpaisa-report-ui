import { useState, useCallback } from 'react';
import { AxiosError } from 'axios';
import { ErrorResponse } from '../types/api.types';

interface UseApiCallReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

export function useApiCall<T>(
  apiFunction: (...args: any[]) => Promise<T>,
  onSuccess?: (data: T) => void,
  onError?: (error: string) => void
): UseApiCallReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiFunction(...args);
        setData(result);
        if (onSuccess) {
          onSuccess(result);
        }
        return result;
      } catch (err) {
        const errorMessage = handleApiError(err);
        setError(errorMessage);
        if (onError) {
          onError(errorMessage);
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}

export function handleApiError(error: any): string {
  if (error instanceof AxiosError) {
    const responseData = error.response?.data as ErrorResponse;

    // Handle specific error cases
    if (error.response?.status === 401) {
      return 'Authentication required. Please login again.';
    }

    if (error.response?.status === 403) {
      return 'You do not have permission to perform this action.';
    }

    if (error.response?.status === 404) {
      return 'The requested resource was not found.';
    }

    if (error.response?.status === 429) {
      return 'Too many requests. Please try again later.';
    }

    if (error.response?.status === 500) {
      return 'Server error. Please try again later.';
    }

    // Use error message from response if available
    if (responseData?.message) {
      return responseData.message;
    }

    // Use error details if available
    if (responseData?.details) {
      return responseData.details;
    }

    // Format validation errors
    if (responseData?.errors) {
      const errors = Object.entries(responseData.errors)
        .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
        .join('; ');
      return `Validation errors: ${errors}`;
    }
  }

  // Network error
  if (error?.code === 'ECONNABORTED') {
    return 'Request timeout. Please check your connection.';
  }

  if (error?.code === 'ERR_NETWORK') {
    return 'Network error. Please check your internet connection.';
  }

  // Default error message
  return error?.message || 'An unexpected error occurred. Please try again.';
}