import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import DatasetCanvas from '@/features/datasets/components/DatasetCanvas';
import { createExperiment } from '@/features/experiments/services/experimentService';
import type { CanvasPoint, Algorithm } from '@/features/experiments/types';
import { Helmet } from 'react-helmet-async';
import type { ApiError } from '@/features/auth/types';

// ----- Algorithm definitions -----
const ALGORITHMS: {
  value: Algorithm;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    value: 'knn',
    label: 'K‑Nearest Neighbors',
    description: 'Classifies a point based on the majority vote of its k closest neighbors.',
    icon: '🎯',
  },
  {
    value: 'logistic_regression',
    label: 'Logistic Regression',
    description:
      'Estimates the probability that a point belongs to a certain class using a logistic function.',
    icon: '📈',
  },
];

// ----- Component -----
export default function NewExperiment() {
  const navigate = useNavigate();
  const [points, setPoints] = useState<CanvasPoint[]>([]);
  const [selectedClass, setSelectedClass] = useState('A');
  const [algorithm, setAlgorithm] = useState<Algorithm>('knn');
  const [hyperparams, setHyperparams] = useState<Record<string, string>>({
    n_neighbors: '5',
  });

  // Mutation to create experiment
  const mutation = useMutation({
    mutationFn: createExperiment,
    onSuccess: (data) => {
      navigate(`/experiments/${data.experiment_id}`);
    },
  });

  // Update hyperparams when algorithm changes
  const handleAlgorithmChange = (alg: Algorithm) => {
    setAlgorithm(alg);
    if (alg === 'knn') {
      setHyperparams({ n_neighbors: '5' });
    } else if (alg === 'logistic_regression') {
      setHyperparams({ C: '1.0', penalty: 'l2' });
    }
  };

  // Validate and submit
  const handleSubmit = () => {
    if (points.length === 0) {
      return;
    }
    const processedHyperparams: Record<string, number | string> = {};
    for (const [key, val] of Object.entries(hyperparams)) {
      processedHyperparams[key] = isNaN(Number(val)) ? val : Number(val);
    }
    mutation.mutate({
      dataset: {
        type: 'canvas',
        name: 'Canvas Dataset',
        points: points,
        feature_names: ['x', 'y'],
      },
      algorithm,
      hyperparameters: processedHyperparams,
      target_column: 'class',
    });
  };

  // const selectedAlgo = ALGORITHMS.find((a) => a.value === algorithm)!;

  return (
    <>
      <Helmet>
        <title>New Experiment – ML Playground</title>
      </Helmet>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Page header */}
          <div className="mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                New Experiment
              </h1>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                Draw points on the canvas, pick an algorithm, and run your model.
              </p>
            </div>
            {/* Step indicator / badge */}
            <div className="flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-full border border-indigo-200 dark:border-indigo-800">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs">
                1
              </span>
              <span className="mx-1">Draw</span>
              <span className="text-gray-300 dark:text-gray-600">→</span>
              <span className="w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-xs text-gray-400">
                2
              </span>
              <span className="mx-1">Configure</span>
              <span className="text-gray-300 dark:text-gray-600">→</span>
              <span className="w-6 h-6 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center text-xs text-gray-400">
                3
              </span>
              <span className="mx-1">Results</span>
            </div>
          </div>

          {/* Main content: canvas + sidebar */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Canvas – takes 2 columns */}
            <div className="lg:col-span-2">
              <DatasetCanvas
                points={points}
                onPointsChange={setPoints}
                selectedClass={selectedClass}
                onClassChange={setSelectedClass}
              />
            </div>

            {/* Sidebar – configuration */}
            <div className="space-y-6">
              {/* Algorithm selection */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  </span>
                  Algorithm
                </h3>
                <div className="space-y-3">
                  {ALGORITHMS.map((alg) => (
                    <button
                      key={alg.value}
                      onClick={() => handleAlgorithmChange(alg.value)}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 group ${
                        algorithm === alg.value
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-md shadow-indigo-100 dark:shadow-none'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{alg.icon}</span>
                        <div>
                          <p
                            className={`font-semibold text-sm ${algorithm === alg.value ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-900 dark:text-white'}`}
                          >
                            {alg.label}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                            {alg.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Hyperparameters */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                      />
                    </svg>
                  </span>
                  Hyperparameters
                </h3>
                {algorithm === 'knn' && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Number of Neighbors (k)
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={hyperparams.n_neighbors}
                      onChange={(e) =>
                        setHyperparams({ ...hyperparams, n_neighbors: e.target.value })
                      }
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Odd numbers recommended for binary classification.
                    </p>
                  </div>
                )}
                {algorithm === 'logistic_regression' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        C (Inverse Regularization)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.001"
                        value={hyperparams.C}
                        onChange={(e) => setHyperparams({ ...hyperparams, C: e.target.value })}
                        className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      />
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Smaller values = stronger regularization.
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Penalty
                      </label>
                      <select
                        value={hyperparams.penalty}
                        onChange={(e) =>
                          setHyperparams({ ...hyperparams, penalty: e.target.value })
                        }
                        className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      >
                        <option value="l2">L2 (Ridge)</option>
                        <option value="l1">L1 (Lasso)</option>
                        <option value="none">None</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Run button */}
              <button
                onClick={handleSubmit}
                disabled={points.length === 0 || mutation.isPending}
                className="w-full py-3.5 px-6 bg-linear-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-indigo-700 hover:to-purple-700 transition-all transform active:scale-[0.98] shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
              >
                {mutation.isPending ? (
                  <>
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
                    Running experiment…
                  </>
                ) : (
                  <>
                    <span>Run Experiment</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </>
                )}
              </button>
              {mutation.isError && (
                <p className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
                  {(mutation.error as unknown as ApiError)?.error?.message ||
                    mutation.error?.message ||
                    'An error occurred'}
                </p>
              )}
              <p className="text-xs text-center text-gray-400 dark:text-gray-500">
                {points.length === 0
                  ? 'Add points on the canvas to get started'
                  : `${points.length} point${points.length !== 1 ? 's' : ''} ready`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
