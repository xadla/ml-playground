import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Health from '@/pages/Health';
import api from '@/api/client';

// Mock the API client
vi.mock('@/api/client', () => ({
  default: {
    get: vi.fn(),
  },
}));

// Type for the API response
interface HealthData {
  status: string;
  version?: string;
  uptime?: number;
  database?: string;
  services?: {
    database?: string;
    redis?: string;
  };
  message?: string;
  timestamp?: string;
}

describe('Health Page', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false, // Disable retries for testing
        },
      },
    });
  });

  const renderHealth = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <Health />
      </QueryClientProvider>
    );
  };

  describe('Loading state', () => {
    it('shows loading message initially', () => {
      // Mock the API to never resolve
      (api.get as jest.Mock).mockImplementation(() => new Promise(() => {}));

      renderHealth();

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Success state', () => {
    it('shows health data when API call succeeds', async () => {
      const mockHealthData: HealthData = {
        status: 'ok',
        version: '1.0.0',
        uptime: 12345,
        database: 'connected',
      };

      (api.get as jest.Mock).mockResolvedValue({ data: mockHealthData });

      renderHealth();

      // Wait for the data to load
      await waitFor(() => {
        expect(screen.getByText('Backend Health')).toBeInTheDocument();
      });

      // Check if the data is displayed
      const preElement = document.querySelector('pre');
      expect(preElement).toBeInTheDocument();
      expect(preElement?.textContent).toContain('"status": "ok"');
      expect(preElement?.textContent).toContain('"version": "1.0.0"');

      // Verify API was called correctly
      expect(api.get).toHaveBeenCalledWith('/health');
      expect(api.get).toHaveBeenCalledTimes(1);
    });

    it('displays health data in a formatted JSON structure', async () => {
      const mockHealthData: HealthData = {
        status: 'ok',
        services: {
          database: 'up',
          redis: 'up',
        },
      };

      (api.get as jest.Mock).mockResolvedValue({ data: mockHealthData });

      renderHealth();

      await waitFor(() => {
        const preElement = document.querySelector('pre');
        expect(preElement).toBeInTheDocument();
        expect(preElement?.textContent).toContain('"status": "ok"');
        expect(preElement?.textContent).toContain('"services"');
        expect(preElement?.textContent).toContain('"database": "up"');
        expect(preElement?.textContent).toContain('"redis": "up"');
      });
    });

    it('handles different health status responses', async () => {
      const mockHealthData: HealthData = {
        status: 'degraded',
        message: 'Database connection slow',
        timestamp: '2024-01-01T00:00:00Z',
      };

      (api.get as jest.Mock).mockResolvedValue({ data: mockHealthData });

      renderHealth();

      await waitFor(() => {
        expect(screen.getByText('Backend Health')).toBeInTheDocument();
        const preElement = document.querySelector('pre');
        expect(preElement?.textContent).toContain('"status": "degraded"');
        expect(preElement?.textContent).toContain('"message": "Database connection slow"');
      });
    });
  });

  describe('Error state', () => {
    it('shows error message when API call fails', async () => {
      (api.get as jest.Mock).mockRejectedValue(new Error('Network error'));

      renderHealth();

      await waitFor(() => {
        expect(screen.getByText('Failed to reach backend')).toBeInTheDocument();
        expect(screen.getByText('Failed to reach backend')).toHaveClass('text-red-500');
      });
    });

    it('handles different types of API errors', async () => {
      const errorTypes = [
        { error: new Error('Connection timeout'), expected: 'Failed to reach backend' },
        { error: { message: 'Server error' }, expected: 'Failed to reach backend' },
        { error: 'String error', expected: 'Failed to reach backend' },
      ];

      for (const { error } of errorTypes) {
        vi.clearAllMocks();
        (api.get as jest.Mock).mockRejectedValue(error);

        renderHealth();

        await waitFor(() => {
          expect(screen.getByText('Failed to reach backend')).toBeInTheDocument();
        });

        queryClient.clear();
      }
    });

    it('does not show data when error occurs', async () => {
      (api.get as jest.Mock).mockRejectedValue(new Error('API error'));

      renderHealth();

      await waitFor(() => {
        expect(screen.getByText('Failed to reach backend')).toBeInTheDocument();
        expect(screen.queryByText('Backend Health')).not.toBeInTheDocument();
        expect(document.querySelector('pre')).not.toBeInTheDocument();
      });
    });
  });

  describe('API integration', () => {
    it('calls the health endpoint with correct URL', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: { status: 'ok' } });

      renderHealth();

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/health');
      });
    });

    it('uses the correct query key for caching', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: { status: 'ok' } });

      renderHealth();

      await waitFor(() => {
        // The query key should be used by react-query
        expect(queryClient.getQueryState(['health'])).toBeDefined();
      });
    });

    it('does not retry on error (retry: false)', async () => {
      (api.get as jest.Mock).mockRejectedValue(new Error('Error'));

      renderHealth();

      await waitFor(() => {
        expect(screen.getByText('Failed to reach backend')).toBeInTheDocument();
      });

      // api.get should only be called once (no retry)
      expect(api.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('UI/UX', () => {
    it('renders with proper heading', async () => {
      (api.get as jest.Mock).mockResolvedValue({ data: { status: 'ok' } });

      renderHealth();

      await waitFor(() => {
        const heading = screen.getByText('Backend Health');
        expect(heading).toBeInTheDocument();
        expect(heading.tagName).toBe('H2');
        expect(heading).toHaveClass('text-2xl');
        expect(heading).toHaveClass('font-semibold');
        expect(heading).toHaveClass('mb-4');
      });
    });

    it('displays data in a preformatted block with proper styling', async () => {
      const mockHealthData: HealthData = { status: 'ok' };
      (api.get as jest.Mock).mockResolvedValue({ data: mockHealthData });

      renderHealth();

      await waitFor(() => {
        const preElement = document.querySelector('pre');
        expect(preElement).toBeInTheDocument();
        expect(preElement).toHaveClass('bg-gray-100');
        expect(preElement).toHaveClass('p-4');
        expect(preElement).toHaveClass('rounded');
      });
    });

    it('transitions from loading to success state', async () => {
      let resolvePromise: (value: unknown) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      (api.get as jest.Mock).mockImplementation(() => promise);

      renderHealth();

      // Initially shows loading
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Resolve the promise
      resolvePromise({ data: { status: 'ok' } });

      // Should show success
      await waitFor(() => {
        expect(screen.getByText('Backend Health')).toBeInTheDocument();
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
    });

    it('transitions from loading to error state', async () => {
      let rejectPromise: (reason: unknown) => void;
      const promise = new Promise((_, reject) => {
        rejectPromise = reject;
      });

      (api.get as jest.Mock).mockImplementation(() => promise);

      renderHealth();

      // Initially shows loading
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Reject the promise
      rejectPromise(new Error('Error'));

      // Should show error
      await waitFor(() => {
        expect(screen.getByText('Failed to reach backend')).toBeInTheDocument();
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
    });
  });
});
