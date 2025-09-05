/**
 * Copyright © Adobe, Inc. All rights reserved.
 */

import type { Registration } from '../../../src/io-events/registration/types';

describe('Registration Types', () => {
  describe('Registration interface', () => {
    it('should define a valid registration with required fields only', () => {
      const registration: Registration = {
        registration_id: 'test-registration-123',
        name: 'Test Registration',
        delivery_type: 'webhook',
        enabled: true,
        created_date: '2023-01-01T00:00:00.000Z',
        updated_date: '2023-01-01T00:00:00.000Z',
      };

      expect(registration.registration_id).toBe('test-registration-123');
      expect(registration.name).toBe('Test Registration');
      expect(registration.delivery_type).toBe('webhook');
      expect(registration.enabled).toBe(true);
      expect(registration.created_date).toBe('2023-01-01T00:00:00.000Z');
      expect(registration.updated_date).toBe('2023-01-01T00:00:00.000Z');
    });

    it('should define a valid registration with all optional fields', () => {
      const registration: Registration = {
        registration_id: 'test-registration-456',
        name: 'Complete Registration',
        description: 'A complete registration with all fields',
        webhook_url: 'https://example.com/webhook',
        events_of_interest: [
          {
            provider_id: 'provider-123',
            event_code: 'com.example.user.created',
          },
          {
            provider_id: 'provider-456',
            event_code: 'com.example.order.placed',
          },
        ],
        delivery_type: 'webhook_batch',
        enabled: false,
        created_date: '2023-01-15T10:30:00.000Z',
        updated_date: '2023-01-16T14:45:00.000Z',
        runtime_action: 'my-runtime-action',
        custom_field: 'custom value',
      };

      expect(registration.registration_id).toBe('test-registration-456');
      expect(registration.name).toBe('Complete Registration');
      expect(registration.description).toBe('A complete registration with all fields');
      expect(registration.webhook_url).toBe('https://example.com/webhook');
      expect(registration.events_of_interest).toHaveLength(2);
      expect(registration.events_of_interest![0].provider_id).toBe('provider-123');
      expect(registration.events_of_interest![0].event_code).toBe('com.example.user.created');
      expect(registration.delivery_type).toBe('webhook_batch');
      expect(registration.enabled).toBe(false);
      expect(registration.runtime_action).toBe('my-runtime-action');
      expect(registration.custom_field).toBe('custom value');
    });

    it('should allow undefined optional fields', () => {
      const registration: Registration = {
        registration_id: 'test-registration-789',
        name: 'Minimal Registration',
        description: undefined,
        webhook_url: undefined,
        events_of_interest: undefined,
        delivery_type: 'journal',
        enabled: true,
        created_date: '2023-01-01T00:00:00.000Z',
        updated_date: '2023-01-01T00:00:00.000Z',
        runtime_action: undefined,
      };

      expect(registration.description).toBeUndefined();
      expect(registration.webhook_url).toBeUndefined();
      expect(registration.events_of_interest).toBeUndefined();
      expect(registration.runtime_action).toBeUndefined();
    });

    it('should handle empty strings for optional string fields', () => {
      const registration: Registration = {
        registration_id: 'test-registration-empty',
        name: 'Registration with empty fields',
        description: '',
        webhook_url: '',
        delivery_type: 'aws_eventbridge',
        enabled: true,
        created_date: '2023-01-01T00:00:00.000Z',
        updated_date: '2023-01-01T00:00:00.000Z',
        runtime_action: '',
      };

      expect(registration.description).toBe('');
      expect(registration.webhook_url).toBe('');
      expect(registration.runtime_action).toBe('');
    });

    it('should work with realistic registration data', () => {
      const registration: Registration = {
        registration_id: 'reg_12345abcdef',
        name: 'Adobe Commerce Customer Events',
        description: 'Registration for customer-related events in Adobe Commerce',
        webhook_url: 'https://my-app.example.com/webhooks/adobe-commerce',
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
        ],
        delivery_type: 'webhook',
        enabled: true,
        created_date: '2023-12-01T09:30:00.000Z',
        updated_date: '2023-12-15T16:45:30.000Z',
        runtime_action: 'my-app/process-commerce-events',
        environment: 'production',
        version: '1.2.0',
      };

      expect(registration.registration_id).toBe('reg_12345abcdef');
      expect(registration.events_of_interest).toHaveLength(3);
      expect(registration.events_of_interest![0].event_code).toBe(
        'com.adobe.commerce.customer.created'
      );
      expect(registration.environment).toBe('production');
      expect(registration.version).toBe('1.2.0');
    });

    it('should handle empty events_of_interest array', () => {
      const registration: Registration = {
        registration_id: 'test-registration-empty-events',
        name: 'Registration with empty events',
        events_of_interest: [],
        delivery_type: 'webhook',
        enabled: true,
        created_date: '2023-01-01T00:00:00.000Z',
        updated_date: '2023-01-01T00:00:00.000Z',
      };

      expect(registration.events_of_interest).toEqual([]);
      expect(registration.events_of_interest).toHaveLength(0);
    });
  });
});
