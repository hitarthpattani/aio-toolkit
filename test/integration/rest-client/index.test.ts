/**
 * Adobe App Builder REST Client tests
 *
 * Copyright © Adobe, Inc. All rights reserved.
 */

import fetch from 'node-fetch';
import RestClient from '../../../src/integration/rest-client';

// Mock node-fetch
jest.mock('node-fetch');
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('RestClient', () => {
  let restClient: RestClient;

  beforeEach(() => {
    restClient = new RestClient();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('get', () => {
    it('should make a successful GET request', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        json: jest.fn().mockResolvedValue({ data: 'test' }),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await restClient.get('https://api.example.com/data');

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/data', {
        method: 'GET',
        headers: {},
      });
      expect(result).toEqual({ data: 'test' });
    });

    it('should make a GET request with custom headers', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        json: jest.fn().mockResolvedValue({ data: 'test' }),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const headers = { Authorization: 'Bearer token123' };
      const result = await restClient.get('https://api.example.com/data', headers);

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/data', {
        method: 'GET',
        headers: { Authorization: 'Bearer token123' },
      });
      expect(result).toEqual({ data: 'test' });
    });
  });

  describe('post', () => {
    it('should make a successful POST request without payload', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        json: jest.fn().mockResolvedValue({ success: true }),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await restClient.post('https://api.example.com/create');

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/create', {
        method: 'POST',
        headers: {},
      });
      expect(result).toEqual({ success: true });
    });

    it('should make a POST request with payload', async () => {
      const mockResponse = {
        ok: true,
        status: 201,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        json: jest.fn().mockResolvedValue({ id: 123 }),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const payload = { name: 'Test Item', value: 42 };
      const headers = { Authorization: 'Bearer token123' };
      const result = await restClient.post('https://api.example.com/create', headers, payload);

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/create', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer token123',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      expect(result).toEqual({ id: 123 });
    });
  });

  describe('put', () => {
    it('should make a successful PUT request', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        json: jest.fn().mockResolvedValue({ updated: true }),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const payload = { name: 'Updated Item', value: 100 };
      const result = await restClient.put('https://api.example.com/update/123', {}, payload);

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/update/123', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      expect(result).toEqual({ updated: true });
    });

    it('should make a PUT request without payload', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        json: jest.fn().mockResolvedValue({ updated: true }),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await restClient.put('https://api.example.com/update/123');

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/update/123', {
        method: 'PUT',
        headers: {},
      });
      expect(result).toEqual({ updated: true });
    });
  });

  describe('delete', () => {
    it('should make a successful DELETE request', async () => {
      const mockResponse = {
        ok: true,
        status: 204,
        headers: {
          get: jest.fn().mockReturnValue('0'),
        },
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await restClient.delete('https://api.example.com/delete/123');

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/delete/123', {
        method: 'DELETE',
        headers: {},
      });
      expect(result).toBeNull();
    });

    it('should make a DELETE request with custom headers', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        json: jest.fn().mockResolvedValue({ deleted: true }),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const headers = { Authorization: 'Bearer token123' };
      const result = await restClient.delete('https://api.example.com/delete/123', headers);

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/delete/123', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer token123' },
      });
      expect(result).toEqual({ deleted: true });
    });
  });

  describe('apiCall', () => {
    it('should handle HTTP errors', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      await expect(restClient.apiCall('https://api.example.com/notfound')).rejects.toThrow(
        'HTTP error! status: 404'
      );
    });

    it('should handle 204 No Content response', async () => {
      const mockResponse = {
        ok: true,
        status: 204,
        headers: {
          get: jest.fn().mockReturnValue('0'),
        },
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await restClient.apiCall('https://api.example.com/create');

      expect(result).toBeNull();
    });

    it('should handle responses with content-length 0', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('0'),
        },
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await restClient.apiCall('https://api.example.com/empty');

      expect(result).toBeNull();
    });

    it('should handle JSON response with application/hal+json content-type', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('application/hal+json'),
        },
        json: jest.fn().mockResolvedValue({ _embedded: { items: [] } }),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await restClient.apiCall('https://api.example.com/hal');

      expect(result).toEqual({ _embedded: { items: [] } });
    });

    it('should handle text response for non-JSON content-type', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('text/plain'),
        },
        json: jest.fn(),
        text: jest.fn().mockResolvedValue('Plain text response'),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await restClient.apiCall('https://api.example.com/text');

      expect(result).toBe('Plain text response');
    });

    it('should handle responses without content-type header (mocked responses)', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue(null),
        },
        json: jest.fn().mockResolvedValue({ mocked: true }),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await restClient.apiCall('https://api.example.com/mocked');

      expect(result).toEqual({ mocked: true });
    });

    it('should handle responses without json/text methods', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await restClient.apiCall('https://api.example.com/minimal');

      expect(result).toBeNull();
    });

    it('should handle fetch errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(restClient.apiCall('https://api.example.com/error')).rejects.toThrow(
        'Network error'
      );

      expect(consoleSpy).toHaveBeenCalledWith('API call error:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should use default method POST when not specified', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        json: jest.fn().mockResolvedValue({ success: true }),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      await restClient.apiCall('https://api.example.com/default');

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/default', {
        method: 'POST',
        headers: {},
      });
    });

    it('should handle custom HTTP methods', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        json: jest.fn().mockResolvedValue({ patched: true }),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const payload = { field: 'value' };
      await restClient.apiCall('https://api.example.com/patch', 'PATCH', {}, payload);

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/patch', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    });

    it('should merge headers correctly when payload is provided', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        json: jest.fn().mockResolvedValue({ success: true }),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const customHeaders = { Authorization: 'Bearer token', 'X-Custom': 'value' };
      const payload = { data: 'test' };

      await restClient.apiCall('https://api.example.com/merge', 'POST', customHeaders, payload);

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/merge', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer token',
          'X-Custom': 'value',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    });
  });

  describe('integration tests', () => {
    it('should work end-to-end for a typical REST API workflow', async () => {
      // Create
      const createResponse = {
        ok: true,
        status: 201,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        json: jest.fn().mockResolvedValue({ id: 1, name: 'Test Item', value: 100 }),
      };
      mockFetch.mockResolvedValueOnce(createResponse as any);

      const created = await restClient.post(
        'https://api.example.com/items',
        { Authorization: 'Bearer token' },
        { name: 'Test Item', value: 100 }
      );

      expect(created).toEqual({ id: 1, name: 'Test Item', value: 100 });

      // Read
      const readResponse = {
        ok: true,
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        json: jest.fn().mockResolvedValue({ id: 1, name: 'Test Item', value: 100 }),
      };
      mockFetch.mockResolvedValueOnce(readResponse as any);

      const retrieved = await restClient.get('https://api.example.com/items/1', {
        Authorization: 'Bearer token',
      });

      expect(retrieved).toEqual({ id: 1, name: 'Test Item', value: 100 });

      // Update
      const updateResponse = {
        ok: true,
        status: 200,
        headers: {
          get: jest.fn().mockReturnValue('application/json'),
        },
        json: jest.fn().mockResolvedValue({ id: 1, name: 'Updated Item', value: 200 }),
      };
      mockFetch.mockResolvedValueOnce(updateResponse as any);

      const updated = await restClient.put(
        'https://api.example.com/items/1',
        { Authorization: 'Bearer token' },
        { name: 'Updated Item', value: 200 }
      );

      expect(updated).toEqual({ id: 1, name: 'Updated Item', value: 200 });

      // Delete
      const deleteResponse = {
        ok: true,
        status: 204,
        headers: {
          get: jest.fn().mockReturnValue('0'),
        },
      };
      mockFetch.mockResolvedValueOnce(deleteResponse as any);

      const deleteResult = await restClient.delete('https://api.example.com/items/1', {
        Authorization: 'Bearer token',
      });

      expect(deleteResult).toBeNull();
    });
  });
});
