import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { historyService } from '@/features/history/services/historyService';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fetch recent history (first page, sorted by most recent)
  const { data, isLoading } = useQuery({
    queryKey: ['history', 1, '', 'created_at', 'desc'],
    queryFn: () => historyService.getHistory(1, 5, 'created_at', 'desc'),
  });

  // Quick stats from fetched data
  const experiments = data?.items || [];
  const totalExperiments = data?.total ?? 0;
  // const avgAccuracy =
  //   experiments.length > 0
  //     ? experiments.reduce((sum, e) => sum + e.metrics.accuracy, 0) / experiments.length
  //     : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Welcome header */}
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''} 👋
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Here’s what’s happening with your ML playground.
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Total Experiments"
            value={totalExperiments}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            }
            gradient="from-indigo-500 to-purple-600"
          />
          {/* <StatCard
            label="Average Accuracy"
            value={`${(avgAccuracy * 100).toFixed(1)}%`}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
            gradient="from-pink-500 to-rose-600"
          /> */}
          <StatCard
            label="Recent Runs"
            value={experiments.length}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
            gradient="from-amber-500 to-orange-600"
          />
        </div>

        {/* Quick actions */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ActionCard
            title="New Canvas Experiment"
            description="Draw points & train a model"
            onClick={() => navigate('/experiments/new?source=canvas')}
            gradient="from-indigo-600 to-purple-600"
          />
          <ActionCard
            title="Built‑in Datasets"
            description="Explore ready‑to‑use data"
            onClick={() => navigate('/datasets/builtin')}
            gradient="from-pink-600 to-rose-600"
          />
          <ActionCard
            title="Upload CSV"
            description="Use your own dataset"
            onClick={() => navigate('/datasets/upload')}
            gradient="from-emerald-600 to-teal-600"
          />
          <ActionCard
            title="View History"
            description="Review past experiments"
            onClick={() => navigate('/history')}
            gradient="from-amber-600 to-orange-600"
          />
        </div>

        {/* Recent experiments */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Experiments</h2>
            <button
              onClick={() => navigate('/history')}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
            >
              View all
            </button>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <svg className="animate-spin h-8 w-8 text-indigo-600" viewBox="0 0 24 24">
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
            </div>
          ) : experiments.length === 0 ? (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
              <p className="text-lg font-medium">No experiments yet</p>
              <p className="mt-1 text-sm">Run your first experiment to see it here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {experiments.map((exp) => (
                <div
                  key={exp.id}
                  onClick={() => navigate(`/experiments/${exp.experiment_id}`)}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm transition cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {exp.dataset_name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {exp.algorithm.replace('_', ' ')} ·{' '}
                      {new Date(exp.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  {/* <div className="ml-4 flex items-center gap-3">
                    <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 text-sm font-medium rounded-lg">
                      {(exp.metrics.accuracy * 100).toFixed(1)}%
                    </span>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div> */}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Mini components for the dashboard
function StatCard({
  label,
  value,
  icon,
  gradient,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  gradient: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 flex items-center gap-4">
      <div
        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white`}
      >
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

function ActionCard({
  title,
  description,
  onClick,
  gradient,
}: {
  title: string;
  description: string;
  onClick: () => void;
  gradient: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`bg-gradient-to-br ${gradient} text-white rounded-2xl p-5 text-left hover:scale-[1.02] transition-transform shadow-lg shadow-indigo-500/20 active:scale-100`}
    >
      <h3 className="font-semibold text-lg">{title}</h3>
      <p className="mt-1 text-sm opacity-90">{description}</p>
    </button>
  );
}
