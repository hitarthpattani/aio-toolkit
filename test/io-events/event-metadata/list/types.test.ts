/**
 * <license header>
 */

import type { EventMetadataListResponse } from '../../../../src/io-events/event-metadata/list/types';
import type { EventMetadata } from '../../../../src/io-events/event-metadata/types';

describe('List Event Metadata Types', () => {
  describe('EventMetadataListResponse', () => {
    it('should define a valid response with empty array', () => {
      const response: EventMetadataListResponse = {
        _embedded: {
          eventmetadata: [],
        },
        _links: {
          self: {
            href: '/events/providers/provider-123/eventmetadata',
          },
        },
      };

      expect(response._embedded!.eventmetadata).toEqual([]);
      expect(response._links!.self!.href).toBe('/events/providers/provider-123/eventmetadata');
    });

    it('should define a valid response with single event metadata', () => {
      const eventMetadata: EventMetadata = {
        event_code: 'com.example.user.created',
        label: 'User Created',
        description: 'Triggered when a new user is created',
        sample_event_template: '{"user_id":"12345","name":"John Doe"}',
      };

      const response: EventMetadataListResponse = {
        _embedded: {
          eventmetadata: [eventMetadata],
        },
        _links: {
          self: {
            href: '/events/providers/provider-123/eventmetadata',
          },
        },
      };

      expect(response._embedded!.eventmetadata).toHaveLength(1);
      expect(response._embedded!.eventmetadata[0]).toEqual(eventMetadata);
      expect(response._links!.self!.href).toBe('/events/providers/provider-123/eventmetadata');
    });

    it('should define a valid response with multiple event metadata items', () => {
      const eventMetadata1: EventMetadata = {
        event_code: 'com.example.user.created',
        label: 'User Created',
        description: 'Triggered when a new user is created',
      };

      const eventMetadata2: EventMetadata = {
        event_code: 'com.example.user.updated',
        label: 'User Updated',
        description: 'Triggered when user information is updated',
        sample_event_template: '{"user_id":"67890","updated_fields":["name","email"]}',
      };

      const response: EventMetadataListResponse = {
        _embedded: {
          eventmetadata: [eventMetadata1, eventMetadata2],
        },
        _links: {
          self: {
            href: '/events/providers/provider-123/eventmetadata',
          },
        },
      };

      expect(response._embedded!.eventmetadata).toHaveLength(2);
      expect(response._embedded!.eventmetadata[0]).toEqual(eventMetadata1);
      expect(response._embedded!.eventmetadata[1]).toEqual(eventMetadata2);
    });

    it('should handle HAL links with various properties', () => {
      const response: EventMetadataListResponse = {
        _embedded: {
          eventmetadata: [],
        },
        _links: {
          self: {
            href: '/events/providers/provider-123/eventmetadata',
            type: 'application/hal+json',
            title: 'Event Metadata List',
          } as any,
        },
      };

      expect(response._links!.self!.href).toBe('/events/providers/provider-123/eventmetadata');
      expect((response._links!.self as any).type).toBe('application/hal+json');
      expect((response._links!.self as any).title).toBe('Event Metadata List');
    });

    it('should work with realistic Commerce event metadata', () => {
      const orderPlacedMetadata: EventMetadata = {
        event_code: 'com.adobe.commerce.order.placed',
        label: 'Order Placed',
        description: 'Triggered when a customer places an order',
        sample_event_template: '{"order_id":"000000123","customer_id":"456","total":99.99}',
      };

      const productUpdatedMetadata: EventMetadata = {
        event_code: 'com.adobe.commerce.product.updated',
        label: 'Product Updated',
        description: 'Triggered when product information is updated',
        sample_event_template:
          '{"product_id":"789","sku":"PRODUCT-001","updated_fields":["price","stock"]}',
      };

      const response: EventMetadataListResponse = {
        _embedded: {
          eventmetadata: [orderPlacedMetadata, productUpdatedMetadata],
        },
        _links: {
          self: {
            href: '/events/consumers/consumer-123/projects/project-456/workspaces/workspace-789/providers/commerce-provider/eventmetadata',
          },
        },
      };

      expect(response._embedded!.eventmetadata).toHaveLength(2);
      expect(response._embedded!.eventmetadata[0].event_code).toBe(
        'com.adobe.commerce.order.placed'
      );
      expect(response._embedded!.eventmetadata[1].event_code).toBe(
        'com.adobe.commerce.product.updated'
      );
      expect(response._links!.self!.href).toContain('commerce-provider');
    });

    it('should allow additional properties via index signature', () => {
      const response: EventMetadataListResponse = {
        _embedded: {
          eventmetadata: [],
        },
        _links: {
          self: {
            href: '/events/providers/provider-123/eventmetadata',
          },
        },
        total_count: 0,
        page_size: 20,
        current_page: 1,
      };

      expect(response.total_count).toBe(0);
      expect(response.page_size).toBe(20);
      expect(response.current_page).toBe(1);
    });
  });
});
