import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

// Static imports – always needed immediately
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AuthProvider } from '@/contexts/AuthContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import PageLoader from '@/components/PageLoader';

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
              </Route>
            </Routes>
          </Suspense>
        </AuthProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
