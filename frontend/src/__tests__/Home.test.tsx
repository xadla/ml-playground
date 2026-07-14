import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import Home from '@/pages/Home';

// Mock useAuth
const mockUseAuth = vi.fn();

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderHome = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <Home />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  describe('When user is NOT authenticated', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
      });
    });

    it('renders hero section with title and description', () => {
      renderHome();

      expect(screen.getByText(/Build ML models/i)).toBeInTheDocument();
      expect(screen.getByText(/visually/i)).toBeInTheDocument();
      expect(screen.getByText(/Draw your dataset on an interactive canvas/i)).toBeInTheDocument();
    });

    it('shows "Get Started Free" and "Sign In" buttons for unauthenticated users', () => {
      renderHome();

      const getStartedButton = screen.getByText('Get Started Free');
      expect(getStartedButton).toBeInTheDocument();
      expect(getStartedButton.closest('a')).toHaveAttribute('href', '/signup');

      const signInButton = screen.getByText('Sign In');
      expect(signInButton).toBeInTheDocument();
      expect(signInButton.closest('a')).toHaveAttribute('href', '/login');
    });

    it('does NOT show dashboard or new experiment buttons for unauthenticated users', () => {
      renderHome();

      expect(screen.queryByText('Go to Dashboard')).not.toBeInTheDocument();
      expect(screen.queryByText('New Experiment')).not.toBeInTheDocument();
    });

    it('shows CTA section at the bottom for unauthenticated users', () => {
      renderHome();

      expect(screen.getByText('Ready to start experimenting?')).toBeInTheDocument();
      expect(screen.getByText('Create Free Account')).toBeInTheDocument();
      expect(screen.getByText('Create Free Account').closest('a')).toHaveAttribute(
        'href',
        '/signup'
      );
    });

    it('renders all three feature cards', () => {
      renderHome();

      expect(screen.getByText('Interactive Canvas')).toBeInTheDocument();
      expect(screen.getByText('Top Algorithms')).toBeInTheDocument();
      expect(screen.getByText('Instant Insights')).toBeInTheDocument();
    });

    it('renders "Everything you need" section', () => {
      renderHome();

      expect(screen.getByText('Everything you need')).toBeInTheDocument();
      expect(screen.getByText('Powerful ML tools, simplified.')).toBeInTheDocument();
    });
  });

  describe('When user IS authenticated', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
      });
    });

    it('shows "Go to Dashboard" and "New Experiment" buttons for authenticated users', () => {
      renderHome();

      const dashboardButton = screen.getByText('Go to Dashboard');
      expect(dashboardButton).toBeInTheDocument();
      expect(dashboardButton.closest('a')).toHaveAttribute('href', '/dashboard');

      const newExperimentButton = screen.getByText('New Experiment');
      expect(newExperimentButton).toBeInTheDocument();
      expect(newExperimentButton.closest('a')).toHaveAttribute('href', '/experiments/new');
    });

    it('does NOT show "Get Started Free" or "Sign In" buttons for authenticated users', () => {
      renderHome();

      expect(screen.queryByText('Get Started Free')).not.toBeInTheDocument();
      expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
    });

    it('does NOT show CTA section at the bottom for authenticated users', () => {
      renderHome();

      expect(screen.queryByText('Ready to start experimenting?')).not.toBeInTheDocument();
      expect(screen.queryByText('Create Free Account')).not.toBeInTheDocument();
    });
  });

  describe('UI/UX elements', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
      });
    });

    it('renders decorative canvas illustration', () => {
      renderHome();

      // The canvas container should be present
      const canvasContainer = document.querySelector('.aspect-video');
      expect(canvasContainer).toBeInTheDocument();
    });

    it('renders gradient hero background', () => {
      renderHome();

      const heroSection = document.querySelector('section.relative.overflow-hidden');
      expect(heroSection).toBeInTheDocument();

      // Should have gradient classes
      const gradientDiv = heroSection?.querySelector('.bg-linear-to-br');
      expect(gradientDiv).toBeInTheDocument();
    });

    it('renders feature cards with icons', () => {
      renderHome();

      const featureCards = document.querySelectorAll('.bg-gray-50');
      expect(featureCards.length).toBe(3);

      // Each feature card should have an icon container
      const iconContainers = document.querySelectorAll('.w-12.h-12');
      expect(iconContainers.length).toBe(3);
    });

    it('has proper link attributes for navigation', () => {
      renderHome();

      const getStartedLink = screen.getByText('Get Started Free').closest('a');
      expect(getStartedLink).toHaveAttribute('href', '/signup');

      const signInLink = screen.getByText('Sign In').closest('a');
      expect(signInLink).toHaveAttribute('href', '/login');
    });

    it('renders with proper dark mode classes', () => {
      renderHome();

      // Check for dark mode classes on main container
      const container = document.querySelector('.bg-white.dark\\:bg-gray-950');
      expect(container).toBeInTheDocument();

      // Check for dark mode classes on feature cards
      const featureCard = document.querySelector('.dark\\:bg-gray-800\\/50');
      expect(featureCard).toBeInTheDocument();
    });
  });
});
