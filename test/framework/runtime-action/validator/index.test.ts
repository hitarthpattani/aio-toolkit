/**
 * Test for Validator utility class
 * Copyright © Adobe, Inc. All rights reserved.
 */

import Validator from '../../../../src/framework/runtime-action/validator';

describe('Validator', () => {
  describe('getMissingKeys', () => {
    it('should return empty array when no keys are required', () => {
      const obj = { name: 'test' };
      const required: string[] = [];

      const result = Validator.getMissingKeys(obj, required);
      expect(result).toEqual([]);
    });

    it('should return empty array when all required keys are present', () => {
      const obj = { name: 'test', age: 25 };
      const required = ['name', 'age'];

      const result = Validator.getMissingKeys(obj, required);
      expect(result).toEqual([]);
    });

    it('should return missing keys', () => {
      const obj = { name: 'test' };
      const required = ['name', 'age', 'email'];

      const result = Validator.getMissingKeys(obj, required);
      expect(result).toEqual(['age', 'email']);
    });

    it('should handle nested object keys', () => {
      const obj = {
        user: {
          name: 'test',
          profile: { age: 25 },
        },
      };
      const required = ['user.name', 'user.profile.age', 'user.email'];

      const result = Validator.getMissingKeys(obj, required);
      expect(result).toEqual(['user.email']);
    });

    it('should consider empty string as missing', () => {
      const obj = { name: '', age: 25 };
      const required = ['name', 'age'];

      const result = Validator.getMissingKeys(obj, required);
      expect(result).toEqual(['name']);
    });

    it('should consider undefined as missing', () => {
      const obj = { name: 'test', age: undefined };
      const required = ['name', 'age'];

      const result = Validator.getMissingKeys(obj, required);
      expect(result).toEqual(['age']);
    });

    it('should not consider null as missing', () => {
      const obj = { name: 'test', age: null };
      const required = ['name', 'age'];

      const result = Validator.getMissingKeys(obj, required);
      expect(result).toEqual([]);
    });

    it('should not consider 0 as missing', () => {
      const obj = { name: 'test', count: 0 };
      const required = ['name', 'count'];

      const result = Validator.getMissingKeys(obj, required);
      expect(result).toEqual([]);
    });

    it('should handle deep nested missing keys', () => {
      const obj = {
        level1: {
          level2: {},
        },
      };
      const required = ['level1.level2.level3.value'];

      const result = Validator.getMissingKeys(obj, required);
      expect(result).toEqual(['level1.level2.level3.value']);
    });
  });

  describe('checkMissingRequestInputs', () => {
    it('should return null when all required params and headers are present', () => {
      const params = {
        name: 'test',
        age: 25,
        __ow_headers: {
          authorization: 'Bearer token',
          'content-type': 'application/json',
        },
      };
      const requiredParams = ['name', 'age'];
      const requiredHeaders = ['authorization'];

      const result = Validator.checkMissingRequestInputs(params, requiredParams, requiredHeaders);
      expect(result).toBeNull();
    });

    it('should return error message for missing parameters', () => {
      const params = { name: 'test' };
      const requiredParams = ['name', 'age', 'email'];

      const result = Validator.checkMissingRequestInputs(params, requiredParams);
      expect(result).toBe("missing parameter(s) 'age, email'");
    });

    it('should return error message for missing headers', () => {
      const params = {
        name: 'test',
        __ow_headers: {
          'content-type': 'application/json',
        },
      };
      const requiredHeaders = ['authorization', 'x-custom-header'];

      const result = Validator.checkMissingRequestInputs(params, [], requiredHeaders);
      expect(result).toBe("missing header(s) 'authorization, x-custom-header'");
    });

    it('should return error message for both missing parameters and headers', () => {
      const params = {
        name: 'test',
        __ow_headers: {
          'content-type': 'application/json',
        },
      };
      const requiredParams = ['name', 'age'];
      const requiredHeaders = ['authorization'];

      const result = Validator.checkMissingRequestInputs(params, requiredParams, requiredHeaders);
      expect(result).toBe("missing header(s) 'authorization' and missing parameter(s) 'age'");
    });

    it('should handle case-insensitive header comparison', () => {
      const params = {
        name: 'test',
        __ow_headers: {
          Authorization: 'Bearer token',
          'Content-Type': 'application/json',
        },
      };
      const requiredHeaders = ['authorization', 'content-type'];

      const result = Validator.checkMissingRequestInputs(params, [], requiredHeaders);
      expect(result).toBeNull();
    });

    it('should handle params without __ow_headers', () => {
      const params = { name: 'test' };
      const requiredHeaders = ['authorization'];

      const result = Validator.checkMissingRequestInputs(params, [], requiredHeaders);
      expect(result).toBe("missing header(s) 'authorization'");
    });

    it('should handle nested parameter paths', () => {
      const params = {
        user: {
          name: 'test',
        },
      };
      const requiredParams = ['user.name', 'user.email'];

      const result = Validator.checkMissingRequestInputs(params, requiredParams);
      expect(result).toBe("missing parameter(s) 'user.email'");
    });

    it('should handle undefined requiredHeaders parameter (default value)', () => {
      const params = {
        name: 'test',
        age: 25,
        __ow_headers: {
          authorization: 'Bearer token',
        },
      };
      const requiredParams = ['name', 'age'];
      // Test without providing requiredHeaders parameter (should use default [])
      const result = Validator.checkMissingRequestInputs(params, requiredParams);
      expect(result).toBeNull();
    });

    it('should handle only requiredParams without requiredHeaders', () => {
      const params = {
        name: 'test',
      };
      const requiredParams = ['name', 'age'];
      // Call with only requiredParams, no requiredHeaders (tests default parameter)
      const result = Validator.checkMissingRequestInputs(params, requiredParams);
      expect(result).toBe("missing parameter(s) 'age'");
    });

    it('should handle only params parameter (both defaults)', () => {
      const params = {
        name: 'test',
        age: 25,
      };
      // Call with only params - both requiredParams and requiredHeaders should use default []
      const result = Validator.checkMissingRequestInputs(params);
      expect(result).toBeNull();
    });
  });
});
