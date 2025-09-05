/**
 * Copyright © Adobe, Inc. All rights reserved.
 */

import Delete from '../../../../src/io-events/registration/delete';
import { IOEventsApiError, IoEventsGlobals } from '../../../../src/io-events/types';
import RestClient from '../../../../src/integration/rest-client';

// Mock RestClient
jest.mock('../../../../src/integration/rest-client');
const MockedRestClient = RestClient as jest.MockedClass<typeof RestClient>;

describe('Delete Registration', () => {
  let deleteService: Delete;
  let mockRestClient: jest.Mocked<RestClient>;

  const validCredentials = {
    clientId: 'test-client-id',
    consumerId: 'test-consumer-id',
    projectId: 'test-project-id',
    workspaceId: 'test-workspace-id',
    accessToken: 'test-access-token',
  };

  const validRegistrationId = 'test-registration-123';

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
    it('should delete registration successfully with valid ID', async () => {
      mockRestClient.delete.mockResolvedValue(undefined);

      await deleteService.execute(validRegistrationId);

      expect(mockRestClient.delete).toHaveBeenCalledWith(
        `${IoEventsGlobals.BASE_URL}/events/${validCredentials.consumerId}/${validCredentials.projectId}/${validCredentials.workspaceId}/registrations/${validRegistrationId}`,
        {
          Authorization: `Bearer ${validCredentials.accessToken}`,
          'x-api-key': validCredentials.consumerId,
          Accept: 'text/plain',
        }
      );
    });

    it('should handle registration ID with special characters', async () => {
      const specialId = 'reg-123_ABC@domain.com';
      mockRestClient.delete.mockResolvedValue(undefined);

      await deleteService.execute(specialId);

      expect(mockRestClient.delete).toHaveBeenCalledWith(
        expect.stringContaining(specialId),
        expect.any(Object)
      );
    });

    it('should handle UUID registration ID', async () => {
      const uuidId = '550e8400-e29b-41d4-a716-446655440000';
      mockRestClient.delete.mockResolvedValue(undefined);

      await deleteService.execute(uuidId);

      expect(mockRestClient.delete).toHaveBeenCalledWith(
        expect.stringContaining(uuidId),
        expect.any(Object)
      );
    });

    it('should throw error for empty registration ID', async () => {
      await expect(deleteService.execute('')).rejects.toThrow(IOEventsApiError);
      await expect(deleteService.execute('')).rejects.toThrow('Registration ID is required');
    });

    it('should throw error for undefined registration ID', async () => {
      await expect(deleteService.execute(undefined as any)).rejects.toThrow(IOEventsApiError);
      await expect(deleteService.execute(undefined as any)).rejects.toThrow(
        'Registration ID is required'
      );
    });

    it('should throw error for whitespace-only registration ID', async () => {
      await expect(deleteService.execute('   ')).rejects.toThrow(IOEventsApiError);
      await expect(deleteService.execute('   ')).rejects.toThrow('Registration ID is required');
    });

    it('should handle successful deletion with no response body', async () => {
      mockRestClient.delete.mockResolvedValue(undefined);

      await expect(deleteService.execute(validRegistrationId)).resolves.toBeUndefined();
    });

    it('should handle successful deletion with empty response', async () => {
      mockRestClient.delete.mockResolvedValue('');

      await expect(deleteService.execute(validRegistrationId)).resolves.toBeUndefined();
    });

    it('should handle 204 No Content response', async () => {
      mockRestClient.delete.mockResolvedValue(null);

      await expect(deleteService.execute(validRegistrationId)).resolves.toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP error with status code', async () => {
      const httpError = new Error('HTTP error! status: 404');
      mockRestClient.delete.mockRejectedValue(httpError);

      await expect(deleteService.execute(validRegistrationId)).rejects.toThrow(IOEventsApiError);

      try {
        await deleteService.execute(validRegistrationId);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(404);
        expect(ioError.message).toBe('Registration not found');
      }
    });

    it('should handle different HTTP status codes correctly', async () => {
      const statusTests = [
        { status: 400, expectedMessage: 'Bad request: Invalid registration ID provided' },
        { status: 401, expectedMessage: 'Unauthorized: Invalid or missing authentication' },
        { status: 403, expectedMessage: 'Forbidden: Insufficient permissions' },
        { status: 404, expectedMessage: 'Registration not found' },
        { status: 500, expectedMessage: 'Internal server error' },
      ];

      for (const test of statusTests) {
        const httpError = new Error(`HTTP error! status: ${test.status}`);
        mockRestClient.delete.mockRejectedValue(httpError);

        try {
          await deleteService.execute(validRegistrationId);
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
      const errorWithResponse = {
        response: {
          status: 403,
        },
      };
      mockRestClient.delete.mockRejectedValue(errorWithResponse);

      try {
        await deleteService.execute(validRegistrationId);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(403);
        expect(ioError.message).toBe('Forbidden: Insufficient permissions');
      }
    });

    it('should handle error with status property', async () => {
      const errorWithStatus = {
        status: 404,
      };
      mockRestClient.delete.mockRejectedValue(errorWithStatus);

      try {
        await deleteService.execute(validRegistrationId);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(404);
        expect(ioError.message).toBe('Registration not found');
      }
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      mockRestClient.delete.mockRejectedValue(networkError);

      try {
        await deleteService.execute(validRegistrationId);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toBe('Network error occurred');
        expect(ioError.statusCode).toBe(500);
      }
    });

    it('should handle extractStatusCodeFromMessage with successful regex match', async () => {
      const errorWithStatusInMessage = new Error('HTTP error! status: 403');
      mockRestClient.delete.mockRejectedValue(errorWithStatusInMessage);

      try {
        await deleteService.execute(validRegistrationId);
        fail('Expected error');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(403);
        expect(ioError.message).toBe('Forbidden: Insufficient permissions');
      }
    });

    it('should handle extractStatusCodeFromMessage with regex match failure', async () => {
      const errorWithInvalidStatus = new Error('HTTP error! status: invalid');
      mockRestClient.delete.mockRejectedValue(errorWithInvalidStatus);

      try {
        await deleteService.execute(validRegistrationId);
        fail('Expected error');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(500); // Default fallback
      }
    });

    it('should re-throw validation errors as-is', async () => {
      const validationError = new IOEventsApiError('Custom validation error', 400);

      // Mock the validateInputs to throw
      deleteService['validateInputs'] = jest.fn().mockImplementation(() => {
        throw validationError;
      });

      await expect(deleteService.execute(validRegistrationId)).rejects.toThrow(validationError);
      await expect(deleteService.execute(validRegistrationId)).rejects.toThrow(
        'Custom validation error'
      );
    });

    it('should handle unknown error types', async () => {
      const unknownError = { unknown: 'error type' };
      mockRestClient.delete.mockRejectedValue(unknownError);

      try {
        await deleteService.execute(validRegistrationId);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toBe('Network error occurred');
        expect(ioError.statusCode).toBe(500);
      }
    });

    it('should handle extractStatusCodeFromMessage with no match fallback', async () => {
      const errorWithoutStatusCode = new Error('Some other error message');
      mockRestClient.delete.mockRejectedValue(errorWithoutStatusCode);

      try {
        await deleteService.execute(validRegistrationId);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(500);
        expect(ioError.message).toBe('Network error occurred');
      }
    });

    it('should handle default error message for unknown status code', async () => {
      const httpError = new Error('HTTP error! status: 418');
      mockRestClient.delete.mockRejectedValue(httpError);

      try {
        await deleteService.execute(validRegistrationId);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(418);
        expect(ioError.message).toBe('API error: HTTP 418');
      }
    });
  });
});
