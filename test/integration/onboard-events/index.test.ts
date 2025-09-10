/**
 * <license header>
 */

import { OnboardEvents } from '../../../src/integration';
import type { OnboardProviders } from '../../../src/integration';
import CreateProviders from '../../../src/integration/onboard-events/create-providers';

// Mock the Adobe I/O SDK to avoid external dependencies
jest.mock('@adobe/aio-sdk', () => ({
  Core: {
    Logger: jest.fn((_name: string, _options: any) => ({
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    })),
  },
}));

// Mock ProviderManager to avoid real API calls
jest.mock('../../../src/io-events', () => ({
  ProviderManager: jest.fn().mockImplementation(() => ({
    list: jest.fn().mockResolvedValue([
      {
        id: 'existing-provider-1',
        label: 'Test Project - Existing Provider',
        instance_id: 'existing-instance-1',
        description: 'An existing provider',
        docs_url: null,
      },
    ]),
    create: jest.fn().mockResolvedValue({
      id: 'new-provider-123',
      label: 'Test Project - Test Provider',
      instance_id: 'new-instance-456',
      description: 'Test provider for response validation',
      docs_url: 'https://example.com/test-docs',
    }),
  })),
}));

describe('OnboardEvents', () => {
  const validParams = {
    projectName: 'Test Project',
    consumerId: 'test-consumer-id',
    projectId: 'test-project-id',
    workspaceId: 'test-workspace-id',
    apiKey: 'test-api-key',
    accessToken: 'test-access-token',
  };

  const mockProviders: OnboardProviders = [
    {
      key: 'ocp',
      label: 'HPattani Arcteryx - OCP Provider v1.0',
      description: 'Arcteryx - OCP Provider that will receive events from ocp system',
      docs_url: null,
    },
    {
      key: 'magento',
      label: 'Magento Commerce Provider',
      description: 'Provider for Magento Commerce events',
      docs_url: 'https://docs.magento.com',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create OnboardEvents instance with valid parameters', () => {
      const onboardEvents = new OnboardEvents(
        validParams.projectName,
        validParams.consumerId,
        validParams.projectId,
        validParams.workspaceId,
        validParams.apiKey,
        validParams.accessToken
      );

      expect(onboardEvents).toBeInstanceOf(OnboardEvents);
    });

    it('should throw error for empty project name', () => {
      expect(() => {
        new OnboardEvents(
          '',
          validParams.consumerId,
          validParams.projectId,
          validParams.workspaceId,
          validParams.apiKey,
          validParams.accessToken
        );
      }).toThrow('Project name is required');
    });

    it('should throw error for empty consumer ID', () => {
      expect(() => {
        new OnboardEvents(
          validParams.projectName,
          '',
          validParams.projectId,
          validParams.workspaceId,
          validParams.apiKey,
          validParams.accessToken
        );
      }).toThrow('Consumer ID is required');
    });

    it('should throw error for empty project ID', () => {
      expect(() => {
        new OnboardEvents(
          validParams.projectName,
          validParams.consumerId,
          '',
          validParams.workspaceId,
          validParams.apiKey,
          validParams.accessToken
        );
      }).toThrow('Project ID is required');
    });

    it('should throw error for empty workspace ID', () => {
      expect(() => {
        new OnboardEvents(
          validParams.projectName,
          validParams.consumerId,
          validParams.projectId,
          '',
          validParams.apiKey,
          validParams.accessToken
        );
      }).toThrow('Workspace ID is required');
    });

    it('should throw error for empty API key', () => {
      expect(() => {
        new OnboardEvents(
          validParams.projectName,
          validParams.consumerId,
          validParams.projectId,
          validParams.workspaceId,
          '',
          validParams.accessToken
        );
      }).toThrow('API key is required');
    });

    it('should throw error for empty access token', () => {
      expect(() => {
        new OnboardEvents(
          validParams.projectName,
          validParams.consumerId,
          validParams.projectId,
          validParams.workspaceId,
          validParams.apiKey,
          ''
        );
      }).toThrow('Access token is required');
    });

    it('should create logger with properly formatted name', () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Core } = require('@adobe/aio-sdk');

      new OnboardEvents(
        'My Adobe Commerce Project!',
        validParams.consumerId,
        validParams.projectId,
        validParams.workspaceId,
        validParams.apiKey,
        validParams.accessToken
      );

      expect(Core.Logger).toHaveBeenCalledWith('my-adobe-commerce-project-onboard-events', {
        level: 'debug',
      });
    });

    it('should handle special characters in project name for logger', () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Core } = require('@adobe/aio-sdk');

      new OnboardEvents(
        'Project_123  &  Test!!!',
        validParams.consumerId,
        validParams.projectId,
        validParams.workspaceId,
        validParams.apiKey,
        validParams.accessToken
      );

      expect(Core.Logger).toHaveBeenCalledWith('project_123-test-onboard-events', {
        level: 'debug',
      });
    });

    it('should handle project name with multiple spaces and underscores', () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Core } = require('@adobe/aio-sdk');

      new OnboardEvents(
        '  Project___Name   With    Spaces  ',
        validParams.consumerId,
        validParams.projectId,
        validParams.workspaceId,
        validParams.apiKey,
        validParams.accessToken
      );

      expect(Core.Logger).toHaveBeenCalledWith('-project_name-with-spaces--onboard-events', {
        level: 'debug',
      });
    });

    it('should handle project name with only special characters', () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Core } = require('@adobe/aio-sdk');

      new OnboardEvents(
        '!!!@#$%%%',
        validParams.consumerId,
        validParams.projectId,
        validParams.workspaceId,
        validParams.apiKey,
        validParams.accessToken
      );

      expect(Core.Logger).toHaveBeenCalledWith('-onboard-events', { level: 'debug' });
    });
  });

  describe('process', () => {
    let onboardEvents: OnboardEvents;
    let mockLogger: any;

    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Core } = require('@adobe/aio-sdk');
      mockLogger = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };
      Core.Logger.mockReturnValue(mockLogger);

      onboardEvents = new OnboardEvents(
        validParams.projectName,
        validParams.consumerId,
        validParams.projectId,
        validParams.workspaceId,
        validParams.apiKey,
        validParams.accessToken
      );
    });

    it('should process providers successfully', async () => {
      const result = await onboardEvents.process(mockProviders);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        `🚀 Processing onboard events for project: ${validParams.projectName} (${validParams.projectId}) with ${mockProviders.length} providers`
      );
      // Verify return value structure (from OnboardEventsResponse tests)
      expect(result).toHaveProperty('createdProviders');
      expect(Array.isArray(result.createdProviders)).toBe(true);
    });

    it('should process empty providers array', async () => {
      const emptyProviders: OnboardProviders = [];

      const result = await onboardEvents.process(emptyProviders);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        `🚀 Processing onboard events for project: ${validParams.projectName} (${validParams.projectId}) with 0 providers`
      );
      // Verify return value structure
      expect(result).toHaveProperty('createdProviders');
      expect(Array.isArray(result.createdProviders)).toBe(true);
      expect(result.createdProviders).toHaveLength(0);
    });

    it('should process single provider', async () => {
      const singleProvider: OnboardProviders = [mockProviders[0]];

      const result = await onboardEvents.process(singleProvider);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        `🚀 Processing onboard events for project: ${validParams.projectName} (${validParams.projectId}) with 1 providers`
      );
      // Verify return value structure
      expect(result).toHaveProperty('createdProviders');
      expect(Array.isArray(result.createdProviders)).toBe(true);
      expect(result.createdProviders).toHaveLength(1);
    });

    it('should handle providers with long labels', async () => {
      const longLabelProviders: OnboardProviders = [
        {
          key: 'test',
          label:
            'A very long provider label that exceeds normal expectations and continues for a while to test edge cases',
          description: 'Test provider with long label',
          docs_url: null,
        },
      ];

      const result = await onboardEvents.process(longLabelProviders);

      // Verify return value structure
      expect(result).toHaveProperty('createdProviders');
      expect(Array.isArray(result.createdProviders)).toBe(true);
    });

    it('should handle providers with special characters in labels', async () => {
      const specialCharProviders: OnboardProviders = [
        {
          key: 'special-test',
          label: 'Provider with émojis 🚀 and spécial châractérs!',
          description: 'Test provider with special characters',
          docs_url: null,
        },
      ];

      const result = await onboardEvents.process(specialCharProviders);

      // Verify return value structure
      expect(result).toHaveProperty('createdProviders');
      expect(Array.isArray(result.createdProviders)).toBe(true);
    });
  });

  describe('Logger Name Generation', () => {
    it('should generate consistent logger names', () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Core } = require('@adobe/aio-sdk');

      // Create multiple instances with same project name
      new OnboardEvents(
        'Consistent Project',
        validParams.consumerId,
        validParams.projectId,
        validParams.workspaceId,
        validParams.apiKey,
        validParams.accessToken
      );

      new OnboardEvents(
        'Consistent Project',
        'different-consumer',
        'different-project',
        'different-workspace',
        'different-api-key',
        'different-token'
      );

      // Both should generate the same logger name
      expect(Core.Logger).toHaveBeenCalledWith('consistent-project-onboard-events', {
        level: 'debug',
      });
      expect(Core.Logger).toHaveBeenCalledTimes(2);
    });

    it('should handle edge case with numbers and mixed case', () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Core } = require('@adobe/aio-sdk');

      new OnboardEvents(
        'Project123_Test-CASE',
        validParams.consumerId,
        validParams.projectId,
        validParams.workspaceId,
        validParams.apiKey,
        validParams.accessToken
      );

      expect(Core.Logger).toHaveBeenCalledWith('project123_test-case-onboard-events', {
        level: 'debug',
      });
    });

    it('should handle project name with only numbers', () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Core } = require('@adobe/aio-sdk');

      new OnboardEvents(
        '12345',
        validParams.consumerId,
        validParams.projectId,
        validParams.workspaceId,
        validParams.apiKey,
        validParams.accessToken
      );

      expect(Core.Logger).toHaveBeenCalledWith('12345-onboard-events', { level: 'debug' });
    });
  });

  describe('getLogger', () => {
    it('should return the configured logger instance', () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Core } = require('@adobe/aio-sdk');
      const mockLogger = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };
      Core.Logger.mockReturnValue(mockLogger);

      const onboardEvents = new OnboardEvents(
        validParams.projectName,
        validParams.consumerId,
        validParams.projectId,
        validParams.workspaceId,
        validParams.apiKey,
        validParams.accessToken
      );

      const logger = onboardEvents.getLogger();

      expect(logger).toBe(mockLogger);
      expect(logger).toHaveProperty('debug');
      expect(logger).toHaveProperty('info');
      expect(logger).toHaveProperty('warn');
      expect(logger).toHaveProperty('error');
    });

    it('should allow external logging with the same logger instance', () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Core } = require('@adobe/aio-sdk');
      const mockLogger = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };
      Core.Logger.mockReturnValue(mockLogger);

      const onboardEvents = new OnboardEvents(
        validParams.projectName,
        validParams.consumerId,
        validParams.projectId,
        validParams.workspaceId,
        validParams.apiKey,
        validParams.accessToken
      );

      const logger = onboardEvents.getLogger();

      // Use the logger for external logging
      logger.info('External log message');
      logger.warn('External warning message');
      logger.error('External error message');

      expect(mockLogger.info).toHaveBeenCalledWith('External log message');
      expect(mockLogger.warn).toHaveBeenCalledWith('External warning message');
      expect(mockLogger.error).toHaveBeenCalledWith('External error message');
    });

    it('should return the same logger instance across multiple calls', () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Core } = require('@adobe/aio-sdk');
      const mockLogger = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };
      Core.Logger.mockReturnValue(mockLogger);

      const onboardEvents = new OnboardEvents(
        validParams.projectName,
        validParams.consumerId,
        validParams.projectId,
        validParams.workspaceId,
        validParams.apiKey,
        validParams.accessToken
      );

      const logger1 = onboardEvents.getLogger();
      const logger2 = onboardEvents.getLogger();

      expect(logger1).toBe(logger2);
      expect(logger1).toBe(mockLogger);
    });
  });

  describe('Integration Tests', () => {
    it('should work end-to-end with realistic scenario', async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Core } = require('@adobe/aio-sdk');
      const mockLogger = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };
      Core.Logger.mockReturnValue(mockLogger);

      const onboardEvents = new OnboardEvents(
        'Adobe Commerce Production',
        'prod-consumer-123',
        'prod-project-456',
        'prod-workspace-789',
        'prod-api-key-abc',
        'prod-access-token-xyz'
      );

      const realisticProviders: OnboardProviders = [
        {
          key: 'commerce-events',
          label: 'Adobe Commerce Events Provider',
          description: 'Provider for Adobe Commerce storefront and admin events',
          docs_url: 'https://developer.adobe.com/commerce/extensibility/',
        },
        {
          key: 'inventory-sync',
          label: 'Inventory Synchronization Provider',
          description: 'Real-time inventory updates across multiple channels',
          docs_url: null,
        },
      ];

      const result = await onboardEvents.process(realisticProviders);

      // Verify return value structure
      expect(result).toHaveProperty('createdProviders');
      expect(Array.isArray(result.createdProviders)).toBe(true);

      // Verify logger was created with correct name
      expect(Core.Logger).toHaveBeenCalledWith('adobe-commerce-production-onboard-events', {
        level: 'debug',
      });

      // Verify processing logs
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '🚀 Processing onboard events for project: Adobe Commerce Production (prod-project-456) with 2 providers'
      );

      // Verify return value structure
      expect(result).toHaveProperty('createdProviders');
      expect(Array.isArray(result.createdProviders)).toBe(true);
    });

    it('should work end-to-end with getLogger for external logging', async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Core } = require('@adobe/aio-sdk');
      const mockLogger = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };
      Core.Logger.mockReturnValue(mockLogger);

      const onboardEvents = new OnboardEvents(
        'E-commerce Platform',
        'ecommerce-consumer-456',
        'ecommerce-project-789',
        'ecommerce-workspace-012',
        'ecommerce-api-key-def',
        'ecommerce-access-token-ghi'
      );

      const providers: OnboardProviders = [
        {
          key: 'payment-gateway',
          label: 'Payment Gateway Provider',
          description: 'Payment processing events provider',
          docs_url: 'https://example.com/payment-docs',
        },
      ];

      // Use the logger externally before processing
      const logger = onboardEvents.getLogger();
      logger.info('Starting onboard event processing workflow');

      const result = await onboardEvents.process(providers);

      // Verify return value structure
      expect(result).toHaveProperty('createdProviders');
      expect(Array.isArray(result.createdProviders)).toBe(true);

      // Use the logger externally after processing
      logger.info('Completed onboard event processing workflow');

      // Verify all logging calls
      expect(Core.Logger).toHaveBeenCalledWith('e-commerce-platform-onboard-events', {
        level: 'debug',
      });
      expect(mockLogger.info).toHaveBeenCalledWith('Starting onboard event processing workflow');
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '🚀 Processing onboard events for project: E-commerce Platform (ecommerce-project-789) with 1 providers'
      );
      expect(mockLogger.info).toHaveBeenCalledWith('Completed onboard event processing workflow');

      expect(mockLogger.info).toHaveBeenCalledTimes(2);
    });

    it('should handle provider creation failures', async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Core } = require('@adobe/aio-sdk');
      const mockLogger = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };
      Core.Logger.mockReturnValue(mockLogger);

      // Mock ProviderManager to simulate failures
      const mockProviderManager = {
        list: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockRejectedValue(new Error('Provider creation failed')),
      };
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const ioEventsMock = require('../../../src/io-events');
      ioEventsMock.ProviderManager.mockImplementation(() => mockProviderManager);

      const onboardEvents = new OnboardEvents(
        'Failure Test Project',
        'failure-consumer-123',
        'failure-project-456',
        'failure-workspace-789',
        'failure-api-key-abc',
        'failure-access-token-def'
      );

      const testProviders: OnboardProviders = [
        {
          key: 'failing-provider',
          label: 'Failing Provider',
          description: 'This provider will fail',
          docs_url: null,
        },
      ];

      const result = await onboardEvents.process(testProviders);

      // Verify failed provider result structure
      expect(result).toHaveProperty('createdProviders');
      expect(result.createdProviders).toHaveLength(1);
      expect(result.createdProviders[0].created).toBe(false);
      expect(result.createdProviders[0].skipped).toBe(false);
      expect(result.createdProviders[0]).toHaveProperty('error');
      expect(result.createdProviders[0].error).toBe('Provider creation failed');

      // Verify summary logging with failures
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '📊 Provider creation summary: 0 created, 0 skipped, 1 failed'
      );
    });

    it('should handle existing providers (skipped scenario)', async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Core } = require('@adobe/aio-sdk');
      const mockLogger = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };
      Core.Logger.mockReturnValue(mockLogger);

      // Mock ProviderManager to return existing providers
      const mockProviderManager = {
        list: jest.fn().mockResolvedValue([
          {
            id: 'existing-provider-123',
            label: 'Skipped Test Project - Existing Provider',
            instance_id: 'existing-instance-456',
            description: 'This provider already exists',
            docs_url: 'https://example.com/docs',
          },
        ]),
        create: jest.fn(), // This should not be called
      };
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const ioEventsMock = require('../../../src/io-events');
      ioEventsMock.ProviderManager.mockImplementation(() => mockProviderManager);

      const onboardEvents = new OnboardEvents(
        'Skipped Test Project',
        'skipped-consumer-123',
        'skipped-project-456',
        'skipped-workspace-789',
        'skipped-api-key-abc',
        'skipped-access-token-def'
      );

      const testProviders: OnboardProviders = [
        {
          key: 'existing-provider',
          label: 'Existing Provider',
          description: 'This provider already exists',
          docs_url: 'https://example.com/docs',
        },
      ];

      const result = await onboardEvents.process(testProviders);

      // Verify skipped provider result structure
      expect(result).toHaveProperty('createdProviders');
      expect(result.createdProviders).toHaveLength(1);
      expect(result.createdProviders[0].created).toBe(false);
      expect(result.createdProviders[0].skipped).toBe(true);
      expect(result.createdProviders[0].reason).toBe('Already exists');
      expect(result.createdProviders[0].provider.id).toBe('existing-provider-123');

      // Verify summary logging with skipped providers
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '📊 Provider creation summary: 0 created, 1 skipped, 0 failed'
      );

      // Verify skipping logs were called
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '⏭️ Provider already exists - skipping creation'
      );
      expect(mockLogger.debug).toHaveBeenCalledWith('🆔 Existing ID: existing-provider-123');

      // Verify create was never called since provider exists
      expect(mockProviderManager.create).not.toHaveBeenCalled();
    });

    it('should handle mixed results (created, skipped, failed)', async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Core } = require('@adobe/aio-sdk');
      const mockLogger = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };
      Core.Logger.mockReturnValue(mockLogger);

      let createCallCount = 0;
      // Mock ProviderManager with mixed scenarios
      const mockProviderManager = {
        list: jest.fn().mockResolvedValue([
          {
            id: 'existing-mixed-provider',
            label: 'Mixed Test Project - Existing Provider',
            instance_id: 'existing-mixed-instance',
            description: 'This provider already exists',
            docs_url: null,
          },
        ]),
        create: jest.fn().mockImplementation(() => {
          createCallCount++;
          if (createCallCount === 1) {
            // First call succeeds
            return Promise.resolve({
              id: 'new-mixed-provider',
              label: 'Mixed Test Project - New Provider',
              instance_id: 'new-mixed-instance',
              description: 'This is a new provider',
              docs_url: 'https://example.com/new',
            });
          } else {
            // Second call fails
            return Promise.reject(new Error('Mixed creation failed'));
          }
        }),
      };
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const ioEventsMock = require('../../../src/io-events');
      ioEventsMock.ProviderManager.mockImplementation(() => mockProviderManager);

      const onboardEvents = new OnboardEvents(
        'Mixed Test Project',
        'mixed-consumer-123',
        'mixed-project-456',
        'mixed-workspace-789',
        'mixed-api-key-abc',
        'mixed-access-token-def'
      );

      const testProviders: OnboardProviders = [
        {
          key: 'existing-provider',
          label: 'Existing Provider',
          description: 'This provider already exists',
          docs_url: null,
        },
        {
          key: 'new-provider',
          label: 'New Provider',
          description: 'This is a new provider',
          docs_url: 'https://example.com/new',
        },
        {
          key: 'failing-provider',
          label: 'Failing Provider',
          description: 'This provider will fail',
          docs_url: null,
        },
      ];

      const result = await onboardEvents.process(testProviders);

      // Verify mixed results structure
      expect(result).toHaveProperty('createdProviders');
      expect(result.createdProviders).toHaveLength(3);

      // First provider: skipped (existing)
      expect(result.createdProviders[0].created).toBe(false);
      expect(result.createdProviders[0].skipped).toBe(true);
      expect(result.createdProviders[0].reason).toBe('Already exists');

      // Second provider: created (new)
      expect(result.createdProviders[1].created).toBe(true);
      expect(result.createdProviders[1].skipped).toBe(false);
      expect(result.createdProviders[1].provider.id).toBe('new-mixed-provider');

      // Third provider: failed
      expect(result.createdProviders[2].created).toBe(false);
      expect(result.createdProviders[2].skipped).toBe(false);
      expect(result.createdProviders[2]).toHaveProperty('error');
      expect(result.createdProviders[2].error).toBe('Mixed creation failed');

      // Verify summary logging with all three states
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '📊 Provider creation summary: 1 created, 1 skipped, 1 failed'
      );

      // Verify error logging was called for the failed provider
      expect(mockLogger.error).toHaveBeenCalledWith(
        '❌ Failed to create provider "Mixed Test Project - Failing Provider": Mixed creation failed'
      );
    });

    it('should handle errors in getProviders method', async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Core } = require('@adobe/aio-sdk');
      const mockLogger = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };
      Core.Logger.mockReturnValue(mockLogger);

      // Mock ProviderManager to throw error during list()
      const mockProviderManager = {
        list: jest.fn().mockRejectedValue(new Error('Failed to fetch existing providers')),
        create: jest.fn(),
      };
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const ioEventsMock = require('../../../src/io-events');
      ioEventsMock.ProviderManager.mockImplementation(() => mockProviderManager);

      const onboardEvents = new OnboardEvents(
        'Provider Fetch Error Test',
        'fetch-error-consumer-123',
        'fetch-error-project-456',
        'fetch-error-workspace-789',
        'fetch-error-api-key-abc',
        'fetch-error-access-token-def'
      );

      const testProviders: OnboardProviders = [
        {
          key: 'test-provider',
          label: 'Test Provider',
          description: 'This will trigger a fetch error',
          docs_url: null,
        },
      ];

      // Expect the error to be thrown
      await expect(onboardEvents.process(testProviders)).rejects.toThrow(
        'Failed to fetch existing providers'
      );

      // Verify error logging in getProviders method (lines 157-158)
      expect(mockLogger.error).toHaveBeenCalledWith(
        '❌ Failed to fetch existing providers: Failed to fetch existing providers'
      );

      // Verify error logging in process method (lines 115-116)
      expect(mockLogger.error).toHaveBeenCalledWith(
        '❌ Provider creation failed: Failed to fetch existing providers'
      );
    });

    it('should handle constructor validation errors in CreateProviders', async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Core } = require('@adobe/aio-sdk');
      const mockLogger = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };
      Core.Logger.mockReturnValue(mockLogger);

      // Test missing configuration parameters (line 64)
      expect(() => {
        new OnboardEvents(
          'Validation Error Test',
          '', // Missing consumerId
          'validation-project-456',
          'validation-workspace-789',
          'validation-api-key-abc',
          'validation-access-token-def'
        );
      }).toThrow('Consumer ID is required');

      // Test missing logger scenario would be harder to test directly
      // as logger is always created in OnboardEvents constructor
      // But we can create CreateProviders directly to test this

      expect(() => {
        new CreateProviders(
          'consumer-id',
          'project-id',
          'workspace-id',
          'api-key',
          'access-token',
          null // Missing logger
        );
      }).toThrow('Logger is required');

      // Test empty configuration values (also covers line 64)
      expect(() => {
        new CreateProviders(
          '', // Empty consumerId
          'project-id',
          'workspace-id',
          'api-key',
          'access-token',
          mockLogger
        );
      }).toThrow('Missing required configuration: consumerId');
    });

    it('should handle edge cases for complete branch coverage', async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Core } = require('@adobe/aio-sdk');
      const mockLogger = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };
      Core.Logger.mockReturnValue(mockLogger);

      // Mock ProviderManager for edge case testing
      const mockProviderManager = {
        list: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({
          id: 'edge-case-provider-123',
          label: 'Edge Case Project - Test Provider',
          instance_id: 'edge-case-instance-456',
          description: undefined,
          docs_url: null,
        }),
      };
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const ioEventsMock = require('../../../src/io-events');
      ioEventsMock.ProviderManager.mockImplementation(() => mockProviderManager);

      // Test default projectName parameter (line 86) and provider without description (line 254)
      const createProviders = new CreateProviders(
        'edge-case-consumer-123',
        'edge-case-project-456',
        'edge-case-workspace-789',
        'edge-case-api-key-abc',
        'edge-case-access-token-def',
        mockLogger
      );

      const testProviders: OnboardProviders = [
        {
          key: 'test-no-description',
          label: 'Provider Without Description',
          description: '', // Empty description to test preparePayload branch
          docs_url: null,
        },
        {
          key: 'test-null-description',
          label: 'Provider With Null Description',
          description: undefined as any, // Undefined description to test _isCommerceProvider branch
          docs_url: null,
        },
      ];

      // Call process without projectName to test default parameter (line 86)
      const results = await createProviders.process(testProviders);

      // Verify default project name was used in logging
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '🏭 Creating providers for project: Unknown Project'
      );

      // Verify the results structure
      expect(results).toHaveLength(2);
      expect(results[0].created).toBe(true);
      expect(results[1].created).toBe(true);

      // Verify that providers without description don't add description to payload
      expect(mockProviderManager.create).toHaveBeenCalledWith({
        label: 'Unknown Project - Provider Without Description',
      });
    });

    it('should return proper OnboardEventsResponse structure', async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { Core } = require('@adobe/aio-sdk');
      const mockLogger = {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };
      Core.Logger.mockReturnValue(mockLogger);

      // Reset the mock to default behavior for this test
      const mockProviderManager = {
        list: jest.fn().mockResolvedValue([
          {
            id: 'existing-provider-1',
            label: 'Test Project - Existing Provider',
            instance_id: 'existing-instance-1',
            description: 'An existing provider',
            docs_url: null,
          },
        ]),
        create: jest.fn().mockResolvedValue({
          id: 'new-provider-123',
          label: 'Test Project - Test Provider',
          instance_id: 'new-instance-456',
          description: 'Test provider for response validation',
          docs_url: 'https://example.com/test-docs',
        }),
      };
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const ioEventsMock = require('../../../src/io-events');
      ioEventsMock.ProviderManager.mockImplementation(() => mockProviderManager);

      const onboardEvents = new OnboardEvents(
        'Response Test Project',
        'response-consumer-123',
        'response-project-456',
        'response-workspace-789',
        'response-api-key-abc',
        'response-access-token-def'
      );

      const testProviders: OnboardProviders = [
        {
          key: 'test-provider-1',
          label: 'Test Provider One',
          description: 'First test provider for response validation',
          docs_url: 'https://example.com/provider-1',
        },
        {
          key: 'test-provider-2',
          label: 'Test Provider Two',
          description: 'Second test provider for response validation',
          docs_url: null,
        },
      ];

      const result = await onboardEvents.process(testProviders);

      // Verify response structure matches OnboardEventsResponse interface
      expect(result).toHaveProperty('createdProviders');
      expect(Array.isArray(result.createdProviders)).toBe(true);
      expect(result.createdProviders).toHaveLength(2);

      // Verify each provider result has required structure
      result.createdProviders.forEach(providerResult => {
        expect(providerResult).toHaveProperty('created');
        expect(providerResult).toHaveProperty('skipped');
        expect(providerResult).toHaveProperty('provider');
        expect(typeof providerResult.created).toBe('boolean');
        expect(typeof providerResult.skipped).toBe('boolean');

        // Verify provider object structure
        expect(providerResult.provider).toHaveProperty('label');
        expect(providerResult.provider).toHaveProperty('originalLabel');
        expect(typeof providerResult.provider.label).toBe('string');
        expect(typeof providerResult.provider.originalLabel).toBe('string');

        // Optional properties should be undefined or the correct type
        if ('id' in providerResult.provider) {
          expect(typeof providerResult.provider.id).toBe('string');
        }
        if ('instanceId' in providerResult.provider) {
          expect(typeof providerResult.provider.instanceId).toBe('string');
        }
        if ('description' in providerResult.provider) {
          expect(typeof providerResult.provider.description).toBe('string');
        }
        if ('docsUrl' in providerResult.provider) {
          expect(
            typeof providerResult.provider.docsUrl === 'string' ||
              providerResult.provider.docsUrl === null
          ).toBe(true);
        }

        // Optional error and reason properties
        if ('error' in providerResult) {
          expect(typeof providerResult.error).toBe('string');
        }
        if ('reason' in providerResult) {
          expect(typeof providerResult.reason).toBe('string');
        }
      });

      // Verify logger was called correctly
      expect(Core.Logger).toHaveBeenCalledWith('response-test-project-onboard-events', {
        level: 'debug',
      });
    });
  });
});
