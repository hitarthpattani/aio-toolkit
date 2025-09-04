/**
 * Test for Action types and enums
 * Copyright © Adobe, Inc. All rights reserved.
 */

import { HttpStatus, HttpMethod } from '../../../src/framework/runtime-action/types';

describe('HttpStatus', () => {
  it('should have correct status codes', () => {
    expect(HttpStatus.OK).toBe(200);
    expect(HttpStatus.BAD_REQUEST).toBe(400);
    expect(HttpStatus.UNAUTHORIZED).toBe(401);
    expect(HttpStatus.NOT_FOUND).toBe(404);
    expect(HttpStatus.METHOD_NOT_ALLOWED).toBe(405);
    expect(HttpStatus.INTERNAL_ERROR).toBe(500);
  });

  it('should be an enum object', () => {
    expect(typeof HttpStatus).toBe('object');
    // TypeScript numeric enums have both numeric and string keys
    expect(Object.keys(HttpStatus)).toHaveLength(12); // 6 values * 2 (forward and reverse mapping)
  });
});

describe('HttpMethod', () => {
  it('should have correct HTTP methods', () => {
    expect(HttpMethod.GET).toBe('get');
    expect(HttpMethod.POST).toBe('post');
    expect(HttpMethod.PUT).toBe('put');
    expect(HttpMethod.DELETE).toBe('delete');
    expect(HttpMethod.PATCH).toBe('patch');
    expect(HttpMethod.HEAD).toBe('head');
    expect(HttpMethod.OPTIONS).toBe('options');
  });

  it('should be an enum object', () => {
    expect(typeof HttpMethod).toBe('object');
    // TypeScript string enums only have forward mapping
    expect(Object.keys(HttpMethod)).toHaveLength(7);
  });
});
