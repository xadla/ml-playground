import { screen, waitFor, fireEvent } from '@testing-library/react';
import { useParams } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import ExperimentDetail from '@/features/experiments/pages/ExperimentDetail';
import {
  getExperimentStatus,
  saveExperiment,
} from '@/features/experiments/services/experimentService';
import { useAuth } from '@/contexts/AuthContext';
import { renderWithProviders } from '@/test/test-utils';

// --------------------------------
// Mocks
// --------------------------------

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useParams: vi.fn() };
});

vi.mock('@/features/experiments/services/experimentService', () => ({
  getExperimentStatus: vi.fn(),
  saveExperiment: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Mock alert to prevent it from showing during tests
vi.stubGlobal('alert', vi.fn());

// --------------------------------
// Helpers
// --------------------------------

const mockExperimentStatus = (status: string, overrides = {}) => ({
  experiment_id: 'test-id',
  status,
  algorithm: 'knn',
  hyperparameters: { n_neighbors: 5 },
  result: null,
  error_message: null,
  ...overrides,
});

// --------------------------------
// Setup
// --------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ isAuthenticated: false });
});

// --------------------------------
// Tests
// --------------------------------

describe('ExperimentDetail', () => {
  // Helper function using renderWithProviders
  const renderComponent = (id = 'test-id') => {
    (useParams as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ id });

    // renderWithProviders handles QueryClientProvider, AuthProvider, and Router
    return renderWithProviders(<ExperimentDetail />, {
      route: `/experiments/${id}`,
    });
  };

  it('renders loading state', () => {
    (getExperimentStatus as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {})
    );
    renderComponent();
    expect(screen.getByText(/loading experiment/i)).toBeInTheDocument();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('renders error state when query fails', async () => {
    (getExperimentStatus as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Network error')
    );
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
      expect(screen.getByText(/could not retrieve experiment data/i)).toBeInTheDocument();
    });
  });

  it('renders pending experiment details', async () => {
    (getExperimentStatus as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockExperimentStatus('pending', {
        algorithm: 'logistic_regression',
        hyperparameters: { C: 1.0, penalty: 'l2' },
      })
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /experiment #test-id/i })).toBeInTheDocument();
    });

    expect(screen.getByText(/logistic regression/i)).toBeInTheDocument();
    expect(screen.getByText(/C=1, penalty=l2/i)).toBeInTheDocument();
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
    expect(screen.getByText(/waiting to start/i)).toBeInTheDocument();
  });

  it('renders running experiment details', async () => {
    (getExperimentStatus as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockExperimentStatus('running')
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/running/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/training model/i)).toBeInTheDocument();
    expect(screen.getByText(/results will appear automatically/i)).toBeInTheDocument();
  });

  it('renders completed experiment with metrics, confusion matrix, and plots', async () => {
    const mockResult = {
      metrics: { accuracy: 0.92, precision: 0.87, recall: 0.88 },
      confusion_matrix: [
        [10, 2],
        [3, 15],
      ],
      plots: {
        decision_boundary: 'data:image/png;base64,abc123',
        confusion_matrix_heatmap: 'data:image/png;base64,def456',
      },
    };

    (getExperimentStatus as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockExperimentStatus('completed', {
        result: mockResult,
        hyperparameters: { n_neighbors: 3 },
      })
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/completed/i)).toBeInTheDocument();
    });

    expect(screen.getByText('92.0%')).toBeInTheDocument();
    expect(screen.getByText('87.0%')).toBeInTheDocument();
    expect(screen.getByText('88.0%')).toBeInTheDocument();

    expect(screen.getByText(/predicted 0/i)).toBeInTheDocument();
    expect(screen.getByText(/predicted 1/i)).toBeInTheDocument();
    expect(screen.getByText(/actual 0/i)).toBeInTheDocument();
    expect(screen.getByText(/actual 1/i)).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();

    expect(screen.getByAltText(/decision boundary/i)).toBeInTheDocument();
    expect(screen.getByAltText(/confusion matrix heatmap/i)).toBeInTheDocument();
    expect(screen.queryByText(/training model/i)).not.toBeInTheDocument();
  });

  it('renders error message for failed experiment', async () => {
    (getExperimentStatus as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockExperimentStatus('failed', {
        error_message: 'Model did not converge',
      })
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/failed/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/model did not converge/i)).toBeInTheDocument();
  });

  it('does not show save button when not authenticated', async () => {
    (getExperimentStatus as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockExperimentStatus('completed')
    );
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ isAuthenticated: false });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/completed/i)).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /save to history/i })).not.toBeInTheDocument();
  });

  it('shows save button when authenticated and experiment is completed', async () => {
    (getExperimentStatus as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockExperimentStatus('completed')
    );
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ isAuthenticated: true });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save to history/i })).toBeInTheDocument();
    });
  });

  it('calls saveExperiment when save button is clicked', async () => {
    (getExperimentStatus as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockExperimentStatus('completed')
    );
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ isAuthenticated: true });
    (saveExperiment as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ success: true });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save to history/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /save to history/i }));

    await waitFor(() => {
      expect(saveExperiment).toHaveBeenCalledWith('test-id');
    });
  });

  it('handles save mutation error gracefully', async () => {
    (getExperimentStatus as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockExperimentStatus('completed')
    );
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ isAuthenticated: true });
    (saveExperiment as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Server error')
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save to history/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /save to history/i }));

    // After the error, the button should be re-enabled
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save to history/i })).toBeEnabled();
    });

    // Verify the mutation was called
    expect(saveExperiment).toHaveBeenCalledWith('test-id');
  });

  it('disables save button while saving', async () => {
    (getExperimentStatus as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockExperimentStatus('completed')
    );
    (useAuth as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ isAuthenticated: true });

    // Use a promise that we can control
    let resolveMutation: (value: unknown) => void;
    const mutationPromise = new Promise((resolve) => {
      resolveMutation = resolve;
    });
    (saveExperiment as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () => mutationPromise
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save to history/i })).toBeInTheDocument();
    });

    const button = screen.getByRole('button', { name: /save to history/i });
    fireEvent.click(button);

    // Wait for the mutation to become pending and the button to be disabled
    await waitFor(() => {
      expect(button).toBeDisabled();
    });

    // Resolve the mutation to clean up
    resolveMutation!({ success: true });

    // Wait for the button to be re-enabled
    await waitFor(() => {
      expect(button).toBeEnabled();
    });
  });
});
