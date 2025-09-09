/**
 * <license header>
 */

import Create from '../../../../src/io-events/registration/create';
import { IOEventsApiError, IoEventsGlobals } from '../../../../src/io-events/types';
import type { Registration } from '../../../../src/io-events/registration/types';
import type { RegistrationCreateModel } from '../../../../src/io-events/registration/create/types';
import RestClient from '../../../../src/integration/rest-client';

// Mock RestClient
jest.mock('../../../../src/integration/rest-client');
const MockedRestClient = RestClient as jest.MockedClass<typeof RestClient>;

describe('Create Registration', () => {
  let createService: Create;
  let mockRestClient: jest.Mocked<RestClient>;

  const validCredentials = {
    clientId: 'test-client-id',
    consumerId: 'test-consumer-id',
    projectId: 'test-project-id',
    workspaceId: 'test-workspace-id',
    accessToken: 'test-access-token',
  };

  const validRegistrationData: RegistrationCreateModel = {
    client_id: 'my-client-id',
    name: 'Test Registration',
    description: 'A test registration for unit tests',
    webhook_url: 'https://example.com/webhook',
    events_of_interest: [
      {
        provider_id: 'test-provider',
        event_code: 'com.example.test.event',
      },
    ],
    delivery_type: 'webhook',
    runtime_action: 'my-runtime-action',
    enabled: true,
  };

  const mockRegistrationResponse: Registration = {
    registration_id: 'test-registration-123',
    name: 'Test Registration',
    description: 'A test registration for unit tests',
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
          new Create(
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
    it('should create registration successfully with valid data', async () => {
      mockRestClient.post.mockResolvedValue(mockRegistrationResponse);

      const result = await createService.execute(validRegistrationData);

      expect(result).toEqual(mockRegistrationResponse);
      expect(mockRestClient.post).toHaveBeenCalledWith(
        `${IoEventsGlobals.BASE_URL}/events/${validCredentials.consumerId}/${validCredentials.projectId}/${validCredentials.workspaceId}/registrations`,
        {
          Authorization: `Bearer ${validCredentials.accessToken}`,
          'x-api-key': validCredentials.clientId,
          'Content-Type': 'application/json',
          Accept: 'application/hal+json',
        },
        validRegistrationData
      );
    });

    it('should create registration with minimal required data', async () => {
      const minimalData: RegistrationCreateModel = {
        client_id: 'minimal-client',
        name: 'Minimal Registration',
        events_of_interest: [
          {
            provider_id: 'minimal-provider',
            event_code: 'minimal.event',
          },
        ],
        delivery_type: 'journal',
      };

      const minimalResponse: Registration = {
        registration_id: 'minimal-reg-123',
        name: 'Minimal Registration',
        delivery_type: 'journal',
        enabled: true,
        created_date: '2023-01-01T00:00:00.000Z',
        updated_date: '2023-01-01T00:00:00.000Z',
      };

      mockRestClient.post.mockResolvedValue(minimalResponse);

      const result = await createService.execute(minimalData);

      expect(result).toEqual(minimalResponse);
      expect(mockRestClient.post).toHaveBeenCalledWith(
        expect.stringContaining('/registrations'),
        expect.objectContaining({
          'Content-Type': 'application/json',
          Accept: 'application/hal+json',
        }),
        minimalData
      );
    });

    it('should handle complex events of interest', async () => {
      const complexData: RegistrationCreateModel = {
        client_id: 'complex-client',
        name: 'Complex Registration',
        events_of_interest: [
          {
            provider_id: 'commerce-provider',
            event_code: 'com.adobe.commerce.customer.created',
          },
          {
            provider_id: 'commerce-provider',
            event_code: 'com.adobe.commerce.customer.updated',
          },
          {
            provider_id: 'analytics-provider',
            event_code: 'com.analytics.session.started',
          },
        ],
        delivery_type: 'webhook_batch',
      };

      mockRestClient.post.mockResolvedValue(mockRegistrationResponse);

      await createService.execute(complexData);

      expect(mockRestClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        complexData
      );
    });
  });

  describe('Input Validation', () => {
    it('should throw error for undefined registration data', async () => {
      await expect(createService.execute(undefined as any)).rejects.toThrow(IOEventsApiError);
      await expect(createService.execute(undefined as any)).rejects.toThrow(
        'Registration data is required'
      );
    });

    it('should throw error for missing client_id', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { client_id, ...invalidData } = validRegistrationData;

      await expect(createService.execute(invalidData as any)).rejects.toThrow(IOEventsApiError);
      await expect(createService.execute(invalidData as any)).rejects.toThrow(
        'Client ID is required'
      );
    });

    it('should throw error for empty client_id', async () => {
      const invalidData = { ...validRegistrationData, client_id: '' };

      await expect(createService.execute(invalidData)).rejects.toThrow(IOEventsApiError);
      await expect(createService.execute(invalidData)).rejects.toThrow('Client ID is required');
    });

    it('should throw error for client_id too short', async () => {
      const invalidData = { ...validRegistrationData, client_id: 'ab' };

      await expect(createService.execute(invalidData)).rejects.toThrow(IOEventsApiError);
      await expect(createService.execute(invalidData)).rejects.toThrow(
        'Client ID must be between 3 and 255 characters'
      );
    });

    it('should throw error for client_id too long', async () => {
      const invalidData = { ...validRegistrationData, client_id: 'a'.repeat(256) };

      await expect(createService.execute(invalidData)).rejects.toThrow(IOEventsApiError);
      await expect(createService.execute(invalidData)).rejects.toThrow(
        'Client ID must be between 3 and 255 characters'
      );
    });

    it('should throw error for missing name', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { name, ...invalidData } = validRegistrationData;

      await expect(createService.execute(invalidData as any)).rejects.toThrow(IOEventsApiError);
      await expect(createService.execute(invalidData as any)).rejects.toThrow(
        'Registration name is required'
      );
    });

    it('should throw error for empty name', async () => {
      const invalidData = { ...validRegistrationData, name: '' };

      await expect(createService.execute(invalidData)).rejects.toThrow(IOEventsApiError);
      await expect(createService.execute(invalidData)).rejects.toThrow(
        'Registration name is required'
      );
    });

    it('should throw error for name too short', async () => {
      const invalidData = { ...validRegistrationData, name: 'ab' };

      await expect(createService.execute(invalidData)).rejects.toThrow(IOEventsApiError);
      await expect(createService.execute(invalidData)).rejects.toThrow(
        'Registration name must be between 3 and 255 characters'
      );
    });

    it('should throw error for name too long', async () => {
      const invalidData = { ...validRegistrationData, name: 'a'.repeat(256) };

      await expect(createService.execute(invalidData)).rejects.toThrow(IOEventsApiError);
      await expect(createService.execute(invalidData)).rejects.toThrow(
        'Registration name must be between 3 and 255 characters'
      );
    });

    it('should throw error for description too long', async () => {
      const invalidData = { ...validRegistrationData, description: 'a'.repeat(5001) };

      await expect(createService.execute(invalidData)).rejects.toThrow(IOEventsApiError);
      await expect(createService.execute(invalidData)).rejects.toThrow(
        'Description must not exceed 5000 characters'
      );
    });

    it('should throw error for webhook_url too long', async () => {
      const invalidData = { ...validRegistrationData, webhook_url: 'https://' + 'a'.repeat(4000) };

      await expect(createService.execute(invalidData)).rejects.toThrow(IOEventsApiError);
      await expect(createService.execute(invalidData)).rejects.toThrow(
        'Webhook URL must not exceed 4000 characters'
      );
    });

    it('should throw error for missing events_of_interest', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { events_of_interest, ...invalidData } = validRegistrationData;

      await expect(createService.execute(invalidData as any)).rejects.toThrow(IOEventsApiError);
      await expect(createService.execute(invalidData as any)).rejects.toThrow(
        'Events of interest is required and must be an array'
      );
    });

    it('should throw error for non-array events_of_interest', async () => {
      const invalidData = { ...validRegistrationData, events_of_interest: 'not-an-array' as any };

      await expect(createService.execute(invalidData)).rejects.toThrow(IOEventsApiError);
      await expect(createService.execute(invalidData)).rejects.toThrow(
        'Events of interest is required and must be an array'
      );
    });

    it('should throw error for empty events_of_interest array', async () => {
      const invalidData = { ...validRegistrationData, events_of_interest: [] };

      await expect(createService.execute(invalidData)).rejects.toThrow(IOEventsApiError);
      await expect(createService.execute(invalidData)).rejects.toThrow(
        'At least one event of interest is required'
      );
    });

    it('should throw error for event with missing provider_id', async () => {
      const invalidData = {
        ...validRegistrationData,
        events_of_interest: [
          {
            event_code: 'test.event',
          } as any,
        ],
      };

      await expect(createService.execute(invalidData)).rejects.toThrow(IOEventsApiError);
      await expect(createService.execute(invalidData)).rejects.toThrow(
        'Provider ID is required for event at index 0'
      );
    });

    it('should throw error for event with empty provider_id', async () => {
      const invalidData = {
        ...validRegistrationData,
        events_of_interest: [
          {
            provider_id: '',
            event_code: 'test.event',
          },
        ],
      };

      await expect(createService.execute(invalidData)).rejects.toThrow(IOEventsApiError);
      await expect(createService.execute(invalidData)).rejects.toThrow(
        'Provider ID is required for event at index 0'
      );
    });

    it('should throw error for event with missing event_code', async () => {
      const invalidData = {
        ...validRegistrationData,
        events_of_interest: [
          {
            provider_id: 'test-provider',
          } as any,
        ],
      };

      await expect(createService.execute(invalidData)).rejects.toThrow(IOEventsApiError);
      await expect(createService.execute(invalidData)).rejects.toThrow(
        'Event code is required for event at index 0'
      );
    });

    it('should throw error for event with empty event_code', async () => {
      const invalidData = {
        ...validRegistrationData,
        events_of_interest: [
          {
            provider_id: 'test-provider',
            event_code: '',
          },
        ],
      };

      await expect(createService.execute(invalidData)).rejects.toThrow(IOEventsApiError);
      await expect(createService.execute(invalidData)).rejects.toThrow(
        'Event code is required for event at index 0'
      );
    });

    it('should throw error for missing delivery_type', async () => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { delivery_type, ...invalidData } = validRegistrationData;

      await expect(createService.execute(invalidData as any)).rejects.toThrow(IOEventsApiError);
      await expect(createService.execute(invalidData as any)).rejects.toThrow(
        'Delivery type is required'
      );
    });

    it('should throw error for invalid delivery_type', async () => {
      const invalidData = { ...validRegistrationData, delivery_type: 'invalid-type' as any };

      await expect(createService.execute(invalidData)).rejects.toThrow(IOEventsApiError);
      await expect(createService.execute(invalidData)).rejects.toThrow(
        'Delivery type must be one of: webhook, webhook_batch, journal, aws_eventbridge'
      );
    });

    it('should throw error for runtime_action too long', async () => {
      const invalidData = { ...validRegistrationData, runtime_action: 'a'.repeat(256) };

      await expect(createService.execute(invalidData)).rejects.toThrow(IOEventsApiError);
      await expect(createService.execute(invalidData)).rejects.toThrow(
        'Runtime action must not exceed 255 characters'
      );
    });

    it('should validate multiple events correctly', async () => {
      const invalidData = {
        ...validRegistrationData,
        events_of_interest: [
          {
            provider_id: 'valid-provider',
            event_code: 'valid.event',
          },
          {
            provider_id: '',
            event_code: 'invalid.event',
          },
        ],
      };

      await expect(createService.execute(invalidData)).rejects.toThrow(IOEventsApiError);
      await expect(createService.execute(invalidData)).rejects.toThrow(
        'Provider ID is required for event at index 1'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP error with status code', async () => {
      const httpError = new Error('HTTP error! status: 400');
      mockRestClient.post.mockRejectedValue(httpError);

      await expect(createService.execute(validRegistrationData)).rejects.toThrow(IOEventsApiError);

      try {
        await createService.execute(validRegistrationData);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(400);
        expect(ioError.message).toBe('Bad request: Invalid registration data provided');
      }
    });

    it('should handle different HTTP status codes correctly', async () => {
      const statusTests = [
        { status: 401, expectedMessage: 'Unauthorized: Invalid or missing authentication' },
        { status: 403, expectedMessage: 'Forbidden: Insufficient permissions' },
        { status: 409, expectedMessage: 'Conflict: Registration with this name already exists' },
        { status: 422, expectedMessage: 'Unprocessable entity: Invalid registration data' },
        { status: 500, expectedMessage: 'Internal server error' },
      ];

      for (const test of statusTests) {
        const httpError = new Error(`HTTP error! status: ${test.status}`);
        mockRestClient.post.mockRejectedValue(httpError);

        try {
          await createService.execute(validRegistrationData);
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
          status: 409,
        },
      };
      mockRestClient.post.mockRejectedValue(errorWithResponse);

      await expect(createService.execute(validRegistrationData)).rejects.toThrow(IOEventsApiError);

      try {
        await createService.execute(validRegistrationData);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(409);
        expect(ioError.message).toBe('Conflict: Registration with this name already exists');
      }
    });

    it('should handle error with status property', async () => {
      const errorWithStatus = {
        status: 422,
      };
      mockRestClient.post.mockRejectedValue(errorWithStatus);

      try {
        await createService.execute(validRegistrationData);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(422);
        expect(ioError.message).toBe('Unprocessable entity: Invalid registration data');
      }
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      mockRestClient.post.mockRejectedValue(networkError);

      await expect(createService.execute(validRegistrationData)).rejects.toThrow(IOEventsApiError);

      try {
        await createService.execute(validRegistrationData);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toBe('Network error occurred');
        expect(ioError.statusCode).toBe(500);
      }
    });

    it('should handle extractStatusCodeFromMessage with successful regex match', async () => {
      const errorWithStatusInMessage = new Error('HTTP error! status: 422');
      mockRestClient.post.mockRejectedValue(errorWithStatusInMessage);

      try {
        await createService.execute(validRegistrationData);
        fail('Expected error');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(422);
        expect(ioError.message).toBe('Unprocessable entity: Invalid registration data');
      }
    });

    it('should handle extractStatusCodeFromMessage with regex match failure', async () => {
      const errorWithInvalidStatus = new Error('HTTP error! status: invalid');
      mockRestClient.post.mockRejectedValue(errorWithInvalidStatus);

      try {
        await createService.execute(validRegistrationData);
        fail('Expected error');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(500); // Default fallback
      }
    });

    it('should re-throw validation errors as-is', async () => {
      const validationError = new IOEventsApiError('Custom validation error', 400);

      // Mock the validateRegistrationInput to throw
      createService['validateRegistrationInput'] = jest.fn().mockImplementation(() => {
        throw validationError;
      });

      await expect(createService.execute(validRegistrationData)).rejects.toThrow(validationError);
      await expect(createService.execute(validRegistrationData)).rejects.toThrow(
        'Custom validation error'
      );
    });

    it('should handle unknown error types', async () => {
      const unknownError = { unknown: 'error type' };
      mockRestClient.post.mockRejectedValue(unknownError);

      try {
        await createService.execute(validRegistrationData);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toBe('Network error occurred');
        expect(ioError.statusCode).toBe(500);
      }
    });

    it('should handle default error message for unknown status code', async () => {
      const httpError = new Error('HTTP error! status: 418');
      mockRestClient.post.mockRejectedValue(httpError);

      try {
        await createService.execute(validRegistrationData);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(418);
        expect(ioError.message).toBe('API error: HTTP 418');
      }
    });
  });
});
