import { render, screen } from '@testing-library/react';
import { vi, describe, it, beforeEach, expect } from 'vitest';
import userEvent from '@testing-library/user-event';

import ErrorBoundary from '@/components/ErrorBoundary';

// --------------------------------
// Test Helpers
// --------------------------------

// A component that throws an error
function ThrowError({ message }: { message?: string }) {
  throw new Error(message || 'Test error message');
  return <div>This won't render</div>;
}

// A component that doesn't throw
function SafeComponent() {
  return <div data-testid="safe-component">I am safe!</div>;
  return <div>This won't render</div>;
}

// A component that throws a specific error type
function ThrowTypeError() {
  throw new TypeError('Type error message');
  return <div>This won't render</div>;
}

// A component that throws with no message
function ThrowNoMessage() {
  throw new Error();
  return <div>This won't render</div>;
}

// Reset window.location.reload mock
const mockReload = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  // Mock window.location.reload
  Object.defineProperty(window, 'location', {
    value: { reload: mockReload },
    writable: true,
  });
});

// --------------------------------
// Tests
// --------------------------------

describe('ErrorBoundary', () => {
  describe('Rendering', () => {
    it('renders children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <SafeComponent />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('safe-component')).toBeInTheDocument();
      expect(screen.getByText('I am safe!')).toBeInTheDocument();
    });

    it('does not show error UI when no error occurs', () => {
      render(
        <ErrorBoundary>
          <SafeComponent />
        </ErrorBoundary>
      );

      expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /reload page/i })).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('shows error UI when a child component throws', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.getByText('Test error message')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reload page/i })).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('displays the error message from the thrown error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowError message="Custom error message" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom error message')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('displays default error message when error has no message', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowNoMessage />
        </ErrorBoundary>
      );

      expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('displays error icon', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      // Check for the SVG icon (looking for a specific class or role)
      const errorIcon = document.querySelector('.text-red-600');
      expect(errorIcon).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('handles different error types', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowTypeError />
        </ErrorBoundary>
      );

      expect(screen.getByText('Type error message')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe('Recovery', () => {
    it('has a reload button that calls window.location.reload', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const reloadButton = screen.getByRole('button', { name: /reload page/i });
      await user.click(reloadButton);

      expect(mockReload).toHaveBeenCalledTimes(1);

      consoleSpy.mockRestore();
    });

    it('reload button is properly styled', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const reloadButton = screen.getByRole('button', { name: /reload page/i });
      expect(reloadButton).toHaveClass('bg-indigo-600');
      expect(reloadButton).toHaveClass('text-white');
      expect(reloadButton).toHaveClass('rounded-xl');
      expect(reloadButton).toHaveClass('font-semibold');

      consoleSpy.mockRestore();
    });
  });

  describe('Styling', () => {
    it('applies correct dark mode classes to error UI', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const container = screen.getByText(/something went wrong/i).closest('.min-h-screen');
      expect(container).toHaveClass('dark:bg-gray-950');

      consoleSpy.mockRestore();
    });

    it('applies correct error container styling', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const errorIcon = document.querySelector('.w-20.h-20');
      expect(errorIcon).toHaveClass('rounded-full');
      expect(errorIcon).toHaveClass('bg-red-100');
      expect(errorIcon).toHaveClass('dark:bg-red-900/30');

      consoleSpy.mockRestore();
    });

    it('displays the correct heading', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByRole('heading', { name: /something went wrong/i })).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe('Nested Components', () => {
    it('works with nested components', () => {
      function NestedComponent() {
        return (
          <div data-testid="nested">
            <SafeComponent />
          </div>
        );
      }

      render(
        <ErrorBoundary>
          <NestedComponent />
        </ErrorBoundary>
      );

      expect(screen.getByTestId('nested')).toBeInTheDocument();
      expect(screen.getByTestId('safe-component')).toBeInTheDocument();
    });

    it('catches errors in nested components', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      function NestedWithError() {
        return (
          <div>
            <SafeComponent />
            <ThrowError />
          </div>
        );
      }

      render(
        <ErrorBoundary>
          <NestedWithError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      expect(screen.getByText('Test error message')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe('Multiple ErrorBoundaries', () => {
    it('only the error boundary containing the error shows error UI', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <div>
          <ErrorBoundary>
            <SafeComponent />
          </ErrorBoundary>
          <ErrorBoundary>
            <ThrowError />
          </ErrorBoundary>
        </div>
      );

      expect(screen.getByTestId('safe-component')).toBeInTheDocument();
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('handles error with null message gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Create a custom error with null message
      const nullError = new Error();
      nullError.message = null as unknown as string;

      function ThrowNullError() {
        throw nullError;
        return <div>This won't render</div>;
      }

      render(
        <ErrorBoundary>
          <ThrowNullError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('handles non-Error objects gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      function ThrowString() {
        throw 'String error';
        return <div>This won't render</div>;
      }

      render(
        <ErrorBoundary>
          <ThrowString />
        </ErrorBoundary>
      );

      // The error boundary will catch it but might not display a message
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('recovers correctly after reload', () => {
      // This test verifies the reload functionality exists
      // The actual recovery after reload would happen in the browser
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      const reloadButton = screen.getByRole('button', { name: /reload page/i });
      expect(reloadButton).toBeInTheDocument();

      // We can't test the actual reload in jsdom, but we can verify the click handler exists
      expect(mockReload).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('getDerivedStateFromError', () => {
    it('updates state correctly when error is thrown', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('stores the error in state', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <ThrowError message="Stored error message" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Stored error message')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });
});
