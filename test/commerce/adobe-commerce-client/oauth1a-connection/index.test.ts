/**
 * Copyright © Adobe, Inc. All rights reserved.
 */

import Oauth1aConnection from '../../../../src/commerce/adobe-commerce-client/oauth1a-connection';
import { Connection } from '../../../../src/commerce/adobe-commerce-client/types';
import { Got } from 'got';

// Mock @adobe/aio-sdk
jest.mock('@adobe/aio-sdk', () => ({
  Core: {
    Logger: jest.fn(() => ({
      debug: jest.fn(),
      error: jest.fn(),
    })),
  },
}));

// Mock oauth-1.0a
const mockOauth = {
  authorize: jest.fn(),
  toHeader: jest.fn(),
};

jest.mock('oauth-1.0a', () => {
  return jest.fn().mockImplementation(() => mockOauth);
});

// Mock crypto
jest.mock('crypto', () => ({
  createHmac: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('mocked-signature'),
  }),
}));

import { Core } from '@adobe/aio-sdk';
import Oauth1a from 'oauth-1.0a';
import * as crypto from 'crypto';

describe('Oauth1aConnection', () => {
  let connection: Oauth1aConnection;
  let mockLogger: any;
  let mockCommerceGot: any;

  const consumerKey = 'test-consumer-key';
  const consumerSecret = 'test-consumer-secret';
  const accessToken = 'test-access-token';
  const accessTokenSecret = 'test-access-token-secret';

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock logger
    mockLogger = {
      debug: jest.fn(),
      error: jest.fn(),
    };

    // Mock commerce Got instance
    mockCommerceGot = {
      extend: jest.fn(),
    } as unknown as jest.Mocked<Got>;

    // Setup mocks
    (Core.Logger as jest.Mock).mockReturnValue(mockLogger);
    mockOauth.authorize.mockReturnValue({ oauth_signature: 'test-signature' });
    mockOauth.toHeader.mockReturnValue({ Authorization: 'OAuth oauth_signature="test-signature"' });

    connection = new Oauth1aConnection(
      consumerKey,
      consumerSecret,
      accessToken,
      accessTokenSecret,
      mockLogger
    );
  });

  describe('Constructor', () => {
    it('should create instance with valid parameters', () => {
      expect(connection).toBeInstanceOf(Oauth1aConnection);
      expect(connection).toBeInstanceOf(Object);
      expect(connection['consumerKey']).toBe(consumerKey);
      expect(connection['consumerSecret']).toBe(consumerSecret);
      expect(connection['accessToken']).toBe(accessToken);
      expect(connection['accessTokenSecret']).toBe(accessTokenSecret);
      expect(connection['logger']).toBe(mockLogger);
    });

    it('should implement Connection interface', () => {
      const connectionInterface: Connection = connection;
      expect(typeof connectionInterface.extend).toBe('function');
    });

    it('should create default logger when logger is null', () => {
      new Oauth1aConnection(consumerKey, consumerSecret, accessToken, accessTokenSecret, null);

      expect(Core.Logger).toHaveBeenCalledWith('adobe-commerce-client', {
        level: 'debug',
      });
    });

    it('should use provided logger when not null', () => {
      const customLogger = { debug: jest.fn(), error: jest.fn() };
      const customConnection = new Oauth1aConnection(
        consumerKey,
        consumerSecret,
        accessToken,
        accessTokenSecret,
        customLogger
      );

      expect(customConnection['logger']).toBe(customLogger);
    });

    it('should create default logger when logger parameter is undefined', () => {
      new Oauth1aConnection(consumerKey, consumerSecret, accessToken, accessTokenSecret);

      expect(Core.Logger).toHaveBeenCalledWith('adobe-commerce-client', {
        level: 'debug',
      });
    });

    it('should store all OAuth credentials correctly', () => {
      expect(connection['consumerKey']).toBe(consumerKey);
      expect(connection['consumerSecret']).toBe(consumerSecret);
      expect(connection['accessToken']).toBe(accessToken);
      expect(connection['accessTokenSecret']).toBe(accessTokenSecret);
    });
  });

  describe('extend', () => {
    it('should extend commerce client with OAuth handler', async () => {
      const extendedClient = { extended: true } as any;
      mockCommerceGot.extend.mockReturnValue(extendedClient);

      const result = await connection.extend(mockCommerceGot);

      expect(result).toBe(extendedClient);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Using Commerce client with integration options'
      );
      expect(mockCommerceGot.extend).toHaveBeenCalledWith({
        handlers: [expect.any(Function)],
      });
    });

    it('should configure OAuth handler that modifies request options', async () => {
      const extendedClient = { extended: true } as any;
      let capturedHandler: ((options: any, next: any) => Promise<any>) | undefined;

      mockCommerceGot.extend.mockImplementation((config: any) => {
        capturedHandler = config.handlers[0];
        return extendedClient;
      });

      await connection.extend(mockCommerceGot);

      expect(capturedHandler).toBeDefined();

      // Test the handler
      const mockOptions = {
        url: new URL('https://example.com/api/test'),
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      };
      const mockNext = jest.fn().mockResolvedValue('handler-result');

      const result = await capturedHandler!(mockOptions, mockNext);
      expect(mockOptions.headers).toEqual({
        'Content-Type': 'application/json',
        Authorization: 'OAuth oauth_signature="test-signature"',
      });
      expect(mockNext).toHaveBeenCalledWith(mockOptions);
      expect(result).toBe('handler-result');
    });

    it('should handle handler execution with URL object', async () => {
      const extendedClient = { extended: true } as any;
      let capturedHandler: ((options: any, next: any) => Promise<any>) | undefined;

      mockCommerceGot.extend.mockImplementation((config: any) => {
        capturedHandler = config.handlers[0];
        return extendedClient;
      });

      await connection.extend(mockCommerceGot);

      // Test with URL object
      const mockOptions = {
        url: new URL('https://example.com/api/products'),
        method: 'POST',
        headers: {},
      };
      const mockNext = jest.fn().mockResolvedValue('post-result');

      await capturedHandler!(mockOptions, mockNext);

      expect(mockOptions.headers).toHaveProperty('Authorization');
      expect(mockNext).toHaveBeenCalledWith(mockOptions);
    });

    it('should handle extend failure', async () => {
      const extendError = new Error('Extend failed');
      mockCommerceGot.extend.mockImplementation(() => {
        throw extendError;
      });

      await expect(connection.extend(mockCommerceGot)).rejects.toThrow('Extend failed');
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Using Commerce client with integration options'
      );
    });

    it('should return the extended Got instance', async () => {
      const extendedClient = {
        extended: true,
        get: jest.fn(),
        post: jest.fn(),
      } as any;

      mockCommerceGot.extend.mockReturnValue(extendedClient);

      const result = await connection.extend(mockCommerceGot);

      expect(result).toBe(extendedClient);
      expect((result as any).extended).toBe(true);
    });
  });

  describe('headersProvider', () => {
    it('should create OAuth instance with correct configuration', () => {
      const headersProvider = connection.headersProvider();

      expect(Oauth1a).toHaveBeenCalledWith({
        consumer: {
          key: consumerKey,
          secret: consumerSecret,
        },
        signature_method: 'HMAC-SHA256',
        hash_function: expect.any(Function),
      });

      expect(headersProvider).toBeInstanceOf(Function);
    });

    it('should return function that generates OAuth headers', () => {
      const headersProvider = connection.headersProvider();
      const url = 'https://example.com/api/test';
      const method = 'GET';

      const headers = headersProvider(url, method);

      expect(mockOauth.authorize).toHaveBeenCalledWith(
        { url, method },
        {
          key: accessToken,
          secret: accessTokenSecret,
        }
      );
      expect(mockOauth.toHeader).toHaveBeenCalledWith({ oauth_signature: 'test-signature' });
      expect(headers).toEqual({ Authorization: 'OAuth oauth_signature="test-signature"' });
    });

    it('should handle different HTTP methods', () => {
      const headersProvider = connection.headersProvider();
      const url = 'https://example.com/api/products';

      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      methods.forEach(method => {
        headersProvider(url, method);
        expect(mockOauth.authorize).toHaveBeenCalledWith(
          { url, method },
          {
            key: accessToken,
            secret: accessTokenSecret,
          }
        );
      });
    });

    it('should handle different URLs', () => {
      const headersProvider = connection.headersProvider();
      const method = 'GET';

      const urls = [
        'https://example.com/api/products',
        'https://example.com/api/categories/1',
        'https://example.com/rest/V1/products',
        'https://example.com/rest/V1/orders?status=pending',
      ];

      urls.forEach(url => {
        headersProvider(url, method);
        expect(mockOauth.authorize).toHaveBeenCalledWith(
          { url, method },
          {
            key: accessToken,
            secret: accessTokenSecret,
          }
        );
      });
    });

    it('should use HMAC-SHA256 hash function correctly', () => {
      connection.headersProvider();

      // Get the hash function that was passed to Oauth1a constructor
      const oauthCall = (Oauth1a as any).mock.calls[0][0];
      const hashFunction = oauthCall.hash_function;

      const baseString = 'test-base-string';
      const key = 'test-key';

      const result = hashFunction(baseString, key);

      expect(crypto.createHmac).toHaveBeenCalledWith('sha256', key);
      expect(result).toBe('mocked-signature');
    });

    it('should create new OAuth instance for each headersProvider call', () => {
      // Clear previous mock calls
      (Oauth1a as any).mockClear();

      connection.headersProvider();
      connection.headersProvider();

      expect(Oauth1a).toHaveBeenCalledTimes(2);
    });

    it('should use correct OAuth token configuration', () => {
      connection.headersProvider();

      const headersProvider = connection.headersProvider();
      headersProvider('https://test.com', 'GET');

      expect(mockOauth.authorize).toHaveBeenCalledWith(expect.any(Object), {
        key: accessToken,
        secret: accessTokenSecret,
      });
    });
  });

  describe('Integration Tests', () => {
    it('should work end-to-end with realistic OAuth workflow', async () => {
      const realisticUrl = 'https://magento.example.com/rest/V1/products';
      const realisticMethod = 'GET';
      const realisticAuthHeader =
        'OAuth oauth_consumer_key="' + consumerKey + '", oauth_signature="realistic-signature"';

      mockOauth.toHeader.mockReturnValue({ Authorization: realisticAuthHeader });

      const extendedClient = {
        get: jest.fn(),
        post: jest.fn(),
        extended: true,
      } as any;

      let capturedHandler: ((options: any, next: any) => Promise<any>) | undefined;
      mockCommerceGot.extend.mockImplementation((config: any) => {
        capturedHandler = config.handlers[0];
        return extendedClient;
      });

      // Execute extend
      const result = await connection.extend(mockCommerceGot);

      expect(result).toBe(extendedClient);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Using Commerce client with integration options'
      );

      // Test the handler with realistic parameters
      const mockOptions = {
        url: new URL(realisticUrl),
        method: realisticMethod,
        headers: { 'Content-Type': 'application/json' },
      };
      const mockNext = jest.fn().mockResolvedValue('realistic-result');

      await capturedHandler!(mockOptions, mockNext);

      expect(mockOauth.authorize).toHaveBeenCalledWith(
        { url: realisticUrl, method: realisticMethod },
        {
          key: accessToken,
          secret: accessTokenSecret,
        }
      );
      expect(mockOptions.headers).toEqual({
        'Content-Type': 'application/json',
        Authorization: realisticAuthHeader,
      });
    });

    it('should handle multiple sequential requests with different parameters', async () => {
      const extendedClient = { extended: true } as any;
      let capturedHandler: ((options: any, next: any) => Promise<any>) | undefined;

      mockCommerceGot.extend.mockImplementation((config: any) => {
        capturedHandler = config.handlers[0];
        return extendedClient;
      });

      await connection.extend(mockCommerceGot);

      const requests = [
        { url: 'https://example.com/api/products', method: 'GET' },
        { url: 'https://example.com/api/orders', method: 'POST' },
        { url: 'https://example.com/api/categories/1', method: 'PUT' },
      ];

      const mockNext = jest.fn().mockResolvedValue('success');

      for (const request of requests) {
        const mockOptions = {
          url: new URL(request.url),
          method: request.method,
          headers: {},
        };

        await capturedHandler!(mockOptions, mockNext);

        expect(mockOauth.authorize).toHaveBeenCalledWith(
          { url: request.url, method: request.method },
          {
            key: accessToken,
            secret: accessTokenSecret,
          }
        );
      }

      expect(mockNext).toHaveBeenCalledTimes(3);
    });

    it('should work with different connection instances', async () => {
      const connection2 = new Oauth1aConnection(
        'key2',
        'secret2',
        'token2',
        'tokenSecret2',
        mockLogger
      );

      const client1 = { extend: jest.fn().mockReturnValue({ client: 1 }) } as any;
      const client2 = { extend: jest.fn().mockReturnValue({ client: 2 }) } as any;

      const result1 = await connection.extend(client1);
      const result2 = await connection2.extend(client2);

      expect(result1).toEqual({ client: 1 });
      expect(result2).toEqual({ client: 2 });
      expect(client1.extend).toHaveBeenCalledWith({ handlers: [expect.any(Function)] });
      expect(client2.extend).toHaveBeenCalledWith({ handlers: [expect.any(Function)] });
    });

    it('should handle crypto hash function integration', () => {
      const mockHmac = {
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue('integrated-signature'),
      };
      (crypto.createHmac as jest.Mock).mockReturnValue(mockHmac);

      // Get the hash function from OAuth configuration
      connection.headersProvider();
      const oauthCall = (Oauth1a as any).mock.calls[0][0];
      const hashFunction = oauthCall.hash_function;

      const result = hashFunction('base-string', 'signing-key');

      expect(crypto.createHmac).toHaveBeenCalledWith('sha256', 'signing-key');
      expect(mockHmac.update).toHaveBeenCalledWith('base-string');
      expect(mockHmac.digest).toHaveBeenCalledWith('base64');
      expect(result).toBe('integrated-signature');
    });
  });
});
