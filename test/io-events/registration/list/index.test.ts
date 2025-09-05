/**
 * <license header>
 */

import List from '../../../../src/io-events/registration/list';
import { IOEventsApiError, IoEventsGlobals } from '../../../../src/io-events/types';
import type { Registration } from '../../../../src/io-events/registration/types';
import type {
  RegistrationListResponse,
  ListRegistrationQueryParams,
} from '../../../../src/io-events/registration/list/types';
import RestClient from '../../../../src/integration/rest-client';

// Mock RestClient
jest.mock('../../../../src/integration/rest-client');
const MockedRestClient = RestClient as jest.MockedClass<typeof RestClient>;

describe('List Registration', () => {
  let listService: List;
  let mockRestClient: jest.Mocked<RestClient>;

  const validCredentials = {
    clientId: 'test-client-id',
    consumerId: 'test-consumer-id',
    projectId: 'test-project-id',
    workspaceId: 'test-workspace-id',
    accessToken: 'test-access-token',
  };

  const mockRegistration: Registration = {
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
  };

  const mockListResponse: RegistrationListResponse = {
    _embedded: {
      registrations: [mockRegistration],
    },
    _links: {
      self: {
        href: '/events/test-consumer-id/test-project-id/test-workspace-id/registrations',
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
    it('should list registrations successfully without query parameters', async () => {
      mockRestClient.get.mockResolvedValue(mockListResponse);

      const result = await listService.execute();

      expect(result).toEqual([mockRegistration]);
      expect(mockRestClient.get).toHaveBeenCalledWith(
        `${IoEventsGlobals.BASE_URL}/events/${validCredentials.consumerId}/${validCredentials.projectId}/${validCredentials.workspaceId}/registrations`,
        {
          Authorization: `Bearer ${validCredentials.accessToken}`,
          'x-api-key': validCredentials.consumerId,
          'Content-Type': 'application/json',
        }
      );
    });

    it('should list registrations successfully with query parameters', async () => {
      const queryParams: ListRegistrationQueryParams = {
        enabled: true,
        delivery_type: 'webhook',
        page: 1,
        limit: 50,
      };

      mockRestClient.get.mockResolvedValue(mockListResponse);

      const result = await listService.execute(queryParams);

      expect(result).toEqual([mockRegistration]);
      expect(mockRestClient.get).toHaveBeenCalledWith(
        expect.stringContaining('?enabled=true&delivery_type=webhook&page=1&limit=50'),
        expect.any(Object)
      );
    });

    it('should handle empty registration list', async () => {
      const emptyResponse: RegistrationListResponse = {
        _embedded: {
          registrations: [],
        },
        _links: {
          self: {
            href: '/events/test-consumer-id/test-project-id/test-workspace-id/registrations',
          },
        },
      };

      mockRestClient.get.mockResolvedValue(emptyResponse);

      const result = await listService.execute();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should handle multiple registrations', async () => {
      const multipleRegistrations: Registration[] = [
        mockRegistration,
        {
          ...mockRegistration,
          registration_id: 'test-registration-456',
          name: 'Second Registration',
        },
        {
          ...mockRegistration,
          registration_id: 'test-registration-789',
          name: 'Third Registration',
        },
      ];

      const multipleResponse: RegistrationListResponse = {
        _embedded: {
          registrations: multipleRegistrations,
        },
        _links: {
          self: {
            href: '/events/test-consumer-id/test-project-id/test-workspace-id/registrations',
          },
        },
      };

      mockRestClient.get.mockResolvedValue(multipleResponse);

      const result = await listService.execute();

      expect(result).toEqual(multipleRegistrations);
      expect(result).toHaveLength(3);
    });

    it('should handle pagination with next page', async () => {
      const firstPageResponse: RegistrationListResponse = {
        _embedded: {
          registrations: [mockRegistration],
        },
        _links: {
          self: {
            href: '/events/test-consumer-id/test-project-id/test-workspace-id/registrations?page=1',
          },
          next: {
            href: '/events/test-consumer-id/test-project-id/test-workspace-id/registrations?page=2',
          },
        },
      };

      const secondPageRegistration: Registration = {
        ...mockRegistration,
        registration_id: 'test-registration-page2',
        name: 'Page 2 Registration',
      };

      const secondPageResponse: RegistrationListResponse = {
        _embedded: {
          registrations: [secondPageRegistration],
        },
        _links: {
          self: {
            href: '/events/test-consumer-id/test-project-id/test-workspace-id/registrations?page=2',
          },
        },
      };

      mockRestClient.get
        .mockResolvedValueOnce(firstPageResponse)
        .mockResolvedValueOnce(secondPageResponse);

      const result = await listService.execute();

      expect(result).toEqual([mockRegistration, secondPageRegistration]);
      expect(result).toHaveLength(2);
      expect(mockRestClient.get).toHaveBeenCalledTimes(2);
    });

    it('should handle query parameters with undefined values', async () => {
      const queryParams: ListRegistrationQueryParams = {
        enabled: true,
        delivery_type: undefined,
        page: undefined,
        limit: 25,
      };

      mockRestClient.get.mockResolvedValue(mockListResponse);

      await listService.execute(queryParams);

      expect(mockRestClient.get).toHaveBeenCalledWith(
        expect.stringContaining('?enabled=true&limit=25'),
        expect.any(Object)
      );
      expect(mockRestClient.get).toHaveBeenCalledWith(
        expect.not.stringContaining('delivery_type'),
        expect.any(Object)
      );
    });

    it('should handle empty query parameters object', async () => {
      mockRestClient.get.mockResolvedValue(mockListResponse);

      await listService.execute({});

      expect(mockRestClient.get).toHaveBeenCalledWith(
        expect.not.stringContaining('?'),
        expect.any(Object)
      );
    });

    it('should handle query parameters with all undefined/null values', async () => {
      const queryParams: ListRegistrationQueryParams = {
        enabled: undefined,
        delivery_type: null as any,
        page: undefined,
        limit: undefined,
      };

      mockRestClient.get.mockResolvedValue(mockListResponse);

      await listService.execute(queryParams);

      expect(mockRestClient.get).toHaveBeenCalledWith(
        expect.not.stringContaining('?'),
        expect.any(Object)
      );
    });

    it('should handle response without embedded registrations', async () => {
      const responseWithoutEmbedded: RegistrationListResponse = {
        _links: {
          self: {
            href: '/events/test-consumer-id/test-project-id/test-workspace-id/registrations',
          },
        },
      };

      mockRestClient.get.mockResolvedValue(responseWithoutEmbedded);

      const result = await listService.execute();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('Input Validation', () => {
    it('should throw error for empty consumerId', async () => {
      expect(
        () =>
          new List(
            validCredentials.clientId,
            '',
            validCredentials.projectId,
            validCredentials.workspaceId,
            validCredentials.accessToken
          )
      ).toThrow('consumerId is required and cannot be empty');
    });

    it('should throw error for empty projectId', async () => {
      expect(
        () =>
          new List(
            validCredentials.clientId,
            validCredentials.consumerId,
            '',
            validCredentials.workspaceId,
            validCredentials.accessToken
          )
      ).toThrow('projectId is required and cannot be empty');
    });

    it('should throw error for empty workspaceId', async () => {
      expect(
        () =>
          new List(
            validCredentials.clientId,
            validCredentials.consumerId,
            validCredentials.projectId,
            '',
            validCredentials.accessToken
          )
      ).toThrow('workspaceId is required and cannot be empty');
    });

    it('should throw error for empty accessToken', async () => {
      expect(
        () =>
          new List(
            validCredentials.clientId,
            validCredentials.consumerId,
            validCredentials.projectId,
            validCredentials.workspaceId,
            ''
          )
      ).toThrow('accessToken is required and cannot be empty');
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP error with status code', async () => {
      const httpError = new Error('HTTP error! status: 403');
      mockRestClient.get.mockRejectedValue(httpError);

      await expect(listService.execute()).rejects.toThrow(IOEventsApiError);

      try {
        await listService.execute();
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(403);
        expect(ioError.message).toBe(
          'Forbidden. You do not have permission to access registrations'
        );
      }
    });

    it('should handle different HTTP status codes correctly', async () => {
      const statusTests = [
        { status: 400, expectedMessage: 'Bad request. Please check your input parameters' },
        { status: 401, expectedMessage: 'Unauthorized. Please check your access token' },
        {
          status: 403,
          expectedMessage: 'Forbidden. You do not have permission to access registrations',
        },
        {
          status: 404,
          expectedMessage:
            'Registrations not found. The specified workspace may not exist or have no registrations',
        },
        { status: 500, expectedMessage: 'Internal server error. Please try again later' },
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

    it('should handle error with response object', async () => {
      const errorWithResponse = {
        response: {
          status: 404,
        },
      };
      mockRestClient.get.mockRejectedValue(errorWithResponse);

      try {
        await listService.execute();
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(404);
        expect(ioError.message).toBe(
          'Registrations not found. The specified workspace may not exist or have no registrations'
        );
      }
    });

    it('should handle IOEventsApiError by re-throwing', async () => {
      const ioError = new IOEventsApiError('Custom IO Events error', 400);
      mockRestClient.get.mockRejectedValue(ioError);

      await expect(listService.execute()).rejects.toThrow(ioError);
    });

    it('should handle generic error with message', async () => {
      const genericError = new Error('Some generic error message');
      mockRestClient.get.mockRejectedValue(genericError);

      try {
        await listService.execute();
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR);
        expect(ioError.message).toBe('Some generic error message');
      }
    });

    it('should handle error without message', async () => {
      const errorWithoutMessage = {};
      mockRestClient.get.mockRejectedValue(errorWithoutMessage);

      try {
        await listService.execute();
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR);
        expect(ioError.message).toBe('An unexpected error occurred while listing registrations');
      }
    });

    it('should handle extractStatusCodeFromMessage with successful regex match', async () => {
      const errorWithStatusInMessage = new Error('HTTP error! status: 422');
      mockRestClient.get.mockRejectedValue(errorWithStatusInMessage);

      try {
        await listService.execute();
        fail('Expected error');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(422);
        expect(ioError.message).toBe('API request failed with status 422');
      }
    });

    it('should handle extractStatusCodeFromMessage with regex match failure', async () => {
      const errorWithInvalidStatus = new Error('HTTP error! status: invalid');
      mockRestClient.get.mockRejectedValue(errorWithInvalidStatus);

      try {
        await listService.execute();
        fail('Expected error');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR); // Default fallback
      }
    });

    it('should handle error with status property directly', async () => {
      const errorWithResponse = {
        response: {
          status: 503,
        },
      };
      mockRestClient.get.mockRejectedValue(errorWithResponse);

      try {
        await listService.execute();
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(503);
        expect(ioError.message).toBe('API request failed with status 503');
      }
    });

    it('should handle error response with fallback status', async () => {
      const errorWithResponse = {
        response: {
          // Missing status property
        },
      };
      mockRestClient.get.mockRejectedValue(errorWithResponse);

      try {
        await listService.execute();
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR);
      }
    });

    it('should handle runtime validation errors during execution - consumer ID', async () => {
      const testService = new List(
        validCredentials.clientId,
        validCredentials.consumerId,
        validCredentials.projectId,
        validCredentials.workspaceId,
        validCredentials.accessToken
      );

      testService['consumerId'] = '';

      await expect(testService.execute()).rejects.toThrow(IOEventsApiError);
      await expect(testService.execute()).rejects.toThrow('Consumer ID is required');
    });

    it('should handle runtime validation errors during execution - project ID', async () => {
      const testService = new List(
        validCredentials.clientId,
        validCredentials.consumerId,
        validCredentials.projectId,
        validCredentials.workspaceId,
        validCredentials.accessToken
      );

      testService['projectId'] = '';

      await expect(testService.execute()).rejects.toThrow(IOEventsApiError);
      await expect(testService.execute()).rejects.toThrow('Project ID is required');
    });

    it('should handle runtime validation errors during execution - workspace ID', async () => {
      const testService = new List(
        validCredentials.clientId,
        validCredentials.consumerId,
        validCredentials.projectId,
        validCredentials.workspaceId,
        validCredentials.accessToken
      );

      testService['workspaceId'] = '';

      await expect(testService.execute()).rejects.toThrow(IOEventsApiError);
      await expect(testService.execute()).rejects.toThrow('Workspace ID is required');
    });

    it('should handle runtime validation errors during execution - access token', async () => {
      const testService = new List(
        validCredentials.clientId,
        validCredentials.consumerId,
        validCredentials.projectId,
        validCredentials.workspaceId,
        validCredentials.accessToken
      );

      testService['accessToken'] = '';

      await expect(testService.execute()).rejects.toThrow(IOEventsApiError);
      await expect(testService.execute()).rejects.toThrow('Access token is required');
    });
  });
});
