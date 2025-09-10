/**
 * <license header>
 */

import { OnboardEvents } from '../../../src/integration';
import type { OnboardProviders } from '../../../src/integration';

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
      await onboardEvents.process(mockProviders);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        `🚀 Processing onboard events for project: ${validParams.projectName} (${validParams.projectId}) with ${mockProviders.length} providers`
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Processing provider: ocp - HPattani Arcteryx - OCP Provider v1.0'
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Processing provider: magento - Magento Commerce Provider'
      );
    });

    it('should process empty providers array', async () => {
      const emptyProviders: OnboardProviders = [];

      await onboardEvents.process(emptyProviders);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        `🚀 Processing onboard events for project: ${validParams.projectName} (${validParams.projectId}) with 0 providers`
      );
      expect(mockLogger.debug).toHaveBeenCalledTimes(1); // Only the main log, no provider logs
    });

    it('should process single provider', async () => {
      const singleProvider: OnboardProviders = [mockProviders[0]];

      await onboardEvents.process(singleProvider);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        `🚀 Processing onboard events for project: ${validParams.projectName} (${validParams.projectId}) with 1 providers`
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Processing provider: ocp - HPattani Arcteryx - OCP Provider v1.0'
      );
      expect(mockLogger.debug).toHaveBeenCalledTimes(2); // Main log + 1 provider log
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

      await onboardEvents.process(longLabelProviders);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Processing provider: test - A very long provider label that exceeds normal expectations and continues for a while to test edge cases'
      );
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

      await onboardEvents.process(specialCharProviders);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Processing provider: special-test - Provider with émojis 🚀 and spécial châractérs!'
      );
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

      await onboardEvents.process(realisticProviders);

      // Verify logger was created with correct name
      expect(Core.Logger).toHaveBeenCalledWith('adobe-commerce-production-onboard-events', {
        level: 'debug',
      });

      // Verify processing logs
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '🚀 Processing onboard events for project: Adobe Commerce Production (prod-project-456) with 2 providers'
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Processing provider: commerce-events - Adobe Commerce Events Provider'
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Processing provider: inventory-sync - Inventory Synchronization Provider'
      );

      expect(mockLogger.debug).toHaveBeenCalledTimes(3);
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

      await onboardEvents.process(providers);

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
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Processing provider: payment-gateway - Payment Gateway Provider'
      );
      expect(mockLogger.info).toHaveBeenCalledWith('Completed onboard event processing workflow');

      expect(mockLogger.info).toHaveBeenCalledTimes(2);
      expect(mockLogger.debug).toHaveBeenCalledTimes(2);
    });
  });
});
