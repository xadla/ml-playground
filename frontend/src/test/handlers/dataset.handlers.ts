import { http, HttpResponse } from 'msw';
import { mockDatasets, mockNewDataset } from '@/test/fixtures/dataset.fixtures';

export const datasetHandlers = [
  http.get('/api/v1/datasets', () => {
    return HttpResponse.json(mockDatasets);
  }),

  http.get('/api/v1/datasets/:id', ({ params }) => {
    const { id } = params;
    const dataset = mockDatasets.find((d) => d.id === id);

    if (dataset) {
      return HttpResponse.json(dataset);
    }
    return HttpResponse.json({ message: 'Dataset not found' }, { status: 404 });
  }),

  http.post('/api/v1/datasets', async ({ request }) => {
    const data = await request.json();
    return HttpResponse.json(
      {
        ...mockNewDataset,
        ...(data as object),
      },
      { status: 201 }
    );
  }),

  http.delete('/api/v1/datasets/:id', ({ params }) => {
    const { id } = params;
    if (id === '1') {
      return HttpResponse.json({ message: 'Dataset deleted successfully' });
    }
    return HttpResponse.json({ message: 'Dataset not found' }, { status: 404 });
  }),
];
