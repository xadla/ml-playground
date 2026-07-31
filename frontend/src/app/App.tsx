import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

// Static imports – always needed immediately
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AuthProvider } from '@/contexts/AuthContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import PageLoader from '@/components/PageLoader';
import CookieConsent from 'react-cookie-consent';

// Lazy‑loaded pages (code‑split per route)
const Home = lazy(() => import('@/pages/Home/Home'));
const Health = lazy(() => import('@/pages/Health/Health'));
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const SignupPage = lazy(() => import('@/features/auth/pages/SignupPage'));
const VerifyEmailPage = lazy(() => import('@/features/auth/pages/VerifyEmailPage'));
const ResendVerificationPage = lazy(() => import('@/features/auth/pages/ResendVerificationPage'));
const Dashboard = lazy(() => import('@/pages/Dashboard/Dashboard'));
const Profile = lazy(() => import('@/pages/Profile/Profile'));
const NewExperiment = lazy(() => import('@/features/experiments/pages/NewExperiment'));
const ExperimentDetail = lazy(() => import('@/features/experiments/pages/ExperimentDetail'));
const BuiltinDatasets = lazy(() => import('@/features/datasets/pages/BuiltinDatasets'));
const UploadDataset = lazy(() => import('@/features/datasets/pages/UploadDataset'));
const HistoryList = lazy(() => import('@/features/history/pages/HistoryList'));
const Compare = lazy(() => import('@/features/history/pages/Compare'));
const NotFound = lazy(() => import('@/pages/Errors/NotFound'));
const ServerError = lazy(() => import('@/pages/Errors/ServerError'));
const Unauthorized = lazy(() => import('@/pages/Errors/Unauthorized'));
const Forbidden = lazy(() => import('@/pages/Errors/Forbidden'));
const Maintenance = lazy(() => import('@/pages/Errors/Maintenance'));

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route element={<MainLayout />}>
                {/* Public routes */}
                <Route index element={<Home />} />
                <Route path="health" element={<Health />} />
                <Route path="login" element={<LoginPage />} />
                <Route path="signup" element={<SignupPage />} />
                <Route path="verify-email" element={<VerifyEmailPage />} />
                <Route path="resend-verification" element={<ResendVerificationPage />} />
                <Route path="datasets/builtin" element={<BuiltinDatasets />} />

                {/* Protected routes */}
                <Route
                  path="dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="experiments/new"
                  element={
                    <ProtectedRoute>
                      <NewExperiment />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="experiments/:id"
                  element={
                    <ProtectedRoute>
                      <ExperimentDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="datasets/upload"
                  element={
                    <ProtectedRoute>
                      <UploadDataset />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="history"
                  element={
                    <ProtectedRoute>
                      <HistoryList />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="history/compare"
                  element={
                    <ProtectedRoute>
                      <Compare />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route path="500" element={<ServerError />} />
                <Route path="401" element={<Unauthorized />} />
                <Route path="403" element={<Forbidden />} />
                <Route path="503" element={<Maintenance />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Suspense>
          <CookieConsent
            location="bottom"
            buttonText="Accept"
            declineButtonText="Decline"
            enableDeclineButton
            cookieName="ml_playground_cookie_consent"
            style={{ background: '#1e1b4b' }}
            buttonStyle={{
              background: '#6366f1',
              color: '#fff',
              fontSize: '14px',
              borderRadius: '0.75rem',
            }}
            declineButtonStyle={{
              background: '#4b5563',
              color: '#fff',
              fontSize: '14px',
              borderRadius: '0.75rem',
            }}
          >
            This website uses cookies to enhance the user experience. See our{' '}
            <a href="/privacy" className="underline text-indigo-300">
              Privacy Policy
            </a>
            .
          </CookieConsent>
        </AuthProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
