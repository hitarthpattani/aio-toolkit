/**
 * <license header>
 */

import type {
  RegistrationListResponse,
  ListRegistrationQueryParams,
} from '../../../../src/io-events/registration/list/types';
import type { Registration } from '../../../../src/io-events/registration/types';

describe('List Registration Types', () => {
  describe('RegistrationListResponse', () => {
    it('should define a valid response with empty array', () => {
      const response: RegistrationListResponse = {
        _embedded: {
          registrations: [],
        },
        _links: {
          self: {
            href: '/events/consumer123/project456/workspace789/registrations',
          },
        },
      };

      expect(response._embedded!.registrations).toEqual([]);
      expect(response._links!.self!.href).toBe(
        '/events/consumer123/project456/workspace789/registrations'
      );
    });

    it('should define a valid response with single registration', () => {
      const mockRegistration: Registration = {
        registration_id: 'test-reg-123',
        name: 'Test Registration',
        description: 'A test registration',
        delivery_type: 'webhook',
        enabled: true,
        created_date: '2023-01-01T00:00:00.000Z',
        updated_date: '2023-01-01T00:00:00.000Z',
      };

      const response: RegistrationListResponse = {
        _embedded: {
          registrations: [mockRegistration],
        },
        _links: {
          self: {
            href: '/events/consumer123/project456/workspace789/registrations',
          },
        },
      };

      expect(response._embedded!.registrations).toHaveLength(1);
      expect(response._embedded!.registrations![0]).toEqual(mockRegistration);
    });

    it('should define a valid response with multiple registrations', () => {
      const mockRegistrations: Registration[] = [
        {
          registration_id: 'reg-001',
          name: 'First Registration',
          delivery_type: 'webhook',
          enabled: true,
          created_date: '2023-01-01T00:00:00.000Z',
          updated_date: '2023-01-01T00:00:00.000Z',
        },
        {
          registration_id: 'reg-002',
          name: 'Second Registration',
          delivery_type: 'webhook_batch',
          enabled: false,
          created_date: '2023-01-02T00:00:00.000Z',
          updated_date: '2023-01-02T00:00:00.000Z',
        },
        {
          registration_id: 'reg-003',
          name: 'Third Registration',
          delivery_type: 'journal',
          enabled: true,
          created_date: '2023-01-03T00:00:00.000Z',
          updated_date: '2023-01-03T00:00:00.000Z',
        },
      ];

      const response: RegistrationListResponse = {
        _embedded: {
          registrations: mockRegistrations,
        },
        _links: {
          self: {
            href: '/events/consumer123/project456/workspace789/registrations',
          },
        },
      };

      expect(response._embedded!.registrations).toHaveLength(3);
      expect(response._embedded!.registrations![0].registration_id).toBe('reg-001');
      expect(response._embedded!.registrations![1].registration_id).toBe('reg-002');
      expect(response._embedded!.registrations![2].registration_id).toBe('reg-003');
    });

    it('should handle HAL links with various properties', () => {
      const response: RegistrationListResponse = {
        _embedded: {
          registrations: [],
        },
        _links: {
          self: {
            href: '/events/consumer123/project456/workspace789/registrations?page=1',
          },
          next: {
            href: '/events/consumer123/project456/workspace789/registrations?page=2',
          },
        },
      };

      expect(response._links!.self!.href).toContain('page=1');
      expect(response._links!.next!.href).toContain('page=2');
    });

    it('should work with realistic registration data', () => {
      const commerceRegistrations: Registration[] = [
        {
          registration_id: 'commerce-customers-001',
          name: 'Adobe Commerce Customer Events',
          description: 'Registration for all customer lifecycle events',
          webhook_url: 'https://my-app.adobe.io/webhooks/customers',
          events_of_interest: [
            {
              provider_id: 'dx_commerce_events',
              event_code: 'com.adobe.commerce.customer.created',
            },
            {
              provider_id: 'dx_commerce_events',
              event_code: 'com.adobe.commerce.customer.updated',
            },
          ],
          delivery_type: 'webhook',
          enabled: true,
          created_date: '2023-12-01T09:30:00.000Z',
          updated_date: '2023-12-15T16:45:30.000Z',
          runtime_action: 'commerce-app/process-customer-events',
        },
        {
          registration_id: 'commerce-orders-002',
          name: 'Adobe Commerce Order Events',
          description: 'Registration for order processing events',
          webhook_url: 'https://my-app.adobe.io/webhooks/orders',
          events_of_interest: [
            {
              provider_id: 'dx_commerce_events',
              event_code: 'com.adobe.commerce.order.placed',
            },
            {
              provider_id: 'dx_commerce_events',
              event_code: 'com.adobe.commerce.order.shipped',
            },
          ],
          delivery_type: 'webhook_batch',
          enabled: true,
          created_date: '2023-12-01T10:15:00.000Z',
          updated_date: '2023-12-20T11:30:00.000Z',
          runtime_action: 'commerce-app/process-order-events',
        },
      ];

      const response: RegistrationListResponse = {
        _embedded: {
          registrations: commerceRegistrations,
        },
        _links: {
          self: {
            href: '/events/ABCDEF123456@AdobeOrg/adobe-commerce-app/production/registrations',
          },
        },
      };

      expect(response._embedded!.registrations).toHaveLength(2);
      expect(response._embedded!.registrations![0].name).toBe('Adobe Commerce Customer Events');
      expect(response._embedded!.registrations![1].name).toBe('Adobe Commerce Order Events');
    });

    it('should allow additional properties via index signature', () => {
      const response: RegistrationListResponse = {
        _embedded: {
          registrations: [],
        },
        _links: {
          self: {
            href: '/events/consumer123/project456/workspace789/registrations',
          },
        },
        totalCount: 42,
        page: 1,
        pageSize: 10,
        customProperty: 'custom value',
      };

      expect(response.totalCount).toBe(42);
      expect(response.page).toBe(1);
      expect(response.pageSize).toBe(10);
      expect(response.customProperty).toBe('custom value');
    });

    it('should handle responses without _embedded', () => {
      const response: RegistrationListResponse = {
        _links: {
          self: {
            href: '/events/consumer123/project456/workspace789/registrations',
          },
        },
      };

      expect(response._embedded).toBeUndefined();
      expect(response._links!.self!.href).toBe(
        '/events/consumer123/project456/workspace789/registrations'
      );
    });

    it('should handle responses without _links', () => {
      const response: RegistrationListResponse = {
        _embedded: {
          registrations: [],
        },
      };

      expect(response._embedded!.registrations).toEqual([]);
      expect(response._links).toBeUndefined();
    });
  });

  describe('ListRegistrationQueryParams', () => {
    it('should define empty query parameters', () => {
      const queryParams: ListRegistrationQueryParams = {};

      expect(Object.keys(queryParams)).toHaveLength(0);
    });

    it('should define query parameters with various types', () => {
      const queryParams: ListRegistrationQueryParams = {
        enabled: true,
        delivery_type: 'webhook',
        page: 1,
        limit: 50,
        sort: 'created_date',
        order: 'desc',
      };

      expect(queryParams.enabled).toBe(true);
      expect(queryParams.delivery_type).toBe('webhook');
      expect(queryParams.page).toBe(1);
      expect(queryParams.limit).toBe(50);
      expect(queryParams.sort).toBe('created_date');
      expect(queryParams.order).toBe('desc');
    });

    it('should handle boolean filtering parameters', () => {
      const enabledOnly: ListRegistrationQueryParams = {
        enabled: true,
      };

      const disabledOnly: ListRegistrationQueryParams = {
        enabled: false,
      };

      expect(enabledOnly.enabled).toBe(true);
      expect(disabledOnly.enabled).toBe(false);
    });

    it('should handle string filtering parameters', () => {
      const queryParams: ListRegistrationQueryParams = {
        name: 'Adobe Commerce',
        delivery_type: 'webhook_batch',
        client_id: 'my-client-app',
      };

      expect(queryParams.name).toBe('Adobe Commerce');
      expect(queryParams.delivery_type).toBe('webhook_batch');
      expect(queryParams.client_id).toBe('my-client-app');
    });

    it('should handle pagination parameters', () => {
      const queryParams: ListRegistrationQueryParams = {
        page: 3,
        limit: 25,
        offset: 50,
      };

      expect(queryParams.page).toBe(3);
      expect(queryParams.limit).toBe(25);
      expect(queryParams.offset).toBe(50);
    });

    it('should handle undefined values', () => {
      const queryParams: ListRegistrationQueryParams = {
        enabled: undefined,
        delivery_type: undefined,
        page: undefined,
      };

      expect(queryParams.enabled).toBeUndefined();
      expect(queryParams.delivery_type).toBeUndefined();
      expect(queryParams.page).toBeUndefined();
    });

    it('should work with typical filtering scenarios', () => {
      const activeWebhookRegistrations: ListRegistrationQueryParams = {
        enabled: true,
        delivery_type: 'webhook',
        limit: 100,
      };

      const recentRegistrations: ListRegistrationQueryParams = {
        sort: 'created_date',
        order: 'desc',
        limit: 10,
      };

      const paginatedResults: ListRegistrationQueryParams = {
        page: 2,
        limit: 20,
      };

      expect(activeWebhookRegistrations.enabled).toBe(true);
      expect(activeWebhookRegistrations.delivery_type).toBe('webhook');
      expect(recentRegistrations.sort).toBe('created_date');
      expect(paginatedResults.page).toBe(2);
    });

    it('should be compatible with URLSearchParams building patterns', () => {
      const queryParams: ListRegistrationQueryParams = {
        enabled: true,
        delivery_type: 'webhook',
        page: 1,
        limit: 50,
      };

      // Simulate URL building logic
      const searchParams = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });

      const queryString = searchParams.toString();
      expect(queryString).toContain('enabled=true');
      expect(queryString).toContain('delivery_type=webhook');
      expect(queryString).toContain('page=1');
      expect(queryString).toContain('limit=50');
    });
  });
});
