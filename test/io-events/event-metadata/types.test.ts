/**
 * Copyright © Adobe, Inc. All rights reserved.
 */

import type { EventMetadata } from '../../../src/io-events/event-metadata/types';

describe('Event Metadata Types', () => {
  describe('EventMetadata interface', () => {
    it('should define a valid event metadata with required fields only', () => {
      const eventMetadata: EventMetadata = {
        event_code: 'com.example.user.created',
      };

      expect(eventMetadata.event_code).toBe('com.example.user.created');
      expect(eventMetadata.label).toBeUndefined();
      expect(eventMetadata.description).toBeUndefined();
      expect(eventMetadata.sample_event_template).toBeUndefined();
    });

    it('should define a valid event metadata with all optional fields', () => {
      const eventMetadata: EventMetadata = {
        event_code: 'com.example.user.created',
        label: 'User Created',
        description: 'Triggered when a new user is created',
        sample_event_template: '{"name":"John Doe","email":"john@example.com"}',
        custom_field: 'custom_value',
      };

      expect(eventMetadata.event_code).toBe('com.example.user.created');
      expect(eventMetadata.label).toBe('User Created');
      expect(eventMetadata.description).toBe('Triggered when a new user is created');
      expect(eventMetadata.sample_event_template).toBe(
        '{"name":"John Doe","email":"john@example.com"}'
      );
      expect(eventMetadata.custom_field).toBe('custom_value');
    });

    it('should allow undefined optional fields', () => {
      const eventMetadata: EventMetadata = {
        event_code: 'com.example.user.updated',
        label: undefined,
        description: undefined,
        sample_event_template: undefined,
      };

      expect(eventMetadata.event_code).toBe('com.example.user.updated');
      expect(eventMetadata.label).toBeUndefined();
      expect(eventMetadata.description).toBeUndefined();
      expect(eventMetadata.sample_event_template).toBeUndefined();
    });

    it('should handle empty strings for optional string fields', () => {
      const eventMetadata: EventMetadata = {
        event_code: 'com.example.user.deleted',
        label: '',
        description: '',
        sample_event_template: '',
      };

      expect(eventMetadata.event_code).toBe('com.example.user.deleted');
      expect(eventMetadata.label).toBe('');
      expect(eventMetadata.description).toBe('');
      expect(eventMetadata.sample_event_template).toBe('');
    });

    it('should work with realistic event metadata data', () => {
      const eventMetadata: EventMetadata = {
        event_code: 'com.adobe.commerce.order.placed',
        label: 'Order Placed',
        description: 'Triggered when a customer places an order',
        sample_event_template: '{"order_id":"12345","customer_id":"67890","total":99.99}',
        provider_id: 'commerce-provider-123',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z',
      };

      expect(eventMetadata.event_code).toBe('com.adobe.commerce.order.placed');
      expect(eventMetadata.label).toBe('Order Placed');
      expect(eventMetadata.description).toBe('Triggered when a customer places an order');
      expect(eventMetadata.sample_event_template).toBe(
        '{"order_id":"12345","customer_id":"67890","total":99.99}'
      );
      expect(eventMetadata.provider_id).toBe('commerce-provider-123');
      expect(eventMetadata.created_at).toBe('2023-01-01T00:00:00Z');
      expect(eventMetadata.updated_at).toBe('2023-01-02T00:00:00Z');
    });
  });
});
