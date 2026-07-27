import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { verifyEmail } from '@/features/auth/services/authService';
import { getMe } from '@/features/auth/services/authService';
import { getErrorMessage } from '@/lib/utils/error';
import { Helmet } from 'react-helmet-async';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { setTokenAndUser } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      // Check token inside the async function
      if (!token) {
        setStatus('error');
        setMessage('No verification token found. The link may be broken.');
        return;
      }

      try {
        const verifyRes = await verifyEmail(token);
        if (cancelled) return;
        localStorage.setItem('access_token', verifyRes.access_token);
        const user = await getMe();
        if (cancelled) return;

        setTokenAndUser(verifyRes.access_token, user);

        setStatus('success');
        setTimeout(() => navigate('/dashboard'), 1500);
      } catch (err) {
        if (cancelled) return;
        // Clean up if anything fails
        localStorage.removeItem('access_token');
        setStatus('error');
        setMessage(getErrorMessage(err));
      }
    };

    verify();

    return () => {
      cancelled = true;
    };
  }, [token, navigate, setTokenAndUser]);

  return (
    <>
      <Helmet>
        <title>Verify Email – ML Playground</title>
      </Helmet>
      <div className="min-h-screen flex">
        {/* Left side – status card */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-white dark:bg-gray-900">
          <div className="w-full max-w-md space-y-8 text-center">
            {/* Loading state */}
            {status === 'loading' && (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <svg
                    className="animate-spin h-16 w-16 text-indigo-600"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Verifying your email
                </h2>
                <p className="text-gray-600 dark:text-gray-400">This will only take a moment.</p>
              </div>
            )}

            {/* Success state */}
            {status === 'success' && (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-green-600 dark:text-green-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Email verified!
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  You're all set. Redirecting to your dashboard...
                </p>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-200"
                >
                  Go to Dashboard now
                </button>
              </div>
            )}

            {/* Error state */}
            {status === 'error' && (
              <div className="space-y-6">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-red-600 dark:text-red-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Verification failed
                </h2>
                <p className="text-gray-600 dark:text-gray-400">{message}</p>
                <Link
                  to="/resend-verification"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-semibold rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-all duration-200"
                >
                  Resend verification email
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right side – decorative panel */}
        <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-indigo-600 to-purple-700 relative overflow-hidden">
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-pink-300/20 rounded-full blur-2xl" />
          <div className="absolute top-40 right-20 w-40 h-40 bg-yellow-200/20 rounded-full blur-xl" />

          <div className="relative flex flex-col justify-center items-center text-white p-12 w-full">
            <div className="max-w-md text-center">
              <div className="mb-8">
                <svg
                  className="w-20 h-20 mx-auto text-white/90"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-4xl font-bold mb-4">Almost there</h2>
              <p className="text-lg text-indigo-100">
                Verifying your email gives you access to all features, including saving experiments
                and tracking history.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default VerifyEmailPage;
