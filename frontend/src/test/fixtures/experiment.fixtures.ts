export const mockExperiments = [
  {
    id: '1',
    name: 'KNN Experiment',
    description: 'Testing KNN on Iris',
    algorithm: 'knn',
    status: 'completed' as const,
    accuracy: 0.95,
    createdAt: '2024-01-03T00:00:00Z',
  },
  {
    id: '2',
    name: 'Random Forest Experiment',
    description: 'Testing Random Forest on Wine',
    algorithm: 'random_forest',
    status: 'running' as const,
    accuracy: null,
    createdAt: '2024-01-04T00:00:00Z',
  },
];

export const mockNewExperiment = {
  id: '3',
  name: 'New Experiment',
  description: 'A new experiment',
  algorithm: 'svm',
  status: 'pending' as const,
  createdAt: new Date().toISOString(),
};
