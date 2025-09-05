/**
 * <license header>
 */

import Delete from '../../../../src/io-events/event-metadata/delete';
import { IOEventsApiError, IoEventsGlobals } from '../../../../src/io-events/types';
import RestClient from '../../../../src/integration/rest-client';

// Mock RestClient
jest.mock('../../../../src/integration/rest-client');
const MockedRestClient = RestClient as jest.MockedClass<typeof RestClient>;

describe('Delete Event Metadata', () => {
  let deleteService: Delete;
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

  beforeEach(() => {
    jest.clearAllMocks();
    mockRestClient = {
      delete: jest.fn(),
    } as any;
    MockedRestClient.mockImplementation(() => mockRestClient);

    deleteService = new Delete(
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
        new Delete(
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
          new Delete(
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
    it('should delete all event metadata for provider successfully', async () => {
      mockRestClient.delete.mockResolvedValue(null);

      const result = await deleteService.execute(validProviderId);

      expect(result).toBeUndefined();
      expect(mockRestClient.delete).toHaveBeenCalledWith(
        `${IoEventsGlobals.BASE_URL}/events/${validCredentials.consumerId}/${validCredentials.projectId}/${validCredentials.workspaceId}/providers/${validProviderId}/eventmetadata`,
        {
          Authorization: `Bearer ${validCredentials.accessToken}`,
          'x-api-key': validCredentials.clientId,
          Accept: 'application/hal+json',
        }
      );
    });

    it('should delete specific event metadata successfully', async () => {
      mockRestClient.delete.mockResolvedValue(null);

      const result = await deleteService.execute(validProviderId, validEventCode);

      expect(result).toBeUndefined();
      expect(mockRestClient.delete).toHaveBeenCalledWith(
        `${IoEventsGlobals.BASE_URL}/events/${validCredentials.consumerId}/${validCredentials.projectId}/${validCredentials.workspaceId}/providers/${validProviderId}/eventmetadata/${validEventCode}`,
        {
          Authorization: `Bearer ${validCredentials.accessToken}`,
          'x-api-key': validCredentials.clientId,
          Accept: 'application/hal+json',
        }
      );
    });

    it('should handle different provider ID formats', async () => {
      const providerIds = ['provider-123', 'PROVIDER_456', 'complex-provider-name-789'];

      for (const providerId of providerIds) {
        mockRestClient.delete.mockResolvedValue(null);

        const result = await deleteService.execute(providerId);

        expect(result).toBeUndefined();
        expect(mockRestClient.delete).toHaveBeenCalledWith(
          expect.stringContaining(providerId),
          expect.any(Object)
        );
      }
    });

    it('should handle URL encoding in event code', async () => {
      const eventCodeWithSpecialChars = 'com.example.user-profile.updated';
      mockRestClient.delete.mockResolvedValue(null);

      const result = await deleteService.execute(validProviderId, eventCodeWithSpecialChars);

      expect(result).toBeUndefined();
      expect(mockRestClient.delete).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent(eventCodeWithSpecialChars)),
        expect.any(Object)
      );
    });

    it('should throw error for empty providerId', async () => {
      await expect(deleteService.execute('')).rejects.toThrow(IOEventsApiError);
      await expect(deleteService.execute('')).rejects.toThrow(
        'providerId is required and cannot be empty'
      );
    });

    it('should throw error for undefined providerId', async () => {
      await expect(deleteService.execute(undefined as any)).rejects.toThrow(IOEventsApiError);
      await expect(deleteService.execute(undefined as any)).rejects.toThrow(
        'providerId is required and cannot be empty'
      );
    });

    it('should throw error for whitespace-only providerId', async () => {
      await expect(deleteService.execute('   ')).rejects.toThrow(IOEventsApiError);
    });

    it('should throw error for empty eventCode when provided', async () => {
      await expect(deleteService.execute(validProviderId, '')).rejects.toThrow(IOEventsApiError);
      await expect(deleteService.execute(validProviderId, '')).rejects.toThrow(
        'eventCode cannot be empty when provided'
      );
    });

    it('should throw error for whitespace-only eventCode when provided', async () => {
      await expect(deleteService.execute(validProviderId, '   ')).rejects.toThrow(IOEventsApiError);
    });

    it('should allow undefined eventCode for deleting all event metadata', async () => {
      mockRestClient.delete.mockResolvedValue(null);

      await expect(deleteService.execute(validProviderId, undefined)).resolves.toBeUndefined();
      expect(mockRestClient.delete).toHaveBeenCalledWith(
        expect.not.stringMatching(/\/eventmetadata\/.+$/), // Should not end with /eventmetadata/{eventCode}
        expect.any(Object)
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP error with status code', async () => {
      const httpError = new Error('HTTP error! status: 404');
      mockRestClient.delete.mockRejectedValue(httpError);

      await expect(deleteService.execute(validProviderId)).rejects.toThrow(IOEventsApiError);

      try {
        await deleteService.execute(validProviderId);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(404);
        expect(ioError.message).toBe(
          'Provider or event metadata not found. The specified provider ID or event code does not exist'
        );
      }
    });

    it('should handle different HTTP status codes correctly', async () => {
      const statusTests = [
        { status: 401, expectedMessage: 'Unauthorized: Invalid or expired access token' },
        { status: 403, expectedMessage: 'Forbidden: Insufficient permissions or invalid API key' },
        { status: 404, expectedMessage: 'Not Found: Event metadata not found or does not exist' },
        {
          status: 409,
          expectedMessage: 'Conflict: Cannot delete event metadata due to existing dependencies',
        },
        {
          status: 500,
          expectedMessage: 'Internal server error occurred while deleting event metadata',
        },
        { status: 422, expectedMessage: 'HTTP 422: Event metadata deletion failed' },
      ];

      for (const test of statusTests) {
        const httpError = new Error(`HTTP error! status: ${test.status}`);
        mockRestClient.delete.mockRejectedValue(httpError);

        try {
          await deleteService.execute(validProviderId);
          fail(`Expected error for status ${test.status}`);
        } catch (error) {
          expect(error instanceof IOEventsApiError).toBe(true);
          const ioError = error as IOEventsApiError;
          expect(ioError.statusCode).toBe(test.status);
          if (test.status === 401) {
            expect(ioError.message).toBe('Authentication failed. Please check your access token');
          } else if (test.status === 403) {
            expect(ioError.message).toBe(
              'Access forbidden. You do not have permission to delete event metadata'
            );
          } else if (test.status === 404) {
            expect(ioError.message).toBe(
              'Provider or event metadata not found. The specified provider ID or event code does not exist'
            );
          } else if (test.status === 500) {
            expect(ioError.message).toBe(
              'Internal server error occurred while deleting event metadata'
            );
          } else {
            expect(ioError.message).toBe(`Unexpected error occurred: HTTP ${test.status}`);
          }
        }
      }
    });

    it('should handle network errors', async () => {
      const networkError = { code: 'ENOTFOUND' };
      mockRestClient.delete.mockRejectedValue(networkError);

      await expect(deleteService.execute(validProviderId)).rejects.toThrow(IOEventsApiError);

      try {
        await deleteService.execute(validProviderId);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toContain('API Error: HTTP 500');
        expect(ioError.errorCode).toBeUndefined();
      }
    });

    it('should handle timeout errors', async () => {
      const timeoutError = { code: 'ETIMEDOUT' };
      mockRestClient.delete.mockRejectedValue(timeoutError);

      await expect(deleteService.execute(validProviderId)).rejects.toThrow(IOEventsApiError);

      try {
        await deleteService.execute(validProviderId);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toContain('API Error: HTTP 500');
        expect(ioError.errorCode).toBeUndefined();
      }
    });

    it('should handle generic errors', async () => {
      const genericError = new Error('Something went wrong');
      mockRestClient.delete.mockRejectedValue(genericError);

      await expect(deleteService.execute(validProviderId)).rejects.toThrow(IOEventsApiError);

      try {
        await deleteService.execute(validProviderId);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toContain('Network error: Something went wrong');
        expect(ioError.errorCode).toBeUndefined();
      }
    });

    it('should extract status codes from different error response formats', async () => {
      // Test extracting from error.response.statusCode
      const errorWithResponseStatusCode = { response: { statusCode: 500 } };
      mockRestClient.delete.mockRejectedValue(errorWithResponseStatusCode);

      try {
        await deleteService.execute(validProviderId);
        fail('Expected error');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(500);
      }

      // Test extracting from error.response.status
      const errorWithDirectStatus = { response: { status: 502 } };
      mockRestClient.delete.mockRejectedValue(errorWithDirectStatus);

      try {
        await deleteService.execute(validProviderId);
        fail('Expected error');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(502);
      }

      // Test fallback to internal server error
      const errorWithoutStatus = { someProperty: 'value' };
      mockRestClient.delete.mockRejectedValue(errorWithoutStatus);

      try {
        await deleteService.execute(validProviderId);
        fail('Expected error');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR);
      }
    });

    it('should handle extractStatusCodeFromMessage with successful regex match', async () => {
      const errorWithStatusInMessage = new Error('HTTP error! status: 451');
      mockRestClient.delete.mockRejectedValue(errorWithStatusInMessage);

      try {
        await deleteService.execute(validProviderId);
        fail('Expected error');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(451); // Successfully parsed from regex
        expect(ioError.message).toContain('Unexpected error occurred: HTTP 451');
      }
    });

    it('should handle extractStatusCodeFromMessage with regex match failure but contains HTTP error status', async () => {
      const errorWithInvalidStatus = new Error('HTTP error! status: ');
      mockRestClient.delete.mockRejectedValue(errorWithInvalidStatus);

      try {
        await deleteService.execute(validProviderId);
        fail('Expected error');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(500); // Fallback when regex doesn't match number
      }
    });

    it('should handle timeout errors with specific timeout status code', async () => {
      const timeoutError = new Error('Request timeout occurred while deleting event metadata');
      mockRestClient.delete.mockRejectedValue(timeoutError);

      try {
        await deleteService.execute(validProviderId);
        fail('Expected error');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(IoEventsGlobals.STATUS_CODES.REQUEST_TIMEOUT);
        expect(ioError.message).toBe('Request timeout while deleting event metadata');
      }
    });

    it('should handle ETIMEDOUT errors with specific timeout status code', async () => {
      const etimedoutError = new Error('Connection failed: ETIMEDOUT');
      mockRestClient.delete.mockRejectedValue(etimedoutError);

      try {
        await deleteService.execute(validProviderId);
        fail('Expected error');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(IoEventsGlobals.STATUS_CODES.REQUEST_TIMEOUT);
        expect(ioError.message).toBe('Request timeout while deleting event metadata');
      }
    });

    it('should handle validation error and throw it directly', async () => {
      const validationError = new Error('providerId cannot be empty');
      mockRestClient.delete.mockRejectedValue(validationError);

      try {
        await deleteService.execute(validProviderId);
        fail('Expected error');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(IoEventsGlobals.STATUS_CODES.BAD_REQUEST);
        expect(ioError.errorCode).toBe('VALIDATION_ERROR');
        expect(ioError.message).toBe('providerId cannot be empty');
      }
    });

    it('should handle JSON parsing errors', async () => {
      const jsonParseError = new Error('Failed to parse JSON response');
      mockRestClient.delete.mockRejectedValue(jsonParseError);

      try {
        await deleteService.execute(validProviderId);
        fail('Expected error');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR);
        expect(ioError.message).toBe('Invalid response format from Adobe I/O Events API');
      }
    });
  });
});
