/**
 * Adobe App Builder Bearer Token utility tests
 *
 * <license header>
 */

import BearerToken from '../../../src/integration/bearer-token';

// Mock console methods to avoid noise in tests
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  console.log = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  console.log = originalConsoleLog;
  console.warn = originalConsoleWarn;
});

describe('BearerToken', () => {
  describe('extract', () => {
    it('should extract token info from valid Bearer authorization header', () => {
      const params = {
        __ow_headers: {
          authorization: 'Bearer abc123token456',
        },
      };

      const result = BearerToken.extract(params);

      expect(result).toEqual({
        token: 'abc123token456',
        tokenLength: 14, // 'abc123token456' is 14 characters
        isValid: true,
        expiry: expect.any(String),
        timeUntilExpiry: expect.any(Number),
      });
      expect(result.timeUntilExpiry).toBeGreaterThan(86390000); // Should be close to 24 hours
    });

    it('should handle JWT token with exp claim', () => {
      // JWT token with exp: 2050-01-01 (future date)
      const futureExp = Math.floor(new Date('2050-01-01').getTime() / 1000);
      const jwtToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(JSON.stringify({ exp: futureExp })).toString('base64')}.signature`;

      const params = {
        __ow_headers: {
          authorization: `Bearer ${jwtToken}`,
        },
      };

      const result = BearerToken.extract(params);

      expect(result).toEqual({
        token: jwtToken,
        tokenLength: jwtToken.length,
        isValid: true,
        expiry: '2050-01-01T00:00:00.000Z',
        timeUntilExpiry: expect.any(Number),
      });
      expect(result.timeUntilExpiry).toBeGreaterThan(0);
    });

    it('should handle expired JWT token', () => {
      // JWT token with exp: 2020-01-01 (past date)
      const pastExp = Math.floor(new Date('2020-01-01').getTime() / 1000);
      const jwtToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(JSON.stringify({ exp: pastExp })).toString('base64')}.signature`;

      const params = {
        __ow_headers: {
          authorization: `Bearer ${jwtToken}`,
        },
      };

      const result = BearerToken.extract(params);

      expect(result).toEqual({
        token: jwtToken,
        tokenLength: jwtToken.length,
        isValid: false,
        expiry: '2020-01-01T00:00:00.000Z',
        timeUntilExpiry: 0,
      });
      expect(console.log).toHaveBeenCalledWith('⏰ Token has expired');
    });

    it('should handle JWT token with expires_in claim', () => {
      const jwtToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(JSON.stringify({ expires_in: 3600000 })).toString('base64')}.signature`;

      const params = {
        __ow_headers: {
          authorization: `Bearer ${jwtToken}`,
        },
      };

      const result = BearerToken.extract(params);

      expect(result).toEqual({
        token: jwtToken,
        tokenLength: jwtToken.length,
        isValid: true,
        expiry: expect.any(String),
        timeUntilExpiry: expect.any(Number),
      });
      expect(result.timeUntilExpiry).toBeGreaterThan(3590000); // Should be close to 3600000ms
    });

    it('should handle malformed JWT token with fallback to 24h expiry', () => {
      const params = {
        __ow_headers: {
          authorization: 'Bearer malformed.jwt.token',
        },
      };

      const result = BearerToken.extract(params);

      expect(result).toEqual({
        token: 'malformed.jwt.token',
        tokenLength: 19, // 'malformed.jwt.token' is 19 characters
        isValid: true,
        expiry: expect.any(String),
        timeUntilExpiry: expect.any(Number),
      });
      expect(result.timeUntilExpiry).toBeGreaterThan(86390000); // Should be close to 24 hours in ms
    });

    it('should handle JWT token with malformed payload', () => {
      // JWT with 3 parts but invalid base64 payload
      const params = {
        __ow_headers: {
          authorization: 'Bearer header.invalid-base64.signature',
        },
      };

      const result = BearerToken.extract(params);

      expect(result).toEqual({
        token: 'header.invalid-base64.signature',
        tokenLength: 31,
        isValid: true,
        expiry: expect.any(String),
        timeUntilExpiry: expect.any(Number),
      });
      expect(result.timeUntilExpiry).toBeGreaterThan(86390000); // Should get 24h fallback
    });

    it('should handle JWT token with empty payload part', () => {
      // JWT with empty middle part
      const params = {
        __ow_headers: {
          authorization: 'Bearer header..signature',
        },
      };

      const result = BearerToken.extract(params);

      expect(result).toEqual({
        token: 'header..signature',
        tokenLength: 17,
        isValid: true,
        expiry: expect.any(String),
        timeUntilExpiry: expect.any(Number),
      });
      expect(result.timeUntilExpiry).toBeGreaterThan(86390000); // Should get 24h fallback
    });

    it('should handle JWT token with exp as 0', () => {
      // JWT token with exp: 0 (falsy)
      const jwtToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(JSON.stringify({ exp: 0 })).toString('base64')}.signature`;

      const params = {
        __ow_headers: {
          authorization: `Bearer ${jwtToken}`,
        },
      };

      const result = BearerToken.extract(params);

      expect(result).toEqual({
        token: jwtToken,
        tokenLength: jwtToken.length,
        isValid: true,
        expiry: expect.any(String),
        timeUntilExpiry: expect.any(Number),
      });
      expect(result.timeUntilExpiry).toBeGreaterThan(86390000); // Should get 24h fallback since exp is 0
    });

    it('should return null token info when no authorization header exists', () => {
      const params = {
        __ow_headers: {
          'content-type': 'application/json',
        },
      };

      const result = BearerToken.extract(params);

      expect(result).toEqual({
        token: null,
        tokenLength: 0,
        isValid: false,
        expiry: null,
        timeUntilExpiry: null,
      });
    });

    it('should return null token info when __ow_headers is missing', () => {
      const params = {
        someOtherParam: 'value',
      };

      const result = BearerToken.extract(params);

      expect(result).toEqual({
        token: null,
        tokenLength: 0,
        isValid: false,
        expiry: null,
        timeUntilExpiry: null,
      });
    });

    it('should return null token info when authorization header does not start with Bearer', () => {
      const params = {
        __ow_headers: {
          authorization: 'Basic dXNlcjpwYXNzd29yZA==',
        },
      };

      const result = BearerToken.extract(params);

      expect(result).toEqual({
        token: null,
        tokenLength: 0,
        isValid: false,
        expiry: null,
        timeUntilExpiry: null,
      });
    });

    it('should return null token info when authorization header is just "Bearer" without token', () => {
      const params = {
        __ow_headers: {
          authorization: 'Bearer',
        },
      };

      const result = BearerToken.extract(params);

      expect(result).toEqual({
        token: null,
        tokenLength: 0,
        isValid: false,
        expiry: null,
        timeUntilExpiry: null,
      });
    });

    it('should handle "Bearer " (with space) and return empty token', () => {
      const params = {
        __ow_headers: {
          authorization: 'Bearer ',
        },
      };

      const result = BearerToken.extract(params);

      expect(result).toEqual({
        token: '',
        tokenLength: 0,
        isValid: false,
        expiry: null, // Empty token gets null expiry
        timeUntilExpiry: null,
      });
    });

    it('should handle case-sensitive Bearer prefix correctly', () => {
      const params = {
        __ow_headers: {
          authorization: 'bearer abc123token456',
        },
      };

      const result = BearerToken.extract(params);

      expect(result).toEqual({
        token: null,
        tokenLength: 0,
        isValid: false,
        expiry: null,
        timeUntilExpiry: null,
      });
    });

    it('should handle complex OpenWhisk parameters structure', () => {
      const params = {
        someParam: 'value',
        __ow_headers: {
          'content-type': 'application/json',
          'user-agent': 'TestAgent/1.0',
          authorization: 'Bearer complex_token_with_123_symbols',
          'x-custom-header': 'custom-value',
        },
        __ow_method: 'POST',
        __ow_path: '/api/test',
      };

      const result = BearerToken.extract(params);

      expect(result).toEqual({
        token: 'complex_token_with_123_symbols',
        tokenLength: 30, // 'complex_token_with_123_symbols' is 30 characters
        isValid: true,
        expiry: expect.any(String),
        timeUntilExpiry: expect.any(Number),
      });
      expect(result.timeUntilExpiry).toBeGreaterThan(86390000); // Should be close to 24 hours
    });
  });

  describe('info', () => {
    it('should handle simple token string directly', () => {
      const result = BearerToken.info('simple-token');

      expect(result).toEqual({
        token: 'simple-token',
        tokenLength: 12,
        isValid: true,
        expiry: expect.any(String),
        timeUntilExpiry: expect.any(Number),
      });
      expect(result.timeUntilExpiry).toBeGreaterThan(86390000); // 24h default
    });

    it('should handle null token', () => {
      const result = BearerToken.info(null);

      expect(result).toEqual({
        token: null,
        tokenLength: 0,
        isValid: false,
        expiry: null,
        timeUntilExpiry: null,
      });
    });

    it('should handle JWT token with exp claim', () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      const jwtToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(JSON.stringify({ exp: futureTime })).toString('base64')}.signature`;

      const result = BearerToken.info(jwtToken);

      expect(result).toEqual({
        token: jwtToken,
        tokenLength: jwtToken.length,
        isValid: true,
        expiry: expect.any(String),
        timeUntilExpiry: expect.any(Number),
      });
      expect(result.timeUntilExpiry).toBeGreaterThan(3590000); // Should be close to 3600000ms (1 hour)
    });

    it('should handle expired JWT token', () => {
      const pastTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      const expiredJwtToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(JSON.stringify({ exp: pastTime })).toString('base64')}.signature`;

      const result = BearerToken.info(expiredJwtToken);

      expect(result).toEqual({
        token: expiredJwtToken,
        tokenLength: expiredJwtToken.length,
        isValid: false,
        expiry: expect.any(String),
        timeUntilExpiry: 0, // Expired, so 0
      });
    });

    it('should handle empty string token', () => {
      const result = BearerToken.info('');

      expect(result).toEqual({
        token: '',
        tokenLength: 0,
        isValid: false,
        expiry: null,
        timeUntilExpiry: null,
      });
    });

    it('should handle JWT with expires_in claim', () => {
      const expiresIn = 3600000; // 1 hour in ms
      const jwtToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(JSON.stringify({ expires_in: expiresIn })).toString('base64')}.signature`;

      const result = BearerToken.info(jwtToken);

      expect(result).toEqual({
        token: jwtToken,
        tokenLength: jwtToken.length,
        isValid: true,
        expiry: expect.any(String),
        timeUntilExpiry: expect.any(Number),
      });
      expect(result.timeUntilExpiry).toBeGreaterThan(3590000); // Should be close to 3600000ms
    });
  });

  describe('backward compatibility behavior through extract', () => {
    it('should extract token string from valid Bearer authorization header', () => {
      const params = {
        __ow_headers: {
          authorization: 'Bearer abc123token456',
        },
      };

      const result = BearerToken.extract(params);

      expect(result.token).toBe('abc123token456');
      expect(result.tokenLength).toBe(14);
    });

    it('should return null token when no authorization header exists', () => {
      const params = {
        __ow_headers: {
          'content-type': 'application/json',
        },
      };

      const result = BearerToken.extract(params);

      expect(result.token).toBeNull();
      expect(result.isValid).toBe(false);
    });

    it('should return null token when authorization header does not start with Bearer', () => {
      const params = {
        __ow_headers: {
          authorization: 'Basic dXNlcjpwYXNzd29yZA==',
        },
      };

      const result = BearerToken.extract(params);

      expect(result.token).toBeNull();
      expect(result.isValid).toBe(false);
    });
  });

  describe('comprehensive functionality through public API', () => {
    it('should handle JWT tokens with specific expiry through extract', () => {
      const futureExp = Math.floor(new Date('2050-01-01').getTime() / 1000);
      const jwtToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(JSON.stringify({ exp: futureExp })).toString('base64')}.signature`;

      const params = {
        __ow_headers: {
          authorization: `Bearer ${jwtToken}`,
        },
      };

      const result = BearerToken.extract(params);

      expect(result).toEqual({
        token: jwtToken,
        tokenLength: jwtToken.length,
        isValid: true,
        expiry: '2050-01-01T00:00:00.000Z',
        timeUntilExpiry: expect.any(Number),
      });
    });

    it('should handle null token through extract', () => {
      const params = {};

      const result = BearerToken.extract(params);

      expect(result).toEqual({
        token: null,
        tokenLength: 0,
        isValid: false,
        expiry: null,
        timeUntilExpiry: null,
      });
    });

    it('should handle non-JWT tokens with default 24h expiry', () => {
      const params = {
        __ow_headers: {
          authorization: 'Bearer simple-token-123',
        },
      };

      const result = BearerToken.extract(params);

      expect(result.token).toBe('simple-token-123');
      expect(result.tokenLength).toBe(16);
      expect(result.isValid).toBe(true);
      expect(result.expiry).toBeTruthy();
      expect(result.timeUntilExpiry).toBeGreaterThan(86390000); // Close to 24h
    });
  });
});
