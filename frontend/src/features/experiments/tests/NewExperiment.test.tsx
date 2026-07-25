import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, beforeEach, expect } from 'vitest';

import NewExperiment from '@/features/experiments/pages/NewExperiment';
import { createExperiment } from '@/features/experiments/services/experimentService';

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

vi.mock('@/features/experiments/services/experimentService', () => ({
  createExperiment: vi.fn(),
}));

// Mock Konva components to prevent canvas errors
vi.mock('react-konva', () => ({
  Stage: ({ children }: { children: React.ReactNode }) => <div data-testid="stage">{children}</div>,
  Layer: ({ children }: { children: React.ReactNode }) => <div data-testid="layer">{children}</div>,
  Circle: (props: unknown) => <div data-testid="circle" data-props={JSON.stringify(props)} />,
  Line: (props: unknown) => <div data-testid="line" data-props={JSON.stringify(props)} />,
  Text: (props: unknown) => <div data-testid="text" data-props={JSON.stringify(props)} />,
  Rect: (props: unknown) => <div data-testid="rect" data-props={JSON.stringify(props)} />,
  Group: ({ children }: { children: React.ReactNode }) => <div data-testid="group">{children}</div>,
}));

// Mock the DatasetCanvas component
vi.mock('@/features/datasets/components/DatasetCanvas', () => ({
  default: ({
    onPointsChange,
    selectedClass,
    onClassChange,
  }: {
    onPointsChange: (points: Array<{ x: number; y: number; class: string }>) => void;
    selectedClass: string;
    onClassChange: (classLabel: string) => void;
  }) => (
    <div data-testid="dataset-canvas">
      <button
        data-testid="add-point"
        onClick={() =>
          onPointsChange([
            {
              x: 10,
              y: 20,
              class: selectedClass || 'A',
            },
          ])
        }
      >
        Add Point
      </button>
      <button data-testid="clear-points" onClick={() => onPointsChange([])}>
        Clear Points
      </button>
      <div data-testid="selected-class">{selectedClass}</div>
      <button data-testid="change-class" onClick={() => onClassChange('B')}>
        Change Class
      </button>
    </div>
  ),
}));

// ------------------------
// Helpers
// ------------------------

function renderComponent() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <NewExperiment />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ------------------------
// Tests
// ------------------------

describe('NewExperiment', () => {
  it('renders page correctly', () => {
    renderComponent();

    expect(
      screen.getByRole('heading', {
        name: /new experiment/i,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByRole('button', {
        name: /run experiment/i,
      })
    ).toBeDisabled();
  });

  it('shows KNN hyperparameters by default', () => {
    renderComponent();

    expect(screen.getByText(/number of neighbors/i)).toBeInTheDocument();

    expect(screen.queryByText(/inverse regularization/i)).not.toBeInTheDocument();

    expect(screen.queryByText(/penalty/i)).not.toBeInTheDocument();
  });

  it('switches to logistic regression', () => {
    renderComponent();

    fireEvent.click(
      screen.getByRole('button', {
        name: /logistic regression/i,
      })
    );

    expect(screen.getByText(/inverse regularization/i)).toBeInTheDocument();

    expect(screen.getByText(/penalty/i)).toBeInTheDocument();

    expect(screen.queryByText(/number of neighbors/i)).not.toBeInTheDocument();
  });

  it('enables Run Experiment after adding points', async () => {
    renderComponent();

    const runButton = screen.getByRole('button', {
      name: /run experiment/i,
    });

    expect(runButton).toBeDisabled();

    fireEvent.click(screen.getByTestId('add-point'));

    await waitFor(() => {
      expect(runButton).toBeEnabled();
    });
  });

  it('calls createExperiment with correct payload', async () => {
    (createExperiment as ReturnType<typeof vi.fn>).mockResolvedValue({
      experiment_id: 'exp-123',
    });

    renderComponent();

    fireEvent.click(screen.getByTestId('add-point'));

    await waitFor(() => {
      expect(screen.getByText(/1 point ready/i)).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole('button', {
        name: /run experiment/i,
      })
    );

    await waitFor(() => {
      expect(createExperiment).toHaveBeenCalledTimes(1);
    });

    const expectedPayload = {
      dataset: {
        type: 'canvas',
        name: 'Canvas Dataset',
        points: [
          {
            x: 10,
            y: 20,
            class: 'A',
          },
        ],
        feature_names: ['x', 'y'],
      },
      algorithm: 'knn',
      hyperparameters: {
        n_neighbors: 5,
      },
      target_column: 'class',
    };

    expect(createExperiment).toHaveBeenCalledWith(expectedPayload, expect.anything());
  });

  it('navigates after successful creation', async () => {
    (createExperiment as ReturnType<typeof vi.fn>).mockResolvedValue({
      experiment_id: 'abc123',
    });

    renderComponent();

    fireEvent.click(screen.getByTestId('add-point'));

    await waitFor(() => {
      expect(screen.getByText(/1 point ready/i)).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole('button', {
        name: /run experiment/i,
      })
    );

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('/experiments/abc123');
    });
  });

  it('shows server error when mutation fails', async () => {
    (createExperiment as ReturnType<typeof vi.fn>).mockRejectedValue({
      response: {
        data: {
          detail: 'Server Error',
        },
      },
    });

    renderComponent();

    fireEvent.click(screen.getByTestId('add-point'));

    await waitFor(() => {
      expect(screen.getByText(/1 point ready/i)).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole('button', {
        name: /run experiment/i,
      })
    );

    expect(await screen.findByText(/server error/i)).toBeInTheDocument();
  });

  it('changes KNN hyperparameter value', () => {
    renderComponent();

    const input = screen.getByDisplayValue('5');

    fireEvent.change(input, {
      target: {
        value: '9',
      },
    });

    expect(input).toHaveValue(9);
  });

  it('changes logistic regression hyperparameters', () => {
    renderComponent();

    fireEvent.click(
      screen.getByRole('button', {
        name: /logistic regression/i,
      })
    );

    const cInput = screen.getByDisplayValue('1.0');

    fireEvent.change(cInput, {
      target: {
        value: '2.5',
      },
    });

    expect(cInput).toHaveValue(2.5);

    const select = screen.getByDisplayValue('L2 (Ridge)');

    fireEvent.change(select, {
      target: {
        value: 'l1',
      },
    });

    expect(select).toHaveValue('l1');
  });

  it('shows point counter after adding a point', async () => {
    renderComponent();

    expect(screen.getByText(/add points on the canvas to get started/i)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('add-point'));

    await waitFor(() => {
      expect(screen.getByText(/1 point ready/i)).toBeInTheDocument();
    });
  });
});
