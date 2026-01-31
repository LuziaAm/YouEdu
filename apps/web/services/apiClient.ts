/**
 * HTTP client for backend API communication
 */

const API_BASE_URL = '/api';

interface ApiError {
    detail: string;
    status?: number;
}

class NetworkError extends Error {
    constructor(message: string, public status?: number) {
        super(message);
        this.name = 'NetworkError';
    }
}

/**
 * Base fetch wrapper with error handling and retry logic
 */
async function apiFetch<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const defaultHeaders = {
        'Content-Type': 'application/json',
    };

    const config: RequestInit = {
        ...options,
        headers: {
            ...defaultHeaders,
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

            throw new NetworkError(errorMessage, response.status);
        }

        return await response.json();
    } catch (error) {
        if (error instanceof NetworkError) {
            throw error;
        }

        // Network error (offline, timeout, etc.)
        throw new NetworkError(
            'Failed to connect to server. Please check your internet connection.',
            0
        );
    }
}

/**
 * POST request helper
 */
export async function apiPost<T>(
    endpoint: string,
    data: any,
    timeout = 60000
): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const result = await apiFetch<T>(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
            signal: controller.signal,
        });

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
    params?: Record<string, string>
): Promise<T> {
    let url = endpoint;

    if (params) {
        const queryString = new URLSearchParams(params).toString();
        url = `${endpoint}?${queryString}`;
    }

    return apiFetch<T>(url, {
        method: 'GET',
    });
}

/**
 * Check if backend is healthy
 */
export async function checkHealth(): Promise<boolean> {
    try {
        await apiGet('/health');
        return true;
    } catch {
        return false;
    }
}

/**
 * DELETE request helper
 */
export async function apiDelete<T>(endpoint: string): Promise<T> {
    return apiFetch<T>(endpoint, {
        method: 'DELETE',
    });
}

/**
 * PATCH request helper
 */
export async function apiPatch<T>(endpoint: string, data: any): Promise<T> {
    return apiFetch<T>(endpoint, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
}
