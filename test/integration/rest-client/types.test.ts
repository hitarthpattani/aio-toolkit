/**
 * Adobe App Builder REST Client types tests
 *
 * <license header>
 */

import { Headers } from '../../../src/integration/rest-client/types';

describe('RestClient Types', () => {
  describe('Headers interface', () => {
    it('should allow string key-value pairs', () => {
      const headers: Headers = {
        'Content-Type': 'application/json',
        Authorization: 'Bearer token123',
        'X-Custom-Header': 'custom-value',
      };

      expect(headers['Content-Type']).toBe('application/json');
      expect(headers.Authorization).toBe('Bearer token123');
      expect(headers['X-Custom-Header']).toBe('custom-value');
    });

    it('should allow empty headers object', () => {
      const headers: Headers = {};

      expect(Object.keys(headers)).toHaveLength(0);
    });

    it('should allow dynamic header assignment', () => {
      const headers: Headers = {};
      headers['Dynamic-Header'] = 'dynamic-value';
      headers.AnotherHeader = 'another-value';

      expect(headers['Dynamic-Header']).toBe('dynamic-value');
      expect(headers.AnotherHeader).toBe('another-value');
    });

    it('should be compatible with standard HTTP headers', () => {
      const headers: Headers = {
        Accept: 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Content-Length': '1234',
        'Content-Type': 'application/json',
        Cookie: 'session=abc123',
        Host: 'api.example.com',
        Origin: 'https://example.com',
        Referer: 'https://example.com/page',
        'User-Agent': 'Mozilla/5.0',
        'X-Requested-With': 'XMLHttpRequest',
      };

      expect(Object.keys(headers)).toHaveLength(12);
      expect(headers.Accept).toBe('application/json');
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('should allow headers with special characters in values', () => {
      const headers: Headers = {
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        'X-Special': 'value with spaces & symbols!',
        Custom: 'value/with/slashes',
      };

      expect(headers.Authorization).toContain('Bearer ');
      expect(headers['X-Special']).toBe('value with spaces & symbols!');
      expect(headers.Custom).toBe('value/with/slashes');
    });
  });
});
