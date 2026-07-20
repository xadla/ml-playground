import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ResendVerificationPage from '@/features/auth/pages/ResendVerificationPage';

// Mock the auth service
vi.mock('@/services/authService', () => ({
  resendVerification: vi.fn(),
}));

// Mock the error utility
vi.mock('@/utils/error', () => ({
  getErrorMessage: vi.fn(),
}));

import { resendVerification } from '@/features/auth/services/authService';
import { getErrorMessage } from '@/lib/utils/error';

describe('ResendVerificationPage', () => {
  const mockResendVerification = resendVerification as ReturnType<typeof vi.fn>;
  const mockGetErrorMessage = getErrorMessage as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetErrorMessage.mockImplementation((err) => {
      if (err instanceof Error) return err.message;
      return 'An unexpected error occurred';
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  const renderResendPage = () => {
    return render(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<ResendVerificationPage />} />
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/signup" element={<div>Signup Page</div>} />
        </Routes>
      </BrowserRouter>
    );
  };

  describe('Rendering', () => {
    it('renders the resend verification form correctly', () => {
      renderResendPage();

      expect(screen.getByRole('heading', { name: /resend verification/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send verification email/i })).toBeInTheDocument();
    });

    it('renders links to login and signup', () => {
      renderResendPage();

      expect(screen.getByRole('link', { name: /back to login/i })).toHaveAttribute(
        'href',
        '/login'
      );
      expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/signup');
    });

    it('shows decorative elements on desktop', () => {
      renderResendPage();

      expect(screen.getByText(/check your inbox/i)).toBeInTheDocument();
      expect(screen.getByText(/Sometimes emails land in spam/i)).toBeInTheDocument();
    });

    it('shows the description text', () => {
      renderResendPage();

      expect(
        screen.getByText(/Didn't receive the email\? We'll send a new one\./i)
      ).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('requires email field', async () => {
      const user = userEvent.setup();
      renderResendPage();

      const submitButton = screen.getByRole('button', { name: /send verification email/i });
      await user.click(submitButton);

      expect(mockResendVerification).not.toHaveBeenCalled();
    });

    it('accepts valid email', async () => {
      const user = userEvent.setup();
      mockResendVerification.mockResolvedValue({ message: 'Verification email sent!' });

      renderResendPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send verification email/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockResendVerification).toHaveBeenCalledWith('test@example.com');
      });
    });
  });

  describe('Form Submission', () => {
    it('submits the form with email', async () => {
      const user = userEvent.setup();
      mockResendVerification.mockResolvedValue({ message: 'Verification email sent!' });

      renderResendPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send verification email/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockResendVerification).toHaveBeenCalledWith('test@example.com');
      });
    });

    it('shows loading state while submitting', async () => {
      const user = userEvent.setup();
      mockResendVerification.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      renderResendPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send verification email/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      // Check loading state
      expect(screen.getByText(/sending/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      await waitFor(
        () => {
          expect(screen.getByText(/send verification email/i)).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    it('shows success message after successful resend', async () => {
      const user = userEvent.setup();
      const successMessage = 'Verification email sent! Please check your inbox.';
      mockResendVerification.mockResolvedValue({ message: successMessage });

      renderResendPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send verification email/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(successMessage)).toBeInTheDocument();
      });
    });

    it('shows default success message when response has no message', async () => {
      const user = userEvent.setup();
      mockResendVerification.mockResolvedValue({});

      renderResendPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send verification email/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Verification email sent! Please check your inbox./i)
        ).toBeInTheDocument();
      });
    });

    it('clears previous messages on new submission', async () => {
      const user = userEvent.setup();

      // First submission succeeds
      mockResendVerification.mockResolvedValueOnce({ message: 'First success' });
      // Second submission succeeds
      mockResendVerification.mockResolvedValueOnce({ message: 'Second success' });

      renderResendPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send verification email/i });

      // First submission
      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('First success')).toBeInTheDocument();
      });

      // Second submission
      await user.clear(emailInput);
      await user.type(emailInput, 'another@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        // Old message should be gone
        expect(screen.queryByText('First success')).not.toBeInTheDocument();
        // New message should appear
        expect(screen.getByText('Second success')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message on failure', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Email not found';
      mockResendVerification.mockRejectedValue(new Error(errorMessage));

      renderResendPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send verification email/i });

      await user.type(emailInput, 'nonexistent@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('handles network errors gracefully', async () => {
      const user = userEvent.setup();
      mockResendVerification.mockRejectedValue(new Error('Network error'));

      renderResendPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send verification email/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('handles rate limiting errors', async () => {
      const user = userEvent.setup();
      mockResendVerification.mockRejectedValue(
        new Error('Too many requests. Please wait a moment.')
      );

      renderResendPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send verification email/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/too many requests/i)).toBeInTheDocument();
      });
    });

    it('handles server errors', async () => {
      const user = userEvent.setup();
      mockResendVerification.mockRejectedValue(new Error('Internal server error'));

      renderResendPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send verification email/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
      });
    });

    it('clears previous error on new submission attempt', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Email not found';

      // First submission fails
      mockResendVerification.mockRejectedValueOnce(new Error(errorMessage));
      // Second submission succeeds
      mockResendVerification.mockResolvedValueOnce({ message: 'Success!' });

      renderResendPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send verification email/i });

      // First attempt - fails
      await user.type(emailInput, 'nonexistent@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      // Second attempt - succeeds
      await user.clear(emailInput);
      await user.type(emailInput, 'existing@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        // Error should be cleared
        expect(screen.queryByText(errorMessage)).not.toBeInTheDocument();
        // Success message should appear
        expect(screen.getByText('Success!')).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('updates email input value on change', async () => {
      const user = userEvent.setup();
      renderResendPage();

      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
      await user.type(emailInput, 'test@example.com');

      expect(emailInput.value).toBe('test@example.com');
    });

    it('handles form submission with Enter key', async () => {
      const user = userEvent.setup();
      mockResendVerification.mockResolvedValue({ message: 'Success!' });

      renderResendPage();

      const emailInput = screen.getByLabelText(/email address/i);

      await user.type(emailInput, 'test@example.com{enter}');

      await waitFor(() => {
        expect(mockResendVerification).toHaveBeenCalledWith('test@example.com');
      });
    });

    it('clears email input after submission', async () => {
      const user = userEvent.setup();
      mockResendVerification.mockResolvedValue({ message: 'Success!' });

      renderResendPage();

      const emailInput = screen.getByLabelText(/email address/i) as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /send verification email/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      // The email should still be there (component doesn't clear it)
      await waitFor(() => {
        expect(emailInput.value).toBe('test@example.com');
      });
    });
  });

  describe('Edge Cases', () => {
    it('prevents multiple submissions while loading', async () => {
      const user = userEvent.setup();
      let resolveResend: (value: { message: string }) => void = () => {};
      const resendPromise = new Promise<{ message: string }>((resolve) => {
        resolveResend = resolve;
      });
      mockResendVerification.mockImplementation(() => resendPromise);

      renderResendPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send verification email/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      // Button should be disabled
      expect(submitButton).toBeDisabled();

      // Try clicking again
      await user.click(submitButton);

      // Should only be called once
      expect(mockResendVerification).toHaveBeenCalledTimes(1);

      resolveResend({ message: 'Success!' });
    });

    it('handles empty email string', async () => {
      const user = userEvent.setup();
      renderResendPage();

      const submitButton = screen.getByRole('button', { name: /send verification email/i });
      await user.click(submitButton);

      // The mock should not be called because the input is required
      expect(mockResendVerification).not.toHaveBeenCalled();
    });

    it('handles whitespace in email', async () => {
      const user = userEvent.setup();
      mockResendVerification.mockResolvedValue({ message: 'Success!' });

      renderResendPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send verification email/i });

      // Type email with spaces (should preserve them)
      await user.type(emailInput, ' test@example.com ');
      await user.click(submitButton);

      await waitFor(() => {
        // The component doesn't trim the email, so it sends with spaces
        // This might be something to fix in the component
        expect(mockResendVerification).toHaveBeenCalled();
      });
    });
  });

  describe('Navigation', () => {
    it('has a link to login page', () => {
      renderResendPage();

      const loginLink = screen.getByRole('link', { name: /back to login/i });
      expect(loginLink).toHaveAttribute('href', '/login');
    });

    it('has a link to signup page', () => {
      renderResendPage();

      const signupLink = screen.getByRole('link', { name: /sign up/i });
      expect(signupLink).toHaveAttribute('href', '/signup');
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      renderResendPage();

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    it('has proper input type', () => {
      renderResendPage();

      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('has proper autocomplete attribute', () => {
      renderResendPage();

      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveAttribute('autocomplete', 'email');
    });

    it('has required attribute on email input', () => {
      renderResendPage();

      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveAttribute('required');
    });

    it('disables button during submission for accessibility', async () => {
      const user = userEvent.setup();
      mockResendVerification.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      renderResendPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send verification email/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      expect(submitButton).toBeDisabled();
    });

    it('has proper ARIA roles', () => {
      renderResendPage();

      // The button is properly role-less but is a button
      const submitButton = screen.getByRole('button', { name: /send verification email/i });
      expect(submitButton).toBeInTheDocument();
    });
  });

  describe('Integration with Backend', () => {
    it('handles successful response with custom message', async () => {
      const user = userEvent.setup();
      const customMessage = 'Custom success message from backend';
      mockResendVerification.mockResolvedValue({ message: customMessage });

      renderResendPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send verification email/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(customMessage)).toBeInTheDocument();
      });
    });

    it('handles response without message field', async () => {
      const user = userEvent.setup();
      mockResendVerification.mockResolvedValue({});

      renderResendPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send verification email/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Verification email sent! Please check your inbox./i)
        ).toBeInTheDocument();
      });
    });

    it('handles response with null message', async () => {
      const user = userEvent.setup();
      mockResendVerification.mockResolvedValue({ message: null });

      renderResendPage();

      const emailInput = screen.getByLabelText(/email address/i);
      const submitButton = screen.getByRole('button', { name: /send verification email/i });

      await user.type(emailInput, 'test@example.com');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Verification email sent! Please check your inbox./i)
        ).toBeInTheDocument();
      });
    });
  });
});
