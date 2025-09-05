/**
 * Copyright © Adobe, Inc. All rights reserved.
 */

import Create from '../../../../src/io-events/event-metadata/create';
import { IOEventsApiError, IoEventsGlobals } from '../../../../src/io-events/types';
import type { EventMetadataInputModel } from '../../../../src/io-events/event-metadata/create/types';
import type { EventMetadata } from '../../../../src/io-events/event-metadata/types';
import RestClient from '../../../../src/integration/rest-client';

// Mock RestClient
jest.mock('../../../../src/integration/rest-client');
const MockedRestClient = RestClient as jest.MockedClass<typeof RestClient>;

describe('Create Event Metadata', () => {
  let createService: Create;
  let mockRestClient: jest.Mocked<RestClient>;

  const validCredentials = {
    clientId: 'test-client-id',
    consumerId: 'test-consumer-id',
    projectId: 'test-project-id',
    workspaceId: 'test-workspace-id',
    accessToken: 'test-access-token',
  };

  const validProviderId = 'test-provider-123';

  const validEventMetadataData: EventMetadataInputModel = {
    event_code: 'com.example.user.created',
    label: 'User Created',
    description: 'Triggered when a new user is created',
    sample_event_template: {
      user_id: '12345',
      name: 'John Doe',
      email: 'john@example.com',
    },
  };

  const mockEventMetadataResponse: EventMetadata = {
    event_code: 'com.example.user.created',
    label: 'User Created',
    description: 'Triggered when a new user is created',
    sample_event_template: '{"user_id":"12345","name":"John Doe","email":"john@example.com"}',
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
    it('should create event metadata successfully with valid data', async () => {
      mockRestClient.post.mockResolvedValue(mockEventMetadataResponse);

      const result = await createService.execute(validProviderId, validEventMetadataData);

      expect(result).toEqual(mockEventMetadataResponse);
      expect(mockRestClient.post).toHaveBeenCalledWith(
        `${IoEventsGlobals.BASE_URL}/events/${validCredentials.consumerId}/${validCredentials.projectId}/${validCredentials.workspaceId}/providers/${validProviderId}/eventmetadata`,
        {
          Authorization: `Bearer ${validCredentials.accessToken}`,
          'x-api-key': validCredentials.clientId,
          Accept: 'application/hal+json',
          'Content-Type': 'application/json',
        },
        {
          event_code: 'com.example.user.created',
          label: 'User Created',
          description: 'Triggered when a new user is created',
          sample_event_template: btoa(
            JSON.stringify({
              user_id: '12345',
              name: 'John Doe',
              email: 'john@example.com',
            })
          ),
        }
      );
    });

    it('should create event metadata with minimal required data', async () => {
      const minimalData: EventMetadataInputModel = {
        event_code: 'com.example.minimal',
        label: 'Minimal Event',
        description: 'A minimal event',
      };
      mockRestClient.post.mockResolvedValue({
        event_code: 'com.example.minimal',
        label: 'Minimal Event',
        description: 'A minimal event',
      });

      const result = await createService.execute(validProviderId, minimalData);

      expect(result.event_code).toBe('com.example.minimal');
      expect(mockRestClient.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        minimalData
      );
    });

    it('should handle complex sample event template', async () => {
      const complexData: EventMetadataInputModel = {
        event_code: 'com.example.complex',
        label: 'Complex Event',
        description: 'A complex event with nested data',
        sample_event_template: {
          metadata: {
            version: '1.0',
            source: 'test-system',
          },
          data: {
            user: { id: 123, name: 'Test User' },
            actions: ['create', 'update'],
          },
        },
      };

      mockRestClient.post.mockResolvedValue({
        event_code: 'com.example.complex',
        label: 'Complex Event',
        description: 'A complex event with nested data',
        sample_event_template: btoa(JSON.stringify(complexData.sample_event_template)),
      });

      const result = await createService.execute(validProviderId, complexData);

      expect(result.event_code).toBe('com.example.complex');
      expect(mockRestClient.post).toHaveBeenCalledWith(expect.any(String), expect.any(Object), {
        ...complexData,
        sample_event_template: btoa(JSON.stringify(complexData.sample_event_template)),
      });
    });

    it('should throw error for undefined providerId', async () => {
      await expect(createService.execute(undefined as any, validEventMetadataData)).rejects.toThrow(
        IOEventsApiError
      );
      await expect(createService.execute(undefined as any, validEventMetadataData)).rejects.toThrow(
        'providerId is required and cannot be empty'
      );
    });

    it('should throw error for empty providerId', async () => {
      await expect(createService.execute('', validEventMetadataData)).rejects.toThrow(
        IOEventsApiError
      );
      await expect(createService.execute('', validEventMetadataData)).rejects.toThrow(
        'providerId is required and cannot be empty'
      );
    });

    it('should throw error for undefined event metadata data', async () => {
      await expect(createService.execute(validProviderId, undefined as any)).rejects.toThrow(
        IOEventsApiError
      );
      await expect(createService.execute(validProviderId, undefined as any)).rejects.toThrow(
        'eventMetadataData is required'
      );
    });

    it('should throw error for missing event_code', async () => {
      const invalidData = { label: 'Test', description: 'Test description' } as any;

      await expect(createService.execute(validProviderId, invalidData)).rejects.toThrow(
        IOEventsApiError
      );
      await expect(createService.execute(validProviderId, invalidData)).rejects.toThrow(
        'event_code is required and cannot be empty'
      );
    });

    it('should throw error for missing label', async () => {
      const invalidData = { event_code: 'test', description: 'Test description' } as any;

      await expect(createService.execute(validProviderId, invalidData)).rejects.toThrow(
        IOEventsApiError
      );
      await expect(createService.execute(validProviderId, invalidData)).rejects.toThrow(
        'label is required and cannot be empty'
      );
    });

    it('should throw error for missing description', async () => {
      const invalidData = { event_code: 'test', label: 'Test Label' } as any;

      await expect(createService.execute(validProviderId, invalidData)).rejects.toThrow(
        IOEventsApiError
      );
      await expect(createService.execute(validProviderId, invalidData)).rejects.toThrow(
        'description is required and cannot be empty'
      );
    });

    it('should validate response format - null response', async () => {
      mockRestClient.post.mockResolvedValue(null);

      await expect(createService.execute(validProviderId, validEventMetadataData)).rejects.toThrow(
        IOEventsApiError
      );
      await expect(createService.execute(validProviderId, validEventMetadataData)).rejects.toThrow(
        'Invalid response format: Expected object'
      );
    });

    it('should validate response format - non-object response', async () => {
      mockRestClient.post.mockResolvedValue('invalid response' as any);

      await expect(createService.execute(validProviderId, validEventMetadataData)).rejects.toThrow(
        IOEventsApiError
      );
      await expect(createService.execute(validProviderId, validEventMetadataData)).rejects.toThrow(
        'Invalid response format: Expected object'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP error with status code', async () => {
      const httpError = new Error('HTTP error! status: 401');
      mockRestClient.post.mockRejectedValue(httpError);

      await expect(createService.execute(validProviderId, validEventMetadataData)).rejects.toThrow(
        IOEventsApiError
      );

      try {
        await createService.execute(validProviderId, validEventMetadataData);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(401);
        expect(ioError.message).toBe('Authentication failed. Please check your access token');
      }
    });

    it('should handle different HTTP status codes correctly', async () => {
      const statusTests = [
        { status: 401, expectedMessage: 'Unauthorized: Invalid or expired access token' },
        { status: 403, expectedMessage: 'Forbidden: Insufficient permissions or invalid API key' },
        { status: 404, expectedMessage: 'Not Found: Provider not found or does not exist' },
        {
          status: 409,
          expectedMessage:
            'Conflict: Event metadata with the same event_code already exists for this provider',
        },
        {
          status: 500,
          expectedMessage: 'Internal server error occurred while creating event metadata',
        },
        { status: 418, expectedMessage: 'HTTP 418: Event metadata creation failed' },
      ];

      for (const test of statusTests) {
        const httpError = new Error(`HTTP error! status: ${test.status}`);
        mockRestClient.post.mockRejectedValue(httpError);

        try {
          await createService.execute(validProviderId, validEventMetadataData);
          fail(`Expected error for status ${test.status}`);
        } catch (error) {
          expect(error instanceof IOEventsApiError).toBe(true);
          const ioError = error as IOEventsApiError;
          expect(ioError.statusCode).toBe(test.status);
          if (test.status === 401) {
            expect(ioError.message).toBe('Authentication failed. Please check your access token');
          } else if (test.status === 403) {
            expect(ioError.message).toBe(
              'Access forbidden. You do not have permission to create event metadata'
            );
          } else if (test.status === 404) {
            expect(ioError.message).toBe(
              'Provider not found. The specified provider ID does not exist'
            );
          } else if (test.status === 500) {
            expect(ioError.message).toBe(
              'Internal server error occurred while creating event metadata'
            );
          } else {
            expect(ioError.message).toBe(`Unexpected error occurred: HTTP ${test.status}`);
          }
        }
      }
    });

    it('should handle network errors', async () => {
      const networkError = { code: 'ENOTFOUND' };
      mockRestClient.post.mockRejectedValue(networkError);

      await expect(createService.execute(validProviderId, validEventMetadataData)).rejects.toThrow(
        IOEventsApiError
      );

      try {
        await createService.execute(validProviderId, validEventMetadataData);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toContain('API Error: HTTP 500');
        expect(ioError.errorCode).toBeUndefined();
      }
    });

    it('should handle timeout errors', async () => {
      const timeoutError = { code: 'ETIMEDOUT' };
      mockRestClient.post.mockRejectedValue(timeoutError);

      await expect(createService.execute(validProviderId, validEventMetadataData)).rejects.toThrow(
        IOEventsApiError
      );

      try {
        await createService.execute(validProviderId, validEventMetadataData);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toContain('API Error: HTTP 500');
        expect(ioError.errorCode).toBeUndefined();
      }
    });

    it('should handle generic errors', async () => {
      const genericError = new Error('Something went wrong');
      mockRestClient.post.mockRejectedValue(genericError);

      await expect(createService.execute(validProviderId, validEventMetadataData)).rejects.toThrow(
        IOEventsApiError
      );

      try {
        await createService.execute(validProviderId, validEventMetadataData);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toContain('Network error: Something went wrong');
        expect(ioError.errorCode).toBeUndefined();
      }
    });

    it('should handle extractStatusCodeFromMessage with successful regex match', async () => {
      const errorWithStatusInMessage = new Error('HTTP error! status: 422');
      mockRestClient.post.mockRejectedValue(errorWithStatusInMessage);

      await expect(createService.execute(validProviderId, validEventMetadataData)).rejects.toThrow(
        IOEventsApiError
      );

      try {
        await createService.execute(validProviderId, validEventMetadataData);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(422); // Successfully parsed from regex
      }
    });

    it('should handle extractStatusCodeFromMessage with regex match failure but contains HTTP error status', async () => {
      const errorWithInvalidStatus = new Error('HTTP error! status: abc');
      mockRestClient.post.mockRejectedValue(errorWithInvalidStatus);

      await expect(createService.execute(validProviderId, validEventMetadataData)).rejects.toThrow(
        IOEventsApiError
      );

      try {
        await createService.execute(validProviderId, validEventMetadataData);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(500); // Fallback when regex doesn't match number
      }
    });

    it('should handle timeout errors with specific timeout status code', async () => {
      const timeoutError = new Error('Request timeout occurred while creating event metadata');
      mockRestClient.post.mockRejectedValue(timeoutError);

      await expect(createService.execute(validProviderId, validEventMetadataData)).rejects.toThrow(
        IOEventsApiError
      );

      try {
        await createService.execute(validProviderId, validEventMetadataData);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(IoEventsGlobals.STATUS_CODES.REQUEST_TIMEOUT);
        expect(ioError.message).toBe('Request timeout while creating event metadata');
      }
    });

    it('should handle ETIMEDOUT errors with specific timeout status code', async () => {
      const etimedoutError = new Error('Connection failed: ETIMEDOUT');
      mockRestClient.post.mockRejectedValue(etimedoutError);

      await expect(createService.execute(validProviderId, validEventMetadataData)).rejects.toThrow(
        IOEventsApiError
      );

      try {
        await createService.execute(validProviderId, validEventMetadataData);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(IoEventsGlobals.STATUS_CODES.REQUEST_TIMEOUT);
        expect(ioError.message).toBe('Request timeout while creating event metadata');
      }
    });

    it('should handle JSON parsing errors', async () => {
      const jsonParseError = new Error('Failed to parse JSON response');
      mockRestClient.post.mockRejectedValue(jsonParseError);

      await expect(createService.execute(validProviderId, validEventMetadataData)).rejects.toThrow(
        IOEventsApiError
      );

      try {
        await createService.execute(validProviderId, validEventMetadataData);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR);
        expect(ioError.message).toBe('Invalid response format from Adobe I/O Events API');
      }
    });

    it('should handle error without response.status fallback', async () => {
      const errorWithoutStatus = {
        response: {
          // Missing status property
          body: { error: 'Some error occurred' },
        },
      };
      mockRestClient.post.mockRejectedValue(errorWithoutStatus);

      await expect(createService.execute(validProviderId, validEventMetadataData)).rejects.toThrow(
        IOEventsApiError
      );

      try {
        await createService.execute(validProviderId, validEventMetadataData);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR); // Fallback to 500
      }
    });

    it('should handle validation error and throw it directly', async () => {
      const validationError = new Error('event_code cannot be empty');
      mockRestClient.post.mockRejectedValue(validationError);

      await expect(createService.execute(validProviderId, validEventMetadataData)).rejects.toThrow(
        IOEventsApiError
      );

      try {
        await createService.execute(validProviderId, validEventMetadataData);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(IoEventsGlobals.STATUS_CODES.BAD_REQUEST);
        expect(ioError.errorCode).toBe('VALIDATION_ERROR');
        expect(ioError.message).toBe('event_code cannot be empty');
      }
    });

    it('should return BAD_REQUEST error message for 400 status code', async () => {
      const errorWith400 = new Error('HTTP error! status: 400');
      mockRestClient.post.mockRejectedValue(errorWith400);

      await expect(createService.execute(validProviderId, validEventMetadataData)).rejects.toThrow(
        IOEventsApiError
      );

      try {
        await createService.execute(validProviderId, validEventMetadataData);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(400);
        expect(ioError.message).toBe('Invalid request parameters for creating event metadata');
      }
    });
  });

  describe('Field Validation', () => {
    it('should throw error for description exceeding 255 characters', async () => {
      const longDescription = 'a'.repeat(256);
      const invalidData = {
        ...validEventMetadataData,
        description: longDescription,
      };

      await expect(createService.execute(validProviderId, invalidData)).rejects.toThrow(
        'description cannot exceed 255 characters'
      );
    });

    it('should throw error for label exceeding 255 characters', async () => {
      const longLabel = 'a'.repeat(256);
      const invalidData = {
        ...validEventMetadataData,
        label: longLabel,
      };

      await expect(createService.execute(validProviderId, invalidData)).rejects.toThrow(
        'label cannot exceed 255 characters'
      );
    });

    it('should throw error for event_code exceeding 255 characters', async () => {
      const longEventCode = 'a'.repeat(256);
      const invalidData = {
        ...validEventMetadataData,
        event_code: longEventCode,
      };

      await expect(createService.execute(validProviderId, invalidData)).rejects.toThrow(
        'event_code cannot exceed 255 characters'
      );
    });

    it('should throw error for description with invalid characters', async () => {
      const invalidData = {
        ...validEventMetadataData,
        description: 'Invalid description with @ symbol',
      };

      await expect(createService.execute(validProviderId, invalidData)).rejects.toThrow(
        'description contains invalid characters'
      );
    });

    it('should throw error for label with invalid characters', async () => {
      const invalidData = {
        ...validEventMetadataData,
        label: 'Invalid label with @ symbol',
      };

      await expect(createService.execute(validProviderId, invalidData)).rejects.toThrow(
        'label contains invalid characters'
      );
    });

    it('should throw error for event_code with invalid characters', async () => {
      const invalidData = {
        ...validEventMetadataData,
        event_code: 'invalid@event.code',
      };

      await expect(createService.execute(validProviderId, invalidData)).rejects.toThrow(
        'event_code contains invalid characters'
      );
    });

    it('should throw error for non-object sample_event_template', async () => {
      const invalidData = {
        ...validEventMetadataData,
        sample_event_template: 'not an object' as any,
      };

      await expect(createService.execute(validProviderId, invalidData)).rejects.toThrow(
        'sample_event_template must be a valid JSON object'
      );
    });

    it('should throw error for null sample_event_template', async () => {
      const invalidData = {
        ...validEventMetadataData,
        sample_event_template: null as any,
      };

      await expect(createService.execute(validProviderId, invalidData)).rejects.toThrow(
        'sample_event_template must be a valid JSON object'
      );
    });

    it('should throw error for sample_event_template that is too large when base64 encoded', async () => {
      // Create a large object that would exceed the base64 limit
      const largeObject = {
        data: 'x'.repeat(100000), // This should exceed the base64 limit
      };
      const invalidData = {
        ...validEventMetadataData,
        sample_event_template: largeObject,
      };

      await expect(createService.execute(validProviderId, invalidData)).rejects.toThrow(
        'sample_event_template JSON object is too large when base64 encoded'
      );
    });

    it('should handle JSON.stringify error in sample_event_template validation', async () => {
      // Create a circular reference object that will cause JSON.stringify to throw
      const circularObject: any = { a: 1 };
      circularObject.self = circularObject;
      const invalidData = {
        ...validEventMetadataData,
        sample_event_template: circularObject,
      };

      await expect(createService.execute(validProviderId, invalidData)).rejects.toThrow(
        'sample_event_template must be a valid JSON object'
      );
    });
  });
});
