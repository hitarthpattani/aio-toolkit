/**
 * <license header>
 */

import CreateProviders from '../../../src/integration/onboard-events/create-providers';
import type { ParsedProvider } from '../../../src/integration/onboard-events/types';

// Mock the Adobe I/O SDK to avoid external dependencies
const mockLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

jest.mock('@adobe/aio-sdk', () => ({
  Core: {
    Logger: jest.fn(() => mockLogger),
  },
}));

// Mock ProviderManager to avoid real API calls
const mockProviderManager = {
  list: jest.fn(),
  create: jest.fn(),
};

jest.mock('../../../src/io-events', () => ({
  ProviderManager: jest.fn().mockImplementation(() => mockProviderManager),
}));

// Mock crypto randomUUID
jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => 'mock-uuid-12345'),
}));

describe('CreateProviders', () => {
  const validConfig = {
    consumerId: 'test-consumer-id',
    projectId: 'test-project-id',
    workspaceId: 'test-workspace-id',
    apiKey: 'test-api-key',
    accessToken: 'test-access-token',
    logger: mockLogger,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create instance with valid parameters', () => {
      const createProviders = new CreateProviders(
        validConfig.consumerId,
        validConfig.projectId,
        validConfig.workspaceId,
        validConfig.apiKey,
        validConfig.accessToken,
        validConfig.logger
      );

      expect(createProviders).toBeInstanceOf(CreateProviders);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[INIT] CreateProviders initialized with valid configuration'
      );
    });

    it('should throw error when consumerId is missing', () => {
      expect(() => {
        new CreateProviders(
          '',
          validConfig.projectId,
          validConfig.workspaceId,
          validConfig.apiKey,
          validConfig.accessToken,
          validConfig.logger
        );
      }).toThrow('Missing required configuration: consumerId');
    });

    it('should throw error when projectId is missing', () => {
      expect(() => {
        new CreateProviders(
          validConfig.consumerId,
          '',
          validConfig.workspaceId,
          validConfig.apiKey,
          validConfig.accessToken,
          validConfig.logger
        );
      }).toThrow('Missing required configuration: projectId');
    });

    it('should throw error when workspaceId is missing', () => {
      expect(() => {
        new CreateProviders(
          validConfig.consumerId,
          validConfig.projectId,
          '',
          validConfig.apiKey,
          validConfig.accessToken,
          validConfig.logger
        );
      }).toThrow('Missing required configuration: workspaceId');
    });

    it('should throw error when apiKey is missing', () => {
      expect(() => {
        new CreateProviders(
          validConfig.consumerId,
          validConfig.projectId,
          validConfig.workspaceId,
          '',
          validConfig.accessToken,
          validConfig.logger
        );
      }).toThrow('Missing required configuration: apiKey');
    });

    it('should throw error when accessToken is missing', () => {
      expect(() => {
        new CreateProviders(
          validConfig.consumerId,
          validConfig.projectId,
          validConfig.workspaceId,
          validConfig.apiKey,
          '',
          validConfig.logger
        );
      }).toThrow('Missing required configuration: accessToken');
    });

    it('should throw error when logger is null', () => {
      expect(() => {
        new CreateProviders(
          validConfig.consumerId,
          validConfig.projectId,
          validConfig.workspaceId,
          validConfig.apiKey,
          validConfig.accessToken,
          null as any
        );
      }).toThrow('Logger is required');
    });

    it('should throw error for multiple missing required fields', () => {
      expect(() => {
        new CreateProviders(
          '',
          '',
          validConfig.workspaceId,
          validConfig.apiKey,
          validConfig.accessToken,
          validConfig.logger
        );
      }).toThrow('Missing required configuration: consumerId, projectId');
    });

    it('should throw error for whitespace-only fields', () => {
      expect(() => {
        new CreateProviders(
          '   ',
          validConfig.projectId,
          validConfig.workspaceId,
          validConfig.apiKey,
          validConfig.accessToken,
          validConfig.logger
        );
      }).toThrow('Missing required configuration: consumerId');
    });
  });

  describe('getProviders', () => {
    let createProviders: CreateProviders;

    beforeEach(() => {
      createProviders = new CreateProviders(
        validConfig.consumerId,
        validConfig.projectId,
        validConfig.workspaceId,
        validConfig.apiKey,
        validConfig.accessToken,
        validConfig.logger
      );
    });

    it('should successfully fetch and map existing providers', async () => {
      const mockProviders = [
        {
          id: 'provider-1',
          label: 'Provider 1',
          description: 'Test provider 1',
          instance_id: 'instance-1',
        },
        {
          id: 'provider-2',
          label: 'Provider 2',
          description: 'Test provider 2',
        },
      ];

      mockProviderManager.list.mockResolvedValue(mockProviders);

      const result = await (createProviders as any).getProviders();

      expect(mockProviderManager.list).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(2);
      expect(result.get('Provider 1')).toEqual(mockProviders[0]);
      expect(result.get('Provider 2')).toEqual(mockProviders[1]);
      expect(mockLogger.debug).toHaveBeenCalledWith('[FETCH] Fetching existing providers...');
      expect(mockLogger.debug).toHaveBeenCalledWith('[INFO] Found 2 existing providers');
    });

    it('should handle empty provider list', async () => {
      mockProviderManager.list.mockResolvedValue([]);

      const result = await (createProviders as any).getProviders();

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
      expect(mockLogger.debug).toHaveBeenCalledWith('[INFO] Found 0 existing providers');
    });

    it('should handle provider fetch errors', async () => {
      const error = new Error('API Error');
      mockProviderManager.list.mockRejectedValue(error);

      await expect((createProviders as any).getProviders()).rejects.toThrow('API Error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        '[ERROR] Failed to fetch existing providers: API Error'
      );
    });
  });

  describe('isCommerceProvider', () => {
    let createProviders: CreateProviders;

    beforeEach(() => {
      createProviders = new CreateProviders(
        validConfig.consumerId,
        validConfig.projectId,
        validConfig.workspaceId,
        validConfig.apiKey,
        validConfig.accessToken,
        validConfig.logger
      );
    });

    it('should identify commerce provider by key', () => {
      const provider: ParsedProvider = {
        key: 'commerce-events',
        label: 'Some Provider',
        description: 'A provider',
        docsUrl: null,
      };

      const result = (createProviders as any).isCommerceProvider(provider);
      expect(result).toBe(true);
    });

    it('should identify magento provider by label', () => {
      const provider: ParsedProvider = {
        key: 'some-key',
        label: 'Magento Events',
        description: 'A provider',
        docsUrl: null,
      };

      const result = (createProviders as any).isCommerceProvider(provider);
      expect(result).toBe(true);
    });

    it('should identify adobe commerce provider by description', () => {
      const provider: ParsedProvider = {
        key: 'some-key',
        label: 'Some Provider',
        description: 'Adobe Commerce integration',
        docsUrl: null,
      };

      const result = (createProviders as any).isCommerceProvider(provider);
      expect(result).toBe(true);
    });

    it('should handle case insensitive matching', () => {
      const provider: ParsedProvider = {
        key: 'COMMERCE-events',
        label: 'Some Provider',
        description: 'A provider',
        docsUrl: null,
      };

      const result = (createProviders as any).isCommerceProvider(provider);
      expect(result).toBe(true);
    });

    it('should return false for non-commerce provider', () => {
      const provider: ParsedProvider = {
        key: 'regular-events',
        label: 'Regular Provider',
        description: 'A regular provider',
        docsUrl: null,
      };

      const result = (createProviders as any).isCommerceProvider(provider);
      expect(result).toBe(false);
    });

    it('should handle null/undefined description', () => {
      const provider: ParsedProvider = {
        key: 'regular-events',
        label: 'Regular Provider',
        description: null as any,
        docsUrl: null,
      };

      const result = (createProviders as any).isCommerceProvider(provider);
      expect(result).toBe(false);
    });
  });

  describe('preparePayload', () => {
    let createProviders: CreateProviders;

    beforeEach(() => {
      createProviders = new CreateProviders(
        validConfig.consumerId,
        validConfig.projectId,
        validConfig.workspaceId,
        validConfig.apiKey,
        validConfig.accessToken,
        validConfig.logger
      );
    });

    it('should prepare basic payload with required fields', () => {
      const provider: ParsedProvider = {
        key: 'test-provider',
        label: 'Test Provider',
        description: 'Test description',
        docsUrl: 'https://docs.test.com',
      };

      const result = (createProviders as any).preparePayload(provider, 'Enhanced Test Provider');

      expect(result).toEqual({
        label: 'Enhanced Test Provider',
        description: 'Test description',
        docs_url: 'https://docs.test.com',
      });
    });

    it('should prepare commerce provider payload with metadata', () => {
      const provider: ParsedProvider = {
        key: 'commerce-events',
        label: 'Commerce Provider',
        description: 'Commerce description',
        docsUrl: 'https://docs.commerce.com',
      };

      const result = (createProviders as any).preparePayload(
        provider,
        'Enhanced Commerce Provider'
      );

      expect(result).toEqual({
        label: 'Enhanced Commerce Provider',
        description: 'Commerce description',
        docs_url: 'https://docs.commerce.com',
        provider_metadata: 'dx_commerce_events',
        instance_id: 'mock-uuid-12345',
      });
    });

    it('should handle provider without description', () => {
      const provider: ParsedProvider = {
        key: 'test-provider',
        label: 'Test Provider',
        description: '',
        docsUrl: null,
      };

      const result = (createProviders as any).preparePayload(provider, 'Enhanced Test Provider');

      expect(result).toEqual({
        label: 'Enhanced Test Provider',
      });
    });

    it('should handle provider without docsUrl', () => {
      const provider: ParsedProvider = {
        key: 'test-provider',
        label: 'Test Provider',
        description: 'Test description',
        docsUrl: null,
      };

      const result = (createProviders as any).preparePayload(provider, 'Enhanced Test Provider');

      expect(result).toEqual({
        label: 'Enhanced Test Provider',
        description: 'Test description',
      });
    });
  });

  describe('process', () => {
    let createProviders: CreateProviders;

    beforeEach(() => {
      createProviders = new CreateProviders(
        validConfig.consumerId,
        validConfig.projectId,
        validConfig.workspaceId,
        validConfig.apiKey,
        validConfig.accessToken,
        validConfig.logger
      );

      // Mock getProviders to return empty map by default
      mockProviderManager.list.mockResolvedValue([]);
    });

    const sampleProviders: ParsedProvider[] = [
      {
        key: 'provider1',
        label: 'Provider 1',
        description: 'Test provider 1',
        docsUrl: 'https://docs.provider1.com',
      },
    ];

    it('should successfully create new providers', async () => {
      const mockCreatedProvider = {
        id: 'created-provider-id',
        instance_id: 'created-instance-id',
        label: 'Test Project - Provider 1',
        description: 'Test provider 1',
        docs_url: 'https://docs.provider1.com',
      };

      mockProviderManager.create.mockResolvedValue(mockCreatedProvider);

      const result = await createProviders.process(sampleProviders, 'Test Project');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        created: true,
        skipped: false,
        provider: {
          id: 'created-provider-id',
          instanceId: 'created-instance-id',
          key: 'provider1',
          label: 'Test Project - Provider 1',
          originalLabel: 'Provider 1',
          description: 'Test provider 1',
          docsUrl: 'https://docs.provider1.com',
        },
        raw: mockCreatedProvider,
      });

      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[CREATE] Creating providers for project: Test Project'
      );
      expect(mockLogger.debug).toHaveBeenCalledWith('[INFO] Processing 1 provider(s)...');
      expect(mockProviderManager.create).toHaveBeenCalledTimes(1);
    });

    it('should skip existing providers', async () => {
      const existingProvider = {
        id: 'existing-provider-id',
        instance_id: 'existing-instance-id',
        label: 'Test Project - Provider 1',
        description: 'Existing provider',
      };

      mockProviderManager.list.mockResolvedValue([existingProvider]);

      const result = await createProviders.process(sampleProviders, 'Test Project');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        created: false,
        skipped: true,
        provider: {
          id: 'existing-provider-id',
          instanceId: 'existing-instance-id',
          key: 'provider1',
          label: 'Test Project - Provider 1',
          originalLabel: 'Provider 1',
          description: 'Test provider 1',
          docsUrl: 'https://docs.provider1.com',
        },
        reason: 'Already exists',
        raw: existingProvider,
      });

      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[SKIP] Provider already exists - skipping creation'
      );
      expect(mockProviderManager.create).not.toHaveBeenCalled();
    });

    it('should handle provider creation errors', async () => {
      const error = new Error('API Error');
      mockProviderManager.create.mockRejectedValue(error);

      const result = await createProviders.process(sampleProviders, 'Test Project');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        created: false,
        skipped: false,
        error: 'API Error',
        provider: {
          key: 'provider1',
          label: 'Test Project - Provider 1',
          originalLabel: 'Provider 1',
          description: 'Test provider 1',
          docsUrl: 'https://docs.provider1.com',
        },
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        '[ERROR] Failed to create provider "Test Project - Provider 1": API Error'
      );
    });

    it('should handle overall process errors', async () => {
      const error = new Error('General Error');
      mockProviderManager.list.mockRejectedValue(error);

      await expect(createProviders.process(sampleProviders, 'Test Project')).rejects.toThrow(
        'General Error'
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        '[ERROR] Provider creation failed: General Error'
      );
    });

    it('should handle multiple providers', async () => {
      const multipleProviders: ParsedProvider[] = [
        {
          key: 'provider1',
          label: 'Provider 1',
          description: 'Test provider 1',
          docsUrl: 'https://docs.provider1.com',
        },
        {
          key: 'provider2',
          label: 'Provider 2',
          description: 'Test provider 2',
          docsUrl: null,
        },
      ];

      const mockCreated1 = {
        id: 'provider-id-1',
        label: 'Test Project - Provider 1',
        description: 'Test provider 1',
        docs_url: 'https://docs.provider1.com',
      };

      const mockCreated2 = {
        id: 'provider-id-2',
        label: 'Test Project - Provider 2',
        description: 'Test provider 2',
      };

      mockProviderManager.create
        .mockResolvedValueOnce(mockCreated1)
        .mockResolvedValueOnce(mockCreated2);

      const result = await createProviders.process(multipleProviders, 'Test Project');

      expect(result).toHaveLength(2);
      expect(result[0].provider.key).toBe('provider1');
      expect(result[1].provider.key).toBe('provider2');
      expect(mockProviderManager.create).toHaveBeenCalledTimes(2);
    });

    it('should use default project name when not provided', async () => {
      const mockCreatedProvider = {
        id: 'created-provider-id',
        label: 'Unknown Project - Provider 1',
        description: 'Test provider 1',
      };

      mockProviderManager.create.mockResolvedValue(mockCreatedProvider);

      await createProviders.process(sampleProviders);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[CREATE] Creating providers for project: Unknown Project'
      );
    });

    it('should handle commerce providers with special metadata', async () => {
      const commerceProviders: ParsedProvider[] = [
        {
          key: 'commerce-events',
          label: 'Commerce Provider',
          description: 'Adobe Commerce events',
          docsUrl: null,
        },
      ];

      const mockCreatedProvider = {
        id: 'commerce-provider-id',
        label: 'Test Project - Commerce Provider',
        description: 'Adobe Commerce events',
        provider_metadata: 'dx_commerce_events',
        instance_id: 'mock-uuid-12345',
      };

      mockProviderManager.create.mockResolvedValue(mockCreatedProvider);

      const result = await createProviders.process(commerceProviders, 'Test Project');

      expect(result).toHaveLength(1);
      expect(result[0].created).toBe(true);
      expect(result[0].provider.instanceId).toBe('mock-uuid-12345');

      // Verify commerce-specific payload was sent
      expect(mockProviderManager.create).toHaveBeenCalledWith({
        label: 'Test Project - Commerce Provider',
        description: 'Adobe Commerce events',
        provider_metadata: 'dx_commerce_events',
        instance_id: 'mock-uuid-12345',
      });
    });

    it('should handle provider without instance_id in response', async () => {
      const mockCreatedProvider = {
        id: 'created-provider-id',
        label: 'Test Project - Provider 1',
        description: 'Test provider 1',
        // No instance_id field
      };

      mockProviderManager.create.mockResolvedValue(mockCreatedProvider);

      const result = await createProviders.process(sampleProviders, 'Test Project');

      expect(result).toHaveLength(1);
      expect(result[0].provider).not.toHaveProperty('instanceId');
      expect(result[0].provider).toEqual({
        id: 'created-provider-id',
        key: 'provider1',
        label: 'Test Project - Provider 1',
        originalLabel: 'Provider 1',
        description: 'Test provider 1',
        docsUrl: 'https://docs.provider1.com',
      });
    });
  });
});
