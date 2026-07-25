import { http, HttpResponse } from 'msw';
import { mockExperiments, mockNewExperiment } from '@/test/fixtures/experiment.fixtures';

export const experimentHandlers = [
  http.get('/api/v1/experiments', () => {
    return HttpResponse.json(mockExperiments);
  }),

  http.get('/api/v1/experiments/:id', ({ params }) => {
    const { id } = params;
    const experiment = mockExperiments.find((e) => e.id === id);

    if (experiment) {
      return HttpResponse.json(experiment);
    }
    return HttpResponse.json({ message: 'Experiment not found' }, { status: 404 });
  }),

  http.post('/api/v1/experiments', async ({ request }) => {
    const data = await request.json();
    return HttpResponse.json(
      {
        ...mockNewExperiment,
        ...(data as object),
      },
      { status: 201 }
    );
  }),
];
