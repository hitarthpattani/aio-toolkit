/**
 * <license header>
 */

import Get from '../../../../src/io-events/event-metadata/get';
import { IOEventsApiError, IoEventsGlobals } from '../../../../src/io-events/types';
import type { EventMetadata } from '../../../../src/io-events/event-metadata/types';
import RestClient from '../../../../src/integration/rest-client';

// Mock RestClient
jest.mock('../../../../src/integration/rest-client');
const MockedRestClient = RestClient as jest.MockedClass<typeof RestClient>;

describe('Get Event Metadata', () => {
  let getService: Get;
  let mockRestClient: jest.Mocked<RestClient>;

  const validCredentials = {
    clientId: 'test-client-id',
    consumerId: 'test-consumer-id',
    projectId: 'test-project-id',
    workspaceId: 'test-workspace-id',
    accessToken: 'test-access-token',
  };

  const validProviderId = 'test-provider-123';
  const validEventCode = 'com.example.user.created';

  const mockEventMetadataResponse: EventMetadata = {
    event_code: 'com.example.user.created',
    label: 'User Created',
    description: 'Triggered when a new user is created',
    sample_event_template: '{"user_id":"12345","name":"John Doe","email":"john@example.com"}',
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
      const testCases = [
        { field: 'clientId', value: '', expectedError: 'clientId is required and cannot be empty' },
        {
          field: 'consumerId',
          value: '',
          expectedError: 'consumerId is required and cannot be empty',
        },
        {
          field: 'projectId',
          value: '',
          expectedError: 'projectId is required and cannot be empty',
        },
        {
          field: 'workspaceId',
          value: '',
          expectedError: 'workspaceId is required and cannot be empty',
        },
        {
          field: 'accessToken',
          value: '',
          expectedError: 'accessToken is required and cannot be empty',
        },
      ];

      testCases.forEach(({ field, value, expectedError }) => {
        const params = { ...validCredentials, [field]: value };
        expect(() => {
          new Get(
            params.clientId,
            params.consumerId,
            params.projectId,
            params.workspaceId,
            params.accessToken
          );
        }).toThrow(expectedError);
      });
    });
  });

  describe('execute', () => {
    it('should get event metadata successfully with valid IDs', async () => {
      mockRestClient.get.mockResolvedValue(mockEventMetadataResponse);

      const result = await getService.execute(validProviderId, validEventCode);

      expect(result).toEqual(mockEventMetadataResponse);
      expect(mockRestClient.get).toHaveBeenCalledWith(
        `${IoEventsGlobals.BASE_URL}/events/providers/${validProviderId}/eventmetadata/${validEventCode}`,
        {
          Authorization: `Bearer ${validCredentials.accessToken}`,
          'x-api-key': validCredentials.clientId,
          Accept: 'application/hal+json',
        }
      );
    });

    it('should handle URL encoding in event code', async () => {
      const eventCodeWithSpecialChars = 'com.example.user-profile.updated';
      mockRestClient.get.mockResolvedValue({
        event_code: eventCodeWithSpecialChars,
        label: 'User Profile Updated',
        description: 'Triggered when user profile is updated',
      });

      const result = await getService.execute(validProviderId, eventCodeWithSpecialChars);

      expect(result.event_code).toBe(eventCodeWithSpecialChars);
      expect(mockRestClient.get).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent(eventCodeWithSpecialChars)),
        expect.any(Object)
      );
    });

    it('should throw error for empty providerId', async () => {
      await expect(getService.execute('', validEventCode)).rejects.toThrow(IOEventsApiError);
      await expect(getService.execute('', validEventCode)).rejects.toThrow(
        'providerId is required and cannot be empty'
      );
    });

    it('should throw error for undefined providerId', async () => {
      await expect(getService.execute(undefined as any, validEventCode)).rejects.toThrow(
        IOEventsApiError
      );
      await expect(getService.execute(undefined as any, validEventCode)).rejects.toThrow(
        'providerId is required and cannot be empty'
      );
    });

    it('should throw error for whitespace-only providerId', async () => {
      await expect(getService.execute('   ', validEventCode)).rejects.toThrow(IOEventsApiError);
    });

    it('should throw error for empty eventCode', async () => {
      await expect(getService.execute(validProviderId, '')).rejects.toThrow(IOEventsApiError);
      await expect(getService.execute(validProviderId, '')).rejects.toThrow(
        'eventCode is required and cannot be empty'
      );
    });

    it('should throw error for undefined eventCode', async () => {
      await expect(getService.execute(validProviderId, undefined as any)).rejects.toThrow(
        IOEventsApiError
      );
      await expect(getService.execute(validProviderId, undefined as any)).rejects.toThrow(
        'eventCode is required and cannot be empty'
      );
    });

    it('should validate response format - null response', async () => {
      mockRestClient.get.mockResolvedValue(null);

      await expect(getService.execute(validProviderId, validEventCode)).rejects.toThrow(
        IOEventsApiError
      );
      await expect(getService.execute(validProviderId, validEventCode)).rejects.toThrow(
        'Invalid response format: Expected object'
      );
    });

    it('should validate response format - non-object response', async () => {
      mockRestClient.get.mockResolvedValue('invalid response' as any);

      await expect(getService.execute(validProviderId, validEventCode)).rejects.toThrow(
        IOEventsApiError
      );
      await expect(getService.execute(validProviderId, validEventCode)).rejects.toThrow(
        'Invalid response format: Expected object'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP error with status code', async () => {
      const httpError = new Error('HTTP error! status: 404');
      mockRestClient.get.mockRejectedValue(httpError);

      await expect(getService.execute(validProviderId, validEventCode)).rejects.toThrow(
        IOEventsApiError
      );

      try {
        await getService.execute(validProviderId, validEventCode);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(404);
        expect(ioError.message).toBe(
          'Event metadata not found for the specified provider and event code'
        );
      }
    });

    it('should handle different HTTP status codes correctly', async () => {
      const statusTests = [
        { status: 401, expectedMessage: 'Unauthorized: Invalid or expired access token' },
        { status: 403, expectedMessage: 'Forbidden: Insufficient permissions or invalid API key' },
        { status: 404, expectedMessage: 'Not Found: Event metadata not found or does not exist' },
        {
          status: 500,
          expectedMessage: 'Internal server error occurred while getting event metadata',
        },
        { status: 422, expectedMessage: 'HTTP 422: Event metadata retrieval failed' },
      ];

      for (const test of statusTests) {
        const httpError = new Error(`HTTP error! status: ${test.status}`);
        mockRestClient.get.mockRejectedValue(httpError);

        try {
          await getService.execute(validProviderId, validEventCode);
          fail(`Expected error for status ${test.status}`);
        } catch (error) {
          expect(error instanceof IOEventsApiError).toBe(true);
          const ioError = error as IOEventsApiError;
          expect(ioError.statusCode).toBe(test.status);
          if (test.status === 401) {
            expect(ioError.message).toBe('Authentication failed. Please check your access token');
          } else if (test.status === 403) {
            expect(ioError.message).toBe(
              'Access forbidden. You do not have permission to access this event metadata'
            );
          } else if (test.status === 404) {
            expect(ioError.message).toBe(
              'Event metadata not found for the specified provider and event code'
            );
          } else if (test.status === 500) {
            expect(ioError.message).toBe(
              'Internal server error occurred while getting event metadata'
            );
          } else {
            expect(ioError.message).toBe(`Unexpected error occurred: HTTP ${test.status}`);
          }
        }
      }
    });

    it('should handle error with response object', async () => {
      const errorWithResponse = {
        response: {
          status: 403,
          body: {
            message: 'Access denied',
            error: 'Insufficient permissions',
            error_code: 'FORBIDDEN',
            details: 'User does not have read access to this event metadata',
          },
        },
      };
      mockRestClient.get.mockRejectedValue(errorWithResponse);

      await expect(getService.execute(validProviderId, validEventCode)).rejects.toThrow(
        IOEventsApiError
      );

      try {
        await getService.execute(validProviderId, validEventCode);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(403);
        expect(ioError.message).toBe('Access denied');
        expect(ioError.errorCode).toBe('FORBIDDEN');
        expect(ioError.details).toBe('User does not have read access to this event metadata');
      }
    });

    it('should handle network errors', async () => {
      const networkError = { code: 'ENOTFOUND' };
      mockRestClient.get.mockRejectedValue(networkError);

      await expect(getService.execute(validProviderId, validEventCode)).rejects.toThrow(
        IOEventsApiError
      );

      try {
        await getService.execute(validProviderId, validEventCode);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toContain('API Error: HTTP 500');
        expect(ioError.errorCode).toBeUndefined();
      }
    });

    it('should handle connection refused errors', async () => {
      const connRefusedError = { code: 'ECONNREFUSED' };
      mockRestClient.get.mockRejectedValue(connRefusedError);

      await expect(getService.execute(validProviderId, validEventCode)).rejects.toThrow(
        IOEventsApiError
      );

      try {
        await getService.execute(validProviderId, validEventCode);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toContain('API Error: HTTP 500');
        expect(ioError.errorCode).toBeUndefined();
      }
    });

    it('should handle timeout errors', async () => {
      const timeoutError = { code: 'ETIMEDOUT' };
      mockRestClient.get.mockRejectedValue(timeoutError);

      await expect(getService.execute(validProviderId, validEventCode)).rejects.toThrow(
        IOEventsApiError
      );

      try {
        await getService.execute(validProviderId, validEventCode);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toContain('API Error: HTTP 500');
        expect(ioError.errorCode).toBeUndefined();
      }
    });

    it('should handle JSON parsing errors', async () => {
      const jsonError = new Error('Invalid JSON response');
      mockRestClient.get.mockRejectedValue(jsonError);

      await expect(getService.execute(validProviderId, validEventCode)).rejects.toThrow(
        IOEventsApiError
      );

      try {
        await getService.execute(validProviderId, validEventCode);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toContain('Invalid response format');
        expect(ioError.errorCode).toBe('PARSE_ERROR');
      }
    });

    it('should handle validation errors', async () => {
      const validationError = new Error('Validation failed for request parameters');
      mockRestClient.get.mockRejectedValue(validationError);

      await expect(getService.execute(validProviderId, validEventCode)).rejects.toThrow(
        IOEventsApiError
      );

      try {
        await getService.execute(validProviderId, validEventCode);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toContain('Network error');
      }
    });

    it('should handle generic errors', async () => {
      const genericError = new Error('Something unexpected happened');
      mockRestClient.get.mockRejectedValue(genericError);

      await expect(getService.execute(validProviderId, validEventCode)).rejects.toThrow(
        IOEventsApiError
      );

      try {
        await getService.execute(validProviderId, validEventCode);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toContain('Network error');
      }
    });

    it('should handle extractStatusCodeFromMessage with successful regex match', async () => {
      const errorWithStatusInMessage = new Error('HTTP error! status: 410');
      mockRestClient.get.mockRejectedValue(errorWithStatusInMessage);

      try {
        await getService.execute(validProviderId, validEventCode);
        fail('Expected error');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(410); // Successfully parsed from regex
        expect(ioError.message).toContain('Unexpected error occurred: HTTP 410');
      }
    });

    it('should handle extractStatusCodeFromMessage with regex match failure but contains HTTP error status', async () => {
      const errorWithInvalidStatus = new Error('HTTP error! status: invalid');
      mockRestClient.get.mockRejectedValue(errorWithInvalidStatus);

      try {
        await getService.execute(validProviderId, validEventCode);
        fail('Expected error');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR); // Fallback when regex doesn't match number
      }
    });

    it('should handle timeout errors with specific timeout status code', async () => {
      const timeoutError = new Error('Request timeout occurred while getting event metadata');
      mockRestClient.get.mockRejectedValue(timeoutError);

      try {
        await getService.execute(validProviderId, validEventCode);
        fail('Expected error');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(IoEventsGlobals.STATUS_CODES.REQUEST_TIMEOUT);
        expect(ioError.message).toBe('Request timeout while getting event metadata');
      }
    });

    it('should handle ETIMEDOUT errors with specific timeout status code', async () => {
      const etimedoutError = new Error('Connection failed: ETIMEDOUT');
      mockRestClient.get.mockRejectedValue(etimedoutError);

      try {
        await getService.execute(validProviderId, validEventCode);
        fail('Expected error');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(IoEventsGlobals.STATUS_CODES.REQUEST_TIMEOUT);
        expect(ioError.message).toBe('Request timeout while getting event metadata');
      }
    });

    it('should return BAD_REQUEST error message for 400 status code', async () => {
      const errorWith400 = new Error('HTTP error! status: 400');
      mockRestClient.get.mockRejectedValue(errorWith400);

      try {
        await getService.execute(validProviderId, validEventCode);
        fail('Expected error');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(400);
        expect(ioError.message).toBe('Invalid request parameters for getting event metadata');
      }
    });

    it('should use fallback error message when response.body.message is undefined', async () => {
      const errorWithoutMessage = {
        response: {
          status: 404,
          body: {
            error: 'Some error occurred',
            // No message property
          },
        },
      };
      mockRestClient.get.mockRejectedValue(errorWithoutMessage);

      try {
        await getService.execute(validProviderId, validEventCode);
        fail('Expected error');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(404);
        expect(ioError.message).toBe(
          'Event metadata not found for the specified provider and event code'
        ); // This is the fallback message from getErrorMessageForStatus
      }
    });

    it('should use extractStatusCode fallback when response.status is falsy', async () => {
      const errorWithFalsyStatus = {
        response: {
          status: null, // Falsy status that triggers the fallback
          body: {
            message: 'Some error occurred',
          },
        },
      };
      mockRestClient.get.mockRejectedValue(errorWithFalsyStatus);

      try {
        await getService.execute(validProviderId, validEventCode);
        fail('Expected error');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR); // 500 fallback
        expect(ioError.message).toBe('Some error occurred');
      }
    });
  });
});
