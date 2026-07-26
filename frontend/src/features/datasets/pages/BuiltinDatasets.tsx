import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { datasetService } from '@/features/datasets/services/datasetService';
import type { BuiltinDataset } from '@/features/datasets/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function BuiltinDatasets() {
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery({
    queryKey: ['builtin-datasets'],
    queryFn: datasetService.getBuiltinDatasets,
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Page header */}
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Built‑in Datasets
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-2xl">
            Ready‑to‑use datasets perfect for learning and experimenting. Click any dataset to jump
            straight into an experiment.
          </p>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
              <Skeleton className="h-8 w-64" />
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
                    <Skeleton className="h-2 w-full" />
                    <div className="p-6 space-y-4">
                      <div className="flex items-start gap-3">
                        <Skeleton className="w-10 h-10 rounded-xl" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-5 w-32" />
                          <Skeleton className="h-3 w-full" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-6 w-16" />
                      </div>
                      <Skeleton className="h-10 w-full rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
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
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Failed to load datasets
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Please check your connection or try again later.
            </p>
          </div>
        )}

        {/* Datasets grid */}
        {data && data.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((dataset) => (
              <DatasetCard
                key={dataset.id}
                dataset={dataset}
                onUse={() => navigate(`/experiments/new?source=builtin&datasetId=${dataset.id}`)}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {data && data.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-2.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              No datasets available
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Check back later – we're adding new ones regularly!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ----- Dataset Card Component -----
function DatasetCard({ dataset, onUse }: { dataset: BuiltinDataset; onUse: () => void }) {
  // Choose a gradient based on dataset name (simple but attractive)
  const gradients = [
    'from-indigo-500 to-purple-600',
    'from-pink-500 to-rose-600',
    'from-amber-500 to-orange-600',
    'from-emerald-500 to-teal-600',
    'from-blue-500 to-cyan-600',
  ];
  const randomGradient = gradients[dataset.name.length % gradients.length];

  return (
    <div className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-300 flex flex-col overflow-hidden">
      {/* Top accent bar */}
      <div className={`h-2 bg-linear-to-r ${randomGradient}`} />

      <div className="p-6 flex flex-col grow">
        {/* Dataset icon + name */}
        <div className="flex items-start gap-4 mb-4">
          <div
            className={`w-10 h-10 rounded-xl bg-linear-to-br ${randomGradient} flex items-center justify-center text-white shadow-lg shrink-0`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M4 7c0-2 1-3 3-3h10c2 0 3 1 3 3M4 7h16M9 11h6"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {dataset.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
              {dataset.description}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-auto mb-4">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
              />
            </svg>
            {dataset.rows} rows
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            {dataset.columns.length} columns
          </span>
        </div>

        {/* Column tags */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {dataset.columns.slice(0, 4).map((col) => (
            <span
              key={col}
              className="px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md"
            >
              {col}
            </span>
          ))}
          {dataset.columns.length > 4 && (
            <span className="px-2 py-0.5 text-xs text-gray-400 dark:text-gray-500">
              +{dataset.columns.length - 4} more
            </span>
          )}
        </div>

        {/* Action button */}
        <button
          onClick={onUse}
          className="w-full py-2.5 px-4 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all active:scale-[0.98] shadow-md shadow-indigo-500/20"
        >
          Use this dataset
        </button>
      </div>
    </div>
  );
}
