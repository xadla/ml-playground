import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { getExperimentStatus, saveExperiment } from '@/services/experimentService';
import { useAuth } from '@/contexts/AuthContext';
import type { ExperimentStatus } from '@/types/experiment';

// ----- Status config -----
const statusMeta: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  pending: {
    label: 'Pending',
    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
    text: 'text-yellow-700 dark:text-yellow-300',
    dot: 'bg-yellow-400',
  },
  running: {
    label: 'Running',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-700 dark:text-blue-300',
    dot: 'bg-blue-500 animate-pulse',
  },
  completed: {
    label: 'Completed',
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-700 dark:text-green-300',
    dot: 'bg-green-500',
  },
  failed: {
    label: 'Failed',
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-700 dark:text-red-300',
    dot: 'bg-red-500',
  },
};

export default function ExperimentDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();

  // Fetch experiment status (polls every 2s until completed/failed)
  const {
    data: experiment,
    isLoading,
    error,
  } = useQuery<ExperimentStatus>({
    queryKey: ['experiment', id],
    queryFn: () => getExperimentStatus(id!),
    enabled: !!id,
    refetchInterval: (data) =>
      data?.status === 'completed' || data?.status === 'failed' ? false : 2000,
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: () => saveExperiment(id!),
    onSuccess: () => {
      // Could show a toast or brief success message
      alert('Experiment saved to history!');
    },
  });

  // ----- Loading skeleton -----
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <svg className="animate-spin h-12 w-12 text-indigo-600" viewBox="0 0 24 24" fill="none">
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
          <p className="text-gray-500 dark:text-gray-400">Loading experiment...</p>
        </div>
      </div>
    );
  }

  // ----- Error state -----
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Failed to load</h2>
          <p className="text-gray-500 dark:text-gray-400">
            Could not retrieve experiment data. It may have been removed or the ID is incorrect.
          </p>
        </div>
      </div>
    );
  }

  if (!experiment) return null;

  const meta = statusMeta[experiment.status] || statusMeta.pending;
  const result = experiment.result;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
              Experiment <span className="text-gray-400 font-mono">#{id?.slice(0, 8)}</span>
            </h1>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              {experiment.algorithm?.replace('_', ' ') || 'Unknown algorithm'}
              {experiment.hyperparameters && (
                <>
                  {' · '}
                  {Object.entries(experiment.hyperparameters)
                    .map(([k, v]) => `${k}=${v}`)
                    .join(', ')}
                </>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold border ${meta.bg} ${meta.text}`}
            >
              <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
              {meta.label}
            </span>
            {/* Save button (only if completed + authenticated) */}
            {experiment.status === 'completed' && isAuthenticated && (
              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="px-4 py-1.5 bg-indigo-600 text-white rounded-full text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {saveMutation.isPending ? 'Saving...' : 'Save to History'}
              </button>
            )}
          </div>
        </div>

        {/* Metrics (only when completed) */}
        {experiment.status === 'completed' && result?.metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(result.metrics).map(([key, value]) => (
              <div
                key={key}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm text-center hover:shadow-md transition"
              >
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                  {key.replace('_', ' ')}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {(value * 100).toFixed(1)}%
                </p>
                <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full mt-3">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-indigo-500 to-purple-500"
                    style={{ width: `${Math.min(value * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Confusion Matrix */}
        {result?.confusion_matrix && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h7"
                    />
                  </svg>
                </span>
                Confusion Matrix
              </h3>
            </div>
            <div className="overflow-x-auto p-6">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-3 text-sm text-gray-500 dark:text-gray-400"></th>
                    {result.confusion_matrix[0].map((_, idx) => (
                      <th
                        key={idx}
                        className="p-3 text-sm font-medium text-gray-500 dark:text-gray-400"
                      >
                        Predicted {idx}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.confusion_matrix.map((row, i) => (
                    <tr key={i}>
                      <td className="p-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                        Actual {i}
                      </td>
                      {row.map((val, j) => {
                        const maxVal = Math.max(...row);
                        const intensity = maxVal > 0 ? val / maxVal : 0;
                        return (
                          <td
                            key={j}
                            className="p-3 text-center text-sm font-bold"
                            style={{
                              backgroundColor: `rgba(99, 102, 241, ${intensity * 0.7 + 0.1})`,
                              color: intensity > 0.5 ? '#fff' : '#111827',
                              borderRadius: '0.5rem',
                            }}
                          >
                            {val}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Plots */}
        {result?.plots &&
          (result.plots.decision_boundary || result.plots.confusion_matrix_heatmap) && (
            <div className="grid md:grid-cols-2 gap-6">
              {result.plots.decision_boundary && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Decision Boundary
                    </h3>
                  </div>
                  <img
                    src={result.plots.decision_boundary}
                    alt="Decision boundary"
                    className="w-full p-4 object-contain rounded-b-2xl"
                  />
                </div>
              )}
              {result.plots.confusion_matrix_heatmap && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Confusion Matrix Heatmap
                    </h3>
                  </div>
                  <img
                    src={result.plots.confusion_matrix_heatmap}
                    alt="Confusion matrix heatmap"
                    className="w-full p-4 object-contain rounded-b-2xl"
                  />
                </div>
              )}
            </div>
          )}

        {/* Error message for failed experiments */}
        {experiment.status === 'failed' && experiment.error_message && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-red-700 dark:text-red-300">
            <h3 className="font-semibold">Error</h3>
            <p className="mt-1">{experiment.error_message}</p>
          </div>
        )}

        {/* Polling indicator */}
        {experiment.status !== 'completed' && experiment.status !== 'failed' && (
          <div className="flex items-center justify-center py-10">
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl px-6 py-4 flex items-center gap-3">
              <svg className="animate-spin h-6 w-6 text-indigo-600" viewBox="0 0 24 24">
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
              <div>
                <p className="font-medium text-indigo-700 dark:text-indigo-300">
                  {experiment.status === 'running' ? 'Training model...' : 'Waiting to start...'}
                </p>
                <p className="text-sm text-indigo-500 dark:text-indigo-400">
                  Results will appear automatically.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
