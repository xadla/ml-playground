import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import SignupPage from '@/features/auth/pages/SignupPage';

// Mock the auth context BEFORE importing useAuth
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

// Import after mocking
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

describe('SignupPage', () => {
  const mockSignupAction = vi.fn();
  const mockUseAuth = useAuth as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    mockNavigate.mockClear();

    // Mock useAuth with default values
    mockUseAuth.mockReturnValue({
      signupAction: mockSignupAction,
      isLoading: false,
      isAuthenticated: false,
      user: null,
      token: null,
      loginAction: vi.fn(),
      logoutAction: vi.fn(),
      setTokenAndUser: vi.fn(),
    });
  });

  // Simplified render - custom render handles all providers and routing
  const renderSignupPage = () => {
    return renderWithProviders(<SignupPage />, { route: '/' });
  };

  describe('Rendering', () => {
    it('renders the signup form correctly', () => {
      renderSignupPage();

      expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('renders link to login page', () => {
      renderSignupPage();

      expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login');
    });

    it('shows password requirements', () => {
      renderSignupPage();

      expect(screen.getByText(/must be at least 8 characters/i)).toBeInTheDocument();
    });

    it('shows decorative elements on desktop', () => {
      renderSignupPage();

      expect(screen.getByText(/ML Playground/i)).toBeInTheDocument();
      expect(screen.getByText(/Draw datasets, train models/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('requires email field', async () => {
      const user = userEvent.setup();
      renderSignupPage();

      const submitButton = screen.getByRole('button', { name: /create account/i });

      // Use click instead of form submit to trigger validation
      await user.click(submitButton);

      // HTML5 validation will prevent submission
      expect(mockSignupAction).not.toHaveBeenCalled();
    });

    it('requires password field', async () => {
      const user = userEvent.setup();
      renderSignupPage();

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      expect(mockSignupAction).not.toHaveBeenCalled();
    });

    it('requires password to be at least 8 characters', async () => {
      const user = userEvent.setup();
      // Mock the form submission to prevent actual submission
      const originalSubmit = HTMLFormElement.prototype.submit;
      HTMLFormElement.prototype.submit = vi.fn();

      renderSignupPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'short');

      // Check that the minLength attribute is set
      expect(passwordInput).toHaveAttribute('minLength', '8');

      // Try to submit - HTML5 validation should prevent it
      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      // Restore original
      HTMLFormElement.prototype.submit = originalSubmit;
    });

    it('accepts password with 8 or more characters', async () => {
      const user = userEvent.setup();
      mockSignupAction.mockResolvedValue({ email: 'test@example.com' });

      renderSignupPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignupAction).toHaveBeenCalled();
      });
    });
  });

  describe('Form Submission', () => {
    it('submits the form with email and password', async () => {
      const user = userEvent.setup();
      mockSignupAction.mockResolvedValue({ email: 'test@example.com' });

      renderSignupPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSignupAction).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('shows loading state while submitting', async () => {
      const user = userEvent.setup();
      mockSignupAction.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

      renderSignupPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Check loading state
      expect(screen.getByText(/creating account/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      await waitFor(
        () => {
          expect(screen.getByText(/create account/i)).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it('shows success message after successful signup', async () => {
      const user = userEvent.setup();
      const email = 'test@example.com';
      mockSignupAction.mockResolvedValue({ email });

      renderSignupPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(emailInput, email);
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/account created!/i)).toBeInTheDocument();
        expect(
          screen.getByText(new RegExp(`verification email to ${email}`, 'i'))
        ).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /go to login/i })).toHaveAttribute(
          'href',
          '/login'
        );
      });
    });

    it('hides the form when success message is shown', async () => {
      const user = userEvent.setup();
      mockSignupAction.mockResolvedValue({ email: 'test@example.com' });

      renderSignupPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        // Form should be hidden
        expect(screen.queryByLabelText(/email address/i)).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /create account/i })).not.toBeInTheDocument();

        // Success message should be visible
        expect(screen.getByText(/account created!/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message on signup failure', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Email already exists';
      mockSignupAction.mockRejectedValue(new Error(errorMessage));

      renderSignupPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(emailInput, 'existing@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('handles network errors gracefully', async () => {
      const user = userEvent.setup();
      mockSignupAction.mockRejectedValue(new Error('Network error'));

      renderSignupPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('handles validation errors from backend', async () => {
      const user = userEvent.setup();
      mockSignupAction.mockRejectedValue(new Error('Password must be at least 8 characters'));

      renderSignupPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'short');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('handles server errors (500)', async () => {
      const user = userEvent.setup();
      mockSignupAction.mockRejectedValue(new Error('Internal server error'));

      renderSignupPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('updates email input value on change', async () => {
      const user = userEvent.setup();
      renderSignupPage();

      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
      await user.type(emailInput, 'test@example.com');

      expect(emailInput.value).toBe('test@example.com');
    });

    it('updates password input value on change', async () => {
      const user = userEvent.setup();
      renderSignupPage();

      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      await user.type(passwordInput, 'password123');

      expect(passwordInput.value).toBe('password123');
    });

    it('handles form submission with Enter key', async () => {
      const user = userEvent.setup();
      mockSignupAction.mockResolvedValue({ email: 'test@example.com' });

      renderSignupPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123{enter}');

      await waitFor(() => {
        expect(mockSignupAction).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });
  });

  describe('Edge Cases', () => {
    it('clears previous error on new submission attempt', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Email already exists';

      // First submission fails
      mockSignupAction.mockRejectedValueOnce(new Error(errorMessage));
      // Second submission succeeds
      mockSignupAction.mockResolvedValueOnce({ email: 'test@example.com' });

      renderSignupPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      // First attempt - fails
      await user.type(emailInput, 'existing@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      // Second attempt - succeeds
      await user.clear(emailInput);
      await user.clear(passwordInput);
      await user.type(emailInput, 'new@example.com');
      await user.type(passwordInput, 'newpassword123');
      await user.click(submitButton);

      await waitFor(() => {
        // Error should be cleared
        expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
        // Success message should appear
        expect(screen.getByText(/account created!/i)).toBeInTheDocument();
      });
    });

    it('prevents multiple submissions while loading', async () => {
      const user = userEvent.setup();
      let resolveSignup: (value: { email: string }) => void = () => {};
      const signupPromise = new Promise<{ email: string }>((resolve) => {
        resolveSignup = resolve;
      });
      mockSignupAction.mockImplementation(() => signupPromise);

      renderSignupPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Button should be disabled
      expect(submitButton).toBeDisabled();

      // Try clicking again
      await user.click(submitButton);

      // Should only be called once
      expect(mockSignupAction).toHaveBeenCalledTimes(1);

      resolveSignup({ email: 'test@example.com' });
    });

    it('handles empty response from signup gracefully', async () => {
      const user = userEvent.setup();
      // Mock signupAction to return undefined
      mockSignupAction.mockResolvedValue(undefined);

      renderSignupPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      // Wait for the error to appear (since response.email will be undefined)
      await waitFor(() => {
        // Should show an error because response is undefined
        expect(screen.getByText(/Cannot read properties of undefined/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      renderSignupPage();

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('has proper input types', () => {
      renderSignupPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(emailInput).toHaveAttribute('type', 'email');
      expect(passwordInput).toHaveAttribute('type', 'password');
    });

    it('has proper autocomplete attributes', () => {
      renderSignupPage();

      expect(screen.getByLabelText(/email address/i)).toHaveAttribute('autocomplete', 'email');
      expect(screen.getByLabelText(/password/i)).toHaveAttribute('autocomplete', 'new-password');
    });

    it('has proper minLength attribute on password', () => {
      renderSignupPage();

      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute('minLength', '8');
    });

    it('disables button during submission for accessibility', async () => {
      const user = userEvent.setup();
      mockSignupAction.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

      renderSignupPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      expect(submitButton).toBeDisabled();
    });
  });

  describe('Success State', () => {
    it('shows success message with email', async () => {
      const user = userEvent.setup();
      const email = 'test@example.com';
      mockSignupAction.mockResolvedValue({ email });

      renderSignupPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(emailInput, email);
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        const successMessage = screen.getByText(new RegExp(`verification email to ${email}`, 'i'));
        expect(successMessage).toBeInTheDocument();
      });
    });

    it('shows "Go to login" link in success state', async () => {
      const user = userEvent.setup();
      mockSignupAction.mockResolvedValue({ email: 'test@example.com' });

      renderSignupPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(submitButton);

      await waitFor(() => {
        const loginLink = screen.getByRole('link', { name: /go to login/i });
        expect(loginLink).toBeInTheDocument();
        expect(loginLink).toHaveAttribute('href', '/login');
      });
    });
  });
});
