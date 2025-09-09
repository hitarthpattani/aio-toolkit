/**
 * <license header>
 */

import List from '../../../../src/io-events/event-metadata/list';
import { IOEventsApiError, IoEventsGlobals } from '../../../../src/io-events/types';
import type { EventMetadata } from '../../../../src/io-events/event-metadata/types';
import type { EventMetadataListResponse } from '../../../../src/io-events/event-metadata/list/types';
import RestClient from '../../../../src/integration/rest-client';

// Mock RestClient
jest.mock('../../../../src/integration/rest-client');
const MockedRestClient = RestClient as jest.MockedClass<typeof RestClient>;

describe('List Event Metadata', () => {
  let listService: List;
  let mockRestClient: jest.Mocked<RestClient>;

  const validCredentials = {
    clientId: 'test-client-id',
    consumerId: 'test-consumer-id',
    projectId: 'test-project-id',
    workspaceId: 'test-workspace-id',
    accessToken: 'test-access-token',
  };

  const validProviderId = 'test-provider-123';

  const mockEventMetadata1: EventMetadata = {
    event_code: 'com.example.user.created',
    label: 'User Created',
    description: 'Triggered when a new user is created',
    sample_event_template: '{"user_id":"12345","name":"John Doe"}',
  };

  const mockEventMetadata2: EventMetadata = {
    event_code: 'com.example.user.updated',
    label: 'User Updated',
    description: 'Triggered when user information is updated',
    sample_event_template: '{"user_id":"67890","updated_fields":["name","email"]}',
  };

  const mockListResponse: EventMetadataListResponse = {
    _embedded: {
      eventmetadata: [mockEventMetadata1, mockEventMetadata2],
    },
    _links: {
      self: {
        href: '/events/providers/test-provider-123/eventmetadata',
      },
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
          new List(
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
    it('should list event metadata successfully', async () => {
      mockRestClient.get.mockResolvedValue(mockListResponse);

      const result = await listService.execute(validProviderId);

      expect(result).toEqual([mockEventMetadata1, mockEventMetadata2]);
      expect(mockRestClient.get).toHaveBeenCalledWith(
        `${IoEventsGlobals.BASE_URL}/events/providers/${validProviderId}/eventmetadata`,
        {
          Authorization: `Bearer ${validCredentials.accessToken}`,
          'x-api-key': validCredentials.clientId,
          Accept: 'application/hal+json',
        }
      );
    });

    it('should handle empty event metadata list', async () => {
      const emptyResponse: EventMetadataListResponse = {
        _embedded: {
          eventmetadata: [],
        },
        _links: {
          self: { href: '/events/providers/test-provider-123/eventmetadata' },
        },
      };
      mockRestClient.get.mockResolvedValue(emptyResponse);

      const result = await listService.execute(validProviderId);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle response without _embedded', async () => {
      const responseWithoutEmbedded = {
        _links: {
          self: { href: '/events/providers/test-provider-123/eventmetadata' },
        },
      };
      mockRestClient.get.mockResolvedValue(responseWithoutEmbedded);

      await expect(listService.execute(validProviderId)).rejects.toThrow(IOEventsApiError);
      await expect(listService.execute(validProviderId)).rejects.toThrow(
        'Invalid response format: Expected eventmetadata array'
      );
    });

    it('should throw error for empty providerId', async () => {
      await expect(listService.execute('')).rejects.toThrow(IOEventsApiError);
      await expect(listService.execute('')).rejects.toThrow(
        'providerId is required and cannot be empty'
      );
    });

    it('should throw error for undefined providerId', async () => {
      await expect(listService.execute(undefined as any)).rejects.toThrow(IOEventsApiError);
      await expect(listService.execute(undefined as any)).rejects.toThrow(
        'providerId is required and cannot be empty'
      );
    });

    it('should validate response format', async () => {
      mockRestClient.get.mockResolvedValue(null);

      await expect(listService.execute(validProviderId)).rejects.toThrow(IOEventsApiError);
      await expect(listService.execute(validProviderId)).rejects.toThrow(
        'Invalid response format: Expected object'
      );
    });

    it('should validate response format - non-object response', async () => {
      mockRestClient.get.mockResolvedValue('string response' as any);

      await expect(listService.execute(validProviderId)).rejects.toThrow(IOEventsApiError);
      await expect(listService.execute(validProviderId)).rejects.toThrow(
        'Invalid response format: Expected object'
      );
    });

    it('should validate event metadata array format', async () => {
      const invalidResponse = {
        _embedded: {
          eventmetadata: 'not an array',
        },
        _links: { self: { href: '/test' } },
      };
      mockRestClient.get.mockResolvedValue(invalidResponse);

      await expect(listService.execute(validProviderId)).rejects.toThrow(IOEventsApiError);
      await expect(listService.execute(validProviderId)).rejects.toThrow(
        'Invalid response format: Expected eventmetadata array'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP errors', async () => {
      const httpError = new Error('HTTP error! status: 404');
      mockRestClient.get.mockRejectedValue(httpError);

      await expect(listService.execute(validProviderId)).rejects.toThrow(IOEventsApiError);

      try {
        await listService.execute(validProviderId);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(404);
        expect(ioError.message).toBe('Provider not found or no event metadata available');
      }
    });

    it('should handle different HTTP status codes', async () => {
      const statusTests = [
        { status: 401, expectedMessage: 'Unauthorized: Invalid or expired access token' },
        { status: 403, expectedMessage: 'Forbidden: Insufficient permissions or invalid API key' },
        { status: 404, expectedMessage: 'Not Found: Provider not found or does not exist' },
        {
          status: 500,
          expectedMessage: 'Internal server error occurred while listing event metadata',
        },
        { status: 422, expectedMessage: 'HTTP 422: Event metadata listing failed' },
      ];

      for (const test of statusTests) {
        const httpError = new Error(`HTTP error! status: ${test.status}`);
        mockRestClient.get.mockRejectedValue(httpError);

        try {
          await listService.execute(validProviderId);
          fail(`Expected error for status ${test.status}`);
        } catch (error) {
          expect(error instanceof IOEventsApiError).toBe(true);
          const ioError = error as IOEventsApiError;
          expect(ioError.statusCode).toBe(test.status);
          if (test.status === 401) {
            expect(ioError.message).toBe('Authentication failed. Please check your access token');
          } else if (test.status === 403) {
            expect(ioError.message).toBe(
              'Access forbidden. You do not have permission to access event metadata'
            );
          } else if (test.status === 404) {
            expect(ioError.message).toBe('Provider not found or no event metadata available');
          } else if (test.status === 500) {
            expect(ioError.message).toBe(
              'Internal server error occurred while listing event metadata'
            );
          } else {
            expect(ioError.message).toBe(`Unexpected error occurred: HTTP ${test.status}`);
          }
        }
      }
    });

    it('should handle network errors', async () => {
      const networkError = { code: 'ENOTFOUND' };
      mockRestClient.get.mockRejectedValue(networkError);

      await expect(listService.execute(validProviderId)).rejects.toThrow(IOEventsApiError);

      try {
        await listService.execute(validProviderId);
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

      await expect(listService.execute(validProviderId)).rejects.toThrow(IOEventsApiError);

      try {
        await listService.execute(validProviderId);
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

      await expect(listService.execute(validProviderId)).rejects.toThrow(IOEventsApiError);

      try {
        await listService.execute(validProviderId);
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

      await expect(listService.execute(validProviderId)).rejects.toThrow(IOEventsApiError);

      try {
        await listService.execute(validProviderId);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toContain('Invalid response format');
        expect(ioError.errorCode).toBe('PARSE_ERROR');
      }
    });

    it('should handle generic errors', async () => {
      const genericError = new Error('Something unexpected happened');
      mockRestClient.get.mockRejectedValue(genericError);

      await expect(listService.execute(validProviderId)).rejects.toThrow(IOEventsApiError);

      try {
        await listService.execute(validProviderId);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toContain('Network error: Something unexpected happened');
        expect(ioError.errorCode).toBeUndefined();
      }
    });

    it('should handle extractStatusCodeFromMessage with successful regex match', async () => {
      const errorWithStatusInMessage = new Error('HTTP error! status: 429');
      mockRestClient.get.mockRejectedValue(errorWithStatusInMessage);

      await expect(listService.execute(validProviderId)).rejects.toThrow(IOEventsApiError);

      try {
        await listService.execute(validProviderId);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(429); // Successfully parsed from regex
      }
    });

    it('should handle extractStatusCodeFromMessage with regex match failure but contains HTTP error status', async () => {
      const errorWithInvalidStatus = new Error('HTTP error! status: ');
      mockRestClient.get.mockRejectedValue(errorWithInvalidStatus);

      await expect(listService.execute(validProviderId)).rejects.toThrow(IOEventsApiError);

      try {
        await listService.execute(validProviderId);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(500); // Fallback when regex doesn't match number
      }
    });

    it('should handle timeout errors with specific timeout status code', async () => {
      const timeoutError = new Error('Request timeout occurred while listing event metadata');
      mockRestClient.get.mockRejectedValue(timeoutError);

      await expect(listService.execute(validProviderId)).rejects.toThrow(IOEventsApiError);

      try {
        await listService.execute(validProviderId);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(IoEventsGlobals.STATUS_CODES.REQUEST_TIMEOUT);
        expect(ioError.message).toBe('Request timeout while listing event metadata');
      }
    });

    it('should handle ETIMEDOUT errors with specific timeout status code', async () => {
      const etimedoutError = new Error('Connection failed: ETIMEDOUT');
      mockRestClient.get.mockRejectedValue(etimedoutError);

      await expect(listService.execute(validProviderId)).rejects.toThrow(IOEventsApiError);

      try {
        await listService.execute(validProviderId);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(IoEventsGlobals.STATUS_CODES.REQUEST_TIMEOUT);
        expect(ioError.message).toBe('Request timeout while listing event metadata');
      }
    });

    it('should handle error without response.status fallback', async () => {
      const errorWithoutStatus = {
        response: {
          // Missing status property
          body: { error: 'Some error occurred' },
        },
      };
      mockRestClient.get.mockRejectedValue(errorWithoutStatus);

      await expect(listService.execute(validProviderId)).rejects.toThrow(IOEventsApiError);

      try {
        await listService.execute(validProviderId);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR); // Fallback to 500
      }
    });

    it('should return BAD_REQUEST error message for 400 status code', async () => {
      const errorWith400 = new Error('HTTP error! status: 400');
      mockRestClient.get.mockRejectedValue(errorWith400);

      await expect(listService.execute(validProviderId)).rejects.toThrow(IOEventsApiError);

      try {
        await listService.execute(validProviderId);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(400);
        expect(ioError.message).toBe('Invalid request parameters for listing event metadata');
      }
    });
  });

  describe('Pagination', () => {
    it('should handle recursive pagination with fetchAllPages', async () => {
      const page1Response = {
        _embedded: {
          eventmetadata: [
            {
              event_code: 'com.example.page1.event',
              label: 'Page 1 Event',
              description: 'Event from page 1',
            },
          ],
        },
        _links: {
          self: {
            href: '/events/providers/test-provider-123/eventmetadata?page=1',
          },
          next: {
            href: '/events/providers/test-provider-123/eventmetadata?page=2',
          },
        },
      };

      const page2Response = {
        _embedded: {
          eventmetadata: [
            {
              event_code: 'com.example.page2.event',
              label: 'Page 2 Event',
              description: 'Event from page 2',
            },
          ],
        },
        _links: {
          self: {
            href: '/events/providers/test-provider-123/eventmetadata?page=2',
          },
          // No next link - end of pagination
        },
      };

      // First call returns page 1 with next link
      // Second call (recursive) returns page 2 without next link
      mockRestClient.get.mockResolvedValueOnce(page1Response).mockResolvedValueOnce(page2Response);

      const result = await listService.execute(validProviderId);

      expect(result).toHaveLength(2);
      expect(result[0].event_code).toBe('com.example.page1.event');
      expect(result[1].event_code).toBe('com.example.page2.event');
      expect(mockRestClient.get).toHaveBeenCalledTimes(2);
    });
  });
});
