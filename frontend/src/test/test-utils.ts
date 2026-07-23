import { vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { server } from '@/test/server';

export { renderWithProviders } from './render';

// Wait for promises to resolve
export const waitForPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

// Mock a successful API response
export const mockApiSuccess = (response: unknown) => {
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve(response),
  });
};

// Mock an API error
export const mockApiError = (status: number, message: string) => {
  return Promise.reject({
    response: {
      status,
      data: { message },
    },
  });
};

// Reset all mocks between tests
export const resetAllMocks = () => {
  vi.clearAllMocks();
  vi.resetAllMocks();
  server.resetHandlers();
};

// Create a test query client with custom options
export const createTestQueryClient = (options = {}) => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
        ...options,
      },
      mutations: {
        retry: false,
        ...options,
      },
    },
  });
};

// Utility to test loading states
export const testLoadingState = (component: () => void) => {};

// Utility to test error states
export const testErrorState = (component: () => void) => {};
