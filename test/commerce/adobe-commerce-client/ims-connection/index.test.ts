/**
 * Copyright © Adobe, Inc. All rights reserved.
 */

import ImsConnection from '../../../../src/commerce/adobe-commerce-client/ims-connection';
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

// Mock AdobeAuth with proper module structure
jest.mock('../../../../src/commerce/adobe-auth', () => ({
  __esModule: true,
  default: {
    getToken: jest.fn(),
  },
}));

import { Core } from '@adobe/aio-sdk';

import AdobeAuth from '../../../../src/commerce/adobe-auth';

describe('ImsConnection', () => {
  let connection: ImsConnection;
  let mockLogger: any;
  let mockCommerceGot: any;
  let mockGetToken: jest.MockedFunction<any>;

  const clientId = 'test-client-id';
  const clientSecret = 'test-client-secret';
  const technicalAccountId = 'test-technical-account-id';
  const technicalAccountEmail = 'test@example.com';
  const imsOrgId = 'test-ims-org-id';
  const scopes = ['AdobeID', 'openid', 'adobeio_api'];

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock logger
    mockLogger = {
      debug: jest.fn(),
      error: jest.fn(),
    };

    // Set up AdobeAuth mock - get reference to the mocked function
    mockGetToken = (AdobeAuth as any).getToken;
    mockGetToken.mockResolvedValue('mock-ims-token');

    // Mock commerce Got instance
    mockCommerceGot = {
      extend: jest.fn(),
    };

    // Create connection instance
    connection = new ImsConnection(
      clientId,
      clientSecret,
      technicalAccountId,
      technicalAccountEmail,
      imsOrgId,
      scopes,
      mockLogger
    );
  });

  describe('Constructor', () => {
    it('should create instance with valid parameters', () => {
      expect(connection).toBeInstanceOf(ImsConnection);
      expect(connection).toHaveProperty('clientId');
      expect(connection).toHaveProperty('clientSecret');
      expect(connection).toHaveProperty('technicalAccountId');
      expect(connection).toHaveProperty('technicalAccountEmail');
      expect(connection).toHaveProperty('imsOrgId');
      expect(connection).toHaveProperty('scopes');
    });

    it('should implement Connection interface', () => {
      expect(connection).toEqual(
        expect.objectContaining({
          extend: expect.any(Function),
        })
      );

      // Verify it implements the Connection interface
      const connectionInterface: Connection = connection;
      expect(connectionInterface.extend).toBeDefined();
    });

    it('should create default logger when logger is null', () => {
      const connectionWithNullLogger = new ImsConnection(
        clientId,
        clientSecret,
        technicalAccountId,
        technicalAccountEmail,
        imsOrgId,
        scopes,
        null
      );

      expect(Core.Logger).toHaveBeenCalledWith('adobe-commerce-client', {
        level: 'debug',
      });
      expect(connectionWithNullLogger).toBeInstanceOf(ImsConnection);
    });

    it('should use provided logger when not null', () => {
      const customLogger = { debug: jest.fn(), error: jest.fn() };
      const connectionWithCustomLogger = new ImsConnection(
        clientId,
        clientSecret,
        technicalAccountId,
        technicalAccountEmail,
        imsOrgId,
        scopes,
        customLogger
      );

      expect(connectionWithCustomLogger['logger']).toBe(customLogger);
    });

    it('should create default logger when logger parameter is undefined', () => {
      const connectionWithUndefinedLogger = new ImsConnection(
        clientId,
        clientSecret,
        technicalAccountId,
        technicalAccountEmail,
        imsOrgId,
        scopes
      );

      expect(Core.Logger).toHaveBeenCalledWith('adobe-commerce-client', {
        level: 'debug',
      });
      expect(connectionWithUndefinedLogger).toBeInstanceOf(ImsConnection);
    });

    it('should use custom context parameter', () => {
      const customContext = 'custom-ims-context';
      const connectionWithCustomContext = new ImsConnection(
        clientId,
        clientSecret,
        technicalAccountId,
        technicalAccountEmail,
        imsOrgId,
        scopes,
        mockLogger,
        customContext
      );

      expect(connectionWithCustomContext['currentContext']).toBe(customContext);
    });

    it('should use default context when not provided', () => {
      expect(connection['currentContext']).toBe('adobe-commerce-client');
    });

    it('should use custom context in logger when logger is null', () => {
      const customContext = 'test-context';
      new ImsConnection(
        clientId,
        clientSecret,
        technicalAccountId,
        technicalAccountEmail,
        imsOrgId,
        scopes,
        null,
        customContext
      );

      expect(Core.Logger).toHaveBeenCalledWith(customContext, {
        level: 'debug',
      });
    });

    it('should store all constructor parameters correctly', () => {
      expect(connection['clientId']).toBe(clientId);
      expect(connection['clientSecret']).toBe(clientSecret);
      expect(connection['technicalAccountId']).toBe(technicalAccountId);
      expect(connection['technicalAccountEmail']).toBe(technicalAccountEmail);
      expect(connection['imsOrgId']).toBe(imsOrgId);
      expect(connection['scopes']).toBe(scopes);
      expect(connection['logger']).toBe(mockLogger);
    });
  });

  describe('extend', () => {
    it('should extend commerce client with IMS Bearer token authorization', async () => {
      const expectedToken = 'mock-ims-access-token';
      mockGetToken.mockResolvedValue(expectedToken);

      const extendedClient = { extended: true };
      mockCommerceGot.extend.mockReturnValue(extendedClient);

      const result = await connection.extend(mockCommerceGot);

      expect(AdobeAuth.getToken).toHaveBeenCalledWith(
        clientId,
        clientSecret,
        technicalAccountId,
        technicalAccountEmail,
        imsOrgId,
        scopes,
        'adobe-commerce-client'
      );

      expect(mockCommerceGot.extend).toHaveBeenCalledWith({
        headers: {
          Authorization: `Bearer ${expectedToken}`,
        },
      });

      expect(result).toBe(extendedClient);
    });

    it('should handle null token from AdobeAuth', async () => {
      mockGetToken.mockResolvedValue(null as any);

      const extendedClient = { extended: true };
      mockCommerceGot.extend.mockReturnValue(extendedClient);

      const result = await connection.extend(mockCommerceGot);

      expect(mockCommerceGot.extend).toHaveBeenCalledWith({
        headers: {
          Authorization: 'Bearer null',
        },
      });

      expect(result).toBe(extendedClient);
    });

    it('should handle empty token from AdobeAuth', async () => {
      mockGetToken.mockResolvedValue('');

      const extendedClient = { extended: true };
      mockCommerceGot.extend.mockReturnValue(extendedClient);

      const result = await connection.extend(mockCommerceGot);

      expect(mockCommerceGot.extend).toHaveBeenCalledWith({
        headers: {
          Authorization: 'Bearer ',
        },
      });

      expect(result).toBe(extendedClient);
    });

    it('should use custom context in AdobeAuth call', async () => {
      const customContext = 'custom-context';
      const customConnection = new ImsConnection(
        clientId,
        clientSecret,
        technicalAccountId,
        technicalAccountEmail,
        imsOrgId,
        scopes,
        mockLogger,
        customContext
      );

      const extendedClient = { extended: true };
      mockCommerceGot.extend.mockReturnValue(extendedClient);

      await customConnection.extend(mockCommerceGot);

      expect(AdobeAuth.getToken).toHaveBeenCalledWith(
        clientId,
        clientSecret,
        technicalAccountId,
        technicalAccountEmail,
        imsOrgId,
        scopes,
        customContext
      );
    });

    it('should handle AdobeAuth.getToken failure', async () => {
      const error = new Error('IMS authentication failed');
      mockGetToken.mockRejectedValue(error);

      await expect(connection.extend(mockCommerceGot)).rejects.toThrow('IMS authentication failed');
      expect(mockCommerceGot.extend).not.toHaveBeenCalled();
    });

    it('should handle commerce client extend failure', async () => {
      const expectedToken = 'valid-token';
      mockGetToken.mockResolvedValue(expectedToken);

      const extendError = new Error('Commerce client extend failed');
      mockCommerceGot.extend.mockImplementation(() => {
        throw extendError;
      });

      await expect(connection.extend(mockCommerceGot)).rejects.toThrow(
        'Commerce client extend failed'
      );
    });

    it('should pass correct parameters to AdobeAuth with different scopes', async () => {
      const customScopes = ['custom_scope_1', 'custom_scope_2', 'AdobeID'];
      const customConnection = new ImsConnection(
        clientId,
        clientSecret,
        technicalAccountId,
        technicalAccountEmail,
        imsOrgId,
        customScopes,
        mockLogger
      );

      const extendedClient = { extended: true };
      mockCommerceGot.extend.mockReturnValue(extendedClient);

      await customConnection.extend(mockCommerceGot);

      expect(AdobeAuth.getToken).toHaveBeenCalledWith(
        clientId,
        clientSecret,
        technicalAccountId,
        technicalAccountEmail,
        imsOrgId,
        customScopes,
        'adobe-commerce-client'
      );
    });

    it('should log debug message before token generation', async () => {
      const expectedToken = 'mock-token';
      mockGetToken.mockResolvedValue(expectedToken);
      mockCommerceGot.extend.mockReturnValue({ extended: true });

      await connection.extend(mockCommerceGot);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Using Commerce client with IMS authentication'
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        `IMS token being extended to header: ${expectedToken}`
      );
    });

    it('should work with different commerce client instances', async () => {
      const expectedToken = 'test-token';
      mockGetToken.mockResolvedValue(expectedToken);

      const otherCommerceGot = {
        extend: jest.fn().mockReturnValue({ other: true }),
      };

      const result = await connection.extend(otherCommerceGot);

      expect(otherCommerceGot.extend).toHaveBeenCalledWith({
        headers: {
          Authorization: `Bearer ${expectedToken}`,
        },
      });
      expect(result).toEqual({ other: true });
    });
  });

  describe('Integration Tests', () => {
    it('should work end-to-end with realistic IMS workflow', async () => {
      const realisticToken = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsIng1dCI6ImltaE4xQlB3...';
      mockGetToken.mockResolvedValue(realisticToken);

      const realisticCommerceGot = {
        extend: jest.fn().mockReturnValue({
          get: jest.fn(),
          post: jest.fn(),
          put: jest.fn(),
          delete: jest.fn(),
        }),
      };

      const result = await connection.extend(realisticCommerceGot);

      expect(AdobeAuth.getToken).toHaveBeenCalledWith(
        clientId,
        clientSecret,
        technicalAccountId,
        technicalAccountEmail,
        imsOrgId,
        scopes,
        'adobe-commerce-client'
      );

      expect(realisticCommerceGot.extend).toHaveBeenCalledWith({
        headers: {
          Authorization: `Bearer ${realisticToken}`,
        },
      });

      expect(result).toHaveProperty('get');
      expect(result).toHaveProperty('post');
      expect(result).toHaveProperty('put');
      expect(result).toHaveProperty('delete');
    });

    it('should handle multiple sequential extend calls', async () => {
      const tokens = ['token1', 'token2', 'token3'];
      let callCount = 0;

      mockGetToken.mockImplementation(async () => {
        return tokens[callCount++];
      });

      mockCommerceGot.extend.mockReturnValue({ extended: true });

      await connection.extend(mockCommerceGot);
      await connection.extend(mockCommerceGot);
      await connection.extend(mockCommerceGot);

      expect(AdobeAuth.getToken).toHaveBeenCalledTimes(3);
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
      const connection1 = new ImsConnection(
        'client1',
        'secret1',
        'tech1',
        'email1@test.com',
        'org1',
        ['scope1'],
        mockLogger,
        'context1'
      );

      const connection2 = new ImsConnection(
        'client2',
        'secret2',
        'tech2',
        'email2@test.com',
        'org2',
        ['scope2'],
        mockLogger,
        'context2'
      );

      mockGetToken.mockResolvedValueOnce('token1').mockResolvedValueOnce('token2');

      mockCommerceGot.extend.mockReturnValue({ extended: true });

      await connection1.extend(mockCommerceGot);
      await connection2.extend(mockCommerceGot);

      expect(AdobeAuth.getToken).toHaveBeenNthCalledWith(
        1,
        'client1',
        'secret1',
        'tech1',
        'email1@test.com',
        'org1',
        ['scope1'],
        'context1'
      );
      expect(AdobeAuth.getToken).toHaveBeenNthCalledWith(
        2,
        'client2',
        'secret2',
        'tech2',
        'email2@test.com',
        'org2',
        ['scope2'],
        'context2'
      );
    });
  });
});
