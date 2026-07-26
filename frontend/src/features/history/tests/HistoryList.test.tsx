// src/features/history/tests/HistoryList.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import userEvent from '@testing-library/user-event';

import HistoryList from '@/features/history/pages/HistoryList';
import { historyService } from '@/features/history/services/historyService';
import type { HistoryExperiment, HistoryListResponse } from '@/features/history/types/history';

// --------------------------------
// Mocks
// --------------------------------

const navigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock('@/features/history/services/historyService', () => ({
  historyService: {
    getHistory: vi.fn(),
    deleteExperiment: vi.fn(),
  },
}));

// Mock window.confirm
const mockConfirm = vi.fn();
window.confirm = mockConfirm;

// --------------------------------
// Test Data
// --------------------------------

const mockExperiments: HistoryExperiment[] = [
  {
    id: '1',
    experiment_id: 'exp-123',
    dataset_name: 'Iris Dataset',
    algorithm: 'knn',
    metrics: {
      accuracy: 0.92,
      f1_score: 0.89,
      precision: 0.9,
      recall: 0.88,
    },
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    experiment_id: 'exp-456',
    dataset_name: 'Wine Dataset',
    algorithm: 'logistic_regression',
    metrics: {
      accuracy: 0.85,
      f1_score: 0.81,
      precision: 0.82,
      recall: 0.8,
    },
    created_at: '2024-01-14T10:00:00Z',
  },
  {
    id: '3',
    experiment_id: 'exp-789',
    dataset_name: 'Digits Dataset',
    algorithm: 'knn',
    metrics: {
      accuracy: 0.95,
      f1_score: 0.935,
      precision: 0.94,
      recall: 0.93,
    },
    created_at: '2024-01-13T10:00:00Z',
  },
];

const mockHistoryResponse: HistoryListResponse = {
  items: mockExperiments,
  total: 3,
  page: 1,
  size: 10,
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

function renderComponent() {
  const queryClient = createTestQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <HistoryList />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  navigate.mockClear();
  mockConfirm.mockClear();
  mockConfirm.mockReturnValue(true);
});

// --------------------------------
// Tests
// --------------------------------

describe('HistoryList', () => {
  describe('Rendering', () => {
    it('renders the page header correctly', () => {
      (historyService.getHistory as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockHistoryResponse
      );
      renderComponent();

      expect(screen.getByRole('heading', { name: /experiment history/i })).toBeInTheDocument();
      expect(
        screen.getByText(/review, compare, and manage your previous experiments/i)
      ).toBeInTheDocument();
    });

    it('renders search input', () => {
      (historyService.getHistory as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockHistoryResponse
      );
      renderComponent();

      expect(screen.getByPlaceholderText(/search by dataset or algorithm/i)).toBeInTheDocument();
    });

    it('renders sort select dropdown', () => {
      (historyService.getHistory as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockHistoryResponse
      );
      renderComponent();

      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Algorithm')).toBeInTheDocument();
      expect(screen.getByText('Accuracy')).toBeInTheDocument();
    });

    it('renders order toggle button', () => {
      (historyService.getHistory as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockHistoryResponse
      );
      renderComponent();

      expect(screen.getByText(/descending/i)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner when fetching data', () => {
      (historyService.getHistory as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise(() => {})
      );
      renderComponent();

      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('hides loading spinner when data loads', async () => {
      (historyService.getHistory as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockHistoryResponse
      );
      renderComponent();

      await waitFor(() => {
        expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error State', () => {
    it('shows error message when fetch fails', async () => {
      (historyService.getHistory as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Network error')
      );
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/failed to load experiment history/i)).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no experiments exist', async () => {
      (historyService.getHistory as ReturnType<typeof vi.fn>).mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        size: 10,
        pages: 0,
      });
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/no experiments yet/i)).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: /run your first experiment/i })
        ).toBeInTheDocument();
      });
    });

    it('navigates to new experiment when "Run your first experiment" is clicked', async () => {
      const user = userEvent.setup();
      (historyService.getHistory as ReturnType<typeof vi.fn>).mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        size: 10,
        pages: 0,
      });
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/no experiments yet/i)).toBeInTheDocument();
      });

      const runButton = screen.getByRole('button', { name: /run your first experiment/i });
      await user.click(runButton);

      expect(navigate).toHaveBeenCalledWith('/experiments/new');
    });
  });

  describe('Data Display', () => {
    it('renders experiment cards', async () => {
      (historyService.getHistory as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockHistoryResponse
      );
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Iris Dataset')).toBeInTheDocument();
        expect(screen.getByText('Wine Dataset')).toBeInTheDocument();
        expect(screen.getByText('Digits Dataset')).toBeInTheDocument();
      });
    });

    it('displays algorithm badges correctly', async () => {
      (historyService.getHistory as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockHistoryResponse
      );
      renderComponent();

      await waitFor(() => {
        const knnBadges = screen.getAllByText('knn');
        expect(knnBadges).toHaveLength(2);
        expect(screen.getByText('logistic regression')).toBeInTheDocument();
      });
    });

    it('displays formatted dates', async () => {
      (historyService.getHistory as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockHistoryResponse
      );
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/jan 15, 2024/i)).toBeInTheDocument();
        expect(screen.getByText(/jan 14, 2024/i)).toBeInTheDocument();
        expect(screen.getByText(/jan 13, 2024/i)).toBeInTheDocument();
      });
    });
  });

  describe('Selection', () => {
    it('allows selecting individual experiments', async () => {
      const user = userEvent.setup();
      (historyService.getHistory as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockHistoryResponse
      );
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Iris Dataset')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      // First checkbox is "Select all", second is for first experiment
      await user.click(checkboxes[1]);

      expect(checkboxes[1]).toBeChecked();
    });

    it('allows selecting all experiments', async () => {
      const user = userEvent.setup();
      (historyService.getHistory as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockHistoryResponse
      );
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Iris Dataset')).toBeInTheDocument();
      });

      const selectAllCheckbox = screen.getByRole('checkbox', { name: /select all/i });
      await user.click(selectAllCheckbox);

      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach((cb) => expect(cb).toBeChecked());
    });

    it('shows compare button when at least 2 items are selected', async () => {
      const user = userEvent.setup();
      (historyService.getHistory as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockHistoryResponse
      );
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Iris Dataset')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]); // Select first
      await user.click(checkboxes[2]); // Select second

      // The compare button is in the toolbar
      expect(screen.getByRole('button', { name: /compare \(\d+\)/i })).toBeInTheDocument();
    });

    it('navigates to compare page with selected IDs', async () => {
      const user = userEvent.setup();
      (historyService.getHistory as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockHistoryResponse
      );
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Iris Dataset')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]); // Select first
      await user.click(checkboxes[2]); // Select second

      const compareButton = screen.getByRole('button', { name: /compare \(\d+\)/i });
      await user.click(compareButton);

      expect(navigate).toHaveBeenCalledWith('/history/compare?ids=exp-123,exp-456');
    });
  });

  describe('Floating Compare Bar', () => {
    it('shows floating compare bar when items are selected', async () => {
      const user = userEvent.setup();
      (historyService.getHistory as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockHistoryResponse
      );
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Iris Dataset')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]);
      await user.click(checkboxes[2]);

      // Floating bar has "Compare" and "Clear" buttons
      // Use getAllByRole since there are multiple Compare buttons
      const compareButtons = screen.getAllByRole('button', { name: /compare/i });
      // One is in the toolbar, one is in the floating bar
      expect(compareButtons.length).toBe(2);
      expect(screen.getByText(/\d+ selected/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    });

    it('clears selection when clear button is clicked', async () => {
      const user = userEvent.setup();
      (historyService.getHistory as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockHistoryResponse
      );
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Iris Dataset')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[1]);
      await user.click(checkboxes[2]);

      expect(screen.getByText(/\d+ selected/i)).toBeInTheDocument();

      const clearButton = screen.getByRole('button', { name: /clear/i });
      await user.click(clearButton);

      expect(screen.queryByText(/\d+ selected/i)).not.toBeInTheDocument();
      checkboxes.forEach((cb) => expect(cb).not.toBeChecked());
    });
  });

  describe('Delete Functionality', () => {
    it('shows confirmation dialog when deleting an experiment', async () => {
      const user = userEvent.setup();
      (historyService.getHistory as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockHistoryResponse
      );
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Iris Dataset')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      expect(mockConfirm).toHaveBeenCalledWith('Permanently delete this experiment?');
    });

    it('calls deleteExperiment when confirm is accepted', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(true);
      (historyService.getHistory as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockHistoryResponse
      );
      (historyService.deleteExperiment as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Iris Dataset')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      // The delete function receives the id as a number, but the component passes it as a string
      expect(historyService.deleteExperiment).toHaveBeenCalledWith('1');
    });

    it('does not call deleteExperiment when confirm is rejected', async () => {
      const user = userEvent.setup();
      mockConfirm.mockReturnValue(false);
      (historyService.getHistory as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockHistoryResponse
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Iris Dataset')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
      await user.click(deleteButtons[0]);

      expect(historyService.deleteExperiment).not.toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    it('navigates to experiment detail when View button is clicked', async () => {
      const user = userEvent.setup();
      (historyService.getHistory as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockHistoryResponse
      );
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Iris Dataset')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByRole('button', { name: /view/i });
      await user.click(viewButtons[0]);

      expect(navigate).toHaveBeenCalledWith('/experiments/exp-123');
    });
  });

  describe('Pagination', () => {
    it('shows pagination controls', async () => {
      const multiplePagesResponse = {
        ...mockHistoryResponse,
        total: 25,
        pages: 3,
      };
      (historyService.getHistory as ReturnType<typeof vi.fn>).mockResolvedValue(
        multiplePagesResponse
      );
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled();
        expect(screen.getByRole('button', { name: /next/i })).toBeEnabled();
      });
    });

    it('navigates to next page when Next button is clicked', async () => {
      const user = userEvent.setup();
      const multiplePagesResponse = {
        ...mockHistoryResponse,
        total: 25,
        pages: 3,
      };
      (historyService.getHistory as ReturnType<typeof vi.fn>).mockResolvedValue(
        multiplePagesResponse
      );
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument();
      });

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      expect(historyService.getHistory).toHaveBeenCalledWith(2, 10, 'created_at', 'desc', '');
    });

    it('navigates to previous page when Previous button is clicked', async () => {
      const user = userEvent.setup();
      const multiplePagesResponse = {
        ...mockHistoryResponse,
        total: 25,
        pages: 3,
      };
      (historyService.getHistory as ReturnType<typeof vi.fn>).mockResolvedValue(
        multiplePagesResponse
      );
      renderComponent();

      // First navigate to page 2
      (historyService.getHistory as ReturnType<typeof vi.fn>).mockResolvedValue({
        ...multiplePagesResponse,
        page: 2,
      });

      await waitFor(() => {
        expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument();
      });

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      // Now check previous button works
      await waitFor(() => {
        const prevButton = screen.getByRole('button', { name: /previous/i });
        expect(prevButton).toBeEnabled();
      });

      const prevButton = screen.getByRole('button', { name: /previous/i });
      await user.click(prevButton);

      expect(historyService.getHistory).toHaveBeenCalledWith(1, 10, 'created_at', 'desc', '');
    });
  });

  describe('Search and Sort', () => {
    it('updates search query when typing', async () => {
      const user = userEvent.setup();
      (historyService.getHistory as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockHistoryResponse
      );
      renderComponent();

      const searchInput = screen.getByPlaceholderText(/search by dataset or algorithm/i);
      await user.type(searchInput, 'iris');

      await waitFor(() => {
        expect(historyService.getHistory).toHaveBeenCalledWith(1, 10, 'created_at', 'desc', 'iris');
      });
    });

    it('changes sort field when dropdown is changed', async () => {
      const user = userEvent.setup();
      (historyService.getHistory as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockHistoryResponse
      );
      renderComponent();

      const sortSelect = screen.getByRole('combobox');
      await user.selectOptions(sortSelect, 'accuracy');

      await waitFor(() => {
        expect(historyService.getHistory).toHaveBeenCalledWith(1, 10, 'accuracy', 'desc', '');
      });
    });

    it('toggles order when order button is clicked', async () => {
      const user = userEvent.setup();
      (historyService.getHistory as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockHistoryResponse
      );
      renderComponent();

      const orderButton = screen.getByRole('button', { name: /descending/i });
      await user.click(orderButton);

      await waitFor(() => {
        expect(historyService.getHistory).toHaveBeenCalledWith(1, 10, 'created_at', 'asc', '');
      });
    });
  });

  describe('Algorithm Gradient', () => {
    it('applies correct gradient for KNN', async () => {
      (historyService.getHistory as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockHistoryResponse
      );
      renderComponent();

      await waitFor(() => {
        // Find the first card's gradient bar directly
        const gradientBars = document.querySelectorAll('.h-1\\.5');
        expect(gradientBars.length).toBeGreaterThan(0);
        // First card should be KNN (Iris Dataset)
        expect(gradientBars[0]).toHaveClass('from-indigo-500', 'to-purple-600');
      });
    });

    it('applies correct gradient for logistic regression', async () => {
      (historyService.getHistory as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockHistoryResponse
      );
      renderComponent();

      await waitFor(() => {
        const gradientBars = document.querySelectorAll('.h-1\\.5');
        // Second card should be logistic regression (Wine Dataset)
        expect(gradientBars[1]).toHaveClass('from-pink-500', 'to-rose-600');
      });
    });

    it('applies default gradient for unknown algorithms', async () => {
      const customData = {
        ...mockHistoryResponse,
        items: [
          {
            ...mockExperiments[0],
            algorithm: 'unknown_algo',
          },
        ],
      };
      (historyService.getHistory as ReturnType<typeof vi.fn>).mockResolvedValue(customData);
      renderComponent();

      await waitFor(() => {
        const gradientBars = document.querySelectorAll('.h-1\\.5');
        expect(gradientBars[0]).toHaveClass('from-gray-500', 'to-gray-700');
      });
    });
  });
});
