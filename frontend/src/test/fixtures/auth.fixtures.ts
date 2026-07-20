export const mockUser = {
  id: '123',
  email: 'test@example.com',
  name: 'Test User',
};

export const mockAuthTokens = {
  access_token: 'mock-token-123',
  token_type: 'bearer',
};

export const mockSignupResponse = {
  message: 'Verification email sent',
  email: 'test@example.com',
};

export const mockVerificationResponse = {
  message: 'Email verified. Account created successfully.',
  ...mockAuthTokens,
};
