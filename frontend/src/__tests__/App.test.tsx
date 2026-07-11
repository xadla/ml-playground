import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import App from '@/App';
import { vi } from 'vitest';
import api from '@/api/client';

// Mock the API client
vi.mock('../api/client', () => ({
  default: {
    get: vi.fn(),
  },
}));

const renderApp = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <App />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

test('renders home page by default', () => {
  renderApp();
  expect(screen.getByText(/Welcome to ML Playground/i)).toBeInTheDocument();
});

test('health page shows loading then data', async () => {
  (api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    data: { status: 'ok' },
  });

  // Navigate to /health
  window.history.pushState({}, '', '/health');
  renderApp();

  // loading state is present initially
  expect(screen.getByText('Loading...')).toBeInTheDocument();

  // wait for data
  expect(await screen.findByText(/status/i)).toBeInTheDocument();
});
