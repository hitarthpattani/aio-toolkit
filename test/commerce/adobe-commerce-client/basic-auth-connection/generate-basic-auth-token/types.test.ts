/**
 * Copyright © Adobe, Inc. All rights reserved.
 */

import { TokenResult } from '../../../../../src/commerce/adobe-commerce-client/basic-auth-connection/generate-basic-auth-token/types';

describe('Generate Basic Auth Token Types', () => {
  describe('TokenResult interface', () => {
    it('should define a valid token result with token and expire_in', () => {
      const tokenResult: TokenResult = {
        token: 'test-token-value',
        expire_in: 3600,
      };

      expect(tokenResult.token).toBe('test-token-value');
      expect(tokenResult.expire_in).toBe(3600);
    });

    it('should allow null token value', () => {
      const tokenResult: TokenResult = {
        token: null,
        expire_in: 3600,
      };

      expect(tokenResult.token).toBeNull();
      expect(tokenResult.expire_in).toBe(3600);
    });

    it('should work with typical Adobe Commerce token format', () => {
      const tokenResult: TokenResult = {
        token:
          'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1aWQiOjEsInV0eXBpZCI6MiwiaWF0IjoxNjMwMDAwMDAwLCJleHAiOjE2MzAwMDM2MDB9',
        expire_in: 3600,
      };

      expect(typeof tokenResult.token).toBe('string');
      expect(tokenResult.token?.length).toBeGreaterThan(100);
      expect(tokenResult.expire_in).toBe(3600);
    });

    it('should handle different expire times', () => {
      const shortExpiry: TokenResult = {
        token: 'short-lived-token',
        expire_in: 300, // 5 minutes
      };

      const longExpiry: TokenResult = {
        token: 'long-lived-token',
        expire_in: 86400, // 24 hours
      };

      expect(shortExpiry.expire_in).toBe(300);
      expect(longExpiry.expire_in).toBe(86400);
    });

    it('should handle zero expire time', () => {
      const immediateExpiry: TokenResult = {
        token: 'immediate-expire-token',
        expire_in: 0,
      };

      expect(immediateExpiry.expire_in).toBe(0);
    });

    it('should be compatible with typical API response structure', () => {
      // Simulate API response format
      const apiResponse = {
        token: 'api-generated-token',
        expire_in: 7200,
      };

      const tokenResult: TokenResult = {
        token: apiResponse.token,
        expire_in: apiResponse.expire_in,
      };

      expect(tokenResult).toEqual(apiResponse);
    });

    it('should handle long token strings', () => {
      const longToken = 'a'.repeat(1000);
      const tokenResult: TokenResult = {
        token: longToken,
        expire_in: 1800,
      };

      expect(tokenResult.token?.length).toBe(1000);
      expect(tokenResult.expire_in).toBe(1800);
    });

    it('should work with object spreading and merging', () => {
      const baseResult: TokenResult = {
        token: 'base-token',
        expire_in: 3600,
      };

      const updatedResult: TokenResult = {
        ...baseResult,
        expire_in: 7200,
      };

      expect(updatedResult.token).toBe('base-token');
      expect(updatedResult.expire_in).toBe(7200);
    });
  });
});
