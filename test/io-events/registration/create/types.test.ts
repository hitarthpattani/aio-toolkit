/**
 * <license header>
 */

import type {
  EventsOfInterestInputModel,
  RegistrationCreateModel,
} from '../../../../src/io-events/registration/create/types';

describe('Create Registration Types', () => {
  describe('EventsOfInterestInputModel', () => {
    it('should define a valid event of interest', () => {
      const event: EventsOfInterestInputModel = {
        provider_id: 'dx_commerce_events',
        event_code: 'com.adobe.commerce.customer.created',
      };

      expect(event.provider_id).toBe('dx_commerce_events');
      expect(event.event_code).toBe('com.adobe.commerce.customer.created');
    });

    it('should work with different provider and event combinations', () => {
      const events: EventsOfInterestInputModel[] = [
        {
          provider_id: 'custom_provider',
          event_code: 'com.example.user.registered',
        },
        {
          provider_id: 'ecommerce_provider',
          event_code: 'com.shop.order.completed',
        },
        {
          provider_id: 'analytics_provider',
          event_code: 'com.analytics.page.viewed',
        },
      ];

      expect(events).toHaveLength(3);
      expect(events[0].provider_id).toBe('custom_provider');
      expect(events[1].event_code).toBe('com.shop.order.completed');
      expect(events[2].provider_id).toBe('analytics_provider');
    });
  });

  describe('RegistrationCreateModel', () => {
    it('should define a valid registration with required fields only', () => {
      const registration: RegistrationCreateModel = {
        client_id: 'my-client-id',
        name: 'Test Registration',
        events_of_interest: [
          {
            provider_id: 'test-provider',
            event_code: 'test.event.code',
          },
        ],
        delivery_type: 'webhook',
      };

      expect(registration.client_id).toBe('my-client-id');
      expect(registration.name).toBe('Test Registration');
      expect(registration.events_of_interest).toHaveLength(1);
      expect(registration.delivery_type).toBe('webhook');
      expect(registration.description).toBeUndefined();
      expect(registration.webhook_url).toBeUndefined();
      expect(registration.runtime_action).toBeUndefined();
      expect(registration.enabled).toBeUndefined();
    });

    it('should define a valid registration with all optional fields', () => {
      const registration: RegistrationCreateModel = {
        client_id: 'my-client-id-complete',
        name: 'Complete Test Registration',
        description: 'A comprehensive test registration with all fields',
        webhook_url: 'https://example.com/webhook/endpoint',
        events_of_interest: [
          {
            provider_id: 'provider1',
            event_code: 'event.code.1',
          },
          {
            provider_id: 'provider2',
            event_code: 'event.code.2',
          },
        ],
        delivery_type: 'webhook_batch',
        runtime_action: 'my-runtime-action',
        enabled: false,
      };

      expect(registration.client_id).toBe('my-client-id-complete');
      expect(registration.name).toBe('Complete Test Registration');
      expect(registration.description).toBe('A comprehensive test registration with all fields');
      expect(registration.webhook_url).toBe('https://example.com/webhook/endpoint');
      expect(registration.events_of_interest).toHaveLength(2);
      expect(registration.delivery_type).toBe('webhook_batch');
      expect(registration.runtime_action).toBe('my-runtime-action');
      expect(registration.enabled).toBe(false);
    });

    it('should support all valid delivery types', () => {
      const deliveryTypes: RegistrationCreateModel['delivery_type'][] = [
        'webhook',
        'webhook_batch',
        'journal',
        'aws_eventbridge',
      ];

      deliveryTypes.forEach(deliveryType => {
        const registration: RegistrationCreateModel = {
          client_id: 'test-client',
          name: `Registration with ${deliveryType}`,
          events_of_interest: [
            {
              provider_id: 'test-provider',
              event_code: 'test.event',
            },
          ],
          delivery_type: deliveryType,
        };

        expect(registration.delivery_type).toBe(deliveryType);
      });
    });

    it('should handle multiple events of interest', () => {
      const registration: RegistrationCreateModel = {
        client_id: 'multi-event-client',
        name: 'Multi Event Registration',
        events_of_interest: [
          {
            provider_id: 'commerce_provider',
            event_code: 'com.adobe.commerce.customer.created',
          },
          {
            provider_id: 'commerce_provider',
            event_code: 'com.adobe.commerce.customer.updated',
          },
          {
            provider_id: 'commerce_provider',
            event_code: 'com.adobe.commerce.customer.deleted',
          },
          {
            provider_id: 'analytics_provider',
            event_code: 'com.analytics.session.started',
          },
          {
            provider_id: 'analytics_provider',
            event_code: 'com.analytics.session.ended',
          },
        ],
        delivery_type: 'webhook',
      };

      expect(registration.events_of_interest).toHaveLength(5);
      expect(registration.events_of_interest[0].provider_id).toBe('commerce_provider');
      expect(registration.events_of_interest[3].provider_id).toBe('analytics_provider');
      expect(registration.events_of_interest[4].event_code).toBe('com.analytics.session.ended');
    });

    it('should work with typical Adobe Commerce use cases', () => {
      const commerceRegistration: RegistrationCreateModel = {
        client_id: 'adobe-commerce-app',
        name: 'Adobe Commerce Customer Management',
        description: 'Registration for Adobe Commerce customer lifecycle events',
        webhook_url: 'https://my-app.adobe.io/webhooks/commerce',
        events_of_interest: [
          {
            provider_id: 'dx_commerce_events',
            event_code: 'com.adobe.commerce.customer.created',
          },
          {
            provider_id: 'dx_commerce_events',
            event_code: 'com.adobe.commerce.customer.updated',
          },
          {
            provider_id: 'dx_commerce_events',
            event_code: 'com.adobe.commerce.order.placed',
          },
          {
            provider_id: 'dx_commerce_events',
            event_code: 'com.adobe.commerce.order.shipped',
          },
        ],
        delivery_type: 'webhook',
        runtime_action: 'commerce-app/process-events',
        enabled: true,
      };

      expect(commerceRegistration.client_id).toBe('adobe-commerce-app');
      expect(commerceRegistration.events_of_interest).toHaveLength(4);
      expect(commerceRegistration.events_of_interest[0].event_code).toBe(
        'com.adobe.commerce.customer.created'
      );
      expect(commerceRegistration.enabled).toBe(true);
    });

    it('should handle empty strings for optional fields', () => {
      const registration: RegistrationCreateModel = {
        client_id: 'empty-fields-client',
        name: 'Registration with empty fields',
        description: '',
        webhook_url: '',
        events_of_interest: [
          {
            provider_id: 'test-provider',
            event_code: 'test.event',
          },
        ],
        delivery_type: 'journal',
        runtime_action: '',
      };

      expect(registration.description).toBe('');
      expect(registration.webhook_url).toBe('');
      expect(registration.runtime_action).toBe('');
    });
  });
});
