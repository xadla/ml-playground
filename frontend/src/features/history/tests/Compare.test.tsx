import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import Compare from '@/features/history/pages/Compare';
import { historyService } from '@/features/history/services/historyService';
import type { CompareResult } from '@/features/history/types/history';

// --------------------------------
// Mocks
// --------------------------------

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useSearchParams: vi.fn(),
  };
});

vi.mock('@/features/history/services/historyService', () => ({
  historyService: {
    compareExperiments: vi.fn(),
  },
}));

import { useSearchParams } from 'react-router-dom';

// --------------------------------
// Test Data
// --------------------------------

const mockCompareResult: CompareResult = {
  experiments: [
    {
      experiment_id: 'exp-123',
      dataset_name: 'Iris Dataset',
      algorithm: 'knn',
      metrics: {
        accuracy: 0.92,
        precision: 0.9,
        recall: 0.88,
        f1_score: 0.89,
      },
    },
    {
      experiment_id: 'exp-456',
      dataset_name: 'Wine Dataset',
      algorithm: 'logistic_regression',
      metrics: {
        accuracy: 0.85,
        precision: 0.82,
        recall: 0.8,
        f1_score: 0.81,
      },
    },
    {
      experiment_id: 'exp-789',
      dataset_name: 'Digits Dataset',
      algorithm: 'knn',
      metrics: {
        accuracy: 0.95,
        precision: 0.94,
        recall: 0.93,
        f1_score: 0.935,
      },
    },
  ],
};

// --------------------------------
// Helpers
// --------------------------------

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

function renderComponent(ids: string[] = ['exp-123', 'exp-456']) {
  const queryClient = createTestQueryClient();

  (useSearchParams as ReturnType<typeof vi.fn>).mockReturnValue([
    new URLSearchParams({ ids: ids.join(',') }),
    vi.fn(),
  ]);

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Compare />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  (useSearchParams as ReturnType<typeof vi.fn>).mockReset();
});

// --------------------------------
// Tests
// --------------------------------

describe('Compare', () => {
  describe('Rendering', () => {
    it('renders the page header correctly', () => {
      (historyService.compareExperiments as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockCompareResult
      );
      renderComponent();

      expect(screen.getByRole('heading', { name: /compare experiments/i })).toBeInTheDocument();
      expect(
        screen.getByText(/side‑by‑side metrics for your selected experiments/i)
      ).toBeInTheDocument();
    });

    it('renders "Back to History" link', () => {
      (historyService.compareExperiments as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockCompareResult
      );
      renderComponent();

      const backLink = screen.getByRole('link', { name: /back to history/i });
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/history');
    });
  });

  describe('URL Parameters', () => {
    it('shows message when less than 2 IDs are provided', () => {
      renderComponent(['exp-123']);

      expect(screen.getByText(/select at least two experiments to compare/i)).toBeInTheDocument();
      expect(historyService.compareExperiments).not.toHaveBeenCalled();
    });

    it('shows message when no IDs are provided', () => {
      renderComponent([]);

      expect(screen.getByText(/select at least two experiments to compare/i)).toBeInTheDocument();
      expect(historyService.compareExperiments).not.toHaveBeenCalled();
    });

    it('calls compareExperiments with the correct IDs', () => {
      (historyService.compareExperiments as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockCompareResult
      );
      const ids = ['exp-123', 'exp-456', 'exp-789'];
      renderComponent(ids);

      expect(historyService.compareExperiments).toHaveBeenCalledWith(ids);
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner when fetching data', () => {
      (historyService.compareExperiments as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise(() => {})
      );
      renderComponent();

      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('hides loading spinner when data loads', async () => {
      (historyService.compareExperiments as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockCompareResult
      );
      renderComponent();

      await waitFor(() => {
        expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    it('shows error message when comparison fails', async () => {
      (historyService.compareExperiments as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Network error')
      );
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/failed to load comparison data/i)).toBeInTheDocument();
      });
    });
  });

  describe('Data Display', () => {
    it('renders experiment summary cards', async () => {
      (historyService.compareExperiments as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockCompareResult
      );
      renderComponent();

      await waitFor(() => {
        // Use getAllByText since dataset names appear in both cards and table
        expect(screen.getAllByText('Iris Dataset').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Wine Dataset').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Digits Dataset').length).toBeGreaterThan(0);
      });
    });

    it('displays algorithm badges with correct styling', async () => {
      (historyService.compareExperiments as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockCompareResult
      );
      renderComponent();

      await waitFor(() => {
        // Use getAllByText since 'knn' appears multiple times
        const knnBadges = screen.getAllByText('knn');
        expect(knnBadges).toHaveLength(2); // Iris and Digits are both knn
        expect(screen.getByText('logistic regression')).toBeInTheDocument();
      });
    });

    it('displays truncated experiment IDs', async () => {
      (historyService.compareExperiments as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockCompareResult
      );
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/ID: exp-123/)).toBeInTheDocument();
        expect(screen.getByText(/ID: exp-456/)).toBeInTheDocument();
        expect(screen.getByText(/ID: exp-789/)).toBeInTheDocument();
      });
    });

    it('renders the metrics comparison table', async () => {
      (historyService.compareExperiments as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockCompareResult
      );
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/metrics comparison/i)).toBeInTheDocument();
        expect(screen.getByText('Accuracy')).toBeInTheDocument();
        expect(screen.getByText('Precision')).toBeInTheDocument();
        expect(screen.getByText('Recall')).toBeInTheDocument();
        expect(screen.getByText('F1 Score')).toBeInTheDocument();
      });
    });

    it('displays metric values correctly formatted', async () => {
      (historyService.compareExperiments as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockCompareResult
      );
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('92.0%')).toBeInTheDocument();
        expect(screen.getByText('90.0%')).toBeInTheDocument();
        expect(screen.getByText('88.0%')).toBeInTheDocument();
        expect(screen.getByText('89.0%')).toBeInTheDocument();

        expect(screen.getByText('85.0%')).toBeInTheDocument();
        expect(screen.getByText('82.0%')).toBeInTheDocument();
        expect(screen.getByText('80.0%')).toBeInTheDocument();
        expect(screen.getByText('81.0%')).toBeInTheDocument();
      });
    });
  });

  describe('Metric Bars', () => {
    it('renders metric bars with correct widths', async () => {
      (historyService.compareExperiments as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockCompareResult
      );
      renderComponent();

      await waitFor(() => {
        const bars = document.querySelectorAll('.w-16 .h-full');
        expect(bars.length).toBeGreaterThan(0);
        // First bar should be 92%
        const firstBar = bars[0] as HTMLElement;
        expect(firstBar.style.width).toBe('92%');
      });
    });
  });

  describe('Algorithm Gradient Mapping', () => {
    it('applies correct gradient for KNN', async () => {
      (historyService.compareExperiments as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockCompareResult
      );
      renderComponent();

      await waitFor(() => {
        // Get all cards and find the one with Iris Dataset
        const cards = document.querySelectorAll('.bg-white.dark\\:bg-gray-800');
        // First card (Iris) should have KNN gradient
        const gradientBar = cards[0]?.querySelector('.h-1\\.5');
        expect(gradientBar).toHaveClass('from-indigo-500', 'to-purple-600');
      });
    });

    it('applies correct gradient for logistic regression', async () => {
      (historyService.compareExperiments as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockCompareResult
      );
      renderComponent();

      await waitFor(() => {
        const cards = document.querySelectorAll('.bg-white.dark\\:bg-gray-800');
        // Second card (Wine) should have logistic regression gradient
        const gradientBar = cards[1]?.querySelector('.h-1\\.5');
        expect(gradientBar).toHaveClass('from-pink-500', 'to-rose-600');
      });
    });

    it('applies default gradient for unknown algorithms', async () => {
      const customResult = {
        experiments: [
          {
            ...mockCompareResult.experiments[0],
            algorithm: 'unknown_algo',
          },
          ...mockCompareResult.experiments.slice(1),
        ],
      };
      (historyService.compareExperiments as ReturnType<typeof vi.fn>).mockResolvedValue(
        customResult
      );
      renderComponent();

      await waitFor(() => {
        const cards = document.querySelectorAll('.bg-white.dark\\:bg-gray-800');
        const gradientBar = cards[0]?.querySelector('.h-1\\.5');
        expect(gradientBar).toHaveClass('from-gray-500', 'to-gray-700');
      });
    });
  });

  describe('Row Styling', () => {
    it('alternates row colors in the table', async () => {
      (historyService.compareExperiments as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockCompareResult
      );
      renderComponent();

      await waitFor(() => {
        const rows = document.querySelectorAll('tbody tr');
        expect(rows.length).toBe(3);

        // First row should be white (or dark:bg-gray-800)
        expect(rows[0]).toHaveClass('bg-white');
        // Second row should be gray
        expect(rows[1]).toHaveClass('bg-gray-50/30');
        // Third row should be white
        expect(rows[2]).toHaveClass('bg-white');
      });
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no experiments are returned', async () => {
      (historyService.compareExperiments as ReturnType<typeof vi.fn>).mockResolvedValue({
        experiments: [],
      });
      renderComponent();

      // The component will still render the header but no cards or table
      await waitFor(() => {
        // Should not show any experiment names in cards
        expect(screen.queryByText('Iris Dataset')).not.toBeInTheDocument();
        // But should still show the header
        expect(screen.getByText(/compare experiments/i)).toBeInTheDocument();
        // The metrics table should not be rendered
        expect(screen.queryByText(/metrics comparison/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Responsive Layout', () => {
    it('applies correct grid classes for experiment cards', async () => {
      (historyService.compareExperiments as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockCompareResult
      );
      renderComponent();

      await waitFor(() => {
        const grid = document.querySelector('.grid');
        expect(grid).toHaveClass('gap-4');
        expect(grid).toHaveClass('sm:grid-cols-2');
        expect(grid).toHaveClass('lg:grid-cols-3');
      });
    });
  });
});
