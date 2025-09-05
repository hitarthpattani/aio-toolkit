/**
 * <license header>
 */

import BasicAuthConnection from '../../../../src/commerce/adobe-commerce-client/basic-auth-connection';
import { Connection } from '../../../../src/commerce/adobe-commerce-client/types';

// Mock @adobe/aio-sdk
jest.mock('@adobe/aio-sdk', () => ({
  Core: {
    Logger: jest.fn(() => ({
      debug: jest.fn(),
      error: jest.fn(),
    })),
  },
}));

// Mock GenerateBasicAuthToken
jest.mock(
  '../../../../src/commerce/adobe-commerce-client/basic-auth-connection/generate-basic-auth-token',
  () => {
    return jest.fn().mockImplementation(() => ({
      execute: jest.fn(),
    }));
  }
);

import { Core } from '@adobe/aio-sdk';
import GenerateBasicAuthToken from '../../../../src/commerce/adobe-commerce-client/basic-auth-connection/generate-basic-auth-token';

describe('BasicAuthConnection', () => {
  let connection: BasicAuthConnection;
  let mockLogger: any;
  let mockGenerateToken: any;
  let mockCommerceGot: any;

  const baseUrl = 'https://example.magento.com';
  const username = 'admin';
  const password = 'password123';

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock logger
    mockLogger = {
      debug: jest.fn(),
      error: jest.fn(),
    };

    // Mock GenerateBasicAuthToken instance
    mockGenerateToken = {
      execute: jest.fn(),
    };

    // Mock commerce Got instance
    mockCommerceGot = {
      extend: jest.fn(),
    };

    // Setup mocks
    (Core.Logger as jest.Mock).mockReturnValue(mockLogger);
    (GenerateBasicAuthToken as jest.MockedClass<typeof GenerateBasicAuthToken>).mockImplementation(
      () => mockGenerateToken
    );

    connection = new BasicAuthConnection(baseUrl, username, password, mockLogger);
  });

  describe('Constructor', () => {
    it('should create instance with valid parameters', () => {
      expect(connection).toBeInstanceOf(BasicAuthConnection);
      expect(connection).toBeInstanceOf(Object);
      expect(connection['baseUrl']).toBe(baseUrl);
      expect(connection['username']).toBe(username);
      expect(connection['password']).toBe(password);
      expect(connection['logger']).toBe(mockLogger);
    });

    it('should implement Connection interface', () => {
      const connectionInterface: Connection = connection;
      expect(typeof connectionInterface.extend).toBe('function');
    });

    it('should create default logger when logger is null', () => {
      new BasicAuthConnection(baseUrl, username, password, null);

      expect(Core.Logger).toHaveBeenCalledWith('adobe-commerce-client', {
        level: 'debug',
      });
    });

    it('should use provided logger when not null', () => {
      const customLogger = { debug: jest.fn(), error: jest.fn() };
      const customConnection = new BasicAuthConnection(baseUrl, username, password, customLogger);

      expect(customConnection['logger']).toBe(customLogger);
    });

    it('should create default logger when logger parameter is undefined', () => {
      new BasicAuthConnection(baseUrl, username, password);

      expect(Core.Logger).toHaveBeenCalledWith('adobe-commerce-client', {
        level: 'debug',
      });
    });

    it('should store all constructor parameters correctly', () => {
      const testConnection = new BasicAuthConnection(baseUrl, username, password, mockLogger);

      expect(testConnection['baseUrl']).toBe(baseUrl);
      expect(testConnection['username']).toBe(username);
      expect(testConnection['password']).toBe(password);
      expect(testConnection['logger']).toBe(mockLogger);
    });
  });

  describe('extend', () => {
    it('should extend commerce client with Bearer token authorization', async () => {
      const generatedToken = 'generated-auth-token';
      const extendedClient = { extended: true };

      mockGenerateToken.execute.mockResolvedValue(generatedToken);
      mockCommerceGot.extend.mockReturnValue(extendedClient);

      const result = await connection.extend(mockCommerceGot);

      expect(result).toBe(extendedClient);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Using Commerce client with integration options'
      );
      expect(GenerateBasicAuthToken).toHaveBeenCalledWith(baseUrl, username, password, mockLogger);
      expect(mockGenerateToken.execute).toHaveBeenCalled();
      expect(mockCommerceGot.extend).toHaveBeenCalledWith({
        headers: {
          Authorization: `Bearer ${generatedToken}`,
        },
      });
    });

    it('should handle null token from token generator', async () => {
      const extendedClient = { extended: true };

      mockGenerateToken.execute.mockResolvedValue(null);
      mockCommerceGot.extend.mockReturnValue(extendedClient);

      const result = await connection.extend(mockCommerceGot);

      expect(result).toBe(extendedClient);
      expect(mockCommerceGot.extend).toHaveBeenCalledWith({
        headers: {
          Authorization: 'Bearer null',
        },
      });
    });

    it('should handle empty token from token generator', async () => {
      const extendedClient = { extended: true };

      mockGenerateToken.execute.mockResolvedValue('');
      mockCommerceGot.extend.mockReturnValue(extendedClient);

      const result = await connection.extend(mockCommerceGot);

      expect(result).toBe(extendedClient);
      expect(mockCommerceGot.extend).toHaveBeenCalledWith({
        headers: {
          Authorization: 'Bearer ',
        },
      });
    });

    it('should create new token generator instance for each extend call', async () => {
      const token1 = 'token-1';
      const token2 = 'token-2';

      mockGenerateToken.execute.mockResolvedValueOnce(token1).mockResolvedValueOnce(token2);

      mockCommerceGot.extend.mockReturnValue({ extended: true });

      // First call
      await connection.extend(mockCommerceGot);
      expect(GenerateBasicAuthToken).toHaveBeenNthCalledWith(
        1,
        baseUrl,
        username,
        password,
        mockLogger
      );

      // Second call
      await connection.extend(mockCommerceGot);
      expect(GenerateBasicAuthToken).toHaveBeenNthCalledWith(
        2,
        baseUrl,
        username,
        password,
        mockLogger
      );

      expect(GenerateBasicAuthToken).toHaveBeenCalledTimes(2);
    });

    it('should handle token generator execution failure', async () => {
      const tokenError = new Error('Token generation failed');
      mockGenerateToken.execute.mockRejectedValue(tokenError);

      await expect(connection.extend(mockCommerceGot)).rejects.toThrow('Token generation failed');
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Using Commerce client with integration options'
      );
      expect(mockCommerceGot.extend).not.toHaveBeenCalled();
    });

    it('should handle commerce client extend failure', async () => {
      const generatedToken = 'valid-token';
      const extendError = new Error('Extend failed');

      mockGenerateToken.execute.mockResolvedValue(generatedToken);
      mockCommerceGot.extend.mockImplementation(() => {
        throw extendError;
      });

      await expect(connection.extend(mockCommerceGot)).rejects.toThrow('Extend failed');
      expect(mockGenerateToken.execute).toHaveBeenCalled();
    });

    it('should pass correct parameters to GenerateBasicAuthToken', async () => {
      mockGenerateToken.execute.mockResolvedValue('token');
      mockCommerceGot.extend.mockReturnValue({ extended: true });

      await connection.extend(mockCommerceGot);

      expect(GenerateBasicAuthToken).toHaveBeenCalledWith(baseUrl, username, password, mockLogger);
    });

    it('should log debug message before token generation', async () => {
      mockGenerateToken.execute.mockResolvedValue('token');
      mockCommerceGot.extend.mockReturnValue({ extended: true });

      await connection.extend(mockCommerceGot);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Using Commerce client with integration options'
      );
      // Debug message should be logged and token generation should be called
      expect(mockGenerateToken.execute).toHaveBeenCalled();
    });

    it('should work with different commerce client instances', async () => {
      const generatedToken = 'test-token';
      const client1 = { extend: jest.fn().mockReturnValue({ client: 1 }) };
      const client2 = { extend: jest.fn().mockReturnValue({ client: 2 }) };

      mockGenerateToken.execute.mockResolvedValue(generatedToken);

      const result1 = await connection.extend(client1);
      const result2 = await connection.extend(client2);

      expect(result1).toEqual({ client: 1 });
      expect(result2).toEqual({ client: 2 });
      expect(client1.extend).toHaveBeenCalledWith({
        headers: { Authorization: `Bearer ${generatedToken}` },
      });
      expect(client2.extend).toHaveBeenCalledWith({
        headers: { Authorization: `Bearer ${generatedToken}` },
      });
    });
  });

  describe('Integration Tests', () => {
    it('should work end-to-end with realistic token and client', async () => {
      const realisticToken =
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1aWQiOjEsInV0eXBpZCI6MiwiaWF0IjoxNjMwMDAwMDAwLCJleHAiOjE2MzAwMDM2MDB9';
      const extendedClient = {
        headers: { Authorization: `Bearer ${realisticToken}` },
        prefixUrl: baseUrl,
      };

      mockGenerateToken.execute.mockResolvedValue(realisticToken);
      mockCommerceGot.extend.mockReturnValue(extendedClient);

      const result = await connection.extend(mockCommerceGot);

      expect(result).toBe(extendedClient);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Using Commerce client with integration options'
      );
      expect(mockCommerceGot.extend).toHaveBeenCalledWith({
        headers: {
          Authorization: `Bearer ${realisticToken}`,
        },
      });
    });

    it('should handle multiple sequential extend calls', async () => {
      const tokens = ['token1', 'token2', 'token3'];
      let tokenIndex = 0;

      mockGenerateToken.execute.mockImplementation(() => Promise.resolve(tokens[tokenIndex++]));
      mockCommerceGot.extend.mockReturnValue({ extended: true });

      // Multiple calls
      for (let i = 0; i < tokens.length; i++) {
        const result = await connection.extend(mockCommerceGot);
        expect(result).toEqual({ extended: true });
      }

      expect(mockGenerateToken.execute).toHaveBeenCalledTimes(3);
      expect(mockCommerceGot.extend).toHaveBeenNthCalledWith(1, {
        headers: { Authorization: 'Bearer token1' },
      });
      expect(mockCommerceGot.extend).toHaveBeenNthCalledWith(2, {
        headers: { Authorization: 'Bearer token2' },
      });
      expect(mockCommerceGot.extend).toHaveBeenNthCalledWith(3, {
        headers: { Authorization: 'Bearer token3' },
      });
    });

    it('should work with different connection instances', async () => {
      const connection2 = new BasicAuthConnection(
        'https://other.magento.com',
        'user2',
        'pass2',
        mockLogger
      );
      const token = 'shared-token';

      mockGenerateToken.execute.mockResolvedValue(token);
      mockCommerceGot.extend.mockReturnValue({ extended: true });

      const result1 = await connection.extend(mockCommerceGot);
      const result2 = await connection2.extend(mockCommerceGot);

      expect(result1).toEqual({ extended: true });
      expect(result2).toEqual({ extended: true });
      expect(GenerateBasicAuthToken).toHaveBeenCalledWith(baseUrl, username, password, mockLogger);
      expect(GenerateBasicAuthToken).toHaveBeenCalledWith(
        'https://other.magento.com',
        'user2',
        'pass2',
        mockLogger
      );
    });
  });
});
