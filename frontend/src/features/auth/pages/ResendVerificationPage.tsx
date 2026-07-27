import { useState } from 'react';
import { Link } from 'react-router-dom';
import { resendVerification } from '@/features/auth/services/authService';
import { getErrorMessage } from '@/lib/utils/error';
import { Helmet } from 'react-helmet-async';

const ResendVerificationPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);
    try {
      const res = await resendVerification(email);
      setMessage(res.message || 'Verification email sent! Please check your inbox.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Resend Verification – ML Playground</title>
      </Helmet>
      <div className="min-h-screen flex">
        {/* Left side – Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-white dark:bg-gray-900">
          <div className="w-full max-w-md space-y-8">
            {/* Header */}
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                Resend verification
              </h2>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Didn't receive the email? We'll send a new one.
              </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              {/* Success message */}
              {message && (
                <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-4 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-sm flex items-start gap-2">
                  <svg
                    className="w-5 h-5 mt-0.5 shrink-0"
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
                  <span>{message}</span>
                </div>
              )}

              {/* Error alert */}
              {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-start gap-2">
                  <svg
                    className="w-5 h-5 mt-0.5 shrink-0"
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
                  <span>{error}</span>
                </div>
              )}

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-800 dark:text-white transition duration-150"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Sending...
                  </span>
                ) : (
                  'Send verification email'
                )}
              </button>

              <div className="flex flex-col space-y-2 text-center text-sm text-gray-600 dark:text-gray-400">
                <p>
                  <Link
                    to="/login"
                    className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    Back to login
                  </Link>
                </p>
                <p>
                  Don't have an account?{' '}
                  <Link
                    to="/signup"
                    className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    Sign up
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* Right side – Decorative panel (hidden on mobile) */}
        <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-indigo-600 to-purple-700 relative overflow-hidden">
          {/* Floating geometric shapes */}
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
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-4xl font-bold mb-4">Check your inbox</h2>
              <p className="text-lg text-indigo-100 mb-6">
                Sometimes emails land in spam. Add us to your contacts to ensure delivery.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-indigo-100">
                  <svg
                    className="w-6 h-6 text-indigo-200 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Delivered instantly in most cases</span>
                </div>
                <div className="flex items-center gap-3 text-indigo-100">
                  <svg
                    className="w-6 h-6 text-indigo-200 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <span>Check spam or promotions folder</span>
                </div>
                <div className="flex items-center gap-3 text-indigo-100">
                  <svg
                    className="w-6 h-6 text-indigo-200 shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <span>Still nothing? We're here to help.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResendVerificationPage;
