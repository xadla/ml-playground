import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { server } from './server';
import { createTestQueryClient } from './render';

// MSW Setup
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => {
  server.resetHandlers();
  // Clear all mocks after each test
  vi.clearAllMocks();
});
afterAll(() => server.close());

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock environment variables
vi.mock('@/config/env', () => ({
  API_URL: 'http://localhost:8000',
  MODE: 'test',
}));

// Mock react-router-dom's useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Suppress console errors in tests (optional)
const originalConsoleError = console.error;
console.error = vi.fn();

// Add cleanup after each test
afterEach(() => {
  // Reset any mocked modules
  vi.resetModules();
});

// Global test utilities
globalThis.createTestQueryClient = createTestQueryClient;
