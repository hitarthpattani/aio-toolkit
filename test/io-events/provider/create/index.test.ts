/**
 * <license header>
 */

import Create from '../../../../src/io-events/provider/create';
import { IOEventsApiError, IoEventsGlobals } from '../../../../src/io-events/types';
import type { ProviderInputModel } from '../../../../src/io-events/provider/create/types';
import type { Provider } from '../../../../src/io-events/provider/types';
import RestClient from '../../../../src/integration/rest-client';

// Mock RestClient
jest.mock('../../../../src/integration/rest-client');
const MockedRestClient = RestClient as jest.MockedClass<typeof RestClient>;

describe('Create Provider', () => {
  let createService: Create;
  let mockRestClient: jest.Mocked<RestClient>;

  const validCredentials = {
    clientId: 'test-client-id',
    consumerId: 'test-consumer-id',
    projectId: 'test-project-id',
    workspaceId: 'test-workspace-id',
    accessToken: 'test-access-token',
  };

  const validProviderData: ProviderInputModel = {
    label: 'Test Provider',
    description: 'A test provider',
    docs_url: 'https://example.com/docs',
  };

  const mockProviderResponse: Provider = {
    id: 'test-provider-123',
    label: 'Test Provider',
    description: 'A test provider',
    source: 'test-source',
    docs_url: 'https://example.com/docs',
    provider_metadata: '3rd_party_custom_events',
    event_delivery_format: 'adobe_io',
    publisher: 'test-publisher',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRestClient = {
      post: jest.fn(),
    } as any;
    MockedRestClient.mockImplementation(() => mockRestClient);

    createService = new Create(
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
        new Create(
          validCredentials.clientId,
          validCredentials.consumerId,
          validCredentials.projectId,
          validCredentials.workspaceId,
          validCredentials.accessToken
        );
      }).not.toThrow();
    });

    it('should throw error for empty clientId', () => {
      expect(() => {
        new Create(
          '',
          validCredentials.consumerId,
          validCredentials.projectId,
          validCredentials.workspaceId,
          validCredentials.accessToken
        );
      }).toThrow('clientId is required and cannot be empty');
    });

    it('should throw error for undefined clientId', () => {
      expect(() => {
        new Create(
          undefined as any,
          validCredentials.consumerId,
          validCredentials.projectId,
          validCredentials.workspaceId,
          validCredentials.accessToken
        );
      }).toThrow('clientId is required and cannot be empty');
    });

    it('should throw error for whitespace-only clientId', () => {
      expect(() => {
        new Create(
          '   ',
          validCredentials.consumerId,
          validCredentials.projectId,
          validCredentials.workspaceId,
          validCredentials.accessToken
        );
      }).toThrow('clientId is required and cannot be empty');
    });

    it('should throw error for empty consumerId', () => {
      expect(() => {
        new Create(
          validCredentials.clientId,
          '',
          validCredentials.projectId,
          validCredentials.workspaceId,
          validCredentials.accessToken
        );
      }).toThrow('consumerId is required and cannot be empty');
    });

    it('should throw error for empty projectId', () => {
      expect(() => {
        new Create(
          validCredentials.clientId,
          validCredentials.consumerId,
          '',
          validCredentials.workspaceId,
          validCredentials.accessToken
        );
      }).toThrow('projectId is required and cannot be empty');
    });

    it('should throw error for empty workspaceId', () => {
      expect(() => {
        new Create(
          validCredentials.clientId,
          validCredentials.consumerId,
          validCredentials.projectId,
          '',
          validCredentials.accessToken
        );
      }).toThrow('workspaceId is required and cannot be empty');
    });

    it('should throw error for empty accessToken', () => {
      expect(() => {
        new Create(
          validCredentials.clientId,
          validCredentials.consumerId,
          validCredentials.projectId,
          validCredentials.workspaceId,
          ''
        );
      }).toThrow('accessToken is required and cannot be empty');
    });
  });

  describe('execute', () => {
    it('should create provider successfully with valid data', async () => {
      mockRestClient.post.mockResolvedValue(mockProviderResponse);

      const result = await createService.execute(validProviderData);

      expect(result).toEqual(mockProviderResponse);
      expect(mockRestClient.post).toHaveBeenCalledWith(
        `${IoEventsGlobals.BASE_URL}/events/${validCredentials.consumerId}/${validCredentials.projectId}/${validCredentials.workspaceId}/providers`,
        {
          Authorization: `Bearer ${validCredentials.accessToken}`,
          'x-api-key': validCredentials.clientId,
          Accept: 'application/hal+json',
          'Content-Type': 'application/json',
        },
        validProviderData
      );
    });

    it('should create provider with minimal required data', async () => {
      const minimalProviderData: ProviderInputModel = {
        label: 'Minimal Provider',
      };
      mockRestClient.post.mockResolvedValue(mockProviderResponse);

      const result = await createService.execute(minimalProviderData);

      expect(result).toEqual(mockProviderResponse);
      expect(mockRestClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        minimalProviderData
      );
    });

    it('should create provider with all optional fields', async () => {
      const fullProviderData: ProviderInputModel = {
        label: 'Full Provider',
        description: 'A provider with all fields',
        docs_url: 'https://example.com/docs',
        provider_metadata: 'custom_metadata',
        instance_id: 'custom-instance-123',
        data_residency_region: 'irl1',
      };
      mockRestClient.post.mockResolvedValue(mockProviderResponse);

      const result = await createService.execute(fullProviderData);

      expect(result).toEqual(mockProviderResponse);
      expect(mockRestClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        fullProviderData
      );
    });

    it('should throw error for undefined provider data', async () => {
      await expect(createService.execute(undefined as any)).rejects.toThrow(IOEventsApiError);
      await expect(createService.execute(undefined as any)).rejects.toThrow(
        'providerData is required'
      );
    });

    it('should throw error for empty label', async () => {
      const invalidData = { label: '' };

      await expect(createService.execute(invalidData)).rejects.toThrow(IOEventsApiError);
      await expect(createService.execute(invalidData)).rejects.toThrow(
        'label is required in providerData'
      );
    });

    it('should throw error for whitespace-only label', async () => {
      const invalidData = { label: '   ' };

      await expect(createService.execute(invalidData)).rejects.toThrow(IOEventsApiError);
    });

    it('should throw error for missing label', async () => {
      const invalidData = { description: 'No label' } as any;

      await expect(createService.execute(invalidData)).rejects.toThrow(IOEventsApiError);
    });

    it('should validate response format - null response', async () => {
      mockRestClient.post.mockResolvedValue(null);

      await expect(createService.execute(validProviderData)).rejects.toThrow(IOEventsApiError);
      await expect(createService.execute(validProviderData)).rejects.toThrow(
        'Invalid response format: Expected provider object'
      );
    });

    it('should validate response format - non-object response', async () => {
      mockRestClient.post.mockResolvedValue('invalid response' as any);

      await expect(createService.execute(validProviderData)).rejects.toThrow(IOEventsApiError);
      await expect(createService.execute(validProviderData)).rejects.toThrow(
        'Invalid response format: Expected provider object'
      );
    });

    it('should validate response format - missing provider id', async () => {
      const invalidResponse = { ...mockProviderResponse, id: undefined } as any;
      mockRestClient.post.mockResolvedValue(invalidResponse);

      await expect(createService.execute(validProviderData)).rejects.toThrow(IOEventsApiError);
      await expect(createService.execute(validProviderData)).rejects.toThrow(
        'Invalid response format: Missing provider id'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP error with status code', async () => {
      const httpError = new Error('HTTP error! status: 401');
      mockRestClient.post.mockRejectedValue(httpError);

      await expect(createService.execute(validProviderData)).rejects.toThrow(IOEventsApiError);

      try {
        await createService.execute(validProviderData);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(401);
        expect(ioError.message).toBe('Unauthorized: Invalid or expired access token');
      }
    });

    it('should handle conflict error with conflicting ID header', async () => {
      const conflictError = {
        response: {
          statusCode: 409,
          headers: { 'x-conflicting-id': 'existing-provider-123' },
          body: { error: 'Provider exists' },
        },
      };
      mockRestClient.post.mockRejectedValue(conflictError);

      await expect(createService.execute(validProviderData)).rejects.toThrow(IOEventsApiError);

      try {
        await createService.execute(validProviderData);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(409);
        expect(ioError.message).toBe(
          'Provider already exists with conflicting ID: existing-provider-123'
        );
        expect(ioError.errorCode).toBe('CONFLICT_ERROR');
        expect(ioError.details).toBe('Conflicting provider ID: existing-provider-123');
      }
    });

    it('should handle network errors', async () => {
      const networkError = { code: 'ENOTFOUND' };
      mockRestClient.post.mockRejectedValue(networkError);

      await expect(createService.execute(validProviderData)).rejects.toThrow(IOEventsApiError);

      try {
        await createService.execute(validProviderData);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toContain('Network error');
        expect(ioError.errorCode).toBe('NETWORK_ERROR');
      }
    });

    it('should handle timeout errors', async () => {
      const timeoutError = { code: 'ETIMEDOUT' };
      mockRestClient.post.mockRejectedValue(timeoutError);

      await expect(createService.execute(validProviderData)).rejects.toThrow(IOEventsApiError);

      try {
        await createService.execute(validProviderData);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toContain('Request timeout');
        expect(ioError.errorCode).toBe('TIMEOUT_ERROR');
      }
    });

    it('should handle JSON parsing errors', async () => {
      const jsonError = new Error('Invalid JSON response');
      mockRestClient.post.mockRejectedValue(jsonError);

      await expect(createService.execute(validProviderData)).rejects.toThrow(IOEventsApiError);

      try {
        await createService.execute(validProviderData);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toContain('Invalid response format');
        expect(ioError.errorCode).toBe('PARSE_ERROR');
      }
    });

    it('should handle different HTTP status codes correctly', async () => {
      const statusTests = [
        { status: 401, expectedMessage: 'Unauthorized: Invalid or expired access token' },
        {
          status: 403,
          expectedMessage:
            'Forbidden: Insufficient permissions or invalid scopes, or attempt to create non multi-instance provider',
        },
        {
          status: 404,
          expectedMessage: 'Provider metadata provided in the input model does not exist',
        },
        { status: 409, expectedMessage: 'The event provider already exists' },
        { status: 500, expectedMessage: 'Internal server error occurred while creating provider' },
        { status: 418, expectedMessage: 'HTTP 418: Provider creation failed' },
      ];

      for (const test of statusTests) {
        const httpError = new Error(`HTTP error! status: ${test.status}`);
        mockRestClient.post.mockRejectedValue(httpError);

        try {
          await createService.execute(validProviderData);
          fail(`Expected error for status ${test.status}`);
        } catch (error) {
          expect(error instanceof IOEventsApiError).toBe(true);
          const ioError = error as IOEventsApiError;
          expect(ioError.statusCode).toBe(test.status);
          expect(ioError.message).toBe(test.expectedMessage);
        }
      }
    });

    it('should handle generic errors', async () => {
      const genericError = new Error('Something went wrong');
      mockRestClient.post.mockRejectedValue(genericError);

      await expect(createService.execute(validProviderData)).rejects.toThrow(IOEventsApiError);

      try {
        await createService.execute(validProviderData);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toContain('Failed to create provider');
        expect(ioError.errorCode).toBe('UNKNOWN_ERROR');
      }
    });

    it('should handle error response with body but no conflict status', async () => {
      const errorWithBody = {
        response: {
          statusCode: 422,
          body: {
            message: 'Validation failed',
            error: 'Invalid data provided',
            error_code: 'VALIDATION_FAILED',
            details: 'The label field is invalid',
          },
        },
      };
      mockRestClient.post.mockRejectedValue(errorWithBody);

      await expect(createService.execute(validProviderData)).rejects.toThrow(IOEventsApiError);

      try {
        await createService.execute(validProviderData);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(422);
        expect(ioError.message).toBe('Validation failed');
        expect(ioError.errorCode).toBe('VALIDATION_FAILED');
        expect(ioError.details).toBe('The label field is invalid');
      }
    });

    it('should handle error response without statusCode using fallback', async () => {
      const errorWithoutStatusCode = {
        response: {
          body: {
            error: 'Generic error without status',
            error_code: 'GENERIC_ERROR',
            details: 'No status code provided',
          },
        },
      };
      mockRestClient.post.mockRejectedValue(errorWithoutStatusCode);

      await expect(createService.execute(validProviderData)).rejects.toThrow(IOEventsApiError);

      try {
        await createService.execute(validProviderData);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(500); // Fallback to INTERNAL_SERVER_ERROR
        expect(ioError.message).toBe('Generic error without status');
        expect(ioError.errorCode).toBe('GENERIC_ERROR');
      }
    });

    it('should handle error response without message or error using status fallback', async () => {
      const errorWithoutMessage = {
        response: {
          statusCode: 422,
          body: {
            error_code: 'NO_MESSAGE_ERROR',
            details: 'No message provided',
          },
        },
      };
      mockRestClient.post.mockRejectedValue(errorWithoutMessage);

      await expect(createService.execute(validProviderData)).rejects.toThrow(IOEventsApiError);

      try {
        await createService.execute(validProviderData);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(422);
        expect(ioError.message).toBe('HTTP 422: Provider creation failed'); // Fallback from status
        expect(ioError.errorCode).toBe('NO_MESSAGE_ERROR');
      }
    });

    it('should handle generic error with explicit message', async () => {
      const errorWithMessage = new Error('Explicit error message');
      mockRestClient.post.mockRejectedValue(errorWithMessage);

      await expect(createService.execute(validProviderData)).rejects.toThrow(IOEventsApiError);

      try {
        await createService.execute(validProviderData);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toBe('Failed to create provider: Explicit error message');
        expect(ioError.statusCode).toBe(500);
        expect(ioError.errorCode).toBe('UNKNOWN_ERROR');
      }
    });

    it('should handle generic error without message using fallback', async () => {
      const errorWithoutMessage = { someProperty: 'no message' };
      mockRestClient.post.mockRejectedValue(errorWithoutMessage);

      await expect(createService.execute(validProviderData)).rejects.toThrow(IOEventsApiError);

      try {
        await createService.execute(validProviderData);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toBe('Failed to create provider: Unknown error occurred');
        expect(ioError.statusCode).toBe(500);
        expect(ioError.errorCode).toBe('UNKNOWN_ERROR');
      }
    });

    it('should handle extractStatusCodeFromMessage with no match', async () => {
      const errorWithInvalidFormat = new Error('Invalid format message without status');
      mockRestClient.post.mockRejectedValue(errorWithInvalidFormat);

      await expect(createService.execute(validProviderData)).rejects.toThrow(IOEventsApiError);

      try {
        await createService.execute(validProviderData);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(500); // Fallback from extractStatusCodeFromMessage
      }
    });

    it('should handle extractStatusCodeFromMessage with successful regex match', async () => {
      const errorWithStatusInMessage = new Error('HTTP error! status: 418');
      mockRestClient.post.mockRejectedValue(errorWithStatusInMessage);

      await expect(createService.execute(validProviderData)).rejects.toThrow(IOEventsApiError);

      try {
        await createService.execute(validProviderData);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(418); // Successfully parsed from regex
      }
    });

    it('should handle extractStatusCodeFromMessage with regex match failure but contains HTTP error status', async () => {
      const errorWithInvalidStatus = new Error('HTTP error! status: abc');
      mockRestClient.post.mockRejectedValue(errorWithInvalidStatus);

      await expect(createService.execute(validProviderData)).rejects.toThrow(IOEventsApiError);

      try {
        await createService.execute(validProviderData);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(500); // Fallback when regex doesn't match number
      }
    });
  });
});
