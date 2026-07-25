import { http, HttpResponse } from 'msw';
import {
  mockUser,
  mockAuthTokens,
  mockSignupResponse,
  mockVerificationResponse,
} from '@/test/fixtures/auth.fixtures';

export const authHandlers = [
  http.post('/api/v1/auth/login', async ({ request }) => {
    const body = await request.json();
    const { email, password } = body as { email: string; password: string };

    if (email === 'test@example.com' && password === 'password123') {
      return HttpResponse.json(mockAuthTokens);
    }
    return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 });
  }),

  http.post('/api/v1/auth/signup', async ({ request }) => {
    const body = await request.json();
    const { email } = body as { email: string };
    return HttpResponse.json(
      {
        ...mockSignupResponse,
        email,
      },
      { status: 202 }
    );
  }),

  http.get('/api/v1/auth/verify-email', ({ request }) => {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');

    if (token === 'valid-token') {
      return HttpResponse.json(mockVerificationResponse);
    }
    return HttpResponse.json({ message: 'Invalid or expired token' }, { status: 400 });
  }),

  http.get('/api/v1/auth/me', () => {
    return HttpResponse.json(mockUser);
  }),

  http.post('/api/v1/auth/logout', () => {
    return HttpResponse.json({ message: 'Logged out successfully' });
  }),
];
