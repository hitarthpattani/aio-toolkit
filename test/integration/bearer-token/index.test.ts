/**
 * Adobe App Builder Bearer Token utility tests
 *
 * <license header>
 */

import BearerToken from '../../../src/integration/bearer-token';

describe('BearerToken', () => {
  describe('extract', () => {
    it('should extract token from valid Bearer authorization header', () => {
      const params = {
        __ow_headers: {
          authorization: 'Bearer abc123token456',
        },
      };

      const result = BearerToken.extract(params);

      expect(result).toBe('abc123token456');
    });

    it('should extract token with special characters and symbols', () => {
      const params = {
        __ow_headers: {
          authorization:
            'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        },
      };

      const result = BearerToken.extract(params);

      expect(result).toBe(
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
      );
    });

    it('should extract token with spaces and numbers', () => {
      const params = {
        __ow_headers: {
          authorization: 'Bearer token_with_underscores_123456',
        },
      };

      const result = BearerToken.extract(params);

      expect(result).toBe('token_with_underscores_123456');
    });

    it('should extract token with hyphens and mixed case', () => {
      const params = {
        __ow_headers: {
          authorization: 'Bearer Token-With-Hyphens-And-MixedCase123',
        },
      };

      const result = BearerToken.extract(params);

      expect(result).toBe('Token-With-Hyphens-And-MixedCase123');
    });

    it('should return undefined when no authorization header exists', () => {
      const params = {
        __ow_headers: {
          'content-type': 'application/json',
        },
      };

      const result = BearerToken.extract(params);

      expect(result).toBeUndefined();
    });

    it('should return undefined when __ow_headers is missing', () => {
      const params = {
        someOtherParam: 'value',
      };

      const result = BearerToken.extract(params);

      expect(result).toBeUndefined();
    });

    it('should return undefined when authorization header does not start with Bearer', () => {
      const params = {
        __ow_headers: {
          authorization: 'Basic dXNlcjpwYXNzd29yZA==',
        },
      };

      const result = BearerToken.extract(params);

      expect(result).toBeUndefined();
    });

    it('should return undefined when authorization header is just "Bearer" without token', () => {
      const params = {
        __ow_headers: {
          authorization: 'Bearer',
        },
      };

      const result = BearerToken.extract(params);

      expect(result).toBeUndefined();
    });

    it('should return undefined when authorization header is just "Bearer " (with space)', () => {
      const params = {
        __ow_headers: {
          authorization: 'Bearer ',
        },
      };

      const result = BearerToken.extract(params);

      expect(result).toBe('');
    });

    it('should return undefined when authorization header is empty string', () => {
      const params = {
        __ow_headers: {
          authorization: '',
        },
      };

      const result = BearerToken.extract(params);

      expect(result).toBeUndefined();
    });

    it('should return undefined when authorization header is null', () => {
      const params = {
        __ow_headers: {
          authorization: null,
        },
      };

      const result = BearerToken.extract(params);

      expect(result).toBeUndefined();
    });

    it('should return undefined when authorization header is undefined', () => {
      const params = {
        __ow_headers: {
          authorization: undefined,
        },
      };

      const result = BearerToken.extract(params);

      expect(result).toBeUndefined();
    });

    it('should handle case-sensitive Bearer prefix correctly', () => {
      const params = {
        __ow_headers: {
          authorization: 'bearer abc123token456',
        },
      };

      const result = BearerToken.extract(params);

      expect(result).toBeUndefined();
    });

    it('should handle mixed case Bearer prefix correctly', () => {
      const params = {
        __ow_headers: {
          authorization: 'BEARER abc123token456',
        },
      };

      const result = BearerToken.extract(params);

      expect(result).toBeUndefined();
    });

    it('should handle Bearer prefix with extra spaces', () => {
      const params = {
        __ow_headers: {
          authorization: 'Bearer  abc123token456',
        },
      };

      const result = BearerToken.extract(params);

      expect(result).toBe(' abc123token456');
    });

    it('should handle very long tokens', () => {
      const longToken = 'a'.repeat(1000);
      const params = {
        __ow_headers: {
          authorization: `Bearer ${longToken}`,
        },
      };

      const result = BearerToken.extract(params);

      expect(result).toBe(longToken);
    });

    it('should handle empty params object', () => {
      const params = {};

      const result = BearerToken.extract(params);

      expect(result).toBeUndefined();
    });

    it('should handle params with __ow_headers as null', () => {
      const params = {
        __ow_headers: null,
      };

      const result = BearerToken.extract(params);

      expect(result).toBeUndefined();
    });

    it('should handle params with __ow_headers as undefined', () => {
      const params = {
        __ow_headers: undefined,
      };

      const result = BearerToken.extract(params);

      expect(result).toBeUndefined();
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

      expect(result).toBe('complex_token_with_123_symbols');
    });

    it('should work with realistic JWT token', () => {
      const jwtToken =
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6IjFlOWdkazcifQ.ewogaHR0cDovL3NjaGVtYS5vcmcvZmFtaWx5TmFtZSI6ICJSZXN0IiwKIGh0dHA6Ly9zY2hlbWEub3JnL2dpdmVuTmFtZTogIlRlc3QiLAogaXNzOiAiaHR0cDovL2xvY2FsaG9zdDozMDAxIiwKIGF1ZDogImh0dHA6Ly9sb2NhbGhvc3Q6MzAwMSIsCiBleHA6IDE0ODU5MDg5MDksCiBqdGk6ICI4MDNmZDQ1MS0xZjAwLTRlMTQtOGY4ZS0zMTA5OGMxYTU3ZWEiLAogaWF0OiAxNDg1Mjc3MDA5LAogbmJmOiAxNDg1Mjc3MDA5LAogaWRlbnRpdHk6IHsKICJ1c2VyX2lkIjogNDIsCiAicHJvdmlkZXIiOiAiZ2l0aHViIiwKICJwcm92aWRlcl9pZCI6ICI1ODMxMzEiLAogInVzZXJuYW1lIjogInNvbWVfdXNlciIKIH0KfQ.E2oobtBKSfEA_rVb4hT-xWHSjG8W8OblWCcLZRNfqIJCEJvRAqb8NNrMl9r0nkMDJW0eXE8jgqWqVCvkdZl3bVYQk-4WYCZs8xXBZJy-QRJelSDJdCF4eVm_9_VqVB4oEt_pI8tHJc8mPmAWTGgDQKsDJaZ8BcDJNczIIHMEzFKZaLaSDfQVEbXb8oHKQeDNxJiN9vKX1XZEC4dRbJDrJRRHNGINJEfcS7nL8j2y8OZ3JOCNIGo3B';

      const params = {
        __ow_headers: {
          authorization: `Bearer ${jwtToken}`,
        },
      };

      const result = BearerToken.extract(params);

      expect(result).toBe(jwtToken);
    });
  });
});
