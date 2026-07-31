import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

export default function Forbidden() {
  return (
    <>
      <Helmet>
        <title>Access Denied – ML Playground</title>
      </Helmet>
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">403 – Forbidden</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            You don't have permission to access this resource.
          </p>
          <div className="mt-8">
            <Link
              to="/dashboard"
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition shadow-lg"
            >
              Go to dashboard
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
