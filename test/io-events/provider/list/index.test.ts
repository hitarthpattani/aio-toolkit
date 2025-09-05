/**
 * <license header>
 */

import List from '../../../../src/io-events/provider/list';
import { IOEventsApiError, IoEventsGlobals } from '../../../../src/io-events/types';
import type {
  ListProvidersQueryParams,
  ProvidersListResponse,
} from '../../../../src/io-events/provider/list/types';
import type { Provider } from '../../../../src/io-events/provider/types';
import RestClient from '../../../../src/integration/rest-client';

// Mock RestClient
jest.mock('../../../../src/integration/rest-client');
const MockedRestClient = RestClient as jest.MockedClass<typeof RestClient>;

describe('List Providers', () => {
  let listService: List;
  let mockRestClient: jest.Mocked<RestClient>;

  const validCredentials = {
    clientId: 'test-client-id',
    consumerId: 'test-consumer-id',
    projectId: 'test-project-id',
    workspaceId: 'test-workspace-id',
    accessToken: 'test-access-token',
  };

  const mockProvider1: Provider = {
    id: 'provider-1',
    label: 'Provider 1',
    description: 'First provider',
    source: 'source-1',
    provider_metadata: 'metadata-1',
    event_delivery_format: 'adobe_io',
    publisher: 'publisher-1',
  };

  const mockProvider2: Provider = {
    id: 'provider-2',
    label: 'Provider 2',
    description: 'Second provider',
    source: 'source-2',
    provider_metadata: 'metadata-2',
    event_delivery_format: 'adobe_io',
    publisher: 'publisher-2',
  };

  const singlePageResponse: ProvidersListResponse = {
    _links: {
      self: { href: 'https://api.adobe.io/events/test-consumer-id/providers' },
    },
    _embedded: {
      providers: [mockProvider1, mockProvider2],
    },
  };

  const firstPageResponse: ProvidersListResponse = {
    _links: {
      self: { href: 'https://api.adobe.io/events/test-consumer-id/providers' },
      next: { href: 'https://api.adobe.io/events/test-consumer-id/providers?page=2' },
    },
    _embedded: {
      providers: [mockProvider1],
    },
  };

  const secondPageResponse: ProvidersListResponse = {
    _links: {
      self: { href: 'https://api.adobe.io/events/test-consumer-id/providers?page=2' },
    },
    _embedded: {
      providers: [mockProvider2],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRestClient = {
      get: jest.fn(),
    } as any;
    MockedRestClient.mockImplementation(() => mockRestClient);

    listService = new List(
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
        new List(
          validCredentials.clientId,
          validCredentials.consumerId,
          validCredentials.projectId,
          validCredentials.workspaceId,
          validCredentials.accessToken
        );
      }).not.toThrow();
    });

    it('should throw error for invalid parameters', () => {
      expect(() => new List('', 'consumer', 'project', 'workspace', 'token')).toThrow(
        'clientId is required and cannot be empty'
      );
      expect(() => new List('client', '', 'project', 'workspace', 'token')).toThrow(
        'consumerId is required and cannot be empty'
      );
      expect(() => new List('client', 'consumer', '', 'workspace', 'token')).toThrow(
        'projectId is required and cannot be empty'
      );
      expect(() => new List('client', 'consumer', 'project', '', 'token')).toThrow(
        'workspaceId is required and cannot be empty'
      );
      expect(() => new List('client', 'consumer', 'project', 'workspace', '')).toThrow(
        'accessToken is required and cannot be empty'
      );
    });
  });

  describe('execute', () => {
    it('should list providers without query parameters', async () => {
      mockRestClient.get.mockResolvedValue(singlePageResponse);

      const result = await listService.execute();

      expect(result).toEqual([mockProvider1, mockProvider2]);
      expect(mockRestClient.get).toHaveBeenCalledWith(
        `${IoEventsGlobals.BASE_URL}/events/${validCredentials.consumerId}/providers`,
        {
          Authorization: `Bearer ${validCredentials.accessToken}`,
          'x-api-key': validCredentials.clientId,
          Accept: 'application/hal+json',
        }
      );
    });

    it('should list providers with providerMetadataId filter', async () => {
      const queryParams: ListProvidersQueryParams = {
        providerMetadataId: '3rd_party_custom_events',
      };
      mockRestClient.get.mockResolvedValue(singlePageResponse);

      const result = await listService.execute(queryParams);

      expect(result).toEqual([mockProvider1, mockProvider2]);
      expect(mockRestClient.get).toHaveBeenCalledWith(
        `${IoEventsGlobals.BASE_URL}/events/${validCredentials.consumerId}/providers?providerMetadataId=3rd_party_custom_events`,
        expect.any(Object)
      );
    });

    it('should list providers with instanceId filter', async () => {
      const queryParams: ListProvidersQueryParams = {
        instanceId: 'instance-123',
      };
      mockRestClient.get.mockResolvedValue(singlePageResponse);

      await listService.execute(queryParams);

      expect(mockRestClient.get).toHaveBeenCalledWith(
        `${IoEventsGlobals.BASE_URL}/events/${validCredentials.consumerId}/providers?instanceId=instance-123`,
        expect.any(Object)
      );
    });

    it('should list providers with providerMetadataIds array filter', async () => {
      const queryParams: ListProvidersQueryParams = {
        providerMetadataIds: ['metadata1', 'metadata2'],
      };
      mockRestClient.get.mockResolvedValue(singlePageResponse);

      await listService.execute(queryParams);

      expect(mockRestClient.get).toHaveBeenCalledWith(
        `${IoEventsGlobals.BASE_URL}/events/${validCredentials.consumerId}/providers?providerMetadataIds=metadata1&providerMetadataIds=metadata2`,
        expect.any(Object)
      );
    });

    it('should list providers with eventmetadata flag', async () => {
      const queryParams: ListProvidersQueryParams = {
        eventmetadata: true,
      };
      mockRestClient.get.mockResolvedValue(singlePageResponse);

      await listService.execute(queryParams);

      expect(mockRestClient.get).toHaveBeenCalledWith(
        `${IoEventsGlobals.BASE_URL}/events/${validCredentials.consumerId}/providers?eventmetadata=true`,
        expect.any(Object)
      );
    });

    it('should list providers with eventmetadata false', async () => {
      const queryParams: ListProvidersQueryParams = {
        eventmetadata: false,
      };
      mockRestClient.get.mockResolvedValue(singlePageResponse);

      await listService.execute(queryParams);

      expect(mockRestClient.get).toHaveBeenCalledWith(
        `${IoEventsGlobals.BASE_URL}/events/${validCredentials.consumerId}/providers?eventmetadata=false`,
        expect.any(Object)
      );
    });

    it('should list providers with multiple query parameters', async () => {
      const queryParams: ListProvidersQueryParams = {
        providerMetadataId: '3rd_party_custom_events',
        instanceId: 'instance-123',
        eventmetadata: true,
      };
      mockRestClient.get.mockResolvedValue(singlePageResponse);

      await listService.execute(queryParams);

      expect(mockRestClient.get).toHaveBeenCalledWith(
        `${IoEventsGlobals.BASE_URL}/events/${validCredentials.consumerId}/providers?providerMetadataId=3rd_party_custom_events&instanceId=instance-123&eventmetadata=true`,
        expect.any(Object)
      );
    });

    it('should handle empty providers array', async () => {
      const emptyResponse: ProvidersListResponse = {
        _links: { self: { href: 'test' } },
        _embedded: { providers: [] },
      };
      mockRestClient.get.mockResolvedValue(emptyResponse);

      const result = await listService.execute();

      expect(result).toEqual([]);
    });

    it('should handle response without _embedded', async () => {
      const noEmbeddedResponse: ProvidersListResponse = {
        _links: { self: { href: 'test' } },
      };
      mockRestClient.get.mockResolvedValue(noEmbeddedResponse);

      const result = await listService.execute();

      expect(result).toEqual([]);
    });

    it('should handle pagination - multiple pages', async () => {
      mockRestClient.get
        .mockResolvedValueOnce(firstPageResponse)
        .mockResolvedValueOnce(secondPageResponse);

      const result = await listService.execute();

      expect(result).toEqual([mockProvider1, mockProvider2]);
      expect(mockRestClient.get).toHaveBeenCalledTimes(2);
      expect(mockRestClient.get).toHaveBeenNthCalledWith(
        1,
        `${IoEventsGlobals.BASE_URL}/events/${validCredentials.consumerId}/providers`,
        expect.any(Object)
      );
      expect(mockRestClient.get).toHaveBeenNthCalledWith(
        2,
        'https://api.adobe.io/events/test-consumer-id/providers?page=2',
        expect.any(Object)
      );
    });

    it('should handle URL encoding in query parameters', async () => {
      const queryParams: ListProvidersQueryParams = {
        providerMetadataId: 'special chars & spaces',
        instanceId: 'instance with spaces',
      };
      mockRestClient.get.mockResolvedValue(singlePageResponse);

      await listService.execute(queryParams);

      expect(mockRestClient.get).toHaveBeenCalledWith(
        `${IoEventsGlobals.BASE_URL}/events/${validCredentials.consumerId}/providers?providerMetadataId=special%20chars%20%26%20spaces&instanceId=instance%20with%20spaces`,
        expect.any(Object)
      );
    });

    it('should throw error for conflicting query parameters', async () => {
      const invalidParams: ListProvidersQueryParams = {
        providerMetadataId: 'single-metadata',
        providerMetadataIds: ['meta1', 'meta2'],
      };

      await expect(listService.execute(invalidParams)).rejects.toThrow(IOEventsApiError);
      await expect(listService.execute(invalidParams)).rejects.toThrow(
        'Cannot specify both providerMetadataId and providerMetadataIds'
      );
    });

    it('should validate response format', async () => {
      mockRestClient.get.mockResolvedValue(null);

      await expect(listService.execute()).rejects.toThrow(IOEventsApiError);
      await expect(listService.execute()).rejects.toThrow(
        'Invalid response format: Expected object'
      );
    });

    it('should validate response format - non-object response', async () => {
      mockRestClient.get.mockResolvedValue('string response' as any);

      await expect(listService.execute()).rejects.toThrow(IOEventsApiError);
      await expect(listService.execute()).rejects.toThrow(
        'Invalid response format: Expected object'
      );
    });

    it('should validate providers array format', async () => {
      const invalidResponse = {
        _links: { self: { href: 'test' } },
        _embedded: { providers: 'not-an-array' },
      };
      mockRestClient.get.mockResolvedValue(invalidResponse);

      await expect(listService.execute()).rejects.toThrow(IOEventsApiError);
      await expect(listService.execute()).rejects.toThrow(
        'Invalid response format: providers should be an array'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP errors', async () => {
      const httpError = new Error('HTTP error! status: 401');
      mockRestClient.get.mockRejectedValue(httpError);

      await expect(listService.execute()).rejects.toThrow(IOEventsApiError);

      try {
        await listService.execute();
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(401);
        expect(ioError.message).toBe('Unauthorized: Invalid or expired access token');
      }
    });

    it('should handle different HTTP status codes', async () => {
      const statusTests = [
        { status: 401, expectedMessage: 'Unauthorized: Invalid or expired access token' },
        { status: 403, expectedMessage: 'Forbidden: Insufficient permissions or invalid API key' },
        {
          status: 404,
          expectedMessage:
            'Not Found: Provider associated with the consumerOrgId, providerMetadataId or instanceID does not exist',
        },
        {
          status: 500,
          expectedMessage:
            'Internal Server Error: Adobe I/O Events service is temporarily unavailable',
        },
        { status: 418, expectedMessage: 'API Error: HTTP 418' },
      ];

      for (const test of statusTests) {
        const httpError = new Error(`HTTP error! status: ${test.status}`);
        mockRestClient.get.mockRejectedValue(httpError);

        try {
          await listService.execute();
          fail(`Expected error for status ${test.status}`);
        } catch (error) {
          expect(error instanceof IOEventsApiError).toBe(true);
          const ioError = error as IOEventsApiError;
          expect(ioError.statusCode).toBe(test.status);
          expect(ioError.message).toBe(test.expectedMessage);
        }
      }
    });

    it('should handle network errors', async () => {
      const networkError = { code: 'ENOTFOUND' };
      mockRestClient.get.mockRejectedValue(networkError);

      await expect(listService.execute()).rejects.toThrow(IOEventsApiError);

      try {
        await listService.execute();
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toContain('Network error');
        expect(ioError.errorCode).toBe('NETWORK_ERROR');
      }
    });

    it('should handle timeout errors', async () => {
      const timeoutError = { code: 'ETIMEDOUT' };
      mockRestClient.get.mockRejectedValue(timeoutError);

      await expect(listService.execute()).rejects.toThrow(IOEventsApiError);

      try {
        await listService.execute();
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toContain('Request timeout');
        expect(ioError.errorCode).toBe('TIMEOUT_ERROR');
      }
    });

    it('should handle JSON parsing errors', async () => {
      const jsonError = new Error('Invalid JSON in response');
      mockRestClient.get.mockRejectedValue(jsonError);

      await expect(listService.execute()).rejects.toThrow(IOEventsApiError);

      try {
        await listService.execute();
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toContain('Invalid response format');
        expect(ioError.errorCode).toBe('PARSE_ERROR');
      }
    });

    it('should handle SyntaxError for JSON parsing', async () => {
      const syntaxError = new SyntaxError('Unexpected token in JSON');
      mockRestClient.get.mockRejectedValue(syntaxError);

      await expect(listService.execute()).rejects.toThrow(IOEventsApiError);

      try {
        await listService.execute();
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.errorCode).toBe('PARSE_ERROR');
      }
    });

    it('should handle generic errors', async () => {
      const genericError = new Error('Something unexpected happened');
      mockRestClient.get.mockRejectedValue(genericError);

      await expect(listService.execute()).rejects.toThrow(IOEventsApiError);

      try {
        await listService.execute();
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toContain('Failed to list providers');
        expect(ioError.errorCode).toBe('UNKNOWN_ERROR');
      }
    });

    it('should handle error with response body', async () => {
      const errorWithBody = {
        response: {
          statusCode: 422,
          body: {
            message: 'Request validation failed',
            error: 'Invalid query parameters',
            error_code: 'VALIDATION_ERROR',
            details: 'providerMetadataId is invalid',
          },
        },
      };
      mockRestClient.get.mockRejectedValue(errorWithBody);

      await expect(listService.execute()).rejects.toThrow(IOEventsApiError);

      try {
        await listService.execute();
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(422);
        expect(ioError.message).toBe('Request validation failed');
        expect(ioError.errorCode).toBe('VALIDATION_ERROR');
        expect(ioError.details).toBe('providerMetadataId is invalid');
      }
    });

    it('should handle error response without statusCode using fallback', async () => {
      const errorWithoutStatusCode = {
        response: {
          body: {
            error: 'Generic list error without status',
            error_code: 'LIST_GENERIC_ERROR',
            details: 'No status code provided',
          },
        },
      };
      mockRestClient.get.mockRejectedValue(errorWithoutStatusCode);

      await expect(listService.execute()).rejects.toThrow(IOEventsApiError);

      try {
        await listService.execute();
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(500); // Fallback to INTERNAL_SERVER_ERROR
        expect(ioError.message).toBe('Generic list error without status');
        expect(ioError.errorCode).toBe('LIST_GENERIC_ERROR');
      }
    });

    it('should handle error response without message or error using status fallback', async () => {
      const errorWithoutMessage = {
        response: {
          statusCode: 403,
          body: {
            error_code: 'NO_MESSAGE_LIST_ERROR',
            details: 'No message provided for list operation',
          },
        },
      };
      mockRestClient.get.mockRejectedValue(errorWithoutMessage);

      await expect(listService.execute()).rejects.toThrow(IOEventsApiError);

      try {
        await listService.execute();
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(403);
        expect(ioError.message).toBe('Forbidden: Insufficient permissions or invalid API key'); // Fallback from status
        expect(ioError.errorCode).toBe('NO_MESSAGE_LIST_ERROR');
      }
    });

    it('should handle generic error with explicit message', async () => {
      const errorWithMessage = new Error('Explicit list error message');
      mockRestClient.get.mockRejectedValue(errorWithMessage);

      await expect(listService.execute()).rejects.toThrow(IOEventsApiError);

      try {
        await listService.execute();
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toBe('Failed to list providers: Explicit list error message');
        expect(ioError.statusCode).toBe(500);
        expect(ioError.errorCode).toBe('UNKNOWN_ERROR');
      }
    });

    it('should handle generic error without message using fallback', async () => {
      const errorWithoutMessage = { someProperty: 'no message in list' };
      mockRestClient.get.mockRejectedValue(errorWithoutMessage);

      await expect(listService.execute()).rejects.toThrow(IOEventsApiError);

      try {
        await listService.execute();
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toBe('Failed to list providers: Unknown error occurred');
        expect(ioError.statusCode).toBe(500);
        expect(ioError.errorCode).toBe('UNKNOWN_ERROR');
      }
    });

    it('should handle extractStatusCodeFromMessage with no match', async () => {
      const errorWithInvalidFormat = new Error('Invalid format message for list without status');
      mockRestClient.get.mockRejectedValue(errorWithInvalidFormat);

      await expect(listService.execute()).rejects.toThrow(IOEventsApiError);

      try {
        await listService.execute();
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(500); // Fallback from extractStatusCodeFromMessage
      }
    });

    it('should handle extractStatusCodeFromMessage with successful regex match', async () => {
      const errorWithStatusInMessage = new Error('HTTP error! status: 429');
      mockRestClient.get.mockRejectedValue(errorWithStatusInMessage);

      await expect(listService.execute()).rejects.toThrow(IOEventsApiError);

      try {
        await listService.execute();
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(429); // Successfully parsed from regex
      }
    });

    it('should handle extractStatusCodeFromMessage with regex match failure but contains HTTP error status', async () => {
      const errorWithInvalidStatus = new Error('HTTP error! status:');
      mockRestClient.get.mockRejectedValue(errorWithInvalidStatus);

      await expect(listService.execute()).rejects.toThrow(IOEventsApiError);

      try {
        await listService.execute();
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(500); // Fallback when regex doesn't match number
      }
    });
  });
});
