/**
 * Copyright © Adobe, Inc. All rights reserved.
 */

import Get from '../../../../src/io-events/registration/get';
import { IOEventsApiError, IoEventsGlobals } from '../../../../src/io-events/types';
import type { Registration } from '../../../../src/io-events/registration/types';
import RestClient from '../../../../src/integration/rest-client';

// Mock RestClient
jest.mock('../../../../src/integration/rest-client');
const MockedRestClient = RestClient as jest.MockedClass<typeof RestClient>;

describe('Get Registration', () => {
  let getService: Get;
  let mockRestClient: jest.Mocked<RestClient>;

  const validCredentials = {
    clientId: 'test-client-id',
    consumerId: 'test-consumer-id',
    projectId: 'test-project-id',
    workspaceId: 'test-workspace-id',
    accessToken: 'test-access-token',
  };

  const validRegistrationId = 'test-registration-123';

  const mockRegistrationResponse: Registration = {
    registration_id: 'test-registration-123',
    name: 'Test Registration',
    description: 'A test registration',
    webhook_url: 'https://example.com/webhook',
    events_of_interest: [
      {
        provider_id: 'test-provider',
        event_code: 'com.example.test.event',
      },
    ],
    delivery_type: 'webhook',
    enabled: true,
    created_date: '2023-01-01T00:00:00.000Z',
    updated_date: '2023-01-01T00:00:00.000Z',
    runtime_action: 'my-runtime-action',
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
    it('should get registration successfully with valid ID', async () => {
      mockRestClient.get.mockResolvedValue(mockRegistrationResponse);

      const result = await getService.execute(validRegistrationId);

      expect(result).toEqual(mockRegistrationResponse);
      expect(mockRestClient.get).toHaveBeenCalledWith(
        `${IoEventsGlobals.BASE_URL}/events/${validCredentials.consumerId}/${validCredentials.projectId}/${validCredentials.workspaceId}/registrations/${validRegistrationId}`,
        {
          Authorization: `Bearer ${validCredentials.accessToken}`,
          'x-api-key': validCredentials.consumerId,
          Accept: 'application/hal+json',
        }
      );
    });

    it('should handle registration ID with special characters', async () => {
      const specialId = 'reg-123_ABC@domain.com';
      mockRestClient.get.mockResolvedValue(mockRegistrationResponse);

      await getService.execute(specialId);

      expect(mockRestClient.get).toHaveBeenCalledWith(
        expect.stringContaining(specialId),
        expect.any(Object)
      );
    });

    it('should handle UUID registration ID', async () => {
      const uuidId = '550e8400-e29b-41d4-a716-446655440000';
      mockRestClient.get.mockResolvedValue(mockRegistrationResponse);

      await getService.execute(uuidId);

      expect(mockRestClient.get).toHaveBeenCalledWith(
        expect.stringContaining(uuidId),
        expect.any(Object)
      );
    });

    it('should throw error for empty registration ID', async () => {
      await expect(getService.execute('')).rejects.toThrow(IOEventsApiError);
      await expect(getService.execute('')).rejects.toThrow('Registration ID is required');
    });

    it('should throw error for undefined registration ID', async () => {
      await expect(getService.execute(undefined as any)).rejects.toThrow(IOEventsApiError);
      await expect(getService.execute(undefined as any)).rejects.toThrow(
        'Registration ID is required'
      );
    });

    it('should throw error for whitespace-only registration ID', async () => {
      await expect(getService.execute('   ')).rejects.toThrow(IOEventsApiError);
      await expect(getService.execute('   ')).rejects.toThrow('Registration ID is required');
    });

    it('should return registration with all fields', async () => {
      const completeRegistration: Registration = {
        registration_id: 'complete-reg-123',
        name: 'Complete Registration',
        description: 'A complete registration with all fields',
        webhook_url: 'https://complete.example.com/webhook',
        events_of_interest: [
          {
            provider_id: 'provider1',
            event_code: 'event.one',
          },
          {
            provider_id: 'provider2',
            event_code: 'event.two',
          },
        ],
        delivery_type: 'webhook_batch',
        enabled: false,
        created_date: '2023-01-15T10:30:00.000Z',
        updated_date: '2023-01-20T14:45:00.000Z',
        runtime_action: 'complete-runtime-action',
        customField: 'custom-value',
      };

      mockRestClient.get.mockResolvedValue(completeRegistration);

      const result = await getService.execute('complete-reg-123');

      expect(result).toEqual(completeRegistration);
      expect(result.events_of_interest).toHaveLength(2);
      expect(result.customField).toBe('custom-value');
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP error with status code', async () => {
      const httpError = new Error('HTTP error! status: 404');
      mockRestClient.get.mockRejectedValue(httpError);

      await expect(getService.execute(validRegistrationId)).rejects.toThrow(IOEventsApiError);

      try {
        await getService.execute(validRegistrationId);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(404);
        expect(ioError.message).toBe('Registration not found');
      }
    });

    it('should handle different HTTP status codes correctly', async () => {
      const statusTests = [
        { status: 400, expectedMessage: 'Bad request: Invalid parameters provided' },
        { status: 401, expectedMessage: 'Unauthorized: Invalid or missing authentication' },
        { status: 403, expectedMessage: 'Forbidden: Insufficient permissions' },
        { status: 404, expectedMessage: 'Registration not found' },
        { status: 500, expectedMessage: 'Internal server error' },
      ];

      for (const test of statusTests) {
        const httpError = new Error(`HTTP error! status: ${test.status}`);
        mockRestClient.get.mockRejectedValue(httpError);

        try {
          await getService.execute(validRegistrationId);
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
      mockRestClient.get.mockRejectedValue(errorWithResponse);

      try {
        await getService.execute(validRegistrationId);
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
      mockRestClient.get.mockRejectedValue(errorWithStatus);

      try {
        await getService.execute(validRegistrationId);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(404);
        expect(ioError.message).toBe('Registration not found');
      }
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      mockRestClient.get.mockRejectedValue(networkError);

      try {
        await getService.execute(validRegistrationId);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toBe('Network error occurred');
        expect(ioError.statusCode).toBe(500);
      }
    });

    it('should handle extractStatusCodeFromMessage with successful regex match', async () => {
      const errorWithStatusInMessage = new Error('HTTP error! status: 403');
      mockRestClient.get.mockRejectedValue(errorWithStatusInMessage);

      try {
        await getService.execute(validRegistrationId);
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
      mockRestClient.get.mockRejectedValue(errorWithInvalidStatus);

      try {
        await getService.execute(validRegistrationId);
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
      getService['validateInputs'] = jest.fn().mockImplementation(() => {
        throw validationError;
      });

      await expect(getService.execute(validRegistrationId)).rejects.toThrow(validationError);
      await expect(getService.execute(validRegistrationId)).rejects.toThrow(
        'Custom validation error'
      );
    });

    it('should handle unknown error types', async () => {
      const unknownError = { unknown: 'error type' };
      mockRestClient.get.mockRejectedValue(unknownError);

      try {
        await getService.execute(validRegistrationId);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toBe('Network error occurred');
        expect(ioError.statusCode).toBe(500);
      }
    });

    it('should handle default error message for unknown status code', async () => {
      const httpError = new Error('HTTP error! status: 418');
      mockRestClient.get.mockRejectedValue(httpError);

      try {
        await getService.execute(validRegistrationId);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(418);
        expect(ioError.message).toBe('API error: HTTP 418');
      }
    });
  });
});
