import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

export default function NotFound() {
  return (
    <>
      <Helmet>
        <title>Page Not Found – ML Playground</title>
      </Helmet>
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          {/* Large 404 number */}
          <p className="text-8xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            404
          </p>
          <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Page not found</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Sorry, the page you're looking for doesn't exist or has been moved.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition shadow-lg shadow-indigo-500/20"
            >
              Go home
            </Link>
            <Link
              to="/experiments/new"
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              New experiment
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
