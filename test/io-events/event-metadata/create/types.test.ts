/**
 * <license header>
 */

import type { EventMetadataInputModel } from '../../../../src/io-events/event-metadata/create/types';

describe('Create Event Metadata Types', () => {
  describe('EventMetadataInputModel', () => {
    it('should define a valid input model with required fields only', () => {
      const inputModel: EventMetadataInputModel = {
        event_code: 'com.example.user.created',
        label: 'User Created',
        description: 'Triggered when a new user is created',
      };

      expect(inputModel.event_code).toBe('com.example.user.created');
      expect(inputModel.label).toBe('User Created');
      expect(inputModel.description).toBe('Triggered when a new user is created');
      expect(inputModel.sample_event_template).toBeUndefined();
    });

    it('should define a valid input model with all optional fields', () => {
      const inputModel: EventMetadataInputModel = {
        event_code: 'com.example.user.updated',
        label: 'User Updated',
        description: 'Triggered when user information is updated',
        sample_event_template: {
          user_id: '12345',
          name: 'John Doe',
          email: 'john@example.com',
          updated_fields: ['name', 'email'],
        },
      };

      expect(inputModel.event_code).toBe('com.example.user.updated');
      expect(inputModel.label).toBe('User Updated');
      expect(inputModel.description).toBe('Triggered when user information is updated');
      expect(inputModel.sample_event_template).toEqual({
        user_id: '12345',
        name: 'John Doe',
        email: 'john@example.com',
        updated_fields: ['name', 'email'],
      });
    });

    it('should allow undefined sample_event_template', () => {
      const inputModel: EventMetadataInputModel = {
        event_code: 'com.example.user.deleted',
        label: 'User Deleted',
        description: 'Triggered when a user is deleted',
        sample_event_template: undefined,
      };

      expect(inputModel.event_code).toBe('com.example.user.deleted');
      expect(inputModel.label).toBe('User Deleted');
      expect(inputModel.description).toBe('Triggered when a user is deleted');
      expect(inputModel.sample_event_template).toBeUndefined();
    });

    it('should handle typical commerce event scenarios', () => {
      const commerceInputModel: EventMetadataInputModel = {
        event_code: 'com.adobe.commerce.order.placed',
        label: 'Order Placed',
        description: 'Triggered when a customer places an order in Adobe Commerce',
        sample_event_template: {
          order_id: '000000123',
          customer_id: 'customer_456',
          store_id: 1,
          total: 99.99,
          currency: 'USD',
          items: [
            {
              sku: 'PRODUCT-001',
              name: 'Example Product',
              price: 99.99,
              quantity: 1,
            },
          ],
        },
      };

      expect(commerceInputModel.event_code).toBe('com.adobe.commerce.order.placed');
      expect(commerceInputModel.label).toBe('Order Placed');
      expect(commerceInputModel.description).toBe(
        'Triggered when a customer places an order in Adobe Commerce'
      );
      expect(commerceInputModel.sample_event_template).toHaveProperty('order_id', '000000123');
      expect(commerceInputModel.sample_event_template).toHaveProperty(
        'customer_id',
        'customer_456'
      );
      expect(commerceInputModel.sample_event_template).toHaveProperty('total', 99.99);
    });

    it('should handle complex nested sample event templates', () => {
      const complexInputModel: EventMetadataInputModel = {
        event_code: 'com.example.complex.event',
        label: 'Complex Event',
        description: 'A complex event with nested data structures',
        sample_event_template: {
          metadata: {
            version: '1.0',
            source: 'example-system',
            timestamp: '2023-01-01T00:00:00Z',
          },
          data: {
            user: {
              id: 123,
              profile: {
                name: 'John Doe',
                preferences: {
                  notifications: true,
                  theme: 'dark',
                },
              },
            },
            actions: ['login', 'view_profile', 'update_preferences'],
          },
        },
      };

      expect(complexInputModel.event_code).toBe('com.example.complex.event');
      expect(complexInputModel.sample_event_template).toHaveProperty('metadata.version', '1.0');
      expect(complexInputModel.sample_event_template).toHaveProperty('data.user.id', 123);
      expect(complexInputModel.sample_event_template).toHaveProperty(
        'data.user.profile.name',
        'John Doe'
      );
      expect(complexInputModel.sample_event_template).toHaveProperty('data.actions');
      expect((complexInputModel.sample_event_template as any).data.actions).toHaveLength(3);
    });

    it('should work with empty sample event template object', () => {
      const inputModel: EventMetadataInputModel = {
        event_code: 'com.example.empty.template',
        label: 'Empty Template Event',
        description: 'Event with empty template',
        sample_event_template: {},
      };

      expect(inputModel.event_code).toBe('com.example.empty.template');
      expect(inputModel.sample_event_template).toEqual({});
    });
  });
});
