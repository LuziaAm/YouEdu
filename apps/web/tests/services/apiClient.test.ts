/**
 * API Client Tests
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

import { apiGet, apiPost, checkHealth, NetworkError } from '../../services/apiClient';

describe('apiClient', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('apiGet', () => {
    it('should make a GET request and return data', async () => {
      const mockData = { id: 1, name: 'Test' };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const result = await apiGet('/test');

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should append query params to URL', async () => {
      const mockData = { items: [] };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      await apiGet('/items', { page: '1', limit: '10' });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/items?page=1&limit=10',
        expect.any(Object)
      );
    });

    it('should throw NetworkError on non-ok response', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: 'Not found' }),
      });

      await expect(apiGet('/not-found')).rejects.toThrow(NetworkError);
    });
  });

  describe('apiPost', () => {
    it('should make a POST request with JSON body', async () => {
      const mockResponse = { success: true };
      const requestData = { name: 'Test' };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await apiPost('/create', requestData);

      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/create',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(requestData),
        })
      );
    });
  });

  describe('checkHealth', () => {
    it('should return true when API is healthy', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ status: 'healthy' }),
      });

      const result = await checkHealth();

      expect(result).toBe(true);
    });

    it('should return false when API is unavailable', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Network error')
      );

      const result = await checkHealth();

      expect(result).toBe(false);
    });
  });
});
