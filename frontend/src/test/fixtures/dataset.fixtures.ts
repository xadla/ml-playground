export const mockDatasets = [
  {
    id: '1',
    name: 'Iris Dataset',
    description: 'Classic iris flower dataset',
    rows: 150,
    columns: 5,
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Wine Dataset',
    description: 'Wine quality dataset',
    rows: 4898,
    columns: 12,
    createdAt: '2024-01-02T00:00:00Z',
  },
];

export const mockNewDataset = {
  id: '3',
  name: 'New Dataset',
  description: 'A new dataset',
  rows: 100,
  columns: 10,
  createdAt: new Date().toISOString(),
};
