import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { historyService } from '@/features/history/services/historyService';
import type { HistoryExperiment } from '@/features/history/types/history';
import { Skeleton } from '@/components/ui/skeleton';
import { Helmet } from 'react-helmet-async';

export default function HistoryList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('created_at');
  const [order, setOrder] = useState('desc');
  const [selected, setSelected] = useState<string[]>([]);

  // Data
  const { data, isLoading, error } = useQuery({
    queryKey: ['history', page, search, sort, order],
    queryFn: () => historyService.getHistory(page, 10, sort, order, search),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => historyService.deleteExperiment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['history'] }),
  });

  const handleDelete = (id: string) => {
    if (confirm('Permanently delete this experiment?')) deleteMutation.mutate(id);
  };

  const handleCompare = () => {
    if (selected.length >= 2) {
      navigate(`/history/compare?ids=${selected.join(',')}`);
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const toggleAll = () => {
    if (data && data.items.length > 0) {
      if (selected.length === data.items.length) {
        setSelected([]);
      } else {
        setSelected(data.items.map((item) => item.experiment_id));
      }
    }
  };

  // Color gradient based on algorithm (visual flair)
  const algorithmGradient = (algorithm: string) => {
    const map: Record<string, string> = {
      knn: 'from-indigo-500 to-purple-600',
      logistic_regression: 'from-pink-500 to-rose-600',
    };
    return map[algorithm] || 'from-gray-500 to-gray-700';
  };

  return (
    <>
      <Helmet>
        <title>History – ML Playground</title>
      </Helmet>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                Experiment History
              </h1>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                Review, compare, and manage your previous experiments.
              </p>
            </div>
          </div>

          {/* Toolbar */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex-1 min-w-0 w-full sm:w-auto">
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by dataset or algorithm..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 text-sm"
                >
                  <option value="created_at">Date</option>
                  <option value="algorithm">Algorithm</option>
                  <option value="accuracy">Accuracy</option>
                </select>
                <button
                  onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}
                  className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-1"
                >
                  {order === 'asc' ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 15l7-7 7 7"
                      />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  )}
                  {order === 'asc' ? 'Ascending' : 'Descending'}
                </button>
                {selected.length > 0 && (
                  <button
                    onClick={handleCompare}
                    disabled={selected.length < 2}
                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:from-indigo-700 hover:to-purple-700 transition shadow-md disabled:opacity-50"
                  >
                    Compare ({selected.length})
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          {isLoading && (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
              <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-12 w-full rounded-xl" /> {/* toolbar */}
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-5 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                        <Skeleton className="w-5 h-5 rounded" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Skeleton className="h-12 rounded-lg" />
                        <Skeleton className="h-12 rounded-lg" />
                      </div>
                      <Skeleton className="h-3 w-24" />
                      <div className="flex gap-3 pt-2">
                        <Skeleton className="flex-1 h-8 rounded-lg" />
                        <Skeleton className="flex-1 h-8 rounded-lg" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-20 text-red-500">
              <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p>Failed to load experiment history.</p>
            </div>
          )}

          {data && data.items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-2.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p className="text-xl font-medium">No experiments yet</p>
              <button
                onClick={() => navigate('/experiments/new')}
                className="mt-4 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
              >
                Run your first experiment
              </button>
            </div>
          )}

          {data && data.items.length > 0 && (
            <>
              {/* Select all checkbox at top */}
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    checked={selected.length === data.items.length}
                    onChange={toggleAll}
                  />
                  Select all ({data.items.length})
                </label>
              </div>

              {/* Cards grid */}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {data.items.map((item) => (
                  <div
                    key={item.id}
                    className={`group bg-white dark:bg-gray-800 rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden ${
                      selected.includes(item.experiment_id)
                        ? 'border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-800'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {/* Top accent bar */}
                    <div
                      className={`h-1.5 bg-gradient-to-r ${algorithmGradient(item.algorithm)}`}
                    />

                    <div className="p-5 flex flex-col h-full">
                      {/* Header with checkbox */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                            {item.dataset_name}
                          </h3>
                          <span
                            className="inline-block mt-1 px-2 py-0.5 rounded-md text-xs font-medium bg-gradient-to-r bg-opacity-20"
                            style={{
                              background:
                                item.algorithm === 'knn'
                                  ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                                  : 'linear-gradient(135deg, #ec4899, #f43f5e)',
                              color: '#fff',
                            }}
                          >
                            {item.algorithm.replace('_', ' ')}
                          </span>
                        </div>
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-1"
                          checked={selected.includes(item.experiment_id)}
                          onChange={() => toggleSelect(item.experiment_id)}
                        />
                      </div>

                      {/* Metrics
                      <div className="grid grid-cols-2 gap-3 mt-2 mb-4">
                        <MetricBadge label="Accuracy" value={item.metrics.accuracy} />
                        <MetricBadge label="F1 Score" value={item.metrics.f1_score} />
                      </div> */}

                      {/* Date */}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-auto">
                        {new Date(item.created_at).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>

                      {/* Actions */}
                      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <button
                          onClick={() => navigate(`/experiments/${item.experiment_id}`)}
                          className="flex-1 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="flex-1 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between pt-6">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Page {data.page} of {Math.ceil(data.total / data.size)}
                </span>
                <button
                  disabled={page >= Math.ceil(data.total / data.size)}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  Next
                </button>
              </div>
            </>
          )}
        </div>

        {/* Floating Compare Bar (appears when items selected) */}
        {selected.length >= 2 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl px-6 py-3 flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {selected.length} selected
              </span>
              <button
                onClick={handleCompare}
                className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:from-indigo-700 hover:to-purple-700 transition shadow-md"
              >
                Compare
              </button>
              <button
                onClick={() => setSelected([])}
                className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// Small metric display component
function MetricBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center bg-gray-50 dark:bg-gray-900/50 rounded-xl p-2">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-lg font-bold text-gray-900 dark:text-white">{(value * 100).toFixed(1)}%</p>
    </div>
  );
}
