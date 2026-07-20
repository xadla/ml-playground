import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="bg-white dark:bg-gray-950">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-linear-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-indigo-950" />
        {/* Decorative blobs */}
        <div className="absolute top-20 -left-20 w-96 h-96 bg-indigo-200/30 dark:bg-indigo-800/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-purple-200/30 dark:bg-purple-800/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Build ML models{' '}
              <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-purple-600">
                visually
              </span>
            </h1>
            <p className="mt-6 text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
              Draw your dataset on an interactive canvas, choose an algorithm, and watch your model
              learn in real time. No code needed.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center px-8 py-4 rounded-xl text-lg font-semibold text-white bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-xl shadow-indigo-500/25 transition-all transform hover:scale-105"
                  >
                    Go to Dashboard
                    <svg
                      className="ml-2 w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </Link>
                  <Link
                    to="/experiments/new"
                    className="inline-flex items-center px-8 py-4 rounded-xl text-lg font-semibold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-800 border-2 border-indigo-200 dark:border-indigo-800 hover:border-indigo-500 dark:hover:border-indigo-600 transition-all"
                  >
                    New Experiment
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/signup"
                    className="inline-flex items-center px-8 py-4 rounded-xl text-lg font-semibold text-white bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-xl shadow-indigo-500/25 transition-all transform hover:scale-105"
                  >
                    Get Started Free
                    <svg
                      className="ml-2 w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center px-8 py-4 rounded-xl text-lg font-semibold text-indigo-600 dark:text-indigo-400 bg-white dark:bg-gray-800 border-2 border-indigo-200 dark:border-indigo-800 hover:border-indigo-500 dark:hover:border-indigo-600 transition-all"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Floating canvas illustration (decorative) */}
          <div className="mt-20 flex justify-center">
            <div className="relative w-full max-w-2xl aspect-video bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="absolute inset-0 bg-linear-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/10 dark:to-purple-900/10" />
              <div className="relative p-6 flex items-center justify-center h-full">
                <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
                  {/* Decorative points and lines to mimic a canvas */}
                  {[
                    { x: 20, y: 30, color: 'bg-indigo-500' },
                    { x: 50, y: 70, color: 'bg-pink-500' },
                    { x: 80, y: 40, color: 'bg-indigo-500' },
                  ].map((point, i) => (
                    <div
                      key={i}
                      className="relative"
                      style={{ left: `${point.x}%`, top: `${point.y}%` }}
                    >
                      <div className={`w-4 h-4 ${point.color} rounded-full shadow-lg`} />
                    </div>
                  ))}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 100">
                    <line
                      x1="20"
                      y1="30"
                      x2="50"
                      y2="70"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="text-gray-300 dark:text-gray-600"
                    />
                    <line
                      x1="50"
                      y1="70"
                      x2="80"
                      y2="40"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="text-gray-300 dark:text-gray-600"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white">
              Everything you need
            </h2>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
              Powerful ML tools, simplified.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-600 transition group">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition">
                <svg
                  className="w-6 h-6 text-indigo-600 dark:text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Interactive Canvas
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Draw points, assign classes, and visualize your data in seconds.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-600 transition group">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition">
                <svg
                  className="w-6 h-6 text-purple-600 dark:text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Top Algorithms
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                KNN, Logistic Regression, and more — just pick and run.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-600 transition group">
              <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition">
                <svg
                  className="w-6 h-6 text-pink-600 dark:text-pink-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Instant Insights
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Accuracy, confusion matrix, decision boundaries — all at your fingertips.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="py-24 bg-linear-to-r from-indigo-600 to-purple-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold text-white mb-4">Ready to start experimenting?</h2>
            <p className="text-xl text-indigo-100 mb-10">
              No installation. No setup. Just open your browser and go.
            </p>
            <Link
              to="/signup"
              className="inline-flex items-center px-10 py-4 rounded-xl text-lg font-semibold text-indigo-600 bg-white hover:bg-gray-100 shadow-2xl transition-all transform hover:scale-105"
            >
              Create Free Account
            </Link>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
