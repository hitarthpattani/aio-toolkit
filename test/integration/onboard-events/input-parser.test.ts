/**
 * <license header>
 */

import InputParser from '../../../src/integration/onboard-events/input-parser';
import type {
  OnboardEventsInput,
  OnboardProvider,
  OnboardRegistration,
  OnboardEvent,
} from '../../../src/integration/onboard-events/types';

describe('InputParser', () => {
  describe('Constructor and Entity Creation', () => {
    it('should parse complete input structure correctly', () => {
      const input: OnboardEventsInput = {
        providers: [
          {
            key: 'provider1',
            label: 'Provider 1',
            description: 'Test provider 1',
            docsUrl: 'https://docs.provider1.com',
            registrations: [
              {
                key: 'reg1',
                label: 'Registration 1',
                description: 'Test registration 1',
                events: [
                  {
                    eventCode: 'event1',
                    runtimeAction: 'action1',
                    deliveryType: 'webhook',
                    sampleEventTemplate: { test: 'data1' },
                  },
                  {
                    eventCode: 'event2',
                    runtimeAction: 'action2',
                    deliveryType: 'journal',
                    sampleEventTemplate: { test: 'data2' },
                  },
                ],
              },
              {
                key: 'reg2',
                label: 'Registration 2',
                description: 'Test registration 2',
                events: [
                  {
                    eventCode: 'event3',
                    runtimeAction: 'action3',
                    deliveryType: 'webhook',
                    sampleEventTemplate: { test: 'data3' },
                  },
                ],
              },
            ],
          },
          {
            key: 'provider2',
            label: 'Provider 2',
            description: 'Test provider 2',
            docsUrl: null,
            registrations: [
              {
                key: 'reg3',
                label: 'Registration 3',
                description: 'Test registration 3',
                events: [
                  {
                    eventCode: 'event4',
                    runtimeAction: 'action4',
                    deliveryType: 'webhook_batch',
                    sampleEventTemplate: { test: 'data4' },
                  },
                ],
              },
            ],
          },
        ],
      };

      const parser = new InputParser(input);
      const entities = parser.getEntities();

      // Verify providers
      expect(entities.providers).toHaveLength(2);
      expect(entities.providers[0]).toEqual({
        key: 'provider1',
        label: 'Provider 1',
        description: 'Test provider 1',
        docsUrl: 'https://docs.provider1.com',
      });
      expect(entities.providers[1]).toEqual({
        key: 'provider2',
        label: 'Provider 2',
        description: 'Test provider 2',
        docsUrl: null,
      });

      // Verify registrations
      expect(entities.registrations).toHaveLength(3);
      expect(entities.registrations[0]).toEqual({
        key: 'reg1',
        label: 'Registration 1',
        description: 'Test registration 1',
        providerKey: 'provider1',
      });
      expect(entities.registrations[1]).toEqual({
        key: 'reg2',
        label: 'Registration 2',
        description: 'Test registration 2',
        providerKey: 'provider1',
      });
      expect(entities.registrations[2]).toEqual({
        key: 'reg3',
        label: 'Registration 3',
        description: 'Test registration 3',
        providerKey: 'provider2',
      });

      // Verify events
      expect(entities.events).toHaveLength(4);
      expect(entities.events[0]).toEqual({
        eventCode: 'event1',
        runtimeAction: 'action1',
        deliveryType: 'webhook',
        sampleEventTemplate: { test: 'data1' },
        registrationKey: 'reg1',
        providerKey: 'provider1',
      });
      expect(entities.events[1]).toEqual({
        eventCode: 'event2',
        runtimeAction: 'action2',
        deliveryType: 'journal',
        sampleEventTemplate: { test: 'data2' },
        registrationKey: 'reg1',
        providerKey: 'provider1',
      });
      expect(entities.events[2]).toEqual({
        eventCode: 'event3',
        runtimeAction: 'action3',
        deliveryType: 'webhook',
        sampleEventTemplate: { test: 'data3' },
        registrationKey: 'reg2',
        providerKey: 'provider1',
      });
      expect(entities.events[3]).toEqual({
        eventCode: 'event4',
        runtimeAction: 'action4',
        deliveryType: 'webhook_batch',
        sampleEventTemplate: { test: 'data4' },
        registrationKey: 'reg3',
        providerKey: 'provider2',
      });
    });

    it('should handle empty providers array', () => {
      const input: OnboardEventsInput = {
        providers: [],
      };

      const parser = new InputParser(input);
      const entities = parser.getEntities();

      expect(entities.providers).toHaveLength(0);
      expect(entities.registrations).toHaveLength(0);
      expect(entities.events).toHaveLength(0);
    });

    it('should handle provider without registrations', () => {
      const input: OnboardEventsInput = {
        providers: [
          {
            key: 'provider1',
            label: 'Provider 1',
            description: 'Test provider 1',
            docsUrl: 'https://docs.provider1.com',
            registrations: [],
          },
        ],
      };

      const parser = new InputParser(input);
      const entities = parser.getEntities();

      expect(entities.providers).toHaveLength(1);
      expect(entities.providers[0]).toEqual({
        key: 'provider1',
        label: 'Provider 1',
        description: 'Test provider 1',
        docsUrl: 'https://docs.provider1.com',
      });
      expect(entities.registrations).toHaveLength(0);
      expect(entities.events).toHaveLength(0);
    });

    it('should handle registration without events', () => {
      const input: OnboardEventsInput = {
        providers: [
          {
            key: 'provider1',
            label: 'Provider 1',
            description: 'Test provider 1',
            docsUrl: null,
            registrations: [
              {
                key: 'reg1',
                label: 'Registration 1',
                description: 'Test registration 1',
                events: [],
              },
            ],
          },
        ],
      };

      const parser = new InputParser(input);
      const entities = parser.getEntities();

      expect(entities.providers).toHaveLength(1);
      expect(entities.registrations).toHaveLength(1);
      expect(entities.registrations[0]).toEqual({
        key: 'reg1',
        label: 'Registration 1',
        description: 'Test registration 1',
        providerKey: 'provider1',
      });
      expect(entities.events).toHaveLength(0);
    });

    it('should handle single provider with single registration and single event', () => {
      const input: OnboardEventsInput = {
        providers: [
          {
            key: 'simple-provider',
            label: 'Simple Provider',
            description: 'Simple provider description',
            docsUrl: 'https://docs.simple.com',
            registrations: [
              {
                key: 'simple-reg',
                label: 'Simple Registration',
                description: 'Simple registration description',
                events: [
                  {
                    eventCode: 'simple.event',
                    runtimeAction: 'simple/action',
                    deliveryType: 'webhook',
                    sampleEventTemplate: { simple: 'template' },
                  },
                ],
              },
            ],
          },
        ],
      };

      const parser = new InputParser(input);
      const entities = parser.getEntities();

      expect(entities.providers).toHaveLength(1);
      expect(entities.registrations).toHaveLength(1);
      expect(entities.events).toHaveLength(1);

      expect(entities.providers[0].key).toBe('simple-provider');
      expect(entities.registrations[0].key).toBe('simple-reg');
      expect(entities.registrations[0].providerKey).toBe('simple-provider');
      expect(entities.events[0].eventCode).toBe('simple.event');
      expect(entities.events[0].registrationKey).toBe('simple-reg');
      expect(entities.events[0].providerKey).toBe('simple-provider');
    });
  });

  describe('createProviderEntity', () => {
    let parser: InputParser;

    beforeEach(() => {
      // Create parser with minimal input to access private methods
      const input: OnboardEventsInput = { providers: [] };
      parser = new InputParser(input);
    });

    it('should create provider entity with all fields', () => {
      const provider: OnboardProvider = {
        key: 'test-provider',
        label: 'Test Provider',
        description: 'Test provider description',
        docsUrl: 'https://docs.test.com',
        registrations: [],
      };

      const result = (parser as any).createProviderEntity(provider);

      expect(result).toEqual({
        key: 'test-provider',
        label: 'Test Provider',
        description: 'Test provider description',
        docsUrl: 'https://docs.test.com',
      });
    });

    it('should create provider entity with null docsUrl', () => {
      const provider: OnboardProvider = {
        key: 'test-provider',
        label: 'Test Provider',
        description: 'Test provider description',
        docsUrl: null,
        registrations: [],
      };

      const result = (parser as any).createProviderEntity(provider);

      expect(result).toEqual({
        key: 'test-provider',
        label: 'Test Provider',
        description: 'Test provider description',
        docsUrl: null,
      });
    });

    it('should create provider entity with empty description', () => {
      const provider: OnboardProvider = {
        key: 'test-provider',
        label: 'Test Provider',
        description: '',
        docsUrl: 'https://docs.test.com',
        registrations: [],
      };

      const result = (parser as any).createProviderEntity(provider);

      expect(result).toEqual({
        key: 'test-provider',
        label: 'Test Provider',
        description: '',
        docsUrl: 'https://docs.test.com',
      });
    });
  });

  describe('createRegistrationEntity', () => {
    let parser: InputParser;

    beforeEach(() => {
      const input: OnboardEventsInput = { providers: [] };
      parser = new InputParser(input);
    });

    it('should create registration entity with all fields', () => {
      const registration: OnboardRegistration = {
        key: 'test-registration',
        label: 'Test Registration',
        description: 'Test registration description',
        events: [],
      };

      const result = (parser as any).createRegistrationEntity(registration, 'test-provider');

      expect(result).toEqual({
        key: 'test-registration',
        label: 'Test Registration',
        description: 'Test registration description',
        providerKey: 'test-provider',
      });
    });

    it('should create registration entity with empty description', () => {
      const registration: OnboardRegistration = {
        key: 'test-registration',
        label: 'Test Registration',
        description: '',
        events: [],
      };

      const result = (parser as any).createRegistrationEntity(registration, 'test-provider');

      expect(result).toEqual({
        key: 'test-registration',
        label: 'Test Registration',
        description: '',
        providerKey: 'test-provider',
      });
    });

    it('should properly link registration to provider', () => {
      const registration: OnboardRegistration = {
        key: 'linked-registration',
        label: 'Linked Registration',
        description: 'Linked to parent provider',
        events: [],
      };

      const result = (parser as any).createRegistrationEntity(registration, 'parent-provider');

      expect(result.providerKey).toBe('parent-provider');
    });
  });

  describe('createEventEntity', () => {
    let parser: InputParser;

    beforeEach(() => {
      const input: OnboardEventsInput = { providers: [] };
      parser = new InputParser(input);
    });

    it('should create event entity with all fields', () => {
      const event: OnboardEvent = {
        eventCode: 'test.event.code',
        runtimeAction: 'test/runtime/action',
        deliveryType: 'webhook',
        sampleEventTemplate: { test: 'template', nested: { data: 'value' } },
      };

      const result = (parser as any).createEventEntity(event, 'test-registration', 'test-provider');

      expect(result).toEqual({
        eventCode: 'test.event.code',
        runtimeAction: 'test/runtime/action',
        deliveryType: 'webhook',
        sampleEventTemplate: { test: 'template', nested: { data: 'value' } },
        registrationKey: 'test-registration',
        providerKey: 'test-provider',
      });
    });

    it('should handle different delivery types', () => {
      const deliveryTypes = ['webhook', 'webhook_batch', 'journal', 'aws_eventbridge'];

      deliveryTypes.forEach(deliveryType => {
        const event: OnboardEvent = {
          eventCode: 'test.event',
          runtimeAction: 'test/action',
          deliveryType,
          sampleEventTemplate: {},
        };

        const result = (parser as any).createEventEntity(
          event,
          'test-registration',
          'test-provider'
        );

        expect(result.deliveryType).toBe(deliveryType);
      });
    });

    it('should handle empty runtime action', () => {
      const event: OnboardEvent = {
        eventCode: 'test.event',
        runtimeAction: '',
        deliveryType: 'webhook',
        sampleEventTemplate: {},
      };

      const result = (parser as any).createEventEntity(event, 'test-registration', 'test-provider');

      expect(result.runtimeAction).toBe('');
    });

    it('should handle complex sample event template', () => {
      const complexTemplate = {
        metadata: {
          id: '{{event.id}}',
          timestamp: '{{event.timestamp}}',
        },
        data: {
          customer: {
            id: '{{customer.id}}',
            email: '{{customer.email}}',
          },
          order: {
            id: '{{order.id}}',
            items: [
              {
                sku: '{{item.sku}}',
                quantity: '{{item.quantity}}',
              },
            ],
          },
        },
      };

      const event: OnboardEvent = {
        eventCode: 'commerce.order.created',
        runtimeAction: 'commerce/order/handler',
        deliveryType: 'webhook',
        sampleEventTemplate: complexTemplate,
      };

      const result = (parser as any).createEventEntity(
        event,
        'commerce-registration',
        'commerce-provider'
      );

      expect(result.sampleEventTemplate).toEqual(complexTemplate);
      expect(result.registrationKey).toBe('commerce-registration');
      expect(result.providerKey).toBe('commerce-provider');
    });

    it('should properly link event to registration and provider', () => {
      const event: OnboardEvent = {
        eventCode: 'linked.event',
        runtimeAction: 'linked/action',
        deliveryType: 'webhook',
        sampleEventTemplate: {},
      };

      const result = (parser as any).createEventEntity(
        event,
        'parent-registration',
        'parent-provider'
      );

      expect(result.registrationKey).toBe('parent-registration');
      expect(result.providerKey).toBe('parent-provider');
    });
  });

  describe('getEntities', () => {
    it('should return the same entities reference', () => {
      const input: OnboardEventsInput = {
        providers: [
          {
            key: 'provider1',
            label: 'Provider 1',
            description: 'Test provider 1',
            docsUrl: null,
            registrations: [
              {
                key: 'reg1',
                label: 'Registration 1',
                description: 'Test registration 1',
                events: [
                  {
                    eventCode: 'event1',
                    runtimeAction: 'action1',
                    deliveryType: 'webhook',
                    sampleEventTemplate: { test: 'data' },
                  },
                ],
              },
            ],
          },
        ],
      };

      const parser = new InputParser(input);
      const entities1 = parser.getEntities();
      const entities2 = parser.getEntities();

      // Should return the same reference
      expect(entities1).toBe(entities2);

      // Should have the expected structure
      expect(entities1.providers).toHaveLength(1);
      expect(entities1.registrations).toHaveLength(1);
      expect(entities1.events).toHaveLength(1);
    });

    it('should return entities with proper structure', () => {
      const input: OnboardEventsInput = { providers: [] };
      const parser = new InputParser(input);
      const entities = parser.getEntities();

      expect(entities).toHaveProperty('providers');
      expect(entities).toHaveProperty('registrations');
      expect(entities).toHaveProperty('events');
      expect(Array.isArray(entities.providers)).toBe(true);
      expect(Array.isArray(entities.registrations)).toBe(true);
      expect(Array.isArray(entities.events)).toBe(true);
    });
  });

  describe('Complex Integration Scenarios', () => {
    it('should handle mixed provider types with varying complexity', () => {
      const input: OnboardEventsInput = {
        providers: [
          // Simple provider with minimal data
          {
            key: 'simple',
            label: 'Simple',
            description: '',
            docsUrl: null,
            registrations: [
              {
                key: 'simple-reg',
                label: 'Simple Reg',
                description: '',
                events: [
                  {
                    eventCode: 'simple.event',
                    runtimeAction: '',
                    deliveryType: 'webhook',
                    sampleEventTemplate: {},
                  },
                ],
              },
            ],
          },
          // Complex provider with rich data
          {
            key: 'commerce-events',
            label: 'Adobe Commerce Events',
            description: 'Complete commerce event integration',
            docsUrl: 'https://developer.adobe.com/commerce/events/',
            registrations: [
              {
                key: 'customer-events',
                label: 'Customer Events',
                description: 'Customer lifecycle events',
                events: [
                  {
                    eventCode: 'commerce.customer.created',
                    runtimeAction: 'commerce/customer/created',
                    deliveryType: 'webhook',
                    sampleEventTemplate: {
                      customer: {
                        id: '{{customer.id}}',
                        email: '{{customer.email}}',
                      },
                    },
                  },
                  {
                    eventCode: 'commerce.customer.updated',
                    runtimeAction: 'commerce/customer/updated',
                    deliveryType: 'journal',
                    sampleEventTemplate: {
                      customer: {
                        id: '{{customer.id}}',
                        changes: '{{customer.changes}}',
                      },
                    },
                  },
                ],
              },
              {
                key: 'order-events',
                label: 'Order Events',
                description: 'Order processing events',
                events: [
                  {
                    eventCode: 'commerce.order.placed',
                    runtimeAction: 'commerce/order/placed',
                    deliveryType: 'webhook_batch',
                    sampleEventTemplate: {
                      order: {
                        id: '{{order.id}}',
                        total: '{{order.total}}',
                      },
                    },
                  },
                ],
              },
            ],
          },
        ],
      };

      const parser = new InputParser(input);
      const entities = parser.getEntities();

      // Verify total counts
      expect(entities.providers).toHaveLength(2);
      expect(entities.registrations).toHaveLength(3);
      expect(entities.events).toHaveLength(4);

      // Verify cross-references are correct
      const customerReg = entities.registrations.find(r => r.key === 'customer-events');
      expect(customerReg?.providerKey).toBe('commerce-events');

      const customerCreatedEvent = entities.events.find(
        e => e.eventCode === 'commerce.customer.created'
      );
      expect(customerCreatedEvent?.registrationKey).toBe('customer-events');
      expect(customerCreatedEvent?.providerKey).toBe('commerce-events');

      const orderEvent = entities.events.find(e => e.eventCode === 'commerce.order.placed');
      expect(orderEvent?.registrationKey).toBe('order-events');
      expect(orderEvent?.providerKey).toBe('commerce-events');
    });

    it('should maintain proper relationships across all entity types', () => {
      const input: OnboardEventsInput = {
        providers: [
          {
            key: 'multi-provider',
            label: 'Multi Provider',
            description: 'Provider with multiple registrations',
            docsUrl: 'https://docs.multi.com',
            registrations: [
              {
                key: 'reg-a',
                label: 'Registration A',
                description: 'First registration',
                events: [
                  {
                    eventCode: 'multi.a.event1',
                    runtimeAction: 'multi/a/event1',
                    deliveryType: 'webhook',
                    sampleEventTemplate: { type: 'a1' },
                  },
                  {
                    eventCode: 'multi.a.event2',
                    runtimeAction: 'multi/a/event2',
                    deliveryType: 'journal',
                    sampleEventTemplate: { type: 'a2' },
                  },
                ],
              },
              {
                key: 'reg-b',
                label: 'Registration B',
                description: 'Second registration',
                events: [
                  {
                    eventCode: 'multi.b.event1',
                    runtimeAction: 'multi/b/event1',
                    deliveryType: 'webhook_batch',
                    sampleEventTemplate: { type: 'b1' },
                  },
                ],
              },
            ],
          },
        ],
      };

      const parser = new InputParser(input);
      const entities = parser.getEntities();

      // All registrations should link to the same provider
      entities.registrations.forEach(registration => {
        expect(registration.providerKey).toBe('multi-provider');
      });

      // All events should link to the correct registration and provider
      const regAEvents = entities.events.filter(e => e.registrationKey === 'reg-a');
      const regBEvents = entities.events.filter(e => e.registrationKey === 'reg-b');

      expect(regAEvents).toHaveLength(2);
      expect(regBEvents).toHaveLength(1);

      regAEvents.forEach(event => {
        expect(event.providerKey).toBe('multi-provider');
        expect(event.registrationKey).toBe('reg-a');
      });

      regBEvents.forEach(event => {
        expect(event.providerKey).toBe('multi-provider');
        expect(event.registrationKey).toBe('reg-b');
      });
    });
  });
});
