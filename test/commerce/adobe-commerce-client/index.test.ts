/**
 * Copyright © Adobe, Inc. All rights reserved.
 */

import AdobeCommerceClient from '../../../src/commerce/adobe-commerce-client';
import {
  Connection,
  ExtendedRequestError,
} from '../../../src/commerce/adobe-commerce-client/types';
import { HttpStatus } from '../../../src/framework/runtime-action/types';

// Mock got
jest.mock('got', () => {
  const mockGotInstance = jest.fn() as any;
  mockGotInstance.extend = jest.fn(() => mockGotInstance);
  mockGotInstance.json = jest.fn();

  return {
    __esModule: true,
    default: mockGotInstance,
  };
});

// Mock @adobe/aio-sdk
jest.mock('@adobe/aio-sdk', () => ({
  Core: {
    Logger: jest.fn(() => ({
      debug: jest.fn(),
      error: jest.fn(),
    })),
  },
}));

import got from 'got';
import { Core } from '@adobe/aio-sdk';

describe('AdobeCommerceClient', () => {
  let mockConnection: jest.Mocked<Connection>;
  let mockLogger: any;
  let client: AdobeCommerceClient;
  const baseUrl = 'https://example.com';

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock connection
    mockConnection = {
      extend: jest.fn(),
    };

    // Mock logger
    mockLogger = {
      debug: jest.fn(),
      error: jest.fn(),
    };

    // Mock Core.Logger
    (Core.Logger as jest.Mock).mockReturnValue(mockLogger);

    client = new AdobeCommerceClient(baseUrl, mockConnection, mockLogger);
  });

  describe('Constructor', () => {
    it('should create instance with valid parameters', () => {
      expect(client).toBeInstanceOf(AdobeCommerceClient);
      expect(client['baseUrl']).toBe(baseUrl);
      expect(client['connection']).toBe(mockConnection);
      expect(client['logger']).toBe(mockLogger);
    });

    it('should throw error for empty baseUrl', () => {
      expect(() => new AdobeCommerceClient('', mockConnection, mockLogger)).toThrow(
        'Commerce URL must be provided'
      );
    });

    it('should throw error for null baseUrl', () => {
      expect(() => new AdobeCommerceClient(null as any, mockConnection, mockLogger)).toThrow(
        'Commerce URL must be provided'
      );
    });

    it('should throw error for undefined baseUrl', () => {
      expect(() => new AdobeCommerceClient(undefined as any, mockConnection, mockLogger)).toThrow(
        'Commerce URL must be provided'
      );
    });

    it('should create default logger when logger is null', () => {
      new AdobeCommerceClient(baseUrl, mockConnection, null);

      expect(Core.Logger).toHaveBeenCalledWith('adobe-commerce-client', {
        level: 'debug',
      });
    });

    it('should use provided logger when not null', () => {
      const customLogger = { debug: jest.fn(), error: jest.fn() };
      const clientWithCustomLogger = new AdobeCommerceClient(baseUrl, mockConnection, customLogger);

      expect(clientWithCustomLogger['logger']).toBe(customLogger);
    });
  });

  describe('HTTP Methods', () => {
    beforeEach(() => {
      // Setup mock got instance
      const mockGotInstance = got as jest.MockedFunction<typeof got>;

      // Create a mock client that can be called as a function and has .extend() method
      const mockClient = jest.fn() as any;
      mockClient.extend = jest.fn().mockReturnValue(mockClient);

      // When mockClient is called as a function, return an object with .json() method
      mockClient.mockReturnValue({
        json: jest.fn().mockResolvedValue({ data: 'test' }),
      });

      // Setup the chain: got.extend() -> client, connection.extend() -> client
      mockGotInstance.extend = jest.fn().mockReturnValue(mockClient);
      mockConnection.extend.mockResolvedValue(mockClient);
    });

    it('should make successful GET request', async () => {
      const response = await client.get('/test-endpoint');

      expect(response.success).toBe(true);
      expect(response.message).toEqual({ data: 'test' });
    });

    it('should make GET request with headers', async () => {
      const headers = { 'X-Test-Header': 'test-value' };
      const response = await client.get('/test-endpoint', headers);

      expect(response.success).toBe(true);
      expect(response.message).toEqual({ data: 'test' });
    });

    it('should make successful POST request without payload', async () => {
      const response = await client.post('/test-endpoint');

      expect(response.success).toBe(true);
      expect(response.message).toEqual({ data: 'test' });
    });

    it('should make POST request with headers and payload', async () => {
      const headers = { 'Content-Type': 'application/json' };
      const payload = { name: 'test' };

      const response = await client.post('/test-endpoint', headers, payload);

      expect(response.success).toBe(true);
      expect(response.message).toEqual({ data: 'test' });
    });

    it('should make successful PUT request without payload', async () => {
      const response = await client.put('/test-endpoint');

      expect(response.success).toBe(true);
      expect(response.message).toEqual({ data: 'test' });
    });

    it('should make PUT request with headers and payload', async () => {
      const headers = { Authorization: 'Bearer token' };
      const payload = { name: 'updated' };

      const response = await client.put('/test-endpoint', headers, payload);

      expect(response.success).toBe(true);
      expect(response.message).toEqual({ data: 'test' });
    });

    it('should make successful DELETE request', async () => {
      const response = await client.delete('/test-endpoint');

      expect(response.success).toBe(true);
      expect(response.message).toEqual({ data: 'test' });
    });

    it('should make DELETE request with headers', async () => {
      const headers = { 'X-Delete-Reason': 'cleanup' };

      const response = await client.delete('/test-endpoint', headers);

      expect(response.success).toBe(true);
      expect(response.message).toEqual({ data: 'test' });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      // Setup mock got instance that throws errors
      const mockGotInstance = got as jest.MockedFunction<typeof got>;

      // Create a base mock client for error scenarios
      const mockClient = jest.fn() as any;
      mockClient.extend = jest.fn().mockReturnValue(mockClient);

      // Setup the chain: got.extend() -> client, connection.extend() -> client
      mockGotInstance.extend = jest.fn().mockReturnValue(mockClient);
      mockConnection.extend.mockResolvedValue(mockClient);
    });

    it('should handle ERR_GOT_REQUEST_ERROR', async () => {
      const mockGotInstance = got as jest.MockedFunction<typeof got>;
      const mockClient = jest.fn() as any;
      mockClient.extend = jest.fn().mockReturnValue(mockClient);

      // Mock client to return an object with json() that rejects
      mockClient.mockReturnValue({
        json: jest.fn().mockRejectedValue({
          code: 'ERR_GOT_REQUEST_ERROR',
          message: 'Network error',
        }),
      });

      mockGotInstance.extend = jest.fn().mockReturnValue(mockClient);
      mockConnection.extend.mockResolvedValue(mockClient);

      const response = await client.get('/test-endpoint');

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(HttpStatus.INTERNAL_ERROR);
      expect(response.message).toContain('Unexpected error, check logs');
      expect(response.message).toContain('Network error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error while calling Commerce API',
        expect.any(Object)
      );
    });

    it('should handle HTTP error with response status', async () => {
      const mockError = {
        response: {
          statusCode: HttpStatus.NOT_FOUND,
        },
        message: 'Not Found',
      };

      const mockGotInstance = got as jest.MockedFunction<typeof got>;
      const mockClient = jest.fn() as any;
      mockClient.extend = jest.fn().mockReturnValue(mockClient);
      mockClient.mockReturnValue({
        json: jest.fn().mockRejectedValue(mockError),
      });

      mockGotInstance.extend = jest.fn().mockReturnValue(mockClient);
      mockConnection.extend.mockResolvedValue(mockClient);

      const response = await client.get('/test-endpoint');

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(response.message).toBe('Not Found');
    });

    it('should handle HTTP error with response body', async () => {
      const mockError: ExtendedRequestError = {
        response: {
          statusCode: HttpStatus.BAD_REQUEST,
        },
        message: 'Bad Request',
        responseBody: { error: 'Invalid input' },
      } as any;

      const mockGotInstance = got as jest.MockedFunction<typeof got>;
      const mockClient = jest.fn() as any;
      mockClient.extend = jest.fn().mockReturnValue(mockClient);
      mockClient.mockReturnValue({
        json: jest.fn().mockRejectedValue(mockError),
      });

      mockGotInstance.extend = jest.fn().mockReturnValue(mockClient);
      mockConnection.extend.mockResolvedValue(mockClient);

      const response = await client.post('/test-endpoint', {}, { invalid: 'data' });

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(response.message).toBe('Bad Request');
      expect(response.body).toEqual({ error: 'Invalid input' });
    });

    it('should handle error without response status (fallback to INTERNAL_ERROR)', async () => {
      const mockError = {
        message: 'Unknown error',
      };

      const mockGotInstance = got as jest.MockedFunction<typeof got>;
      const mockClient = jest.fn() as any;
      mockClient.extend = jest.fn().mockReturnValue(mockClient);
      mockClient.mockReturnValue({
        json: jest.fn().mockRejectedValue(mockError),
      });

      mockGotInstance.extend = jest.fn().mockReturnValue(mockClient);
      mockConnection.extend.mockResolvedValue(mockClient);

      const response = await client.get('/test-endpoint');

      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(HttpStatus.INTERNAL_ERROR);
      expect(response.message).toBe('Unknown error');
    });

    it('should handle different HTTP status codes correctly', async () => {
      const statusCodes = [
        HttpStatus.BAD_REQUEST,
        HttpStatus.UNAUTHORIZED,
        HttpStatus.NOT_FOUND,
        HttpStatus.METHOD_NOT_ALLOWED,
        HttpStatus.INTERNAL_ERROR,
      ];

      for (const statusCode of statusCodes) {
        const mockError = {
          response: { statusCode },
          message: `Error ${statusCode}`,
        };

        const mockGotInstance = got as jest.MockedFunction<typeof got>;
        const mockClient = jest.fn() as any;
        mockClient.extend = jest.fn().mockReturnValue(mockClient);
        mockClient.mockReturnValue({
          json: jest.fn().mockRejectedValue(mockError),
        });

        mockGotInstance.extend = jest.fn().mockReturnValue(mockClient);
        mockConnection.extend.mockResolvedValue(mockClient);

        const response = await client.get('/test-endpoint');

        expect(response.success).toBe(false);
        expect(response.statusCode).toBe(statusCode);
        expect(response.message).toBe(`Error ${statusCode}`);
      }
    });
  });

  describe('HTTP Client Configuration', () => {
    it('should configure got client correctly', async () => {
      const mockGotInstance = got as jest.MockedFunction<typeof got>;
      const mockClient = jest.fn() as any;
      mockClient.extend = jest.fn().mockReturnValue(mockClient);
      mockClient.mockReturnValue({
        json: jest.fn().mockResolvedValue({ success: true }),
      });

      mockGotInstance.extend = jest.fn().mockReturnValue(mockClient);
      mockConnection.extend.mockResolvedValue(mockClient);

      await client.get('/test');

      expect(mockGotInstance.extend).toHaveBeenCalledWith({
        http2: true,
        responseType: 'json',
        prefixUrl: baseUrl,
        headers: {
          'Content-Type': 'application/json',
        },
        hooks: {
          beforeRequest: expect.any(Array),
          beforeRetry: expect.any(Array),
          beforeError: expect.any(Array),
          afterResponse: expect.any(Array),
        },
      });
    });

    it('should call connection.extend with got instance', async () => {
      const mockGotInstance = got as jest.MockedFunction<typeof got>;
      const mockClient = jest.fn() as any;
      mockClient.extend = jest.fn().mockReturnValue(mockClient);
      mockClient.mockReturnValue({
        json: jest.fn().mockResolvedValue({ success: true }),
      });

      mockGotInstance.extend = jest.fn().mockReturnValue(mockClient);
      mockConnection.extend.mockResolvedValue(mockClient);

      await client.get('/test');

      expect(mockConnection.extend).toHaveBeenCalledWith(mockClient);
    });

    it('should handle payload correctly for POST/PUT', async () => {
      const mockGotInstance = got as jest.MockedFunction<typeof got>;
      const mockClient = jest.fn() as any;
      mockClient.extend = jest.fn().mockReturnValue(mockClient);
      mockClient.mockReturnValue({
        json: jest.fn().mockResolvedValue({ success: true }),
      });

      mockGotInstance.extend = jest.fn().mockReturnValue(mockClient);
      mockConnection.extend.mockResolvedValue(mockClient);

      const payload = { name: 'test', value: 123 };
      await client.post('/test', {}, payload);

      // Verify that json option is passed when payload is provided
      expect(mockClient).toHaveBeenCalledWith('/test', {
        method: 'POST',
        json: payload,
      });
    });

    it('should not include json option when payload is null', async () => {
      const mockGotInstance = got as jest.MockedFunction<typeof got>;
      const mockClient = jest.fn() as any;
      mockClient.extend = jest.fn().mockReturnValue(mockClient);
      mockClient.mockReturnValue({
        json: jest.fn().mockResolvedValue({ success: true }),
      });

      mockGotInstance.extend = jest.fn().mockReturnValue(mockClient);
      mockConnection.extend.mockResolvedValue(mockClient);

      await client.get('/test');

      // Verify that json option is not included when payload is null
      expect(mockClient).toHaveBeenCalledWith('/test', {
        method: 'GET',
      });
    });
  });

  describe('Logging', () => {
    it('should use custom logger when provided', () => {
      const customLogger = { debug: jest.fn(), error: jest.fn() };
      const clientWithCustomLogger = new AdobeCommerceClient(baseUrl, mockConnection, customLogger);

      expect(clientWithCustomLogger['logger']).toBe(customLogger);
      expect(Core.Logger).not.toHaveBeenCalled();
    });

    it('should create default logger when logger is null', () => {
      new AdobeCommerceClient(baseUrl, mockConnection, null);

      expect(Core.Logger).toHaveBeenCalledWith('adobe-commerce-client', {
        level: 'debug',
      });
    });

    it('should create default logger when no logger provided', () => {
      new AdobeCommerceClient(baseUrl, mockConnection);

      expect(Core.Logger).toHaveBeenCalledWith('adobe-commerce-client', {
        level: 'debug',
      });
    });
  });

  describe('Integration Tests', () => {
    it('should work end-to-end for typical commerce API workflow', async () => {
      const mockGotInstance = got as jest.MockedFunction<typeof got>;
      const mockClient = jest.fn() as any;
      mockClient.extend = jest.fn().mockReturnValue(mockClient);

      // Create different responses for different calls

      mockGotInstance.extend = jest.fn().mockReturnValue(mockClient);
      mockConnection.extend.mockResolvedValue(mockClient);

      // Mock different responses for different calls
      mockClient
        .mockReturnValueOnce({ json: jest.fn().mockResolvedValue({ products: [] }) }) // GET products
        .mockReturnValueOnce({ json: jest.fn().mockResolvedValue({ id: 1, name: 'New Product' }) }) // POST create product
        .mockReturnValueOnce({
          json: jest.fn().mockResolvedValue({ id: 1, name: 'Updated Product' }),
        }) // PUT update product
        .mockReturnValueOnce({ json: jest.fn().mockResolvedValue({}) }); // DELETE product

      // GET products
      const getResponse = await client.get('/rest/V1/products');
      expect(getResponse.success).toBe(true);
      expect(getResponse.message).toEqual({ products: [] });

      // POST create product
      const createResponse = await client.post('/rest/V1/products', {}, { name: 'New Product' });
      expect(createResponse.success).toBe(true);
      expect(createResponse.message).toEqual({ id: 1, name: 'New Product' });

      // PUT update product
      const updateResponse = await client.put(
        '/rest/V1/products/1',
        {},
        { name: 'Updated Product' }
      );
      expect(updateResponse.success).toBe(true);
      expect(updateResponse.message).toEqual({ id: 1, name: 'Updated Product' });

      // DELETE product
      const deleteResponse = await client.delete('/rest/V1/products/1');
      expect(deleteResponse.success).toBe(true);
      expect(deleteResponse.message).toEqual({});
    });

    it('should handle mixed success and error responses in workflow', async () => {
      const mockGotInstance = got as jest.MockedFunction<typeof got>;
      const mockClient = jest.fn() as any;
      mockClient.extend = jest.fn().mockReturnValue(mockClient);

      mockGotInstance.extend = jest.fn().mockReturnValue(mockClient);
      mockConnection.extend.mockResolvedValue(mockClient);

      // Mock success then error
      mockClient
        .mockReturnValueOnce({ json: jest.fn().mockResolvedValue({ success: true }) })
        .mockReturnValueOnce({
          json: jest.fn().mockRejectedValue({
            response: { statusCode: HttpStatus.BAD_REQUEST },
            message: 'Invalid data',
          }),
        });

      // Successful call
      const successResponse = await client.get('/test-success');
      expect(successResponse.success).toBe(true);

      // Failed call
      const errorResponse = await client.post('/test-error', {}, { invalid: 'data' });
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(errorResponse.message).toBe('Invalid data');
    });
  });
});
