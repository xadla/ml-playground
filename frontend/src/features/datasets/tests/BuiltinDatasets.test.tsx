import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import userEvent from '@testing-library/user-event';

import BuiltinDatasets from '@/features/datasets/pages/BuiltinDatasets';
import { datasetService } from '@/features/datasets/services/datasetService';
import type { BuiltinDataset } from '@/features/datasets/types';

// ------------------------
// Mocks
// ------------------------

const navigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigate,
  };
});

vi.mock('@/features/datasets/services/datasetService', () => ({
  datasetService: {
    getBuiltinDatasets: vi.fn(),
  },
}));

// ------------------------
// Test Data
// ------------------------

const mockDatasets: BuiltinDataset[] = [
  {
    id: 'iris',
    name: 'Iris',
    description: 'Classic iris flower dataset with 3 species',
    rows: 150,
    columns: ['sepal_length', 'sepal_width', 'petal_length', 'petal_width', 'species'],
  },
  {
    id: 'wine',
    name: 'Wine',
    description: 'Wine chemical analysis dataset',
    rows: 178,
    columns: ['alcohol', 'malic_acid', 'ash', 'alcalinity_of_ash', 'magnesium', 'color_intensity'],
  },
  {
    id: 'digits',
    name: 'Digits',
    description: 'Handwritten digits dataset (8x8 images)',
    rows: 1797,
    columns: ['pixel_0', 'pixel_1', 'pixel_2', 'pixel_3', 'pixel_4', 'target'],
  },
];

// ------------------------
// Helpers
// ------------------------

function renderComponent() {
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
        <BuiltinDatasets />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  navigate.mockClear();
});

// ------------------------
// Tests
// ------------------------

describe('BuiltinDatasets', () => {
  describe('Rendering', () => {
    it('renders the page header correctly', () => {
      (datasetService.getBuiltinDatasets as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockDatasets
      );
      renderComponent();

      expect(
        screen.getByRole('heading', {
          name: /built‑in datasets/i,
        })
      ).toBeInTheDocument();

      expect(
        screen.getByText(/ready‑to‑use datasets perfect for learning and experimenting/i)
      ).toBeInTheDocument();
    });

    it('shows loading state initially', () => {
      (datasetService.getBuiltinDatasets as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise(() => {})
      );

      renderComponent();

      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('shows error state when query fails', async () => {
      (datasetService.getBuiltinDatasets as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Network error')
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/failed to load datasets/i)).toBeInTheDocument();
        expect(
          screen.getByText(/please check your connection or try again later/i)
        ).toBeInTheDocument();
      });
    });

    it('shows datasets when data loads successfully', async () => {
      (datasetService.getBuiltinDatasets as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockDatasets
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Iris')).toBeInTheDocument();
        expect(screen.getByText('Wine')).toBeInTheDocument();
        expect(screen.getByText('Digits')).toBeInTheDocument();
      });
    });

    it('shows empty state when no datasets are returned', async () => {
      (datasetService.getBuiltinDatasets as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/no datasets available/i)).toBeInTheDocument();
        expect(
          screen.getByText(/check back later – we're adding new ones regularly!/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Dataset Cards', () => {
    it('displays dataset information correctly', async () => {
      (datasetService.getBuiltinDatasets as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockDatasets
      );

      renderComponent();

      await waitFor(() => {
        const irisCard = screen.getByText('Iris').closest('.group');
        expect(irisCard).toBeInTheDocument();
        expect(screen.getByText('Classic iris flower dataset with 3 species')).toBeInTheDocument();
        expect(screen.getByText('150 rows')).toBeInTheDocument();
        expect(screen.getByText('5 columns')).toBeInTheDocument();
      });
    });

    it('shows column tags for each dataset', async () => {
      (datasetService.getBuiltinDatasets as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockDatasets
      );

      renderComponent();

      await waitFor(() => {
        // Check Iris columns
        expect(screen.getByText('sepal_length')).toBeInTheDocument();
        expect(screen.getByText('sepal_width')).toBeInTheDocument();
        expect(screen.getByText('petal_length')).toBeInTheDocument();
        expect(screen.getByText('petal_width')).toBeInTheDocument();
        expect(screen.getByText('+1 more')).toBeInTheDocument();
      });
    });

    it('shows "Use this dataset" button for each dataset', async () => {
      (datasetService.getBuiltinDatasets as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockDatasets
      );

      renderComponent();

      await waitFor(() => {
        const buttons = screen.getAllByRole('button', { name: /use this dataset/i });
        expect(buttons).toHaveLength(3);
      });
    });
  });

  describe('Navigation', () => {
    it('navigates to new experiment with dataset ID when clicking "Use this dataset"', async () => {
      const user = userEvent.setup();
      (datasetService.getBuiltinDatasets as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockDatasets
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Iris')).toBeInTheDocument();
      });

      const useButtons = screen.getAllByRole('button', { name: /use this dataset/i });
      await user.click(useButtons[0]);

      expect(navigate).toHaveBeenCalledWith('/experiments/new?source=builtin&datasetId=iris');
    });

    it('navigates correctly for the second dataset', async () => {
      const user = userEvent.setup();
      (datasetService.getBuiltinDatasets as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockDatasets
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Wine')).toBeInTheDocument();
      });

      const useButtons = screen.getAllByRole('button', { name: /use this dataset/i });
      await user.click(useButtons[1]);

      expect(navigate).toHaveBeenCalledWith('/experiments/new?source=builtin&datasetId=wine');
    });

    it('navigates correctly for the third dataset', async () => {
      const user = userEvent.setup();
      (datasetService.getBuiltinDatasets as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockDatasets
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Digits')).toBeInTheDocument();
      });

      const useButtons = screen.getAllByRole('button', { name: /use this dataset/i });
      await user.click(useButtons[2]);

      expect(navigate).toHaveBeenCalledWith('/experiments/new?source=builtin&datasetId=digits');
    });
  });

  describe('Dataset Card Styling', () => {
    it('assigns different gradient colors to different datasets', async () => {
      (datasetService.getBuiltinDatasets as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockDatasets
      );

      renderComponent();

      await waitFor(() => {
        const cards = document.querySelectorAll('.group');
        expect(cards.length).toBe(3);

        // Each card should have a gradient bar at the top
        const gradientBars = document.querySelectorAll('.h-2');
        expect(gradientBars.length).toBe(3);
      });
    });

    it('shows dataset icon with gradient background', async () => {
      (datasetService.getBuiltinDatasets as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockDatasets
      );

      renderComponent();

      await waitFor(() => {
        const icons = document.querySelectorAll('.w-10.h-10');
        expect(icons.length).toBe(3);
      });
    });
  });

  describe('Loading and Error States', () => {
    it('hides loading state when data loads', async () => {
      (datasetService.getBuiltinDatasets as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockDatasets
      );

      renderComponent();

      // Loading should be visible initially
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Iris')).toBeInTheDocument();
        expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
      });
    });

    it('hides loading state when error occurs', async () => {
      (datasetService.getBuiltinDatasets as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Network error')
      );

      renderComponent();

      // Loading should be visible initially
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText(/failed to load datasets/i)).toBeInTheDocument();
        expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
      });
    });

    it('handles error without response data gracefully', async () => {
      (datasetService.getBuiltinDatasets as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Something went wrong')
      );

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/failed to load datasets/i)).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Grid Layout', () => {
    it('renders datasets in a grid layout', async () => {
      (datasetService.getBuiltinDatasets as ReturnType<typeof vi.fn>).mockResolvedValue(
        mockDatasets
      );

      renderComponent();

      await waitFor(() => {
        const grid = document.querySelector('.grid');
        expect(grid).toBeInTheDocument();
        expect(grid).toHaveClass('gap-6');
        expect(grid).toHaveClass('sm:grid-cols-2');
        expect(grid).toHaveClass('lg:grid-cols-3');
      });
    });
  });
});
