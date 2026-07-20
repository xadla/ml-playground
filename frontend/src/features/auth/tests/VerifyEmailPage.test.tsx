import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

// Mock useNavigate at the module level
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Setup MSW server
const server = setupServer(
  http.get('/auth/verify-email', ({ request }) => {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (token === 'valid-token') {
      return HttpResponse.json({
        message: 'Email verified. Account created successfully.',
        access_token: 'mock-token-456',
        token_type: 'bearer',
      });
    }
    return HttpResponse.json({ message: 'Invalid or expired token' }, { status: 400 });
  }),

  http.get('/auth/me', () => {
    return HttpResponse.json({
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
    });
  })
);

describe('VerifyEmailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    localStorage.clear();
    // Reset window location
    Object.defineProperty(window, 'location', {
      value: { ...window.location, search: '' },
      writable: true,
    });
  });

  beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
  afterAll(() => server.close());
  afterEach(() => server.resetHandlers());

  const renderComponent = (token: string | null = null) => {
    const searchParams = token ? `?token=${token}` : '';
    Object.defineProperty(window, 'location', {
      value: { ...window.location, search: searchParams },
      writable: true,
    });

    return render(
      <BrowserRouter>
        <AuthProvider>
          <VerifyEmailPage />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  // 1. Test loading state
  it('shows loading spinner when verifying', () => {
    renderComponent('valid-token');
    expect(screen.getByText('Verifying your email')).toBeInTheDocument();
    expect(screen.getByText('This will only take a moment.')).toBeInTheDocument();
  });

  // 2. Test success state
  it('shows success message and redirects with valid token', async () => {
    renderComponent('valid-token');

    await waitFor(
      () => {
        expect(screen.getByText('Email verified!')).toBeInTheDocument();
        expect(
          screen.getByText("You're all set. Redirecting to your dashboard...")
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    expect(localStorage.setItem).toHaveBeenCalledWith('access_token', 'mock-token-456');

    // Wait for the redirect (1500ms delay in component)
    await waitFor(
      () => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
      },
      { timeout: 3000 }
    );
  });

  // 3. Test error state - no token
  it('shows error when no token is provided', async () => {
    renderComponent(null);

    await waitFor(() => {
      expect(screen.getByText('Verification failed')).toBeInTheDocument();
      expect(
        screen.getByText('No verification token found. The link may be broken.')
      ).toBeInTheDocument();
    });
  });

  // 4. Test error state - invalid token
  it('shows error with invalid token', async () => {
    renderComponent('invalid-token');

    await waitFor(() => {
      expect(screen.getByText('Verification failed')).toBeInTheDocument();
      // The actual error message from the API
      const errorMessage = screen.getByText('Request failed with status code 400');
      expect(errorMessage).toBeInTheDocument();
    });
  });

  // 5. Test resend verification link appears on error
  it('shows resend verification link on error', async () => {
    renderComponent('invalid-token');

    await waitFor(() => {
      const resendLink = screen.getByText('Resend verification email');
      expect(resendLink).toBeInTheDocument();
      expect(resendLink.closest('a')).toHaveAttribute('href', '/resend-verification');
    });
  });

  // 6. Test manual navigation button works on success
  it('allows manual navigation to dashboard after success', async () => {
    renderComponent('valid-token');

    await waitFor(
      () => {
        expect(screen.getByText('Email verified!')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    const dashboardButton = screen.getByText('Go to Dashboard now');
    dashboardButton.click();

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  // 7. Test decorative panel renders
  it('renders decorative panel', () => {
    renderComponent('valid-token');
    expect(screen.getByText('Almost there')).toBeInTheDocument();
    expect(screen.getByText(/Verifying your email gives you access/i)).toBeInTheDocument();
  });
});
