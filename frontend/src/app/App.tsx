import { Routes, Route } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import Home from '@/pages/Home/Home';
import Health from '@/pages/Health/Health';
import LoginPage from '@/features/auth/pages/LoginPage';
import SignupPage from '@/features/auth/pages/SignupPage';
import VerifyEmailPage from '@/features/auth/pages/VerifyEmailPage';
import ResendVerificationPage from '@/features/auth/pages/ResendVerificationPage';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AuthProvider } from '@/contexts/AuthContext';
import NewExperiment from '@/features/experiments/pages/NewExperiment';
import ExperimentDetail from '@/features/experiments/pages/ExperimentDetail';
import BuiltinDatasets from '@/features/datasets/pages/BuiltinDatasets';
import UploadDataset from '@/features/datasets/pages/UploadDataset';
import HistoryList from '@/features/history/pages/HistoryList';
import Compare from '@/features/history/pages/Compare';
import Profile from '@/pages/Profile/Profile';
import Dashboard from '@/pages/Dashboard/Dashboard';
import ErrorBoundary from '@/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
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
          </Route>
        </Routes>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
