/**
 * Copyright © Adobe, Inc. All rights reserved.
 */

import type {
  ListProvidersQueryParams,
  ProvidersListResponse,
} from '../../../../src/io-events/provider/list/types';
import type { Provider } from '../../../../src/io-events/provider/types';

describe('List Provider Types', () => {
  describe('ListProvidersQueryParams', () => {
    it('should define empty query parameters', () => {
      const params: ListProvidersQueryParams = {};

      expect(params.providerMetadataId).toBeUndefined();
      expect(params.instanceId).toBeUndefined();
      expect(params.providerMetadataIds).toBeUndefined();
      expect(params.eventmetadata).toBeUndefined();
    });

    it('should define query parameters with providerMetadataId', () => {
      const params: ListProvidersQueryParams = {
        providerMetadataId: '3rd_party_custom_events',
      };

      expect(params.providerMetadataId).toBe('3rd_party_custom_events');
      expect(params.instanceId).toBeUndefined();
      expect(params.providerMetadataIds).toBeUndefined();
      expect(params.eventmetadata).toBeUndefined();
    });

    it('should define query parameters with instanceId', () => {
      const params: ListProvidersQueryParams = {
        instanceId: 'production-instance',
      };

      expect(params.instanceId).toBe('production-instance');
      expect(params.providerMetadataId).toBeUndefined();
      expect(params.providerMetadataIds).toBeUndefined();
      expect(params.eventmetadata).toBeUndefined();
    });

    it('should define query parameters with providerMetadataIds array', () => {
      const params: ListProvidersQueryParams = {
        providerMetadataIds: ['metadata1', 'metadata2', 'metadata3'],
      };

      expect(params.providerMetadataIds).toEqual(['metadata1', 'metadata2', 'metadata3']);
      expect(params.providerMetadataIds).toHaveLength(3);
      expect(params.providerMetadataId).toBeUndefined();
      expect(params.instanceId).toBeUndefined();
      expect(params.eventmetadata).toBeUndefined();
    });

    it('should define query parameters with empty providerMetadataIds array', () => {
      const params: ListProvidersQueryParams = {
        providerMetadataIds: [],
      };

      expect(params.providerMetadataIds).toEqual([]);
      expect(params.providerMetadataIds).toHaveLength(0);
    });

    it('should define query parameters with eventmetadata true', () => {
      const params: ListProvidersQueryParams = {
        eventmetadata: true,
      };

      expect(params.eventmetadata).toBe(true);
      expect(typeof params.eventmetadata).toBe('boolean');
    });

    it('should define query parameters with eventmetadata false', () => {
      const params: ListProvidersQueryParams = {
        eventmetadata: false,
      };

      expect(params.eventmetadata).toBe(false);
      expect(typeof params.eventmetadata).toBe('boolean');
    });

    it('should define query parameters with all fields', () => {
      const params: ListProvidersQueryParams = {
        providerMetadataId: '3rd_party_custom_events',
        instanceId: 'production-instance',
        eventmetadata: true,
      };

      expect(params.providerMetadataId).toBe('3rd_party_custom_events');
      expect(params.instanceId).toBe('production-instance');
      expect(params.eventmetadata).toBe(true);
      expect(params.providerMetadataIds).toBeUndefined();
    });

    it('should define query parameters with providerMetadataIds instead of single providerMetadataId', () => {
      const params: ListProvidersQueryParams = {
        providerMetadataIds: ['custom_events', 'commerce_events'],
        instanceId: 'production-instance',
        eventmetadata: false,
      };

      expect(params.providerMetadataIds).toEqual(['custom_events', 'commerce_events']);
      expect(params.instanceId).toBe('production-instance');
      expect(params.eventmetadata).toBe(false);
      expect(params.providerMetadataId).toBeUndefined();
    });

    it('should handle undefined values explicitly', () => {
      const params: ListProvidersQueryParams = {
        providerMetadataId: undefined,
        instanceId: undefined,
        providerMetadataIds: undefined,
        eventmetadata: undefined,
      };

      expect(params.providerMetadataId).toBeUndefined();
      expect(params.instanceId).toBeUndefined();
      expect(params.providerMetadataIds).toBeUndefined();
      expect(params.eventmetadata).toBeUndefined();
    });

    it('should handle empty string values', () => {
      const params: ListProvidersQueryParams = {
        providerMetadataId: '',
        instanceId: '',
      };

      expect(params.providerMetadataId).toBe('');
      expect(params.instanceId).toBe('');
    });

    it('should work with typical filtering scenarios', () => {
      // Filter by custom events only
      const customEventsFilter: ListProvidersQueryParams = {
        providerMetadataId: '3rd_party_custom_events',
        eventmetadata: true,
      };
      expect(customEventsFilter.providerMetadataId).toBe('3rd_party_custom_events');
      expect(customEventsFilter.eventmetadata).toBe(true);

      // Filter by specific instance
      const instanceFilter: ListProvidersQueryParams = {
        instanceId: 'prod-v2',
      };
      expect(instanceFilter.instanceId).toBe('prod-v2');

      // Filter by multiple metadata types
      const multiMetadataFilter: ListProvidersQueryParams = {
        providerMetadataIds: ['commerce_events', 'marketing_events', 'analytics_events'],
        eventmetadata: false,
      };
      expect(multiMetadataFilter.providerMetadataIds).toHaveLength(3);
      expect(multiMetadataFilter.eventmetadata).toBe(false);

      // Get all providers with metadata
      const allWithMetadata: ListProvidersQueryParams = {
        eventmetadata: true,
      };
      expect(allWithMetadata.eventmetadata).toBe(true);
    });
  });

  describe('ProvidersListResponse', () => {
    const mockProvider: Provider = {
      id: 'test-provider-123',
      label: 'Test Provider',
      description: 'A test provider',
      source: 'test-source',
      provider_metadata: 'test_metadata',
      event_delivery_format: 'adobe_io',
      publisher: 'test-publisher',
    };

    it('should define a valid response with self link only', () => {
      const response: ProvidersListResponse = {
        _links: {
          self: {
            href: 'https://api.adobe.io/events/org-123/providers',
          },
        },
      };

      expect(response._links.self.href).toBe('https://api.adobe.io/events/org-123/providers');
      expect(response._links.next).toBeUndefined();
      expect(response._embedded).toBeUndefined();
    });

    it('should define a valid response with pagination', () => {
      const response: ProvidersListResponse = {
        _links: {
          self: {
            href: 'https://api.adobe.io/events/org-123/providers',
          },
          next: {
            href: 'https://api.adobe.io/events/org-123/providers?page=2',
          },
        },
        _embedded: {
          providers: [mockProvider],
        },
      };

      expect(response._links.self.href).toContain('providers');
      expect(response._links.next?.href).toContain('page=2');
      expect(response._embedded?.providers).toHaveLength(1);
      expect(response._embedded?.providers[0]).toEqual(mockProvider);
    });

    it('should define a valid response with empty providers array', () => {
      const response: ProvidersListResponse = {
        _links: {
          self: {
            href: 'https://api.adobe.io/events/org-123/providers',
          },
        },
        _embedded: {
          providers: [],
        },
      };

      expect(response._embedded?.providers).toEqual([]);
      expect(response._embedded?.providers).toHaveLength(0);
    });

    it('should define a valid response with multiple providers', () => {
      const provider2: Provider = {
        id: 'test-provider-456',
        label: 'Test Provider 2',
        description: 'Another test provider',
        source: 'test-source-2',
        provider_metadata: 'test_metadata_2',
        event_delivery_format: 'adobe_io',
        publisher: 'test-publisher-2',
      };

      const response: ProvidersListResponse = {
        _links: {
          self: {
            href: 'https://api.adobe.io/events/org-123/providers',
          },
        },
        _embedded: {
          providers: [mockProvider, provider2],
        },
      };

      expect(response._embedded?.providers).toHaveLength(2);
      expect(response._embedded?.providers[0].id).toBe('test-provider-123');
      expect(response._embedded?.providers[1].id).toBe('test-provider-456');
    });

    it('should allow additional properties via index signature', () => {
      const response: ProvidersListResponse = {
        _links: {
          self: {
            href: 'https://api.adobe.io/events/org-123/providers',
          },
        },
        _embedded: {
          providers: [mockProvider],
        },
        totalCount: 1,
        page: 1,
        pageSize: 10,
        customProperty: 'custom-value',
      };

      expect(response.totalCount).toBe(1);
      expect(response.page).toBe(1);
      expect(response.pageSize).toBe(10);
      expect(response.customProperty).toBe('custom-value');
    });

    it('should handle realistic API responses', () => {
      // First page of results
      const firstPageResponse: ProvidersListResponse = {
        _links: {
          self: {
            href: 'https://api.adobe.io/events/12345/providers?page=1&size=50',
          },
          next: {
            href: 'https://api.adobe.io/events/12345/providers?page=2&size=50',
          },
        },
        _embedded: {
          providers: [mockProvider],
        },
        total: 75,
        page: 1,
        size: 50,
      };

      expect(firstPageResponse._links.self.href).toContain('page=1');
      expect(firstPageResponse._links.next?.href).toContain('page=2');
      expect(firstPageResponse.total).toBe(75);

      // Last page of results (no next link)
      const lastPageResponse: ProvidersListResponse = {
        _links: {
          self: {
            href: 'https://api.adobe.io/events/12345/providers?page=2&size=50',
          },
        },
        _embedded: {
          providers: [mockProvider],
        },
        total: 75,
        page: 2,
        size: 50,
      };

      expect(lastPageResponse._links.next).toBeUndefined();
      expect(lastPageResponse.page).toBe(2);

      // Empty results
      const emptyResponse: ProvidersListResponse = {
        _links: {
          self: {
            href: 'https://api.adobe.io/events/12345/providers',
          },
        },
        _embedded: {
          providers: [],
        },
        total: 0,
        page: 1,
        size: 50,
      };

      expect(emptyResponse._embedded?.providers).toHaveLength(0);
      expect(emptyResponse.total).toBe(0);
    });

    it('should handle filtered responses', () => {
      const filteredResponse: ProvidersListResponse = {
        _links: {
          self: {
            href: 'https://api.adobe.io/events/12345/providers?providerMetadataId=3rd_party_custom_events&eventmetadata=true',
          },
        },
        _embedded: {
          providers: [mockProvider],
        },
        appliedFilters: {
          providerMetadataId: '3rd_party_custom_events',
          eventmetadata: true,
        },
      };

      expect(filteredResponse._links.self.href).toContain(
        'providerMetadataId=3rd_party_custom_events'
      );
      expect(filteredResponse._links.self.href).toContain('eventmetadata=true');
      expect(filteredResponse.appliedFilters).toBeDefined();
    });
  });
});
