/**
 * <license header>
 */

import EventMetadataManager from '../../../src/io-events/event-metadata';
import { IOEventsApiError } from '../../../src/io-events/types';
import type { EventMetadata } from '../../../src/io-events/event-metadata/types';
import type { EventMetadataInputModel } from '../../../src/io-events/event-metadata/create/types';
import List from '../../../src/io-events/event-metadata/list';
import Get from '../../../src/io-events/event-metadata/get';
import Create from '../../../src/io-events/event-metadata/create';
import Delete from '../../../src/io-events/event-metadata/delete';

// Mock all service classes
jest.mock('../../../src/io-events/event-metadata/list');
jest.mock('../../../src/io-events/event-metadata/get');
jest.mock('../../../src/io-events/event-metadata/create');
jest.mock('../../../src/io-events/event-metadata/delete');

const MockedList = List as jest.MockedClass<typeof List>;
const MockedGet = Get as jest.MockedClass<typeof Get>;
const MockedCreate = Create as jest.MockedClass<typeof Create>;
const MockedDelete = Delete as jest.MockedClass<typeof Delete>;

describe('EventMetadataManager', () => {
  let eventMetadataManager: EventMetadataManager;
  let mockListService: jest.Mocked<List>;
  let mockGetService: jest.Mocked<Get>;
  let mockCreateService: jest.Mocked<Create>;
  let mockDeleteService: jest.Mocked<Delete>;

  const validCredentials = {
    clientId: 'test-client-id',
    consumerId: 'test-consumer-id',
    projectId: 'test-project-id',
    workspaceId: 'test-workspace-id',
    accessToken: 'test-access-token',
  };

  const providerId = 'test-provider-123';
  const eventCode = 'com.example.user.created';

  const mockEventMetadata: EventMetadata = {
    event_code: 'com.example.user.created',
    label: 'User Created',
    description: 'Triggered when a new user is created',
    sample_event_template: '{"user_id":"12345","name":"John Doe"}',
  };

  const mockEventMetadataData: EventMetadataInputModel = {
    event_code: 'com.example.user.created',
    label: 'User Created',
    description: 'Triggered when a new user is created',
    sample_event_template: {
      user_id: '12345',
      name: 'John Doe',
      email: 'john@example.com',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock instances
    mockListService = {
      execute: jest.fn(),
    } as any;
    mockGetService = {
      execute: jest.fn(),
    } as any;
    mockCreateService = {
      execute: jest.fn(),
    } as any;
    mockDeleteService = {
      execute: jest.fn(),
    } as any;

    // Setup mock constructors
    MockedList.mockImplementation(() => mockListService);
    MockedGet.mockImplementation(() => mockGetService);
    MockedCreate.mockImplementation(() => mockCreateService);
    MockedDelete.mockImplementation(() => mockDeleteService);

    eventMetadataManager = new EventMetadataManager(
      validCredentials.clientId,
      validCredentials.consumerId,
      validCredentials.projectId,
      validCredentials.workspaceId,
      validCredentials.accessToken
    );
  });

  describe('Constructor', () => {
    it('should create EventMetadataManager instance', () => {
      expect(eventMetadataManager).toBeInstanceOf(EventMetadataManager);
    });

    it('should initialize all service classes with correct parameters', () => {
      expect(MockedList).toHaveBeenCalledWith(
        validCredentials.clientId,
        validCredentials.consumerId,
        validCredentials.projectId,
        validCredentials.workspaceId,
        validCredentials.accessToken
      );
      expect(MockedGet).toHaveBeenCalledWith(
        validCredentials.clientId,
        validCredentials.consumerId,
        validCredentials.projectId,
        validCredentials.workspaceId,
        validCredentials.accessToken
      );
      expect(MockedCreate).toHaveBeenCalledWith(
        validCredentials.clientId,
        validCredentials.consumerId,
        validCredentials.projectId,
        validCredentials.workspaceId,
        validCredentials.accessToken
      );
      expect(MockedDelete).toHaveBeenCalledWith(
        validCredentials.clientId,
        validCredentials.consumerId,
        validCredentials.projectId,
        validCredentials.workspaceId,
        validCredentials.accessToken
      );
    });
  });

  describe('list', () => {
    it('should list event metadata for provider', async () => {
      const mockEventMetadataList = [mockEventMetadata];
      mockListService.execute.mockResolvedValue(mockEventMetadataList);

      const result = await eventMetadataManager.list(providerId);

      expect(result).toEqual(mockEventMetadataList);
      expect(mockListService.execute).toHaveBeenCalledWith(providerId);
    });

    it('should handle empty results', async () => {
      mockListService.execute.mockResolvedValue([]);

      const result = await eventMetadataManager.list(providerId);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should re-throw IOEventsApiError from service', async () => {
      const apiError = new IOEventsApiError('List failed', 404, 'NOT_FOUND', 'Provider not found');
      mockListService.execute.mockRejectedValue(apiError);

      await expect(eventMetadataManager.list(providerId)).rejects.toThrow(IOEventsApiError);
      await expect(eventMetadataManager.list(providerId)).rejects.toThrow('List failed');
    });

    it('should wrap generic errors in IOEventsApiError', async () => {
      const genericError = new Error('Network timeout');
      mockListService.execute.mockRejectedValue(genericError);

      await expect(eventMetadataManager.list(providerId)).rejects.toThrow(IOEventsApiError);

      try {
        await eventMetadataManager.list(providerId);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toContain('Unexpected error in event metadata list');
        expect(ioError.statusCode).toBe(500);
        expect(ioError.errorCode).toBe('UNEXPECTED_ERROR');
      }
    });

    it('should handle non-Error objects', async () => {
      const nonErrorObject = { message: 'Something went wrong', code: 'UNKNOWN' };
      mockListService.execute.mockRejectedValue(nonErrorObject);

      await expect(eventMetadataManager.list(providerId)).rejects.toThrow(IOEventsApiError);

      try {
        await eventMetadataManager.list(providerId);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toContain('Unexpected error in event metadata list: Unknown error');
      }
    });
  });

  describe('get', () => {
    it('should get event metadata by provider ID and event code', async () => {
      mockGetService.execute.mockResolvedValue(mockEventMetadata);

      const result = await eventMetadataManager.get(providerId, eventCode);

      expect(result).toEqual(mockEventMetadata);
      expect(mockGetService.execute).toHaveBeenCalledWith(providerId, eventCode);
    });

    it('should re-throw IOEventsApiError from service', async () => {
      const apiError = new IOEventsApiError(
        'Get failed',
        404,
        'NOT_FOUND',
        'Event metadata not found'
      );
      mockGetService.execute.mockRejectedValue(apiError);

      await expect(eventMetadataManager.get(providerId, eventCode)).rejects.toThrow(
        IOEventsApiError
      );
      await expect(eventMetadataManager.get(providerId, eventCode)).rejects.toThrow('Get failed');
    });

    it('should wrap generic errors in IOEventsApiError', async () => {
      const genericError = new Error('Database connection failed');
      mockGetService.execute.mockRejectedValue(genericError);

      await expect(eventMetadataManager.get(providerId, eventCode)).rejects.toThrow(
        IOEventsApiError
      );

      try {
        await eventMetadataManager.get(providerId, eventCode);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toContain('Unexpected error in event metadata get');
        expect(ioError.statusCode).toBe(500);
        expect(ioError.errorCode).toBe('UNEXPECTED_ERROR');
      }
    });

    it('should handle non-Error objects in get', async () => {
      const nonErrorObject = { status: 500, message: 'Server error' };
      mockGetService.execute.mockRejectedValue(nonErrorObject);

      await expect(eventMetadataManager.get(providerId, eventCode)).rejects.toThrow(
        IOEventsApiError
      );

      try {
        await eventMetadataManager.get(providerId, eventCode);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toContain('Unexpected error in event metadata get: Unknown error');
      }
    });
  });

  describe('create', () => {
    it('should create event metadata successfully', async () => {
      mockCreateService.execute.mockResolvedValue(mockEventMetadata);

      const result = await eventMetadataManager.create(providerId, mockEventMetadataData);

      expect(result).toEqual(mockEventMetadata);
      expect(mockCreateService.execute).toHaveBeenCalledWith(providerId, mockEventMetadataData);
    });

    it('should create event metadata with minimal data', async () => {
      const minimalData: EventMetadataInputModel = {
        event_code: 'com.example.minimal',
        label: 'Minimal Event',
        description: 'A minimal event',
      };
      const expectedResponse = {
        event_code: 'com.example.minimal',
        label: 'Minimal Event',
        description: 'A minimal event',
      };
      mockCreateService.execute.mockResolvedValue(expectedResponse);

      const result = await eventMetadataManager.create(providerId, minimalData);

      expect(result).toEqual(expectedResponse);
      expect(mockCreateService.execute).toHaveBeenCalledWith(providerId, minimalData);
    });

    it('should create event metadata with all optional fields', async () => {
      const fullData: EventMetadataInputModel = {
        event_code: 'com.example.full',
        label: 'Full Event',
        description: 'An event with all fields',
        sample_event_template: {
          user_id: '123',
          name: 'Test User',
          metadata: { version: '1.0' },
        },
      };
      mockCreateService.execute.mockResolvedValue(mockEventMetadata);

      const result = await eventMetadataManager.create(providerId, fullData);

      expect(result).toEqual(mockEventMetadata);
      expect(mockCreateService.execute).toHaveBeenCalledWith(providerId, fullData);
    });

    it('should re-throw IOEventsApiError from service', async () => {
      const apiError = new IOEventsApiError(
        'Create failed',
        409,
        'CONFLICT',
        'Event metadata already exists'
      );
      mockCreateService.execute.mockRejectedValue(apiError);

      await expect(eventMetadataManager.create(providerId, mockEventMetadataData)).rejects.toThrow(
        IOEventsApiError
      );
      await expect(eventMetadataManager.create(providerId, mockEventMetadataData)).rejects.toThrow(
        'Create failed'
      );
    });

    it('should wrap generic errors in IOEventsApiError', async () => {
      const genericError = new Error('Validation error');
      mockCreateService.execute.mockRejectedValue(genericError);

      await expect(eventMetadataManager.create(providerId, mockEventMetadataData)).rejects.toThrow(
        IOEventsApiError
      );

      try {
        await eventMetadataManager.create(providerId, mockEventMetadataData);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toContain('Unexpected error in event metadata create');
        expect(ioError.statusCode).toBe(500);
        expect(ioError.errorCode).toBe('UNEXPECTED_ERROR');
      }
    });

    it('should handle non-Error objects in create', async () => {
      const nonErrorObject = { code: 'CREATE_FAILED', details: 'Creation failed' };
      mockCreateService.execute.mockRejectedValue(nonErrorObject);

      await expect(eventMetadataManager.create(providerId, mockEventMetadataData)).rejects.toThrow(
        IOEventsApiError
      );

      try {
        await eventMetadataManager.create(providerId, mockEventMetadataData);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toContain(
          'Unexpected error in event metadata create: Unknown error'
        );
      }
    });
  });

  describe('delete', () => {
    it('should delete all event metadata for provider', async () => {
      mockDeleteService.execute.mockResolvedValue(undefined);

      const result = await eventMetadataManager.delete(providerId);

      expect(result).toBeUndefined();
      expect(mockDeleteService.execute).toHaveBeenCalledWith(providerId, undefined);
    });

    it('should delete specific event metadata by event code', async () => {
      mockDeleteService.execute.mockResolvedValue(undefined);

      const result = await eventMetadataManager.delete(providerId, eventCode);

      expect(result).toBeUndefined();
      expect(mockDeleteService.execute).toHaveBeenCalledWith(providerId, eventCode);
    });

    it('should handle different provider ID formats', async () => {
      const providerIds = ['provider-123', 'PROVIDER_456', 'complex-provider-name-789'];

      for (const testProviderId of providerIds) {
        mockDeleteService.execute.mockResolvedValue(undefined);

        const result = await eventMetadataManager.delete(testProviderId);

        expect(result).toBeUndefined();
        expect(mockDeleteService.execute).toHaveBeenCalledWith(testProviderId, undefined);
      }
    });

    it('should re-throw IOEventsApiError from service', async () => {
      const apiError = new IOEventsApiError(
        'Delete failed',
        404,
        'NOT_FOUND',
        'Event metadata not found'
      );
      mockDeleteService.execute.mockRejectedValue(apiError);

      await expect(eventMetadataManager.delete(providerId)).rejects.toThrow(IOEventsApiError);
      await expect(eventMetadataManager.delete(providerId)).rejects.toThrow('Delete failed');
    });

    it('should wrap generic errors in IOEventsApiError', async () => {
      const genericError = new Error('Permission denied');
      mockDeleteService.execute.mockRejectedValue(genericError);

      await expect(eventMetadataManager.delete(providerId)).rejects.toThrow(IOEventsApiError);

      try {
        await eventMetadataManager.delete(providerId);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toContain('Unexpected error in event metadata delete');
        expect(ioError.statusCode).toBe(500);
        expect(ioError.errorCode).toBe('UNEXPECTED_ERROR');
      }
    });

    it('should handle non-Error objects in delete', async () => {
      const nonErrorObject = { reason: 'delete_failed', info: 'Cannot delete' };
      mockDeleteService.execute.mockRejectedValue(nonErrorObject);

      await expect(eventMetadataManager.delete(providerId)).rejects.toThrow(IOEventsApiError);

      try {
        await eventMetadataManager.delete(providerId);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toContain(
          'Unexpected error in event metadata delete: Unknown error'
        );
      }
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete event metadata lifecycle', async () => {
      // Create
      mockCreateService.execute.mockResolvedValue(mockEventMetadata);
      const createResult = await eventMetadataManager.create(providerId, mockEventMetadataData);
      expect(createResult).toEqual(mockEventMetadata);

      // Get
      mockGetService.execute.mockResolvedValue(mockEventMetadata);
      const getResult = await eventMetadataManager.get(providerId, eventCode);
      expect(getResult).toEqual(mockEventMetadata);

      // List
      mockListService.execute.mockResolvedValue([mockEventMetadata]);
      const listResult = await eventMetadataManager.list(providerId);
      expect(listResult).toEqual([mockEventMetadata]);

      // Delete
      mockDeleteService.execute.mockResolvedValue(undefined);
      const deleteResult = await eventMetadataManager.delete(providerId, eventCode);
      expect(deleteResult).toBeUndefined();
    });

    it('should handle multiple event metadata with different event codes', async () => {
      const eventMetadata1 = {
        ...mockEventMetadata,
        event_code: 'com.example.user.created',
      };
      const eventMetadata2 = {
        ...mockEventMetadata,
        event_code: 'com.example.user.updated',
        label: 'User Updated',
        description: 'Triggered when user information is updated',
      };

      mockListService.execute.mockResolvedValue([eventMetadata1, eventMetadata2]);

      const result = await eventMetadataManager.list(providerId);

      expect(result).toHaveLength(2);
      expect(result[0].event_code).toBe('com.example.user.created');
      expect(result[1].event_code).toBe('com.example.user.updated');
    });

    it('should handle error propagation across all methods', async () => {
      const apiError = new IOEventsApiError('Service unavailable', 503, 'SERVICE_UNAVAILABLE');

      // Test error propagation for all methods
      const methods = [
        (): Promise<EventMetadata[]> => eventMetadataManager.list(providerId),
        (): Promise<EventMetadata> => eventMetadataManager.get(providerId, eventCode),
        (): Promise<EventMetadata> =>
          eventMetadataManager.create(providerId, mockEventMetadataData),
        (): Promise<void> => eventMetadataManager.delete(providerId),
      ];

      const services = [mockListService, mockGetService, mockCreateService, mockDeleteService];

      for (let i = 0; i < methods.length; i++) {
        services[i].execute.mockRejectedValue(apiError);
        await expect(methods[i]()).rejects.toThrow(IOEventsApiError);
        await expect(methods[i]()).rejects.toThrow('Service unavailable');
      }
    });
  });
});
