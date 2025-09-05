/**
 * <license header>
 */

import RegistrationManager from '../../../src/io-events/registration';
import { IOEventsApiError } from '../../../src/io-events/types';
import type { Registration } from '../../../src/io-events/registration/types';
import type { RegistrationCreateModel } from '../../../src/io-events/registration/create/types';
import Create from '../../../src/io-events/registration/create';
import Delete from '../../../src/io-events/registration/delete';
import Get from '../../../src/io-events/registration/get';
import List from '../../../src/io-events/registration/list';

// Mock the individual services
jest.mock('../../../src/io-events/registration/create');
jest.mock('../../../src/io-events/registration/delete');
jest.mock('../../../src/io-events/registration/get');
jest.mock('../../../src/io-events/registration/list');

const MockedCreate = Create as jest.MockedClass<typeof Create>;
const MockedDelete = Delete as jest.MockedClass<typeof Delete>;
const MockedGet = Get as jest.MockedClass<typeof Get>;
const MockedList = List as jest.MockedClass<typeof List>;

describe('RegistrationManager', () => {
  let registrationManager: RegistrationManager;
  let mockCreateService: jest.Mocked<Create>;
  let mockDeleteService: jest.Mocked<Delete>;
  let mockGetService: jest.Mocked<Get>;
  let mockListService: jest.Mocked<List>;

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
    delivery_type: 'webhook',
    enabled: true,
    created_date: '2023-01-01T00:00:00.000Z',
    updated_date: '2023-01-01T00:00:00.000Z',
  };

  const mockRegistrationData: RegistrationCreateModel = {
    client_id: 'test-client',
    name: 'Test Registration',
    events_of_interest: [
      {
        provider_id: 'test-provider',
        event_code: 'test.event',
      },
    ],
    delivery_type: 'webhook',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockCreateService = {
      execute: jest.fn(),
    } as any;
    mockDeleteService = {
      execute: jest.fn(),
    } as any;
    mockGetService = {
      execute: jest.fn(),
    } as any;
    mockListService = {
      execute: jest.fn(),
    } as any;

    MockedCreate.mockImplementation(() => mockCreateService);
    MockedDelete.mockImplementation(() => mockDeleteService);
    MockedGet.mockImplementation(() => mockGetService);
    MockedList.mockImplementation(() => mockListService);

    registrationManager = new RegistrationManager(
      validCredentials.clientId,
      validCredentials.consumerId,
      validCredentials.projectId,
      validCredentials.workspaceId,
      validCredentials.accessToken
    );
  });

  describe('Constructor', () => {
    it('should create RegistrationManager instance with valid credentials', () => {
      expect(registrationManager).toBeInstanceOf(RegistrationManager);
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
      expect(MockedGet).toHaveBeenCalledWith(
        validCredentials.clientId,
        validCredentials.consumerId,
        validCredentials.projectId,
        validCredentials.workspaceId,
        validCredentials.accessToken
      );
      expect(MockedList).toHaveBeenCalledWith(
        validCredentials.clientId,
        validCredentials.consumerId,
        validCredentials.projectId,
        validCredentials.workspaceId,
        validCredentials.accessToken
      );
    });

    it('should initialize all required services', () => {
      expect(MockedCreate).toHaveBeenCalledTimes(1);
      expect(MockedDelete).toHaveBeenCalledTimes(1);
      expect(MockedGet).toHaveBeenCalledTimes(1);
      expect(MockedList).toHaveBeenCalledTimes(1);
    });
  });

  describe('create', () => {
    it('should call create service with registration data', async () => {
      mockCreateService.execute.mockResolvedValue(mockRegistration);

      const result = await registrationManager.create(mockRegistrationData);

      expect(mockCreateService.execute).toHaveBeenCalledWith(mockRegistrationData);
      expect(result).toEqual(mockRegistration);
    });

    it('should handle create service errors', async () => {
      const error = new IOEventsApiError('Create failed', 400);
      mockCreateService.execute.mockRejectedValue(error);

      await expect(registrationManager.create(mockRegistrationData)).rejects.toThrow(error);
    });

    it('should pass through different registration data types', async () => {
      const minimalData: RegistrationCreateModel = {
        client_id: 'minimal',
        name: 'Minimal',
        events_of_interest: [{ provider_id: 'p1', event_code: 'e1' }],
        delivery_type: 'journal',
      };

      mockCreateService.execute.mockResolvedValue(mockRegistration);

      await registrationManager.create(minimalData);

      expect(mockCreateService.execute).toHaveBeenCalledWith(minimalData);
    });
  });

  describe('delete', () => {
    it('should call delete service with registration ID', async () => {
      const registrationId = 'test-registration-123';
      mockDeleteService.execute.mockResolvedValue(undefined);

      await registrationManager.delete(registrationId);

      expect(mockDeleteService.execute).toHaveBeenCalledWith(registrationId);
    });

    it('should handle delete service errors', async () => {
      const error = new IOEventsApiError('Delete failed', 404);
      const registrationId = 'non-existent-id';
      mockDeleteService.execute.mockRejectedValue(error);

      await expect(registrationManager.delete(registrationId)).rejects.toThrow(error);
    });

    it('should handle successful deletion', async () => {
      const registrationId = 'test-registration-123';
      mockDeleteService.execute.mockResolvedValue(undefined);

      await expect(registrationManager.delete(registrationId)).resolves.toBeUndefined();
      expect(mockDeleteService.execute).toHaveBeenCalledWith(registrationId);
    });
  });

  describe('get', () => {
    it('should call get service with registration ID', async () => {
      const registrationId = 'test-registration-123';
      mockGetService.execute.mockResolvedValue(mockRegistration);

      const result = await registrationManager.get(registrationId);

      expect(mockGetService.execute).toHaveBeenCalledWith(registrationId);
      expect(result).toEqual(mockRegistration);
    });

    it('should handle get service errors', async () => {
      const error = new IOEventsApiError('Registration not found', 404);
      const registrationId = 'non-existent-id';
      mockGetService.execute.mockRejectedValue(error);

      await expect(registrationManager.get(registrationId)).rejects.toThrow(error);
    });

    it('should return registration data for valid ID', async () => {
      const registrationId = 'valid-registration-id';
      const expectedRegistration = {
        ...mockRegistration,
        registration_id: registrationId,
      };
      mockGetService.execute.mockResolvedValue(expectedRegistration);

      const result = await registrationManager.get(registrationId);

      expect(result).toEqual(expectedRegistration);
      expect(result.registration_id).toBe(registrationId);
    });
  });

  describe('list', () => {
    it('should call list service without query parameters', async () => {
      const mockRegistrations: Registration[] = [mockRegistration];
      mockListService.execute.mockResolvedValue(mockRegistrations);

      const result = await registrationManager.list();

      expect(mockListService.execute).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(mockRegistrations);
    });

    it('should call list service with query parameters', async () => {
      const queryParams = { enabled: true };
      const mockRegistrations: Registration[] = [mockRegistration];
      mockListService.execute.mockResolvedValue(mockRegistrations);

      const result = await registrationManager.list(queryParams);

      expect(mockListService.execute).toHaveBeenCalledWith(queryParams);
      expect(result).toEqual(mockRegistrations);
    });

    it('should handle list service errors', async () => {
      const error = new IOEventsApiError('List failed', 500);
      mockListService.execute.mockRejectedValue(error);

      await expect(registrationManager.list()).rejects.toThrow(error);
    });

    it('should handle empty registration list', async () => {
      const emptyList: Registration[] = [];
      mockListService.execute.mockResolvedValue(emptyList);

      const result = await registrationManager.list();

      expect(result).toEqual(emptyList);
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
      mockListService.execute.mockResolvedValue(multipleRegistrations);

      const result = await registrationManager.list();

      expect(result).toEqual(multipleRegistrations);
      expect(result).toHaveLength(3);
    });

    it('should pass through complex query parameters', async () => {
      const complexQueryParams = {
        enabled: true,
        delivery_type: 'webhook',
        page: 1,
        limit: 50,
        sort: 'created_date',
      };
      mockListService.execute.mockResolvedValue([mockRegistration]);

      await registrationManager.list(complexQueryParams);

      expect(mockListService.execute).toHaveBeenCalledWith(complexQueryParams);
    });
  });

  describe('Service Integration', () => {
    it('should maintain service instances across method calls', async () => {
      // Call multiple methods to ensure services are reused
      mockCreateService.execute.mockResolvedValue(mockRegistration);
      mockGetService.execute.mockResolvedValue(mockRegistration);
      mockDeleteService.execute.mockResolvedValue(undefined);
      mockListService.execute.mockResolvedValue([mockRegistration]);

      await registrationManager.create(mockRegistrationData);
      await registrationManager.get('test-id');
      await registrationManager.delete('test-id');
      await registrationManager.list();

      // Services should be created only once during constructor
      expect(MockedCreate).toHaveBeenCalledTimes(1);
      expect(MockedDelete).toHaveBeenCalledTimes(1);
      expect(MockedGet).toHaveBeenCalledTimes(1);
      expect(MockedList).toHaveBeenCalledTimes(1);

      // But methods should be called
      expect(mockCreateService.execute).toHaveBeenCalledTimes(1);
      expect(mockGetService.execute).toHaveBeenCalledTimes(1);
      expect(mockDeleteService.execute).toHaveBeenCalledTimes(1);
      expect(mockListService.execute).toHaveBeenCalledTimes(1);
    });

    it('should handle mixed success and error scenarios', async () => {
      // Setup different outcomes for different services
      mockCreateService.execute.mockResolvedValue(mockRegistration);
      mockGetService.execute.mockRejectedValue(new IOEventsApiError('Not found', 404));

      // Successful create
      const createResult = await registrationManager.create(mockRegistrationData);
      expect(createResult).toEqual(mockRegistration);

      // Failed get
      await expect(registrationManager.get('non-existent')).rejects.toThrow('Not found');

      expect(mockCreateService.execute).toHaveBeenCalledWith(mockRegistrationData);
      expect(mockGetService.execute).toHaveBeenCalledWith('non-existent');
    });
  });
});
