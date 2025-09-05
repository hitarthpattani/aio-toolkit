/**
 * <license header>
 */

import ProviderManager from '../../../src/io-events/provider';
import { IOEventsApiError } from '../../../src/io-events/types';
import type { ProviderInputModel } from '../../../src/io-events/provider/create/types';
import type { GetProviderQueryParams } from '../../../src/io-events/provider/get/types';
import type { ListProvidersQueryParams } from '../../../src/io-events/provider/list/types';
import type { Provider } from '../../../src/io-events/provider/types';
import List from '../../../src/io-events/provider/list';
import Get from '../../../src/io-events/provider/get';
import Create from '../../../src/io-events/provider/create';
import Delete from '../../../src/io-events/provider/delete';

// Mock the service classes
jest.mock('../../../src/io-events/provider/list');
jest.mock('../../../src/io-events/provider/get');
jest.mock('../../../src/io-events/provider/create');
jest.mock('../../../src/io-events/provider/delete');

const MockedList = List as jest.MockedClass<typeof List>;
const MockedGet = Get as jest.MockedClass<typeof Get>;
const MockedCreate = Create as jest.MockedClass<typeof Create>;
const MockedDelete = Delete as jest.MockedClass<typeof Delete>;

describe('ProviderManager', () => {
  let providerManager: ProviderManager;
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

  const mockProvider: Provider = {
    id: 'test-provider-123',
    label: 'Test Provider',
    description: 'A test provider',
    source: 'test-source',
    provider_metadata: '3rd_party_custom_events',
    event_delivery_format: 'adobe_io',
    publisher: 'test-publisher',
  };

  const mockProviderData: ProviderInputModel = {
    label: 'Test Provider',
    description: 'A test provider for testing',
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock instances
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

    providerManager = new ProviderManager(
      validCredentials.clientId,
      validCredentials.consumerId,
      validCredentials.projectId,
      validCredentials.workspaceId,
      validCredentials.accessToken
    );
  });

  describe('Constructor', () => {
    it('should create ProviderManager instance', () => {
      expect(providerManager).toBeInstanceOf(ProviderManager);
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
    it('should list providers without query parameters', async () => {
      const expectedProviders = [mockProvider];
      mockListService.execute.mockResolvedValue(expectedProviders);

      const result = await providerManager.list();

      expect(result).toEqual(expectedProviders);
      expect(mockListService.execute).toHaveBeenCalledWith({});
    });

    it('should list providers with query parameters', async () => {
      const queryParams: ListProvidersQueryParams = {
        providerMetadataId: '3rd_party_custom_events',
        eventmetadata: true,
      };
      const expectedProviders = [mockProvider];
      mockListService.execute.mockResolvedValue(expectedProviders);

      const result = await providerManager.list(queryParams);

      expect(result).toEqual(expectedProviders);
      expect(mockListService.execute).toHaveBeenCalledWith(queryParams);
    });

    it('should handle empty results', async () => {
      mockListService.execute.mockResolvedValue([]);

      const result = await providerManager.list();

      expect(result).toEqual([]);
    });

    it('should re-throw IOEventsApiError from service', async () => {
      const ioError = new IOEventsApiError('Service error', 400, 'SERVICE_ERROR');
      mockListService.execute.mockRejectedValue(ioError);

      await expect(providerManager.list()).rejects.toThrow(IOEventsApiError);
      await expect(providerManager.list()).rejects.toThrow('Service error');
    });

    it('should wrap generic errors in IOEventsApiError', async () => {
      const genericError = new Error('Unexpected error');
      mockListService.execute.mockRejectedValue(genericError);

      await expect(providerManager.list()).rejects.toThrow(IOEventsApiError);

      try {
        await providerManager.list();
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toContain('Unexpected error in providers list');
        expect(ioError.statusCode).toBe(500);
        expect(ioError.errorCode).toBe('UNEXPECTED_ERROR');
      }
    });

    it('should handle non-Error objects', async () => {
      const nonErrorObject = { message: 'Not an error object' };
      mockListService.execute.mockRejectedValue(nonErrorObject);

      await expect(providerManager.list()).rejects.toThrow(IOEventsApiError);

      try {
        await providerManager.list();
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toContain('Unknown error');
      }
    });
  });

  describe('get', () => {
    const providerId = 'test-provider-123';

    it('should get provider by ID without query parameters', async () => {
      mockGetService.execute.mockResolvedValue(mockProvider);

      const result = await providerManager.get(providerId);

      expect(result).toEqual(mockProvider);
      expect(mockGetService.execute).toHaveBeenCalledWith(providerId, {});
    });

    it('should get provider by ID with query parameters', async () => {
      const queryParams: GetProviderQueryParams = { eventmetadata: true };
      mockGetService.execute.mockResolvedValue(mockProvider);

      const result = await providerManager.get(providerId, queryParams);

      expect(result).toEqual(mockProvider);
      expect(mockGetService.execute).toHaveBeenCalledWith(providerId, queryParams);
    });

    it('should re-throw IOEventsApiError from service', async () => {
      const ioError = new IOEventsApiError('Provider not found', 404, 'NOT_FOUND');
      mockGetService.execute.mockRejectedValue(ioError);

      await expect(providerManager.get(providerId)).rejects.toThrow(IOEventsApiError);
      await expect(providerManager.get(providerId)).rejects.toThrow('Provider not found');
    });

    it('should wrap generic errors in IOEventsApiError', async () => {
      const genericError = new Error('Network timeout');
      mockGetService.execute.mockRejectedValue(genericError);

      await expect(providerManager.get(providerId)).rejects.toThrow(IOEventsApiError);

      try {
        await providerManager.get(providerId);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toContain('Unexpected error in providers get');
        expect(ioError.statusCode).toBe(500);
        expect(ioError.errorCode).toBe('UNEXPECTED_ERROR');
      }
    });

    it('should handle non-Error objects in get', async () => {
      const nonErrorObject = 'string error';
      mockGetService.execute.mockRejectedValue(nonErrorObject);

      await expect(providerManager.get(providerId)).rejects.toThrow(IOEventsApiError);

      try {
        await providerManager.get(providerId);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toContain('Unknown error');
        expect(ioError.statusCode).toBe(500);
        expect(ioError.errorCode).toBe('UNEXPECTED_ERROR');
      }
    });
  });

  describe('create', () => {
    it('should create provider successfully', async () => {
      mockCreateService.execute.mockResolvedValue(mockProvider);

      const result = await providerManager.create(mockProviderData);

      expect(result).toEqual(mockProvider);
      expect(mockCreateService.execute).toHaveBeenCalledWith(mockProviderData);
    });

    it('should create provider with minimal data', async () => {
      const minimalData: ProviderInputModel = { label: 'Minimal Provider' };
      mockCreateService.execute.mockResolvedValue(mockProvider);

      const result = await providerManager.create(minimalData);

      expect(result).toEqual(mockProvider);
      expect(mockCreateService.execute).toHaveBeenCalledWith(minimalData);
    });

    it('should create provider with all optional fields', async () => {
      const fullData: ProviderInputModel = {
        label: 'Full Provider',
        description: 'Provider with all fields',
        docs_url: 'https://example.com/docs',
        provider_metadata: 'custom_metadata',
        instance_id: 'custom-instance',
        data_residency_region: 'irl1',
      };
      mockCreateService.execute.mockResolvedValue(mockProvider);

      const result = await providerManager.create(fullData);

      expect(result).toEqual(mockProvider);
      expect(mockCreateService.execute).toHaveBeenCalledWith(fullData);
    });

    it('should re-throw IOEventsApiError from service', async () => {
      const ioError = new IOEventsApiError('Validation failed', 400, 'VALIDATION_ERROR');
      mockCreateService.execute.mockRejectedValue(ioError);

      await expect(providerManager.create(mockProviderData)).rejects.toThrow(IOEventsApiError);
      await expect(providerManager.create(mockProviderData)).rejects.toThrow('Validation failed');
    });

    it('should wrap generic errors in IOEventsApiError', async () => {
      const genericError = new Error('Database connection failed');
      mockCreateService.execute.mockRejectedValue(genericError);

      await expect(providerManager.create(mockProviderData)).rejects.toThrow(IOEventsApiError);

      try {
        await providerManager.create(mockProviderData);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toContain('Unexpected error in providers create');
        expect(ioError.statusCode).toBe(500);
        expect(ioError.errorCode).toBe('UNEXPECTED_ERROR');
      }
    });

    it('should handle non-Error objects in create', async () => {
      const nonErrorObject = 42; // Number instead of Error
      mockCreateService.execute.mockRejectedValue(nonErrorObject);

      await expect(providerManager.create(mockProviderData)).rejects.toThrow(IOEventsApiError);

      try {
        await providerManager.create(mockProviderData);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toContain('Unknown error');
        expect(ioError.statusCode).toBe(500);
        expect(ioError.errorCode).toBe('UNEXPECTED_ERROR');
      }
    });
  });

  describe('delete', () => {
    const providerId = 'test-provider-123';

    it('should delete provider successfully', async () => {
      mockDeleteService.execute.mockResolvedValue(undefined);

      const result = await providerManager.delete(providerId);

      expect(result).toBeUndefined();
      expect(mockDeleteService.execute).toHaveBeenCalledWith(providerId);
    });

    it('should handle different provider ID formats', async () => {
      const providerIds = [
        'simple-id',
        'urn:uuid:12345678-1234-1234-1234-123456789012',
        'provider_with_underscores',
        'provider-with-hyphens',
      ];

      mockDeleteService.execute.mockResolvedValue(undefined);

      for (const id of providerIds) {
        await providerManager.delete(id);
        expect(mockDeleteService.execute).toHaveBeenCalledWith(id);
      }

      expect(mockDeleteService.execute).toHaveBeenCalledTimes(providerIds.length);
    });

    it('should re-throw IOEventsApiError from service', async () => {
      const ioError = new IOEventsApiError('Provider not found', 404, 'NOT_FOUND');
      mockDeleteService.execute.mockRejectedValue(ioError);

      await expect(providerManager.delete(providerId)).rejects.toThrow(IOEventsApiError);
      await expect(providerManager.delete(providerId)).rejects.toThrow('Provider not found');
    });

    it('should wrap generic errors in IOEventsApiError', async () => {
      const genericError = new Error('Permission denied');
      mockDeleteService.execute.mockRejectedValue(genericError);

      await expect(providerManager.delete(providerId)).rejects.toThrow(IOEventsApiError);

      try {
        await providerManager.delete(providerId);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toContain('Unexpected error in providers delete');
        expect(ioError.statusCode).toBe(500);
        expect(ioError.errorCode).toBe('UNEXPECTED_ERROR');
      }
    });

    it('should handle non-Error objects in delete', async () => {
      const nonErrorObject = null; // null instead of Error
      mockDeleteService.execute.mockRejectedValue(nonErrorObject);

      await expect(providerManager.delete(providerId)).rejects.toThrow(IOEventsApiError);

      try {
        await providerManager.delete(providerId);
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.message).toContain('Unknown error');
        expect(ioError.statusCode).toBe(500);
        expect(ioError.errorCode).toBe('UNEXPECTED_ERROR');
      }
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete provider lifecycle', async () => {
      // Create
      const createData: ProviderInputModel = {
        label: 'Lifecycle Test Provider',
        description: 'Provider for testing complete lifecycle',
      };
      const createdProvider = { ...mockProvider, id: 'lifecycle-provider-123' };
      mockCreateService.execute.mockResolvedValue(createdProvider);

      const createResult = await providerManager.create(createData);
      expect(createResult).toEqual(createdProvider);

      // Get
      mockGetService.execute.mockResolvedValue(createdProvider);
      const getResult = await providerManager.get(createdProvider.id);
      expect(getResult).toEqual(createdProvider);

      // List (should include the created provider)
      mockListService.execute.mockResolvedValue([createdProvider]);
      const listResult = await providerManager.list();
      expect(listResult).toContain(createdProvider);

      // Delete
      mockDeleteService.execute.mockResolvedValue(undefined);
      await providerManager.delete(createdProvider.id);
      expect(mockDeleteService.execute).toHaveBeenCalledWith(createdProvider.id);
    });

    it('should handle multiple providers with filtering', async () => {
      const provider1 = { ...mockProvider, id: 'provider-1', provider_metadata: 'metadata-1' };
      const provider2 = { ...mockProvider, id: 'provider-2', provider_metadata: 'metadata-2' };

      // List all providers
      mockListService.execute.mockResolvedValue([provider1, provider2]);
      const allProviders = await providerManager.list();
      expect(allProviders).toHaveLength(2);

      // List filtered providers
      const queryParams: ListProvidersQueryParams = {
        providerMetadataId: 'metadata-1',
      };
      mockListService.execute.mockResolvedValue([provider1]);
      const filteredProviders = await providerManager.list(queryParams);
      expect(filteredProviders).toHaveLength(1);
      expect(filteredProviders[0]).toEqual(provider1);
    });

    it('should handle error propagation across all methods', async () => {
      const testError = new IOEventsApiError('Test error', 500, 'TEST_ERROR');

      // Test error propagation for each method
      mockListService.execute.mockRejectedValue(testError);
      await expect(providerManager.list()).rejects.toThrow('Test error');

      mockGetService.execute.mockRejectedValue(testError);
      await expect(providerManager.get('test-id')).rejects.toThrow('Test error');

      mockCreateService.execute.mockRejectedValue(testError);
      await expect(providerManager.create(mockProviderData)).rejects.toThrow('Test error');

      mockDeleteService.execute.mockRejectedValue(testError);
      await expect(providerManager.delete('test-id')).rejects.toThrow('Test error');
    });
  });
});
