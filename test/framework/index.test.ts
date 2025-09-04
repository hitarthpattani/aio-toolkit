/**
 * Test for framework entry point
 * Copyright © Adobe, Inc. All rights reserved.
 */

import * as framework from '../../src/framework';

describe('Framework', () => {
  it('should export RuntimeAction class', () => {
    expect(framework.RuntimeAction).toBeDefined();
    expect(typeof framework.RuntimeAction).toBe('function');
  });

  it('should export RuntimeActionResponse class', () => {
    expect(framework.RuntimeActionResponse).toBeDefined();
    expect(typeof framework.RuntimeActionResponse).toBe('function');
  });

  it('should export Parameters utility', () => {
    expect(framework.Parameters).toBeDefined();
    expect(typeof framework.Parameters).toBe('function');
  });

  it('should export Validator utility', () => {
    expect(framework.Validator).toBeDefined();
    expect(typeof framework.Validator).toBe('function');
  });

  it('should export HttpStatus enum', () => {
    expect(framework.HttpStatus).toBeDefined();
    expect(typeof framework.HttpStatus).toBe('object');
  });

  it('should export HttpMethod enum', () => {
    expect(framework.HttpMethod).toBeDefined();
    expect(typeof framework.HttpMethod).toBe('object');
  });
});
