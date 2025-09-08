/**
 * <license header>
 */

import GenerateBasicAuthToken from '../../../../../src/commerce/adobe-commerce-client/basic-auth-connection/generate-basic-auth-token';
import { TokenResult } from '../../../../../src/commerce/adobe-commerce-client/basic-auth-connection/generate-basic-auth-token/types';

// Mock @adobe/aio-sdk
jest.mock('@adobe/aio-sdk', () => ({
  State: {
    init: jest.fn(),
  },
  Core: {
    Logger: jest.fn(() => ({
      debug: jest.fn(),
      error: jest.fn(),
    })),
  },
}));

// Mock RestClient
jest.mock('../../../../../src/integration/rest-client', () => {
  return jest.fn().mockImplementation(() => ({
    post: jest.fn(),
  }));
});

import { State, Core } from '@adobe/aio-sdk';
import RestClient from '../../../../../src/integration/rest-client';

describe('GenerateBasicAuthToken', () => {
  let generateToken: GenerateBasicAuthToken;
  let mockState: any;
  let mockLogger: any;
  let mockRestClient: any;

  const baseUrl = 'https://example.magento.com';
  const username = 'admin';
  const password = 'password123';

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock state
    mockState = {
      put: jest.fn(),
      get: jest.fn(),
    };

    // Mock logger
    mockLogger = {
      debug: jest.fn(),
      error: jest.fn(),
    };

    // Mock RestClient instance
    mockRestClient = {
      post: jest.fn(),
    };

    // Setup mocks
    (State.init as jest.Mock).mockResolvedValue(mockState);
    (Core.Logger as jest.Mock).mockReturnValue(mockLogger);
    (RestClient as jest.MockedClass<typeof RestClient>).mockImplementation(() => mockRestClient);

    generateToken = new GenerateBasicAuthToken(baseUrl, username, password, mockLogger);
  });

  describe('Constructor', () => {
    it('should create instance with valid parameters', () => {
      expect(generateToken).toBeInstanceOf(GenerateBasicAuthToken);
      expect(generateToken['baseUrl']).toBe(baseUrl);
      expect(generateToken['username']).toBe(username);
      expect(generateToken['password']).toBe(password);
      expect(generateToken['key']).toBe('adobe_commerce_basic_auth_token');
      expect(generateToken['logger']).toBe(mockLogger);
    });

    it('should create default logger when logger is null', () => {
      new GenerateBasicAuthToken(baseUrl, username, password, null);

      expect(Core.Logger).toHaveBeenCalledWith('adobe-commerce-client', {
        level: 'debug',
      });
    });

    it('should use provided logger when not null', () => {
      const customLogger = { debug: jest.fn(), error: jest.fn() };
      const tokenGenerator = new GenerateBasicAuthToken(baseUrl, username, password, customLogger);

      expect(tokenGenerator['logger']).toBe(customLogger);
    });

    it('should create default logger when logger parameter is not provided', () => {
      new GenerateBasicAuthToken(baseUrl, username, password);

      expect(Core.Logger).toHaveBeenCalledWith('adobe-commerce-client', {
        level: 'debug',
      });
    });

    it('should set correct key for state storage', () => {
      expect(generateToken['key']).toBe('adobe_commerce_basic_auth_token');
    });
  });

  describe('execute', () => {
    it('should return cached token when available', async () => {
      const cachedToken = 'cached-token-123';
      mockState.get.mockResolvedValue({ value: cachedToken });

      const result = await generateToken.execute();

      expect(result).toBe(cachedToken);
      expect(mockState.get).toHaveBeenCalledWith('adobe_commerce_basic_auth_token');
      expect(mockRestClient.post).not.toHaveBeenCalled();
    });

    it('should generate new token when no cached token exists', async () => {
      const newToken = 'new-generated-token';
      mockState.get.mockResolvedValue(undefined);
      mockRestClient.post.mockResolvedValue(newToken);

      const result = await generateToken.execute();

      expect(result).toBe(newToken);
      expect(mockState.get).toHaveBeenCalledWith('adobe_commerce_basic_auth_token');
      expect(mockRestClient.post).toHaveBeenCalledWith(
        `${baseUrl}/rest/V1/integration/admin/token`,
        { 'Content-Type': 'application/json' },
        { username, password }
      );
      expect(mockState.put).toHaveBeenCalledWith('adobe_commerce_basic_auth_token', newToken, {
        ttl: 3600,
      });
    });

    it('should handle null response from commerce API', async () => {
      mockState.get.mockResolvedValue(undefined);
      mockRestClient.post.mockResolvedValue(null);

      const result = await generateToken.execute();

      expect(result).toBeNull();
      expect(mockState.put).not.toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith('Token: {"token":null,"expire_in":3600}');
    });

    it('should log token result', async () => {
      const token = 'test-token';
      mockState.get.mockResolvedValue(undefined);
      mockRestClient.post.mockResolvedValue(token);

      await generateToken.execute();

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Token: {"token":"test-token","expire_in":3600}'
      );
    });

    it('should cache state instance internally', async () => {
      mockState.get.mockResolvedValue(undefined);
      mockRestClient.post.mockResolvedValue('token');

      // Call getState multiple times to test caching
      await generateToken.getState();
      await generateToken.getState();

      // State.init should only be called once due to internal caching
      expect(State.init).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCommerceToken', () => {
    it('should make correct API call for token', async () => {
      const expectedToken = 'api-response-token';
      mockRestClient.post.mockResolvedValue(expectedToken);

      const result = await generateToken.getCommerceToken();

      expect(mockRestClient.post).toHaveBeenCalledWith(
        `${baseUrl}/rest/V1/integration/admin/token`,
        { 'Content-Type': 'application/json' },
        { username, password }
      );
      expect(result).toEqual({
        token: expectedToken,
        expire_in: 3600,
      });
      expect(mockLogger.debug).toHaveBeenCalledWith(
        `Endpoint: ${baseUrl}/rest/V1/integration/admin/token`
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        `Extracted token: ${expectedToken.substring(0, 10)}...`
      );
    });

    it('should return null when API call returns null', async () => {
      mockRestClient.post.mockResolvedValue(null);

      const result = await generateToken.getCommerceToken();

      expect(result).toBeNull();
      expect(mockLogger.debug).toHaveBeenCalledWith('Raw response: null');
    });

    it('should handle empty response', async () => {
      mockRestClient.post.mockResolvedValue('');

      const result = await generateToken.getCommerceToken();

      expect(result).toEqual({
        token: '',
        expire_in: 3600,
      });
    });

    it('should handle RestClient error', async () => {
      const error = new Error('Network error');
      mockRestClient.post.mockRejectedValue(error);

      const result = await generateToken.getCommerceToken();

      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to get Commerce token: Network error');
      expect(mockLogger.debug).toHaveBeenCalledWith(`Full error: ${JSON.stringify(error)}`);
    });

    it('should handle object response with token property', async () => {
      const tokenResponse = { token: 'object-token-123' };
      mockRestClient.post.mockResolvedValue(tokenResponse);

      const result = await generateToken.getCommerceToken();

      expect(result).toEqual({
        token: 'object-token-123',
        expire_in: 3600,
      });
    });

    it('should handle response conversion fallback', async () => {
      const numericResponse = 12345;
      mockRestClient.post.mockResolvedValue(numericResponse);

      const result = await generateToken.getCommerceToken();

      expect(result).toEqual({
        token: '12345',
        expire_in: 3600,
      });
    });

    it('should handle toString conversion error', async () => {
      // Create an object that throws an error when toString is called
      const problematicResponse = {
        toString(): string {
          throw new Error('toString failed');
        },
      };
      mockRestClient.post.mockResolvedValue(problematicResponse);

      const result = await generateToken.getCommerceToken();

      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith(
        `Unexpected response format: ${JSON.stringify(problematicResponse)}`
      );
    });

    it('should create correct endpoint URL', async () => {
      mockRestClient.post.mockResolvedValue('token');

      await generateToken.getCommerceToken();

      const expectedEndpoint = `${baseUrl}/rest/V1/integration/admin/token`;
      expect(mockRestClient.post).toHaveBeenCalledWith(
        expectedEndpoint,
        expect.any(Object),
        expect.any(Object)
      );
    });
  });

  describe('createEndpoint', () => {
    it('should create correct endpoint URL', () => {
      const endpoint = 'rest/V1/test';
      const result = generateToken.createEndpoint(endpoint);

      expect(result).toBe(`${baseUrl}/${endpoint}`);
    });

    it('should handle endpoints with leading slash', () => {
      const endpoint = '/rest/V1/test';
      const result = generateToken.createEndpoint(endpoint);

      expect(result).toBe(`${baseUrl}${endpoint}`);
    });

    it('should handle complex endpoint paths', () => {
      const endpoint = 'rest/V1/categories/1/products';
      const result = generateToken.createEndpoint(endpoint);

      expect(result).toBe(`${baseUrl}/${endpoint}`);
    });
  });

  describe('setValue', () => {
    it('should successfully store token in state', async () => {
      const tokenResult: TokenResult = { token: 'test-token', expire_in: 3600 };
      mockState.put.mockResolvedValue(undefined);

      const result = await generateToken.setValue(tokenResult);

      expect(result).toBe(true);
      expect(mockState.put).toHaveBeenCalledWith('adobe_commerce_basic_auth_token', 'test-token', {
        ttl: 3600,
      });
    });

    it('should handle state storage failure', async () => {
      const tokenResult: TokenResult = { token: 'test-token', expire_in: 3600 };
      mockState.put.mockRejectedValue(new Error('Storage failed'));

      const result = await generateToken.setValue(tokenResult);

      expect(result).toBe(true);
    });

    it('should handle state being null in setValue', async () => {
      const tokenResult: TokenResult = { token: 'test-token', expire_in: 3600 };
      // Mock getState to return null (State API not available)
      jest.spyOn(generateToken, 'getState').mockResolvedValue(null);

      const result = await generateToken.setValue(tokenResult);

      expect(result).toBe(true);
    });

    it('should store token with correct TTL', async () => {
      const tokenResult: TokenResult = { token: 'token', expire_in: 7200 };
      mockState.put.mockResolvedValue(undefined);

      await generateToken.setValue(tokenResult);

      expect(mockState.put).toHaveBeenCalledWith('adobe_commerce_basic_auth_token', 'token', {
        ttl: 7200,
      });
    });

    it('should handle null token in result', async () => {
      const tokenResult: TokenResult = { token: null, expire_in: 3600 };
      mockState.put.mockResolvedValue(undefined);

      const result = await generateToken.setValue(tokenResult);

      expect(result).toBe(true);
      expect(mockState.put).toHaveBeenCalledWith('adobe_commerce_basic_auth_token', null, {
        ttl: 3600,
      });
    });
  });

  describe('getValue', () => {
    it('should retrieve cached token from state', async () => {
      const cachedToken = 'cached-token';
      mockState.get.mockResolvedValue({ value: cachedToken });

      const result = await generateToken.getValue();

      expect(result).toBe(cachedToken);
      expect(mockState.get).toHaveBeenCalledWith('adobe_commerce_basic_auth_token');
    });

    it('should return null when no token is cached', async () => {
      mockState.get.mockResolvedValue(undefined);

      const result = await generateToken.getValue();

      expect(result).toBeNull();
    });

    it('should handle state with null value', async () => {
      mockState.get.mockResolvedValue({ value: null });

      const result = await generateToken.getValue();

      expect(result).toBeNull();
    });

    it('should handle state with empty string value', async () => {
      mockState.get.mockResolvedValue({ value: '' });

      const result = await generateToken.getValue();

      expect(result).toBe('');
    });

    it('should handle state retrieval errors', async () => {
      mockState.get.mockRejectedValue(new Error('State error'));

      const result = await generateToken.getValue();
      expect(result).toBeNull();
    });

    it('should handle state being null in getValue', async () => {
      // Mock getState to return null (State API not available)
      jest.spyOn(generateToken, 'getState').mockResolvedValue(null);

      const result = await generateToken.getValue();

      expect(result).toBeNull();
    });
  });

  describe('getState', () => {
    it('should initialize state on first call', async () => {
      const result = await generateToken.getState();

      expect(State.init).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockState);
    });

    it('should return cached state on subsequent calls', async () => {
      // Call getState multiple times
      const result1 = await generateToken.getState();
      const result2 = await generateToken.getState();

      expect(result1).toBe(mockState);
      expect(result2).toBe(mockState);
      expect(State.init).toHaveBeenCalledTimes(1);
    });

    it('should handle state initialization failure', async () => {
      (State.init as jest.Mock).mockRejectedValue(new Error('Init failed'));

      const result = await generateToken.getState();
      expect(result).toBeNull();
    });
  });

  describe('Integration Tests', () => {
    it('should work end-to-end for first time token generation', async () => {
      const apiToken = 'first-time-token';
      mockState.get.mockResolvedValue(undefined); // No cached token
      mockRestClient.post.mockResolvedValue(apiToken);
      mockState.put.mockResolvedValue(undefined);

      const result = await generateToken.execute();

      expect(result).toBe(apiToken);
      expect(mockState.get).toHaveBeenCalledWith('adobe_commerce_basic_auth_token');
      expect(mockRestClient.post).toHaveBeenCalledWith(
        `${baseUrl}/rest/V1/integration/admin/token`,
        { 'Content-Type': 'application/json' },
        { username, password }
      );
      expect(mockState.put).toHaveBeenCalledWith('adobe_commerce_basic_auth_token', apiToken, {
        ttl: 3600,
      });
      expect(mockLogger.debug).toHaveBeenCalledWith(
        `Token: {"token":"${apiToken}","expire_in":3600}`
      );
    });

    it('should work end-to-end for cached token retrieval', async () => {
      const cachedToken = 'cached-valid-token';
      mockState.get.mockResolvedValue({ value: cachedToken });

      const result = await generateToken.execute();

      expect(result).toBe(cachedToken);
      expect(mockState.get).toHaveBeenCalledWith('adobe_commerce_basic_auth_token');
      expect(mockRestClient.post).not.toHaveBeenCalled();
      expect(mockState.put).not.toHaveBeenCalled();
    });

    it('should handle failed token generation gracefully', async () => {
      mockState.get.mockResolvedValue(undefined); // No cached token
      mockRestClient.post.mockResolvedValue(null); // API call fails

      const result = await generateToken.execute();

      expect(result).toBeNull();
      expect(mockState.put).not.toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalledWith('Token: {"token":null,"expire_in":3600}');
    });

    it('should handle state storage failure gracefully', async () => {
      const apiToken = 'new-token';
      mockState.get.mockResolvedValue(undefined);
      mockRestClient.post.mockResolvedValue(apiToken);
      mockState.put.mockRejectedValue(new Error('Storage failed'));

      const result = await generateToken.execute();

      expect(result).toBe(apiToken);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        `Token: {"token":"${apiToken}","expire_in":3600}`
      );
    });
  });
});
