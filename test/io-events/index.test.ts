/**
 * Copyright © Adobe, Inc. All rights reserved.
 */

import * as IOEventsModule from '../../src/io-events';
import { IOEventsApiError, IoEventsGlobals } from '../../src/io-events/types';
import ProviderManager from '../../src/io-events/provider';
import EventMetadataManager from '../../src/io-events/event-metadata';
import RegistrationManager from '../../src/io-events/registration';
import type { Provider } from '../../src/io-events/provider/types';
import type {
  ProviderInputModel,
  CreateProviderParams,
} from '../../src/io-events/provider/create/types';
import type { GetProviderQueryParams } from '../../src/io-events/provider/get/types';
import type { ListProvidersQueryParams } from '../../src/io-events/provider/list/types';
import type { EventMetadata } from '../../src/io-events/event-metadata/types';
import type { EventMetadataInputModel } from '../../src/io-events/event-metadata/create/types';
import type { EventMetadataListResponse } from '../../src/io-events/event-metadata/list/types';

describe('IO Events Module', () => {
  describe('Module Exports', () => {
    it('should export ProviderManager', () => {
      expect(IOEventsModule.ProviderManager).toBeDefined();
      expect(IOEventsModule.ProviderManager).toBe(ProviderManager);
    });

    it('should export EventMetadataManager', () => {
      expect(IOEventsModule.EventMetadataManager).toBeDefined();
      expect(IOEventsModule.EventMetadataManager).toBe(EventMetadataManager);
    });

    it('should export RegistrationManager', () => {
      expect(IOEventsModule.RegistrationManager).toBeDefined();
      expect(IOEventsModule.RegistrationManager).toBe(RegistrationManager);
    });

    it('should export IOEventsApiError', () => {
      expect(IOEventsModule.IOEventsApiError).toBeDefined();
      expect(IOEventsModule.IOEventsApiError).toBe(IOEventsApiError);
    });

    it('should export IoEventsGlobals', () => {
      expect(IOEventsModule.IoEventsGlobals).toBeDefined();
      expect(IOEventsModule.IoEventsGlobals).toBe(IoEventsGlobals);
    });

    it('should have ProviderManager as a class', () => {
      expect(typeof IOEventsModule.ProviderManager).toBe('function');
      expect(IOEventsModule.ProviderManager.prototype).toBeDefined();
    });

    it('should have EventMetadataManager as a class', () => {
      expect(typeof IOEventsModule.EventMetadataManager).toBe('function');
      expect(IOEventsModule.EventMetadataManager.prototype).toBeDefined();
    });

    it('should have RegistrationManager as a class', () => {
      expect(typeof IOEventsModule.RegistrationManager).toBe('function');
      expect(IOEventsModule.RegistrationManager.prototype).toBeDefined();
    });

    it('should have IOEventsApiError as a class', () => {
      expect(typeof IOEventsModule.IOEventsApiError).toBe('function');
      expect(IOEventsModule.IOEventsApiError.prototype).toBeDefined();
      expect(IOEventsModule.IOEventsApiError.prototype instanceof Error).toBe(true);
    });

    it('should have IoEventsGlobals as an object', () => {
      expect(typeof IOEventsModule.IoEventsGlobals).toBe('object');
      expect(IOEventsModule.IoEventsGlobals).not.toBe(null);
    });
  });

  describe('Type Exports Availability', () => {
    it('should make Provider type available for import', () => {
      // This test ensures the Provider type is properly exported
      // TypeScript will catch any import issues at compile time
      const provider: Provider = {
        id: 'test-provider',
        label: 'Test Provider',
        description: 'A test provider',
        source: 'test-source',
        provider_metadata: 'test_metadata',
        event_delivery_format: 'adobe_io',
        publisher: 'test-publisher',
      };

      expect(provider.id).toBe('test-provider');
      expect(provider.label).toBe('Test Provider');
    });

    it('should make ProviderInputModel type available for import', () => {
      const providerInput: ProviderInputModel = {
        label: 'Input Provider',
        description: 'A provider input model',
      };

      expect(providerInput.label).toBe('Input Provider');
      expect(providerInput.description).toBe('A provider input model');
    });

    it('should make CreateProviderParams type available for import', () => {
      const createParams: CreateProviderParams = {
        projectId: 'test-project',
        workspaceId: 'test-workspace',
        providerData: {
          label: 'Test Provider',
        },
      };

      expect(createParams.projectId).toBe('test-project');
      expect(createParams.workspaceId).toBe('test-workspace');
      expect(createParams.providerData.label).toBe('Test Provider');
    });

    it('should make GetProviderQueryParams type available for import', () => {
      const getParams: GetProviderQueryParams = {
        eventmetadata: true,
      };

      expect(getParams.eventmetadata).toBe(true);
    });

    it('should make ListProvidersQueryParams type available for import', () => {
      const listParams: ListProvidersQueryParams = {
        providerMetadataId: '3rd_party_custom_events',
        eventmetadata: false,
      };

      expect(listParams.providerMetadataId).toBe('3rd_party_custom_events');
      expect(listParams.eventmetadata).toBe(false);
    });

    it('should make EventMetadata type available for import', () => {
      const eventMetadata: EventMetadata = {
        event_code: 'com.example.user.created',
        label: 'User Created',
        description: 'Triggered when a new user is created',
        sample_event_template: '{"user_id":"123","name":"John Doe"}',
      };

      expect(eventMetadata.event_code).toBe('com.example.user.created');
      expect(eventMetadata.label).toBe('User Created');
      expect(eventMetadata.description).toBe('Triggered when a new user is created');
    });

    it('should make EventMetadataInputModel type available for import', () => {
      const inputModel: EventMetadataInputModel = {
        event_code: 'com.example.user.updated',
        label: 'User Updated',
        description: 'Triggered when user information is updated',
        sample_event_template: {
          user_id: '456',
          updated_fields: ['name', 'email'],
        },
      };

      expect(inputModel.event_code).toBe('com.example.user.updated');
      expect(inputModel.label).toBe('User Updated');
      expect(inputModel.sample_event_template).toEqual({
        user_id: '456',
        updated_fields: ['name', 'email'],
      });
    });

    it('should make EventMetadataListResponse type available for import', () => {
      const listResponse: EventMetadataListResponse = {
        _embedded: {
          eventmetadata: [
            {
              event_code: 'com.example.user.created',
              label: 'User Created',
              description: 'Triggered when a new user is created',
            },
          ],
        },
        _links: {
          self: {
            href: '/events/providers/test-provider/eventmetadata',
          },
        },
      };

      expect(listResponse._embedded.eventmetadata).toHaveLength(1);
      expect(listResponse._embedded.eventmetadata[0].event_code).toBe('com.example.user.created');
    });
  });

  describe('Functional Integration', () => {
    it('should create ProviderManager instance', () => {
      const manager = new IOEventsModule.ProviderManager(
        'client-id',
        'consumer-id',
        'project-id',
        'workspace-id',
        'access-token'
      );

      expect(manager).toBeInstanceOf(IOEventsModule.ProviderManager);
      expect(manager).toBeInstanceOf(ProviderManager);
    });

    it('should create EventMetadataManager instance', () => {
      const manager = new IOEventsModule.EventMetadataManager(
        'client-id',
        'consumer-id',
        'project-id',
        'workspace-id',
        'access-token'
      );

      expect(manager).toBeInstanceOf(IOEventsModule.EventMetadataManager);
      expect(manager).toBeInstanceOf(EventMetadataManager);
    });

    it('should create RegistrationManager instance', () => {
      const manager = new IOEventsModule.RegistrationManager(
        'client-id',
        'consumer-id',
        'project-id',
        'workspace-id',
        'access-token'
      );

      expect(manager).toBeInstanceOf(IOEventsModule.RegistrationManager);
      expect(manager).toBeInstanceOf(RegistrationManager);
    });

    it('should create IOEventsApiError instance', () => {
      const error = new IOEventsModule.IOEventsApiError('Test error', 400, 'TEST_ERROR');

      expect(error).toBeInstanceOf(IOEventsModule.IOEventsApiError);
      expect(error).toBeInstanceOf(IOEventsApiError);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.errorCode).toBe('TEST_ERROR');
    });

    it('should access IoEventsGlobals constants', () => {
      expect(IOEventsModule.IoEventsGlobals.BASE_URL).toBe('https://api.adobe.io');
      expect(IOEventsModule.IoEventsGlobals.STATUS_CODES.OK).toBe(200);
      expect(IOEventsModule.IoEventsGlobals.STATUS_CODES.BAD_REQUEST).toBe(400);
      expect(IOEventsModule.IoEventsGlobals.STATUS_CODES.UNAUTHORIZED).toBe(401);
      expect(IOEventsModule.IoEventsGlobals.STATUS_CODES.FORBIDDEN).toBe(403);
      expect(IOEventsModule.IoEventsGlobals.STATUS_CODES.NOT_FOUND).toBe(404);
      expect(IOEventsModule.IoEventsGlobals.STATUS_CODES.CONFLICT).toBe(409);
      expect(IOEventsModule.IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR).toBe(500);
      expect(IOEventsModule.IoEventsGlobals.HEADERS.CONFLICTING_ID).toBe('x-conflicting-id');
    });
  });

  describe('Usage Examples', () => {
    it('should demonstrate typical usage pattern', () => {
      // Create a provider manager
      const providerManager = new IOEventsModule.ProviderManager(
        'my-client-id',
        'my-consumer-id',
        'my-project-id',
        'my-workspace-id',
        'my-access-token'
      );

      // Create provider input data
      const providerData: ProviderInputModel = {
        label: 'My Event Provider',
        description: 'Provider for my application events',
        docs_url: 'https://myapp.com/events-docs',
      };

      // These would be used in real code but we can't test async operations here
      // without mocking the internal services
      expect(providerManager).toBeDefined();
      expect(providerData.label).toBe('My Event Provider');
      expect(typeof providerManager.list).toBe('function');
      expect(typeof providerManager.get).toBe('function');
      expect(typeof providerManager.create).toBe('function');
      expect(typeof providerManager.delete).toBe('function');
    });

    it('should demonstrate error handling pattern', () => {
      try {
        throw new IOEventsModule.IOEventsApiError(
          'Provider not found',
          404,
          'PROVIDER_NOT_FOUND',
          'The specified provider ID does not exist'
        );
      } catch (error) {
        expect(error).toBeInstanceOf(IOEventsModule.IOEventsApiError);

        if (error instanceof IOEventsModule.IOEventsApiError) {
          expect(error.statusCode).toBe(404);
          expect(error.errorCode).toBe('PROVIDER_NOT_FOUND');
          expect(error.details).toBe('The specified provider ID does not exist');
        }
      }
    });

    it('should demonstrate query parameter usage', () => {
      // List query parameters
      const listParams: ListProvidersQueryParams = {
        providerMetadataId: '3rd_party_custom_events',
        eventmetadata: true,
      };
      expect(listParams.providerMetadataId).toBe('3rd_party_custom_events');
      expect(listParams.eventmetadata).toBe(true);

      // Get query parameters
      const getParams: GetProviderQueryParams = {
        eventmetadata: false,
      };
      expect(getParams.eventmetadata).toBe(false);

      // Create parameters
      const createParams: CreateProviderParams = {
        projectId: 'my-project',
        workspaceId: 'my-workspace',
        providerData: {
          label: 'My Provider',
          description: 'My custom provider',
          provider_metadata: 'custom_metadata',
          data_residency_region: 'va6',
        },
      };
      expect(createParams.providerData.provider_metadata).toBe('custom_metadata');
      expect(createParams.providerData.data_residency_region).toBe('va6');
    });

    it('should demonstrate constants usage', () => {
      const baseUrl = IOEventsModule.IoEventsGlobals.BASE_URL;
      expect(baseUrl).toBe('https://api.adobe.io');

      // Status codes
      const badRequestCode = IOEventsModule.IoEventsGlobals.STATUS_CODES.BAD_REQUEST;
      const notFoundCode = IOEventsModule.IoEventsGlobals.STATUS_CODES.NOT_FOUND;
      const conflictCode = IOEventsModule.IoEventsGlobals.STATUS_CODES.CONFLICT;

      expect(badRequestCode).toBe(400);
      expect(notFoundCode).toBe(404);
      expect(conflictCode).toBe(409);

      // Headers
      const conflictingIdHeader = IOEventsModule.IoEventsGlobals.HEADERS.CONFLICTING_ID;
      expect(conflictingIdHeader).toBe('x-conflicting-id');
    });
  });

  describe('Module Structure Validation', () => {
    it('should not expose internal implementation details', () => {
      // Check that internal service classes are not exported
      expect((IOEventsModule as any).List).toBeUndefined();
      expect((IOEventsModule as any).Get).toBeUndefined();
      expect((IOEventsModule as any).Create).toBeUndefined();
      expect((IOEventsModule as any).Delete).toBeUndefined();
    });

    it('should export all expected public API items', () => {
      const expectedExports = [
        'ProviderManager',
        'EventMetadataManager',
        'RegistrationManager',
        'IOEventsApiError',
        'IoEventsGlobals',
      ];

      expectedExports.forEach(exportName => {
        expect(IOEventsModule).toHaveProperty(exportName);
        expect((IOEventsModule as any)[exportName]).toBeDefined();
      });
    });

    it('should maintain consistent export types', () => {
      // Class exports should be constructable
      expect(() => new IOEventsModule.ProviderManager('a', 'b', 'c', 'd', 'e')).not.toThrow();
      expect(() => new IOEventsModule.EventMetadataManager('a', 'b', 'c', 'd', 'e')).not.toThrow();
      expect(() => new IOEventsModule.RegistrationManager('a', 'b', 'c', 'd', 'e')).not.toThrow();
      expect(() => new IOEventsModule.IOEventsApiError('msg', 400)).not.toThrow();

      // Object exports should be objects
      expect(typeof IOEventsModule.IoEventsGlobals).toBe('object');
    });

    it('should provide comprehensive type coverage', () => {
      // These tests ensure all important types are available at the module level
      // The actual type checking is done at TypeScript compile time

      // Provider types should be available
      const provider: Provider = {
        id: 'test',
        label: 'Test',
        description: 'Test',
        source: 'test',
        provider_metadata: 'test',
        event_delivery_format: 'adobe_io',
        publisher: 'test',
      };
      expect(provider.id).toBe('test');

      // Input types should be available
      const input: ProviderInputModel = { label: 'Test' };
      expect(input.label).toBe('Test');

      // Query parameter types should be available
      const listQuery: ListProvidersQueryParams = { eventmetadata: true };
      const getQuery: GetProviderQueryParams = { eventmetadata: false };
      expect(listQuery.eventmetadata).toBe(true);
      expect(getQuery.eventmetadata).toBe(false);

      // Create parameter types should be available
      const createParams: CreateProviderParams = {
        projectId: 'test',
        workspaceId: 'test',
        providerData: { label: 'Test' },
      };
      expect(createParams.projectId).toBe('test');
    });
  });
});
