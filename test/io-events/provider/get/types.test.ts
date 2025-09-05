/**
 * <license header>
 */

import type { GetProviderQueryParams } from '../../../../src/io-events/provider/get/types';

describe('Get Provider Types', () => {
  describe('GetProviderQueryParams', () => {
    it('should define empty query parameters', () => {
      const params: GetProviderQueryParams = {};

      expect(params.eventmetadata).toBeUndefined();
    });

    it('should define query parameters with eventmetadata true', () => {
      const params: GetProviderQueryParams = {
        eventmetadata: true,
      };

      expect(params.eventmetadata).toBe(true);
      expect(typeof params.eventmetadata).toBe('boolean');
    });

    it('should define query parameters with eventmetadata false', () => {
      const params: GetProviderQueryParams = {
        eventmetadata: false,
      };

      expect(params.eventmetadata).toBe(false);
      expect(typeof params.eventmetadata).toBe('boolean');
    });

    it('should allow undefined eventmetadata', () => {
      const params: GetProviderQueryParams = {
        eventmetadata: undefined,
      };

      expect(params.eventmetadata).toBeUndefined();
    });

    it('should work with typical use cases', () => {
      // Get provider without metadata
      const withoutMetadata: GetProviderQueryParams = {
        eventmetadata: false,
      };
      expect(withoutMetadata.eventmetadata).toBe(false);

      // Get provider with metadata
      const withMetadata: GetProviderQueryParams = {
        eventmetadata: true,
      };
      expect(withMetadata.eventmetadata).toBe(true);

      // Get provider with default behavior (no eventmetadata specified)
      const defaultBehavior: GetProviderQueryParams = {};
      expect(defaultBehavior.eventmetadata).toBeUndefined();
    });

    it('should handle boolean values correctly', () => {
      // Explicit true
      const explicitTrue: GetProviderQueryParams = { eventmetadata: true };
      expect(explicitTrue.eventmetadata).toStrictEqual(true);

      // Explicit false
      const explicitFalse: GetProviderQueryParams = { eventmetadata: false };
      expect(explicitFalse.eventmetadata).toStrictEqual(false);

      // Should not accept truthy/falsy values that aren't boolean
      // TypeScript should enforce this at compile time
    });

    it('should be compatible with URLSearchParams building patterns', () => {
      const testCases = [
        { params: {}, expected: '' },
        { params: { eventmetadata: true }, expected: 'eventmetadata=true' },
        { params: { eventmetadata: false }, expected: 'eventmetadata=false' },
        { params: { eventmetadata: undefined }, expected: '' },
      ];

      testCases.forEach(({ params, expected }) => {
        const urlParams = new URLSearchParams();

        if (params.eventmetadata !== undefined) {
          urlParams.append('eventmetadata', String(params.eventmetadata));
        }

        expect(urlParams.toString()).toBe(expected);
      });
    });

    it('should maintain type safety', () => {
      // This test ensures TypeScript type checking is working correctly
      const validParams: GetProviderQueryParams = {
        eventmetadata: true,
      };

      expect(validParams.eventmetadata).toBe(true);

      // These should cause TypeScript errors if uncommented:
      // const invalidParams: GetProviderQueryParams = {
      //   eventmetadata: 'true', // Error: string not assignable to boolean
      // };

      // const invalidParams2: GetProviderQueryParams = {
      //   eventmetadata: 1, // Error: number not assignable to boolean
      // };
    });

    it('should work in realistic API scenarios', () => {
      // Scenario 1: Developer wants provider details without event metadata (faster response)
      const quickFetch: GetProviderQueryParams = {
        eventmetadata: false,
      };
      expect(quickFetch.eventmetadata).toBe(false);

      // Scenario 2: Developer needs complete provider information including event metadata
      const completeFetch: GetProviderQueryParams = {
        eventmetadata: true,
      };
      expect(completeFetch.eventmetadata).toBe(true);

      // Scenario 3: Developer uses default API behavior
      const defaultFetch: GetProviderQueryParams = {};
      expect(defaultFetch.eventmetadata).toBeUndefined();

      // Scenario 4: Conditional metadata fetching based on user preference
      const userPreference = Math.random() > 0.5; // Simulated user preference
      const conditionalFetch: GetProviderQueryParams = {
        eventmetadata: userPreference,
      };
      expect(typeof conditionalFetch.eventmetadata).toBe('boolean');
    });

    it('should handle object spreading and merging', () => {
      const baseParams: GetProviderQueryParams = {};
      const withMetadata: GetProviderQueryParams = { ...baseParams, eventmetadata: true };
      const withoutMetadata: GetProviderQueryParams = { ...baseParams, eventmetadata: false };

      expect(baseParams.eventmetadata).toBeUndefined();
      expect(withMetadata.eventmetadata).toBe(true);
      expect(withoutMetadata.eventmetadata).toBe(false);

      // Override scenario
      const overridden: GetProviderQueryParams = { ...withMetadata, eventmetadata: false };
      expect(overridden.eventmetadata).toBe(false);
    });
  });
});
