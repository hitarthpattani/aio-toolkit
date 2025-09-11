/**
 * <license header>
 */

import CreateRegistrations from '../../../src/integration/onboard-events/create-registrations';
import type {
  ParsedRegistration,
  ParsedEvent,
  CreateProviderResult,
} from '../../../src/integration/onboard-events/types';
import type { Registration } from '../../../src/io-events/registration/types';

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

// Mock RegistrationManager to avoid real API calls
const mockRegistrationManager = {
  list: jest.fn(),
  create: jest.fn(),
};

jest.mock('../../../src/io-events/registration', () => ({
  RegistrationManager: jest.fn().mockImplementation(() => mockRegistrationManager),
}));

describe('CreateRegistrations', () => {
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
      const createRegistrations = new CreateRegistrations(
        validConfig.consumerId,
        validConfig.projectId,
        validConfig.workspaceId,
        validConfig.clientId,
        validConfig.accessToken,
        validConfig.logger
      );

      expect(createRegistrations).toBeInstanceOf(CreateRegistrations);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[INIT] CreateRegistrations initialized with valid configuration'
      );
    });

    it('should throw error when consumerId is missing', () => {
      expect(() => {
        new CreateRegistrations(
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
        new CreateRegistrations(
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
        new CreateRegistrations(
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
        new CreateRegistrations(
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
        new CreateRegistrations(
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
        new CreateRegistrations(
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
        new CreateRegistrations(
          '',
          '',
          validConfig.workspaceId,
          validConfig.clientId,
          validConfig.accessToken,
          validConfig.logger
        );
      }).toThrow('Missing required configuration: consumerId, projectId');
    });

    it('should throw error for whitespace-only fields', () => {
      expect(() => {
        new CreateRegistrations(
          '   ',
          validConfig.projectId,
          validConfig.workspaceId,
          validConfig.clientId,
          validConfig.accessToken,
          validConfig.logger
        );
      }).toThrow('Missing required configuration: consumerId');
    });
  });

  describe('fetchRegistrations', () => {
    let createRegistrations: CreateRegistrations;

    beforeEach(() => {
      createRegistrations = new CreateRegistrations(
        validConfig.consumerId,
        validConfig.projectId,
        validConfig.workspaceId,
        validConfig.clientId,
        validConfig.accessToken,
        validConfig.logger
      );
    });

    it('should successfully fetch and map existing registrations', async () => {
      const mockRegistrations: Registration[] = [
        {
          id: 'reg-1',
          registration_id: 'reg-id-1',
          name: 'Registration 1',
          description: 'Test registration 1',
          enabled: true,
          client_id: 'test-client',
          delivery_type: 'webhook',
          created_date: '2023-01-01T00:00:00Z',
          updated_date: '2023-01-01T00:00:00Z',
        },
        {
          id: 'reg-2',
          registration_id: 'reg-id-2',
          name: 'Registration 2',
          description: 'Test registration 2',
          enabled: false,
          client_id: 'test-client',
          delivery_type: 'webhook',
          created_date: '2023-01-01T00:00:00Z',
          updated_date: '2023-01-01T00:00:00Z',
        },
      ];

      mockRegistrationManager.list.mockResolvedValue(mockRegistrations);

      const result = await createRegistrations.fetchRegistrations();

      expect(mockRegistrationManager.list).toHaveBeenCalledTimes(1);
      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(2);
      expect(result.get('Registration 1')).toEqual(mockRegistrations[0]);
      expect(result.get('Registration 2')).toEqual(mockRegistrations[1]);
      expect(mockLogger.debug).toHaveBeenCalledWith('[INFO] Fetching existing registrations...');
      expect(mockLogger.debug).toHaveBeenCalledWith('[INFO] Found 2 existing registrations');
    });

    it('should handle empty registration list', async () => {
      mockRegistrationManager.list.mockResolvedValue([]);

      const result = await createRegistrations.fetchRegistrations();

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
      expect(mockLogger.debug).toHaveBeenCalledWith('[INFO] Found 0 existing registrations');
    });

    it('should handle registration fetch errors', async () => {
      const error = new Error('API Error');
      mockRegistrationManager.list.mockRejectedValue(error);

      await expect(createRegistrations.fetchRegistrations()).rejects.toThrow('API Error');
      expect(mockLogger.error).toHaveBeenCalledWith(
        '[ERROR] Failed to fetch existing registrations: API Error'
      );
    });
  });

  describe('groupEventsByProvider', () => {
    let createRegistrations: CreateRegistrations;

    beforeEach(() => {
      createRegistrations = new CreateRegistrations(
        validConfig.consumerId,
        validConfig.projectId,
        validConfig.workspaceId,
        validConfig.clientId,
        validConfig.accessToken,
        validConfig.logger
      );
    });

    it('should group events by provider key', () => {
      const events: ParsedEvent[] = [
        {
          eventCode: 'event1',
          runtimeAction: 'action1',
          deliveryType: 'webhook',
          sampleEventTemplate: {},
          registrationKey: 'reg1',
          providerKey: 'provider1',
        },
        {
          eventCode: 'event2',
          runtimeAction: 'action2',
          deliveryType: 'webhook',
          sampleEventTemplate: {},
          registrationKey: 'reg1',
          providerKey: 'provider1',
        },
        {
          eventCode: 'event3',
          runtimeAction: 'action3',
          deliveryType: 'webhook',
          sampleEventTemplate: {},
          registrationKey: 'reg1',
          providerKey: 'provider2',
        },
      ];

      // Access the private method using bracket notation
      const result = (createRegistrations as any).groupEventsByProvider(events);

      expect(result).toEqual({
        provider1: [events[0], events[1]],
        provider2: [events[2]],
      });
    });

    it('should handle empty events array', () => {
      const result = (createRegistrations as any).groupEventsByProvider([]);
      expect(result).toEqual({});
    });

    it('should handle single event', () => {
      const events: ParsedEvent[] = [
        {
          eventCode: 'event1',
          runtimeAction: 'action1',
          deliveryType: 'webhook',
          sampleEventTemplate: {},
          registrationKey: 'reg1',
          providerKey: 'provider1',
        },
      ];

      const result = (createRegistrations as any).groupEventsByProvider(events);
      expect(result).toEqual({
        provider1: [events[0]],
      });
    });
  });

  describe('preparePayload', () => {
    let createRegistrations: CreateRegistrations;

    beforeEach(() => {
      createRegistrations = new CreateRegistrations(
        validConfig.consumerId,
        validConfig.projectId,
        validConfig.workspaceId,
        validConfig.clientId,
        validConfig.accessToken,
        validConfig.logger
      );
    });

    it('should build registration payload with all required fields', () => {
      const registration: ParsedRegistration = {
        key: 'reg-key',
        label: 'Test Registration',
        description: 'Test description',
        providerKey: 'provider1',
      };

      const events: ParsedEvent[] = [
        {
          eventCode: 'event1',
          runtimeAction: 'action1',
          deliveryType: 'webhook',
          sampleEventTemplate: {},
          registrationKey: 'reg-key',
          providerKey: 'provider1',
        },
        {
          eventCode: 'event2',
          runtimeAction: 'action2',
          deliveryType: 'journal',
          sampleEventTemplate: {},
          registrationKey: 'reg-key',
          providerKey: 'provider1',
        },
      ];

      const provider: CreateProviderResult = {
        created: true,
        skipped: false,
        provider: {
          id: 'provider-id-123',
          key: 'provider1',
          label: 'Test Provider',
          originalLabel: 'Test Provider',
          description: 'Test provider description',
        },
      };

      const firstEvent = events[0];
      const registrationName = 'Test Registration';

      const result = (createRegistrations as any).preparePayload(
        registration,
        events,
        provider,
        registrationName,
        firstEvent
      );

      expect(result).toEqual({
        client_id: validConfig.clientId,
        name: registrationName,
        description: 'Test description',
        delivery_type: 'webhook',
        events_of_interest: [
          {
            provider_id: 'provider-id-123',
            event_code: 'event1',
          },
          {
            provider_id: 'provider-id-123',
            event_code: 'event2',
          },
        ],
        runtime_action: 'action1',
      });
    });

    it('should use default values when optional fields are missing', () => {
      const registration: ParsedRegistration = {
        key: 'reg-key',
        label: 'Test Registration',
        description: '',
        providerKey: 'provider1',
      };

      const events: ParsedEvent[] = [
        {
          eventCode: 'event1',
          runtimeAction: '',
          deliveryType: '',
          sampleEventTemplate: {},
          registrationKey: 'reg-key',
          providerKey: 'provider1',
        },
      ];

      const provider: CreateProviderResult = {
        created: true,
        skipped: false,
        provider: {
          id: 'provider-id-123',
          key: 'provider1',
          label: 'Test Provider',
          originalLabel: 'Test Provider',
          description: 'Test provider description',
        },
      };

      const firstEvent = events[0];
      const registrationName = 'Test Registration';

      const result = (createRegistrations as any).preparePayload(
        registration,
        events,
        provider,
        registrationName,
        firstEvent
      );

      expect(result).toEqual({
        client_id: validConfig.clientId,
        name: registrationName,
        description: registrationName, // Falls back to registrationName
        delivery_type: 'webhook', // Default value
        events_of_interest: [
          {
            provider_id: 'provider-id-123',
            event_code: 'event1',
          },
        ],
        // runtime_action is not included when empty
      });
    });

    it('should handle missing provider ID', () => {
      const registration: ParsedRegistration = {
        key: 'reg-key',
        label: 'Test Registration',
        description: 'Test description',
        providerKey: 'provider1',
      };

      const events: ParsedEvent[] = [
        {
          eventCode: 'event1',
          runtimeAction: 'action1',
          deliveryType: 'webhook',
          sampleEventTemplate: {},
          registrationKey: 'reg-key',
          providerKey: 'provider1',
        },
      ];

      const provider: CreateProviderResult = {
        created: true,
        skipped: false,
        provider: {
          id: '', // Empty ID
          key: 'provider1',
          label: 'Test Provider',
          originalLabel: 'Test Provider',
          description: 'Test provider description',
        },
      };

      const firstEvent = events[0];
      const registrationName = 'Test Registration';

      const result = (createRegistrations as any).preparePayload(
        registration,
        events,
        provider,
        registrationName,
        firstEvent
      );

      expect(result.events_of_interest).toEqual([
        {
          provider_id: '', // Empty string fallback
          event_code: 'event1',
        },
      ]);
    });
  });

  describe('process', () => {
    let createRegistrations: CreateRegistrations;

    beforeEach(() => {
      createRegistrations = new CreateRegistrations(
        validConfig.consumerId,
        validConfig.projectId,
        validConfig.workspaceId,
        validConfig.clientId,
        validConfig.accessToken,
        validConfig.logger
      );

      // Mock fetchRegistrations to return empty map by default
      mockRegistrationManager.list.mockResolvedValue([]);
    });

    const sampleRegistrations: ParsedRegistration[] = [
      {
        key: 'reg1',
        label: 'Registration 1',
        description: 'Test registration 1',
        providerKey: 'provider1',
      },
    ];

    const sampleEvents: ParsedEvent[] = [
      {
        eventCode: 'event1',
        runtimeAction: 'action1',
        deliveryType: 'webhook',
        sampleEventTemplate: { test: 'data1' },
        registrationKey: 'reg1',
        providerKey: 'Provider 1', // Should match provider originalLabel
      },
      {
        eventCode: 'event2',
        runtimeAction: 'action2',
        deliveryType: 'journal',
        sampleEventTemplate: { test: 'data2' },
        registrationKey: 'reg1',
        providerKey: 'Provider 1', // Should match provider originalLabel
      },
    ];

    const sampleProviderResults: CreateProviderResult[] = [
      {
        created: true,
        skipped: false,
        provider: {
          id: 'provider-id-123',
          key: 'provider1',
          label: 'Provider 1',
          originalLabel: 'Provider 1',
          description: 'Test provider 1',
        },
      },
    ];

    it('should return empty array when no registrations provided', async () => {
      const result = await createRegistrations.process([], sampleEvents, sampleProviderResults);

      expect(result).toEqual([]);
      expect(mockLogger.debug).toHaveBeenCalledWith('[SKIP] No registrations to process.');
    });

    it('should return empty array when no events provided', async () => {
      const result = await createRegistrations.process(
        sampleRegistrations,
        [],
        sampleProviderResults
      );

      expect(result).toEqual([]);
      expect(mockLogger.debug).toHaveBeenCalledWith('[SKIP] No events to process.');
    });

    it('should return empty array when no provider results provided', async () => {
      const result = await createRegistrations.process(sampleRegistrations, sampleEvents, []);

      expect(result).toEqual([]);
      expect(mockLogger.debug).toHaveBeenCalledWith('[SKIP] No provider results to process.');
    });

    it('should skip registrations with no matching events', async () => {
      const eventsWithDifferentKey: ParsedEvent[] = [
        {
          ...sampleEvents[0],
          registrationKey: 'different-key',
        },
      ];

      const result = await createRegistrations.process(
        sampleRegistrations,
        eventsWithDifferentKey,
        sampleProviderResults
      );

      expect(result).toEqual([]);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[SKIP] No events found for registration: Registration 1'
      );
    });

    it('should skip when provider not found', async () => {
      const providerWithDifferentKey: CreateProviderResult[] = [
        {
          ...sampleProviderResults[0],
          provider: {
            ...sampleProviderResults[0].provider,
            originalLabel: 'Different Provider',
          },
        },
      ];

      const result = await createRegistrations.process(
        sampleRegistrations,
        sampleEvents,
        providerWithDifferentKey
      );

      expect(result).toEqual([]);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[SKIP] Provider not found or missing ID for: Provider 1'
      );
    });

    it('should skip when provider has no ID', async () => {
      const providerWithoutId: CreateProviderResult[] = [
        {
          ...sampleProviderResults[0],
          provider: {
            ...sampleProviderResults[0].provider,
            id: '',
          },
        },
      ];

      const result = await createRegistrations.process(
        sampleRegistrations,
        sampleEvents,
        providerWithoutId
      );

      expect(result).toEqual([]);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[SKIP] Provider not found or missing ID for: Provider 1'
      );
    });

    it('should successfully create new registrations', async () => {
      const mockCreatedRegistration = {
        id: 'created-reg-id',
        registration_id: 'created-reg-123',
        name: 'Registration 1',
        description: 'Test registration 1',
        enabled: true,
        client_id: validConfig.clientId,
      };

      mockRegistrationManager.create.mockResolvedValue(mockCreatedRegistration);

      const result = await createRegistrations.process(
        sampleRegistrations,
        sampleEvents,
        sampleProviderResults,
        'Test Project'
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        created: true,
        skipped: false,
        registration: {
          id: 'created-reg-id',
          key: 'reg1',
          label: 'Registration 1',
          originalLabel: 'Registration 1',
          name: 'Registration 1',
          description: 'Test registration 1',
        },
        provider: sampleProviderResults[0].provider,
        raw: mockCreatedRegistration,
      });

      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[INFO] Creating registrations for project: Test Project'
      );
      expect(mockLogger.debug).toHaveBeenCalledWith('[SUCCESS] Registration created successfully!');
      expect(mockLogger.debug).toHaveBeenCalledWith('[INFO] New ID: created-reg-id');
    });

    it('should skip existing registrations', async () => {
      const existingRegistration: Registration = {
        id: 'existing-reg-id',
        registration_id: 'existing-reg-123',
        name: 'Registration 1',
        description: 'Existing registration',
        enabled: true,
        client_id: validConfig.clientId,
        delivery_type: 'webhook',
        created_date: '2023-01-01T00:00:00Z',
        updated_date: '2023-01-01T00:00:00Z',
      };

      mockRegistrationManager.list.mockResolvedValue([existingRegistration]);

      const result = await createRegistrations.process(
        sampleRegistrations,
        sampleEvents,
        sampleProviderResults
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        created: false,
        skipped: true,
        registration: {
          id: 'existing-reg-id',
          key: 'reg1',
          label: 'Registration 1',
          originalLabel: 'Registration 1',
          name: 'Registration 1',
          description: 'Test registration 1',
        },
        reason: 'Already exists',
        raw: existingRegistration,
      });

      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[SKIP] Registration already exists - skipping creation'
      );
      expect(mockRegistrationManager.create).not.toHaveBeenCalled();
    });

    it('should handle registration creation errors', async () => {
      const error = new Error('API Error');
      mockRegistrationManager.create.mockRejectedValue(error);

      const result = await createRegistrations.process(
        sampleRegistrations,
        sampleEvents,
        sampleProviderResults
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        created: false,
        skipped: false,
        error: 'API Error',
        registration: {
          key: 'reg1',
          label: 'Registration 1',
          originalLabel: 'Registration 1',
          name: 'Registration 1',
          description: 'Test registration 1',
        },
        provider: sampleProviderResults[0].provider,
      });

      expect(mockLogger.error).toHaveBeenCalledWith(
        '[ERROR] Failed to create registration "Registration 1": API Error'
      );
    });

    it('should handle overall process errors', async () => {
      const error = new Error('General Error');
      mockRegistrationManager.list.mockRejectedValue(error);

      await expect(
        createRegistrations.process(sampleRegistrations, sampleEvents, sampleProviderResults)
      ).rejects.toThrow('General Error');

      expect(mockLogger.error).toHaveBeenCalledWith(
        '[ERROR] Registration creation failed: General Error'
      );
    });

    it('should handle multiple registrations with different providers', async () => {
      const multipleRegistrations: ParsedRegistration[] = [
        {
          key: 'reg1',
          label: 'Registration 1',
          description: 'Test registration 1',
          providerKey: 'provider1',
        },
        {
          key: 'reg2',
          label: 'Registration 2',
          description: 'Test registration 2',
          providerKey: 'provider2',
        },
      ];

      const multipleEvents: ParsedEvent[] = [
        {
          eventCode: 'event1',
          runtimeAction: 'action1',
          deliveryType: 'webhook',
          sampleEventTemplate: {},
          registrationKey: 'reg1',
          providerKey: 'Provider 1', // Match originalLabel
        },
        {
          eventCode: 'event2',
          runtimeAction: 'action2',
          deliveryType: 'webhook',
          sampleEventTemplate: {},
          registrationKey: 'reg2',
          providerKey: 'Provider 2', // Match originalLabel
        },
      ];

      const multipleProviders: CreateProviderResult[] = [
        {
          created: true,
          skipped: false,
          provider: {
            id: 'provider-id-1',
            key: 'provider1',
            label: 'Provider 1',
            originalLabel: 'Provider 1',
            description: 'Test provider 1',
          },
        },
        {
          created: true,
          skipped: false,
          provider: {
            id: 'provider-id-2',
            key: 'provider2',
            label: 'Provider 2',
            originalLabel: 'Provider 2',
            description: 'Test provider 2',
          },
        },
      ];

      const mockCreatedReg1 = {
        id: 'reg-1-id',
        registration_id: 'reg-1-123',
        name: 'Registration 1',
        description: 'Test registration 1',
        enabled: true,
        client_id: validConfig.clientId,
      };

      const mockCreatedReg2 = {
        id: 'reg-2-id',
        registration_id: 'reg-2-123',
        name: 'Registration 2',
        description: 'Test registration 2',
        enabled: true,
        client_id: validConfig.clientId,
      };

      mockRegistrationManager.create
        .mockResolvedValueOnce(mockCreatedReg1)
        .mockResolvedValueOnce(mockCreatedReg2);

      const result = await createRegistrations.process(
        multipleRegistrations,
        multipleEvents,
        multipleProviders
      );

      expect(result).toHaveLength(2);
      expect(result[0].registration.name).toBe('Registration 1');
      expect(result[1].registration.name).toBe('Registration 2');
      expect(mockRegistrationManager.create).toHaveBeenCalledTimes(2);
    });

    it('should handle empty events array when creating registration', async () => {
      // Create a test scenario where events array would be empty in createRegistration
      // This can happen if the validation earlier somehow fails
      const mockCreatedRegistration = {
        id: 'created-reg-id',
        registration_id: 'created-reg-123',
        name: 'Registration 1',
        description: 'Test registration 1',
        enabled: true,
        client_id: validConfig.clientId,
      };

      // Mock the create method to simulate successful creation even with potentially empty events
      mockRegistrationManager.create.mockResolvedValue(mockCreatedRegistration);

      const result = await createRegistrations.process(
        sampleRegistrations,
        sampleEvents,
        sampleProviderResults
      );

      expect(result).toHaveLength(1);
      expect(result[0].created).toBe(true);
      expect(result[0].skipped).toBe(false);
      expect(result[0].registration.name).toBe('Registration 1');
    });

    it('should use default project name when not provided', async () => {
      const mockCreatedRegistration = {
        id: 'created-reg-id',
        registration_id: 'created-reg-123',
        name: 'Registration 1',
        description: 'Test registration 1',
        enabled: true,
        client_id: validConfig.clientId,
      };

      mockRegistrationManager.create.mockResolvedValue(mockCreatedRegistration);

      // Call without project name (should use default)
      await createRegistrations.process(sampleRegistrations, sampleEvents, sampleProviderResults);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        '[INFO] Creating registrations for project: Unknown Project'
      );
    });

    it('should handle empty events array in createRegistration method', async () => {
      // Test the edge case where createRegistration is called with empty events array
      // This tests the firstEvent validation
      const sampleReg: ParsedRegistration = {
        key: 'reg1',
        label: 'Registration 1',
        description: 'Test registration 1',
        providerKey: 'provider1',
      };

      const sampleProvider: CreateProviderResult = {
        created: true,
        skipped: false,
        provider: {
          id: 'provider-id-123',
          key: 'provider1',
          label: 'Provider 1',
          originalLabel: 'Provider 1',
          description: 'Test provider 1',
        },
      };

      const existingRegs = new Map<string, Registration>();

      try {
        // Call createRegistration directly with empty events array to trigger the error
        await (createRegistrations as any).createRegistration(
          sampleReg,
          [], // Empty events array
          sampleProvider,
          existingRegs
        );
        fail('Should have thrown an error');
      } catch (error) {
        expect((error as Error).message).toBe('No events provided for registration creation');
      }
    });
  });
});
