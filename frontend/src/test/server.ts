import { setupServer } from 'msw/node';
import { handlers } from '@/test/handlers';

export const server = setupServer(...handlers);

// Setup lifecycle
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
