/**
 * <license header>
 */

import CreateEvents from '../../../src/integration/onboard-events/create-events';
import type {
  ParsedEvent,
  CreateProviderResult,
} from '../../../src/integration/onboard-events/types';

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

// Mock EventMetadataManager to avoid real API calls
const mockEventMetadataManager = {
  list: jest.fn(),
  create: jest.fn(),
};

jest.mock('../../../src/io-events', () => ({
  EventMetadataManager: jest.fn().mockImplementation(() => mockEventMetadataManager),
}));

describe('CreateEvents', () => {
  const validConfig = {
    consumerId: 'test-consumer-id',
    projectId: 'test-project-id',
    workspaceId: 'test-workspace-id',
    clientId: 'test-client-id',
    accessToken: 'test-access-token',
    logger: mockLogger,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create instance with valid parameters', () => {
      const createEvents = new CreateEvents(
        validConfig.consumerId,
        validConfig.projectId,
        validConfig.workspaceId,
        validConfig.clientId,
        validConfig.accessToken,
        validConfig.logger
      );

      expect(createEvents).toBeInstanceOf(CreateEvents);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[INIT] CreateEvents initialized with valid configuration'
      );
    });

    it('should throw error when consumerId is missing', () => {
      expect(() => {
        new CreateEvents(
          '',
          validConfig.projectId,
          validConfig.workspaceId,
          validConfig.clientId,
          validConfig.accessToken,
          validConfig.logger
        );
      }).toThrow('Missing required configuration: consumerId');
    });

    it('should throw error when projectId is missing', () => {
      expect(() => {
        new CreateEvents(
          validConfig.consumerId,
          '',
          validConfig.workspaceId,
          validConfig.clientId,
          validConfig.accessToken,
          validConfig.logger
        );
      }).toThrow('Missing required configuration: projectId');
    });

    it('should throw error when workspaceId is missing', () => {
      expect(() => {
        new CreateEvents(
          validConfig.consumerId,
          validConfig.projectId,
          '',
          validConfig.clientId,
          validConfig.accessToken,
          validConfig.logger
        );
      }).toThrow('Missing required configuration: workspaceId');
    });

    it('should throw error when clientId is missing', () => {
      expect(() => {
        new CreateEvents(
          validConfig.consumerId,
          validConfig.projectId,
          validConfig.workspaceId,
          '',
          validConfig.accessToken,
          validConfig.logger
        );
      }).toThrow('Missing required configuration: clientId');
    });

    it('should throw error when accessToken is missing', () => {
      expect(() => {
        new CreateEvents(
          validConfig.consumerId,
          validConfig.projectId,
          validConfig.workspaceId,
          validConfig.clientId,
          '',
          validConfig.logger
        );
      }).toThrow('Missing required configuration: accessToken');
    });

    it('should throw error when logger is null', () => {
      expect(() => {
        new CreateEvents(
          validConfig.consumerId,
          validConfig.projectId,
          validConfig.workspaceId,
          validConfig.clientId,
          validConfig.accessToken,
          null as any
        );
      }).toThrow('Logger is required');
    });

    it('should throw error for multiple missing required fields', () => {
      expect(() => {
        new CreateEvents('', '', '', '', '', mockLogger);
      }).toThrow(
        'Missing required configuration: consumerId, projectId, workspaceId, clientId, accessToken'
      );
    });

    it('should throw error for whitespace-only fields', () => {
      expect(() => {
        new CreateEvents(
          '  ',
          validConfig.projectId,
          validConfig.workspaceId,
          validConfig.clientId,
          validConfig.accessToken,
          validConfig.logger
        );
      }).toThrow('Missing required configuration: consumerId');
    });
  });

  describe('fetchMetadata', () => {
    let createEvents: CreateEvents;

    beforeEach(() => {
      createEvents = new CreateEvents(
        validConfig.consumerId,
        validConfig.projectId,
        validConfig.workspaceId,
        validConfig.clientId,
        validConfig.accessToken,
        validConfig.logger
      );
    });

    it('should fetch existing metadata successfully', async () => {
      const mockMetadata = [
        { event_code: 'test.event.1', label: 'Test Event 1' },
        { event_code: 'test.event.2', label: 'Test Event 2' },
      ];
      mockEventMetadataManager.list.mockResolvedValue(mockMetadata);

      const result = await (createEvents as any).fetchMetadata('test-provider-id');

      expect(result).toEqual(mockMetadata);
      expect(mockEventMetadataManager.list).toHaveBeenCalledWith('test-provider-id');
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[INFO] Fetching existing event metadata for provider: test-provider-id'
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[INFO] Found 2 existing event metadata entries'
      );
    });

    it('should handle empty metadata list', async () => {
      mockEventMetadataManager.list.mockResolvedValue([]);

      const result = await (createEvents as any).fetchMetadata('test-provider-id');

      expect(result).toEqual([]);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[INFO] Found 0 existing event metadata entries'
      );
    });

    it('should handle fetch metadata errors and return empty array', async () => {
      const error = new Error('API Error');
      mockEventMetadataManager.list.mockRejectedValue(error);

      const result = await (createEvents as any).fetchMetadata('test-provider-id');

      expect(result).toEqual([]);
      expect(mockLogger.error).toHaveBeenCalledWith(
        '[ERROR] Error fetching existing metadata for provider test-provider-id: API Error'
      );
    });
  });

  describe('createEvent', () => {
    let createEvents: CreateEvents;

    beforeEach(() => {
      createEvents = new CreateEvents(
        validConfig.consumerId,
        validConfig.projectId,
        validConfig.workspaceId,
        validConfig.clientId,
        validConfig.accessToken,
        validConfig.logger
      );
    });

    const sampleEvent: ParsedEvent = {
      eventCode: 'test.event.create',
      runtimeAction: 'test/action',
      deliveryType: 'webhook',
      sampleEventTemplate: { test: 'data' },
      registrationKey: 'test-registration',
      providerKey: 'test-provider',
    };

    it('should skip existing event metadata', async () => {
      const existingEvents = [{ event_code: 'test.event.create', label: 'Existing Event' }];

      const result = await (createEvents as any).createEvent(
        'provider-123',
        sampleEvent,
        existingEvents
      );

      expect(result).toEqual({
        created: false,
        skipped: true,
        event: {
          eventCode: 'test.event.create',
        },
      });
      expect(mockLogger.debug).toHaveBeenCalledWith('[INFO] Processing event: test.event.create');
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "[INFO] Event code 'test.event.create' already exists for provider provider-123"
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[SKIP] Event metadata already exists for: test.event.create - skipping'
      );
    });

    it('should create new event metadata successfully', async () => {
      const existingEvents: any[] = [];
      const mockCreatedEvent = {
        id: 'event-123',
        event_code: 'test.event.create',
        label: 'test.event.create',
        description: 'test.event.create',
      };
      mockEventMetadataManager.create.mockResolvedValue(mockCreatedEvent);

      const result = await (createEvents as any).createEvent(
        'provider-123',
        sampleEvent,
        existingEvents
      );

      expect(result).toEqual({
        created: true,
        skipped: false,
        event: {
          id: 'event-123',
          eventCode: 'test.event.create',
          label: 'test.event.create',
          description: 'test.event.create',
          sampleEventTemplate: { test: 'data' },
        },
        raw: mockCreatedEvent,
      });

      expect(mockEventMetadataManager.create).toHaveBeenCalledWith('provider-123', {
        event_code: 'test.event.create',
        label: 'test.event.create',
        description: 'test.event.create',
        sample_event_template: { test: 'data' },
      });
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[CREATE] Creating event metadata: test.event.create'
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[SUCCESS] Event metadata created successfully: test.event.create'
      );
    });

    it('should create event without sample template', async () => {
      const eventWithoutTemplate: ParsedEvent = {
        ...sampleEvent,
        sampleEventTemplate: undefined,
      };
      const existingEvents: any[] = [];
      const mockCreatedEvent = {
        id: 'event-123',
        event_code: 'test.event.create',
        label: 'test.event.create',
        description: 'test.event.create',
      };
      mockEventMetadataManager.create.mockResolvedValue(mockCreatedEvent);

      const result = await (createEvents as any).createEvent(
        'provider-123',
        eventWithoutTemplate,
        existingEvents
      );

      expect(result.event.sampleEventTemplate).toBeUndefined();
      expect(mockEventMetadataManager.create).toHaveBeenCalledWith('provider-123', {
        event_code: 'test.event.create',
        label: 'test.event.create',
        description: 'test.event.create',
      });
    });

    it('should handle API returning no result', async () => {
      const existingEvents: any[] = [];
      mockEventMetadataManager.create.mockResolvedValue(null);

      const result = await (createEvents as any).createEvent(
        'provider-123',
        sampleEvent,
        existingEvents
      );

      expect(result).toEqual({
        created: false,
        skipped: false,
        event: {
          eventCode: 'test.event.create',
        },
        error: 'Event metadata creation returned no result',
      });
    });

    it('should handle event creation errors', async () => {
      const existingEvents: any[] = [];
      const error = new Error('API creation failed');
      mockEventMetadataManager.create.mockRejectedValue(error);

      const result = await (createEvents as any).createEvent(
        'provider-123',
        sampleEvent,
        existingEvents
      );

      expect(result).toEqual({
        created: false,
        skipped: false,
        event: {
          eventCode: 'test.event.create',
        },
        error: 'API creation failed',
      });
      expect(mockLogger.error).toHaveBeenCalledWith(
        '[ERROR] Error creating event metadata for test.event.create: API creation failed'
      );
    });

    it('should use event_code as fallback for event ID', async () => {
      const existingEvents: any[] = [];
      const mockCreatedEvent = {
        event_code: 'test.event.create',
        label: 'test.event.create',
        description: 'test.event.create',
      };
      mockEventMetadataManager.create.mockResolvedValue(mockCreatedEvent);

      const result = await (createEvents as any).createEvent(
        'provider-123',
        sampleEvent,
        existingEvents
      );

      expect(result.event.id).toBe('test.event.create');
    });

    it('should use eventCode as final fallback when result has no ID or event_code', async () => {
      const existingEvents: any[] = [];
      const mockCreatedEvent = {
        // No id or event_code properties
        label: 'test.event.create',
        description: 'test.event.create',
      };
      mockEventMetadataManager.create.mockResolvedValue(mockCreatedEvent);

      const result = await (createEvents as any).createEvent(
        'provider-123',
        sampleEvent,
        existingEvents
      );

      expect(result.event.id).toBe('test.event.create'); // Should fallback to eventCode
    });
  });

  describe('process', () => {
    let createEvents: CreateEvents;

    beforeEach(() => {
      createEvents = new CreateEvents(
        validConfig.consumerId,
        validConfig.projectId,
        validConfig.workspaceId,
        validConfig.clientId,
        validConfig.accessToken,
        validConfig.logger
      );
    });

    const sampleEvents: ParsedEvent[] = [
      {
        eventCode: 'test.event.1',
        runtimeAction: 'test/action1',
        deliveryType: 'webhook',
        sampleEventTemplate: { test: 'data1' },
        registrationKey: 'test-registration',
        providerKey: 'test-provider-1',
      },
      {
        eventCode: 'test.event.2',
        runtimeAction: 'test/action2',
        deliveryType: 'webhook',
        sampleEventTemplate: { test: 'data2' },
        registrationKey: 'test-registration',
        providerKey: 'test-provider-2',
      },
    ];

    const sampleProviderResults: CreateProviderResult[] = [
      {
        created: true,
        skipped: false,
        provider: {
          id: 'provider-123',
          key: 'test-provider-1',
          label: 'Test Provider 1',
          originalLabel: 'Test Provider 1',
          description: 'Test provider description',
          docsUrl: null,
        },
      },
      {
        created: true,
        skipped: false,
        provider: {
          id: 'provider-456',
          key: 'test-provider-2',
          label: 'Test Provider 2',
          originalLabel: 'Test Provider 2',
          description: 'Test provider description 2',
          docsUrl: null,
        },
      },
    ];

    it('should return empty array when no events provided', async () => {
      const result = await createEvents.process([], sampleProviderResults, 'Test Project');

      expect(result).toEqual([]);
      expect(mockLogger.debug).toHaveBeenCalledWith('[INFO] No events to process.');
    });

    it('should return empty array when no provider results provided', async () => {
      const result = await createEvents.process(sampleEvents, [], 'Test Project');

      expect(result).toEqual([]);
      expect(mockLogger.debug).toHaveBeenCalledWith('[INFO] No provider results to process.');
    });

    it('should skip provider without ID', async () => {
      const providerWithoutId: CreateProviderResult = {
        created: false,
        skipped: false,
        provider: {
          key: 'test-provider',
          label: 'Test Provider',
          originalLabel: 'Test Provider',
          description: 'Test provider',
          docsUrl: null,
        },
      };

      mockEventMetadataManager.list.mockResolvedValue([]);

      const result = await createEvents.process(sampleEvents, [providerWithoutId], 'Test Project');

      expect(result).toEqual([]);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[WARN] Skipping provider without ID: Test Provider'
      );
    });

    it('should skip provider with no matching events', async () => {
      const eventsWithDifferentProvider: ParsedEvent[] = [
        {
          eventCode: 'test.event.1',
          runtimeAction: 'test/action1',
          deliveryType: 'webhook',
          sampleEventTemplate: { test: 'data1' },
          registrationKey: 'test-registration',
          providerKey: 'different-provider', // Different provider key
        },
      ];

      mockEventMetadataManager.list.mockResolvedValue([]);

      const result = await createEvents.process(
        eventsWithDifferentProvider,
        sampleProviderResults,
        'Test Project'
      );

      expect(result).toEqual([]);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[INFO] No events found for provider: Test Provider 1'
      );
    });

    it('should process events successfully', async () => {
      const mockCreatedEvent = {
        id: 'event-123',
        event_code: 'test.event.1',
        label: 'test.event.1',
        description: 'test.event.1',
      };

      mockEventMetadataManager.list.mockResolvedValue([]);
      mockEventMetadataManager.create.mockResolvedValue(mockCreatedEvent);

      const result = await createEvents.process(
        sampleEvents,
        sampleProviderResults,
        'Test Project'
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        created: true,
        skipped: false,
        event: {
          eventCode: 'test.event.1',
        },
        provider: sampleProviderResults[0].provider,
      });
      expect(result[1]).toMatchObject({
        created: true,
        skipped: false,
        event: {
          eventCode: 'test.event.2',
        },
        provider: sampleProviderResults[1].provider,
      });

      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[CREATE] Creating events for project: Test Project'
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[INFO] Processing 2 event(s) across 2 provider(s)...'
      );
      expect(mockLogger.debug).toHaveBeenCalledWith('[INFO] Found 1 event(s) for this provider');
    });

    it('should handle process errors and rethrow them', async () => {
      // Mock an error that happens in the process method itself, not in createEvent
      const error = new Error('Process failed');
      jest.spyOn(Array.prototype, 'filter').mockImplementationOnce(() => {
        throw error;
      });

      await expect(
        createEvents.process(sampleEvents, sampleProviderResults, 'Test Project')
      ).rejects.toThrow('Process failed');

      expect(mockLogger.error).toHaveBeenCalledWith(
        '[ERROR] Event metadata creation failed: Process failed'
      );

      // Restore the original filter implementation
      jest.restoreAllMocks();
    });

    it('should use default project name when not provided', async () => {
      mockEventMetadataManager.list.mockResolvedValue([]);

      await createEvents.process([], [], undefined as any);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[CREATE] Creating events for project: Unknown Project'
      );
    });

    it('should handle provider results with mixed success states', async () => {
      const mixedProviderResults: CreateProviderResult[] = [
        {
          created: true,
          skipped: false,
          provider: {
            id: 'provider-123',
            key: 'test-provider-1',
            label: 'Test Provider 1',
            originalLabel: 'Test Provider 1',
            description: 'Test provider description',
            docsUrl: null,
          },
        },
        {
          created: false,
          skipped: true,
          provider: {
            id: 'provider-456',
            key: 'test-provider-2',
            label: 'Test Provider 2',
            originalLabel: 'Test Provider 2',
            description: 'Test provider description 2',
            docsUrl: null,
          },
        },
      ];

      mockEventMetadataManager.list.mockResolvedValue([]);
      mockEventMetadataManager.create.mockResolvedValue({
        id: 'event-123',
        event_code: 'test.event.1',
        label: 'test.event.1',
        description: 'test.event.1',
      });

      const result = await createEvents.process(sampleEvents, mixedProviderResults, 'Test Project');

      expect(result).toHaveLength(2); // Should process events for both providers
    });
  });

  describe('getEventMetadataManager', () => {
    let createEvents: CreateEvents;

    beforeEach(() => {
      createEvents = new CreateEvents(
        validConfig.consumerId,
        validConfig.projectId,
        validConfig.workspaceId,
        validConfig.clientId,
        validConfig.accessToken,
        validConfig.logger
      );
    });

    it('should create EventMetadataManager instance lazily', () => {
      const manager1 = (createEvents as any).getEventMetadataManager();
      const manager2 = (createEvents as any).getEventMetadataManager();

      expect(manager1).toBe(manager2); // Should return same instance
      const { EventMetadataManager } = jest.requireMock('../../../src/io-events');
      expect(EventMetadataManager).toHaveBeenCalledWith(
        validConfig.clientId,
        validConfig.consumerId,
        validConfig.projectId,
        validConfig.workspaceId,
        validConfig.accessToken
      );
    });
  });
});
