import { Routes, Route } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import Home from '@/pages/Home';
import Health from '@/pages/Health';
import LoginPage from '@/pages/auth/LoginPage';
import SignupPage from '@/pages/auth/SignupPage';
import VerifyEmailPage from '@/pages/auth/VerifyEmailPage';
import ResendVerificationPage from '@/pages/auth/ResendVerificationPage';
import ProtectedRoute from '@/components/ProtectedRoute';
import { AuthProvider } from '@/contexts/AuthContext';
import NewExperiment from '@/pages/experiments/NewExperiment';
import ExperimentDetail from '@/pages/experiments/ExperimentDetail';
import BuiltinDatasets from '@/pages/datasets/BuiltinDatasets';
import UploadDataset from '@/pages/datasets/UploadDataset';

function App() {
  return (
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

          {/* Protected routes */}
          <Route
            path="dashboard"
            element={
              <ProtectedRoute>
                <div className="p-8 text-center">
                  <h2 className="text-2xl font-bold">Dashboard</h2>
                  <p>Welcome! Your protected content goes here.</p>
                </div>
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
  );
}

export default App;
