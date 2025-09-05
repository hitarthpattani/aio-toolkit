/**
 * Copyright © Adobe, Inc. All rights reserved.
 */

import Get from '../../../../src/io-events/provider/get';
import { IOEventsApiError, IoEventsGlobals } from '../../../../src/io-events/types';
import type { GetProviderQueryParams } from '../../../../src/io-events/provider/get/types';
import type { Provider } from '../../../../src/io-events/provider/types';
import RestClient from '../../../../src/integration/rest-client';

// Mock RestClient
jest.mock('../../../../src/integration/rest-client');
const MockedRestClient = RestClient as jest.MockedClass<typeof RestClient>;

describe('Get Provider', () => {
  let getService: Get;
  let mockRestClient: jest.Mocked<RestClient>;

  const validCredentials = {
    clientId: 'test-client-id',
    consumerId: 'test-consumer-id',
    projectId: 'test-project-id',
    workspaceId: 'test-workspace-id',
    accessToken: 'test-access-token',
  };

  const mockProvider: Provider = {
    id: 'test-provider-123',
    label: 'Test Provider',
    description: 'A test provider',
    source: 'test-source',
    docs_url: 'https://example.com/docs',
    provider_metadata: '3rd_party_custom_events',
    instance_id: 'test-instance',
    event_delivery_format: 'adobe_io',
    publisher: 'test-publisher',
    _links: {
      'rel:eventmetadata': {
        href: 'https://api.adobe.io/events/providers/test-provider-123/eventmetadata',
      },
      'rel:update': {
        href: 'https://api.adobe.io/events/consumers/test-consumer-id/projects/test-project-id/workspaces/test-workspace-id/providers/test-provider-123',
      },
      self: {
        href: 'https://api.adobe.io/events/providers/test-provider-123',
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRestClient = {
      get: jest.fn(),
    } as any;
    MockedRestClient.mockImplementation(() => mockRestClient);

    getService = new Get(
      validCredentials.clientId,
      validCredentials.consumerId,
      validCredentials.projectId,
      validCredentials.workspaceId,
      validCredentials.accessToken
    );
  });

  describe('Constructor', () => {
    it('should create instance with valid parameters', () => {
      expect(() => {
        new Get(
          validCredentials.clientId,
          validCredentials.consumerId,
          validCredentials.projectId,
          validCredentials.workspaceId,
          validCredentials.accessToken
        );
      }).not.toThrow();
    });

    it('should throw error for invalid parameters', () => {
      expect(() => new Get('', 'consumer', 'project', 'workspace', 'token')).toThrow(
        'clientId is required and cannot be empty'
      );
      expect(() => new Get('client', '', 'project', 'workspace', 'token')).toThrow(
        'consumerId is required and cannot be empty'
      );
      expect(() => new Get('client', 'consumer', '', 'workspace', 'token')).toThrow(
        'projectId is required and cannot be empty'
      );
      expect(() => new Get('client', 'consumer', 'project', '', 'token')).toThrow(
        'workspaceId is required and cannot be empty'
      );
      expect(() => new Get('client', 'consumer', 'project', 'workspace', '')).toThrow(
        'accessToken is required and cannot be empty'
      );
    });
  });

  describe('execute', () => {
    it('should get provider successfully with valid ID', async () => {
      mockRestClient.get.mockResolvedValue(mockProvider);

      const result = await getService.execute('test-provider-123');

      expect(result).toEqual(mockProvider);
      expect(mockRestClient.get).toHaveBeenCalledWith(
        `${IoEventsGlobals.BASE_URL}/events/providers/test-provider-123`,
        {
          Authorization: `Bearer ${validCredentials.accessToken}`,
          'x-api-key': validCredentials.clientId,
          Accept: 'application/hal+json',
        }
      );
    });

    it('should get provider with eventmetadata query parameter', async () => {
      const queryParams: GetProviderQueryParams = { eventmetadata: true };
      mockRestClient.get.mockResolvedValue(mockProvider);

      const result = await getService.execute('test-provider-123', queryParams);

      expect(result).toEqual(mockProvider);
      expect(mockRestClient.get).toHaveBeenCalledWith(
        `${IoEventsGlobals.BASE_URL}/events/providers/test-provider-123?eventmetadata=true`,
        expect.any(Object)
      );
    });

    it('should get provider with eventmetadata false', async () => {
      const queryParams: GetProviderQueryParams = { eventmetadata: false };
      mockRestClient.get.mockResolvedValue(mockProvider);

      await getService.execute('test-provider-123', queryParams);

      expect(mockRestClient.get).toHaveBeenCalledWith(
        `${IoEventsGlobals.BASE_URL}/events/providers/test-provider-123?eventmetadata=false`,
        expect.any(Object)
      );
    });

    it('should handle URL encoding in provider ID', async () => {
      const providerId = 'provider with spaces & symbols';
      mockRestClient.get.mockResolvedValue(mockProvider);

      await getService.execute(providerId);

      expect(mockRestClient.get).toHaveBeenCalledWith(
        `${IoEventsGlobals.BASE_URL}/events/providers/provider%20with%20spaces%20%26%20symbols`,
        expect.any(Object)
      );
    });

    it('should handle empty query parameters', async () => {
      const queryParams: GetProviderQueryParams = {};
      mockRestClient.get.mockResolvedValue(mockProvider);

      await getService.execute('test-provider-123', queryParams);

      expect(mockRestClient.get).toHaveBeenCalledWith(
        `${IoEventsGlobals.BASE_URL}/events/providers/test-provider-123`,
        expect.any(Object)
      );
    });

    it('should throw error for empty provider ID', async () => {
      await expect(getService.execute('')).rejects.toThrow(IOEventsApiError);
      await expect(getService.execute('')).rejects.toThrow(
        'Provider ID is required and cannot be empty'
      );
    });

    it('should throw error for undefined provider ID', async () => {
      await expect(getService.execute(undefined as any)).rejects.toThrow(IOEventsApiError);
    });

    it('should throw error for whitespace-only provider ID', async () => {
      await expect(getService.execute('   ')).rejects.toThrow(IOEventsApiError);
    });

    it('should validate response format - null response', async () => {
      mockRestClient.get.mockResolvedValue(null);

      await expect(getService.execute('test-provider-123')).rejects.toThrow(IOEventsApiError);
      await expect(getService.execute('test-provider-123')).rejects.toThrow(
        'Invalid response format: Expected provider object'
      );
    });

    it('should validate response format - non-object response', async () => {
      mockRestClient.get.mockResolvedValue('invalid response' as any);

      await expect(getService.execute('test-provider-123')).rejects.toThrow(IOEventsApiError);
      await expect(getService.execute('test-provider-123')).rejects.toThrow(
        'Invalid response format: Expected provider object'
      );
    });
  });

  describe('Query String Building', () => {
    it('should build query string with eventmetadata true', async () => {
      const queryParams: GetProviderQueryParams = { eventmetadata: true };
      mockRestClient.get.mockResolvedValue(mockProvider);

      await getService.execute('test-provider-123', queryParams);

      const callArgs = mockRestClient.get.mock.calls[0];
      expect(callArgs[0]).toBe(
        `${IoEventsGlobals.BASE_URL}/events/providers/test-provider-123?eventmetadata=true`
      );
    });

    it('should build query string with eventmetadata false', async () => {
      const queryParams: GetProviderQueryParams = { eventmetadata: false };
      mockRestClient.get.mockResolvedValue(mockProvider);

      await getService.execute('test-provider-123', queryParams);

      const callArgs = mockRestClient.get.mock.calls[0];
      expect(callArgs[0]).toBe(
        `${IoEventsGlobals.BASE_URL}/events/providers/test-provider-123?eventmetadata=false`
      );
    });

    it('should not build query string when eventmetadata is undefined', async () => {
      const queryParams: GetProviderQueryParams = { eventmetadata: undefined };
      mockRestClient.get.mockResolvedValue(mockProvider);

      await getService.execute('test-provider-123', queryParams);

      const callArgs = mockRestClient.get.mock.calls[0];
      expect(callArgs[0]).toBe(`${IoEventsGlobals.BASE_URL}/events/providers/test-provider-123`);
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP error with status code', async () => {
      const httpError = new Error('HTTP error! status: 404');
      mockRestClient.get.mockRejectedValue(httpError);

      await expect(getService.execute('test-provider-123')).rejects.toThrow(IOEventsApiError);

      try {
        await getService.execute('test-provider-123');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(404);
        expect(ioError.message).toBe('Provider ID does not exist');
      }
    });

    it('should handle different HTTP status codes correctly', async () => {
      const statusTests = [
        { status: 401, expectedMessage: 'Unauthorized: Invalid or expired access token' },
        {
          status: 403,
          expectedMessage: 'Forbidden: Insufficient permissions to access this provider',
        },
        { status: 404, expectedMessage: 'Provider ID does not exist' },
        { status: 500, expectedMessage: 'Internal server error occurred while fetching provider' },
        { status: 418, expectedMessage: 'HTTP 418: Provider request failed' },
      ];

      for (const test of statusTests) {
        const httpError = new Error(`HTTP error! status: ${test.status}`);
        mockRestClient.get.mockRejectedValue(httpError);

        try {
          await getService.execute('test-provider-123');
          fail(`Expected error for status ${test.status}`);
        } catch (error) {
          expect(error instanceof IOEventsApiError).toBe(true);
          const ioError = error as IOEventsApiError;
          expect(ioError.statusCode).toBe(test.status);
          expect(ioError.message).toBe(test.expectedMessage);
        }
      }
    });

    it('should handle error with response object', async () => {
      const responseError = {
        response: {
          status: 403,
          statusCode: 403,
        },
      };
      mockRestClient.get.mockRejectedValue(responseError);

      await expect(getService.execute('test-provider-123')).rejects.toThrow(IOEventsApiError);

      try {
        await getService.execute('test-provider-123');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(403);
        expect(ioError.errorCode).toBe('API_ERROR');
      }
    });

    it('should handle network errors', async () => {
      const networkError = { code: 'ENOTFOUND' };
      mockRestClient.get.mockRejectedValue(networkError);

      await expect(getService.execute('test-provider-123')).rejects.toThrow(IOEventsApiError);

      try {
        await getService.execute('test-provider-123');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toContain('Network error');
        expect(ioError.errorCode).toBe('NETWORK_ERROR');
      }
    });

    it('should handle connection refused errors', async () => {
      const connectionError = { code: 'ECONNREFUSED' };
      mockRestClient.get.mockRejectedValue(connectionError);

      await expect(getService.execute('test-provider-123')).rejects.toThrow(IOEventsApiError);
    });

    it('should handle timeout errors', async () => {
      const timeoutError = { code: 'ETIMEDOUT' };
      mockRestClient.get.mockRejectedValue(timeoutError);

      await expect(getService.execute('test-provider-123')).rejects.toThrow(IOEventsApiError);

      try {
        await getService.execute('test-provider-123');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toContain('Request timeout');
        expect(ioError.errorCode).toBe('TIMEOUT_ERROR');
      }
    });

    it('should handle JSON parsing errors', async () => {
      const jsonError = new Error('Unexpected token in JSON');
      mockRestClient.get.mockRejectedValue(jsonError);

      await expect(getService.execute('test-provider-123')).rejects.toThrow(IOEventsApiError);

      try {
        await getService.execute('test-provider-123');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toContain('Invalid response format');
        expect(ioError.errorCode).toBe('PARSE_ERROR');
      }
    });

    it('should handle validation errors', async () => {
      const validationError = new Error('Provider ID is required');
      mockRestClient.get.mockRejectedValue(validationError);

      await expect(getService.execute('test-provider-123')).rejects.toThrow(IOEventsApiError);

      try {
        await getService.execute('test-provider-123');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(IoEventsGlobals.STATUS_CODES.BAD_REQUEST);
        expect(ioError.errorCode).toBe('VALIDATION_ERROR');
      }
    });

    it('should handle generic errors', async () => {
      const genericError = new Error('Something unexpected happened');
      mockRestClient.get.mockRejectedValue(genericError);

      await expect(getService.execute('test-provider-123')).rejects.toThrow(IOEventsApiError);

      try {
        await getService.execute('test-provider-123');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toContain('Unexpected error');
        expect(ioError.errorCode).toBe('UNKNOWN_ERROR');
      }
    });

    it('should extract status code from various error formats', async () => {
      // Test extracting from response.status
      const errorWithStatus = { response: { status: 402 } };
      mockRestClient.get.mockRejectedValue(errorWithStatus);

      try {
        await getService.execute('test-provider-123');
        fail('Expected error');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(402);
      }

      // Test extracting from error.status directly
      const errorWithDirectStatus = { response: { status: 501 } };
      mockRestClient.get.mockRejectedValue(errorWithDirectStatus);

      try {
        await getService.execute('test-provider-123');
        fail('Expected error');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(501);
      }

      // Test fallback to internal server error
      const errorWithoutStatus = { someProperty: 'value' };
      mockRestClient.get.mockRejectedValue(errorWithoutStatus);

      try {
        await getService.execute('test-provider-123');
        fail('Expected error');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR);
      }
    });

    it('should extract status code fallback when no response or status properties', async () => {
      const errorWithoutResponseOrStatus = { response: {} }; // response exists but has no status
      mockRestClient.get.mockRejectedValue(errorWithoutResponseOrStatus);

      try {
        await getService.execute('test-provider-123');
        fail('Expected error');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR);
        expect(ioError.errorCode).toBe('API_ERROR');
      }
    });

    it('should handle extractStatusCodeFromMessage regex no match fallback', async () => {
      const errorWithNoMatchingPattern = new Error('Random get error without HTTP status pattern');
      mockRestClient.get.mockRejectedValue(errorWithNoMatchingPattern);

      try {
        await getService.execute('test-provider-123');
        fail('Expected error');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR);
        expect(ioError.message).toContain('Random get error without HTTP status pattern');
      }
    });

    it('should handle extractStatusCodeFromMessage with successful regex match', async () => {
      const errorWithStatusInMessage = new Error('HTTP error! status: 410');
      mockRestClient.get.mockRejectedValue(errorWithStatusInMessage);

      try {
        await getService.execute('test-provider-123');
        fail('Expected error');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(410); // Successfully parsed from regex
        expect(ioError.message).toContain('HTTP 410: Provider request failed');
      }
    });

    it('should handle extractStatusCodeFromMessage with regex match failure but contains HTTP error status', async () => {
      const errorWithInvalidStatus = new Error('HTTP error! status: invalid');
      mockRestClient.get.mockRejectedValue(errorWithInvalidStatus);

      try {
        await getService.execute('test-provider-123');
        fail('Expected error');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(500); // Fallback when regex doesn't match number
      }
    });
  });
});
