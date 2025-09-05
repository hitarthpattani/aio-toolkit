/**
 * Copyright © Adobe, Inc. All rights reserved.
 */

import { Got, RequestError } from 'got';
import {
  Connection,
  ExtendedRequestError,
} from '../../../src/commerce/adobe-commerce-client/types';

describe('Adobe Commerce Client Types', () => {
  describe('Connection interface', () => {
    it('should define a valid connection with extend method', () => {
      const mockGot = {} as Got;
      const mockExtendedGot = {} as Got;

      const connection: Connection = {
        extend: async (_client: Got): Promise<Got> => {
          expect(_client).toBe(mockGot);
          return mockExtendedGot;
        },
      };

      // Test the connection interface
      expect(connection).toBeDefined();
      expect(typeof connection.extend).toBe('function');
    });

    it('should work with realistic connection implementation', async () => {
      const mockGot = {
        extend: jest.fn().mockReturnValue({}),
      } as unknown as Got;

      const mockExtendedGot = {
        extend: jest.fn(),
        get: jest.fn(),
        post: jest.fn(),
      } as unknown as Got;

      const connection: Connection = {
        extend: jest.fn().mockResolvedValue(mockExtendedGot),
      };

      const result = await connection.extend(mockGot);

      expect(connection.extend).toHaveBeenCalledWith(mockGot);
      expect(result).toBe(mockExtendedGot);
    });

    it('should handle promise-based extend method', async () => {
      const mockGot = {} as Got;
      const mockExtendedGot = {} as Got;

      const connection: Connection = {
        extend: (_client: Got) => Promise.resolve(mockExtendedGot),
      };

      const result = await connection.extend(mockGot);
      expect(result).toBe(mockExtendedGot);
    });

    it('should handle async extend method', async () => {
      const mockGot = {} as Got;

      const connection: Connection = {
        extend: async (client: Got) => {
          // Simulate some async work
          await new Promise(resolve => setTimeout(resolve, 1));
          return client;
        },
      };

      const result = await connection.extend(mockGot);
      expect(result).toBe(mockGot);
    });
  });

  describe('ExtendedRequestError interface', () => {
    it('should extend RequestError with responseBody property', () => {
      const baseError = new Error('Test error') as RequestError;
      baseError.name = 'RequestError';

      const extendedError: ExtendedRequestError = Object.assign(baseError, {
        responseBody: { error: 'API Error', code: 400 },
      });
      expect(extendedError.responseBody).toEqual({ error: 'API Error', code: 400 });
      expect(extendedError.message).toBe('Test error');
    });

    it('should allow undefined responseBody', () => {
      const baseError = new Error('Test error') as RequestError;

      const extendedError: ExtendedRequestError = {
        ...baseError,
        responseBody: undefined,
      };

      expect(extendedError.responseBody).toBeUndefined();
    });

    it('should allow responseBody to be any type', () => {
      const baseError = new Error('Test error') as RequestError;

      // Test with object
      const extendedError1: ExtendedRequestError = {
        ...baseError,
        code: 'TEST_ERROR',
        options: {} as any,
        responseBody: { message: 'Error', status: 500 },
      };

      // Test with string
      const extendedError2: ExtendedRequestError = {
        ...baseError,
        code: 'TEST_ERROR',
        options: {} as any,
        responseBody: 'String error message',
      };

      // Test with array
      const extendedError3: ExtendedRequestError = {
        ...baseError,
        code: 'TEST_ERROR',
        options: {} as any,
        responseBody: ['error1', 'error2'],
      };

      // Test with number
      const extendedError4: ExtendedRequestError = {
        ...baseError,
        code: 'TEST_ERROR',
        options: {} as any,
        responseBody: 404,
      };

      expect(extendedError1.responseBody).toEqual({ message: 'Error', status: 500 });
      expect(extendedError2.responseBody).toBe('String error message');
      expect(extendedError3.responseBody).toEqual(['error1', 'error2']);
      expect(extendedError4.responseBody).toBe(404);
    });

    it('should work with realistic error scenarios', () => {
      // Simulate a got RequestError
      const requestError = Object.assign(new Error('Request failed'), {
        name: 'RequestError',
        code: 'ENOTFOUND',
        request: {},
        response: {
          statusCode: 404,
          body: { message: 'Not Found' },
        },
      }) as RequestError;

      const extendedError: ExtendedRequestError = {
        ...requestError,
        responseBody: { message: 'Not Found', details: 'Resource does not exist' },
      };

      expect(extendedError.name).toBe('RequestError');
      expect(extendedError.code).toBe('ENOTFOUND');
      expect(extendedError.responseBody).toEqual({
        message: 'Not Found',
        details: 'Resource does not exist',
      });
    });

    it('should maintain all RequestError properties', () => {
      // Create a realistic RequestError
      const error = new Error('HTTP 500 Internal Server Error');
      const requestError = Object.assign(error, {
        name: 'HTTPError',
        code: 'ERR_NON_2XX_3XX_RESPONSE',
        request: { method: 'GET', url: 'https://example.com/api' },
        response: {
          statusCode: 500,
          statusMessage: 'Internal Server Error',
          headers: { 'content-type': 'application/json' },
        },
        options: {} as any,
      }) as unknown as RequestError;

      const extendedError: ExtendedRequestError = Object.assign(requestError, {
        responseBody: {
          error: 'Database connection failed',
          timestamp: '2023-01-01T00:00:00Z',
        },
      });

      // Verify all original properties are maintained
      expect(extendedError.name).toBe('HTTPError');
      expect(extendedError.code).toBe('ERR_NON_2XX_3XX_RESPONSE');
      expect(extendedError.message).toBe('HTTP 500 Internal Server Error');
      expect(extendedError.request).toBeDefined();
      expect(extendedError.response).toBeDefined();

      // Verify new property is added
      expect(extendedError.responseBody).toEqual({
        error: 'Database connection failed',
        timestamp: '2023-01-01T00:00:00Z',
      });
    });

    it('should be compatible with error handling patterns', () => {
      const handleError = (error: ExtendedRequestError): string => {
        if (error.responseBody) {
          return `API Error: ${JSON.stringify(error.responseBody)}`;
        }
        return `Request Error: ${error.message}`;
      };

      // Error with responseBody
      const errorWithBody: ExtendedRequestError = Object.assign(new Error('API Error'), {
        code: 'VALIDATION_FAILED',
        options: {} as any,
        responseBody: { code: 'VALIDATION_FAILED', message: 'Invalid input' },
      }) as unknown as ExtendedRequestError;

      // Error without responseBody
      const errorWithoutBody: ExtendedRequestError = Object.assign(new Error('Network Error'), {
        code: 'NETWORK_ERROR',
        options: {} as any,
        responseBody: undefined,
      }) as unknown as ExtendedRequestError;

      expect(handleError(errorWithBody)).toBe(
        'API Error: {"code":"VALIDATION_FAILED","message":"Invalid input"}'
      );
      expect(handleError(errorWithoutBody)).toBe('Request Error: Network Error');
    });
  });

  describe('Type Compatibility', () => {
    it('should be compatible with got library types', () => {
      // Verify that our types can work with actual got types
      const mockGotInstance: Got = {} as Got;

      const connection: Connection = {
        extend: async (client: Got) => {
          // Should accept Got type without type errors
          expect(client).toBe(mockGotInstance);
          return client;
        },
      };

      // This should compile without type errors
      expect(typeof connection.extend).toBe('function');
    });

    it('should handle type inference correctly', async () => {
      const connection: Connection = {
        extend: async client => {
          // client should be inferred as Got type
          return client;
        },
      };

      const mockGot = {} as Got;
      const result = await connection.extend(mockGot);

      // result should be of type Got
      expect(result).toBe(mockGot);
    });
  });
});
