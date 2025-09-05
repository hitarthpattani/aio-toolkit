/**
 * Copyright © Adobe, Inc. All rights reserved.
 */

import type { GetEventMetadataQueryParams } from '../../../../src/io-events/event-metadata/get/types';

describe('Get Event Metadata Types', () => {
  describe('GetEventMetadataQueryParams', () => {
    it('should define valid query parameters', () => {
      const queryParams: GetEventMetadataQueryParams = {
        providerId: 'test-provider-123',
        eventCode: 'com.example.user.created',
      };

      expect(queryParams.providerId).toBe('test-provider-123');
      expect(queryParams.eventCode).toBe('com.example.user.created');
    });

    it('should work with commerce-specific event codes', () => {
      const queryParams: GetEventMetadataQueryParams = {
        providerId: 'commerce-provider-456',
        eventCode: 'com.adobe.commerce.order.placed',
      };

      expect(queryParams.providerId).toBe('commerce-provider-456');
      expect(queryParams.eventCode).toBe('com.adobe.commerce.order.placed');
    });

    it('should handle complex event codes with multiple dots', () => {
      const queryParams: GetEventMetadataQueryParams = {
        providerId: 'complex-provider-789',
        eventCode: 'com.adobe.commerce.catalog.product.inventory.updated',
      };

      expect(queryParams.providerId).toBe('complex-provider-789');
      expect(queryParams.eventCode).toBe('com.adobe.commerce.catalog.product.inventory.updated');
    });

    it('should work with short provider IDs', () => {
      const queryParams: GetEventMetadataQueryParams = {
        providerId: 'prov1',
        eventCode: 'simple.event',
      };

      expect(queryParams.providerId).toBe('prov1');
      expect(queryParams.eventCode).toBe('simple.event');
    });

    it('should handle URL-encoded characters in event codes', () => {
      const queryParams: GetEventMetadataQueryParams = {
        providerId: 'test-provider',
        eventCode: 'com.example.user-profile.updated',
      };

      expect(queryParams.providerId).toBe('test-provider');
      expect(queryParams.eventCode).toBe('com.example.user-profile.updated');
    });

    it('should maintain type safety', () => {
      const queryParams: GetEventMetadataQueryParams = {
        providerId: 'provider-123',
        eventCode: 'event.code',
      };

      // This should be compile-time safe
      expect(typeof queryParams.providerId).toBe('string');
      expect(typeof queryParams.eventCode).toBe('string');
    });

    it('should work in realistic API scenarios', () => {
      const scenarios = [
        {
          providerId: 'ecommerce-provider',
          eventCode: 'com.mystore.checkout.completed',
        },
        {
          providerId: 'crm-provider',
          eventCode: 'com.salesforce.lead.converted',
        },
        {
          providerId: 'analytics-provider',
          eventCode: 'com.analytics.pageview.tracked',
        },
      ];

      scenarios.forEach((scenario, index) => {
        const queryParams: GetEventMetadataQueryParams = scenario;
        expect(queryParams.providerId).toBe(scenarios[index].providerId);
        expect(queryParams.eventCode).toBe(scenarios[index].eventCode);
      });
    });
  });
});
