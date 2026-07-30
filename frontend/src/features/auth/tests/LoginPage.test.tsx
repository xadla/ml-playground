import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderWithProviders } from '@/test/test-utils';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/features/auth/pages/LoginPage';

// Mock the auth context BEFORE importing useAuth
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from '@/contexts/AuthContext';

// Mock react-router-dom's useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('LoginPage', () => {
  const mockLoginAction = vi.fn();
  const mockUseAuth = useAuth as unknown as vi.Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();

    // Mock useAuth with default values
    mockUseAuth.mockReturnValue({
      loginAction: mockLoginAction,
      isLoading: false,
      isAuthenticated: false,
      user: null,
      token: null,
      signupAction: vi.fn(),
      logoutAction: vi.fn(),
      setTokenAndUser: vi.fn(),
    });
  });

  // Simplified render - custom render handles all providers and routing
  const renderLoginPage = () => {
    return renderWithProviders(<LoginPage />, { route: '/' });
  };

  describe('Rendering', () => {
    it('renders the login form correctly', () => {
      renderLoginPage();

      expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('renders links to signup and resend verification', () => {
      renderLoginPage();

      expect(screen.getByRole('link', { name: /create one/i })).toHaveAttribute('href', '/signup');
      expect(screen.getByRole('link', { name: /resend verification email/i })).toHaveAttribute(
        'href',
        '/resend-verification'
      );
    });

    it('shows decorative elements on desktop', () => {
      renderLoginPage();
      expect(screen.getByText(/ML Playground/i)).toBeInTheDocument();
      expect(screen.getByText(/Pick up where you left off/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('requires email field', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      // HTML5 validation will prevent submission
      expect(mockLoginAction).not.toHaveBeenCalled();
    });

    it('requires password field', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      expect(mockLoginAction).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('submits the form with email and password', async () => {
      const user = userEvent.setup();
      mockLoginAction.mockResolvedValue(undefined);

      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockLoginAction).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('shows loading state while submitting', async () => {
      const user = userEvent.setup();
      // Make loginAction slow to test loading state
      mockLoginAction.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Check loading state
      expect(screen.getByText(/signing in/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      await waitFor(
        () => {
          expect(screen.getByText(/sign in/i)).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it('navigates to dashboard on successful login', async () => {
      const user = userEvent.setup();
      mockLoginAction.mockResolvedValue(undefined);

      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message on login failure', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Invalid credentials. Please try again.';
      mockLoginAction.mockRejectedValue(new Error(errorMessage));

      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('handles network errors gracefully', async () => {
      const user = userEvent.setup();
      mockLoginAction.mockRejectedValue(new Error('Network error'));

      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('updates email input value on change', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
      await user.type(emailInput, 'test@example.com');

      expect(emailInput.value).toBe('test@example.com');
    });

    it('updates password input value on change', async () => {
      const user = userEvent.setup();
      renderLoginPage();

      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      await user.type(passwordInput, 'password123');

      expect(passwordInput.value).toBe('password123');
    });

    it('handles form submission with Enter key', async () => {
      const user = userEvent.setup();
      mockLoginAction.mockResolvedValue(undefined);

      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123{enter}');

      await waitFor(() => {
        expect(mockLoginAction).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });
  });

  describe('Edge Cases', () => {
    it('clears previous error on new submission attempt', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Invalid credentials';

      // First submission fails
      mockLoginAction.mockRejectedValueOnce(new Error(errorMessage));
      // Second submission succeeds
      mockLoginAction.mockResolvedValueOnce(undefined);

      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      // First attempt - fails
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      // Second attempt - succeeds
      await user.clear(emailInput);
      await user.clear(passwordInput);
      await user.type(emailInput, 'correct@example.com');
      await user.type(passwordInput, 'correctpassword');
      await user.click(submitButton);

      await waitFor(() => {
        // Error should be cleared
        expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
      });
    });

    it('prevents multiple submissions while loading', async () => {
      const user = userEvent.setup();
      let resolveLogin: (value: void) => void = () => {};
      const loginPromise = new Promise<void>((resolve) => {
        resolveLogin = resolve;
      });
      mockLoginAction.mockImplementation(() => loginPromise);

      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Button should be disabled
      expect(submitButton).toBeDisabled();

      // Try clicking again
      await user.click(submitButton);

      // Should only be called once
      expect(mockLoginAction).toHaveBeenCalledTimes(1);

      resolveLogin();
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      renderLoginPage();

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('has proper input types', () => {
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(emailInput).toHaveAttribute('type', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('has proper autocomplete attributes', () => {
      renderLoginPage();

      expect(screen.getByLabelText(/email address/i)).toHaveAttribute('autocomplete', 'email');
      expect(screen.getByLabelText(/password/i)).toHaveAttribute(
        'autocomplete',
        'current-password'
      );
    });

    it('disables button during submission for accessibility', async () => {
      const user = userEvent.setup();
      mockLoginAction.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

      renderLoginPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      expect(submitButton).toBeDisabled();
    });
  });
});
