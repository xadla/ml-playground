import { http, HttpResponse } from 'msw';

export const handlers = [
  // Auth endpoints
  http.post('/api/v1/auth/login', async ({ request }) => {
    const { email, password } = await request.json();

    if (email === 'test@example.com' && password === 'password123') {
      return HttpResponse.json({
        access_token: 'mock-token-123',
        token_type: 'bearer',
      });
    }
    return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 });
  }),

  http.post('/api/v1/auth/signup', async ({ request }) => {
    const { email } = await request.json();
    return HttpResponse.json(
      {
        message: 'Verification email sent',
        email: email,
      },
      { status: 202 }
    );
  }),

  http.get('/api/v1/auth/verify-email', ({ request }) => {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (token === 'valid-token') {
      return HttpResponse.json({
        message: 'Email verified. Account created successfully.',
        access_token: 'mock-token-456',
        token_type: 'bearer',
      });
    }
    return HttpResponse.json({ message: 'Invalid or expired token' }, { status: 400 });
  }),

  http.get('/api/v1/auth/me', () => {
    return HttpResponse.json({
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
    });
  }),
];
