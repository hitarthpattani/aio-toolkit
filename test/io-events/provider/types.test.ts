/**
 * Copyright © Adobe, Inc. All rights reserved.
 */

import type { Provider } from '../../../src/io-events/provider/types';

describe('Provider Types', () => {
  describe('Provider interface', () => {
    it('should define a valid provider with required fields only', () => {
      const provider: Provider = {
        id: 'test-provider-123',
        label: 'Test Provider',
        description: 'A test provider description',
        source: 'test-source',
        provider_metadata: 'test_metadata',
        event_delivery_format: 'adobe_io',
        publisher: 'test-publisher',
      };

      expect(provider.id).toBe('test-provider-123');
      expect(provider.label).toBe('Test Provider');
      expect(provider.description).toBe('A test provider description');
      expect(provider.source).toBe('test-source');
      expect(provider.provider_metadata).toBe('test_metadata');
      expect(provider.event_delivery_format).toBe('adobe_io');
      expect(provider.publisher).toBe('test-publisher');
    });

    it('should define a valid provider with all optional fields', () => {
      const provider: Provider = {
        id: 'test-provider-123',
        label: 'Test Provider',
        description: 'A test provider description',
        source: 'test-source',
        docs_url: 'https://example.com/docs',
        provider_metadata: 'test_metadata',
        instance_id: 'instance-123',
        event_delivery_format: 'adobe_io',
        publisher: 'test-publisher',
        _links: {
          'rel:eventmetadata': {
            href: 'https://api.adobe.io/events/providers/test-provider-123/eventmetadata',
          },
          'rel:update': {
            href: 'https://api.adobe.io/events/providers/test-provider-123',
          },
          self: {
            href: 'https://api.adobe.io/events/providers/test-provider-123',
          },
        },
      };

      expect(provider.docs_url).toBe('https://example.com/docs');
      expect(provider.instance_id).toBe('instance-123');
      expect(provider._links).toBeDefined();
      expect(provider._links?.self?.href).toBe(
        'https://api.adobe.io/events/providers/test-provider-123'
      );
    });

    it('should allow undefined optional fields', () => {
      const provider: Provider = {
        id: 'test-provider-123',
        label: 'Test Provider',
        description: 'A test provider description',
        source: 'test-source',
        provider_metadata: 'test_metadata',
        event_delivery_format: 'adobe_io',
        publisher: 'test-publisher',
        docs_url: undefined,
        instance_id: undefined,
        _links: undefined,
      };

      expect(provider.docs_url).toBeUndefined();
      expect(provider.instance_id).toBeUndefined();
      expect(provider._links).toBeUndefined();
    });

    it('should handle HAL links with various properties', () => {
      const provider: Provider = {
        id: 'test-provider-123',
        label: 'Test Provider',
        description: 'A test provider description',
        source: 'test-source',
        provider_metadata: 'test_metadata',
        event_delivery_format: 'adobe_io',
        publisher: 'test-publisher',
        _links: {
          self: {
            href: 'https://api.adobe.io/events/providers/test-provider-123',
            templated: false,
            type: 'application/hal+json',
            title: 'Provider Details',
          },
        },
      };

      const selfLink = provider._links?.self;
      expect(selfLink?.href).toBe('https://api.adobe.io/events/providers/test-provider-123');
      expect(selfLink?.templated).toBe(false);
      expect(selfLink?.type).toBe('application/hal+json');
      expect(selfLink?.title).toBe('Provider Details');
    });

    it('should work with realistic provider data', () => {
      const provider: Provider = {
        id: 'urn:uuid:12345678-1234-1234-1234-123456789012',
        label: 'My Custom Events Provider',
        description: 'Provider for custom business events from my application',
        source: 'urn:uuid:12345678-1234-1234-1234-123456789012',
        docs_url: 'https://mycompany.com/events-docs',
        provider_metadata: '3rd_party_custom_events',
        instance_id: 'prod-instance-v1',
        event_delivery_format: 'adobe_io',
        publisher: 'my-company-prod',
        _links: {
          'rel:eventmetadata': {
            href: 'https://api.adobe.io/events/providers/urn:uuid:12345678-1234-1234-1234-123456789012/eventmetadata',
          },
          'rel:update': {
            href: 'https://api.adobe.io/events/consumers/my-org/projects/12345/workspaces/67890/providers/urn:uuid:12345678-1234-1234-1234-123456789012',
          },
          self: {
            href: 'https://api.adobe.io/events/providers/urn:uuid:12345678-1234-1234-1234-123456789012',
          },
        },
      };

      expect(provider.id).toContain('urn:uuid:');
      expect(provider.label).toContain('Custom Events');
      expect(provider.provider_metadata).toBe('3rd_party_custom_events');
      expect(provider.instance_id).toContain('prod');
      expect(provider.event_delivery_format).toBe('adobe_io');
    });

    it('should handle empty strings for optional string fields', () => {
      const provider: Provider = {
        id: 'test-provider-123',
        label: 'Test Provider',
        description: '',
        source: 'test-source',
        docs_url: '',
        provider_metadata: 'test_metadata',
        instance_id: '',
        event_delivery_format: 'adobe_io',
        publisher: 'test-publisher',
      };

      expect(provider.description).toBe('');
      expect(provider.docs_url).toBe('');
      expect(provider.instance_id).toBe('');
    });
  });
});
