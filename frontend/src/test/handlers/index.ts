import { authHandlers } from './auth.handlers';
import { datasetHandlers } from './dataset.handlers';
import { experimentHandlers } from './experiment.handlers';
import { http, HttpResponse } from 'msw';

// Health check handler
const healthHandler = [
  http.get('/api/v1/health', () => {
    return HttpResponse.json({ status: 'ok', version: '1.0.0' });
  }),
];

export const handlers = [
  ...authHandlers,
  ...datasetHandlers,
  ...experimentHandlers,
  ...healthHandler,
];
