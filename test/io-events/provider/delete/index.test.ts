/**
 * Copyright © Adobe, Inc. All rights reserved.
 */

import Delete from '../../../../src/io-events/provider/delete';
import { IOEventsApiError, IoEventsGlobals } from '../../../../src/io-events/types';
import RestClient from '../../../../src/integration/rest-client';

// Mock RestClient
jest.mock('../../../../src/integration/rest-client');
const MockedRestClient = RestClient as jest.MockedClass<typeof RestClient>;

describe('Delete Provider', () => {
  let deleteService: Delete;
  let mockRestClient: jest.Mocked<RestClient>;

  const validCredentials = {
    clientId: 'test-client-id',
    consumerId: 'test-consumer-id',
    projectId: 'test-project-id',
    workspaceId: 'test-workspace-id',
    accessToken: 'test-access-token',
  };

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
      expect(() => new Delete('', 'consumer', 'project', 'workspace', 'token')).toThrow(
        'clientId is required and cannot be empty'
      );
      expect(() => new Delete('client', '', 'project', 'workspace', 'token')).toThrow(
        'consumerId is required and cannot be empty'
      );
      expect(() => new Delete('client', 'consumer', '', 'workspace', 'token')).toThrow(
        'projectId is required and cannot be empty'
      );
      expect(() => new Delete('client', 'consumer', 'project', '', 'token')).toThrow(
        'workspaceId is required and cannot be empty'
      );
      expect(() => new Delete('client', 'consumer', 'project', 'workspace', '')).toThrow(
        'accessToken is required and cannot be empty'
      );
    });

    it('should throw error for whitespace-only parameters', () => {
      expect(() => new Delete('   ', 'consumer', 'project', 'workspace', 'token')).toThrow(
        'clientId is required and cannot be empty'
      );
      expect(() => new Delete('client', '   ', 'project', 'workspace', 'token')).toThrow(
        'consumerId is required and cannot be empty'
      );
      expect(() => new Delete('client', 'consumer', '   ', 'workspace', 'token')).toThrow(
        'projectId is required and cannot be empty'
      );
      expect(() => new Delete('client', 'consumer', 'project', '   ', 'token')).toThrow(
        'workspaceId is required and cannot be empty'
      );
      expect(() => new Delete('client', 'consumer', 'project', 'workspace', '   ')).toThrow(
        'accessToken is required and cannot be empty'
      );
    });

    it('should throw error for undefined parameters', () => {
      expect(
        () => new Delete(undefined as any, 'consumer', 'project', 'workspace', 'token')
      ).toThrow('clientId is required and cannot be empty');
      expect(() => new Delete('client', undefined as any, 'project', 'workspace', 'token')).toThrow(
        'consumerId is required and cannot be empty'
      );
      expect(
        () => new Delete('client', 'consumer', undefined as any, 'workspace', 'token')
      ).toThrow('projectId is required and cannot be empty');
      expect(() => new Delete('client', 'consumer', 'project', undefined as any, 'token')).toThrow(
        'workspaceId is required and cannot be empty'
      );
      expect(
        () => new Delete('client', 'consumer', 'project', 'workspace', undefined as any)
      ).toThrow('accessToken is required and cannot be empty');
    });
  });

  describe('execute', () => {
    it('should delete provider successfully with valid ID', async () => {
      mockRestClient.delete.mockResolvedValue(undefined); // DELETE typically returns no content (204)

      const result = await deleteService.execute('test-provider-123');

      expect(result).toBeUndefined();
      expect(mockRestClient.delete).toHaveBeenCalledWith(
        `${IoEventsGlobals.BASE_URL}/events/${validCredentials.consumerId}/${validCredentials.projectId}/${validCredentials.workspaceId}/providers/test-provider-123`,
        {
          Authorization: `Bearer ${validCredentials.accessToken}`,
          'x-api-key': validCredentials.clientId,
          Accept: 'application/hal+json',
          'Content-Type': 'application/json',
        }
      );
    });

    it('should handle provider ID with special characters', async () => {
      const providerId = 'provider-with-hyphens_and_underscores';
      mockRestClient.delete.mockResolvedValue(undefined);

      await deleteService.execute(providerId);

      expect(mockRestClient.delete).toHaveBeenCalledWith(
        `${IoEventsGlobals.BASE_URL}/events/${validCredentials.consumerId}/${validCredentials.projectId}/${validCredentials.workspaceId}/providers/${providerId}`,
        expect.any(Object)
      );
    });

    it('should handle UUID provider ID', async () => {
      const uuidProviderId = 'urn:uuid:12345678-1234-1234-1234-123456789012';
      mockRestClient.delete.mockResolvedValue(undefined);

      await deleteService.execute(uuidProviderId);

      expect(mockRestClient.delete).toHaveBeenCalledWith(
        expect.stringContaining(uuidProviderId),
        expect.any(Object)
      );
    });

    it('should throw error for empty provider ID', async () => {
      await expect(deleteService.execute('')).rejects.toThrow(IOEventsApiError);
      await expect(deleteService.execute('')).rejects.toThrow(
        'providerId is required and cannot be empty'
      );
    });

    it('should throw error for undefined provider ID', async () => {
      await expect(deleteService.execute(undefined as any)).rejects.toThrow(IOEventsApiError);
      await expect(deleteService.execute(undefined as any)).rejects.toThrow(
        'providerId is required and cannot be empty'
      );
    });

    it('should throw error for whitespace-only provider ID', async () => {
      await expect(deleteService.execute('   ')).rejects.toThrow(IOEventsApiError);
      await expect(deleteService.execute('   ')).rejects.toThrow(
        'providerId is required and cannot be empty'
      );
    });

    it('should handle successful deletion with no response body', async () => {
      mockRestClient.delete.mockResolvedValue(null);

      const result = await deleteService.execute('test-provider-123');

      expect(result).toBeUndefined();
      expect(mockRestClient.delete).toHaveBeenCalledTimes(1);
    });

    it('should handle successful deletion with empty response', async () => {
      mockRestClient.delete.mockResolvedValue({} as any);

      const result = await deleteService.execute('test-provider-123');

      expect(result).toBeUndefined();
      expect(mockRestClient.delete).toHaveBeenCalledTimes(1);
    });

    it('should handle 204 No Content response', async () => {
      // Most DELETE endpoints return 204 No Content on successful deletion
      mockRestClient.delete.mockResolvedValue(undefined);

      await expect(deleteService.execute('test-provider-123')).resolves.toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP error with status code', async () => {
      const httpError = new Error('HTTP error! status: 404');
      mockRestClient.delete.mockRejectedValue(httpError);

      await expect(deleteService.execute('test-provider-123')).rejects.toThrow(IOEventsApiError);

      try {
        await deleteService.execute('test-provider-123');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(404);
        expect(ioError.message).toBe(
          'Provider not found: The specified provider ID does not exist'
        );
      }
    });

    it('should handle different HTTP status codes correctly', async () => {
      const statusTests = [
        { status: 401, expectedMessage: 'Unauthorized: Invalid or expired access token' },
        { status: 403, expectedMessage: 'Forbidden: Insufficient permissions to delete provider' },
        {
          status: 404,
          expectedMessage: 'Provider not found: The specified provider ID does not exist',
        },
        { status: 500, expectedMessage: 'Internal server error occurred while deleting provider' },
        { status: 422, expectedMessage: 'HTTP 422: Provider deletion failed' },
      ];

      for (const test of statusTests) {
        const httpError = new Error(`HTTP error! status: ${test.status}`);
        mockRestClient.delete.mockRejectedValue(httpError);

        try {
          await deleteService.execute('test-provider-123');
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
        },
      };
      mockRestClient.delete.mockRejectedValue(responseError);

      await expect(deleteService.execute('test-provider-123')).rejects.toThrow(IOEventsApiError);

      try {
        await deleteService.execute('test-provider-123');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(403);
        expect(ioError.errorCode).toBe('API_ERROR');
      }
    });

    it('should handle network errors', async () => {
      const networkError = { code: 'ENOTFOUND' };
      mockRestClient.delete.mockRejectedValue(networkError);

      await expect(deleteService.execute('test-provider-123')).rejects.toThrow(IOEventsApiError);

      try {
        await deleteService.execute('test-provider-123');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toContain('Network error');
        expect(ioError.errorCode).toBe('NETWORK_ERROR');
      }
    });

    it('should handle connection refused errors', async () => {
      const connectionError = { code: 'ECONNREFUSED' };
      mockRestClient.delete.mockRejectedValue(connectionError);

      await expect(deleteService.execute('test-provider-123')).rejects.toThrow(IOEventsApiError);

      try {
        await deleteService.execute('test-provider-123');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toContain('Network error');
        expect(ioError.errorCode).toBe('NETWORK_ERROR');
      }
    });

    it('should handle timeout errors', async () => {
      const timeoutError = { code: 'ETIMEDOUT' };
      mockRestClient.delete.mockRejectedValue(timeoutError);

      await expect(deleteService.execute('test-provider-123')).rejects.toThrow(IOEventsApiError);

      try {
        await deleteService.execute('test-provider-123');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toContain('Request timeout');
        expect(ioError.errorCode).toBe('TIMEOUT_ERROR');
      }
    });

    it('should handle timeout errors with message', async () => {
      const timeoutErrorWithMessage = new Error('Request timeout occurred');
      mockRestClient.delete.mockRejectedValue(timeoutErrorWithMessage);

      await expect(deleteService.execute('test-provider-123')).rejects.toThrow(IOEventsApiError);

      try {
        await deleteService.execute('test-provider-123');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toContain('Request timeout');
        expect(ioError.errorCode).toBe('TIMEOUT_ERROR');
      }
    });

    it('should handle JSON parsing errors', async () => {
      const jsonError = new Error('Invalid JSON response');
      mockRestClient.delete.mockRejectedValue(jsonError);

      await expect(deleteService.execute('test-provider-123')).rejects.toThrow(IOEventsApiError);

      try {
        await deleteService.execute('test-provider-123');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toContain('Invalid response format');
        expect(ioError.errorCode).toBe('PARSE_ERROR');
      }
    });

    it('should handle validation errors', async () => {
      const validationError = new Error('providerId is required and cannot be empty');
      mockRestClient.delete.mockRejectedValue(validationError);

      await expect(deleteService.execute('test-provider-123')).rejects.toThrow(IOEventsApiError);

      try {
        await deleteService.execute('test-provider-123');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(IoEventsGlobals.STATUS_CODES.BAD_REQUEST);
        expect(ioError.errorCode).toBe('VALIDATION_ERROR');
        expect(ioError.message).toContain('Validation error');
      }
    });

    it('should handle generic Error instances', async () => {
      const genericError = new Error('Something unexpected happened');
      mockRestClient.delete.mockRejectedValue(genericError);

      await expect(deleteService.execute('test-provider-123')).rejects.toThrow(IOEventsApiError);

      try {
        await deleteService.execute('test-provider-123');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toContain('Failed to delete provider');
        expect(ioError.errorCode).toBe('UNKNOWN_ERROR');
      }
    });

    it('should handle unknown error types', async () => {
      const unknownError = { someProperty: 'value' }; // Not an Error instance
      mockRestClient.delete.mockRejectedValue(unknownError);

      await expect(deleteService.execute('test-provider-123')).rejects.toThrow(IOEventsApiError);

      try {
        await deleteService.execute('test-provider-123');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toBe('Unexpected error: Unknown error occurred');
        expect(ioError.errorCode).toBe('UNKNOWN_ERROR');
      }
    });

    it('should extract status codes from different error response formats', async () => {
      // Test extracting from response.status
      const errorWithStatus = { response: { status: 409 } };
      mockRestClient.delete.mockRejectedValue(errorWithStatus);

      try {
        await deleteService.execute('test-provider-123');
        fail('Expected error');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(409);
      }

      // Test extracting from error.status directly
      const errorWithDirectStatus = { response: { status: 502 } };
      mockRestClient.delete.mockRejectedValue(errorWithDirectStatus);

      try {
        await deleteService.execute('test-provider-123');
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
        await deleteService.execute('test-provider-123');
        fail('Expected error');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR);
      }
    });

    it('should extract status code fallback when no response or status properties', async () => {
      const errorWithoutResponseOrStatus = { response: {} }; // response exists but has no status
      mockRestClient.delete.mockRejectedValue(errorWithoutResponseOrStatus);

      try {
        await deleteService.execute('test-provider-123');
        fail('Expected error');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR);
        expect(ioError.errorCode).toBe('API_ERROR');
      }
    });

    it('should correctly extract status codes from HTTP error messages', async () => {
      const testCases = [
        { message: 'HTTP error! status: 401', expectedStatus: 401 },
        { message: 'HTTP error! status: 403', expectedStatus: 403 },
        { message: 'HTTP error! status: 404', expectedStatus: 404 },
        { message: 'HTTP error! status: 500', expectedStatus: 500 },
        { message: 'HTTP error! status:422', expectedStatus: 422 }, // No space
        { message: 'HTTP error! status:   418  ', expectedStatus: 418 }, // Extra spaces
        {
          message: 'Some other error',
          expectedStatus: IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR,
        }, // No match
      ];

      for (const testCase of testCases) {
        const httpError = new Error(testCase.message);
        mockRestClient.delete.mockRejectedValue(httpError);

        try {
          await deleteService.execute('test-provider-123');
          fail(`Expected error for message: ${testCase.message}`);
        } catch (error) {
          expect(error instanceof IOEventsApiError).toBe(true);
          const ioError = error as IOEventsApiError;
          expect(ioError.statusCode).toBe(testCase.expectedStatus);
        }
      }
    });

    it('should handle extractStatusCodeFromMessage regex no match fallback', async () => {
      const errorWithNoMatchingPattern = new Error(
        'Random delete error without HTTP status pattern'
      );
      mockRestClient.delete.mockRejectedValue(errorWithNoMatchingPattern);

      try {
        await deleteService.execute('test-provider-123');
        fail('Expected error');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR);
        expect(ioError.message).toContain('Random delete error without HTTP status pattern');
      }
    });

    it('should handle extractStatusCodeFromMessage with successful regex match', async () => {
      const errorWithStatusInMessage = new Error('HTTP error! status: 451');
      mockRestClient.delete.mockRejectedValue(errorWithStatusInMessage);

      try {
        await deleteService.execute('test-provider-123');
        fail('Expected error');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(451); // Successfully parsed from regex
        expect(ioError.message).toContain('HTTP 451: Provider deletion failed');
      }
    });

    it('should handle extractStatusCodeFromMessage with regex match failure but contains HTTP error status', async () => {
      const errorWithInvalidStatus = new Error('HTTP error! status: ');
      mockRestClient.delete.mockRejectedValue(errorWithInvalidStatus);

      try {
        await deleteService.execute('test-provider-123');
        fail('Expected error');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(500); // Fallback when regex doesn't match number
      }
    });
  });
});
