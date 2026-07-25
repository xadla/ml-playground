import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { historyService } from '@/features/history/services/historyService';
import type { CompareResult } from '@/features/history/types/history';

export default function Compare() {
  const [searchParams] = useSearchParams();
  const idsParam = searchParams.get('ids') || '';
  const ids = idsParam.split(',').filter(Boolean);

  const { data, isLoading, error } = useQuery<CompareResult>({
    queryKey: ['compare', ids],
    queryFn: () => historyService.compareExperiments(ids),
    enabled: ids.length >= 2,
  });

  // Helper to pick a gradient for each experiment
  const algorithmGradient = (algorithm: string) => {
    const map: Record<string, string> = {
      knn: 'from-indigo-500 to-purple-600',
      logistic_regression: 'from-pink-500 to-rose-600',
    };
    return map[algorithm] || 'from-gray-500 to-gray-700';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              Compare Experiments
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Side‑by‑side metrics for your selected experiments.
            </p>
          </div>
          <Link
            to="/history"
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to History
          </Link>
        </div>

        {/* State: not enough IDs */}
        {ids.length < 2 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
              />
            </svg>
            <p className="text-xl font-medium">Select at least two experiments to compare</p>
          </div>
        )}

        {/* Loading */}
        {isLoading && ids.length >= 2 && (
          <div className="flex justify-center py-20">
            <svg className="animate-spin h-10 w-10 text-indigo-600" viewBox="0 0 24 24">
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
        )}

        {/* Error */}
        {error && ids.length >= 2 && (
          <div className="flex flex-col items-center justify-center py-20 text-red-500">
            <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p>Failed to load comparison data.</p>
          </div>
        )}

        {/* Data */}
        {data && data.experiments.length > 0 && (
          <>
            {/* Summary cards: experiment badges */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.experiments.map((exp) => (
                <div
                  key={exp.experiment_id}
                  className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
                >
                  <div className={`h-1.5 bg-gradient-to-r ${algorithmGradient(exp.algorithm)}`} />
                  <div className="p-5">
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {exp.dataset_name}
                    </p>
                    <span
                      className="inline-block mt-1 px-2 py-0.5 rounded-md text-xs font-medium text-white"
                      style={{
                        background: algorithmGradient(exp.algorithm)
                          .replace('from-', '')
                          .replace('to-', '')
                          .replace(' ', ','),
                      }}
                    >
                      {exp.algorithm.replace('_', ' ')}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-mono">
                      ID: {exp.experiment_id.slice(0, 8)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Comparison table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                  </span>
                  Metrics Comparison
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/50">
                      <th className="p-4 text-left text-gray-600 dark:text-gray-300 font-semibold">
                        Experiment
                      </th>
                      <th className="p-4 text-left text-gray-600 dark:text-gray-300 font-semibold">
                        Accuracy
                      </th>
                      <th className="p-4 text-left text-gray-600 dark:text-gray-300 font-semibold">
                        Precision
                      </th>
                      <th className="p-4 text-left text-gray-600 dark:text-gray-300 font-semibold">
                        Recall
                      </th>
                      <th className="p-4 text-left text-gray-600 dark:text-gray-300 font-semibold">
                        F1 Score
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.experiments.map((exp, idx) => (
                      <tr
                        key={exp.experiment_id}
                        className={`border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                          idx % 2 === 0
                            ? 'bg-white dark:bg-gray-800'
                            : 'bg-gray-50/30 dark:bg-gray-800/50'
                        }`}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-3 h-3 rounded-full bg-gradient-to-r ${algorithmGradient(exp.algorithm)}`}
                            />
                            <span className="font-medium text-gray-900 dark:text-white">
                              {exp.dataset_name}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-gray-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <span>{(exp.metrics.accuracy * 100).toFixed(1)}%</span>
                            <MetricBar value={exp.metrics.accuracy} />
                          </div>
                        </td>
                        <td className="p-4 font-mono text-gray-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <span>{(exp.metrics.precision * 100).toFixed(1)}%</span>
                            <MetricBar value={exp.metrics.precision} />
                          </div>
                        </td>
                        <td className="p-4 font-mono text-gray-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <span>{(exp.metrics.recall * 100).toFixed(1)}%</span>
                            <MetricBar value={exp.metrics.recall} />
                          </div>
                        </td>
                        <td className="p-4 font-mono text-gray-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <span>{(exp.metrics.f1_score * 100).toFixed(1)}%</span>
                            <MetricBar value={exp.metrics.f1_score} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Small inline bar visualization for metric
function MetricBar({ value }: { value: number }) {
  return (
    <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
      <div
        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
        style={{ width: `${Math.min(value * 100, 100)}%` }}
      />
    </div>
  );
}
