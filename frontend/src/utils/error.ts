import axios from 'axios';
import type { ApiError } from '@/types/auth';

export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data as ApiError | undefined;
    if (apiError?.error?.message) {
      return apiError.error.message;
    }
    // Fallback for FastAPI's default detail field
    if (error.response?.data?.detail) {
      return error.response.data.detail;
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'An unexpected error occurred';
};
