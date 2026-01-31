/**
 * HTTP client for backend API communication
 * Includes automatic authentication token injection
 */

import { getAuthToken } from '../lib/supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

interface ApiError {
  detail: string;
  status?: number;
}

export class NetworkError extends Error {
  constructor(
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * Get headers with optional authentication
 */
async function getHeaders(includeAuth: boolean = true): Promise<HeadersInit> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const token = await getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
}

/**
 * Base fetch wrapper with error handling, retry logic, and authentication
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  includeAuth: boolean = true
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const headers = await getHeaders(includeAuth);

  const config: RequestInit = {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;

      try {
        const errorData: ApiError = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch {
        // If error response is not JSON, use default message
      }

      // Handle specific error codes
      if (response.status === 401) {
        // Token expired or invalid - could trigger re-auth here
        errorMessage = 'Session expired. Please sign in again.';
      }

      throw new NetworkError(errorMessage, response.status);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof NetworkError) {
      throw error;
    }

    // Network error (offline, timeout, etc.)
    throw new NetworkError('Failed to connect to server. Please check your internet connection.', 0);
  }
}

/**
 * POST request helper
 */
export async function apiPost<T>(
  endpoint: string,
  data: unknown,
  timeout = 60000,
  includeAuth = true
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const result = await apiFetch<T>(
      endpoint,
      {
        method: 'POST',
        body: JSON.stringify(data),
        signal: controller.signal,
      },
      includeAuth
    );

    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * GET request helper
 */
export async function apiGet<T>(
  endpoint: string,
  params?: Record<string, string>,
  includeAuth = true
): Promise<T> {
  let url = endpoint;

  if (params) {
    const queryString = new URLSearchParams(params).toString();
    url = `${endpoint}?${queryString}`;
  }

  return apiFetch<T>(
    url,
    {
      method: 'GET',
    },
    includeAuth
  );
}

/**
 * Check if backend is healthy
 */
export async function checkHealth(): Promise<boolean> {
  try {
    await apiGet('/health', undefined, false);
    return true;
  } catch {
    return false;
  }
}

/**
 * DELETE request helper
 */
export async function apiDelete<T>(endpoint: string, includeAuth = true): Promise<T> {
  return apiFetch<T>(
    endpoint,
    {
      method: 'DELETE',
    },
    includeAuth
  );
}

/**
 * PATCH request helper
 */
export async function apiPatch<T>(endpoint: string, data: unknown, includeAuth = true): Promise<T> {
  return apiFetch<T>(
    endpoint,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    },
    includeAuth
  );
}

/**
 * PUT request helper
 */
export async function apiPut<T>(endpoint: string, data: unknown, includeAuth = true): Promise<T> {
  return apiFetch<T>(
    endpoint,
    {
      method: 'PUT',
      body: JSON.stringify(data),
    },
    includeAuth
  );
}
