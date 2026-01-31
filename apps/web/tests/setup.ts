/**
 * Vitest Test Setup
 *
 * This file runs before each test file.
 * Use it to set up global mocks and test utilities.
 */

import '@testing-library/jest-dom';

// Mock environment variables for tests
vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key');
vi.stubEnv('VITE_API_BASE_URL', '/api');

// Mock fetch globally
global.fetch = vi.fn();

// Mock Supabase client
vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      signInWithOAuth: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  },
  getAuthToken: vi.fn().mockResolvedValue(null),
  default: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
  },
}));

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});
