/**
 * Test for Parameters utility class
 * Copyright © Adobe, Inc. All rights reserved.
 */

import Parameters from '../../../../src/framework/utils/parameters';

describe('Parameters', () => {
  describe('stringify', () => {
    it('should stringify parameters without authorization header', () => {
      const params = {
        name: 'test',
        value: 123,
        __ow_headers: {
          'content-type': 'application/json',
        },
      };

      const result = Parameters.stringify(params);
      const parsed = JSON.parse(result);

      expect(parsed.name).toBe('test');
      expect(parsed.value).toBe(123);
      expect(parsed.__ow_headers['content-type']).toBe('application/json');
    });

    it('should hide authorization token in headers', () => {
      const params = {
        name: 'test',
        __ow_headers: {
          'content-type': 'application/json',
          authorization: 'Bearer secret-token',
        },
      };

      const result = Parameters.stringify(params);
      const parsed = JSON.parse(result);

      expect(parsed.__ow_headers.authorization).toBe('<hidden>');
      expect(parsed.__ow_headers['content-type']).toBe('application/json');
    });

    it('should handle parameters without __ow_headers', () => {
      const params = {
        name: 'test',
        value: 123,
      };

      const result = Parameters.stringify(params);
      const parsed = JSON.parse(result);

      expect(parsed.name).toBe('test');
      expect(parsed.value).toBe(123);
      expect(parsed.__ow_headers).toEqual({});
    });

    it('should not modify original params object', () => {
      const params = {
        name: 'test',
        __ow_headers: {
          authorization: 'Bearer secret-token',
          'content-type': 'application/json',
        },
      };

      const originalAuth = params.__ow_headers.authorization;
      Parameters.stringify(params);

      // Original object should remain unchanged
      expect(params.__ow_headers.authorization).toBe(originalAuth);
      expect(params.__ow_headers.authorization).toBe('Bearer secret-token');
    });

    it('should handle empty parameters', () => {
      const params = {};
      const result = Parameters.stringify(params);
      const parsed = JSON.parse(result);

      expect(parsed.__ow_headers).toEqual({});
    });
  });
});
